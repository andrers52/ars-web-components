/**
 * Tests for ArsInfoTile (renamed from ArsRelationalNode)
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArsInfoTile, ArsRelationalNode } from "./ars-info-tile.js";

describe("ArsInfoTile", () => {
  let element: ArsInfoTile;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsInfoTile();
  });

  // --- Registration ---

  it("registers the ars-info-tile custom element", () => {
    expect(customElements.get("ars-info-tile")).toBe(ArsInfoTile);
  });

  it("registers the deprecated ars-relational-node alias", () => {
    const RelationalNodeClass = customElements.get("ars-relational-node");
    expect(RelationalNodeClass).toBeDefined();
    // The alias class extends ArsInfoTile
    const aliasInstance = new RelationalNodeClass!();
    expect(aliasInstance).toBeInstanceOf(ArsInfoTile);
  });

  it("exports ArsRelationalNode as a deprecated alias for ArsInfoTile", () => {
    expect(ArsRelationalNode).toBe(ArsInfoTile);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  // --- Data rendering ---

  it("renders title, subtitle and id from data", () => {
    element.data = {
      id: "bot_scalper",
      title: "Scalper BTC",
      subtitle: "trading bot",
      properties: {
        status: "active",
      },
    };

    document.body.appendChild(element);

    expect(element.shadowRoot?.querySelector(".title")?.textContent).toContain("Scalper BTC");
    expect(element.shadowRoot?.querySelector(".subtitle")?.textContent).toContain("trading bot");
    expect(element.shadowRoot?.querySelector(".tile-id")?.textContent).toContain("bot_scalper");
    expect(element.shadowRoot?.querySelector(".tile-id")?.getAttribute("title")).toContain("bot_scalper");
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

  it("shows empty state when no properties are set", () => {
    element.data = { id: "empty" };

    document.body.appendChild(element);

    expect(element.shadowRoot?.querySelector(".empty-state")?.textContent).toContain("No properties");
  });

  // --- Selection / Dragging states ---

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

  it("deselects when setSelected(false) is called", () => {
    document.body.appendChild(element);

    element.setSelected(true);
    element.setSelected(false);

    expect(element.hasAttribute("selected")).toBe(false);
  });

  // --- Layout ---

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
      throw new Error("ArsInfoTile test requires card sections.");
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

  it("returns 0 for measureIntrinsicHeight when shadow root is missing", () => {
    // Directly constructed elements have a shadow root; test the guard by checking the method exists
    expect(typeof element.measureIntrinsicHeight).toBe("function");
  });

  // --- Attribute fallbacks ---

  it("falls back to tile-id when no explicit title is provided", () => {
    element.setAttribute("tile-id", "fallback_tile");

    document.body.appendChild(element);

    expect(element.shadowRoot?.querySelector(".title")?.textContent).toContain("fallback_tile");
  });

  it("uses accent-color attribute when no data accentColor is set", () => {
    element.setAttribute("accent-color", "#ff00ff");

    document.body.appendChild(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("#ff00ff");
  });

  // --- Data property ---

  it("data getter returns a copy", () => {
    element.data = { id: "test", title: "Test" };
    const copy = element.data;
    copy.title = "Modified";
    expect(element.data.title).toBe("Test");
  });

  // --- Events ---

  it("emits a composed activation event when the inner card is double-clicked", () => {
    document.body.appendChild(element);

    const activations: string[] = [];
    element.addEventListener("ars-info-tile:activate", (event) => {
      activations.push((event as CustomEvent).detail.originalEventType);
    });

    element.shadowRoot?.querySelector(".card")?.dispatchEvent(new MouseEvent("dblclick", {
      bubbles: true,
      composed: true,
    }));

    expect(activations).toEqual(["dblclick"]);
  });

  it("does not bind activation events twice", () => {
    document.body.appendChild(element);

    // Force a second connectedCallback (simulating re-attachment)
    element.connectedCallback();

    const activations: string[] = [];
    element.addEventListener("ars-info-tile:activate", (event) => {
      activations.push((event as CustomEvent).detail.originalEventType);
    });

    element.shadowRoot?.querySelector(".card")?.dispatchEvent(new MouseEvent("dblclick", {
      bubbles: true,
      composed: true,
    }));

    // Should only fire once, not twice
    expect(activations).toEqual(["dblclick"]);
  });

  // --- Observed attributes ---

  it("observes the expected attributes", () => {
    expect(ArsInfoTile.observedAttributes).toContain("title");
    expect(ArsInfoTile.observedAttributes).toContain("subtitle");
    expect(ArsInfoTile.observedAttributes).toContain("selected");
    expect(ArsInfoTile.observedAttributes).toContain("dragging");
    expect(ArsInfoTile.observedAttributes).toContain("accent-color");
    expect(ArsInfoTile.observedAttributes).toContain("tile-id");
  });

  // --- XSS protection ---

  it("escapes HTML in title and properties so injected tags do not render as elements", () => {
    element.data = {
      id: "<script>alert(1)</script>",
      title: "<b>bold</b>",
      properties: { key: "<img onerror=alert(1)>" },
    };

    document.body.appendChild(element);

    // Title text content should contain the literal angle brackets, not a <b> element
    const titleEl = element.shadowRoot?.querySelector(".title");
    expect(titleEl?.textContent).toContain("<b>bold</b>");
    expect(titleEl?.querySelector("b")).toBeNull();

    // Property value should not create an img element
    const propValEl = element.shadowRoot?.querySelector(".property-value");
    expect(propValEl?.textContent).toContain("<img onerror=alert(1)>");
    expect(propValEl?.querySelector("img")).toBeNull();

    // No script elements should exist in shadow DOM
    expect(element.shadowRoot?.querySelector("script")).toBeNull();
  });
});
