# ARS Web Components

A collection of reusable web components built with vanilla JavaScript and ES modules.

## 🚀 Live Demo

Check out the [live demo](https://andrers52.github.io/src/projects/ars-web-components/).

**Alternative:** Download the repository and open `index.html` in a local web server.

## Features

- **🎯 Pure JavaScript**: No framework dependencies, works with any modern web project
- **🎨 CSS-friendly**: Components are styling-agnostic, use your own CSS classes
- **⚡ ES Modules**: Modern module system with proper imports/exports
- **🔧 Interactive Effects**: Built-in pressed effects and animations
- **📱 Touch Support**: Full mobile and desktop interaction support
- **🧪 Functional Architecture**: Pure functions and functional programming principles for better testability
- **🔒 Proper Encapsulation**: Private methods and static utilities for clean API design

## Architecture

### Functional Programming Design

ARS Web Components uses functional programming principles while maintaining the class structure required by the Custom Elements API:

- **Pure Functions**: Utility functions are extracted as pure functions for better testability
- **Private Methods**: Internal logic uses proper private methods (`#methodName`) for encapsulation
- **Static Utilities**: Helper functions are organized as private static methods (`static #methodName`)
- **Public API**: Only methods meant to be called externally are exposed as public static methods

### Method Organization

```javascript
class MyComponent extends HTMLElement {
  // Public static methods - meant to be called from outside
  static get observedAttributes() {
    return ["attr1", "attr2"];
  }

  // Private static methods - internal utilities
  static #validateInput(input) {
    /* validation logic */
  }
  static #createElement(tag, props) {
    /* element creation */
  }

  // Private instance methods - internal component logic
  #handleClick() {
    /* click handling */
  }
  #updateDisplay() {
    /* display updates */
  }

  // Public instance methods - component API
  publicMethod() {
    /* public functionality */
  }
}
```

## Installation

```bash
npm install ars-web-components
```

## Usage

### Method 1: ES Module Import (Recommended)

```javascript
import { ArsCalendar } from "ars-web-components";
```

### Method 2: Direct Script Import

For projects that need to load components directly without bundling:

```html
<script type="module" src="./node_modules/ars-web-components/index.js"></script>
```

## Components

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

Color picker component with improved UI and UX.

```html
<ars-color-select id="myColorPicker" color="Blue"></ars-color-select>
```

**Features:**

- Modern, touch-friendly color palette with grid layout
- Color blocks have a border, shadow, and animated hover effect
- Palette overlay can be dismissed by clicking outside the color blocks
- Emits `ars-color-select:change` event with `{ id, color }` detail
- Easy integration: update any text or UI in response to color changes

**Usage Example:**

```html
<span id="selectedColorText">Press the element below to change its color.</span>
<ars-color-select id="colorSelect1"></ars-color-select>
<script>
  const colorSelect = document.getElementById("colorSelect1");
  const colorText = document.getElementById("selectedColorText");
  colorSelect.addEventListener("ars-color-select:change", (e) => {
    colorText.textContent = `Selected Color: ${e.detail.color}`;
  });
</script>
```

**Attributes:**

- `color`: Initial color (optional). If not provided, a random color is selected.

**Events:**

- `ars-color-select:change`: Fired when a color is selected or changed.

### ArsPage & ArsPageController

Component-based router and navigation controls for web applications, using the new remote-call API for inter-component communication.

#### ArsPage

```html
<ars-page id="my-router" default-page="home">
  <div id="home">Home page content</div>
  <div id="about">About page content</div>
  <div id="contact">Contact page content</div>
</ars-page>
```

**Attributes:**

- `default-page`: The page to show initially
- `remote-call-id`: (optional) For remote-call targeting

#### ArsPageController

```html
<ars-page-controller
  target-page="my-router"
  navigation-type="buttons"
></ars-page-controller>
```

**Attributes:**

- `target-page`: The ID of the `ars-page` component to control
- `navigation-type`: `buttons`, `tabs`, or `dropdown` (default: `buttons`)
- `show-current`: Whether to highlight the current page (default: `true`)

**Features:**

- Component-based routing
- Multiple navigation types (buttons, tabs, dropdown)
- Remote method calling (uses the new remote-call API)
- Event-driven architecture
- Easy to integrate

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

**Demo:** http://localhost:8080/mixins/pressed-effect-mixin/demo/

### Localized Mixin

Provides localization capabilities for components with dynamic language switching.

```javascript
import { LocalizedMixin } from "ars-web-components";

class LocalizedComponent extends LocalizedMixin(HTMLElement) {
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

**Demo:** http://localhost:8080/mixins/localized-mixin/demo/

### RemoteCall Mixin

Enables inter-component communication through method calls and event dispatching **using only component IDs**. The `remote-call-id` attribute is no longer required or supported.

```javascript
import {
  RemoteCallCallerMixin,
  RemoteCallReceiverMixin,
} from "ars-web-components";

// Receiver component (must have an id!)
class MyReceiver extends RemoteCallReceiverMixin(HTMLElement) {
  constructor() {
    super();
    this.id = "my-receiver"; // REQUIRED
    this.exposeMethod("greet", (name) => `Hello ${name}!");
  }
}

// Caller component
class MyCaller extends RemoteCallCallerMixin(HTMLElement) {
  callRemoteGreet() {
    this._callRemote("my-receiver", "greet", "World");
  }
}
```

**Important:** Components using these mixins must have a unique `id` attribute.

**Features:**

- Component ID-based targeting (no more remote-call-id)
- Method call with parameters
- Error handling and validation
- Real-time logging
- Support for multiple receiver instances

**Demo:** http://localhost:8080/mixins/remote-call-mixin/demo/

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

**Demo:** http://localhost:8080/mixins/show-if-property-true-mixin/demo/

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

**Demo:** http://localhost:8080/mixins/swipeable-mixin/demo/

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

**Demo:** http://localhost:8080/mixins/roll-mixin/demo/

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

Start the development server with all component demos:

```bash
cd ars-web-components
npm install
npm start
```

This will:

- Start an HTTP server on port 8080
- Open your browser automatically
- Display a demo of the available components and mixins

### Eperimenting with Components and mixins

Once the server is running, you can access:

- **Main Demo Gallery**: http://localhost:8080/
- **Individual Components**:
  - **ars-calendar**: http://localhost:8080/components/ars-calendar/demo/
  - **ars-dialog**: http://localhost:8080/components/ars-dialog/demo/

### Co-development Setup

For projects that need to develop alongside ars-web-components, you can set up symlinks:

```bash
# In your project's node_modules
ln -s ../../../../ars-web-components ars-web-components-dev
```

### Available Exports

Check `index.js` in the package root for all available imports:

```javascript
export { ArsCalendar } from "./components/ars-calendar/ars-calendar.js";
export { ArsColorSelect } from "./components/ars-color-select/ars-color-select.js";
export { ArsDialog } from "./components/ars-dialog/ars-dialog.js";
export { ArsPageController } from "./components/ars-page/ars-page-controller.js";
export { ArsPage } from "./components/ars-page/ars-page.js";
export { WebComponentBase } from "./components/web-component-base/web-component-base.js";

// Mixins
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
- `arslib` dependency (automatically installed)

## License

MIT
