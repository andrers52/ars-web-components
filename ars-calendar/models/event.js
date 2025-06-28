// Event model for ARS Calendar component
// Represents a calendar event with validation

class Event {
  constructor({ text = "", color = "white", day, month, year }) {
    this.#validateRequiredFields(day, month, year);

    this.text = text;
    this.color = color;
    this.day = day;
    this.month = month;
    this.year = year;
  }

  // Private utility functions
  #validateRequiredFields(day, month, year) {
    if (typeof day !== "number" || isNaN(day)) {
      throw new Error("Day must be a valid number");
    }
    if (typeof month !== "number" || isNaN(month)) {
      throw new Error("Month must be a valid number");
    }
    if (typeof year !== "number" || isNaN(year)) {
      throw new Error("Year must be a valid number");
    }
  }

  #validateDateRange(day, month, year) {
    const date = new Date(year, month - 1, day);
    return (
      date.getDate() === day &&
      date.getMonth() === month - 1 &&
      date.getFullYear() === year
    );
  }

  // Public instance methods
  isValid() {
    return this.#validateDateRange(this.day, this.month, this.year);
  }

  getDate() {
    return new Date(this.year, this.month - 1, this.day);
  }

  isOnDate(date) {
    if (!(date instanceof Date)) {
      return false;
    }
    return (
      date.getDate() === this.day &&
      date.getMonth() === this.month - 1 &&
      date.getFullYear() === this.year
    );
  }

  toJSON() {
    return {
      text: this.text,
      color: this.color,
      day: this.day,
      month: this.month,
      year: this.year,
    };
  }

  static fromJSON(data) {
    return new Event(data);
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = Event;
} else if (typeof window !== "undefined") {
  window.Event = Event;
}
