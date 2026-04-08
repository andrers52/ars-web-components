// @vi-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { parseCssColor, clearColorCache } from './color-utils.js';
import type { Color4 } from './color-utils.js';

// Helper: compare float tuples with tolerance for floating-point rounding.
const expectColor = (actual: Color4, expected: Color4, tolerance = 0.002) => {
    expect(actual).toHaveLength(4);
    for (let i = 0; i < 4; i++) {
        expect(actual[i]).toBeCloseTo(expected[i], -Math.log10(tolerance));
    }
};

describe('parseCssColor', () => {
    beforeEach(() => {
        clearColorCache();
    });

    // --- Hex formats ---

    it('parses #RRGGBB', () => {
        expectColor(parseCssColor('#5ad68a'), [0.353, 0.839, 0.541, 1]);
    });

    it('parses #RGB shorthand', () => {
        expectColor(parseCssColor('#f00'), [1, 0, 0, 1]);
    });

    it('parses #RRGGBBAA with alpha', () => {
        expectColor(parseCssColor('#ff000080'), [1, 0, 0, 0.502]);
    });

    it('parses black hex', () => {
        expectColor(parseCssColor('#000000'), [0, 0, 0, 1]);
    });

    it('parses white hex', () => {
        expectColor(parseCssColor('#ffffff'), [1, 1, 1, 1]);
    });

    // --- rgb/rgba functional notation ---

    it('parses rgb(r, g, b)', () => {
        expectColor(parseCssColor('rgb(255, 128, 0)'), [1, 0.502, 0, 1]);
    });

    it('parses rgba(r, g, b, a)', () => {
        expectColor(parseCssColor('rgba(255, 255, 255, 0.5)'), [1, 1, 1, 0.5]);
    });

    it('parses rgba with zero alpha', () => {
        expectColor(parseCssColor('rgba(8, 12, 16, 0)'), [8 / 255, 12 / 255, 16 / 255, 0]);
    });

    it('handles extra spaces in rgba', () => {
        expectColor(parseCssColor('rgba(  255 , 0 , 0 , 0.7 )'), [1, 0, 0, 0.7]);
    });

    it('parses rgba with common chart colors', () => {
        // These are the actual colors used by the chart components.
        expectColor(parseCssColor('rgba(8, 12, 16, 0.9)'), [8 / 255, 12 / 255, 16 / 255, 0.9]);
        expectColor(parseCssColor('rgba(255, 255, 255, 0.08)'), [1, 1, 1, 0.08]);
        expectColor(parseCssColor('rgba(255, 255, 255, 0.5)'), [1, 1, 1, 0.5]);
        expectColor(parseCssColor('rgba(92, 128, 196, 0.6)'), [92 / 255, 128 / 255, 196 / 255, 0.6]);
        expectColor(parseCssColor('rgba(255, 170, 70, 0.7)'), [1, 170 / 255, 70 / 255, 0.7]);
        expectColor(parseCssColor('rgba(90, 160, 255, 0.7)'), [90 / 255, 160 / 255, 1, 0.7]);
    });

    // --- Named colors ---

    it('parses transparent', () => {
        expectColor(parseCssColor('transparent'), [0, 0, 0, 0]);
    });

    it('parses named colors', () => {
        expectColor(parseCssColor('black'), [0, 0, 0, 1]);
        expectColor(parseCssColor('white'), [1, 1, 1, 1]);
        expectColor(parseCssColor('red'), [1, 0, 0, 1]);
    });

    it('is case-insensitive for named colors', () => {
        expectColor(parseCssColor('BLACK'), [0, 0, 0, 1]);
        expectColor(parseCssColor('White'), [1, 1, 1, 1]);
    });

    // --- Caching ---

    it('returns cached result for repeated calls', () => {
        const a = parseCssColor('#ff0000');
        const b = parseCssColor('#ff0000');
        // Same reference from cache.
        expect(a).toBe(b);
    });

    it('clearColorCache resets the cache', () => {
        const a = parseCssColor('#ff0000');
        clearColorCache();
        const b = parseCssColor('#ff0000');
        // New object after cache clear — same values, different reference.
        expect(a).not.toBe(b);
        expectColor(a, b);
    });

    // --- Error handling (fail fast) ---

    it('throws on unsupported format', () => {
        expect(() => parseCssColor('hsl(0, 100%, 50%)')).toThrow('unsupported color format');
    });

    it('throws on invalid hex length', () => {
        expect(() => parseCssColor('#12345')).toThrow('invalid hex format');
    });

    it('throws on garbage input', () => {
        expect(() => parseCssColor('not-a-color')).toThrow('unsupported color format');
    });

    // --- Edge cases ---

    it('handles leading/trailing whitespace', () => {
        expectColor(parseCssColor('  #ff0000  '), [1, 0, 0, 1]);
    });

    it('parses rgb without alpha as fully opaque', () => {
        const [, , , a] = parseCssColor('rgb(100, 200, 50)');
        expect(a).toBe(1);
    });
});
