/**
 * Tests for ArsMarkdown
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ArsMarkdown } from "./ars-markdown.js";

describe("ArsMarkdown", () => {
  let element: ArsMarkdown;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsMarkdown();
  });

  it("registers the ars-markdown custom element", () => {
    expect(customElements.get("ars-markdown")).toBe(ArsMarkdown);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  it("renders headings", () => {
    element.source = "# Hello\n## World";
    document.body.appendChild(element);
    const h1 = element.shadowRoot?.querySelector("h1");
    const h2 = element.shadowRoot?.querySelector("h2");
    expect(h1?.textContent).toBe("Hello");
    expect(h2?.textContent).toBe("World");
  });

  it("renders bold and italic", () => {
    element.source = "**bold** *italic*";
    document.body.appendChild(element);
    const strong = element.shadowRoot?.querySelector("strong");
    const em = element.shadowRoot?.querySelector("em");
    expect(strong?.textContent).toBe("bold");
    expect(em?.textContent).toBe("italic");
  });

  it("renders code inline", () => {
    element.source = "Use `code` here";
    document.body.appendChild(element);
    const code = element.shadowRoot?.querySelector("code");
    expect(code?.textContent).toBe("code");
  });

  it("renders links", () => {
    element.source = "[link](https://example.com)";
    document.body.appendChild(element);
    const a = element.shadowRoot?.querySelector("a");
    expect(a?.getAttribute("href")).toBe("https://example.com");
    expect(a?.textContent).toBe("link");
  });

  it("updates when source changes", () => {
    element.source = "First";
    document.body.appendChild(element);
    let p = element.shadowRoot?.querySelector("p");
    expect(p?.textContent).toBe("First");

    element.source = "Second";
    p = element.shadowRoot?.querySelector("p");
    expect(p?.textContent).toBe("Second");
  });
});
