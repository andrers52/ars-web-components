/**
 * Tests for ArsToolbar
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { ArsToolbar } from "./ars-toolbar.js";

describe("ArsToolbar", () => {
  let element: ArsToolbar;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsToolbar();
  });

  // --- Registration ---

  it("registers the ars-toolbar custom element", () => {
    expect(customElements.get("ars-toolbar")).toBe(ArsToolbar);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  // --- Default rendering ---

  it("renders the toolbar structure inside shadow DOM", () => {
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".toolbar")).toBeTruthy();
    expect(element.shadowRoot?.querySelector(".brand")).toBeTruthy();
    expect(element.shadowRoot?.querySelector("nav")).toBeTruthy();
    // Status pill is rendered when status is non-empty.
    expect(element.shadowRoot?.querySelector(".status")).toBeNull();
  });

  it("defaults title to empty string", () => {
    expect(element.title).toBe("");
  });

  it("defaults subtitle to empty string", () => {
    expect(element.subtitle).toBe("");
  });

  it("defaults status to empty string", () => {
    expect(element.status).toBe("");
  });

  it("defaults activeItem to empty string", () => {
    expect(element.activeItem).toBe("");
  });

  it("defaults items to empty array", () => {
    expect(element.items).toEqual([]);
  });

  // --- Title attribute/property ---

  it("reflects the title attribute to the brand area", () => {
    element.setAttribute("title", "My App");
    document.body.appendChild(element);
    const titleEl = element.shadowRoot?.querySelector(".brand-title");
    expect(titleEl?.textContent).toBe("My App");
  });

  it("updates the title via property setter", () => {
    document.body.appendChild(element);
    element.title = "New App";
    const titleEl = element.shadowRoot?.querySelector(".brand-title");
    expect(titleEl?.textContent).toBe("New App");
  });

  // --- Subtitle attribute/property ---

  it("shows subtitle when attribute is set", () => {
    element.setAttribute("subtitle", "v1.0");
    document.body.appendChild(element);
    const subtitleEl = element.shadowRoot?.querySelector(".brand-subtitle");
    expect(subtitleEl?.textContent).toBe("v1.0");
  });

  it("updates the subtitle via property setter", () => {
    document.body.appendChild(element);
    element.subtitle = "beta";
    const subtitleEl = element.shadowRoot?.querySelector(".brand-subtitle");
    expect(subtitleEl?.textContent).toBe("beta");
  });

  // --- Status attribute/property ---

  it("reflects the status attribute to the status pill", () => {
    element.setAttribute("status", "Online");
    document.body.appendChild(element);
    const statusEl = element.shadowRoot?.querySelector(".status");
    expect(statusEl?.textContent).toContain("Online");
  });

  it("updates the status via property setter", () => {
    document.body.appendChild(element);
    element.status = "Busy";
    const statusEl = element.shadowRoot?.querySelector(".status");
    expect(statusEl?.textContent).toContain("Busy");
  });

  // --- Active item attribute/property ---

  it("reflects the active-item attribute to the nav button state", () => {
    element.items = [
      { id: "home", label: "Home" },
      { id: "settings", label: "Settings" },
    ];
    element.setAttribute("active-item", "settings");
    document.body.appendChild(element);
    const buttons = element.shadowRoot?.querySelectorAll(".nav-item");
    expect(buttons?.[0]?.getAttribute("data-active")).toBe("false");
    expect(buttons?.[1]?.getAttribute("data-active")).toBe("true");
  });

  it("updates active item via property setter", () => {
    element.items = [{ id: "a", label: "A" }];
    document.body.appendChild(element);
    element.activeItem = "a";
    const button = element.shadowRoot?.querySelector(".nav-item");
    expect(button?.getAttribute("data-active")).toBe("true");
  });

  // --- Items property ---

  it("renders nav items when set via property", () => {
    document.body.appendChild(element);
    element.items = [
      { id: "graph", label: "Graph" },
      { id: "calendar", label: "Calendar" },
    ];
    const buttons = element.shadowRoot?.querySelectorAll(".nav-item");
    expect(buttons?.length).toBe(2);
    expect(buttons?.[0]?.textContent).toBe("Graph");
    expect(buttons?.[1]?.textContent).toBe("Calendar");
  });

  it("stores item data-id on nav buttons", () => {
    document.body.appendChild(element);
    element.items = [{ id: "x", label: "X" }];
    const button = element.shadowRoot?.querySelector(".nav-item");
    expect(button?.getAttribute("data-item-id")).toBe("x");
  });

  it("does not mutate the original items array", () => {
    const original = [{ id: "a", label: "A" }];
    element.items = original;
    original[0].label = "B";
    expect(element.items[0].label).toBe("A");
  });

  // --- Events: navigate ---

  it("emits ars-toolbar:navigate when a nav item is clicked", () => {
    element.items = [
      { id: "home", label: "Home" },
      { id: "away", label: "Away" },
    ];
    document.body.appendChild(element);

    const events: unknown[] = [];
    element.addEventListener("ars-toolbar:navigate", (e) => {
      events.push((e as CustomEvent).detail);
    });

    const buttons = element.shadowRoot?.querySelectorAll(".nav-item");
    buttons?.[1]?.dispatchEvent(new MouseEvent("click"));

    expect(events).toEqual([{ id: "away" }]);
  });

  it("dispatches composed navigate events", () => {
    element.items = [{ id: "a", label: "A" }];
    document.body.appendChild(element);

    let composed = false;
    element.addEventListener("ars-toolbar:navigate", (e) => {
      composed = (e as CustomEvent).composed;
    });

    element.shadowRoot?.querySelector(".nav-item")?.dispatchEvent(new MouseEvent("click"));

    expect(composed).toBe(true);
  });

  // --- Slots ---

  it("provides a brand-mark slot", () => {
    document.body.appendChild(element);
    const slot = element.shadowRoot?.querySelector('slot[name="brand-mark"]');
    expect(slot).toBeTruthy();
  });

  it("provides a status slot when status is set", () => {
    element.setAttribute("status", "Active");
    document.body.appendChild(element);
    const slot = element.shadowRoot?.querySelector('slot[name="status"]');
    expect(slot).toBeTruthy();
  });

  // --- Observed attributes ---

  it("observes the expected attributes", () => {
    expect(ArsToolbar.observedAttributes).toContain("title");
    expect(ArsToolbar.observedAttributes).toContain("subtitle");
    expect(ArsToolbar.observedAttributes).toContain("status");
    expect(ArsToolbar.observedAttributes).toContain("active-item");
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
    expect(styles).toContain("--arswc-button-primary-bg-start");
    expect(styles).toContain("--arswc-font-family-sans");
    expect(styles).toContain("--arswc-spacing-sm");
    expect(styles).toContain("--arswc-spacing-md");
    expect(styles).toContain("--arswc-radius-md");
    expect(styles).toContain("--arswc-transition-duration");
  });

  // --- Re-render on attribute change ---

  it("re-renders when status changes after connection", () => {
    document.body.appendChild(element);
    element.setAttribute("status", "Updated");
    const statusEl = element.shadowRoot?.querySelector(".status");
    expect(statusEl?.textContent).toContain("Updated");
  });
});
