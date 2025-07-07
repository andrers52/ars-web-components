// usage:
//  <ars-data-roller
//    data: JSON array of items to display (required)
//    interval: milliseconds between transitions (optional, default: 3000)
//    animation-duration: milliseconds for animation (optional, default: 500)
//  </ars-data-roller>
import WebComponentBase from "../web-component-base/web-component-base.js";

class ArsDataRoller extends WebComponentBase {
  // ---- PRIVATE STATIC UTILITY METHODS ----
  static #DEFAULT_INTERVAL = 3000;
  static #DEFAULT_ANIMATION_DURATION = 500;

  static #createRollerItem(item, className = '') {
    if (typeof item === 'string') {
      return `<span class="param-value">${item}</span>`;
    } else if (typeof item === 'object' && item.title && item.hasOwnProperty('value')) {
      return `<span class="param-value"><span class="param-label">${item.title}:</span><span class="param-value-content"> ${item.value}</span></span>`;
    } else if (typeof item === 'object') {
      return `<span class="param-value">${Object.entries(item).map(([k, v]) => `<span class='param-label'>${k}:</span><span class='param-value-content'> ${v}</span>`).join(' | ')}</span>`;
    }
    return `<span class="param-value">${JSON.stringify(item)}</span>`;
  }

  static #createTemplate() {
    return `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 2.5em;
          perspective: 600px;
          pointer-events: none;
          background: var(--ars-roller-bg, transparent);
          border-radius: var(--ars-roller-radius, 8px);
        }
        .roller-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 2.5em;
          perspective: 600px;
          pointer-events: none;
        }
        .roller-item {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          color: var(--ars-roller-color, inherit);
          font-size: var(--ars-roller-font-size, 1em);
        }
        .roller-item.animate-out {
          transform: translateY(-60%) rotateX(90deg);
          opacity: 0;
          transition: all 0.5s cubic-bezier(0.4, 0, 0, 1);
        }
        .roller-item.animate-in {
          transform: translateY(60%) rotateX(-90deg);
          opacity: 0;
          transition: none;
        }
        .roller-item.active {
          transform: translateY(0) rotateX(0);
          opacity: 1;
          transition: all 0.5s cubic-bezier(0, 0, 0.2, 1);
        }
        .param-value {
          font-size: inherit;
          font-weight: 500;
          color: inherit;
          white-space: nowrap;
          text-align: center;
          display: block;
          width: 100%;
          pointer-events: none;
        }
        .param-label {
          font-weight: 500;
          opacity: 0.85;
          pointer-events: none;
          color: var(--ars-roller-label-color, #2196f3);
        }
        .param-value-content {
          margin-left: 12px;
          pointer-events: none;
        }
      </style>
      <div class="roller-container">
        <div class="roller-item current" style="z-index:2; display:block;">
          <!-- Current item will be rendered here -->
        </div>
        <div class="roller-item next" style="z-index:1; display:none;">
          <!-- Next item will be rendered here -->
        </div>
      </div>
    `;
  }

  static #parseDataAttribute(value) {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }

  static #parseIntervalAttribute(value) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? ArsDataRoller.#DEFAULT_INTERVAL : parsed;
  }

  static #parseAnimationDurationAttribute(value) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? ArsDataRoller.#DEFAULT_ANIMATION_DURATION : parsed;
  }

  // ---- PRIVATE INSTANCE METHODS ----
  #initializeRoller() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    this.shadowRoot.innerHTML = ArsDataRoller.#createTemplate();
    this.#render();
    this.#startRolling();
  }

  #render() {
    if (!this.shadowRoot) return;
    const current = this.shadowRoot.querySelector('.roller-item.current');
    const next = this.shadowRoot.querySelector('.roller-item.next');
    if (!current || !next) return;
    const currentItem = this.data[this.currentIndex] || '';
    const nextItem = this.data[(this.currentIndex + 1) % this.data.length] || '';
    current.innerHTML = ArsDataRoller.#createRollerItem(currentItem);
    next.innerHTML = ArsDataRoller.#createRollerItem(nextItem);
  }

  #startRolling() {
    this.#stopRolling();
    if (this.data.length > 1) {
      this.interval = setInterval(() => this.#nextItem(), this.intervalMs);
    }
  }

  #stopRolling() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  #nextItem() {
    if (this.animating || this.data.length < 2) return;
    this.animating = true;
    this.nextIndex = (this.currentIndex + 1) % this.data.length;
    this.#animateRoll();
  }

  #animateRoll() {
    const current = this.shadowRoot.querySelector('.roller-item.current');
    const next = this.shadowRoot.querySelector('.roller-item.next');

    if (!current || !next) {
      this.animating = false;
      return;
    }

    // Reset styles before animation
    current.style.transition = 'none';
    current.style.transform = 'translateY(0%) rotateX(0deg)';
    current.style.opacity = '1';
    next.style.transition = 'none';
    next.style.transform = 'translateY(60%) rotateX(-90deg)';
    next.style.opacity = '0';
    next.style.zIndex = '2';
    next.style.display = 'block';

    // Animate both
    setTimeout(() => {
      current.style.transition = `transform ${this.animationDuration}ms cubic-bezier(0.4,0.2,0.2,1), opacity ${this.animationDuration}ms`;
      next.style.transition = `transform ${this.animationDuration}ms cubic-bezier(0.4,0.2,0.2,1), opacity ${this.animationDuration}ms`;
      current.style.transform = 'translateY(-60%) rotateX(90deg)';
      current.style.opacity = '0';
      next.style.transform = 'translateY(0%) rotateX(0deg)';
      next.style.opacity = '1';

      // After animation, swap and reset styles for next cycle
      setTimeout(() => {
        this.currentIndex = this.nextIndex;
        this.animating = false;
        this.#render();
        // Reset styles for next cycle
        const newCurrent = this.shadowRoot.querySelector('.roller-item.current');
        const newNext = this.shadowRoot.querySelector('.roller-item.next');
        if (newCurrent && newNext) {
          newCurrent.style.transition = 'none';
          newCurrent.style.transform = 'translateY(0%) rotateX(0deg)';
          newCurrent.style.opacity = '1';
          newNext.style.transition = 'none';
          newNext.style.transform = 'translateY(60%) rotateX(-90deg)';
          newNext.style.opacity = '0';
          newNext.style.zIndex = '2';
          newNext.style.display = 'block';
        }
      }, this.animationDuration);
    }, 10);
  }

  // ---- CONSTRUCTOR AND LIFECYCLE ----
  constructor() {
    super();
    this.currentIndex = 0;
    this.interval = null;
    this.data = [];
    this.intervalMs = ArsDataRoller.#DEFAULT_INTERVAL;
    this.animationDuration = ArsDataRoller.#DEFAULT_ANIMATION_DURATION;
    this.animating = false;
    this.nextIndex = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#initializeRoller();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stopRolling();
  }

  static get observedAttributes() {
    return ["data", "interval", "animation-duration"];
  }

  static defaultAttributeValue(name) {
    switch (name) {
      case "data":
        return "[]";
      case "interval":
        return ArsDataRoller.#DEFAULT_INTERVAL.toString();
      case "animation-duration":
        return ArsDataRoller.#DEFAULT_ANIMATION_DURATION.toString();
      default:
        return null;
    }
  }

  static parseAttributeValue(name, value) {
    switch (name) {
      case "data":
        return ArsDataRoller.#parseDataAttribute(value);
      case "interval":
        return ArsDataRoller.#parseIntervalAttribute(value);
      case "animation-duration":
        return ArsDataRoller.#parseAnimationDurationAttribute(value);
      default:
        return super.parseAttributeValue(name, value);
    }
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);
    if (oldVal === newVal) return;
    // Only update UI if shadowRoot is ready
    const shadowReady = this.shadowRoot && this.shadowRoot.querySelector('.roller-item.current');
    switch (attrName) {
      case "data":
        this.currentIndex = 0;
        this.data = ArsDataRoller.#parseDataAttribute(newVal);
        if (shadowReady) {
          this.#render();
          this.#startRolling();
        }
        break;
      case "interval":
        this.intervalMs = ArsDataRoller.#parseIntervalAttribute(newVal);
        if (shadowReady) this.#startRolling();
        break;
      case "animation-duration":
        this.animationDuration = ArsDataRoller.#parseAnimationDurationAttribute(newVal);
        break;
    }
  }

  allAttributesChangedCallback(attributes) {
    this.data = attributes.data || [];
    this.intervalMs = attributes.interval || ArsDataRoller.#DEFAULT_INTERVAL;
    this.animationDuration = attributes["animation-duration"] || ArsDataRoller.#DEFAULT_ANIMATION_DURATION;
    this.currentIndex = 0;
    // Only update UI if shadowRoot is ready
    if (this.shadowRoot && this.shadowRoot.querySelector('.roller-item.current')) {
      this.#render();
      this.#startRolling();
    }
  }

  // ---- PUBLIC INSTANCE METHODS ----
  startRolling() {
    this.#startRolling();
  }

  stopRolling() {
    this.#stopRolling();
  }

  restartRolling() {
    this.#stopRolling();
    this.#startRolling();
  }

  nextItem() {
    this.#nextItem();
  }

  setData(newData) {
    const current = this.getAttribute('data');
    const newStr = JSON.stringify(newData);
    if (current !== newStr) {
      this.setAttribute('data', newStr);
    }
  }

  setInterval(intervalMs) {
    this.setAttribute('interval', intervalMs.toString());
  }

  setAnimationDuration(durationMs) {
    this.setAttribute('animation-duration', durationMs.toString());
  }
}

if (document.createElement("ars-data-roller").constructor === HTMLElement) {
  window.customElements.define("ars-data-roller", ArsDataRoller);
}

export { ArsDataRoller, ArsDataRoller as default };
