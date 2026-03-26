# ars-web-components Development Plan

**Version:** 1.0
**Date:** 2026-03-25
**Scope:** Foundational primitives, embedding documentation, publish checklist
**Target release:** 1.0.0

## 1. Current State Summary

The library (v0.9.1) ships nine components (calendar, dialog, color picker, data roller, info tile, line chart, candlestick chart, page router, relational-node deprecated alias) and eight mixins (draggable, localized, pressed-effect, remote-call caller/receiver, roll, show-if-property-true, swipeable). The architecture is sound: Shadow DOM encapsulation, `composed: true` CustomEvents, a clean `ArsDesignAdapter` contract in `design-system.ts`, a `WebComponentBase` with batched attribute handling, a `MixinBase` + `PointerCoordinator` system for gesture coordination, Vite build, Vitest tests in jsdom with colocated test files.

What is missing: foundational interactive primitives (button, input, select, toggle, table, tabs, toast), embedding guidance, and a disciplined publish process.

## 2. Design Principles for New Components

These principles are derived from existing codebase conventions and should be followed for every new component.

1. **Shadow DOM with `composed: true` events.** Every component creates its own shadow root and dispatches CustomEvents with `{ bubbles: true, composed: true }` so events cross shadow boundaries reliably for any host (including engine DOM overlays).

2. **Design-token resolution cascade.** Styles reference `--arswc-*` CSS variables with hardcoded fallbacks: `var(--arswc-color-text, #1b2430)`. No component imports the adapter directly; tokens flow from the document root.

3. **Attribute + property duality.** Every public datum is settable both as an HTML attribute (string, JSON-parseable) and as a JS property (typed). Follow the `ars-info-tile` pattern: `attributeChangedCallback` triggers render, property setter triggers render, `#getViewModel()` merges both sources.

4. **No global state assumptions.** Components must not touch `window.location`, `window.history`, or `document.body` in production code unless that is their documented purpose (like `ars-page` in browser routing mode). All mount targets should be passable.

5. **Slot-based composition over string templating.** New components should prefer `<slot>` for content projection. The dialog's innerHTML-template approach is a legacy pattern; new components should use slots for flexibility and to avoid XSS surface.

6. **Colocated files.** Each component lives in `src/components/ars-<name>/` with `ars-<name>.ts`, `ars-<name>.test.ts`, and optionally `ars-<name>-css.ts` for large style blocks.

7. **Minimum 80% test coverage** per component, testing semantics (rendered output, event payloads, attribute/property roundtrips), not just structure.

## 3. Token Contract Extensions

The current `--arswc-*` token set covers: `color-bg`, `color-surface`, `color-border`, `color-text`, `color-muted`, `color-accent`, `color-accent-contrast`, `button-primary-*`, `button-secondary-*`, `radius-sm`, `radius-md`, `shadow-sm`, `font-family-sans`, `font-family-mono`.

New components will require these additions to `design-system.ts`:

| Token | Purpose | Used by |
|---|---|---|
| `--arswc-color-danger` | Destructive actions, error states | button, toast, input validation |
| `--arswc-color-success` | Success confirmation | toast, toggle (on state) |
| `--arswc-color-warning` | Warning states | toast |
| `--arswc-color-disabled` | Disabled element foreground | button, input, select, toggle |
| `--arswc-color-disabled-bg` | Disabled element background | button, input, select, toggle |
| `--arswc-font-size-sm` | Small text (labels, captions) | input labels, table headers, tabs |
| `--arswc-font-size-md` | Body text | input, select, button |
| `--arswc-font-size-lg` | Headings | table titles |
| `--arswc-spacing-xs` through `--arswc-spacing-xl` | Layout spacing scale | all components |
| `--arswc-transition-duration` | Default animation duration | toggle, toast, tabs |
| `--arswc-focus-ring` | Focus indicator style | button, input, select, toggle, tabs |

These are additive and backwards-compatible. Existing components continue to work. Fallback values keep the library functional without initialization.

## 4. Phase 1 -- Foundational Primitives

### 4.1 ars-button

**What:** A styled, accessible button with variant, size, and state support.

**Why:** Every downstream consumer needs buttons. The library already defines `--arswc-button-primary-*` and `--arswc-button-secondary-*` tokens but has no button component consuming them. The dialog uses raw `<button>` inside `<pressed-effect-mixin>`. A proper button component eliminates this gap.

**API surface:**
- **Attributes:** `variant` ("primary" | "secondary" | "danger" | "ghost"), `size` ("sm" | "md" | "lg"), `disabled` (boolean), `loading` (boolean), `type` ("button" | "submit" | "reset")
- **Slots:** default (label content), `prefix` (icon before label), `suffix` (icon after label)
- **Events:** `ars-button:click` (composed CustomEvent; native click also fires but this gives a namespaced alternative with `detail` containing the variant)
- **CSS variables:** All existing `--arswc-button-*` tokens plus new `--arswc-color-danger`, `--arswc-color-disabled`, `--arswc-color-disabled-bg`, `--arswc-focus-ring`

**Dependencies:** None (standalone). Should integrate with `pressed-effect-mixin` internally for tactile feedback.

**Complexity:** Small

**Demo:** Combined "Form Primitives" page (shared with ars-toggle)

**Implementation notes:**
- Uses a native `<button>` inside shadow DOM for accessibility (inherits focus, form submission, keyboard activation)
- `loading` state shows a CSS-only spinner and sets `aria-busy="true"`
- `disabled` reflects to the internal button and sets `aria-disabled`
- The component should delegate focus: `this.attachShadow({ mode: "open", delegatesFocus: true })`

### 4.2 ars-toggle

**What:** A switch/toggle control for boolean state.

**Why:** Enable/disable controls are pervasive -- bot activation, feature flags, dark mode, notification settings.

**API surface:**
- **Attributes:** `checked` (boolean), `disabled`, `label`, `label-position` ("start" | "end")
- **Slots:** default (custom label content)
- **Events:** `ars-toggle:change` (detail: `{ checked: boolean }`)
- **CSS variables:** `--arswc-color-accent` (on track), `--arswc-color-border` (off track), `--arswc-color-disabled`, `--arswc-color-success` (optional on-color override), `--arswc-transition-duration`

**Dependencies:** None.

**Complexity:** Small

**Demo:** Combined "Form Primitives" page (shared with ars-button)

**Implementation notes:**
- Internally a hidden checkbox for form participation and accessibility
- `role="switch"`, `aria-checked`
- CSS transition on the track/thumb for smooth animation
- Keyboard: space/enter toggles

### 4.3 ars-input

**What:** A text input with label, validation feedback, and clearable state.

**Why:** Forms are required by any consumer building a settings page, data entry surface, or configuration panel.

**API surface:**
- **Attributes:** `type` ("text" | "number" | "email" | "password" | "search" | "url" | "tel"), `value`, `placeholder`, `label`, `error` (validation message string), `disabled`, `readonly`, `clearable` (boolean), `min`, `max`, `step`, `pattern`, `required`
- **Slots:** `prefix` (icon/text before input), `suffix` (icon/text after input)
- **Events:** `ars-input:change` (on commit -- blur or enter), `ars-input:input` (on every keystroke), `ars-input:clear` (when clearable X is clicked)
- **CSS variables:** `--arswc-color-text`, `--arswc-color-border`, `--arswc-color-surface`, `--arswc-color-danger` (error state), `--arswc-color-muted` (placeholder), `--arswc-focus-ring`, `--arswc-font-size-sm` (label), `--arswc-font-size-md` (input)
- **Properties:** `value` (read/write string), `validity` (read-only, mirrors native ValidityState)

**Dependencies:** None.

**Complexity:** Medium (validation state management, type-dependent behavior)

**Demo:** Dedicated page

**Implementation notes:**
- Uses a native `<input>` inside shadow DOM for full keyboard/IME/autocomplete/accessibility support
- Label is rendered as `<label>` linked via `for`/`id` for screen readers
- Error message shown below input when `error` attribute is non-empty; adds `aria-invalid="true"` and `aria-describedby` pointing to the error element
- `delegatesFocus: true` on shadow root

### 4.4 ars-toast

**What:** A notification/toast message system with stacking, auto-dismiss, and severity levels.

**Why:** User feedback for async operations (save complete, error occurred, action confirmed) is essential.

**API surface:**

**Static API (primary usage):**
- `ArsToast.show(message, options?)` -- programmatic imperative API, returns the toast element
- Options: `{ severity: "info" | "success" | "warning" | "error", duration: number, dismissible: boolean, position: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center", mountTarget?: ParentNode, targetDocument?: Document }`

**Declarative API (secondary):**
- **Attributes:** `message`, `severity`, `duration`, `dismissible`, `open`
- **Slots:** default (custom content), `action` (action button area)
- **Events:** `ars-toast:dismiss` (composed, detail: `{ reason: "timeout" | "user" | "programmatic" }`)
- **CSS variables:** `--arswc-color-success`, `--arswc-color-warning`, `--arswc-color-danger`, `--arswc-color-accent` (info), `--arswc-color-surface`, `--arswc-transition-duration`

**Dependencies:** None.

**Complexity:** Medium (stacking/positioning, auto-dismiss timers, enter/exit animations)

**Demo:** Dedicated page

**Implementation notes:**
- A singleton container element (`ars-toast-container`) is lazily created per mount target to manage stacking
- Enter/exit animations use CSS `@keyframes` (slide + fade)
- The `mountTarget`/`targetDocument` options follow the same pattern as `ArsDialog` for embeddability
- `aria-live="polite"` on the container, `role="alert"` on individual toasts

### 4.5 ars-tabs

**What:** A tabbed navigation container.

**Why:** Organizing content into tabs is a universal UI pattern -- settings pages, dashboard sections, configuration panels.

**API surface:**
- **Attributes:** `active-tab` (string, the id/key of the active tab), `placement` ("top" | "bottom" | "start" | "end")
- **Slots:** default (accepts `<ars-tab-panel>` children)
- **Events:** `ars-tabs:change` (detail: `{ activeTab, previousTab }`)
- **CSS variables:** `--arswc-color-accent` (active indicator), `--arswc-color-border`, `--arswc-color-text`, `--arswc-color-muted` (inactive tabs), `--arswc-transition-duration`

**Companion element: `ars-tab-panel`**
- **Attributes:** `tab-id` (string, unique key), `label` (string, tab label text), `disabled`, `icon` (optional, icon slot name)
- **Slots:** default (panel content), `label` (custom tab label)

**Dependencies:** None.

**Complexity:** Medium

**Demo:** Dedicated page

**Implementation notes:**
- Tab list uses `role="tablist"`, individual tabs use `role="tab"` with `aria-selected`, panels use `role="tabpanel"` with `aria-labelledby`
- Keyboard: arrow keys navigate tabs, home/end jump to first/last
- Active indicator is a CSS pseudo-element or child element with a slide transition
- Content panels are hidden via `display: none` (not removed from DOM) to preserve state

### 4.6 ars-select

**What:** A dropdown select with option groups, search filtering, and custom rendering.

**Why:** Configuration UIs universally need dropdowns -- pair selection, time-frame pickers, status filters, theme selectors.

**API surface:**
- **Attributes:** `value`, `placeholder`, `label`, `disabled`, `searchable` (boolean), `multiple` (boolean), `error`
- **Slots:** default (accepts `<option>` and `<optgroup>` elements parsed on connect)
- **Properties:** `options` (array of `{ value: string, label: string, group?: string, disabled?: boolean }`), `value` (string or string[] when multiple), `selectedOption` (read-only)
- **Events:** `ars-select:change` (detail: `{ value, previousValue }`), `ars-select:open`, `ars-select:close`
- **CSS variables:** Same as input, plus `--arswc-color-surface` for dropdown panel

**Dependencies:** Needs positioning logic for the dropdown panel. Should use `popover` attribute (Popover API, baseline 2024) with a CSS fallback for older browsers.

**Complexity:** Large (dropdown positioning, keyboard navigation, search filtering, multiple selection)

**Demo:** Dedicated page

**Implementation notes:**
- Keyboard navigation: arrow keys, enter to select, escape to close, type-ahead search
- When `searchable`, an input appears inside the dropdown
- Dropdown panel uses `position: fixed` + JS positioning to escape shadow DOM overflow constraints
- ARIA: `role="combobox"`, `aria-expanded`, `aria-activedescendant`, option elements use `role="option"`

### 4.7 ars-table

**What:** A data table with sortable columns, row selection, and virtual scrolling for large datasets.

**Why:** Every data-heavy application needs tabular display -- order books, logs, entity listings, leaderboards.

**API surface:**
- **Attributes:** `selectable` ("none" | "single" | "multiple"), `sortable` (boolean), `striped` (boolean), `compact` (boolean), `virtual-scroll` (boolean, enables windowed rendering)
- **Properties:** `columns` (array of `{ key: string, label: string, sortable?: boolean, width?: string, align?: "start" | "center" | "end", render?: (value, row) => string }`), `data` (array of row objects), `selectedRows` (read-only array of selected row indices)
- **Events:** `ars-table:sort` (detail: `{ column, direction }`), `ars-table:select` (detail: `{ selectedRows, row, action }`), `ars-table:row-click` (detail: `{ row, index }`)
- **Slots:** `empty` (content shown when data is empty), `header-<key>` (custom header cell), `cell-<key>` (custom cell rendering)
- **CSS variables:** `--arswc-color-surface`, `--arswc-color-border`, `--arswc-color-text`, `--arswc-color-muted` (header text), `--arswc-font-size-sm` (header), `--arswc-spacing-*`

**Dependencies:** None, but may internally use `IntersectionObserver` for virtual scroll.

**Complexity:** Large (virtual scrolling, sort state, selection state, column resize)

**Demo:** Dedicated page

**Implementation notes:**
- Virtual scroll uses a sentinel element + `IntersectionObserver` to render only visible rows. Critical for large datasets (e.g., order books with thousands of rows).
- Sort is visual-only by default (emits event, consumer re-sorts data). An optional `auto-sort` attribute can sort in-component for simple cases.
- ARIA: `role="grid"`, `role="row"`, `role="columnheader"`, `role="gridcell"`, `aria-sort` on sorted columns
- The `render` callback in column definitions allows inline custom formatting without needing slot templates for every cell.

### 4.8 ars-color-select (redesign)

**What:** A carousel-based color picker that replaces the current grid-overlay approach with a swipeable, animated, touch-friendly component.

**Why:** The current implementation has significant UX problems. It displays 103 hardcoded color swatches in a fixed-position viewport overlay — no animation, no gesture support, no keyboard navigation, no accessibility, and visually unappealing. For a public component library, the color picker is one of the most visible and frequently used components; its quality sets the tone for the library as a whole.

**Current state (to be replaced):**
- Click-to-open fullscreen overlay with a flat grid of 103 CSS named colors
- Fixed positioning at `top: 40%; left: 50%` — ignores scroll position, viewport boundaries
- No touch/swipe support, no keyboard navigation, no ARIA attributes
- Manual `getElementById` queries on every action, unused instance properties
- No animation, no transition feedback on selection

**Redesign concept — Swipeable Carousel Picker:**

The new design uses a horizontal carousel strip as the primary interaction model. Colors are organized by hue family into a continuous spectrum. The user swipes left/right to browse, and taps to select. The component renders inline (no fullscreen overlay), making it embeddable in forms, toolbars, and engine DOM overlays without viewport assumptions.

**Interaction model:**
1. **Inline carousel strip** — The component renders as a horizontal strip of circular color swatches, showing ~5-7 at a time depending on width. The selected swatch is visually emphasized (scale, ring, elevation).
2. **Swipe navigation** — `swipeable-mixin` wraps the carousel strip. Swiping left/right scrolls the strip by one page (the visible count). A fast swipe triggers momentum-based coast; the strip then snaps to the nearest swatch boundary.
3. **Drag scrolling** — `draggable-mixin` enables continuous drag-to-scroll for fine positioning. The drag events from the mixin translate 1:1 to strip scroll offset.
4. **Tap to select** — Tapping/clicking a swatch selects it. The selected swatch transitions to a visually distinct state (scale up, border ring, subtle glow).
5. **Position indicator** — A thin track below the strip shows a marker indicating the current scroll position within the full color range.
6. **Optional expanded view** — An `expandable` attribute enables a secondary interaction: tapping the selected swatch opens a small dropdown showing shade variations of the selected hue family (lighter/darker). This is optional and off by default.

**Color organization:**

Colors are arranged in spectrum order (red → orange → yellow → green → cyan → blue → purple → pink → neutrals). This means swiping through the carousel feels like moving around a color wheel. The component ships with a curated default palette (spectrum-ordered, ~40-50 well-chosen colors instead of 103 arbitrary CSS names), but the palette is fully configurable via the `palette` property.

**API surface:**
- **Attributes:** `color` (current selected color, read/write — backwards compatible), `palette` (JSON array of color strings, overrides default), `swatch-size` ("sm" | "md" | "lg", default "md"), `expandable` (boolean, enables shade dropdown), `disabled` (boolean), `visible-count` (number, how many swatches visible at once, default 7)
- **Properties:** `color` (string, read/write), `palette` (string[], read/write), `selectedIndex` (number, read-only)
- **Slots:** none (the carousel content is generated from the palette)
- **Events:** `ars-color-select:change` (detail: `{ id, color, previousColor }` — backwards compatible, adds `previousColor`)
- **CSS variables:**
  - `--ars-color-select-swatch-size` (default: 36px for md)
  - `--ars-color-select-swatch-gap` (default: 8px)
  - `--ars-color-select-swatch-radius` (default: 50%, circular)
  - `--ars-color-select-selected-ring` (default: 2px solid --arswc-color-text)
  - `--ars-color-select-selected-scale` (default: 1.2)
  - `--ars-color-select-selected-shadow` (default: 0 2px 8px rgba(0,0,0,0.25))
  - `--ars-color-select-track-height` (default: 3px)
  - `--ars-color-select-track-color` (default: --arswc-color-border)
  - `--ars-color-select-track-active-color` (default: --arswc-color-accent)
  - `--ars-color-select-transition-duration` (default: --arswc-transition-duration)

**Backwards compatibility:**
- `color` attribute and `ars-color-select:change` event keep the same semantics
- The `setBackgroundColor()` method is preserved (deprecated, delegates to `color` setter)
- `toggleColorSelection()` is removed — there is no overlay to toggle. If `expandable` is set, `toggleExpanded()` replaces it.
- Consumers using the component as `<ars-color-select color="blue"></ars-color-select>` see an upgraded experience with no code changes

**Dependencies:** `swipeable-mixin` (swipe navigation), `draggable-mixin` (drag scrolling). Both already exist and use `PointerCoordinator` for conflict-free composition.

**Complexity:** Medium (carousel scroll mechanics, snap behavior, mixin composition, animation choreography)

**Demo:** The existing `demos/components/ars-color-select/` page is rewritten to showcase the carousel. Dedicated page (the carousel interaction modes warrant a full page).

**Implementation notes:**
- The carousel strip is a `<div>` with `overflow: hidden` containing a sliding inner container. Scroll position is controlled via `transform: translateX()` with CSS transitions for smooth animation.
- Snap-to-swatch logic: after a swipe/drag ends, calculate the nearest swatch boundary from the current scroll offset and animate to it.
- Momentum: on swipe end, use `distance / time` from the swipe event detail to calculate initial velocity, apply a deceleration curve, and coast the strip before snapping.
- The `swipeable-mixin` and `draggable-mixin` are composed by wrapping the carousel strip element: `<swipeable-mixin><draggable-mixin><div class="strip">...</draggable-mixin></swipeable-mixin>`. The PointerCoordinator ensures the two don't conflict (drag activates on slow movement, swipe activates on fast gesture).
- ARIA: `role="listbox"` on the strip, `role="option"` + `aria-selected` on each swatch, `aria-label` with the color name/hex value, `aria-orientation="horizontal"`.
- Keyboard: left/right arrow to move selection, Home/End to jump to first/last, Enter/Space to confirm selection if `expandable` is active.
- The position indicator track uses a pseudo-element or thin `<div>` at the bottom of the component, with a marker whose `left` percentage reflects `scrollOffset / totalWidth`.

**Accessibility improvements over current:**
- Full keyboard navigation
- ARIA listbox semantics
- Focus management (tabindex on selected swatch)
- High-contrast mode support via `forced-colors` media query
- Reduced-motion support: `prefers-reduced-motion` disables carousel animations, snaps instantly

### 4.9 Implementation Order

The components should be implemented in this order based on dependency chains and utility:

1. **ars-button** -- no dependencies, prerequisite for all other interactive components. Smallest scope.
2. **ars-toggle** -- no dependencies, small scope, immediately useful.
3. **ars-input** -- no dependencies, medium scope, prerequisite for ars-select searchable mode.
4. **ars-color-select redesign** -- depends on existing swipeable-mixin and draggable-mixin. Medium scope. Scheduled here because it improves an existing component that other demos already reference (the calendar demo uses it for event color picking).
5. **ars-toast** -- no dependencies on other new components, medium scope, provides user feedback for demos of subsequent components.
6. **ars-tabs** -- no dependencies, medium scope, useful for organizing demos and settings pages.
7. **ars-select** -- benefits from ars-input patterns for searchable mode, large scope.
8. **ars-table** -- largest scope, benefits from all previous components being available for cell/header rendering.

## 5. Demo Strategy

Every component must have a demo. The demo is part of the component's deliverable — a component is not done until its demo is linked from the gallery index. However, not every component warrants a full dedicated page. Simple, stateless-ish controls that can be fully demonstrated with a few variants and states may share a combined demo page. Complex components with multiple modes, rich interaction, or substantial state surface get their own page.

### 5.1 Grouping Rationale

**Combined "Form Primitives" demo** (`demos/components/form-primitives/index.html`):
- **ars-button** — 4 variants x 3 sizes x 3 states (normal, disabled, loading) plus slot examples. Well-understood control; all permutations fit on one page.
- **ars-toggle** — on/off x disabled x label positions. Very compact API surface.

These two components are simple enough that a combined page gives a better user experience than two sparse pages. The combined page also demonstrates how the components work together in a form context, which is more realistic than showing each in isolation.

**Dedicated demo pages** — each of the following has enough surface area (multiple modes, complex interaction, event monitoring) to justify its own page:
- **ars-color-select** (redesign) — carousel interaction, swipe/drag scrolling, snap behavior, palette customization, expandable shade picker, swatch sizes, event monitoring. The existing demo page is rewritten.
- **ars-input** — multiple `type` values, validation states (error, required), clearable mode, prefix/suffix slots, event monitoring for `change`/`input`/`clear`
- **ars-toast** — severity levels, 6 position options, stacking behavior, auto-dismiss timing, programmatic vs. declarative API, custom mount target
- **ars-tabs** — 4 placement options, disabled tabs, keyboard navigation, dynamic add/remove of panels, nested content
- **ars-select** — single/multiple selection, searchable mode, option groups, keyboard navigation, dropdown positioning, error state
- **ars-table** — sort by column, row selection (single/multiple), striped/compact modes, virtual scrolling with large datasets, custom cell rendering, empty state

### 5.2 Existing Component Backfill

The following existing component lacks a demo page and should be backfilled:

- **ars-info-tile** (`demos/components/ars-info-tile/index.html`) — show basic card, with/without subtitle, custom properties, event handling. Small effort.

### 5.3 Demo Page Template

Every demo page (combined or dedicated) follows this structure. This matches the existing pattern established by the calendar and dialog demos:

1. **Head:** importmap for arslib, common CSS imports (`demos/css/base.css`, `demos/css/components.css`, `demos/css/buttons.css`), component-specific styles
2. **Header:** Component name and one-line description
3. **Back link:** `← Back to Demo Page` pointing to the gallery root
4. **Info box:** "About" section explaining what the component does and when to use it
5. **Demo sections:** Multiple sections, each demonstrating a distinct aspect:
   - Section title describing the feature/variant
   - Live component instance(s) in that configuration
   - Interactive controls to change attributes/properties and observe behavior
6. **Theme toggle:** Buttons to switch between light and dark adapters (calling `initializeArsWebComponents()` with each)
7. **Event monitor:** A log panel capturing all component events with timestamps and `detail` payloads
8. **Usage instructions:** Code examples showing the HTML and JS needed to reproduce each demo section
9. **Scripts:** Module script importing the component and design system; inline script for demo interactivity

### 5.4 Combined "Form Primitives" Demo Sections

The combined demo page is organized with clear visual separation between the two components.

**ars-button sections:**
1. **Variants** — primary, secondary, danger, ghost side by side
2. **Sizes** — sm, md, lg in each variant
3. **States** — disabled and loading states
4. **Slots** — prefix icon, suffix icon, both
5. **Event log** — click events with detail payload

**ars-toggle sections:**
1. **Basic** — default toggle, toggle with label
2. **Label positions** — start vs end
3. **States** — disabled (on), disabled (off)
4. **Event log** — change events showing checked state
5. **Live binding** — toggle controlling a visible change (e.g., dark mode toggle switching the adapter)

### 5.5 Dedicated Demo Page Specifications

Each dedicated page should include these minimum sections:

**ars-color-select (redesigned):**
1. **Default carousel** — inline strip with default palette, swipe/drag to browse, tap to select
2. **Swatch sizes** — sm, md, lg side by side
3. **Custom palette** — carousel initialized with a small custom palette via `palette` attribute
4. **Visible count** — different `visible-count` values showing compact (3) vs wide (9) strips
5. **Expandable shade picker** — carousel with `expandable` enabled, demonstrating the shade dropdown
6. **Disabled state**
7. **Keyboard navigation** — instructions and live test area for arrow keys, Home/End
8. **Programmatic control** — buttons to set color via JS property, read current selection
9. **Integration example** — the carousel paired with a preview surface showing the selected color applied (e.g., a colored card)
10. **Event monitor** — change events with color and previousColor

**ars-input:**
1. Text types (text, email, password, number, search, url, tel) — one instance per type
2. Labeled vs unlabeled
3. Validation states — required field left empty, pattern mismatch, custom error message
4. Clearable mode
5. Prefix/suffix slot examples (e.g., currency symbol, search icon)
6. Readonly and disabled states
7. Event monitor — input, change, clear events

**ars-toast:**
1. Severity levels — info, success, warning, error triggered by buttons
2. Position selector — 6 positions, live repositioning
3. Stacking — rapid-fire multiple toasts to show stack behavior
4. Auto-dismiss timing — configurable duration slider
5. Dismissible vs non-dismissible
6. Custom content via slot — toast with an action button
7. Programmatic API — `ArsToast.show()` examples
8. Custom mount target — toast inside a bounded container

**ars-tabs:**
1. Basic horizontal tabs with content panels
2. Placement options — top, bottom, start, end
3. Disabled tab
4. Keyboard navigation instructions and live test area
5. Dynamic tabs — add/remove tabs at runtime
6. Event monitor — tab change events

**ars-select:**
1. Basic single select with static options
2. Placeholder and pre-selected value
3. Searchable mode
4. Multiple selection
5. Option groups
6. Disabled options and disabled state
7. Error state
8. Keyboard navigation instructions
9. Property-driven options (JS object array) vs slot-driven options (HTML)
10. Event monitor — change, open, close events

**ars-table:**
1. Basic table with sample data (5-10 rows)
2. Sortable columns — click header to sort, visual indicator
3. Row selection — single and multiple mode
4. Striped and compact variants
5. Virtual scrolling — button to load 10,000 rows and demonstrate performance
6. Custom cell rendering — formatted numbers, colored status badges
7. Empty state — table with no data showing the `empty` slot
8. Event monitor — sort, select, row-click events

### 5.6 Gallery Index Updates

The gallery index (`index.html`) must be updated to include cards for all new demos. New entries go in the "Components Demo" grid and the "Quick Access" grid. The combined "Form Primitives" page gets a single card:

```
Form Primitives → demos/components/form-primitives/
Input           → demos/components/ars-input/
Toast           → demos/components/ars-toast/
Tabs            → demos/components/ars-tabs/
Select          → demos/components/ars-select/
Table           → demos/components/ars-table/
Info Tile       → demos/components/ars-info-tile/   (backfill)
```

### 5.7 Demo Delivery Sequencing

Demos are delivered alongside their component implementation — a component is not considered complete until its demo is functional and linked. The combined "Form Primitives" page is created when ars-button is implemented (step 1 in the implementation order) and extended when ars-toggle is implemented (step 2).

| Implementation step | Demo deliverable |
|---|---|
| 1. ars-button | Create `demos/components/form-primitives/index.html` with button sections |
| 2. ars-toggle | Extend form-primitives page with toggle sections |
| 3. ars-input | Create `demos/components/ars-input/index.html` |
| 4. ars-color-select redesign | Rewrite `demos/components/ars-color-select/index.html` for carousel |
| 5. ars-toast | Create `demos/components/ars-toast/index.html` |
| 6. ars-tabs | Create `demos/components/ars-tabs/index.html` |
| 7. ars-select | Create `demos/components/ars-select/index.html` |
| 8. ars-table | Create `demos/components/ars-table/index.html` |
| Backfill | Create `demos/components/ars-info-tile/index.html` |
| Final | Update `index.html` gallery with all new cards |

## 6. Phase 2 -- Embedding Documentation

Create `docs/EMBEDDING.md` covering the following topics. This document benefits all consumers who mount components inside a host application rather than a standalone HTML page.

### 6.1 Programmatic Mount/Unmount

- `document.createElement("ars-<name>")` + `container.appendChild(element)` + `container.removeChild(element)`
- The `targetDocument` option pattern (already used by `ArsDialog`) for non-default document contexts
- The `mountTarget` option pattern for non-body mount points
- Lifecycle guarantees: `connectedCallback` fires on append, `disconnectedCallback` fires on remove
- Shadow root creation timing: some components create the shadow root in the constructor, some defer to first activation. Document which pattern each component uses and the implications for pre-mount property setting.

### 6.2 Attribute-Driven Data Flow

- **Attribute-driven (declarative):** Set attributes from the host framework. Works for string/JSON-serializable data. Example: `element.setAttribute("data", JSON.stringify(payload))`
- **Property-driven (imperative):** Set typed JS properties directly. Required for complex objects, arrays, or callback functions. Example: `element.data = { ... }`
- **Which to prefer when:** Attribute-driven is better for HTML-serializable hosts, static HTML, and SSR. Property-driven is better for JavaScript-heavy hosts.

### 6.3 Event Forwarding

- All events use `composed: true` + `bubbles: true`, so they cross shadow boundaries
- Event naming convention: `ars-<component>:<action>` (e.g., `ars-button:click`, `ars-table:sort`)
- The `detail` object structure for each event (link to per-component API docs)
- Generic pattern for host applications: add `addEventListener` on mounted elements and forward `detail` payloads to the host's event system

### 6.4 Shell-Only Component Caveats

- **`ars-page`** in `routing-mode="browser"`: reads/writes `window.location` and `window.history`. In embedded contexts, use `routing-mode="internal"` instead.
- **`ars-dialog`** and **`ars-toast`** with default `mountTarget`: append to `document.body`. In embedded contexts, pass `mountTarget` explicitly.
- **All other components:** no shell-level assumptions, safe to mount anywhere.

### 6.5 Design Adapter in Embedded Contexts

- `initializeArsWebComponents({ targetDocument: iframeDoc })` for iframe contexts
- For shadow root embedding: set `--arswc-*` variables on the shadow host element rather than document root, and document that components resolve tokens via CSS inheritance

## 7. Phase 3 -- Publish Checklist

### 7.1 The Checklist

Create `docs/PUBLISH_CHECKLIST.md` to be followed for every version release:

#### Code Quality
- [ ] All tests pass (`npm test`)
- [ ] Test coverage >= 80% for changed/new components (`npm run test:coverage`)
- [ ] Lint passes (`npm run lint`)
- [ ] TypeScript compiles with no errors (`npm run build`)
- [ ] No `console.log` / `console.warn` in production source (test files excepted)

#### Documentation
- [ ] New/changed components have JSDoc header comments documenting attributes, properties, events, slots, and CSS variables
- [ ] `CHANGELOG.md` updated with entry under `[Unreleased]` following Keep a Changelog format
- [ ] `README.md` component inventory table updated if components were added/removed
- [ ] `docs/EMBEDDING.md` updated if mount/lifecycle behavior changed
- [ ] Per-component `README.md` created/updated in `src/components/ars-<name>/` if API changed

#### Demos
- [ ] New components have a demo (dedicated page or section in a combined page per Section 5)
- [ ] Demo follows the template structure from Section 5.3
- [ ] Existing demos still work after changes (manual verification or e2e)
- [ ] Gallery index (`index.html`) links to all demo pages in Quick Access and Components Demo grids
- [ ] Theme toggle (light/dark adapter) works on all demo pages

#### Release
- [ ] Version bumped in `package.json` following semver
- [ ] `CHANGELOG.md` date filled in for the release version
- [ ] Git tag created matching the version
- [ ] `npm publish` from a clean working tree

### 7.2 Demo Discipline

Establish a consistent demo page template. Each demo page should:

- Import the component and initialize the design adapter (both light and dark, with a toggle)
- Show the component in multiple states (default, active, disabled, error, etc.)
- Include a "Code" section showing the HTML/JS needed to reproduce each example
- Be linked from the demo index page

### 7.3 README Component Inventory

The `README.md` should maintain a table listing all components with:

| Component | Tag | Status | Description |
|---|---|---|---|
| Button | `<ars-button>` | Stable | Interactive button with variants |
| ... | ... | ... | ... |

Status values: `Stable`, `Beta`, `Deprecated`.

## 8. Design Contract Extension Sequencing

The token additions from Section 3 should be added to `design-system.ts` (both light and dark adapters) as part of the **first component implementation** (ars-button), since that component consumes most of the new tokens. The remaining tokens (`--arswc-color-success`, `--arswc-color-warning`) can be added when ars-toast is implemented.

## 9. Estimated Effort Summary

| Deliverable | Complexity | Depends on |
|---|---|---|
| Design token extensions | Small | -- |
| ars-button + form-primitives demo | Small | tokens |
| ars-toggle + form-primitives demo extension | Small | tokens, ars-button demo |
| ars-input + dedicated demo | Medium | tokens |
| ars-color-select redesign + demo rewrite | Medium | tokens, swipeable-mixin, draggable-mixin |
| ars-toast + dedicated demo | Medium | tokens |
| ars-tabs + ars-tab-panel + dedicated demo | Medium | tokens |
| ars-select + dedicated demo | Large | tokens, ars-input patterns |
| ars-table + dedicated demo | Large | tokens |
| ars-info-tile demo (backfill) | Small | -- |
| Gallery index update | Small | all demos |
| docs/EMBEDDING.md | Medium | understanding of all components |
| docs/PUBLISH_CHECKLIST.md | Small | -- |

Total: 7 new components + 1 redesign (2 small, 4 medium, 2 large), 7 demo pages (1 combined, 5 dedicated, 1 rewrite) + 1 backfill + gallery update, 2 documentation deliverables, 1 process deliverable.

## 10. What This Plan Intentionally Excludes

- **Dropdown/menu component:** Deferred until a consuming application needs it. `ars-select` covers the most common dropdown pattern.
- **Toolbar/sidebar/form-layout:** Compositional patterns better expressed as CSS utilities or documented layout recipes than as components. A component library should provide primitives, not impose layout opinions.
- **Icon component:** Icon policy belongs in the design system, not here. Components accept icon content via slots.
- **Theming beyond tokens:** The `ArsDesignAdapter` contract is the correct boundary. Component-level theme variants belong in consuming applications.

## 11. Success Criteria

The work described in this plan is complete when:

1. All seven new components are registered, exported from `src/index.ts`, and have >80% test coverage.
2. The `ars-color-select` redesign is complete: carousel interaction with swipe/drag, snap-to-swatch, keyboard navigation, ARIA listbox semantics, backwards-compatible `color` attribute and `ars-color-select:change` event, >80% test coverage.
3. Every new component and the redesigned color-select has a functional demo page (combined or dedicated) following the template in Section 5.3, with all minimum sections from Section 5.4/5.5 present.
4. The existing `ars-info-tile` component has a demo page (backfill).
5. The gallery index (`index.html`) links to all new demo pages in both the Quick Access grid and the Components Demo grid.
6. `docs/EMBEDDING.md` exists and covers all five topics from Section 6.
7. `docs/PUBLISH_CHECKLIST.md` exists and is referenced from `README.md`.
8. The design token contract in `design-system.ts` includes all tokens from Section 3 in both light and dark adapters.
9. `CHANGELOG.md` has entries for all additions under the next version.
10. `npm run test`, `npm run lint`, and `npm run build` all pass with zero warnings.
