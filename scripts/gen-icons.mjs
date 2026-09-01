// Generates placeholder PWA icons with no external deps: a dark rounded tile
// with the chartreuse "flow" mark (a rising checkmark/stroke).
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const INK = [14, 14, 17] // #0e0e11
const TILE = [24, 24, 30] // #18181e
const FLOW = [205, 232, 107] // #cde86b

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([t, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function png(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function draw(size) {
  const buf = Buffer.alloc(size * size * 4)
  const radius = size * 0.22
  const inset = size * 0.06
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    const na = a / 255
    buf[i] = buf[i] * (1 - na) + r * na
    buf[i + 1] = buf[i + 1] * (1 - na) + g * na
    buf[i + 2] = buf[i + 2] * (1 - na) + b * na
    buf[i + 3] = 255
  }
  // rounded tile
  const inRounded = (x, y) => {
    const lo = inset
    const hi = size - inset
    if (x < lo || y < lo || x > hi || y > hi) return false
    const cx = Math.min(Math.max(x, lo + radius), hi - radius)
    const cy = Math.min(Math.max(y, lo + radius), hi - radius)
    return Math.hypot(x - cx, y - cy) <= radius
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inRounded(x, y)) set(x, y, TILE)
      else set(x, y, INK)
    }
  }
  // "flow" checkmark stroke
  const thick = size * 0.09
  const pts = [
    [size * 0.3, size * 0.54],
    [size * 0.44, size * 0.68],
    [size * 0.72, size * 0.34],
  ]
  const seg = (ax, ay, bx, by) => {
    const steps = Math.ceil(Math.hypot(bx - ax, by - ay))
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const px = ax + (bx - ax) * t
      const py = ay + (by - ay) * t
      const rr = Math.ceil(thick / 2)
      for (let oy = -rr; oy <= rr; oy++)
        for (let ox = -rr; ox <= rr; ox++)
          if (Math.hypot(ox, oy) <= thick / 2) set(Math.round(px + ox), Math.round(py + oy), FLOW)
    }
  }
  seg(...pts[0], ...pts[1])
  seg(...pts[1], ...pts[2])
  return png(size, size, buf)
}

mkdirSync('public', { recursive: true })
writeFileSync('public/icon-192.png', draw(192))
writeFileSync('public/icon-512.png', draw(512))
writeFileSync('public/apple-touch-icon.png', draw(180))
console.log('icons written: 192, 512, apple-touch (180)')
