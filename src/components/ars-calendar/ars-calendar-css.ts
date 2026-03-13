export const DEFAULT_CSS = `
  :host {
    display: block;
    font-family: var(--arswc-font-family-sans, Arial, sans-serif);
    background: var(--ars-calendar-bg, var(--arswc-color-surface, white));
    border-radius: var(--ars-calendar-border-radius, var(--arswc-radius-md, 8px));
    box-shadow: var(--ars-calendar-shadow, var(--arswc-shadow-sm, 0 2px 10px rgba(0, 0, 0, 0.1)));
    overflow: hidden;
  }
  .calendar-header {
    background: var(--ars-calendar-header-bg, var(--arswc-color-accent, linear-gradient(135deg, #667eea 0%, #764ba2 100%)));
    color: var(--ars-calendar-header-color, var(--arswc-color-accent-contrast, white));
    padding: 15px;
    text-align: center;
    position: relative;
  }
  .calendar-title {
    font-size: 1.2em;
    font-weight: bold;
    margin: 0;
    text-shadow: var(--ars-calendar-header-text-shadow, none);
  }
  .calendar-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: var(--ars-calendar-header-color, var(--arswc-color-accent-contrast, white));
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.3s;
  }
  .calendar-nav:hover {
    background: var(--ars-calendar-button-hover-bg, color-mix(in srgb, var(--arswc-color-accent-contrast, #ffffff) 30%, transparent));
  }
  .calendar-nav.prev {
    left: 15px;
  }
  .calendar-nav.next {
    right: 15px;
  }
  .calendar-nav.today {
    position: static;
    transform: none;
    margin: 10px 5px 0 5px;
    font-size: 0.9em;
  }
  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: var(--ars-calendar-weekdays-bg, var(--arswc-color-surface, #f8f9fa));
    border-bottom: 1px solid #e9ecef;
  }
  .calendar-weekday {
    padding: 10px;
    text-align: center;
    font-weight: bold;
    color: var(--ars-calendar-days-header-color, var(--arswc-color-muted, #6c757d));
    font-size: 0.9em;
  }
  .calendar-body {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: var(--ars-calendar-body-bg, var(--arswc-color-border, #e9ecef));
  }
  .calendar-day {
    background: var(--ars-calendar-cell-bg, var(--arswc-color-bg, white));
    color: var(--ars-calendar-cell-color, var(--arswc-color-text, inherit));
    padding: 10px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: var(--ars-calendar-cell-border, none);
  }
  .calendar-day:hover {
    background: var(--ars-calendar-cell-hover-bg, var(--arswc-color-surface, #f8f9fa));
    transform: scale(1.05);
    box-shadow: var(--ars-calendar-cell-hover-shadow, none);
  }
  .calendar-day.selected {
    background: var(--ars-calendar-selected-bg, var(--arswc-color-accent, #667eea));
    color: var(--ars-calendar-selected-color, var(--arswc-color-accent-contrast, white));
    font-weight: bold;
    box-shadow: var(--ars-calendar-selected-shadow, none);
  }
  .calendar-day.other-month {
    color: var(--ars-calendar-other-month-color, var(--arswc-color-muted, #adb5bd));
  }
  .calendar-day.has-events::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background: var(--ars-calendar-event-indicator-color, var(--arswc-color-accent, #28a745));
    border-radius: 50%;
  }
  .calendar-day.selected.has-events::after {
    background: var(--ars-calendar-selected-event-indicator-color, white);
  }
`;
