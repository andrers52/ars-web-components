# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.2] - 2025-07-03

- Removed reference to removed component

## [0.4.1] - 2025-07-03

- Moving components to its own dir

## [0.4.0] - 2025-07-03

### Added

- **New Roll Mixin**: Added `RollMixin` for adding roll animation effects to components
- **Enhanced Demo System**: Comprehensive demo pages for all mixins with interactive examples
- **Mixin Base Utility**: New `mixin-base.js` common utility for shared mixin functionality
- **ArsPage Debug Tools**: New debug and test pages for ars-page components (`debug.html`, `minimal-test.html`, `test.html`)
- **ArsCalendar Documentation**: Added comprehensive README.md for the calendar component
- **Stop Script**: Added `npm run stop` command to kill the development server
- **Enhanced Remote Call Demo**: New comprehensive demo with multiple sections and real-time logging

### Changed

- **BREAKING**: Complete mixin directory restructuring - all mixins moved to `-mixin` suffix directories
  - `mixins/localized/` → `mixins/localized-mixin/`
  - `mixins/pressed-effect/` → `mixins/pressed-effect-mixin/`
  - `mixins/remote-call/` → `mixins/remote-call-mixin/`
  - `mixins/show-if-property-true/` → `mixins/show-if-property-true-mixin/`
  - `mixins/swipeable/` → `mixins/swipeable-mixin/`
- **BREAKING**: Removed `ArsButton` component entirely (component and demo files deleted)
- **Enhanced Mixin Architecture**: All mixins refactored with improved structure and better demo integration
- **Improved Demo Experience**: All mixin demos now feature comprehensive examples with better UI/UX

### Removed

- **ArsButton Component**: Complete removal of button component and related files
- **Legacy Mixin Directories**: All old mixin directories and files removed
- **VSCode Launch Configuration**: Removed development-specific launch.json file

### Technical Improvements

- **Better Organization**: Consistent naming convention with `-mixin` suffix for all mixin directories
- **Enhanced Demos**: Interactive demos with real-time feedback and comprehensive examples
- **Improved Maintainability**: Better separation of concerns and cleaner architecture

## [0.3.5] - 2025-06-30

### Changed

- **Remote Call System**: Now uses only component IDs for all remote method calls. The `remote-call-id` attribute is no longer required or supported.
- **Mixins Simplified**: `RemoteCallCallerMixin` and `RemoteCallReceiverMixin` have been refactored to remove all `remote-call-id` and timeout logic. Communication is now strictly ID-based.
- **API Consistency**: All related demos and documentation updated to use the new ID-based API for remote calls.

### Added

- **Assertions**: Components using remote call mixins now assert that they have a valid `id` attribute at runtime, improving reliability and developer feedback.

### Removed

- **Legacy Code**: All code and documentation related to `remote-call-id`, promise-based remote calls, and unnecessary lifecycle/attribute handling have been removed for clarity and simplicity.

## [0.3.4] - 2025-06-29

### Fixed

- **Missing Component Exports**: Added `ArsPage` and `ArsPageController` exports to the main index.js file, making them available for import in applications using the library.
- **Router Integration**: Fixed issue where ars-page and ars-page-controller components were not accessible when imported from the main library entry point.

### Added

- **Component Exports**: `ArsPage` and `ArsPageController` are now properly exported from the main library index.js file.
- **Enhanced Router Support**: Better integration support for applications using the ars-page components for client-side routing.

## [0.3.3] - 2025-06-29

### Changed

- **Remote Call API Modernization**: All remote call events now use `remote-call-result` with a `result` property for responses, replacing the old `remote-call-response`/`data` pattern.
- **Auto-generated callId**: Each remote call now uses a unique, auto-generated callId, preventing collisions and supporting concurrent calls.
- **Robust Navigation**: Navigation components now update reliably after page changes, with improved event bubbling and promise resolution.
- **Event Handling**: All event dispatching and listening is now consistent and robust across shadow DOM and document scopes.

### Fixed

- **Timeouts and UI Sync**: Fixed remote call timeouts and UI sync issues by ensuring correct event propagation and callId usage.

## [0.3.2] - 2025-06-29

### Added

- **Modern Color Palette UI**: Color blocks are now displayed in a responsive grid with borders, shadows, and animated hover effects.
- **Dismiss on Overlay Click**: The color palette overlay can be dismissed by clicking outside the color blocks.
- **Event-driven Integration**: Demo and documentation now show how to update UI text in response to color changes using the `ars-color-select:change` event.

### Changed

- **Improved Accessibility and Usability**: Larger, touch-friendly color blocks with reduced spacing and better alignment.
- **Demo Page**: Updated to show best practices for integrating the color picker and updating UI on color change.

## [0.3.1] - 2025-06-29

### Added

- Minimal, intent-revealing demo for Show If Property True Mixin: each property toggle controls a single bar/button.
- `keep-space-when-hidden` attribute: allows elements to remain in the layout (using `visibility: hidden`) when hidden.
- Improved documentation and usage examples for the mixin.

### Changed

- Demo refactored for clarity and simplicity.

## [0.3.0] - 2025-06-27

### Added

- **Functional Programming Architecture**: Refactored all components and mixins to use pure functions and functional programming principles
- **Private Static Methods**: Encapsulated utility functions as private static methods (`static #methodName`) for better organization
- **Private Instance Methods**: Converted underscore-prefixed methods to proper private methods (`#methodName`) for better encapsulation
- **Enhanced Testability**: Extracted pure utility functions that can be tested independently
- **Improved Maintainability**: Better separation of concerns with functional utility functions
- **Zero Breaking Changes**: All refactoring maintains complete API compatibility

### Changed

- **Component Architecture**: All components now use functional utility functions while maintaining class structure required by Custom Elements API
- **Method Encapsulation**:
  - Public static methods: Only methods meant to be called from outside the class
  - Private static methods: Internal utility functions and helpers
  - Private instance methods: Internal component logic using `#` prefix
- **Import/Export System**: Fixed all ES module imports to use named exports instead of default exports
- **Demo Error Handling**: Added comprehensive error handling to all demo pages to prevent undefined function errors
- **Console Cleanup**: Removed debug console.log statements from demo pages for cleaner development experience

### Fixed

- **Import Errors**: Fixed all mixin import statements to use proper named exports
- **Undefined Function Errors**: Added error handling to onclick handlers in demo pages
- **Module Compatibility**: Ensured all components work properly with ES modules in browser environment
- **Demo Functionality**: Fixed all demo pages to work without Node.js dependencies
- **Remote Call Mixin**: Added missing `_callRemote` method and fixed event handling system
- **Browser Compatibility**: Removed Node.js-specific code and dependencies

### Technical Improvements

- **Functional Refactoring**: Extracted pure functions for better testability and reusability
- **Method Organization**: Clear distinction between public API and internal implementation
- **Code Quality**: Improved maintainability through better function organization
- **Development Experience**: Cleaner console output and better error handling in demos

## [0.2.4] - 2025-06-27

### Changed

- **README**: Improved demo access instructions with clear setup steps using `npm start` command
- **README**: Replaced non-functional GitHub Pages link with practical clone-and-run instructions
- **Documentation**: Enhanced user experience for accessing the interactive demo without complex setup

### Added

- **README**: Added prominent "Live Demo" section with quick start instructions
- **README**: Comprehensive mixins documentation with usage examples and demo links
- **README**: Updated available exports section to include all mixin exports

### Fixed

- **Demo Access**: Resolved issue where users couldn't view demo due to ES module requirements
- **Documentation**: Fixed demo link that pointed to non-existent GitHub Pages setup

## [0.2.3] - 2025-06-27

### Fixed

- **PressedEffect Mixin Demo**: Fixed pressed effect animation issues where only one button showed the effect. Replaced gradient backgrounds with solid colors and simplified color detection logic for better compatibility.
- **Localized Mixin Demo**: Completely refactored demo to use actual Localized mixin instead of custom localization system. Created custom elements extending Localized mixin with mock localization system for dynamic language switching.
- **RemoteCall Mixin Demo**: Replaced placeholder demo with comprehensive interactive demo featuring caller and receiver components, method calls, error handling, and real-time logging. Fixed event listener issues and implemented component ID-based targeting system.

### Added

- **PressedEffect Demo**: Added debugging logs to verify event listeners and animation triggers, confirming proper functionality.
- **Localized Demo**: Implemented mock localization system with dynamic language switching, custom elements extending Localized mixin, and proper event handling.
- **RemoteCall Demo**: Created full-featured demo with:
  - Interactive caller and receiver components
  - Method call functionality with parameter passing
  - Error handling and validation
  - Real-time logging system
  - Component ID-based targeting (allowing multiple instances)
  - Color-coded UI for better user experience
  - Individual and simultaneous method calling capabilities
- **Enhanced Demo Architecture**: Improved demo structure with better error handling, lifecycle management, and user feedback systems.

### Technical Changes

- **PressedEffect**: Enhanced color detection to work with solid background colors instead of gradients
- **Localized**: Implemented proper mixin inheritance and mock localization system
- **RemoteCall**: Switched from tag name-based to component ID-based event targeting for better component isolation
- **Demo Infrastructure**: Added comprehensive debugging and logging systems across all mixin demos

## [0.2.2] - 2025-06-27

### Fixed

- **Dialog**: Fixed styling for form elements (`input`, `select`, `textarea`) inside dialogs, even when content is injected as light DOM HTML.
- **Dialog**: Prevented content overflow in dialog area with improved box-sizing and max-width rules.

### Added

- **Dialog**: Automatic injection of form element CSS into dialog content for light DOM HTML, ensuring consistent appearance.
- **Dialog**: Enhanced documentation for dialog theming, CSS variables, and light DOM styling system.

### Technical Changes

- Dialog component now injects a `<style>` tag with form element CSS into the `.content` area after rendering, so form fields are always styled.
- Updated dialog CSS to use `box-sizing: border-box` and `max-width: 100%` for containers.
- Updated README.md to document dialog styling and theming system.

## [0.2.1] - 2025-06-26

### Added

- **New**: Built-in CSS and HTML template integration for ArsCalendar
- **New**: Comprehensive CSS customization system with CSS variables support
- **New**: `custom-css` attribute for adding custom styles to calendar
- **New**: `css-vars` attribute for JSON-based CSS variable theming
- **New**: `setCustomTemplate()` method for complete HTML template override
- **New**: `setCSSVars()` and `getCSSVars()` methods for programmatic theming
- **New**: Three preset themes in test suite: Dark, Blue, and Green
- Enhanced calendar test page with live theme switching demonstration

### Changed

- ArsCalendar now includes default CSS styles directly in the component
- Removed dependency on external CSS and HTML template files
- Improved component self-containment while maintaining customization flexibility
- Updated component architecture to support both default and custom styling

### Fixed

- Enhanced template rendering with better error handling
- Improved CSS variable application and inheritance
- Fixed calendar cell selection styling with proper class management

### Technical Changes

- Default CSS uses CSS custom properties for easy theming
- Template function now supports dynamic content injection
- Better separation of concerns between default and custom styling
- Improved component modularity and reusability

## [0.2.0] - 2025-06-26

### Added

- **New**: Professional test suite interface with comprehensive component overview
- **New**: `npm start` script using http-server for instant development setup
- **New**: Beautiful landing page (index.html) linking all component tests
- Direct script import support for loading components without ES module imports
- Enhanced README.md with comprehensive documentation and usage examples
- Better component integration examples for real-world applications
- Co-development setup documentation with symlink instructions

### Changed

- **BREAKING**: ArsButton component is now purely CSS-agnostic (no inline styling)
- Removed `base-color` attribute from ArsButton to separate functionality from styling
- Added `effect-color` attribute for pressed effect animations
- Improved component architecture to work better with external CSS frameworks

### Fixed

- **Critical**: Fixed `setTimeout` parameter order bug in PressedEffect mixin
- Fixed constructor call order in both ArsButton and PressedEffect classes
- Enhanced color parsing in PressedEffect to handle hex, rgb, and rgba formats
- Added fallback color handling when background color detection fails
- Fixed component registration issues in complex application environments

### Technical Changes

- Components now work seamlessly with both ES module imports and direct script loading
- Improved symlink support for co-development scenarios
- Better integration with import maps in modern web applications
- Enhanced cross-project compatibility

## [0.1.0] - Initial Release

### Added

- ArsButton component with custom events and pressed effects
- ArsCalendar interactive calendar component
- ArsDialog modal component
- ArsColorSelect color picker component
- WebComponentBase foundation class
- Multiple mixins: Localized, PressedEffect, RemoteCallCallerMixin, etc.
- Basic ES module support
- Initial test pages for all components
