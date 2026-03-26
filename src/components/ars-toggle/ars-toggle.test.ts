/**
 * Tests for ArsToggle
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { ArsToggle } from "./ars-toggle.js";

describe("ArsToggle", () => {
  let element: ArsToggle;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsToggle();
  });

  // --- Registration ---

  it("registers the ars-toggle custom element", () => {
    expect(customElements.get("ars-toggle")).toBe(ArsToggle);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  // --- Default rendering ---

  it("renders a label with role=switch", () => {
    document.body.appendChild(element);
    const label = element.shadowRoot?.querySelector('[role="switch"]');
    expect(label).toBeTruthy();
  });

  it("renders a track and thumb", () => {
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".track")).toBeTruthy();
    expect(element.shadowRoot?.querySelector(".thumb")).toBeTruthy();
  });

  it("defaults to unchecked state", () => {
    document.body.appendChild(element);
    expect(element.checked).toBe(false);
    const label = element.shadowRoot?.querySelector('[role="switch"]');
    expect(label?.getAttribute("aria-checked")).toBe("false");
  });

  // --- Checked state ---

  it("reflects checked attribute to aria-checked", () => {
    element.setAttribute("checked", "");
    document.body.appendChild(element);
    const label = element.shadowRoot?.querySelector('[role="switch"]');
    expect(label?.getAttribute("aria-checked")).toBe("true");
  });

  it("applies track--on class when checked", () => {
    element.setAttribute("checked", "");
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".track--on")).toBeTruthy();
  });

  it("does not have track--on class when unchecked", () => {
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".track--on")).toBeNull();
  });

  it("reflects checked via property setter", () => {
    document.body.appendChild(element);
    element.checked = true;
    expect(element.hasAttribute("checked")).toBe(true);
    expect(element.shadowRoot?.querySelector(".track--on")).toBeTruthy();
  });

  // --- Disabled state ---

  it("sets aria-disabled when disabled", () => {
    element.setAttribute("disabled", "");
    document.body.appendChild(element);
    const label = element.shadowRoot?.querySelector('[role="switch"]');
    expect(label?.getAttribute("aria-disabled")).toBe("true");
  });

  it("adds disabled class to toggle wrapper", () => {
    element.setAttribute("disabled", "");
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".toggle--disabled")).toBeTruthy();
  });

  it("reflects disabled via property setter", () => {
    document.body.appendChild(element);
    element.disabled = true;
    expect(element.hasAttribute("disabled")).toBe(true);
  });

  // --- Label ---

  it("renders label text from the label attribute", () => {
    element.setAttribute("label", "Enable notifications");
    document.body.appendChild(element);
    const labelEl = element.shadowRoot?.querySelector(".label-text");
    expect(labelEl?.textContent).toContain("Enable notifications");
  });

  it("defaults label-position to end", () => {
    document.body.appendChild(element);
    expect(element.labelPosition).toBe("end");
  });

  it("applies label-start class when label-position is start", () => {
    element.setAttribute("label-position", "start");
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".toggle--label-start")).toBeTruthy();
  });

  it("applies label-end class when label-position is end", () => {
    element.setAttribute("label-position", "end");
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".toggle--label-end")).toBeTruthy();
  });

  // --- toggle() method ---

  it("toggles checked state via toggle() method", () => {
    document.body.appendChild(element);
    element.toggle();
    expect(element.checked).toBe(true);
    element.toggle();
    expect(element.checked).toBe(false);
  });

  it("does not toggle when disabled", () => {
    element.setAttribute("disabled", "");
    document.body.appendChild(element);
    element.toggle();
    expect(element.checked).toBe(false);
  });

  // --- Events ---

  it("emits ars-toggle:change with checked detail on toggle", () => {
    document.body.appendChild(element);
    const events: boolean[] = [];
    element.addEventListener("ars-toggle:change", (e) => {
      events.push((e as CustomEvent).detail.checked);
    });

    element.toggle();
    expect(events).toEqual([true]);

    element.toggle();
    expect(events).toEqual([true, false]);
  });

  it("does not emit change event when disabled", () => {
    element.setAttribute("disabled", "");
    document.body.appendChild(element);
    const events: any[] = [];
    element.addEventListener("ars-toggle:change", () => events.push(true));

    element.toggle();
    expect(events).toEqual([]);
  });

  it("emits composed and bubbling events", () => {
    document.body.appendChild(element);
    const events: CustomEvent[] = [];
    document.body.addEventListener("ars-toggle:change", (e) => {
      events.push(e as CustomEvent);
    });

    element.toggle();

    expect(events.length).toBe(1);
    expect(events[0].composed).toBe(true);
    expect(events[0].bubbles).toBe(true);
  });

  // --- Slots ---

  it("provides a default slot for custom label content", () => {
    document.body.appendChild(element);
    const slot = element.shadowRoot?.querySelector("slot");
    expect(slot).toBeTruthy();
  });

  // --- Observed attributes ---

  it("observes the expected attributes", () => {
    expect(ArsToggle.observedAttributes).toContain("checked");
    expect(ArsToggle.observedAttributes).toContain("disabled");
    expect(ArsToggle.observedAttributes).toContain("label");
    expect(ArsToggle.observedAttributes).toContain("label-position");
  });

  // --- CSS token usage ---

  it("uses design token variables in styles", () => {
    document.body.appendChild(element);
    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-accent");
    expect(styles).toContain("--arswc-color-border");
    expect(styles).toContain("--arswc-transition-duration");
    expect(styles).toContain("--arswc-focus-ring");
  });

  // --- Keyboard interaction ---

  it("toggles on Space key", () => {
    document.body.appendChild(element);
    const events: boolean[] = [];
    element.addEventListener("ars-toggle:change", (e) => {
      events.push((e as CustomEvent).detail.checked);
    });

    element.shadowRoot?.querySelector("label")?.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true }),
    );

    expect(events).toEqual([true]);
  });

  it("toggles on Enter key", () => {
    document.body.appendChild(element);
    const events: boolean[] = [];
    element.addEventListener("ars-toggle:change", (e) => {
      events.push((e as CustomEvent).detail.checked);
    });

    element.shadowRoot?.querySelector("label")?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );

    expect(events).toEqual([true]);
  });

  // --- Re-render on attribute change ---

  it("re-renders when checked attribute changes after connection", () => {
    document.body.appendChild(element);
    element.setAttribute("checked", "");
    expect(element.shadowRoot?.querySelector(".track--on")).toBeTruthy();
    element.removeAttribute("checked");
    expect(element.shadowRoot?.querySelector(".track--on")).toBeNull();
  });
});
