// <ars-candlestick-chart> — A canvas-rendered OHLCV candlestick chart web component.
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

import { ChartBase, mapToRange, generateTicks, formatAxisValue, formatDateShort } from "../chart-base/chart-base.js";
import type { CandleDataPoint, CandleOrder, ChartPadding, ChartVerticalMarker, ChartHighlightRange } from "../chart-base/chart-types.js";

// --- Pure helpers ---

/** Computes the price extent (min low, max high) across all candles and orders.
 *
 * Including order prices ensures overlay lines are always within the visible
 * chart area. Without this, sell orders above the highest candle high or buy
 * orders below the lowest candle low would be drawn outside the chart bounds.
 */
const priceExtent = (data: CandleDataPoint[], orders: CandleOrder[] = []): [number, number] => {
  if (data.length === 0) return [0, 0];
  let min = data[0].low;
  let max = data[0].high;
  for (let i = 1; i < data.length; i++) {
    if (data[i].low < min) min = data[i].low;
    if (data[i].high > max) max = data[i].high;
  }
  // Expand extent to include order price levels.
  for (const order of orders) {
    if (order.price < min) min = order.price;
    if (order.price > max) max = order.price;
  }
  return [min, max];
};

/** Computes max volume for scaling. */
const maxVolume = (data: CandleDataPoint[]): number => {
  let max = 0;
  for (const d of data) {
    if (d.volume > max) max = d.volume;
  }
  return max;
};

/** Applies opacity to a hex color, returning an rgba string. */
const withOpacity = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

class ArsCandlestickChart extends ChartBase {
  #parsedData: CandleDataPoint[] = [];
  #parsedOrders: CandleOrder[] = [];
  #parsedMarkers: ChartVerticalMarker[] = [];
  #parsedHighlightRange: ChartHighlightRange | null = null;

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
    return [...this.#parsedData];
  }

  set data(value: CandleDataPoint[]) {
    this.#parsedData = [...value];
    this.scheduleRepaint();
  }

  get orders(): CandleOrder[] {
    return [...this.#parsedOrders];
  }

  set orders(value: CandleOrder[]) {
    this.#parsedOrders = [...value];
    this.scheduleRepaint();
  }

  get markers(): ChartVerticalMarker[] {
    return [...this.#parsedMarkers];
  }

  set markers(value: ChartVerticalMarker[]) {
    this.#parsedMarkers = [...value];
    this.scheduleRepaint();
  }

  get highlightRange(): ChartHighlightRange | null {
    return this.#parsedHighlightRange ? { ...this.#parsedHighlightRange } : null;
  }

  set highlightRange(value: ChartHighlightRange | null) {
    this.#parsedHighlightRange = value ? { ...value } : null;
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
    const canvas = this.ensureCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = this.getChartWidth();
    const h = this.getChartHeight();
    const padding = this.getPadding();

    // Resolve config from attributes / CSS vars
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
    const orderLabelPos = (this.getAttribute("order-label-position") ?? "left") as "left" | "right";
    const font = `10px ${this.cssVar("--arswc-font-family-mono", "monospace")}`;

    const data = this.#parsedData;
    const orders = this.#parsedOrders;
    const markers = this.#parsedMarkers;
    const highlightRange = this.#parsedHighlightRange;

    // Layout: price area + separator + volume area
    const totalPlotWidth = w - padding.left - padding.right;
    const totalPlotHeight = h - padding.top - padding.bottom;
    const volumeHeight = totalPlotHeight * volRatio;
    const separatorGap = 4;
    const priceHeight = totalPlotHeight - volumeHeight - separatorGap;

    // Background
    this.drawBackground(ctx, w, h, bgColor);

    if (data.length === 0) return;

    // Price extent with small margin — includes order prices so
    // overlay lines never clip outside the visible chart area.
    const [rawPriceMin, rawPriceMax] = priceExtent(data, orders);
    const priceMargin = (rawPriceMax - rawPriceMin) * 0.06 || 1;
    const pMin = rawPriceMin - priceMargin;
    const pMax = rawPriceMax + priceMargin;
    const vMax = maxVolume(data) || 1;

    // Grid lines in price area
    this.drawHorizontalGrid(ctx, padding, priceHeight, priceTickCount, gridColor);

    // Y-axis price labels
    const priceTicks = generateTicks(pMin, pMax, priceTickCount);
    this.drawYAxisLabels(ctx, padding, priceTicks, priceHeight, axisColor, font);

    // Candlestick slot geometry
    const slotWidth = totalPlotWidth / data.length;
    const bodyWidth = slotWidth * (1 - candleGap);

    // Highlight range overlay (e.g. visible trading window) — rendered
    // behind candles so the semi-transparent fill doesn't obscure them.
    if (highlightRange && highlightRange.startIndex < data.length) {
      ArsCandlestickChart.#drawHighlightRange(
        ctx, highlightRange, padding, slotWidth, priceHeight, volumeHeight, separatorGap,
      );
    }

    // Draw candles + wicks
    ArsCandlestickChart.#drawCandles(
      ctx, data, padding, slotWidth, bodyWidth, priceHeight, pMin, pMax, upColor, downColor,
    );

    // Separator line between price and volume
    const sepY = Math.round(padding.top + priceHeight + separatorGap / 2) + 0.5;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, sepY);
    ctx.lineTo(w - padding.right, sepY);
    ctx.stroke();

    // Volume bars
    const volumeTop = padding.top + priceHeight + separatorGap;
    ArsCandlestickChart.#drawVolumeBars(
      ctx, data, padding, slotWidth, bodyWidth, volumeTop, volumeHeight, vMax, upColor, downColor, volOpacity,
    );

    // X-axis date labels
    ArsCandlestickChart.#drawDateLabels(ctx, data, padding, slotWidth, h, dateTickCount, axisColor, font);

    // Vertical marker lines (generation boundaries, current timestamp, etc.)
    if (markers.length > 0) {
      ArsCandlestickChart.#drawMarkers(ctx, markers, padding, slotWidth, priceHeight, volumeHeight, separatorGap, axisColor, font);
    }

    // Order overlay lines
    if (orders.length > 0) {
      ArsCandlestickChart.#drawOrders(
        ctx, orders, padding, w, priceHeight, pMin, pMax, upColor, downColor, axisColor, font, orderLabelPos,
      );
    }
  }

  // --- Static private rendering helpers ---

  /** Draws candlestick bodies and wicks. */
  static #drawCandles(
    ctx: CanvasRenderingContext2D,
    data: CandleDataPoint[],
    padding: ChartPadding,
    slotWidth: number,
    bodyWidth: number,
    priceHeight: number,
    pMin: number,
    pMax: number,
    upColor: string,
    downColor: string,
  ): void {
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const isUp = d.close >= d.open;
      const color = isUp ? upColor : downColor;
      const slotX = padding.left + i * slotWidth;
      const centerX = slotX + slotWidth / 2;

      // Map prices to Y (inverted — max at top)
      const highY = padding.top + priceHeight - mapToRange(d.high, pMin, pMax, 0, priceHeight);
      const lowY = padding.top + priceHeight - mapToRange(d.low, pMin, pMax, 0, priceHeight);
      const openY = padding.top + priceHeight - mapToRange(d.open, pMin, pMax, 0, priceHeight);
      const closeY = padding.top + priceHeight - mapToRange(d.close, pMin, pMax, 0, priceHeight);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, highY);
      ctx.lineTo(centerX, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
      ctx.fillStyle = color;
      ctx.fillRect(centerX - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
    }
  }

  /** Draws semi-transparent volume bars below the separator. */
  static #drawVolumeBars(
    ctx: CanvasRenderingContext2D,
    data: CandleDataPoint[],
    padding: ChartPadding,
    slotWidth: number,
    bodyWidth: number,
    volumeTop: number,
    volumeHeight: number,
    vMax: number,
    upColor: string,
    downColor: string,
    opacity: number,
  ): void {
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const isUp = d.close >= d.open;
      const color = isUp ? upColor : downColor;
      const barHeight = (d.volume / vMax) * volumeHeight;
      const slotX = padding.left + i * slotWidth;
      const centerX = slotX + slotWidth / 2;

      ctx.fillStyle = withOpacity(color, opacity);
      ctx.fillRect(centerX - bodyWidth / 2, volumeTop + volumeHeight - barHeight, bodyWidth, barHeight);
    }
  }

  /** Draws date labels on the X-axis. */
  static #drawDateLabels(
    ctx: CanvasRenderingContext2D,
    data: CandleDataPoint[],
    padding: ChartPadding,
    slotWidth: number,
    canvasHeight: number,
    tickCount: number,
    color: string,
    font: string,
  ): void {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const step = Math.max(1, Math.floor(data.length / tickCount));
    for (let i = 0; i < data.length; i += step) {
      const x = padding.left + i * slotWidth + slotWidth / 2;
      ctx.fillText(formatDateShort(data[i].time), x, canvasHeight - padding.bottom + 6);
    }
  }

  /** Draws a semi-transparent highlighted region over a candle index range.
   *
   * Used to visualize the "visible trading window" — the subset of candles
   * whose indicators the bots can observe. Renders as a translucent overlay
   * with top/bottom border lines, matching the pygame visualizer's style.
   *
   * Reference: Tufte, E., "The Visual Display of Quantitative Information"
   * (1983) — background shading for region-of-interest highlighting.
   */
  static #drawHighlightRange(
    ctx: CanvasRenderingContext2D,
    range: ChartHighlightRange,
    padding: ChartPadding,
    slotWidth: number,
    priceHeight: number,
    volumeHeight: number,
    separatorGap: number,
  ): void {
    const fillColor = range.fillColor ?? "rgba(80, 140, 220, 0.25)";
    const borderColor = range.borderColor ?? "rgb(80, 180, 255)";

    const x0 = padding.left + range.startIndex * slotWidth;
    const x1 = padding.left + (range.endIndex + 1) * slotWidth;
    const chartTop = padding.top;
    const chartBottom = padding.top + priceHeight + separatorGap + volumeHeight;
    const regionWidth = Math.max(1, x1 - x0);
    const regionHeight = Math.max(1, chartBottom - chartTop);

    // Semi-transparent fill.
    ctx.fillStyle = fillColor;
    ctx.fillRect(x0, chartTop, regionWidth, regionHeight);

    // Top and bottom border lines.
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, chartTop + 0.5);
    ctx.lineTo(x1, chartTop + 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, chartBottom - 0.5);
    ctx.lineTo(x1, chartBottom - 0.5);
    ctx.stroke();
  }

  /** Draws vertical marker lines spanning the full chart area.
   *
   * Used for generation boundaries, current timestamp markers, etc.
   * Each marker can specify its own color and optional label.
   */
  static #drawMarkers(
    ctx: CanvasRenderingContext2D,
    markers: ChartVerticalMarker[],
    padding: ChartPadding,
    slotWidth: number,
    priceHeight: number,
    volumeHeight: number,
    separatorGap: number,
    axisColor: string,
    font: string,
  ): void {
    const chartTop = padding.top;
    const chartBottom = padding.top + priceHeight + separatorGap + volumeHeight;

    for (const marker of markers) {
      const x = Math.round(padding.left + marker.index * slotWidth + slotWidth / 2) + 0.5;
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

      // Optional label at the top of the marker line.
      if (marker.label) {
        ctx.fillStyle = color;
        ctx.font = font;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(marker.label, x, chartTop - 2);
      }
    }
  }

  /** Draws horizontal order overlay lines.
   *
   * Sell orders render as solid orange/red lines, buy orders as blue/green
   * lines spanning the full price area. Matching the pygame visualizer's
   * clean horizontal-bar approach rather than cluttered per-order labels.
   */
  static #drawOrders(
    ctx: CanvasRenderingContext2D,
    orders: CandleOrder[],
    padding: ChartPadding,
    canvasWidth: number,
    priceHeight: number,
    pMin: number,
    pMax: number,
    _upColor: string,
    downColor: string,
    _axisColor: string,
    _font: string,
    _labelPosition: "left" | "right",
  ): void {
    // Sell orders: orange, buy orders: blue (matching pygame convention).
    const sellColor = "rgba(255, 170, 70, 0.7)";
    const buyColor = "rgba(90, 160, 255, 0.7)";

    const chartTop = padding.top;
    const chartBottom = padding.top + priceHeight;

    for (const order of orders) {
      const rawY = Math.round(padding.top + priceHeight - mapToRange(order.price, pMin, pMax, 0, priceHeight)) + 0.5;
      // Clamp to visible price area so lines never draw outside chart bounds.
      const y = Math.max(chartTop, Math.min(chartBottom, rawY));
      const isBuy = order.side === "buy";
      const color = isBuy ? buyColor : sellColor;

      // Solid line spanning the full price area.
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(canvasWidth - padding.right, y);
      ctx.stroke();
    }
  }
}

window.customElements.define("ars-candlestick-chart", ArsCandlestickChart);

export { ArsCandlestickChart, ArsCandlestickChart as default };
