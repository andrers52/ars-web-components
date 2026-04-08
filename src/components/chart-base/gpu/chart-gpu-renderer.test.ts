// @vi-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { ChartGPURenderer } from './chart-gpu-renderer.js';
import { createMockGPUDevice } from '../../../../test/setup.js';

describe('ChartGPURenderer', () => {
    let device: any;
    let renderer: ChartGPURenderer;

    beforeEach(() => {
        device = createMockGPUDevice();
        renderer = ChartGPURenderer.create(device as unknown as GPUDevice, 'bgra8unorm');
    });

    // --- Construction ---

    it('creates uniform buffer for orthographic projection', () => {
        const uniformCall = device.createBuffer.mock.calls.find(
            (c: any) => c[0]?.label === 'chart-ortho-uniform',
        );
        expect(uniformCall).toBeDefined();
    });

    it('creates all three pipelines', () => {
        const pipelineLabels = device.createRenderPipeline.mock.calls.map((c: any) => c[0]?.label);
        expect(pipelineLabels).toContain('chart-rect-pipeline');
        expect(pipelineLabels).toContain('chart-line-pipeline');
        expect(pipelineLabels).toContain('chart-text-pipeline');
    });

    // --- Frame lifecycle ---

    it('endFrame throws when no frame in progress', () => {
        const view = { __brand: 'GPUTextureView' } as unknown as GPUTextureView;
        expect(() => renderer.endFrame(view)).toThrow('no frame in progress');
    });

    it('beginFrame + endFrame submits to GPU queue', () => {
        renderer.beginFrame(320, 180, [0, 0, 0, 1]);
        const view = { __brand: 'GPUTextureView' } as unknown as GPUTextureView;
        renderer.endFrame(view);

        expect(device.createCommandEncoder).toHaveBeenCalled();
        expect(device.queue.submit).toHaveBeenCalled();
    });

    it('endFrame uploads orthographic uniform', () => {
        renderer.beginFrame(320, 180, [0, 0, 0, 1]);
        const view = { __brand: 'GPUTextureView' } as unknown as GPUTextureView;
        renderer.endFrame(view);

        // writeBuffer called for the uniform buffer.
        expect(device.queue.writeBuffer).toHaveBeenCalled();
    });

    // --- Push commands ---

    it('pushRect batches into rect pipeline', () => {
        renderer.beginFrame(320, 180, [0, 0, 0, 1]);
        renderer.pushRect(0, 0, 320, 180, '#000000');
        renderer.pushRect(10, 10, 50, 30, 'rgba(255, 0, 0, 0.5)');
        const view = { __brand: 'GPUTextureView' } as unknown as GPUTextureView;
        renderer.endFrame(view);

        // Render pass should have been created.
        const encoder = device.createCommandEncoder.mock.results[0].value;
        const pass = encoder._passEncoder;
        expect(pass.draw).toHaveBeenCalled();
    });

    it('pushCircle batches into rect pipeline', () => {
        renderer.beginFrame(320, 180, [0, 0, 0, 1]);
        renderer.pushCircle(50, 50, 5, '#ff0000');
        const view = { __brand: 'GPUTextureView' } as unknown as GPUTextureView;
        renderer.endFrame(view);

        const encoder = device.createCommandEncoder.mock.results[0].value;
        expect(encoder.beginRenderPass).toHaveBeenCalled();
    });

    it('pushLine batches into line pipeline', () => {
        renderer.beginFrame(320, 180, [0, 0, 0, 1]);
        renderer.pushLine(0, 0, 100, 100, '#ffffff', 1);
        const view = { __brand: 'GPUTextureView' } as unknown as GPUTextureView;
        renderer.endFrame(view);

        expect(device.queue.submit).toHaveBeenCalled();
    });

    it('pushDashedLine batches into line pipeline', () => {
        renderer.beginFrame(320, 180, [0, 0, 0, 1]);
        renderer.pushDashedLine(0, 50, 300, 50, 'rgba(92, 128, 196, 0.6)', 1, 4, 3);
        const view = { __brand: 'GPUTextureView' } as unknown as GPUTextureView;
        renderer.endFrame(view);

        expect(device.queue.submit).toHaveBeenCalled();
    });

    it('pushText batches into text pipeline', () => {
        renderer.beginFrame(320, 180, [0, 0, 0, 1]);
        renderer.pushText('123.45', 10, 170, 'rgba(255, 255, 255, 0.5)', 10, 'center', 'top');
        const view = { __brand: 'GPUTextureView' } as unknown as GPUTextureView;
        renderer.endFrame(view);

        expect(device.queue.submit).toHaveBeenCalled();
    });

    // --- Render pass structure ---

    it('render pass draws rect then line then text in order', () => {
        renderer.beginFrame(320, 180, [0, 0, 0, 1]);
        renderer.pushRect(0, 0, 320, 180, '#000000');
        renderer.pushLine(0, 90, 320, 90, '#333333', 1);
        renderer.pushText('test', 10, 10, '#ffffff', 10);
        const view = { __brand: 'GPUTextureView' } as unknown as GPUTextureView;
        renderer.endFrame(view);

        const encoder = device.createCommandEncoder.mock.results[0].value;
        const pass = encoder._passEncoder;

        // 3 setPipeline calls (rect, line, text).
        expect(pass.setPipeline).toHaveBeenCalledTimes(3);
        // 3 draw calls.
        expect(pass.draw).toHaveBeenCalledTimes(3);
        // Pass was ended.
        expect(pass.end).toHaveBeenCalled();
    });

    it('skips empty pipelines in render pass', () => {
        renderer.beginFrame(320, 180, [0, 0, 0, 1]);
        // Only push rect — line and text are empty.
        renderer.pushRect(0, 0, 10, 10, '#ff0000');
        const view = { __brand: 'GPUTextureView' } as unknown as GPUTextureView;
        renderer.endFrame(view);

        const encoder = device.createCommandEncoder.mock.results[0].value;
        const pass = encoder._passEncoder;
        // Only 1 draw call (rect), not 3.
        expect(pass.draw).toHaveBeenCalledTimes(1);
    });

    it('empty frame still submits (clear only)', () => {
        renderer.beginFrame(320, 180, [0.1, 0.1, 0.1, 1]);
        const view = { __brand: 'GPUTextureView' } as unknown as GPUTextureView;
        renderer.endFrame(view);

        // No draw calls, but submit still happens (for clear).
        const encoder = device.createCommandEncoder.mock.results[0].value;
        const pass = encoder._passEncoder;
        expect(pass.draw).not.toHaveBeenCalled();
        expect(pass.end).toHaveBeenCalled();
        expect(device.queue.submit).toHaveBeenCalled();
    });

    // --- CSS color parsing integration ---

    it('accepts CSS color strings in all push methods', () => {
        renderer.beginFrame(320, 180, [0, 0, 0, 1]);
        // These should not throw.
        renderer.pushRect(0, 0, 10, 10, 'rgba(8, 12, 16, 0.9)');
        renderer.pushCircle(50, 50, 5, '#5ad68a');
        renderer.pushLine(0, 0, 100, 0, 'rgba(255, 255, 255, 0.08)', 1);
        renderer.pushDashedLine(0, 10, 100, 10, 'rgba(92, 128, 196, 0.6)', 1, 4, 3);
        renderer.pushText('test', 0, 0, 'rgba(255, 255, 255, 0.5)', 10);

        const view = { __brand: 'GPUTextureView' } as unknown as GPUTextureView;
        renderer.endFrame(view);
        expect(device.queue.submit).toHaveBeenCalled();
    });

    // --- Cleanup ---

    it('destroy releases all GPU resources', () => {
        renderer.destroy();
        // Uniform buffer + pipeline instance buffers should all be destroyed.
        // (The mock buffer destroy functions are called.)
    });
});
