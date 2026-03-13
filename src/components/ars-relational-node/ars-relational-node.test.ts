/**
 * Tests for ArsRelationalNode
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArsRelationalNode } from "./ars-relational-node.js";

describe("ArsRelationalNode", () => {
  let element: ArsRelationalNode;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsRelationalNode();
  });

  it("registers the custom element", () => {
    expect(customElements.get("ars-relational-node")).toBe(ArsRelationalNode);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  it("renders title, subtitle and id from data", () => {
    element.data = {
      id: "meeting_alpha",
      title: "Meeting Alpha",
      subtitle: "event",
      properties: {
        owner: "andre",
      },
    };

    document.body.appendChild(element);

    expect(element.shadowRoot?.querySelector(".title")?.textContent).toContain("Meeting Alpha");
    expect(element.shadowRoot?.querySelector(".subtitle")?.textContent).toContain("event");
    expect(element.shadowRoot?.querySelector(".node-id")?.textContent).toContain("meeting_alpha");
    expect(element.shadowRoot?.querySelector(".node-id")?.getAttribute("title")).toContain("meeting_alpha");
  });

  it("normalizes record properties into rows", () => {
    element.data = {
      id: "project_orion",
      properties: {
        status: "active",
        owner: "andre",
      },
    };

    document.body.appendChild(element);

    const propertyKeys = Array.from(element.shadowRoot?.querySelectorAll(".property-key") ?? []).map((node) => node.textContent?.trim());
    expect(propertyKeys).toEqual(["status", "owner"]);
  });

  it("normalizes array properties into rows", () => {
    element.data = {
      id: "project_orion",
      properties: [
        { key: "status", value: "active" },
        { key: "priority", value: "high" },
      ],
    };

    document.body.appendChild(element);

    const propertyValues = Array.from(element.shadowRoot?.querySelectorAll(".property-value") ?? []).map((node) => node.textContent?.trim());
    expect(propertyValues).toEqual(["active", "high"]);
  });

  it("renders selected state through the host API", () => {
    document.body.appendChild(element);

    element.setSelected(true);

    expect(element.hasAttribute("selected")).toBe(true);
    expect(element.shadowRoot?.querySelector(".card")?.getAttribute("data-selected")).toBe("true");
  });

  it("renders dragging state through the host API", () => {
    document.body.appendChild(element);

    element.setDragging(true);

    expect(element.hasAttribute("dragging")).toBe(true);
    expect(element.shadowRoot?.querySelector(".card")?.getAttribute("data-dragging")).toBe("true");
  });

  it("styles the card to fill an explicitly sized host box", () => {
    document.body.appendChild(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("min-height: 100%");
    expect(styles).toContain("height: 100%");
  });

  it("measures intrinsic height from card sections instead of the stretched host box", () => {
    document.body.appendChild(element);

    const header = element.shadowRoot?.querySelector(".header") as HTMLElement | null;
    const content = element.shadowRoot?.querySelector(".content") as HTMLElement | null;
    const card = element.shadowRoot?.querySelector(".card") as HTMLElement | null;
    expect(header).toBeTruthy();
    expect(content).toBeTruthy();
    expect(card).toBeTruthy();
    if (!header || !content || !card) {
      throw new Error("ArsRelationalNode test requires card sections.");
    }

    Object.defineProperty(header, "scrollHeight", { configurable: true, value: 52 });
    Object.defineProperty(content, "scrollHeight", { configurable: true, value: 34 });
    const getComputedStyleSpy = vi.spyOn(window, "getComputedStyle").mockImplementation((node) => {
      if (node === card) {
        return {
          borderTopWidth: "1px",
          borderBottomWidth: "1px",
        } as CSSStyleDeclaration;
      }
      return {
        borderTopWidth: "0px",
        borderBottomWidth: "0px",
      } as CSSStyleDeclaration;
    });

    expect(element.measureIntrinsicHeight()).toBe(88);

    getComputedStyleSpy.mockRestore();
  });

  it("falls back to node-id when no explicit title is provided", () => {
    element.setAttribute("node-id", "fallback_node");

    document.body.appendChild(element);

    expect(element.shadowRoot?.querySelector(".title")?.textContent).toContain("fallback_node");
  });

  it("emits a composed activation event when the inner card is double-clicked", () => {
    document.body.appendChild(element);

    const activations: string[] = [];
    element.addEventListener("ars-relational-node:activate", (event) => {
      activations.push((event as CustomEvent).detail.originalEventType);
    });

    element.shadowRoot?.querySelector(".card")?.dispatchEvent(new MouseEvent("dblclick", {
      bubbles: true,
      composed: true,
    }));

    expect(activations).toEqual(["dblclick"]);
  });
});
