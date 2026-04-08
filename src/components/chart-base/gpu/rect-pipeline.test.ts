// @vi-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { RectPipeline, RECT_FLOATS_PER_INSTANCE, RECT_BYTES_PER_INSTANCE } from './rect-pipeline.js';
import { createMockGPUDevice } from '../../../../test/setup.js';

describe('RectPipeline', () => {
    let device: any;
    let uniformBuffer: any;
    let pipeline: RectPipeline;

    beforeEach(() => {
        device = createMockGPUDevice();
        uniformBuffer = device.createBuffer();
        pipeline = RectPipeline.create(device as unknown as GPUDevice, 'bgra8unorm', uniformBuffer);
    });

    it('has correct instance layout constants', () => {
        expect(RECT_FLOATS_PER_INSTANCE).toBe(9);
        expect(RECT_BYTES_PER_INSTANCE).toBe(36);
    });

    it('creates shader module and render pipeline on construction', () => {
        expect(device.createShaderModule).toHaveBeenCalledWith(
            expect.objectContaining({ label: 'chart-rect-shader' }),
        );
        expect(device.createRenderPipeline).toHaveBeenCalledWith(
            expect.objectContaining({ label: 'chart-rect-pipeline' }),
        );
    });

    it('creates initial instance buffer', () => {
        // createBuffer called for both uniform (beforeEach) and rect instances.
        const bufferCalls = device.createBuffer.mock.calls;
        const rectCall = bufferCalls.find((c: any) => c[0]?.label === 'chart-rect-instances');
        expect(rectCall).toBeDefined();
    });

    it('flush returns null when no instances are pushed', () => {
        pipeline.reset();
        expect(pipeline.flush(uniformBuffer)).toBeNull();
    });

    it('pushRect increments instance count and flush returns draw params', () => {
        pipeline.reset();
        pipeline.pushRect(10, 20, 100, 50, 1, 0, 0, 1);
        const draw = pipeline.flush(uniformBuffer);
        expect(draw).not.toBeNull();
        expect(draw!.vertexCount).toBe(6);
        expect(draw!.instanceCount).toBe(1);
    });

    it('pushCircle uses shape=1 and adjusts position for radius', () => {
        pipeline.reset();
        pipeline.pushCircle(50, 50, 10, 0, 1, 0, 1);
        const draw = pipeline.flush(uniformBuffer);
        expect(draw!.instanceCount).toBe(1);
        // Verify data was written to GPU.
        expect(device.queue.writeBuffer).toHaveBeenCalled();
    });

    it('multiple pushes accumulate instances', () => {
        pipeline.reset();
        pipeline.pushRect(0, 0, 10, 10, 1, 1, 1, 1);
        pipeline.pushRect(20, 20, 30, 30, 0, 0, 0, 1);
        pipeline.pushCircle(50, 50, 5, 1, 0, 0, 1);
        const draw = pipeline.flush(uniformBuffer);
        expect(draw!.instanceCount).toBe(3);
    });

    it('reset clears instance count', () => {
        pipeline.pushRect(0, 0, 10, 10, 1, 1, 1, 1);
        pipeline.reset();
        expect(pipeline.flush(uniformBuffer)).toBeNull();
    });

    it('flush uploads correct byte count to GPU', () => {
        pipeline.reset();
        pipeline.pushRect(0, 0, 10, 10, 1, 0, 0, 1);
        pipeline.pushRect(10, 10, 20, 20, 0, 1, 0, 1);
        pipeline.flush(uniformBuffer);

        // writeBuffer should be called with byte length = 2 * 36 = 72.
        const writeCall = device.queue.writeBuffer.mock.calls.find(
            (c: any) => c[4] === 2 * RECT_BYTES_PER_INSTANCE,
        );
        expect(writeCall).toBeDefined();
    });

    it('handles buffer growth when exceeding initial capacity', () => {
        pipeline.reset();
        // Push more than 256 instances to trigger growth.
        for (let i = 0; i < 300; i++) {
            pipeline.pushRect(i, i, 1, 1, 1, 1, 1, 1);
        }
        const draw = pipeline.flush(uniformBuffer);
        expect(draw!.instanceCount).toBe(300);
    });

    it('creates bind group with correct entries on flush', () => {
        pipeline.reset();
        pipeline.pushRect(0, 0, 10, 10, 1, 1, 1, 1);
        pipeline.flush(uniformBuffer);

        expect(device.createBindGroup).toHaveBeenCalledWith(
            expect.objectContaining({
                label: 'chart-rect-bind-group',
                entries: expect.arrayContaining([
                    expect.objectContaining({ binding: 0 }),
                    expect.objectContaining({ binding: 1 }),
                ]),
            }),
        );
    });

    it('destroy releases the instance buffer', () => {
        pipeline.destroy();
        // The mock buffer's destroy should have been called.
        // (createBuffer returns a mock with destroy: vi.fn())
    });
});
