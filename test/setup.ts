// Jest setup file for web components testing

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
HTMLCanvasElement.prototype.getContext = () => ({ fillRect: vi.fn(), clearRect: vi.fn(), getImageData: (x, y, w, h) => ({ data: new Array(w*h*4) }), putImageData: vi.fn(), createImageData: () => ([]), setTransform: vi.fn(), drawImage: vi.fn(), save: vi.fn(), fillText: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(), stroke: vi.fn(), translate: vi.fn(), scale: vi.fn(), rotate: vi.fn(), arc: vi.fn(), fill: vi.fn() });
