// ============================================================
// Mythral Art - FX / particle sprite generator (CraftPix quality)
// Enhanced particles, shadows, sparkles, glows, ripples.
// ============================================================
import { PixelBuffer, C } from './pixelbuf.js'
import { PALETTE as P } from './palette.js'

function discGlow(r, color) {
  const b = new PixelBuffer(r * 2 + 1, r * 2 + 1)
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    const dx = x - r, dy = y - r, d = Math.sqrt(dx * dx + dy * dy)
    if (d <= r) {
      const a = 1 - d / r
      b.set(x, y, `rgba(${hexRGB(color)},${a.toFixed(3)})`)
    }
  }
  return b
}
function hexRGB(hex) {
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`
}

function makeLeaf() {
  const b = new PixelBuffer(8, 8)
  b.set(3, 1, P.grass.light); b.set(4, 1, P.grass.base)
  b.set(2, 2, P.grass.light); b.set(3, 2, P.grass.base); b.set(4, 2, P.grass.base); b.set(5, 2, P.grass.shadow)
  b.set(2, 3, P.grass.base); b.set(3, 3, P.grass.base); b.set(4, 3, P.grass.shadow)
  b.set(3, 4, P.grass.shadow); b.set(4, 4, P.grass.shadow)
  b.set(3, 5, P.grassDark.base)
  return b
}

function makeEmber() {
  const b = new PixelBuffer(6, 6)
  b.disc(3, 3, 2, P.fire.base)
  b.disc(3, 3, 1, P.fire.highlight)
  b.set(3, 2, P.white) // bright center
  return b
}

function makeSpark() {
  const b = new PixelBuffer(5, 5)
  b.set(2, 0, P.holyFx.light); b.set(2, 4, P.holyFx.light)
  b.set(0, 2, P.holyFx.light); b.set(4, 2, P.holyFx.light)
  b.set(2, 2, P.white)
  b.set(1, 1, P.holyFx.light); b.set(3, 1, P.holyFx.light)
  b.set(1, 3, P.holyFx.light); b.set(3, 3, P.holyFx.light)
  return b
}

function makeSnow() {
  const b = new PixelBuffer(4, 4)
  b.disc(2, 2, 1, P.white)
  b.set(2, 1, P.ice.light)
  b.set(1, 2, P.ice.light)
  return b
}

function makeDrop() {
  const b = new PixelBuffer(3, 6)
  b.rect(1, 0, 1, 4, P.waterFx.light)
  b.rect(0, 1, 1, 3, P.waterFx.base)
  b.rect(2, 1, 1, 3, P.waterFx.base)
  b.set(1, 5, P.waterFx.highlight)
  b.set(1, 1, P.white) // highlight
  return b
}

function makeDust() {
  const b = new PixelBuffer(4, 4)
  b.disc(2, 2, 1, 'rgba(200,190,170,0.6)')
  return b
}

function makeShadow() {
  const b = new PixelBuffer(24, 10)
  b.disc(12, 5, 9, 'rgba(0,0,0,0.30)')
  b.disc(12, 5, 5, 'rgba(0,0,0,0.22)')
  return b
}

function makeSmoke() {
  const b = new PixelBuffer(10, 10)
  b.disc(5, 5, 4, 'rgba(180,180,180,0.4)')
  b.disc(5, 5, 2, 'rgba(220,220,220,0.4)')
  b.set(5, 4, 'rgba(240,240,240,0.5)')
  return b
}

function makeSparkle() {
  const b = new PixelBuffer(7, 7)
  b.set(3, 0, P.white); b.set(0, 3, P.white); b.set(6, 3, P.white); b.set(3, 6, P.white)
  b.set(3, 3, P.holyFx.light)
  b.set(2, 2, P.holyFx.light); b.set(4, 4, P.holyFx.light)
  b.set(4, 2, P.holyFx.light); b.set(2, 4, P.holyFx.light)
  return b
}

function makeRing(color) {
  const b = new PixelBuffer(16, 16)
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const dx = x - 8, dy = y - 8, d = Math.sqrt(dx * dx + dy * dy)
    if (d > 6 && d < 8) b.set(x, y, `rgba(${hexRGB(color)},0.8)`)
  }
  return b
}

function makeButterfly() {
  const b = new PixelBuffer(8, 6)
  b.set(3, 2, P.clothPurple.base); b.set(4, 2, P.clothPurple.base)
  b.set(2, 1, P.clothPurple.light); b.set(5, 1, P.clothPurple.light)
  b.set(1, 2, P.clothPurple.base); b.set(6, 2, P.clothPurple.base)
  b.set(2, 3, P.clothPurple.shadow); b.set(5, 3, P.clothPurple.shadow)
  b.set(3, 3, P.clothPurple.base); b.set(4, 3, P.clothPurple.base)
  b.set(3, 1, P.white); b.set(4, 1, P.white) // wing tips
  return b
}

function makePetals() {
  const b = new PixelBuffer(6, 6)
  b.set(2, 1, P.flower.pink); b.set(4, 2, P.flower.pink)
  b.set(1, 3, P.flower.pink); b.set(3, 4, P.flower.pink)
  b.set(2, 2, P.flower.white); b.set(4, 3, P.flower.white)
  return b
}

export function generateFX() {
  const out = {}
  out['fx.glow.fire'] = discGlow(16, P.fire.highlight)
  out['fx.glow.holy'] = discGlow(16, P.holyFx.light)
  out['fx.glow.magic'] = discGlow(16, P.crystal.light)
  out['fx.glow.water'] = discGlow(16, P.waterFx.light)
  out['fx.leaf'] = makeLeaf()
  out['fx.ember'] = makeEmber()
  out['fx.spark'] = makeSpark()
  out['fx.snow'] = makeSnow()
  out['fx.drop'] = makeDrop()
  out['fx.dust'] = makeDust()
  out['fx.shadow'] = makeShadow()
  out['fx.smoke'] = makeSmoke()
  out['fx.sparkle'] = makeSparkle()
  out['fx.butterfly'] = makeButterfly()
  out['fx.petal'] = makePetals()
  out['fx.ring.fire'] = makeRing(P.fire.highlight)
  out['fx.ring.holy'] = makeRing(P.holyFx.light)
  out['fx.ring.magic'] = makeRing(P.crystal.light)
  return out
}
