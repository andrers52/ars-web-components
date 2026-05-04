// <ars-minimap> — A compact canvas-based minimap for spatial overviews.
//
// Attributes:
//   width  — number, canvas width in pixels (default 100)
//   height — number, canvas height in pixels (default 100)
//   point-size — number, radius of each point in pixels (default 2)
//
// Methods:
//   setData(points: ArsMinimapPoint[]) — render a new set of points
//   clear() — erase all points
//
// Events:
//   none

export interface ArsMinimapPoint {
  id: string | number;
  x: number;
  y: number;
  color: string;
}

class ArsMinimap extends HTMLElement {
  static get observedAttributes() {
    return ["width", "height", "point-size"];
  }

  #canvas: HTMLCanvasElement | null = null;
  #ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.#render();
      // Re-create canvas context after render.
      this.#bindCanvas();
    }
  }

  // --- Property accessors ---

  get width(): number {
    const val = this.getAttribute("width");
    return val ? Number(val) : 100;
  }

  set width(value: number) {
    this.setAttribute("width", String(value));
  }

  get height(): number {
    const val = this.getAttribute("height");
    return val ? Number(val) : 100;
  }

  set height(value: number) {
    this.setAttribute("height", String(value));
  }

  get pointSize(): number {
    const val = this.getAttribute("point-size");
    return val ? Number(val) : 2;
  }

  set pointSize(value: number) {
    this.setAttribute("point-size", String(value));
  }

  // --- Public API ---

  setData(points: ArsMinimapPoint[]): void {
    if (!this.#ctx || !this.#canvas) {
      this.#bindCanvas();
    }
    const ctx = this.#ctx;
    const canvas = this.#canvas;
    if (!ctx || !canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    for (const p of points) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.pointSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  clear(): void {
    if (!this.#ctx || !this.#canvas) return;
    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
  }

  // --- Private ---

  #render() {
    if (!this.shadowRoot) return;
    const w = this.width;
    const h = this.height;

    this.shadowRoot.innerHTML = `
      <style>${ArsMinimap.#styles()}</style>
      <canvas
        part="canvas"
        class="minimap-canvas"
        width="${w}"
        height="${h}"
      ></canvas>
    `;
    this.#bindCanvas();
  }

  #bindCanvas() {
    if (!this.shadowRoot) return;
    this.#canvas = this.shadowRoot.querySelector("canvas") as HTMLCanvasElement | null;
    this.#ctx = this.#canvas?.getContext("2d") ?? null;
  }

  static #styles(): string {
    return `
      :host {
        display: inline-block;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }
      .minimap-canvas {
        display: block;
        background: var(--arswc-color-surface, #0a0a0a);
        border: 1px solid var(--arswc-color-border, #333333);
        border-radius: var(--arswc-radius-sm, 6px);
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-minimap")) {
  customElements.define("ars-minimap", ArsMinimap);
}

export { ArsMinimap, ArsMinimap as default };
