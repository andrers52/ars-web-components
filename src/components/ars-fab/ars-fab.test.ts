/**
 * Tests for ArsFab
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ArsFab } from "./ars-fab.js";

describe("ArsFab", () => {
  let element: ArsFab;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsFab();
  });

  it("registers the ars-fab custom element", () => {
    expect(customElements.get("ars-fab")).toBe(ArsFab);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  it("defaults to primary variant, md size, and inline position", () => {
    document.body.appendChild(element);
    const fab = element.shadowRoot?.querySelector(".fab");
    expect(fab?.classList.contains("fab--primary")).toBe(true);
    expect(fab?.classList.contains("fab--md")).toBe(true);
    expect(fab?.classList.contains("fab--inline")).toBe(true);
  });

  it("reflects variant attribute", () => {
    element.setAttribute("variant", "danger");
    document.body.appendChild(element);
    const fab = element.shadowRoot?.querySelector(".fab");
    expect(fab?.classList.contains("fab--danger")).toBe(true);
  });

  it("reflects size attribute", () => {
    element.setAttribute("size", "lg");
    document.body.appendChild(element);
    const fab = element.shadowRoot?.querySelector(".fab");
    expect(fab?.classList.contains("fab--lg")).toBe(true);
  });

  it("applies extended class when extended attribute is set", () => {
    element.setAttribute("extended", "");
    document.body.appendChild(element);
    const fab = element.shadowRoot?.querySelector(".fab");
    expect(fab?.classList.contains("fab--extended")).toBe(true);
    expect(fab?.querySelector(".label")).toBeTruthy();
  });

  it("applies fixed positioning when position is fixed", () => {
    element.setAttribute("position", "fixed");
    document.body.appendChild(element);
    const fab = element.shadowRoot?.querySelector(".fab");
    expect(fab?.classList.contains("fab--fixed")).toBe(true);
  });

  it("disables the button when disabled attribute is set", () => {
    element.setAttribute("disabled", "");
    document.body.appendChild(element);
    const fab = element.shadowRoot?.querySelector("button");
    expect(fab?.hasAttribute("disabled")).toBe(true);
    expect(fab?.getAttribute("aria-disabled")).toBe("true");
  });

  it("emits ars-fab:click composed event on click", () => {
    document.body.appendChild(element);
    const clicks: any[] = [];
    element.addEventListener("ars-fab:click", (e) => {
      clicks.push((e as CustomEvent).detail);
    });

    element.shadowRoot?.querySelector("button")?.click();

    expect(clicks.length).toBe(1);
    expect(clicks[0].variant).toBe("primary");
  });

  it("does not emit ars-fab:click when disabled", () => {
    element.setAttribute("disabled", "");
    document.body.appendChild(element);
    const clicks: any[] = [];
    element.addEventListener("ars-fab:click", () => {
      clicks.push(true);
    });

    element.shadowRoot?.querySelector("button")?.click();

    expect(clicks).toEqual([]);
  });

  it("updates variant via property setter", () => {
    document.body.appendChild(element);
    element.variant = "secondary";
    const fab = element.shadowRoot?.querySelector(".fab");
    expect(fab?.classList.contains("fab--secondary")).toBe(true);
  });

  it("uses design token variables in styles", () => {
    document.body.appendChild(element);
    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-text");
    expect(styles).toContain("--arswc-focus-ring");
  });
});
