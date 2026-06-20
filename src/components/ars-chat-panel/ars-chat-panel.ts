// <ars-chat-panel> — A reusable chat / conversation panel with message bubbles,
// text input, send button, and typing indicator.
//
// Attributes:
//   title        — panel header title (default "Chat")
//   subtitle     — panel header subtitle (default "")
//   placeholder  — input placeholder text (default "Type a message...")
//   typing       — boolean, shows typing indicator and disables input
//   collapsible  — boolean, enables collapse/expand toggle
//   collapsed    — boolean, collapses the panel to a tab
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
  private _expandTimeout: ReturnType<typeof setTimeout> | null = null;

  static get observedAttributes() {
    return ["title", "subtitle", "placeholder", "typing", "collapsible", "collapsed"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    // If initially collapsed, the button uses position:fixed and needs
    // accurate viewport coordinates. Re-render once after layout.
    if (this.collapsed) {
      requestAnimationFrame(() => this.#render());
    }
  }

  disconnectedCallback() {
    if (this._expandTimeout) {
      clearTimeout(this._expandTimeout);
      this._expandTimeout = null;
    }
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

  get collapsible(): boolean {
    return this.hasAttribute("collapsible");
  }

  set collapsible(value: boolean) {
    this.toggleAttribute("collapsible", value);
  }

  get collapsed(): boolean {
    return this.hasAttribute("collapsed");
  }

  set collapsed(value: boolean) {
    this.toggleAttribute("collapsed", value);
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

    // After the first mount, patch only the dynamic parts so the <textarea>
    // is never destroyed and never loses focus mid-keystroke.
    if (this.shadowRoot.querySelector(".panel")) {
      const sr = this.shadowRoot;
      const messagesEl = sr.querySelector<HTMLElement>(".messages");
      const textareaEl = sr.querySelector<HTMLTextAreaElement>("textarea");
      const sendBtn = sr.querySelector<HTMLButtonElement>("button.send");
      const typingEl = sr.querySelector<HTMLElement>(".typing");
      const clearBtn = sr.querySelector<HTMLButtonElement>("button.clear");
      const titleEl = sr.querySelector<HTMLElement>(".title");
      const subtitleEl = sr.querySelector<HTMLElement>(".subtitle");
      const panelEl = sr.querySelector<HTMLElement>(".panel");
      const collapseBtn = sr.querySelector<HTMLButtonElement>(".collapse-toggle");

      if (collapseBtn) {
        collapseBtn.style.display = this.collapsible ? "" : "none";
        collapseBtn.classList.toggle("collapsed", this.collapsed);
        collapseBtn.setAttribute(
          "aria-label",
          this.collapsed ? "Expand" : "Collapse",
        );
        collapseBtn.innerHTML = this.collapsed
          ? ArsChatPanel.#messageIcon()
          : ArsChatPanel.#chevronRightIcon();
        if (this.collapsed) {
          // Cancel any in-flight expand animation
          if (this._expandTimeout) {
            clearTimeout(this._expandTimeout);
            this._expandTimeout = null;
          }
          const rect = this.getBoundingClientRect();
          collapseBtn.style.position = "fixed";
          collapseBtn.style.left = "auto";
          collapseBtn.style.right = "0px";
          collapseBtn.style.top = rect.top + "px";
          collapseBtn.style.zIndex = "9999";
          collapseBtn.style.width = "56px";
          collapseBtn.style.height = "72px";
          collapseBtn.style.borderRadius = "10px 0 0 10px";
          collapseBtn.style.background = "var(--arswc-color-surface, #f6f8fb)";
          collapseBtn.style.border = "1px solid var(--arswc-color-border, #d5dde8)";
          collapseBtn.style.borderRight = "none";
          collapseBtn.style.display = "grid";
          collapseBtn.style.placeItems = "center";
          collapseBtn.style.transition = "";
        } else if (
          collapseBtn.style.position === "fixed" &&
          collapseBtn.style.right === "0px"
        ) {
          // The button was sitting at the viewport right-edge (collapsed).
          // Animate it to its final absolute position inside the host
          // while the panel slides in, then revert to CSS-driven positioning.
          const hostRect = this.getBoundingClientRect();
          const btnRect = collapseBtn.getBoundingClientRect();
          const targetLeft = hostRect.left + 8;
          const targetTop = hostRect.top + 12;

          // Lock the current visual position as explicit left/top
          collapseBtn.style.left = btnRect.left + "px";
          collapseBtn.style.top = btnRect.top + "px";
          collapseBtn.style.right = "auto";

          // Force reflow so the browser registers the starting values
          collapseBtn.offsetHeight;

          // Animate to the final position / size
          collapseBtn.style.transition =
            "left 280ms cubic-bezier(0.4, 0, 0.2, 1), " +
            "top 280ms cubic-bezier(0.4, 0, 0.2, 1), " +
            "width 280ms cubic-bezier(0.4, 0, 0.2, 1), " +
            "height 280ms cubic-bezier(0.4, 0, 0.2, 1), " +
            "border-radius 280ms cubic-bezier(0.4, 0, 0.2, 1)";
          collapseBtn.style.left = targetLeft + "px";
          collapseBtn.style.top = targetTop + "px";
          collapseBtn.style.width = "32px";
          collapseBtn.style.height = "32px";
          collapseBtn.style.borderRadius = "6px";

          this._expandTimeout = setTimeout(() => {
            this._expandTimeout = null;
            if (this.shadowRoot) {
              const btn = this.shadowRoot.querySelector<HTMLButtonElement>(
                ".collapse-toggle",
              );
              if (btn && !this.collapsed) {
                btn.style.position = "";
                btn.style.left = "";
                btn.style.right = "";
                btn.style.top = "";
                btn.style.zIndex = "";
                btn.style.width = "";
                btn.style.height = "";
                btn.style.borderRadius = "";
                btn.style.transition = "";
                btn.style.background = "";
                btn.style.border = "";
                btn.style.borderRight = "";
                btn.style.display = "";
                btn.style.placeItems = "";
              }
            }
          }, 300);
        }
      }

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

      if (textareaEl) {
        if (textareaEl.value !== this._draftValue) {
          textareaEl.value = this._draftValue;
          if (!this._draftValue) {
            textareaEl.style.height = "auto";
          }
        }
        textareaEl.disabled = isTyping;
        if (textareaEl.getAttribute("placeholder") !== this.placeholder) {
          textareaEl.setAttribute("placeholder", this.placeholder);
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

      if (panelEl) {
        panelEl.classList.toggle("collapsed", this.collapsed);
        panelEl.classList.toggle("has-collapse-toggle", this.collapsible);
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

    const panelClasses = [
      "panel",
      this.collapsible ? "has-collapse-toggle" : "",
      this.collapsed ? "collapsed" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const rect = this.getBoundingClientRect();
    const collapsedTop = this.collapsed ? Math.round(rect.top) : 0;
    const collapseToggleStyle = this.collapsible
      ? (this.collapsed
          ? `style="position:fixed;left:auto;right:0;top:${collapsedTop}px;z-index:9999;width:56px;height:72px;border-radius:10px 0 0 10px;background:var(--arswc-color-surface,#f6f8fb);border:1px solid var(--arswc-color-border,#d5dde8);border-right:none;display:grid;place-items:center;"`
          : "")
      : 'style="display:none;"';

    this.shadowRoot.innerHTML = `
      <style>${ArsChatPanel.#styles()}</style>
      <button type="button" class="collapse-toggle ${this.collapsed ? "collapsed" : ""}" ${collapseToggleStyle} aria-label="${this.collapsed ? "Expand" : "Collapse"}">
        ${this.collapsed ? ArsChatPanel.#messageIcon() : ArsChatPanel.#chevronRightIcon()}
      </button>
      <section class="${panelClasses}">
        <div class="header">
          <div>
            <div class="title">${ArsChatPanel.#escapeHtml(this.title)}</div>
            <div class="subtitle" style="${this.subtitle ? "" : "display:none;"}">${ArsChatPanel.#escapeHtml(this.subtitle)}</div>
          </div>
          <button type="button" class="clear" ${isTyping ? "disabled" : ""}>Clear</button>
        </div>
        <div class="messages">${messagesMarkup}</div>
        <div class="input-row">
          <textarea placeholder="${ArsChatPanel.#escapeHtml(this.placeholder)}" rows="1" ${isTyping ? "disabled" : ""}>${ArsChatPanel.#escapeHtml(this._draftValue)}</textarea>
          <button type="button" class="send" ${isTyping ? "disabled" : ""} aria-label="Send">
            ${ArsChatPanel.#arrowUpIcon()}
          </button>
        </div>
        <div class="typing">${isTyping ? "Typing..." : ""}</div>
      </section>
    `;

    const textarea = this.shadowRoot.querySelector<HTMLTextAreaElement>("textarea");
    const sendButton = this.shadowRoot.querySelector<HTMLButtonElement>("button.send");
    const clearButton = this.shadowRoot.querySelector<HTMLButtonElement>("button.clear");
    const messagesContainer = this.shadowRoot.querySelector<HTMLElement>(".messages");
    const collapseToggle = this.shadowRoot.querySelector<HTMLButtonElement>(".collapse-toggle");

    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    textarea?.addEventListener("input", () => {
      this._draftValue = textarea.value;
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    });

    textarea?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey || this.typing) {
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

    collapseToggle?.addEventListener("click", () => {
      this.collapsed = !this.collapsed;
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

  static #arrowUpIcon(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
  }

  static #chevronRightIcon(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
  }

  static #messageIcon(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  }

  static #styles(): string {
    return `
      :host {
        display: block;
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }

      .panel {
        box-sizing: border-box;
        position: relative;
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
        transition: transform 280ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .panel.collapsed {
        transform: translateX(100%);
        pointer-events: none;
      }

      .panel.has-collapse-toggle .header {
        padding-left: 36px;
      }

      .collapse-toggle {
        position: absolute;
        left: 8px;
        top: 12px;
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border: none;
        border-radius: var(--arswc-radius-sm, 6px);
        background: color-mix(in srgb, var(--arswc-color-accent, #2563eb) 15%, transparent);
        color: var(--arswc-color-accent, #2563eb);
        cursor: pointer;
        pointer-events: auto;
        z-index: 1;
        box-sizing: border-box;
        transition: background 120ms ease, color 120ms ease, left 280ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .collapse-toggle:hover {
        background: color-mix(in srgb, var(--arswc-color-accent, #2563eb) 25%, transparent);
      }

      .collapse-toggle.collapsed {
        /* position, left/right/top are set via inline styles (position:fixed) */
        width: 56px;
        height: 72px;
        border-radius: 10px 0 0 10px;
        background: var(--arswc-color-surface, #f6f8fb);
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-right: none;
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
        position: relative;
        display: flex;
        align-items: flex-end;
      }

      textarea {
        box-sizing: border-box;
        width: 100%;
        min-height: 40px;
        max-height: 120px;
        padding: var(--arswc-spacing-sm, 8px) 44px var(--arswc-spacing-sm, 8px) var(--arswc-spacing-md, 16px);
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-radius: var(--arswc-radius-sm, 6px);
        background: var(--arswc-color-bg, #ffffff);
        color: var(--arswc-color-text, #1b2430);
        font: inherit;
        resize: none;
        outline: none;
        line-height: 1.4;
      }

      textarea:focus-visible {
        outline: none;
        border-color: var(--arswc-color-accent, #2563eb);
        box-shadow: var(--arswc-focus-ring, 0 0 0 3px rgba(37, 99, 235, 0.3));
      }

      /* textarea:disabled intentionally unstyled — the component already
         sets disabled=true functionally; we keep the visual appearance
         unchanged so the UI doesn't flicker during agent typing. */

      button.send {
        position: absolute;
        right: 6px;
        bottom: 6px;
        width: 28px;
        height: 28px;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: linear-gradient(
          180deg,
          var(--arswc-button-primary-bg-start, #3b82f6),
          var(--arswc-button-primary-bg-end, #2563eb)
        );
        color: var(--arswc-button-primary-color, #ffffff);
        cursor: pointer;
        display: grid;
        place-items: center;
      }

      button.send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .typing {
        color: var(--arswc-color-muted, #64748b);
        font-size: var(--arswc-font-size-sm, 0.75rem);
        min-height: 1.2em;
      }
    `;
  }
}

export { ArsChatPanel, ArsChatPanel as default };
