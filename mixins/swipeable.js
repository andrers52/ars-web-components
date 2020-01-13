// MIXIN -> Swipeable.call(<object_to_extend>)
//          if is a class, put on constructor, after super()

import Assert from '../../arslib/util/assert.js'

function Swipeable() {
  // Assert.assertIsFunction(this.onSwipeRight,  'onSwipeRight not found')
  // Assert.assertIsFunction(this.onSwipeLeft,   'onSwipeLeft not found')
  // Assert.assertIsFunction(this.onSwipeUp,     'onSwipeUp not found')
  // Assert.assertIsFunction(this.onSwipeDown,   'onSwipeDown not found')

  // Swipe Up / Down / Left / Right
  this._initialX = null
  this._initialY = null
  this._detectedMovementDirection = null // ['UP','DOWN', 'LEFT', 'RIGHT']

  this._startTouch = function(evt) {
    this._initialX = evt.touches[0].clientX
    this._initialY = evt.touches[0].clientY
  }

  this._moveTouch = function(evt) {

    if (this._initialX === null) {
      return
    }
    
    if (this._initialY === null) {
      return
    }
    
    let currentX = evt.touches[0].clientX
    let currentY = evt.touches[0].clientY
    
    let diffX = this._initialX - currentX
    let diffY = this._initialY - currentY
  
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // sliding horizontally
      if (diffX > 0) {
        this._detectedMovementDirection = 'LEFT'
        this.onSwipeLeft && evt.preventDefault()
        return
      } else {
        this._detectedMovementDirection = 'RIGHT'
        this.onSwipeRight && evt.preventDefault()
        return
      }  
    } else {
      // sliding vertically
      if (diffY > 0) {
        // swiped up
        this._detectedMovementDirection = 'UP'
        this.onSwipeUp && evt.preventDefault()
        return
      } else {
        // swiped down
        this._detectedMovementDirection = 'DOWN'
        this.onSwipeDown && evt.preventDefault()
        return
      }  
    }
  }
  
  this._endTouch = function() {
    this._initialX = null
    this._initialY = null

    switch (this._detectedMovementDirection) {
    case 'UP':
      this.onSwipeUp && this.onSwipeUp()
      break
    case 'DOWN':
      this.onSwipeDown && this.onSwipeDown()        
      break
    case 'LEFT':
      this.onSwipeLeft && this.onSwipeLeft()
      break
    case 'RIGHT':
      this.onSwipeRight && this.onSwipeRight()    
      break
    
    default:
      Assert.assert(false, 'There is an error in your logic son... :(')
    }
    
    this._detectedMovementDirection = null
  }

  this.addEventListener('touchstart', this._startTouch.bind(this), false)
  this.addEventListener('touchmove', this._moveTouch.bind(this), false)
  this.addEventListener('touchend', this._endTouch.bind(this), false)

}

export {Swipeable as default}
export {Swipeable}