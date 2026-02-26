/**
 * Tests for ArsDialog
 * @vi-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, vi } from 'vitest';

// Import the module
import { ArsDialog } from '../src/components/ars-dialog/ars-dialog.js';

describe('ArsDialog', () => {
  let element;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    element = document.createElement('ars-dialog');
    element.id = 'test-dialog';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Static properties', () => {
    it('should have observedAttributes', () => {
      expect(ArsDialog.observedAttributes).toContain('open');
      expect(ArsDialog.observedAttributes).toContain('localizedOk');
      expect(ArsDialog.observedAttributes).toContain('localizedCancel');
      expect(ArsDialog.observedAttributes).toContain('custom-css');
      expect(ArsDialog.observedAttributes).toContain('css-vars');
    });
  });

  describe('Initialization', () => {
    it('should initialize cssVars', () => {
      expect(element.cssVars).toEqual({});
    });

    it('should have null customCSS initially', () => {
      expect(element.customCSS).toBeNull();
    });

    it('should have defaultCSS', () => {
      expect(element.defaultCSS).toBeDefined();
    });
  });

  describe('Static methods', () => {
    describe('notify', () => {
      it('should return a promise', () => {
        const result = ArsDialog.notify('Test message', 'Test Title');
        
        expect(result).toBeInstanceOf(Promise);
      });

      it('should create dialog element', async () => {
        ArsDialog.notify('Test message', 'Test Title');
        
        // Wait for DOM update
        await Promise.resolve();
        
        const dialog = document.querySelector('ars-dialog');
        expect(dialog).toBeDefined();
      });

      it('should resolve when dialog is closed', async () => {
        const promise = ArsDialog.notify('Test message', 'Test Title');
        
        // Find the dialog and trigger its callback
        const dialog = document.querySelector('ars-dialog');
        dialog.onbuttonclick(true);
        
        const result = await promise;
        expect(result).toBe(true);
      });
    });

    describe('dialog', () => {
      it('should return a promise', () => {
        const result = ArsDialog.dialog('Content', 'Title');
        
        expect(result).toBeInstanceOf(Promise);
      });

      it('should create dialog with confirm buttons', async () => {
        ArsDialog.dialog('Content', 'Title', {}, '', 'OK', 'Cancel');
        
        await Promise.resolve();
        
        const dialog = document.querySelector('ars-dialog');
        expect(dialog.getAttribute('showConfirmButtons')).toBe('true');
      });

      it('should resolve with content element on OK', async () => {
        const promise = ArsDialog.dialog('<input id="test">', 'Title');
        
        await Promise.resolve();
        
        const dialog = document.querySelector('ars-dialog');
        dialog.onbuttonclick(document.createElement('div'));
        
        const result = await promise;
        expect(result).toBeDefined();
      });
    });
  });

  describe('Instance methods', () => {
    beforeEach(() => {
      document.body.appendChild(element);
    });

    describe('setCSSVars', () => {
      it('should set CSS variables', () => {
        const cssVars = { 'dialog-bg': '#ffffff' };
        
        element.setCSSVars(cssVars);
        
        expect(element.cssVars).toEqual(cssVars);
      });
    });

    describe('getCSSVars', () => {
      it('should return CSS variables', () => {
        element.cssVars = { 'dialog-bg': '#ffffff' };
        
        const result = element.getCSSVars();
        
        expect(result).toEqual({ 'dialog-bg': '#ffffff' });
      });
    });
  });

  describe('Attribute handling', () => {
    it('should activate when open attribute is set to true', () => {
      document.body.appendChild(element);
      
      element.setAttribute('open', 'true');
      
      expect(element.shadowRoot).toBeDefined();
    });

    it('should apply custom CSS from attribute', () => {
      document.body.appendChild(element);
      
      element.setAttribute('custom-css', '.test { color: red; }');
      
      expect(element.customCSS).toBe('.test { color: red; }');
    });

    it('should apply CSS vars from attribute', () => {
      document.body.appendChild(element);
      
      element.setAttribute('css-vars', '{"test-var": "value"}');
      
      expect(element.cssVars).toEqual({ 'test-var': 'value' });
    });
  });

  describe('Lifecycle', () => {
    it('should have connectedCallback', () => {
      expect(typeof element.connectedCallback).toBe('function');
    });

    it('should have attributeChangedCallback', () => {
      expect(typeof element.attributeChangedCallback).toBe('function');
    });
  });
});