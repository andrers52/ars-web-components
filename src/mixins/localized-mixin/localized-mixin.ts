// Localized Wrapper – declarative i18n support for any slotted/child content
// Usage:
//   <localized-mixin locale="es">
//     <div>[[localization.welcome]]</div>
//   </localized-mixin>
// Provides translate(), setLocale(), addTranslations(), etc.

import { MixinBase } from '../common/mixin-base.js';

class LocalizedMixin extends MixinBase() {
  [key: string]: any;

  static get observedAttributes() { return ['locale', 'translations']; }

  constructor() {
    super();
    this._locale = 'en';
    this._translations = {};
    this._defaultTranslations = {};
    this._originalTemplate = null;
  }

  /* --------------------------------------------------
   *  Validation helpers
   * -------------------------------------------------- */
  _isValidLocale(loc) { return typeof loc === 'string' && loc.trim().length > 0; }
  _isValidTranslations(obj) { return typeof obj === 'object' && obj !== null; }

  /* --------------------------------------------------
   *  Translation lookup helpers
   * -------------------------------------------------- */
  _findTranslation(key, locale = this._locale) {
    const tryLocale = (store, loc) => {
      const parts = key.split('.');
      let val = store[loc];
      for (const part of parts) {
        if (val && typeof val === 'object') {
          val = val[part];
        } else {
          return null;
        }
      }
      return val ?? null;
    };

    // 1) exact locale
    let val = tryLocale(this._translations, locale) ?? tryLocale(this._defaultTranslations, locale);
    if (val !== null) return val;

    // 2) base locale (e.g. en for en-US)
    const base = locale.split('-')[0];
    if (base !== locale) {
      val = tryLocale(this._translations, base) ?? tryLocale(this._defaultTranslations, base);
      if (val !== null) return val;
    }

    // 3) english fallback
    return tryLocale(this._translations, 'en') ?? tryLocale(this._defaultTranslations, 'en');
  }

  _interpolate(str, params) {
    if (!str || typeof str !== 'string' || !params) return str;
    return str.replace(/\{(\w+)\}/g, (m,k)=> (params[k]!==undefined?params[k]:m));
  }

  /* --------------------------------------------------
   *  Public API
   * -------------------------------------------------- */
  setLocale(loc) {
    if(this._isValidLocale(loc)){
      this._locale = loc;
      this._loadTranslations();
      this._render();
    }
  }
  getLocale(){ return this._locale; }

  addTranslations(locale, obj){
    if(!this._isValidLocale(locale)||!this._isValidTranslations(obj)) return false;
    this._translations[locale] = { ...(this._translations[locale]||{}), ...obj };
    return true;
  }
  setDefaultTranslations(locale,obj){
    if(this._isValidLocale(locale)&&this._isValidTranslations(obj)) this._defaultTranslations[locale]={...obj};
  }

  // @ts-ignore
  translate(key: any, params?: any): any {
    const t=this._findTranslation(key);
    return t?this._interpolate(t,params):key;
  }

  // Method to reload translations from attribute or global object
  reloadTranslations() {
    this._loadTranslations();
    this._render();
    return true;
  }

  _loadTranslations() {
    this._translations = {};
    let translations = this.getAttribute('translations');
    if (translations) {
      try {
        translations = JSON.parse(translations);
        Object.entries(translations).forEach(([l, t]) => this.addTranslations(l, t));
        return;
      } catch (e) {
        console.error('Invalid translations JSON in attribute', e);
      }
    }
    if((window as any).globalTranslations && this._isValidTranslations((window as any).globalTranslations)){
      Object.entries((window as any).globalTranslations).forEach(([l,t]) => this.addTranslations(l,t));
    }
  }

  /* --------------------------------------------------
   *  Internal render – replace [[localization.key]] in light DOM content
   * -------------------------------------------------- */
  _render(){
    const target = this.firstElementChild;
    if(!target) return;
    if(!this._originalTemplate) {
      this._originalTemplate = target.innerHTML;
    }
    let html = this._originalTemplate;
    html = html.replace(/\[\[localization\.([^\]]+)\]\]/g,(m,k)=> {
      return this.translate(k);
    });
    target.innerHTML = html;

    // --- Attribute-based localization using data-localize-map ---
    if (target.hasAttribute && target.hasAttribute('data-localize-map')) {
      let map;
      try {
        map = JSON.parse(target.getAttribute('data-localize-map'));
      } catch (e) {
        console.error('Invalid data-localize-map JSON', e);
        return;
      }
      Object.entries(map).forEach(([attr, keys]) => {
        let value;
        if (Array.isArray(keys)) {
          value = keys.map(k => this.translate(k));
          target.setAttribute(attr, JSON.stringify(value));
        } else if (typeof keys === 'string') {
          value = this.translate(keys);
          target.setAttribute(attr, value);
        }
      });
    }
  }

  /* --------------------------------------------------
   *  Lifecycle
   * -------------------------------------------------- */
  connectedCallback(){
    super.connectedCallback?.();

    // Read attributes
    const locAttr = this.getAttribute('locale');
    if(this._isValidLocale(locAttr)) this._locale = locAttr;

    // Load translations from attribute or global
    this._loadTranslations();

    // Initialize target once a child exists
    const initTarget = () => {
      // async render after children ready
      setTimeout(() => this._render());
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
    super.disconnectedCallback?.();
  }

  attributeChangedCallback(name, oldVal, newVal){
    super.attributeChangedCallback?.(name, oldVal, newVal);
    if(name === 'locale' && this._isValidLocale(newVal)) this.setLocale(newVal);
    if(name === 'translations') {
      this._loadTranslations();
      this._render();
    }
    if(name === 'translations' && newVal){
      try{
        const obj = JSON.parse(newVal);
        Object.entries(obj).forEach(([l,t]) => this.addTranslations(l,t));
      } catch(e){
        console.error('Invalid translations JSON', e);
      }
    }
  }
}

// Avoid redefining during HMR / demos
if (!customElements.get('localized-mixin')) {
  // @ts-ignore
  customElements.define('localized-mixin', LocalizedMixin);
}

export { LocalizedMixin };
