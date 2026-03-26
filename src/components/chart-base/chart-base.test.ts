/**
 * Tests for ChartBase utilities and abstract class behavior.
 * @vi-environment jsdom
 */

import { describe, expect, it } from "vitest";
import { ChartBase, mapToRange, generateTicks, formatAxisValue, formatDateShort } from "./chart-base.js";

// --- Pure function tests ---

describe("mapToRange", () => {
  it("maps a value linearly from domain to range", () => {
    expect(mapToRange(5, 0, 10, 0, 100)).toBe(50);
    expect(mapToRange(0, 0, 10, 0, 100)).toBe(0);
    expect(mapToRange(10, 0, 10, 0, 100)).toBe(100);
  });

  it("handles inverted ranges", () => {
    expect(mapToRange(0, 0, 10, 100, 0)).toBe(100);
    expect(mapToRange(10, 0, 10, 100, 0)).toBe(0);
  });

  it("returns midpoint when domain is zero-width", () => {
    expect(mapToRange(5, 5, 5, 0, 100)).toBe(50);
  });

  it("maps values outside the domain proportionally", () => {
    expect(mapToRange(15, 0, 10, 0, 100)).toBe(150);
    expect(mapToRange(-5, 0, 10, 0, 100)).toBe(-50);
  });
});

describe("generateTicks", () => {
  it("generates evenly spaced ticks including endpoints", () => {
    const ticks = generateTicks(0, 100, 5);
    expect(ticks).toEqual([0, 25, 50, 75, 100]);
  });

  it("returns a single element when count is 1", () => {
    expect(generateTicks(10, 50, 1)).toEqual([10]);
  });

  it("returns two endpoints for count of 2", () => {
    expect(generateTicks(0, 10, 2)).toEqual([0, 10]);
  });

  it("handles negative ranges", () => {
    const ticks = generateTicks(-10, 10, 3);
    expect(ticks[0]).toBe(-10);
    expect(ticks[1]).toBe(0);
    expect(ticks[2]).toBe(10);
  });
});

describe("formatAxisValue", () => {
  it("formats integers without decimals", () => {
    expect(formatAxisValue(42)).toBe("42");
    expect(formatAxisValue(0)).toBe("0");
  });

  it("formats decimals with trailing zeroes removed", () => {
    expect(formatAxisValue(1.5)).toBe("1.5");
    expect(formatAxisValue(3.10)).toBe("3.1");
    expect(formatAxisValue(2.00)).toBe("2");
  });

  it("truncates to 2 decimal places", () => {
    expect(formatAxisValue(1.999)).toBe("2");
    expect(formatAxisValue(1.234)).toBe("1.23");
  });
});

describe("formatDateShort", () => {
  it("formats a timestamp as M/D", () => {
    // 2026-01-15 — months are 0-indexed in JS Date
    const ts = new Date(2026, 0, 15).getTime();
    expect(formatDateShort(ts)).toBe("1/15");
  });

  it("formats a mid-year date correctly", () => {
    const ts = new Date(2026, 5, 3).getTime();
    expect(formatDateShort(ts)).toBe("6/3");
  });
});

// --- ChartBase abstract class tests ---

// Concrete subclass for testing the abstract base.
class TestChart extends ChartBase {
  paintCallCount = 0;

  paint(): void {
    this.paintCallCount++;
  }
}
window.customElements.define("test-chart-base", TestChart);

describe("ChartBase", () => {
  it("creates a shadow root on construction", () => {
    const el = new TestChart();
    expect(el.shadowRoot).toBeTruthy();
  });

  it("returns default width and height", () => {
    const el = new TestChart();
    expect(el.getChartWidth()).toBe(320);
    expect(el.getChartHeight()).toBe(180);
  });

  it("reads width and height from attributes", () => {
    const el = new TestChart();
    el.setAttribute("width", "500");
    el.setAttribute("height", "300");
    expect(el.getChartWidth()).toBe(500);
    expect(el.getChartHeight()).toBe(300);
  });

  it("returns default padding", () => {
    const el = new TestChart();
    const p = el.getPadding();
    expect(p.top).toBeGreaterThan(0);
    expect(p.left).toBeGreaterThan(0);
  });

  it("ensures canvas creates a canvas element in shadow DOM", () => {
    const el = new TestChart();
    const canvas = el.ensureCanvas();
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(el.shadowRoot?.querySelector("canvas")).toBe(canvas);
  });

  it("ensures canvas reuses existing canvas element", () => {
    const el = new TestChart();
    const c1 = el.ensureCanvas();
    const c2 = el.ensureCanvas();
    expect(c1).toBe(c2);
  });

  it("ensures canvas dimensions match chart dimensions", () => {
    const el = new TestChart();
    el.setAttribute("width", "400");
    el.setAttribute("height", "200");
    const canvas = el.ensureCanvas();
    expect(canvas?.width).toBe(400);
    expect(canvas?.height).toBe(200);
  });

  it("scheduleRepaint calls paint on next animation frame", async () => {
    const el = new TestChart();
    el.scheduleRepaint();
    // paint is called on rAF
    await new Promise((r) => requestAnimationFrame(r));
    expect(el.paintCallCount).toBeGreaterThanOrEqual(1);
  });

  it("coalesces multiple scheduleRepaint calls into one paint", async () => {
    const el = new TestChart();
    el.scheduleRepaint();
    el.scheduleRepaint();
    el.scheduleRepaint();
    await new Promise((r) => requestAnimationFrame(r));
    expect(el.paintCallCount).toBe(1);
  });

  it("parseJsonAttribute returns parsed JSON for valid input", () => {
    const el = new TestChart();
    el.setAttribute("data", "[1,2,3]");
    expect(el.parseJsonAttribute("data", [])).toEqual([1, 2, 3]);
  });

  it("parseJsonAttribute returns fallback for absent attribute", () => {
    const el = new TestChart();
    expect(el.parseJsonAttribute("missing", [99])).toEqual([99]);
  });

  it("parseJsonAttribute returns fallback for non-JSON string", () => {
    const el = new TestChart();
    el.setAttribute("data", "not-json");
    expect(el.parseJsonAttribute("data", [42])).toEqual([42]);
  });

  it("drawBackground fills the canvas area", () => {
    const el = new TestChart();
    const canvas = el.ensureCanvas()!;
    const ctx = canvas.getContext("2d")!;
    el.drawBackground(ctx, 100, 50, "#000");
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 100, 50);
  });

  it("drawHorizontalGrid draws the correct number of lines", () => {
    const el = new TestChart();
    const canvas = el.ensureCanvas()!;
    const ctx = canvas.getContext("2d")!;
    const padding = { top: 10, right: 10, bottom: 10, left: 10 };
    el.drawHorizontalGrid(ctx, padding, 100, 5, "#ccc");
    // 5 grid lines → 5 beginPath + 5 moveTo + 5 lineTo + 5 stroke
    expect(ctx.beginPath).toHaveBeenCalledTimes(5);
    expect(ctx.stroke).toHaveBeenCalledTimes(5);
  });

  it("drawYAxisLabels draws the correct number of labels", () => {
    const el = new TestChart();
    const canvas = el.ensureCanvas()!;
    const ctx = canvas.getContext("2d")!;
    const ticks = [0, 25, 50, 75, 100];
    el.drawYAxisLabels(ctx, { top: 10, right: 10, bottom: 10, left: 40 }, ticks, 100, "#fff", "10px mono");
    expect(ctx.fillText).toHaveBeenCalledTimes(5);
  });
});
