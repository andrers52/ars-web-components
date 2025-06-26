# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-06-26

### Added

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
- Multiple mixins: Localized, PressedEffect, RemoteCallCaller, etc.
- Basic ES module support
- Initial test pages for all components
