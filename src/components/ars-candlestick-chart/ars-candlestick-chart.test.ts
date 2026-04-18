/**
 * Tests for ArsCandlestickChart web component (WebGPU rendering).
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArsCandlestickChart } from "./ars-candlestick-chart.js";
import type { CandleDataPoint, CandleOrder, ChartVerticalMarker, ChartHighlightRange } from "../chart-base/chart-types.js";

// Helper to create synthetic candle data.
const makeCandleData = (count = 5): CandleDataPoint[] => {
  const base = Date.now();
  const day = 24 * 60 * 60 * 1000;
  let price = 100;
  return Array.from({ length: count }, (_, i) => {
    const step = (i % 2 === 0 ? 3 : -2);
    const open = price;
    const close = price + step;
    const high = Math.max(open, close) + 2;
    const low = Math.min(open, close) - 2;
    const volume = 100 + i * 20;
    price = close;
    return { open, high, low, close, volume, time: base + i * day };
  });
};

const makeOrders = (): CandleOrder[] => [
  { side: "buy", amount: 10.5, price: 98 },
  { side: "sell", amount: 5.2, price: 108 },
];

const makeMarkers = (): ChartVerticalMarker[] => [
  { index: 2, color: "rgba(92, 128, 196, 0.6)", label: "GEN" },
  { index: 4 },
];

describe("ArsCandlestickChart", () => {
  let element: ArsCandlestickChart;

  beforeEach(() => {
    element = new ArsCandlestickChart();
  });

  // --- Registration ---

  it("registers the custom element", () => {
    expect(customElements.get("ars-candlestick-chart")).toBe(ArsCandlestickChart);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  // --- Default dimensions ---

  it("has default width of 460", () => {
    expect(element.getChartWidth()).toBe(460);
  });

  it("has default height of 220", () => {
    expect(element.getChartHeight()).toBe(220);
  });

  it("reads width and height from attributes", () => {
    element.setAttribute("width", "600");
    element.setAttribute("height", "300");
    expect(element.getChartWidth()).toBe(600);
    expect(element.getChartHeight()).toBe(300);
  });

  // --- Data attribute ---

  it("parses data from JSON attribute", () => {
    const data = makeCandleData(3);
    element.setAttribute("data", JSON.stringify(data));
    expect(element.data).toEqual(data);
  });

  it("returns empty array for absent data attribute", () => {
    expect(element.data).toEqual([]);
  });

  it("returns empty array for invalid JSON data attribute", () => {
    element.setAttribute("data", "not-json");
    expect(element.data).toEqual([]);
  });

  it("data property setter updates internal state", () => {
    const data = makeCandleData(4);
    element.data = data;
    expect(element.data).toEqual(data);
  });

  it("data property returns the internal reference (zero-copy)", () => {
    const data = makeCandleData(2);
    element.data = data;
    expect(element.data).toBe(data);
  });

  // --- Orders attribute ---

  it("parses orders from JSON attribute", () => {
    const orders = makeOrders();
    element.setAttribute("orders", JSON.stringify(orders));
    expect(element.orders).toEqual(orders);
  });

  it("returns empty array for absent orders attribute", () => {
    expect(element.orders).toEqual([]);
  });

  it("orders property setter updates internal state", () => {
    const orders = makeOrders();
    element.orders = orders;
    expect(element.orders).toEqual(orders);
  });

  it("orders property returns the internal reference (zero-copy)", () => {
    const orders = makeOrders();
    element.orders = orders;
    expect(element.orders).toBe(orders);
  });

  // --- Observed attributes ---

  it("observes all expected attributes", () => {
    const observed = ArsCandlestickChart.observedAttributes;
    expect(observed).toContain("data");
    expect(observed).toContain("orders");
    expect(observed).toContain("width");
    expect(observed).toContain("height");
    expect(observed).toContain("up-color");
    expect(observed).toContain("down-color");
    expect(observed).toContain("background-color");
    expect(observed).toContain("grid-color");
    expect(observed).toContain("axis-color");
    expect(observed).toContain("volume-opacity");
    expect(observed).toContain("volume-height-ratio");
    expect(observed).toContain("candle-gap");
    expect(observed).toContain("price-tick-count");
    expect(observed).toContain("date-tick-count");
    expect(observed).toContain("order-label-position");
  });

  // --- Padding override ---

  it("uses candlestick-specific padding with wider left for price labels", () => {
    const p = element.getPadding();
    expect(p.left).toBeGreaterThanOrEqual(48);
    expect(p.bottom).toBeGreaterThanOrEqual(28);
  });

  // --- GPU rendering ---

  it("paint runs without error on empty data (triggers GPU init)", () => {
    expect(() => element.paint()).not.toThrow();
  });

  it("paint runs without error on valid data (triggers GPU init)", () => {
    element.data = makeCandleData(10);
    expect(() => element.paint()).not.toThrow();
  });

  it("paint with GPU renderer pushes candle geometry", async () => {
    document.body.appendChild(element);
    await element.initGPU();

    element.data = makeCandleData(3);
    const renderer = element.gpuRenderer!;
    const pushRectSpy = vi.spyOn(renderer, 'pushRect');
    const pushLineSpy = vi.spyOn(renderer, 'pushLine');
    const pushTextSpy = vi.spyOn(renderer, 'pushText');

    element.paint();

    // Background (1) + candle bodies (3) + volume bars (3) = 7 rects minimum.
    expect(pushRectSpy.mock.calls.length).toBeGreaterThanOrEqual(7);
    // Wicks (3) + grid lines (5) + separator (1) = 9 lines minimum.
    expect(pushLineSpy.mock.calls.length).toBeGreaterThanOrEqual(9);
    // Y-axis labels + date labels.
    expect(pushTextSpy).toHaveBeenCalled();

    document.body.removeChild(element);
  });

  it("paint draws order overlay lines", async () => {
    document.body.appendChild(element);
    await element.initGPU();

    element.data = makeCandleData(5);
    element.orders = makeOrders();
    const pushLineSpy = vi.spyOn(element.gpuRenderer!, 'pushLine');

    element.paint();

    // At least 2 order overlay lines (buy + sell).
    const lineCount = pushLineSpy.mock.calls.length;
    expect(lineCount).toBeGreaterThanOrEqual(2);

    document.body.removeChild(element);
  });

  it("paint handles orders with prices outside candle range", async () => {
    document.body.appendChild(element);
    await element.initGPU();

    element.data = makeCandleData(3);
    element.orders = [
      { side: "buy", amount: 1, price: 50 },
      { side: "sell", amount: 1, price: 200 },
    ];
    expect(() => element.paint()).not.toThrow();

    document.body.removeChild(element);
  });

  /**
   * An OCO position surfaces as two chart entries from the Rust
   * viz-subscriber: one `side: "sell"` (TP leg) and one
   * `side: "stop_loss"` (SL leg) sharing the same `order_id`.  The
   * renderer must draw each as a distinguishable horizontal line —
   * specifically, the SL line must be red to separate it visually
   * from the TP (orange).  This test inspects the color argument
   * of `pushLine` for each order entry to lock that contract.
   *
   * Without this assertion a future refactor could silently drop
   * the SL branch or reuse the sell color, making OCO positions
   * look identical to bare limit sells on the chart — the bug
   * this whole wiring exists to prevent.
   */
  it("paint draws stop_loss orders in a distinct color from sell orders", async () => {
    document.body.appendChild(element);
    await element.initGPU();

    element.data = makeCandleData(5);
    element.orders = [
      { side: "sell", amount: 1, price: 108 },      // TP leg
      { side: "stop_loss", amount: 1, price: 94 },  // SL leg
      { side: "buy", amount: 1, price: 98 },
    ];
    const pushLineSpy = vi.spyOn(element.gpuRenderer!, 'pushLine');
    element.paint();

    // Collect the color strings from every pushLine call — these
    // are passed as the 5th positional argument in the signature
    // `pushLine(x0, y0, x1, y1, color, width)`.
    const colors = pushLineSpy.mock.calls.map(c => c[4] as string);

    // Must contain the red SL color.
    expect(
      colors.some(c => c === "rgba(230, 70, 70, 0.75)"),
      `expected at least one SL line in red; got colors: ${JSON.stringify(colors)}`
    ).toBe(true);

    // Must contain the orange TP color.
    expect(
      colors.some(c => c === "rgba(255, 170, 70, 0.7)"),
      "expected at least one TP line in orange"
    ).toBe(true);

    // SL color must never collide with the TP color — otherwise
    // the distinction is invisible on screen.
    expect("rgba(230, 70, 70, 0.75)").not.toBe("rgba(255, 170, 70, 0.7)");

    document.body.removeChild(element);
  });

  it("paint uses custom up/down colors from attributes", async () => {
    document.body.appendChild(element);
    await element.initGPU();

    element.setAttribute("up-color", "#00ff00");
    element.setAttribute("down-color", "#ff0000");
    element.data = makeCandleData(4);
    expect(() => element.paint()).not.toThrow();

    document.body.removeChild(element);
  });

  it("handles data with all bullish candles", async () => {
    document.body.appendChild(element);
    await element.initGPU();

    const data: CandleDataPoint[] = [
      { open: 10, close: 12, high: 13, low: 9, volume: 100, time: Date.now() },
      { open: 12, close: 14, high: 15, low: 11, volume: 120, time: Date.now() + 86400000 },
    ];
    element.data = data;
    expect(() => element.paint()).not.toThrow();

    document.body.removeChild(element);
  });

  it("handles data with all bearish candles", async () => {
    document.body.appendChild(element);
    await element.initGPU();

    const data: CandleDataPoint[] = [
      { open: 14, close: 12, high: 15, low: 11, volume: 100, time: Date.now() },
      { open: 12, close: 10, high: 13, low: 9, volume: 120, time: Date.now() + 86400000 },
    ];
    element.data = data;
    expect(() => element.paint()).not.toThrow();

    document.body.removeChild(element);
  });

  it("handles single candle data point", async () => {
    document.body.appendChild(element);
    await element.initGPU();
    element.data = makeCandleData(1);
    expect(() => element.paint()).not.toThrow();
    document.body.removeChild(element);
  });

  it("handles zero volume data", async () => {
    document.body.appendChild(element);
    await element.initGPU();
    element.data = [{ open: 10, close: 12, high: 13, low: 9, volume: 0, time: Date.now() }];
    expect(() => element.paint()).not.toThrow();
    document.body.removeChild(element);
  });

  // --- Markers ---

  it("observes the markers attribute", () => {
    expect(ArsCandlestickChart.observedAttributes).toContain("markers");
  });

  it("parses markers from JSON attribute", () => {
    const markers = makeMarkers();
    element.setAttribute("markers", JSON.stringify(markers));
    expect(element.markers).toEqual(markers);
  });

  it("returns empty array for absent markers attribute", () => {
    expect(element.markers).toEqual([]);
  });

  it("markers property setter updates internal state", () => {
    const markers = makeMarkers();
    element.markers = markers;
    expect(element.markers).toEqual(markers);
  });

  it("markers property returns the internal reference (zero-copy)", () => {
    const markers = makeMarkers();
    element.markers = markers;
    expect(element.markers).toBe(markers);
  });

  it("scheduleRepaint is called when markers property is set", () => {
    const spy = vi.spyOn(element, "scheduleRepaint");
    element.markers = makeMarkers();
    expect(spy).toHaveBeenCalled();
  });

  it("paint draws dashed marker lines", async () => {
    document.body.appendChild(element);
    await element.initGPU();

    element.data = makeCandleData(5);
    element.markers = [{ index: 2, color: "rgba(92,128,196,0.6)", label: "GEN" }];
    const pushDashedSpy = vi.spyOn(element.gpuRenderer!, 'pushDashedLine');
    const pushTextSpy = vi.spyOn(element.gpuRenderer!, 'pushText');

    element.paint();

    expect(pushDashedSpy).toHaveBeenCalledTimes(1);
    const markerTextCall = pushTextSpy.mock.calls.find((c: any) => c[0] === "GEN");
    expect(markerTextCall).toBeDefined();

    document.body.removeChild(element);
  });

  // --- Highlight range ---

  it("observes the highlight-range attribute", () => {
    expect(ArsCandlestickChart.observedAttributes).toContain("highlight-range");
  });

  it("parses highlight-range from JSON attribute", () => {
    const range: ChartHighlightRange = { startIndex: 1, endIndex: 3 };
    element.setAttribute("highlight-range", JSON.stringify(range));
    expect(element.highlightRange).toEqual(range);
  });

  it("returns null for absent highlight-range", () => {
    expect(element.highlightRange).toBeNull();
  });

  it("highlightRange property setter updates state", () => {
    const range: ChartHighlightRange = { startIndex: 0, endIndex: 4 };
    element.highlightRange = range;
    expect(element.highlightRange).toEqual(range);
  });

  it("highlightRange property returns the internal reference (zero-copy)", () => {
    const range: ChartHighlightRange = { startIndex: 0, endIndex: 2 };
    element.highlightRange = range;
    expect(element.highlightRange).toBe(range);
  });

  it("scheduleRepaint is called when highlightRange is set", () => {
    const spy = vi.spyOn(element, "scheduleRepaint");
    element.highlightRange = { startIndex: 1, endIndex: 3 };
    expect(spy).toHaveBeenCalled();
  });

  it("paint draws highlight range overlay", async () => {
    document.body.appendChild(element);
    await element.initGPU();

    element.data = makeCandleData(5);
    element.highlightRange = { startIndex: 1, endIndex: 3 };
    const pushRectSpy = vi.spyOn(element.gpuRenderer!, 'pushRect');
    const pushLineSpy = vi.spyOn(element.gpuRenderer!, 'pushLine');

    element.paint();

    // Should have more rects than without highlight (background + highlight fill + bodies + volumes).
    const rectCount = pushRectSpy.mock.calls.length;
    expect(rectCount).toBeGreaterThanOrEqual(12); // 1 bg + 1 highlight + 5 bodies + 5 volumes
    // Should have border lines for highlight.
    expect(pushLineSpy.mock.calls.length).toBeGreaterThanOrEqual(2);

    document.body.removeChild(element);
  });

  // --- Reactivity ---

  it("scheduleRepaint is called when data attribute changes", () => {
    const spy = vi.spyOn(element, "scheduleRepaint");
    element.setAttribute("data", JSON.stringify(makeCandleData(2)));
    expect(spy).toHaveBeenCalled();
  });

  it("scheduleRepaint is called when orders attribute changes", () => {
    const spy = vi.spyOn(element, "scheduleRepaint");
    element.setAttribute("orders", JSON.stringify(makeOrders()));
    expect(spy).toHaveBeenCalled();
  });

  it("scheduleRepaint is called when data property is set", () => {
    const spy = vi.spyOn(element, "scheduleRepaint");
    element.data = makeCandleData(3);
    expect(spy).toHaveBeenCalled();
  });

  it("scheduleRepaint is called when orders property is set", () => {
    const spy = vi.spyOn(element, "scheduleRepaint");
    element.orders = makeOrders();
    expect(spy).toHaveBeenCalled();
  });

  it("data setter skips repaint when data is identical", () => {
    const data = makeCandleData(3);
    element.data = data;
    const spy = vi.spyOn(element, "scheduleRepaint");
    element.data = data;
    expect(spy).not.toHaveBeenCalled();
  });
});
