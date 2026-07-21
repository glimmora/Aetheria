// ============================================================
// Mythral Art - Seeded PRNG + value noise (deterministic)
// ============================================================

export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Hash two ints + seed -> [0,1)
export function hash2(x, y, seed = 1337) {
  let h = seed + x * 374761393 + y * 668265263
  h = (h ^ (h >>> 13)) >>> 0
  h = Math.imul(h, 1274126177) >>> 0
  h = (h ^ (h >>> 16)) >>> 0
  return h / 4294967296
}

// Smooth value noise on a grid
export function valueNoise(x, y, seed = 1337) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const tl = hash2(xi, yi, seed)
  const tr = hash2(xi + 1, yi, seed)
  const bl = hash2(xi, yi + 1, seed)
  const br = hash2(xi + 1, yi + 1, seed)
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const top = tl + (tr - tl) * u
  const bot = bl + (br - bl) * u
  return top + (bot - top) * v
}

// Fractal brownian motion
export function fbm(x, y, seed = 1337, octaves = 4) {
  let value = 0, amp = 0.5, freq = 1
  for (let i = 0; i < octaves; i++) {
    value += amp * valueNoise(x * freq, y * freq, seed + i * 101)
    freq *= 2
    amp *= 0.5
  }
  return value
}
