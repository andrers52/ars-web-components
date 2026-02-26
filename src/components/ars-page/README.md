# ARS Page Router

A web component-based router that provides URL integration and nested routing capabilities for modern web applications.

## Features

- **URL Integration**: Automatically updates browser URL when navigating between pages
- **Nested Routes**: Support for complex route hierarchies with parent-child relationships
- **Browser History**: Full support for browser back/forward buttons
- **Web Component Base**: Extends the WebComponentBase for enhanced attribute handling
- **Event-Driven**: Custom events for page changes and navigation
- **Flexible Navigation**: Support for both page-based and route-based navigation

## Basic Usage

### Simple Page Navigation

```html
<ars-page id="my-router" default-page="home">
  <div id="home">Home page content</div>
  <div id="about">About page content</div>
  <div id="contact">Contact page content</div>
</ars-page>

<ars-page-controller target-page="my-router">
  <nav>
    <a href="#" data-page="home">Home</a>
    <a href="#" data-page="about">About</a>
    <a href="#" data-page="contact">Contact</a>
  </nav>
</ars-page-controller>
```

### URL-Based Routing

```html
<ars-page id="my-router" 
          routes='{"dashboard":"/dashboard","settings":{"systemConfig":"/settings/system-config","tradingPairs":"/settings/trading-pairs"}}' 
          default-page="dashboard">
  <div id="dashboard">Dashboard content</div>
  <div id="settings">Settings content</div>
</ars-page>

<ars-page-controller target-page="my-router">
  <nav>
    <a href="#" data-page="dashboard">Dashboard</a>
    <a href="#" data-route="/settings/system-config">System Config</a>
    <a href="#" data-route="/settings/trading-pairs">Trading Pairs</a>
  </nav>
</ars-page-controller>
```

## Route Configuration

The `routes` attribute accepts a JSON object that maps page IDs to URL paths:

```javascript
{
  "dashboard": "/dashboard",
  "bots": "/bots", 
  "simulation": "/simulation",
  "analytics": "/analytics",
  "configs": "/configs",
  "settings": {
    "systemConfig": "/settings/system-config",
    "tradingPairs": "/settings/trading-pairs",
    "exchanges": "/settings/exchanges",
    "trader": "/settings/trader",
    "strategies": "/settings/strategies",
    "logging": "/settings/logging",
    "auditLog": "/settings/audit-log"
  }
}
```

### Navigation Types

The controller supports two types of navigation:

1. **Page-based navigation**: Use `data-page` attribute
   ```html
   <a href="#" data-page="dashboard">Dashboard</a>
   ```

2. **Route-based navigation**: Use `data-route` attribute
   ```html
   <a href="#" data-route="/settings/trading-pairs">Trading Pairs</a>
   ```

## API Reference

### Attributes

- `default-page`: The page ID to show when no route is specified
- `routes`: JSON object mapping page IDs to URL paths

### Methods

#### `showPage(pageId)`
Shows the page with the specified ID and updates the URL.

```javascript
const router = document.querySelector('#my-router');
router.showPage('dashboard');
```

#### `navigateToRoute(route)`
Navigates to a specific route.

```javascript
const router = document.querySelector('#my-router');
router.navigateToRoute('/settings/trading-pairs');
```

#### `getCurrentPage()`
Returns information about the current page.

```javascript
const router = document.querySelector('#my-router');
const pageInfo = router.getCurrentPage();
console.log(pageInfo.currentPage); // "dashboard"
console.log(pageInfo.currentRoute); // "/dashboard"
```

#### `getCurrentRoute()`
Returns information about the current route.

```javascript
const router = document.querySelector('#my-router');
const routeInfo = router.getCurrentRoute();
console.log(routeInfo.currentRoute); // "/settings/trading-pairs"
console.log(routeInfo.availableRoutes); // ["/dashboard", "/bots", ...]
```

#### `getPageInfo()`
Returns comprehensive information about the router state.

```javascript
const router = document.querySelector('#my-router');
const info = router.getPageInfo();
console.log(info);
// {
//   currentPage: "dashboard",
//   availablePages: ["dashboard", "bots", "settings"],
//   totalPages: 3,
//   defaultPage: "dashboard",
//   currentRoute: "/dashboard",
//   routes: { ... }
// }
```

### Events

#### `ars-page:page-changed`
Fired when the current page changes.

```javascript
document.addEventListener('ars-page:page-changed', (event) => {
  console.log('Page changed:', event.detail);
  // {
  //   previousPage: "home",
  //   currentPage: "dashboard", 
  //   pageElement: <div>,
  //   route: "/dashboard"
  // }
});
```

## Advanced Features

### Nested Routes

The router supports nested route structures for complex applications:

```javascript
{
  "dashboard": "/dashboard",
  "settings": {
    "systemConfig": "/settings/system-config",
    "tradingPairs": "/settings/trading-pairs",
    "exchanges": "/settings/exchanges"
  }
}
```

### Browser History Integration

The router automatically:
- Updates the browser URL when navigating
- Responds to browser back/forward buttons
- Maintains proper browser history state

### Programmatic Navigation

You can navigate programmatically from JavaScript:

```javascript
// Navigate by page ID
router.showPage('dashboard');

// Navigate by route
router.navigateToRoute('/settings/trading-pairs');

// Use browser history
window.history.back();
window.history.forward();
```

## Demo

See the [demo page](./demo/index.html) for a complete example with:
- Main navigation pages
- Nested settings routes
- URL display
- Demo controls
- Route information display

## Browser Support

- Modern browsers with Web Components support
- ES6 modules
- History API
- Custom Events

## Dependencies

- `web-component-base.js`: Base class for enhanced attribute handling
- `remote-call-mixin`: For inter-component communication (used by controller)

## Migration from Previous Version

If you're upgrading from the previous version:

1. The component now extends `WebComponentBase` instead of `HTMLElement`
2. Add the `routes` attribute to enable URL integration
3. Update your navigation to use `data-route` for route-based navigation
4. The component now automatically handles browser history

The old API methods (`showPage`, `hidePage`, etc.) remain compatible. 