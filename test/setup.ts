// ── WebGPU mocks ──────────────────────────────────────────────────────
// jsdom has no WebGPU support.  We provide lightweight mock objects so
// chart pipeline tests can verify method calls and data flow without a
// real GPU.  The mock surface is intentionally minimal — only the subset
// actually used by chart-gpu-context, chart-gpu-renderer, and the three
// pipelines.

/** Create a mock GPURenderPassEncoder that records draw calls. */
function createMockRenderPassEncoder() {
    return {
        setPipeline: vi.fn(),
        setBindGroup: vi.fn(),
        draw: vi.fn(),
        end: vi.fn(),
    };
}

/** Create a mock GPUCommandEncoder. */
function createMockCommandEncoder() {
    const passEncoder = createMockRenderPassEncoder();
    return {
        beginRenderPass: vi.fn(() => passEncoder),
        finish: vi.fn(() => ({ __brand: 'GPUCommandBuffer' })),
        _passEncoder: passEncoder,
    };
}

/** Create a mock GPUTexture (returned by canvas context). */
function createMockGPUTexture() {
    return {
        createView: vi.fn(() => ({ __brand: 'GPUTextureView' })),
        destroy: vi.fn(),
        width: 512,
        height: 512,
        format: 'bgra8unorm',
    };
}

/** Create a mock GPUDevice with the subset of methods used by chart code. */
export function createMockGPUDevice() {
    const device = {
        createShaderModule: vi.fn(() => ({ __brand: 'GPUShaderModule' })),
        createRenderPipeline: vi.fn(() => ({ __brand: 'GPURenderPipeline' })),
        createBuffer: vi.fn(() => ({
            __brand: 'GPUBuffer',
            size: 0,
            destroy: vi.fn(),
            mapAsync: vi.fn(),
            getMappedRange: vi.fn(() => new ArrayBuffer(0)),
            unmap: vi.fn(),
        })),
        createBindGroupLayout: vi.fn(() => ({ __brand: 'GPUBindGroupLayout' })),
        createBindGroup: vi.fn(() => ({ __brand: 'GPUBindGroup' })),
        createPipelineLayout: vi.fn(() => ({ __brand: 'GPUPipelineLayout' })),
        createSampler: vi.fn(() => ({ __brand: 'GPUSampler' })),
        createTexture: vi.fn(() => createMockGPUTexture()),
        createCommandEncoder: vi.fn(() => createMockCommandEncoder()),
        queue: {
            submit: vi.fn(),
            writeBuffer: vi.fn(),
            writeTexture: vi.fn(),
        },
        destroy: vi.fn(),
        features: new Set(),
        limits: {},
    };
    return device;
}

/** Create a mock GPUCanvasContext. */
function createMockGPUCanvasContext() {
    return {
        configure: vi.fn(),
        unconfigure: vi.fn(),
        getCurrentTexture: vi.fn(() => createMockGPUTexture()),
    };
}

// WebGPU enum constants — not provided by jsdom.
if (typeof globalThis.GPUBufferUsage === 'undefined') {
    (globalThis as any).GPUBufferUsage = {
        MAP_READ: 0x0001, MAP_WRITE: 0x0002, COPY_SRC: 0x0004,
        COPY_DST: 0x0008, INDEX: 0x0010, VERTEX: 0x0020,
        UNIFORM: 0x0040, STORAGE: 0x0080, INDIRECT: 0x0100,
        QUERY_RESOLVE: 0x0200,
    };
}
if (typeof globalThis.GPUTextureUsage === 'undefined') {
    (globalThis as any).GPUTextureUsage = {
        COPY_SRC: 0x01, COPY_DST: 0x02, TEXTURE_BINDING: 0x04,
        STORAGE_BINDING: 0x08, RENDER_ATTACHMENT: 0x10,
    };
}
if (typeof globalThis.GPUShaderStage === 'undefined') {
    (globalThis as any).GPUShaderStage = {
        VERTEX: 0x1, FRAGMENT: 0x2, COMPUTE: 0x4,
    };
}

// Patch navigator.gpu so ChartGPUContext.getShared() works in tests.
// Each requestDevice() call returns a fresh mock so afterEach clearAllMocks
// doesn't break the singleton.
Object.defineProperty(navigator, 'gpu', {
    value: {
        requestAdapter: vi.fn(async () => ({
            requestDevice: vi.fn(async () => createMockGPUDevice()),
            features: new Set(),
            limits: {},
            info: {},
            isFallbackAdapter: false,
        })),
        getPreferredCanvasFormat: vi.fn(() => 'bgra8unorm'),
    },
    writable: true,
    configurable: true,
});

// Extend HTMLCanvasElement.getContext to handle 'webgpu' requests.
// The original mock (below) handles '2d'; this intercepts 'webgpu' first.
// Original getContext preserved for reference but unused — WebGPU and Canvas 2D
// mocks are both handled by the unified override below.

// ── Original test infrastructure ──────────────────────────────────────

// Mock console methods to reduce noise in tests but keep errors visible
const originalConsole = { ...console };
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: originalConsole.error,
  info: vi.fn(),
  debug: vi.fn()
};

if (typeof PointerEvent === 'undefined') {
  global.PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type, options = {}) {
      super(type, options);
      this.pointerId = options.pointerId || 0;
      this.pointerType = options.pointerType || 'mouse';
      this.pressure = options.pressure || 0;
      this.tiltX = options.tiltX || 0;
      this.tiltY = options.tiltY || 0;
      this.width = options.width || 1;
      this.height = options.height || 1;
      this.isPrimary = options.isPrimary || false;
    }
  };
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock getComputedStyle — preserve prototype methods (e.g. getPropertyValue) that the spread
// operator would silently drop from CSSStyleDeclaration.
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = (element) => {
  const style = originalGetComputedStyle(element);
  const overrides = {
    display: style.display || 'block',
    visibility: style.visibility || 'visible',
    backgroundColor: style.backgroundColor || 'rgb(255, 255, 255)',
    width: style.width || '100px',
    height: style.height || '100px',
  };
  return Object.assign(Object.create(Object.getPrototypeOf(style)), style, overrides);
};

// Ensure customElements is available
if (!window.customElements) {
  window.customElements = {
    define: vi.fn(),
    get: vi.fn(),
    whenDefined: vi.fn(() => Promise.resolve()),
  };
}

// Clean up after each test
afterEach(async () => {
  // Reset GPU singleton so tests get fresh devices.
  try {
    const { ChartGPUContext } = await import('../src/components/chart-base/gpu/chart-gpu-context.js');
    ChartGPUContext.destroy();
  } catch { /* Module not yet loaded — fine. */ }
  vi.clearAllMocks();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

// Clean up after all tests
afterAll(() => {
  vi.restoreAllMocks();
});

// Cache mock context per canvas so repeated getContext calls return the same spy objects.
// Handles both '2d' (legacy / calendar) and 'webgpu' (chart GPU rendering) contexts.
HTMLCanvasElement.prototype.getContext = vi.fn(function (type) {
  // WebGPU context — one per canvas, cached.
  if (type === 'webgpu') {
    if (this._mockGpuCtx) return this._mockGpuCtx;
    this._mockGpuCtx = createMockGPUCanvasContext();
    return this._mockGpuCtx;
  }

  // Canvas 2D context — one per canvas, cached.
  if (this._mockCtx) return this._mockCtx;
  this._mockCtx = {
    canvas: this,
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: (x, y, w, h) => ({ data: new Array(w * h * 4) }),
    putImageData: vi.fn(),
    createImageData: () => ([]),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    setLineDash: vi.fn(),
    measureText: vi.fn(() => ({
      width: 10,
      fontBoundingBoxAscent: 10,
      fontBoundingBoxDescent: 3,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 3,
    })),
    // Writable style properties used by chart components
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineJoin: "miter",
    textAlign: "start",
    textBaseline: "alphabetic",
    font: "10px sans-serif",
  };
  return this._mockCtx;
});
