/**
 * Tests for ArsDataRoller
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArsDataRoller } from "./ars-data-roller.js";

describe("ArsDataRoller", () => {
  let element: ArsDataRoller;

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
    element = new ArsDataRoller();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Ensure any attached element is cleaned up and intervals stopped
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  // --- Registration ---

  it("registers the ars-data-roller custom element", () => {
    expect(customElements.get("ars-data-roller")).toBe(ArsDataRoller);
  });

  it("creates a shadow root when attached to DOM", () => {
    document.body.appendChild(element);
    expect(element.shadowRoot).toBeTruthy();
  });

  // --- Default values ---

  it("has correct default property values", () => {
    expect(element.data).toEqual([]);
    expect(element.currentIndex).toBe(0);
    expect(element.intervalMs).toBe(3000);
    expect(element.animationDuration).toBe(500);
    expect(element.animating).toBe(false);
    expect(element.interval).toBeNull();
  });

  // --- Data parsing & rendering ---

  describe("data rendering", () => {
    beforeEach(() => {
      document.body.appendChild(element);
    });

    it("renders a string array", () => {
      element.setAttribute("data", '["Hello", "World"]');
      const current = element.shadowRoot!.querySelector(".roller-item.current");
      expect(current!.textContent).toContain("Hello");
    });

    it("renders title-value objects", () => {
      element.setAttribute(
        "data",
        '[{"title": "CPU", "value": "45%"}, {"title": "RAM", "value": "2GB"}]',
      );
      const current = element.shadowRoot!.querySelector(".roller-item.current");
      expect(current!.innerHTML).toContain("CPU:");
      expect(current!.innerHTML).toContain("45%");
    });

    it("renders generic key-value objects", () => {
      element.setAttribute(
        "data",
        '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]',
      );
      const current = element.shadowRoot!.querySelector(".roller-item.current");
      expect(current!.innerHTML).toContain("name:");
      expect(current!.innerHTML).toContain("Alice");
    });

    it("renders numbers and booleans via JSON.stringify fallback", () => {
      element.setAttribute("data", "[42, true]");
      const current = element.shadowRoot!.querySelector(".roller-item.current");
      expect(current!.textContent).toContain("42");
    });

    it("gracefully handles empty data array", () => {
      element.setAttribute("data", "[]");
      const current = element.shadowRoot!.querySelector(".roller-item.current");
      // Should render empty string without throwing
      expect(current).toBeTruthy();
    });

    it("gracefully handles invalid JSON in data attribute", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      element.setAttribute("data", "not-valid-json");
      expect(element.data).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // --- Public API ---

  describe("public API", () => {
    beforeEach(() => {
      document.body.appendChild(element);
      element.setAttribute("data", '["A", "B", "C"]');
    });

    it("setData updates the data attribute", () => {
      element.setData(["X", "Y"]);
      expect(element.getAttribute("data")).toBe('["X","Y"]');
    });

    it("setData does not update when data is unchanged", () => {
      element.setData(["A", "B", "C"]);
      // data attribute was already set to the same value
      expect(element.getAttribute("data")).toBe('["A","B","C"]');
    });

    it("setInterval updates the interval attribute", () => {
      element.setInterval(1500);
      expect(element.getAttribute("interval")).toBe("1500");
    });

    it("setAnimationDuration updates the animation-duration attribute", () => {
      element.setAnimationDuration(800);
      expect(element.getAttribute("animation-duration")).toBe("800");
    });

    it("startRolling begins auto-rotation with interval", () => {
      element.stopRolling(); // stop the auto-started interval
      vi.useFakeTimers();
      element.startRolling();
      expect(element.interval).not.toBeNull();
      // Advance past interval + animation setTimeouts
      vi.advanceTimersByTime(3000 + 20 + 600);
      // After one interval, currentIndex should have advanced
      expect(element.currentIndex).toBe(1);
      vi.useRealTimers();
    });

    it("stopRolling clears the interval", () => {
      vi.useFakeTimers();
      element.startRolling();
      expect(element.interval).not.toBeNull();
      element.stopRolling();
      expect(element.interval).toBeNull();
      vi.useRealTimers();
    });

    it("restartRolling stops then starts rolling", () => {
      vi.useFakeTimers();
      element.startRolling();
      const firstInterval = element.interval;
      element.restartRolling();
      expect(element.interval).not.toBeNull();
      expect(element.interval).not.toBe(firstInterval);
      vi.useRealTimers();
    });

    it("nextItem advances to the next data item", () => {
      vi.useFakeTimers();
      expect(element.currentIndex).toBe(0);
      element.nextItem();
      // Animation is async (setTimeout x2), advance past both
      vi.advanceTimersByTime(600);
      expect(element.currentIndex).toBe(1);
      vi.useRealTimers();
    });

    it("nextItem wraps around to index 0 after the last item", () => {
      vi.useFakeTimers();
      element.currentIndex = 2; // last item
      element.nextItem();
      vi.advanceTimersByTime(600);
      expect(element.currentIndex).toBe(0);
      vi.useRealTimers();
    });

    it("nextItem is a no-op when data has fewer than 2 items", () => {
      element.setAttribute("data", '["OnlyOne"]');
      expect(element.currentIndex).toBe(0);
      element.nextItem();
      expect(element.currentIndex).toBe(0);
    });

    it("nextItem is a no-op while animating", () => {
      vi.useFakeTimers();
      element.nextItem();
      expect(element.animating).toBe(true);
      const indexAfterFirst = element.currentIndex;
      element.nextItem(); // should be ignored
      expect(element.currentIndex).toBe(indexAfterFirst);
      vi.useRealTimers();
    });
  });

  // --- Attribute changes ---

  describe("attribute changes", () => {
    beforeEach(() => {
      document.body.appendChild(element);
      element.setAttribute("data", '["A", "B", "C"]');
    });

    it("changing data resets currentIndex to 0", () => {
      element.currentIndex = 2;
      element.setAttribute("data", '["X", "Y"]');
      expect(element.currentIndex).toBe(0);
    });

    it("changing interval restarts rolling", () => {
      element.stopRolling();
      vi.useFakeTimers();
      element.setAttribute("interval", "1000");
      expect(element.intervalMs).toBe(1000);
      // Advance past new interval + animation setTimeouts
      vi.advanceTimersByTime(1000 + 20 + 600);
      expect(element.currentIndex).toBe(1);
      vi.useRealTimers();
    });

    it("changing animation-duration updates the property", () => {
      element.setAttribute("animation-duration", "750");
      expect(element.animationDuration).toBe(750);
    });

    it("ignores attribute changes when oldVal === newVal", () => {
      const callbackSpy = vi.fn();
      element.addEventListener("ars-data-roller:change", callbackSpy);
      // Same value set twice — attributeChangedCallback short-circuits on oldVal === newVal
      element.setAttribute("data", '["A", "B", "C"]');
      const dataAfterFirst = element.data;
      element.setAttribute("data", '["A", "B", "C"]');
      // Data should be unchanged (no re-parse)
      expect(element.data).toEqual(dataAfterFirst);
    });
  });

  // --- Lifecycle ---

  describe("lifecycle", () => {
    it("connectedCallback initializes roller and starts rolling", () => {
      element.setAttribute("data", '["A", "B"]');
      document.body.appendChild(element);
      expect(element.shadowRoot!.querySelector(".roller-item.current")).toBeTruthy();
      expect(element.interval).not.toBeNull();
    });

    it("does not start interval for single-item data", () => {
      element.setAttribute("data", '["Only"]');
      document.body.appendChild(element);
      expect(element.interval).toBeNull();
    });

    it("disconnectedCallback stops the interval", () => {
      element.setAttribute("data", '["A", "B"]');
      document.body.appendChild(element);
      expect(element.interval).not.toBeNull();
      document.body.removeChild(element);
      expect(element.interval).toBeNull();
    });
  });

  // --- Shadow DOM structure ---

  describe("shadow DOM", () => {
    beforeEach(() => {
      document.body.appendChild(element);
    });

    it("contains the roller container", () => {
      const container = element.shadowRoot!.querySelector(".roller-container");
      expect(container).toBeTruthy();
    });

    it("contains current and next roller items", () => {
      const current = element.shadowRoot!.querySelector(".roller-item.current");
      const next = element.shadowRoot!.querySelector(".roller-item.next");
      expect(current).toBeTruthy();
      expect(next).toBeTruthy();
    });

    it("uses CSS custom properties for theming", () => {
      const style = element.shadowRoot!.querySelector("style");
      expect(style).toBeTruthy();
      expect(style!.textContent).toContain("--ars-roller-bg");
      expect(style!.textContent).toContain("--ars-roller-color");
      expect(style!.textContent).toContain("--ars-roller-label-color");
    });
  });

  // --- Edge cases ---

  describe("edge cases", () => {
    it("handles data set before DOM attachment", () => {
      element.setAttribute("data", '["X", "Y"]');
      // Not yet in DOM — no shadowRoot querySelector errors
      expect(() => {
        document.body.appendChild(element);
      }).not.toThrow();
      const current = element.shadowRoot!.querySelector(".roller-item.current");
      expect(current!.textContent).toContain("X");
    });

    it("handles rapid setData calls", () => {
      document.body.appendChild(element);
      element.setData(["A"]);
      element.setData(["B"]);
      element.setData(["C"]);
      expect(element.data).toEqual(["C"]);
    });

    it("parses interval and animation-duration with fallback on invalid values", () => {
      document.body.appendChild(element);
      element.setAttribute("interval", "not-a-number");
      expect(element.intervalMs).toBe(3000);
      element.setAttribute("animation-duration", "also-not");
      expect(element.animationDuration).toBe(500);
    });
  });
});
