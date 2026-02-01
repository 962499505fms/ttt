import { chartsColorList } from './chartTheme'

export function convertToBase64(svgPath) {
  return new Promise((resolve, reject) => {
    fetch(svgPath)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64Data = reader.result
          resolve(base64Data)
        }
        reader.onerror = error => {
          reject(error)
        }
        reader.readAsDataURL(blob)
      })
      .catch(error => {
        reject(error)
      })
  })
}

export function getPxWidth(str) {
  var canvas = document.createElement('canvas')
  var context = canvas.getContext('2d')
  context.font = '14px sans-serif'
  var metrics = context.measureText(str)
  return metrics.width
}

export function hexToRgba(hex, alpha = 1) {
  if (!hex) return
  hex = hex.replace('#', '')
  let r, g, b
  if (hex.length === 3) {
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16)
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16)
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16)
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16)
    g = parseInt(hex.substring(2, 4), 16)
    b = parseInt(hex.substring(4, 6), 16)
  } else {
    throw new Error('Invalid hex color format')
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function isNumberDefined(value) {
  return typeof value !== 'undefined' && value !== null
}

export function getMaxLabelLength(data) {
  return data.reduce((max, current) => {
    return Math.max(max, String(current).length)
  }, 0)
}

export function calculateLeftMargin(maxLength, minWidthAuto, minWidthFixed) {
  const maxPixelWidth = maxLength * 5
  if (maxPixelWidth > minWidthAuto) {
    return 'auto'
  } else {
    return minWidthFixed
  }
}

export function isInvalidNumber(str) {
  const num = Number(str)
  return Number.isNaN(num)
}

export function formatNumber(num, d) {
  const formatted = d ? num.toFixed(d) : num.toFixed(2)
  return formatted
}

function getOptimalInterval(min, max, targetTicks = 5) {
  const range = max - min
  if (range === 0) return 1
  const roughStep = range / targetTicks
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)))
  let step = magnitude
  const steps = [magnitude * 1, magnitude * 2, magnitude * 5]
  const closest = steps.reduce((prev, curr) => {
    return Math.abs(curr - roughStep) < Math.abs(prev - roughStep) ? curr : prev
  })
  step = closest
  while (range / step < targetTicks / 2) {
    const smallerSteps = [step / 2, step / 5, step / 10]
    step = smallerSteps.find(s => range / s >= targetTicks / 2) || step / 10
  }
  const decimals = Math.min(Math.max(-Math.floor(Math.log10(step)), 0), 2)
  return decimals === 0 ? Number(step.toFixed(decimals)) : 1
}

export function calculateYAxisRange(seriesData, useAuto = false, desiredTicks = 5) {
  if (useAuto) {
    const invalidDigits = seriesData.every(item => item === '--')
    if (invalidDigits) {
      return { min: 0, max: 1, interval: null }
    }
    let visibleSeriesData = []
    seriesData.map(series => visibleSeriesData.push(...series.data))
    visibleSeriesData = visibleSeriesData.filter(item => !Number.isNaN(item) && item !== '--')
    let minValue = Math.min(...visibleSeriesData)
    let maxValue = Math.max(...visibleSeriesData)
    if (minValue === maxValue) {
      maxValue = maxValue === 0 ? formatNumber(desiredTicks * 0.2) : maxValue < 1 ? formatNumber(maxValue + 0.1) : formatNumber(maxValue)
      minValue = minValue === 0 ? 0 : maxValue > 0 && formatNumber(minValue - 1) || 0 ? formatNumber(minValue - 1) : 0
      return {
        min: minValue,
        max: maxValue,
        interval: null
      }
    }
    let range = formatNumber(Number(maxValue) - Number(minValue))
    minValue = range < 1 && minValue > 1 ? minValue - 1 : minValue
    maxValue = range < 1 ? maxValue + 0.1 : maxValue + 1
    range = formatNumber(Number(maxValue) - Number(minValue))
    const interval = getOptimalInterval(Number(minValue), Number(maxValue), desiredTicks)
    const yAxisMin = formatNumber(Math.floor(minValue / interval) * interval)
    const yAxisMax = formatNumber(Math.ceil(maxValue / interval) * interval)
    return {
      min: yAxisMin,
      max: yAxisMax,
      interval: interval
    }
  }
  let visibleSeriesData = []
  seriesData.map(series => visibleSeriesData.push(...series.data))
  visibleSeriesData = visibleSeriesData.filter(item => !Number.isNaN(item) && item !== '--')
  let minValue = visibleSeriesData.length === 0 ? 0 : Math.min(...visibleSeriesData)
  let maxValue = visibleSeriesData.length === 0 ? 1 : Math.max(...visibleSeriesData)
  if (minValue === maxValue) {
    maxValue = maxValue === 0 ? formatNumber(desiredTicks * 0.2) : maxValue < 1 ? formatNumber(maxValue + 0.1) : formatNumber(maxValue)
    minValue = minValue === 0 ? 0 : maxValue > 0 && formatNumber(minValue - 1) ? 0 : formatNumber(minValue - 1)
    const interval = getOptimalInterval(Number(minValue), Number(maxValue), desiredTicks)
    return {
      min: minValue,
      max: maxValue,
      interval: interval
    }
  }
  const interval = getOptimalInterval(Number(minValue), Number(maxValue), desiredTicks)
  const yAxisMin = formatNumber(Math.floor(minValue / interval) * interval)
  const yAxisMax = formatNumber(Math.ceil(maxValue / interval) * interval)
  return {
    min: yAxisMin,
    max: yAxisMax,
    interval: interval
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export function getRandomColorList(colorList, num) {
  if (!colorList || colorList.length === 0) return ['#4981EA']
  let index = 0
  let colorLists = []
  if (num === 1) {
    index = Math.floor(Math.random() * 11)
    colorLists.push(colorList[index])
  } else if (num === 2) {
    index = Math.floor(Math.random() * 5)
    colorLists.push(colorList[index])
    colorLists.push(colorList[index + 5])
  } else if (num === 3) {
    index = Math.floor(Math.random() * 3)
    colorLists.push(colorList[index])
    colorLists.push(colorList[index + 3])
    colorLists.push(colorList[index + 6])
  } else if (num === 4 || num === 5) {
    index = Math.floor(Math.random() * 2)
    for (let i = 0; i < num; i++) {
      colorLists.push(colorList[index + i * 2])
    }
  } else if (num > 5) {
    colorLists = colorList
    colorLists = shuffleArray(colorLists)
  }
  return colorLists
}

export function getRandomColorList2(colorList, num) {
  if (!colorList || colorList.length === 0) return ['#4981EA']
  let index = 0
  let colorLists = []
  if (num === 1) {
    index = Math.floor(Math.random() * 8)
    colorLists.push(colorList[index])
  } else if (num === 2) {
    index = Math.floor(Math.random() * 5)
    colorLists.push(colorList[index])
    colorLists.push(colorList[index + 5])
  } else if (num === 3) {
    index = Math.floor(Math.random() * 3)
    colorLists.push(colorList[index])
    colorLists.push(colorList[index + 3])
    colorLists.push(colorList[index + 6])
  } else if (num === 4 || num === 5) {
    index = Math.floor(Math.random() * 2)
    for (let i = 0; i < num; i++) {
      colorLists.push(colorList[index + i * 2])
    }
  } else if (num > 5) {
    colorLists = colorList
    colorLists = shuffleArray(colorLists)
  }
  return colorLists
}

function sha256(message) {
  const CHUNK_SIZE = 64
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]
  const INITIAL_HASH_VALUES = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ]
  const safeAdd = (x, y) => (x + y) >>> 0
  const rightRotate = (value, shift) => (value >>> shift) | (value << (32 - shift))
  const utf8Encode = str => {
    return new TextEncoder().encode(str)
  }
  const preprocess = messageBytes => {
    const messageLength = messageBytes.length
    const bitLength = messageLength * 8
    const paddedLength = Math.ceil((messageLength + 9) / CHUNK_SIZE) * CHUNK_SIZE
    const paddedMessage = new Uint8Array(paddedLength)
    paddedMessage.set(messageBytes)
    paddedMessage[messageLength] = 0x80
    for (let i = 0; i < 8; i++) {
      paddedMessage[paddedLength - 1 - i] = (bitLength >>> (8 * i)) & 0xff
    }
    return paddedMessage
  }
  const computeHash = messageBytes => {
    const paddedMessage = preprocess(messageBytes)
    const hashValues = [...INITIAL_HASH_VALUES]
    for (let i = 0; i < paddedMessage.length; i += CHUNK_SIZE) {
      const chunk = paddedMessage.subarray(i, i + CHUNK_SIZE)
      let [a, b, c, d, e, f, g, h] = hashValues
      const w = new Uint32Array(64)
      for (let j = 0; j < 16; j++) {
        w[j] = (chunk[j * 4] << 24) | (chunk[j * 4 + 1] << 16) | (chunk[j * 4 + 2] << 8) | (chunk[j * 4 + 3] >>> 0)
      }
      for (let j = 16; j < 64; j++) {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3)
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10)
        w[j] = safeAdd(safeAdd(safeAdd(w[j - 16], s0), w[j - 7]), s1)
      }
      for (let j = 0; j < 64; j++) {
        const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)
        const ch = (e & f) ^ (~e & g)
        const temp1 = safeAdd(safeAdd(safeAdd(safeAdd(h, S1), ch), K[j]), w[j])
        const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)
        const maj = (a & b) ^ (a & c) ^ (b & c)
        const temp2 = safeAdd(S0, maj)
        h = g
        g = f
        f = e
        e = safeAdd(d, temp1)
        d = c
        c = b
        b = a
        a = safeAdd(temp1, temp2)
      }
      hashValues[0] = safeAdd(hashValues[0], a)
      hashValues[1] = safeAdd(hashValues[1], b)
      hashValues[2] = safeAdd(hashValues[2], c)
      hashValues[3] = safeAdd(hashValues[3], d)
      hashValues[4] = safeAdd(hashValues[4], e)
      hashValues[5] = safeAdd(hashValues[5], f)
      hashValues[6] = safeAdd(hashValues[6], g)
      hashValues[7] = safeAdd(hashValues[7], h)
    }
    return hashValues
  }
  const hashToHex = hashValues => {
    return hashValues.map(value => value.toString(16).padStart(8, '0')).join('')
  }
  const messageBytes = utf8Encode(message)
  const hashValues = computeHash(messageBytes)
  return hashToHex(hashValues)
}

function reverseString(str) {
  let arr = str.split('')
  let reversedArr = arr.reverse()
  let reversedStr = reversedArr.join('')
  return reversedStr
}

export function getRandomColorByStr(str, num, lessColor) {
  // 确保 str 是有效字符串
  if (!str || typeof str !== 'string') {
    str = `${new Date().getTime()}`
  }
  const colors = chartsColorList
  let rest = lessColor ? 8 : 11
  let colorLists = []
  // 防护：确保 num 是有效的正整数，默认至少返回 1 个颜色
  const count = (num && num > 0) ? num : 1
  let index = parseInt('0x' + sha256(reverseString(str))) % rest
  for (let i = 0; i < count; i++) {
    const colorIndex = (index + i) % colors.length
    colorLists.push(colors[colorIndex])
  }
  return colorLists
}