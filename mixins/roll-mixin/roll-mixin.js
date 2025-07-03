// Roll Mixin - declarative 360° rotation animation on hover
// Usage:
//   <roll-mixin roll-duration="1000">
//     <button>Hover to roll!</button>
//   </roll-mixin>
// Provides roll(), setRollDuration(), etc.

import WebComponentBase from '../../components/web-component-base/web-component-base.js';

class RollMixin extends WebComponentBase {
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
    console.log('🎲 roll() method called on:', this.tagName || this.constructor.name);
    console.log('🎲 _isRolling state:', this._isRolling);
    console.log('🎲 _isInCooldown state:', this._isInCooldown);

    if (this._isRolling || this._isInCooldown) {
      console.log('🎲 Skipping roll - already rolling or in cooldown');
      return;
    }

    // Set rolling state BEFORE doing anything else
    this._isRolling = true;
    console.log('🎲 Set _isRolling to true');

    this.emitEvent('roll-started', { duration: this._rollDuration });

    // Get the target component (first child element)
    const targetComponent = this.firstElementChild;
    console.log('🎲 Target component found:', targetComponent?.tagName || targetComponent?.constructor.name);

    if (targetComponent) {
      this.triggerRollAnimation(targetComponent);
    } else {
      console.log('🎲 No target component found!');
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
      console.log(`🎲 setRollDuration called but value unchanged (${parsed}ms)`);
      return;
    }

    console.log(`🎲 setRollDuration: ${this._rollDuration}ms → ${parsed}ms`);

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

    console.log('🎲 triggerRollAnimation called for:', targetComponent.tagName || targetComponent.constructor.name);
    console.log('🎲 Duration:', currentDuration, 'ms');

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
        console.log('🎲 Animation (WAAPI) completed');

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

    console.log('🎲 Original transform:', originalTransform);
    console.log('🎲 Original transition:', originalTransition);

    // Apply rotation
    const newTransform = `${originalTransform} rotate(359deg)`; // 359 to ensure delta
    const newTransition = `transform ${currentDuration}ms ease-in-out`;

    console.log('🎲 Applying new transform:', newTransform);
    console.log('🎲 Applying new transition:', newTransition);

    targetComponent.style.transition = newTransition;
    targetComponent.style.transform = newTransform;

    // Clear any existing timeout
    if (this._animationTimeout) {
      clearTimeout(this._animationTimeout);
    }

    // Reset after animation
    this._animationTimeout = setTimeout(() => {
      console.log('🎲 Animation completed, resetting styles');
      console.log('🎲 Restoring transform to:', originalTransform);
      console.log('🎲 Restoring transition to:', originalTransition);

      targetComponent.style.transform = originalTransform;
      targetComponent.style.transition = originalTransition;

      // Start cooldown period BEFORE resetting rolling state
      this.startCooldown();

      // Now reset rolling state
      this._isRolling = false;
      console.log('🎲 Set _isRolling to false');
      this._animationTimeout = null;

      this.emitEvent('roll-completed', { duration: currentDuration });
    }, currentDuration);
  }

  /* --------------------------------------------------
   *  Cooldown management
   * -------------------------------------------------- */
  startCooldown() {
    console.log('🎲 Starting cooldown period');
    this._isInCooldown = true;

    // Clear any existing cooldown timeout
    if (this._cooldownTimeout) {
      clearTimeout(this._cooldownTimeout);
    }

    // Cooldown period: 500ms after animation completes
    this._cooldownTimeout = setTimeout(() => {
      console.log('🎲 Cooldown period ended');
      this._isInCooldown = false;
      this._cooldownTimeout = null;
    }, 500);
  }

  /* --------------------------------------------------
   *  Lifecycle
   * -------------------------------------------------- */
  connectedCallback() {
    super.connectedCallback?.();
    console.log('🎲 connectedCallback called on:', this.tagName || this.constructor.name);

    // Set initial duration from attribute
    const duration = this.getAttribute("roll-duration");
    console.log('🎲 Initial roll-duration attribute:', duration);
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
      console.log('🎲 No target component found for hover listeners');
      return;
    }

    console.log('🎲 Setting up hover listeners for:', targetComponent.tagName || targetComponent.constructor.name);

    // Remove any existing listeners first
    this.cleanupHoverListeners();

    // Create hover handler
    this._hoverHandler = (event) => {
      // Only trigger if not already rolling, not in cooldown, and correct target
      if (!this._isRolling && !this._isInCooldown && event.target === targetComponent) {
        console.log('🎲 Hover detected, triggering roll');
        this.roll();
      }
    };

    // Add mouse enter listener
    targetComponent.addEventListener('mouseenter', this._hoverHandler);
    console.log('🎲 Hover listener added');
  }

  cleanupHoverListeners() {
    const targetComponent = this.firstElementChild;
    if (targetComponent && this._hoverHandler) {
      targetComponent.removeEventListener('mouseenter', this._hoverHandler);
      this._hoverHandler = null;
      console.log('🎲 Hover listeners cleaned up');
    }
  }
}

customElements.define('roll-mixin', RollMixin);

export { RollMixin };
