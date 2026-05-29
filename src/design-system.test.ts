import { describe, it, expect, beforeEach } from "vitest";
import {
  getArsWebComponentsDefaultAdapter,
  initializeArsWebComponents,
} from "./design-system.js";

describe("initializeArsWebComponents", () => {
  beforeEach(() => {
    // Reset the document root to a clean state before each test.
    const root = document.documentElement;
    root.removeAttribute("data-arsds-theme");
    root.removeAttribute("data-test-attr");
    root.style.removeProperty("--arswc-color-accent");
    root.style.removeProperty("--arswc-button-primary-bg-start");
    root.style.removeProperty("--arswc-color-bg");
  });

  it("applies CSS variables and root attributes from the adapter", () => {
    const root = document.documentElement;
    initializeArsWebComponents({
      designAdapter: getArsWebComponentsDefaultAdapter("light"),
    });

    expect(root.style.getPropertyValue("--arswc-color-accent")).toBe(
      "#2563eb",
    );
    expect(root.style.getPropertyValue("--arswc-color-bg")).toBe("#ffffff");
  });

  it("removes stale CSS variables when switching adapters", () => {
    const root = document.documentElement;

    // Start with a light-like adapter that has a button-specific token.
    initializeArsWebComponents({
      designAdapter: {
        name: "test-light-with-button",
        cssVariables: {
          "--arswc-color-accent": "#2563eb",
          "--arswc-button-primary-bg-start": "#3b82f6",
        },
      },
    });
    expect(root.style.getPropertyValue("--arswc-button-primary-bg-start")).toBe(
      "#3b82f6",
    );

    // Switch to dark-ops design adapter (no button-specific tokens).
    initializeArsWebComponents({
      designAdapter: {
        name: "test-dark-ops",
        rootAttributes: { "data-arsds-theme": "dark-ops" },
        cssVariables: {
          "--arswc-color-accent": "var(--arsds-color-accent)",
          "--arswc-color-bg": "var(--arsds-color-canvas)",
        },
      },
    });

    // Button token should be removed because the new adapter doesn't set it.
    expect(root.style.getPropertyValue("--arswc-button-primary-bg-start")).toBe(
      "",
    );
    // Tokens present in the new adapter should be set.
    expect(root.style.getPropertyValue("--arswc-color-accent")).toBe(
      "var(--arsds-color-accent)",
    );
  });

  it("removes stale root attributes when switching adapters", () => {
    const root = document.documentElement;

    // Start with an adapter that sets data-arsds-theme.
    initializeArsWebComponents({
      designAdapter: {
        name: "test-themed",
        rootAttributes: { "data-arsds-theme": "dark-ops" },
        cssVariables: {},
      },
    });
    expect(root.getAttribute("data-arsds-theme")).toBe("dark-ops");

    // Switch to an adapter with no root attributes.
    initializeArsWebComponents({
      designAdapter: {
        name: "test-bare",
        rootAttributes: {},
        cssVariables: { "--arswc-color-accent": "#ff0000" },
      },
    });

    // data-arsds-theme should be removed.
    expect(root.hasAttribute("data-arsds-theme")).toBe(false);
    // New CSS variable should be set.
    expect(root.style.getPropertyValue("--arswc-color-accent")).toBe("#ff0000");
  });

  it("is a no-op when the same adapter is applied twice", () => {
    const root = document.documentElement;

    initializeArsWebComponents({
      designAdapter: getArsWebComponentsDefaultAdapter("light"),
    });
    const firstAccent = root.style.getPropertyValue("--arswc-color-accent");

    // Mutate the property manually to detect whether the second call re-applies.
    root.style.setProperty("--arswc-color-accent", "#manual-override");

    // Re-apply the same adapter — should be a no-op (signature matches).
    initializeArsWebComponents({
      designAdapter: getArsWebComponentsDefaultAdapter("light"),
    });

    expect(root.style.getPropertyValue("--arswc-color-accent")).toBe(
      "#manual-override",
    );
  });

  it("restores original state after light -> dark -> light round-trip", () => {
    const root = document.documentElement;

    const darkAdapter = {
      name: "test-dark",
      rootAttributes: { "data-arsds-theme": "dark-ops" },
      cssVariables: {
        "--arswc-color-accent": "#5a9fd4",
        "--arswc-color-bg": "#081321",
      },
    };

    const lightAdapter = getArsWebComponentsDefaultAdapter("light");

    // Start dark.
    initializeArsWebComponents({ designAdapter: darkAdapter });
    expect(root.getAttribute("data-arsds-theme")).toBe("dark-ops");
    expect(root.style.getPropertyValue("--arswc-color-accent")).toBe("#5a9fd4");

    // Switch to light.
    initializeArsWebComponents({ designAdapter: lightAdapter });
    expect(root.hasAttribute("data-arsds-theme")).toBe(false);
    expect(root.style.getPropertyValue("--arswc-color-accent")).toBe("#2563eb");

    // Switch back to dark.
    initializeArsWebComponents({ designAdapter: darkAdapter });
    expect(root.getAttribute("data-arsds-theme")).toBe("dark-ops");
    expect(root.style.getPropertyValue("--arswc-color-accent")).toBe("#5a9fd4");
    // Light-only tokens should be gone.
    expect(
      root.style.getPropertyValue("--arswc-button-primary-bg-start"),
    ).toBe("");
  });
});
