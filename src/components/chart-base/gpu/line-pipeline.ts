// Instanced line segment GPU pipeline for chart rendering.
//
// Each line is rendered as an oriented quad (2 triangles) with controllable
// width and optional dashing.  This avoids WebGPU's line-list topology
// which is limited to 1px width on most implementations.
//
// Instance layout: 12 x f32 = 48 bytes per line segment:
//   x0, y0, x1, y1, colorR, colorG, colorB, colorA, width, dashLen, gapLen, totalLen

// Inlined WGSL shader source — avoids bundler dependency (Vite ?raw).
// Kept in sync with shaders/chart-line.wgsl (canonical reference).
const lineShaderSrc = /* wgsl */`
struct Uniforms { ortho: mat4x4<f32>, }
struct LineInstance {
    x0: f32, y0: f32, x1: f32, y1: f32,
    colorR: f32, colorG: f32, colorB: f32, colorA: f32,
    width: f32, dashLen: f32, gapLen: f32, totalLen: f32,
}
@group(0) @binding(0) var<storage, read> lines: array<LineInstance>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;
struct VertexOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) lineProgress: f32,
    @location(2) dashLen: f32,
    @location(3) gapLen: f32,
}
const QUAD = array<vec2<f32>, 6>(
    vec2(0.0, -0.5), vec2(1.0, -0.5), vec2(0.0, 0.5),
    vec2(1.0, -0.5), vec2(1.0,  0.5), vec2(0.0, 0.5),
);
@vertex
fn vs(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VertexOut {
    let l = lines[iid];
    let q = QUAD[vid];
    let dir = vec2(l.x1 - l.x0, l.y1 - l.y0);
    let len = length(dir);
    let tangent = select(vec2(1.0, 0.0), dir / len, len > 0.001);
    let normal = vec2(-tangent.y, tangent.x);
    let pixelPos = vec2(l.x0, l.y0) + tangent * q.x * len + normal * q.y * l.width;
    var out: VertexOut;
    out.pos = uniforms.ortho * vec4(pixelPos, 0.0, 1.0);
    out.color = vec4(l.colorR, l.colorG, l.colorB, l.colorA);
    out.lineProgress = q.x * l.totalLen;
    out.dashLen = l.dashLen;
    out.gapLen = l.gapLen;
    return out;
}
@fragment
fn fs(in: VertexOut) -> @location(0) vec4<f32> {
    if (in.dashLen > 0.0) {
        let cycle = in.dashLen + in.gapLen;
        let t = in.lineProgress % cycle;
        if (t > in.dashLen) { discard; }
    }
    return in.color;
}
`;

/** Floats per line instance. */
export const LINE_FLOATS_PER_INSTANCE = 12;

/** Bytes per line instance. */
export const LINE_BYTES_PER_INSTANCE = LINE_FLOATS_PER_INSTANCE * 4;

/** Initial instance buffer capacity (number of instances). */
const INITIAL_CAPACITY = 256;

export class LinePipeline {
    readonly pipeline: GPURenderPipeline;
    readonly bindGroupLayout: GPUBindGroupLayout;

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
    ) {
        this.device = device;
        this.pipeline = pipeline;
        this.bindGroupLayout = bindGroupLayout;
        this.instanceBuffer = instanceBuffer;
        this.instanceCapacity = capacity;
        this.instanceData = new Float32Array(capacity * LINE_FLOATS_PER_INSTANCE);
    }

    /** Create the pipeline with its shader module and bind group layout. */
    static create(device: GPUDevice, format: GPUTextureFormat, _uniformBuffer: GPUBuffer): LinePipeline {
        const shaderModule = device.createShaderModule({
            label: 'chart-line-shader',
            code: lineShaderSrc,
        });

        const bindGroupLayout = device.createBindGroupLayout({
            label: 'chart-line-bind-group-layout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
                { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
            ],
        });

        const pipelineLayout = device.createPipelineLayout({
            label: 'chart-line-pipeline-layout',
            bindGroupLayouts: [bindGroupLayout],
        });

        const pipeline = device.createRenderPipeline({
            label: 'chart-line-pipeline',
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
            label: 'chart-line-instances',
            size: capacity * LINE_BYTES_PER_INSTANCE,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        return new LinePipeline(device, pipeline, bindGroupLayout, instanceBuffer, capacity);
    }

    /** Reset instance count for a new frame. */
    reset(): void {
        this.instanceCount = 0;
    }

    /** Push a solid line segment. */
    pushLine(
        x0: number, y0: number, x1: number, y1: number,
        r: number, g: number, b: number, a: number,
        width: number,
    ): void {
        const totalLen = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
        this._pushInstance(x0, y0, x1, y1, r, g, b, a, width, 0, 0, totalLen);
    }

    /** Push a dashed line segment. */
    pushDashedLine(
        x0: number, y0: number, x1: number, y1: number,
        r: number, g: number, b: number, a: number,
        width: number,
        dashLen: number,
        gapLen: number,
    ): void {
        const totalLen = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
        this._pushInstance(x0, y0, x1, y1, r, g, b, a, width, dashLen, gapLen, totalLen);
    }

    /** Upload instance data to GPU and return draw parameters. */
    flush(uniformBuffer: GPUBuffer): { bindGroup: GPUBindGroup; vertexCount: number; instanceCount: number } | null {
        if (this.instanceCount === 0) return null;

        this._ensureCapacity(this.instanceCount);

        this.device.queue.writeBuffer(
            this.instanceBuffer,
            0,
            this.instanceData.buffer,
            0,
            this.instanceCount * LINE_BYTES_PER_INSTANCE,
        );

        const bindGroup = this.device.createBindGroup({
            label: 'chart-line-bind-group',
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
        x0: number, y0: number, x1: number, y1: number,
        r: number, g: number, b: number, a: number,
        width: number, dashLen: number, gapLen: number, totalLen: number,
    ): void {
        const offset = this.instanceCount * LINE_FLOATS_PER_INSTANCE;
        this._ensureCapacity(this.instanceCount + 1);
        this.instanceData[offset + 0] = x0;
        this.instanceData[offset + 1] = y0;
        this.instanceData[offset + 2] = x1;
        this.instanceData[offset + 3] = y1;
        this.instanceData[offset + 4] = r;
        this.instanceData[offset + 5] = g;
        this.instanceData[offset + 6] = b;
        this.instanceData[offset + 7] = a;
        this.instanceData[offset + 8] = width;
        this.instanceData[offset + 9] = dashLen;
        this.instanceData[offset + 10] = gapLen;
        this.instanceData[offset + 11] = totalLen;
        this.instanceCount++;
    }

    /** Grow the instance buffer and staging array if needed (power-of-two). */
    private _ensureCapacity(needed: number): void {
        if (needed <= this.instanceCapacity) return;

        let newCapacity = this.instanceCapacity;
        while (newCapacity < needed) newCapacity *= 2;

        const newData = new Float32Array(newCapacity * LINE_FLOATS_PER_INSTANCE);
        newData.set(this.instanceData);
        this.instanceData = newData;

        this.instanceBuffer.destroy();
        this.instanceBuffer = this.device.createBuffer({
            label: 'chart-line-instances',
            size: newCapacity * LINE_BYTES_PER_INSTANCE,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.instanceCapacity = newCapacity;
    }
}
