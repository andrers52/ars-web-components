// usage:
//  <ars-color-select
//    color: base initial color. If not defined, a random color will be chosen.
//  </ars-color-select>
import { EArray } from "arslib";
import WebComponentBase from "../web-component-base/web-component-base.js";
var colors = [
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
class ArsColorSelect extends WebComponentBase {
  constructor() {
    super();
    this.template = `
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
          position:absolute;
          top: 40%; left: 50%;
          transform: translate(-50%,-40%);
          user-select: none;
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          height: 80%;
          z-index: 99;
          visibility: inherit;
        }
        .flex-container > div {
          width: 10%;
          margin: 4px;
          border-radius: 5px;
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
      <div id= "colorSelector" class="colorSelector"  style="visibility: visible;"> &nbsp; </div>
      <div id="optionsContainer" class="overlay" style="visibility: hidden;">
        <div id="colorsDiv" class="flex-container center" >
        ${colors
          .map((color) => {
            return `<div style="background-color: ${color};"></div>`;
          })
          .join(" &nbsp ")}
        </div>
      </div>
    `;
    this.colorSelector = "";
  }

  connectedCallback() {
    // *** TODO *** Create ShadowRoot with this test in web-component-base.js ***
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });

    this.shadowRoot.innerHTML = eval("`" + this.template + "`");
    let colorSelector = this.shadowRoot.getElementById("colorSelector");
    let colorsDiv = this.shadowRoot.getElementById("colorsDiv");
    let innerDivs = colorsDiv.getElementsByTagName("div");
    for (let i = 0; i < innerDivs.length; i++) {
      var self = this;
      innerDivs[i].onclick = function (element) {
        colorSelector.style.backgroundColor =
          element.currentTarget.style.backgroundColor;
        self.setAttribute("color", element.currentTarget.style.backgroundColor);
        self._toggleColorSelection();
      };
    }

    if (!this.getAttribute("color"))
      this.setAttribute("color", EArray.choice(colors));
    this._setBackgroundColor(this.getAttribute("color"));
    this.shadowRoot.getElementById("colorSelector").onclick = function () {
      self._toggleColorSelection();
    };
  }

  static get observedAttributes() {
    return ["color"];
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);

    if (attrName === "color" && oldVal !== newVal && newVal) {
      this._sendColorChangeEvent(newVal);
      this._setBackgroundColor(newVal);
    }
  }

  _setBackgroundColor(color) {
    if (!this.shadowRoot) return;
    this.shadowRoot.getElementById("colorSelector").style.backgroundColor =
      color;
  }

  _toggleElementVisibility(element) {
    element.style.visibility =
      element.style.visibility === "visible" ? "hidden" : "visible";
  }

  _toggleColorSelection() {
    this._toggleElementVisibility(
      this.shadowRoot.getElementById("colorSelector"),
    );
    this._toggleElementVisibility(
      this.shadowRoot.getElementById("optionsContainer"),
    );
    // this._toggleElementVisibility(this.shadowRoot.getElementById('colors'))
  }

  //send ars-color-select:change event with color to be picked up by another component
  _sendColorChangeEvent(color) {
    this.dispatchEvent(
      new CustomEvent("ars-color-select:change", {
        detail: { id: this.id, color: color },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

// *** TODO: MOVE THIS TO A BASE WEB COMPONENT CLASS ***
if (document.createElement("ars-color-select").constructor === HTMLElement) {
  window.customElements.define("ars-color-select", ArsColorSelect);
}

export { ArsColorSelect, ArsColorSelect as default };
