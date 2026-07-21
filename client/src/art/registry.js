// ============================================================
// Mythral Art - Asset Registry (runtime)
// Loads atlases + manifest, exposes getFrame(key) -> {img, sx, sy, sw, sh}
// Cached Image objects. pixelated scaling.
// ============================================================

const ASSET_BASE = '/assets/'
// Cache-bust: append version timestamp so browser always fetches fresh assets after regeneration
const CACHE_BUST = '?v=' + Date.now()

let manifest = null
const images = {} // atlas filename -> HTMLImageElement (or Image in browser)
let loaded = false
const listeners = []

// In the browser, `Image` is global. We load via new Image().
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function loadAssets() {
  if (loaded) return
  const res = await fetch(ASSET_BASE + 'manifest.json' + CACHE_BUST)
  manifest = await res.json()
  const atlases = [...new Set(Object.values(manifest.frames).map(f => f.atlas))]
  await Promise.all(atlases.map(async (a) => {
    images[a] = await loadImage(ASSET_BASE + a + CACHE_BUST)
  }))
  loaded = true
  listeners.forEach(l => l())
}

export function onAssetsLoaded(cb) {
  if (loaded) cb()
  else listeners.push(cb)
}

export function isLoaded() { return loaded }

// Returns draw descriptor or null
export function getFrame(key) {
  if (!manifest) return null
  const f = manifest.frames[key]
  if (!f) return null
  const img = images[f.atlas]
  if (!img) return null
  return { img, sx: f.x, sy: f.y, sw: f.w, sh: f.h }
}

// Convenience: draw a frame onto a ctx at (dx,dy) with optional scale
export function drawFrame(ctx, key, dx, dy, scale = 1, flip = false) {
  const fr = getFrame(key)
  if (!fr) return false
  ctx.imageSmoothingEnabled = false
  if (flip) {
    ctx.save()
    ctx.translate(dx + fr.sw * scale, dy)
    ctx.scale(-scale, scale)
    ctx.drawImage(fr.img, fr.sx, fr.sy, fr.sw, fr.sh, 0, 0, fr.sw, fr.sh)
    ctx.restore()
  } else {
    ctx.drawImage(fr.img, fr.sx, fr.sy, fr.sw, fr.sh, dx, dy, fr.sw * scale, fr.sh * scale)
  }
  return true
}

// Pick a deterministic variation for a tile at (tx,ty)
export function tileVariant(key, tx, ty, count) {
  // hash position
  let h = (tx * 374761393 + ty * 668265263) >>> 0
  h = (h ^ (h >>> 13)) >>> 0
  return h % count
}
