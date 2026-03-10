# ARS Web Components - Structure Improvement Plan

## Executive Summary

This document updates the improvement plan for `ars-web-components` based on the current repository state.

The goal is to improve maintainability, correctness, and package quality without introducing architecture that the project does not currently need.

The revised plan favors:

- incremental refactoring over large rewrites
- better lifecycle and error handling
- modularization of large components, especially `ArsCalendar`
- test modernization aligned with current Vite/Vitest standards
- cleaner source layout and stronger documentation

It explicitly avoids adding a dependency injection container, repository layer, plugin system, or splitting `MixinBase`, since those changes are not justified by the current library shape.

---

## Current Architecture Analysis

### Strengths

- Good separation between components and mixins
- Design-system agnostic direction with CSS variable theming
- ES modules and TypeScript are already in place
- Useful common foundation via `WebComponentBase`
- Pointer coordination already exists for gesture-related mixins
- Test coverage appears substantial, although the exact "323 tests" claim should be re-verified in a fully installed environment

### Main Problems Observed

1. `ArsCalendar` is still a large multi-responsibility component
2. Some lifecycle handling is unsafe or incomplete
3. Attribute parsing and error handling are inconsistent
4. `eval` is still present in core/component code
5. Demos are mixed into `src/`
6. There is duplicated or partially abandoned structure in some areas
7. Debug logging is excessive in production source
8. The test setup should be brought to current Vite/Vitest-based standards used across TypeScript projects

---

## 1. Immediate Structural Fixes

These changes should happen before broader refactors.

### 1.1 Fix Lifecycle Leaks

Some components register global listeners without guaranteed cleanup. This is a correctness issue, not just a style issue.

Priority examples:

- remove `window` listeners in `disconnectedCallback`
- avoid registering long-lived listeners in constructors when possible
- ensure observers and timers are cleaned up

Recommended pattern:

```typescript
class ArsCalendar extends WebComponentBase {
  #onResize = () => this.render();

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this.#onResize);
    this.render();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("resize", this.#onResize);
  }
}
```

### 1.2 Remove `eval`

`eval` should be treated as a high-priority cleanup target.

Areas to address:

- `WebComponentBase`
- `ars-dialog`
- `ars-color-select`

Recommended direction:

- replace string-evaluated handlers with direct function binding
- replace template interpolation through `eval` with direct template building

### 1.3 Normalize Error Handling

Current behavior often falls back to `console.log` or `console.error`. That makes debugging noisy and failure behavior inconsistent.

Recommended direction:

- validate inputs before mutating component state
- fail gracefully on invalid attributes
- emit explicit component-level errors only when useful
- remove noisy debug logs from production code

---

## 2. Modularize `ArsCalendar`

`ArsCalendar` is the strongest candidate for structural improvement.

### Current Issues

The component currently combines:

- default CSS definition
- date calculation
- day slot generation
- color canvas generation
- DOM template generation
- DOM patching and event wiring
- attribute parsing
- global event handling
- mutable shared module state for cell dimensions

### Recommended Improvements

### 2.1 Extract Pure Calendar Utilities

Extract the date and slot logic into pure helpers first. This is low-risk and immediately improves readability and testability.

```typescript
// src/components/ars-calendar/calendar-utils.ts
export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(month: number, year: number): number {
  return new Date(year, month).getDay();
}

export function createEmptyDaySlots(weeks: number, daysPerWeek: number) {
  return new Array(weeks * daysPerWeek).fill(null);
}
```

### 2.2 Extract Rendering Helpers

Keep `ArsCalendar` as the custom element entry point, but move template/style building into adjacent modules.

Recommended structure:

```text
src/components/ars-calendar/
├── ars-calendar.ts
├── ars-calendar.test.ts
├── calendar-utils.ts
├── calendar-render.ts
├── calendar-styles.ts
├── models/
└── README.md
```

This aligns with the project’s current direction better than introducing a general renderer interface or a service/repository stack.

### 2.3 Remove Module-Level Shared State

The shared `cellWidth` and `cellHeight` state should be localized to the component instance or recalculated from DOM state when needed.

Recommended direction:

- store dimensions per instance
- prefer deriving dimensions from rendered elements
- avoid cross-instance mutation

### 2.4 Keep Public API Explicit

Some state should remain public if it is part of the intended component API, but internal working state should be hidden where practical.

Recommended direction:

- keep externally meaningful methods public
- move internal caches and working arrays to private fields where safe
- avoid breaking attribute/property semantics accidentally

Example:

```typescript
class ArsCalendar extends WebComponentBase {
  #daySlots = [];
  #daySlotColors = [];

  public getEventsByDate(day: number, month: number, year: number) {
    // public API
  }
}
```

### 2.5 Consolidate Existing Split Files

There are already separate `ars-calendar-css.ts` and `ars-calendar-html.ts` files in the repo. Before adding new abstractions, consolidate around one structure and remove dead or duplicate paths.

---

## 3. Keep `MixinBase` Intact

`MixinBase` should not be split at this stage.

### Rationale

- It is relatively small
- Its responsibilities are related and cohesive enough for its current size
- Splitting it would add indirection without solving a real current bottleneck
- The bigger problems in the codebase are elsewhere

### Recommended Improvements

Keep `MixinBase` as a single utility base and only make targeted improvements:

- tighten naming and typing
- reduce ad hoc mutable fields where easy
- improve tests if new behavior is added
- keep the surface area stable for existing mixins

This is a maintenance task, not a redesign target.

---

## 4. Source Layout and Package Organization

### Current Issues

1. Demo applications live inside `src/`
2. There are traces of duplicated structure in component folders
3. Production and demo concerns are mixed during navigation

### Recommended Improvements

### 4.1 Move Demos Out of `src`

Recommended target layout:

```text
project-root/
├── src/
├── demos/
│   ├── ars-calendar/
│   ├── ars-dialog/
│   ├── ars-page/
│   └── ...
├── test/
└── docs/
```

Benefits:

- cleaner production source tree
- less noise in TypeScript include/exclude behavior
- clearer ownership of demo-specific assets

### 4.2 Preserve Existing Naming Strategy

Do not rename the whole tree to PascalCase files right now.

Reasons:

- current naming aligns with custom element names
- current exports and paths already follow this convention
- mass renaming would create churn with limited technical benefit

### 4.3 Keep Build-Compatible Style Extraction

The current package builds with `tsc`. Any style extraction should fit that constraint unless build tooling is intentionally changed first.

Recommended direction:

- prefer `calendar-styles.ts` or existing string-based style modules first
- only move to imported `.css` files if the package build is updated to support that cleanly

---

## 5. Error Handling and Validation

### Current Issues

1. JSON attributes are parsed inconsistently
2. Invalid input can throw at runtime
3. Console logging is used where validation or structured fallback would be better

### Recommended Improvements

### 5.1 Add Small, Focused Validators

Use narrow validators for component attributes rather than introducing a large validation framework.

```typescript
export function parseLocalizedDays(value: string): string[] | null {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length === 7 ? parsed : null;
  } catch {
    return null;
  }
}
```

### 5.2 Standardize Parse Behavior in Components

Recommended rules:

- invalid JSON should not crash rendering
- components should retain previous valid state when a new invalid attribute arrives
- warnings should be concise and easy to remove later

### 5.3 Keep Error Handling Lightweight

A full Result/railway-oriented error model is not necessary across the whole library today.

Use simple return values or small helpers where needed instead of pushing a project-wide error abstraction.

---

## 6. Testability

### Current Issues

1. Large components are harder to isolate
2. Some logic is embedded directly inside lifecycle methods
3. Runtime verification depends on the local environment being fully installed
4. The repository still carries legacy Jest/Babel-era dependencies even though the active test runner is `vitest`

### Recommended Improvements

### 6.1 Prefer Pure Helpers for Core Logic

The best testability win is not dependency injection. It is extracting logic into pure functions and small helper modules.

Examples:

- calendar date math
- slot creation
- event filtering
- CSS variable string generation

### 6.2 Bring Tests To Current Vite/Vitest Standards

This project is already using `vite` and `vitest`, and that should remain the standard path for all TypeScript work in this repository.

Recommended direction:

- standardize on `vitest` as the single unit/integration test runner
- keep `jsdom` for component DOM tests
- align test utilities and configuration with Vite-native workflows
- remove legacy Jest/Babel dependencies once they are confirmed unused

Recommended follow-up tasks:

- audit `jest.config.cjs`, `babel.config.json`, and dual setup files
- remove unused Jest-era packages from `package.json`
- keep one primary test setup path unless there is a proven compatibility reason not to
- ensure `npm test`, watch mode, and coverage run through `vitest`

### 6.3 Add Focused Unit Tests for Extracted Helpers

As logic moves out of components:

- test pure helpers directly
- keep component tests focused on DOM/lifecycle behavior
- avoid duplicating the same assertions at both levels

### 6.4 Raise Test Quality To Current Industry Expectations

Modernizing the runner is not enough. The tests should also reflect stronger current practices.

Recommended direction:

- prefer behavior-oriented assertions over implementation-detail assertions
- reduce dependence on internal mutable state in tests
- keep tests deterministic and isolated
- cover invalid-input behavior, lifecycle cleanup, and emitted custom events
- add regression tests for previously fixed bugs

Priority areas:

- lifecycle cleanup and listener removal
- invalid attribute parsing
- `ArsCalendar` rendering helpers after extraction
- components that currently rely on `eval` during rendering or wiring

### 6.5 Re-verify Test Baseline

The repository references 323 tests, but that count should be validated again once dependencies are installed and the suite is runnable in the current environment.

---

## 7. Documentation and API Quality

### Current Issues

1. Documentation coverage is uneven
2. Some public behaviors are discoverable only by reading source
3. Public customization points are not consistently described

### Recommended Improvements

### 7.1 Document Public APIs First

Prioritize:

- component attributes
- public methods
- emitted custom events
- CSS custom properties

### 7.2 Add JSDoc To Stable Public Surface

Example:

```typescript
/**
 * Interactive calendar component with event support.
 *
 * @fires ars-calendar:daySelected
 * @cssprop --ars-calendar-bg
 * @cssprop --ars-calendar-header-bg
 */
class ArsCalendar extends WebComponentBase {}
```

### 7.3 Keep Documentation Close To Code

Current component-level READMEs are useful. Expand them incrementally instead of replacing them with a separate heavy documentation system first.

---

## 8. Changes Not Recommended Right Now

The following ideas are intentionally excluded from the active plan:

- splitting `MixinBase` into multiple base layers
- introducing a DI container
- introducing repository abstractions for component state
- adding a plugin architecture
- introducing a global event bus
- rewriting components around constructor injection
- renaming the entire source tree to PascalCase conventions
- adding a broad domain/infrastructure/application layering model

These may become relevant later, but they are not the right next step for the current project.

---

## Implementation Roadmap

### Phase 1: Correctness and Cleanup

- Remove `eval` from core/component code
- Fix listener, observer, and timer cleanup in lifecycle methods
- Reduce production debug logging
- Re-verify test baseline in a fully installed environment

### Phase 2: Calendar Refactor

- Extract pure calendar utility functions
- Extract rendering/template helpers
- Remove module-level shared dimension state
- Consolidate duplicate calendar structure files

### Phase 3: Validation and API Hardening

- Add focused attribute validators
- Standardize invalid-input behavior
- Introduce private fields for internal-only state where safe
- Improve public API documentation

### Phase 4: Test Modernization

- Standardize fully on Vite/Vitest for TypeScript testing
- Remove unused Jest/Babel-era configuration and dependencies
- Simplify test setup files and test entry points
- Add regression coverage for lifecycle, validation, and rendering edge cases

### Phase 5: Source Layout Improvements

- Move demos out of `src/`
- Clean up duplicate or abandoned files
- Keep build-compatible style organization

---

## Success Metrics

1. No global listener leaks in component lifecycle behavior
2. No production use of `eval`
3. `ArsCalendar` reduced into smaller adjacent modules without breaking public API
4. Invalid attribute input no longer crashes components
5. Tests run through a single Vite/Vitest-based workflow
6. Legacy Jest/Babel testing artifacts removed unless explicitly required
7. Demo code fully separated from production source
8. Public component APIs and CSS variables documented consistently

---

## Conclusion

The right next step for `ars-web-components` is not a large architectural rewrite. It is a focused cleanup and modularization pass.

The plan should center on correctness, smaller component modules, lifecycle safety, better validation, and a cleaner package layout. That gives the project measurable improvement without adding architectural weight that the current library does not need.
