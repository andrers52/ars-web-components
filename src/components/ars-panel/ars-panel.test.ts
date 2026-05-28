/**
 * Tests for ArsPanel
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ArsPanel } from "./ars-panel.js";

describe("ArsPanel", () => {
  let element: ArsPanel;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsPanel();
  });

  it("registers the ars-panel custom element", () => {
    expect(customElements.get("ars-panel")).toBe(ArsPanel);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  it("defaults to md padding", () => {
    document.body.appendChild(element);
    const panel = element.shadowRoot?.querySelector(".panel");
    expect(panel?.classList.contains("panel--padding-md")).toBe(true);
  });

  it("reflects padding attribute", () => {
    element.setAttribute("padding", "lg");
    document.body.appendChild(element);
    const panel = element.shadowRoot?.querySelector(".panel");
    expect(panel?.classList.contains("panel--padding-lg")).toBe(true);
  });

  it("applies elevated class when elevated attribute is set", () => {
    element.setAttribute("elevated", "");
    document.body.appendChild(element);
    const panel = element.shadowRoot?.querySelector(".panel");
    expect(panel?.classList.contains("panel--elevated")).toBe(true);
  });

  it("renders slotted content", () => {
    element.innerHTML = "<span>Content</span>";
    document.body.appendChild(element);
    const slot = element.shadowRoot?.querySelector("slot");
    expect(slot).toBeTruthy();
  });
});
