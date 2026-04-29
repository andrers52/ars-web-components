/**
 * Tests for ArsBadge
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ArsBadge } from "./ars-badge.js";

describe("ArsBadge", () => {
  let element: ArsBadge;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsBadge();
  });

  it("registers the ars-badge custom element", () => {
    expect(customElements.get("ars-badge")).toBe(ArsBadge);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  it("defaults to neutral variant and md size", () => {
    document.body.appendChild(element);
    const badge = element.shadowRoot?.querySelector(".badge");
    expect(badge?.classList.contains("badge--neutral")).toBe(true);
    expect(badge?.classList.contains("badge--md")).toBe(true);
  });

  it("reflects the variant attribute", () => {
    element.setAttribute("variant", "success");
    document.body.appendChild(element);
    const badge = element.shadowRoot?.querySelector(".badge");
    expect(badge?.classList.contains("badge--success")).toBe(true);
  });

  it("reflects the size attribute", () => {
    element.setAttribute("size", "lg");
    document.body.appendChild(element);
    const badge = element.shadowRoot?.querySelector(".badge");
    expect(badge?.classList.contains("badge--lg")).toBe(true);
  });

  it("applies pill class when pill attribute is set", () => {
    element.setAttribute("pill", "");
    document.body.appendChild(element);
    const badge = element.shadowRoot?.querySelector(".badge");
    expect(badge?.classList.contains("badge--pill")).toBe(true);
  });

  it("renders as a dot without text when dot attribute is set", () => {
    element.setAttribute("dot", "");
    document.body.appendChild(element);
    const badge = element.shadowRoot?.querySelector(".badge");
    expect(badge?.classList.contains("badge--dot")).toBe(true);
    expect(badge?.textContent?.trim()).toBe("");
  });

  it("renders slotted text content", () => {
    element.textContent = "Verified";
    document.body.appendChild(element);
    const slot = element.shadowRoot?.querySelector("slot");
    expect(slot).toBeTruthy();
  });

  it("updates via property setter", () => {
    document.body.appendChild(element);
    element.variant = "danger";
    const badge = element.shadowRoot?.querySelector(".badge");
    expect(badge?.classList.contains("badge--danger")).toBe(true);
  });

  it("supports all variant values", () => {
    document.body.appendChild(element);
    const variants: ArsBadge["variant"][] = [
      "primary",
      "secondary",
      "success",
      "warning",
      "danger",
      "info",
      "neutral",
    ];
    for (const v of variants) {
      element.variant = v;
      const badge = element.shadowRoot?.querySelector(".badge");
      expect(badge?.classList.contains(`badge--${v}`)).toBe(true);
    }
  });

  it("uses design token variables in styles", () => {
    document.body.appendChild(element);
    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-font-family-sans");
    expect(styles).toContain("--arswc-radius-sm");
  });
});
