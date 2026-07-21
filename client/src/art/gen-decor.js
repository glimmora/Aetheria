// ============================================================
// Mythral Art - Decoration / prop generator (CraftPix quality)
// Tall objects rendered taller than 32px with vertical offset.
// Anchor: bottom-center.
// ============================================================
import { PixelBuffer, C } from './pixelbuf.js'
import { mulberry32, hash2 } from './prng.js'
import { PALETTE as P, TILE as TS } from './palette.js'

// ---- Trees (CraftPix-style with layered canopies) ----

function oakTree(seed) {
  const W = 40, H = 56
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  const rand = mulberry32(seed)
  // trunk with bark texture
  buf.rect(cx - 3, H - 26, 6, 26, P.woodDark.base)
  buf.rect(cx - 3, H - 26, 2, 26, P.wood.light)
  buf.rect(cx + 1, H - 26, 2, 26, P.woodDark.shadow)
  // bark detail lines
  for (let i = 0; i < 4; i++) {
    const by = H - 24 + (rand() * 18 | 0)
    buf.set(cx - 2, by, P.woodDark.shadow)
    buf.set(cx + 1, by + 1, P.woodDark.shadow)
  }
  // roots at base
  buf.rect(cx - 4, H - 4, 3, 2, P.woodDark.shadow)
  buf.rect(cx + 2, H - 4, 3, 2, P.woodDark.shadow)
  // canopy - layered discs (4 levels of depth)
  const cy = H - 34
  buf.disc(cx, cy, 16, P.grassDark.deepShadow)
  buf.disc(cx - 4, cy - 3, 12, P.grassDark.shadow)
  buf.disc(cx + 5, cy + 2, 11, P.grassDark.base)
  buf.disc(cx - 2, cy - 6, 9, P.grass.base)
  buf.disc(cx + 3, cy - 4, 6, P.grass.light)
  // individual leaf cluster highlights
  buf.set(cx - 6, cy - 8, P.grass.light)
  buf.set(cx + 1, cy - 10, P.grass.light)
  buf.set(cx - 8, cy - 2, P.grassDark.light)
  buf.set(cx + 7, cy - 1, P.grassDark.light)
  // shadow on ground
  buf.disc(cx + 2, H - 2, 8, 'rgba(0,0,0,0.18)')
  return buf
}

function pineTree(seed) {
  const W = 36, H = 52
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  const rand = mulberry32(seed)
  // trunk
  buf.rect(cx - 2, H - 10, 4, 10, P.woodDark.base)
  buf.set(cx, H - 12, P.woodDark.light)
  // stacked triangle foliage (3 layers)
  for (let layer = 0; layer < 3; layer++) {
    const top = H - 14 - layer * 13
    const baseY = H - 12 - layer * 11
    const half = 6 + layer * 4
    for (let y = top; y < baseY; y++) {
      const t = (y - top) / (baseY - top)
      const hw = 2 + t * half
      for (let x = cx - hw; x <= cx + hw; x++) {
        const edge = x < cx - hw + 2 || y < top + 2
        const c = edge ? P.grass.light : (t < 0.3 ? P.grassDark.shadow : P.grassDark.base)
        buf.set(x, y, c)
      }
    }
    // snow on tips (if applicable)
    if (layer === 2) buf.set(cx, top, P.snow.highlight)
  }
  // shadow
  buf.disc(cx, H - 1, 6, 'rgba(0,0,0,0.15)')
  return buf
}

function bush(seed) {
  const W = 32, H = 26
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  const rand = mulberry32(seed)
  // layered bush with depth
  buf.disc(cx, H - 8, 11, P.grassDark.shadow)
  buf.disc(cx - 3, H - 10, 8, P.grassDark.base)
  buf.disc(cx + 3, H - 9, 7, P.grass.base)
  buf.disc(cx - 1, H - 12, 5, P.grass.light)
  // berries with highlights
  buf.set(cx - 4, H - 9, P.flower.red); buf.set(cx - 4, H - 10, '#ff6666')
  buf.set(cx + 4, H - 8, P.flower.blue); buf.set(cx + 4, H - 9, '#88ccff')
  buf.set(cx + 1, H - 11, P.flower.pink)
  // shadow
  buf.disc(cx, H - 1, 7, 'rgba(0,0,0,0.15)')
  return buf
}

function rock(seed) {
  const W = 30, H = 24
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  const rand = mulberry32(seed)
  // multi-faceted rock with shading planes
  buf.disc(cx, H - 8, 10, P.stone.shadow)
  buf.disc(cx - 2, H - 10, 7, P.stone.base)
  buf.disc(cx - 3, H - 12, 4, P.stone.light)
  // highlight facets
  buf.set(cx - 4, H - 12, P.stone.highlight)
  buf.set(cx - 2, H - 13, P.stone.highlight)
  // shadow detail
  buf.set(cx + 4, H - 7, P.stoneDark.shadow)
  buf.set(cx + 3, H - 6, P.stoneDark.shadow)
  // moss spots
  if (rand() > 0.5) { buf.set(cx - 1, H - 10, P.grassDark.base); buf.set(cx, H - 9, P.grassDark.base) }
  // shadow
  buf.disc(cx, H - 1, 8, 'rgba(0,0,0,0.18)')
  return buf
}

function flowerPatch(seed) {
  const buf = new PixelBuffer(TS, TS)
  const rand = mulberry32(seed)
  for (let i = 0; i < 8; i++) {
    const x = 3 + (rand() * (TS - 6) | 0)
    const y = 6 + (rand() * (TS - 10) | 0)
    const c = [P.flower.pink, P.flower.yellow, P.flower.blue, P.flower.purple, P.flower.red, P.flower.orange][i % 6]
    // stem
    buf.set(x, y + 1, P.grassDark.base)
    buf.set(x, y + 2, P.grassDark.base)
    // petals (cross pattern)
    buf.set(x, y, c); buf.set(x - 1, y, c); buf.set(x + 1, y, c); buf.set(x, y - 1, c)
    buf.set(x, y, P.flower.white) // center
  }
  return buf
}

function sign(seed) {
  const W = 26, H = 30
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  // post with grain
  buf.rect(cx - 1, H - 14, 2, 14, P.woodDark.base)
  buf.set(cx, H - 12, P.woodDark.light)
  // sign board
  buf.rect(4, 8, W - 8, 12, P.wood.base)
  buf.rect(4, 8, W - 8, 2, P.wood.light)
  buf.rect(4, 8, 2, 12, P.wood.light)
  buf.rect(W - 6, 8, 2, 12, P.woodDark.shadow)
  buf.rect(7, 13, W - 14, 2, P.woodDark.shadow) // plank line
  return buf
}

function barrel(seed) {
  const W = 24, H = 30
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  // barrel body
  buf.rect(4, 6, W - 8, H - 6, P.wood.base)
  buf.rect(4, 6, 2, H - 6, P.wood.light)
  buf.rect(W - 6, 6, 2, H - 6, P.woodDark.shadow)
  // metal hoops
  buf.rect(4, 10, W - 8, 2, P.metal.shadow)
  buf.rect(4, H - 8, W - 8, 2, P.metal.shadow)
  buf.rect(4, 10, W - 8, 1, P.metal.base)
  buf.rect(4, H - 8, W - 8, 1, P.metal.base)
  // wood grain
  buf.rect(6, 8, 2, H - 10, P.wood.light)
  buf.rect(W - 8, 8, 2, H - 10, P.woodDark.shadow)
  return buf
}

function crate(seed) {
  const W = 28, H = 28
  const buf = new PixelBuffer(W, H)
  buf.rect(2, 4, W - 4, H - 4, P.wood.base)
  buf.rect(2, 4, W - 4, 2, P.wood.light)
  buf.rect(2, H - 6, W - 4, 2, P.woodDark.shadow)
  buf.rect(2, 4, 2, H - 4, P.wood.light)
  buf.rect(W - 4, 4, 2, H - 4, P.woodDark.shadow)
  // X brace
  for (let i = 0; i < 18; i++) {
    buf.set(3 + i, 5 + i, P.woodDark.shadow)
    buf.set(W - 4 - i, 5 + i, P.woodDark.shadow)
  }
  // center cross
  buf.rect(W / 2 - 1, 6, 2, H - 10, P.woodDark.shadow)
  buf.rect(4, H / 2, W - 8, 2, P.woodDark.shadow)
  return buf
}

function lamp(seed) {
  const W = 22, H = 44
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  // pole
  buf.rect(cx - 1, 8, 3, H - 8, P.metal.shadow)
  buf.rect(cx - 1, 8, 1, H - 8, P.metal.base)
  // lantern housing
  buf.rect(cx - 4, 2, 9, 10, P.metal.base)
  buf.rect(cx - 3, 3, 7, 8, P.gold.highlight)
  buf.rect(cx - 3, 3, 7, 2, P.gold.light)
  // warm glow
  buf.disc(cx, 7, 5, 'rgba(255,200,90,0.5)')
  buf.disc(cx, 7, 3, 'rgba(255,220,140,0.6)')
  return buf
}

function statue(seed) {
  const W = 30, H = 46
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  // stone base
  buf.rect(cx - 8, H - 4, 16, 4, P.stoneDark.shadow)
  buf.rect(cx - 8, H - 4, 16, 1, P.stoneDark.base)
  // body
  buf.rect(cx - 5, 10, 10, H - 14, P.stone.base)
  buf.rect(cx - 5, 10, 3, H - 14, P.stone.light)
  // head
  buf.disc(cx, 8, 6, P.stone.base)
  buf.disc(cx - 2, 6, 3, P.stone.light)
  // arm
  buf.rect(cx - 7, 14, 4, 14, P.stone.shadow)
  buf.set(cx - 7, 14, P.stone.base)
  // moss
  buf.set(cx - 4, H - 6, P.grassDark.base)
  buf.set(cx + 2, H - 5, P.grassDark.base)
  return buf
}

function fountain(seed) {
  const W = 48, H = 40
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  // stone basin
  buf.rect(4, H - 14, W - 8, 14, P.stone.base)
  buf.rect(4, H - 14, W - 8, 2, P.stone.light)
  buf.rect(4, H - 14, 2, 14, P.stone.light)
  buf.rect(W - 6, H - 14, 2, 14, P.stoneDark.shadow)
  // water
  buf.rect(8, H - 12, W - 16, 10, P.water.base)
  buf.rect(8, H - 12, W - 16, 2, P.water.light)
  // central column
  buf.rect(cx - 3, H - 30, 6, 18, P.stone.base)
  buf.rect(cx - 3, H - 30, 2, 18, P.stone.light)
  buf.disc(cx, H - 30, 5, P.stone.light)
  // water spout
  buf.disc(cx, H - 32, 4, P.water.light)
  buf.set(cx, H - 34, P.water.highlight)
  buf.set(cx - 1, H - 35, P.water.highlight)
  return buf
}

function fence(seed) {
  const buf = new PixelBuffer(TS, TS)
  const c = P.woodDark.base
  const l = P.wood.light
  // posts
  buf.rect(6, 12, 4, 18, c); buf.rect(22, 12, 4, 18, c)
  buf.set(6, 12, l); buf.set(22, 12, l)
  // rails
  buf.rect(2, 16, TS - 4, 3, c); buf.rect(2, 24, TS - 4, 3, c)
  buf.rect(2, 16, TS - 4, 1, l); buf.rect(2, 24, TS - 4, 1, l)
  return buf
}

function well(seed) {
  const W = 36, H = 36
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  // stone well body
  buf.rect(6, 18, W - 12, H - 18, P.stone.base)
  buf.rect(6, 18, W - 12, 2, P.stone.light)
  buf.rect(6, 18, 2, H - 18, P.stone.light)
  buf.rect(W - 8, 18, 2, H - 18, P.stoneDark.shadow)
  // water inside
  buf.rect(10, 22, W - 20, 8, P.waterDeep.base)
  buf.rect(10, 22, W - 20, 2, P.waterDeep.light)
  // roof posts
  buf.rect(4, 4, 3, 16, P.woodDark.base); buf.rect(W - 7, 4, 3, 16, P.woodDark.base)
  // roof
  buf.rect(2, 2, W - 4, 4, P.roof.base)
  buf.rect(2, 2, W - 4, 1, P.roof.light)
  return buf
}

// ---- Buildings (CraftPix Main Character's Home style) ----

function bakery(seed) {
  const W = 52, H = 64
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  const rand = mulberry32(seed)
  // stone foundation
  buf.rect(6, H - 10, W - 12, 10, P.stone.base)
  buf.rect(6, H - 10, W - 12, 2, P.stone.light)
  buf.rect(6, H - 10, 2, 10, P.stone.light)
  buf.rect(W - 8, H - 10, 2, 10, P.stoneDark.shadow)
  // wooden walls with plank texture
  buf.rect(8, 20, W - 16, H - 30, P.wood.base)
  buf.rect(8, 20, 2, H - 30, P.wood.light)
  buf.rect(W - 10, 20, 2, H - 30, P.woodDark.shadow)
  for (let py = 28; py < H - 12; py += 8) {
    buf.rect(8, py, W - 16, 1, P.woodDark.shadow)
  }
  // door with arch
  buf.rect(cx - 4, H - 22, 8, 12, P.woodDark.base)
  buf.rect(cx - 4, H - 22, 8, 2, P.wood.light)
  buf.set(cx + 2, H - 16, P.gold.base)
  // windows with warm glow
  buf.rect(12, 30, 8, 8, P.woodDark.shadow)
  buf.rect(13, 31, 6, 6, '#ffcc66')
  buf.rect(14, 32, 4, 4, '#ffe099')
  buf.rect(W - 20, 30, 8, 8, P.woodDark.shadow)
  buf.rect(W - 19, 31, 6, 6, '#ffcc66')
  // red tiled roof with shingle detail
  buf.rect(4, 12, W - 8, 10, P.roof.base)
  buf.rect(4, 12, W - 8, 2, P.roof.light)
  buf.rect(4, 12, 2, 10, P.roof.light)
  buf.rect(W - 6, 12, 2, 10, P.roof.shadow)
  // shingle rows
  for (let ry = 13; ry < 21; ry += 3) {
    for (let rx = 6; rx < W - 6; rx += 4) {
      buf.set(rx, ry, P.roof.shingle)
      buf.set(rx + 1, ry, P.roof.shingleLight)
    }
  }
  // roof peak
  buf.rect(6, 6, W - 12, 8, P.roof.base)
  buf.rect(6, 6, W - 12, 2, P.roof.highlight)
  buf.rect(10, 2, W - 20, 6, P.roof.base)
  // chimney with smoke
  buf.rect(W - 16, 0, 6, 12, P.stoneDark.base)
  buf.rect(W - 16, 0, 6, 2, P.stone.light)
  buf.set(W - 14, -2, '#aaa'); buf.set(W - 13, -4, '#ccc'); buf.set(W - 14, -6, '#ddd')
  // sign
  buf.rect(cx - 8, H - 28, 16, 6, P.wood.base)
  buf.set(cx - 2, H - 26, P.flower.red)
  buf.set(cx + 2, H - 26, P.flower.red)
  return buf
}

function forge(seed) {
  const W = 56, H = 68
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  // stone foundation (darker)
  buf.rect(4, H - 14, W - 8, 14, P.stoneDark.base)
  buf.rect(4, H - 14, W - 8, 2, P.stone.base)
  buf.rect(4, H - 14, 2, 14, P.stone.base)
  buf.rect(W - 6, H - 14, 2, 14, P.stoneDark.shadow)
  // dark stone walls
  buf.rect(6, 22, W - 12, H - 36, P.stoneDark.base)
  buf.rect(6, 22, 2, H - 36, P.stoneDark.mid)
  buf.rect(W - 8, 22, 2, H - 36, '#1a1a1a')
  // metal bands
  for (let py = 30; py < H - 16; py += 10) {
    buf.rect(6, py, W - 12, 2, P.metal.shadow)
    buf.rect(6, py, W - 12, 1, P.metal.base)
  }
  // forge door with fire
  buf.rect(cx - 8, H - 30, 16, 16, '#1a1008')
  buf.rect(cx - 8, H - 30, 16, 2, P.metal.base)
  buf.rect(cx - 5, H - 22, 10, 8, '#ff5a1f')
  buf.rect(cx - 3, H - 20, 6, 6, '#ff8a3d')
  buf.rect(cx - 1, H - 18, 4, 4, '#ffe14a')
  // anvil
  buf.rect(cx + 10, H - 18, 8, 4, P.metal.shadow)
  buf.rect(cx + 11, H - 22, 4, 6, P.metal.base)
  // windows with orange glow
  buf.rect(12, 32, 6, 6, P.stoneDark.shadow)
  buf.rect(13, 33, 4, 4, '#ff9944')
  buf.rect(W - 18, 32, 6, 6, P.stoneDark.shadow)
  buf.rect(W - 17, 33, 4, 4, '#ff9944')
  // dark roof
  buf.rect(2, 14, W - 4, 10, P.metal.shadow)
  buf.rect(2, 14, W - 4, 2, P.metal.base)
  buf.rect(4, 8, W - 8, 8, P.metal.shadow)
  buf.rect(8, 4, W - 16, 6, P.metal.shadow)
  // chimney
  buf.rect(W - 14, -2, 8, 18, P.stoneDark.base)
  buf.rect(W - 14, -2, 8, 2, P.stone.base)
  for (let i = 0; i < 4; i++) buf.set(W - 12 + (i % 2), -4 - i * 2, `rgba(150,150,150,${0.6 - i * 0.12})`)
  return buf
}

function apothecary(seed) {
  const W = 48, H = 60
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  // stone base
  buf.rect(6, H - 10, W - 12, 10, P.stone.base)
  buf.rect(6, H - 10, W - 12, 2, P.stone.light)
  // plaster walls
  buf.rect(8, 18, W - 16, H - 28, P.clothWhite.base)
  buf.rect(8, 18, 2, H - 28, P.clothWhite.light)
  buf.rect(W - 10, 18, 2, H - 28, P.clothWhite.shadow)
  // door (green frame)
  buf.rect(cx - 4, H - 24, 8, 14, P.clothGreen.shadow)
  buf.rect(cx - 4, H - 24, 8, 2, P.clothGreen.light)
  buf.set(cx + 2, H - 18, P.gold.base)
  // windows with green tint
  buf.rect(12, 26, 8, 8, P.clothGreen.shadow)
  buf.rect(13, 27, 6, 6, '#88dd88')
  buf.rect(14, 28, 4, 4, '#aaffaa')
  buf.rect(W - 20, 26, 8, 8, P.clothGreen.shadow)
  buf.rect(W - 19, 27, 6, 6, '#88dd88')
  // herb bundles
  buf.set(14, 35, P.grass.base); buf.set(15, 36, P.grassDark.base)
  buf.set(W - 18, 35, P.grass.base); buf.set(W - 17, 36, P.grassDark.base)
  // green tiled roof
  buf.rect(4, 10, W - 8, 10, P.clothGreen.shadow)
  buf.rect(4, 10, W - 8, 2, P.clothGreen.base)
  buf.rect(6, 4, W - 12, 8, P.clothGreen.shadow)
  buf.rect(10, 0, W - 20, 6, P.clothGreen.base)
  // sign
  buf.rect(cx - 6, H - 30, 12, 5, P.wood.base)
  buf.set(cx - 2, H - 28, P.clothTeal.base)
  buf.set(cx, H - 29, P.clothTeal.light)
  buf.set(cx + 2, H - 28, P.clothTeal.base)
  return buf
}

function dock(seed) {
  const W = 60, H = 48
  const buf = new PixelBuffer(W, H)
  // platform
  buf.rect(2, H - 14, W - 4, 14, P.wood.base)
  buf.rect(2, H - 14, W - 4, 2, P.wood.light)
  buf.rect(2, H - 14, 2, 14, P.wood.light)
  buf.rect(W - 4, H - 14, 2, 14, P.woodDark.shadow)
  for (let py = H - 10; py < H; py += 4) buf.rect(2, py, W - 4, 1, P.woodDark.shadow)
  // posts
  buf.rect(6, H - 28, 4, 16, P.woodDark.base)
  buf.rect(W - 10, H - 28, 4, 16, P.woodDark.base)
  // boat
  buf.rect(18, H - 24, 24, 8, P.wood.base)
  buf.rect(18, H - 24, 24, 2, P.wood.light)
  buf.rect(W - 22, H - 24, 2, 8, P.woodDark.shadow)
  buf.rect(20, H - 16, 20, 2, P.woodDark.shadow)
  // mast + sail
  buf.rect(29, H - 38, 2, 16, P.woodDark.base)
  for (let sy = 0; sy < 12; sy++) {
    const sw = Math.min(sy + 1, 6)
    buf.rect(31, H - 38 + sy, sw, 1, P.clothWhite.base)
  }
  return buf
}

function elderHut(seed) {
  const W = 50, H = 62
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  // stone foundation
  buf.rect(4, H - 12, W - 8, 12, P.stone.base)
  buf.rect(4, H - 12, W - 8, 2, P.stone.light)
  buf.rect(4, H - 12, 2, 12, P.stone.light)
  buf.rect(W - 6, H - 12, 2, 12, P.stoneDark.shadow)
  // stone walls with brick texture
  buf.rect(6, 18, W - 12, H - 30, P.stone.base)
  buf.rect(6, 18, 2, H - 30, P.stone.light)
  buf.rect(W - 8, 18, 2, H - 30, P.stoneDark.shadow)
  for (let py = 24; py < H - 14; py += 6) buf.rect(6, py, W - 12, 1, P.stoneDark.shadow)
  for (let px = 10; px < W - 10; px += 8) {
    for (let py = 24; py < H - 14; py += 12) buf.set(px, py, P.stoneDark.shadow)
  }
  // grand arched door
  buf.rect(cx - 5, H - 28, 10, 16, P.woodDark.base)
  buf.rect(cx - 5, H - 28, 10, 2, P.gold.base)
  buf.set(cx, H - 30, P.gold.highlight)
  buf.set(cx + 2, H - 20, P.gold.base)
  // windows with warm glow
  buf.rect(10, 28, 8, 8, P.stoneDark.shadow)
  buf.rect(11, 29, 6, 6, '#ffdd88')
  buf.rect(12, 30, 4, 4, '#ffeebb')
  buf.rect(W - 18, 28, 8, 8, P.stoneDark.shadow)
  buf.rect(W - 17, 29, 6, 6, '#ffdd88')
  // noble roof
  buf.rect(2, 10, W - 4, 10, P.roof.base)
  buf.rect(2, 10, W - 4, 2, P.roof.light)
  buf.rect(4, 4, W - 8, 8, P.roof.base)
  buf.rect(8, 0, W - 16, 6, P.roof.highlight)
  // banner
  buf.rect(cx - 3, H - 34, 6, 6, P.clothPurple.base)
  buf.rect(cx - 2, H - 33, 4, 4, P.clothPurple.light)
  return buf
}

function fishShack(seed) {
  const W = 44, H = 52
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  buf.rect(6, H - 8, W - 12, 8, P.woodDark.base)
  buf.rect(8, 16, W - 16, H - 24, P.woodDark.base)
  buf.rect(8, 16, 2, H - 24, P.wood.mid)
  for (let py = 22; py < H - 10; py += 6) buf.rect(8, py, W - 16, 1, P.woodDark.shadow)
  buf.rect(cx - 3, H - 20, 6, 12, P.woodDark.shadow)
  buf.set(cx + 1, H - 14, P.metal.base)
  buf.rect(12, 24, 6, 6, P.woodDark.shadow)
  buf.rect(13, 25, 4, 4, '#8899aa')
  // thatched roof
  buf.rect(4, 10, W - 8, 8, P.path.base)
  buf.rect(4, 10, W - 8, 2, P.path.light)
  buf.rect(6, 4, W - 12, 8, P.path.base)
  buf.rect(10, 0, W - 20, 6, P.path.shadow)
  return buf
}

function shop(seed) {
  const W = 50, H = 58
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  buf.rect(6, H - 10, W - 12, 10, P.stone.base)
  buf.rect(6, H - 10, W - 12, 2, P.stone.light)
  buf.rect(8, 18, W - 16, H - 28, P.wood.base)
  buf.rect(8, 18, 2, H - 28, P.wood.light)
  buf.rect(W - 10, 18, 2, H - 28, P.woodDark.shadow)
  // awning
  buf.rect(8, H - 24, W - 16, 4, P.clothRed.shadow)
  buf.rect(8, H - 24, W - 16, 2, P.clothRed.base)
  // counter
  buf.rect(10, H - 20, W - 20, 4, P.woodDark.base)
  buf.set(14, H - 22, P.gold.base); buf.set(18, H - 22, P.crystal.base)
  buf.rect(cx - 4, H - 30, 8, 12, P.woodDark.base)
  buf.rect(12, 26, 8, 8, P.woodDark.shadow)
  buf.rect(13, 27, 6, 6, '#aaddff')
  buf.rect(W - 20, 26, 8, 8, P.woodDark.shadow)
  buf.rect(W - 19, 27, 6, 6, '#aaddff')
  // red tile roof
  buf.rect(4, 10, W - 8, 10, P.roof.base)
  buf.rect(4, 10, W - 8, 2, P.roof.light)
  buf.rect(6, 4, W - 12, 8, P.roof.base)
  buf.rect(10, 0, W - 20, 6, P.roof.highlight)
  return buf
}

function inn(seed) {
  const W = 56, H = 68
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  buf.rect(4, H - 14, W - 8, 14, P.stone.base)
  buf.rect(4, H - 14, W - 8, 2, P.stone.light)
  // plaster + timber
  buf.rect(6, 22, W - 12, H - 36, P.clothWhite.base)
  buf.rect(6, 22, 2, H - 36, P.clothWhite.light)
  buf.rect(W - 8, 22, 2, H - 36, P.clothWhite.shadow)
  for (let py = 30; py < H - 16; py += 10) buf.rect(6, py, W - 12, 2, P.woodDark.base)
  buf.rect(12, 22, 2, H - 36, P.woodDark.base)
  buf.rect(W - 14, 22, 2, H - 36, P.woodDark.base)
  // grand entrance
  buf.rect(cx - 5, H - 32, 10, 18, P.woodDark.base)
  buf.rect(cx - 5, H - 32, 10, 2, P.gold.base)
  buf.set(cx - 2, H - 22, P.gold.base); buf.set(cx + 2, H - 22, P.gold.base)
  // warm windows
  buf.rect(10, 30, 7, 7, P.woodDark.shadow)
  buf.rect(11, 31, 5, 5, '#ffcc66')
  buf.rect(W - 17, 30, 7, 7, P.woodDark.shadow)
  buf.rect(W - 16, 31, 5, 5, '#ffcc66')
  // red tile roof
  buf.rect(2, 14, W - 4, 10, P.roof.base)
  buf.rect(2, 14, W - 4, 2, P.roof.light)
  buf.rect(4, 8, W - 8, 8, P.roof.base)
  buf.rect(8, 2, W - 16, 8, P.roof.highlight)
  // chimney
  buf.rect(12, -2, 6, 10, P.stoneDark.base)
  buf.set(14, -4, '#888'); buf.set(15, -6, '#aaa')
  // hanging sign
  buf.rect(W - 14, 20, 8, 6, P.wood.base)
  buf.rect(W - 13, 21, 6, 4, P.gold.base)
  return buf
}

function tower(seed) {
  const W = 40, H = 80
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  buf.rect(2, H - 14, W - 4, 14, P.stone.base)
  buf.rect(2, H - 14, W - 4, 2, P.stone.light)
  buf.rect(6, 14, W - 12, H - 28, P.stone.base)
  buf.rect(6, 14, 2, H - 28, P.stone.light)
  buf.rect(W - 8, 14, 2, H - 28, P.stoneDark.shadow)
  for (let py = 20; py < H - 16; py += 6) buf.rect(6, py, W - 12, 1, P.stoneDark.shadow)
  // narrow windows
  for (let wy = 24; wy < H - 20; wy += 20) {
    buf.rect(cx - 2, wy, 4, 8, P.stoneDark.shadow)
    buf.rect(cx - 1, wy + 1, 2, 6, '#88aadd')
  }
  buf.rect(cx - 4, H - 24, 8, 14, P.woodDark.base)
  buf.rect(cx - 4, H - 24, 8, 2, P.metal.base)
  // conical roof
  buf.rect(4, 8, W - 8, 8, P.roofBlue.base)
  buf.rect(4, 8, W - 8, 2, P.roofBlue.light)
  buf.rect(8, 2, W - 16, 8, P.roofBlue.base)
  buf.rect(12, -2, W - 24, 6, P.roofBlue.highlight)
  buf.rect(cx - 1, -8, 2, 8, P.metal.base)
  buf.set(cx, -10, P.crystal.light)
  return buf
}

function hut(seed) {
  const W = 40, H = 48
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  buf.rect(6, H - 8, W - 12, 8, P.dirt.base)
  buf.rect(8, 16, W - 16, H - 24, P.woodDark.base)
  buf.rect(8, 16, 2, H - 24, P.woodDark.mid)
  for (let py = 20; py < H - 10; py += 4) buf.rect(8, py, W - 16, 1, P.woodDark.shadow)
  buf.rect(cx - 3, H - 18, 6, 10, P.woodDark.shadow)
  buf.set(cx + 1, H - 13, P.wood.base)
  buf.rect(4, 10, W - 8, 8, P.path.base)
  buf.rect(4, 10, W - 8, 2, P.path.light)
  buf.rect(6, 4, W - 12, 8, P.path.base)
  buf.rect(10, 0, W - 20, 6, P.path.shadow)
  return buf
}

function temple(seed) {
  const W = 56, H = 72
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  // marble foundation
  buf.rect(2, H - 12, W - 4, 12, P.stone.light)
  buf.rect(2, H - 12, W - 4, 2, P.white)
  // columns
  buf.rect(6, 20, 4, H - 32, P.stone.light)
  buf.rect(7, 20, 2, H - 32, P.white)
  buf.rect(W - 10, 20, 4, H - 32, P.stone.light)
  buf.rect(W - 9, 20, 2, H - 32, P.white)
  // inner walls
  buf.rect(10, 20, W - 20, H - 32, P.clothWhite.base)
  // grand entrance
  buf.rect(cx - 6, H - 30, 12, 18, P.stoneDark.shadow)
  buf.rect(cx - 6, H - 30, 12, 2, P.gold.base)
  buf.set(cx, H - 32, P.gold.highlight)
  // stained glass windows
  buf.rect(14, 28, 8, 10, P.stoneDark.shadow)
  buf.rect(15, 29, 6, 8, P.crystal.base)
  buf.rect(16, 30, 4, 6, P.crystal.light)
  buf.rect(W - 22, 28, 8, 10, P.stoneDark.shadow)
  buf.rect(W - 21, 29, 6, 8, P.crystal.base)
  // holy symbol
  buf.rect(cx - 3, 24, 6, 8, P.gold.base)
  buf.rect(cx - 1, 22, 2, 12, P.gold.light)
  buf.rect(cx - 4, 26, 8, 2, P.gold.light)
  // ornate roof
  buf.rect(0, 12, W, 10, P.stone.base)
  buf.rect(0, 12, W, 2, P.stone.light)
  buf.rect(2, 6, W - 4, 8, P.stone.base)
  buf.rect(6, 0, W - 12, 8, P.stone.light)
  buf.rect(0, 12, W, 1, P.gold.base)
  return buf
}

function outpost(seed) {
  const W = 46, H = 56
  const buf = new PixelBuffer(W, H)
  const cx = W / 2 | 0
  buf.rect(6, H - 10, W - 12, 10, P.woodDark.base)
  buf.rect(8, 16, W - 16, H - 26, P.woodDark.base)
  buf.rect(8, 16, 2, H - 26, P.wood.mid)
  for (let py = 22; py < H - 12; py += 5) {
    buf.rect(8, py, W - 16, 2, P.woodDark.shadow)
    buf.rect(8, py, W - 16, 1, P.wood.mid)
  }
  buf.rect(cx - 3, H - 22, 6, 12, P.woodDark.shadow)
  buf.set(cx + 1, H - 16, P.leather.base)
  buf.rect(12, 26, 6, 6, P.woodDark.shadow)
  buf.rect(13, 27, 4, 4, '#88aa88')
  buf.rect(W - 18, 26, 6, 6, P.woodDark.shadow)
  buf.rect(W - 17, 27, 4, 4, '#88aa88')
  // peaked roof
  buf.rect(4, 10, W - 8, 8, P.wood.base)
  buf.rect(4, 10, W - 8, 2, P.wood.light)
  buf.rect(6, 4, W - 12, 8, P.wood.base)
  buf.rect(10, 0, W - 20, 6, P.wood.highlight)
  return buf
}

export const PROP_PAINTERS = {
  oak: oakTree, pine: pineTree, bush: bush, rock: rock, flowerPatch: flowerPatch,
  sign: sign, barrel: barrel, crate: crate, lamp: lamp, statue: statue,
  fountain: fountain, fence: fence, well: well,
  bakery: bakery, forge: forge, apothecary: apothecary, dock: dock,
  elderHut: elderHut, fishShack: fishShack, shop: shop, inn: inn,
  tower: tower, hut: hut, temple: temple, outpost: outpost,
}

export function generateProps(types) {
  const out = {}
  for (const type of types) {
    const painter = PROP_PAINTERS[type]
    if (!painter) continue
    const seed = hash2(type.length, 7, 4242) * 1e9 | 0
    const buf = painter(seed)
    out[`prop.${type}`] = { buf, w: buf.w, h: buf.h }
  }
  return out
}

export function generateBuildings(types) {
  const out = {}
  for (const type of types) {
    const painter = PROP_PAINTERS[type]
    if (!painter) continue
    const seed = hash2(type.length, 13, 7777) * 1e9 | 0
    const buf = painter(seed)
    out[`building.${type}`] = { buf, w: buf.w, h: buf.h }
  }
  return out
}
