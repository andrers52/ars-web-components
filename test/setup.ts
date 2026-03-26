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
afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

// Clean up after all tests
afterAll(() => {
  vi.restoreAllMocks();
});

// Cache mock context per canvas so repeated getContext calls return the same spy objects.
HTMLCanvasElement.prototype.getContext = vi.fn(function () {
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
