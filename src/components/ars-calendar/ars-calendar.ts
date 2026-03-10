import { EObject } from "arslib";
import WebComponentBase from "../web-component-base/web-component-base.js";
import { DEFAULT_CSS } from "./ars-calendar-css.js";
import { renderCalendarHTML } from "./ars-calendar-html.js";
import {
  createEmptySlots,
  getColorsForDate,
  getDaysInMonth,
  getEventsByDate,
  getFirstDayOfMonth,
  parseObjectAttribute,
  parseStringArrayAttribute,
} from "./calendar-utils.js";

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

// Use only WebComponentBase
const ArsCalendarBase = WebComponentBase;

class ArsCalendar extends ArsCalendarBase {
  [key: string]: any;

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
    return getEventsByDate(events, day, month, year);
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
    return getDaysInMonth(month, year);
  }

  static #getFirstDayOfMonth(month, year) {
    return getFirstDayOfMonth(month, year);
  }

  static #getDaySlotIndex(weekIndex, dayOfWeekIndex) {
    return weekIndex * ArsCalendar.#DAYS_IN_WEEK + dayOfWeekIndex;
  }

  static #createEmptyDaySlots() {
    return createEmptySlots(
      ArsCalendar.#WEEKS_IN_MONTH * ArsCalendar.#DAYS_IN_WEEK,
    );
  }

  static #createEmptyColorSlots() {
    return createEmptySlots(
      ArsCalendar.#WEEKS_IN_MONTH * ArsCalendar.#DAYS_IN_WEEK,
    );
  }

  static #getColorsForDate(events, day, month, year) {
    return getColorsForDate(events, day, month, year);
  }

  static #createColorCanvas(colors, width, height) {
    if (!colors.length) return null;
    return createPieChart(width, height, colors);
  }

  static #getCellDimensions(calendar, element) {
    const defaultWidth = calendar._cellWidth || 30;
    const defaultHeight = calendar._cellHeight || 30;
    if (element && element.offsetWidth > 0) {
      calendar._cellWidth = element.offsetWidth;
      calendar._cellHeight = element.offsetHeight;
    }
    return {
      width: calendar._cellWidth || defaultWidth,
      height: calendar._cellHeight || defaultHeight,
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

  static #fillDaySlots(calendar, daySlots, daySlotsColors, month, year, events) {
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
      const { width, height } = ArsCalendar.#getCellDimensions(calendar, null);
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
    calendar._cellWidth = 30;
    calendar._cellHeight = 30;
    calendar._resizeHandler = ArsCalendar.#createResizeHandler(calendar);
    calendar._clearDataHandler = ArsCalendar.#createClearDataHandler(calendar);
    calendar._refreshHandler = ArsCalendar.#createRefreshHandler(calendar);
    ArsCalendar.#fillDaySlots(
      calendar,
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
        if (!eventDate) return;
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
        this,
        this.daySlots,
        this.daySlotsColors,
        this.monthToShow,
        this.yearToShow,
        this.events,
      );

      const template = this.customTemplate
        ? this.customTemplate(this)
        : renderCalendarHTML(this);
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
          const { width, height } = ArsCalendar.#getCellDimensions(this, dayElement);

          if (backgroundCanvas) {
            (dayElement as HTMLElement).style.backgroundImage = `url(${backgroundCanvas.toDataURL()})`;
          } else {
            (dayElement as HTMLElement).style.backgroundImage = "none";
          }

          (dayElement as HTMLElement).innerText = this.daySlots[daySlotIndex] || "";
          (dayElement as HTMLElement).onclick = ArsCalendar.#createDayClickHandler(
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

  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this._resizeHandler);
    window.addEventListener("ars-calendar:clearAllData", this._clearDataHandler);
    window.addEventListener("ars-calendar:refresh", this._refreshHandler);
    setTimeout(() => {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: "open" });
      }
      this.render();
    }, 0);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("resize", this._resizeHandler);
    window.removeEventListener("ars-calendar:clearAllData", this._clearDataHandler);
    window.removeEventListener("ars-calendar:refresh", this._refreshHandler);
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
      const parsedDays = parseStringArrayAttribute(newVal, 7);
      if (parsedDays) {
        this.localizedAbbreviatedDays = parsedDays;
      }
      this.render();
    }
    if (attrName === "localized_months") {
      const parsedMonths = parseStringArrayAttribute(newVal, 12);
      if (parsedMonths) {
        this.months = parsedMonths;
      }
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
      this.cssVars = parseObjectAttribute(newVal);
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
    const { width, height } = ArsCalendar.#getCellDimensions(this, null);
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
