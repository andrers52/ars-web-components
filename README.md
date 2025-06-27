# ARS Web Components

A collection of reusable web components built with vanilla JavaScript and ES modules.

## 🚀 Live Demo

**[Try the Interactive Demo →](https://andrers52.github.io/ars-web-components/)**

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

## Demo

```bash
npm start
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
  "Dialog Title",
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

Color picker component.

## Mixins

ARS Web Components includes a collection of reusable mixins that can be applied to any web component to add specific functionality.

### PressedEffect Mixin

Adds pressed animation effects to components with solid background colors.

```javascript
import { PressedEffect } from "ars-web-components";

class MyButton extends PressedEffect(HTMLElement) {
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

**Demo:** http://localhost:8080/mixins/pressed-effect/demo/

### Localized Mixin

Provides localization capabilities for components with dynamic language switching.

```javascript
import { Localized } from "ars-web-components";

class LocalizedComponent extends Localized(HTMLElement) {
  constructor() {
    super();
    this.setLocalizedText({
      en: "Hello World",
      es: "Hola Mundo",
      fr: "Bonjour le Monde",
    });
  }
}
```

**Features:**

- Dynamic language switching
- Text localization support
- Event-driven updates
- Mock localization system for testing

**Demo:** http://localhost:8080/mixins/localized/demo/

### RemoteCall Mixin

Enables inter-component communication through method calls and event dispatching.

```javascript
import { RemoteCallCaller, RemoteCallReceiver } from "ars-web-components";

// Receiver component
class MyReceiver extends RemoteCallReceiver(HTMLElement) {
  constructor() {
    super();
    this.exposeMethod("greet", (name) => `Hello ${name}!`);
  }
}

// Caller component
class MyCaller extends RemoteCallCaller(HTMLElement) {
  async callRemote() {
    const result = await this.callRemote("receiver-id", "greet", "World");
    console.log(result); // "Hello World!"
  }
}
```

**Features:**

- Component ID-based targeting
- Method call with parameters
- Error handling and validation
- Real-time logging
- Support for multiple receiver instances

**Demo:** http://localhost:8080/mixins/remote-call/demo/

### ShowIfPropertyTrue Mixin

Conditionally shows/hides components based on property values.

```javascript
import { ShowIfPropertyTrue } from "ars-web-components";

class ConditionalComponent extends ShowIfPropertyTrue(HTMLElement) {
  constructor() {
    super();
    this.showIfPropertyTrue("visible", true);
  }
}
```

**Demo:** http://localhost:8080/mixins/show-if-property-true/demo/

### Swipeable Mixin

Adds swipe gesture support to components.

```javascript
import { Swipeable } from "ars-web-components";

class SwipeableComponent extends Swipeable(HTMLElement) {
  constructor() {
    super();
    this.onSwipeLeft = () => console.log("Swiped left!");
    this.onSwipeRight = () => console.log("Swiped right!");
  }
}
```

**Demo:** http://localhost:8080/mixins/swipeable/demo/

## Development

### Quick Start

Start the development server with all component tests:

```bash
cd ars-web-components
npm start
```

This will:

- Start an HTTP server on port 8080
- Open your browser automatically
- Display a comprehensive test suite interface

### Testing Components

Once the server is running, you can access:

- **Main Test Suite**: http://localhost:8080/
- **Individual Components**:
  - **ars-button**: http://localhost:8080/ars-button/test/
  - **ars-calendar**: http://localhost:8080/ars-calendar/test/
  - **ars-dialog**: http://localhost:8080/ars-dialog/test/

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
export { RemoteCallCaller } from "./mixins/remote-call/remote-call-caller.js";
export { RemoteCallReceiver } from "./mixins/remote-call/remote-call-receiver.js";
export { ShowIfPropertyTrue } from "./mixins/show-if-property-true/show-if-property-true.js";
export { Swipeable } from "./mixins/swipeable/swipeable.js";
```

## Requirements

- Modern browser with ES module support
- `arslib` dependency (automatically installed)

## License

MIT
