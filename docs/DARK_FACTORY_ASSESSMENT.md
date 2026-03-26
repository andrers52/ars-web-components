# ars-web-components — Dark Factory Assessment

**Date:** 2026-03-25
**Version assessed:** 0.9.1

## Context

`ars-web-components` is a public, MIT-licensed, zero-dependency web component library. This assessment evaluates how it stands in relation to the Dark Factory vision while respecting the constraint that the library must remain a general-purpose, standalone package — not coupled to internal factory architecture.

## What's Already Well-Aligned

### 1. Correct Architectural Role

The dark factory spec (Section 5) defines `ars-web-components` as "the Browser-Native UI Component Layer" — reusable primitives and composed components, not a competing application runtime. The current codebase fulfills this: it's a library of encapsulated custom elements with no application-level state engine, no routing monopoly, no runtime lifecycle ownership.

### 2. Design-System Agnosticism

The `ArsDesignAdapter` contract in `design-system.ts` is a clean seam — components resolve CSS variables in a cascade (component-specific, library-level, fallback). The adapter pattern is the correct public API boundary: factory-internal concerns (like `ars-design-system` tokens) attach from the outside at initialization time, while the library ships sensible defaults that work standalone.

### 3. Shadow DOM Encapsulation

The library uses shadow roots selectively, and components communicate via `CustomEvent` with `composed: true`. This matches the dark factory's "strict encapsulation boundaries inherent in Web Components" principle and enables safe embedding inside Brainiac DOM overlays — or any other host.

### 4. No Global State Assumptions in Production Code

Components avoid `window.location`, `window.history`, `document.body` in production source. `ArsPage` has an internal routing mode alongside browser-history mode. `ArsDialog` accepts a `mountTarget` and `targetDocument` option. This makes components embeddable in non-standard contexts (Brainiac overlays, iframes, shadow roots).

### 5. TypeScript-First, Vite-Built, Zero Prod Dependencies

Matches the language standardization mandate (Section 9) and the "arslib as the only utility dependency" constraint (Section 4).

### 6. Mixin System with PointerCoordinator

The gesture coordination pattern (drag, swipe, press) with conflict resolution is exactly the kind of browser-native input richness the dark factory expects components to own internally, so host applications don't need to model DOM gesture state machines.

## Public Library vs. Factory Integration Boundaries

Since this is a public library, factory-specific concerns should live in the consuming projects, not here.

| Concern | Belongs in ars-web-components? | Where it belongs |
|---|---|---|
| Brainiac DOM sideband integration contract | No | `brainiac-engine` — consumes components via standard Web Component APIs (attributes, events, programmatic mount) |
| `ars-design-system` as default token source | No — the adapter pattern is the correct decoupling | Factory apps pass an `ars-design-system`-backed adapter at init time |
| Forge governance (specs, conformance, LLM loops) | No | Can govern externally via specs that reference the library's public API |
| Component inventory | Yes — serves both audiences | Here |
| Host-local / embedding documentation | Yes — useful for any consumer | Here |

## Gaps

### 1. Component Inventory Is Thin (Severity: High)

The current set — calendar, dialog, color picker, router, data roller, info tile, two chart types — is specialized but missing foundational primitives that both public consumers and factory applications need: button, input, select, toggle, table, tabs, dropdown, toast/notification, toolbar, sidebar, form layouts.

A public component library lives or dies by coverage and quality. This is also the single highest-leverage improvement for factory applications.

### 2. Embedding / Host-Local Documentation (Severity: Medium)

Components work correctly in non-standard mount contexts, but this isn't documented. Guidance on programmatic mount/unmount, attribute-driven updates, event forwarding, and which components assume shell-level context (e.g., `ArsPage` in history mode) would help any consumer embedding components in a host application — not just Brainiac.

### 3. Publish Checklist Discipline (Severity: Low)

The dark factory requires documentation updates, tests, changelog entry, and demo updates on every shared-block change. `CHANGELOG.md` exists but there's no evidence of a systematic publish checklist being followed.

## Summary Scorecard

| Requirement | Status |
|---|---|
| Correct architectural role (component layer, not runtime) | **Met** |
| TypeScript-first, ES modules, Vite tooling | **Met** |
| Design-system agnostic via token contract | **Met** |
| Shadow DOM encapsulation, no global side effects | **Met** |
| Mixin-based gesture/interaction system | **Met** |
| Component coverage for general use and factory apps | **Partial** — foundational primitives missing |
| Embedding / host-local documentation | **Partial** |
| Publish checklist discipline | **Not started** |

## Recommended Priorities

1. **Seed foundational primitives** — button, input, select, toggle, table, tabs, toast. These are needed by every consumer (public or factory) and should exist before Nexus/Oasis UI work begins.

2. **Document embedding patterns** — programmatic mount/unmount, attribute-driven data flow, event forwarding, and shell-only component caveats. Benefits all consumers.

3. **Establish a publish checklist** — docs, tests, changelog, demos on every release. Keeps the library trustworthy for external adopters and LLM agents alike.
