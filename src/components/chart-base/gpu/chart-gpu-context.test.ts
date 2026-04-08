// @vi-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChartGPUContext } from './chart-gpu-context.js';
import { createMockGPUDevice } from '../../../../test/setup.js';

describe('ChartGPUContext', () => {
    beforeEach(() => {
        ChartGPUContext.destroy();
    });

    // --- Singleton creation ---

    it('creates a shared device via navigator.gpu', async () => {
        const device = await ChartGPUContext.getShared();
        expect(device).toBeDefined();
        expect(navigator.gpu.requestAdapter).toHaveBeenCalled();
    });

    it('returns the same device on repeated calls', async () => {
        const a = await ChartGPUContext.getShared();
        const b = await ChartGPUContext.getShared();
        expect(a).toBe(b);
    });

    it('only calls requestAdapter once for concurrent getShared() calls', async () => {
        const callCountBefore = (navigator.gpu.requestAdapter as ReturnType<typeof vi.fn>).mock.calls.length;
        // Fire two concurrent requests.
        const [a, b] = await Promise.all([
            ChartGPUContext.getShared(),
            ChartGPUContext.getShared(),
        ]);
        const callCountAfter = (navigator.gpu.requestAdapter as ReturnType<typeof vi.fn>).mock.calls.length;
        expect(a).toBe(b);
        // At most one new call to requestAdapter.
        expect(callCountAfter - callCountBefore).toBe(1);
    });

    // --- External injection ---

    it('setDevice() makes getShared() return the injected device', async () => {
        const external = createMockGPUDevice() as unknown as GPUDevice;
        ChartGPUContext.setDevice(external);
        const device = await ChartGPUContext.getShared();
        expect(device).toBe(external);
    });

    it('injected device takes priority over singleton', async () => {
        // Create singleton first.
        const singleton = await ChartGPUContext.getShared();
        // Then inject.
        const external = createMockGPUDevice() as unknown as GPUDevice;
        ChartGPUContext.setDevice(external);
        const device = await ChartGPUContext.getShared();
        expect(device).toBe(external);
        expect(device).not.toBe(singleton);
    });

    // --- hasDevice ---

    it('hasDevice() returns false before any device is created', () => {
        expect(ChartGPUContext.hasDevice()).toBe(false);
    });

    it('hasDevice() returns true after getShared()', async () => {
        await ChartGPUContext.getShared();
        expect(ChartGPUContext.hasDevice()).toBe(true);
    });

    it('hasDevice() returns true after setDevice()', () => {
        const external = createMockGPUDevice() as unknown as GPUDevice;
        ChartGPUContext.setDevice(external);
        expect(ChartGPUContext.hasDevice()).toBe(true);
    });

    // --- destroy ---

    it('destroy() resets state', async () => {
        await ChartGPUContext.getShared();
        expect(ChartGPUContext.hasDevice()).toBe(true);
        ChartGPUContext.destroy();
        expect(ChartGPUContext.hasDevice()).toBe(false);
    });

    it('destroy() calls device.destroy() on singleton', async () => {
        const device = await ChartGPUContext.getShared();
        ChartGPUContext.destroy();
        expect(device.destroy).toHaveBeenCalled();
    });

    it('destroy() does NOT call device.destroy() on injected device', () => {
        const external = createMockGPUDevice() as unknown as GPUDevice;
        ChartGPUContext.setDevice(external);
        ChartGPUContext.destroy();
        expect(external.destroy).not.toHaveBeenCalled();
    });

    // --- Error handling ---

    it('throws when WebGPU is not available', async () => {
        const originalGpu = navigator.gpu;
        Object.defineProperty(navigator, 'gpu', { value: undefined, writable: true, configurable: true });
        try {
            await expect(ChartGPUContext.getShared()).rejects.toThrow('WebGPU is not supported');
        } finally {
            Object.defineProperty(navigator, 'gpu', { value: originalGpu, writable: true, configurable: true });
        }
    });

    it('throws when requestAdapter returns null', async () => {
        const originalGpu = navigator.gpu;
        Object.defineProperty(navigator, 'gpu', {
            value: {
                requestAdapter: vi.fn(async () => null),
                getPreferredCanvasFormat: vi.fn(() => 'bgra8unorm'),
            },
            writable: true,
            configurable: true,
        });
        try {
            await expect(ChartGPUContext.getShared()).rejects.toThrow('failed to obtain GPUAdapter');
        } finally {
            Object.defineProperty(navigator, 'gpu', { value: originalGpu, writable: true, configurable: true });
        }
    });
});
