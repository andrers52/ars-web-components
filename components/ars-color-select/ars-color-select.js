// usage:
//  <ars-color-select
//    color: base initial color. If not defined, a random color will be chosen.
//  </ars-color-select>
import { EArray } from "arslib";
import WebComponentBase from "../web-component-base/web-component-base.js";

class ArsColorSelect extends WebComponentBase {
  // ---- PRIVATE STATIC UTILITY METHODS ----
  static #COLORS = [
    "Aqua",
    "Aquamarine",
    "BlueViolet",
    "Brown",
    "BurlyWood",
    "CadetBlue",
    "Chartreuse",
    "Chocolate",
    "Crimson",
    "Cyan",
    "DarkCyan",
    "DarkGoldenRod",
    "DarkGray",
    "DarkGreen",
    "DarkKhaki",
    "DarkMagenta",
    "DarkOliveGreen",
    "DarkOrange",
    "DarkOrchid",
    "DarkRed",
    "DarkSalmon",
    "DarkSeaGreen",
    "DarkSlateBlue",
    "DarkSlateGray",
    "DarkTurquoise",
    "DarkViolet",
    "DeepPink",
    "DeepSkyBlue",
    "DimGray",
    "DodgerBlue",
    "FireBrick",
    "ForestGreen",
    "Fuchsia",
    "Gold",
    "GoldenRod",
    "Gray",
    "Green",
    "GreenYellow",
    "HotPink",
    "IndianRed",
    "LawnGreen",
    "LightBlue",
    "LightCoral",
    "LightGreen",
    "LightSalmon",
    "LightSeaGreen",
    "LightSkyBlue",
    "LightSlateGray",
    "LightSteelBlue",
    "Lime",
    "LimeGreen",
    "Magenta",
    "MediumAquaMarine",
    "MediumOrchid",
    "MediumPurple",
    "MediumSeaGreen",
    "MediumSlateBlue",
    "MediumSpringGreen",
    "MediumTurquoise",
    "MediumVioletRed",
    "Olive",
    "Orange",
    "OrangeRed",
    "Orchid",
    "Peru",
    "Pink",
    "Plum",
    "Purple",
    "RebeccaPurple",
    "Red",
    "RosyBrown",
    "RoyalBlue",
    "SaddleBrown",
    "Salmon",
    "SandyBrown",
    "SeaGreen",
    "Sienna",
    "Silver",
    "SkyBlue",
    "SlateBlue",
    "SlateGray",
    "SpringGreen",
    "SteelBlue",
    "Tan",
    "Teal",
    "Thistle",
    "Tomato",
    "Turquoise",
    "Violet",
    "Yellow",
    "YellowGreen",
  ];

  static #getRandomColor() {
    return EArray.choice(ArsColorSelect.#COLORS);
  }

  static #getColorAttribute(element) {
    return element.getAttribute("color");
  }

  static #setColorAttribute(element, color) {
    element.setAttribute("color", color);
  }

  static #setBackgroundColor(element, color) {
    if (!element) return;
    element.style.backgroundColor = color;
  }

  static #toggleElementVisibility(element) {
    if (!element) return;
    element.style.visibility =
      element.style.visibility === "visible" ? "hidden" : "visible";
  }

  static #createColorChangeEvent(id, color) {
    return new CustomEvent("ars-color-select:change", {
      detail: { id, color },
      bubbles: true,
      composed: true,
    });
  }

  static #createColorDiv(color) {
    return `<div style="background-color: ${color};"></div>`;
  }

  static #createColorOptionsHTML() {
    return ArsColorSelect.#COLORS
      .map(ArsColorSelect.#createColorDiv)
      .join(" &nbsp ");
  }

  static #createTemplate() {
    return `
      <style>
        :host {
          display: inline-block;
          width: 44px;
          height: 44px;
        }
        .overlay {
          position: fixed;
          visibility: hidden;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.4);
          z-index: 2;
          cursor: pointer;
        }
        .center {
          margin: auto;
          width: 80%;
          padding: 5px;
        }
        .flex-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
          column-gap: 4px;
          row-gap: 8px;
          justify-content: center;
          align-content: flex-start;
          width: 80%;
          padding: 5px;
          position: absolute;
          top: 40%; left: 50%;
          transform: translate(-50%,-40%);
          user-select: none;
          z-index: 99;
          visibility: inherit;
        }
        .flex-container > div {
          width: 44px;
          height: 44px;
          border-radius: 6px;
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.10);
          cursor: pointer;
          transition: transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s;
          background-clip: padding-box;
        }
        .flex-container > div:hover {
          transform: translateY(-6px) scale(1.08);
          box-shadow: 0 6px 16px rgba(0,0,0,0.18);
          z-index: 1;
        }
        .colorSelector {
          width: 40px;
          height: 40px;
          margin: auto;
          background-color: blue;
          border-radius: 5px;
          cursor: pointer;
          border: 2px solid #ccc;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        .colorSelector:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
      </style>
      <div id="colorSelector" class="colorSelector" style="visibility: visible;"> &nbsp; </div>
      <div id="optionsContainer" class="overlay" style="visibility: hidden;">
        <div id="colorsDiv" class="flex-container center" >
        ${ArsColorSelect.#createColorOptionsHTML()}
        </div>
      </div>
    `;
  }

  static #createColorClickHandler(colorSelector, component) {
    return (element) => {
      const backgroundColor = element.currentTarget.style.backgroundColor;
      ArsColorSelect.#setBackgroundColor(colorSelector, backgroundColor);
      ArsColorSelect.#setColorAttribute(component, backgroundColor);
      component.toggleColorSelection();
    };
  }

  static #createSelectorClickHandler(component) {
    return () => {
      component.toggleColorSelection();
    };
  }

  static #initializeColorSelectors(shadowRoot, component) {
    const colorSelector = shadowRoot.getElementById("colorSelector");
    const colorsDiv = shadowRoot.getElementById("colorsDiv");
    const innerDivs = colorsDiv.getElementsByTagName("div");
    for (let i = 0; i < innerDivs.length; i++) {
      innerDivs[i].onclick = ArsColorSelect.#createColorClickHandler(
        colorSelector,
        component,
      );
    }
    colorSelector.onclick =
      ArsColorSelect.#createSelectorClickHandler(component);
  }

  static #initializeColor(component) {
    if (!ArsColorSelect.#getColorAttribute(component)) {
      ArsColorSelect.#setColorAttribute(
        component,
        ArsColorSelect.#getRandomColor(),
      );
    }
    return ArsColorSelect.#getColorAttribute(component);
  }

  static #sendColorChangeEvent(component, color) {
    component.dispatchEvent(
      ArsColorSelect.#createColorChangeEvent(component.id, color),
    );
  }

  static #toggleColorSelection(component) {
    const colorSelector = component.shadowRoot.getElementById("colorSelector");
    const optionsContainer =
      component.shadowRoot.getElementById("optionsContainer");
    ArsColorSelect.#toggleElementVisibility(colorSelector);
    ArsColorSelect.#toggleElementVisibility(optionsContainer);
  }

  static #initializeColorSelect(component) {
    if (!component.shadowRoot) {
      component.attachShadow({ mode: "open" });
    }
    component.shadowRoot.innerHTML = eval(
      "`" + ArsColorSelect.#createTemplate() + "`",
    );
    ArsColorSelect.#initializeColorSelectors(component.shadowRoot, component);
    const initialColor = ArsColorSelect.#initializeColor(component);
    ArsColorSelect.#setBackgroundColor(
      component.shadowRoot.getElementById("colorSelector"),
      initialColor,
    );
    // Add overlay click handler to dismiss on outside click
    const optionsContainer =
      component.shadowRoot.getElementById("optionsContainer");
    optionsContainer.onclick = (e) => {
      if (e.target === optionsContainer) {
        component.toggleColorSelection();
      }
    };
    return component;
  }

  // ---- PRIVATE INSTANCE METHODS ----

  constructor() {
    super();
    this.template = ArsColorSelect.#createTemplate();
    this.colorSelector = "";
  }

  connectedCallback() {
    ArsColorSelect.#initializeColorSelect(this);
  }

  static get observedAttributes() {
    return ["color"];
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);
    if (attrName === "color" && oldVal !== newVal && newVal) {
      ArsColorSelect.#sendColorChangeEvent(this, newVal);
      this.setBackgroundColor(newVal);
    }
  }

  // ---- PUBLIC INSTANCE METHODS ----
  setBackgroundColor(color) {
    if (!this.shadowRoot) return;
    ArsColorSelect.#setBackgroundColor(
      this.shadowRoot.getElementById("colorSelector"),
      color,
    );
  }

  toggleColorSelection() {
    const colorSelector = this.shadowRoot.getElementById("colorSelector");
    const optionsContainer = this.shadowRoot.getElementById("optionsContainer");
    ArsColorSelect.#toggleElementVisibility(colorSelector);
    ArsColorSelect.#toggleElementVisibility(optionsContainer);
  }
}

if (document.createElement("ars-color-select").constructor === HTMLElement) {
  window.customElements.define("ars-color-select", ArsColorSelect);
}

export { ArsColorSelect, ArsColorSelect as default };
