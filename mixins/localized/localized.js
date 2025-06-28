// Localized Mixin
// Provides internationalization support for web components

const LocalizedMixin = (BaseClass) => {
  return class extends BaseClass {
    constructor() {
      super();
      this._locale = "en";
      this._translations = {};
      this._defaultTranslations = {};
    }

    // Public static methods
    static get observedAttributes() {
      return ["locale"];
    }

    // Private utility functions
    #validateLocale(locale) {
      return typeof locale === "string" && locale.trim().length > 0;
    }

    #validateTranslations(translations) {
      return typeof translations === "object" && translations !== null;
    }

    #getTranslationKey(key, locale) {
      const targetLocale = locale || this._locale;
      return `${targetLocale}.${key}`;
    }

    #findTranslation(key, locale) {
      const targetLocale = locale || this._locale;

      // Try specific locale first
      if (
        this._translations[targetLocale] &&
        this._translations[targetLocale][key]
      ) {
        return this._translations[targetLocale][key];
      }

      // Try default translations for the locale
      if (
        this._defaultTranslations[targetLocale] &&
        this._defaultTranslations[targetLocale][key]
      ) {
        return this._defaultTranslations[targetLocale][key];
      }

      // Fallback to base locale (e.g., 'en' for 'en-US')
      const baseLocale = targetLocale.split("-")[0];
      if (baseLocale !== targetLocale) {
        if (
          this._translations[baseLocale] &&
          this._translations[baseLocale][key]
        ) {
          return this._translations[baseLocale][key];
        }
        if (
          this._defaultTranslations[baseLocale] &&
          this._defaultTranslations[baseLocale][key]
        ) {
          return this._defaultTranslations[baseLocale][key];
        }
      }

      // Final fallback to English
      if (this._translations["en"] && this._translations["en"][key]) {
        return this._translations["en"][key];
      }
      if (
        this._defaultTranslations["en"] &&
        this._defaultTranslations["en"][key]
      ) {
        return this._defaultTranslations["en"][key];
      }

      return null;
    }

    #interpolateTranslation(translation, params) {
      if (!translation || typeof translation !== "string") {
        return translation;
      }

      if (!params || typeof params !== "object") {
        return translation;
      }

      return translation.replace(/\{(\w+)\}/g, (match, key) => {
        return params[key] !== undefined ? params[key] : match;
      });
    }

    #updateLocalizedElements() {
      const elements = this.querySelectorAll("[data-localize]");
      elements.forEach((element) => {
        const key = element.getAttribute("data-localize");
        if (key) {
          const translation = this.translate(key);
          if (translation !== null) {
            element.textContent = translation;
          }
        }
      });
    }

    // Public instance methods
    setLocale(locale) {
      if (this.#validateLocale(locale)) {
        this._locale = locale;
        this.#updateLocalizedElements();
        this.onLocaleChanged(locale);
      }
    }

    getLocale() {
      return this._locale;
    }

    addTranslations(locale, translations) {
      if (
        !this.#validateLocale(locale) ||
        !this.#validateTranslations(translations)
      ) {
        return false;
      }

      if (!this._translations[locale]) {
        this._translations[locale] = {};
      }

      Object.assign(this._translations[locale], translations);
      return true;
    }

    setDefaultTranslations(locale, translations) {
      if (
        !this.#validateLocale(locale) ||
        !this.#validateTranslations(translations)
      ) {
        return false;
      }

      this._defaultTranslations[locale] = { ...translations };
      return true;
    }

    translate(key, params = {}, locale = null) {
      const translation = this.#findTranslation(key, locale);
      if (translation === null) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }

      return this.#interpolateTranslation(translation, params);
    }

    // Override this method in your component to handle locale changes
    onLocaleChanged(newLocale) {
      // Default implementation - override in your component
      console.log(`Locale changed to: ${newLocale}`);
    }

    // Lifecycle methods
    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }

      const locale = this.getAttribute("locale");
      if (this.#validateLocale(locale)) {
        this._locale = locale;
      }

      this.#updateLocalizedElements();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(name, oldValue, newValue);
      }

      if (name === "locale" && this.#validateLocale(newValue)) {
        this._locale = newValue;
        this.#updateLocalizedElements();
        this.onLocaleChanged(newValue);
      }
    }
  };
};

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = LocalizedMixin;
} else if (typeof window !== "undefined") {
  window.LocalizedMixin = LocalizedMixin;
}

export { LocalizedMixin };
