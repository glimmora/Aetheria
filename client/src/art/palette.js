// ============================================================
// Mythral Art - Master Palette (CraftPix-quality ramps)
// Single source of truth for all generated pixel art.
// 6-stop ramps: deepShadow -> shadow -> base -> mid -> light -> highlight
// Light source: top-left. Each material has a cohesive ramp.
// ============================================================

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}
function mix(c1, c2, t) {
  const a = hexToRgb(c1), b = hexToRgb(c2)
  return rgbToHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)
}

function ramp(base, shadow, light, highlight) {
  const deepShadow = mix(shadow, '#000000', 0.25)
  const mid = mix(base, light, 0.5)
  return { deepShadow, shadow, base, mid, light, highlight }
}

export const PALETTE = {
  // ---- Grassland / generic nature ----
  grass: ramp('#74b93d', '#3b7d28', '#8ed04a', '#c2ee72'),
  grassDark: ramp('#4f9d31', '#245a20', '#62b83d', '#9bdb58'),
  grassBlade: '#4a8e35',
  grassBladeDark: '#2d6a1e',
  grassBladeLight: '#7cc058',
  flower: {
    pink: '#f06ea9', red: '#e24b4b', yellow: '#f6c945', blue: '#5aa9e6',
    purple: '#a974e6', white: '#f3f0e7', orange: '#f0964a', darkRed: '#b83a3a',
  },
  sand: ramp('#d89a3f', '#9c5b26', '#efbd58', '#ffe08a'),
  water: ramp('#237bb1', '#10456c', '#35a9d5', '#9ce6ee'),
  waterDeep: ramp('#175487', '#0b2d52', '#1b79a9', '#56bfd6'),
  waterFoam: '#c8f4e8',
  dirt: ramp('#7a3f26', '#3b211b', '#a55b32', '#d58a43'),
  path: ramp('#b77947', '#633624', '#d49355', '#f0c477'),
  mud: ramp('#6b4423', '#4a2e16', '#8a5a30', '#a9743f'),

  // ---- Stone / architecture ----
  stone: ramp('#909ba0', '#4c5960', '#b2bcc0', '#e2e7df'),
  stoneDark: ramp('#59656a', '#273238', '#727f83', '#aeb9b4'),
  stoneBrick: ramp('#7e8789', '#424b4e', '#aab1ad', '#d0d5c9'),
  wood: ramp('#9b542c', '#4d241b', '#c47035', '#ed9c4d'),
  woodDark: ramp('#65301e', '#2c1514', '#823f25', '#b76832'),
  woodPlank: ramp('#8a5a30', '#5e3c1c', '#a47040', '#c08850'),
  roof: ramp('#b74136', '#641f25', '#d95b43', '#ff9270'),
  roofShingle: '#8e2d2c',
  roofShingleLight: '#e1684d',
  roofBlue: ramp('#37618f', '#24415f', '#4a7cb0', '#6fa0d0'),
  gold: ramp('#c79a3a', '#8f6a1e', '#e7bb52', '#ffe79a'),
  metal: ramp('#9aa3ad', '#666e78', '#bcc4cd', '#e4e9ef'),
  metalDark: ramp('#6a727c', '#484e56', '#828a92', '#a0a8b0'),

  // ---- Snow / ice ----
  snow: ramp('#eef3fb', '#c7d4e8', '#ffffff', '#ffffff'),
  ice: ramp('#bfe3f5', '#8cc4e0', '#d8f2ff', '#ffffff'),

  // ---- Desert ----
  desert: ramp('#e6c065', '#c79a3c', '#f4d585', '#ffeba8'),
  desertRock: ramp('#a9763e', '#7a5228', '#c79055', '#e0ad72'),

  // ---- Volcanic ----
  volcanic: ramp('#3a2218', '#1f100a', '#52301f', '#6e4228'),
  lava: ramp('#ff5a1f', '#c21807', '#ff8a3d', '#ffd24a'),
  magma: '#ff3a0a',

  // ---- Swamp ----
  swamp: ramp('#4a5a2a', '#32401c', '#5e7238', '#7c9148'),
  swampWater: ramp('#3a4a2a', '#26331c', '#4a5e34', '#65803f'),
  swampMoss: '#4a6a2a',

  // ---- Void / crystal / cloud ----
  void: ramp('#2a2350', '#160f33', '#3a3168', '#574b94'),
  crystal: ramp('#9a6de0', '#5e3aa0', '#c39bf0', '#e9d4ff'),
  cloud: ramp('#e8edf7', '#c3ccde', '#ffffff', '#ffffff'),

  // ---- Skin tones ----
  skin: ramp('#e8b890', '#c08a63', '#f4cfa6', '#ffe0c0'),
  skinDark: ramp('#b07a4f', '#7d512e', '#cc9566', '#e6b385'),

  // ---- Hair ----
  hairBrown: ramp('#6b4423', '#43280f', '#8a5a30', '#a9743f'),
  hairBlonde: ramp('#c9a13a', '#8f6f1e', '#e7c45c', '#ffe79a'),
  hairBlack: ramp('#2a2230', '#140f18', '#3c3343', '#52475a'),
  hairRed: ramp('#a8431f', '#6e2510', '#c8552a', '#e8784a'),

  // ---- Cloth / class colors ----
  clothRed: ramp('#c0392b', '#7d1d14', '#e0563f', '#f58a73'),
  clothPurple: ramp('#7c3aed', '#4a1d96', '#9a5cf0', '#c39bf5'),
  clothGreen: ramp('#2e8b3d', '#16561f', '#3fb052', '#67c97c'),
  clothBlue: ramp('#2f6fb0', '#1a3f6b', '#3f8fd0', '#6fb0e6'),
  clothBrown: ramp('#8a5a30', '#543014', '#a9743f', '#c79055'),
  clothWhite: ramp('#d8d2c4', '#a39c8c', '#efe9dc', '#ffffff'),
  clothTeal: ramp('#1f8a86', '#0f4f4d', '#2fb0a8', '#5fd6cd'),
  clothOrange: ramp('#d47a2a', '#9a5518', '#e89444', '#ffb870'),

  // ---- Leather / armor ----
  leather: ramp('#6e4524', '#43280f', '#8a5a30', '#a9743f'),
  leatherLight: ramp('#8a5a30', '#6e4524', '#a9743f', '#c48a50'),
  armorSteel: ramp('#9aa3ad', '#5f666e', '#bcc4cd', '#e4e9ef'),
  armorGold: ramp('#c79a3a', '#8f6a1e', '#e7bb52', '#ffe79a'),
  armorChain: ramp('#8a929a', '#606870', '#a0a8b0', '#c0c8d0'),

  // ---- FX / elements ----
  fire: ramp('#ff5a1f', '#c21807', '#ff8a3d', '#ffe14a'),
  iceFx: ramp('#5aa9e6', '#2f6fb0', '#8fd0f5', '#d8f2ff'),
  waterFx: ramp('#2f6fb0', '#1d4d82', '#5aa9e6', '#aee0ff'),
  holyFx: ramp('#f6e27a', '#d4ab2e', '#fff2b0', '#fffae0'),
  shadowFx: ramp('#6a3aa0', '#3a1d66', '#9a5cf0', '#c8a0ff'),
  airFx: ramp('#bfe3f5', '#8cc4e0', '#e8f6ff', '#ffffff'),
  poisonFx: ramp('#6fbf3f', '#3c7a1f', '#9be05a', '#c8f58a'),
  blood: '#c0392b',
  shadow: 'rgba(0,0,0,0.28)',
  shadowDark: 'rgba(0,0,0,0.45)',
  white: '#ffffff',
  black: '#1a1620',
}

// Element -> palette ramp key
export const ELEMENT_COLORS = {
  fire: PALETTE.fire,
  ice: PALETTE.iceFx,
  water: PALETTE.waterFx,
  holy: PALETTE.holyFx,
  shadow: PALETTE.shadowFx,
  air: PALETTE.airFx,
  none: PALETTE.metal,
}

// Per-biome master tints used for ambient/day-night base in lighting
export const BIOME_TINT = {
  lumina: '#bfe9a0',
  emberfall: '#e08a5a',
  frostpeak: '#cfe8ff',
  mistwood: '#9fd6a0',
  sunscar: '#ffe0a0',
  tidehaven: '#aee0ff',
  shadowfen: '#9fb870',
  skyreach: '#e8edf7',
  voidheart: '#b39ae6',
}

// 32px design grid base unit (tiles are 32x32 at native res)
export const TILE = 32

export const C = { hexToRgb, rgbToHex, mix }

export const MODERN_ISO = {
  land: ramp('#397c3b', '#22532b', '#5aa84e', '#9bd45b'),
  landEdge: ramp('#704528', '#432918', '#986036', '#c98245'),
  water: ramp('#1f7180', '#12465e', '#2f9aae', '#72d4c0'),
  path: ramp('#b48754', '#70452e', '#d0a56c', '#f0ce91'),
  foliage: ramp('#2d6e39', '#174a2c', '#4f9d45', '#9dca59'),
  rock: ramp('#59676a', '#303f45', '#849395', '#b8c5b7'),
  roof: ramp('#874034', '#4b2625', '#bd5a3e', '#e48c55'),
}
