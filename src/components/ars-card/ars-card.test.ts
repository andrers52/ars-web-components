/**
 * Tests for ArsCard
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ArsCard } from "./ars-card.js";

describe("ArsCard", () => {
  let element: ArsCard;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsCard();
  });

  it("registers the ars-card custom element", () => {
    expect(customElements.get("ars-card")).toBe(ArsCard);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  it("defaults to default variant and md padding", () => {
    document.body.appendChild(element);
    const card = element.shadowRoot?.querySelector(".card");
    expect(card?.classList.contains("card--default")).toBe(true);
    expect(card?.classList.contains("card--padding-md")).toBe(true);
  });

  it("reflects variant attribute", () => {
    element.setAttribute("variant", "elevated");
    document.body.appendChild(element);
    const card = element.shadowRoot?.querySelector(".card");
    expect(card?.classList.contains("card--elevated")).toBe(true);
  });

  it("reflects padding attribute", () => {
    element.setAttribute("padding", "lg");
    document.body.appendChild(element);
    const card = element.shadowRoot?.querySelector(".card");
    expect(card?.classList.contains("card--padding-lg")).toBe(true);
  });

  it("applies interactive class when interactive attribute is set", () => {
    element.setAttribute("interactive", "");
    document.body.appendChild(element);
    const card = element.shadowRoot?.querySelector(".card");
    expect(card?.classList.contains("card--interactive")).toBe(true);
  });

  it("renders as anchor when href is set", () => {
    element.setAttribute("href", "/pets/123");
    document.body.appendChild(element);
    const card = element.shadowRoot?.querySelector("a.card");
    expect(card).toBeTruthy();
    expect(card?.getAttribute("href")).toBe("/pets/123");
  });

  it("emits ars-card:click on click when interactive", () => {
    element.setAttribute("interactive", "");
    document.body.appendChild(element);
    const clicks: any[] = [];
    element.addEventListener("ars-card:click", (e) => {
      clicks.push((e as CustomEvent).detail);
    });

    element.shadowRoot?.querySelector(".card")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(clicks.length).toBe(1);
    expect(clicks[0].variant).toBe("default");
  });

  it("does not emit ars-card:click when not interactive", () => {
    document.body.appendChild(element);
    const clicks: any[] = [];
    element.addEventListener("ars-card:click", () => {
      clicks.push(true);
    });

    element.shadowRoot?.querySelector(".card")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(clicks).toEqual([]);
  });

  it("renders all slot areas", () => {
    document.body.appendChild(element);
    const slots = element.shadowRoot?.querySelectorAll("slot");
    expect(slots?.length).toBe(5);
  });

  it("updates variant via property setter", () => {
    document.body.appendChild(element);
    element.variant = "outlined";
    const card = element.shadowRoot?.querySelector(".card");
    expect(card?.classList.contains("card--outlined")).toBe(true);
  });

  it("uses design token variables in styles", () => {
    document.body.appendChild(element);
    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-surface");
    expect(styles).toContain("--arswc-radius-md");
    expect(styles).toContain("--arswc-focus-ring");
  });
});
