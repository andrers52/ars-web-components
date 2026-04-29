// <ars-image-upload> — Drag-and-drop image uploader with preview thumbnails.
//
// Attributes:
//   multiple  — boolean, allow multiple files
//   max-files — maximum number of files (default "1")
//   max-size  — max file size in bytes (default "5242880" = 5MB)
//   accept    — comma-separated MIME types (default "image/*")
//
// Methods:
//   getFiles() — returns the current FileList
//   clear()    — removes all files and previews
//
// Slots:
//   default  — placeholder text/content for the drop zone
//   hint     — additional hint text below the drop zone
//
// Events:
//   ars-image-upload:change — composed CustomEvent with detail { files }
//   ars-image-upload:remove — composed CustomEvent with detail { file, index }
//   ars-image-upload:error  — composed CustomEvent with detail { reason, file? }

export type ArsImageUploadAccept = string;

class ArsImageUpload extends HTMLElement {
  #files: File[] = [];
  #input?: HTMLInputElement;

  static get observedAttributes() {
    return ["multiple", "max-files", "max-size", "accept"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open", delegatesFocus: true });
  }

  connectedCallback() {
    this.#render();
    this.#bindEvents();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.#render();
      this.#bindEvents();
    }
  }

  // --- Property accessors ---

  get multiple(): boolean {
    return this.hasAttribute("multiple");
  }

  set multiple(value: boolean) {
    this.toggleAttribute("multiple", value);
  }

  get maxFiles(): number {
    const attr = this.getAttribute("max-files");
    return attr ? parseInt(attr, 10) : 1;
  }

  set maxFiles(value: number) {
    this.setAttribute("max-files", String(value));
  }

  get maxSize(): number {
    const attr = this.getAttribute("max-size");
    return attr ? parseInt(attr, 10) : 5 * 1024 * 1024; // 5MB
  }

  set maxSize(value: number) {
    this.setAttribute("max-size", String(value));
  }

  get accept(): string {
    return this.getAttribute("accept") ?? "image/*";
  }

  set accept(value: string) {
    this.setAttribute("accept", value);
  }

  // --- Public API ---

  getFiles(): File[] {
    return [...this.#files];
  }

  clear(): void {
    this.#files = [];
    if (this.#input) {
      this.#input.value = "";
    }
    this.#render();
    this.#bindEvents();
    this.dispatchEvent(
      new CustomEvent("ars-image-upload:change", {
        bubbles: true,
        composed: true,
        detail: { files: this.getFiles() },
      }),
    );
  }

  // --- Rendering ---

  #render() {
    if (!this.shadowRoot) return;
    const hasFiles = this.#files.length > 0;

    this.shadowRoot.innerHTML = `
      <style>${ArsImageUpload.#styles()}</style>
      <div part="upload" class="upload">
        <div
          part="dropzone"
          class="dropzone"
          tabindex="0"
          role="button"
          aria-label="Upload images"
        >
          <input
            type="file"
            part="input"
            class="input"
            accept="${this.accept}"
            ${this.multiple ? "multiple" : ""}
          />
          <div class="dropzone__content">
            <span class="dropzone__icon">+</span>
            <span class="dropzone__text"><slot>Drop images here or click to browse</slot></span>
            <span class="dropzone__hint"><slot name="hint">Max ${this.maxFiles} file${this.maxFiles > 1 ? "s" : ""}, up to ${(this.maxSize / 1024 / 1024).toFixed(0)}MB each</slot></span>
          </div>
        </div>
        ${hasFiles ? `<div class="previews" part="previews">${this.#renderPreviews()}</div>` : ""}
      </div>
    `;

    this.#input = this.shadowRoot.querySelector('input[type="file"]') ?? undefined;
  }

  #renderPreviews(): string {
    return this.#files
      .map(
        (file, index) => `
          <div class="preview" part="preview" data-index="${index}">
            <img class="preview__img" alt="${file.name}" />
            <div class="preview__overlay">
              <button type="button" class="preview__remove" data-index="${index}" aria-label="Remove ${file.name}">
                ×
              </button>
            </div>
            <span class="preview__name">${file.name}</span>
          </div>
        `,
      )
      .join("");
  }

  #bindEvents() {
    if (!this.shadowRoot) return;

    const dropzone = this.shadowRoot.querySelector(".dropzone");
    const input = this.shadowRoot.querySelector('input[type="file"]') as HTMLInputElement;
    const removeButtons = this.shadowRoot.querySelectorAll(".preview__remove");

    // Dropzone click → open file picker
    const onClick = (e: Event) => {
      if (e.target !== input) {
        input?.click();
      }
    };
    dropzone?.addEventListener("click", onClick);
    dropzone?.addEventListener("keydown", (e) => {
      if (e instanceof KeyboardEvent && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        input?.click();
      }
    });

    // Drag & drop
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      dropzone?.classList.add("dropzone--dragover");
    };
    const onDragLeave = () => {
      dropzone?.classList.remove("dropzone--dragover");
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dropzone?.classList.remove("dropzone--dragover");
      if (e.dataTransfer?.files) {
        this.#handleFiles(e.dataTransfer.files);
      }
    };

    dropzone?.addEventListener("dragover", onDragOver);
    dropzone?.addEventListener("dragleave", onDragLeave);
    dropzone?.addEventListener("drop", onDrop);

    // Input change
    input?.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        this.#handleFiles(target.files);
      }
    });

    // Remove buttons
    removeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const index = parseInt((btn as HTMLElement).dataset.index ?? "0", 10);
        this.#removeFile(index);
      });
    });

    // Generate preview blobs
    this.#generatePreviews();
  }

  #handleFiles(fileList: FileList) {
    const incoming = Array.from(fileList).filter((f) => this.accept.includes(f.type) || this.accept === "image/*");
    const remainingSlots = this.multiple ? this.maxFiles - this.#files.length : 1 - this.#files.length;

    if (remainingSlots <= 0) {
      this.dispatchEvent(
        new CustomEvent("ars-image-upload:error", {
          bubbles: true,
          composed: true,
          detail: { reason: "max-files" },
        }),
      );
      return;
    }

    const toAdd = incoming.slice(0, remainingSlots);
    const oversized = toAdd.filter((f) => f.size > this.maxSize);
    const valid = toAdd.filter((f) => f.size <= this.maxSize);

    if (oversized.length > 0) {
      this.dispatchEvent(
        new CustomEvent("ars-image-upload:error", {
          bubbles: true,
          composed: true,
          detail: { reason: "max-size", file: oversized[0] },
        }),
      );
    }

    this.#files = this.multiple ? [...this.#files, ...valid] : valid;
    this.#render();
    this.#bindEvents();
    this.dispatchEvent(
      new CustomEvent("ars-image-upload:change", {
        bubbles: true,
        composed: true,
        detail: { files: this.getFiles() },
      }),
    );
  }

  #removeFile(index: number) {
    const removed = this.#files[index];
    this.#files.splice(index, 1);
    this.#render();
    this.#bindEvents();
    this.dispatchEvent(
      new CustomEvent("ars-image-upload:remove", {
        bubbles: true,
        composed: true,
        detail: { file: removed, index },
      }),
    );
    this.dispatchEvent(
      new CustomEvent("ars-image-upload:change", {
        bubbles: true,
        composed: true,
        detail: { files: this.getFiles() },
      }),
    );
  }

  #generatePreviews() {
    if (!this.shadowRoot) return;
    const previewEls = this.shadowRoot.querySelectorAll<HTMLImageElement>(".preview__img");
    previewEls.forEach((img, index) => {
      const file = this.#files[index];
      if (!file) return;
      const url = URL.createObjectURL(file);
      img.src = url;
      img.onload = () => URL.revokeObjectURL(url);
    });
  }

  static #styles(): string {
    return `
      :host {
        display: block;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }

      .upload {
        display: flex;
        flex-direction: column;
        gap: var(--arswc-spacing-md, 16px);
      }

      /* --- Dropzone --- */
      .dropzone {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        border: 2px dashed var(--arswc-color-border, #d5dde8);
        border-radius: var(--arswc-radius-md, 10px);
        background: var(--arswc-color-surface, #f6f8fb);
        cursor: pointer;
        transition: border-color var(--arswc-transition-duration, 200ms) ease,
                    background var(--arswc-transition-duration, 200ms) ease;
      }

      .dropzone:hover,
      .dropzone:focus-within {
        border-color: var(--arswc-color-accent, #2563eb);
        background: rgba(37, 99, 235, 0.04);
      }

      .dropzone--dragover {
        border-color: var(--arswc-color-accent, #2563eb);
        background: rgba(37, 99, 235, 0.08);
      }

      .dropzone:focus-visible {
        outline: none;
        box-shadow: var(--arswc-focus-ring, 0 0 0 3px rgba(37, 99, 235, 0.3));
      }

      .input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
      }

      .dropzone__content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        pointer-events: none;
      }

      .dropzone__icon {
        font-size: 1.5rem;
        font-weight: 300;
        color: var(--arswc-color-text-muted, #4d5563);
      }

      .dropzone__text {
        font-size: var(--arswc-font-size-md, 0.875rem);
        font-weight: 500;
        color: var(--arswc-color-text, #1b2430);
      }

      .dropzone__hint {
        font-size: var(--arswc-font-size-sm, 0.75rem);
        color: var(--arswc-color-text-muted, #4d5563);
      }

      /* --- Previews --- */
      .previews {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
        gap: var(--arswc-spacing-sm, 8px);
      }

      .preview {
        position: relative;
        aspect-ratio: 1;
        border-radius: var(--arswc-radius-sm, 6px);
        overflow: hidden;
        border: 1px solid var(--arswc-color-border, #d5dde8);
        background: var(--arswc-color-surface, #f6f8fb);
      }

      .preview__img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .preview__overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        padding: 4px;
        opacity: 0;
        transition: opacity var(--arswc-transition-duration, 200ms) ease;
        background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 40%);
      }

      .preview:hover .preview__overlay {
        opacity: 1;
      }

      .preview__remove {
        width: 24px;
        height: 24px;
        border: none;
        border-radius: 50%;
        background: rgba(0,0,0,0.5);
        color: #fff;
        font-size: 1rem;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-bottom: 2px;
        transition: background var(--arswc-transition-duration, 200ms) ease;
      }

      .preview__remove:hover {
        background: rgba(220, 38, 38, 0.8);
      }

      .preview__name {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 4px 6px;
        font-size: 0.625rem;
        font-weight: 500;
        color: var(--arswc-color-text, #1b2430);
        background: rgba(255,255,255,0.85);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-image-upload")) {
  customElements.define("ars-image-upload", ArsImageUpload);
}

export { ArsImageUpload, ArsImageUpload as default };
