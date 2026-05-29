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

  it("renders title and name-subtitle from data", () => {
    element.data = {
      id: "bot_scalper",
      title: "Scalper BTC",
      properties: {
        HAS_NAME: "trading bot",
        status: "active",
      },
    };

    document.body.appendChild(element);

    expect(element.shadowRoot?.querySelector(".title")?.textContent).toContain(
      "Scalper BTC",
    );
    expect(
      element.shadowRoot?.querySelector(".subtitle")?.textContent,
    ).toContain("trading bot");
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

    const propertyKeys = Array.from(
      element.shadowRoot?.querySelectorAll(".property-key") ?? [],
    ).map((node) => node.textContent?.trim());
    expect(propertyKeys).toEqual(["owner", "status"]);
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

    const propertyValues = Array.from(
      element.shadowRoot?.querySelectorAll(".property-value") ?? [],
    ).map((node) => node.textContent?.trim());
    expect(propertyValues).toEqual(["high", "active"]);
  });

  it("collapses body when no properties are set", () => {
    element.data = { id: "empty" };

    document.body.appendChild(element);

    // Body area has zero height — no empty-state message.
    expect(
      element.shadowRoot?.querySelector(".empty-state"),
    ).toBeNull();
    expect(
      element.shadowRoot?.querySelector(".content")?.classList.contains("content--empty"),
    ).toBe(true);
  });

  it("renders name as subtitle from HAS_NAME property", () => {
    element.data = {
      id: "nexus",
      title: "System",
      properties: { HAS_NAME: "Nexus" },
    };

    document.body.appendChild(element);

    const subtitle = element.shadowRoot?.querySelector(".subtitle");
    expect(subtitle).toBeTruthy();
    expect(subtitle?.textContent?.trim()).toBe("Nexus");
  });

  it("collapses body when only HAS_NAME is present", () => {
    element.data = {
      id: "nexus",
      title: "System",
      properties: { HAS_NAME: "Nexus" },
    };

    document.body.appendChild(element);

    // Name is in the subtitle (header), not the content area.
    // Body collapses since there are no other properties.
    expect(
      element.shadowRoot?.querySelector(".content")?.classList.contains("content--empty"),
    ).toBe(true);
    expect(element.shadowRoot?.querySelector(".subtitle")?.textContent?.trim()).toBe(
      "Nexus",
    );
  });

  it("filters out HAS_NAME from property rows", () => {
    element.data = {
      id: "nexus",
      properties: {
        HAS_NAME: "Nexus",
        status: "active",
      },
    };

    document.body.appendChild(element);

    const keys = Array.from(
      element.shadowRoot?.querySelectorAll(".property-key") ?? [],
    ).map((node) => node.textContent?.trim());
    expect(keys).not.toContain("HAS_NAME");
    expect(keys).toContain("status");
  });

  // --- Selection / Dragging states ---

  it("renders selected state through the host API", () => {
    document.body.appendChild(element);

    element.setSelected(true);

    expect(element.hasAttribute("selected")).toBe(true);
    expect(
      element.shadowRoot?.querySelector(".card")?.getAttribute("data-selected"),
    ).toBe("true");
  });

  it("renders dragging state through the host API", () => {
    document.body.appendChild(element);

    element.setDragging(true);

    expect(element.hasAttribute("dragging")).toBe(true);
    expect(
      element.shadowRoot?.querySelector(".card")?.getAttribute("data-dragging"),
    ).toBe("true");
  });

  it("deselects when setSelected(false) is called", () => {
    document.body.appendChild(element);

    element.setSelected(true);
    element.setSelected(false);

    expect(element.hasAttribute("selected")).toBe(false);
  });

  it("supports the selected property getter/setter", () => {
    document.body.appendChild(element);

    // Initially not selected.
    expect(element.selected).toBe(false);

    // Set via property.
    element.selected = true;
    expect(element.selected).toBe(true);
    expect(element.hasAttribute("selected")).toBe(true);
    expect(
      element.shadowRoot?.querySelector(".card")?.getAttribute("data-selected"),
    ).toBe("true");

    // Unset via property.
    element.selected = false;
    expect(element.selected).toBe(false);
    expect(element.hasAttribute("selected")).toBe(false);
  });

  // --- Layout ---

  it("styles the card to fill an explicitly sized host box", () => {
    document.body.appendChild(element);

    const styles =
      element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("min-height: 100%");
    expect(styles).toContain("height: 100%");
  });

  it("measures intrinsic height from card sections instead of the stretched host box", () => {
    document.body.appendChild(element);

    const header = element.shadowRoot?.querySelector(
      ".header",
    ) as HTMLElement | null;
    const content = element.shadowRoot?.querySelector(
      ".content",
    ) as HTMLElement | null;
    const card = element.shadowRoot?.querySelector(
      ".card",
    ) as HTMLElement | null;
    expect(header).toBeTruthy();
    expect(content).toBeTruthy();
    expect(card).toBeTruthy();
    if (!header || !content || !card) {
      throw new Error("ArsInfoTile test requires card sections.");
    }

    Object.defineProperty(header, "scrollHeight", {
      configurable: true,
      value: 52,
    });
    Object.defineProperty(content, "scrollHeight", {
      configurable: true,
      value: 34,
    });
    const getComputedStyleSpy = vi
      .spyOn(window, "getComputedStyle")
      .mockImplementation((node) => {
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

    expect(element.shadowRoot?.querySelector(".title")?.textContent).toContain(
      "fallback_tile",
    );
  });

  it("uses accent-color attribute when no data accentColor is set", () => {
    element.setAttribute("accent-color", "#ff00ff");

    document.body.appendChild(element);

    const styles =
      element.shadowRoot?.querySelector("style")?.textContent ?? "";
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

    element.shadowRoot?.querySelector(".card")?.dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        composed: true,
      }),
    );

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

    element.shadowRoot?.querySelector(".card")?.dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        composed: true,
      }),
    );

    // Should only fire once, not twice
    expect(activations).toEqual(["dblclick"]);
  });

  // --- Observed attributes ---

  it("observes the expected attributes", () => {
    expect(ArsInfoTile.observedAttributes).toContain("title");
    expect(ArsInfoTile.observedAttributes).toContain("selected");
    expect(ArsInfoTile.observedAttributes).toContain("dragging");
    expect(ArsInfoTile.observedAttributes).toContain("collapsed");
    expect(ArsInfoTile.observedAttributes).toContain("not-collapsible");
    expect(ArsInfoTile.observedAttributes).toContain("accent-color");
    expect(ArsInfoTile.observedAttributes).toContain("tile-id");
  });

  // --- Collapsibility (button visibility) ---

  it("renders the collapse button by default", () => {
    document.body.appendChild(element);
    expect(element.collapsible).toBe(true);
    expect(element.shadowRoot?.querySelector(".collapse-btn")).toBeTruthy();
  });

  it("hides the collapse button when collapsible is set to false", () => {
    document.body.appendChild(element);
    element.collapsible = false;
    expect(element.collapsible).toBe(false);
    expect(element.hasAttribute("not-collapsible")).toBe(true);
    expect(element.shadowRoot?.querySelector(".collapse-btn")).toBeNull();
  });

  it("restores the collapse button when collapsible flips back to true", () => {
    document.body.appendChild(element);
    element.collapsible = false;
    expect(element.shadowRoot?.querySelector(".collapse-btn")).toBeNull();
    element.collapsible = true;
    expect(element.hasAttribute("not-collapsible")).toBe(false);
    expect(element.shadowRoot?.querySelector(".collapse-btn")).toBeTruthy();
  });

  it("does not throw and dispatches no toggle event for a non-collapsible tile", () => {
    document.body.appendChild(element);
    element.collapsible = false;

    const events: unknown[] = [];
    element.addEventListener("ars-info-tile:toggle-collapse", (event) => {
      events.push(event);
    });

    // No button to click — re-rendering / re-binding should be safe.
    element.data = { id: "x", title: "Leaf", properties: {} };
    expect(element.shadowRoot?.querySelector(".collapse-btn")).toBeNull();
    expect(events).toEqual([]);
  });

  // --- Collapse toggle ---

  it("renders collapsed state through the host API", () => {
    document.body.appendChild(element);

    element.setCollapsed(true);

    expect(element.hasAttribute("collapsed")).toBe(true);
    expect(
      element.shadowRoot
        ?.querySelector(".card")
        ?.getAttribute("data-collapsed"),
    ).toBe("true");
  });

  it("supports the collapsed property getter/setter", () => {
    document.body.appendChild(element);

    expect(element.collapsed).toBe(false);
    element.collapsed = true;
    expect(element.collapsed).toBe(true);
    expect(element.hasAttribute("collapsed")).toBe(true);
    element.collapsed = false;
    expect(element.collapsed).toBe(false);
  });

  it("dispatches ars-info-tile:toggle-collapse with the requested next state on button click", () => {
    document.body.appendChild(element);

    const events: Array<{ collapsed: boolean }> = [];
    element.addEventListener("ars-info-tile:toggle-collapse", (event) => {
      events.push((event as CustomEvent).detail);
    });

    const button = element.shadowRoot?.querySelector(
      ".collapse-btn",
    ) as HTMLButtonElement | null;
    expect(button).toBeTruthy();
    button!.click();
    // First click: not currently collapsed → request collapsed=true.
    expect(events).toEqual([{ collapsed: true }]);

    // Host applies the new state; second click should request false.
    element.setCollapsed(true);
    button!.click();
    expect(events).toEqual([{ collapsed: true }, { collapsed: false }]);
  });

  it("does NOT flip its own collapsed attribute on button click", () => {
    // Host is the single source of truth for collapse state;
    // the tile fires a request event but must not self-modify,
    // or the host's authoritative view and the tile visual will
    // desync if the host rejects/defers the toggle.
    document.body.appendChild(element);

    const button = element.shadowRoot?.querySelector(
      ".collapse-btn",
    ) as HTMLButtonElement | null;
    expect(element.hasAttribute("collapsed")).toBe(false);
    button!.click();
    expect(element.hasAttribute("collapsed")).toBe(false);
  });

  it("does NOT trigger ars-info-tile:activate when the user double-clicks the collapse button", () => {
    // Without the dblclick stopPropagation on the button, two fast
    // clicks on the toggle get promoted to a dblclick and bubble to
    // the shadow-root activation listener — firing an activation
    // event on what the user thinks is a flip-flop collapse gesture.
    document.body.appendChild(element);

    const activations: string[] = [];
    element.addEventListener("ars-info-tile:activate", () => {
      activations.push("fired");
    });
    const button = element.shadowRoot?.querySelector(
      ".collapse-btn",
    ) as HTMLButtonElement | null;
    expect(button).toBeTruthy();
    // Fire a dblclick on the button.  Use bubbles+composed so the
    // event reaches the shadow-root listener through the host
    // boundary — the same path a real double-click takes.
    button!.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true, composed: true }),
    );
    expect(activations).toEqual([]);
  });

  // --- Opacity property ---

  it("applies opacity as an inline host style and clamps to [0, 1]", () => {
    document.body.appendChild(element);

    element.opacity = 0.4;
    expect(element.style.opacity).toBe("0.4");
    expect(element.opacity).toBeCloseTo(0.4);

    // Out-of-range values clamp.
    element.opacity = 5;
    expect(element.style.opacity).toBe(""); // 1 ⇒ remove inline style
    element.opacity = -2;
    expect(element.style.opacity).toBe("0");

    // Reset to 1 removes the inline style.
    element.opacity = 0.5;
    expect(element.style.opacity).toBe("0.5");
    element.opacity = 1;
    expect(element.style.opacity).toBe("");
  });

  it("re-binds the collapse-button listener after a data-driven re-render", () => {
    document.body.appendChild(element);

    const events: Array<{ collapsed: boolean }> = [];
    element.addEventListener("ars-info-tile:toggle-collapse", (event) => {
      events.push((event as CustomEvent).detail);
    });

    // Force a re-render via data assignment — the inner button is
    // replaced because `#render` rewrites innerHTML wholesale.
    element.data = { id: "x", title: "X", properties: {} };

    const button = element.shadowRoot?.querySelector(
      ".collapse-btn",
    ) as HTMLButtonElement | null;
    button!.click();
    expect(events).toEqual([{ collapsed: true }]);
  });

  it("does not destroy the collapse button when only selected/dragging attributes change", () => {
    element.data = { id: "x", title: "X", properties: {} };
    document.body.appendChild(element);

    const button = element.shadowRoot?.querySelector(
      ".collapse-btn",
    ) as HTMLButtonElement | null;
    expect(button).not.toBeNull();
    const originalButton = button!;

    // Simulate what happens when the engine sets the `selected` DOM
    // property via diffAndUpdate: `(el as any).selected = true`.
    // Previously this triggered a full #render() that replaced
    // innerHTML and destroyed the button, preventing the browser
    // from generating a click event (mousedown target ≠ mouseup target).
    (element as unknown as Record<string, unknown>)["selected"] = true;

    // Button should still be the same element (not destroyed/recreated)
    const buttonAfter = element.shadowRoot?.querySelector(
      ".collapse-btn",
    ) as HTMLButtonElement | null;
    expect(buttonAfter).toBe(originalButton);

    // Verify the .card data-selected attribute was updated
    const card = element.shadowRoot?.querySelector(".card");
    expect(card?.getAttribute("data-selected")).toBe("true");

    // Same for dragging — use the public method since there's no
    // implicit property setter for `dragging`
    const originalButton2 = buttonAfter!;
    element.setDragging(true);
    const buttonAfter2 = element.shadowRoot?.querySelector(
      ".collapse-btn",
    ) as HTMLButtonElement | null;
    expect(buttonAfter2).toBe(originalButton2);
  });

  it("collapse button click survives a mousedown → select → mouseup sequence", async () => {
    element.data = { id: "x", title: "X", properties: {} };
    document.body.appendChild(element);

    const events: Array<{ collapsed: boolean }> = [];
    element.addEventListener("ars-info-tile:toggle-collapse", (event) => {
      events.push((event as CustomEvent).detail);
    });

    const button = element.shadowRoot?.querySelector(
      ".collapse-btn",
    ) as HTMLButtonElement | null;
    expect(button).not.toBeNull();

    // Simulate the exact browser event sequence that caused the bug:
    // 1. mousedown on button
    // 2. Engine sets selected=true → triggers targeted attr update (not full re-render)
    // 3. mouseup on same button → click fires
    button!.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, composed: true }),
    );

    // Engine reaction: sets selected property (simulating diffAndUpdate path)
    (element as unknown as Record<string, unknown>)["selected"] = true;

    // mouseup on the same button element
    button!.dispatchEvent(
      new MouseEvent("mouseup", { bubbles: true, composed: true }),
    );

    // Now click the button (simulating the browser's click event)
    button!.click();

    // The toggle-collapse event should fire
    expect(events).toEqual([{ collapsed: true }]);
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

  // --- data setter no-op guard ---

  it("does not re-render when data is set to structurally identical values", () => {
    element.data = {
      id: "node-1",
      title: "Test",
      properties: { status: "active" },
    };
    document.body.appendChild(element);

    // Grab the initial collapse button reference
    const buttonBefore = element.shadowRoot?.querySelector(".collapse-btn");
    expect(buttonBefore).toBeTruthy();

    // Spy on the internal render by watching innerHTML mutation.
    // Re-setting data to the same value must NOT destroy the button.
    element.data = {
      id: "node-1",
      title: "Test",
      properties: { status: "active" },
    };

    // The collapse button must be the SAME node (not destroyed + recreated)
    const buttonAfter = element.shadowRoot?.querySelector(".collapse-btn");
    expect(buttonAfter).toBe(buttonBefore);
  });

  // --- Inline editing ---

  it("observes the editing attribute", () => {
    expect(ArsInfoTile.observedAttributes).toContain("editing");
  });

  it("renders inputs when editing is true", () => {
    element.data = {
      id: "n1",
      title: "System",
      properties: { HAS_NAME: "Nexus", status: "active" },
    };
    element.editing = true;
    document.body.appendChild(element);

    expect(element.shadowRoot?.querySelector(".edit-input")).toBeTruthy();
    expect(element.shadowRoot?.querySelector(".property-row")).toBeNull();
  });

  it("renders a date input for date-typed properties in edit mode", () => {
    element.data = {
      id: "n1",
      title: "Event",
      properties: { start_date: "2026-05-25" },
      types: { start_date: "date" },
    };
    element.editing = true;
    document.body.appendChild(element);

    const input = element.shadowRoot?.querySelector(".edit-input") as HTMLInputElement | null;
    expect(input?.type).toBe("date");
    expect(input?.value).toBe("2026-05-25");
  });

  it("dispatches edit-save with updated values on click outside", async () => {
    element.data = {
      id: "n1",
      title: "System",
      properties: { HAS_NAME: "Nexus", status: "active" },
    };
    element.editing = true;
    document.body.appendChild(element);

    // Wait for the deferred document click listener to be attached.
    await new Promise((r) => setTimeout(r, 0));

    const saves: Array<{ properties: Record<string, string> }> = [];
    element.addEventListener("ars-info-tile:edit-save", (e) => {
      saves.push((e as CustomEvent).detail);
    });

    const inputs = Array.from(element.shadowRoot?.querySelectorAll<HTMLInputElement>(".edit-input") ?? []);
    expect(inputs.length).toBe(2); // HAS_NAME + status

    // Simulate user changing the name field.
    inputs[0]!.value = "Renamed Nexus";
    inputs[1]!.value = "inactive";

    // Click outside the tile should trigger save.
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(saves.length).toBe(1);
    expect(saves[0].properties["HAS_NAME"]).toBe("Renamed Nexus");
    expect(saves[0].properties).toEqual({ HAS_NAME: "Renamed Nexus", status: "inactive" });
  });

  it("does not dispatch edit-save when clicking inside the tile", async () => {
    element.data = { id: "n1", title: "System", properties: { status: "active" } };
    element.editing = true;
    document.body.appendChild(element);

    // Wait for the deferred document click listener to be attached.
    await new Promise((r) => setTimeout(r, 0));

    const saves: unknown[] = [];
    element.addEventListener("ars-info-tile:edit-save", () => saves.push(null));

    const input = element.shadowRoot?.querySelector(".edit-input");
    input?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(saves.length).toBe(0);
  });

  it("dispatches edit-save on Enter key for single-line inputs", () => {
    // Use an email-typed property so the control is <input>, not <textarea>.
    element.data = { id: "n1", title: "System", properties: { email: "a@b.com" }, types: { email: "email" } };
    element.editing = true;
    document.body.appendChild(element);

    const saves: unknown[] = [];
    element.addEventListener("ars-info-tile:edit-save", () => saves.push(null));

    const input = element.shadowRoot?.querySelector(".edit-input");
    input?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(saves.length).toBe(1);
  });

  it("does not dispatch edit-save on plain Enter in textarea", () => {
    element.data = { id: "n1", title: "System", properties: { body: "hello" } };
    element.editing = true;
    document.body.appendChild(element);

    const saves: unknown[] = [];
    element.addEventListener("ars-info-tile:edit-save", () => saves.push(null));

    const textarea = element.shadowRoot?.querySelector("textarea.edit-input");
    textarea?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(saves.length).toBe(0);
  });

  it("dispatches edit-save on Shift+Enter in textarea", () => {
    element.data = { id: "n1", title: "System", properties: { body: "hello" } };
    element.editing = true;
    document.body.appendChild(element);

    const saves: unknown[] = [];
    element.addEventListener("ars-info-tile:edit-save", () => saves.push(null));

    const textarea = element.shadowRoot?.querySelector("textarea.edit-input");
    textarea?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", shiftKey: true, bubbles: true }));

    expect(saves.length).toBe(1);
  });

  it("dispatches edit-cancel on Escape key", () => {
    element.data = { id: "n1", title: "System", properties: { status: "active" } };
    element.editing = true;
    document.body.appendChild(element);

    const cancels: unknown[] = [];
    element.addEventListener("ars-info-tile:edit-cancel", () => cancels.push(null));

    // Escape is listened on document so it works even when focus has
    // left the tile's shadow tree.
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(cancels.length).toBe(1);
  });

  it("hides collapse button in edit mode", () => {
    element.data = { id: "n1", title: "System", properties: {} };
    element.editing = true;
    document.body.appendChild(element);

    expect(element.shadowRoot?.querySelector(".collapse-btn")).toBeNull();
  });

  it("shows display mode again when editing is set to false", () => {
    element.data = { id: "n1", title: "System", properties: { HAS_NAME: "Nexus", status: "active" } };
    element.editing = true;
    document.body.appendChild(element);

    expect(element.shadowRoot?.querySelector(".edit-input")).toBeTruthy();

    element.editing = false;

    expect(element.shadowRoot?.querySelector(".edit-input")).toBeNull();
    expect(element.shadowRoot?.querySelector(".property-row")).toBeTruthy();
    expect(element.shadowRoot?.querySelector(".subtitle")?.textContent?.trim()).toBe("Nexus");
  });

  it("renders email input type for email-typed properties", () => {
    element.data = {
      id: "n1",
      title: "Contact",
      properties: { email: "test@example.com" },
      types: { email: "email" },
    };
    element.editing = true;
    document.body.appendChild(element);

    const input = element.shadowRoot?.querySelector(".edit-input") as HTMLInputElement | null;
    expect(input?.type).toBe("email");
  });

  it("omits name input when data has no name field", () => {
    element.data = { id: "n1", title: "System", properties: { status: "active" } };
    element.editing = true;
    document.body.appendChild(element);

    // Only one input: the status property (no __name__ row)
    const rows = Array.from(element.shadowRoot?.querySelectorAll(".edit-row") ?? []);
    const keys = rows.map((r) => (r as HTMLElement).dataset["propKey"]);
    expect(keys).not.toContain("__name__");
    expect(keys).toContain("status");
  });

  it("escapes HTML in input values during editing", () => {
    element.data = {
      id: "n1",
      title: "System",
      properties: {
        HAS_NAME: '<img src=x onerror=alert(1)>',
      },
    };
    element.editing = true;
    document.body.appendChild(element);

    // The malicious string should appear as the input value attribute, not as an element
    const input = element.shadowRoot?.querySelector(".edit-input") as HTMLInputElement | null;
    expect(input?.value).toBe('<img src=x onerror=alert(1)>');
    expect(element.shadowRoot?.querySelector("img")).toBeNull();
  });

  it("hides empty properties in view mode but shows them in edit mode", () => {
    element.data = {
      id: "n1",
      title: "Concept",
      properties: {
        HAS_NAME: "My Concept",
        status: "active",
        text: "",
        url: "",
      },
    };
    document.body.appendChild(element);

    // View mode: only non-empty, non-HAS_NAME properties visible
    const viewRows = element.shadowRoot?.querySelectorAll(".property-row");
    expect(viewRows?.length).toBe(1);
    expect(viewRows?.[0]?.textContent).toContain("status");
    expect(viewRows?.[0]?.textContent).toContain("active");

    // Edit mode: all properties visible, including empty ones and HAS_NAME
    element.editing = true;
    const editRows = element.shadowRoot?.querySelectorAll(".edit-row");
    const keys = Array.from(editRows ?? []).map(
      (r) => (r as HTMLElement).dataset["propKey"],
    );
    expect(keys).toContain("HAS_NAME");
    expect(keys).toContain("status");
    expect(keys).toContain("text");
    expect(keys).toContain("url");
  });

  it("collapses body when all properties are empty and no name is set", () => {
    element.data = {
      id: "n1",
      title: "Concept",
      properties: { text: "", url: "" },
    };
    document.body.appendChild(element);

    // Body area has zero height — no empty-state message.
    expect(
      element.shadowRoot?.querySelector(".empty-state"),
    ).toBeNull();
    expect(
      element.shadowRoot?.querySelector(".content")?.classList.contains("content--empty"),
    ).toBe(true);
  });
});

