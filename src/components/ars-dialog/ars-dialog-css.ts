// Default CSS styles for ARS Dialog component
// Can be overridden by external CSS or custom-css attribute

export const DEFAULT_CSS = `
  :host {
    display: block;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }

  .overlay {
    position: fixed;
    visibility: hidden;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--ars-dialog-overlay-bg, rgba(0, 0, 0, 0.4));
    z-index: var(--ars-dialog-z-index, 1000);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    backdrop-filter: var(--ars-dialog-backdrop-filter, none);
  }

  .body {
    max-width: var(--ars-dialog-max-width, 80vw);
    min-width: var(--ars-dialog-min-width, 320px);
    min-height: var(--ars-dialog-min-height, 150px);
    max-height: var(--ars-dialog-max-height, 80vh);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: var(--ars-dialog-bg, #ffffff);
    border-radius: var(--ars-dialog-border-radius, 12px);
    box-shadow: var(--ars-dialog-shadow, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04));
    border: var(--ars-dialog-border, none);
    cursor: default;
    transform: scale(0.95);
    opacity: 0;
    transition: all 0.2s ease-out;
    box-sizing: border-box;
    overflow: hidden;
  }

  .overlay[style*="visible"] .body {
    transform: scale(1);
    opacity: 1;
  }

  .title {
    width: 100%;
    padding: var(--ars-dialog-title-padding, 24px 24px 0 24px);
    font-size: var(--ars-dialog-title-font-size, 1.25rem);
    font-weight: var(--ars-dialog-title-font-weight, 600);
    color: var(--ars-dialog-title-color, #1f2937);
    background: var(--ars-dialog-title-bg, transparent);
    border-bottom: var(--ars-dialog-title-border, none);
    border-radius: var(--ars-dialog-border-radius, 12px) var(--ars-dialog-border-radius, 12px) 0 0;
  }

  .content {
    flex: 1;
    width: 100%;
    max-width: 100%;
    padding: var(--ars-dialog-content-padding, 24px);
    overflow-y: auto;
    color: var(--ars-dialog-content-color, #4b5563);
    line-height: var(--ars-dialog-content-line-height, 1.6);
    box-sizing: border-box;
  }

  .footer {
    width: 100%;
    box-sizing: border-box;
    padding: var(--ars-dialog-footer-padding, 0 24px 24px 24px);
    display: flex;
    flex-wrap: wrap;
    justify-content: var(--ars-dialog-footer-justify, flex-end);
    align-items: center;
    gap: var(--ars-dialog-footer-gap, 12px);
    background: var(--ars-dialog-footer-bg, transparent);
    border-top: var(--ars-dialog-footer-border, none);
    border-radius: 0 0 var(--ars-dialog-border-radius, 12px) var(--ars-dialog-border-radius, 12px);
    min-width: 0;
  }

  .footer button {
    min-width: var(--ars-dialog-button-min-width, 80px);
    padding: var(--ars-dialog-button-padding, 8px 16px);
    border-radius: var(--ars-dialog-button-border-radius, 6px);
    font-size: var(--ars-dialog-button-font-size, 0.875rem);
    font-weight: var(--ars-dialog-button-font-weight, 500);
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    outline: none;
  }

  .footer button:focus {
    box-shadow: var(--ars-dialog-button-focus-shadow, 0 0 0 3px rgba(59, 130, 246, 0.5));
  }

  /* Primary button (Yes/OK) */
  .footer button:first-child {
    background: var(--ars-dialog-primary-button-bg, #3b82f6);
    color: var(--ars-dialog-primary-button-color, #ffffff);
    border: var(--ars-dialog-primary-button-border, 1px solid #3b82f6);
  }

  .footer button:first-child:hover {
    background: var(--ars-dialog-primary-button-hover-bg, #2563eb);
    border-color: var(--ars-dialog-primary-button-hover-border, #2563eb);
    transform: translateY(-1px);
  }

  /* Secondary button (No/Cancel) */
  .footer button:last-child {
    background: var(--ars-dialog-secondary-button-bg, transparent);
    color: var(--ars-dialog-secondary-button-color, #6b7280);
    border: var(--ars-dialog-secondary-button-border, 1px solid #d1d5db);
  }

  .footer button:last-child:hover {
    background: var(--ars-dialog-secondary-button-hover-bg, #f9fafb);
    border-color: var(--ars-dialog-secondary-button-hover-border, #9ca3af);
    color: var(--ars-dialog-secondary-button-hover-color, #374151);
  }

  /* Form elements styling */
  input,
  select,
  textarea {
    width: 100%;
    max-width: 100%;
    padding: var(--ars-dialog-input-padding, 8px 12px);
    margin: var(--ars-dialog-input-margin, 4px 0 8px 0);
    border: var(--ars-dialog-input-border, 1px solid #d1d5db);
    border-radius: var(--ars-dialog-input-border-radius, 6px);
    font-size: var(--ars-dialog-input-font-size, 0.875rem);
    font-family: inherit;
    background: var(--ars-dialog-input-bg, #ffffff);
    color: var(--ars-dialog-input-color, #374151);
    box-sizing: border-box;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  input:focus,
  select:focus,
  textarea:focus {
    border-color: var(--ars-dialog-input-focus-border, #3b82f6);
    outline: none;
    box-shadow: var(--ars-dialog-input-focus-shadow, 0 0 0 3px rgba(59, 130, 246, 0.1));
  }

  textarea {
    min-height: var(--ars-dialog-textarea-min-height, 80px);
    max-height: var(--ars-dialog-textarea-max-height, 200px);
    resize: vertical;
    line-height: 1.4;
  }

  label {
    display: block;
    font-weight: var(--ars-dialog-label-font-weight, 500);
    font-size: var(--ars-dialog-label-font-size, 0.875rem);
    color: var(--ars-dialog-label-color, #374151);
    margin: var(--ars-dialog-label-margin, 12px 0 4px 0);
  }

  label:first-child {
    margin-top: 0;
  }

  /* Range slider styling */
  input[type="range"] {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--ars-dialog-range-bg, #e5e7eb);
    outline: none;
    padding: 0;
    margin: 8px 0;
  }

  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--ars-dialog-range-thumb-bg, #3b82f6);
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--ars-dialog-range-thumb-bg, #3b82f6);
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Form layout helpers */
  .form-row {
    display: flex;
    align-items: center;
    gap: var(--ars-dialog-form-gap, 12px);
    margin-bottom: var(--ars-dialog-form-row-margin, 8px);
  }

  .form-row label {
    margin: 0;
    min-width: auto;
    flex-shrink: 0;
  }

  .form-row input[type="range"] {
    flex: 1;
    margin: 0;
  }

  .form-row .range-value {
    font-weight: 600;
    color: var(--ars-dialog-range-value-color, #3b82f6);
    min-width: 30px;
    text-align: center;
  }

  /* Select dropdown styling */
  select {
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 8px center;
    background-repeat: no-repeat;
    background-size: 16px;
    padding-right: 32px;
  }

  /* Checkboxes and other elements */
  ul {
    list-style: none;
    padding: 0;
    margin: 8px 0;
  }

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    font-size: 0.875rem;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .body {
      max-width: 95vw;
      min-width: 280px;
      margin: 20px;
    }

    .title,
    .content,
    .footer {
      padding-left: 16px;
      padding-right: 16px;
    }


    .footer button {
      width: 100%;
      min-width: auto;
    }
  }
`;
