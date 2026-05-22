# Reusable Elements for Demo Pages

> **Status: IMPLEMENTED (v2.3.0, 2026-05-22)**  
> 25 of 26 demo pages now use the shared assets described below. Only `ars-page` remains as a structural outlier.

---

## Summary

After reviewing all 26 component demo pages under `demos/components/`, several patterns emerged that were duplicated almost verbatim across pages, while other conventions varied arbitrarily. Extracting these into shared assets cut the average demo page from ~250 lines to ~100–120 lines and made creating a new page a matter of filling in component-specific markup rather than recreating boilerplate.

---

## Shared Assets (Created)

### `demos/css/demo-layout.css`

**Status: ✅ Implemented — linked by 25/26 pages.**

| Class | Description |
|-------|-------------|
| `.demo-section` | Card-like container with themed background/border, 20px padding |
| `.demo-row` | Flex row with `wrap`, 12px gap, center-aligned |
| `.demo-grid` | CSS grid with `repeat(auto-fill, minmax(280px, 1fr))` |
| `.code-block` | Dark terminal-style code display (`#161b22` bg, monospace) |
| `.event-log` | Dark terminal-style event log (`#0d1117` bg, max-height 200px) |
| `.event-log-light` | Bordered light variant for pages that need it |
| `.controls` | Flex wrap container for demo buttons |
| `.demo-output` | White bordered container for demo results |

### `demos/js/demo-utils.js`

**Status: ✅ Implemented — imported by 25/26 pages.**

```javascript
import {
  initDesignSystem,
  initThemeToggles,
  createEventLog,
} from '/demos/js/demo-utils.js';

// One-liner initialization
initDesignSystem('light');
initThemeToggles();

// Event logging
const log = createEventLog('event-log', 'clear-log');
log.append('click', 'button-1');
```

| Export | Description |
|--------|-------------|
| `initDesignSystem(mode)` | Initialize with `getArsWebComponentsDefaultAdapter(mode)` |
| `initThemeToggles()` | Wire `#theme-light` / `#theme-dark` buttons (optional-chaining safe) |
| `createEventLog(logId, clearId, opts)` | Returns `{ append(eventName, detail), clear() }` |

### `demos/template.html`

**Status: ✅ Implemented.**

Starter skeleton for new demo pages. Includes standard `<head>` with importmap + 4 CSS links, body structure with `.container` > `.header` > `.content`, and a module script that imports `demo-utils.js` and calls `initDesignSystem('light')` + `initThemeToggles()`.

---

## Refactoring Coverage

### Fully refactored (25 pages)

All of these pages now link `demo-layout.css`, import `demo-utils.js`, and use the shared helpers:

`ars-avatar`, `ars-badge`, `ars-bottom-nav`, `ars-calendar`, `ars-candlestick-chart`, `ars-card`, `ars-chat-panel`, `ars-color-select`, `ars-data-roller`, `ars-date-picker`, `ars-dialog`, `ars-fab`, `ars-image-upload`, `ars-info-tile`, `ars-input`, `ars-leaderboard`, `ars-line-chart`, `ars-minimap`, `ars-property-editor`, `ars-select`, `ars-table`, `ars-tabs`, `ars-toast`, `ars-toolbar`, `form-primitives`

### Outlier (1 page)

| Page | Reason left unrefactored |
|------|--------------------------|
| `ars-page` | Complex router demo (~800 lines) with custom sidebar/main-content layout, 10+ global `onclick` handlers, and extensive page-specific styling for stat cards, nav links, and route info panels. Refactoring would require converting all inline handlers to event listeners and restructuring the entire demo. |

---

## Standardization Applied

| Inconsistency | Before | After |
|---------------|--------|-------|
| Page `<title>` | Mixed: `"ARS X - Demo"`, `"X - ars-X"` | `"ars-x — Demo"` (em dash, lowercase) |
| Theme init | 19 identical inline copies | `initDesignSystem('light')` + `initThemeToggles()` |
| Event log | ~20 nearly identical implementations | `createEventLog()` shared helper |
| `.demo-section` CSS | ~15 pages redefined inline | 0 duplication (shared CSS) |
| `.code-block` CSS | 19 pages with identical inline styles | Shared CSS |
| `.event-log` CSS | Dark terminal vs light bordered | Both variants in shared CSS |
| New page time | ~30 min | ~5–10 min (using `template.html`) |

---

## Implementation Order (Completed)

1. ✅ **Create `demos/css/demo-layout.css`** — Moved `.demo-section`, `.demo-row`, `.demo-grid`, `.code-block`, `.event-log`, `.event-log-light` from inline styles.
2. ✅ **Create `demos/js/demo-utils.js`** — Extracted `initDesignSystem`, `initThemeToggles`, `createEventLog`.
3. ✅ **Create `demos/template.html`** — Clean starter page using all shared assets.
4. ✅ **Refactor standard pages** (~19 pages) — `ars-avatar`, `ars-badge`, `ars-card`, etc.
5. ✅ **Refactor outlier pages** (partial) — Added shared CSS + theme toggles to `ars-candlestick-chart`, `ars-data-roller`, `ars-date-picker`, `ars-dialog`, `ars-line-chart`, `ars-minimap` where feasible.
6. ✅ **Leave `ars-page` as structural outlier** — Custom layout too complex to refactor safely.

---

## Estimated Impact

| Metric | Before | After (with shared assets) |
|--------|--------|---------------------------|
| Average page lines | ~250 | ~100–120 |
| CSS duplication | ~15 pages redefine `.demo-section` | 0 (shared) |
| Theme toggle code duplication | 19 identical copies | 1 shared function |
| Event log code duplication | ~20 nearly identical implementations | 1 shared helper |
| Time to create new page | ~30 min | ~5–10 min |
| Total duplicated lines eliminated | — | ~700+ lines |
