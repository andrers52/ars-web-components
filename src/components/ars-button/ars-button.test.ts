/**
 * Tests for ArsButton
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { ArsButton } from "./ars-button.js";

describe("ArsButton", () => {
  let element: ArsButton;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsButton();
  });

  // --- Registration ---

  it("registers the ars-button custom element", () => {
    expect(customElements.get("ars-button")).toBe(ArsButton);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  // --- Default rendering ---

  it("renders a native button element inside shadow DOM", () => {
    document.body.appendChild(element);
    const btn = element.shadowRoot?.querySelector("button");
    expect(btn).toBeTruthy();
  });

  it("defaults to primary variant, md size, and button type", () => {
    document.body.appendChild(element);
    const btn = element.shadowRoot?.querySelector("button");
    expect(btn?.classList.contains("btn--primary")).toBe(true);
    expect(btn?.classList.contains("btn--md")).toBe(true);
    expect(btn?.getAttribute("type")).toBe("button");
  });

  // --- Variant attribute/property ---

  it("reflects the variant attribute to the internal button class", () => {
    element.setAttribute("variant", "danger");
    document.body.appendChild(element);
    const btn = element.shadowRoot?.querySelector("button");
    expect(btn?.classList.contains("btn--danger")).toBe(true);
  });

  it("updates the variant via property setter", () => {
    document.body.appendChild(element);
    element.variant = "ghost";
    const btn = element.shadowRoot?.querySelector("button");
    expect(btn?.classList.contains("btn--ghost")).toBe(true);
  });

  it("supports all four variant values", () => {
    document.body.appendChild(element);
    for (const variant of ["primary", "secondary", "danger", "ghost"] as const) {
      element.variant = variant;
      const btn = element.shadowRoot?.querySelector("button");
      expect(btn?.classList.contains(`btn--${variant}`)).toBe(true);
    }
  });

  // --- Size attribute/property ---

  it("reflects the size attribute to the internal button class", () => {
    element.setAttribute("size", "lg");
    document.body.appendChild(element);
    const btn = element.shadowRoot?.querySelector("button");
    expect(btn?.classList.contains("btn--lg")).toBe(true);
  });

  it("updates the size via property setter", () => {
    document.body.appendChild(element);
    element.size = "sm";
    const btn = element.shadowRoot?.querySelector("button");
    expect(btn?.classList.contains("btn--sm")).toBe(true);
  });

  // --- Disabled state ---

  it("disables the internal button when disabled attribute is set", () => {
    element.setAttribute("disabled", "");
    document.body.appendChild(element);
    const btn = element.shadowRoot?.querySelector("button");
    expect(btn?.hasAttribute("disabled")).toBe(true);
    expect(btn?.getAttribute("aria-disabled")).toBe("true");
  });

  it("enables the button when disabled attribute is removed", () => {
    element.setAttribute("disabled", "");
    document.body.appendChild(element);
    element.removeAttribute("disabled");
    const btn = element.shadowRoot?.querySelector("button");
    expect(btn?.hasAttribute("disabled")).toBe(false);
  });

  it("reflects disabled via property setter", () => {
    document.body.appendChild(element);
    element.disabled = true;
    expect(element.hasAttribute("disabled")).toBe(true);
    element.disabled = false;
    expect(element.hasAttribute("disabled")).toBe(false);
  });

  // --- Loading state ---

  it("shows a spinner when loading attribute is set", () => {
    element.setAttribute("loading", "");
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".spinner")).toBeTruthy();
  });

  it("sets aria-busy on the button when loading", () => {
    element.setAttribute("loading", "");
    document.body.appendChild(element);
    const btn = element.shadowRoot?.querySelector("button");
    expect(btn?.getAttribute("aria-busy")).toBe("true");
  });

  it("does not show a spinner when not loading", () => {
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".spinner")).toBeNull();
  });

  it("reflects loading via property setter", () => {
    document.body.appendChild(element);
    element.loading = true;
    expect(element.hasAttribute("loading")).toBe(true);
    expect(element.shadowRoot?.querySelector(".spinner")).toBeTruthy();
  });

  // --- Type attribute ---

  it("sets the internal button type attribute", () => {
    element.setAttribute("type", "submit");
    document.body.appendChild(element);
    const btn = element.shadowRoot?.querySelector("button");
    expect(btn?.getAttribute("type")).toBe("submit");
  });

  it("reflects type via property setter", () => {
    document.body.appendChild(element);
    element.type = "reset";
    const btn = element.shadowRoot?.querySelector("button");
    expect(btn?.getAttribute("type")).toBe("reset");
  });

  // --- Events ---

  it("emits ars-button:click composed event on click", () => {
    document.body.appendChild(element);
    const clicks: string[] = [];
    element.addEventListener("ars-button:click", (e) => {
      clicks.push((e as CustomEvent).detail.variant);
    });

    element.shadowRoot?.querySelector("button")?.click();

    expect(clicks).toEqual(["primary"]);
  });

  it("includes the current variant in the click event detail", () => {
    element.setAttribute("variant", "danger");
    document.body.appendChild(element);
    const details: any[] = [];
    element.addEventListener("ars-button:click", (e) => {
      details.push((e as CustomEvent).detail);
    });

    element.shadowRoot?.querySelector("button")?.click();

    expect(details[0].variant).toBe("danger");
  });

  it("does not emit ars-button:click when disabled", () => {
    element.setAttribute("disabled", "");
    document.body.appendChild(element);
    const clicks: any[] = [];
    element.addEventListener("ars-button:click", () => {
      clicks.push(true);
    });

    element.shadowRoot?.querySelector("button")?.click();

    expect(clicks).toEqual([]);
  });

  it("does not emit ars-button:click when loading", () => {
    element.setAttribute("loading", "");
    document.body.appendChild(element);
    const clicks: any[] = [];
    element.addEventListener("ars-button:click", () => {
      clicks.push(true);
    });

    element.shadowRoot?.querySelector("button")?.click();

    expect(clicks).toEqual([]);
  });

  // --- Slots ---

  it("provides a default slot for label content", () => {
    document.body.appendChild(element);
    const slot = element.shadowRoot?.querySelector("slot:not([name])");
    expect(slot).toBeTruthy();
  });

  it("provides a prefix slot", () => {
    document.body.appendChild(element);
    const slot = element.shadowRoot?.querySelector('slot[name="prefix"]');
    expect(slot).toBeTruthy();
  });

  it("provides a suffix slot", () => {
    document.body.appendChild(element);
    const slot = element.shadowRoot?.querySelector('slot[name="suffix"]');
    expect(slot).toBeTruthy();
  });

  // --- Observed attributes ---

  it("observes the expected attributes", () => {
    expect(ArsButton.observedAttributes).toContain("variant");
    expect(ArsButton.observedAttributes).toContain("size");
    expect(ArsButton.observedAttributes).toContain("disabled");
    expect(ArsButton.observedAttributes).toContain("loading");
    expect(ArsButton.observedAttributes).toContain("type");
  });

  // --- CSS token usage ---

  it("uses design token variables in styles", () => {
    document.body.appendChild(element);
    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-button-primary-bg-start");
    expect(styles).toContain("--arswc-color-danger");
    expect(styles).toContain("--arswc-color-disabled");
    expect(styles).toContain("--arswc-focus-ring");
    expect(styles).toContain("--arswc-transition-duration");
    expect(styles).toContain("--arswc-radius-sm");
  });

  // --- Re-render on attribute change ---

  it("re-renders when an attribute changes after connection", () => {
    document.body.appendChild(element);
    element.setAttribute("variant", "secondary");
    const btn = element.shadowRoot?.querySelector("button");
    expect(btn?.classList.contains("btn--secondary")).toBe(true);
  });
});
