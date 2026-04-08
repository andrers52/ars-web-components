# ARS Web Components

A collection of reusable web components built with TypeScript and ES modules.

## 🚀 Live Demo

Check out the [live demo](https://andrers52.github.io/src/projects/ars-web-components/).

**Alternative:** Download the repository and open `index.html` in a local web server.

## Features

- **🎯 TypeScript**: Full type safety with generated `.d.ts` declarations
- **🎨 CSS-friendly**: Components are styling-agnostic, use your own CSS classes
- **⚡ ES Modules**: Modern module system with proper imports/exports
- **🔧 Interactive Effects**: Built-in pressed effects and animations
- **📱 Touch Support**: Full mobile and desktop interaction support
- **🧪 Vitest Testing**: 698 tests with jsdom environment
- **🧹 ESLint**: Flat-config linting for source, tests, and tool configs
- **🔒 Proper Encapsulation**: Private methods and static utilities for clean API design
- **🤝 Mixin Coordination**: Smart pointer coordination system for multiple gesture mixins
- **📜 Mobile Scroll Management**: Intelligent scroll prevention during gesture interactions

## Architecture

### Project Structure

```
ars-web-components/
├── src/                    # TypeScript source files
│   ├── components/         # Web components
│   │   ├── ars-button/
│   │   ├── ars-calendar/
│   │   ├── ars-candlestick-chart/
│   │   ├── ars-color-select/
│   │   ├── ars-data-roller/
│   │   ├── ars-dialog/
│   │   ├── ars-info-tile/
│   │   ├── ars-input/
│   │   ├── ars-line-chart/
│   │   ├── ars-page/
│   │   ├── ars-select/
│   │   ├── ars-table/
│   │   ├── ars-tabs/
│   │   ├── ars-toast/
│   │   ├── ars-toggle/
│   │   ├── chart-base/
│   │   └── web-component-base/
│   ├── mixins/             # Reusable mixins
│   │   ├── common/
│   │   ├── draggable-mixin/
│   │   ├── localized-mixin/
│   │   ├── pressed-effect-mixin/
│   │   ├── remote-call-mixin/
│   │   ├── roll-mixin/
│   │   ├── show-if-property-true-mixin/
│   │   └── swipeable-mixin/
├── demos/                  # Demo entry points and demo-only assets
│   └── css/                # Shared CSS for demos
├── dist/                   # Compiled JavaScript output (generated)
├── test/                   # Shared Vitest setup and mocks
├── tsconfig.json
├── vitest.config.ts
└── server.js               # Express dev server
```

### TypeScript + Web Components

All components extend `WebComponentBase` (which extends `HTMLElement`) and are compiled from TypeScript to ES modules with full type declarations:

```typescript
import WebComponentBase from "../web-component-base/web-component-base.js";

class MyComponent extends WebComponentBase {
  static get observedAttributes() {
    return ["attr1", "attr2"];
  }

  connectedCallback() { /* lifecycle */ }
  attributeChangedCallback(name: string, oldVal: string, newVal: string) { /* ... */ }

  publicMethod() { /* component API */ }
}
```

## Installation

```bash
npm install ars-web-components
```

## Development Workflow

### Live-reload demo development (recommended while editing)

Use Vite to serve the demos with automatic reload from `src/` (no rebuild required on each edit):

```bash
npm run dev
```

Then open the printed local URL (for example `http://127.0.0.1:8080/` or `http://127.0.0.1:8081/`).

Notes:
- The demo pages still reference `/dist/...` paths, but the Vite dev server rewrites them to `/src/...` during development.
- This keeps the demo HTML stable while enabling fast iteration.

### Dist build verification (release/package path)

When you want to verify the published package output, rebuild the package:

```bash
npm run build
```

This regenerates `dist/`, which is what external consumers import.

### Tests

Run the test suite:

```bash
npm test
```

Test files live alongside the source they cover (for easier navigation while editing components/mixins). Shared Vitest setup and mocks remain in `test/`.

### Lint

Run the lint suite:

```bash
npm run lint
```

The lint configuration covers source files, colocated tests, and TypeScript tool config files through `tsconfig.eslint.json`.

## Design System Compatibility (Design-Agnostic by Default)

`ars-web-components` is intended to be **design-system agnostic**.

- It should work with your own CSS/theme variables.
- In the Dark Factory ecosystem (internal usage), the default pairing is the private `ars-design-system`.
- If no design system is used, you can start from one of the lightweight fallback theme templates shipped in this package.

### Recommended pairing (Dark Factory / internal usage)

Import order:

```ts
import "ars-design-system/styles.css";
import "ars-web-components/styles.css";
```

Then initialize the component library with your design adapter:

```ts
import { initializeArsWebComponents } from "ars-web-components";

initializeArsWebComponents({
  designAdapter: {
    rootAttributes: { "data-theme": "my-app-theme" },
    cssVariables: {
      "--arswc-color-accent": "#2563eb"
    }
  }
});
```

The adapter contract is intentionally small and generic so applications can supply any design system.

### Explicit default adapter (no external design system)

If you want an explicit non-Dark-Factory setup without custom adapters:

```ts
import { getArsWebComponentsDefaultAdapter, initializeArsWebComponents } from "ars-web-components";

initializeArsWebComponents({
  designAdapter: getArsWebComponentsDefaultAdapter("dark"),
});
```

This keeps initialization explicit while still providing a simple starter theme.

## Brainiac Engine Embedding

`ars-web-components` can be mounted inside `brainiac-engine` DOM overlays as agent presentations.

Embedding guidelines:

- Prefer components that can operate inside a provided host container instead of assuming `document.body`.
- Prefer local/internal routing when embedding page containers inside an engine overlay.
- Prefer owner-document scoped listeners over hard-coded global `window` references.
- Prefer declarative event wiring and direct template rendering over dynamic string evaluation.

Current component support for engine embedding:

- `ars-calendar`
  - supports `global-events-enabled="false"` so embedded hosts can opt out of global window events
- `ars-dialog`
  - static `notify(...)` and `dialog(...)` accept an optional mount-target options object
- `ars-page`
  - supports `routing-mode="internal"` for local navigation without browser history ownership

Hardening notes for embedded hosts:

- `web-component-base` no longer uses `eval` to wire DOM events
- `ars-dialog` and `ars-color-select` now render templates directly instead of evaluating template strings
- embedded integrations should prefer explicit host references and typed data over raw HTML/script injection patterns

For comprehensive embedding guidance including mount/unmount lifecycle, event forwarding, and design adapter usage in iframes/shadow roots, see [docs/EMBEDDING.md](docs/EMBEDDING.md).

For the release process checklist, see [docs/PUBLISH_CHECKLIST.md](docs/PUBLISH_CHECKLIST.md).

### Custom Design System Contract (`--arswc-*`)

`ars-web-components` components read library-level design variables (`--arswc-*`) set by the active design adapter.

When a custom design system initializes the library, it should set some or all of these variables on the document root (or another shared scope):

Recommended core variables:

- `--arswc-color-bg`
- `--arswc-color-surface`
- `--arswc-color-border`
- `--arswc-color-text`
- `--arswc-color-muted`
- `--arswc-color-accent`
- `--arswc-color-accent-contrast`
- `--arswc-radius-sm`
- `--arswc-radius-md`
- `--arswc-shadow-sm`
- `--arswc-font-family-sans`
- `--arswc-font-family-mono`

Resolution priority in components:

1. component-specific CSS variables (for example `--ars-calendar-*`)
2. library design variables (`--arswc-*`) from the active adapter
3. hardcoded component fallback values

This makes the library design-system agnostic while keeping integration predictable.

### Design Contract Coverage

All components resolve their default styling through the library design contract (`--arswc-*`) before falling back to hardcoded values.

**Core tokens** (used by most components):

- `--arswc-color-bg`, `--arswc-color-surface`, `--arswc-color-border`
- `--arswc-color-text`, `--arswc-color-muted`, `--arswc-color-accent`, `--arswc-color-accent-contrast`
- `--arswc-radius-sm`, `--arswc-radius-md`, `--arswc-shadow-sm`
- `--arswc-font-family-sans`, `--arswc-font-family-mono`

**Semantic color tokens** (added in 1.0.0):

- `--arswc-color-danger` — destructive actions, error states (button, toast, input validation)
- `--arswc-color-success` — success confirmation (toast, toggle on state)
- `--arswc-color-warning` — warning states (toast)
- `--arswc-color-disabled`, `--arswc-color-disabled-bg` — disabled element foreground/background

**Typography and spacing tokens** (added in 1.0.0):

- `--arswc-font-size-sm`, `--arswc-font-size-md`, `--arswc-font-size-lg`
- `--arswc-spacing-xs` through `--arswc-spacing-xl`
- `--arswc-transition-duration`, `--arswc-focus-ring`

Components remain independently overridable through their own component-specific CSS variables (for example `--ars-calendar-*`).

### Fallback templates (no design system)

Choose one small generic template and then override values in your app:

```ts
import "ars-web-components/theme-default-dark.css";
import "ars-web-components/styles.css";
```

or

```ts
import "ars-web-components/theme-default-light.css";
import "ars-web-components/styles.css";
```

These fallback templates are intentionally minimal. They exist to make adoption easy, not to define a complete visual identity.

## Usage

### Method 1: ES Module Import (Recommended)

```typescript
import { ArsCalendar } from "ars-web-components";
```

### Method 2: Direct Script Import

For projects that need to load components directly without bundling:

```html
<script type="module" src="./node_modules/ars-web-components/dist/index.js"></script>
```

## Components

### Component Inventory

| Component | Tag | Status | Description |
|---|---|---|---|
| Button | `<ars-button>` | Stable | Interactive button with variant, size, disabled, loading |
| Toggle | `<ars-toggle>` | Stable | Boolean switch control with keyboard support |
| Input | `<ars-input>` | Stable | Text input with label, validation, clearable |
| Color Select | `<ars-color-select>` | Stable | Carousel color picker with keyboard navigation |
| Toast | `<ars-toast>` | Stable | Notification toast with stacking and auto-dismiss |
| Tabs | `<ars-tabs>` | Stable | Tabbed navigation with 4 placement options |
| Select | `<ars-select>` | Stable | Dropdown select with search and multi-select |
| Table | `<ars-table>` | Stable | Data table with sorting, selection, virtual scroll |
| Calendar | `<ars-calendar>` | Stable | Date selection and event management |
| Dialog | `<ars-dialog>` | Stable | Modal dialog with confirmation and notification modes |
| Data Roller | `<ars-data-roller>` | Stable | Animated cycling data display |
| Info Tile | `<ars-info-tile>` | Stable | Structured information card for dashboards |
| Line Chart | `<ars-line-chart>` | Stable | Canvas-based line chart |
| Candlestick Chart | `<ars-candlestick-chart>` | Stable | Financial OHLC candlestick chart |
| Page Router | `<ars-page>` | Stable | Component-based routing |
| Relational Node | `<ars-relational-node>` | Deprecated | Use `<ars-info-tile>` instead |

### ArsButton

Styled, accessible button with variant, size, and state support.

```html
<ars-button variant="primary" size="md">Click Me</ars-button>
<ars-button variant="danger" disabled>Disabled</ars-button>
<ars-button loading>Loading...</ars-button>
```

**Attributes:** `variant` (primary/secondary/danger/ghost), `size` (sm/md/lg), `disabled`, `loading`, `type` (button/submit/reset)

**Slots:** default (label), `prefix`, `suffix`

**Events:** `ars-button:click` — detail: `{ variant }`

### ArsToggle

Boolean switch control with keyboard support.

```html
<ars-toggle label="Dark mode" checked></ars-toggle>
```

**Attributes:** `checked`, `disabled`, `label`, `label-position` (start/end)

**Events:** `ars-toggle:change` — detail: `{ checked }`

### ArsInput

Text input with label, validation, and clearable state.

```html
<ars-input label="Email" type="email" placeholder="user@example.com" required></ars-input>
<ars-input label="Search" type="search" clearable></ars-input>
```

**Attributes:** `type`, `value`, `placeholder`, `label`, `error`, `disabled`, `readonly`, `clearable`, `min`, `max`, `step`, `pattern`, `required`

**Slots:** `prefix`, `suffix`

**Events:** `ars-input:input`, `ars-input:change`, `ars-input:clear`

### ArsToast

Notification toast with severity levels and stacking.

```javascript
import { ArsToast } from "ars-web-components";

ArsToast.show("Operation complete!", {
  severity: "success",
  duration: 4000,
  position: "top-right",
});
```

**Static API:** `ArsToast.show(message, options)` — options: `severity`, `duration`, `dismissible`, `position`, `mountTarget`, `targetDocument`

**Attributes:** `message`, `severity` (info/success/warning/error), `duration`, `dismissible`, `open`

**Events:** `ars-toast:dismiss` — detail: `{ reason }`

### ArsTabs

Tabbed navigation with companion `<ars-tab-panel>`.

```html
<ars-tabs>
  <ars-tab-panel tab-id="overview" label="Overview">Content here</ars-tab-panel>
  <ars-tab-panel tab-id="settings" label="Settings">Settings here</ars-tab-panel>
</ars-tabs>
```

**Attributes:** `active-tab`, `placement` (top/bottom/start/end)

**Events:** `ars-tabs:change` — detail: `{ activeTab, previousTab }`

### ArsSelect

Dropdown select with search, groups, and multi-select.

```javascript
const select = document.querySelector("ars-select");
select.options = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana", group: "Tropical" },
];
```

**Attributes:** `value`, `placeholder`, `label`, `disabled`, `searchable`, `multiple`, `error`

**Events:** `ars-select:change`, `ars-select:open`, `ars-select:close`

### ArsTable

Data table with sorting, selection, and virtual scrolling.

```javascript
const table = document.querySelector("ars-table");
table.columns = [
  { key: "name", label: "Name" },
  { key: "age", label: "Age", align: "end" },
];
table.data = [
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 },
];
```

**Attributes:** `selectable` (none/single/multiple), `sortable`, `striped`, `compact`, `virtual-scroll`, `auto-sort`

**Events:** `ars-table:sort`, `ars-table:select`, `ars-table:row-click`

### ArsCalendar

Interactive calendar component with full customization support.

```html
<ars-calendar
  id="myCalendar"
  localized_abbreviated_days='["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]'
  localized_months='["January","February","March",...,"December"]'
  localized_today="Today"
  css-vars='{"ars-calendar-bg": "#f0f0f0", "ars-calendar-header-bg": "#333"}'
></ars-calendar>
```

**Attributes:**

- `localized_abbreviated_days`: JSON array of localized day abbreviations
- `localized_months`: JSON array of localized month names
- `localized_today`: Localized text for "Today" button
- `custom-css`: Custom CSS string to add to component styles
- `css-vars`: JSON object of CSS custom properties for theming

**Methods:**

- `addEvent(event)`: Add an event to the calendar
- `removeEvent(event)`: Remove an event from the calendar
- `changeEvent(date, newText, newColor)`: Modify an existing event
- `selectDate(day, month, year)`: Programmatically select a date
- `setSelectedDateToToday()`: Select today's date
- `setCustomTemplate(templateFunction)`: Provide custom HTML template
- `setCSSVars(cssVarsObject)`: Set CSS variables programmatically
- `getCSSVars()`: Get current CSS variables

**Events:**

- `ars-calendar:daySelected`: Fired when a date is selected

**CSS Customization:**

The calendar supports extensive theming through CSS variables:

```css
ars-calendar {
  --ars-calendar-bg: #ffffff;
  --ars-calendar-shadow: 0px 3px 3px rgba(0, 0, 0, 0.25);
  --ars-calendar-border-radius: 5px;
  --ars-calendar-header-bg: linear-gradient(to bottom, #b32b0c, #cd310d);
  --ars-calendar-header-height: 34px;
  --ars-calendar-header-color: #fff;
  --ars-calendar-cell-width: 30px;
  --ars-calendar-cell-height: 30px;
  /* ... and many more */
}
```

### ArsDialog

Modal dialog component for user interactions. Supports custom content, styling with backdrop management, and both confirmation and notification modes.

```javascript
// Open a dialog with confirmation buttons and custom content
const result = await ArsDialog.dialog(
  `<form><label>Name: <input id='name'></label></form>`,
  "Dialog Title"
);
if (result) {
  const name = result.querySelector("#name").value;
  // ...
}

// Show a notification dialog
await ArsDialog.notify("Operation complete!", "Success");
```

**Attributes:**

- `custom-css`: Custom CSS string to add to dialog styles
- `css-vars`: JSON object of CSS custom properties for theming

**Methods:**

- `setCSSVars(cssVarsObject)`: Set CSS variables programmatically
- `getCSSVars()`: Get current CSS variables

**Styling & Theming:**

- Dialog supports extensive theming via CSS variables (see `ars-dialog-css.js`)
- Form elements (`input`, `select`, `textarea`) are styled by default, even for light DOM content injected as HTML
- Content area is fully responsive and prevents overflow

**Light DOM Form Styling:**

If you inject form elements as raw HTML (light DOM) into the dialog, ARS Dialog will automatically inject a `<style>` tag with form element CSS into the content area, ensuring consistent styling for `input`, `select`, and `textarea`.

**Events:**

- Dialog returns the content DOM element (for confirmation dialogs) or `null`/`false` if cancelled

**Example:**

```javascript
const result = await ArsDialog.dialog('<input id="myInput">', "Enter Value");
if (result) {
  alert(result.querySelector("#myInput").value);
}
```

### ArsColorSelect

Carousel-based color picker with spectrum-ordered swatches and keyboard navigation.

```html
<ars-color-select color="#3B82F6" visible-count="7"></ars-color-select>
```

**Features:**

- Horizontal carousel strip of circular swatches in spectrum order (red → orange → yellow → green → blue → purple → neutrals)
- Navigation buttons and position track indicator
- Keyboard navigation: Arrow Left/Right, Home, End
- ARIA listbox semantics with `role="option"` and `aria-selected`
- Custom palette via `palette` property, swatch sizes (sm/md/lg)
- `prefers-reduced-motion` support

**Attributes:** `color`, `palette` (JSON array), `swatch-size` (sm/md/lg), `disabled`, `visible-count`

**Events:** `ars-color-select:change` — detail: `{ id, color, previousColor }`

**Usage Example:**

```javascript
const picker = document.querySelector("ars-color-select");
picker.palette = ["#FF0000", "#00FF00", "#0000FF"];
picker.addEventListener("ars-color-select:change", (e) => {
  console.log(`Selected: ${e.detail.color}`);
});
```

### ArsPage & ArsPageController

Component-based router and navigation controls for web applications, using the new remote-call API for inter-component communication.

#### ArsPage

```html
<ars-page
  id="my-router"
  default-page="home"
  routes='{"home":"/","about":"/about","contact":"/contact"}'
>
  <div id="home">Home page content</div>
  <div id="about">About page content</div>
  <div id="contact">Contact page content</div>
</ars-page>
```

**Attributes:**

- `default-page`: The page to show initially

#### ArsPageController

```html
<ars-page-controller target-page="my-router">
  <nav>
    <button data-page="home">Home</button>
    <button data-page="about">About</button>
    <button data-page="contact">Contact</button>
  </nav>
</ars-page-controller>
```

**Attributes:**

- `target-page`: The ID of the `ars-page` component to control

**Features:**

- Component-based routing
- Custom navigation markup via child elements with `data-page`
- Event-driven architecture
- Easy to integrate

### ArsRelationalNode

Reusable DOM node card for graph-based UIs that need browser-native interaction instead of canvas-drawn text.

```typescript
import { ArsRelationalNode } from "ars-web-components";

const node = new ArsRelationalNode();
node.data = {
  id: "event_alpha",
  title: "Event Alpha",
  subtitle: "is a: event",
  properties: {
    start_date: "2026-03-11",
    owner: "andre",
  },
};
node.setSelected(true);
```

This component is intended for projected overlays in tools like Nexus or Brainiac Engine where the spatial runtime owns positioning and zoom while the browser owns the card UI.

## Mixins

ARS Web Components includes a collection of reusable mixins that can be applied to any web component to add specific functionality.

### PressedEffect Mixin

Adds pressed animation effects to components with solid background colors.

```javascript
import { PressedEffectMixin } from "ars-web-components";

class MyButton extends PressedEffectMixin(HTMLElement) {
  constructor() {
    super();
    // Your component logic
  }
}
```

**Features:**

- Automatic color detection from background
- Smooth pressed animation effects
- Works with solid background colors
- Touch and mouse support

**Demo:** http://localhost:8080/demos/mixins/pressed-effect-mixin/

### Localized Mixin

Provides localization capabilities for components with dynamic language switching.

```javascript
import { LocalizedMixin } from "ars-web-components";

class LocalizedComponent extends LocalizedMixin(HTMLElement) {
  constructor() {
    super();
    this.addTranslations("en", { greeting: "Hello World" });
    this.addTranslations("es", { greeting: "Hola Mundo" });
    this.addTranslations("fr", { greeting: "Bonjour le Monde" });
    this.setLocale("en");
  }
}
```

**Features:**

- Dynamic language switching
- Text localization support
- Event-driven updates
- Mock localization system for testing

**Demo:** http://localhost:8080/demos/mixins/localized-mixin/

### RemoteCall Mixins

Enables inter-component communication through DOM events and component IDs.

```javascript
import {
  RemoteCallCallerMixin,
  RemoteCallReceiverMixin,
} from "ars-web-components";

class GreeterElement extends HTMLElement {
  greet(name) {
    console.log(`Hello ${name}`);
  }
}
customElements.define("greeter-element", GreeterElement);

class MyCaller extends RemoteCallCallerMixin(HTMLElement) {
  sendGreeting() {
    this.callRemote("my-receiver", "greet", "World");
  }
}

class MyReceiver extends RemoteCallReceiverMixin(HTMLElement) {}
```

**Receiver markup:**

```html
<remote-call-receiver-mixin id="my-receiver" allow="greet">
  <greeter-element></greeter-element>
</remote-call-receiver-mixin>
```

**Important:** Receiver elements must have a unique `id` attribute, and the wrapped target must expose public methods.

**Features:**

- Component ID-based targeting
- Method call with parameters
- Error handling and validation
- Support for multiple receiver instances

**Demo:** http://localhost:8080/demos/mixins/remote-call-mixin/

### ShowIfPropertyTrue Mixin

Conditionally shows/hides components based on property values.

```javascript
import { ShowIfPropertyTrueMixin } from "ars-web-components";

class ConditionalComponent extends ShowIfPropertyTrueMixin(HTMLElement) {
  constructor() {
    super();
    this.showIfPropertyTrue("visible", true);
  }
}
```

**Demo:** http://localhost:8080/demos/mixins/show-if-property-true-mixin/

### Swipeable Mixin

Adds swipe gesture support to components.

```javascript
import { SwipeableMixin } from "ars-web-components";

class SwipeableComponent extends SwipeableMixin(HTMLElement) {
  constructor() {
    super();
    this.onSwipeLeft = () => console.log("Swiped left!");
    this.onSwipeRight = () => console.log("Swiped right!");
  }
}
```

**Features:**
- Swipe detection with customizable distance and time thresholds
- Direction detection (left, right, up, down)
- Configurable via `min-swipe-distance` and `max-swipe-time` attributes
- Works seamlessly with other mixins using PointerCoordinator
- **Order-independent**: Can be nested in any order with other gesture mixins

**Demo:** http://localhost:8080/demos/mixins/swipeable-mixin/

### Draggable Mixin

Adds drag gesture detection to components with customizable thresholds and real-time feedback.

```javascript
import { DraggableMixin } from "ars-web-components";

class DraggableComponent extends DraggableMixin(HTMLElement) {
  constructor() {
    super();
    this.addEventListener('dragstart', (e) => console.log('Drag started:', e.detail));
    this.addEventListener('dragmove', (e) => console.log('Dragging:', e.detail));
    this.addEventListener('dragend', (e) => console.log('Drag ended:', e.detail));
  }
}
```

**Features:**
- Drag start, move, and end events with detailed coordinate data
- Direction detection (left, right, up, down) with distance tracking
- Configurable drag threshold via `drag-threshold` attribute
- Real-time drag feedback with `dragmove` events
- Works seamlessly with other mixins using PointerCoordinator
- **Order-independent**: Can be nested in any order with other gesture mixins

**Demo:** http://localhost:8080/demos/mixins/draggable-mixin/

### Roll Mixin

Adds roll animation effects to components.

```javascript
import { RollMixin } from "ars-web-components";

class RollableComponent extends RollMixin(HTMLElement) {
  constructor() {
    super();
    this.onRollStart = () => console.log("Roll started!");
    this.onRollEnd = () => console.log("Roll ended!");
  }
}
```

**Demo:** http://localhost:8080/demos/mixins/roll-mixin/

## Mixin Coordination

ARS Web Components includes a sophisticated coordination system that allows multiple gesture mixins to work together seamlessly on the same element.

### Pointer Coordination

Gesture mixins in this package share an internal `PointerCoordinator` utility to manage pointer capture and redispatching.
That coordination is what allows drag and swipe behaviors to coexist on the same interaction surface without fighting over the same pointer stream.

**Features:**
- Prevents conflicts when multiple mixins try to capture the same pointer
- Smart scroll prevention that only activates during active gestures
- Event redispatching system to prevent infinite loops
- Early gesture detection for responsive touch interactions
- **Order-independent coordination**: Works regardless of mixin nesting order

### Using Multiple Mixins Together

You can combine multiple gesture mixins on the same element in any order:

```html
<!-- DraggableMixin as parent, SwipeableMixin as child -->
<draggable-mixin drag-threshold="10">
  <swipeable-mixin min-swipe-distance="30" max-swipe-time="800">
    <div>Drag for movement, swipe for quick actions</div>
  </swipeable-mixin>
</draggable-mixin>

<!-- SwipeableMixin as parent, DraggableMixin as child -->
<swipeable-mixin min-swipe-distance="30" max-swipe-time="800">
  <draggable-mixin drag-threshold="10">
    <div>Swipe for quick actions, drag for movement</div>
  </draggable-mixin>
</swipeable-mixin>
```

In both examples:
- Dragging will trigger drag events
- Quick swipes will trigger swipe events
- Both mixins coordinate through PointerCoordinator
- Scroll prevention only activates when gestures are detected
- **Order-independent**: Works regardless of which mixin is parent/child

## Show If Property True Mixin

This mixin allows you to show or hide a custom element based on a boolean property, attribute, or data attribute. It is ideal for toggling the visibility of UI elements in a declarative way.

### Usage Example

```html
<!-- Toggle the bar by changing the isVisible property -->
<conditional-element class="bar" show-if-property="isVisible"
  >isVisible Bar</conditional-element
>
```

```js
import { ShowIfPropertyTrueMixin } from "./mixins/show-if-property-true-mixin/show-if-property-true-mixin.js";

class ConditionalElement extends ShowIfPropertyTrueMixin(HTMLElement) {}
customElements.define("conditional-element", ConditionalElement);

// Toggle visibility
const el = document.querySelector("conditional-element");
el.isVisible = true; // shows the bar
el.isVisible = false; // hides the bar
```

### keep-space-when-hidden Attribute

Add the `keep-space-when-hidden` attribute to keep the element's space in the layout when hidden (uses `visibility: hidden` instead of `display: none`).

```html
<conditional-element
  class="bar"
  show-if-property="isVisible"
  keep-space-when-hidden
>
  isVisible Bar
</conditional-element>
```

## Development

### Quick Start

```bash
cd ars-web-components
npm install
npm run build   # Compile TypeScript → dist/
npm test        # Run all 681 tests
npm start       # Start dev server on port 8080
```

### Scripts

| Script | Description |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` via `tsc` |
| `npm test` | Run all tests (Vitest, single run) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run dev` | Start the Vite dev server for live demo development |
| `npm start` | Start Express dev server on port 8080 |
| `npm stop` | Stop the dev server |

### Experimenting with Components and Mixins

Once the server is running, you can access:

- **Main Demo Gallery**: http://localhost:8080/
- **Individual Components**:
  - **form-primitives** (button + toggle): http://localhost:8080/demos/components/form-primitives/
  - **ars-input**: http://localhost:8080/demos/components/ars-input/
  - **ars-color-select**: http://localhost:8080/demos/components/ars-color-select/
  - **ars-toast**: http://localhost:8080/demos/components/ars-toast/
  - **ars-tabs**: http://localhost:8080/demos/components/ars-tabs/
  - **ars-select**: http://localhost:8080/demos/components/ars-select/
  - **ars-table**: http://localhost:8080/demos/components/ars-table/
  - **ars-info-tile**: http://localhost:8080/demos/components/ars-info-tile/
  - **ars-calendar**: http://localhost:8080/demos/components/ars-calendar/
  - **ars-dialog**: http://localhost:8080/demos/components/ars-dialog/
  - **ars-page**: http://localhost:8080/demos/components/ars-page/
  - **ars-data-roller**: http://localhost:8080/demos/components/ars-data-roller/
  - **ars-line-chart**: http://localhost:8080/demos/components/ars-line-chart/
  - **ars-candlestick-chart**: http://localhost:8080/demos/components/ars-candlestick-chart/
- **Individual Mixins**:
  - **pressed-effect**: http://localhost:8080/demos/mixins/pressed-effect-mixin/
  - **localized**: http://localhost:8080/demos/mixins/localized-mixin/
  - **remote-call**: http://localhost:8080/demos/mixins/remote-call-mixin/
  - **swipeable**: http://localhost:8080/demos/mixins/swipeable-mixin/
  - **draggable**: http://localhost:8080/demos/mixins/draggable-mixin/
  - **show-if-property-true**: http://localhost:8080/demos/mixins/show-if-property-true-mixin/
  - **roll**: http://localhost:8080/demos/mixins/roll-mixin/

### Co-development Setup

For projects that need to develop alongside ars-web-components, you can set up symlinks:

```bash
# In your project's node_modules
ln -s ../../../../ars-web-components ars-web-components-dev
```

### Available Exports

Check `src/index.ts` for all available imports:

```typescript
// Components
export { ArsButton } from "./components/ars-button/ars-button.js";
export { ArsCalendar } from "./components/ars-calendar/ars-calendar.js";
export { ArsCandlestickChart } from "./components/ars-candlestick-chart/ars-candlestick-chart.js";
export { ArsColorSelect } from "./components/ars-color-select/ars-color-select.js";
export { ArsDataRoller } from "./components/ars-data-roller/ars-data-roller.js";
export { ArsDialog } from "./components/ars-dialog/ars-dialog.js";
export { ArsInfoTile } from "./components/ars-info-tile/ars-info-tile.js";
export { ArsInput } from "./components/ars-input/ars-input.js";
export { ArsLineChart } from "./components/ars-line-chart/ars-line-chart.js";
export { ArsPage } from "./components/ars-page/ars-page.js";
export { ArsPageController } from "./components/ars-page/ars-page-controller.js";
export { ArsSelect } from "./components/ars-select/ars-select.js";
export { ArsTable } from "./components/ars-table/ars-table.js";
export { ArsTabs, ArsTabPanel } from "./components/ars-tabs/ars-tabs.js";
export { ArsToast } from "./components/ars-toast/ars-toast.js";
export { ArsToggle } from "./components/ars-toggle/ars-toggle.js";
export { ChartBase } from "./components/chart-base/chart-base.js";
export { WebComponentBase } from "./components/web-component-base/web-component-base.js";

// Design System
export { getArsWebComponentsDefaultAdapter, initializeArsWebComponents } from "./design-system.js";

// Mixins
export { DraggableMixin } from "./mixins/draggable-mixin/draggable-mixin.js";
export { LocalizedMixin } from "./mixins/localized-mixin/localized-mixin.js";
export { PressedEffectMixin } from "./mixins/pressed-effect-mixin/pressed-effect-mixin.js";
export { RemoteCallCallerMixin } from "./mixins/remote-call-mixin/remote-call-caller-mixin.js";
export { RemoteCallReceiverMixin } from "./mixins/remote-call-mixin/remote-call-receiver-mixin.js";
export { RollMixin } from "./mixins/roll-mixin/roll-mixin.js";
export { ShowIfPropertyTrueMixin } from "./mixins/show-if-property-true-mixin/show-if-property-true-mixin.js";
export { SwipeableMixin } from "./mixins/swipeable-mixin/swipeable-mixin.js";
```

## Requirements

- Modern browser with ES module support
- Node.js (for building and testing)
- `arslib` dependency (automatically installed)

## License

MIT
