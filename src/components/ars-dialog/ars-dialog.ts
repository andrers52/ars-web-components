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

  attributeChangedCallback(attrName, oldVal, newVal) {
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
    this.shadowRoot.innerHTML = this.#getTemplate();
    ArsDialog.#applyCSSVars(this.shadowRoot, this.cssVars);
  }

  setCSSVars(cssVars) {
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
  static #getTitle(component) {
    return component.title || component.getAttribute("title") || "";
  }

  static #getContent(component) {
    return component.content || component.getAttribute("content");
  }

  static #shouldShowConfirmButtons(component) {
    return component.getAttribute("showConfirmButtons") === "true";
  }

  static #getLocalizedOk(component) {
    return component.localizedOk || "Ok";
  }

  static #getLocalizedCancel(component) {
    return component.localizedCancel || "Cancel";
  }

  static #createCSSVarsString(cssVars) {
    if (!cssVars || Object.keys(cssVars).length === 0) return "";
    let cssVarString = ":host {\n";
    for (const [key, value] of Object.entries(cssVars)) {
      cssVarString += `  --${key}: ${value};\n`;
    }
    cssVarString += "}\n";
    return cssVarString;
  }

  static #parseCSSVars(value) {
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

  static #applyCSSVars(shadowRoot, cssVars) {
    if (!cssVars || !shadowRoot) return;
    let cssVarStyle = shadowRoot.querySelector("style.css-vars-style");
    if (!cssVarStyle) {
      cssVarStyle = document.createElement("style");
      cssVarStyle.className = "css-vars-style";
      shadowRoot.prepend(cssVarStyle);
    }
    cssVarStyle.textContent = ArsDialog.#createCSSVarsString(cssVars);
  }

  static #createConfirmButtonsHTML(component) {
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

  static #createOkButtonHTML(component) {
    return `
      <pressed-effect-mixin>
        <button id="dialog_button_ok:${component.id}"> Ok </button>
      </pressed-effect-mixin>
    `;
  }

  static #createFooterHTML(component) {
    if (ArsDialog.#shouldShowConfirmButtons(component)) {
      return ArsDialog.#createConfirmButtonsHTML(component);
    } else {
      return ArsDialog.#createOkButtonHTML(component);
    }
  }

  static #getShowCloseButton(component) {
    const attr = component.getAttribute("show-close-button");
    return attr === null || attr !== "false";
  }

  static #getLocalizedClose(component) {
    return component.getAttribute("localized-close") || "✕";
  }

  static #createTemplate(component) {
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

  static #createButtonHandler(component, action) {
    return () => {
      if (action === "ok") {
        const content = component.shadowRoot.getElementById("content");
        component.onbuttonclick && component.onbuttonclick(content);
      } else if (action === "ok") {
        component.onbuttonclick && component.onbuttonclick(true);
      } else if (action === "cancel") {
        component.onbuttonclick && component.onbuttonclick(false);
      }
      component.#deactivate();
    };
  }

  static #setupButtonHandlers(component) {
    const okButton = component.shadowRoot.getElementById(
      `dialog_button_ok:${component.id}`,
    );
    if (okButton) {
      okButton.onclick = ArsDialog.#createButtonHandler(component, "ok");
    }

    const cancelButton = component.shadowRoot.getElementById(
      `dialog_button_cancel:${component.id}`,
    );
    if (cancelButton)
      cancelButton.onclick = ArsDialog.#createButtonHandler(component, "cancel");

    const closeButton = component.shadowRoot.getElementById(
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

  static #showOverlay(component) {
    component.shadowRoot.getElementById("overlay").style.visibility = "visible";
  }

  static #hideOverlay(component) {
    const overlay = component.shadowRoot.getElementById("overlay");
    if (overlay) overlay.style.visibility = "hidden";
  }

  static #isOverlayVisible(component) {
    return (
      component.shadowRoot.getElementById("overlay").style.visibility ===
      "visible"
    );
  }

  static #createDialogElement(
    id,
    content,
    title,
    showConfirmButtons,
    localizedOk,
    localizedCancel,
    customCSS,
    cssVars,
    options: ArsDialogMountOptions,
  ) {
    const targetDocument = options.targetDocument || document;
    const dialog = targetDocument.createElement("ars-dialog");
    dialog.id = id;
    if (customCSS) dialog.setAttribute("custom-css", customCSS);
    if (Object.keys(cssVars).length > 0)
      dialog.setAttribute("css-vars", JSON.stringify(cssVars));
    dialog.setAttribute("content", content);
    dialog.setAttribute("showConfirmButtons", showConfirmButtons);
    dialog.setAttribute("title", title);
    if (showConfirmButtons) {
      dialog.setAttribute("localizedOk", localizedOk);
      dialog.setAttribute("localizedCancel", localizedCancel);
    }
    return dialog;
  }

  static #resolveMountTarget(options: ArsDialogMountOptions) {
    const targetDocument = options.targetDocument || document;
    return options.mountTarget || targetDocument.body;
  }

  static #setupDialogPromise(dialog, resolve) {
    dialog.onbuttonclick = function (result) {
      dialog.parentNode.removeChild(dialog);
      resolve(result);
    };
    dialog.setAttribute("open", true);
  }

  static #createNotificationPromise(content, title, customCSS, cssVars, options: ArsDialogMountOptions) {
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
      );
      ArsDialog.#resolveMountTarget(options).appendChild(dialog);
      ArsDialog.#setupDialogPromise(dialog, resolve);
    });
  }

  static #createDialogPromise(
    content,
    title,
    cssVars,
    customCSS,
    localizedOk,
    localizedCancel,
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
      );
      ArsDialog.#resolveMountTarget(options).appendChild(dialog);
      ArsDialog.#setupDialogPromise(dialog, resolve);
    });
  }

  static #initializeDialog(component) {
    component.cssVars = {};
    component.customCSS = null;
    component.defaultCSS = DEFAULT_CSS;
    return component;
  }
}

window.customElements.define("ars-dialog", ArsDialog);

export { ArsDialog, ArsDialog as default };
