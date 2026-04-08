/**
 * Tests for ArsLineChart web component (WebGPU rendering).
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

  it("data property returns the internal reference (zero-copy)", () => {
    element.data = [1, 2, 3];
    const retrieved = element.data;
    expect(retrieved).toBe(element.data);
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

  // --- GPU rendering ---

  it("paint runs without error on empty data (triggers GPU init)", () => {
    expect(() => element.paint()).not.toThrow();
  });

  it("paint runs without error on valid data (triggers GPU init)", () => {
    element.data = [18, 22, 19, 26, 24, 30];
    expect(() => element.paint()).not.toThrow();
  });

  it("paint with GPU renderer pushes rect, line, and text commands", async () => {
    document.body.appendChild(element);
    await element.initGPU();

    element.data = [10, 20, 30, 40];
    const renderer = element.gpuRenderer!;
    const pushRectSpy = vi.spyOn(renderer, 'pushRect');
    const pushLineSpy = vi.spyOn(renderer, 'pushLine');
    const pushTextSpy = vi.spyOn(renderer, 'pushText');
    const pushCircleSpy = vi.spyOn(renderer, 'pushCircle');

    element.paint();

    // Background rect.
    expect(pushRectSpy).toHaveBeenCalled();
    // Line segments (3 for 4 data points).
    expect(pushLineSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
    // Dots for each data point (4).
    expect(pushCircleSpy).toHaveBeenCalledTimes(4);
    // Y-axis labels + X-axis labels.
    expect(pushTextSpy).toHaveBeenCalled();

    document.body.removeChild(element);
  });

  it("show-dots=false skips circle rendering", async () => {
    document.body.appendChild(element);
    await element.initGPU();

    element.setAttribute("show-dots", "false");
    element.data = [10, 20, 30];
    const pushCircleSpy = vi.spyOn(element.gpuRenderer!, 'pushCircle');

    element.paint();

    expect(pushCircleSpy).not.toHaveBeenCalled();
    document.body.removeChild(element);
  });

  it("handles single data point without division by zero", async () => {
    document.body.appendChild(element);
    await element.initGPU();
    element.data = [42];
    expect(() => element.paint()).not.toThrow();
    document.body.removeChild(element);
  });

  it("handles data with all identical values", async () => {
    document.body.appendChild(element);
    await element.initGPU();
    element.data = [10, 10, 10, 10];
    expect(() => element.paint()).not.toThrow();
    document.body.removeChild(element);
  });

  it("renders markers as dashed lines with optional labels", async () => {
    document.body.appendChild(element);
    await element.initGPU();

    element.data = [10, 20, 30, 40, 50];
    element.markers = [{ index: 2, label: "Gen 1" }];
    const pushDashedSpy = vi.spyOn(element.gpuRenderer!, 'pushDashedLine');
    const pushTextSpy = vi.spyOn(element.gpuRenderer!, 'pushText');

    element.paint();

    expect(pushDashedSpy).toHaveBeenCalledTimes(1);
    // Label text for marker.
    const markerTextCall = pushTextSpy.mock.calls.find((c: any) => c[0] === "Gen 1");
    expect(markerTextCall).toBeDefined();

    document.body.removeChild(element);
  });

  // --- yDomain ---

  it("yDomain property controls fixed Y axis range", () => {
    element.yDomain = [0, 100];
    expect(element.yDomain).toEqual([0, 100]);
  });

  it("yDomain null reverts to auto-scaling", () => {
    element.yDomain = [0, 100];
    element.yDomain = null;
    expect(element.yDomain).toBeNull();
  });

  // --- Reactivity ---

  it("scheduleRepaint is called when data attribute changes", () => {
    const spy = vi.spyOn(element, "scheduleRepaint");
    element.setAttribute("data", "[1, 2, 3]");
    expect(spy).toHaveBeenCalled();
  });

  it("scheduleRepaint is called when data property is set", () => {
    const spy = vi.spyOn(element, "scheduleRepaint");
    element.data = [1, 2, 3];
    expect(spy).toHaveBeenCalled();
  });

  it("data setter skips repaint when data is identical", () => {
    element.data = [1, 2, 3];
    const spy = vi.spyOn(element, "scheduleRepaint");
    element.data = [1, 2, 3];
    expect(spy).not.toHaveBeenCalled();
  });
});
