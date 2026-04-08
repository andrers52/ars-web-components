// Instanced rectangle (and circle) GPU pipeline for chart rendering.
//
// Manages the GPU render pipeline, bind group layout, and instance buffer
// for filled rectangles and circles.  Each instance is 9 x f32 = 36 bytes:
//   posX, posY, sizeW, sizeH, colorR, colorG, colorB, colorA, shape
//
// The rect pipeline is the first pipeline drawn in the render pass, so
// it handles backgrounds, candle bodies, volume bars, and highlight regions.

// Inlined WGSL shader source — avoids bundler dependency (Vite ?raw).
// Kept in sync with shaders/chart-rect.wgsl (canonical reference).
const rectShaderSrc = /* wgsl */`
struct Uniforms { ortho: mat4x4<f32>, }
struct RectInstance {
    posX: f32, posY: f32, sizeW: f32, sizeH: f32,
    colorR: f32, colorG: f32, colorB: f32, colorA: f32,
    shape: f32,
}
@group(0) @binding(0) var<storage, read> rects: array<RectInstance>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;
struct VertexOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) localUV: vec2<f32>,
    @location(2) shape: f32,
}
const QUAD = array<vec2<f32>, 6>(
    vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(0.0, 1.0),
    vec2(1.0, 0.0), vec2(1.0, 1.0), vec2(0.0, 1.0),
);
@vertex
fn vs(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VertexOut {
    let r = rects[iid];
    let q = QUAD[vid];
    let pixelPos = vec2(r.posX + q.x * r.sizeW, r.posY + q.y * r.sizeH);
    var out: VertexOut;
    out.pos = uniforms.ortho * vec4(pixelPos, 0.0, 1.0);
    out.color = vec4(r.colorR, r.colorG, r.colorB, r.colorA);
    out.localUV = q;
    out.shape = r.shape;
    return out;
}
@fragment
fn fs(in: VertexOut) -> @location(0) vec4<f32> {
    if (in.shape > 0.5) {
        let d = distance(in.localUV, vec2(0.5, 0.5));
        if (d > 0.5) { discard; }
        let alpha = 1.0 - smoothstep(0.45, 0.5, d);
        return vec4(in.color.rgb, in.color.a * alpha);
    }
    return in.color;
}
`;

/** Floats per rectangle instance (posX, posY, sizeW, sizeH, r, g, b, a, shape). */
export const RECT_FLOATS_PER_INSTANCE = 9;

/** Bytes per rectangle instance. */
export const RECT_BYTES_PER_INSTANCE = RECT_FLOATS_PER_INSTANCE * 4;

/** Initial instance buffer capacity (number of instances). */
const INITIAL_CAPACITY = 256;

export class RectPipeline {
    readonly pipeline: GPURenderPipeline;
    readonly bindGroupLayout: GPUBindGroupLayout;

    private device: GPUDevice;
    private instanceBuffer: GPUBuffer;
    private instanceCapacity: number;

    // CPU-side instance data staging area.
    private instanceData: Float32Array;
    private instanceCount: number = 0;

    private constructor(
        device: GPUDevice,
        pipeline: GPURenderPipeline,
        bindGroupLayout: GPUBindGroupLayout,
        instanceBuffer: GPUBuffer,
        capacity: number,
    ) {
        this.device = device;
        this.pipeline = pipeline;
        this.bindGroupLayout = bindGroupLayout;
        this.instanceBuffer = instanceBuffer;
        this.instanceCapacity = capacity;
        this.instanceData = new Float32Array(capacity * RECT_FLOATS_PER_INSTANCE);
    }

    /** Create the pipeline with its shader module and bind group layout. */
    static create(device: GPUDevice, format: GPUTextureFormat, _uniformBuffer: GPUBuffer): RectPipeline {
        const shaderModule = device.createShaderModule({
            label: 'chart-rect-shader',
            code: rectShaderSrc,
        });

        const bindGroupLayout = device.createBindGroupLayout({
            label: 'chart-rect-bind-group-layout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
            ],
        });

        const pipelineLayout = device.createPipelineLayout({
            label: 'chart-rect-pipeline-layout',
            bindGroupLayouts: [bindGroupLayout],
        });

        const pipeline = device.createRenderPipeline({
            label: 'chart-rect-pipeline',
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
            label: 'chart-rect-instances',
            size: capacity * RECT_BYTES_PER_INSTANCE,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        return new RectPipeline(device, pipeline, bindGroupLayout, instanceBuffer, capacity);
    }

    /** Reset instance count for a new frame. */
    reset(): void {
        this.instanceCount = 0;
    }

    /** Push a filled rectangle instance. */
    pushRect(x: number, y: number, w: number, h: number, r: number, g: number, b: number, a: number): void {
        this._pushInstance(x, y, w, h, r, g, b, a, 0);
    }

    /** Push a filled circle instance (rendered as quad with SDF circle in fragment shader). */
    pushCircle(cx: number, cy: number, radius: number, r: number, g: number, b: number, a: number): void {
        // Circle is inscribed in a square quad centered at (cx, cy).
        const diameter = radius * 2;
        this._pushInstance(cx - radius, cy - radius, diameter, diameter, r, g, b, a, 1);
    }

    /** Upload instance data to GPU and return the count for draw call. */
    flush(uniformBuffer: GPUBuffer): { bindGroup: GPUBindGroup; vertexCount: number; instanceCount: number } | null {
        if (this.instanceCount === 0) return null;

        // Grow buffer if needed (power-of-two growth).
        this._ensureCapacity(this.instanceCount);

        // Upload instance data to GPU.
        this.device.queue.writeBuffer(
            this.instanceBuffer,
            0,
            this.instanceData.buffer,
            0,
            this.instanceCount * RECT_BYTES_PER_INSTANCE,
        );

        const bindGroup = this.device.createBindGroup({
            label: 'chart-rect-bind-group',
            layout: this.bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.instanceBuffer } },
                { binding: 1, resource: { buffer: uniformBuffer } },
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
    }

    // --- Private ---

    private _pushInstance(
        posX: number, posY: number, sizeW: number, sizeH: number,
        r: number, g: number, b: number, a: number,
        shape: number,
    ): void {
        const offset = this.instanceCount * RECT_FLOATS_PER_INSTANCE;
        this._ensureCapacity(this.instanceCount + 1);
        this.instanceData[offset + 0] = posX;
        this.instanceData[offset + 1] = posY;
        this.instanceData[offset + 2] = sizeW;
        this.instanceData[offset + 3] = sizeH;
        this.instanceData[offset + 4] = r;
        this.instanceData[offset + 5] = g;
        this.instanceData[offset + 6] = b;
        this.instanceData[offset + 7] = a;
        this.instanceData[offset + 8] = shape;
        this.instanceCount++;
    }

    /** Grow the instance buffer and staging array if needed. */
    private _ensureCapacity(needed: number): void {
        if (needed <= this.instanceCapacity) return;

        // Power-of-two growth.
        let newCapacity = this.instanceCapacity;
        while (newCapacity < needed) newCapacity *= 2;

        // Grow CPU staging array.
        const newData = new Float32Array(newCapacity * RECT_FLOATS_PER_INSTANCE);
        newData.set(this.instanceData);
        this.instanceData = newData;

        // Recreate GPU buffer.
        this.instanceBuffer.destroy();
        this.instanceBuffer = this.device.createBuffer({
            label: 'chart-rect-instances',
            size: newCapacity * RECT_BYTES_PER_INSTANCE,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.instanceCapacity = newCapacity;
    }
}
