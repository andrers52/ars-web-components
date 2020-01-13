
// Usage: export default class NewComponent extends PressedEffect(HTMLElement)

//consts
const ANIMATION_TIME = 500
const NUM_ANIMATION_STEPS = 100
function PressedEffect(classToExtend) {
  return class extends classToExtend {
    constructor() {
      super()
      this._addPressedEffect()
    }
    
    _getRGBArrayFromBackgroundColor(element) {
      const wGCS = window.getComputedStyle
      const rgbStr = wGCS(element, null).backgroundColor
      let [rStr, gStr, bStr] = rgbStr.substring(4, rgbStr.length-1)
        .replace(/ /g, '')
        .split(',')
      return [parseInt(rStr), parseInt(gStr), parseInt(bStr),]
    }

    _getOriginalButtonColor() {
      this.origColorArray = this._getRGBArrayFromBackgroundColor(this)
    }
    _restoreButtonColor() {
      let [r, g, b] = this.origColorArray
      // this.style.backgroundColor = `rgb(${r},${g},${b})`
      this.style.backgroundImage = `radial-gradient(rgb(${r},${g},${b}), rgb(${r},${g},${b}))`
    }

    _animate(totalTime, numIterations) {
      this._getOriginalButtonColor()
      const timeSlice = totalTime / numIterations
      for(let i = 0; i < numIterations; i++) {
        setTimeout( () => {
          this._setButtonColorStep(100*i/numIterations, this.origColorArray[0],this.origColorArray[1],this.origColorArray[2])
        }, timeSlice * i)
      }
      setTimeout(this._restoreButtonColor.bind(this), totalTime)
    }

    _setButtonColorStep(percentageCompleted, r,g,b) {
      // const mediumCirclePercentage = 10
      // const innerCirclePercentage = Math.min(percentageCompleted, 100 - mediumCirclePercentage)
      // const outerCirclePercentage = 100 - (innerCirclePercentage + mediumCirclePercentage)
      // this.style.backgroundImage =
      //   `
      //     radial-gradient(circle,
      //       rgb(${r},${g},${b}) ${innerCirclePercentage}%,
      //       rgb(${bc.r},${bc.g},${bc.b}) ${mediumCirclePercentage}%,
      //       rgb(${r},${g},${b}) ${outerCirclePercentage}%
      //     )
      //   `
      this.style.backgroundImage =
        `
          radial-gradient(circle,
            rgb(255, 255, 255, 0.2) ${percentageCompleted}%,
            rgb(${r},${g},${b}) ${100 - percentageCompleted}%
          )
        `
    }

    _addPressedEffect() {
      let start = () => {
        this._animate(ANIMATION_TIME, NUM_ANIMATION_STEPS)
        setTimeout(ANIMATION_TIME + 1, this._restoreButtonColor.bind(this))
      }

      this.addEventListener('mousedown', start)
      this.addEventListener('touchstart', start)

      this.addEventListener('mouseup', this._restoreButtonColor.bind(this))
      this.addEventListener('touchend', this._restoreButtonColor.bind(this))

    }
  }
}

export {PressedEffect as default}
export {PressedEffect}