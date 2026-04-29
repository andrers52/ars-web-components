/**
 * Tests for ArsBottomNav and ArsBottomNavItem
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ArsBottomNav, ArsBottomNavItem } from "./ars-bottom-nav.js";

describe("ArsBottomNav", () => {
  let nav: ArsBottomNav;

  beforeEach(() => {
    document.body.innerHTML = "";
    nav = new ArsBottomNav();
  });

  it("registers the ars-bottom-nav custom element", () => {
    expect(customElements.get("ars-bottom-nav")).toBe(ArsBottomNav);
    expect(customElements.get("ars-bottom-nav-item")).toBe(ArsBottomNavItem);
  });

  it("creates a shadow root on construction", () => {
    expect(nav.shadowRoot).toBeTruthy();
  });

  it("synchronizes active state to child items", () => {
    nav.innerHTML = `
      <ars-bottom-nav-item value="home" active>Home</ars-bottom-nav-item>
      <ars-bottom-nav-item value="map">Map</ars-bottom-nav-item>
    `;
    nav.setAttribute("value", "map");
    document.body.appendChild(nav);

    const items = nav.querySelectorAll<ArsBottomNavItem>("ars-bottom-nav-item");
    expect(items[0].active).toBe(false);
    expect(items[1].active).toBe(true);
  });

  it("emits ars-bottom-nav:change when value changes", () => {
    document.body.appendChild(nav);
    const changes: any[] = [];
    nav.addEventListener("ars-bottom-nav:change", (e) => {
      changes.push((e as CustomEvent).detail);
    });

    nav.value = "map";

    expect(changes.length).toBe(1);
    expect(changes[0].value).toBe("map");
  });

  it("uses design token variables in styles", () => {
    document.body.appendChild(nav);
    const styles = nav.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-surface");
    expect(styles).toContain("--arswc-color-border");
  });
});

describe("ArsBottomNavItem", () => {
  let item: ArsBottomNavItem;

  beforeEach(() => {
    document.body.innerHTML = "";
    item = new ArsBottomNavItem();
  });

  it("creates a shadow root on construction", () => {
    expect(item.shadowRoot).toBeTruthy();
  });

  it("renders active state", () => {
    item.setAttribute("active", "");
    document.body.appendChild(item);
    const btn = item.shadowRoot?.querySelector(".item");
    expect(btn?.classList.contains("item--active")).toBe(true);
    expect(btn?.getAttribute("aria-selected")).toBe("true");
  });

  it("emits ars-bottom-nav-item:select on click", () => {
    item.setAttribute("value", "home");
    document.body.appendChild(item);
    const selections: any[] = [];
    item.addEventListener("ars-bottom-nav-item:select", (e) => {
      selections.push((e as CustomEvent).detail);
    });

    item.shadowRoot?.querySelector("button")?.click();

    expect(selections.length).toBe(1);
    expect(selections[0].value).toBe("home");
  });

  it("reflects value attribute", () => {
    item.setAttribute("value", "profile");
    expect(item.value).toBe("profile");
    item.value = "settings";
    expect(item.getAttribute("value")).toBe("settings");
  });
});
