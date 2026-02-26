# Draggable Mixin

A web component mixin that adds drag gesture detection to any element. Supports drag start, move, and end events with customizable thresholds and seamless coordination with other mixins.

## Features

- **Drag Detection**: Detects when dragging starts, moves, and ends
- **Customizable Threshold**: Adjustable minimum distance to start dragging
- **Direction Detection**: Tracks drag direction (left, right, up, down)
- **Event Dispatching**: Automatically dispatches drag events
- **Mixin Coordination**: Works with other mixins using PointerCoordinator
- **Performance Optimized**: Efficient pointer event handling
- **Easy Integration**: Simple mixin pattern for any component

## Usage

### Basic Usage

```html
<draggable-mixin drag-threshold="5">
  <div>Drag me!</div>
</draggable-mixin>
```

### JavaScript Event Handling

```javascript
const draggable = document.querySelector('draggable-mixin');

// Listen for drag start
draggable.addEventListener('dragstart', (e) => {
  console.log('Drag started:', e.detail);
  // e.detail contains: startX, startY, currentX, currentY, deltaX, deltaY, distance, direction
});

// Listen for drag move
draggable.addEventListener('dragmove', (e) => {
  console.log('Dragging:', e.detail);
  // Real-time updates during drag
});

// Listen for drag end
draggable.addEventListener('dragend', (e) => {
  console.log('Drag ended:', e.detail);
  // e.detail contains: startX, startY, endX, endY, deltaX, deltaY, distance, direction, wasDragging
});
```

### Programmatic Control

```javascript
const draggable = document.querySelector('draggable-mixin');

// Set drag threshold
draggable.setDragThreshold(10); // 10px minimum distance

// Get current threshold
console.log(draggable._dragThreshold);
```

## Attributes

- `drag-threshold`: Minimum distance in pixels to start dragging (default: 5)

## Events

### dragstart
Fired when dragging begins (after threshold is met).

**Event Detail:**
```javascript
{
  startX: number,      // Starting X coordinate
  startY: number,      // Starting Y coordinate
  currentX: number,    // Current X coordinate
  currentY: number,    // Current Y coordinate
  deltaX: number,      // X distance from start
  deltaY: number,      // Y distance from start
  distance: number,    // Total distance from start
  direction: string    // "left", "right", "up", or "down"
}
```

### dragmove
Fired continuously while dragging.

**Event Detail:**
```javascript
{
  startX: number,      // Starting X coordinate
  startY: number,      // Starting Y coordinate
  currentX: number,    // Current X coordinate
  currentY: number,    // Current Y coordinate
  deltaX: number,      // X distance from start
  deltaY: number,      // Y distance from start
  distance: number,    // Total distance from start
  direction: string,   // "left", "right", "up", or "down"
  isDragging: boolean  // Always true for dragmove events
}
```

### dragend
Fired when dragging ends.

**Event Detail:**
```javascript
{
  startX: number,      // Starting X coordinate
  startY: number,      // Starting Y coordinate
  endX: number,        // Final X coordinate
  endY: number,        // Final Y coordinate
  deltaX: number,      // Total X distance
  deltaY: number,      // Total Y distance
  distance: number,    // Total distance
  direction: string,   // "left", "right", "up", or "down"
  wasDragging: boolean // True if element was actually dragged
}
```

## Mixin Coordination

The DraggableMixin uses the PointerCoordinator to work seamlessly with other mixins like SwipeableMixin. Only one mixin can capture a pointer at a time, but all mixins receive the events through redispatching.

### Example with SwipeableMixin

```html
<draggable-mixin drag-threshold="10">
  <swipeable-mixin min-swipe-distance="30" max-swipe-time="800">
    <div>Drag for movement, swipe for quick actions</div>
  </swipeable-mixin>
</draggable-mixin>
```

In this example:
- Dragging will trigger drag events
- Quick swipes will trigger swipe events
- Both mixins coordinate through PointerCoordinator

## Styling

The mixin provides a basic shadow DOM structure. You can style the host element and its children:

```css
draggable-mixin {
  cursor: grab;
  transition: transform 0.2s ease;
}

draggable-mixin:active {
  cursor: grabbing;
}

/* Style during drag */
draggable-mixin.dragging {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}
```

## Browser Support

- Modern browsers with Pointer Events support
- Touch devices (mobile, tablets)
- Desktop with mouse support
- Fallback to mouse events on older browsers

## Dependencies

- WebComponentBase
- MixinBase
- PointerCoordinator (for mixin coordination)

## Examples

See the [demo page](./demo/) for interactive examples and usage patterns. 