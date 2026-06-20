// <ars-markdown> — Renders Markdown source as HTML inside Shadow DOM.
//
// Attributes:
//   source — Raw markdown string to render.
//   mode   — "view" (default) renders HTML; "edit" shows a textarea.
//
// Properties:
//   source — Same as attribute; setting updates the rendered output.
//   mode   — "view" | "edit". Toggling re-renders the component.
//
// Events:
//   ars-markdown:change — Emitted in edit mode when the user modifies
//     the textarea. detail: { source: string }.

class ArsMarkdown extends HTMLElement {
  static get observedAttributes() {
    return ["source", "mode"];
  }

  #source = "";
  #mode: "view" | "edit" = "view";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
    if (name === "source" && newValue !== null) {
      this.source = newValue;
    }
    if (name === "mode") {
      this.mode = (newValue === "edit") ? "edit" : "view";
    }
  }

  get source(): string {
    return this.#source;
  }

  set source(value: string) {
    this.#source = value;
    if (this.shadowRoot) {
      this.#render();
    }
  }

  get mode(): "view" | "edit" {
    return this.#mode;
  }

  set mode(value: "view" | "edit") {
    if (this.#mode === value) return;
    this.#mode = value;
    if (this.shadowRoot) {
      this.#render();
    }
  }

  #render() {
    if (!this.shadowRoot) return;
    if (this.#mode === "edit") {
      this.shadowRoot.innerHTML = `
        <style>${ArsMarkdown.#editStyles()}</style>
        <textarea class="md-editor">${this.#escapeHtml(this.#source)}</textarea>
      `;
      const textarea = this.shadowRoot.querySelector("textarea") as HTMLTextAreaElement;
      if (textarea) {
        textarea.addEventListener("input", () => {
          this.#source = textarea.value;
          this.dispatchEvent(
            new CustomEvent("ars-markdown:change", {
              detail: { source: this.#source },
              bubbles: true,
              composed: true,
            })
          );
        });
      }
    } else {
      this.shadowRoot.innerHTML = `
        <style>${ArsMarkdown.#viewStyles()}</style>
        <div class="markdown-body" part="markdown"></div>
      `;
      const body = this.shadowRoot.querySelector(".markdown-body") as HTMLDivElement;
      if (body) {
        body.innerHTML = this.#parseMarkdown(this.#source);
      }
    }
  }

  #escapeHtml(src: string): string {
    return src
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Minimal markdown parser covering headings, paragraphs, bold, italic, code,
   *  links, lists, and horizontal rules.  No external dependency so the
   *  component stays self-contained. */
  #parseMarkdown(src: string): string {
    let html = src
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Horizontal rules
    html = html.replace(/^(---+|===+|\*\*\*+)$/gm, '<hr>');

    // Headings
    html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
    html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold / italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Code blocks
    html = html.replace(/```[\s\S]*?```/g, (match) => {
      const code = match.slice(3, -3).trim();
      return `<pre><code>${code}</code></pre>`;
    });

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Unordered lists
    html = html.replace(/^(\s*)[-*+] (.+$)/gim, (match, indent, text) => {
      const depth = indent.length;
      return `${indent}<li>${text}</li>`;
    });

    // Ordered lists
    html = html.replace(/^(\s*)\d+\. (.+$)/gim, (match, indent, text) => {
      return `${indent}<li>${text}</li>`;
    });

    // Wrap consecutive <li> elements in <ul> or <ol>
    const lines = html.split('\n');
    const out: string[] = [];
    let inList = false;
    let listType = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const liMatch = line.match(/^(\s*)<li>(.+)<\/li>\s*$/);
      if (liMatch) {
        const indent = liMatch[1];
        const prevLine = lines[i - 1] ?? '';
        const prevLiMatch = prevLine.match(/^(\s*)<li>(.+)<\/li>\s*$/);
        const prevIndent = prevLiMatch ? prevLiMatch[1].length : -1;
        if (!inList || prevIndent !== indent.length) {
          if (inList) out.push(`</${listType}>`);
          // Detect ordered vs unordered by checking original line
          const originalLine = src.split('\n')[i] ?? '';
          listType = /^\s*\d+\./.test(originalLine) ? 'ol' : 'ul';
          out.push(`${indent}<${listType}>`);
          inList = true;
        }
        out.push(line);
      } else {
        if (inList) {
          out.push(`</${listType}>`);
          inList = false;
        }
        out.push(line);
      }
    }
    if (inList) out.push(`</${listType}>`);
    html = out.join('\n');

    // Paragraphs — wrap non-empty, non-block lines
    const blockTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'ul', 'ol', 'li', 'pre', 'blockquote'];
    const blockRe = new RegExp(`^\\s*<(\\/?)(${blockTags.join('|')})`, 'i');
    html = html.replace(/(.+\n?)+/g, (match) => {
      const trimmed = match.trim();
      if (!trimmed || blockRe.test(trimmed)) return match;
      return `<p>${trimmed}</p>`;
    });

    return html;
  }

  static #editStyles(): string {
    return `
      :host { display: block; }
      .md-editor {
        width: 100%;
        min-height: 6em;
        font-family: var(--arsds-font-family-mono, monospace);
        font-size: var(--arsds-font-size-md, 1rem);
        line-height: 1.6;
        padding: 0.5em;
        border: 1px solid var(--arsds-color-border, #ccc);
        border-radius: var(--arsds-radius-md, 6px);
        background: var(--arsds-color-surface, #fff);
        color: var(--arsds-color-text-primary, inherit);
        resize: vertical;
        box-sizing: border-box;
      }
      .md-editor:focus {
        outline: 2px solid var(--arsds-color-accent, #0066cc);
        outline-offset: -1px;
      }
    `;
  }

  static #viewStyles(): string {
    return `
      :host { display: block; }
      .markdown-body {
        font-family: var(--arsds-font-family, system-ui, sans-serif);
        font-size: var(--arsds-font-size-md, 1rem);
        line-height: 1.6;
        color: var(--arsds-color-text-primary, inherit);
      }
      .markdown-body h1, .markdown-body h2, .markdown-body h3,
      .markdown-body h4, .markdown-body h5, .markdown-body h6 {
        margin: 0.75em 0 0.5em;
        font-weight: 600;
      }
      .markdown-body h1 { font-size: 1.75em; }
      .markdown-body h2 { font-size: 1.5em; }
      .markdown-body h3 { font-size: 1.25em; }
      .markdown-body p { margin: 0.5em 0; }
      .markdown-body ul, .markdown-body ol { margin: 0.5em 0; padding-left: 1.5em; }
      .markdown-body li { margin: 0.25em 0; }
      .markdown-body code {
        background: var(--arsds-color-surface-elevated, rgba(0,0,0,0.05));
        padding: 0.15em 0.35em;
        border-radius: var(--arsds-radius-sm, 3px);
        font-family: var(--arsds-font-family-mono, monospace);
        font-size: 0.9em;
      }
      .markdown-body pre {
        background: var(--arsds-color-surface-elevated, rgba(0,0,0,0.05));
        padding: 0.75em;
        border-radius: var(--arsds-radius-md, 6px);
        overflow-x: auto;
      }
      .markdown-body pre code { background: none; padding: 0; }
      .markdown-body a { color: var(--arsds-color-accent, #0066cc); }
      .markdown-body hr { border: none; border-top: 1px solid var(--arsds-color-border, #ddd); margin: 1em 0; }
    `;
  }
}

export { ArsMarkdown };
