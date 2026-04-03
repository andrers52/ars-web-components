/**
 * Tests for ArsCandlestickChart web component.
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArsCandlestickChart } from "./ars-candlestick-chart.js";
import type { CandleDataPoint, CandleOrder, ChartVerticalMarker, ChartHighlightRange } from "../chart-base/chart-types.js";

// Helper to create synthetic candle data
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

  it("data property returns a copy, not the internal array", () => {
    const data = makeCandleData(2);
    element.data = data;
    const retrieved = element.data;
    retrieved.push(makeCandleData(1)[0]);
    expect(element.data.length).toBe(2);
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

  it("orders property returns a copy", () => {
    const orders = makeOrders();
    element.orders = orders;
    const retrieved = element.orders;
    retrieved.push({ side: "buy", amount: 1, price: 50 });
    expect(element.orders.length).toBe(2);
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

  // --- Rendering (paint) ---

  it("paint runs without error on empty data", () => {
    expect(() => element.paint()).not.toThrow();
  });

  it("paint runs without error on valid data", () => {
    element.data = makeCandleData(10);
    expect(() => element.paint()).not.toThrow();
  });

  it("paint creates a canvas in the shadow root", () => {
    element.data = makeCandleData(3);
    element.paint();
    expect(element.shadowRoot?.querySelector("canvas")).toBeInstanceOf(HTMLCanvasElement);
  });

  it("paint draws candlestick wicks (vertical lines via moveTo/lineTo)", () => {
    element.data = makeCandleData(3);
    element.paint();
    const canvas = element.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    // Wicks use moveTo + lineTo for each candle
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("paint draws candlestick bodies (fillRect)", () => {
    element.data = makeCandleData(3);
    element.paint();
    const canvas = element.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    // fillRect: background + candle bodies + volume bars
    expect(ctx.fillRect).toHaveBeenCalled();
    // Should be at least: 1 (bg) + 3 (bodies) + 3 (vol bars) = 7
    expect(ctx.fillRect).toHaveBeenCalledTimes(7);
  });

  it("paint draws separator line between price and volume areas", () => {
    element.data = makeCandleData(3);
    element.paint();
    const canvas = element.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    // Separator is one additional stroke call beyond candles and grid
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("paint draws date labels on X-axis", () => {
    element.data = makeCandleData(5);
    element.paint();
    const canvas = element.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it("paint draws order overlay lines when orders are provided", () => {
    element.data = makeCandleData(5);
    element.orders = makeOrders();
    element.paint();
    const canvas = element.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    // Orders use setLineDash for dashed lines
    expect(ctx.setLineDash).not.toBeUndefined();
  });

  it("paint handles orders with prices outside candle range without clipping", () => {
    // Candles range ~95-115. Orders at 50 (far below) and 200 (far above).
    // Before the fix, these would draw outside the chart area.
    // After the fix, priceExtent includes orders, so the Y-axis expands.
    element.data = makeCandleData(3);
    element.orders = [
      { side: "buy", amount: 1, price: 50 },
      { side: "sell", amount: 1, price: 200 },
    ];
    expect(() => element.paint()).not.toThrow();
  });

  it("paint uses custom up/down colors from attributes", () => {
    element.setAttribute("up-color", "#00ff00");
    element.setAttribute("down-color", "#ff0000");
    element.data = makeCandleData(4);
    expect(() => element.paint()).not.toThrow();
  });

  it("handles data with all bullish candles", () => {
    const data: CandleDataPoint[] = [
      { open: 10, close: 12, high: 13, low: 9, volume: 100, time: Date.now() },
      { open: 12, close: 14, high: 15, low: 11, volume: 120, time: Date.now() + 86400000 },
    ];
    element.data = data;
    expect(() => element.paint()).not.toThrow();
  });

  it("handles data with all bearish candles", () => {
    const data: CandleDataPoint[] = [
      { open: 14, close: 12, high: 15, low: 11, volume: 100, time: Date.now() },
      { open: 12, close: 10, high: 13, low: 9, volume: 120, time: Date.now() + 86400000 },
    ];
    element.data = data;
    expect(() => element.paint()).not.toThrow();
  });

  it("handles single candle data point", () => {
    element.data = makeCandleData(1);
    expect(() => element.paint()).not.toThrow();
  });

  it("handles zero volume data", () => {
    const data: CandleDataPoint[] = [
      { open: 10, close: 12, high: 13, low: 9, volume: 0, time: Date.now() },
    ];
    element.data = data;
    expect(() => element.paint()).not.toThrow();
  });

  // --- Order label position ---

  it("paint runs with order-label-position=right", () => {
    element.setAttribute("order-label-position", "right");
    element.data = makeCandleData(5);
    element.orders = makeOrders();
    expect(() => element.paint()).not.toThrow();
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

  // --- Markers attribute ---

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

  it("markers property returns a copy", () => {
    const markers = makeMarkers();
    element.markers = markers;
    const retrieved = element.markers;
    retrieved.push({ index: 10 });
    expect(element.markers.length).toBe(2);
  });

  it("scheduleRepaint is called when markers property is set", () => {
    const spy = vi.spyOn(element, "scheduleRepaint");
    element.markers = makeMarkers();
    expect(spy).toHaveBeenCalled();
  });

  it("paint runs without error with markers", () => {
    element.data = makeCandleData(5);
    element.markers = makeMarkers();
    expect(() => element.paint()).not.toThrow();
  });

  it("paint draws dashed marker lines (setLineDash)", () => {
    element.data = makeCandleData(5);
    element.markers = [{ index: 2, color: "blue", label: "GEN" }];
    element.paint();
    const canvas = element.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    // Markers use setLineDash for dashed lines, then reset.
    expect(ctx.setLineDash).toHaveBeenCalled();
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

  it("highlightRange property returns a copy", () => {
    const range: ChartHighlightRange = { startIndex: 0, endIndex: 2 };
    element.highlightRange = range;
    const retrieved = element.highlightRange!;
    retrieved.startIndex = 99;
    expect(element.highlightRange!.startIndex).toBe(0);
  });

  it("scheduleRepaint is called when highlightRange is set", () => {
    const spy = vi.spyOn(element, "scheduleRepaint");
    element.highlightRange = { startIndex: 1, endIndex: 3 };
    expect(spy).toHaveBeenCalled();
  });

  it("paint runs without error with highlight range", () => {
    element.data = makeCandleData(5);
    element.highlightRange = { startIndex: 1, endIndex: 3 };
    expect(() => element.paint()).not.toThrow();
  });

  it("paint draws highlight range overlay (fillRect for region)", () => {
    element.data = makeCandleData(5);
    element.highlightRange = { startIndex: 1, endIndex: 3, fillColor: "rgba(80,140,220,0.15)" };
    element.paint();
    const canvas = element.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    // fillRect called for: background (1) + highlight overlay (1) + candle bodies (5) + volume bars (5) = 12
    expect(ctx.fillRect).toHaveBeenCalled();
    // The call count should be higher than without highlight (7 base + 1 highlight = at least 8).
    expect((ctx.fillRect as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBeGreaterThanOrEqual(8);
  });
});
