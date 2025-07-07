// usage:

// -- DIALOG --
// const result = await ArsDialog.dialog(`content: <br> <input id='test'></input>`,'dialog_tittle')
// if(!result) {console.log('cancel data returned'); return}
// // this is an example of how to retrieve information from the dialog
// console.log(`data inside input is ${result.querySelector('input').value}`)

// -- NOTIFICATION --
// - option to wait for the user to close notification
//  await ArsDialog.notify('content', 'title')
//  console.log('you just closed the notification!')
// - option to continue right away (fire and forget)
//  ArsDialog.notify('content', 'title')

// -- EXTRA STYLING ---
// You can add styles to the elements of the component
// by puting them in the "css/components/ars-dialog.css" file
// or setting the attribute "extra-css-file"

import WebComponentBase from "../web-component-base/web-component-base.js";
import { DEFAULT_CSS } from "./ars-dialog-css.js";
import "../../mixins/pressed-effect-mixin/pressed-effect-mixin.js";

class ArsDialog extends WebComponentBase {
  constructor() {
    super();
    ArsDialog.#initializeDialog(this);
  }

  connectedCallback() {}

  #getTemplate() {
    return ArsDialog.#createTemplate(this);
  }

  static get observedAttributes() {
    return ["open", "localizedOk", "localizedCancel", "custom-css", "css-vars"];
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);
    if (attrName === "open" && newVal === "true") this.#activate();
    if (attrName === "custom-css") {
      this.customCSS = newVal;
      if (this.shadowRoot) this.#render();
    }
    if (attrName === "css-vars") {
      this.cssVars = JSON.parse(newVal || "{}");
      ArsDialog.#applyCSSVars(this.shadowRoot, this.cssVars);
    }
  }

  #render() {
    this.shadowRoot.innerHTML = eval("`" + this.#getTemplate() + "`");
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
  }

  #deactivate() {
    ArsDialog.#hideOverlay(this);
  }

  #isActive() {
    return ArsDialog.#isOverlayVisible(this);
  }

  static notify(content = "", title = "!", cssVars = {}, customCSS = "") {
    return ArsDialog.#createNotificationPromise(
      content,
      title,
      customCSS,
      cssVars,
    );
  }

  static dialog(
    content = "",
    title = "",
    cssVars = {},
    customCSS = "",
    localizedOk = "Ok",
    localizedCancel = "Cancel",
  ) {
    return ArsDialog.#createDialogPromise(
      content,
      title,
      cssVars,
      customCSS,
      localizedOk,
      localizedCancel,
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

  static #createTemplate(component) {
    return `
      <style>
        ${component.defaultCSS}
        ${component.customCSS || ""}
      </style>
      <div id="overlay" class="overlay" style="visibility: hidden;">
        <div id="body" class="body">
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
  ) {
    const dialog = document.createElement("ars-dialog");
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

  static #setupDialogPromise(dialog, resolve) {
    dialog.onbuttonclick = function (result) {
      dialog.parentNode.removeChild(dialog);
      resolve(result);
    };
    dialog.setAttribute("open", true);
  }

  static #createNotificationPromise(content, title, customCSS, cssVars) {
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
      );
      document.body.appendChild(dialog);
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
      );
      document.body.appendChild(dialog);
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
