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
//     return class extends MixinBase {
//       /* your mixin code */
//     };
//   };

import { Assert } from 'arslib';
import WebComponentBase from '../../components/web-component-base/web-component-base.js';

const MixinBase = <T extends Constructor<HTMLElement> = Constructor<WebComponentBase>>(
  BaseClass: T = WebComponentBase as unknown as T,
) => class extends BaseClass {
  [key: string]: unknown;

  declare _hoverHandler: ((event: MouseEvent) => void) | null;

  constructor(...args: any[]) {
    super(...args);
    this._hoverHandler = null;
    // Enforce naming convention for mixins.
    //
    // Only the tag name is checked. A class-name check cannot be used here:
    // `Function.prototype.name` is a build-time artifact, and minifiers are
    // free to rename classes because names are unobservable to code that does
    // not reflect on them. Asserting on it made the library throw in any
    // minified bundle (`Class name 'Kb' must end with 'Mixin'`) while passing
    // in dev and tests, which never minify. The tag name is a real runtime
    // value the author chose, survives minification, and is what the rest of
    // this class actually keys on.
    Assert.assert(
      this.tagName && this.tagName.toLowerCase().endsWith('-mixin'),
      `Custom element tag name '${this.tagName}' must end with '-mixin'`
    );
  }

  /* -----------------------------------------
   *  Mixin / Target detection helpers
   * -------------------------------------- */
  isMixin(element: HTMLElement | null | undefined) {
    if (!element) return false;
    // Detected by tag name only. The former class-name fallback
    // (`constructor.name.endsWith('Mixin')`) was worse than useless in a
    // minified bundle: renamed classes made it silently answer false, so
    // nested-mixin detection quietly misbehaved with nothing thrown. The
    // constructor guarantees every mixin's tag ends in `-mixin`, so the tag
    // check alone is both sufficient and minification-safe.
    return Boolean(element.tagName && element.tagName.toLowerCase().endsWith('-mixin'));
  }

  /**
   * Recursively search down through nested mixin elements to find the first
   * non-mixin child – that is considered the "actual" component the mixin
   * should act upon.
   */
  findActualTargetComponent() {
    const search = (el: HTMLElement): HTMLElement | null => {
      if (!el || !el.children || el.children.length === 0) {
        return el === this ? null : el;
      }
      for (const child of el.children) {
        if (!this.isMixin(child as HTMLElement)) return child as HTMLElement;
        const deeper = search(child as HTMLElement);
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
  injectIntoTarget(
    target: HTMLElement & Record<string, unknown>,
    map: Record<string, unknown>,
    force = false,
  ) {
    if (!target) return;
    Object.entries(map).forEach(([key, val]) => {
      if (force || typeof target[key] === 'undefined') {
        target[key] = typeof val === 'function' ? (val as (...args: unknown[]) => unknown).bind(this) : val;
      }
    });
  }

  /* -----------------------------------------
   *  Hover helpers
   * -------------------------------------- */
  setupHoverListeners(
    target: HTMLElement | null | undefined,
    handler: ((event: MouseEvent) => void) | null | undefined,
  ) {
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

type Constructor<T = {}> = new (...args: any[]) => T;

export { MixinBase };

// CJS support
if (typeof module !== 'undefined') {
  module.exports = { MixinBase };
}
