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
  grass: ramp('#5a9e3f', '#3f7a2b', '#6fb84e', '#8fd66a'),
  grassDark: ramp('#3c7a2c', '#28531c', '#4c9440', '#6cbf52'),
  grassBlade: '#4a8e35',
  grassBladeDark: '#2d6a1e',
  grassBladeLight: '#7cc058',
  flower: {
    pink: '#f06ea9', red: '#e24b4b', yellow: '#f6c945', blue: '#5aa9e6',
    purple: '#a974e6', white: '#f3f0e7', orange: '#f0964a', darkRed: '#b83a3a',
  },
  sand: ramp('#e8d29a', '#c9ad6f', '#f2e0b0', '#fff2cf'),
  water: ramp('#2f6fb0', '#1d4d82', '#3f8fd0', '#7fc4ef'),
  waterDeep: ramp('#1d3f7a', '#102a55', '#274f99', '#3f7ec0'),
  waterFoam: '#b8daf0',
  dirt: ramp('#7a5230', '#5a3a20', '#946b3f', '#b08a55'),
  path: ramp('#b8a079', '#8f7350', '#cdaf86', '#e7d2ad'),
  mud: ramp('#6b4423', '#4a2e16', '#8a5a30', '#a9743f'),

  // ---- Stone / architecture ----
  stone: ramp('#8d8a86', '#5f5c59', '#a7a39e', '#cbc7c1'),
  stoneDark: ramp('#5a5652', '#3a3733', '#736e69', '#8f8a84'),
  stoneBrick: ramp('#7a7570', '#504c48', '#948e88', '#aca6a0'),
  wood: ramp('#7a4a26', '#543014', '#946033', '#b87c45'),
  woodDark: ramp('#543014', '#361e0c', '#6e4220', '#8a552c'),
  woodPlank: ramp('#8a5a30', '#5e3c1c', '#a47040', '#c08850'),
  roof: ramp('#9c3b2e', '#6e241b', '#bb4d3d', '#d96b57'),
  roofShingle: '#8a3428',
  roofShingleLight: '#b84e3c',
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
