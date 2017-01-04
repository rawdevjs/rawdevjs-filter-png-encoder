'use strict'

function buildTable () {
  let table = new Uint32Array(256)

  for (let i = 0; i < 256; i++) {
    let t = i

    for (var j = 0; j < 8; j++) {
      t = t & 1 ? (t >>> 1) ^ 0xEDB88320 : t >>> 1
    }

    table[i] = t
  }

  return table
}

class Crc32 {
  constructor () {
    this.crc = -1
    this.table = buildTable()
  }

  append (data) {
    if (data) {
      for (let offset = 0; offset < data.length; offset++) {
        this.crc = (this.crc >>> 8) ^ this.table[(this.crc ^ data[offset]) & 0xff]
      }
    }

    return ~this.crc
  }
}

module.exports = Crc32
