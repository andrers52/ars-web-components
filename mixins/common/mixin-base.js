// Generic base mixin to help building mixin-style mixins (e.g. RollMixin, ZoomMixin)
// It handles:
//   • Detecting the actual target element when Mixins are nested
//   • Utility to know if an element is itself a mixin mixin
//   • Helper to inject methods into the target and/or mixin
//   • Helper to manage hover listeners (add & cleanup)
//
// Usage:
//   import WebComponentBase from "../../web-component-base/web-component-base.js";
//   import { MixinBase } from "../common/mixin-base.js";
//
//   const MyFancyMixin = (Base = WebComponentBase) => {
//     const MixinBase = MixinBase(Base);
//     return class extends MixinBase { /* your mixin code */ };
//   };

import {Assert} from 'arslib';
import WebComponentBase from '../../components/web-component-base/web-component-base.js';

const MixinBase = (BaseClass = WebComponentBase) => class extends BaseClass {
  constructor() {
    super();
    this._hoverHandler = null;
    // Enforce naming convention for mixins
    Assert.assert(
      this.constructor.name.endsWith('Mixin'),
      `Class name '${this.constructor.name}' must end with 'Mixin'`
    );
    Assert.assert(
      this.tagName && this.tagName.toLowerCase().endsWith('-mixin'),
      `Custom element tag name '${this.tagName}' must end with '-mixin'`
    );
  }

  /* -----------------------------------------
   *  Mixin / Target detection helpers
   * -------------------------------------- */
  isMixin(element) {
    if (!element) return false;
    // Heuristic: custom element tag name ending with -mixin
    if (element.tagName && element.tagName.toLowerCase().endsWith('-mixin')) {
      return true;
    }
    // Heuristic: class name ending with Mixin
    if (element.constructor && element.constructor.name.endsWith('Mixin')) {
      return true;
    }
    return false;
  }

  /**
   * Recursively search down through nested mixin elements to find the first
   * non-mixin child – that is considered the "actual" component the mixin
   * should act upon.
   */
  findActualTargetComponent() {
    const search = (el) => {
      if (!el || !el.children || el.children.length === 0) {
        return el === this ? null : el;
      }
      for (const child of el.children) {
        if (!this.isMixin(child)) return child;
        const deeper = search(child);
        if (deeper) return deeper;
      }
      return el === this ? null : el;
    };
    return search(this);
  }

  /* -----------------------------------------
   *  Method injection helper
   * -------------------------------------- */
  /**
   * Inject a map of methods/properties into the given component. Existing
   * properties are not overwritten unless `force=true`.
   *
   * @param {HTMLElement} target  element to augment
   * @param {Object<string,Function|any>} map  name → value
   * @param {boolean} [force=false]  override existing?
   */
  injectIntoTarget(target, map, force = false) {
    if (!target) return;
    Object.entries(map).forEach(([key, val]) => {
      if (force || typeof target[key] === 'undefined') {
        target[key] = typeof val === 'function' ? val.bind(this) : val;
      }
    });
  }

  /* -----------------------------------------
   *  Hover helpers
   * -------------------------------------- */
  setupHoverListeners(target, handler) {
    if (!target || typeof handler !== 'function') return;
    this.cleanupHoverListeners();
    this._hoverHandler = handler;
    target.addEventListener('mouseenter', handler);
  }

  cleanupHoverListeners() {
    if (this._hoverHandler) {
      const tgt = this.findActualTargetComponent();
      if (tgt) tgt.removeEventListener('mouseenter', this._hoverHandler);
      this._hoverHandler = null;
    }
  }
};

export { MixinBase };

// CJS support
if (typeof module !== 'undefined') {
  module.exports = { MixinBase };
}
