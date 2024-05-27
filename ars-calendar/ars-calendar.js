import { EObject, ImageUtil } from "arslib";
import Swipeable from "../mixins/swipeable.js";
import WebComponentBase from "../web-component-base/web-component-base.js";
import getTemplate from "./ars-calendar-html.js";

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
//</ars-calendar>

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
  }

  allAttributesChangedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });

    // this is causing the rendering without vars set when they are (I don't know why)
    // this._render()
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
    if (!this.shadowRoot) return;

    this.fillDaySlots(this.monthToShow, this.yearToShow);

    let self = this;
    this.shadowRoot.innerHTML = eval("`" + getTemplate(self) + "`");
    let dayElements = this.shadowRoot.querySelectorAll(
      ".curr > tbody > tr > td",
    );
    for (let weekIndex = 0; weekIndex < this.WEEKS_IN_MONTH; weekIndex++) {
      for (
        let dayOfWeekIndex = 0;
        dayOfWeekIndex < this.DAYS_IN_WEEK;
        dayOfWeekIndex++
      ) {
        let dayElement =
          dayElements[this.getDaySlotIndex(weekIndex, dayOfWeekIndex)];
        let backgroundCanvas =
          this.daySlotsColors[this.getDaySlotIndex(weekIndex, dayOfWeekIndex)];
        cellWidth = dayElement.offsetWidth;
        cellHeight = dayElement.offsetHeight;
        let backgroundCanvasImage = "url(" + backgroundCanvas.toDataURL() + ")";
        dayElement.style.background = backgroundCanvasImage;
        dayElement.innerText =
          this.daySlots[this.getDaySlotIndex(weekIndex, dayOfWeekIndex)];
        dayElement.onclick = () => {
          eval(
            `this.onDayClicked(this.getDaySlotIndex(${weekIndex}, ${dayOfWeekIndex}))`,
          );
        };

        //change class if selected day
        if (
          this.selectedDay ===
            this.daySlots[this.getDaySlotIndex(weekIndex, dayOfWeekIndex)] &&
          this.selectedMonth === this.monthToShow &&
          this.selectedYear === this.yearToShow
        ) {
          dayElement.classList.toggle("selected-day");
        }
      }
    }
    let prevButton = this.shadowRoot.getElementById("prev");
    prevButton.onclick = this.previousMonth.bind(this);
    let todayButton = this.shadowRoot.getElementById("today");
    todayButton.onclick = this.setSelectedDateToToday.bind(this);
    let nextButton = this.shadowRoot.getElementById("next");
    nextButton.onclick = this.nextMonth.bind(this);
  }

  static get observedAttributes() {
    return [
      "localized_abbreviated_days",
      "localized_months",
      "localized_today",
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

  // Return canvas with colors (or white)
  getColorCanvasFromDate(day, month, year) {
    let colorsForDate = this.events
      .filter(
        (eventFound) =>
          eventFound.day === day &&
          eventFound.month === month &&
          eventFound.year === year,
      )
      .map((event) => event.color);

    if (!colorsForDate.length) {
      return ImageUtil.createPieGraphWithEvenlyDistributedColors(
        cellWidth,
        cellHeight,
        ["white"],
      );
    }
    return ImageUtil.createPieGraphWithEvenlyDistributedColors(
      cellWidth,
      cellHeight,
      colorsForDate,
    );
  }

  buildDayAndClassSlots() {
    this.daySlots = new Array(this.WEEKS_IN_MONTH * this.DAYS_IN_WEEK).fill(
      null,
    );
    this.daySlotsColors = this.daySlots.map(() =>
      ImageUtil.createPieGraphWithEvenlyDistributedColors(
        cellWidth,
        cellHeight,
        ["white"],
      ),
    );
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
