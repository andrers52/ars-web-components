# ARS Data Roller

A dynamic web component that displays an array of data items one by one with smooth 3D rotation animations. Perfect for showing changing information like status updates, statistics, or rotating content.

## Features

- **Smooth 3D Animations**: Beautiful rotation transitions between data items
- **Multiple Data Formats**: Supports strings, title-value objects, and key-value objects
- **Customizable Timing**: Configurable intervals and animation durations
- **Programmatic Control**: JavaScript API for manual control
- **Responsive Design**: Works on all screen sizes
- **No Dependencies**: Pure web components, no framework required

## Usage

### Basic HTML

```html
<!-- Simple string array -->
<ars-data-roller data='["Hello", "World", "Welcome"]'></ars-data-roller>

<!-- With custom timing -->
<ars-data-roller
  data='[{"title": "CPU", "value": "45%"}, {"title": "Memory", "value": "2.3GB"}]'
  interval="2000"
  animation-duration="500"
>
</ars-data-roller>
```

### JavaScript API

```javascript
// Get component reference
const roller = document.getElementById("myRoller");

// Control playback
roller.startRolling();
roller.stopRolling();
roller.nextItem();

// Update data
roller.setData(["New", "Data", "Array"]);
roller.setInterval(3000);
roller.setAnimationDuration(800);
```

## Attributes

| Attribute            | Type       | Default | Description                      |
| -------------------- | ---------- | ------- | -------------------------------- |
| `data`               | JSON Array | `[]`    | Array of items to display        |
| `interval`           | Number     | `3000`  | Milliseconds between transitions |
| `animation-duration` | Number     | `500`   | Milliseconds for animation       |

## Data Formats

### Strings

```javascript
["Hello World", "Welcome to ARS", "Data Roller Demo"];
```

### Title-Value Objects

```javascript
[
  { title: "CPU Usage", value: "45%" },
  { title: "Memory", value: "2.3GB" },
  { title: "Network", value: "1.2MB/s" },
];
```

### Key-Value Objects

```javascript
[
  { name: "John Doe", age: 30, city: "New York" },
  { name: "Jane Smith", age: 25, city: "Los Angeles" },
];
```

## Methods

| Method                     | Description                   |
| -------------------------- | ----------------------------- |
| `startRolling()`           | Start automatic rotation      |
| `stopRolling()`            | Stop automatic rotation       |
| `restartRolling()`         | Restart automatic rotation    |
| `nextItem()`               | Manually advance to next item |
| `setData(array)`           | Update the data array         |
| `setInterval(ms)`          | Change the interval           |
| `setAnimationDuration(ms)` | Change animation duration     |

## Examples

### Trading Statistics

```html
<ars-data-roller
  data='[{"title": "BTC Price", "value": "$45,230"}, {"title": "24h Volume", "value": "$2.1B"}]'
  interval="2500"
>
</ars-data-roller>
```

### System Monitor

```html
<ars-data-roller
  data='[{"title": "CPU", "value": "23%"}, {"title": "RAM", "value": "4.2GB"}]'
  interval="3000"
>
</ars-data-roller>
```

### Social Media Feed

```html
<ars-data-roller
  data='["New post from @technews", "3 new followers", "Like from @developer"]'
  interval="4000"
>
</ars-data-roller>
```

## Installation

```bash
npm install ars-web-components
```

```javascript
import { ArsDataRoller } from "ars-web-components";
```

## Browser Support

- Chrome 67+
- Firefox 63+
- Safari 11.1+
- Edge 79+

## License

MIT License - see LICENSE file for details.

## Styling the Data Roller

You can style the roller using CSS variables for background, text color, border radius, font size, and label color:

```css
ars-data-roller.custom-theme {
  --ars-roller-bg: #222;
  --ars-roller-color: #fff;
  --ars-roller-radius: 16px;
  --ars-roller-font-size: 1.2em;
  --ars-roller-label-color: #90caf9;
}
```

Then use it in HTML:

```html
<ars-data-roller
  class="custom-theme"
  data='[{"title": "Styled!", "value": "🎨"}, {"title": "Dark Mode", "value": "Enabled"}]'
></ars-data-roller>
```

**Available CSS Variables:**

- `--ars-roller-bg`: Background color of the roller (default: transparent)
- `--ars-roller-color`: Text color (default: inherit)
- `--ars-roller-radius`: Border radius (default: 8px)
- `--ars-roller-font-size`: Font size (default: 1em)
- `--ars-roller-label-color`: Label color (default: #2196f3)
