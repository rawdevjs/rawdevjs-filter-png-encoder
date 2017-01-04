'use strict'

const zlib = require('zlibjs')
const Crc32 = require('./Crc32')
const DataStream = require('datastream.js')

class Encoder {
  constructor () {
    this.dataStream = new DataStream(0, 0, DataStream.BIG_ENDIAN)
  }

  encode (array, width, height, sliceLength, components, componentSize) {
    this.dataStream.writeUint8Array(Encoder.Signature)

    let colorType = null

    if (components === 1) {
      colorType = Encoder.ColorTypeGreyscale
    } else if (components === 3) {
      colorType = Encoder.ColorTypeTruecolor
    }

    this.writeIHDRChunk(width, height, componentSize * 8, colorType)

    this.writeIDATChunk(array, width, height, sliceLength, components, componentSize)
    this.writeIENDChunk()

    return this.dataStream.buffer
  }

  writeIHDRChunk (width, height, bitDepth, colorType, compressionMethod, filterMethod, interlaceMethod) {
    let chunkDataStream = new DataStream(0, 0, DataStream.BIG_ENDIAN)

    chunkDataStream.writeUint32(width)
    chunkDataStream.writeUint32(height)
    chunkDataStream.writeUint8(bitDepth || 8)
    chunkDataStream.writeUint8(colorType !== undefined ? colorType : Encoder.ColorTypeTruecolor)
    chunkDataStream.writeUint8(compressionMethod !== undefined ? compressionMethod : Encoder.CompressionMethdDeflateInflate)
    chunkDataStream.writeUint8(filterMethod !== undefined ? filterMethod : Encoder.FilterMethodBasic)
    chunkDataStream.writeUint8(interlaceMethod !== undefined ? interlaceMethod : Encoder.InterlaceMethodNull)

    this.writeChunkHeader(Encoder.ChunkIHDR, chunkDataStream.buffer)
  }

  writeIDATChunk (buffer, width, height, sliceLength, components, componentSize) {
    let chunkDataStream = new DataStream(0, 0, DataStream.BIG_ENDIAN)
    let data = new DataStream(0, 0, DataStream.BIG_ENDIAN)

    let writeSlice = null

    if (componentSize === 1) {
      writeSlice = data.writeUint8Array.bind(data)
    } else if (componentSize === 2) {
      writeSlice = data.writeUint16Array.bind(data)
    }

    for (let i = 0; i < height; i++) {
      let slice = buffer.subarray(i * sliceLength * components, (i * sliceLength + width) * components)

      data.writeUint8(Encoder.FilterTypeNone)

      writeSlice(slice)
    }

    chunkDataStream.writeUint8Array(zlib.deflateSync(new Uint8Array(data.buffer)))

    this.writeChunkHeader(Encoder.ChunkIDAT, chunkDataStream.buffer)
  }

  writeIENDChunk () {
    this.writeChunkHeader(Encoder.ChunkIEND)
  }

  writeSRGBChunk () {
    this.writeChunkHeader(Encoder.ChunkSRGB, new Uint8Array([0]))
  }

  writeChunkHeader (type, data) {
    let buffer = data != null ? new Uint8Array(data) : null

    this.dataStream.writeUint32(buffer != null ? buffer.length : 0)
    this.dataStream.writeUint8Array(type)

    if (buffer) {
      this.dataStream.writeUint8Array(buffer)
    }

    let crc32 = new Crc32()
    crc32.append(type)
    this.dataStream.writeUint32(crc32.append(buffer))
  }
}

Encoder.Signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
Encoder.ChunkIHDR = new Uint8Array([73, 72, 68, 82])
Encoder.ChunkIDAT = new Uint8Array([73, 68, 65, 84])
Encoder.ChunkIEND = new Uint8Array([73, 69, 78, 68])
Encoder.ChunkSRGB = new Uint8Array([115, 82, 71, 66])
Encoder.ColorTypeGreyscale = 0
Encoder.ColorTypeTruecolor = 2
Encoder.ColorTypeIndexedColor = 3
Encoder.ColorTypeGreyscaleAlpha = 4
Encoder.ColorTypeTruecolorAlpha = 6
Encoder.CompressionMethodDeflateInflate = 0
Encoder.FilterMethodBasic = 0
Encoder.FilterTypeNone = 0
Encoder.FilterTypeSub = 1
Encoder.FilterTypeUp = 2
Encoder.FilterTypeAverage = 3
Encoder.FilterTypePaeth = 4
Encoder.InterlaceMethodNull = 0
Encoder.InterlaceMethodAdam7 = 1

module.exports = Encoder
