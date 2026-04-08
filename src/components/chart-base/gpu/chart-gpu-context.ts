// GPUDevice lifecycle management for chart components.
//
// Two acquisition modes:
//   1. External injection — a host (e.g. brainiac-engine) passes its device
//      via ChartGPUContext.setDevice(). All charts reuse that device.
//   2. Lazy singleton — the first chart to render creates a shared GPUDevice
//      via navigator.gpu.  All subsequent charts reuse it.
//
// This keeps ars-web-components standalone (no brainiac dependency) while
// allowing zero-overhead integration when brainiac is present.

/** Shared GPUDevice singleton (lazy, created on first use). */
let sharedDevice: GPUDevice | null = null;

/** Externally injected device (takes priority over singleton). */
let injectedDevice: GPUDevice | null = null;

/** In-flight singleton creation promise (prevents double-init). */
let pendingInit: Promise<GPUDevice> | null = null;

export class ChartGPUContext {
    /**
     * Get the shared GPUDevice — injected or singleton.
     * First call triggers async adapter/device negotiation if no device
     * has been injected.  Subsequent calls return synchronously via cache.
     */
    static async getShared(): Promise<GPUDevice> {
        if (injectedDevice) return injectedDevice;
        if (sharedDevice) return sharedDevice;
        if (pendingInit) return pendingInit;

        pendingInit = ChartGPUContext._createDevice();
        try {
            sharedDevice = await pendingInit;
            return sharedDevice;
        } finally {
            pendingInit = null;
        }
    }

    /**
     * Inject an external GPUDevice (e.g. from brainiac-engine).
     * Must be called before any chart renders.  Replaces the singleton
     * if one was already created.
     */
    static setDevice(device: GPUDevice): void {
        injectedDevice = device;
    }

    /**
     * Release the shared device and reset state.
     * Does NOT destroy an injected device (the caller owns its lifecycle).
     */
    static destroy(): void {
        if (sharedDevice && !injectedDevice) {
            sharedDevice.destroy();
        }
        sharedDevice = null;
        injectedDevice = null;
        pendingInit = null;
    }

    /** Whether a device is available without triggering async creation. */
    static hasDevice(): boolean {
        return !!(injectedDevice || sharedDevice);
    }

    // --- Private ---

    private static async _createDevice(): Promise<GPUDevice> {
        if (!navigator.gpu) {
            throw new Error('ChartGPUContext: WebGPU is not supported in this browser.');
        }
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error('ChartGPUContext: failed to obtain GPUAdapter.');
        }
        const device = await adapter.requestDevice();
        return device;
    }
}
