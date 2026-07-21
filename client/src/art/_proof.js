// Quick visual proof sheet for manual inspection (not part of runtime)
import { PixelBuffer } from './pixelbuf.js'
import { generateTiles } from './gen-tiles.js'
import { generateProps } from './gen-decor.js'
import { generateCharacters } from './gen-characters.js'
import { generateMonsters } from './gen-monsters.js'
import { generateUI } from './gen-ui.js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../../public/assets/_proof.png')

const W = 1024, H = 512
const sheet = new PixelBuffer(W, H)
sheet.clear('#202028')
let cx = 4, cy = 4

function place(buf, label) {
  if (cx + buf.w > W - 4) { cx = 4; cy += 36 }
  sheet.blit(buf, cx, cy)
  cx += buf.w + 4
}

// tiles row
const tiles = generateTiles(['grass', 'darkGrass', 'flowers', 'sand', 'path', 'water', 'deepWater', 'woodFloor', 'stoneFloor', 'wall', 'door', 'bridge', 'ruins', 'mushroom', 'forest', 'denseForest', 'mountain'])
for (const k of Object.keys(tiles)) place(tiles[k])
cy += 40; cx = 4
const props = generateProps(['oak', 'pine', 'bush', 'rock', 'flowerPatch', 'sign', 'barrel', 'crate', 'lamp', 'statue', 'fountain', 'fence', 'well'])
for (const k of Object.keys(props)) place(props[k].buf)
cy += 70; cx = 4
const chars = generateCharacters(['warrior', 'mage', 'ranger', 'healer'])
// show a few key frames
for (const cls of ['warrior','mage','ranger','healer']) {
  place(chars[`char.${cls}.idle.down.0`].buf)
  place(chars[`char.${cls}.walk.down.1`].buf)
  place(chars[`char.${cls}.walk.down.3`].buf)
  place(chars[`char.${cls}.attack.down.1`].buf)
  place(chars[`char.${cls}.cast.down.1`].buf)
}
cx = 4; cy += 48
const mons = generateMonsters(['rat', 'wild_dog', 'goblin', 'spider', 'wolf', 'beetle', 'slime', 'boss_giant'])
for (const k of Object.keys(mons)) if (k.includes('idle.down')) place(mons[k].buf)
cx = 4; cy += 40
const ui = generateUI()
for (const k of Object.keys(ui)) place(ui[k])

writeFileSync(OUT, sheet.toPNG())
console.log('wrote', OUT)
