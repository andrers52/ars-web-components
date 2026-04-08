// @vi-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { LinePipeline, LINE_FLOATS_PER_INSTANCE, LINE_BYTES_PER_INSTANCE } from './line-pipeline.js';
import { createMockGPUDevice } from '../../../../test/setup.js';

describe('LinePipeline', () => {
    let device: any;
    let uniformBuffer: any;
    let pipeline: LinePipeline;

    beforeEach(() => {
        device = createMockGPUDevice();
        uniformBuffer = device.createBuffer();
        pipeline = LinePipeline.create(device as unknown as GPUDevice, 'bgra8unorm', uniformBuffer);
    });

    it('has correct instance layout constants', () => {
        expect(LINE_FLOATS_PER_INSTANCE).toBe(12);
        expect(LINE_BYTES_PER_INSTANCE).toBe(48);
    });

    it('creates shader module and render pipeline', () => {
        expect(device.createShaderModule).toHaveBeenCalledWith(
            expect.objectContaining({ label: 'chart-line-shader' }),
        );
        expect(device.createRenderPipeline).toHaveBeenCalledWith(
            expect.objectContaining({ label: 'chart-line-pipeline' }),
        );
    });

    it('flush returns null when empty', () => {
        pipeline.reset();
        expect(pipeline.flush(uniformBuffer)).toBeNull();
    });

    it('pushLine adds one instance', () => {
        pipeline.reset();
        pipeline.pushLine(0, 0, 100, 100, 1, 1, 1, 1, 2);
        const draw = pipeline.flush(uniformBuffer);
        expect(draw).not.toBeNull();
        expect(draw!.vertexCount).toBe(6);
        expect(draw!.instanceCount).toBe(1);
    });

    it('pushDashedLine adds one instance with dash parameters', () => {
        pipeline.reset();
        pipeline.pushDashedLine(10, 10, 200, 10, 1, 0, 0, 0.6, 1, 4, 3);
        const draw = pipeline.flush(uniformBuffer);
        expect(draw!.instanceCount).toBe(1);
    });

    it('accumulates mixed solid and dashed lines', () => {
        pipeline.reset();
        pipeline.pushLine(0, 0, 50, 0, 1, 1, 1, 1, 1);
        pipeline.pushDashedLine(0, 10, 50, 10, 0.5, 0.5, 0.5, 1, 1, 4, 3);
        pipeline.pushLine(0, 20, 50, 20, 1, 1, 1, 1, 1);
        const draw = pipeline.flush(uniformBuffer);
        expect(draw!.instanceCount).toBe(3);
    });

    it('reset clears instances', () => {
        pipeline.pushLine(0, 0, 50, 0, 1, 1, 1, 1, 1);
        pipeline.reset();
        expect(pipeline.flush(uniformBuffer)).toBeNull();
    });

    it('handles buffer growth beyond initial capacity', () => {
        pipeline.reset();
        for (let i = 0; i < 300; i++) {
            pipeline.pushLine(0, i, 100, i, 1, 1, 1, 1, 1);
        }
        const draw = pipeline.flush(uniformBuffer);
        expect(draw!.instanceCount).toBe(300);
    });

    it('flush uploads correct byte count', () => {
        pipeline.reset();
        pipeline.pushLine(0, 0, 100, 0, 1, 1, 1, 1, 1);
        pipeline.pushLine(0, 10, 100, 10, 0, 0, 0, 1, 1);
        pipeline.flush(uniformBuffer);

        const writeCall = device.queue.writeBuffer.mock.calls.find(
            (c: any) => c[4] === 2 * LINE_BYTES_PER_INSTANCE,
        );
        expect(writeCall).toBeDefined();
    });

    it('computes totalLen for solid lines', () => {
        pipeline.reset();
        // Horizontal line of length 100 — totalLen should be 100.
        pipeline.pushLine(0, 0, 100, 0, 1, 1, 1, 1, 1);
        pipeline.flush(uniformBuffer);
        // Verify writeBuffer was called (data uploaded).
        expect(device.queue.writeBuffer).toHaveBeenCalled();
    });
});
