/**
 * Tests for ArsPropertyEditor
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { ArsPropertyEditor } from "./ars-property-editor.js";

describe("ArsPropertyEditor", () => {
  let element: ArsPropertyEditor;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsPropertyEditor();
  });

  // --- Registration ---

  it("registers the ars-property-editor custom element", () => {
    expect(customElements.get("ars-property-editor")).toBe(ArsPropertyEditor);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  // --- Default rendering ---

  it("renders the editor structure inside shadow DOM", () => {
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".editor")).toBeTruthy();
    expect(element.shadowRoot?.querySelector(".property-toolbar")).toBeTruthy();
    expect(element.shadowRoot?.querySelector(".property-list")).toBeTruthy();
    expect(element.shadowRoot?.querySelector(".add-btn")).toBeTruthy();
  });

  it("defaults properties to empty object", () => {
    expect(element.properties).toEqual({});
  });

  it("defaults readonly to false", () => {
    expect(element.readonly).toBe(false);
  });

  // --- Properties attribute/property ---

  it("renders property rows when set via property", () => {
    document.body.appendChild(element);
    element.properties = { name: "Alice", role: "admin" };
    const rows = element.shadowRoot?.querySelectorAll(".property-row");
    expect(rows?.length).toBe(2);
  });

  it("populates key and value inputs from properties", () => {
    document.body.appendChild(element);
    element.properties = { key1: "val1" };
    const keyInput = element.shadowRoot?.querySelector<HTMLInputElement>(".prop-key");
    const valInput = element.shadowRoot?.querySelector<HTMLInputElement>(".prop-value");
    expect(keyInput?.value).toBe("key1");
    expect(valInput?.value).toBe("val1");
  });

  it("does not mutate the original properties object", () => {
    const original = { a: "1" };
    element.properties = original;
    original.a = "2";
    expect(element.properties.a).toBe("1");
  });

  // --- Readonly attribute/property ---

  it("hides add and remove buttons when readonly is true", () => {
    element.setAttribute("readonly", "");
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".add-btn")).toBeNull();
    expect(element.shadowRoot?.querySelector(".remove-property-btn")).toBeNull();
  });

  it("marks inputs as readonly when readonly is true", () => {
    element.properties = { key: "value" };
    element.setAttribute("readonly", "");
    document.body.appendChild(element);
    const keyInput = element.shadowRoot?.querySelector<HTMLInputElement>(".prop-key");
    expect(keyInput?.hasAttribute("readonly")).toBe(true);
  });

  it("shows empty hint when readonly and no properties", () => {
    element.setAttribute("readonly", "");
    document.body.appendChild(element);
    expect(element.shadowRoot?.textContent).toContain("No properties");
  });

  it("reflects readonly via property setter", () => {
    document.body.appendChild(element);
    element.readonly = true;
    expect(element.hasAttribute("readonly")).toBe(true);
    element.readonly = false;
    expect(element.hasAttribute("readonly")).toBe(false);
  });

  // --- Public API: addProperty ---

  it("adds a new row via addProperty()", () => {
    document.body.appendChild(element);
    element.addProperty("newKey", "newValue");
    const rows = element.shadowRoot?.querySelectorAll(".property-row");
    expect(rows?.length).toBe(1);
    const keyInput = rows?.[0]?.querySelector<HTMLInputElement>(".prop-key");
    const valInput = rows?.[0]?.querySelector<HTMLInputElement>(".prop-value");
    expect(keyInput?.value).toBe("newKey");
    expect(valInput?.value).toBe("newValue");
  });

  it("dispatches change event after addProperty()", () => {
    document.body.appendChild(element);
    const events: unknown[] = [];
    element.addEventListener("ars-property-editor:change", (e) => {
      events.push((e as CustomEvent).detail);
    });
    element.addProperty("k", "v");
    expect(events.length).toBeGreaterThan(0);
    expect(events[events.length - 1]).toEqual({ properties: { k: "v" } });
  });

  // --- Public API: removeProperty ---

  it("removes a row via removeProperty()", () => {
    document.body.appendChild(element);
    element.properties = { a: "1", b: "2" };
    element.removeProperty("a");
    const rows = element.shadowRoot?.querySelectorAll(".property-row");
    expect(rows?.length).toBe(1);
    const keyInput = rows?.[0]?.querySelector<HTMLInputElement>(".prop-key");
    expect(keyInput?.value).toBe("b");
  });

  // --- Dynamic add/remove via UI ---

  it("adds a row when Add Property is clicked", () => {
    document.body.appendChild(element);
    element.shadowRoot?.querySelector<HTMLButtonElement>(".add-btn")?.click();
    const rows = element.shadowRoot?.querySelectorAll(".property-row");
    expect(rows?.length).toBe(1);
  });

  it("removes a row when Remove is clicked", () => {
    document.body.appendChild(element);
    element.properties = { a: "1", b: "2" };
    const removeBtns = element.shadowRoot?.querySelectorAll(".remove-property-btn");
    (removeBtns?.[0] as HTMLButtonElement)?.click();
    const rows = element.shadowRoot?.querySelectorAll(".property-row");
    expect(rows?.length).toBe(1);
  });

  // --- Change events ---

  it("dispatches change event when a key is edited", () => {
    document.body.appendChild(element);
    element.addProperty("old", "val");

    const events: unknown[] = [];
    element.addEventListener("ars-property-editor:change", (e) => {
      events.push((e as CustomEvent).detail);
    });

    const keyInput = element.shadowRoot?.querySelector<HTMLInputElement>(".prop-key");
    if (keyInput) {
      keyInput.value = "new";
      keyInput.dispatchEvent(new Event("input"));
    }

    expect(events.length).toBeGreaterThan(0);
    expect(events[events.length - 1]).toEqual({ properties: { new: "val" } });
  });

  it("dispatches change event when a value is edited", () => {
    document.body.appendChild(element);
    element.addProperty("key", "old");

    const events: unknown[] = [];
    element.addEventListener("ars-property-editor:change", (e) => {
      events.push((e as CustomEvent).detail);
    });

    const valInput = element.shadowRoot?.querySelector<HTMLInputElement>(".prop-value");
    if (valInput) {
      valInput.value = "new";
      valInput.dispatchEvent(new Event("input"));
    }

    expect(events.length).toBeGreaterThan(0);
    expect(events[events.length - 1]).toEqual({ properties: { key: "new" } });
  });

  it("dispatches composed change events", () => {
    document.body.appendChild(element);
    let composed = false;
    element.addEventListener("ars-property-editor:change", (e) => {
      composed = (e as CustomEvent).composed;
    });
    element.addProperty("k", "v");
    expect(composed).toBe(true);
  });

  it("skips empty keys when syncing properties", () => {
    document.body.appendChild(element);
    element.addProperty("", "noKey");
    expect(element.properties).toEqual({});
  });

  // --- Observed attributes ---

  it("observes the expected attributes", () => {
    expect(ArsPropertyEditor.observedAttributes).toContain("readonly");
  });

  // --- CSS token usage ---

  it("uses design token variables in styles", () => {
    document.body.appendChild(element);
    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-surface");
    expect(styles).toContain("--arswc-color-border");
    expect(styles).toContain("--arswc-color-text");
    expect(styles).toContain("--arswc-color-muted");
    expect(styles).toContain("--arswc-color-bg");
    expect(styles).toContain("--arswc-color-danger");
    expect(styles).toContain("--arswc-color-disabled");
    expect(styles).toContain("--arswc-font-family-sans");
    expect(styles).toContain("--arswc-spacing-sm");
    expect(styles).toContain("--arswc-spacing-md");
    expect(styles).toContain("--arswc-radius-sm");
    expect(styles).toContain("--arswc-focus-ring");
  });

  // --- Re-render on attribute change ---

  it("re-renders when readonly changes after connection", () => {
    document.body.appendChild(element);
    element.setAttribute("readonly", "");
    expect(element.shadowRoot?.querySelector(".add-btn")).toBeNull();
  });
});
