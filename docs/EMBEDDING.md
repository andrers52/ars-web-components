# Embedding ars-web-components

This document covers mounting and integrating ars-web-components inside host applications — from standalone HTML pages to framework-rendered containers, iframes, and engine DOM overlays.

## 1. Programmatic Mount/Unmount

### Creating and appending

```javascript
const tile = document.createElement("ars-info-tile");
tile.data = { id: "bot_001", title: "Scalper", properties: { status: "active" } };
container.appendChild(tile);
```

### Removing

```javascript
container.removeChild(tile);
```

### Lifecycle guarantees

- `connectedCallback` fires when the element is appended to a document-connected tree.
- `disconnectedCallback` fires when the element is removed.
- Shadow root creation varies per component:
  - **Constructor-time** (most components): `ars-button`, `ars-toggle`, `ars-input`, `ars-toast`, `ars-tabs`, `ars-select`, `ars-table`, `ars-info-tile`, `ars-color-select`. Properties set before mount are safe because the shadow root exists.
  - **connectedCallback-time**: `ars-color-select` (legacy pattern, now constructor-time after redesign), `ars-dialog`, `ars-calendar`. Set properties after appending, or verify shadow root availability.

### The `targetDocument` option

`ArsDialog` and `ArsToast` accept a `targetDocument` option for non-default document contexts (e.g., iframes):

```javascript
ArsDialog.show({
  targetDocument: iframeDoc,
  mountTarget: iframeDoc.body,
  // ...
});

ArsToast.show("Saved!", {
  targetDocument: iframeDoc,
  mountTarget: iframeDoc.querySelector("#toast-region"),
});
```

### The `mountTarget` option

By default, `ArsDialog` and `ArsToast` append to `document.body`. In embedded contexts, pass `mountTarget` explicitly to constrain the component:

```javascript
const panel = document.querySelector("#settings-panel");
ArsToast.show("Updated", { mountTarget: panel, position: "bottom-center" });
```

## 2. Attribute-Driven vs Property-Driven Data Flow

### Attribute-driven (declarative)

Set attributes from the host framework. Works for string and JSON-serializable data:

```javascript
element.setAttribute("data", JSON.stringify(payload));
element.setAttribute("color", "#ff0000");
element.setAttribute("disabled", "");
```

**Best for:** HTML-serializable hosts, static HTML, SSR, simple string/boolean values.

### Property-driven (imperative)

Set typed JS properties directly. Required for complex objects, arrays, or callbacks:

```javascript
element.data = { id: "x", title: "Node", properties: { key: "val" } };
element.columns = [{ key: "name", label: "Name", render: (v) => `<b>${v}</b>` }];
element.palette = ["#ff0000", "#00ff00", "#0000ff"];
```

**Best for:** JavaScript-heavy hosts, complex data, callback functions.

### Which to prefer

| Scenario | Recommended | Reason |
|---|---|---|
| Simple config (color, label, size) | Attribute | Readable in HTML, works with SSR |
| Object/array data (table rows, chart points) | Property | Avoids JSON serialization overhead |
| Callbacks (render functions) | Property | Functions cannot be serialized |
| Framework integration (React, Vue, Angular) | Property | Framework bindings handle typed props |

## 3. Event Forwarding

All ars-web-components events use `composed: true` and `bubbles: true`, so they cross shadow boundaries reliably.

### Event naming convention

```
ars-<component>:<action>
```

Examples: `ars-button:click`, `ars-table:sort`, `ars-toast:dismiss`, `ars-toggle:change`.

### Listening pattern

```javascript
// On the element directly
element.addEventListener("ars-button:click", (e) => {
  console.log(e.detail.variant);
});

// Or on a parent (events bubble and compose)
document.addEventListener("ars-table:sort", (e) => {
  console.log(e.detail.column, e.detail.direction);
});
```

### Event detail reference

| Event | Detail |
|---|---|
| `ars-button:click` | `{ variant }` |
| `ars-toggle:change` | `{ checked }` |
| `ars-input:input` | `{ value }` |
| `ars-input:change` | `{ value }` |
| `ars-input:clear` | `{ previousValue }` |
| `ars-color-select:change` | `{ id, color, previousColor }` |
| `ars-toast:dismiss` | `{ reason }` |
| `ars-tabs:change` | `{ activeTab, previousTab }` |
| `ars-select:change` | `{ value, previousValue }` |
| `ars-select:open` | (none) |
| `ars-select:close` | (none) |
| `ars-table:sort` | `{ column, direction }` |
| `ars-table:select` | `{ selectedRows, row, action }` |
| `ars-table:row-click` | `{ row, index }` |
| `ars-info-tile:activate` | `{ originalEventType }` |

### Generic forwarding pattern

```javascript
const events = ["ars-button:click", "ars-toggle:change", "ars-table:sort"];
events.forEach((name) => {
  element.addEventListener(name, (e) => {
    hostEventBus.emit(name, e.detail);
  });
});
```

## 4. Shell-Only Component Caveats

### `ars-page` in `routing-mode="browser"`

Reads/writes `window.location` and `window.history`. In embedded contexts, use `routing-mode="internal"` instead:

```html
<ars-page routing-mode="internal"></ars-page>
```

### `ars-dialog` and `ars-toast` with default mountTarget

These components append to `document.body` by default. In embedded contexts (iframes, shadow roots, panels), always pass `mountTarget` explicitly to prevent elements from appearing outside the intended container.

### All other components

No shell-level assumptions. Safe to mount anywhere — shadow roots, iframes, custom containers.

## 5. Design Adapter in Embedded Contexts

### Standard initialization

```javascript
import { initializeArsWebComponents, getArsWebComponentsDefaultAdapter } from "ars-web-components";

initializeArsWebComponents({
  designAdapter: getArsWebComponentsDefaultAdapter("light"),
});
```

### Iframe contexts

Pass the iframe's document:

```javascript
const iframeDoc = iframe.contentDocument;
initializeArsWebComponents({
  designAdapter: getArsWebComponentsDefaultAdapter("dark"),
  targetDocument: iframeDoc,
});
```

### Shadow root embedding

Components resolve `--arswc-*` tokens via CSS inheritance. Set the tokens on the shadow host element rather than the document root:

```javascript
const host = shadowRoot.host;
const adapter = getArsWebComponentsDefaultAdapter("light");
for (const [name, value] of Object.entries(adapter.cssVariables)) {
  host.style.setProperty(name, value);
}
```

This ensures all child ars-web-components inherit the correct token values without affecting the global document.
