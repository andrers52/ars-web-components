/**
 * Tests for MixinBase
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import WebComponentBase from '../../components/web-component-base/web-component-base.js';
import { MixinBase } from './mixin-base.js';

let customElementCounter = 0;

const defineUniqueElement = (tagName, elementClass) => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, elementClass);
  }
};

describe('MixinBase', () => {
  let mixinElement;
  let nestedMixinTagName;
  let harnessMixinTagName;

  beforeEach(() => {
    document.body.innerHTML = '';

    customElementCounter += 1;
    harnessMixinTagName = `test-harness-${customElementCounter}-mixin`;
    nestedMixinTagName = `nested-harness-${customElementCounter}-mixin`;

    class TestHarnessMixin extends MixinBase(WebComponentBase) {}
    class NestedHarnessMixin extends MixinBase(WebComponentBase) {}

    defineUniqueElement(harnessMixinTagName, TestHarnessMixin);
    defineUniqueElement(nestedMixinTagName, NestedHarnessMixin);

    mixinElement = document.createElement(harnessMixinTagName);
  });

  describe('constructor guards', () => {
    it('creates mixin instances when class name and tag follow the convention', () => {
      expect(mixinElement).toBeInstanceOf(HTMLElement);
      expect(mixinElement.tagName.toLowerCase()).toBe(harnessMixinTagName);
    });
  });

  describe('isMixin', () => {
    it('detects mixin elements by tag suffix', () => {
      const nestedMixin = document.createElement(nestedMixinTagName);

      expect(mixinElement.isMixin(nestedMixin)).toBe(true);
    });

    it('returns false for plain elements', () => {
      const plainElement = document.createElement('div');

      expect(mixinElement.isMixin(plainElement)).toBe(false);
    });

    it('returns false for missing elements', () => {
      expect(mixinElement.isMixin(null)).toBe(false);
    });
  });

  describe('findActualTargetComponent', () => {
    it('returns null when there is no nested target', () => {
      expect(mixinElement.findActualTargetComponent()).toBeNull();
    });

    it('returns the first non-mixin child', () => {
      const target = document.createElement('button');
      mixinElement.appendChild(target);

      expect(mixinElement.findActualTargetComponent()).toBe(target);
    });

    it('walks through nested mixins until it finds the actual target', () => {
      const nestedMixin = document.createElement(nestedMixinTagName);
      const target = document.createElement('section');

      nestedMixin.appendChild(target);
      mixinElement.appendChild(nestedMixin);

      expect(mixinElement.findActualTargetComponent()).toBe(target);
    });
  });

  describe('injectIntoTarget', () => {
    it('adds missing functions and binds them to the mixin instance', () => {
      const target = document.createElement('div');
      mixinElement.injectIntoTarget(target, {
        readTag() {
          return this.tagName.toLowerCase();
        },
        enabled: true,
      });

      expect(target.readTag()).toBe(harnessMixinTagName);
      expect(target.enabled).toBe(true);
    });

    it('does not override existing properties unless forced', () => {
      const target = document.createElement('div');
      target.existing = 'keep-me';

      mixinElement.injectIntoTarget(target, { existing: 'replace-me' });
      expect(target.existing).toBe('keep-me');

      mixinElement.injectIntoTarget(target, { existing: 'replace-me' }, true);
      expect(target.existing).toBe('replace-me');
    });

    it('returns early when no target is provided', () => {
      expect(() => {
        mixinElement.injectIntoTarget(null, { anything: true });
      }).not.toThrow();
    });
  });

  describe('hover helpers', () => {
    it('adds and removes hover listeners from the actual target', () => {
      const target = document.createElement('div');
      const handler = vi.fn();
      const addSpy = vi.spyOn(target, 'addEventListener');
      const removeSpy = vi.spyOn(target, 'removeEventListener');

      mixinElement.appendChild(target);
      mixinElement.setupHoverListeners(target, handler);

      expect(addSpy).toHaveBeenCalledWith('mouseenter', handler);
      expect(mixinElement._hoverHandler).toBe(handler);

      mixinElement.cleanupHoverListeners();

      expect(removeSpy).toHaveBeenCalledWith('mouseenter', handler);
      expect(mixinElement._hoverHandler).toBeNull();
    });

    it('ignores invalid hover setup calls', () => {
      expect(() => {
        mixinElement.setupHoverListeners(null, vi.fn());
        mixinElement.setupHoverListeners(document.createElement('div'), null);
      }).not.toThrow();
    });
  });
});
