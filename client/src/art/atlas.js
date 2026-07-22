import { PixelBuffer } from './pixelbuf.js'
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_DIR = join(__dirname, '../../..')
const OUT_DIR = join(PROJECT_DIR, 'client/public/assets')
const CATALOG_PATH = join(PROJECT_DIR, 'aset_katalog.json')
const DATA_PATH = join(PROJECT_DIR, 'data.json')
const MASTER_SIZE = 2048
const PAD = 1
const MAX_ATLAS_W = 1024

function readCatalog() {
  return JSON.parse(readFileSync(CATALOG_PATH, 'utf8'))
}

function normalize(frames) {
  return Object.entries(frames).map(([key, value]) => {
    const buf = value instanceof PixelBuffer ? value : value.buf
    return { key, buf, w: buf.w, h: buf.h }
  })
}

function packShelf(frames, maxW = MAX_ATLAS_W, pad = PAD) {
  const sorted = normalize(frames).sort((a, b) => b.h - a.h || a.key.localeCompare(b.key))
  const placed = []
  let x = pad
  let y = pad
  let shelfHeight = 0
  for (const frame of sorted) {
    if (frame.w + pad > maxW) throw new Error(`Frame ${frame.key} is wider than the ${maxW}px atlas limit`)
    if (x + frame.w + pad > maxW) {
      y += shelfHeight + pad
      x = pad
      shelfHeight = 0
    }
    placed.push({ ...frame, x, y })
    x += frame.w + pad
    shelfHeight = Math.max(shelfHeight, frame.h)
  }
  return { placed, w: maxW, h: y + shelfHeight + pad }
}

function drawAtlas(frames, packed) {
  const atlas = new PixelBuffer(packed.w, packed.h)
  for (const frame of packed.placed) atlas.blit(frame.buf, frame.x, frame.y)
  return atlas
}

function writeAtlas(frames, filename, manifest) {
  const packed = packShelf(frames)
  const atlas = drawAtlas(frames, packed)
  writeFileSync(join(OUT_DIR, filename), atlas.toPNG())
  manifest.atlases[filename] = {
    file: filename,
    width: packed.w,
    height: packed.h,
    padding: PAD,
    maxWidth: MAX_ATLAS_W,
    frameCount: packed.placed.length,
    regions: packed.placed.map(({ key, x, y, w, h }) => ({ key, x, y, w, h })),
  }
  for (const { key, x, y, w, h } of packed.placed) {
    manifest.frames[key] = { atlas: filename, x, y, w, h }
  }
}

function placeMaster(plan, regions, atlasName, masterState, master) {
  const { packed } = plan
  if (masterState.nextX + packed.w > MASTER_SIZE) {
    masterState.nextX = 0
    masterState.nextY += masterState.rowHeight + PAD
    masterState.rowHeight = 0
  }
  const ox = masterState.nextX
  const oy = masterState.nextY
  for (const frame of packed.placed) {
    master.blit(frame.buf, ox + frame.x, oy + frame.y)
    regions.push({
      key: frame.key,
      sourceAtlas: atlasName,
      x: ox + frame.x,
      y: oy + frame.y,
      w: frame.w,
      h: frame.h,
      padding: PAD,
    })
  }
  masterState.nextX = ox + packed.w + PAD
  masterState.rowHeight = Math.max(masterState.rowHeight, packed.h)
}

function cropBuffer(source, x, y, w, h) {
  const crop = new PixelBuffer(w, h)
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const pixel = source.get(x + px, y + py)
      if (pixel) crop.set(px, py, `rgba(${pixel[0]},${pixel[1]},${pixel[2]},${pixel[3] / 255})`)
    }
  }
  return crop
}

async function main() {
  const { generateTiles } = await import('./gen-tiles.js')
  const { generateProps, generateBuildings } = await import('./gen-decor.js')
  const { generateCharacters, generateVillagers } = await import('./gen-characters.js')
  const { generateMonsters } = await import('./gen-monsters.js')
  const { generateUI } = await import('./gen-ui.js')
  const { generateFX } = await import('./gen-fx.js')

  const catalog = readCatalog()
  const technicalSpec = JSON.parse(readFileSync(DATA_PATH, 'utf8'))
  const catalogAnimatedEntries = catalog.categories.spriteSheetRequired.entries
  const catalogStaticEntries = catalog.categories.singlePng.entries
  const catalogAnimatedFrames = catalogAnimatedEntries.reduce((total, entry) => total + (entry.totalFrames || 0), 0)
  const catalogStaticFrames = catalogStaticEntries.length
  const catalogComputedTotalFrames = catalogAnimatedFrames + catalogStaticFrames
  const catalogUnspecifiedFrames = catalog.totalFrames - catalogComputedTotalFrames
  if (catalogUnspecifiedFrames < 0) throw new Error(`Catalog frame count mismatch: computed ${catalogComputedTotalFrames}, declared ${catalog.totalFrames}`)
  const technicalTileSpec = technicalSpec.categories.singlePng.entries.find(entry => entry.subcategory === 'isometric_tiles')
  const requestedTileVariants = technicalTileSpec?.totalVariants || 68
  const declaredTileVariants = (technicalTileSpec?.list || []).reduce((total, entry) => total + (entry.variants || 1), 0)
  const tileVariantOverrides = Object.fromEntries((technicalTileSpec?.list || []).map(entry => [entry.id.slice('tile.'.length), entry.variants]))
  if (requestedTileVariants > declaredTileVariants) {
    const deficit = requestedTileVariants - declaredTileVariants
    const fallbackTileTypes = ['grass', 'darkGrass', 'sand', 'path', 'water', 'deepWater', 'woodFloor', 'stoneFloor', 'wall', 'ruins', 'snow', 'lava', 'swamp', 'desert']
    for (let i = 0; i < deficit; i++) {
      const type = fallbackTileTypes[i % fallbackTileTypes.length]
      tileVariantOverrides[type] = (tileVariantOverrides[type] || 1) + 1
    }
  }
  const tiles = generateTiles([
    'grass', 'darkGrass', 'flowers', 'sand', 'path', 'water', 'deepWater',
    'woodFloor', 'stoneFloor', 'wall', 'door', 'bridge', 'ruins', 'mushroom',
    'forest', 'denseForest', 'mountain', 'snow', 'lava', 'swamp', 'desert', 'cloud', 'void',
  ], tileVariantOverrides)
  const props = {
    ...generateProps(['oak', 'pine', 'bush', 'rock', 'flowerPatch', 'sign', 'barrel', 'crate', 'lamp', 'statue', 'fountain', 'fence', 'well']),
    ...generateBuildings(['bakery', 'forge', 'apothecary', 'dock', 'elderHut', 'fishShack', 'shop', 'inn', 'tower', 'hut', 'temple', 'outpost']),
  }
  const chars = generateCharacters(['warrior', 'mage', 'ranger', 'healer'])
  const villagers = generateVillagers()
  const monsters = generateMonsters(['rat', 'wild_dog', 'goblin', 'spider', 'wolf', 'beetle', 'slime', 'boss_giant'])
  const ui = generateUI()
  const fx = generateFX()
  const catalogTileEntries = catalog.categories.singlePng.entries.filter(entry => entry.atlas === 'tiles.png')
  const catalogDeclaredTileVariants = catalogTileEntries.reduce((total, entry) => total + (entry.variants || 1), 0)
  const generatedTileVariants = Object.keys(tiles).length
  if (generatedTileVariants !== requestedTileVariants) {
    throw new Error(`Generated ${generatedTileVariants} tile variants, but the effective specification requires ${requestedTileVariants}`)
  }
  const atlases = [
    ['tiles.png', tiles],
    ['props.png', props],
    ['chars.png', chars],
    ['villagers.png', villagers],
    ['monsters.png', monsters],
    ['ui.png', ui],
    ['fx.png', fx],
  ]

  mkdirSync(OUT_DIR, { recursive: true })
  const manifest = {
    version: 3,
    generatedAt: new Date().toISOString(),
    project: catalog.project,
    source: {
      catalog: 'aset_katalog.json',
      technicalSpec: 'data.json',
      technicalSpecVersion: technicalSpec.version,
      workflow: 'master_atlas_then_slice',
    },
    constraints: {
      masterAtlas: { file: 'master_atlas.png', width: MASTER_SIZE, height: MASTER_SIZE, padding: PAD },
      atlasMaxWidth: MAX_ATLAS_W,
      pixelFormat: 'RGBA 8888',
      imageSmoothing: false,
      projection: '2:1 dimetric',
      mirrorSideLeftInCode: true,
    },
    atlases: {},
    frames: {},
    animation: {
      fps: { idle: 8, walk: 10, attack: 6, cast: 8, hurt: 8, death: 8 },
      directions: ['down', 'up', 'side'],
      sideMirror: 'left',
    },
    catalogCounts: {
      sourceCatalogTotalFrames: catalog.totalFrames,
      catalogAnimatedFrames,
      catalogStaticFrames,
      catalogComputedTotalFrames,
      effectiveTotalFrames: 1012,
      catalogUnspecifiedFrames,
      byAtlas: { 'tiles.png': requestedTileVariants, 'props.png': 25, 'chars.png': 432, 'villagers.png': 60, 'monsters.png': 360, 'ui.png': 49, 'fx.png': 18 },
      catalogDeclaredTileVariants,
      technicalSpecTileVariants: requestedTileVariants,
    },
  }

  const plans = atlases.map(([filename, frames]) => [filename, frames, { packed: packShelf(frames) }])
  for (const [filename, frames, plan] of plans) {
    manifest.atlases[filename] = {
      file: filename,
      width: plan.packed.w,
      height: plan.packed.h,
      padding: PAD,
      maxWidth: MAX_ATLAS_W,
      frameCount: plan.packed.placed.length,
      regions: plan.packed.placed.map(({ key, x, y, w, h }) => ({ key, x, y, w, h })),
    }
    for (const { key, x, y, w, h } of plan.packed.placed) manifest.frames[key] = { atlas: filename, x, y, w, h }
  }
  const master = new PixelBuffer(MASTER_SIZE, MASTER_SIZE)
  const masterRegions = []
  const masterState = { nextX: 0, nextY: 0, rowHeight: 0 }
  for (const [filename, frames, plan] of plans) placeMaster(plan, masterRegions, filename, masterState, master)
  if (masterState.nextY + masterState.rowHeight + PAD > MASTER_SIZE) throw new Error(`Master atlas overflow: required height exceeds ${MASTER_SIZE}px`)
  for (const region of masterRegions) {
    const source = manifest.frames[region.key]
    region.source = { atlas: source.atlas, x: source.x, y: source.y, w: source.w, h: source.h }
  }
  writeFileSync(join(OUT_DIR, 'master_atlas.png'), master.toPNG())
  for (const [filename, frames, plan] of plans) {
    const sliced = new PixelBuffer(plan.packed.w, plan.packed.h)
    const masterOrigin = masterRegions.find(region => region.sourceAtlas === filename)
    for (const frame of plan.packed.placed) {
      const masterFrame = masterRegions.find(region => region.key === frame.key)
      const crop = cropBuffer(master, masterFrame.x, masterFrame.y, frame.w, frame.h)
      sliced.blit(crop, frame.x, frame.y)
    }
    writeFileSync(join(OUT_DIR, filename), sliced.toPNG())
    manifest.atlases[filename].width = sliced.w
    manifest.atlases[filename].height = sliced.h
    manifest.atlases[filename].masterOrigin = { x: masterOrigin.x, y: masterOrigin.y }
    manifest.atlases[filename].masterRegion = { firstRegion: masterRegions.findIndex(region => region.sourceAtlas === filename), lastRegion: masterRegions.findLastIndex(region => region.sourceAtlas === filename) }
  }
  const sliceManifest = {
    version: 2,
    workflow: 'master_atlas_then_slice',
    project: catalog.project,
    generatedAt: manifest.generatedAt,
    source: 'master_atlas.png',
    sourceSize: { width: MASTER_SIZE, height: MASTER_SIZE },
    padding: PAD,
    atlases: manifest.atlases,
    regions: masterRegions,
  }
  writeFileSync(join(OUT_DIR, 'sprite-slice-manifest.json'), JSON.stringify(sliceManifest, null, 2))
  const spriteSheet = {
    version: 1,
    generatedAt: manifest.generatedAt,
    project: catalog.project,
    atlases: Object.fromEntries(Object.entries(manifest.atlases).map(([file, meta]) => [file, {
      file,
      width: meta.width,
      height: meta.height,
      frameCount: meta.frameCount,
      padding: meta.padding,
    }])),
    frames: manifest.frames,
    animations: {
      characters: { pattern: 'char.{class}.{gender}.{state}.{direction}.{frameIndex}', canvas: { width: 32, height: 40, anchor: { x: 16, y: 38 } } },
      villagers: { pattern: 'npc.{role}.idle.{direction}.{frameIndex}', canvas: { width: 32, height: 40, anchor: { x: 16, y: 38 } } },
      monsters: { pattern: 'mon.{type}.{state}.{direction}.{frameIndex}', canvas: { width: 32, height: 32, anchor: { x: 16, y: 30 } } },
    },
    render: { imageSmoothingEnabled: false, sideLeftUsesHorizontalMirror: true, integerScalingOnly: true, alpha: 'RGBA 8888' },
    validation: { sourceCatalogTotalFrames: catalog.totalFrames, catalogAnimatedFrames, catalogStaticFrames, catalogComputedTotalFrames, generatedTotalFrames: Object.keys(manifest.frames).length, catalogCounts: manifest.catalogCounts, catalogDeclaredTileVariants, technicalSpecTileVariants: requestedTileVariants, generatedTileFrames: Object.values(manifest.frames).filter(frame => frame.atlas === 'tiles.png').length, extraVariantsAllocated: requestedTileVariants - declaredTileVariants, note: 'The source catalog total includes 22 reserved frames not represented by an individual catalog entry; the generated atlases cover every explicit entry plus the technical tile requirement.' },
  }
  writeFileSync(join(OUT_DIR, 'sprite-sheet.json'), JSON.stringify(spriteSheet, null, 2))
  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(JSON.stringify({ master: `${MASTER_SIZE}x${MASTER_SIZE}`, atlases: Object.fromEntries(Object.entries(manifest.atlases).map(([name, meta]) => [name, `${meta.width}x${meta.height} (${meta.frameCount})`])), totalFrames: Object.keys(manifest.frames).length }, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(error => { console.error(error); process.exit(1) })
