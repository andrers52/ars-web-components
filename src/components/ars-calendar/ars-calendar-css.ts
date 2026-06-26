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
    padding: var(--ars-calendar-header-padding, 15px);
    text-align: center;
    position: relative;
  }
  .calendar-title {
    font-size: var(--ars-calendar-title-font-size, 1.2em);
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
    padding: var(--ars-calendar-nav-padding, 8px 12px);
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.3s;
  }
  .calendar-nav:hover {
    background: var(--ars-calendar-button-hover-bg, color-mix(in srgb, var(--arswc-color-accent-contrast, #ffffff) 30%, transparent));
  }
  .calendar-nav.prev {
    left: var(--ars-calendar-nav-prev-left, 15px);
  }
  .calendar-nav.next {
    right: var(--ars-calendar-nav-next-right, 15px);
  }
  .calendar-nav.today {
    position: static;
    transform: none;
    margin: var(--ars-calendar-today-margin, 10px 5px 0 5px);
    font-size: var(--ars-calendar-today-font-size, 0.9em);
  }
  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: var(--ars-calendar-weekdays-bg, var(--arswc-color-surface, #f8f9fa));
    border-bottom: 1px solid #e9ecef;
  }
  .calendar-weekday {
    padding: var(--ars-calendar-weekday-padding, 10px);
    text-align: center;
    font-weight: bold;
    color: var(--ars-calendar-days-header-color, var(--arswc-color-muted, #6c757d));
    font-size: var(--ars-calendar-weekday-font-size, 0.9em);
  }
  .calendar-body {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: var(--ars-calendar-body-bg, var(--arswc-color-border, #e9ecef));
  }
  .calendar-day {
    background-color: var(--ars-calendar-cell-bg, var(--arswc-color-bg, white));
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    color: var(--ars-calendar-cell-color, var(--arswc-color-text, inherit));
    padding: var(--ars-calendar-day-padding, 10px);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    min-height: var(--ars-calendar-day-min-height, 40px);
    display: flex;
    align-items: center;
    justify-content: center;
    border: var(--ars-calendar-cell-border, none);
  }
  .calendar-day:hover {
    background-color: var(--ars-calendar-cell-hover-bg, var(--arswc-color-surface, #f8f9fa));
    transform: scale(var(--ars-calendar-day-hover-scale, 1.05));
    box-shadow: var(--ars-calendar-cell-hover-shadow, none);
  }
  .calendar-day.selected {
    background-color: var(--ars-calendar-selected-bg, var(--arswc-color-accent, #667eea));
    color: var(--ars-calendar-selected-color, var(--arswc-color-accent-contrast, white));
    font-weight: bold;
    box-shadow: var(--ars-calendar-selected-shadow, none);
  }
  .calendar-day.other-month {
    color: var(--ars-calendar-other-month-color, var(--arswc-color-muted, #adb5bd));
  }
  /* Collapse completely empty day cells (the trailing row when a month only
     needs five weeks) so the calendar doesn't reserve a blank sixth row. The
     grid gap keeps the row at 1px, so the layout remains stable when a month
     genuinely needs six rows. */
  .calendar-day:empty {
    min-height: 0;
    padding: 0;
  }
  /* "badge" event-mark style.
     Activated by setting attribute event-mark-style="badge" on the
     ars-calendar element (the component then clears the pie-chart
     background and stamps data-event-count onto each cell that has
     events). Shows a small count chip in the top-right corner via
     ::after, picking up the count from attr(data-event-count).
     The inset border that used to accompany the badge has been moved
     to .calendar-day.today so the current day is always highlighted.
     Both colors expose CSS-vars so host apps can theme without
     overriding the whole stylesheet. */
  .calendar-day.today {
    box-shadow: inset 0 0 0 var(
        --ars-calendar-today-border-width,
        var(--ars-calendar-event-border-width, 2px)
      )
      var(
        --ars-calendar-today-border-color,
        var(--ars-calendar-event-border-color, var(--arswc-color-accent, #54dfff))
      );
  }
  .calendar-day.has-events[data-event-count]::after {
    content: attr(data-event-count);
    position: absolute;
    top: var(--ars-calendar-event-badge-top, 4px);
    right: var(--ars-calendar-event-badge-right, 6px);
    min-width: var(--ars-calendar-event-badge-min-width, 16px);
    height: var(--ars-calendar-event-badge-height, 16px);
    padding: var(--ars-calendar-event-badge-padding, 0 4px);
    border-radius: 999px;
    background: var(
      --ars-calendar-event-badge-bg,
      var(--arswc-color-accent, #54dfff)
    );
    color: var(
      --ars-calendar-event-badge-color,
      var(--arswc-color-accent-contrast, #052236)
    );
    font-size: var(--ars-calendar-event-badge-font-size, 0.7em);
    font-weight: 700;
    line-height: var(--ars-calendar-event-badge-line-height, 16px);
    text-align: center;
    box-sizing: border-box;
  }
`;
