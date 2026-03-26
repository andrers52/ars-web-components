// <ars-toast> — Notification/toast message with stacking, auto-dismiss, severity.
//
// Static API (primary):
//   ArsToast.show(message, options?) — returns the toast element
//   Options: { severity, duration, dismissible, position, mountTarget, targetDocument }
//
// Declarative API:
//   <ars-toast message="..." severity="info" duration="5000" dismissible open></ars-toast>
//
// Attributes:
//   message     — toast text
//   severity    — "info" | "success" | "warning" | "error" (default "info")
//   duration    — auto-dismiss ms (default 5000, 0 = no auto-dismiss)
//   dismissible — boolean, shows close button
//   open        — boolean, controls visibility
//
// Slots:
//   default — custom content
//   action  — action button area
//
// Events:
//   ars-toast:dismiss — composed, detail { reason: "timeout" | "user" | "programmatic" }

export type ArsToastSeverity = "info" | "success" | "warning" | "error";
export type ArsToastPosition =
  | "top-right" | "top-left" | "bottom-right" | "bottom-left"
  | "top-center" | "bottom-center";

export interface ArsToastOptions {
  severity?: ArsToastSeverity;
  duration?: number;
  dismissible?: boolean;
  position?: ArsToastPosition;
  mountTarget?: ParentNode;
  targetDocument?: Document;
}

// Container registry: one container per (mountTarget, position) pair
const containers = new Map<string, HTMLElement>();

/** Creates or retrieves a stacking container for toasts. */
function getOrCreateContainer(
  mountTarget: ParentNode,
  position: ArsToastPosition,
  doc: Document,
): HTMLElement {
  const key = `${position}-${(mountTarget as Element).tagName ?? "BODY"}`;
  let container = containers.get(key);
  if (container && container.isConnected) return container;

  container = doc.createElement("div");
  container.className = `ars-toast-container ars-toast-container--${position}`;
  container.setAttribute("aria-live", "polite");
  container.setAttribute("role", "status");

  // Position styles
  const isTop = position.startsWith("top");
  const isCenter = position.endsWith("center");
  const isLeft = position.endsWith("left");

  Object.assign(container.style, {
    position: "fixed",
    zIndex: "9999",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "16px",
    pointerEvents: "none",
    maxWidth: "100%",
    ...(isTop ? { top: "0" } : { bottom: "0" }),
    ...(isCenter
      ? { left: "50%", transform: "translateX(-50%)" }
      : isLeft
        ? { left: "0" }
        : { right: "0" }),
  });

  mountTarget.appendChild(container);
  containers.set(key, container);
  return container;
}

class ArsToast extends HTMLElement {
  private _timer: ReturnType<typeof setTimeout> | null = null;

  static get observedAttributes() {
    return ["message", "severity", "duration", "dismissible", "open"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#bindEvents();
    if (this.hasAttribute("open")) {
      this.#startAutoDismiss();
    }
  }

  disconnectedCallback() {
    this.#clearTimer();
  }

  attributeChangedCallback(name: string) {
    if (this.shadowRoot) this.#render();
    if (name === "open") {
      if (this.hasAttribute("open")) {
        this.#startAutoDismiss();
      } else {
        this.#clearTimer();
      }
    }
  }

  // --- Property accessors ---

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(val: string) {
    this.setAttribute("message", val);
  }

  get severity(): ArsToastSeverity {
    return (this.getAttribute("severity") as ArsToastSeverity) || "info";
  }

  set severity(val: ArsToastSeverity) {
    this.setAttribute("severity", val);
  }

  get duration(): number {
    return parseInt(this.getAttribute("duration") ?? "5000", 10);
  }

  set duration(val: number) {
    this.setAttribute("duration", String(val));
  }

  get dismissible(): boolean {
    return this.hasAttribute("dismissible");
  }

  set dismissible(val: boolean) {
    this.toggleAttribute("dismissible", val);
  }

  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(val: boolean) {
    this.toggleAttribute("open", val);
  }

  // --- Public API ---

  /** Dismisses the toast with a given reason. */
  dismiss(reason: "timeout" | "user" | "programmatic" = "programmatic") {
    this.#clearTimer();
    this.dispatchEvent(
      new CustomEvent("ars-toast:dismiss", {
        bubbles: true,
        composed: true,
        detail: { reason },
      }),
    );
    // Animate out then remove
    const wrapper = this.shadowRoot?.querySelector(".toast");
    if (wrapper) {
      wrapper.classList.add("toast--exit");
      wrapper.addEventListener("animationend", () => {
        this.remove();
      }, { once: true });
    } else {
      this.remove();
    }
  }

  /** Static API: show a toast programmatically. Returns the toast element. */
  static show(message: string, options: ArsToastOptions = {}): ArsToast {
    const {
      severity = "info",
      duration = 5000,
      dismissible = true,
      position = "top-right",
      mountTarget,
      targetDocument,
    } = options;

    const doc = targetDocument ?? (typeof document !== "undefined" ? document : undefined);
    if (!doc) throw new Error("ArsToast.show: no document available");

    const target = mountTarget ?? doc.body;
    const container = getOrCreateContainer(target, position, doc);

    const toast = doc.createElement("ars-toast") as ArsToast;
    toast.setAttribute("message", message);
    toast.setAttribute("severity", severity);
    toast.setAttribute("duration", String(duration));
    if (dismissible) toast.setAttribute("dismissible", "");
    toast.setAttribute("open", "");
    toast.style.pointerEvents = "auto";

    container.appendChild(toast);
    return toast;
  }

  // --- Internal ---

  #startAutoDismiss() {
    this.#clearTimer();
    const dur = this.duration;
    if (dur > 0) {
      this._timer = setTimeout(() => this.dismiss("timeout"), dur);
    }
  }

  #clearTimer() {
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  #render() {
    if (!this.shadowRoot) return;

    const msg = this.message;
    const sev = this.severity;
    const isDismissible = this.dismissible;
    const isOpen = this.open;

    const icon = ArsToast.#severityIcon(sev);

    this.shadowRoot.innerHTML = `
      <style>${ArsToast.#styles()}</style>
      ${isOpen ? `
      <div class="toast toast--${sev}" role="alert">
        <span class="icon" aria-hidden="true">${icon}</span>
        <div class="content">
          <span class="message">${ArsToast.#escapeHtml(msg)}</span>
          <slot></slot>
        </div>
        <slot name="action"></slot>
        ${isDismissible ? '<button class="close-btn" aria-label="Dismiss">&times;</button>' : ""}
      </div>
      ` : ""}
    `;
  }

  #bindEvents() {
    if (!this.shadowRoot) return;
    this.shadowRoot.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("close-btn")) {
        this.dismiss("user");
      }
    });
  }

  static #escapeHtml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  static #severityIcon(severity: ArsToastSeverity): string {
    switch (severity) {
      case "success": return "&#10003;";
      case "warning": return "&#9888;";
      case "error": return "&#10007;";
      default: return "&#8505;";
    }
  }

  static #styles(): string {
    return `
      :host {
        display: block;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }

      .toast {
        display: flex;
        align-items: flex-start;
        gap: var(--arswc-spacing-sm, 8px);
        padding: var(--arswc-spacing-sm, 8px) var(--arswc-spacing-md, 16px);
        border-radius: var(--arswc-radius-sm, 6px);
        background: var(--arswc-color-surface, #f6f8fb);
        color: var(--arswc-color-text, #1b2430);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: 280px;
        max-width: 420px;
        animation: ars-toast-enter 250ms ease forwards;
        border-left: 4px solid var(--arswc-color-accent, #2563eb);
      }

      .toast--info {
        border-left-color: var(--arswc-color-accent, #2563eb);
      }
      .toast--success {
        border-left-color: var(--arswc-color-success, #16a34a);
      }
      .toast--warning {
        border-left-color: var(--arswc-color-warning, #d97706);
      }
      .toast--error {
        border-left-color: var(--arswc-color-danger, #dc2626);
      }

      .toast--info .icon { color: var(--arswc-color-accent, #2563eb); }
      .toast--success .icon { color: var(--arswc-color-success, #16a34a); }
      .toast--warning .icon { color: var(--arswc-color-warning, #d97706); }
      .toast--error .icon { color: var(--arswc-color-danger, #dc2626); }

      .icon {
        font-size: 1.1rem;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .content {
        flex: 1;
        min-width: 0;
      }

      .message {
        font-size: var(--arswc-font-size-md, 0.875rem);
        line-height: 1.4;
      }

      .close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        color: var(--arswc-color-muted, #64748b);
        font-size: 1.2rem;
        cursor: pointer;
        border-radius: 50%;
        flex-shrink: 0;
        line-height: 1;
        padding: 0;
      }

      .close-btn:hover {
        background: var(--arswc-color-border, #d5dde8);
        color: var(--arswc-color-text, #1b2430);
      }

      .toast--exit {
        animation: ars-toast-exit 200ms ease forwards;
      }

      @keyframes ars-toast-enter {
        from {
          opacity: 0;
          transform: translateX(40px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes ars-toast-exit {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(40px);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .toast, .toast--exit {
          animation: none;
        }
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-toast")) {
  customElements.define("ars-toast", ArsToast);
}

export { ArsToast, ArsToast as default };
