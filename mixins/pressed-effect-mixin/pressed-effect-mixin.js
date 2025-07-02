// Pressed Effect Wrapper – adds press visual feedback to its first child element.
// Declarative usage:
//   <pressed-effect-mixin>
//      <button>Press me</button>
//   </pressed-effect-mixin>

import { MixinBase } from '../common/mixin-base.js';

// Configuration constants for the old ripple algorithm
const ANIMATION_TIME = 700;      // total animation time in ms
const NUM_ANIMATION_STEPS = 100; // number of gradient updates during the animation

class PressedEffectMixin extends MixinBase() {
  static get observedAttributes() { return ['pressed-class']; }

  constructor() {
    super();

    // Internal state
    this._pressedClass = 'pressed';
    this._isPressed    = false;
    this._pressTimer   = null;
    this._target       = null;
    this._origColorArr = [200, 200, 200];

    // Bound handlers
    this._onDown     = (e) => { if (e.type === 'mousedown' && e.button !== 0) return; this._startPress(); };
    this._onUpCancel = () => this._endPress();
  }

  /* --------------------------------------------------
   *  Lifecycle
   * -------------------------------------------------- */
  connectedCallback() {
    super.connectedCallback && super.connectedCallback();

    // Read attributes
    const pc = this.getAttribute('pressed-class');
    if (pc) this._pressedClass = pc;

    // Initialise once a child (target) exists
    const initTarget = () => {
      this._target = this.firstElementChild || this;
      this._addListeners();
    };

    if (this.firstElementChild) {
      initTarget();
    } else {
      // Wait until a child is slotted/added
      const mo = new MutationObserver(() => {
        if (this.firstElementChild) {
          mo.disconnect();
          initTarget();
        }
      });
      mo.observe(this, { childList: true });
    }
  }

  disconnectedCallback() {
    this._removeListeners();
    this._clearTimer();
    super.disconnectedCallback && super.disconnectedCallback();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    super.attributeChangedCallback && super.attributeChangedCallback(name, oldVal, newVal);
    if (name === 'pressed-class' && newVal) this._pressedClass = newVal;
  }

  /* --------------------------------------------------
   *  Event-listener bookkeeping
   * -------------------------------------------------- */
  _addListeners() {
    if (!this._target) return;
    const t = this._target;
    t.addEventListener('mousedown',  this._onDown);
    t.addEventListener('touchstart', this._onDown,    { passive: true });
    t.addEventListener('pointerdown', this._onDown);

    t.addEventListener('mouseup',      this._onUpCancel);
    t.addEventListener('touchend',     this._onUpCancel);
    t.addEventListener('pointerup',    this._onUpCancel);
    t.addEventListener('mouseleave',   this._onUpCancel);
    t.addEventListener('touchcancel',  this._onUpCancel);
  }

  _removeListeners() {
    if (!this._target) return;
    const t = this._target;
    t.removeEventListener('mousedown',  this._onDown);
    t.removeEventListener('touchstart', this._onDown);
    t.removeEventListener('pointerdown', this._onDown);

    t.removeEventListener('mouseup',      this._onUpCancel);
    t.removeEventListener('touchend',     this._onUpCancel);
    t.removeEventListener('pointerup',    this._onUpCancel);
    t.removeEventListener('mouseleave',   this._onUpCancel);
    t.removeEventListener('touchcancel',  this._onUpCancel);
  }

  /* --------------------------------------------------
   *  Press logic
   * -------------------------------------------------- */
  _startPress() {
    if (this._isPressed) return;
    this._isPressed = true;
    this._target.classList.add(this._pressedClass);

    // Launch animation & schedule automatic end
    this._animate(ANIMATION_TIME, NUM_ANIMATION_STEPS);
    this._clearTimer();
    this._pressTimer = setTimeout(() => this._endPress(), ANIMATION_TIME + 50);
  }

  _endPress() {
    if (!this._isPressed) return;
    this._isPressed = false;
    this._target.classList.remove(this._pressedClass);
    this._clearTimer();
    this._restoreButtonColor();
  }

  _clearTimer() {
    if (this._pressTimer) {
      clearTimeout(this._pressTimer);
      this._pressTimer = null;
    }
  }

  /* --------------------------------------------------
   *  Old ripple-effect implementation
   * -------------------------------------------------- */
  _getRGBArrayFromBackgroundColor(el) {
    const rgbStr = getComputedStyle(el).backgroundColor;
    const nums   = rgbStr.match(/\d+/g) || [200, 200, 200];
    return nums.slice(0, 3).map(n => parseInt(n, 10));
  }

  _getOriginalButtonColor() {
    this._origColorArr = this._getRGBArrayFromBackgroundColor(this._target);
  }

  _restoreButtonColor() {
    const [r, g, b] = this._origColorArr;
    this._target.style.backgroundImage = `radial-gradient(rgb(${r},${g},${b}), rgb(${r},${g},${b}))`;
  }

  _setButtonColorStep(percentageCompleted, r, g, b) {
    this._target.style.backgroundImage = `\n      radial-gradient(circle,\n        rgba(255, 255, 255, 0.2) ${percentageCompleted}%,\n        rgb(${r},${g},${b}) ${100 - percentageCompleted}%\n      )\n    `;
  }

  _animate(totalTime, numIterations) {
    this._getOriginalButtonColor();
    const timeSlice = totalTime / numIterations;

    for (let i = 0; i < numIterations; i++) {
      setTimeout(() => {
        this._setButtonColorStep(
          (100 * i) / numIterations,
          ...this._origColorArr,
        );
      }, timeSlice * i);
    }

    // Ensure restoration even if mouse never leaves/ends
    setTimeout(() => this._restoreButtonColor(), totalTime);
  }
}

// Avoid redefining during HMR / demos
if (!customElements.get('pressed-effect-mixin')) {
  customElements.define('pressed-effect-mixin', PressedEffectMixin);
}

export { PressedEffectMixin };
