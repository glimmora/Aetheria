// ============================================================
// Enhanced procedural tile rendering
// Adds noise, edge blending, variations, and decorations
// ============================================================

function seededRandom(x, y, seed = 42) {
  let h = seed + x * 374761393 + y * 668265263
  h = (h ^ (h >> 13)) * 1274126177
  h = h ^ (h >> 16)
  return (h >>> 0) / 4294967296
}

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}
function shiftColor(hex, v = 0.08) {
  const [r, g, b] = hexToRgb(hex)
  const s = (seededRandom(0, 0, r * 997 + g * 113 + b) - 0.5) * 2 * v
  return rgbToHex(r * (1 + s), g * (1 + s), b * (1 + s))
}
function darken(hex, a = 0.15) {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r * (1 - a), g * (1 - a), b * (1 - a))
}
function lighten(hex, a = 0.1) {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r + (255 - r) * a, g + (255 - g) * a, b + (255 - b) * a)
}
function mixColor(c1, c2, t) {
  const a = hexToRgb(c1), b = hexToRgb(c2)
  return rgbToHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)
}

// Edge blending: check neighbor tiles and darken/lighten edges
function getEdgeFactor(ctx, tx, ty, map, w, h) {
  const neighbors = []
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const nx = tx + dx, ny = ty + dy
    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
      neighbors.push(map[ny][nx])
    } else {
      neighbors.push(-1)
    }
  }
  return neighbors
}

export function drawTile(ctx, tx, ty, tileType, baseColor, x, y, S, map, w, h) {
  const r1 = seededRandom(tx, ty, 1)
  const r2 = seededRandom(tx, ty, 2)
  const r3 = seededRandom(tx, ty, 3)

  const base = shiftColor(baseColor, 0.05)

  // Edge blending: darken if neighbor is non-walkable
  const neighbors = getEdgeFactor(ctx, tx, ty, map, w, h)

  switch (tileType) {
    case 3: case 4: // GRASS / DARK_GRASS
      drawGrass(ctx, x, y, S, r1, r2, r3, base, tileType)
      break
    case 5: // FOREST
      drawForestFloor(ctx, x, y, S, r1, r2, r3, base)
      break
    case 2: // SAND
      drawSand(ctx, x, y, S, r1, r2, r3, base)
      break
    case 8: // SNOW
      drawSnow(ctx, x, y, S, r1, r2, r3, base)
      break
    case 14: // DESERT
      drawDesert(ctx, x, y, S, r1, r2, r3, base)
      break
    case 12: // SWAMP
      drawSwamp(ctx, x, y, S, r1, r2, r3, base)
      break
    case 11: // VOLCANIC_ROCK
      drawVolcanic(ctx, x, y, S, r1, r2, r3, base)
      break
    case 0: case 1: // WATER / DEEP_WATER
      drawWater(ctx, x, y, S, r1, r2, r3, base, tx, ty, tileType)
      break
    case 16: // PATH
      drawPath(ctx, x, y, S, r1, r2, r3, base)
      break
    case 17: // WOOD_FLOOR
      drawWoodFloor(ctx, x, y, S, r1, r2, r3, base)
      break
    case 18: // STONE_FLOOR
      drawStoneFloor(ctx, x, y, S, r1, r2, r3, base)
      break
    case 25: // RUINS
      drawRuins(ctx, x, y, S, r1, r2, r3, base)
      break
    case 22: // CRYSTAL
      drawCrystal(ctx, x, y, S, r1, r2, r3, base)
      break
    default:
      ctx.fillStyle = base
      ctx.fillRect(x, y, S, S)
  }

  // Edge darkening for depth
  if (r1 > 0.82) {
    ctx.fillStyle = 'rgba(0,0,0,0.07)'
    ctx.fillRect(x, y + S - 1, S, 1)
    ctx.fillRect(x + S - 1, y, 1, S)
  }
}

function drawGrass(ctx, x, y, S, r1, r2, r3, base, tileType) {
  // Base gradient
  const grad = ctx.createLinearGradient(x, y, x, y + S)
  grad.addColorStop(0, lighten(base, 0.04))
  grad.addColorStop(1, darken(base, 0.04))
  ctx.fillStyle = grad
  ctx.fillRect(x, y, S, S)

  // Grass tufts
  ctx.fillStyle = lighten(base, 0.15)
  if (r1 > 0.5) {
    ctx.fillRect(x + r1 * (S - 4), y + r2 * (S - 8), 1, 4)
    ctx.fillRect(x + r1 * (S - 4) + 2, y + r2 * (S - 8) + 1, 1, 3)
  }
  if (r2 > 0.6) {
    ctx.fillStyle = lighten(base, 0.2)
    ctx.fillRect(x + r3 * (S - 3), y + r1 * (S - 5), 2, 2)
  }
  // Dark specks
  if (r3 > 0.75) {
    ctx.fillStyle = darken(base, 0.2)
    ctx.fillRect(x + r1 * S, y + r2 * S, 1, 1)
  }
  // Occasional flower (more on dark grass)
  const flowerChance = tileType === 4 ? 0.9 : 0.93
  if (r1 > flowerChance) {
    const colors = ['#f472b6', '#fbbf24', '#a78bfa', '#60a5fa', '#fb7185']
    ctx.fillStyle = colors[Math.floor(r2 * colors.length)]
    ctx.fillRect(x + r3 * (S - 3) + 1, y + r1 * (S - 5) + 1, 2, 2)
    ctx.fillStyle = '#fde047'
    ctx.fillRect(x + r3 * (S - 3) + 2, y + r1 * (S - 5) + 1, 1, 1)
  }
  // Clover
  if (r2 > 0.94) {
    ctx.fillStyle = '#22c55e'
    ctx.fillRect(x + r1 * (S - 3) + 1, y + r2 * (S - 3), 1, 2)
    ctx.fillRect(x + r1 * (S - 3), y + r2 * (S - 3) + 1, 3, 1)
  }
}

function drawForestFloor(ctx, x, y, S, r1, r2, r3, base) {
  // Darker base
  const grad = ctx.createLinearGradient(x, y, x, y + S)
  grad.addColorStop(0, darken(base, 0.02))
  grad.addColorStop(1, darken(base, 0.08))
  ctx.fillStyle = grad
  ctx.fillRect(x, y, S, S)

  // Leaf litter
  if (r1 > 0.4) {
    ctx.fillStyle = '#92400e'
    ctx.fillRect(x + r2 * (S - 4), y + r3 * (S - 3), 3, 1)
  }
  if (r2 > 0.55) {
    ctx.fillStyle = '#a16207'
    ctx.fillRect(x + r3 * (S - 3), y + r1 * (S - 2), 2, 1)
  }
  // Small stones
  if (r3 > 0.7) {
    ctx.fillStyle = '#78716c'
    ctx.fillRect(x + r1 * (S - 2), y + r2 * (S - 2), 2, 2)
  }
  // Mushroom
  if (r1 > 0.91) {
    ctx.fillStyle = '#78350f'
    ctx.fillRect(x + S / 2, y + S / 2 + 1, 1, 3)
    ctx.fillStyle = '#dc2626'
    ctx.fillRect(x + S / 2 - 1, y + S / 2, 3, 2)
    ctx.fillStyle = '#fef2f2'
    ctx.fillRect(x + S / 2, y + S / 2, 1, 1)
  }
}

function drawSand(ctx, x, y, S, r1, r2, r3, base) {
  // Gradient
  const grad = ctx.createLinearGradient(x, y, x + S, y + S)
  grad.addColorStop(0, lighten(base, 0.03))
  grad.addColorStop(1, darken(base, 0.03))
  ctx.fillStyle = grad
  ctx.fillRect(x, y, S, S)

  // Grains
  if (r1 > 0.3) { ctx.fillStyle = lighten(base, 0.08); ctx.fillRect(x + r2 * S, y + r3 * S, 1, 1) }
  if (r2 > 0.5) { ctx.fillStyle = darken(base, 0.05); ctx.fillRect(x + r3 * S, y + r1 * S, 1, 1) }
  // Pebble
  if (r3 > 0.88) { ctx.fillStyle = '#a8a29e'; ctx.fillRect(x + r1 * (S - 2), y + r2 * (S - 2), 2, 2) }
  // Shell
  if (r1 > 0.96) { ctx.fillStyle = '#fef3c7'; ctx.fillRect(x + r2 * (S - 2), y + r3 * (S - 2), 2, 1); ctx.fillRect(x + r2 * (S - 2) + 1, y + r3 * (S - 2) - 1, 1, 1) }
}

function drawSnow(ctx, x, y, S, r1, r2, r3, base) {
  ctx.fillStyle = base
  ctx.fillRect(x, y, S, S)
  // Sparkles
  if (r1 > 0.65) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x + r2 * S, y + r3 * S, 1, 1) }
  if (r2 > 0.8) { ctx.fillStyle = 'rgba(200,220,255,0.3)'; ctx.fillRect(x + r3 * S, y + r1 * S, 2, 1) }
  // Drift
  if (r3 > 0.7) { ctx.fillStyle = darken(base, 0.03); ctx.fillRect(x, y + S - 3, S, 3) }
}

function drawDesert(ctx, x, y, S, r1, r2, r3, base) {
  ctx.fillStyle = base
  ctx.fillRect(x, y, S, S)
  // Wind ripples
  if (r1 > 0.4) { ctx.fillStyle = darken(base, 0.04); ctx.fillRect(x, y + r2 * S, S, 1) }
  // Small rocks
  if (r3 > 0.87) { ctx.fillStyle = '#92400e'; ctx.fillRect(x + r1 * (S - 2), y + r2 * (S - 2), 2, 1) }
  // Bone
  if (r1 > 0.97) { ctx.fillStyle = '#fef3c7'; ctx.fillRect(x + r2 * (S - 3), y + r3 * (S - 2), 3, 1) }
}

function drawSwamp(ctx, x, y, S, r1, r2, r3, base) {
  ctx.fillStyle = base
  ctx.fillRect(x, y, S, S)
  // Murky patches
  if (r1 > 0.4) { ctx.fillStyle = darken(base, 0.12); ctx.fillRect(x + r2 * (S - 5), y + r3 * (S - 4), 4, 3) }
  // Bubbles
  if (r3 > 0.9) { ctx.fillStyle = lighten(base, 0.15); ctx.beginPath(); ctx.arc(x + r1 * S + 2, y + r2 * S + 2, 1.5, 0, Math.PI * 2); ctx.fill() }
}

function drawVolcanic(ctx, x, y, S, r1, r2, r3, base) {
  ctx.fillStyle = base
  ctx.fillRect(x, y, S, S)
  // Cracks with glow
  if (r1 > 0.5) { ctx.fillStyle = darken(base, 0.3); ctx.fillRect(x + r2 * (S - 5), y + r3 * S, 4, 1) }
  if (r3 > 0.85) { ctx.fillStyle = '#ef4444'; ctx.fillRect(x + r1 * S, y + r2 * S, 2, 1); ctx.fillStyle = '#fbbf24'; ctx.fillRect(x + r1 * S, y + r2 * S + 1, 1, 1) }
}

function drawWater(ctx, x, y, S, r1, r2, r3, base, tx, ty, tileType) {
  const isDeep = tileType === 0
  // Animated-looking wave pattern using position
  const wave = ((tx * 7 + ty * 13) % 5) * 0.02
  const grad = ctx.createLinearGradient(x, y, x, y + S)
  grad.addColorStop(0, lighten(base, 0.06 + wave))
  grad.addColorStop(0.5, base)
  grad.addColorStop(1, darken(base, 0.06))
  ctx.fillStyle = grad
  ctx.fillRect(x, y, S, S)
  // Highlight
  if (r1 > 0.35) { ctx.fillStyle = lighten(base, 0.12); ctx.fillRect(x + r2 * (S - 6), y + r3 * S, 4, 1) }
  // Depth
  if (r2 > 0.65) { ctx.fillStyle = darken(base, 0.1); ctx.fillRect(x + r3 * S, y + r1 * (S - 2), 2, 1) }
  // Foam near edges
  if (isDeep && r3 > 0.9) { ctx.fillStyle = 'rgba(200,220,255,0.15)'; ctx.fillRect(x + r1 * S, y, S - r1 * S, 1) }
}

function drawPath(ctx, x, y, S, r1, r2, r3, base) {
  // Cobblestone base with variation
  const grad = ctx.createLinearGradient(x, y, x + S, y + S)
  grad.addColorStop(0, darken(base, 0.02))
  grad.addColorStop(0.5, lighten(base, 0.02))
  grad.addColorStop(1, darken(base, 0.04))
  ctx.fillStyle = grad
  ctx.fillRect(x, y, S, S)
  // Stone outlines
  ctx.fillStyle = darken(base, 0.08)
  ctx.fillRect(x + S / 2, y + 2, 1, S - 4)
  ctx.fillRect(x + 2, y + S / 2, S - 4, 1)
  // Highlights
  if (r1 > 0.4) { ctx.fillStyle = lighten(base, 0.06); ctx.fillRect(x + 2, y + 2, S / 2 - 3, S / 2 - 3) }
  if (r2 > 0.4) { ctx.fillStyle = lighten(base, 0.04); ctx.fillRect(x + S / 2 + 2, y + S / 2 + 2, S / 2 - 3, S / 2 - 3) }
  // Cracks
  if (r3 > 0.72) { ctx.fillStyle = darken(base, 0.15); ctx.fillRect(x + r1 * S, y, 1, S) }
  // Small stones
  if (r2 > 0.82) { ctx.fillStyle = lighten(base, 0.1); ctx.fillRect(x + r3 * (S - 3), y + r1 * (S - 3), 2, 2) }
}

function drawWoodFloor(ctx, x, y, S, r1, r2, r3, base) {
  ctx.fillStyle = base
  ctx.fillRect(x, y, S, S)
  // Plank grain
  ctx.fillStyle = darken(base, 0.06)
  ctx.fillRect(x, y + Math.floor(S / 3), S, 1)
  ctx.fillRect(x, y + Math.floor(S * 2 / 3), S, 1)
  // Grain lines
  if (r1 > 0.5) { ctx.fillStyle = darken(base, 0.03); ctx.fillRect(x + 2, y + r2 * S, S - 4, 1) }
  // Knot
  if (r1 > 0.88) { ctx.fillStyle = darken(base, 0.22); ctx.beginPath(); ctx.arc(x + r2 * (S - 4) + 2, y + r3 * (S - 4) + 2, 2, 0, Math.PI * 2); ctx.fill() }
}

function drawStoneFloor(ctx, x, y, S, r1, r2, r3, base) {
  ctx.fillStyle = base
  ctx.fillRect(x, y, S, S)
  // Grout
  ctx.fillStyle = darken(base, 0.1)
  ctx.fillRect(x + S / 2, y, 1, S)
  ctx.fillRect(x, y + S / 2, S, 1)
  // Stone highlights
  if (r1 > 0.4) { ctx.fillStyle = lighten(base, 0.04); ctx.fillRect(x + 1, y + 1, S / 2 - 1, S / 2 - 1) }
  if (r2 > 0.4) { ctx.fillStyle = darken(base, 0.02); ctx.fillRect(x + S / 2 + 1, y + S / 2 + 1, S / 2 - 2, S / 2 - 2) }
}

function drawRuins(ctx, x, y, S, r1, r2, r3, base) {
  ctx.fillStyle = base
  ctx.fillRect(x, y, S, S)
  // Cracks
  if (r1 > 0.5) { ctx.fillStyle = darken(base, 0.2); ctx.fillRect(x + r2 * (S - 4), y + r3 * S, 3, 1) }
  // Moss
  if (r3 > 0.55) { ctx.fillStyle = '#166534'; ctx.fillRect(x + r1 * S, y + r2 * S, 2, 1) }
  if (r2 > 0.7) { ctx.fillStyle = '#15803d'; ctx.fillRect(x + r3 * (S - 2), y + r1 * (S - 2), 1, 1) }
}

function drawCrystal(ctx, x, y, S, r1, r2, r3, base) {
  ctx.fillStyle = base
  ctx.fillRect(x, y, S, S)
  // Crystal glow
  ctx.fillStyle = lighten(base, 0.3)
  ctx.fillRect(x + r1 * (S - 4) + 1, y + r2 * (S - 6) + 1, 2, 4)
  ctx.fillStyle = 'rgba(167,139,250,0.4)'
  ctx.fillRect(x + r1 * (S - 4), y + r2 * (S - 6), 4, 6)
}

// Draw decorations on top of tiles
export function drawDecoration(ctx, tx, ty, tileType, x, y, S, map, w, h) {
  const r1 = seededRandom(tx, ty, 10)
  const r2 = seededRandom(tx, ty, 11)
  const r3 = seededRandom(tx, ty, 12)

  switch (tileType) {
    case 3: case 4: // GRASS
      if (r1 > 0.92) {
        const cols = ['#f472b6', '#fbbf24', '#a78bfa', '#60a5fa', '#fb923c']
        ctx.fillStyle = cols[Math.floor(r2 * cols.length)]
        ctx.fillRect(x + r1 * (S - 4) + 1, y + r2 * (S - 4), 2, 2)
        ctx.fillStyle = '#fde047'
        ctx.fillRect(x + r1 * (S - 4) + 2, y + r2 * (S - 4), 1, 1)
      }
      if (r2 > 0.96) {
        // Tall grass
        ctx.fillStyle = '#15803d'
        ctx.fillRect(x + r3 * (S - 2), y + 4, 1, S - 4)
        ctx.fillRect(x + r3 * (S - 2) + 2, y + 6, 1, S - 6)
      }
      break
    case 5: // FOREST
      if (r1 > 0.82) {
        // Tree trunk
        ctx.fillStyle = '#78350f'
        ctx.fillRect(x + S / 2 - 1, y + S - 7, 3, 7)
        // Canopy layers
        ctx.fillStyle = '#166534'
        ctx.fillRect(x + S / 2 - 5, y + S - 14, 11, 8)
        ctx.fillStyle = '#15803d'
        ctx.fillRect(x + S / 2 - 4, y + S - 16, 9, 4)
        // Highlight
        ctx.fillStyle = '#22c55e'
        ctx.fillRect(x + S / 2 - 2, y + S - 15, 4, 1)
        ctx.fillRect(x + S / 2 - 1, y + S - 16, 2, 1)
      }
      break
    case 2: // SAND
      if (r1 > 0.94) {
        // Palm tree
        ctx.fillStyle = '#92400e'
        ctx.fillRect(x + S / 2, y + 6, 2, S - 6)
        ctx.fillStyle = '#166534'
        ctx.fillRect(x + S / 2 - 4, y + 4, 4, 3)
        ctx.fillRect(x + S / 2 + 2, y + 2, 4, 3)
        ctx.fillRect(x + S / 2 - 3, y + 1, 3, 3)
      }
      break
    case 14: // DESERT
      if (r1 > 0.92) {
        // Cactus
        ctx.fillStyle = '#166534'
        ctx.fillRect(x + S / 2 - 1, y + 4, 3, S - 4)
        ctx.fillRect(x + S / 2 - 4, y + 8, 3, 2)
        ctx.fillRect(x + S / 2 + 2, y + 10, 3, 2)
        ctx.fillStyle = '#22c55e'
        ctx.fillRect(x + S / 2, y + 4, 1, 1)
      }
      break
    case 12: // SWAMP
      if (r1 > 0.88) {
        // Dead tree
        ctx.fillStyle = '#57534e'
        ctx.fillRect(x + S / 2 - 1, y + 4, 2, S - 4)
        ctx.fillRect(x + S / 2 - 3, y + 8, 2, 1)
        ctx.fillRect(x + S / 2 + 2, y + 6, 2, 1)
      }
      break
    case 8: // SNOW
      if (r1 > 0.95) {
        // Snow pile
        ctx.fillStyle = '#e2e8f0'
        ctx.fillRect(x + S / 2 - 3, y + S - 5, 6, 4)
        ctx.fillRect(x + S / 2 - 2, y + S - 7, 4, 2)
        ctx.fillStyle = '#f8fafc'
        ctx.fillRect(x + S / 2 - 1, y + S - 6, 2, 1)
      }
      break
    case 1: // WATER — lily pad
      if (r1 > 0.95) {
        ctx.fillStyle = '#16a34a'
        ctx.beginPath()
        ctx.arc(x + r2 * (S - 6) + 3, y + r3 * (S - 6) + 3, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#22c55e'
        ctx.fillRect(x + r2 * (S - 6) + 2, y + r3 * (S - 6) + 3, 2, 1)
      }
      break
    case 11: // VOLCANIC_ROCK
      if (r1 > 0.93) {
        // Lava glow
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(x + r2 * (S - 4), y + r3 * (S - 3), 3, 2)
        ctx.fillStyle = '#fbbf24'
        ctx.fillRect(x + r2 * (S - 4) + 1, y + r3 * (S - 3), 1, 1)
      }
      break
  }
}
