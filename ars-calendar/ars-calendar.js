import { EObject } from "arslib";
import WebComponentBase from "../web-component-base/web-component-base.js";

// CSS for the calendar component
const DEFAULT_CSS = `
  :host {
    display: block;
    font-family: Arial, sans-serif;
    background: var(--ars-calendar-bg, white);
    border-radius: var(--ars-calendar-border-radius, 8px);
    box-shadow: var(--ars-calendar-shadow, 0 2px 10px rgba(0, 0, 0, 0.1));
    overflow: hidden;
  }
  .calendar-header {
    background: var(--ars-calendar-header-bg, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
    color: var(--ars-calendar-header-color, white);
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
    color: var(--ars-calendar-header-color, white);
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.3s;
  }
  .calendar-nav:hover {
    background: var(--ars-calendar-button-hover-bg, rgba(255, 255, 255, 0.3));
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
    background: var(--ars-calendar-weekdays-bg, #f8f9fa);
    border-bottom: 1px solid #e9ecef;
  }
  .calendar-weekday {
    padding: 10px;
    text-align: center;
    font-weight: bold;
    color: var(--ars-calendar-days-header-color, #6c757d);
    font-size: 0.9em;
  }
  .calendar-body {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: var(--ars-calendar-body-bg, #e9ecef);
  }
  .calendar-day {
    background: var(--ars-calendar-cell-bg, white);
    color: var(--ars-calendar-cell-color, inherit);
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
    background: var(--ars-calendar-cell-hover-bg, #f8f9fa);
    transform: scale(1.05);
    box-shadow: var(--ars-calendar-cell-hover-shadow, none);
  }
  .calendar-day.selected {
    background: var(--ars-calendar-selected-bg, #667eea);
    color: var(--ars-calendar-selected-color, white);
    font-weight: bold;
    box-shadow: var(--ars-calendar-selected-shadow, none);
  }
  .calendar-day.other-month {
    color: var(--ars-calendar-other-month-color, #adb5bd);
  }
  .calendar-day.has-events::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background: var(--ars-calendar-event-indicator-color, #28a745);
    border-radius: 50%;
  }
  .calendar-day.selected.has-events::after {
    background: var(--ars-calendar-selected-event-indicator-color, white);
  }
`;

// Utility function for creating pie chart (simplified version)
const createPieChart = (width, height, colors) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (colors.length === 0) return canvas;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 2;

  const sliceAngle = (2 * Math.PI) / colors.length;

  colors.forEach((color, index) => {
    const startAngle = index * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  });

  return canvas;
};

// Global variables for cell dimensions
let cellWidth = 30;
let cellHeight = 30;

// Use only WebComponentBase
const ArsCalendarBase = WebComponentBase;

class ArsCalendar extends ArsCalendarBase {
  // ---- PRIVATE STATIC UTILITY METHODS ----
  static #DEFAULT_MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  static #DEFAULT_ABBREVIATED_DAYS = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ];
  static #DEFAULT_TODAY = "Today";
  static #WEEKS_IN_MONTH = 6;
  static #DAYS_IN_WEEK = 7;

  static #getCurrentDateInfo() {
    const now = new Date();
    return {
      month: now.getMonth(),
      year: now.getFullYear(),
      day: now.getDate(),
    };
  }

  static #areEventsEqual(event1, event2) {
    return EObject.hasSameProperties(event1, event2);
  }

  static #findEventByDate(events, day, month, year) {
    return events.find(
      (ev) => ev.day === day && ev.month === month && ev.year === year,
    );
  }

  static #getEventsByDate(events, day, month, year) {
    return events.filter(
      (event) =>
        event.day === day && event.month === month && event.year === year,
    );
  }

  static #removeEventFromArray(events, eventToRemove) {
    return events.filter(
      (ev) =>
        ev.text !== eventToRemove.text ||
        ev.day !== eventToRemove.day ||
        ev.month !== eventToRemove.month ||
        ev.year !== eventToRemove.year,
    );
  }

  static #createDaySelectedEvent(id, day, month, year, events) {
    return new CustomEvent("ars-calendar:daySelected", {
      detail: { id, day, month, year, events },
      bubbles: true,
      composed: true,
    });
  }

  static #getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
  }

  static #getFirstDayOfMonth(month, year) {
    return new Date(year, month).getDay();
  }

  static #getDaySlotIndex(weekIndex, dayOfWeekIndex) {
    return weekIndex * ArsCalendar.#DAYS_IN_WEEK + dayOfWeekIndex;
  }

  static #createEmptyDaySlots() {
    return new Array(
      ArsCalendar.#WEEKS_IN_MONTH * ArsCalendar.#DAYS_IN_WEEK,
    ).fill(null);
  }

  static #createEmptyColorSlots() {
    return new Array(
      ArsCalendar.#WEEKS_IN_MONTH * ArsCalendar.#DAYS_IN_WEEK,
    ).fill(null);
  }

  static #getColorsForDate(events, day, month, year) {
    return events
      .filter(
        (event) =>
          event.day === day && event.month === month && event.year === year,
      )
      .map((event) => event.color);
  }

  static #createColorCanvas(colors, width, height) {
    if (!colors.length) return null;
    return createPieChart(width, height, colors);
  }

  static #getCellDimensions(element) {
    const defaultWidth = cellWidth || 30;
    const defaultHeight = cellHeight || 30;
    if (element && element.offsetWidth > 0) {
      cellWidth = element.offsetWidth;
      cellHeight = element.offsetHeight;
    }
    return {
      width: cellWidth || defaultWidth,
      height: cellHeight || defaultHeight,
    };
  }

  static #createCSSVarsString(cssVars) {
    if (!cssVars || Object.keys(cssVars).length === 0) return "";
    let cssVarString = ":host {\n";
    for (const [key, value] of Object.entries(cssVars)) {
      cssVarString += `  --${key}: ${value};\n`;
    }
    cssVarString += "}\n";
    return cssVarString;
  }

  static #createButtonHandlers(calendar) {
    return {
      prev: () => calendar.previousMonth(),
      today: () => calendar.setSelectedDateToToday(),
      next: () => calendar.nextMonth(),
    };
  }

  static #isDaySelected(
    day,
    month,
    year,
    selectedDay,
    selectedMonth,
    selectedYear,
  ) {
    return (
      day === selectedDay && month === selectedMonth && year === selectedYear
    );
  }

  static #createDayClickHandler(calendar, daySlot) {
    return () => {
      calendar.onDayClicked(daySlot);
    };
  }

  static #fillDaySlots(daySlots, daySlotsColors, month, year, events) {
    // First, clear all slots
    for (let i = 0; i < daySlots.length; i++) {
      daySlots[i] = null;
      daySlotsColors[i] = null;
    }

    const firstDay = ArsCalendar.#getFirstDayOfMonth(month, year);
    const numDays = ArsCalendar.#getDaysInMonth(month, year);
    for (
      let daySlotIndex = firstDay;
      daySlotIndex < numDays + firstDay;
      daySlotIndex++
    ) {
      const dayNumber = daySlotIndex - firstDay + 1;
      daySlots[daySlotIndex] = dayNumber;
      const colors = ArsCalendar.#getColorsForDate(
        events,
        dayNumber,
        month,
        year,
      );
      const { width, height } = ArsCalendar.#getCellDimensions();
      daySlotsColors[daySlotIndex] = ArsCalendar.#createColorCanvas(
        colors,
        width,
        height,
      );
    }
    return { daySlots, daySlotsColors };
  }

  static #createResizeHandler(calendar) {
    return () => {
      if (!calendar.id) return;
      calendar.render();
    };
  }

  static #createClearDataHandler(calendar) {
    return (e) => {
      if (e.detail.id !== calendar.id) return;
      calendar.clearAllData();
    };
  }

  static #createRefreshHandler(calendar) {
    return (e) => {
      if (e.detail.id !== calendar.id) return;
      calendar.render();
    };
  }

  static #applyCSSVars(shadowRoot, cssVars) {
    if (!cssVars || !shadowRoot) return;
    let cssVarStyle = shadowRoot.querySelector("style.css-vars-style");
    if (!cssVarStyle) {
      cssVarStyle = document.createElement("style");
      cssVarStyle.className = "css-vars-style";
      shadowRoot.prepend(cssVarStyle);
    }
    cssVarStyle.textContent = ArsCalendar.#createCSSVarsString(cssVars);
  }

  static #initializeCalendar(calendar) {
    const currentDate = ArsCalendar.#getCurrentDateInfo();
    calendar.events = [];
    calendar.months = [...ArsCalendar.#DEFAULT_MONTHS];
    calendar.localizedAbbreviatedDays = [
      ...ArsCalendar.#DEFAULT_ABBREVIATED_DAYS,
    ];
    calendar.localizedToday = ArsCalendar.#DEFAULT_TODAY;
    calendar.monthToShow = currentDate.month;
    calendar.yearToShow = currentDate.year;
    calendar.WEEKS_IN_MONTH = ArsCalendar.#WEEKS_IN_MONTH;
    calendar.DAYS_IN_WEEK = ArsCalendar.#DAYS_IN_WEEK;
    calendar.daySlots = ArsCalendar.#createEmptyDaySlots();
    calendar.daySlotsColors = ArsCalendar.#createEmptyColorSlots();
    calendar.customTemplate = null;
    calendar.customCSS = null;
    calendar.cssVars = {};
    calendar.defaultCSS = DEFAULT_CSS;
    ArsCalendar.#fillDaySlots(
      calendar.daySlots,
      calendar.daySlotsColors,
      calendar.monthToShow,
      calendar.yearToShow,
      calendar.events,
    );
    return calendar;
  }

  static #createEventHandlers(calendar) {
    return {
      addEvent: (event) => {
        const sameEventFound = calendar.events.find((ev) =>
          ArsCalendar.#areEventsEqual(ev, event),
        );
        if (sameEventFound) return;
        const newEvent = Object.assign({}, event);
        calendar.events.push(newEvent);
        calendar.selectDate(event.day, event.month, event.year);
      },
      removeEvent: (eventDate) => {
        if (!eventDate) {
          console.log("no event found");
          return;
        }
        calendar.events = ArsCalendar.#removeEventFromArray(
          calendar.events,
          eventDate,
        );
        calendar.selectDate(eventDate.day, eventDate.month, eventDate.year);
      },
      changeEvent: (eventDate, newText, newColor) => {
        const event = ArsCalendar.#findEventByDate(
          calendar.events,
          eventDate.day,
          eventDate.month,
          eventDate.year,
        );
        if (!event) return false;
        event.text = newText || event.text;
        event.color = newColor || event.color;
        calendar.selectDate(event.day, event.month, event.year);
        return true;
      },
      selectDate: (day, month, year) => {
        if (day === null || month === null || year === null) return;
        calendar.selectedDay = day;
        calendar.selectedMonth = month;
        calendar.selectedYear = year;
        calendar.sendDaySelectedEvent();
        calendar.render();
      },
      refresh: () => calendar.render(),
    };
  }

  static #createCalendarHTML(calendar) {
    const css = calendar.customCSS || calendar.defaultCSS;
    const monthName = calendar.months[calendar.monthToShow];
    const year = calendar.yearToShow;

    return `
      <style>${css}</style>
      <div class="calendar-header">
        <button id="prev" class="calendar-nav prev">‹</button>
        <h2 class="calendar-title">${monthName} ${year}</h2>
        <button id="next" class="calendar-nav next">›</button>
        <button id="today" class="calendar-nav today">${
          calendar.localizedToday
        }</button>
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

  // ---- PUBLIC INSTANCE METHODS ----
  getEventsByDate(day, month, year) {
    return ArsCalendar.#getEventsByDate(this.events, day, month, year);
  }

  sendDaySelectedEvent() {
    const events = this.getEventsByDate(
      this.selectedDay,
      this.selectedMonth,
      this.selectedYear,
    );
    this.dispatchEvent(
      ArsCalendar.#createDaySelectedEvent(
        this.id,
        this.selectedDay,
        this.selectedMonth,
        this.selectedYear,
        events,
      ),
    );
  }

  render() {
    if (!this.shadowRoot) return;

    try {
      ArsCalendar.#fillDaySlots(
        this.daySlots,
        this.daySlotsColors,
        this.monthToShow,
        this.yearToShow,
        this.events,
      );

      const template = this.customTemplate
        ? this.customTemplate(this)
        : ArsCalendar.#createCalendarHTML(this);
      this.shadowRoot.innerHTML = template;

      const dayElements = this.shadowRoot.querySelectorAll(
        ".calendar-body > .calendar-day",
      );

      for (let weekIndex = 0; weekIndex < this.WEEKS_IN_MONTH; weekIndex++) {
        for (
          let dayOfWeekIndex = 0;
          dayOfWeekIndex < this.DAYS_IN_WEEK;
          dayOfWeekIndex++
        ) {
          const daySlotIndex = ArsCalendar.#getDaySlotIndex(
            weekIndex,
            dayOfWeekIndex,
          );
          const dayElement = dayElements[daySlotIndex];
          if (!dayElement) continue;

          const backgroundCanvas = this.daySlotsColors[daySlotIndex];
          const { width, height } = ArsCalendar.#getCellDimensions(dayElement);

          if (backgroundCanvas) {
            dayElement.style.backgroundImage = `url(${backgroundCanvas.toDataURL()})`;
          } else {
            dayElement.style.backgroundImage = "none";
          }

          dayElement.innerText = this.daySlots[daySlotIndex] || "";
          dayElement.onclick = ArsCalendar.#createDayClickHandler(
            this,
            daySlotIndex,
          );

          const day = this.daySlots[daySlotIndex];
          if (
            this.selectedDay !== null &&
            this.selectedMonth !== null &&
            this.selectedYear !== null &&
            ArsCalendar.#isDaySelected(
              day,
              this.monthToShow,
              this.yearToShow,
              this.selectedDay,
              this.selectedMonth,
              this.selectedYear,
            )
          ) {
            dayElement.classList.add("selected");
          } else {
            dayElement.classList.remove("selected");
          }
        }
      }

      const buttonHandlers = ArsCalendar.#createButtonHandlers(this);
      const prevButton = this.shadowRoot.getElementById("prev");
      if (prevButton) prevButton.onclick = buttonHandlers.prev;

      const todayButton = this.shadowRoot.getElementById("today");
      if (todayButton) todayButton.onclick = buttonHandlers.today;

      const nextButton = this.shadowRoot.getElementById("next");
      if (nextButton) nextButton.onclick = buttonHandlers.next;

      ArsCalendar.#applyCSSVars(this.shadowRoot, this.cssVars);
    } catch (error) {
      console.error("ARS Calendar render error:", error);
    }
  }

  applyCSSVars() {
    ArsCalendar.#applyCSSVars(this.shadowRoot, this.cssVars);
  }

  constructor() {
    super();

    // Initialize calendar with pure functions
    ArsCalendar.#initializeCalendar(this);

    // Create event handlers
    const handlers = ArsCalendar.#createEventHandlers(this);
    Object.assign(this, handlers);

    // Add event listeners
    window.addEventListener("resize", ArsCalendar.#createResizeHandler(this));
    window.addEventListener(
      "ars-calendar:clearAllData",
      ArsCalendar.#createClearDataHandler(this),
    );
    window.addEventListener(
      "ars-calendar:refresh",
      ArsCalendar.#createRefreshHandler(this),
    );
  }

  connectedCallback() {
    super.connectedCallback();
    setTimeout(() => {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: "open" });
      }
      this.render();
    }, 0);
  }

  allAttributesChangedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    setTimeout(() => {
      this.render();
    }, 0);
  }

  clearAllData() {
    this.events = [];
    this.render();
  }

  clearSelectedDate() {
    this.selectedDay = null;
    this.selectedMonth = null;
    this.selectedYear = null;
  }

  setSelectedDateToToday() {
    const date = new Date();
    this.monthToShow = date.getMonth();
    this.yearToShow = date.getFullYear();
    this.selectDate(date.getDate(), this.monthToShow, this.yearToShow);
  }

  static get observedAttributes() {
    return [
      "localized_abbreviated_days",
      "localized_months",
      "localized_today",
      "custom-css",
      "css-vars",
    ];
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);

    if (attrName === "localized_abbreviated_days") {
      this.localizedAbbreviatedDays = JSON.parse(newVal);
      this.render();
    }
    if (attrName === "localized_months") {
      this.months = JSON.parse(newVal);
      this.render();
    }
    if (attrName === "localized_today") {
      this.localizedToday = newVal;
      this.render();
    }
    if (attrName === "custom-css") {
      this.customCSS = newVal;
      this.render();
    }
    if (attrName === "css-vars") {
      this.cssVars = JSON.parse(newVal || "{}");
      ArsCalendar.#applyCSSVars(this.shadowRoot, this.cssVars);
      this.render();
    }
  }

  setCustomTemplate(templateFunction) {
    this.customTemplate = templateFunction;
    this.render();
  }

  setCSSVars(cssVars) {
    this.cssVars = { ...cssVars };
    this.applyCSSVars();
  }

  getCSSVars() {
    return { ...this.cssVars };
  }

  monthToShowString(month) {
    return this.months[month];
  }

  previousYear() {
    this.yearToShow--;
    this.clearSelectedDate();
    this.render();
  }

  nextYear() {
    this.yearToShow++;
    this.clearSelectedDate();
    this.render();
  }

  previousMonth() {
    if (this.monthToShow === 0) {
      this.monthToShow = 11;
      this.yearToShow--;
    } else this.monthToShow--;

    this.clearSelectedDate();
    this.render();
  }

  nextMonth() {
    if (this.monthToShow === 12 - 1) {
      this.monthToShow = 0;
      this.yearToShow++;
    } else this.monthToShow++;

    this.clearSelectedDate();
    this.render();
  }

  getColorCanvasFromDate(day, month, year) {
    const colors = ArsCalendar.#getColorsForDate(this.events, day, month, year);
    const { width, height } = ArsCalendar.#getCellDimensions();
    return ArsCalendar.#createColorCanvas(colors, width, height);
  }

  buildDayAndClassSlots() {
    this.daySlots = ArsCalendar.#createEmptyDaySlots();
    this.daySlotsColors = ArsCalendar.#createEmptyColorSlots();
  }

  numDaysInMonth(month, year) {
    return ArsCalendar.#getDaysInMonth(month, year);
  }

  firstDaySlotInMonth(month, year) {
    return ArsCalendar.#getFirstDayOfMonth(month, year);
  }

  onDayClicked(daySlot) {
    if (!this.daySlots[daySlot]) return;
    this.selectDate(this.daySlots[daySlot], this.monthToShow, this.yearToShow);
  }
}

window.customElements.define("ars-calendar", ArsCalendar);

export { ArsCalendar, ArsCalendar as default };
