import { EObject, ImageUtil } from "arslib";
import { SwipeableMixin } from "../mixins/swipeable/swipeable.js";
import WebComponentBase from "../web-component-base/web-component-base.js";
import { DEFAULT_CSS } from "./ars-calendar-css.js";
import { renderCalendarHTML } from "./ars-calendar-html.js";

// store here cell dimensions needed to draw the pie charts
let cellWidth;
let cellHeight;

// *** USAGE ***
//<ars-calendar
//  id="<calendar_id>"> <- mandatory
//  events="<strigified object array>" <- optional, initial value
//  localized_abbreviated_days = "["day1","day2",...,"day3"]">
//  localized_months = "["month1","month2",...,"month3"]"
//  localized_today = "<today word localized>"
//  custom-css = "<custom CSS string>" <- optional, adds to default styles
//  css-vars = "{"var-name": "value", ...}" <- optional, CSS custom properties
//</ars-calendar>

// *** CUSTOMIZATION ***
//
// CSS Variables (use css-vars attribute or setCSSVars() method):
// --ars-calendar-bg: background color
// --ars-calendar-shadow: box shadow
// --ars-calendar-border-radius: border radius
// --ars-calendar-header-bg: header background
// --ars-calendar-header-height: header height
// --ars-calendar-header-color: header text color
// --ars-calendar-header-text-shadow: header text shadow
// --ars-calendar-button-hover-bg: button hover background
// --ars-calendar-table-bg: table background
// --ars-calendar-cell-color: cell text color
// --ars-calendar-cell-width: cell width
// --ars-calendar-cell-height: cell height
// --ars-calendar-cell-border: cell border
// --ars-calendar-days-header-color: days header color
// --ars-calendar-days-border: days header border
// --ars-calendar-selected-color: selected day color
// --ars-calendar-selected-shadow: selected day shadow
// --ars-calendar-cell-hover-shadow: cell hover shadow
//
// Methods:
// setCustomTemplate(templateFunction) - provide custom HTML template to completely override calendar structure
// setCSSVars(cssVarsObject) - set CSS variables programmatically
// getCSSVars() - get current CSS variables

// *** EVENTS ***

// * INPUT *
// arsCalendarElement.addEvent(event)
// arsCalendarElement.removeEvent(event)
// true: ok, false: not found
// arsCalendarElement.changeEvent(eventDate, newText, newColor)
// arsCalendarElement.selectDate(day,month,year)
// arsCalendarElement.setSelectedDateToToday()

// 'ars-calendar:clearAllData'

// 'ars-calendar:refresh'

// * OUTPUT *
// 'ars-calendar:daySelected'
// detail: {
//   'id': <calendar-id>,
//   'day': <day>,
//   'month': <month>,
//   'year': <year>,
//   'events': [<list_of_events_for_the_selected_day>]
// }

// Pure utility functions
const DEFAULT_MONTHS = [
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

const DEFAULT_ABBREVIATED_DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const DEFAULT_TODAY = "Today";

const WEEKS_IN_MONTH = 6;
const DAYS_IN_WEEK = 7;

// Pure function to get current date info
const getCurrentDateInfo = () => {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear(),
    day: now.getDate(),
  };
};

// Pure function to check if events are the same
const areEventsEqual = (event1, event2) =>
  EObject.hasSameProperties(event1, event2);

// Pure function to find event by date
const findEventByDate = (events, day, month, year) =>
  events.find((ev) => ev.day === day && ev.month === month && ev.year === year);

// Pure function to filter events by date
const getEventsByDate = (events, day, month, year) =>
  events.filter(
    (event) =>
      event.day === day && event.month === month && event.year === year,
  );

// Pure function to remove event from array
const removeEventFromArray = (events, eventToRemove) =>
  events.filter(
    (ev) =>
      ev.text !== eventToRemove.text ||
      ev.day !== eventToRemove.day ||
      ev.month !== eventToRemove.month ||
      ev.year !== eventToRemove.year,
  );

// Pure function to create day selected event
const createDaySelectedEvent = (id, day, month, year, events) =>
  new CustomEvent("ars-calendar:daySelected", {
    detail: { id, day, month, year, events },
    bubbles: true,
    composed: true,
  });

// Pure function to calculate number of days in month
const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();

// Pure function to get first day of month
const getFirstDayOfMonth = (month, year) => new Date(year, month).getDay();

// Pure function to get day slot index
const getDaySlotIndex = (weekIndex, dayOfWeekIndex) =>
  weekIndex * DAYS_IN_WEEK + dayOfWeekIndex;

// Pure function to create empty day slots
const createEmptyDaySlots = () =>
  new Array(WEEKS_IN_MONTH * DAYS_IN_WEEK).fill(null);

// Pure function to create empty color slots
const createEmptyColorSlots = () =>
  new Array(WEEKS_IN_MONTH * DAYS_IN_WEEK).fill(null);

// Pure function to get colors for date
const getColorsForDate = (events, day, month, year) =>
  events
    .filter(
      (event) =>
        event.day === day && event.month === month && event.year === year,
    )
    .map((event) => event.color);

// Pure function to create color canvas
const createColorCanvas = (colors, width, height) => {
  if (!colors.length) return null;
  return ImageUtil.createPieGraphWithEvenlyDistributedColors(
    width,
    height,
    colors,
  );
};

// Pure function to get cell dimensions
const getCellDimensions = (element) => {
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
};

// Pure function to create CSS variables string
const createCSSVarsString = (cssVars) => {
  if (!cssVars || Object.keys(cssVars).length === 0) return "";

  let cssVarString = ":host {\n";
  for (const [key, value] of Object.entries(cssVars)) {
    cssVarString += `  --${key}: ${value};\n`;
  }
  cssVarString += "}\n";

  return cssVarString;
};

// Pure function to create button handlers
const createButtonHandlers = (calendar) => ({
  prev: () => calendar.previousMonth(),
  today: () => calendar.setSelectedDateToToday(),
  next: () => calendar.nextMonth(),
});

// Pure function to check if day is selected
const isDaySelected = (
  day,
  month,
  year,
  selectedDay,
  selectedMonth,
  selectedYear,
) => day === selectedDay && month === selectedMonth && year === selectedYear;

// Pure function to create day click handler
const createDayClickHandler = (calendar, daySlot) => () => {
  calendar.onDayClicked(daySlot);
};

// Pure function to fill day slots
const fillDaySlots = (daySlots, daySlotsColors, month, year, events) => {
  const firstDay = getFirstDayOfMonth(month, year);
  const numDays = getDaysInMonth(month, year);

  for (
    let daySlotIndex = firstDay;
    daySlotIndex < numDays + firstDay;
    daySlotIndex++
  ) {
    const dayNumber = daySlotIndex - firstDay + 1;
    daySlots[daySlotIndex] = dayNumber;

    const colors = getColorsForDate(events, dayNumber, month, year);
    const { width, height } = getCellDimensions();
    daySlotsColors[daySlotIndex] = createColorCanvas(colors, width, height);
  }

  return { daySlots, daySlotsColors };
};

// Pure function to create resize handler
const createResizeHandler = (calendar) => () => {
  if (!calendar.id) return;
  calendar._render();
};

// Pure function to create clear data handler
const createClearDataHandler = (calendar) => (e) => {
  if (e.detail.id !== calendar.id) return;
  calendar.clearAllData();
};

// Pure function to create refresh handler
const createRefreshHandler = (calendar) => (e) => {
  if (e.detail.id !== calendar.id) return;
  calendar.refresh();
};

// Pure function to create swipe handlers
const createSwipeHandlers = (calendar) => ({
  onSwipeRight: () => calendar.previousMonth(),
  onSwipeLeft: () => calendar.nextMonth(),
});

// Pure function to apply CSS variables
const applyCSSVars = (shadowRoot, cssVars) => {
  if (!cssVars || !shadowRoot) return;

  let cssVarStyle = shadowRoot.querySelector("style.css-vars-style");
  if (!cssVarStyle) {
    cssVarStyle = document.createElement("style");
    cssVarStyle.className = "css-vars-style";
    shadowRoot.prepend(cssVarStyle);
  }

  cssVarStyle.textContent = createCSSVarsString(cssVars);
};

// Pure function to initialize calendar
const initializeCalendar = (calendar) => {
  const currentDate = getCurrentDateInfo();

  calendar.events = [];
  calendar.months = [...DEFAULT_MONTHS];
  calendar.localizedAbbreviatedDays = [...DEFAULT_ABBREVIATED_DAYS];
  calendar.localizedToday = DEFAULT_TODAY;
  calendar.monthToShow = currentDate.month;
  calendar.yearToShow = currentDate.year;
  calendar.WEEKS_IN_MONTH = WEEKS_IN_MONTH;
  calendar.DAYS_IN_WEEK = DAYS_IN_WEEK;
  calendar.daySlots = createEmptyDaySlots();
  calendar.daySlotsColors = createEmptyColorSlots();
  calendar.customTemplate = null;
  calendar.customCSS = null;
  calendar.cssVars = {};
  calendar.defaultCSS = DEFAULT_CSS;

  fillDaySlots(
    calendar.daySlots,
    calendar.daySlotsColors,
    calendar.monthToShow,
    calendar.yearToShow,
    calendar.events,
  );

  return calendar;
};

// Pure function to create event handlers
const createEventHandlers = (calendar) => ({
  addEvent: (event) => {
    const sameEventFound = calendar.events.find((ev) =>
      areEventsEqual(ev, event),
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
    calendar.events = removeEventFromArray(calendar.events, eventDate);
    calendar.selectDate(eventDate.day, eventDate.month, eventDate.year);
  },

  changeEvent: (eventDate, newText, newColor) => {
    const event = findEventByDate(
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

    calendar._sendDaySelectedEvent();
    calendar._render();
  },

  refresh: () => calendar._render(),
});

class ArsCalendar extends WebComponentBase {
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

    // Add swipe support
    const swipeHandlers = ArsCalendar.#createSwipeHandlers(this);
    Object.assign(this, swipeHandlers);
    SwipeableMixin.call(this);
  }

  connectedCallback() {
    super.connectedCallback();
    setTimeout(() => {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: "open" });
      }
      this.#render();
    }, 0);
  }

  allAttributesChangedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    setTimeout(() => {
      this.#render();
    }, 0);
  }

  clearAllData() {
    this.events = [];
    this.#render();
  }

  #getEventsByDate(day, month, year) {
    return ArsCalendar.#getEventsByDate(this.events, day, month, year);
  }

  clearSelectedDate() {
    this.selectedDay = null;
    this.selectedMonth = null;
    this.selectedYear = null;
  }

  #sendDaySelectedEvent() {
    const events = this.#getEventsByDate(
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

  setSelectedDateToToday() {
    const date = new Date();
    this.monthToShow = date.getMonth();
    this.yearToShow = date.getFullYear();
    this.selectDate(date.getDate(), this.monthToShow, this.yearToShow);
  }

  #render() {
    console.log("ARS Calendar render called");
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
        : renderCalendarHTML(this);
      this.shadowRoot.innerHTML = template;

      const dayElements = this.shadowRoot.querySelectorAll(
        ".calendar-body > tbody > tr > td",
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
            ArsCalendar.#isDaySelected(
              day,
              this.monthToShow,
              this.yearToShow,
              this.selectedDay,
              this.selectedMonth,
              this.selectedYear,
            )
          ) {
            dayElement.classList.add("selected-day");
          } else {
            dayElement.classList.remove("selected-day");
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
      this.#render();
    }
    if (attrName === "localized_months") {
      this.months = JSON.parse(newVal);
      this.#render();
    }
    if (attrName === "localized_today") {
      this.localizedToday = newVal;
      this.#render();
    }
    if (attrName === "custom-css") {
      this.customCSS = newVal;
      this.#render();
    }
    if (attrName === "css-vars") {
      this.cssVars = JSON.parse(newVal || "{}");
      ArsCalendar.#applyCSSVars(this.shadowRoot, this.cssVars);
      this.#render();
    }
  }

  setCustomTemplate(templateFunction) {
    this.customTemplate = templateFunction;
    this.#render();
  }

  #applyCSSVars() {
    ArsCalendar.#applyCSSVars(this.shadowRoot, this.cssVars);
  }

  setCSSVars(cssVars) {
    this.cssVars = { ...cssVars };
    this.#applyCSSVars();
  }

  getCSSVars() {
    return { ...this.cssVars };
  }

  monthToShowString(month) {
    return this.months[month];
  }

  getDaySlotIndex(weekIndex, dayOfWeekIndex) {
    return ArsCalendar.#getDaySlotIndex(weekIndex, dayOfWeekIndex);
  }

  previousYear() {
    this.yearToShow--;
    this.selectDate(this.selectedDay, this.monthToShow, this.yearToShow);
  }

  nextYear() {
    this.yearToShow++;
    this.selectDate(this.selectedDay, this.monthToShow, this.yearToShow);
  }

  previousMonth() {
    if (this.monthToShow === 0) {
      this.monthToShow = 11;
      this.yearToShow--;
    } else this.monthToShow--;

    this.selectDate(this.selectedDay, this.monthToShow, this.yearToShow);
  }

  nextMonth() {
    if (this.monthToShow === 12 - 1) {
      this.monthToShow = 0;
      this.yearToShow++;
    } else this.monthToShow++;

    this.selectDate(this.selectedDay, this.monthToShow, this.yearToShow);
  }

  fillDaySlots(month, year) {
    ArsCalendar.#fillDaySlots(
      this.daySlots,
      this.daySlotsColors,
      month,
      year,
      this.events,
    );
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
    return ImageUtil.createPieGraphWithEvenlyDistributedColors(
      width,
      height,
      colors,
    );
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
      calendar._render();
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
      calendar.refresh();
    };
  }

  static #createSwipeHandlers(calendar) {
    return {
      onSwipeRight: () => calendar.previousMonth(),
      onSwipeLeft: () => calendar.nextMonth(),
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
        calendar._sendDaySelectedEvent();
        calendar._render();
      },
      refresh: () => calendar._render(),
    };
  }
}

window.customElements.define("ars-calendar", ArsCalendar);

export { ArsCalendar, ArsCalendar as default };
