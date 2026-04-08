/**
 * Tests for ChartBase utilities and abstract class behavior.
 * @vi-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { ChartBase, mapToRange, generateTicks, formatAxisValue, formatDateShort } from "./chart-base.js";

// --- Pure function tests (unchanged — rendering-agnostic) ---

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
    const ts = new Date(2026, 0, 15).getTime();
    expect(formatDateShort(ts)).toBe("1/15");
  });

  it("formats a mid-year date correctly", () => {
    const ts = new Date(2026, 5, 3).getTime();
    expect(formatDateShort(ts)).toBe("6/3");
  });
});

// --- ChartBase abstract class tests ---

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

  it("scheduleRepaint calls paint on next animation frame", async () => {
    const el = new TestChart();
    el.scheduleRepaint();
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

  // --- GPU lifecycle ---

  it("gpuDevice property sets and reads external device", () => {
    const el = new TestChart();
    const mockDevice = { __brand: 'GPUDevice' } as unknown as GPUDevice;
    el.gpuDevice = mockDevice;
    expect(el.gpuDevice).toBe(mockDevice);
  });

  it("gpuRenderer is null before initGPU", () => {
    const el = new TestChart();
    expect(el.gpuRenderer).toBeNull();
  });

  it("initGPU creates the GPU renderer", async () => {
    const el = new TestChart();
    document.body.appendChild(el);
    await el.initGPU();
    expect(el.gpuRenderer).not.toBeNull();
    document.body.removeChild(el);
  });

  it("initGPU is idempotent (safe to call multiple times)", async () => {
    const el = new TestChart();
    document.body.appendChild(el);
    await el.initGPU();
    const renderer1 = el.gpuRenderer;
    await el.initGPU();
    expect(el.gpuRenderer).toBe(renderer1);
    document.body.removeChild(el);
  });

  // --- GPU drawing utilities ---

  it("gpuDrawBackground pushes a rect to the renderer", async () => {
    const el = new TestChart();
    document.body.appendChild(el);
    await el.initGPU();
    const spy = vi.spyOn(el.gpuRenderer!, 'pushRect');
    el.gpuRenderer!.beginFrame(320, 180, [0, 0, 0, 1]);
    el.gpuDrawBackground(320, 180, '#000000');
    expect(spy).toHaveBeenCalledWith(0, 0, 320, 180, '#000000');
    document.body.removeChild(el);
  });

  it("gpuDrawHorizontalGrid pushes lines to the renderer", async () => {
    const el = new TestChart();
    document.body.appendChild(el);
    await el.initGPU();
    const spy = vi.spyOn(el.gpuRenderer!, 'pushLine');
    el.gpuRenderer!.beginFrame(320, 180, [0, 0, 0, 1]);
    el.gpuDrawHorizontalGrid({ top: 12, right: 12, bottom: 28, left: 48 }, 140, 5, '#ccc', 320);
    expect(spy).toHaveBeenCalledTimes(5);
    document.body.removeChild(el);
  });

  it("gpuDrawYAxisLabels pushes text to the renderer", async () => {
    const el = new TestChart();
    document.body.appendChild(el);
    await el.initGPU();
    const spy = vi.spyOn(el.gpuRenderer!, 'pushText');
    el.gpuRenderer!.beginFrame(320, 180, [0, 0, 0, 1]);
    el.gpuDrawYAxisLabels({ top: 12, right: 12, bottom: 28, left: 48 }, [0, 25, 50, 75, 100], 140, '#fff', 10);
    expect(spy).toHaveBeenCalledTimes(5);
    document.body.removeChild(el);
  });
});
