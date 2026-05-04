/**
 * Tests for ArsMinimap
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ArsMinimap } from "./ars-minimap.js";

describe("ArsMinimap", () => {
  let element: ArsMinimap;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsMinimap();
  });

  it("registers the ars-minimap custom element", () => {
    expect(customElements.get("ars-minimap")).toBe(ArsMinimap);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  it("defaults width and height to 100", () => {
    document.body.appendChild(element);
    const canvas = element.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.width).toBe(100);
    expect(canvas.height).toBe(100);
  });

  it("reflects width and height attributes to canvas", () => {
    element.setAttribute("width", "200");
    element.setAttribute("height", "150");
    document.body.appendChild(element);
    const canvas = element.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(150);
  });

  it("renders points via setData", () => {
    document.body.appendChild(element);
    const canvas = element.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;

    // Spy on fillRect via a mock — jsdom canvas is stubbed, but we can
    // verify the method was called by wrapping it.
    const fillSpy = vi.spyOn(ctx, "fill");

    element.setData([
      { id: "a", x: 10, y: 20, color: "red" },
      { id: "b", x: 30, y: 40, color: "blue" },
    ]);

    expect(fillSpy).toHaveBeenCalledTimes(2);
    fillSpy.mockRestore();
  });

  it("clears the canvas via clear()", () => {
    document.body.appendChild(element);
    const canvas = element.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    const clearSpy = vi.spyOn(ctx, "clearRect");

    element.clear();
    expect(clearSpy).toHaveBeenCalledWith(0, 0, 100, 100);
    clearSpy.mockRestore();
  });

  it("uses design token variables in styles", () => {
    document.body.appendChild(element);
    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-surface");
    expect(styles).toContain("--arswc-radius-sm");
  });
});
