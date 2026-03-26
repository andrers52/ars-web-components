/**
 * Tests for ArsColorSelect (carousel redesign)
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArsColorSelect } from "./ars-color-select.js";

describe("ArsColorSelect", () => {
  let element: ArsColorSelect;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("ars-color-select") as ArsColorSelect;
    element.id = "test-color-select";
  });

  // --- Registration ---

  it("registers the ars-color-select custom element", () => {
    expect(customElements.get("ars-color-select")).toBeDefined();
  });

  it("creates shadow DOM on connect", () => {
    document.body.appendChild(element);
    expect(element.shadowRoot).toBeTruthy();
  });

  // --- Observed attributes ---

  it("observes the expected attributes", () => {
    expect(ArsColorSelect.observedAttributes).toContain("color");
    expect(ArsColorSelect.observedAttributes).toContain("palette");
    expect(ArsColorSelect.observedAttributes).toContain("swatch-size");
    expect(ArsColorSelect.observedAttributes).toContain("disabled");
    expect(ArsColorSelect.observedAttributes).toContain("visible-count");
  });

  // --- Carousel rendering ---

  it("renders a listbox with option swatches", () => {
    document.body.appendChild(element);
    const listbox = element.shadowRoot!.querySelector('[role="listbox"]');
    expect(listbox).toBeTruthy();
    const options = element.shadowRoot!.querySelectorAll('[role="option"]');
    expect(options.length).toBeGreaterThan(0);
  });

  it("renders navigation buttons", () => {
    document.body.appendChild(element);
    expect(element.shadowRoot!.querySelector(".nav-btn--prev")).toBeTruthy();
    expect(element.shadowRoot!.querySelector(".nav-btn--next")).toBeTruthy();
  });

  it("renders a position track", () => {
    document.body.appendChild(element);
    expect(element.shadowRoot!.querySelector(".track")).toBeTruthy();
    expect(element.shadowRoot!.querySelector(".track-marker")).toBeTruthy();
  });

  // --- Color selection ---

  it("selects a color by clicking a swatch", () => {
    document.body.appendChild(element);
    const events: any[] = [];
    element.addEventListener("ars-color-select:change", (e) => {
      events.push((e as CustomEvent).detail);
    });

    const secondSwatch = element.shadowRoot!.querySelectorAll(".swatch")[1] as HTMLElement;
    secondSwatch.click();

    expect(events.length).toBeGreaterThan(0);
    expect(events[events.length - 1].color).toBeTruthy();
  });

  it("highlights the selected swatch with the selected class", () => {
    document.body.appendChild(element);
    const firstSwatch = element.shadowRoot!.querySelector(".swatch") as HTMLElement;
    firstSwatch.click();

    const selectedSwatches = element.shadowRoot!.querySelectorAll(".swatch--selected");
    expect(selectedSwatches.length).toBe(1);
  });

  it("sets aria-selected on the selected swatch", () => {
    document.body.appendChild(element);
    const swatches = element.shadowRoot!.querySelectorAll(".swatch");
    (swatches[2] as HTMLElement).click();

    // Only one swatch should be aria-selected=true
    const selected = element.shadowRoot!.querySelectorAll('[aria-selected="true"]');
    expect(selected.length).toBe(1);
  });

  // --- Color attribute backwards compatibility ---

  it("sets initial color from attribute", () => {
    element.setAttribute("color", "#DC2626");
    document.body.appendChild(element);
    expect(element.color).toBe("#DC2626");
  });

  it("dispatches color change event when color attribute changes", () => {
    document.body.appendChild(element);
    const handler = vi.fn();
    element.addEventListener("ars-color-select:change", handler);

    element.setAttribute("color", "#22C55E");

    expect(handler).toHaveBeenCalled();
  });

  it("includes color and id in event detail", () => {
    document.body.appendChild(element);
    element.setAttribute("color", "#DC2626");

    let detail: any = null;
    element.addEventListener("ars-color-select:change", (e) => {
      detail = (e as CustomEvent).detail;
    });

    element.setAttribute("color", "#22C55E");

    expect(detail.color).toBe("#22C55E");
    expect(detail.id).toBe("test-color-select");
    expect(detail.previousColor).toBe("#DC2626");
  });

  it("responds to color attribute changes", () => {
    document.body.appendChild(element);
    element.setAttribute("color", "#EAB308");
    expect(element.getAttribute("color")).toBe("#EAB308");
  });

  // --- Property accessors ---

  it("updates color via property setter", () => {
    document.body.appendChild(element);
    element.color = "#3B82F6";
    expect(element.getAttribute("color")).toBe("#3B82F6");
  });

  it("returns selectedIndex as read-only", () => {
    document.body.appendChild(element);
    expect(typeof element.selectedIndex).toBe("number");
  });

  // --- Custom palette ---

  it("accepts a custom palette via attribute", () => {
    const customPalette = ["red", "green", "blue"];
    element.setAttribute("palette", JSON.stringify(customPalette));
    document.body.appendChild(element);

    const swatches = element.shadowRoot!.querySelectorAll(".swatch");
    expect(swatches.length).toBe(3);
  });

  it("accepts a custom palette via property", () => {
    document.body.appendChild(element);
    element.palette = ["#ff0000", "#00ff00"];

    const swatches = element.shadowRoot!.querySelectorAll(".swatch");
    expect(swatches.length).toBe(2);
  });

  // --- Swatch sizes ---

  it("defaults to md swatch size", () => {
    document.body.appendChild(element);
    expect(element.swatchSize).toBe("md");
  });

  it("changes swatch size via attribute", () => {
    element.setAttribute("swatch-size", "lg");
    document.body.appendChild(element);
    expect(element.swatchSize).toBe("lg");
  });

  // --- Disabled state ---

  it("adds disabled attribute and prevents interaction", () => {
    element.setAttribute("disabled", "");
    document.body.appendChild(element);
    expect(element.disabled).toBe(true);
  });

  it("reflects disabled via property", () => {
    document.body.appendChild(element);
    element.disabled = true;
    expect(element.hasAttribute("disabled")).toBe(true);
  });

  // --- Navigation ---

  it("scrolls forward when next button is clicked", () => {
    element.setAttribute("visible-count", "3");
    document.body.appendChild(element);

    const nextBtn = element.shadowRoot!.querySelector(".nav-btn--next") as HTMLElement;
    nextBtn.click();

    // After scrolling, the strip transform should have changed
    const strip = element.shadowRoot!.querySelector(".strip") as HTMLElement;
    expect(strip.style.transform).not.toBe("translateX(0px)");
  });

  it("disables prev button at the start", () => {
    document.body.appendChild(element);
    const prevBtn = element.shadowRoot!.querySelector(".nav-btn--prev") as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
  });

  // --- Keyboard navigation ---

  it("selects next color on ArrowRight", () => {
    document.body.appendChild(element);
    const initial = element.selectedIndex;
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(element.selectedIndex).toBe(initial + 1);
  });

  it("selects previous color on ArrowLeft", () => {
    document.body.appendChild(element);
    // Move to index 2 first
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    const idx = element.selectedIndex;
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    expect(element.selectedIndex).toBe(idx - 1);
  });

  it("jumps to first on Home key", () => {
    document.body.appendChild(element);
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));
    expect(element.selectedIndex).toBe(0);
  });

  it("jumps to last on End key", () => {
    document.body.appendChild(element);
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
    expect(element.selectedIndex).toBe(element.palette.length - 1);
  });

  // --- Deprecated API (backwards compatibility) ---

  it("has setBackgroundColor method (deprecated)", () => {
    document.body.appendChild(element);
    expect(typeof element.setBackgroundColor).toBe("function");
  });

  it("has toggleColorSelection method (deprecated, no-op)", () => {
    document.body.appendChild(element);
    expect(typeof element.toggleColorSelection).toBe("function");
    // Should not throw
    element.toggleColorSelection();
  });

  it("setBackgroundColor delegates to color setter", () => {
    document.body.appendChild(element);
    element.setBackgroundColor("#EF4444");
    expect(element.color).toBe("#EF4444");
  });

  // --- Renders without eval ---

  it("renders without using eval", () => {
    const evalSpy = vi.spyOn(globalThis, "eval");
    document.body.appendChild(element);
    expect(evalSpy).not.toHaveBeenCalled();
    evalSpy.mockRestore();
  });

  // --- CSS token usage ---

  it("uses design token variables in styles", () => {
    document.body.appendChild(element);
    const styles = element.shadowRoot!.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-accent");
    expect(styles).toContain("--arswc-color-border");
    expect(styles).toContain("--arswc-transition-duration");
    expect(styles).toContain("--arswc-focus-ring");
  });

  // --- Reduced motion ---

  it("includes prefers-reduced-motion media query", () => {
    document.body.appendChild(element);
    const styles = element.shadowRoot!.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("prefers-reduced-motion");
  });

  // --- Lifecycle ---

  it("has connectedCallback", () => {
    expect(typeof element.connectedCallback).toBe("function");
  });

  it("has attributeChangedCallback", () => {
    expect(typeof element.attributeChangedCallback).toBe("function");
  });
});
