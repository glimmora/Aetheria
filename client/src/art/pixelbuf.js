// ============================================================
// Mythral Art - Pixel buffer + drawing primitives
// All generators draw into a PixelBuffer then export via png.js
// ============================================================
import { encodePNG } from './png.js'
import { C } from './palette.js'

export class PixelBuffer {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.data = new Uint8Array(w * h * 4)
    // fully transparent by default (alpha 0)
  }

  // x,y in px; color string '#rrggbb' or 'rgba(...)' or null to skip
  set(x, y, color) {
    x |= 0; y |= 0
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    if (!color) return
    const i = (y * this.w + x) * 4
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)
      this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = 255
    } else if (color.startsWith('rgba')) {
      const m = color.match(/rgba\(([\d.]+),([\d.]+),([\d.]+),([\d.]+)\)/)
      if (m) {
        this.data[i] = +m[1]; this.data[i + 1] = +m[2]; this.data[i + 2] = +m[3]
        this.data[i + 3] = Math.round(+m[4] * 255)
      }
    } else if (color.startsWith('rgb')) {
      const m = color.match(/rgb\(([\d.]+),([\d.]+),([\d.]+)\)/)
      if (m) { this.data[i] = +m[1]; this.data[i + 1] = +m[2]; this.data[i + 2] = +m[3]; this.data[i + 3] = 255 }
    }
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null
    const i = (y * this.w + x) * 4
    return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]]
  }

  // Fill entire buffer with a color (use 'rgba(...,0)' for clear, or null)
  clear(color) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.set(x, y, color)
  }

  // axis-aligned rect (no alpha blend; hard pixel edges)
  rect(x, y, w, h, color) {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) this.set(x + dx, y + dy, color)
  }

  // rect outline
  rectOutline(x, y, w, h, color) {
    for (let dx = 0; dx < w; dx++) { this.set(x + dx, y, color); this.set(x + dx, y + h - 1, color) }
    for (let dy = 0; dy < h; dy++) { this.set(x, y + dy, color); this.set(x + w - 1, y + dy, color) }
  }

  // filled circle
  disc(cx, cy, r, color) {
    const r2 = r * r
    for (let y = Math.floor(cy - r); y <= cy + r; y++) {
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const dx = x - cx, dy = y - cy
        if (dx * dx + dy * dy <= r2) this.set(x, y, color)
      }
    }
  }

  // vertical gradient across rect using two palette colors
  vGradient(x, y, w, h, top, bottom) {
    for (let dy = 0; dy < h; dy++) {
      const t = h <= 1 ? 0 : dy / (h - 1)
      const col = C.mix(top, bottom, t)
      for (let dx = 0; dx < w; dx++) this.set(x + dx, y + dy, col)
    }
  }

  // Light dither between two colors using a thresholded noise
  dither(x, y, w, h, c1, c2, rand, threshold = 0.5) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const n = rand()
        this.set(x + dx, y + dy, n > threshold ? c2 : c1)
      }
    }
  }

  // Noise fill: mix of two colors based on per-pixel random noise
  noiseFill(x, y, w, h, c1, c2, rand, amount = 0.15) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const n = (rand() - 0.5) * 2 * amount
        const col = C.mix(c1, c2, 0.5 + n)
        this.set(x + dx, y + dy, col)
      }
    }
  }

  // Beveled rectangle: 3D look with highlight on top/left, shadow on bottom/right
  bevelRect(x, y, w, h, base, light, shadow) {
    this.rect(x, y, w, h, base)
    // top edge highlight
    for (let dx = 0; dx < w; dx++) { this.set(x + dx, y, light); this.set(x + dx, y + 1, light) }
    // left edge highlight
    for (let dy = 0; dy < h; dy++) { this.set(x, y + dy, light) }
    // bottom edge shadow
    for (let dx = 0; dx < w; dx++) { this.set(x + dx, y + h - 1, shadow); this.set(x + dx, y + h - 2, shadow) }
    // right edge shadow
    for (let dy = 0; dy < h; dy++) { this.set(x + w - 1, y + dy, shadow) }
  }

  // Rounded rectangle (approximate pixel circles at corners)
  roundRect(x, y, w, h, r, color) {
    this.rect(x + r, y, w - 2 * r, h, color)
    this.rect(x, y + r, w, h - 2 * r, color)
    this.disc(x + r, y + r, r, color)
    this.disc(x + w - 1 - r, y + r, r, color)
    this.disc(x + r, y + h - 1 - r, r, color)
    this.disc(x + w - 1 - r, y + h - 1 - r, r, color)
  }

  // Vertical gradient with noise texture for organic look
  gradientNoise(x, y, w, h, top, bottom, rand, noiseAmt = 0.1) {
    for (let dy = 0; dy < h; dy++) {
      const t = h <= 1 ? 0 : dy / (h - 1)
      const base = C.mix(top, bottom, t)
      for (let dx = 0; dx < w; dx++) {
        const n = (rand() - 0.5) * 2 * noiseAmt
        const col = C.mix(base, n > 0 ? '#ffffff' : '#000000', Math.abs(n) * 0.3)
        this.set(x + dx, y + dy, col)
      }
    }
  }

  // Filled ellipse
  ellipse(cx, cy, rx, ry, color) {
    const rx2 = rx * rx, ry2 = ry * ry
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = x - cx, dy = y - cy
        if ((dx * dx) / rx2 + (dy * dy) / ry2 <= 1) this.set(x, y, color)
      }
    }
  }

  // Line between two points (Bresenham)
  line(x0, y0, x1, y1, color) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0)
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
    let err = dx - dy
    while (true) {
      this.set(x0, y0, color)
      if (x0 === x1 && y0 === y1) break
      let e2 = 2 * err
      if (e2 > -dy) { err -= dy; x0 += sx }
      if (e2 < dx) { err += dx; y0 += sy }
    }
  }

  // Composite another buffer on top at offset (respects alpha; replaces if opaque-ish)
  blit(src, ox, oy, alpha = 1) {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const i = (y * src.w + x) * 4
        const a = (src.data[i + 3] / 255) * alpha
        if (a <= 0.02) continue
        // simple over-composite
        const di = ((oy + y) * this.w + (ox + x)) * 4
        if (ox + x < 0 || oy + y < 0 || ox + x >= this.w || oy + y >= this.h) continue
        const ia = a, ib = 1 - a
        this.data[di] = src.data[i] * ia + this.data[di] * ib
        this.data[di + 1] = src.data[i + 1] * ia + this.data[di + 1] * ib
        this.data[di + 2] = src.data[i + 2] * ia + this.data[di + 2] * ib
        this.data[di + 3] = Math.max(this.data[di + 3], src.data[i + 3] * ia)
      }
    }
  }

  toPNG() {
    return encodePNG(this.w, this.h, Buffer.from(this.data))
  }

  clone() {
    const b = new PixelBuffer(this.w, this.h)
    b.data.set(this.data)
    return b
  }
}

export { C }
