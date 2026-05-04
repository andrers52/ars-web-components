// <ars-leaderboard> — A sorted score table with optional row highlighting.
//
// Attributes:
//   max-entries — number, maximum rows to display (default 10)
//   highlight-id — string | number, id of the entry to highlight
//
// Methods:
//   setEntries(entries: ArsLeaderboardEntry[]) — render sorted entries
//
// Events:
//   none

export interface ArsLeaderboardEntry {
  id: string | number;
  name: string;
  score: number;
  meta?: string;
}

class ArsLeaderboard extends HTMLElement {
  static get observedAttributes() {
    return ["max-entries", "highlight-id"];
  }

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
    }
  }

  // --- Property accessors ---

  get maxEntries(): number {
    const val = this.getAttribute("max-entries");
    return val ? Number(val) : 10;
  }

  set maxEntries(value: number) {
    this.setAttribute("max-entries", String(value));
  }

  get highlightId(): string | number | null {
    const val = this.getAttribute("highlight-id");
    return val ?? null;
  }

  set highlightId(value: string | number | null) {
    if (value === null) {
      this.removeAttribute("highlight-id");
    } else {
      this.setAttribute("highlight-id", String(value));
    }
  }

  // --- Public API ---

  setEntries(entries: ArsLeaderboardEntry[]): void {
    if (!this.shadowRoot) return;

    // Sort descending by score.
    const sorted = [...entries].sort((a, b) => b.score - a.score);
    const limited = sorted.slice(0, this.maxEntries);

    const tbody = this.shadowRoot.querySelector("tbody");
    if (!tbody) return;

    tbody.innerHTML = limited
      .map(
        (e) => `
        <tr
          class="leaderboard__row${String(e.id) === String(this.highlightId) ? " leaderboard__row--highlight" : ""}"
          data-id="${e.id}"
        >
          <td class="leaderboard__name">${this.#escapeHtml(e.name)}</td>
          <td class="leaderboard__score">${e.score}</td>
          ${e.meta ? `<td class="leaderboard__meta">${this.#escapeHtml(e.meta)}</td>` : ""}
        </tr>
      `,
      )
      .join("");
  }

  // --- Private ---

  #render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>${ArsLeaderboard.#styles()}</style>
      <table part="table" class="leaderboard">
        <thead>
          <tr>
            <th class="leaderboard__header-name">Name</th>
            <th class="leaderboard__header-score">Score</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
  }

  #escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  static #styles(): string {
    return `
      :host {
        display: block;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }

      .leaderboard {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
        color: var(--arswc-color-text, #1b2430);
      }

      .leaderboard thead {
        border-bottom: 1px solid var(--arswc-color-border, #d5dde8);
      }

      .leaderboard th {
        text-align: left;
        padding: 8px 12px;
        font-weight: 600;
        color: var(--arswc-color-text-secondary, #5a6a7a);
      }

      .leaderboard__header-score {
        text-align: right;
      }

      .leaderboard td {
        padding: 8px 12px;
        border-bottom: 1px solid var(--arswc-color-border, #f0f0f0);
      }

      .leaderboard__score {
        text-align: right;
        font-variant-numeric: tabular-nums;
        font-weight: 600;
      }

      .leaderboard__row--highlight {
        background: var(--arswc-color-accent-muted, #dbeafe);
      }

      .leaderboard__row--highlight .leaderboard__name {
        color: var(--arswc-color-accent, #2563eb);
        font-weight: 600;
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-leaderboard")) {
  customElements.define("ars-leaderboard", ArsLeaderboard);
}

export { ArsLeaderboard, ArsLeaderboard as default };
