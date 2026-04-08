// SDF text rendering pipeline for chart components.
//
// Contains ChartGlyphAtlas (self-contained SDF atlas) and TextPipeline.
// The atlas generates signed distance fields using the Felzenszwalb &
// Huttenlocher 2012 exact Euclidean distance transform — the same algorithm
// used by brainiac-engine's GlyphAtlas, but simplified for chart use:
//   - Fixed charset preloaded at creation (no dynamic generation)
//   - Smaller atlas (512x512), smaller base font (24px), smaller SDF radius (4)
//   - No rotation support (all chart text is axis-aligned)
//
// SDF generation reference:
//   Felzenszwalb, P.F. & Huttenlocher, D.P. "Distance Transforms of Sampled
//   Functions." Theory of Computing, Vol. 8, pp. 415–428, 2012.
//   https://cs.brown.edu/people/pfelzenszwalb/papers/dt-final.pdf
//
// SDF rendering reference:
//   Green, C. "Improved Alpha-Tested Magnification for Vector Textures and
//   Special Effects." Valve, SIGGRAPH 2007.

// Inlined WGSL shader source — avoids bundler dependency (Vite ?raw).
// Kept in sync with shaders/chart-text.wgsl (canonical reference).
const textShaderSrc = /* wgsl */`
struct Uniforms { ortho: mat4x4<f32>, }
struct GlyphInstance {
    posX: f32, posY: f32, sizeW: f32, sizeH: f32,
    u0: f32, v0: f32, u1: f32, v1: f32,
    colorR: f32, colorG: f32, colorB: f32, colorA: f32,
}
@group(0) @binding(0) var<storage, read> glyphs: array<GlyphInstance>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;
@group(0) @binding(2) var sdfAtlas: texture_2d<f32>;
@group(0) @binding(3) var sdfSampler: sampler;
struct VertexOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) color: vec4<f32>,
}
const QUAD = array<vec2<f32>, 6>(
    vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(0.0, 1.0),
    vec2(1.0, 0.0), vec2(1.0, 1.0), vec2(0.0, 1.0),
);
@vertex
fn vs(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VertexOut {
    let g = glyphs[iid];
    let q = QUAD[vid];
    let pixelPos = vec2(g.posX + q.x * g.sizeW, g.posY + q.y * g.sizeH);
    var out: VertexOut;
    out.pos = uniforms.ortho * vec4(pixelPos, 0.0, 1.0);
    out.uv = vec2(mix(g.u0, g.u1, q.x), mix(g.v0, g.v1, q.y));
    out.color = vec4(g.colorR, g.colorG, g.colorB, g.colorA);
    return out;
}
@fragment
fn fs(in: VertexOut) -> @location(0) vec4<f32> {
    let dist = textureSample(sdfAtlas, sdfSampler, in.uv).r;
    let edgeWidth = fwidth(dist) * 0.75;
    let alpha = smoothstep(0.5 - edgeWidth, 0.5 + edgeWidth, dist);
    let finalAlpha = alpha * in.color.a;
    if (finalAlpha < 0.01) { discard; }
    return vec4(in.color.rgb, finalAlpha);
}
`;

// ─── Constants ──────────────────────────────────────────────────────

/** Base font size for SDF generation (pixels). */
const BASE_FONT_SIZE = 24;

/** SDF padding radius around each glyph (pixels). */
const SDF_RADIUS = 4;

/** Atlas texture dimension. */
const ATLAS_SIZE = 512;

/** Infinity sentinel for EDT. */
const INF = 1e20;

/** Characters preloaded into the atlas — covers all chart label text. */
const CHARSET = '0123456789./-: abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ%+,';

/** Floats per glyph instance. */
export const TEXT_FLOATS_PER_INSTANCE = 12;

/** Bytes per glyph instance. */
export const TEXT_BYTES_PER_INSTANCE = TEXT_FLOATS_PER_INSTANCE * 4;

/** Initial instance buffer capacity. */
const INITIAL_CAPACITY = 512;

// ─── GlyphEntry ────────────────────────────────────────────────────

/** Metrics and atlas UV for a single glyph. */
export interface GlyphEntry {
    /** Atlas UV coordinates [u0, v0, u1, v1]. */
    uv: [number, number, number, number];
    /** Glyph bitmap width in atlas pixels (including SDF padding). */
    glyphWidth: number;
    /** Glyph bitmap height in atlas pixels (including SDF padding). */
    glyphHeight: number;
    /** Horizontal advance width at base font size. */
    advance: number;
    /** Vertical bearing — distance from baseline to glyph top at base font size. */
    bearingY: number;
}

// ─── ChartGlyphAtlas ────────────────────────────────────────��──────

export class ChartGlyphAtlas {
    readonly texture: GPUTexture;
    readonly textureView: GPUTextureView;
    readonly sampler: GPUSampler;
    readonly baseFontSize = BASE_FONT_SIZE;

    private entries = new Map<string, GlyphEntry>();

    // Shelf-packing state.
    private shelfX = 0;
    private shelfY = 0;
    private shelfHeight = 0;

    // Scratch buffers for SDF computation (reused across glyphs).
    private sdfOuterBuf: Float64Array;
    private sdfInnerBuf: Float64Array;
    private sdfFBuf: Float64Array;
    private sdfZBuf: Float64Array;
    private sdfVBuf: Uint16Array;

    private constructor(
        private device: GPUDevice,
        texture: GPUTexture,
        sampler: GPUSampler,
    ) {
        this.texture = texture;
        this.textureView = texture.createView({ label: 'chart-glyph-atlas-view' });
        this.sampler = sampler;

        const initSize = (BASE_FONT_SIZE + SDF_RADIUS * 2) ** 2;
        const maxDim = BASE_FONT_SIZE + SDF_RADIUS * 2;
        this.sdfOuterBuf = new Float64Array(initSize);
        this.sdfInnerBuf = new Float64Array(initSize);
        this.sdfFBuf = new Float64Array(maxDim);
        this.sdfZBuf = new Float64Array(maxDim + 1);
        this.sdfVBuf = new Uint16Array(maxDim);
    }

    /**
     * Create the atlas and preload all chart-relevant glyphs.
     * Uses a scratch Canvas 2D context for initial glyph rasterization,
     * then computes the SDF and uploads to a GPU texture.
     */
    static create(device: GPUDevice, fontFamily = 'monospace'): ChartGlyphAtlas {
        const texture = device.createTexture({
            label: 'chart-glyph-sdf-atlas',
            size: { width: ATLAS_SIZE, height: ATLAS_SIZE },
            format: 'r8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });

        const sampler = device.createSampler({
            label: 'chart-glyph-sampler',
            magFilter: 'linear',
            minFilter: 'linear',
        });

        const atlas = new ChartGlyphAtlas(device, texture, sampler);

        // Preload the entire charset.
        for (const char of CHARSET) {
            atlas._generateGlyph(char, fontFamily);
        }

        return atlas;
    }

    /** Look up a preloaded glyph entry. Returns undefined for unknown characters. */
    getEntry(char: string): GlyphEntry | undefined {
        return this.entries.get(char);
    }

    /** Release GPU resources. */
    destroy(): void {
        this.texture.destroy();
    }

    // ─── Private: SDF generation ───────────────────────────────────

    /**
     * Rasterize a glyph, compute its SDF, pack into atlas, upload to GPU.
     * Follows the same pipeline as brainiac-engine's GlyphAtlas._generateGlyph.
     */
    private _generateGlyph(char: string, fontFamily: string): void {
        const fontSize = BASE_FONT_SIZE;
        const pad = SDF_RADIUS;

        // Create scratch canvas for rasterization.
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('ChartGlyphAtlas: cannot create 2D scratch context');

        // Measure glyph at base font size.
        ctx.font = `${fontSize}px ${fontFamily}`;
        const metrics = ctx.measureText(char);
        const advance = metrics.width;

        // Compute glyph bitmap bounds with SDF padding.
        const glyphW = Math.ceil(advance) + pad * 2;
        const glyphH = fontSize + pad * 2;

        canvas.width = glyphW;
        canvas.height = glyphH;

        // Draw the glyph (must re-set font after resize).
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
        ctx.fillText(char, pad, fontSize + pad * 0.5);

        // Read pixel data.
        const imageData = ctx.getImageData(0, 0, glyphW, glyphH);
        const pixels = imageData.data;
        const totalPixels = glyphW * glyphH;

        // Ensure scratch buffers are large enough.
        this._ensureScratchBuffers(totalPixels, Math.max(glyphW, glyphH));

        // Prepare EDT inputs from the alpha channel.
        // Anti-aliased edges use (0.5 - a)² seed for sub-pixel accuracy
        // (TinySDF / Mapbox 2016 approach).
        const outer = this.sdfOuterBuf;
        const inner = this.sdfInnerBuf;
        for (let i = 0; i < totalPixels; i++) {
            const a = pixels[i * 4 + 3] / 255;
            outer[i] = a === 0 ? INF : a < 1 ? (0.5 - a) ** 2 : 0;
            inner[i] = a === 1 ? INF : a > 0 ? (a - 0.5) ** 2 : 0;
        }

        // Compute exact Euclidean distance transforms.
        this._edt2d(outer, glyphW, glyphH);
        this._edt2d(inner, glyphW, glyphH);

        // Combine into SDF: 128 = edge (0.5 in unorm).
        const sdfData = new Uint8Array(totalPixels);
        for (let i = 0; i < totalPixels; i++) {
            const d = Math.sqrt(outer[i]) - Math.sqrt(inner[i]);
            sdfData[i] = Math.max(0, Math.min(255, Math.round(128 - 128 * (d / pad))));
        }

        // Shelf-pack into atlas.
        if (this.shelfX + glyphW > ATLAS_SIZE) {
            this.shelfY += this.shelfHeight;
            this.shelfX = 0;
            this.shelfHeight = 0;
        }
        if (this.shelfY + glyphH > ATLAS_SIZE) {
            throw new Error(`ChartGlyphAtlas: atlas full — cannot fit "${char}".`);
        }

        const x = this.shelfX;
        const y = this.shelfY;
        this.shelfX += glyphW;
        if (glyphH > this.shelfHeight) this.shelfHeight = glyphH;

        // Upload SDF data to GPU texture.
        this.device.queue.writeTexture(
            { texture: this.texture, origin: { x, y } },
            sdfData,
            { bytesPerRow: glyphW, rowsPerImage: glyphH },
            { width: glyphW, height: glyphH },
        );

        // Store entry with normalised UVs.
        const entry: GlyphEntry = {
            uv: [x / ATLAS_SIZE, y / ATLAS_SIZE, (x + glyphW) / ATLAS_SIZE, (y + glyphH) / ATLAS_SIZE],
            glyphWidth: glyphW,
            glyphHeight: glyphH,
            advance,
            bearingY: fontSize + pad * 0.5,
        };
        this.entries.set(char, entry);
    }

    private _ensureScratchBuffers(totalPixels: number, maxDim: number): void {
        if (this.sdfOuterBuf.length < totalPixels) {
            this.sdfOuterBuf = new Float64Array(totalPixels);
            this.sdfInnerBuf = new Float64Array(totalPixels);
        }
        if (this.sdfFBuf.length < maxDim) {
            this.sdfFBuf = new Float64Array(maxDim);
            this.sdfZBuf = new Float64Array(maxDim + 1);
            this.sdfVBuf = new Uint16Array(maxDim);
        }
    }

    /**
     * 2D EDT via separable 1D passes (Felzenszwalb & Huttenlocher 2012, §3).
     * Rows first, then columns — exact Euclidean distances in O(n).
     */
    private _edt2d(grid: Float64Array, w: number, h: number): void {
        for (let y = 0; y < h; y++) this._edt1d(grid, y * w, 1, w);
        for (let x = 0; x < w; x++) this._edt1d(grid, x, w, h);
    }

    /**
     * 1D squared distance transform via lower envelope of parabolas.
     * Core algorithm from Felzenszwalb & Huttenlocher 2012, §2.
     */
    private _edt1d(grid: Float64Array, offset: number, stride: number, length: number): void {
        const f = this.sdfFBuf;
        const z = this.sdfZBuf;
        const v = this.sdfVBuf;

        for (let q = 0; q < length; q++) f[q] = grid[offset + q * stride];

        v[0] = 0;
        z[0] = -INF;
        z[1] = INF;
        let k = 0;

        for (let q = 1; q < length; q++) {
            let s: number;
            do {
                const r = v[k];
                s = (f[q] - f[r] + q * q - r * r) / (2 * q - 2 * r);
                if (s > z[k]) break;
                k--;
            } while (k >= 0);
            k++;
            v[k] = q;
            z[k] = s;
            z[k + 1] = INF;
        }

        k = 0;
        for (let q = 0; q < length; q++) {
            while (z[k + 1] < q) k++;
            const r = v[k];
            const dx = q - r;
            grid[offset + q * stride] = f[r] + dx * dx;
        }
    }
}

// ─── TextPipeline ──────────────────────────────────────────────────

export class TextPipeline {
    readonly pipeline: GPURenderPipeline;
    readonly bindGroupLayout: GPUBindGroupLayout;
    readonly atlas: ChartGlyphAtlas;

    private device: GPUDevice;
    private instanceBuffer: GPUBuffer;
    private instanceCapacity: number;
    private instanceData: Float32Array;
    private instanceCount: number = 0;

    private constructor(
        device: GPUDevice,
        pipeline: GPURenderPipeline,
        bindGroupLayout: GPUBindGroupLayout,
        instanceBuffer: GPUBuffer,
        capacity: number,
        atlas: ChartGlyphAtlas,
    ) {
        this.device = device;
        this.pipeline = pipeline;
        this.bindGroupLayout = bindGroupLayout;
        this.instanceBuffer = instanceBuffer;
        this.instanceCapacity = capacity;
        this.instanceData = new Float32Array(capacity * TEXT_FLOATS_PER_INSTANCE);
        this.atlas = atlas;
    }

    /** Create the text pipeline with its SDF glyph atlas. */
    static create(device: GPUDevice, format: GPUTextureFormat, uniformBuffer: GPUBuffer, fontFamily = 'monospace'): TextPipeline {
        const atlas = ChartGlyphAtlas.create(device, fontFamily);

        const shaderModule = device.createShaderModule({
            label: 'chart-text-shader',
            code: textShaderSrc,
        });

        const bindGroupLayout = device.createBindGroupLayout({
            label: 'chart-text-bind-group-layout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
                { binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
            ],
        });

        const pipelineLayout = device.createPipelineLayout({
            label: 'chart-text-pipeline-layout',
            bindGroupLayouts: [bindGroupLayout],
        });

        const pipeline = device.createRenderPipeline({
            label: 'chart-text-pipeline',
            layout: pipelineLayout,
            vertex: { module: shaderModule, entryPoint: 'vs' },
            fragment: {
                module: shaderModule,
                entryPoint: 'fs',
                targets: [{
                    format,
                    blend: {
                        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                    },
                }],
            },
            primitive: { topology: 'triangle-list' },
        });

        const capacity = INITIAL_CAPACITY;
        const instanceBuffer = device.createBuffer({
            label: 'chart-text-instances',
            size: capacity * TEXT_BYTES_PER_INSTANCE,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        return new TextPipeline(device, pipeline, bindGroupLayout, instanceBuffer, capacity, atlas);
    }

    /** Reset glyph instance count for a new frame. */
    reset(): void {
        this.instanceCount = 0;
    }

    /**
     * Push a text string as a sequence of glyph instances.
     *
     * @param text     The string to render.
     * @param x        X position in pixels (anchor point depends on align).
     * @param y        Y position in pixels (anchor point depends on baseline).
     * @param r,g,b,a  Text color (0–1 range).
     * @param fontSize Target font size in pixels.
     * @param align    Horizontal alignment: 'left', 'center', 'right'.
     * @param baseline Vertical alignment: 'top', 'middle', 'bottom'.
     */
    pushText(
        text: string,
        x: number, y: number,
        r: number, g: number, b: number, a: number,
        fontSize: number,
        align: 'left' | 'center' | 'right',
        baseline: 'top' | 'middle' | 'bottom',
    ): void {
        const scale = fontSize / BASE_FONT_SIZE;

        // Compute total text width for alignment.
        let totalWidth = 0;
        for (const char of text) {
            const entry = this.atlas.getEntry(char);
            if (entry) totalWidth += entry.advance * scale;
        }

        // Horizontal anchor.
        let cursorX = x;
        if (align === 'center') cursorX -= totalWidth / 2;
        else if (align === 'right') cursorX -= totalWidth;

        // Vertical anchor — place baseline then offset glyphs.
        // Chart text is small monospace; using full glyph height for simplicity.
        const glyphHeight = (BASE_FONT_SIZE + SDF_RADIUS * 2) * scale;
        let baselineY = y;
        if (baseline === 'top') baselineY = y;
        else if (baseline === 'middle') baselineY = y - glyphHeight / 2;
        else if (baseline === 'bottom') baselineY = y - glyphHeight;

        for (const char of text) {
            const entry = this.atlas.getEntry(char);
            if (!entry) continue; // Skip unknown characters.

            const w = entry.glyphWidth * scale;
            const h = entry.glyphHeight * scale;

            this._pushGlyph(cursorX, baselineY, w, h, entry.uv, r, g, b, a);
            cursorX += entry.advance * scale;
        }
    }

    /** Upload glyph instance data and return draw parameters. */
    flush(uniformBuffer: GPUBuffer): { bindGroup: GPUBindGroup; vertexCount: number; instanceCount: number } | null {
        if (this.instanceCount === 0) return null;

        this._ensureCapacity(this.instanceCount);

        this.device.queue.writeBuffer(
            this.instanceBuffer,
            0,
            this.instanceData.buffer,
            0,
            this.instanceCount * TEXT_BYTES_PER_INSTANCE,
        );

        const bindGroup = this.device.createBindGroup({
            label: 'chart-text-bind-group',
            layout: this.bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.instanceBuffer } },
                { binding: 1, resource: { buffer: uniformBuffer } },
                { binding: 2, resource: this.atlas.textureView },
                { binding: 3, resource: this.atlas.sampler },
            ],
        });

        return {
            bindGroup,
            vertexCount: 6,
            instanceCount: this.instanceCount,
        };
    }

    /** Release GPU resources. */
    destroy(): void {
        this.instanceBuffer.destroy();
        this.atlas.destroy();
    }

    // --- Private ---

    private _pushGlyph(
        posX: number, posY: number,
        sizeW: number, sizeH: number,
        uv: [number, number, number, number],
        r: number, g: number, b: number, a: number,
    ): void {
        const offset = this.instanceCount * TEXT_FLOATS_PER_INSTANCE;
        this._ensureCapacity(this.instanceCount + 1);
        this.instanceData[offset + 0] = posX;
        this.instanceData[offset + 1] = posY;
        this.instanceData[offset + 2] = sizeW;
        this.instanceData[offset + 3] = sizeH;
        this.instanceData[offset + 4] = uv[0];
        this.instanceData[offset + 5] = uv[1];
        this.instanceData[offset + 6] = uv[2];
        this.instanceData[offset + 7] = uv[3];
        this.instanceData[offset + 8] = r;
        this.instanceData[offset + 9] = g;
        this.instanceData[offset + 10] = b;
        this.instanceData[offset + 11] = a;
        this.instanceCount++;
    }

    /** Power-of-two buffer growth. */
    private _ensureCapacity(needed: number): void {
        if (needed <= this.instanceCapacity) return;

        let newCapacity = this.instanceCapacity;
        while (newCapacity < needed) newCapacity *= 2;

        const newData = new Float32Array(newCapacity * TEXT_FLOATS_PER_INSTANCE);
        newData.set(this.instanceData);
        this.instanceData = newData;

        this.instanceBuffer.destroy();
        this.instanceBuffer = this.device.createBuffer({
            label: 'chart-text-instances',
            size: newCapacity * TEXT_BYTES_PER_INSTANCE,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.instanceCapacity = newCapacity;
    }
}
