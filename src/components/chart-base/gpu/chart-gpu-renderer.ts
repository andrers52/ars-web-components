// Central GPU renderer for chart components.
//
// Owns the three rendering pipelines (rect, line, text), the shared
// orthographic projection uniform, and provides the high-level command
// API that chart paint() methods call.
//
// Usage per frame:
//   renderer.beginFrame(w, h, clearColor);
//   renderer.pushRect(...);
//   renderer.pushLine(...);
//   renderer.pushText(...);
//   renderer.endFrame(textureView);
//
// endFrame() uploads all instance data, executes a single render pass
// with 3 draw calls (rect → line → text), and submits to the GPU queue.

import { RectPipeline } from './rect-pipeline.js';
import { LinePipeline } from './line-pipeline.js';
import { TextPipeline } from './text-pipeline.js';
import { parseCssColor } from './color-utils.js';
import type { Color4 } from './color-utils.js';

/** Uniform buffer size: mat4x4<f32> = 16 floats = 64 bytes. */
const UNIFORM_SIZE = 64;

export class ChartGPURenderer {
    private device: GPUDevice;
    private format: GPUTextureFormat;

    // Shared orthographic projection uniform buffer.
    private uniformBuffer: GPUBuffer;
    private uniformData = new Float32Array(16);

    // The three rendering pipelines.
    private rectPipeline: RectPipeline;
    private linePipeline: LinePipeline;
    private textPipeline: TextPipeline;

    // Frame state.
    private _clearColor: Color4 = [0, 0, 0, 1];
    private _width = 0;
    private _height = 0;
    private _inFrame = false;

    private constructor(
        device: GPUDevice,
        format: GPUTextureFormat,
        uniformBuffer: GPUBuffer,
        rectPipeline: RectPipeline,
        linePipeline: LinePipeline,
        textPipeline: TextPipeline,
    ) {
        this.device = device;
        this.format = format;
        this.uniformBuffer = uniformBuffer;
        this.rectPipeline = rectPipeline;
        this.linePipeline = linePipeline;
        this.textPipeline = textPipeline;
    }

    /** Create the renderer with all three pipelines. */
    static create(device: GPUDevice, format: GPUTextureFormat): ChartGPURenderer {
        const uniformBuffer = device.createBuffer({
            label: 'chart-ortho-uniform',
            size: UNIFORM_SIZE,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const rectPipeline = RectPipeline.create(device, format, uniformBuffer);
        const linePipeline = LinePipeline.create(device, format, uniformBuffer);
        const textPipeline = TextPipeline.create(device, format, uniformBuffer);

        return new ChartGPURenderer(device, format, uniformBuffer, rectPipeline, linePipeline, textPipeline);
    }

    // ─── Frame lifecycle ────────────────────────────────────────────

    /** Begin a new frame. Must be called before any push* methods. */
    beginFrame(width: number, height: number, clearColor: Color4): void {
        this._width = width;
        this._height = height;
        this._clearColor = clearColor;
        this._inFrame = true;

        // Reset all pipeline instance counts.
        this.rectPipeline.reset();
        this.linePipeline.reset();
        this.textPipeline.reset();

        // Compute orthographic projection matrix:
        // Maps pixel coords [0, width] x [0, height] → NDC [-1, 1] x [-1, 1].
        // Column-major layout for WGSL mat4x4<f32>.
        const m = this.uniformData;
        m.fill(0);
        m[0] = 2 / width;       // scale X
        m[5] = -2 / height;     // scale Y (flipped — Y-down in pixel space)
        m[10] = 1;              // scale Z (identity)
        m[12] = -1;             // translate X
        m[13] = 1;              // translate Y
        m[15] = 1;              // w
    }

    // ─── Push commands ──────────────────────────────────────────────

    /** Push a filled rectangle (CSS color string). */
    pushRect(x: number, y: number, w: number, h: number, cssColor: string): void {
        const [r, g, b, a] = parseCssColor(cssColor);
        this.rectPipeline.pushRect(x, y, w, h, r, g, b, a);
    }

    /** Push a filled circle (CSS color string). */
    pushCircle(cx: number, cy: number, radius: number, cssColor: string): void {
        const [r, g, b, a] = parseCssColor(cssColor);
        this.rectPipeline.pushCircle(cx, cy, radius, r, g, b, a);
    }

    /** Push a solid line segment (CSS color string). */
    pushLine(x0: number, y0: number, x1: number, y1: number, cssColor: string, width: number): void {
        const [r, g, b, a] = parseCssColor(cssColor);
        this.linePipeline.pushLine(x0, y0, x1, y1, r, g, b, a, width);
    }

    /** Push a dashed line segment (CSS color string). */
    pushDashedLine(
        x0: number, y0: number, x1: number, y1: number,
        cssColor: string, width: number,
        dashLen: number, gapLen: number,
    ): void {
        const [r, g, b, a] = parseCssColor(cssColor);
        this.linePipeline.pushDashedLine(x0, y0, x1, y1, r, g, b, a, width, dashLen, gapLen);
    }

    /** Push a text string (CSS color string). */
    pushText(
        text: string,
        x: number, y: number,
        cssColor: string,
        fontSize: number,
        align: 'left' | 'center' | 'right' = 'left',
        baseline: 'top' | 'middle' | 'bottom' = 'top',
    ): void {
        const [r, g, b, a] = parseCssColor(cssColor);
        this.textPipeline.pushText(text, x, y, r, g, b, a, fontSize, align, baseline);
    }

    // ─── Render ─────────────────────────────────────────────────────

    /**
     * End the frame: upload all instance data, execute the render pass,
     * submit to GPU queue.
     */
    endFrame(targetView: GPUTextureView): void {
        if (!this._inFrame) throw new Error('ChartGPURenderer.endFrame: no frame in progress.');
        this._inFrame = false;

        // Upload orthographic projection.
        this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData);

        // Flush pipelines (upload instance buffers, create bind groups).
        const rectDraw = this.rectPipeline.flush(this.uniformBuffer);
        const lineDraw = this.linePipeline.flush(this.uniformBuffer);
        const textDraw = this.textPipeline.flush(this.uniformBuffer);

        // Create command encoder and render pass.
        const encoder = this.device.createCommandEncoder({ label: 'chart-frame' });
        const [cr, cg, cb, ca] = this._clearColor;
        const pass = encoder.beginRenderPass({
            label: 'chart-render-pass',
            colorAttachments: [{
                view: targetView,
                clearValue: { r: cr, g: cg, b: cb, a: ca },
                loadOp: 'clear',
                storeOp: 'store',
            }],
        });

        // Draw: rect → line → text (layering order).
        if (rectDraw) {
            pass.setPipeline(this.rectPipeline.pipeline);
            pass.setBindGroup(0, rectDraw.bindGroup);
            pass.draw(rectDraw.vertexCount, rectDraw.instanceCount);
        }
        if (lineDraw) {
            pass.setPipeline(this.linePipeline.pipeline);
            pass.setBindGroup(0, lineDraw.bindGroup);
            pass.draw(lineDraw.vertexCount, lineDraw.instanceCount);
        }
        if (textDraw) {
            pass.setPipeline(this.textPipeline.pipeline);
            pass.setBindGroup(0, textDraw.bindGroup);
            pass.draw(textDraw.vertexCount, textDraw.instanceCount);
        }

        pass.end();
        this.device.queue.submit([encoder.finish()]);
    }

    /** Release all GPU resources. */
    destroy(): void {
        this.rectPipeline.destroy();
        this.linePipeline.destroy();
        this.textPipeline.destroy();
        this.uniformBuffer.destroy();
    }
}
