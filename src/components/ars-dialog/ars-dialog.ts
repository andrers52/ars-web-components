import WebComponentBase from "../web-component-base/web-component-base.js";
import { DEFAULT_CSS } from "./ars-dialog-css.js";
import "../../mixins/pressed-effect-mixin/pressed-effect-mixin.js";

type ArsDialogMountOptions = {
  mountTarget?: ParentNode & { appendChild(node: Node): Node };
  targetDocument?: Document;
};

class ArsDialog extends WebComponentBase {
  [key: string]: any;

  constructor() {
    super();
    ArsDialog.#initializeDialog(this);
  }

  connectedCallback() {}

  #getTemplate() {
    return ArsDialog.#createTemplate(this);
  }

  static get observedAttributes() {
    return ["open", "localizedOk", "localizedCancel", "localized-close", "show-close-button", "custom-css", "css-vars"];
  }

  attributeChangedCallback(attrName: string, oldVal: string | null, newVal: string | null) {
    super.attributeChangedCallback(attrName, oldVal, newVal);
    if (attrName === "open" && newVal === "true") this.#activate();
    if (attrName === "custom-css") {
      this.customCSS = newVal;
      if (this.shadowRoot) this.#render();
    }
    if (attrName === "css-vars") {
      this.cssVars = ArsDialog.#parseCSSVars(newVal);
      ArsDialog.#applyCSSVars(this.shadowRoot, this.cssVars);
    }
  }

  #render() {
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) return;
    shadowRoot.innerHTML = this.#getTemplate();
    ArsDialog.#applyCSSVars(shadowRoot, this.cssVars);
  }

  setCSSVars(cssVars: Record<string, string>) {
    this.cssVars = { ...cssVars };
    ArsDialog.#applyCSSVars(this.shadowRoot, this.cssVars);
  }

  getCSSVars() {
    return { ...this.cssVars };
  }

  #activate() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.#render();
    ArsDialog.#showOverlay(this);
    ArsDialog.#setupButtonHandlers(this);
    
    // Emit a custom event when dialog is fully activated
    this.dispatchEvent(new CustomEvent('dialog-activated', {
      bubbles: true,
      detail: { dialogId: this.id }
    }));
  }

  #deactivate() {
    ArsDialog.#hideOverlay(this);
  }

  #isActive() {
    return ArsDialog.#isOverlayVisible(this);
  }

  static notify(content = "", title = "!", cssVars = {}, customCSS = "", options: ArsDialogMountOptions = {}) {
    return ArsDialog.#createNotificationPromise(
      content,
      title,
      customCSS,
      cssVars,
      options,
    );
  }

  static dialog(
    content = "",
    title = "",
    cssVars = {},
    customCSS = "",
    localizedOk = "Ok",
    localizedCancel = "Cancel",
    options: ArsDialogMountOptions = {},
  ) {
    return ArsDialog.#createDialogPromise(
      content,
      title,
      cssVars,
      customCSS,
      localizedOk,
      localizedCancel,
      options,
    );
  }

  // ---- PRIVATE STATIC UTILITY METHODS ----
  static #getTitle(component: ArsDialog) {
    return component.title || component.getAttribute("title") || "";
  }

  static #getContent(component: ArsDialog) {
    return component.content || component.getAttribute("content");
  }

  static #shouldShowConfirmButtons(component: ArsDialog) {
    return component.getAttribute("showConfirmButtons") === "true";
  }

  static #getLocalizedOk(component: ArsDialog) {
    return component.localizedOk || "Ok";
  }

  static #getLocalizedCancel(component: ArsDialog) {
    return component.localizedCancel || "Cancel";
  }

  static #createCSSVarsString(cssVars: Record<string, string>) {
    if (!cssVars || Object.keys(cssVars).length === 0) return "";
    let cssVarString = ":host {\n";
    for (const [key, value] of Object.entries(cssVars)) {
      cssVarString += `  --${key}: ${value};\n`;
    }
    cssVarString += "}\n";
    return cssVarString;
  }

  static #parseCSSVars(value: string | null) {
    if (!value) return {};
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  static #applyCSSVars(shadowRoot: ShadowRoot | null, cssVars: Record<string, string>) {
    if (!cssVars || !shadowRoot) return;
    let cssVarStyle = shadowRoot.querySelector("style.css-vars-style");
    if (!cssVarStyle) {
      cssVarStyle = document.createElement("style");
      cssVarStyle.className = "css-vars-style";
      shadowRoot.prepend(cssVarStyle);
    }
    cssVarStyle.textContent = ArsDialog.#createCSSVarsString(cssVars);
  }

  static #createConfirmButtonsHTML(component: ArsDialog) {
    return `
      <pressed-effect-mixin>
        <button id="dialog_button_ok:${component.id}">
          ${ArsDialog.#getLocalizedOk(component)}
        </button>
      </pressed-effect-mixin>
      <pressed-effect-mixin>
        <button
          id="dialog_button_cancel:${component.id}"
          style="margin-left: 5px">
          ${ArsDialog.#getLocalizedCancel(component)}
        </button>
      </pressed-effect-mixin>
    `;
  }

  static #createOkButtonHTML(component: ArsDialog) {
    return `
      <pressed-effect-mixin>
        <button id="dialog_button_ok:${component.id}"> Ok </button>
      </pressed-effect-mixin>
    `;
  }

  static #createFooterHTML(component: ArsDialog) {
    if (ArsDialog.#shouldShowConfirmButtons(component)) {
      return ArsDialog.#createConfirmButtonsHTML(component);
    } else {
      return ArsDialog.#createOkButtonHTML(component);
    }
  }

  static #getShowCloseButton(component: ArsDialog) {
    const attr = component.getAttribute("show-close-button");
    return attr === null || attr !== "false";
  }

  static #getLocalizedClose(component: ArsDialog) {
    return component.getAttribute("localized-close") || "✕";
  }

  static #createTemplate(component: ArsDialog) {
    const showClose = ArsDialog.#getShowCloseButton(component);
    return `
      <style>
        ${component.defaultCSS}
        ${component.customCSS || ""}
      </style>
      <div id="overlay" class="overlay" style="visibility: hidden;">
        <div id="body" class="body">
          ${showClose ? `<button id="dialog_close:${component.id}" class="dialog-close" title="Close">${ArsDialog.#getLocalizedClose(component)}</button>` : ""}
          <div id="title" class="title">
            ${ArsDialog.#getTitle(component)}
          </div>
          <div id="content" class="content">
            ${ArsDialog.#getContent(component)}
          </div>
          <div id="footer" class="footer">
          ${ArsDialog.#createFooterHTML(component)}
          </div>
        </div>
      </div>
    `;
  }

  static #createButtonHandler(component: ArsDialog, action: string) {
    return () => {
      if (action === "ok") {
        const content = component.shadowRoot!.getElementById("content");
        component.onbuttonclick && component.onbuttonclick(content);
      } else if (action === "ok") {
        component.onbuttonclick && component.onbuttonclick(true);
      } else if (action === "cancel") {
        component.onbuttonclick && component.onbuttonclick(false);
      }
      component.#deactivate();
    };
  }

  static #setupButtonHandlers(component: ArsDialog) {
    const sr = component.shadowRoot!;
    const okButton = sr.getElementById(
      `dialog_button_ok:${component.id}`,
    );
    if (okButton) {
      okButton.onclick = ArsDialog.#createButtonHandler(component, "ok");
    }

    const cancelButton = sr.getElementById(
      `dialog_button_cancel:${component.id}`,
    );
    if (cancelButton)
      cancelButton.onclick = ArsDialog.#createButtonHandler(component, "cancel");

    const closeButton = sr.getElementById(
      `dialog_close:${component.id}`,
    );
    if (closeButton) {
      closeButton.onclick = () => {
        component.onbuttonclick && component.onbuttonclick(null);
        component.dispatchEvent(new CustomEvent("dialog:close", {
          bubbles: true,
          composed: true,
        }));
        component.#deactivate();
      };
    }
  }

  static #showOverlay(component: ArsDialog) {
    component.shadowRoot!.getElementById("overlay")!.style.visibility = "visible";
  }

  static #hideOverlay(component: ArsDialog) {
    const overlay = component.shadowRoot!.getElementById("overlay");
    if (overlay) overlay.style.visibility = "hidden";
  }

  static #isOverlayVisible(component: ArsDialog) {
    return (
      component.shadowRoot!.getElementById("overlay")!.style.visibility ===
      "visible"
    );
  }

  static #createDialogElement(
    id: string,
    content: string,
    title: string,
    showConfirmButtons: boolean | null,
    localizedOk: string | null,
    localizedCancel: string | null,
    customCSS: string | null,
    cssVars: Record<string, string>,
    options: ArsDialogMountOptions,
  ) {
    const targetDocument = options.targetDocument || document;
    const dialog = targetDocument.createElement("ars-dialog");
    dialog.id = id;
    if (customCSS) dialog.setAttribute("custom-css", customCSS);
    if (Object.keys(cssVars).length > 0)
      dialog.setAttribute("css-vars", JSON.stringify(cssVars));
    dialog.setAttribute("content", content);
    dialog.setAttribute("showConfirmButtons", String(showConfirmButtons));
    dialog.setAttribute("title", title);
    if (showConfirmButtons) {
      dialog.setAttribute("localizedOk", localizedOk ?? "");
      dialog.setAttribute("localizedCancel", localizedCancel ?? "");
    }
    return dialog;
  }

  static #resolveMountTarget(options: ArsDialogMountOptions) {
    const targetDocument = options.targetDocument || document;
    return options.mountTarget || targetDocument.body;
  }

  static #setupDialogPromise(dialog: ArsDialog, resolve: (value: unknown) => void) {
    dialog.onbuttonclick = function (result: unknown) {
      dialog.parentNode!.removeChild(dialog);
      resolve(result);
    };
    dialog.setAttribute("open", "true");
  }

  static #createNotificationPromise(content: string, title: string, customCSS: string | null, cssVars: Record<string, string>, options: ArsDialogMountOptions) {
    return new Promise(function (resolve) {
      const dialog = ArsDialog.#createDialogElement(
        "notification_dialog",
        content,
        title,
        false,
        null,
        null,
        customCSS,
        cssVars,
        options,
      ) as ArsDialog;
      ArsDialog.#resolveMountTarget(options).appendChild(dialog);
      ArsDialog.#setupDialogPromise(dialog, resolve);
    });
  }

  static #createDialogPromise(
    content: string,
    title: string,
    cssVars: Record<string, string>,
    customCSS: string | null,
    localizedOk: string | null,
    localizedCancel: string | null,
    options: ArsDialogMountOptions,
  ) {
    return new Promise(function (resolve) {
      const dialog = ArsDialog.#createDialogElement(
        "notification_dialog",
        content,
        title,
        true,
        localizedOk,
        localizedCancel,
        customCSS,
        cssVars,
        options,
      ) as ArsDialog;
      ArsDialog.#resolveMountTarget(options).appendChild(dialog);
      ArsDialog.#setupDialogPromise(dialog, resolve);
    });
  }

  static #initializeDialog(component: ArsDialog) {
    component.cssVars = {};
    component.customCSS = null;
    component.defaultCSS = DEFAULT_CSS;
    return component;
  }
}

export { ArsDialog, ArsDialog as default };
