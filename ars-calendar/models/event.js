import Assert from '../../../arslib/util/assert.js'

export default function Event({text = '', color = 'white', day, month, year}) {
  Assert.assertIsNumber(day)
  Assert.assertIsNumber(month)
  Assert.assertIsNumber(year)

  this.text = text
  this.color = color
  this.day = day
  this.month = month
  this.year = year
}

