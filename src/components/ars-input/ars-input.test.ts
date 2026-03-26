/**
 * Tests for ArsInput
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { ArsInput } from "./ars-input.js";

describe("ArsInput", () => {
  let element: ArsInput;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsInput();
  });

  // --- Registration ---

  it("registers the ars-input custom element", () => {
    expect(customElements.get("ars-input")).toBe(ArsInput);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  // --- Default rendering ---

  it("renders a native input element inside shadow DOM", () => {
    document.body.appendChild(element);
    const input = element.shadowRoot?.querySelector("input");
    expect(input).toBeTruthy();
  });

  it("defaults to text type", () => {
    document.body.appendChild(element);
    const input = element.shadowRoot?.querySelector("input");
    expect(input?.getAttribute("type")).toBe("text");
  });

  // --- Type attribute ---

  it("reflects the type attribute to the native input", () => {
    element.setAttribute("type", "email");
    document.body.appendChild(element);
    const input = element.shadowRoot?.querySelector("input");
    expect(input?.getAttribute("type")).toBe("email");
  });

  it("supports all valid input types", () => {
    document.body.appendChild(element);
    for (const type of ["text", "number", "email", "password", "search", "url", "tel"] as const) {
      element.inputType = type;
      const input = element.shadowRoot?.querySelector("input");
      expect(input?.getAttribute("type")).toBe(type);
    }
  });

  // --- Label ---

  it("renders a label element when label attribute is set", () => {
    element.setAttribute("label", "Email address");
    document.body.appendChild(element);
    const label = element.shadowRoot?.querySelector("label");
    expect(label).toBeTruthy();
    expect(label?.textContent).toContain("Email address");
  });

  it("does not render a label when label attribute is not set", () => {
    document.body.appendChild(element);
    const label = element.shadowRoot?.querySelector("label");
    expect(label).toBeNull();
  });

  it("links label to input via for attribute", () => {
    element.setAttribute("label", "Name");
    document.body.appendChild(element);
    const label = element.shadowRoot?.querySelector("label");
    const input = element.shadowRoot?.querySelector("input");
    expect(label?.getAttribute("for")).toBe(input?.getAttribute("id"));
  });

  // --- Value ---

  it("sets the initial value from attribute", () => {
    element.setAttribute("value", "hello");
    document.body.appendChild(element);
    expect(element.value).toBe("hello");
  });

  it("updates value via property setter", () => {
    document.body.appendChild(element);
    element.value = "world";
    const input = element.shadowRoot?.querySelector("input");
    expect(input?.value).toBe("world");
  });

  // --- Placeholder ---

  it("renders the placeholder attribute", () => {
    element.setAttribute("placeholder", "Enter text...");
    document.body.appendChild(element);
    const input = element.shadowRoot?.querySelector("input");
    expect(input?.getAttribute("placeholder")).toBe("Enter text...");
  });

  // --- Disabled state ---

  it("disables the native input when disabled attribute is set", () => {
    element.setAttribute("disabled", "");
    document.body.appendChild(element);
    const input = element.shadowRoot?.querySelector("input");
    expect(input?.hasAttribute("disabled")).toBe(true);
  });

  it("reflects disabled via property setter", () => {
    document.body.appendChild(element);
    element.disabled = true;
    expect(element.hasAttribute("disabled")).toBe(true);
  });

  // --- Readonly state ---

  it("sets readonly on the native input", () => {
    element.setAttribute("readonly", "");
    document.body.appendChild(element);
    const input = element.shadowRoot?.querySelector("input");
    expect(input?.hasAttribute("readonly")).toBe(true);
  });

  // --- Error state ---

  it("renders error message when error attribute is set", () => {
    element.setAttribute("error", "This field is required");
    document.body.appendChild(element);
    const errorEl = element.shadowRoot?.querySelector(".error-msg");
    expect(errorEl).toBeTruthy();
    expect(errorEl?.textContent).toContain("This field is required");
  });

  it("sets aria-invalid on input when error is present", () => {
    element.setAttribute("error", "Invalid email");
    document.body.appendChild(element);
    const input = element.shadowRoot?.querySelector("input");
    expect(input?.getAttribute("aria-invalid")).toBe("true");
  });

  it("sets aria-describedby pointing to error element", () => {
    element.setAttribute("error", "Bad value");
    document.body.appendChild(element);
    const input = element.shadowRoot?.querySelector("input");
    const errorEl = element.shadowRoot?.querySelector(".error-msg");
    expect(input?.getAttribute("aria-describedby")).toBe(errorEl?.getAttribute("id"));
  });

  it("does not show error when error attribute is not set", () => {
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".error-msg")).toBeNull();
  });

  it("updates error via property setter", () => {
    document.body.appendChild(element);
    element.error = "Required field";
    expect(element.shadowRoot?.querySelector(".error-msg")?.textContent).toContain("Required field");
    element.error = "";
    expect(element.shadowRoot?.querySelector(".error-msg")).toBeNull();
  });

  // --- Clearable ---

  it("shows clear button when clearable and value is non-empty", () => {
    element.setAttribute("clearable", "");
    element.setAttribute("value", "something");
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".clear-btn")).toBeTruthy();
  });

  it("hides clear button when value is empty", () => {
    element.setAttribute("clearable", "");
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".clear-btn")).toBeNull();
  });

  it("clears value and emits ars-input:clear when clear button is clicked", () => {
    element.setAttribute("clearable", "");
    element.setAttribute("value", "test");
    document.body.appendChild(element);
    const events: any[] = [];
    element.addEventListener("ars-input:clear", (e) => events.push(e));

    element.shadowRoot?.querySelector(".clear-btn")?.dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );

    expect(element.shadowRoot?.querySelector(".clear-btn")).toBeNull();
    expect(events.length).toBe(1);
  });

  // --- Required ---

  it("forwards required attribute to native input", () => {
    element.setAttribute("required", "");
    document.body.appendChild(element);
    const input = element.shadowRoot?.querySelector("input");
    expect(input?.hasAttribute("required")).toBe(true);
  });

  // --- Constraint forwarding ---

  it("forwards min, max, step, pattern to native input", () => {
    element.setAttribute("type", "number");
    element.setAttribute("min", "0");
    element.setAttribute("max", "100");
    element.setAttribute("step", "5");
    document.body.appendChild(element);
    const input = element.shadowRoot?.querySelector("input");
    expect(input?.getAttribute("min")).toBe("0");
    expect(input?.getAttribute("max")).toBe("100");
    expect(input?.getAttribute("step")).toBe("5");
  });

  it("forwards pattern attribute", () => {
    element.setAttribute("pattern", "[A-Z]+");
    document.body.appendChild(element);
    const input = element.shadowRoot?.querySelector("input");
    expect(input?.getAttribute("pattern")).toBe("[A-Z]+");
  });

  // --- Events ---

  it("emits ars-input:input on keystroke", () => {
    document.body.appendChild(element);
    const events: string[] = [];
    element.addEventListener("ars-input:input", (e) => {
      events.push((e as CustomEvent).detail.value);
    });

    const input = element.shadowRoot!.querySelector("input")!;
    input.value = "a";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(events).toEqual(["a"]);
  });

  it("emits ars-input:change on native change", () => {
    document.body.appendChild(element);
    const events: string[] = [];
    element.addEventListener("ars-input:change", (e) => {
      events.push((e as CustomEvent).detail.value);
    });

    const input = element.shadowRoot!.querySelector("input")!;
    input.value = "final";
    input.dispatchEvent(new Event("change", { bubbles: true }));

    expect(events).toEqual(["final"]);
  });

  it("emits ars-input:change on Enter key", () => {
    document.body.appendChild(element);
    const events: string[] = [];
    element.addEventListener("ars-input:change", (e) => {
      events.push((e as CustomEvent).detail.value);
    });

    const input = element.shadowRoot!.querySelector("input")!;
    input.value = "entered";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(events).toEqual(["entered"]);
  });

  // --- Slots ---

  it("provides a prefix slot", () => {
    document.body.appendChild(element);
    const slot = element.shadowRoot?.querySelector('slot[name="prefix"]');
    expect(slot).toBeTruthy();
  });

  it("provides a suffix slot", () => {
    document.body.appendChild(element);
    const slot = element.shadowRoot?.querySelector('slot[name="suffix"]');
    expect(slot).toBeTruthy();
  });

  // --- Observed attributes ---

  it("observes the expected attributes", () => {
    const attrs = ArsInput.observedAttributes;
    for (const attr of ["type", "value", "placeholder", "label", "error", "disabled", "readonly", "clearable", "min", "max", "step", "pattern", "required"]) {
      expect(attrs).toContain(attr);
    }
  });

  // --- CSS token usage ---

  it("uses design token variables in styles", () => {
    document.body.appendChild(element);
    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-border");
    expect(styles).toContain("--arswc-color-danger");
    expect(styles).toContain("--arswc-focus-ring");
    expect(styles).toContain("--arswc-font-size-sm");
    expect(styles).toContain("--arswc-font-size-md");
  });

  // --- XSS protection ---

  it("escapes HTML in label and error messages", () => {
    element.setAttribute("label", "<script>alert(1)</script>");
    element.setAttribute("error", "<img onerror=alert(1)>");
    document.body.appendChild(element);

    const label = element.shadowRoot?.querySelector("label");
    expect(label?.textContent).toContain("<script>alert(1)</script>");
    expect(label?.querySelector("script")).toBeNull();

    const errorEl = element.shadowRoot?.querySelector(".error-msg");
    expect(errorEl?.textContent).toContain("<img onerror=alert(1)>");
    expect(errorEl?.querySelector("img")).toBeNull();
  });
});
