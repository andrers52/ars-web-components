/**
 * Tests for ArsChatPanel
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { ArsChatPanel } from "./ars-chat-panel.js";

describe("ArsChatPanel", () => {
  let element: ArsChatPanel;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsChatPanel();
  });

  // --- Registration ---

  it("registers the ars-chat-panel custom element", () => {
    expect(customElements.get("ars-chat-panel")).toBe(ArsChatPanel);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  // --- Default rendering ---

  it("renders the panel structure inside shadow DOM", () => {
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".panel")).toBeTruthy();
    expect(element.shadowRoot?.querySelector(".messages")).toBeTruthy();
    expect(element.shadowRoot?.querySelector("textarea")).toBeTruthy();
    expect(element.shadowRoot?.querySelector("button.send")).toBeTruthy();
    expect(element.shadowRoot?.querySelector("button.clear")).toBeTruthy();
  });

  it("defaults title to 'Chat'", () => {
    expect(element.title).toBe("Chat");
  });

  it("defaults subtitle to empty string", () => {
    expect(element.subtitle).toBe("");
  });

  it("defaults placeholder to 'Type a message...'", () => {
    expect(element.placeholder).toBe("Type a message...");
  });

  it("defaults typing to false", () => {
    expect(element.typing).toBe(false);
  });

  it("defaults messages to empty array", () => {
    expect(element.messages).toEqual([]);
  });

  // --- Title attribute/property ---

  it("reflects the title attribute to the header", () => {
    element.setAttribute("title", "Support");
    document.body.appendChild(element);
    const titleEl = element.shadowRoot?.querySelector(".title");
    expect(titleEl?.textContent).toBe("Support");
  });

  it("updates the title via property setter", () => {
    document.body.appendChild(element);
    element.title = "Help Desk";
    const titleEl = element.shadowRoot?.querySelector(".title");
    expect(titleEl?.textContent).toBe("Help Desk");
  });

  // --- Subtitle attribute/property ---

  it("shows subtitle when attribute is set", () => {
    element.setAttribute("subtitle", "Ask anything");
    document.body.appendChild(element);
    const subtitleEl = element.shadowRoot?.querySelector(".subtitle");
    expect(subtitleEl?.textContent).toBe("Ask anything");
  });

  it("updates the subtitle via property setter", () => {
    document.body.appendChild(element);
    element.subtitle = "Agent chat";
    const subtitleEl = element.shadowRoot?.querySelector(".subtitle");
    expect(subtitleEl?.textContent).toBe("Agent chat");
  });

  // --- Placeholder attribute/property ---

  it("reflects the placeholder attribute to the input", () => {
    element.setAttribute("placeholder", "Ask a question...");
    document.body.appendChild(element);
    const textarea = element.shadowRoot?.querySelector("textarea");
    expect(textarea?.getAttribute("placeholder")).toBe("Ask a question...");
  });

  it("updates the placeholder via property setter", () => {
    document.body.appendChild(element);
    element.placeholder = "Type here";
    const textarea = element.shadowRoot?.querySelector("textarea");
    expect(textarea?.getAttribute("placeholder")).toBe("Type here");
  });

  // --- Typing attribute/property ---

  it("disables input and send button when typing is true", () => {
    element.setAttribute("typing", "");
    document.body.appendChild(element);
    const textarea = element.shadowRoot?.querySelector("textarea");
    const sendBtn = element.shadowRoot?.querySelector<HTMLButtonElement>("button.send");
    expect(textarea?.disabled).toBe(true);
    expect(sendBtn?.disabled).toBe(true);
  });

  it("shows typing indicator when typing is true", () => {
    element.setAttribute("typing", "");
    document.body.appendChild(element);
    const typingEl = element.shadowRoot?.querySelector(".typing");
    expect(typingEl?.textContent).toBe("Typing...");
  });

  it("reflects typing via property setter", () => {
    document.body.appendChild(element);
    element.typing = true;
    expect(element.hasAttribute("typing")).toBe(true);
    element.typing = false;
    expect(element.hasAttribute("typing")).toBe(false);
  });

  // --- Messages property ---

  it("renders messages when set via property", () => {
    document.body.appendChild(element);
    element.messages = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
    ];
    const messageEls = element.shadowRoot?.querySelectorAll(".message");
    expect(messageEls?.length).toBe(2);
    expect(messageEls?.[0]?.textContent).toBe("Hello");
    expect(messageEls?.[1]?.textContent).toBe("Hi there");
  });

  it("applies correct role classes to messages", () => {
    document.body.appendChild(element);
    element.messages = [
      { role: "user", content: "U" },
      { role: "assistant", content: "A" },
      { role: "system", content: "S" },
    ];
    const messageEls = element.shadowRoot?.querySelectorAll(".message");
    expect(messageEls?.[0]?.classList.contains("message-user")).toBe(true);
    expect(messageEls?.[1]?.classList.contains("message-assistant")).toBe(true);
    expect(messageEls?.[2]?.classList.contains("message-system")).toBe(true);
  });

  it("shows system hint when messages are empty", () => {
    document.body.appendChild(element);
    element.messages = [];
    const messagesEl = element.shadowRoot?.querySelector(".messages");
    expect(messagesEl?.textContent).toContain("Send a message to start");
  });

  it("does not mutate the original messages array", () => {
    const original = [{ role: "user" as const, content: "test" }];
    element.messages = original;
    element.messages[0].content = "modified";
    expect(original[0].content).toBe("test");
  });

  // --- Events: send ---

  it("emits ars-chat-panel:send on send button click", () => {
    document.body.appendChild(element);
    const textarea = element.shadowRoot?.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "Hello world";
    textarea.dispatchEvent(new Event("input"));

    const events: unknown[] = [];
    element.addEventListener("ars-chat-panel:send", (e) => {
      events.push((e as CustomEvent).detail);
    });

    element.shadowRoot?.querySelector("button.send")?.dispatchEvent(new MouseEvent("click"));

    expect(events).toEqual([{ message: "Hello world" }]);
  });

  it("emits ars-chat-panel:send on Enter key", () => {
    document.body.appendChild(element);
    const textarea = element.shadowRoot?.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "Enter test";
    textarea.dispatchEvent(new Event("input"));

    const events: unknown[] = [];
    element.addEventListener("ars-chat-panel:send", (e) => {
      events.push((e as CustomEvent).detail);
    });

    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(events).toEqual([{ message: "Enter test" }]);
  });

  it("does not emit send event for empty messages", () => {
    document.body.appendChild(element);
    const events: unknown[] = [];
    element.addEventListener("ars-chat-panel:send", () => {
      events.push(true);
    });

    element.shadowRoot?.querySelector("button.send")?.dispatchEvent(new MouseEvent("click"));

    expect(events).toEqual([]);
  });

  it("does not emit send event while typing", () => {
    document.body.appendChild(element);
    element.typing = true;
    const textarea = element.shadowRoot?.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "blocked";
    textarea.dispatchEvent(new Event("input"));

    const events: unknown[] = [];
    element.addEventListener("ars-chat-panel:send", () => {
      events.push(true);
    });

    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(events).toEqual([]);
  });

  it("clears draft value after send", () => {
    document.body.appendChild(element);
    const textarea = element.shadowRoot?.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "will clear";
    textarea.dispatchEvent(new Event("input"));

    element.shadowRoot?.querySelector("button.send")?.dispatchEvent(new MouseEvent("click"));

    expect(textarea.value).toBe("");
  });

  // --- Events: clear ---

  it("emits ars-chat-panel:clear on clear button click", () => {
    document.body.appendChild(element);
    const events: unknown[] = [];
    element.addEventListener("ars-chat-panel:clear", () => {
      events.push(true);
    });

    element.shadowRoot?.querySelector("button.clear")?.dispatchEvent(new MouseEvent("click"));

    expect(events).toEqual([true]);
  });

  it("dispatches composed events", () => {
    document.body.appendChild(element);
    let sendComposed = false;
    let clearComposed = false;

    element.addEventListener("ars-chat-panel:send", (e) => {
      sendComposed = (e as CustomEvent).composed;
    });
    element.addEventListener("ars-chat-panel:clear", (e) => {
      clearComposed = (e as CustomEvent).composed;
    });

    const textarea = element.shadowRoot?.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "x";
    textarea.dispatchEvent(new Event("input"));
    element.shadowRoot?.querySelector("button.send")?.dispatchEvent(new MouseEvent("click"));
    element.shadowRoot?.querySelector("button.clear")?.dispatchEvent(new MouseEvent("click"));

    expect(sendComposed).toBe(true);
    expect(clearComposed).toBe(true);
  });

  // --- Observed attributes ---

  it("observes the expected attributes", () => {
    expect(ArsChatPanel.observedAttributes).toContain("title");
    expect(ArsChatPanel.observedAttributes).toContain("subtitle");
    expect(ArsChatPanel.observedAttributes).toContain("placeholder");
    expect(ArsChatPanel.observedAttributes).toContain("typing");
    expect(ArsChatPanel.observedAttributes).toContain("collapsible");
    expect(ArsChatPanel.observedAttributes).toContain("collapsed");
  });

  // --- CSS token usage ---

  it("uses design token variables in styles", () => {
    document.body.appendChild(element);
    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-surface");
    expect(styles).toContain("--arswc-color-border");
    expect(styles).toContain("--arswc-color-text");
    expect(styles).toContain("--arswc-color-muted");
    expect(styles).toContain("--arswc-color-accent");
    expect(styles).toContain("--arswc-font-family-sans");
    expect(styles).toContain("--arswc-spacing-sm");
    expect(styles).toContain("--arswc-spacing-md");
    expect(styles).toContain("--arswc-radius-sm");
    expect(styles).toContain("--arswc-radius-md");
  });

  // --- Re-render on attribute change ---

  it("re-renders when title changes after connection", () => {
    document.body.appendChild(element);
    element.setAttribute("title", "New Title");
    const titleEl = element.shadowRoot?.querySelector(".title");
    expect(titleEl?.textContent).toBe("New Title");
  });

  // --- Collapsible attribute/property ---

  it("defaults collapsible to false", () => {
    expect(element.collapsible).toBe(false);
  });

  it("toggles collapsible via property setter", () => {
    element.collapsible = true;
    expect(element.hasAttribute("collapsible")).toBe(true);
    element.collapsible = false;
    expect(element.hasAttribute("collapsible")).toBe(false);
  });

  it("hides collapse toggle when collapsible is false", () => {
    document.body.appendChild(element);
    const toggle = element.shadowRoot?.querySelector(".collapse-toggle") as HTMLElement;
    expect(toggle?.style.display).toBe("none");
  });

  it("shows collapse toggle when collapsible is true", () => {
    element.collapsible = true;
    document.body.appendChild(element);
    const toggle = element.shadowRoot?.querySelector(".collapse-toggle") as HTMLElement;
    expect(toggle?.style.display).toBe("");
  });

  it("toggles collapsed state on collapse-toggle click", () => {
    element.collapsible = true;
    document.body.appendChild(element);
    const toggle = element.shadowRoot?.querySelector(".collapse-toggle") as HTMLButtonElement;
    toggle.dispatchEvent(new MouseEvent("click"));
    expect(element.collapsed).toBe(true);
    toggle.dispatchEvent(new MouseEvent("click"));
    expect(element.collapsed).toBe(false);
  });

  it("applies collapsed class to panel when collapsed", () => {
    element.collapsible = true;
    document.body.appendChild(element);
    element.collapsed = true;
    const panel = element.shadowRoot?.querySelector(".panel");
    expect(panel?.classList.contains("collapsed")).toBe(true);
  });

  // --- Textarea behavior ---

  it("does not emit send on Shift+Enter", () => {
    document.body.appendChild(element);
    const textarea = element.shadowRoot?.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "line1";
    textarea.dispatchEvent(new Event("input"));

    const events: unknown[] = [];
    element.addEventListener("ars-chat-panel:send", (e) => {
      events.push((e as CustomEvent).detail);
    });

    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", shiftKey: true }));

    expect(events).toEqual([]);
  });
});
