// ============================================================
// Mythral Art - Sprite Tile Renderer
// Blits generated pixel-art tiles (with autotile variation) onto
// the tile canvas. Replaces procedural fillRect drawing.
// ============================================================
import { TILE_INFO, TILE_VARIATION_COUNT } from '../../../shared/tiles.js'
import { getFrame, drawFrame, tileVariant, isLoaded } from './registry.js'

// Which tile types get a "decoration" prop placed on top (trees, rocks, etc.)
const DECOR_PROPS = {
  [5]: 'prop.oak',     // FOREST -> oak tree
  [27]: 'prop.bush',   // MUSHROOM area bushes
  [26]: 'prop.flowerPatch', // FLOWERS
  [25]: 'prop.rock',   // RUINS -> rock
}

// Map tile type -> prop for deterministic decoration using position hash
export function getDecorProp(tileType, tx, ty) {
  const base = DECOR_PROPS[tileType]
  if (!base) return null
  // only some tiles get a prop (deterministic)
  let h = (tx * 92821 + ty * 689287) >>> 0
  h = (h ^ (h >>> 11)) >>> 0
  if ((h & 7) > 3) return null
  return base
}

// Draw a single base tile (sprite variant) at pixel x,y.
// Iso tiles are 64x32 (2:1 diamond); scale by native frame width.
export function drawTileSprite(ctx, tx, ty, tileType, px, py, S) {
  if (!isLoaded()) return false
  const info = TILE_INFO[tileType]
  if (!info || !info.sprite) return false
  const base = info.sprite
  const count = TILE_VARIATION_COUNT[base] || 1
  const v = tileVariant(base, tx, ty, count)
  const key = count > 1 ? `${base}.${v}` : base
  const fr = getFrame(key)
  if (!fr) return false
  return drawFrame(ctx, key, px, py, S / fr.sw)
}

// Draw decoration prop (taller than tile, anchored bottom-center at tile center)
export function drawDecorSprite(ctx, propKey, tx, ty, px, py, S) {
  if (!isLoaded()) return false
  const fr = getFrame(propKey)
  if (!fr) return false
  const scale = S / fr.sw
  const drawW = fr.sw * scale
  const drawH = fr.sh * scale
  // anchor bottom-center to tile center-bottom
  const dx = px + S / 2 - drawW / 2
  const dy = py + S - drawH + (S * 0.18) // small overlap lift
  return drawFrame(ctx, propKey, dx, dy, scale)
}

// Draw building sprite (tall prop anchored bottom-center, scaled to footprint)
export function drawBuildingSprite(ctx, buildingKey, b, sx, sy, S) {
  if (!isLoaded()) return false
  const fr = getFrame(buildingKey)
  if (!fr) return false
  // Scale building so its width ~= footprint width (in screen px)
  const footprintW = b.w * S
  const scale = (footprintW * 0.7) / fr.sw
  const drawW = fr.sw * scale
  const drawH = fr.sh * scale
  // center horizontally on footprint, anchor bottom near footprint center
  const dx = sx + footprintW / 2 - drawW / 2
  const dy = sy + (b.h * S) / 2 - drawH + S * 0.4
  return drawFrame(ctx, buildingKey, dx, dy, scale)
}
