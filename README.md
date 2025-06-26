# ARS Web Components

A modern collection of reusable web components built with vanilla JavaScript and ES modules.

## Features

- **🎯 Pure JavaScript**: No framework dependencies, works with any modern web project
- **🎨 CSS-friendly**: Components are styling-agnostic, use your own CSS classes
- **⚡ ES Modules**: Modern module system with proper imports/exports
- **🔧 Interactive Effects**: Built-in pressed effects and animations
- **📱 Touch Support**: Full mobile and desktop interaction support

## Installation

```bash
npm install ars-web-components
```

## Usage

### Method 1: ES Module Import (Recommended)

```javascript
import { ArsButton } from "ars-web-components";
```

### Method 2: Direct Script Import

For projects that need to load components directly without bundling:

```html
<script type="module" src="./node_modules/ars-web-components/index.js"></script>
```

## Components

### ArsButton

Enhanced button with custom events and pressed effects.

```html
<button
  is="ars-button"
  id="myButton"
  class="my-button-style"
  effect-color="#00d4ff"
>
  Click me!
</button>
```

**Attributes:**

- `effect-color`: Color for the pressed animation effect (optional)

**Events:**

- `ars-button:${id}:click`: Fired when button is clicked

### ArsCalendar

Interactive calendar component.

### ArsDialog

Modal dialog component.

### ArsColorSelect

Color picker component.

## Development

### Testing Components

Start a local server in the ars-web-components directory:

```bash
cd ars-web-components
python3 -m http.server 8080
```

Then visit:

- **ars-button**: http://localhost:8080/ars-button/test/index.html
- **ars-calendar**: http://localhost:8080/ars-calendar/test/index.html
- **ars-dialog**: http://localhost:8080/ars-dialog/test/index.html

### Co-development Setup

For projects that need to develop alongside ars-web-components, you can set up symlinks:

```bash
# In your project's node_modules
ln -s ../../../../ars-web-components ars-web-components-dev
```

### Available Exports

Check `index.js` in the package root for all available imports:

```javascript
export { ArsButton } from "./ars-button/ars-button.js";
export { ArsCalendar } from "./ars-calendar/ars-calendar.js";
export { ArsColorSelect } from "./ars-color-select/ars-color-select.js";
export { ArsDialog } from "./ars-dialog/ars-dialog.js";
export { WebComponentBase } from "./web-component-base/web-component-base.js";
// Mixins
export { Localized } from "./mixins/localized/localized.js";
export { PressedEffect } from "./mixins/pressed-effect/pressed-effect.js";
// ... and more
```

## Requirements

- Modern browser with ES module support
- `arslib` dependency (automatically installed)

## License

MIT
