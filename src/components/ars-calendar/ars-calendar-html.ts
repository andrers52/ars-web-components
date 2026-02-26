// HTML template for ARS Calendar component
// Contains the complete calendar structure

export function renderCalendarHTML(self) {
  const customCSS = self.customCSS || "";

  return `
    <style>
      ${self.defaultCSS}
      ${customCSS}
    </style>

    <div class="calendar-container">
      <div class="calendar-header">
        <div class="calendar-button" id="prev">&lang;</div>
        <div class="calendar-month-year" id="label">${self.monthToShowString(
          self.monthToShow,
        )} ${self.yearToShow}</div>
        <div class="calendar-nav-buttons">
          <div class="calendar-button right" id="today">${
            self.localizedToday
          }</div>
          <div class="calendar-button right" id="next">&rang;</div>
        </div>
      </div>
      <table class="calendar-table calendar-days-header">
        <tr>
          <td class="calendar-cell">${self.localizedAbbreviatedDays[0]}</td>
          <td class="calendar-cell">${self.localizedAbbreviatedDays[1]}</td>
          <td class="calendar-cell">${self.localizedAbbreviatedDays[2]}</td>
          <td class="calendar-cell">${self.localizedAbbreviatedDays[3]}</td>
          <td class="calendar-cell">${self.localizedAbbreviatedDays[4]}</td>
          <td class="calendar-cell">${self.localizedAbbreviatedDays[5]}</td>
          <td class="calendar-cell">${self.localizedAbbreviatedDays[6]}</td>
        </tr>
      </table>
      <div class="calendar-frame">
        <table class="calendar-table calendar-body">
          <tbody>
            <tr>
              <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td>
            </tr>
            <tr>
              <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td>
            </tr>
            <tr>
              <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td>
            </tr>
            <tr>
              <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td>
            </tr>
            <tr>
              <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td>
            </tr>
            <tr>
              <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td> <td class="calendar-cell"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}
