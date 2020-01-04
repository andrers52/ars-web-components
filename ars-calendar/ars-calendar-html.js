import css from './ars-calendar-css.js'

export default function getTemplate(self) {
  return `
    <style>
      ${css}
    </style>

    <div id="cal">
      <div class="header">
        <div class="button" id="prev" > &lang; </div>
        <div class="month-year" id="label"> ${self.monthToShowString(self.monthToShow)} ${self.yearToShow} </div>
        <div style="display: flex">
          <div class="button right" id="today" > ${self.localizedToday} </div>
          <div class="button right" id="next" > &rang; </div>
        </div>
      </div>
      <table id="localizedAbbreviatedDays">
        <td>${self.localizedAbbreviatedDays[0]}</td>
        <td>${self.localizedAbbreviatedDays[1]}</td>
        <td>${self.localizedAbbreviatedDays[2]}</td>
        <td>${self.localizedAbbreviatedDays[3]}</td>
        <td>${self.localizedAbbreviatedDays[4]}</td>
        <td>${self.localizedAbbreviatedDays[5]}</td>
        <td>${self.localizedAbbreviatedDays[6]}</td>
      </table>
      <div id="cal-frame">
        <table class="curr">
          <tbody>
            <tr> 
              <td> </td> <td> </td> <td> </td> <td> </td> <td> </td> <td> </td> <td> </td>
            </tr>
            <tr> 
              <td> </td> <td> </td> <td> </td> <td> </td> <td> </td> <td> </td> <td> </td>
            </tr>
            <tr> 
              <td> </td> <td> </td> <td> </td> <td> </td> <td> </td> <td> </td> <td> </td>
            </tr>
            <tr> 
              <td> </td> <td> </td> <td> </td> <td> </td> <td> </td> <td> </td> <td> </td>
            </tr>
            <tr> 
              <td> </td> <td> </td> <td> </td> <td> </td> <td> </td> <td> </td> <td> </td>
            </tr>
            <tr> 
              <td> </td> <td> </td> <td> </td> <td> </td> <td> </td> <td> </td> <td> </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
}
