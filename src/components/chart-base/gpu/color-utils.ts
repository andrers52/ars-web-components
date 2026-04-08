// CSS color string → [r, g, b, a] float tuple (0–1 range).
// WebGPU needs float4 colors; Canvas 2D accepts CSS strings.
// Results are cached so repeated colors (e.g. grid lines drawn N times)
// don't re-parse every frame.

/** RGBA tuple in 0–1 range, suitable for GPU uniform/vertex data. */
export type Color4 = [number, number, number, number];

// Parse cache — keyed by the original CSS string.
const cache = new Map<string, Color4>();

// Named CSS colors used by chart components (small subset, not full CSS4).
const NAMED_COLORS: Record<string, Color4> = {
    transparent: [0, 0, 0, 0],
    black: [0, 0, 0, 1],
    white: [1, 1, 1, 1],
    red: [1, 0, 0, 1],
    green: [0, 0.502, 0, 1],
    blue: [0, 0, 1, 1],
};

/**
 * Parse a CSS color string into an RGBA float4 tuple.
 *
 * Supported formats:
 *   - #RGB, #RRGGBB, #RRGGBBAA
 *   - rgb(r, g, b), rgba(r, g, b, a)
 *   - Named colors (transparent, black, white, red, green, blue)
 *
 * Throws on unsupported formats — fail fast, never silently return a default.
 */
export function parseCssColor(css: string): Color4 {
    const cached = cache.get(css);
    if (cached) return cached;

    const result = _parse(css.trim());
    cache.set(css, result);
    return result;
}

/** Clear the parse cache (useful for tests). */
export function clearColorCache(): void {
    cache.clear();
}

function _parse(css: string): Color4 {
    // Named color.
    const named = NAMED_COLORS[css.toLowerCase()];
    if (named) return named;

    // Hex formats: #RGB, #RRGGBB, #RRGGBBAA.
    if (css.startsWith('#')) {
        return _parseHex(css);
    }

    // rgb() / rgba() functional notation.
    if (css.startsWith('rgb')) {
        return _parseRgbFunc(css);
    }

    throw new Error(`parseCssColor: unsupported color format "${css}"`);
}

function _parseHex(hex: string): Color4 {
    const h = hex.slice(1);
    if (h.length === 3) {
        // #RGB → #RRGGBB
        const r = parseInt(h[0] + h[0], 16) / 255;
        const g = parseInt(h[1] + h[1], 16) / 255;
        const b = parseInt(h[2] + h[2], 16) / 255;
        return [r, g, b, 1];
    }
    if (h.length === 6) {
        const r = parseInt(h.slice(0, 2), 16) / 255;
        const g = parseInt(h.slice(2, 4), 16) / 255;
        const b = parseInt(h.slice(4, 6), 16) / 255;
        return [r, g, b, 1];
    }
    if (h.length === 8) {
        const r = parseInt(h.slice(0, 2), 16) / 255;
        const g = parseInt(h.slice(2, 4), 16) / 255;
        const b = parseInt(h.slice(4, 6), 16) / 255;
        const a = parseInt(h.slice(6, 8), 16) / 255;
        return [r, g, b, a];
    }
    throw new Error(`parseCssColor: invalid hex format "${hex}"`);
}

function _parseRgbFunc(css: string): Color4 {
    // Match rgb(r, g, b) or rgba(r, g, b, a) — tolerant of spaces.
    const match = css.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/);
    if (!match) {
        throw new Error(`parseCssColor: cannot parse "${css}"`);
    }
    const r = Number(match[1]) / 255;
    const g = Number(match[2]) / 255;
    const b = Number(match[3]) / 255;
    const a = match[4] !== undefined ? Number(match[4]) : 1;
    return [r, g, b, a];
}
