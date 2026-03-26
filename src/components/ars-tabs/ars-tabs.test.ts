/**
 * Tests for ArsTabs and ArsTabPanel
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { ArsTabs, ArsTabPanel } from "./ars-tabs.js";

describe("ArsTabs", () => {
  let element: ArsTabs;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("ars-tabs") as ArsTabs;
  });

  /** Helper: creates tabs with panels */
  function createTabsWithPanels(): ArsTabs {
    element.innerHTML = `
      <ars-tab-panel tab-id="one" label="Tab One">Content One</ars-tab-panel>
      <ars-tab-panel tab-id="two" label="Tab Two">Content Two</ars-tab-panel>
      <ars-tab-panel tab-id="three" label="Tab Three">Content Three</ars-tab-panel>
    `;
    document.body.appendChild(element);
    return element;
  }

  // --- Registration ---

  it("registers the ars-tabs custom element", () => {
    expect(customElements.get("ars-tabs")).toBe(ArsTabs);
  });

  it("registers the ars-tab-panel custom element", () => {
    expect(customElements.get("ars-tab-panel")).toBe(ArsTabPanel);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  // --- Tab rendering ---

  it("renders tab buttons for each panel", () => {
    createTabsWithPanels();
    const tabs = element.shadowRoot!.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(3);
  });

  it("renders a tablist with correct role", () => {
    createTabsWithPanels();
    const tablist = element.shadowRoot!.querySelector('[role="tablist"]');
    expect(tablist).toBeTruthy();
  });

  it("renders tab labels from panel label attribute", () => {
    createTabsWithPanels();
    const tabs = element.shadowRoot!.querySelectorAll('[role="tab"]');
    expect(tabs[0].textContent).toContain("Tab One");
    expect(tabs[1].textContent).toContain("Tab Two");
  });

  // --- Active tab ---

  it("auto-selects the first tab if none specified", () => {
    createTabsWithPanels();
    expect(element.activeTab).toBe("one");
  });

  it("marks the active tab with aria-selected=true", () => {
    createTabsWithPanels();
    const activeTab = element.shadowRoot!.querySelector('[aria-selected="true"]');
    expect(activeTab).toBeTruthy();
    expect(activeTab!.getAttribute("data-tab-id")).toBe("one");
  });

  it("shows only the active panel", () => {
    createTabsWithPanels();
    const panels = element.querySelectorAll("ars-tab-panel");
    expect((panels[0] as HTMLElement).style.display).toBe("block");
    expect((panels[1] as HTMLElement).style.display).toBe("none");
    expect((panels[2] as HTMLElement).style.display).toBe("none");
  });

  it("changes active tab via property setter", () => {
    createTabsWithPanels();
    element.activeTab = "two";
    const panels = element.querySelectorAll("ars-tab-panel");
    expect((panels[0] as HTMLElement).style.display).toBe("none");
    expect((panels[1] as HTMLElement).style.display).toBe("block");
  });

  it("changes active tab via attribute", () => {
    createTabsWithPanels();
    element.setAttribute("active-tab", "three");
    const panels = element.querySelectorAll("ars-tab-panel");
    expect((panels[2] as HTMLElement).style.display).toBe("block");
  });

  // --- Tab click ---

  it("switches tab on click", () => {
    createTabsWithPanels();
    const tabs = element.shadowRoot!.querySelectorAll('[role="tab"]');
    (tabs[1] as HTMLElement).click();
    expect(element.activeTab).toBe("two");
  });

  // --- Events ---

  it("emits ars-tabs:change with activeTab and previousTab", () => {
    createTabsWithPanels();
    const events: any[] = [];
    element.addEventListener("ars-tabs:change", (e) => {
      events.push((e as CustomEvent).detail);
    });

    element.activeTab = "two";

    expect(events.length).toBe(1);
    expect(events[0].activeTab).toBe("two");
    expect(events[0].previousTab).toBe("one");
  });

  it("does not emit change when setting the same tab", () => {
    createTabsWithPanels();
    const events: any[] = [];
    element.addEventListener("ars-tabs:change", (e) => events.push(e));

    element.activeTab = "one";
    expect(events.length).toBe(0);
  });

  // --- Disabled tabs ---

  it("does not switch to a disabled tab on click", () => {
    element.innerHTML = `
      <ars-tab-panel tab-id="a" label="Tab A">A</ars-tab-panel>
      <ars-tab-panel tab-id="b" label="Tab B" disabled>B</ars-tab-panel>
    `;
    document.body.appendChild(element);

    const tabs = element.shadowRoot!.querySelectorAll('[role="tab"]');
    (tabs[1] as HTMLElement).click();
    expect(element.activeTab).toBe("a"); // Should not change
  });

  it("marks disabled tabs with disabled attribute", () => {
    element.innerHTML = `
      <ars-tab-panel tab-id="a" label="Tab A">A</ars-tab-panel>
      <ars-tab-panel tab-id="b" label="Tab B" disabled>B</ars-tab-panel>
    `;
    document.body.appendChild(element);

    const tabs = element.shadowRoot!.querySelectorAll('[role="tab"]');
    expect((tabs[1] as HTMLButtonElement).disabled).toBe(true);
  });

  // --- Placement ---

  it("defaults to top placement", () => {
    createTabsWithPanels();
    expect(element.placement).toBe("top");
  });

  it("supports placement attribute", () => {
    element.setAttribute("placement", "start");
    createTabsWithPanels();
    expect(element.placement).toBe("start");
  });

  it("renders vertical tablist for start/end placement", () => {
    element.setAttribute("placement", "start");
    createTabsWithPanels();
    const tablist = element.shadowRoot!.querySelector('[role="tablist"]');
    expect(tablist!.getAttribute("aria-orientation")).toBe("vertical");
  });

  it("renders horizontal tablist for top/bottom placement", () => {
    createTabsWithPanels();
    const tablist = element.shadowRoot!.querySelector('[role="tablist"]');
    expect(tablist!.getAttribute("aria-orientation")).toBe("horizontal");
  });

  // --- Keyboard navigation ---

  it("moves focus and activates next tab on ArrowRight", () => {
    createTabsWithPanels();
    const tabs = element.shadowRoot!.querySelectorAll('[role="tab"]');
    (tabs[0] as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(element.activeTab).toBe("two");
  });

  it("wraps around on ArrowRight from last tab", () => {
    createTabsWithPanels();
    element.activeTab = "three";
    const tabs = element.shadowRoot!.querySelectorAll('[role="tab"]');
    (tabs[2] as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(element.activeTab).toBe("one");
  });

  it("jumps to first tab on Home key", () => {
    createTabsWithPanels();
    element.activeTab = "three";
    const tabs = element.shadowRoot!.querySelectorAll('[role="tab"]');
    (tabs[2] as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
    expect(element.activeTab).toBe("one");
  });

  it("jumps to last tab on End key", () => {
    createTabsWithPanels();
    const tabs = element.shadowRoot!.querySelectorAll('[role="tab"]');
    (tabs[0] as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    );
    expect(element.activeTab).toBe("three");
  });

  // --- ARIA ---

  it("sets aria-controls on tabs pointing to panels", () => {
    createTabsWithPanels();
    const tabs = element.shadowRoot!.querySelectorAll('[role="tab"]');
    expect(tabs[0].getAttribute("aria-controls")).toBe("panel-one");
  });

  it("sets role=tabpanel on panel elements", () => {
    createTabsWithPanels();
    const panels = element.querySelectorAll("ars-tab-panel");
    panels.forEach((p) => expect(p.getAttribute("role")).toBe("tabpanel"));
  });

  // --- Observed attributes ---

  it("observes the expected attributes", () => {
    expect(ArsTabs.observedAttributes).toContain("active-tab");
    expect(ArsTabs.observedAttributes).toContain("placement");
  });

  // --- ArsTabPanel properties ---

  it("ArsTabPanel reflects tabId property", () => {
    const panel = document.createElement("ars-tab-panel") as ArsTabPanel;
    panel.tabId = "test";
    expect(panel.getAttribute("tab-id")).toBe("test");
  });

  it("ArsTabPanel reflects label property", () => {
    const panel = document.createElement("ars-tab-panel") as ArsTabPanel;
    panel.label = "Test Label";
    expect(panel.getAttribute("label")).toBe("Test Label");
  });

  it("ArsTabPanel reflects disabled property", () => {
    const panel = document.createElement("ars-tab-panel") as ArsTabPanel;
    panel.disabled = true;
    expect(panel.hasAttribute("disabled")).toBe(true);
  });

  // --- CSS tokens ---

  it("uses design token variables in styles", () => {
    createTabsWithPanels();
    const styles = element.shadowRoot!.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-accent");
    expect(styles).toContain("--arswc-color-border");
    expect(styles).toContain("--arswc-color-muted");
    expect(styles).toContain("--arswc-focus-ring");
    expect(styles).toContain("--arswc-transition-duration");
  });

  // --- Slot ---

  it("provides a default slot for panels", () => {
    createTabsWithPanels();
    expect(element.shadowRoot!.querySelector("slot")).toBeTruthy();
  });
});
