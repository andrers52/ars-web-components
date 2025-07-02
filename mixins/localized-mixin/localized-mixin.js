// Localized Wrapper – declarative i18n support for any slotted/child content
// Usage:
//   <localized-mixin locale="es">
//     <div>[[localization.welcome]]</div>
//   </localized-mixin>
// Provides translate(), setLocale(), addTranslations(), etc.

import { MixinBase } from '../common/mixin-base.js';

class LocalizedMixin extends MixinBase() {
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
    console.log(`[LocalizedMixin] setLocale called with: ${loc}`);
    if(this._isValidLocale(loc)){
      this._locale = loc;
      this._loadTranslations();
      console.log(`[LocalizedMixin] Locale set to: ${this._locale}`);
      this._render();
    } else {
      console.log(`[LocalizedMixin] Invalid locale: ${loc}`);
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

  translate(key, params){
    const t=this._findTranslation(key);
    console.log(`[LocalizedMixin] translate(${key}) -> ${t || key}`);
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
        console.log('[LocalizedMixin] Loaded translations from attribute.');
        return;
      } catch (e) {
        console.error('Invalid translations JSON in attribute', e);
      }
    }
    if(window.globalTranslations && this._isValidTranslations(window.globalTranslations)){
      Object.entries(window.globalTranslations).forEach(([l,t]) => this.addTranslations(l,t));
      console.log('[LocalizedMixin] Loaded translations from global.');
    }
  }

  /* --------------------------------------------------
   *  Internal render – replace [[localization.key]] in light DOM content
   * -------------------------------------------------- */
  _render(){
    console.log(`[LocalizedMixin] _render called`);
    const target = this.firstElementChild;
    console.log(`[LocalizedMixin] Target element:`, target);
    if(!target) {
      console.log(`[LocalizedMixin] No target element found`);
      return;
    }
    if(!this._originalTemplate) {
      this._originalTemplate = target.innerHTML;
      console.log(`[LocalizedMixin] Original template saved:`, this._originalTemplate);
    }
    let html = this._originalTemplate;
    console.log(`[LocalizedMixin] Processing template:`, html);
    html = html.replace(/\[\[localization\.([^\]]+)\]\]/g,(m,k)=> {
      const translation = this.translate(k);
      console.log(`[LocalizedMixin] Replacing ${k} with: ${translation}`);
      return translation;
    });
    console.log(`[LocalizedMixin] Final HTML:`, html);
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
        console.log(`[LocalizedMixin] Set attribute ${attr} =`, value);
      });
    }
  }

  /* --------------------------------------------------
   *  Lifecycle
   * -------------------------------------------------- */
  connectedCallback(){
    console.log(`[LocalizedMixin] connectedCallback called`);
    super.connectedCallback?.();

    // Read attributes
    const locAttr = this.getAttribute('locale');
    console.log(`[LocalizedMixin] Initial locale attribute: ${locAttr}`);
    if(this._isValidLocale(locAttr)) this._locale = locAttr;

    // Load translations from attribute or global
    this._loadTranslations();

    // Initialize target once a child exists
    const initTarget = () => {
      console.log(`[LocalizedMixin] Initializing target`);
      // async render after children ready
      setTimeout(() => this._render());
    };

    if (this.firstElementChild) {
      console.log(`[LocalizedMixin] First child exists, initializing immediately`);
      initTarget();
    } else {
      console.log(`[LocalizedMixin] No first child, setting up mutation observer`);
      // Wait until a child is slotted/added
      const mo = new MutationObserver(() => {
        if (this.firstElementChild) {
          console.log(`[LocalizedMixin] Child added, initializing`);
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
  customElements.define('localized-mixin', LocalizedMixin);
}

export { LocalizedMixin };
