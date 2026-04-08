// <ars-line-chart> — A canvas-rendered line chart web component.
//
// Attributes:
//   data           — JSON number[] of data points
//   markers        — JSON ChartVerticalMarker[] vertical marker lines (optional)
//   width / height — canvas dimensions (default 320 x 180)
//   line-color     — line & dot color (default from CSS var or #f6c453)
//   background-color — canvas bg  (default from CSS var or rgba(8,12,16,0.9))
//   grid-color     — grid lines   (default from CSS var or rgba(255,255,255,0.08))
//   axis-color     — axis labels  (default from CSS var or rgba(255,255,255,0.5))
//   grid-lines     — number of horizontal grid lines (default 5)
//   show-dots      — whether to draw data-point circles (default true)

import { ChartBase, mapToRange, generateTicks } from "../chart-base/chart-base.js";
import type { ChartVerticalMarker } from "../chart-base/chart-types.js";

// --- Pure rendering helpers ---

/** Computes the min and max of a number array. Returns [0, 0] for empty arrays. */
const dataExtent = (data: number[]): [number, number] => {
  if (data.length === 0) return [0, 0];
  let min = data[0];
  let max = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  return [min, max];
};

class ArsLineChart extends ChartBase {
  // Cached parsed data to avoid re-parsing on every paint.
  #parsedData: number[] = [];
  #parsedMarkers: ChartVerticalMarker[] = [];
  // Optional fixed Y domain [min, max] — overrides auto-scaling.
  // Use this to align multiple overlaid charts to the same Y axis.
  #yDomain: [number, number] | null = null;

  static get observedAttributes(): string[] {
    return [
      ...ChartBase.observedAttributes,
      "data",
      "markers",
      "line-color",
      "background-color",
      "grid-color",
      "axis-color",
      "grid-lines",
      "show-dots",
    ];
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "data") {
      this.#parsedData = this.parseJsonAttribute<number[]>("data", []);
    } else if (name === "markers") {
      this.#parsedMarkers = this.parseJsonAttribute<ChartVerticalMarker[]>("markers", []);
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  // --- Property accessors for programmatic use ---

  get data(): number[] {
    return this.#parsedData;
  }

  set data(value: number[]) {
    if (this.arraysMatch(value, this.#parsedData)) return;
    this.#parsedData = value;
    this.scheduleRepaint();
  }

  get markers(): ChartVerticalMarker[] {
    return this.#parsedMarkers;
  }

  set markers(value: ChartVerticalMarker[]) {
    if (this.arraysMatch(value, this.#parsedMarkers, "index")) return;
    this.#parsedMarkers = value;
    this.scheduleRepaint();
  }

  /** Fixed Y domain [min, max] for aligning overlaid charts to the same scale. */
  get yDomain(): [number, number] | null {
    return this.#yDomain;
  }

  set yDomain(value: [number, number] | null) {
    if (value?.[0] === this.#yDomain?.[0] && value?.[1] === this.#yDomain?.[1]) return;
    this.#yDomain = value;
    this.scheduleRepaint();
  }

  // --- Rendering ---

  paint(): void {
    const canvas = this.ensureCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = this.getChartWidth();
    const h = this.getChartHeight();
    const padding = this.getPadding();
    const plotWidth = w - padding.left - padding.right;
    const plotHeight = h - padding.top - padding.bottom;

    // Resolve colors
    const bgColor = this.getAttribute("background-color")
      ?? this.cssVar("--arswc-chart-bg", "rgba(8, 12, 16, 0.9)");
    const lineColor = this.getAttribute("line-color")
      ?? this.cssVar("--arswc-chart-line", "#f6c453");
    const gridColor = this.getAttribute("grid-color")
      ?? this.cssVar("--arswc-chart-grid", "rgba(255, 255, 255, 0.08)");
    const axisColor = this.getAttribute("axis-color")
      ?? this.cssVar("--arswc-chart-axis", "rgba(255, 255, 255, 0.5)");
    const gridLineCount = Number(this.getAttribute("grid-lines") ?? 5);
    const showDots = this.getAttribute("show-dots") !== "false";

    const data = this.#parsedData;
    const font = `10px ${this.cssVar("--arswc-font-family-mono", "monospace")}`;

    // Background
    this.drawBackground(ctx, w, h, bgColor);

    if (data.length === 0) return;

    // Compute data range: use fixed yDomain if set, otherwise auto-scale.
    let dataMin: number, dataMax: number;
    if (this.#yDomain) {
      dataMin = this.#yDomain[0];
      dataMax = this.#yDomain[1];
    } else {
      const [rawMin, rawMax] = dataExtent(data);
      const margin = (rawMax - rawMin) * 0.08 || 1;
      dataMin = rawMin - margin;
      dataMax = rawMax + margin;
    }

    // Grid
    this.drawHorizontalGrid(ctx, padding, plotHeight, gridLineCount, gridColor);

    // Y-axis labels
    const ticks = generateTicks(dataMin, dataMax, gridLineCount);
    this.drawYAxisLabels(ctx, padding, ticks, plotHeight, axisColor, font);

    // X-axis index labels
    ArsLineChart.#drawXAxisLabels(ctx, data, padding, plotWidth, h, axisColor, font);

    // Line path
    ArsLineChart.#drawLinePath(ctx, data, padding, plotWidth, plotHeight, dataMin, dataMax, lineColor);

    // Data point dots
    if (showDots) {
      ArsLineChart.#drawDots(ctx, data, padding, plotWidth, plotHeight, dataMin, dataMax, lineColor);
    }

    // Vertical marker lines (generation boundaries, etc.)
    if (this.#parsedMarkers.length > 0) {
      ArsLineChart.#drawMarkers(ctx, this.#parsedMarkers, data.length, padding, plotWidth, plotHeight);
    }
  }

  // --- Static private rendering helpers ---

  /** Draws X-axis index labels below the plot area. */
  static #drawXAxisLabels(
    ctx: CanvasRenderingContext2D,
    data: number[],
    padding: { left: number; right: number; bottom: number; top: number },
    plotWidth: number,
    canvasHeight: number,
    color: string,
    font: string,
  ): void {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const maxLabels = Math.min(data.length, 10);
    const step = Math.max(1, Math.floor(data.length / maxLabels));
    for (let i = 0; i < data.length; i += step) {
      const x = padding.left + (data.length === 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth);
      ctx.fillText(String(i), x, canvasHeight - padding.bottom + 6);
    }
  }

  /** Draws the continuous line path connecting data points. */
  static #drawLinePath(
    ctx: CanvasRenderingContext2D,
    data: number[],
    padding: { left: number; top: number },
    plotWidth: number,
    plotHeight: number,
    dataMin: number,
    dataMax: number,
    color: string,
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = padding.left + (data.length === 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth);
      const y = padding.top + plotHeight - mapToRange(data[i], dataMin, dataMax, 0, plotHeight);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  /** Draws small circles at each data point. */
  static #drawDots(
    ctx: CanvasRenderingContext2D,
    data: number[],
    padding: { left: number; top: number },
    plotWidth: number,
    plotHeight: number,
    dataMin: number,
    dataMax: number,
    color: string,
  ): void {
    ctx.fillStyle = color;
    const radius = 3;
    for (let i = 0; i < data.length; i++) {
      const x = padding.left + (data.length === 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth);
      const y = padding.top + plotHeight - mapToRange(data[i], dataMin, dataMax, 0, plotHeight);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  /** Draws vertical marker lines spanning the full plot area.
   *
   * Markers use data-point indices (0-based). Each marker is drawn as a
   * dashed vertical line with an optional label, matching the style used
   * by `<ars-candlestick-chart>` for generation boundaries.
   */
  static #drawMarkers(
    ctx: CanvasRenderingContext2D,
    markers: ChartVerticalMarker[],
    dataLen: number,
    padding: { left: number; right: number; top: number; bottom: number },
    plotWidth: number,
    plotHeight: number,
  ): void {
    if (dataLen < 2) return;
    const chartTop = padding.top;
    const chartBottom = padding.top + plotHeight;

    for (const marker of markers) {
      const x = Math.round(padding.left + (marker.index / (dataLen - 1)) * plotWidth) + 0.5;
      if (x < padding.left || x > ctx.canvas.width - padding.right) continue;

      const color = marker.color ?? "rgba(92, 128, 196, 0.6)";

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x, chartTop);
      ctx.lineTo(x, chartBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      if (marker.label) {
        ctx.fillStyle = color;
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(marker.label, x, chartTop - 2);
      }
    }
  }
}

window.customElements.define("ars-line-chart", ArsLineChart);

export { ArsLineChart, ArsLineChart as default };
