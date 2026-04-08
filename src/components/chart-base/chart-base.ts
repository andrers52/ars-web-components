// Abstract base class for canvas-rendered chart web components.
// Extends WebComponentBase for repaint coalescing and array comparison utilities.
// Provides shared canvas lifecycle, axis/grid drawing utilities, and scaling math.

import type { ChartPadding } from "./chart-types.js";
import { WebComponentBase } from "../web-component-base/web-component-base.js";

// --- Pure utility functions ---

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
  constructor() {
    super();
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
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

  // --- Canvas helpers ---

  /** Creates or retrieves the canvas element inside the shadow root. */
  protected ensureCanvas(): HTMLCanvasElement | null {
    if (!this.shadowRoot) return null;
    let canvas = this.shadowRoot.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) {
      // Clear shadow root and rebuild
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

  // --- Grid and axis drawing utilities ---

  /** Fills the entire canvas with a background color. */
  protected drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
    // Always clear the canvas first to remove previous frame's pixels.
    // This is critical for transparent overlays (e.g. indicator lines
    // stacked on top of a candlestick chart).
    ctx.clearRect(0, 0, w, h);
    if (color !== "transparent") {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
    }
  }

  /** Draws horizontal grid lines in the plot area. */
  protected drawHorizontalGrid(
    ctx: CanvasRenderingContext2D,
    padding: ChartPadding,
    plotHeight: number,
    count: number,
    color: string,
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const step = plotHeight / (count - 1);
    for (let i = 0; i < count; i++) {
      const y = Math.round(padding.top + i * step) + 0.5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(ctx.canvas.width - padding.right, y);
      ctx.stroke();
    }
  }

  /** Draws Y-axis tick labels (right-aligned to the left padding). */
  protected drawYAxisLabels(
    ctx: CanvasRenderingContext2D,
    padding: ChartPadding,
    ticks: number[],
    plotHeight: number,
    color: string,
    font: string,
  ): void {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i < ticks.length; i++) {
      // Ticks are ordered min→max, but Y-axis is inverted (max at top).
      const y = padding.top + plotHeight - (i / (ticks.length - 1)) * plotHeight;
      ctx.fillText(formatAxisValue(ticks[i]), padding.left - 6, y);
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
