// <ars-line-chart> — A WebGPU-rendered line chart web component.
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
import { parseCssColor } from "../chart-base/gpu/color-utils.js";

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

/** Padding matching ars-candlestick-chart — used when slot-align="candlestick". */
const CANDLESTICK_PADDING = { top: 12, right: 12, bottom: 32, left: 52 };

class ArsLineChart extends ChartBase {
  // Cached parsed data to avoid re-parsing on every paint.
  #parsedData: number[] = [];
  #parsedMarkers: ChartVerticalMarker[] = [];
  // Optional fixed Y domain [min, max] — overrides auto-scaling.
  #yDomain: [number, number] | null = null;

  static get observedAttributes(): string[] {
    return [
      ...ChartBase.observedAttributes,
      "data",
      "markers",
      "slot-align",
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

  /** Whether to use candlestick-compatible slot-center x positioning. */
  get slotAlign(): boolean {
    return this.getAttribute("slot-align") === "candlestick";
  }

  /** Override padding to match candlestick chart when slot-aligned. */
  getPadding() {
    if (this.slotAlign) {
      return { ...CANDLESTICK_PADDING };
    }
    return super.getPadding();
  }

  // --- Rendering ---

  paint(): void {
    // Async GPU init on first paint — schedule a repaint when ready.
    if (!this.gpuRenderer) {
      this.initGPU()
        .then(() => this.scheduleRepaint())
        .catch((err) => console.error('ArsLineChart: GPU init failed —', err));
      return;
    }

    const renderer = this.gpuRenderer;
    const w = this.getChartWidth();
    const h = this.getChartHeight();
    const padding = this.getPadding();
    const plotWidth = w - padding.left - padding.right;
    const fullPlotHeight = h - padding.top - padding.bottom;
    // When overlaid on a candlestick chart, Y values must map to only the
    // price area (top ~75%), matching the candlestick's layout split:
    // priceHeight = totalPlotHeight - volumeHeight(25%) - separatorGap(4px).
    const plotHeight = this.slotAlign
      ? fullPlotHeight - fullPlotHeight * 0.25 - 4
      : fullPlotHeight;

    // Resolve colors.
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
    const fontSize = 10;

    // Begin GPU frame.
    const clearColor = parseCssColor(bgColor);
    renderer.beginFrame(w, h, clearColor);

    // Background.
    this.gpuDrawBackground(w, h, bgColor);

    if (data.length > 0) {
      // Compute data range.
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

      // Grid lines.
      this.gpuDrawHorizontalGrid(padding, plotHeight, gridLineCount, gridColor, w);

      // Y-axis labels.
      const ticks = generateTicks(dataMin, dataMax, gridLineCount);
      this.gpuDrawYAxisLabels(padding, ticks, plotHeight, axisColor, fontSize);

      // X-position helper. In slot-align mode, use candlestick-compatible
      // slot-center positioning: x = left + (i + 0.5) / N * width.
      // Otherwise use edge-to-edge: x = left + i / (N - 1) * width.
      const useSlotAlign = this.slotAlign && data.length > 1;
      const xPos = (i: number): number => {
        if (data.length === 1) return padding.left + plotWidth / 2;
        if (useSlotAlign) return padding.left + ((i + 0.5) / data.length) * plotWidth;
        return padding.left + (i / (data.length - 1)) * plotWidth;
      };

      // X-axis index labels.
      const maxLabels = Math.min(data.length, 10);
      const step = Math.max(1, Math.floor(data.length / maxLabels));
      for (let i = 0; i < data.length; i += step) {
        renderer.pushText(String(i), xPos(i), h - padding.bottom + 6, axisColor, fontSize, 'center', 'top');
      }

      // Line path — one line segment per pair of adjacent points.
      for (let i = 1; i < data.length; i++) {
        const x0 = xPos(i - 1);
        const y0 = padding.top + plotHeight - mapToRange(data[i - 1], dataMin, dataMax, 0, plotHeight);
        const x1 = xPos(i);
        const y1 = padding.top + plotHeight - mapToRange(data[i], dataMin, dataMax, 0, plotHeight);
        renderer.pushLine(x0, y0, x1, y1, lineColor, 2);
      }

      // Data point dots.
      if (showDots) {
        for (let i = 0; i < data.length; i++) {
          const x = xPos(i);
          const y = padding.top + plotHeight - mapToRange(data[i], dataMin, dataMax, 0, plotHeight);
          renderer.pushCircle(x, y, 3, lineColor);
        }
      }

      // Vertical marker lines.
      if (this.#parsedMarkers.length > 0 && data.length >= 2) {
        const chartTop = padding.top;
        const chartBottom = padding.top + plotHeight;

        for (const marker of this.#parsedMarkers) {
          const x = Math.round(useSlotAlign
            ? xPos(marker.index)
            : padding.left + (marker.index / (data.length - 1)) * plotWidth) + 0.5;
          if (x < padding.left || x > w - padding.right) continue;

          const color = marker.color ?? "rgba(92, 128, 196, 0.6)";
          renderer.pushDashedLine(x, chartTop, x, chartBottom, color, 1, 4, 3);

          if (marker.label) {
            renderer.pushText(marker.label, x, chartTop - 2, color, 9, 'center', 'bottom');
          }
        }
      }
    }

    // Submit frame to GPU.
    const view = this.getTargetView();
    if (view) renderer.endFrame(view);
  }
}

window.customElements.define("ars-line-chart", ArsLineChart);

export { ArsLineChart, ArsLineChart as default };
