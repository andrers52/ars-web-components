// This file declares the public design adapter contract and initialization API for ars-web-components.
export interface ArsDesignAdapter {
  name?: string;
  rootAttributes?: Record<string, string>;
  cssVariables?: Record<string, string>;
}

export interface InitializeArsWebComponentsOptions {
  designAdapter?: ArsDesignAdapter;
  targetDocument?: Document;
}

let lastInitializedSignature = "";

export function getArsWebComponentsDefaultAdapter(mode: "light" | "dark" = "light"): ArsDesignAdapter {
  if (mode === "dark") {
    return {
      name: "ars-web-components:default-dark",
      cssVariables: {
        "--arswc-color-bg": "#0b1220",
        "--arswc-color-surface": "#121a2d",
        "--arswc-color-border": "#29405f",
        "--arswc-color-text": "#e8eef9",
        "--arswc-color-muted": "#9fb0cb",
        "--arswc-color-accent": "#3aa8ff",
        "--arswc-color-accent-contrast": "#04101c",
        "--arswc-button-primary-bg-start": "#1e3a8a",
        "--arswc-button-primary-bg-end": "#1e40af",
        "--arswc-button-primary-border": "#2563eb",
        "--arswc-button-primary-color": "#eff6ff",
        "--arswc-button-primary-hover-bg-start": "#1d4ed8",
        "--arswc-button-primary-hover-bg-end": "#1e3a8a",
        "--arswc-button-secondary-bg": "#162238",
        "--arswc-button-secondary-border": "#3b82f6",
        "--arswc-button-secondary-color": "#dbeafe",
        "--arswc-button-secondary-hover-bg": "#1d2d47",
        "--arswc-button-secondary-hover-border": "#60a5fa",
        "--arswc-button-secondary-hover-color": "#eff6ff",
        "--arswc-radius-sm": "6px",
        "--arswc-radius-md": "10px",
        "--arswc-shadow-sm": "0 1px 2px rgb(0 0 0 / 0.28)",
        "--arswc-font-family-sans": 'system-ui, -apple-system, "Segoe UI", sans-serif',
        "--arswc-font-family-mono": "ui-monospace, SFMono-Regular, Menlo, monospace",
        // Semantic color tokens
        "--arswc-color-danger": "#ef4444",
        "--arswc-color-success": "#22c55e",
        "--arswc-color-warning": "#f59e0b",
        "--arswc-color-disabled": "#6b7280",
        "--arswc-color-disabled-bg": "#1f2937",
        // Typography scale tokens
        "--arswc-font-size-sm": "0.75rem",
        "--arswc-font-size-md": "0.875rem",
        "--arswc-font-size-lg": "1.25rem",
        // Spacing scale tokens
        "--arswc-spacing-xs": "4px",
        "--arswc-spacing-sm": "8px",
        "--arswc-spacing-md": "16px",
        "--arswc-spacing-lg": "24px",
        "--arswc-spacing-xl": "32px",
        // Animation and focus tokens
        "--arswc-transition-duration": "200ms",
        "--arswc-focus-ring": "0 0 0 3px rgba(58, 168, 255, 0.4)",
      },
    };
  }
  return {
    name: "ars-web-components:default-light",
    cssVariables: {
      "--arswc-color-bg": "#ffffff",
      "--arswc-color-surface": "#f6f8fb",
      "--arswc-color-border": "#d5dde8",
      "--arswc-color-text": "#1b2430",
      "--arswc-color-muted": "#64748b",
      "--arswc-color-accent": "#2563eb",
      "--arswc-color-accent-contrast": "#ffffff",
      "--arswc-button-primary-bg-start": "#3b82f6",
      "--arswc-button-primary-bg-end": "#2563eb",
      "--arswc-button-primary-border": "#1d4ed8",
      "--arswc-button-primary-color": "#ffffff",
      "--arswc-button-primary-hover-bg-start": "#60a5fa",
      "--arswc-button-primary-hover-bg-end": "#3b82f6",
      "--arswc-button-secondary-bg": "#ffffff",
      "--arswc-button-secondary-border": "#93c5fd",
      "--arswc-button-secondary-color": "#1e3a8a",
      "--arswc-button-secondary-hover-bg": "#eff6ff",
      "--arswc-button-secondary-hover-border": "#3b82f6",
      "--arswc-button-secondary-hover-color": "#1d4ed8",
      "--arswc-radius-sm": "6px",
      "--arswc-radius-md": "10px",
      "--arswc-shadow-sm": "0 1px 2px rgb(0 0 0 / 0.12)",
      "--arswc-font-family-sans": 'system-ui, -apple-system, "Segoe UI", sans-serif',
      "--arswc-font-family-mono": "ui-monospace, SFMono-Regular, Menlo, monospace",
      // Semantic color tokens
      "--arswc-color-danger": "#dc2626",
      "--arswc-color-success": "#16a34a",
      "--arswc-color-warning": "#d97706",
      "--arswc-color-disabled": "#9ca3af",
      "--arswc-color-disabled-bg": "#f3f4f6",
      // Typography scale tokens
      "--arswc-font-size-sm": "0.75rem",
      "--arswc-font-size-md": "0.875rem",
      "--arswc-font-size-lg": "1.25rem",
      // Spacing scale tokens
      "--arswc-spacing-xs": "4px",
      "--arswc-spacing-sm": "8px",
      "--arswc-spacing-md": "16px",
      "--arswc-spacing-lg": "24px",
      "--arswc-spacing-xl": "32px",
      // Animation and focus tokens
      "--arswc-transition-duration": "200ms",
      "--arswc-focus-ring": "0 0 0 3px rgba(37, 99, 235, 0.3)",
    },
  };
}

export function initializeArsWebComponents(options: InitializeArsWebComponentsOptions = {}): void {
  const doc = options.targetDocument ?? (typeof document !== "undefined" ? document : undefined);
  if (!doc) {
    return;
  }
  const root = doc.documentElement;
  const adapter = options.designAdapter;
  if (!adapter) {
    return;
  }
  const signature = JSON.stringify({
    name: adapter.name ?? "",
    rootAttributes: adapter.rootAttributes ?? {},
    cssVariables: adapter.cssVariables ?? {},
  });
  if (signature === lastInitializedSignature) {
    return;
  }

  for (const [name, value] of Object.entries(adapter.rootAttributes ?? {})) {
    root.setAttribute(name, value);
  }
  for (const [name, value] of Object.entries(adapter.cssVariables ?? {})) {
    root.style.setProperty(name, value);
  }
  lastInitializedSignature = signature;
}
