// usage:

// -- DIALOG --
// const result = await ArsDialog.dialog(`content: <br> <input id='test'></input>`,'dialog_tittle')
// if(!result) {console.log('no data returned'); return}
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

import "../ars-button/ars-button.js";
import WebComponentBase from "../web-component-base/web-component-base.js";
import { DEFAULT_CSS } from "./ars-dialog-css.js";

class ArsDialog extends WebComponentBase {
  constructor() {
    super();

    // Theming and customization properties
    this.cssVars = {}; // CSS variables for theming
    this.customCSS = null; // Custom CSS string
    this.defaultCSS = DEFAULT_CSS; // Default CSS styles
  }
  connectedCallback() {}

  _getTemplate() {
    return `
      <style>
        ${this.defaultCSS}
        ${this.customCSS || ""}
      </style>
      <div id="overlay" class="overlay" style="visibility: hidden;">
        <div id="body" class="body">
          <div id="title" class="title">
            ${this.title || this.getAttribute("title") || ""}
          </div>
          <div id="content" class="content">
            ${this.content || this.getAttribute("content")}
          </div>
          <div id="footer" class="footer">
          ${this._showSelectedButtons()}
          </div>
        </div>
      </div>
    `;
  }

  _showSelectedButtons() {
    if (this.getAttribute("showConfirmButtons") === "true") {
      return `
        <button is="ars-button" id="dialog_button_yes:${this.id}"> ${
        this.localizedYes || "Yes"
      } </button>
        <button
          is="ars-button"
          id="dialog_button_no:${this.id}"
          style="margin-left: 5px"
        >  ${this.localizedNo || "No"} </button>
      `;
    } else {
      return `
          <button is="ars-button" id="dialog_button_ok:${this.id}"> Ok </button>
      `;
    }
  }
  static get observedAttributes() {
    return ["open", "localizedYes", "localizedNo", "custom-css", "css-vars"];
  }
  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);

    if (attrName === "open" && newVal === "true") this._activate();
    if (attrName === "custom-css") {
      this.customCSS = newVal;
      if (this.shadowRoot) this._render();
    }
    if (attrName === "css-vars") {
      this.cssVars = JSON.parse(newVal || "{}");
      this._applyCSSVars();
    }
  }

  _render() {
    this.shadowRoot.innerHTML = eval("`" + this._getTemplate() + "`");
    // Apply CSS variables after rendering
    this._applyCSSVars();
  }

  // Method to apply CSS variables
  _applyCSSVars() {
    if (!this.cssVars || !this.shadowRoot) return;

    // Find or create a style element specifically for CSS variables
    let cssVarStyle = this.shadowRoot.querySelector("style.css-vars-style");
    if (!cssVarStyle) {
      cssVarStyle = document.createElement("style");
      cssVarStyle.className = "css-vars-style";
      this.shadowRoot.prepend(cssVarStyle);
    }

    let cssVarString = ":host {\n";
    for (const [key, value] of Object.entries(this.cssVars)) {
      cssVarString += `  --${key}: ${value};\n`;
    }
    cssVarString += "}\n";

    cssVarStyle.textContent = cssVarString;
  }

  // Method to set CSS variables programmatically
  setCSSVars(cssVars) {
    // Replace all CSS variables, not merge
    this.cssVars = { ...cssVars };
    this._applyCSSVars();
  }

  // Method to get current CSS variables
  getCSSVars() {
    return { ...this.cssVars };
  }

  _activate() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });

    this._render();
    this.shadowRoot.getElementById("overlay").style.visibility = "visible";

    let yesButton = this.shadowRoot.getElementById(
      `dialog_button_yes:${this.id}`,
    );
    if (yesButton)
      yesButton.onclick = (() => {
        const content = this.shadowRoot.getElementById("content");
        this.onbuttonclick && this.onbuttonclick(content);
        this._deactivate();
      }).bind(this);

    let okButton = this.shadowRoot.getElementById(
      `dialog_button_ok:${this.id}`,
    );
    if (okButton)
      okButton.onclick = (() => {
        this.onbuttonclick && this.onbuttonclick(true);
        this._deactivate();
      }).bind(this);

    let noButton = this.shadowRoot.getElementById(
      `dialog_button_no:${this.id}`,
    );
    if (noButton)
      noButton.onclick = (() => {
        this.onbuttonclick && this.onbuttonclick(false);
        this._deactivate();
      }).bind(this);
  }

  _deactivate() {
    let overlay = this.shadowRoot.getElementById("overlay");
    if (overlay) overlay.style.visibility = "hidden";
  }

  _isActive() {
    return (
      this.shadowRoot.getElementById("overlay").style.visibility === "visible"
    );
  }

  static notify(content = "", title = "!", cssVars = {}, customCSS = "") {
    return new Promise(function (resolve) {
      let dialog = document.createElement("ars-dialog");
      dialog.id = "notification_dialog";
      if (customCSS) dialog.setAttribute("custom-css", customCSS);
      if (Object.keys(cssVars).length > 0)
        dialog.setAttribute("css-vars", JSON.stringify(cssVars));
      dialog.setAttribute("content", content);
      dialog.setAttribute("showConfirmButtons", false);
      dialog.setAttribute("title", title);
      document.body.appendChild(dialog);
      dialog.onbuttonclick = function () {
        dialog.parentNode.removeChild(dialog);
        resolve();
      };
      dialog.setAttribute("open", true);
    });
  }

  static dialog(
    content = "",
    title = "",
    cssVars = {},
    customCSS = "",
    localizedYes = "Yes",
    localizedNo = "No",
  ) {
    return new Promise(function (resolve) {
      let dialog = document.createElement("ars-dialog");
      dialog.id = "notification_dialog";
      if (customCSS) dialog.setAttribute("custom-css", customCSS);
      if (Object.keys(cssVars).length > 0)
        dialog.setAttribute("css-vars", JSON.stringify(cssVars));
      dialog.setAttribute("content", content);
      dialog.setAttribute("showConfirmButtons", true);
      dialog.setAttribute("title", title);
      dialog.setAttribute("localizedYes", localizedYes);
      dialog.setAttribute("localizedNo", localizedNo);
      document.body.appendChild(dialog);
      dialog.onbuttonclick = function (result) {
        dialog.parentNode.removeChild(dialog);
        resolve(result); // <content div element> or false
      };
      dialog.setAttribute("open", true);
    });
  }
}

window.customElements.define("ars-dialog", ArsDialog);

export { ArsDialog, ArsDialog as default };
