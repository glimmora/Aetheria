// ============================================================
// Mythral Art - Character generator (CraftPix quality)
// 4 classes with male/female, layered equipment, animated, 4 dirs.
// Canvas: 32 wide x 40 tall. Feet at (16, 38).
// ============================================================
import { PixelBuffer, C } from './pixelbuf.js'
import { mulberry32, hash2 } from './prng.js'
import { PALETTE as P, TILE as TS } from './palette.js'

const CW = 32, CH = 40, FEET_X = 16, FEET_Y = 38
const BLACK = P.black

const G = {
  male: { sw: 5, armSide: 6, armFront: 7, hip: 4, legIn: 4, legOut: 1, bootW: 4 },
  female: { sw: 4, armSide: 5, armFront: 6, hip: 3, legIn: 3, legOut: 2, bootW: 3 },
}

function drawBody(buf, dir, phase, o) {
  const cx = FEET_X
  const bob = Math.round(Math.sin(phase) * 1)
  const swing = Math.round(Math.sin(phase) * 2)
  const stepL = swing > 0
  const stepR = !stepL
  const g = o.gender === 'female' ? G.female : G.male

  buf.disc(cx, FEET_Y - 1, 6, P.shadow)
  buf.disc(cx, FEET_Y - 1, 4, P.shadow)

  const legY = FEET_Y - 9
  if (dir === 'down' || dir === 'side') {
    buf.rect(cx - g.legIn, legY, 3, 8 + (stepL ? 1 : 0), o.legs.base)
    buf.rect(cx + g.legOut, legY, 3, 8 + (stepR ? 0 : 1), o.legs.shadow)
    buf.rect(cx - g.legIn, FEET_Y - 2, g.bootW, 2, o.boots.base)
    buf.rect(cx + g.legOut, FEET_Y - 2, g.bootW, 2, o.boots.shadow)
    buf.rect(cx - g.legIn, FEET_Y - 3, g.bootW, 1, o.boots.light)
    buf.rect(cx + g.legOut, FEET_Y - 3, g.bootW, 1, o.boots.light)
    buf.set(cx - 2, FEET_Y - 2, P.gold.base)
    buf.set(cx + 3, FEET_Y - 2, P.gold.base)
  } else {
    buf.rect(cx - g.hip, legY, g.hip * 2, 8, o.legs.base)
    buf.rect(cx - g.hip, FEET_Y - 2, g.hip * 2 + 1, 2, o.boots.base)
    buf.rect(cx - g.hip, FEET_Y - 3, g.hip * 2 + 1, 1, o.boots.light)
  }

  const torsoY = legY - 13 + bob
  if (dir === 'up') {
    buf.rect(cx - g.sw, torsoY, g.sw * 2, 14, o.tunic.shadow)
    buf.rect(cx - g.sw, torsoY, g.sw * 2, 2, o.tunic.base)
    buf.rect(cx - g.sw, torsoY + 2, g.sw * 2, 1, o.tunic.light)
  } else if (dir === 'side') {
    buf.rect(cx - g.sw, torsoY, g.sw * 2, 14, o.tunic.base)
    buf.rect(cx - g.sw, torsoY, g.sw - 2, 14, o.tunic.shadow)
    buf.rect(cx + 1, torsoY, 2, 14, o.tunic.light)
    buf.rect(cx - g.armSide, torsoY + 2, 3, 10, o.skin)
    buf.rect(cx + g.armSide - 2, torsoY + 2, 3, 10, o.skin)
    buf.rect(cx + g.armSide - 2, torsoY + 2, 3, 2, o.skinLight)
  } else {
    buf.rect(cx - g.sw, torsoY, g.sw * 2, 14, o.tunic.base)
    buf.rect(cx - g.sw, torsoY, g.sw - 2, 14, o.tunic.shadow)
    buf.rect(cx + 1, torsoY, 2, 14, o.tunic.light)
    buf.rect(cx - g.sw, torsoY, g.sw * 2, 2, o.tunic.light)
    buf.rect(cx - g.armFront, torsoY + 2, 3, 10, o.skin)
    buf.rect(cx + g.armFront - 2, torsoY + 2, 3, 10, o.skin)
    buf.rect(cx - g.armFront, torsoY + 10, 3, 2, o.skinLight)
    buf.rect(cx + g.armFront - 2, torsoY + 10, 3, 2, o.skinLight)
  }

  const headY = torsoY - 10
  if (dir === 'up') {
    buf.disc(cx, headY + 4, 6, o.hairBack || o.hair)
    buf.disc(cx, headY + 5, 5, o.skinDark || o.skin)
    buf.rect(cx - 4, headY + 9, 8, 2, o.tunic.shadow)
    if (o.gender === 'female') {
      buf.rect(cx - 3, headY + 10, 6, 3, o.hair)
    }
  } else {
    buf.disc(cx, headY + 4, 6, o.skin)
    buf.disc(cx - 2, headY + 3, 3, o.skinLight)
    buf.disc(cx + 2, headY + 5, 2, o.skinDark)
    buf.rect(cx - 6, headY - 2, 12, 6, o.hair)
    buf.rect(cx - 6, headY + 3, 4, 4, o.hair)
    if (dir === 'side') buf.rect(cx + 2, headY + 3, 4, 4, o.hair)
    buf.rect(cx - 5, headY - 2, 10, 2, o.hairBack || o.hair)
    if (o.gender === 'female') {
      if (dir === 'side') {
        buf.rect(cx + 2, headY + 7, 3, 5, o.hair)
        buf.rect(cx - 5, headY + 7, 3, 4, o.hair)
      } else {
        buf.rect(cx - 4, headY + 7, 8, 5, o.hair)
        buf.rect(cx - 5, headY + 6, 2, 5, o.hair)
        buf.rect(cx + 3, headY + 6, 2, 5, o.hair)
      }
    }
    if (dir === 'down') {
      buf.set(cx - 2, headY + 4, BLACK)
      buf.set(cx + 2, headY + 4, BLACK)
      buf.set(cx - 3, headY + 6, o.skinDark)
    } else if (dir === 'side') {
      buf.set(cx + 1, headY + 4, BLACK)
      buf.set(cx + 3, headY + 5, o.skinDark)
    }
  }

  if (o.classDef === 'warrior' && dir !== 'up') {
    if (dir === 'side') {
      buf.rect(cx - 8, torsoY - 8, 2, 16, P.metal.light)
      buf.rect(cx - 9, torsoY - 9, 3, 3, P.armorGold.base)
    } else {
      buf.rect(cx - 9, torsoY - 6, 2, 14, P.metal.light)
      buf.rect(cx - 10, torsoY + 6, 4, 2, P.leather.base)
      buf.rect(cx - 10, torsoY + 5, 4, 1, P.armorGold.base)
    }
    if (dir !== 'up') {
      buf.disc(cx + 7, torsoY + 4, 4, o.shield || P.armorSteel.base)
      buf.disc(cx + 7, torsoY + 4, 2, o.shieldLight || P.armorSteel.light)
      buf.rect(cx + 7, torsoY, 1, 8, o.shield || P.armorSteel.shadow)
    }
  }
  if (o.classDef === 'mage' && dir !== 'up') {
    buf.rect(cx - 6, torsoY + 12, 12, 3, o.tunic.shadow)
    buf.rect(cx + 6, torsoY - 12, 2, 26, P.woodDark.base)
    buf.rect(cx + 6, torsoY - 12, 1, 26, P.woodDark.shadow)
    buf.disc(cx + 7, torsoY - 13, 3, o.staffGem || P.crystal.base)
    buf.disc(cx + 7, torsoY - 13, 1, P.crystal.light)
    buf.rect(cx - 4, headY - 4, 8, 2, o.hair)
    buf.rect(cx - 2, headY - 7, 4, 3, o.hair)
    buf.rect(cx - 1, headY - 9, 2, 2, o.hairBack || o.hair)
  }
  if (o.classDef === 'ranger' && dir !== 'up') {
    buf.rect(cx - 5, headY - 3, 10, 3, o.tunic.base)
    buf.rect(cx - 5, headY + 1, 3, 3, o.tunic.shadow)
    if (dir === 'side') buf.rect(cx + 2, headY + 1, 3, 3, o.tunic.shadow)
    buf.rect(cx + 7, torsoY - 6, 2, 18, P.wood.base)
    buf.rect(cx + 6, torsoY - 4, 1, 14, P.leather.base)
    if (dir === 'down') buf.rect(cx - 8, torsoY - 4, 3, 8, P.leather.shadow)
  }
  if (o.classDef === 'healer' && dir !== 'up') {
    buf.rect(cx - 6, torsoY + 12, 12, 3, o.tunic.shadow)
    buf.rect(cx + 6, torsoY - 10, 2, 22, P.woodDark.base)
    buf.rect(cx + 4, torsoY - 12, 6, 2, o.staffGem || P.holyFx.light)
    buf.rect(cx + 6, torsoY - 14, 2, 5, o.staffGem || P.holyFx.light)
    buf.rect(cx + 5, torsoY - 13, 4, 1, P.holyFx.highlight)
    buf.rect(cx - 4, headY - 3, 8, 2, o.tunic.light)
  }
}

function classOpts(cls, gender) {
  const isF = gender === 'female'
  switch (cls) {
    case 'warrior': return {
      classDef: 'warrior', gender,
      skin: P.skin.base, skinLight: P.skin.light, skinDark: P.skinDark.base,
      hair: isF ? P.hairRed.base : P.hairBrown.base,
      hairBack: isF ? P.hairRed.shadow : P.hairBrown.shadow,
      tunic: P.clothRed, legs: P.clothBrown, boots: P.leather,
      shield: P.armorSteel.base, shieldLight: P.armorSteel.light,
    }
    case 'mage': return {
      classDef: 'mage', gender,
      skin: P.skin.base, skinLight: P.skin.light, skinDark: P.skinDark.base,
      hair: isF ? P.hairBlonde.light : P.hairBlonde.base,
      hairBack: P.hairBlonde.shadow,
      tunic: P.clothPurple, legs: P.clothBlue, boots: P.leather,
      staffGem: P.crystal.base,
    }
    case 'ranger': return {
      classDef: 'ranger', gender,
      skin: P.skin.base, skinLight: P.skin.light, skinDark: P.skinDark.base,
      hair: isF ? P.hairBrown.light : P.hairBrown.base,
      hairBack: P.hairBrown.shadow,
      tunic: P.clothGreen, legs: P.clothBrown, boots: P.leather,
    }
    case 'healer': return {
      classDef: 'healer', gender,
      skin: P.skin.base, skinLight: P.skin.light, skinDark: P.skinDark.base,
      hair: P.hairBlack.base, hairBack: P.hairBlack.shadow,
      tunic: P.clothWhite, legs: P.clothBrown, boots: P.leather,
      staffGem: P.holyFx.light,
    }
  }
  return classOpts('warrior', gender)
}

const DIRS = ['down', 'up', 'side']
const STATES = {
  idle: { frames: 2, fn: (p) => Math.sin(p) * 0.4 },
  walk: { frames: 4, fn: (p) => p * 2 },
  attack: { frames: 3, fn: (p) => p * 3 },
  cast: { frames: 3, fn: (p) => p * 2 },
  hurt: { frames: 2, fn: (p) => 0 },
  death: { frames: 4, fn: (p) => 0 },
}

export function generateCharacters(classes = ['warrior', 'mage', 'ranger', 'healer'], genders = ['male', 'female']) {
  const out = {}
  for (const cls of classes) {
    for (const gender of genders) {
      const opts = classOpts(cls, gender)
      for (const dir of DIRS) {
        for (const [state, def] of Object.entries(STATES)) {
          for (let f = 0; f < def.frames; f++) {
            const buf = new PixelBuffer(CW, CH)
            const phase = def.fn((f / def.frames) * Math.PI * 2)
            drawBody(buf, dir, phase, opts)
            if (state === 'hurt') {
              buf.set(FEET_X, 16, P.clothRed.base)
              buf.set(FEET_X - 1, 18, P.clothRed.base)
              buf.set(FEET_X + 1, 17, P.clothRed.base)
            }
            if (state === 'death') {
              const collapsed = buf.clone()
              buf.clear(null)
              buf.blit(collapsed, 0, 8 + f * 2)
            }
            out[`char.${cls}.${gender}.${state}.${dir}.${f}`] = { buf, w: CW, h: CH }
          }
        }
      }
    }
  }
  return out
}

const ROLE_COLORS = {
  sailor: P.clothBlue, guard: P.clothRed, merchant: P.gold, healer: P.clothWhite,
  elder: P.clothBrown, smith: P.stoneDark, mage: P.clothPurple, farmer: P.clothGreen,
  innkeeper: P.clothRed, default: P.clothTeal,
}

export function generateVillagers(roles = Object.keys(ROLE_COLORS)) {
  const out = {}
  for (const role of roles) {
    const c = ROLE_COLORS[role] || ROLE_COLORS.default
    const opts = {
      classDef: 'villager', skin: P.skin.base, skinLight: P.skin.light, skinDark: P.skinDark.base,
      hair: P.hairBlack.base, hairBack: P.hairBlack.shadow,
      tunic: c, legs: P.clothBrown, boots: P.leather,
    }
    for (const dir of DIRS) {
      for (let f = 0; f < 2; f++) {
        const buf = new PixelBuffer(CW, CH)
        drawBody(buf, dir, Math.sin((f / 2) * Math.PI * 2) * 0.5, opts)
        out[`npc.${role}.idle.${dir}.${f}`] = { buf, w: CW, h: CH }
      }
    }
  }
  return out
}
