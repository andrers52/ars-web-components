import { EObject, ImageUtil } from "arslib";
import Swipeable from "../mixins/swipeable/swipeable.js";
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

class ArsCalendar extends WebComponentBase {
  constructor() {
    super();

    this.events = [];

    // defaults
    this.months = [
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
    this.localizedAbbreviatedDays = [
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ];
    this.localizedToday = "Today";

    this.monthToShow = new Date().getMonth();
    this.yearToShow = new Date().getFullYear();
    this.WEEKS_IN_MONTH = 6;
    this.DAYS_IN_WEEK = 7;

    this.daySlots = [];
    // image from events
    this.daySlotsColors = [];

    this.fillDaySlots(this.monthToShow, this.yearToShow);

    // ** EXTERNAL INPUT EVENTS **

    window.addEventListener("resize", () => {
      if (!this.id) return; // Do not render when there is no id (not sure why this is happening)
      this._render();
    });

    // receives: id, text, color, day, month and year
    this.addEvent = function (event) {
      const sameEventFound = this.events.find((ev) =>
        EObject.hasSameProperties(ev, event),
      );
      if (sameEventFound) return;
      const newEvent = Object.assign({}, event);
      this.events.push(newEvent);
      this.selectDate(event.day, event.month, event.year);
    };

    this.removeEvent = function (eventDate) {
      if (!eventDate) {
        console.log("no event found");
        return;
      }
      this.events = this.events.filter(
        (ev) =>
          ev.text !== eventDate.text ||
          ev.day !== eventDate.day ||
          ev.month !== eventDate.month ||
          ev.year !== eventDate.year,
      );
      this.selectDate(eventDate.day, eventDate.month, eventDate.year);
    };

    this.changeEvent = function (eventDate, newText, newColor) {
      const event = this.events.find(
        (ev) =>
          ev.day === eventDate.day &&
          ev.month === eventDate.month &&
          ev.year === eventDate.year,
      );
      if (!event) return false;
      event.text = newText || event.text;
      event.color = newColor || event.color;
      this.selectDate(event.day, event.month, event.year);
      return true;
    };

    this.selectDate = function (day, month, year) {
      if (day === null || month === null || year === null) return;

      // update day selection
      this.selectedDay = day;
      this.selectedMonth = month;
      this.selectedYear = year;

      this._sendDaySelectedEvent();
      this._render();
    };

    window.addEventListener("ars-calendar:clearAllData", (e) => {
      if (e.detail.id !== this.id) return;
      this.clearAllData();
    });

    window.addEventListener("ars-calendar:refresh", (e) => {
      if (e.detail.id !== this.id) return;
      this.refresh();
    });

    this.refresh = function () {
      this._render();
    };

    // Swipe support
    this.onSwipeRight = function () {
      this.previousMonth();
    };
    this.onSwipeLeft = function () {
      this.nextMonth();
    };
    // this.onSwipeUp    = function()  { this.previousYear()   }
    // this.onSwipeDown  = function()  { this.nextYear()       }
    Swipeable.call(this);

    // Customization properties
    this.customTemplate = null; // Custom template function
    this.customCSS = null; // Custom CSS string
    this.cssVars = {}; // CSS variables for theming
    this.defaultCSS = DEFAULT_CSS; // Default CSS styles
  }

  connectedCallback() {
    super.connectedCallback();
    // Ensure initial render when component is added to DOM
    setTimeout(() => {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: "open" });
      }
      this._render();
    }, 0);
  }

  allAttributesChangedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });

    // Render after all attributes are processed
    setTimeout(() => {
      this._render();
    }, 0);
  }

  clearAllData() {
    this.events = [];
    this._render();
  }

  _getEventsByDate(day, month, year) {
    return this.events.filter(
      (event) =>
        event.day === day && event.month === month && event.year === year,
    );
  }

  clearSelectedDate() {
    this.selectedDay = null;
    this.selectedMonth = null;
    this.selectedYear = null;
  }

  _sendDaySelectedEvent() {
    this.dispatchEvent(
      new CustomEvent("ars-calendar:daySelected", {
        detail: {
          id: this.id,
          day: this.selectedDay,
          month: this.selectedMonth,
          year: this.selectedYear,
          events: this._getEventsByDate(
            this.selectedDay,
            this.selectedMonth,
            this.selectedYear,
          ),
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  setSelectedDateToToday() {
    const date = new Date();
    // update display
    this.monthToShow = date.getMonth();
    this.yearToShow = date.getFullYear();
    this.selectDate(date.getDate(), this.monthToShow, this.yearToShow);
  }

  _render() {
    console.log("ARS Calendar render called");
    if (!this.shadowRoot) return;

    try {
      this.fillDaySlots(this.monthToShow, this.yearToShow);

      let self = this;
      // Use custom template if provided, otherwise use default calendar HTML
      const template = this.customTemplate
        ? this.customTemplate(self)
        : renderCalendarHTML(self);
      this.shadowRoot.innerHTML = template;

      let dayElements = this.shadowRoot.querySelectorAll(
        ".calendar-body > tbody > tr > td",
      );

      for (let weekIndex = 0; weekIndex < this.WEEKS_IN_MONTH; weekIndex++) {
        for (
          let dayOfWeekIndex = 0;
          dayOfWeekIndex < this.DAYS_IN_WEEK;
          dayOfWeekIndex++
        ) {
          let dayElement =
            dayElements[this.getDaySlotIndex(weekIndex, dayOfWeekIndex)];
          if (!dayElement) continue;

          let backgroundCanvas =
            this.daySlotsColors[
              this.getDaySlotIndex(weekIndex, dayOfWeekIndex)
            ];

          // Update cell dimensions for future renders
          if (dayElement.offsetWidth > 0) {
            cellWidth = dayElement.offsetWidth;
            cellHeight = dayElement.offsetHeight;
          }

          // Apply background only if there's a canvas (events exist)
          if (backgroundCanvas) {
            let backgroundCanvasImage =
              "url(" + backgroundCanvas.toDataURL() + ")";
            dayElement.style.backgroundImage = backgroundCanvasImage;
          } else {
            // Clear any existing background for days with no events
            dayElement.style.backgroundImage = "none";
          }

          dayElement.innerText =
            this.daySlots[this.getDaySlotIndex(weekIndex, dayOfWeekIndex)] ||
            "";
          dayElement.onclick = () => {
            this.onDayClicked(this.getDaySlotIndex(weekIndex, dayOfWeekIndex));
          };

          //change class if selected day
          if (
            this.selectedDay ===
              this.daySlots[this.getDaySlotIndex(weekIndex, dayOfWeekIndex)] &&
            this.selectedMonth === this.monthToShow &&
            this.selectedYear === this.yearToShow
          ) {
            dayElement.classList.add("selected-day");
          } else {
            dayElement.classList.remove("selected-day");
          }
        }
      }

      let prevButton = this.shadowRoot.getElementById("prev");
      if (prevButton) prevButton.onclick = this.previousMonth.bind(this);
      let todayButton = this.shadowRoot.getElementById("today");
      if (todayButton)
        todayButton.onclick = this.setSelectedDateToToday.bind(this);
      let nextButton = this.shadowRoot.getElementById("next");
      if (nextButton) nextButton.onclick = this.nextMonth.bind(this);

      // Apply CSS variables after rendering
      this._applyCSSVars();
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
      this._render();
    }
    if (attrName === "localized_months") {
      this.months = JSON.parse(newVal);
      this._render();
    }
    if (attrName === "localized_today") {
      this.localizedToday = newVal;
      this._render();
    }
    if (attrName === "custom-css") {
      this.customCSS = newVal;
      this._render();
    }
    if (attrName === "css-vars") {
      this.cssVars = JSON.parse(newVal || "{}");
      this._applyCSSVars();
      this._render();
    }
  }

  // Method to set custom template
  setCustomTemplate(templateFunction) {
    this.customTemplate = templateFunction;
    this._render();
  }

  // Method to apply CSS variables
  _applyCSSVars() {
    if (!this.cssVars || !this.shadowRoot) return;

    // Find or create a style element specifically for CSS variables
    let cssVarStyle = this.shadowRoot.querySelector("style.css-vars-style");
    if (!cssVarStyle) {
      cssVarStyle = document.createElement("style");
      cssVarStyle.className = "css-vars-style";
      this.shadowRoot.prepend(cssVarStyle);
    }

    let cssVarString = ":host {\n";
    for (const [key, value] of Object.entries(this.cssVars)) {
      cssVarString += `  --${key}: ${value};\n`;
    }
    cssVarString += "}\n";

    cssVarStyle.textContent = cssVarString;
  }

  // Method to set CSS variables programmatically
  setCSSVars(cssVars) {
    // Replace all CSS variables, not merge
    this.cssVars = { ...cssVars };
    this._applyCSSVars();
  }

  // Method to get current CSS variables
  getCSSVars() {
    return { ...this.cssVars };
  }

  monthToShowString(month) {
    return this.months[month];
  }
  getDaySlotIndex(weekIndex, dayOfWeekIndex) {
    return weekIndex * this.DAYS_IN_WEEK + dayOfWeekIndex;
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
    this.buildDayAndClassSlots();
    const firstDay = this.firstDaySlotInMonth(month, year);
    const numDays = this.numDaysInMonth(month, year);
    let dayNumber = 1;
    for (
      let daySlotIndex = firstDay;
      daySlotIndex < numDays + firstDay;
      daySlotIndex++
    ) {
      this.daySlots[daySlotIndex] = dayNumber;
      this.daySlotsColors[daySlotIndex] = this.getColorCanvasFromDate(
        dayNumber,
        month,
        year,
      );
      dayNumber++;
    }
  }

  // Return canvas with colors (or null for no events)
  getColorCanvasFromDate(day, month, year) {
    // Use default cell dimensions if not yet calculated
    const defaultCellWidth = cellWidth || 30;
    const defaultCellHeight = cellHeight || 30;

    let colorsForDate = this.events
      .filter(
        (eventFound) =>
          eventFound.day === day &&
          eventFound.month === month &&
          eventFound.year === year,
      )
      .map((event) => event.color);

    if (!colorsForDate.length) {
      // Return null for days with no events - no background will be applied
      return null;
    }
    return ImageUtil.createPieGraphWithEvenlyDistributedColors(
      defaultCellWidth,
      defaultCellHeight,
      colorsForDate,
    );
  }

  buildDayAndClassSlots() {
    // Use default cell dimensions if not yet calculated
    const defaultCellWidth = cellWidth || 30;
    const defaultCellHeight = cellHeight || 30;

    this.daySlots = new Array(this.WEEKS_IN_MONTH * this.DAYS_IN_WEEK).fill(
      null,
    );
    // Initialize with null - no background for empty days
    this.daySlotsColors = this.daySlots.map(() => null);
  }

  numDaysInMonth(month, year) {
    // + 1 because month is 1 base (go figure...)
    return new Date(year, month + 1, 0).getDate();
  }

  firstDaySlotInMonth(month, year) {
    return new Date(year, month).getDay();
  }

  // *** OUTPUT EVENT ***

  // Emits event with clicked date to receive info on what to store on that date
  onDayClicked(daySlot) {
    if (!this.daySlots[daySlot]) return;
    this.selectDate(this.daySlots[daySlot], this.monthToShow, this.yearToShow);
  }
}

window.customElements.define("ars-calendar", ArsCalendar);

export { ArsCalendar, ArsCalendar as default };
