// <ars-chat-panel> — A reusable chat / conversation panel with message bubbles,
// text input, send button, and typing indicator.
//
// Attributes:
//   title        — panel header title (default "Chat")
//   subtitle     — panel header subtitle (default "")
//   placeholder  — input placeholder text (default "Type a message...")
//   typing       — boolean, shows typing indicator and disables input
//
// Properties:
//   messages     — ArsChatMessage[]  (set via JS only; array does not reflect to attribute)
//
// Events:
//   ars-chat-panel:send   — composed CustomEvent with detail { message }
//   ars-chat-panel:clear  — composed CustomEvent with no detail

export interface ArsChatMessage {
  role: "assistant" | "system" | "user";
  content: string;
}

class ArsChatPanel extends HTMLElement {
  private _messages: ArsChatMessage[] = [];
  private _draftValue = "";

  static get observedAttributes() {
    return ["title", "subtitle", "placeholder", "typing"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.#render();
    }
  }

  // --- Property accessors ---

  get title(): string {
    return this.getAttribute("title") || "Chat";
  }

  set title(value: string) {
    this.setAttribute("title", value);
  }

  get subtitle(): string {
    return this.getAttribute("subtitle") || "";
  }

  set subtitle(value: string) {
    this.setAttribute("subtitle", value);
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") || "Type a message...";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
  }

  get typing(): boolean {
    return this.hasAttribute("typing");
  }

  set typing(value: boolean) {
    this.toggleAttribute("typing", value);
  }

  get messages(): ArsChatMessage[] {
    return this._messages.map((m) => ({ ...m }));
  }

  set messages(value: ArsChatMessage[]) {
    this._messages = Array.isArray(value)
      ? value.map((m) => ({ ...m }))
      : [];
    if (this.shadowRoot) {
      this.#render();
    }
  }

  // --- Rendering ---

  #render() {
    if (!this.shadowRoot) {
      return;
    }

    const messages = this._messages;
    const isTyping = this.typing;

    // After the first mount, patch only the dynamic parts so the <input>
    // is never destroyed and never loses focus mid-keystroke.
    if (this.shadowRoot.querySelector(".panel")) {
      const sr = this.shadowRoot;
      const messagesEl = sr.querySelector<HTMLElement>(".messages");
      const inputEl = sr.querySelector<HTMLInputElement>("input");
      const sendBtn = sr.querySelector<HTMLButtonElement>("button.send");
      const typingEl = sr.querySelector<HTMLElement>(".typing");
      const clearBtn = sr.querySelector<HTMLButtonElement>("button.clear");
      const titleEl = sr.querySelector<HTMLElement>(".title");
      const subtitleEl = sr.querySelector<HTMLElement>(".subtitle");

      const messagesMarkup = messages.length
        ? messages
            .map(
              (m) =>
                `<div class="message message-${m.role}">${ArsChatPanel.#escapeHtml(m.content)}</div>`,
            )
            .join("")
        : `<div class="message message-system">Send a message to start.</div>`;

      if (messagesEl) {
        const wasAtBottom =
          messagesEl.scrollHeight - messagesEl.scrollTop <=
          messagesEl.clientHeight + 2;
        messagesEl.innerHTML = messagesMarkup;
        if (wasAtBottom) {
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
      }

      if (inputEl) {
        if (inputEl.value !== this._draftValue) {
          inputEl.value = this._draftValue;
        }
        inputEl.disabled = isTyping;
        if (inputEl.getAttribute("placeholder") !== this.placeholder) {
          inputEl.setAttribute("placeholder", this.placeholder);
        }
      }

      if (sendBtn) {
        sendBtn.disabled = isTyping;
      }

      if (typingEl) {
        typingEl.textContent = isTyping ? "Typing..." : "";
      }

      if (clearBtn) {
        clearBtn.disabled = isTyping;
      }

      if (titleEl) {
        titleEl.textContent = this.title;
      }

      if (subtitleEl) {
        subtitleEl.textContent = this.subtitle;
        subtitleEl.style.display = this.subtitle ? "" : "none";
      }

      return;
    }

    const messagesMarkup = messages.length
      ? messages
          .map(
            (m) =>
              `<div class="message message-${m.role}">${ArsChatPanel.#escapeHtml(m.content)}</div>`,
          )
          .join("")
      : `<div class="message message-system">Send a message to start.</div>`;

    this.shadowRoot.innerHTML = `
      <style>${ArsChatPanel.#styles()}</style>
      <section class="panel">
        <div class="header">
          <div>
            <div class="title">${ArsChatPanel.#escapeHtml(this.title)}</div>
            <div class="subtitle" style="${this.subtitle ? "" : "display:none;"}">${ArsChatPanel.#escapeHtml(this.subtitle)}</div>
          </div>
          <button type="button" class="clear" ${isTyping ? "disabled" : ""}>Clear</button>
        </div>
        <div class="messages">${messagesMarkup}</div>
        <div class="input-row">
          <input type="text" placeholder="${ArsChatPanel.#escapeHtml(this.placeholder)}" value="${ArsChatPanel.#escapeHtml(this._draftValue)}" ${isTyping ? "disabled" : ""}>
          <button type="button" class="send" ${isTyping ? "disabled" : ""}>Send</button>
        </div>
        <div class="typing">${isTyping ? "Typing..." : ""}</div>
      </section>
    `;

    const input = this.shadowRoot.querySelector<HTMLInputElement>("input");
    const sendButton = this.shadowRoot.querySelector<HTMLButtonElement>("button.send");
    const clearButton = this.shadowRoot.querySelector<HTMLButtonElement>("button.clear");
    const messagesContainer = this.shadowRoot.querySelector<HTMLElement>(".messages");

    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    input?.addEventListener("input", () => {
      this._draftValue = input.value;
    });

    input?.addEventListener("keypress", (event) => {
      if (event.key !== "Enter" || this.typing) {
        return;
      }
      event.preventDefault();
      this.#dispatchSend();
    });

    sendButton?.addEventListener("click", () => {
      this.#dispatchSend();
    });

    clearButton?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("ars-chat-panel:clear", {
          bubbles: true,
          composed: true,
        }),
      );
    });
  }

  #dispatchSend() {
    const message = this._draftValue.trim();
    if (!message) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("ars-chat-panel:send", {
        bubbles: true,
        composed: true,
        detail: { message },
      }),
    );
    this._draftValue = "";
    this.#render();
  }

  static #escapeHtml(value: unknown): string {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  static #styles(): string {
    return `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }

      .panel {
        box-sizing: border-box;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto auto;
        gap: var(--arswc-spacing-sm, 8px);
        width: 100%;
        height: 100%;
        padding: var(--arswc-spacing-md, 16px);
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-radius: var(--arswc-radius-md, 10px);
        background: var(--arswc-color-surface, #f6f8fb);
        color: var(--arswc-color-text, #1b2430);
      }

      .header {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: var(--arswc-spacing-sm, 8px);
      }

      .title {
        font-size: var(--arswc-font-size-md, 0.875rem);
        font-weight: 700;
      }

      .subtitle {
        margin-top: 4px;
        color: var(--arswc-color-muted, #64748b);
        font-size: var(--arswc-font-size-sm, 0.75rem);
        line-height: 1.35;
      }

      .clear {
        border: 1px solid var(--arswc-color-danger, #dc2626);
        border-radius: 999px;
        padding: var(--arswc-spacing-sm, 8px) var(--arswc-spacing-md, 16px);
        background: color-mix(in srgb, var(--arswc-color-danger, #dc2626) 10%, transparent);
        color: var(--arswc-color-danger, #dc2626);
        cursor: pointer;
        font: inherit;
        font-size: var(--arswc-font-size-sm, 0.75rem);
      }

      /* .clear:disabled intentionally unstyled — the component already
         sets disabled=true functionally; we keep the visual appearance
         unchanged so the UI doesn't flicker during agent typing. */

      .messages {
        overflow: auto;
        display: grid;
        align-content: start;
        gap: var(--arswc-spacing-sm, 8px);
        min-height: 0;
        padding-right: 4px;
      }

      .message {
        padding: var(--arswc-spacing-sm, 8px) var(--arswc-spacing-md, 16px);
        border-radius: var(--arswc-radius-md, 10px);
        line-height: 1.45;
        white-space: pre-wrap;
        word-break: break-word;
        border: 1px solid var(--arswc-color-border, #d5dde8);
      }

      .message-user {
        background: color-mix(in srgb, var(--arswc-color-accent, #2563eb) 15%, transparent);
        color: var(--arswc-color-accent, #2563eb);
        justify-self: end;
      }

      .message-assistant {
        background: var(--arswc-color-bg, #ffffff);
        color: var(--arswc-color-text, #1b2430);
      }

      .message-system {
        background: var(--arswc-color-surface, #f6f8fb);
        color: var(--arswc-color-muted, #64748b);
      }

      .input-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--arswc-spacing-sm, 8px);
      }

      input {
        min-width: 0;
        padding: var(--arswc-spacing-sm, 8px) var(--arswc-spacing-md, 16px);
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-radius: var(--arswc-radius-sm, 6px);
        background: var(--arswc-color-bg, #ffffff);
        color: var(--arswc-color-text, #1b2430);
        font: inherit;
      }

      input:focus-visible {
        outline: none;
        border-color: var(--arswc-color-accent, #2563eb);
        box-shadow: var(--arswc-focus-ring, 0 0 0 3px rgba(37, 99, 235, 0.3));
      }

      /* input:disabled intentionally unstyled — the component already
         sets disabled=true functionally; we keep the visual appearance
         unchanged so the UI doesn't flicker during agent typing. */

      button.send {
        border: none;
        border-radius: var(--arswc-radius-sm, 6px);
        padding: var(--arswc-spacing-sm, 8px) var(--arswc-spacing-md, 16px);
        background: linear-gradient(
          180deg,
          var(--arswc-button-primary-bg-start, #3b82f6),
          var(--arswc-button-primary-bg-end, #2563eb)
        );
        color: var(--arswc-button-primary-color, #ffffff);
        cursor: pointer;
        font: inherit;
        font-weight: 700;
      }

      /* button.send:disabled intentionally unstyled — the component already
         sets disabled=true functionally; we keep the visual appearance
         unchanged so the UI doesn't flicker during agent typing. */

      .typing {
        color: var(--arswc-color-muted, #64748b);
        font-size: var(--arswc-font-size-sm, 0.75rem);
        min-height: 1.2em;
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-chat-panel")) {
  customElements.define("ars-chat-panel", ArsChatPanel);
}

export { ArsChatPanel, ArsChatPanel as default };
