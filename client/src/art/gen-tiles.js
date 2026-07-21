// ============================================================
// Mythral Art - Tile generator (CraftPix quality)
// Produces 32x32 tile frames with rich texture detail,
// autotile neighbor variants, and per-cell detail variation.
// ============================================================
import { PixelBuffer, C } from './pixelbuf.js'
import { mulberry32, hash2 } from './prng.js'
import { PALETTE as P, TILE as TS } from './palette.js'

// Iso tiles render as 2:1 diamonds: native box 64x32 (width TW, height TH=TW/2)
const ISO_W = 64
const ISO_H = 32

// ---- low-level tile drawing helpers ----

function baseFill(buf, ramp, rand, noiseAmt = 0.12) {
  for (let y = 0; y < TS; y++) {
    for (let x = 0; x < TS; x++) {
      const n = (rand() - 0.5) * 2 * noiseAmt
      const col = C.mix(ramp.light, ramp.shadow, 0.5 + n)
      buf.set(x, y, col)
    }
  }
}

function speckle(buf, color, count, rand, x0 = 0, y0 = 0, w = TS, h = TS) {
  for (let i = 0; i < count; i++) {
    const x = x0 + (rand() * w) | 0
    const y = y0 + (rand() * h) | 0
    buf.set(x, y, color)
  }
}

function grassTufts(buf, ramp, rand, density = 0.5) {
  for (let i = 0; i < 10 * density; i++) {
    const x = (rand() * TS) | 0
    const y = (TS - 2 - rand() * 8) | 0
    buf.set(x, y, ramp.shadow)
    buf.set(x, y - 1, ramp.base)
    if (rand() > 0.5) buf.set(x + 1, y - 1, ramp.light)
  }
}

function drawFlowers(buf, rand, palette = P.flower) {
  const colors = Object.values(palette)
  const n = 1 + (rand() * 3 | 0)
  for (let i = 0; i < n; i++) {
    const x = 4 + (rand() * (TS - 8) | 0)
    const y = 8 + (rand() * (TS - 12) | 0)
    const c = colors[(rand() * colors.length) | 0]
    // stem
    buf.set(x, y + 1, P.grassDark.base)
    buf.set(x, y + 2, P.grassDark.base)
    // petals
    buf.set(x, y, c)
    buf.set(x - 1, y, c); buf.set(x + 1, y, c); buf.set(x, y - 1, c)
    buf.set(x, y, P.flower.white) // center
  }
}

// ---- individual tile painters (return new PixelBuffer 32x32) ----

function paintGrass(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  baseFill(buf, P.grass, rand, 0.14)
  // individual grass blade tufts (CraftPix style)
  for (let i = 0; i < 14; i++) {
    const x = (rand() * TS) | 0
    const y = (TS - 1 - rand() * 10) | 0
    // 2-3 pixel tall blade
    buf.set(x, y, P.grassDark.base)
    buf.set(x, y - 1, P.grassBlade)
    if (rand() > 0.4) buf.set(x, y - 2, P.grassBladeLight)
    if (rand() > 0.6) buf.set(x + 1, y - 1, P.grass.light)
  }
  // scattered detail dots
  speckle(buf, P.grass.light, 12, rand)
  speckle(buf, P.grassDark.shadow, 8, rand)
  if (variation === 1) drawFlowers(buf, rand)
  if (variation === 2) { // small stones
    buf.disc(16, 20, 3, P.stone.base); buf.disc(15, 19, 2, P.stone.light)
    buf.set(17, 21, P.stone.shadow)
  }
  if (variation === 3) { // clover patch
    speckle(buf, P.grassDark.base, 10, rand)
    speckle(buf, P.grassDark.light, 6, rand)
  }
  return buf
}

function paintDarkGrass(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  baseFill(buf, P.grassDark, rand, 0.12)
  // denser, taller grass blades
  for (let i = 0; i < 18; i++) {
    const x = (rand() * TS) | 0
    const y = (TS - 1 - rand() * 12) | 0
    buf.set(x, y, P.grassDark.shadow)
    buf.set(x, y - 1, P.grassDark.base)
    buf.set(x, y - 2, P.grassBlade)
    if (rand() > 0.5) buf.set(x + 1, y - 1, P.grassDark.light)
  }
  speckle(buf, P.grassDark.light, 8, rand)
  if (variation === 1) drawFlowers(buf, rand, { pink: P.flower.pink, purple: P.flower.purple, white: P.flower.white })
  if (variation === 2) speckle(buf, P.grassDark.shadow, 6, rand)
  if (variation === 3) { speckle(buf, P.grassDark.base, 8, rand); speckle(buf, P.grass.light, 4, rand) }
  return buf
}

function paintFlowers(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  baseFill(buf, P.grass, rand, 0.1)
  for (let i = 0; i < 3; i++) drawFlowers(buf, rand)
  speckle(buf, P.grass.light, 10, rand)
  return buf
}

function paintSand(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  baseFill(buf, P.sand, rand, 0.1)
  speckle(buf, P.sand.light, 14, rand)
  speckle(buf, P.sand.shadow, 10, rand)
  // individual sand grain highlights
  for (let i = 0; i < 6; i++) {
    const x = (rand() * TS) | 0, y = (rand() * TS) | 0
    buf.set(x, y, P.sand.highlight)
  }
  if (variation === 1) { // pebble
    buf.disc(20, 18, 2, P.stone.base); buf.set(19, 17, P.stone.light)
  }
  if (variation === 2) { // tiny shell
    buf.set(10, 12, P.flower.white); buf.set(11, 11, P.flower.white)
  }
  return buf
}

function paintPath(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  baseFill(buf, P.path, rand, 0.1)
  // cobblestone pattern
  for (let i = 0; i < 5; i++) {
    const cx = 4 + (rand() * (TS - 8) | 0)
    const cy = 4 + (rand() * (TS - 8) | 0)
    buf.disc(cx, cy, 2 + (rand() * 2 | 0), P.path.light)
    buf.set(cx - 1, cy - 1, P.path.highlight)
  }
  speckle(buf, P.path.shadow, 10, rand)
  // cobble cracks
  if (variation !== 1) {
    buf.set(15, 8, P.path.shadow); buf.set(15, 9, P.path.shadow)
    buf.set(8, 20, P.path.shadow); buf.set(22, 14, P.path.shadow)
  }
  if (variation === 2) speckle(buf, P.dirt.base, 6, rand)
  return buf
}

function paintWater(variation, rand, deep = false) {
  const ramp = deep ? P.waterDeep : P.water
  const buf = new PixelBuffer(TS, TS)
  buf.vGradient(0, 0, TS, TS, ramp.light, ramp.shadow)
  // wave highlight lines (CraftPix style)
  for (let i = 0; i < 6; i++) {
    const y = (rand() * TS) | 0
    const x = (rand() * (TS - 8)) | 0
    const len = 3 + (rand() * 4 | 0)
    buf.rect(x, y, len, 1, ramp.highlight)
    if (rand() > 0.5) buf.set(x + 1, y - 1, ramp.highlight)
  }
  // subtle ripple dots
  speckle(buf, ramp.base, 8, rand)
  speckle(buf, ramp.highlight, 4, rand)
  if (deep && variation === 1) {
    buf.rect(2, 2, TS - 4, 1, 'rgba(180,210,255,0.25)')
  }
  return buf
}

function paintWoodFloor(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  buf.rect(0, 0, TS, TS, P.wood.base)
  // plank lines with grain
  for (let y = 4; y < TS; y += 8) {
    buf.rect(0, y, TS, 1, P.woodDark.shadow)
    buf.rect(0, y + 1, TS, 1, P.woodPlank.shadow)
  }
  // plank grain detail
  for (let i = 0; i < 8; i++) {
    const y = 1 + (rand() * (TS - 2) | 0)
    const x = (rand() * (TS - 4) | 0)
    buf.rect(x, y, 2 + (rand() * 4 | 0), 1, P.wood.light)
  }
  // wood knot
  if (variation === 1) { buf.disc(16, 16, 2, P.woodDark.shadow); buf.set(15, 15, P.woodDark.base) }
  return buf
}

function paintStoneFloor(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  buf.rect(0, 0, TS, TS, P.stone.base)
  // brick pattern
  for (let y = 0; y < TS; y += 8) {
    buf.rect(0, y, TS, 1, P.stoneDark.shadow)
    const off = (y / 8) % 2 === 0 ? 0 : 8
    for (let x = off; x < TS; x += 16) {
      buf.rect(x, y, 1, 8, P.stoneDark.shadow)
      buf.set(x + 1, y + 1, P.stone.light) // highlight corner
    }
  }
  buf.rect(1, 1, TS / 2 - 1, TS / 2 - 1, P.stone.light)
  if (variation === 1) speckle(buf, P.stoneDark.shadow, 6, rand)
  return buf
}

function paintWall(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  buf.rect(0, 0, TS, TS, P.stoneDark.base)
  // brick rows with texture
  for (let y = 0; y < TS; y += 8) {
    buf.rect(0, y, TS, 1, P.stoneDark.shadow)
    const off = (y / 8) % 2 === 0 ? 0 : 8
    for (let x = off; x < TS; x += 16) {
      buf.rect(x, y, 1, 8, P.stoneDark.shadow)
      // brick highlight on top-left
      buf.set(x + 1, y + 1, P.stoneDark.light)
      buf.set(x + 2, y + 1, P.stoneDark.mid)
    }
  }
  // moss in crevices
  if (variation === 1) speckle(buf, P.grassDark.base, 6, rand)
  return buf
}

function paintDoor(variation, rand) {
  const buf = paintWoodFloor(0, rand)
  // archway door
  buf.rect(10, 6, 12, TS - 6, P.woodDark.base)
  buf.rect(11, 7, 10, TS - 8, P.wood.base)
  // door frame highlight
  buf.rect(10, 5, 12, 2, P.woodDark.shadow)
  buf.rect(12, 8, 3, TS - 10, P.wood.light)
  // door handle
  buf.set(15, TS - 4, P.gold.base)
  buf.set(16, TS - 4, P.gold.light)
  return buf
}

function paintBridge(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  buf.rect(0, 0, TS, TS, P.wood.base)
  // plank lines
  for (let x = 0; x < TS; x += 6) {
    buf.rect(x, 0, 1, TS, P.woodDark.shadow)
    buf.set(x + 1, (rand() * TS) | 0, P.wood.light) // grain highlight
  }
  buf.rect(0, 2, TS, 2, P.wood.light)
  buf.rect(0, TS - 4, TS, 2, P.wood.light)
  return buf
}

function paintRuins(variation, rand) {
  const buf = paintGrass(0, rand)
  // broken stone blocks with texture
  buf.rect(4, 14, 10, 8, P.stone.base)
  buf.rect(4, 14, 10, 1, P.stone.light)
  buf.rect(4, 14, 1, 8, P.stone.light)
  buf.rect(16, 10, 8, 12, P.stoneDark.base)
  buf.rect(16, 10, 8, 1, P.stone.light)
  // moss on stones
  speckle(buf, P.grassDark.base, 12, rand)
  speckle(buf, P.grassDark.light, 4, rand)
  return buf
}

function paintMushroom(variation, rand) {
  const buf = paintGrass(0, rand)
  // cluster of mushrooms with detail
  for (let i = 0; i < 3; i++) {
    const x = 6 + i * 8
    const y = 18 + (rand() * 4 | 0)
    buf.rect(x, y, 2, 5, P.skin.base) // stem
    buf.set(x, y + 4, P.skin.light)
    buf.rect(x - 2, y - 3, 6, 3, P.crystal.base) // cap
    buf.rect(x - 2, y - 3, 6, 1, P.crystal.light)
    buf.set(x, y - 2, P.flower.white) // dot
    buf.set(x + 1, y - 3, P.flower.white)
  }
  return buf
}

function paintForest(variation, rand) {
  const buf = paintGrass(0, rand)
  const tx = 16
  // trunk with bark texture
  buf.rect(tx - 1, 16, 3, 12, P.woodDark.base)
  buf.set(tx, 18, P.woodDark.light)
  buf.set(tx, 22, P.woodDark.light)
  // canopy with layered leaves
  buf.disc(tx, 8, 6, P.grassDark.shadow)
  buf.disc(tx - 2, 6, 5, P.grassDark.base)
  buf.disc(tx + 2, 7, 4, P.grassDark.base)
  buf.disc(tx - 1, 5, 3, P.grass.base)
  buf.disc(tx + 1, 4, 2, P.grass.light)
  // leaf detail
  buf.set(tx - 4, 7, P.grass.light)
  buf.set(tx + 3, 5, P.grass.light)
  return buf
}

function paintDenseForest(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  buf.rect(0, 0, TS, TS, P.grassDark.shadow)
  // overlapping canopy masses
  buf.disc(16, 14, 12, P.grassDark.base)
  buf.disc(12, 10, 7, P.grassDark.shadow)
  buf.disc(20, 12, 6, P.grassDark.base)
  buf.disc(14, 9, 3, P.grass.light)
  buf.disc(18, 8, 2, P.grass.light)
  return buf
}

function paintMountain(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  buf.rect(0, 0, TS, TS, P.stoneDark.base)
  // peak with rock texture
  for (let y = 0; y < TS; y++) {
    const half = (y / TS) * 14
    for (let x = 16 - half; x <= 16 + half; x++) {
      buf.set(x, y, y < 10 ? P.stone.light : P.stone.base)
    }
  }
  // rock facet highlights
  for (let i = 0; i < 4; i++) {
    const rx = 10 + (rand() * 12 | 0)
    const ry = 8 + (rand() * 16 | 0)
    buf.set(rx, ry, P.stone.highlight)
  }
  // snow cap
  for (let y = 0; y < 8; y++) {
    const half = (y / 8) * 5
    for (let x = 16 - half; x <= 16 + half; x++) buf.set(x, y, P.snow.base)
  }
  return buf
}

// ---- Biome-specific tile variants ----

function paintSnowGrass(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  baseFill(buf, P.snow, rand, 0.08)
  // snow drifts
  for (let i = 0; i < 4; i++) {
    const x = (rand() * TS) | 0
    const y = (rand() * TS) | 0
    buf.disc(x, y, 2 + (rand() * 3 | 0), P.snow.highlight)
  }
  speckle(buf, P.snow.light, 8, rand)
  if (variation === 1) { // small pine sapling
    buf.rect(16, 20, 1, 6, P.woodDark.base)
    buf.rect(14, 16, 5, 4, P.grassDark.base)
    buf.rect(15, 14, 3, 3, P.grassDark.light)
  }
  return buf
}

function paintLava(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  buf.vGradient(0, 0, TS, TS, P.lava.highlight, P.lava.shadow)
  // lava glow spots
  for (let i = 0; i < 4; i++) {
    const x = (rand() * TS) | 0
    const y = (rand() * TS) | 0
    buf.disc(x, y, 1 + (rand() * 2 | 0), P.lava.highlight)
  }
  speckle(buf, P.lava.base, 8, rand)
  return buf
}

function paintSwampTile(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  baseFill(buf, P.swamp, rand, 0.1)
  // lily pads
  for (let i = 0; i < 2; i++) {
    const x = 6 + (rand() * 20 | 0)
    const y = 8 + (rand() * 16 | 0)
    buf.disc(x, y, 2, P.grassDark.base)
    buf.set(x + 1, y - 1, P.grassDark.light)
  }
  speckle(buf, P.swampMoss, 6, rand)
  return buf
}

function paintDesertTile(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  baseFill(buf, P.desert, rand, 0.08)
  // wind-swept sand lines
  for (let i = 0; i < 3; i++) {
    const y = (rand() * TS) | 0
    const x = (rand() * 10) | 0
    buf.rect(x, y, 8 + (rand() * 12 | 0), 1, P.desert.light)
  }
  speckle(buf, P.desert.highlight, 6, rand)
  if (variation === 1) { // cactus
    buf.rect(16, 10, 2, 14, P.grassDark.base)
    buf.rect(14, 14, 2, 4, P.grassDark.base)
    buf.rect(18, 12, 2, 4, P.grassDark.base)
    buf.set(16, 10, P.grassDark.light)
  }
  return buf
}

function paintCloudTile(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  buf.rect(0, 0, TS, TS, 'rgba(200,215,240,0.6)')
  // cloud puffs
  buf.disc(16, 16, 10, P.cloud.base)
  buf.disc(10, 14, 7, P.cloud.light)
  buf.disc(22, 15, 6, P.cloud.light)
  buf.disc(16, 12, 5, P.cloud.highlight)
  return buf
}

function paintVoidTile(variation, rand) {
  const buf = new PixelBuffer(TS, TS)
  baseFill(buf, P.void, rand, 0.1)
  // floating crystal shards
  for (let i = 0; i < 3; i++) {
    const x = 4 + (rand() * 24 | 0)
    const y = 4 + (rand() * 24 | 0)
    buf.set(x, y, P.crystal.light)
    buf.set(x + 1, y, P.crystal.base)
    buf.set(x, y + 1, P.crystal.shadow)
  }
  speckle(buf, P.void.light, 6, rand)
  return buf
}

// registry of painters
export const TILE_PAINTERS = {
  grass: paintGrass, darkGrass: paintDarkGrass, flowers: paintFlowers,
  sand: paintSand, path: paintPath, water: paintWater, deepWater: (v, r) => paintWater(v, r, true),
  woodFloor: paintWoodFloor, stoneFloor: paintStoneFloor, wall: paintWall,
  door: paintDoor, bridge: paintBridge, ruins: paintRuins, mushroom: paintMushroom,
  forest: paintForest, denseForest: paintDenseForest, mountain: paintMountain,
  // biome variants
  snow: paintSnowGrass, lava: paintLava, swamp: paintSwampTile,
  desert: paintDesertTile, cloud: paintCloudTile, void: paintVoidTile,
}

// Detail variation count per tile
export const TILE_VARIATIONS = {
  grass: 4, darkGrass: 4, flowers: 1, sand: 3, path: 3, water: 3, deepWater: 3,
  woodFloor: 2, stoneFloor: 2, wall: 2, door: 1, bridge: 1, ruins: 2,
  mushroom: 1, forest: 1, denseForest: 1, mountain: 1,
  snow: 2, lava: 2, swamp: 2, desert: 2, cloud: 1, void: 1,
}

// Project a 32x32 square tile into a 64x32 iso diamond
function projectToIso(src) {
  const out = new PixelBuffer(ISO_W, ISO_H)
  const half = ISO_W / 2
  for (let sy = 0; sy < ISO_H; sy++) {
    for (let sx = 0; sx < ISO_W; sx++) {
      const u = sy + (sx - half) / 2
      const v = sy - (sx - half) / 2
      const iu = Math.floor(u), iv = Math.floor(v)
      if (iu < 0 || iu >= TS || iv < 0 || iv >= TS) continue
      const p = src.get(iu, iv)
      if (p && p[3] > 10) out.set(sx, sy, `rgb(${p[0]},${p[1]},${p[2]})`)
    }
  }
  return out
}

// Generate all frames for a set of tile types; returns {key: PixelBuffer}
export function generateTiles(types) {
  const out = {}
  for (const type of types) {
    const painter = TILE_PAINTERS[type]
    if (!painter) continue
    const n = TILE_VARIATIONS[type] || 1
    for (let v = 0; v < n; v++) {
      const rand = mulberry32(hash2(type.length, v, 9001) * 1e9 | 0)
      const src = painter(v, rand)
      out[`tile.${type}.${v}`] = projectToIso(src)
    }
  }
  return out
}
