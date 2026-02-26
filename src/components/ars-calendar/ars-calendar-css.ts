// Default CSS styles for ARS Calendar component
// Can be overridden by external CSS or custom-css attribute

export const DEFAULT_CSS = `
  :host {
    display: block;
    font-family: var(--arswc-font-family-sans, "Helvetica Neue", Helvetica, Arial, sans-serif);
    font-size: 13px;
    line-height: 1.5;
  }

  .calendar-container {
    background: var(--ars-calendar-bg, var(--arswc-color-bg, #ffffff));
    box-shadow: var(--ars-calendar-shadow, var(--arswc-shadow-sm, 0px 3px 3px rgba(0, 0, 0, 0.25)));
    margin-bottom: 1px;
    display: table;
    width: 100%;
    border-radius: var(--ars-calendar-border-radius, var(--arswc-radius-md, 5px));
  }

  .calendar-header {
    display: flex;
    justify-content: space-between;
    width: 100%;
    cursor: default;
    background: var(--ars-calendar-header-bg, var(--arswc-color-accent, linear-gradient(to bottom, #b32b0c, #cd310d)));
    height: var(--ars-calendar-header-height, 34px);
    color: var(--ars-calendar-header-color, var(--arswc-color-accent-contrast, #fff));
    border-top-left-radius: var(--ars-calendar-border-radius, var(--arswc-radius-md, 5px));
    border-top-right-radius: var(--ars-calendar-border-radius, var(--arswc-radius-md, 5px));
    font-weight: bold;
    text-shadow: var(--ars-calendar-header-text-shadow, none);
    text-transform: uppercase;
    line-height: var(--ars-calendar-header-height, 34px);
  }

  .calendar-button {
    min-width: 24px;
    text-align: center;
    border-radius: 5px;
    padding: 0 8px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .calendar-button.right {
    margin-left: 8px;
  }

  .calendar-button:hover {
    background: var(--ars-calendar-button-hover-bg, color-mix(in srgb, var(--arswc-color-accent, #cd310d) 85%, var(--arswc-color-bg, #fff)));
  }

  .calendar-month-year {
    letter-spacing: 1px;
    text-align: center;
    flex: 1;
  }

  .calendar-nav-buttons {
    display: flex;
    align-items: center;
  }

  .calendar-table {
    background: var(--ars-calendar-table-bg, var(--arswc-color-bg, #fff));
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }

  .calendar-cell {
    color: var(--ars-calendar-cell-color, var(--arswc-color-text, #2b2b2b));
    width: var(--ars-calendar-cell-width, 30px);
    height: var(--ars-calendar-cell-height, 30px);
    line-height: var(--ars-calendar-cell-height, 30px);
    text-align: center;
    cursor: pointer;
    border: var(--ars-calendar-cell-border, none);
    position: relative;
  }

  .calendar-days-header .calendar-cell {
    height: 26px;
    line-height: 26px;
    text-transform: uppercase;
    font-size: 90%;
    color: var(--ars-calendar-days-header-color, var(--arswc-color-muted, #9e9e9e));
    cursor: default;
  }

  .calendar-days-header .calendar-cell:not(:last-child) {
    border-right: var(--ars-calendar-days-border, 1px solid var(--arswc-color-bg, #fff));
  }

  .calendar-cell.selected-day {
    color: var(--ars-calendar-selected-color, var(--arswc-color-accent-contrast, #ffffff));
    background: var(--ars-calendar-selected-bg, var(--arswc-color-accent, #b32b0c));
    box-shadow: var(--ars-calendar-selected-shadow, var(--arswc-shadow-sm, 1px 1px 1px 1px rgba(0,0,0,0.35)));
  }

  .calendar-cell:not(.no-hover):hover {
    text-shadow: var(--ars-calendar-cell-hover-shadow, 0px 0px 4px color-mix(in srgb, var(--arswc-color-text, #000) 60%, transparent));
  }

  .calendar-body {
    width: 100%;
  }
`;
