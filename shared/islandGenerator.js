// ============================================================
// Mythral - Island map generator
// Deterministic pseudo-random map generator that produces
// organic-looking islands with biomes, paths, buildings,
// decoration clusters, and monster spawn points.
// ============================================================

import { TILE, TILE_INFO, stampRect, stampBuilding, isWalkable } from './tiles.js'

// Deterministic PRNG (mulberry32)
export function makeRng(seed) {
  let s = seed >>> 0
  return function () {
    s |= 0
    s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 2D value noise
export function valueNoise2D(seed) {
  const rng = makeRng(seed)
  const grid = new Float32Array(64 * 64)
  for (let i = 0; i < grid.length; i++) grid[i] = rng()
  function lerp(a, b, t) { return a + (b - a) * t }
  function smooth(t) { return t * t * (3 - 2 * t) }
  return function (x, y) {
    x = ((x % 64) + 64) % 64
    y = ((y % 64) + 64) % 64
    const xi = Math.floor(x), yi = Math.floor(y)
    const xf = x - xi, yf = y - yi
    const a = grid[yi * 64 + xi]
    const b = grid[yi * 64 + ((xi + 1) % 64)]
    const c = grid[((yi + 1) % 64) * 64 + xi]
    const d = grid[((yi + 1) % 64) * 64 + ((xi + 1) % 64)]
    return lerp(lerp(a, b, smooth(xf)), lerp(c, d, smooth(xf)), smooth(yf))
  }
}

// Fractal Brownian Motion
export function fbm(noise, x, y, octaves = 4, persistence = 0.5, scale = 0.1) {
  let total = 0, amplitude = 1, frequency = 1, maxValue = 0
  for (let i = 0; i < octaves; i++) {
    total += noise(x * scale * frequency, y * scale * frequency) * amplitude
    maxValue += amplitude
    amplitude *= persistence
    frequency *= 2
  }
  return total / maxValue
}

// Find a walkable tile near (x, y)
export function findWalkableNear(map, x, y, maxRadius = 10) {
  for (let r = 0; r <= maxRadius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx, ny = y + dy
        if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length) {
          if (isWalkable(map[ny][nx])) return { x: nx, y: ny }
        }
      }
    }
  }
  return null
}

// Generate a full island map given a config
export function generateIslandMap(config) {
  const { width, height, seed, biome } = config
  const rng = makeRng(seed)
  const noise = valueNoise2D(seed)

  const map = []
  // 1) base: water everywhere
  for (let y = 0; y < height; y++) {
    const row = []
    for (let x = 0; x < width; x++) row.push(TILE.DEEP_WATER)
    map.push(row)
  }

  // 2) form island shape using radial falloff + noise
  const cx = width / 2, cy = height / 2
  const maxDist = Math.min(width, height) / 2
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx, dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist
      const n = fbm(noise, x, y, 4, 0.5, 0.12)
      const elevation = (1 - dist) * 0.7 + n * 0.5 - 0.15
      map[y][x] = chooseTileByElevation(elevation, biome, rng)
    }
  }

  // 3) biome-specific decorations and features
  decorateBiome(map, biome, rng, noise)

  // 4) stamp main village / buildings near center
  placeVillage(map, biome, rng, cx, cy)

  // 5) carve a path network between key points
  carvePaths(map, biome, rng)

  return map
}

function chooseTileByElevation(e, biome, rng) {
  if (e < 0.10) return TILE.DEEP_WATER
  if (e < 0.22) return biomeBeachTile(biome)
  if (e < 0.55) return biomeGroundTile(biome, rng)
  if (e < 0.78) return biomeHighTile(biome, rng)
  return biomePeakTile(biome, rng)
}

function biomeBeachTile(biome) {
  switch (biome) {
    case 'frostpeak': return TILE.ICE
    case 'sunscar': return TILE.DESERT
    case 'emberfall': return TILE.VOLCANIC_ROCK
    case 'shadowfen': return TILE.SWAMP
    case 'tidehaven': return TILE.SAND
    case 'skyreach': return TILE.CLOUD
    case 'voidheart': return TILE.VOID
    default: return TILE.SAND
  }
}
function biomeGroundTile(biome, rng) {
  switch (biome) {
    case 'lumina': return rng() < 0.15 ? TILE.FLOWERS : TILE.GRASS
    case 'mistwood': return rng() < 0.4 ? TILE.FOREST : TILE.DARK_GRASS
    case 'emberfall': return TILE.VOLCANIC_ROCK
    case 'frostpeak': return TILE.SNOW
    case 'sunscar': return TILE.DESERT
    case 'tidehaven': return rng() < 0.2 ? TILE.SAND : TILE.GRASS
    case 'shadowfen': return TILE.SWAMP
    case 'skyreach': return TILE.CLOUD
    case 'voidheart': return TILE.VOID
    default: return TILE.GRASS
  }
}
function biomeHighTile(biome, rng) {
  switch (biome) {
    case 'lumina': return TILE.DARK_GRASS
    case 'mistwood': return rng() < 0.5 ? TILE.DENSE_FOREST : TILE.FOREST
    case 'emberfall': return rng() < 0.15 ? TILE.LAVA : TILE.VOLCANIC_ROCK
    case 'frostpeak': return rng() < 0.3 ? TILE.ICE : TILE.SNOW
    case 'sunscar': return rng() < 0.3 ? TILE.DESERT_ROCK : TILE.DESERT
    case 'tidehaven': return TILE.SAND
    case 'shadowfen': return rng() < 0.2 ? TILE.SWAMP_WATER : TILE.SWAMP
    case 'skyreach': return TILE.CLOUD
    case 'voidheart': return TILE.CRYSTAL
    default: return TILE.MOUNTAIN
  }
}
function biomePeakTile(biome, rng) {
  switch (biome) {
    case 'lumina': return TILE.FOREST
    case 'mistwood': return TILE.DENSE_FOREST
    case 'emberfall': return TILE.LAVA
    case 'frostpeak': return TILE.MOUNTAIN
    case 'sunscar': return TILE.DESERT_ROCK
    case 'tidehaven': return TILE.MOUNTAIN
    case 'shadowfen': return TILE.SWAMP_WATER
    case 'skyreach': return TILE.CRYSTAL
    case 'voidheart': return TILE.CRYSTAL
    default: return TILE.MOUNTAIN
  }
}

function decorateBiome(map, biome, rng, noise) {
  const h = map.length, w = map[0].length
  const scatterCount = Math.floor(w * h * 0.02)
  for (let i = 0; i < scatterCount; i++) {
    const x = Math.floor(rng() * w), y = Math.floor(rng() * h)
    const t = map[y][x]
    if (!isWalkable(t)) continue
    switch (biome) {
      case 'lumina':
        if (rng() < 0.4) map[y][x] = TILE.FLOWERS
        else if (rng() < 0.3) map[y][x] = TILE.FOREST
        break
      case 'mistwood':
        if (rng() < 0.5) map[y][x] = TILE.FOREST
        else if (rng() < 0.2) map[y][x] = TILE.MUSHROOM
        break
      case 'emberfall':
        if (rng() < 0.15) map[y][x] = TILE.LAVA
        break
      case 'frostpeak':
        if (rng() < 0.2) map[y][x] = TILE.ICE
        break
      case 'sunscar':
        if (rng() < 0.1) map[y][x] = TILE.RUINS
        break
      case 'tidehaven':
        if (rng() < 0.2) map[y][x] = TILE.SAND
        break
      case 'shadowfen':
        if (rng() < 0.3) map[y][x] = TILE.SWAMP_WATER
        else if (rng() < 0.2) map[y][x] = TILE.MUSHROOM
        break
      case 'skyreach':
        if (rng() < 0.3) map[y][x] = TILE.CLOUD
        break
      case 'voidheart':
        if (rng() < 0.4) map[y][x] = TILE.CRYSTAL
        break
    }
  }
}

function placeVillage(map, biome, rng, cx, cy) {
  const x = Math.floor(cx) - 8
  const y = Math.floor(cy) - 6
  // village square
  stampRect(map, x, y, 16, 12, biome === 'frostpeak' ? TILE.SNOW : (biome === 'voidheart' ? TILE.STONE_FLOOR : TILE.GRASS))
  // a few buildings (NPCs assigned by island def)
  stampBuilding(map, x + 1, y + 1, 5, 4, TILE.WOOD_FLOOR)
  stampBuilding(map, x + 9, y + 1, 5, 4, TILE.WOOD_FLOOR)
  stampBuilding(map, x + 1, y + 7, 6, 4, TILE.STONE_FLOOR)
  stampBuilding(map, x + 10, y + 7, 5, 4, TILE.WOOD_FLOOR)
  // central fountain tile (decorative)
  map[y + 6][x + 8] = TILE.WATER
}

function carvePaths(map, biome, rng) {
  const h = map.length, w = map[0].length
  // make some path lines from center outward
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2)
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  for (const [dx, dy] of dirs) {
    let x = cx, y = cy
    const length = Math.floor(rng() * 15) + 20
    for (let i = 0; i < length; i++) {
      x += dx + (rng() < 0.2 ? (rng() < 0.5 ? -1 : 1) : 0)
      y += dy + (rng() < 0.2 ? (rng() < 0.5 ? -1 : 1) : 0)
      if (x < 0 || x >= w || y < 0 || y >= h) break
      if (isWalkable(map[y][x])) {
        map[y][x] = biome === 'voidheart' ? TILE.STONE_FLOOR : TILE.PATH
      }
    }
  }
}

// Calculate a list of valid spawn points (walkable, far from village center)
export function findSpawnPoints(map, count, seed, minDistanceFromCenter = 12) {
  const rng = makeRng(seed + 999)
  const h = map.length, w = map[0].length
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2)
  const points = []
  let attempts = 0
  while (points.length < count && attempts < count * 50) {
    attempts++
    const x = Math.floor(rng() * w)
    const y = Math.floor(rng() * h)
    if (!isWalkable(map[y][x])) continue
    const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    if (d < minDistanceFromCenter) continue
    // ensure not too close to other spawn points
    let tooClose = false
    for (const p of points) {
      if (Math.abs(p.x - x) + Math.abs(p.y - y) < 4) { tooClose = true; break }
    }
    if (tooClose) continue
    points.push({ x, y })
  }
  return points
}

// Get village center spawn for new arrivals
export function getVillageCenter(map) {
  const h = map.length, w = map[0].length
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2)
  // find walkable tile near center
  return findWalkableNear(map, cx, cy, 8) || { x: cx, y: cy }
}
