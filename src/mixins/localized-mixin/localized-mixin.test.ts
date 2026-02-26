/**
 * Tests for LocalizedMixin
 * @vi-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, vi } from 'vitest';

// Import the module
import { LocalizedMixin } from './localized-mixin.js';

describe('LocalizedMixin', () => {
  let element;

  beforeEach(() => {
    // Create a fresh instance for each test
    document.body.innerHTML = '';
    element = document.createElement('localized-mixin');
  });

  describe('Translation methods', () => {
    beforeEach(() => {
      document.body.appendChild(element);
    });

    describe('setLocale', () => {
      it('should set a valid locale', () => {
        element.setLocale('es');

        expect(element.getLocale()).toBe('es');
      });

      it('should ignore invalid locale', () => {
        const initialLocale = element.getLocale();

        element.setLocale('');

        expect(element.getLocale()).toBe(initialLocale);
      });

      it('should ignore null locale', () => {
        const initialLocale = element.getLocale();

        element.setLocale(null);

        expect(element.getLocale()).toBe(initialLocale);
      });
    });

    describe('addTranslations', () => {
      it('should add translations for a locale', () => {
        const result = element.addTranslations('es', { welcome: 'Hola' });

        expect(result).toBe(true);
      });

      it('should reject invalid locale', () => {
        const result = element.addTranslations('', { welcome: 'Hola' });

        expect(result).toBe(false);
      });

      it('should reject invalid translations object', () => {
        const result = element.addTranslations('es', null);

        expect(result).toBe(false);
      });

      it('should merge translations for same locale', () => {
        element.addTranslations('es', { welcome: 'Hola' });
        element.addTranslations('es', { goodbye: 'Adiós' });

        // Verify translations were merged by checking the internal store
        const esTranslations = element._translations['es'];
        expect(esTranslations.welcome).toBe('Hola');
        expect(esTranslations.goodbye).toBe('Adiós');
      });
    });

    describe('setDefaultTranslations', () => {
      it('should set default translations', () => {
        element.setDefaultTranslations('en', { welcome: 'Welcome' });
        element.setLocale('en');

        expect(element.translate('welcome')).toBe('Welcome');
      });
    });

    describe('translate', () => {
      beforeEach(() => {
        element.setLocale('en');
      });

      it('should return translation for existing key', () => {
        element.addTranslations('en', { welcome: 'Welcome', greeting: 'Hello {name}' });

        expect(element.translate('welcome')).toBe('Welcome');
      });

      it('should return key if translation not found', () => {
        expect(element.translate('nonexistent')).toBe('nonexistent');
      });

      it('should interpolate parameters', () => {
        element.addTranslations('en', { greeting: 'Hello {name}' });

        expect(element.translate('greeting', { name: 'World' })).toBe('Hello World');
      });

      it('should keep placeholder if parameter missing', () => {
        element.addTranslations('en', { greeting: 'Hello {name}' });

        expect(element.translate('greeting', {})).toBe('Hello {name}');
      });

      it('should fallback to base locale', () => {
        element.addTranslations('en', { test: 'Test Value' });
        element._locale = 'en-US';  // Set directly to avoid render

        expect(element.translate('test')).toBe('Test Value');
      });

      it('should fallback to English', () => {
        element.addTranslations('en', { welcome: 'Welcome' });
        element._locale = 'fr';  // Set directly to avoid render

        expect(element.translate('welcome')).toBe('Welcome');
      });
    });
  });

  describe('Nested translation lookup', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      element.setLocale('en');
    });

    it('should handle nested translation keys', () => {
      element.addTranslations('en', {
        messages: {
          greeting: 'Hello',
          farewell: 'Goodbye'
        }
      });

      expect(element.translate('messages.greeting')).toBe('Hello');
      expect(element.translate('messages.farewell')).toBe('Goodbye');
    });

    it('should return key for non-existent nested path', () => {
      element.addTranslations('en', { messages: {} });

      expect(element.translate('messages.nonexistent')).toBe('messages.nonexistent');
    });
  });

  describe('Attribute handling', () => {
    it('should read locale from attribute', async () => {
      element.setAttribute('locale', 'fr');
      document.body.appendChild(element);

      await new Promise(r => setTimeout(r, 50));
      expect(element.getLocale()).toBe('fr');
    });
    it('should read translations from attribute', () => {
      element.setAttribute('translations', JSON.stringify({
        de: { hello: 'Hallo' }
      }));
      document.body.appendChild(element);

      element.setLocale('de');
      expect(element.translate('hello')).toBe('Hallo');
    });
  });

  describe('reloadTranslations', () => {
    beforeEach(() => {
      document.body.appendChild(element);
    });

    it('should reload translations', () => {
      element.setAttribute('translations', JSON.stringify({
        it: { hello: 'Ciao' }
      }));

      element.reloadTranslations();
      element.setLocale('it');

      expect(element.translate('hello')).toBe('Ciao');
    });
  });

  describe('Lifecycle', () => {
    it('should have connectedCallback', () => {
      expect(typeof element.connectedCallback).toBe('function');
    });

    it('should have disconnectedCallback', () => {
      expect(typeof element.disconnectedCallback).toBe('function');
    });

    it('should have attributeChangedCallback', () => {
      expect(typeof element.attributeChangedCallback).toBe('function');
    });
  });

  describe('Static properties', () => {
    it('should have observedAttributes', () => {
      expect(LocalizedMixin.observedAttributes).toContain('locale');
      expect(LocalizedMixin.observedAttributes).toContain('translations');
    });
  });

  describe('Validation helpers', () => {
    beforeEach(() => {
      document.body.appendChild(element);
    });

    it('should validate locale correctly', () => {
      expect(element._isValidLocale('en')).toBe(true);
      expect(element._isValidLocale('en-US')).toBe(true);
      expect(element._isValidLocale('')).toBe(false);
      expect(element._isValidLocale(null)).toBe(false);
      expect(element._isValidLocale(123)).toBe(false);
    });

    it('should validate translations correctly', () => {
      expect(element._isValidTranslations({})).toBe(true);
      expect(element._isValidTranslations({ key: 'value' })).toBe(true);
      expect(element._isValidTranslations(null)).toBe(false);
      expect(element._isValidTranslations('string')).toBe(false);
    });
  });

  describe('Interpolation', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      element.setLocale('en');
    });

    it('should interpolate multiple parameters', () => {
      element.addTranslations('en', { greeting: 'Hello {name}, you are {age} years old' });

      expect(element.translate('greeting', { name: 'John', age: '30' })).toBe('Hello John, you are 30 years old');
    });

    it('should handle missing parameters in interpolation', () => {
      element.addTranslations('en', { greeting: 'Hello {name} {missing}' });

      expect(element.translate('greeting', { name: 'John' })).toBe('Hello John {missing}');
    });
  });
});