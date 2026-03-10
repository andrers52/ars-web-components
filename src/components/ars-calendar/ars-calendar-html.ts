export function renderCalendarHTML(calendar) {
  const css = calendar.customCSS || calendar.defaultCSS;
  const monthName = calendar.months[calendar.monthToShow];
  const year = calendar.yearToShow;

  return `
    <style>${css}</style>
    <div class="calendar-header">
      <button id="prev" class="calendar-nav prev">‹</button>
      <h2 class="calendar-title">${monthName} ${year}</h2>
      <button id="next" class="calendar-nav next">›</button>
      <button id="today" class="calendar-nav today">${calendar.localizedToday}</button>
    </div>
    <div class="calendar-weekdays">
      ${calendar.localizedAbbreviatedDays
        .map((day) => `<div class="calendar-weekday">${day}</div>`)
        .join("")}
    </div>
    <div class="calendar-body">
      ${Array.from(
        { length: calendar.WEEKS_IN_MONTH * calendar.DAYS_IN_WEEK },
        (_, i) => {
          const day = calendar.daySlots[i];
          const hasEvents =
            day &&
            calendar.events.some(
              (event) =>
                event.day === day &&
                event.month === calendar.monthToShow &&
                event.year === calendar.yearToShow,
            );
          const isOtherMonth = !day || day < 1 || day > 31;
          const isSelected =
            calendar.selectedDay === day &&
            calendar.selectedMonth === calendar.monthToShow &&
            calendar.selectedYear === calendar.yearToShow;

          let classes = "calendar-day";
          if (isOtherMonth) classes += " other-month";
          if (isSelected) classes += " selected";
          if (hasEvents) classes += " has-events";

          return `<div class="${classes}">${day || ""}</div>`;
        },
      ).join("")}
    </div>
  `;
}
