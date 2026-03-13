// Roll Mixin - declarative 360° rotation animation on hover
// Usage:
//   <roll-mixin roll-duration="1000">
//     <button>Hover to roll!</button>
//   </roll-mixin>
// Provides roll(), setRollDuration(), etc.

import WebComponentBase from '../../components/web-component-base/web-component-base.js';

class RollMixin extends WebComponentBase {
  [key: string]: any;

  static get observedAttributes() { return ['roll-duration']; }

  constructor() {
    super();
    this._isRolling = false;
    this._rollDuration = 1000; // Default duration in ms
    this._hoverHandler = null;
    this._animationTimeout = null;
    this._cooldownTimeout = null;
    this._isInCooldown = false;

    // simple shadow that just renders children "as-is"
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>:host{display:contents}</style><slot></slot>`;
  }

  /* --------------------------------------------------
   *  Public API
   * -------------------------------------------------- */
  roll() {
    if (this._isRolling || this._isInCooldown) {
      return;
    }

    // Set rolling state BEFORE doing anything else
    this._isRolling = true;

    this.emitEvent('roll-started', { duration: this._rollDuration });

    // Get the target component (first child element)
    const targetComponent = this.firstElementChild;

    if (targetComponent) {
      this.triggerRollAnimation(targetComponent);
    } else {
      this._isRolling = false;
    }
  }

  getRollDuration() {
    // Source of truth is the attribute, fallback to internal state
    const attrVal = this.getAttribute('roll-duration');
    const num = Number(attrVal);
    return num > 0 ? num : this._rollDuration;
  }

  setRollDuration(duration) {
    const parsed = Number(duration) || 1000;

    // Skip if value hasn't changed
    if (parsed === this._rollDuration) {
      return;
    }

    this._rollDuration = parsed;

    // Keep attribute in sync for external observers, avoid loop by checking first
    const attrValue = this.getAttribute('roll-duration');
    if (!attrValue || Number(attrValue) !== parsed) {
      this.setAttribute('roll-duration', String(parsed));
    }

    this.emitEvent('roll-duration-changed', { duration: this._rollDuration });
  }

  /* --------------------------------------------------
   *  Private animation method
   * -------------------------------------------------- */
  triggerRollAnimation(targetComponent) {
    // Always fetch the latest duration right before animating
    const currentDuration = this.getRollDuration();

    // If Web Animations API is available, prefer it for smoother control
    if (typeof targetComponent.animate === 'function') {
      const animation = targetComponent.animate([
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(360deg)' }
      ], {
        duration: currentDuration,
        easing: 'ease-in-out'
      });

      // Clear any existing timeout
      if (this._animationTimeout) {
        clearTimeout(this._animationTimeout);
      }

      // When animation finishes
      animation.finished.then(() => {
        // Ensure final state is reset
        targetComponent.style.transform = '';
        this._animationTimeout = null;

        // Start cooldown before resetting rolling state
        this.startCooldown();
        this._isRolling = false;
        this.emitEvent('roll-completed', { duration: currentDuration });
      });

      // Store a faux timeout ID so logic remains consistent
      this._animationTimeout = 1; // non-null truthy value
      return;
    }

    // Fallback to CSS transform animation if WAAPI is not available
    // Store original transform and transition
    const originalTransform = targetComponent.style.transform || '';
    const originalTransition = targetComponent.style.transition || '';

    // Apply rotation
    const newTransform = `${originalTransform} rotate(359deg)`; // 359 to ensure delta
    const newTransition = `transform ${currentDuration}ms ease-in-out`;

    targetComponent.style.transition = newTransition;
    targetComponent.style.transform = newTransform;

    // Clear any existing timeout
    if (this._animationTimeout) {
      clearTimeout(this._animationTimeout);
    }

    // Reset after animation
    this._animationTimeout = setTimeout(() => {
      targetComponent.style.transform = originalTransform;
      targetComponent.style.transition = originalTransition;

      // Start cooldown period BEFORE resetting rolling state
      this.startCooldown();

      // Now reset rolling state
      this._isRolling = false;
      this._animationTimeout = null;

      this.emitEvent('roll-completed', { duration: currentDuration });
    }, currentDuration);
  }

  /* --------------------------------------------------
   *  Cooldown management
   * -------------------------------------------------- */
  startCooldown() {
    this._isInCooldown = true;

    // Clear any existing cooldown timeout
    if (this._cooldownTimeout) {
      clearTimeout(this._cooldownTimeout);
    }

    // Cooldown period: 500ms after animation completes
    this._cooldownTimeout = setTimeout(() => {
      this._isInCooldown = false;
      this._cooldownTimeout = null;
    }, 500);
  }

  /* --------------------------------------------------
   *  Lifecycle
   * -------------------------------------------------- */
  connectedCallback() {
    super.connectedCallback?.();

    // Set initial duration from attribute
    const duration = this.getAttribute("roll-duration");
    if (duration !== null) {
      this.setRollDuration(duration);
    }

    // Set up hover listeners after a short delay to ensure children are ready
    setTimeout(() => {
      this.setupHoverListeners();
    }, 0);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback?.(name, oldValue, newValue);

    if (name === "roll-duration") {
      this.setRollDuration(newValue);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();

    // Clean up event listeners and timeouts
    this.cleanupHoverListeners();
    if (this._animationTimeout) {
      clearTimeout(this._animationTimeout);
      this._animationTimeout = null;
    }
    if (this._cooldownTimeout) {
      clearTimeout(this._cooldownTimeout);
      this._cooldownTimeout = null;
    }
  }

  /* --------------------------------------------------
   *  Helper methods
   * -------------------------------------------------- */
  setupHoverListeners() {
    const targetComponent = this.firstElementChild;
    if (!targetComponent) {
      return;
    }

    // Remove any existing listeners first
    this.cleanupHoverListeners();

    // Create hover handler
    this._hoverHandler = (event) => {
      // Only trigger if not already rolling, not in cooldown, and correct target
      if (!this._isRolling && !this._isInCooldown && event.target === targetComponent) {
        this.roll();
      }
    };

    // Add mouse enter listener
    targetComponent.addEventListener('mouseenter', this._hoverHandler);
  }

  cleanupHoverListeners() {
    const targetComponent = this.firstElementChild;
    if (targetComponent && this._hoverHandler) {
      targetComponent.removeEventListener('mouseenter', this._hoverHandler);
      this._hoverHandler = null;
    }
  }
}

customElements.define('roll-mixin', RollMixin);

export { RollMixin };
