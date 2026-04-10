// <ars-candlestick-chart> — A WebGPU-rendered OHLCV candlestick chart web component.
//
// Attributes:
//   data           — JSON CandleDataPoint[] (OHLCV array)
//   orders         — JSON CandleOrder[] (optional buy/sell overlay lines)
//   markers        — JSON ChartVerticalMarker[] (optional vertical marker lines)
//   highlight-range — JSON ChartHighlightRange (optional highlighted candle region)
//   width / height — canvas dimensions (default 460 x 220)
//   up-color       — bullish candle color (default #5ad68a)
//   down-color     — bearish candle color (default #f06b63)
//   background-color — canvas bg (default rgba(8,12,16,0.92))
//   grid-color     — grid lines (default rgba(255,255,255,0.06))
//   axis-color     — axis/label color (default rgba(255,255,255,0.2))
//   volume-opacity — opacity of volume bars (default 0.35)
//   volume-height-ratio — fraction of chart height for volume area (default 0.25)
//   candle-gap     — gap between candles as fraction of slot width (default 0.28)
//   price-tick-count — number of price axis ticks (default 5)
//   date-tick-count  — number of date axis ticks (default 5)
//   order-label-position — "left" | "right" (default "left")

import { ChartBase, mapToRange, generateTicks, formatDateShort } from "../chart-base/chart-base.js";
import type { CandleDataPoint, CandleOrder, ChartPadding, ChartVerticalMarker, ChartHighlightRange } from "../chart-base/chart-types.js";
import { parseCssColor } from "../chart-base/gpu/color-utils.js";

// --- Pure helpers ---

/** Applies opacity to a hex color, returning an rgba CSS string.
 *  Used for volume bars which need the up/down color at reduced opacity. */
const withOpacity = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/** Stride for the flat dataBuffer: open, high, low, close, volume, time. */
const CANDLE_STRIDE = 6;

class ArsCandlestickChart extends ChartBase {
  #parsedData: CandleDataPoint[] = [];
  #parsedOrders: CandleOrder[] = [];
  #parsedMarkers: ChartVerticalMarker[] = [];
  #parsedHighlightRange: ChartHighlightRange | null = null;
  /** Candle index from which order lines start rendering (0 = full width). */
  #orderStartIndex = 0;
  /** Indicator line overlays rendered on the same canvas as candles.
   *  Each entry has a data array and a CSS color. */
  #indicators: { data: number[] | Float64Array; color: string }[] = [];

  // ── Fast-path flat buffers (zero-copy from WASM) ──────────────────
  // When set, these are used instead of the object-based #parsedData/etc.
  // Layout: interleaved [open, high, low, close, volume, time] × N candles.
  #dataBuffer: Float64Array | null = null;
  #dataBufferCount = 0;

  static get observedAttributes(): string[] {
    return [
      ...ChartBase.observedAttributes,
      "data",
      "orders",
      "markers",
      "highlight-range",
      "up-color",
      "down-color",
      "background-color",
      "grid-color",
      "axis-color",
      "volume-opacity",
      "volume-height-ratio",
      "candle-gap",
      "price-tick-count",
      "date-tick-count",
      "order-label-position",
    ];
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "data") {
      this.#parsedData = this.parseJsonAttribute<CandleDataPoint[]>("data", []);
    }
    if (name === "orders") {
      this.#parsedOrders = this.parseJsonAttribute<CandleOrder[]>("orders", []);
    }
    if (name === "markers") {
      this.#parsedMarkers = this.parseJsonAttribute<ChartVerticalMarker[]>("markers", []);
    }
    if (name === "highlight-range") {
      this.#parsedHighlightRange = this.parseJsonAttribute<ChartHighlightRange | null>("highlight-range", null);
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  // --- Property accessors ---

  get data(): CandleDataPoint[] {
    return this.#parsedData;
  }

  set data(value: CandleDataPoint[]) {
    if (this.arraysMatch(value, this.#parsedData, "time")) return;
    this.#parsedData = value;
    this.scheduleRepaint();
  }

  get orders(): CandleOrder[] {
    return this.#parsedOrders;
  }

  set orders(value: CandleOrder[]) {
    if (this.arraysMatch(value, this.#parsedOrders, "price")) return;
    this.#parsedOrders = value;
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

  get highlightRange(): ChartHighlightRange | null {
    return this.#parsedHighlightRange;
  }

  set highlightRange(value: ChartHighlightRange | null) {
    if (
      value?.startIndex === this.#parsedHighlightRange?.startIndex &&
      value?.endIndex === this.#parsedHighlightRange?.endIndex
    ) return;
    this.#parsedHighlightRange = value;
    this.scheduleRepaint();
  }

  /** Candle index from which order lines start rendering.
   *  Orders only exist within a generation — lines should not extend
   *  into previous generations' candle regions. */
  get orderStartIndex(): number {
    return this.#orderStartIndex;
  }

  set orderStartIndex(value: number) {
    if (value === this.#orderStartIndex) return;
    this.#orderStartIndex = value;
    this.scheduleRepaint();
  }

  /** Indicator line overlays rendered on the same canvas.
   *  Each entry: { data: number[] | Float64Array, color: string }. */
  get indicators(): { data: number[] | Float64Array; color: string }[] {
    return this.#indicators;
  }

  set indicators(value: { data: number[] | Float64Array; color: string }[]) {
    this.#indicators = value;
    this.scheduleRepaint();
  }

  /** Flat OHLCV buffer: interleaved [open,high,low,close,volume,time] × N.
   *  When set, takes priority over the object-based `data` property.
   *  Zero-copy fast path from WASM — no JS object allocation per candle. */
  get dataBuffer(): Float64Array | null {
    return this.#dataBuffer;
  }

  set dataBuffer(value: Float64Array | null) {
    this.#dataBuffer = value;
    this.#dataBufferCount = value ? value.length / CANDLE_STRIDE : 0;
    this.scheduleRepaint();
  }

  // --- Overrides ---

  getChartWidth(): number {
    const attr = this.getAttribute("width");
    return attr ? Number(attr) : 460;
  }

  getChartHeight(): number {
    const attr = this.getAttribute("height");
    return attr ? Number(attr) : 220;
  }

  getPadding(): ChartPadding {
    return { top: 12, right: 12, bottom: 32, left: 52 };
  }

  // --- Main paint ---

  paint(): void {
    // Async GPU init on first paint.
    if (!this.gpuRenderer) {
      this.initGPU()
        .then(() => this.scheduleRepaint())
        .catch((err) => console.error('ArsCandlestickChart: GPU init failed —', err));
      return;
    }

    const renderer = this.gpuRenderer;
    const w = this.getChartWidth();
    const h = this.getChartHeight();
    const padding = this.getPadding();

    // Resolve config from attributes / CSS vars.
    const bgColor = this.getAttribute("background-color")
      ?? this.cssVar("--arswc-chart-bg", "rgba(8, 12, 16, 0.92)");
    const upColor = this.getAttribute("up-color")
      ?? this.cssVar("--arswc-chart-up", "#5ad68a");
    const downColor = this.getAttribute("down-color")
      ?? this.cssVar("--arswc-chart-down", "#f06b63");
    const gridColor = this.getAttribute("grid-color")
      ?? this.cssVar("--arswc-chart-grid", "rgba(255, 255, 255, 0.06)");
    const axisColor = this.getAttribute("axis-color")
      ?? this.cssVar("--arswc-chart-axis", "rgba(255, 255, 255, 0.2)");
    const volOpacity = Number(this.getAttribute("volume-opacity") ?? 0.35);
    const volRatio = Number(this.getAttribute("volume-height-ratio") ?? 0.25);
    const candleGap = Number(this.getAttribute("candle-gap") ?? 0.28);
    const priceTickCount = Number(this.getAttribute("price-tick-count") ?? 5);
    const dateTickCount = Number(this.getAttribute("date-tick-count") ?? 5);
    const fontSize = 10;

    const orders = this.#parsedOrders;
    const markers = this.#parsedMarkers;
    const highlightRange = this.#parsedHighlightRange;

    // Flat buffer fast path: read OHLCV directly from Float64Array.
    // Falls back to object array if dataBuffer is not set.
    const buf = this.#dataBuffer;
    const N = buf ? this.#dataBufferCount : this.#parsedData.length;
    const data = this.#parsedData; // fallback for date labels
    const bOpen  = (i: number) => buf ? buf[i * CANDLE_STRIDE]     : data[i].open;
    const bHigh  = (i: number) => buf ? buf[i * CANDLE_STRIDE + 1] : data[i].high;
    const bLow   = (i: number) => buf ? buf[i * CANDLE_STRIDE + 2] : data[i].low;
    const bClose = (i: number) => buf ? buf[i * CANDLE_STRIDE + 3] : data[i].close;
    const bVol   = (i: number) => buf ? buf[i * CANDLE_STRIDE + 4] : data[i].volume;
    const bTime  = (i: number) => buf ? buf[i * CANDLE_STRIDE + 5] : data[i].time;

    // Layout: price area + separator + volume area.
    const totalPlotWidth = w - padding.left - padding.right;
    const totalPlotHeight = h - padding.top - padding.bottom;
    const volumeHeight = totalPlotHeight * volRatio;
    const separatorGap = 4;
    const priceHeight = totalPlotHeight - volumeHeight - separatorGap;

    // Begin GPU frame.
    const clearColor = parseCssColor(bgColor);
    renderer.beginFrame(w, h, clearColor);

    // Background.
    this.gpuDrawBackground(w, h, bgColor);

    if (N > 0) {
      // Price extent with margin — works with both flat buffer and object array.
      let rawPriceMin = bLow(0), rawPriceMax = bHigh(0);
      let vMax = 0;
      for (let i = 0; i < N; i++) {
        const lo = bLow(i), hi = bHigh(i), vol = bVol(i);
        if (lo < rawPriceMin) rawPriceMin = lo;
        if (hi > rawPriceMax) rawPriceMax = hi;
        if (vol > vMax) vMax = vol;
      }
      for (const order of orders) {
        if (order.price < rawPriceMin) rawPriceMin = order.price;
        if (order.price > rawPriceMax) rawPriceMax = order.price;
      }
      const priceMargin = (rawPriceMax - rawPriceMin) * 0.06 || 1;
      const pMin = rawPriceMin - priceMargin;
      const pMax = rawPriceMax + priceMargin;
      vMax = vMax || 1;

      // Grid lines in price area.
      this.gpuDrawHorizontalGrid(padding, priceHeight, priceTickCount, gridColor, w);

      // Y-axis price labels.
      const priceTicks = generateTicks(pMin, pMax, priceTickCount);
      this.gpuDrawYAxisLabels(padding, priceTicks, priceHeight, axisColor, fontSize);

      // Candlestick slot geometry.
      const slotWidth = totalPlotWidth / N;
      const bodyWidth = slotWidth * (1 - candleGap);

      // Highlight range overlay (behind candles).
      if (highlightRange && highlightRange.startIndex < N) {
        const fillColor = highlightRange.fillColor ?? "rgba(80, 140, 220, 0.25)";
        const borderColor = highlightRange.borderColor ?? "rgb(80, 180, 255)";

        const x0 = padding.left + highlightRange.startIndex * slotWidth;
        const x1 = padding.left + (highlightRange.endIndex + 1) * slotWidth;
        const chartTop = padding.top;
        const chartBottom = padding.top + priceHeight + separatorGap + volumeHeight;
        const regionWidth = Math.max(1, x1 - x0);
        const regionHeight = Math.max(1, chartBottom - chartTop);

        renderer.pushRect(x0, chartTop, regionWidth, regionHeight, fillColor);
        renderer.pushLine(x0, chartTop + 0.5, x1, chartTop + 0.5, borderColor, 1);
        renderer.pushLine(x0, chartBottom - 0.5, x1, chartBottom - 0.5, borderColor, 1);
      }

      // Candles: wick (line) + body (rect).
      for (let i = 0; i < N; i++) {
        const open = bOpen(i), high = bHigh(i), low = bLow(i), close = bClose(i);
        const isUp = close >= open;
        const color = isUp ? upColor : downColor;
        const slotX = padding.left + i * slotWidth;
        const centerX = slotX + slotWidth / 2;

        const highY = padding.top + priceHeight - mapToRange(high, pMin, pMax, 0, priceHeight);
        const lowY = padding.top + priceHeight - mapToRange(low, pMin, pMax, 0, priceHeight);
        const openY = padding.top + priceHeight - mapToRange(open, pMin, pMax, 0, priceHeight);
        const closeY = padding.top + priceHeight - mapToRange(close, pMin, pMax, 0, priceHeight);

        renderer.pushLine(centerX, highY, centerX, lowY, color, 1);
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
        renderer.pushRect(centerX - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight, color);
      }

      // Separator line between price and volume.
      const sepY = Math.round(padding.top + priceHeight + separatorGap / 2) + 0.5;
      renderer.pushLine(padding.left, sepY, w - padding.right, sepY, gridColor, 1);

      // Volume bars.
      const volumeTop = padding.top + priceHeight + separatorGap;
      for (let i = 0; i < N; i++) {
        const open = bOpen(i), close = bClose(i), vol = bVol(i);
        const isUp = close >= open;
        const color = isUp ? upColor : downColor;
        const barHeight = (vol / vMax) * volumeHeight;
        const slotX = padding.left + i * slotWidth;
        const centerX = slotX + slotWidth / 2;

        renderer.pushRect(
          centerX - bodyWidth / 2,
          volumeTop + volumeHeight - barHeight,
          bodyWidth,
          barHeight,
          withOpacity(color, volOpacity),
        );
      }

      // X-axis date labels.
      const dateStep = Math.max(1, Math.floor(N / dateTickCount));
      for (let i = 0; i < N; i += dateStep) {
        const x = padding.left + i * slotWidth + slotWidth / 2;
        renderer.pushText(formatDateShort(bTime(i)), x, h - padding.bottom + 6, axisColor, fontSize, 'center', 'top');
      }

      // Vertical marker lines.
      if (markers.length > 0) {
        const chartTop = padding.top;
        const chartBottom = padding.top + priceHeight + separatorGap + volumeHeight;

        for (const marker of markers) {
          const x = Math.round(padding.left + marker.index * slotWidth + slotWidth / 2) + 0.5;
          if (x < padding.left || x > w - padding.right) continue;

          const color = marker.color ?? "rgba(92, 128, 196, 0.6)";
          renderer.pushDashedLine(x, chartTop, x, chartBottom, color, 1, 4, 3);

          if (marker.label) {
            renderer.pushText(marker.label, x, chartTop - 2, color, fontSize, 'center', 'bottom');
          }
        }
      }

      // Order overlay lines — limited to the current generation's region.
      // Orders are per-generation; rendering them across the full chart width
      // would create false overlaps with previous generations' candles.
      if (orders.length > 0) {
        const sellColor = "rgba(255, 170, 70, 0.7)";
        const buyColor = "rgba(90, 160, 255, 0.7)";
        const chartTop = padding.top;
        const chartBottom = padding.top + priceHeight;
        const orderLeft = this.#orderStartIndex > 0
          ? padding.left + this.#orderStartIndex * slotWidth
          : padding.left;

        for (const order of orders) {
          const rawY = Math.round(padding.top + priceHeight - mapToRange(order.price, pMin, pMax, 0, priceHeight)) + 0.5;
          const y = Math.max(chartTop, Math.min(chartBottom, rawY));
          const isBuy = order.side === "buy";
          const color = isBuy ? buyColor : sellColor;

          renderer.pushLine(orderLeft, y, w - padding.right, y, color, 1);
        }
      }

      // Indicator line overlays — rendered on the same canvas using the
      // same price mapping (pMin/pMax/priceHeight) and slot geometry.
      // Each indicator is a { data: number[], color: string } object.
      for (const indicator of this.#indicators) {
        const iData = indicator.data;
        if (iData.length < 2) continue;
        const color = indicator.color;
        for (let i = 1; i < iData.length && i < N; i++) {
          const x0 = padding.left + (i - 1) * slotWidth + slotWidth / 2;
          const y0 = padding.top + priceHeight - mapToRange(iData[i - 1], pMin, pMax, 0, priceHeight);
          const x1 = padding.left + i * slotWidth + slotWidth / 2;
          const y1 = padding.top + priceHeight - mapToRange(iData[i], pMin, pMax, 0, priceHeight);
          renderer.pushLine(x0, y0, x1, y1, color, 2);
        }
      }
    }

    // Submit frame to GPU.
    const view = this.getTargetView();
    if (view) renderer.endFrame(view);
  }
}

window.customElements.define("ars-candlestick-chart", ArsCandlestickChart);

export { ArsCandlestickChart, ArsCandlestickChart as default };
