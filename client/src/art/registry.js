// ============================================================
// Mythral Art - Asset Registry (runtime)
// Loads atlases + manifest, exposes getFrame(key) -> {img, sx, sy, sw, sh}
// Cached Image objects. pixelated scaling.
// ============================================================

const ASSET_BASE = '/assets/'
// Cache-bust: append version timestamp so browser always fetches fresh assets after regeneration
const CACHE_BUST = '?v=' + Date.now()

let manifest = null
const images = {}
let loaded = false
let loading = null
const listeners = []
const missingKeys = new Set()

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
  if (loading) return loading
  loading = (async () => {
    const res = await fetch(ASSET_BASE + 'manifest.json' + CACHE_BUST)
    if (!res.ok) throw new Error(`Asset manifest request failed: ${res.status}`)
    manifest = await res.json()
    if (!manifest.frames || !manifest.atlases) throw new Error('Atlas manifest is missing frames or atlases')
    const atlases = [...new Set(Object.values(manifest.frames).map(f => f.atlas))]
    await Promise.all(atlases.map(async (a) => {
      images[a] = await loadImage(ASSET_BASE + a + CACHE_BUST)
      const meta = manifest.atlases[a]
      if (meta && (images[a].naturalWidth !== meta.width || images[a].naturalHeight !== meta.height)) {
        throw new Error(`Atlas ${a} dimensions mismatch: expected ${meta.width}x${meta.height}, got ${images[a].naturalWidth}x${images[a].naturalHeight}`)
      }
    }))
    const invalid = Object.entries(manifest.frames).filter(([key, f]) => {
      const meta = manifest.atlases[f.atlas]
      return !meta || !Number.isInteger(f.x) || !Number.isInteger(f.y) || !Number.isInteger(f.w) || !Number.isInteger(f.h) || f.x < 0 || f.y < 0 || f.w <= 0 || f.h <= 0 || f.x + f.w > meta.width || f.y + f.h > meta.height || !images[f.atlas]
    })
    if (invalid.length) throw new Error(`Invalid atlas frame metadata: ${invalid.slice(0, 5).map(([key]) => key).join(', ')}`)
    loaded = true
    listeners.splice(0).forEach(l => l())
  })()
  try {
    await loading
  } finally {
    loading = null
  }
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
  if (!f) {
    if (!missingKeys.has(key)) {
      missingKeys.add(key)
      console.warn(`[Mythral assets] Missing texture key: ${key}`)
    }
    return null
  }
  const img = images[f.atlas]
  if (!img) return null
  return { img, sx: f.x, sy: f.y, sw: f.w, sh: f.h }
}

export function getAssetDiagnostics() {
  return { loaded, atlasCount: Object.keys(images).length, frameCount: manifest ? Object.keys(manifest.frames).length : 0, missingKeys: [...missingKeys] }
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
