// ============================================================
// Mythral Art - Atlas packer
// Packs many {key: PixelBuffer|{buf}} frames into atlas PNG(s)
// using a simple shelf/skyline packer. Emits manifest.json.
// ============================================================
import { PixelBuffer } from './pixelbuf.js'
import { encodePNG } from './png.js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '../../public/assets')

// Normalize input: map of key -> {buf, w, h, anchorY}
function normalize(frames) {
  const list = []
  for (const [key, val] of Object.entries(frames)) {
    if (val instanceof PixelBuffer) list.push({ key, buf: val, w: val.w, h: val.h })
    else list.push({ key, buf: val.buf, w: val.w || val.buf.w, h: val.h || val.buf.h })
  }
  return list
}

// Shelf packer with padding
export function packAtlas(frames, name, pad = 1, maxW = 1024) {
  const list = normalize(frames).sort((a, b) => b.h - a.h)
  const shelves = []
  let shelfY = pad, shelfH = 0, shelfX = pad
  const placed = []
  for (const f of list) {
    if (shelfX + f.w + pad > maxW) {
      shelfY += shelfH + pad
      shelfX = pad
      shelfH = 0
    }
    placed.push({ key: f.key, x: shelfX, y: shelfY, w: f.w, h: f.h })
    shelfX += f.w + pad
    shelfH = Math.max(shelfH, f.h)
  }
  const atlasW = maxW
  const atlasH = shelfY + shelfH + pad
  const atlas = new PixelBuffer(atlasW, atlasH)
  for (const p of placed) atlas.blit(frames[p.key] instanceof PixelBuffer ? frames[p.key] : frames[p.key].buf, p.x, p.y)
  return { png: atlas.toPNG(), placed, w: atlasW, h: atlasH }
}

export function buildAtlas(frames, filename, manifest) {
  mkdirSync(OUT_DIR, { recursive: true })
  const { png, placed, w, h } = packAtlas(frames, filename)
  writeFileSync(join(OUT_DIR, filename), png)
  for (const p of placed) {
    manifest.frames[p.key] = { atlas: filename, x: p.x, y: p.y, w: p.w, h: p.h }
  }
  manifest.meta = manifest.meta || {}
  manifest.meta[filename] = { w, h }
  return { w, h, count: placed.length }
}

// CLI entry: generate everything
async function main() {
  const { generateTiles } = await import('./gen-tiles.js')
  const { generateProps, generateBuildings } = await import('./gen-decor.js')
  const { generateCharacters, generateVillagers } = await import('./gen-characters.js')
  const { generateMonsters } = await import('./gen-monsters.js')
  const { generateUI } = await import('./gen-ui.js')
  const { generateFX } = await import('./gen-fx.js')

  const manifest = { meta: {}, frames: {}, version: 1 }

  // Tiles atlas (all biomes)
  const tiles = generateTiles([
    'grass', 'darkGrass', 'flowers', 'sand', 'path', 'water', 'deepWater',
    'woodFloor', 'stoneFloor', 'wall', 'door', 'bridge', 'ruins', 'mushroom',
    'forest', 'denseForest', 'mountain',
    // biome variants
    'snow', 'lava', 'swamp', 'desert', 'cloud', 'void',
  ])
  buildAtlas(tiles, 'tiles.png', manifest)

  // Props atlas
  const props = generateProps(['oak', 'pine', 'bush', 'rock', 'flowerPatch', 'sign', 'barrel', 'crate', 'lamp', 'statue', 'fountain', 'fence', 'well'])
  const buildings = generateBuildings(['bakery', 'forge', 'apothecary', 'dock', 'elderHut', 'fishShack', 'shop', 'inn', 'tower', 'hut', 'temple', 'outpost'])
  buildAtlas({ ...props, ...buildings }, 'props.png', manifest)

  // Characters atlas
  const chars = generateCharacters(['warrior', 'mage', 'ranger', 'healer'])
  buildAtlas(chars, 'chars.png', manifest)

  // Villagers atlas
  const villagers = generateVillagers()
  buildAtlas(villagers, 'villagers.png', manifest)

  // Monsters atlas (grassland family + boss)
  const mons = generateMonsters(['rat', 'wild_dog', 'goblin', 'spider', 'wolf', 'beetle', 'slime', 'boss_giant'])
  buildAtlas(mons, 'monsters.png', manifest)

  // UI atlas
  const ui = generateUI()
  buildAtlas(ui, 'ui.png', manifest)

  // FX atlas
  const fx = generateFX()
  buildAtlas(fx, 'fx.png', manifest)

  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 1))
  console.log('Generated atlases:')
  for (const [k, v] of Object.entries(manifest.meta)) console.log(`  ${k}: ${v.w}x${v.h} (${Object.keys(manifest.frames).length} frames total)`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(e); process.exit(1) })
}
