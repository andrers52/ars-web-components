// Abstract base class for WebGPU-rendered chart web components.
// Extends WebComponentBase for repaint coalescing and array comparison utilities.
// Provides GPU lifecycle management, shared projection uniform, and scaling math.
//
// The first paint() call triggers async GPU initialisation. Subsequent frames
// render synchronously using the cached GPUDevice and ChartGPURenderer.

import type { ChartPadding } from "./chart-types.js";
import { WebComponentBase } from "../web-component-base/web-component-base.js";
import { ChartGPUContext } from "./gpu/chart-gpu-context.js";
import { ChartGPURenderer } from "./gpu/chart-gpu-renderer.js";

// --- Pure utility functions (unchanged from Canvas 2D era) ---

/** Parses a JSON string safely, returning the original value on failure. */
const parseJsonSafely = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

/** Linearly maps a value from [domainMin, domainMax] to [rangeMin, rangeMax]. */
export const mapToRange = (
  value: number,
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number,
): number => {
  if (domainMax === domainMin) return (rangeMin + rangeMax) / 2;
  return rangeMin + ((value - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin);
};

/** Generates an array of evenly spaced tick values between min and max (inclusive). */
export const generateTicks = (min: number, max: number, count: number): number[] => {
  if (count < 2) return [min];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + step * i);
};

/** Formats a number for axis labels (compact, no trailing zeroes). */
export const formatAxisValue = (value: number): string => {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, "");
};

/** Formats a millisecond timestamp as a short date string (MM/DD). */
export const formatDateShort = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

// Default padding for chart plot areas.
const DEFAULT_PADDING: ChartPadding = { top: 12, right: 12, bottom: 28, left: 48 };

// --- ChartBase abstract class ---

abstract class ChartBase extends WebComponentBase {
  // ── GPU state ──────────────────────────────────────────────────────

  /** The GPU renderer shared across frames. Created on first paint. */
  protected gpuRenderer: ChartGPURenderer | null = null;

  /** WebGPU canvas context — configured on first paint. */
  private _gpuCanvasCtx: GPUCanvasContext | null = null;

  /** Externally injected GPUDevice (e.g. from brainiac-engine). */
  private _externalDevice: GPUDevice | null = null;

  /** In-flight GPU init promise (prevents double-init). */
  private _gpuInitPromise: Promise<void> | null = null;

  /** Whether GPU init has completed (for fast sync path). */
  private _gpuReady = false;

  constructor() {
    super();
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
  }

  // --- GPU device injection ---

  /** Inject an external GPUDevice (e.g. from brainiac-engine's presentation layer). */
  set gpuDevice(device: GPUDevice | null) {
    this._externalDevice = device;
    if (device) ChartGPUContext.setDevice(device);
  }

  get gpuDevice(): GPUDevice | null {
    return this._externalDevice;
  }

  // --- Attribute observation ---

  static get observedAttributes(): string[] {
    return ["width", "height"];
  }

  attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string | null): void {
    this.scheduleRepaint();
  }

  connectedCallback(): void {
    this.scheduleRepaint();
  }

  // --- Canvas lifecycle ---

  /** Returns the chart width from the attribute or a sensible default. */
  getChartWidth(): number {
    const attr = this.getAttribute("width");
    return attr ? Number(attr) : 320;
  }

  /** Returns the chart height from the attribute or a sensible default. */
  getChartHeight(): number {
    const attr = this.getAttribute("height");
    return attr ? Number(attr) : 180;
  }

  /** Returns the padding for the plot area. Subclasses may override. */
  getPadding(): ChartPadding {
    return { ...DEFAULT_PADDING };
  }

  /** Subclasses must implement the actual chart rendering here. */
  abstract paint(): void;

  // --- GPU lifecycle ---

  /**
   * Initialise the WebGPU device, canvas context, and renderer.
   * Called automatically on first paint. Safe to call multiple times
   * (returns cached promise on subsequent calls).
   */
  protected async initGPU(): Promise<void> {
    if (this._gpuReady) return;
    if (this._gpuInitPromise) return this._gpuInitPromise;

    this._gpuInitPromise = this._doInitGPU();
    await this._gpuInitPromise;
    this._gpuInitPromise = null;
    this._gpuReady = true;
  }

  private async _doInitGPU(): Promise<void> {
    const device = await ChartGPUContext.getShared();
    const canvas = this._ensureGPUCanvas();
    if (!canvas) throw new Error('ChartBase: cannot create canvas element');

    const ctx = canvas.getContext('webgpu') as GPUCanvasContext | null;
    if (!ctx) throw new Error('ChartBase: cannot obtain WebGPU canvas context');

    const format = navigator.gpu.getPreferredCanvasFormat();
    ctx.configure({ device, format, alphaMode: 'premultiplied' });
    this._gpuCanvasCtx = ctx;

    this.gpuRenderer = ChartGPURenderer.create(device, format);
  }

  /** Get the current frame's texture view for endFrame(). */
  protected getTargetView(): GPUTextureView | null {
    if (!this._gpuCanvasCtx) return null;
    return this._gpuCanvasCtx.getCurrentTexture().createView();
  }

  // --- Canvas element management ---

  /** Creates or retrieves the canvas element inside the shadow root.
   *  Sets width/height attributes to match chart dimensions.
   */
  private _ensureGPUCanvas(): HTMLCanvasElement | null {
    if (!this.shadowRoot) return null;
    let canvas = this.shadowRoot.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) {
      this.shadowRoot.innerHTML = "";
      const style = document.createElement("style");
      style.textContent = `:host { display: inline-block; } canvas { display: block; }`;
      this.shadowRoot.appendChild(style);
      canvas = document.createElement("canvas");
      this.shadowRoot.appendChild(canvas);
    }
    const w = this.getChartWidth();
    const h = this.getChartHeight();
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    return canvas;
  }

  /** Resolves a CSS variable from the host or returns the fallback. */
  protected cssVar(name: string, fallback: string): string {
    const computed = getComputedStyle(this).getPropertyValue(name).trim();
    return computed || fallback;
  }

  // --- GPU drawing utilities ---
  // These are convenience methods that call through to gpuRenderer.
  // They match the conceptual API of the old Canvas 2D helpers but
  // produce GPU draw commands instead.

  /** Push a background rect covering the entire canvas. */
  protected gpuDrawBackground(w: number, h: number, cssColor: string): void {
    this.gpuRenderer!.pushRect(0, 0, w, h, cssColor);
  }

  /** Push horizontal grid lines in the plot area. */
  protected gpuDrawHorizontalGrid(
    padding: ChartPadding,
    plotHeight: number,
    count: number,
    cssColor: string,
    canvasWidth: number,
  ): void {
    const step = plotHeight / (count - 1);
    for (let i = 0; i < count; i++) {
      const y = Math.round(padding.top + i * step) + 0.5;
      this.gpuRenderer!.pushLine(padding.left, y, canvasWidth - padding.right, y, cssColor, 1);
    }
  }

  /** Push Y-axis tick labels (right-aligned to the left padding). */
  protected gpuDrawYAxisLabels(
    padding: ChartPadding,
    ticks: number[],
    plotHeight: number,
    cssColor: string,
    fontSize: number,
  ): void {
    for (let i = 0; i < ticks.length; i++) {
      const y = padding.top + plotHeight - (i / (ticks.length - 1)) * plotHeight;
      this.gpuRenderer!.pushText(
        formatAxisValue(ticks[i]),
        padding.left - 6, y,
        cssColor, fontSize, 'right', 'middle',
      );
    }
  }

  // --- Attribute parsing helper ---

  /** Parses a JSON attribute value, returning the fallback if parsing fails or the value is absent. */
  protected parseJsonAttribute<T>(name: string, fallback: T): T {
    const raw = this.getAttribute(name);
    if (raw === null || raw === "") return fallback;
    const parsed = parseJsonSafely(raw);
    return (parsed !== raw ? parsed : fallback) as T;
  }
}

export { ChartBase as default, ChartBase };
