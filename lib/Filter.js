'use strict'

const Encoder = require('./Encoder')

class Filter {
  constructor (options) {
    this.label = 'PNG encoder'
    this.inPlace = false
    this.dirty = true

    this.options = options || {}
  }

  process (image) {
    let encoder = new Encoder()

    return Promise.resolve(encoder.encode(
      image.croppedArray,
      image.width,
      image.height,
      image.bufferWidth,
      image.components.length,
      image.componentSize))
  }
}

module.exports = Filter
