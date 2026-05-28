/**
 * Tests for ArsList
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ArsList } from "./ars-list.js";

describe("ArsList", () => {
  let element: ArsList;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsList();
  });

  it("registers the ars-list custom element", () => {
    expect(customElements.get("ars-list")).toBe(ArsList);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  it("does not dispatch select event when not selectable", () => {
    element.innerHTML = "<span>Item</span>";
    document.body.appendChild(element);

    let fired = false;
    element.addEventListener("ars-list:select", () => { fired = true; });

    const item = element.querySelector("span");
    item?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(fired).toBe(false);
  });

  it("dispatches ars-list:select when selectable and item clicked", () => {
    element.setAttribute("selectable", "");
    element.innerHTML = "<span>Item 1</span><span>Item 2</span>";
    document.body.appendChild(element);

    let detail: unknown;
    element.addEventListener("ars-list:select", (e) => {
      detail = (e as CustomEvent).detail;
    });

    const items = element.querySelectorAll("span");
    items[1]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(detail).toBeTruthy();
    expect((detail as Record<string, unknown>).index).toBe(1);
  });
});
