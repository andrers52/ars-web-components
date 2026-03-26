/**
 * Tests for ArsSelect
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { ArsSelect } from "./ars-select.js";

const SAMPLE_OPTIONS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date", disabled: true },
];

describe("ArsSelect", () => {
  let element: ArsSelect;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsSelect();
  });

  function mount(opts = SAMPLE_OPTIONS) {
    element.options = opts;
    document.body.appendChild(element);
    return element;
  }

  // --- Registration ---

  it("registers the ars-select custom element", () => {
    expect(customElements.get("ars-select")).toBe(ArsSelect);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  // --- Default rendering ---

  it("renders a trigger with combobox role", () => {
    mount();
    const trigger = element.shadowRoot!.querySelector('[role="combobox"]');
    expect(trigger).toBeTruthy();
  });

  it("shows placeholder when no value is selected", () => {
    mount();
    const display = element.shadowRoot!.querySelector(".display-value");
    expect(display?.textContent).toContain("Select...");
  });

  it("dropdown is closed by default", () => {
    mount();
    expect(element.shadowRoot!.querySelector(".dropdown")).toBeNull();
  });

  // --- Opening / Closing ---

  it("opens dropdown on trigger click", () => {
    mount();
    element.shadowRoot!.querySelector<HTMLElement>(".trigger")!.click();
    expect(element.shadowRoot!.querySelector(".dropdown")).toBeTruthy();
  });

  it("closes dropdown on second trigger click", () => {
    mount();
    element.shadowRoot!.querySelector<HTMLElement>(".trigger")!.click();
    element.shadowRoot!.querySelector<HTMLElement>(".trigger")!.click();
    expect(element.shadowRoot!.querySelector(".dropdown")).toBeNull();
  });

  it("emits ars-select:open when opened", () => {
    mount();
    const events: any[] = [];
    element.addEventListener("ars-select:open", () => events.push(true));
    element.open();
    expect(events.length).toBe(1);
  });

  it("emits ars-select:close when closed", () => {
    mount();
    element.open();
    const events: any[] = [];
    element.addEventListener("ars-select:close", () => events.push(true));
    element.close();
    expect(events.length).toBe(1);
  });

  // --- Selection ---

  it("selects an option by clicking it", () => {
    mount();
    element.open();
    const events: any[] = [];
    element.addEventListener("ars-select:change", (e) => {
      events.push((e as CustomEvent).detail);
    });

    const opt = element.shadowRoot!.querySelector('[data-value="banana"]') as HTMLElement;
    opt.click();

    expect(events.length).toBe(1);
    expect(events[0].value).toBe("banana");
  });

  it("updates display label after selection", () => {
    mount();
    element.value = "cherry";
    const display = element.shadowRoot!.querySelector(".display-value");
    expect(display?.textContent).toContain("Cherry");
  });

  it("closes dropdown after single selection", () => {
    mount();
    element.open();
    const opt = element.shadowRoot!.querySelector('[data-value="apple"]') as HTMLElement;
    opt.click();
    expect(element.shadowRoot!.querySelector(".dropdown")).toBeNull();
  });

  it("does not select a disabled option", () => {
    mount();
    element.open();
    const opt = element.shadowRoot!.querySelector('[data-value="date"]') as HTMLElement;
    opt.click();
    expect(element.value).not.toBe("date");
  });

  // --- Multiple selection ---

  it("supports multiple selection mode", () => {
    element.setAttribute("multiple", "");
    mount();
    element.value = ["apple", "cherry"];
    const display = element.shadowRoot!.querySelector(".display-value");
    expect(display?.textContent).toContain("Apple");
    expect(display?.textContent).toContain("Cherry");
  });

  it("toggles values in multiple mode", () => {
    element.setAttribute("multiple", "");
    mount();
    element.value = ["apple"];
    element.open();

    // Select banana
    const bananaOpt = element.shadowRoot!.querySelector('[data-value="banana"]') as HTMLElement;
    bananaOpt.click();
    expect(element.value).toContain("banana");
    expect(element.value).toContain("apple");
  });

  it("does not close dropdown in multiple mode after selection", () => {
    element.setAttribute("multiple", "");
    mount();
    element.open();

    const opt = element.shadowRoot!.querySelector('[data-value="apple"]') as HTMLElement;
    opt.click();
    // Should still be open
    expect(element.shadowRoot!.querySelector(".dropdown")).toBeTruthy();
  });

  // --- Searchable ---

  it("shows search input when searchable", () => {
    element.setAttribute("searchable", "");
    mount();
    element.open();
    expect(element.shadowRoot!.querySelector(".search-input")).toBeTruthy();
  });

  it("filters options based on search term", () => {
    element.setAttribute("searchable", "");
    mount();
    element.open();
    const input = element.shadowRoot!.querySelector(".search-input") as HTMLInputElement;
    input.value = "ban";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const options = element.shadowRoot!.querySelectorAll(".option");
    expect(options.length).toBe(1);
    expect(options[0].textContent).toContain("Banana");
  });

  // --- Label & Error ---

  it("renders label when label attribute is set", () => {
    element.setAttribute("label", "Fruit");
    mount();
    const label = element.shadowRoot!.querySelector(".label");
    expect(label?.textContent).toContain("Fruit");
  });

  it("renders error message", () => {
    element.setAttribute("error", "Selection required");
    mount();
    const error = element.shadowRoot!.querySelector(".error-msg");
    expect(error?.textContent).toContain("Selection required");
  });

  it("adds error class to trigger", () => {
    element.setAttribute("error", "Bad");
    mount();
    expect(element.shadowRoot!.querySelector(".trigger--error")).toBeTruthy();
  });

  // --- Disabled ---

  it("does not open when disabled", () => {
    element.setAttribute("disabled", "");
    mount();
    element.open();
    expect(element.shadowRoot!.querySelector(".dropdown")).toBeNull();
  });

  // --- Keyboard navigation ---

  it("opens on Enter key", () => {
    mount();
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(element.shadowRoot!.querySelector(".dropdown")).toBeTruthy();
  });

  it("opens on ArrowDown key", () => {
    mount();
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(element.shadowRoot!.querySelector(".dropdown")).toBeTruthy();
  });

  it("closes on Escape key", () => {
    mount();
    element.open();
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(element.shadowRoot!.querySelector(".dropdown")).toBeNull();
  });

  it("highlights next option on ArrowDown when open", () => {
    mount();
    element.open();
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(element.shadowRoot!.querySelector(".option--highlighted")).toBeTruthy();
  });

  it("selects highlighted option on Enter", () => {
    mount();
    element.open();
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    const events: any[] = [];
    element.addEventListener("ars-select:change", (e) => events.push((e as CustomEvent).detail));
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(events.length).toBe(1);
  });

  // --- ARIA ---

  it("sets aria-expanded on trigger", () => {
    mount();
    const trigger = element.shadowRoot!.querySelector('[role="combobox"]');
    expect(trigger!.getAttribute("aria-expanded")).toBe("false");
    element.open();
    const triggerOpen = element.shadowRoot!.querySelector('[role="combobox"]');
    expect(triggerOpen!.getAttribute("aria-expanded")).toBe("true");
  });

  it("sets aria-selected on selected options", () => {
    mount();
    element.value = "banana";
    element.open();
    const selected = element.shadowRoot!.querySelector('[aria-selected="true"]');
    expect(selected).toBeTruthy();
    expect(selected!.getAttribute("data-value")).toBe("banana");
  });

  // --- Observed attributes ---

  it("observes the expected attributes", () => {
    const attrs = ArsSelect.observedAttributes;
    for (const attr of ["value", "placeholder", "label", "disabled", "searchable", "multiple", "error"]) {
      expect(attrs).toContain(attr);
    }
  });

  // --- CSS tokens ---

  it("uses design token variables in styles", () => {
    mount();
    const styles = element.shadowRoot!.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-accent");
    expect(styles).toContain("--arswc-color-border");
    expect(styles).toContain("--arswc-focus-ring");
    expect(styles).toContain("--arswc-color-danger");
  });

  // --- XSS ---

  it("escapes HTML in option labels", () => {
    element.options = [{ value: "xss", label: "<img onerror=alert(1)>" }];
    document.body.appendChild(element);
    element.open();
    const opt = element.shadowRoot!.querySelector(".option");
    expect(opt?.textContent).toContain("<img onerror=alert(1)>");
    expect(opt?.querySelector("img")).toBeNull();
  });

  // --- Option groups ---

  it("renders group tags on grouped options", () => {
    element.options = [
      { value: "a", label: "A", group: "Group 1" },
      { value: "b", label: "B", group: "Group 2" },
    ];
    document.body.appendChild(element);
    element.open();
    const tags = element.shadowRoot!.querySelectorAll(".group-tag");
    expect(tags.length).toBe(2);
    expect(tags[0].textContent).toContain("Group 1");
  });

  // --- selectedOption ---

  it("returns selectedOption for single select", () => {
    mount();
    element.value = "cherry";
    const sel = element.selectedOption as { value: string; label: string };
    expect(sel.value).toBe("cherry");
    expect(sel.label).toBe("Cherry");
  });

  it("returns selectedOption array for multiple select", () => {
    element.setAttribute("multiple", "");
    mount();
    element.value = ["apple", "banana"];
    const sel = element.selectedOption as { value: string }[];
    expect(sel.length).toBe(2);
  });
});
