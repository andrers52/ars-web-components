// usage:
//  <button
//    is="ars-button"
//    id="<button_id>" <-- if provided will send click event
//    class="your-css-classes" <-- style with regular CSS classes
//    effect-color="#hex-color" <-- optional: color for pressed effect animation
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
    // No styling applied - component is purely functional
    // All styling should be handled via CSS classes

    // Store effect color for pressed effect if provided
    const effectColor = this.getAttribute("effect-color");
    if (effectColor) {
      this._effectColor = effectColor;
    }
  }

  static get observedAttributes() {
    return ["effect-color"];
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    if (attrName === "effect-color") {
      this._effectColor = newVal;
    }
  }
}

window.customElements.define("ars-button", ArsButton, { extends: "button" });

export { ArsButton, ArsButton as default };
