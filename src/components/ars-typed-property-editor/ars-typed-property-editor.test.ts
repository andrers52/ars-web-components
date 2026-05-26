/**
 * Tests for ArsTypedPropertyEditor
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { ArsTypedPropertyEditor } from "./ars-typed-property-editor.js";

describe("ArsTypedPropertyEditor", () => {
  let element: ArsTypedPropertyEditor;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsTypedPropertyEditor();
  });

  it("registers the custom element", () => {
    expect(customElements.get("ars-typed-property-editor")).toBe(
      ArsTypedPropertyEditor,
    );
  });

  it("renders a text input by default", () => {
    element.properties = { status: "active" };
    document.body.appendChild(element);

    const input = element.shadowRoot?.querySelector(".typed-input");
    expect(input).toBeTruthy();
    expect((input as HTMLInputElement).type).toBe("text");
    expect((input as HTMLInputElement).value).toBe("active");
  });

  it("renders a date input for date-typed properties", () => {
    element.properties = { start_date: "2026-05-25" };
    element.types = { start_date: "date" };
    document.body.appendChild(element);

    const input = element.shadowRoot?.querySelector(".typed-input");
    expect((input as HTMLInputElement).type).toBe("date");
    expect((input as HTMLInputElement).value).toBe("2026-05-25");
  });

  it("renders an email input for email-typed properties", () => {
    element.properties = { email: "alice@example.com" };
    element.types = { email: "email" };
    document.body.appendChild(element);

    const input = element.shadowRoot?.querySelector(".typed-input");
    expect((input as HTMLInputElement).type).toBe("email");
    expect((input as HTMLInputElement).value).toBe("alice@example.com");
  });

  it("renders a number input for number-typed properties", () => {
    element.properties = { amount: "42" };
    element.types = { amount: "number" };
    document.body.appendChild(element);

    const input = element.shadowRoot?.querySelector(".typed-input");
    expect((input as HTMLInputElement).type).toBe("number");
    expect((input as HTMLInputElement).value).toBe("42");
  });

  it("renders a time input for time-typed properties", () => {
    element.properties = { start_time: "14:30" };
    element.types = { start_time: "time" };
    document.body.appendChild(element);

    const input = element.shadowRoot?.querySelector(".typed-input");
    expect((input as HTMLInputElement).type).toBe("time");
  });

  it("renders a url input for url-typed properties", () => {
    element.properties = { website: "https://example.com" };
    element.types = { website: "url" };
    document.body.appendChild(element);

    const input = element.shadowRoot?.querySelector(".typed-input");
    expect((input as HTMLInputElement).type).toBe("url");
  });

  it("renders a tel input for tel-typed properties", () => {
    element.properties = { phone: "+1-555-0123" };
    element.types = { phone: "tel" };
    document.body.appendChild(element);

    const input = element.shadowRoot?.querySelector(".typed-input");
    expect((input as HTMLInputElement).type).toBe("tel");
  });

  it("relabels HAS_NAME as Name", () => {
    element.properties = { HAS_NAME: "Nexus" };
    document.body.appendChild(element);

    const label = element.shadowRoot?.querySelector("label");
    expect(label?.textContent?.trim()).toBe("Name");
  });

  it("dispatches change event on input", () => {
    element.properties = { status: "active" };
    document.body.appendChild(element);

    const events: Array<{ properties: Record<string, string> }> = [];
    element.addEventListener("ars-typed-property-editor:change", (e) => {
      events.push((e as CustomEvent).detail);
    });

    const input = element.shadowRoot?.querySelector<HTMLInputElement>(
      ".typed-input",
    );
    expect(input).toBeTruthy();
    input!.value = "inactive";
    input!.dispatchEvent(new Event("input"));

    expect(events.length).toBe(1);
    expect(events[0].properties).toEqual({ status: "inactive" });
  });

  it("reflects updated properties via setter", () => {
    element.properties = { status: "active" };
    document.body.appendChild(element);

    element.properties = { status: "updated" };

    const input = element.shadowRoot?.querySelector<HTMLInputElement>(
      ".typed-input",
    );
    expect(input?.value).toBe("updated");
  });

  it("returns a copy from the properties getter", () => {
    element.properties = { status: "active" };
    const copy = element.properties;
    copy.status = "modified";
    expect(element.properties.status).toBe("active");
  });

  it("disables inputs when readonly", () => {
    element.properties = { status: "active" };
    element.readonly = true;
    document.body.appendChild(element);

    const input = element.shadowRoot?.querySelector<HTMLInputElement>(
      ".typed-input",
    );
    expect(input?.hasAttribute("readonly")).toBe(true);
  });

  it("shows empty state when no properties in readonly mode", () => {
    element.readonly = true;
    document.body.appendChild(element);

    expect(
      element.shadowRoot?.querySelector(".empty")?.textContent,
    ).toContain("No properties");
  });

  it("escapes HTML in property keys and values", () => {
    element.properties = { "<b>key</b>": "<script>alert(1)</script>" };
    document.body.appendChild(element);

    const label = element.shadowRoot?.querySelector("label");
    expect(label?.textContent).toContain("&lt;b&gt;key&lt;/b&gt;");
    expect(label?.querySelector("b")).toBeNull();

    const input = element.shadowRoot?.querySelector<HTMLInputElement>(
      ".typed-input",
    );
    expect(input?.value).toContain("<script>alert(1)</script>");
  });
});
