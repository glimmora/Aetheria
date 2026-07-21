// ============================================================
// Mythral Art - Monster generator (CraftPix quality)
// Distinct silhouettes, detailed textures, 4 directions.
// Canvas 32x32, feet at (16,30).
// ============================================================
import { PixelBuffer, C } from './pixelbuf.js'
import { mulberry32, hash2 } from './prng.js'
import { PALETTE as P, TILE as TS } from './palette.js'

const MW = 32, MH = 32, FX = 16, FY = 30

// Enhanced blob creature with detailed eyes and shading
function blob(buf, dir, color, opts = {}) {
  const cx = FX, cy = FY - 8
  // body with depth shading
  buf.disc(cx, cy, 9, color.deepShadow || color.shadow)
  buf.disc(cx - 1, cy - 1, 7, color.shadow)
  buf.disc(cx - 1, cy - 1, 6, color.base)
  buf.disc(cx - 3, cy - 3, 4, color.mid || color.base)
  buf.disc(cx - 3, cy - 4, 2, color.light)
  // feet with detail
  buf.rect(cx - 6, FY - 2, 4, 2, color.shadow)
  buf.rect(cx + 2, FY - 2, 4, 2, color.shadow)
  buf.set(cx - 5, FY - 3, color.mid || color.base)
  buf.set(cx + 3, FY - 3, color.mid || color.base)
  // eyes with highlights
  if (dir !== 'up') {
    buf.set(cx - 3, cy - 1, P.black)
    buf.set(cx + 2, cy - 1, P.black)
    buf.set(cx - 3, cy - 2, P.white)
    buf.set(cx + 2, cy - 2, P.white)
    // pupil
    buf.set(cx - 2, cy - 1, color.shadow)
    buf.set(cx + 3, cy - 1, color.shadow)
  } else {
    buf.disc(cx, cy - 4, 6, color.shadow)
  }
  if (opts.ears) {
    buf.rect(cx - 7, cy - 9, 3, 4, color.base)
    buf.rect(cx + 4, cy - 9, 3, 4, color.base)
    buf.set(cx - 7, cy - 9, color.light)
    buf.set(cx + 6, cy - 9, color.light)
  }
  if (opts.horns) {
    buf.rect(cx - 6, cy - 9, 2, 3, P.bone || P.stone.light)
    buf.rect(cx + 4, cy - 9, 2, 3, P.bone || P.stone.light)
    buf.set(cx - 6, cy - 9, P.white)
    buf.set(cx + 5, cy - 9, P.white)
  }
}

const DESIGNS = {
  rat: {
    color: P.leather,
    draw: (b, d, o) => {
      blob(b, d, o.color, { ears: true })
      // tail
      b.rect(FX - 1, FY - 16, 2, 6, o.color.base)
      b.set(FX, FY - 18, P.flower.pink)
      // whiskers
      if (d !== 'up') {
        b.set(FX - 5, FY - 8, P.skin.base)
        b.set(FX + 4, FY - 8, P.skin.base)
      }
    }
  },
  wild_dog: {
    color: P.clothBrown,
    draw: (b, d, o) => {
      blob(b, d, o.color)
      // snout
      b.rect(FX - 8, FY - 12, 5, 4, o.color.shadow)
      b.set(FX - 9, FY - 13, o.color.base)
      b.set(FX - 10, FY - 12, P.white) // tooth
    }
  },
  goblin: {
    color: P.grassDark,
    draw: (b, d, o) => {
      blob(b, d, o.color, { ears: true })
      // club
      b.rect(FX - 2, FY - 18, 4, 8, o.color.base)
      b.set(FX, FY - 20, P.flower.red)
      // belt
      if (d !== 'up') b.rect(FX - 4, FY - 12, 8, 1, P.leather.base)
    }
  },
  spider: {
    color: P.stoneDark,
    draw: (b, d, o) => {
      const cx = FX, cy = FY - 8
      b.disc(cx, cy, 7, o.color.deepShadow || o.color.shadow)
      b.disc(cx - 1, cy - 1, 5, o.color.base)
      b.disc(cx - 2, cy - 2, 3, o.color.light)
      // legs with joints
      for (let i = 0; i < 4; i++) {
        const ly = cy - 4 + i * 2
        b.rect(cx - 10 - i, ly, 4, 1, o.color.shadow)
        b.rect(cx + 7 + i, ly, 4, 1, o.color.shadow)
        b.set(cx - 10 - i, ly - 1, o.color.mid || o.color.base)
        b.set(cx + 10 + i, ly - 1, o.color.mid || o.color.base)
      }
      // fangs
      if (d !== 'up') {
        b.set(cx - 1, cy + 4, P.white)
        b.set(cx + 1, cy + 4, P.white)
      }
      // eyes
      b.set(cx - 2, cy - 1, P.fire.base)
      b.set(cx + 2, cy - 1, P.fire.base)
    }
  },
  wolf: {
    color: P.clothBrown,
    draw: (b, d, o) => {
      blob(b, d, o.color, { ears: true })
      b.rect(FX - 2, FY - 20, 5, 10, o.color.base)
      b.set(FX, FY - 22, P.white) // fang
      // tail
      b.rect(FX + 5, FY - 14, 2, 4, o.color.shadow)
      b.set(FX + 6, FY - 15, o.color.base)
    }
  },
  beetle: {
    color: P.fire,
    draw: (b, d, o) => {
      const cx = FX, cy = FY - 6
      // shell
      b.disc(cx, cy, 8, o.color.deepShadow || o.color.shadow)
      b.disc(cx - 1, cy - 1, 6, o.color.base)
      b.rect(cx - 1, cy - 7, 2, 6, o.color.light)
      // shell highlight
      b.disc(cx - 2, cy - 3, 2, o.color.light)
      // mandibles
      if (d !== 'up') {
        b.set(cx - 4, cy + 5, P.metal.shadow)
        b.set(cx + 3, cy + 5, P.metal.shadow)
      }
      // legs
      b.set(cx - 6, cy - 1, o.color.shadow)
      b.set(cx + 5, cy - 1, o.color.shadow)
    }
  },
  slime: {
    color: P.poisonFx,
    draw: (b, d, o) => {
      blob(b, d, o.color)
      // slime trail
      if (d !== 'up') {
        b.set(FX - 3, FY, o.color.mid || o.color.base)
        b.set(FX + 2, FY, o.color.mid || o.color.base)
      }
    }
  },
  boss_giant: {
    color: P.clothRed,
    draw: (b, d, o) => {
      const cx = FX, cy = FY - 12
      // large body
      b.disc(cx, cy, 13, o.color.deepShadow || o.color.shadow)
      b.disc(cx - 2, cy - 2, 10, o.color.base)
      b.disc(cx - 4, cy - 4, 6, o.color.light)
      // fists
      b.rect(cx - 12, FY - 3, 6, 3, o.color.shadow)
      b.rect(cx + 6, FY - 3, 6, 3, o.color.shadow)
      // eyes with fire
      b.set(cx - 5, cy - 3, P.fire.highlight)
      b.set(cx + 4, cy - 3, P.fire.highlight)
      // horns
      b.rect(cx - 8, cy - 14, 4, 5, o.color.base)
      b.rect(cx + 4, cy - 14, 4, 5, o.color.base)
      b.set(cx - 8, cy - 14, P.fire.base)
      b.set(cx + 7, cy - 14, P.fire.base)
    }
  },
}

const DIRS = ['down', 'up', 'side']
const STATES = { idle: 2, walk: 4, attack: 3, hurt: 2, death: 4 }

export function generateMonsters(types = Object.keys(DESIGNS)) {
  const out = {}
  for (const type of types) {
    const design = DESIGNS[type]
    if (!design) continue
    for (const dir of DIRS) {
      for (const [state, frames] of Object.entries(STATES)) {
        for (let f = 0; f < frames; f++) {
          const buf = new PixelBuffer(MW, MH)
          const opts = { color: design.color }
          design.draw(buf, dir, opts)
          if (state === 'walk') {
            const dy = Math.round(Math.sin((f / frames) * Math.PI * 2) * 1)
            if (dy) { const c = buf.clone(); buf.clear(null); buf.blit(c, 0, dy) }
          }
          if (state === 'attack' && f === 1) {
            const c = buf.clone()
            buf.clear(null)
            buf.blit(c, dir === 'side' ? (Math.random() > .5 ? 3 : -3) : 0, 0)
          }
          if (state === 'hurt') buf.set(FX, FY - 10, P.clothRed.base)
          if (state === 'death') {
            const c = buf.clone()
            buf.clear(null)
            buf.blit(c, 0, 4 + f)
            for (let i = 0; i < 30; i++) buf.set((Math.random() * MW) | 0, (Math.random() * MH) | 0, null)
          }
          out[`mon.${type}.${state}.${dir}.${f}`] = { buf, w: MW, h: MH }
        }
      }
    }
  }
  return out
}
