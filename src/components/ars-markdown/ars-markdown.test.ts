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

  // ── View/Edit mode tests ────────────────────────────────────────

  it("defaults to view mode", () => {
    expect(element.mode).toBe("view");
  });

  it("renders markdown in view mode", () => {
    element.source = "**bold**";
    document.body.appendChild(element);
    const strong = element.shadowRoot?.querySelector("strong");
    expect(strong?.textContent).toBe("bold");
    const textarea = element.shadowRoot?.querySelector("textarea");
    expect(textarea).toBeNull();
  });

  it("renders textarea in edit mode", () => {
    element.source = "raw text";
    element.mode = "edit";
    document.body.appendChild(element);
    const textarea = element.shadowRoot?.querySelector("textarea");
    expect(textarea).toBeTruthy();
    expect(textarea?.value).toBe("raw text");
    const body = element.shadowRoot?.querySelector(".markdown-body");
    expect(body).toBeNull();
  });

  it("preserves raw HTML content in edit mode textarea", () => {
    element.source = "<script>alert('x')</script>";
    element.mode = "edit";
    document.body.appendChild(element);
    const textarea = element.shadowRoot?.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea.value).toBe("<script>alert('x')</script>");
  });

  it("emits ars-markdown:change on textarea input", () => {
    element.mode = "edit";
    document.body.appendChild(element);
    const textarea = element.shadowRoot?.querySelector("textarea") as HTMLTextAreaElement;

    let received: string | null = null;
    element.addEventListener("ars-markdown:change", ((e: CustomEvent) => {
      received = e.detail.source;
    }) as EventListener);

    textarea.value = "new content";
    textarea.dispatchEvent(new Event("input"));

    expect(received).toBe("new content");
  });

  it("updates source when textarea changes", () => {
    element.mode = "edit";
    document.body.appendChild(element);
    const textarea = element.shadowRoot?.querySelector("textarea") as HTMLTextAreaElement;

    textarea.value = "updated";
    textarea.dispatchEvent(new Event("input"));

    expect(element.source).toBe("updated");
  });

  it("toggling from edit to view renders markdown from edited source", () => {
    element.source = "initial";
    element.mode = "edit";
    document.body.appendChild(element);

    const textarea = element.shadowRoot?.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "**bold**";
    textarea.dispatchEvent(new Event("input"));

    element.mode = "view";
    const strong = element.shadowRoot?.querySelector("strong");
    expect(strong?.textContent).toBe("bold");
  });

  it("toggling from view to edit preserves source", () => {
    element.source = "my text";
    document.body.appendChild(element);
    element.mode = "edit";

    const textarea = element.shadowRoot?.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea.value).toBe("my text");
  });

  it("toggling mode does not fire change event", () => {
    element.source = "text";
    document.body.appendChild(element);

    let changeCount = 0;
    element.addEventListener("ars-markdown:change", () => {
      changeCount++;
    });

    element.mode = "edit";
    element.mode = "view";

    expect(changeCount).toBe(0);
  });

  it("sets mode via attribute", () => {
    element.source = "content";
    document.body.appendChild(element);
    element.setAttribute("mode", "edit");

    const textarea = element.shadowRoot?.querySelector("textarea");
    expect(textarea).toBeTruthy();
    expect(element.mode).toBe("edit");
  });

  it("invalid mode attribute defaults to view", () => {
    element.source = "content";
    document.body.appendChild(element);
    element.setAttribute("mode", "invalid");

    expect(element.mode).toBe("view");
    const body = element.shadowRoot?.querySelector(".markdown-body");
    expect(body).toBeTruthy();
  });
});
