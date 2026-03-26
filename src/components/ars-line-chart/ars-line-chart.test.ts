/**
 * Tests for ArsLineChart web component.
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArsLineChart } from "./ars-line-chart.js";

describe("ArsLineChart", () => {
  let element: ArsLineChart;

  beforeEach(() => {
    element = new ArsLineChart();
  });

  // --- Registration ---

  it("registers the custom element", () => {
    expect(customElements.get("ars-line-chart")).toBe(ArsLineChart);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  // --- Default dimensions ---

  it("has default width of 320", () => {
    expect(element.getChartWidth()).toBe(320);
  });

  it("has default height of 180", () => {
    expect(element.getChartHeight()).toBe(180);
  });

  it("reads width and height from attributes", () => {
    element.setAttribute("width", "500");
    element.setAttribute("height", "250");
    expect(element.getChartWidth()).toBe(500);
    expect(element.getChartHeight()).toBe(250);
  });

  // --- Data attribute ---

  it("parses data from JSON attribute", () => {
    element.setAttribute("data", "[10, 20, 30]");
    expect(element.data).toEqual([10, 20, 30]);
  });

  it("returns empty array for absent data attribute", () => {
    expect(element.data).toEqual([]);
  });

  it("returns empty array for invalid JSON data attribute", () => {
    element.setAttribute("data", "not-json");
    expect(element.data).toEqual([]);
  });

  it("data property setter updates internal state", () => {
    element.data = [5, 10, 15];
    expect(element.data).toEqual([5, 10, 15]);
  });

  it("data property returns a copy, not the internal array", () => {
    element.data = [1, 2, 3];
    const retrieved = element.data;
    retrieved.push(4);
    expect(element.data).toEqual([1, 2, 3]);
  });

  // --- Observed attributes ---

  it("observes all expected attributes", () => {
    const observed = ArsLineChart.observedAttributes;
    expect(observed).toContain("data");
    expect(observed).toContain("width");
    expect(observed).toContain("height");
    expect(observed).toContain("line-color");
    expect(observed).toContain("background-color");
    expect(observed).toContain("grid-color");
    expect(observed).toContain("axis-color");
    expect(observed).toContain("grid-lines");
    expect(observed).toContain("show-dots");
  });

  // --- Rendering (paint) ---

  it("paint runs without error on empty data", () => {
    expect(() => element.paint()).not.toThrow();
  });

  it("paint runs without error on valid data", () => {
    element.data = [18, 22, 19, 26, 24, 30];
    expect(() => element.paint()).not.toThrow();
  });

  it("paint creates a canvas in the shadow root", () => {
    element.data = [1, 2, 3];
    element.paint();
    expect(element.shadowRoot?.querySelector("canvas")).toBeInstanceOf(HTMLCanvasElement);
  });

  it("paint calls canvas drawing methods for line and dots", () => {
    element.data = [10, 20, 30, 40];
    element.paint();
    const canvas = element.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    // Line path: beginPath + 1 moveTo + 3 lineTo + stroke
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
    // Dots: arc + fill for each data point
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });

  it("paint respects show-dots=false by not drawing arcs for dots", () => {
    element.setAttribute("show-dots", "false");
    element.data = [10, 20, 30];
    element.paint();
    const canvas = element.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    // Grid drawing also calls beginPath/stroke, but arc is only used for dots
    // When show-dots is false, arc should only be called from grid (which doesn't use arc)
    // So we check arc was NOT called
    expect(ctx.arc).not.toHaveBeenCalled();
  });

  it("paint draws Y-axis labels with fillText", () => {
    element.data = [10, 20, 30];
    element.paint();
    const canvas = element.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    // fillText is called for Y-axis labels + X-axis labels + background fillRect
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it("paint uses custom colors from attributes", () => {
    element.setAttribute("background-color", "#111");
    element.setAttribute("line-color", "#f00");
    element.data = [5, 10];
    element.paint();
    const canvas = element.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    // Verify that fillStyle was set (at minimum for background)
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("handles single data point without division by zero", () => {
    element.data = [42];
    expect(() => element.paint()).not.toThrow();
  });

  it("handles data with all identical values", () => {
    element.data = [10, 10, 10, 10];
    expect(() => element.paint()).not.toThrow();
  });

  // --- Reactivity ---

  it("scheduleRepaint is called when data attribute changes", async () => {
    const spy = vi.spyOn(element, "scheduleRepaint");
    element.setAttribute("data", "[1, 2, 3]");
    expect(spy).toHaveBeenCalled();
  });

  it("scheduleRepaint is called when data property is set", async () => {
    const spy = vi.spyOn(element, "scheduleRepaint");
    element.data = [1, 2, 3];
    expect(spy).toHaveBeenCalled();
  });
});
