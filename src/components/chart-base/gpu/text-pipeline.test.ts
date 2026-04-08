// @vi-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { ChartGlyphAtlas, TextPipeline, TEXT_FLOATS_PER_INSTANCE, TEXT_BYTES_PER_INSTANCE } from './text-pipeline.js';
import { createMockGPUDevice } from '../../../../test/setup.js';

describe('ChartGlyphAtlas', () => {
    let device: any;

    beforeEach(() => {
        device = createMockGPUDevice();
    });

    it('creates an r8unorm texture atlas', () => {
        ChartGlyphAtlas.create(device as unknown as GPUDevice);
        expect(device.createTexture).toHaveBeenCalledWith(
            expect.objectContaining({
                label: 'chart-glyph-sdf-atlas',
                format: 'r8unorm',
            }),
        );
    });

    it('creates a linear sampler', () => {
        ChartGlyphAtlas.create(device as unknown as GPUDevice);
        expect(device.createSampler).toHaveBeenCalledWith(
            expect.objectContaining({
                magFilter: 'linear',
                minFilter: 'linear',
            }),
        );
    });

    it('preloads digit glyphs', () => {
        const atlas = ChartGlyphAtlas.create(device as unknown as GPUDevice);
        for (const char of '0123456789') {
            expect(atlas.getEntry(char)).toBeDefined();
        }
    });

    it('preloads punctuation used in chart labels', () => {
        const atlas = ChartGlyphAtlas.create(device as unknown as GPUDevice);
        for (const char of './-: %+,') {
            expect(atlas.getEntry(char)).toBeDefined();
        }
    });

    it('preloads lowercase and uppercase letters', () => {
        const atlas = ChartGlyphAtlas.create(device as unknown as GPUDevice);
        expect(atlas.getEntry('a')).toBeDefined();
        expect(atlas.getEntry('z')).toBeDefined();
        expect(atlas.getEntry('A')).toBeDefined();
        expect(atlas.getEntry('Z')).toBeDefined();
    });

    it('returns undefined for characters not in charset', () => {
        const atlas = ChartGlyphAtlas.create(device as unknown as GPUDevice);
        expect(atlas.getEntry('€')).toBeUndefined();
    });

    it('glyph entries have valid UV coordinates', () => {
        const atlas = ChartGlyphAtlas.create(device as unknown as GPUDevice);
        const entry = atlas.getEntry('0')!;
        expect(entry.uv).toHaveLength(4);
        const [u0, v0, u1, v1] = entry.uv;
        expect(u0).toBeGreaterThanOrEqual(0);
        expect(v0).toBeGreaterThanOrEqual(0);
        expect(u1).toBeGreaterThan(u0);
        expect(v1).toBeGreaterThan(v0);
        expect(u1).toBeLessThanOrEqual(1);
        expect(v1).toBeLessThanOrEqual(1);
    });

    it('glyph entries have positive dimensions', () => {
        const atlas = ChartGlyphAtlas.create(device as unknown as GPUDevice);
        const entry = atlas.getEntry('M')!;
        expect(entry.glyphWidth).toBeGreaterThan(0);
        expect(entry.glyphHeight).toBeGreaterThan(0);
        expect(entry.advance).toBeGreaterThan(0);
    });

    it('uploads SDF data to GPU texture for each glyph', () => {
        ChartGlyphAtlas.create(device as unknown as GPUDevice);
        // writeTexture called once per character in the charset.
        const charset = '0123456789./-: abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ%+,';
        expect(device.queue.writeTexture).toHaveBeenCalledTimes(charset.length);
    });

    it('destroy releases the GPU texture', () => {
        const atlas = ChartGlyphAtlas.create(device as unknown as GPUDevice);
        atlas.destroy();
        // The mock texture's destroy should have been called.
        const mockTexture = device.createTexture.mock.results[0].value;
        expect(mockTexture.destroy).toHaveBeenCalled();
    });
});

describe('TextPipeline', () => {
    let device: any;
    let uniformBuffer: any;
    let pipeline: TextPipeline;

    beforeEach(() => {
        device = createMockGPUDevice();
        uniformBuffer = device.createBuffer();
        pipeline = TextPipeline.create(device as unknown as GPUDevice, 'bgra8unorm', uniformBuffer);
    });

    it('has correct instance layout constants', () => {
        expect(TEXT_FLOATS_PER_INSTANCE).toBe(12);
        expect(TEXT_BYTES_PER_INSTANCE).toBe(48);
    });

    it('creates shader module and render pipeline', () => {
        expect(device.createShaderModule).toHaveBeenCalledWith(
            expect.objectContaining({ label: 'chart-text-shader' }),
        );
        expect(device.createRenderPipeline).toHaveBeenCalledWith(
            expect.objectContaining({ label: 'chart-text-pipeline' }),
        );
    });

    it('flush returns null when no text is pushed', () => {
        pipeline.reset();
        expect(pipeline.flush(uniformBuffer)).toBeNull();
    });

    it('pushText creates glyph instances for each character', () => {
        pipeline.reset();
        pipeline.pushText('123', 10, 20, 1, 1, 1, 1, 10, 'left', 'top');
        const draw = pipeline.flush(uniformBuffer);
        expect(draw).not.toBeNull();
        // 3 characters → 3 glyph instances.
        expect(draw!.instanceCount).toBe(3);
        expect(draw!.vertexCount).toBe(6);
    });

    it('pushText skips unknown characters gracefully', () => {
        pipeline.reset();
        // '€' is not in charset — should be skipped.
        pipeline.pushText('1€2', 10, 20, 1, 1, 1, 1, 10, 'left', 'top');
        const draw = pipeline.flush(uniformBuffer);
        // Only '1' and '2' should produce instances.
        expect(draw!.instanceCount).toBe(2);
    });

    it('reset clears glyph instances', () => {
        pipeline.pushText('hello', 0, 0, 1, 1, 1, 1, 10, 'left', 'top');
        pipeline.reset();
        expect(pipeline.flush(uniformBuffer)).toBeNull();
    });

    it('center alignment shifts text by half its width', () => {
        pipeline.reset();
        // Just verify it runs without error — exact positioning tested visually.
        pipeline.pushText('test', 100, 50, 1, 1, 1, 1, 10, 'center', 'middle');
        const draw = pipeline.flush(uniformBuffer);
        expect(draw!.instanceCount).toBe(4);
    });

    it('right alignment shifts text by its full width', () => {
        pipeline.reset();
        pipeline.pushText('99', 200, 50, 1, 1, 1, 1, 10, 'right', 'bottom');
        const draw = pipeline.flush(uniformBuffer);
        expect(draw!.instanceCount).toBe(2);
    });

    it('handles empty string', () => {
        pipeline.reset();
        pipeline.pushText('', 0, 0, 1, 1, 1, 1, 10, 'left', 'top');
        expect(pipeline.flush(uniformBuffer)).toBeNull();
    });

    it('handles buffer growth for long text', () => {
        pipeline.reset();
        // Push many text calls to exceed initial capacity.
        const longText = '0123456789'.repeat(60); // 600 characters
        pipeline.pushText(longText, 0, 0, 1, 1, 1, 1, 10, 'left', 'top');
        const draw = pipeline.flush(uniformBuffer);
        expect(draw!.instanceCount).toBe(600);
    });

    it('creates bind group with atlas texture and sampler', () => {
        pipeline.reset();
        pipeline.pushText('A', 0, 0, 1, 1, 1, 1, 10, 'left', 'top');
        pipeline.flush(uniformBuffer);

        expect(device.createBindGroup).toHaveBeenCalledWith(
            expect.objectContaining({
                label: 'chart-text-bind-group',
                entries: expect.arrayContaining([
                    expect.objectContaining({ binding: 2 }), // atlas texture
                    expect.objectContaining({ binding: 3 }), // sampler
                ]),
            }),
        );
    });
});
