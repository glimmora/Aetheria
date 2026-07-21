// ============================================================
// Mythral Art - UI chrome + icon generator (CraftPix quality)
// 9-slice panels, pixel bars, buttons, cursors, item/skill icons.
// ============================================================
import { PixelBuffer, C } from './pixelbuf.js'
import { mulberry32, hash2 } from './prng.js'
import { PALETTE as P, TILE as TS } from './palette.js'

function panelBorder(w, h, theme = 'wood') {
  const buf = new PixelBuffer(w, h)
  const edge = theme === 'gold' ? P.gold : (theme === 'stone' ? P.stone : P.wood)
  const inner = theme === 'gold' ? P.gold.light : (theme === 'stone' ? P.stoneDark.shadow : P.woodDark.shadow)
  // outer frame
  buf.rectOutline(0, 0, w, h, edge.shadow)
  buf.rectOutline(1, 1, w - 2, h - 2, edge.base)
  buf.rectOutline(2, 2, w - 4, h - 4, edge.light)
  // inner dark fill
  buf.rect(3, 3, w - 6, h - 6, inner)
  // corner studs with highlight
  buf.disc(2, 2, 2, edge.light)
  buf.disc(w - 3, 2, 2, edge.light)
  buf.disc(2, h - 3, 2, edge.light)
  buf.disc(w - 3, h - 3, 2, edge.light)
  buf.set(2, 2, edge.highlight)
  buf.set(w - 3, 2, edge.highlight)
  return buf
}

function bar(w, h, kind) {
  const track = new PixelBuffer(w, h)
  track.rect(0, 0, w, h, P.stoneDark.shadow)
  track.rect(1, 1, w - 2, h - 2, '#0a0a0f')
  track.rect(1, 1, w - 2, 1, P.stoneDark.base)
  const fills = []
  const colMap = { hp: P.clothRed, mp: P.clothBlue, xp: P.gold }
  const col = colMap[kind] || P.clothGreen
  for (let s = 0; s <= 8; s++) {
    const fb = track.clone()
    const fw = Math.round((w - 4) * (s / 8))
    if (fw > 0) {
      fb.rect(2, 2, fw, h - 4, col.shadow)
      fb.rect(2, 2, fw, Math.max(1, (h - 4) / 2 | 0), col.light)
      fb.rect(2, 2, fw, h - 4, col.base)
      fb.rect(2, 2, fw, 1, col.highlight)
    }
    fills.push(fb)
  }
  return { track, fills }
}

function button(w, h, kind = 'normal') {
  const col = kind === 'primary' ? P.clothGreen : kind === 'danger' ? P.clothRed : P.clothBlue
  const buf = new PixelBuffer(w, h)
  buf.rect(1, 1, w - 2, h - 2, col.shadow)
  buf.rect(1, 1, w - 2, h - 3, col.base)
  buf.rect(2, 2, w - 4, 2, col.light)
  buf.rectOutline(0, 0, w, h, col.shadow)
  return buf
}

function swordIcon() {
  const b = new PixelBuffer(16, 16)
  b.rect(7, 2, 2, 9, P.metal.light)
  b.rect(6, 3, 1, 7, P.metal.base)
  b.rect(9, 3, 1, 7, P.metal.shadow)
  b.rect(5, 11, 6, 2, P.gold.base)
  b.rect(7, 13, 2, 3, P.woodDark.base)
  b.set(7, 3, P.white) // blade tip highlight
  return b
}

function shieldIcon() {
  const b = new PixelBuffer(16, 16)
  b.disc(8, 7, 6, P.armorSteel.shadow)
  b.rect(3, 5, 10, 5, P.armorSteel.base)
  b.rect(4, 4, 8, 3, P.armorSteel.light)
  b.rect(7, 5, 2, 7, P.armorGold.base)
  b.set(7, 4, P.armorGold.light)
  return b
}

function potionIcon() {
  const b = new PixelBuffer(16, 16)
  b.rect(6, 2, 4, 3, P.woodDark.base)
  b.disc(8, 10, 5, P.fire.shadow)
  b.disc(8, 10, 4, P.fire.base)
  b.disc(6, 9, 2, P.fire.highlight)
  b.set(7, 8, P.white) // glass highlight
  return b
}

function coinIcon() {
  const b = new PixelBuffer(16, 16)
  b.disc(8, 8, 6, P.gold.shadow)
  b.disc(8, 8, 5, P.gold.base)
  b.disc(8, 7, 3, P.gold.light)
  b.rect(6, 7, 4, 2, P.gold.highlight)
  b.set(8, 6, P.white) // shine
  return b
}

function skillIcon(kind) {
  const b = new PixelBuffer(16, 16)
  const c = { fire: P.fire, ice: P.iceFx, water: P.waterFx, holy: P.holyFx, shadow: P.shadowFx, air: P.airFx }[kind] || P.crystal
  b.disc(8, 8, 6, c.shadow)
  b.disc(8, 8, 5, c.base)
  b.disc(7, 6, 2, c.light)
  b.disc(8, 8, 6, 'rgba(255,255,255,0)')
  b.set(8, 4, c.highlight)
  b.set(12, 8, c.highlight)
  return b
}

function questIcon() {
  const b = new PixelBuffer(16, 16)
  b.rect(5, 2, 6, 2, P.gold.base)
  b.rect(4, 4, 8, 9, P.gold.shadow)
  b.rect(5, 5, 6, 7, P.gold.base)
  b.rect(6, 6, 2, 5, P.gold.light)
  b.rect(4, 12, 8, 2, P.gold.base)
  b.set(7, 6, P.white) // shine
  return b
}

function heartIcon() {
  const b = new PixelBuffer(16, 16)
  b.disc(6, 6, 4, P.clothRed.base)
  b.disc(10, 6, 4, P.clothRed.base)
  b.rect(4, 7, 8, 4, P.clothRed.base)
  b.rect(6, 9, 4, 4, P.clothRed.base)
  b.rect(5, 10, 2, 3, P.clothRed.shadow)
  b.set(5, 5, P.clothRed.highlight)
  return b
}

export function generateUI() {
  const out = {}
  out['ui.panel.wood'] = panelBorder(64, 64, 'wood')
  out['ui.panel.gold'] = panelBorder(64, 64, 'gold')
  out['ui.panel.stone'] = panelBorder(64, 64, 'stone')
  const hp = bar(96, 12, 'hp')
  out['ui.bar.hp.track'] = hp.track
  hp.fills.forEach((f, i) => out[`ui.bar.hp.${i}`] = f)
  const mp = bar(96, 12, 'mp')
  out['ui.bar.mp.track'] = mp.track
  mp.fills.forEach((f, i) => out[`ui.bar.mp.${i}`] = f)
  const xp = bar(120, 8, 'xp')
  out['ui.bar.xp.track'] = xp.track
  xp.fills.forEach((f, i) => out[`ui.bar.xp.${i}`] = f)
  out['ui.btn.normal'] = button(48, 24, 'normal')
  out['ui.btn.primary'] = button(48, 24, 'primary')
  out['ui.btn.danger'] = button(48, 24, 'danger')
  out['ui.icon.sword'] = swordIcon()
  out['ui.icon.shield'] = shieldIcon()
  out['ui.icon.potion'] = potionIcon()
  out['ui.icon.coin'] = coinIcon()
  out['ui.icon.quest'] = questIcon()
  out['ui.icon.heart'] = heartIcon()
  for (const k of ['fire', 'ice', 'water', 'holy', 'shadow', 'air', 'none']) out[`ui.icon.skill.${k}`] = skillIcon(k)
  return out
}
