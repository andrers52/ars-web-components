// Jest setup file for web components testing

// Mock PointerEvent if not available (jsdom doesn't have it)
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

// Mock console methods to reduce noise in tests but keep errors visible
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error,
  info: jest.fn(),
  debug: jest.fn()
};

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
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock getComputedStyle
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = (element) => {
  const style = originalGetComputedStyle(element);
  // Provide default values for common properties
  return {
    ...style,
    display: style.display || 'block',
    visibility: style.visibility || 'visible',
    backgroundColor: style.backgroundColor || 'rgb(255, 255, 255)',
    width: style.width || '100px',
    height: style.height || '100px',
  };
};

// Ensure customElements is available
if (!window.customElements) {
  window.customElements = {
    define: jest.fn(),
    get: jest.fn(),
    whenDefined: jest.fn(() => Promise.resolve()),
  };
}

// Mock HTMLCanvasElement.getContext for canvas operations
HTMLCanvasElement.prototype.getContext = jest.fn(function(contextId) {
  if (contextId === '2d') {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      arc: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
    };
  }
  return null;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
});