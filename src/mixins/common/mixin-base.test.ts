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

    it('accepts a mixin whose class name was renamed by a minifier', () => {
      // Regression: the constructor used to assert `constructor.name` ends in
      // 'Mixin'. Minifiers rename classes, so this threw in every production
      // bundle while passing in dev and tests. `Kb` is a real name emitted by
      // terser for PressedEffectMixin.
      const tagName = `minified-harness-${(customElementCounter += 1)}-mixin`;
      class Kb extends MixinBase(WebComponentBase) {}
      defineUniqueElement(tagName, Kb);

      expect(() => document.createElement(tagName)).not.toThrow();
    });

    it('still rejects a tag that does not end in -mixin', () => {
      // The tag name survives minification, so it remains enforced. jsdom
      // reports a throw from a custom element constructor as an unhandled
      // error rather than propagating it out of createElement, so the
      // assertion is captured off the error event instead of via toThrow().
      const tagName = `badly-named-harness-${(customElementCounter += 1)}`;
      class WronglyTaggedMixin extends MixinBase(WebComponentBase) {}
      defineUniqueElement(tagName, WronglyTaggedMixin);

      const errors = [];
      const onError = (event) => {
        errors.push(event.error?.message ?? event.message);
        event.preventDefault();
      };
      window.addEventListener('error', onError);
      try {
        document.createElement(tagName);
      } finally {
        window.removeEventListener('error', onError);
      }

      expect(errors.join('\n')).toMatch(/must end with '-mixin'/);
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

    it('detects a mixin whose class name was renamed by a minifier', () => {
      // Regression: detection used to fall back to `constructor.name`, which a
      // minifier erases. Unlike the constructor guard this failed silently —
      // nested-mixin detection just answered false in production.
      const tagName = `minified-nested-${(customElementCounter += 1)}-mixin`;
      class Zq extends MixinBase(WebComponentBase) {}
      defineUniqueElement(tagName, Zq);

      expect(mixinElement.isMixin(document.createElement(tagName))).toBe(true);
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
