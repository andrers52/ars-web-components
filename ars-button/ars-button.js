// usage:
//  <button
//    is="ars-button"
//    id="<button_id>" <-- if provided will send click event
//    base-color: used as base for appearance and effects. Default is blue (rgb(191,128,64))
//    base-color="<base_color>"
//  </button>
//
// notification event: `ars-button:<button_id>:click`

import PressedEffect from "../mixins/pressed-effect/pressed-effect.js";
class ArsButton extends PressedEffect(HTMLButtonElement) {
  constructor() {
    super();

    this._setStyle();

    this.addEventListener("click", (event) => {
      this._notifyClick(event.detail);
      event.preventDefault();
    });
  }

  /**
   * Sends a custom event when the button is clicked.
   * @param {any} result - The detail of the event.
   * @private
   */
  _notifyClick(result) {
    if (!this.id) return;
    this.dispatchEvent(
      new CustomEvent(`ars-button:${this.id}:click`, {
        detail: { result },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Sets the initial style for the button.
   * @private
   */
  _setStyle() {
    const DEFAULT_COLOR = "#2196f3";
    this.style.backgroundColor = DEFAULT_COLOR;
    this.style.border = "none";
    this.style.borderRadius = "2px";
    this.style.padding = "6px 9px";
    this.style.fontSize = "16px";
    this.style.cursor = "pointer";
    this.style.color = "white";
    this.style.boxShadow = "0 0 4px #999";
    this.style.outline = "none";
  }

  static get observedAttributes() {
    return ["base-color"];
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    if (attrName === "base-color") {
      this.style.backgroundColor = newVal || "#2196f3";
    }
  }
}

window.customElements.define("ars-button", ArsButton, { extends: "button" });

export { ArsButton, ArsButton as default };
