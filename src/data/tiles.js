// ============================================================
// Aetheria: Nine Isles - Tile types
// Single source of truth for tile definitions
// ============================================================

export const TILE = {
  DEEP_WATER: 0,
  WATER: 1,
  SAND: 2,
  GRASS: 3,
  DARK_GRASS: 4,
  FOREST: 5,
  DENSE_FOREST: 6,
  MOUNTAIN: 7,
  SNOW: 8,
  ICE: 9,
  LAVA: 10,
  VOLCANIC_ROCK: 11,
  SWAMP: 12,
  SWAMP_WATER: 13,
  DESERT: 14,
  DESERT_ROCK: 15,
  PATH: 16,
  WOOD_FLOOR: 17,
  STONE_FLOOR: 18,
  WALL: 19,
  DOOR: 20,
  BRIDGE: 21,
  CRYSTAL: 22,
  VOID: 23,
  CLOUD: 24,
  RUINS: 25,
  FLOWERS: 26,
  MUSHROOM: 27,
}

export const TILE_INFO = {
  [TILE.DEEP_WATER]:    { name: 'Deep Water',  color: '#0c1e4a', walkable: false, decor: '🌊' },
  [TILE.WATER]:         { name: 'Water',        color: '#1e3a8a', walkable: false, decor: '≈' },
  [TILE.SAND]:          { name: 'Sand',         color: '#fde68a', walkable: true },
  [TILE.GRASS]:         { name: 'Grass',        color: '#4ade80', walkable: true },
  [TILE.DARK_GRASS]:    { name: 'Tall Grass',   color: '#16a34a', walkable: true },
  [TILE.FOREST]:        { name: 'Forest',       color: '#15803d', walkable: true, decor: '🌲' },
  [TILE.DENSE_FOREST]:  { name: 'Dense Forest', color: '#14532d', walkable: false, decor: '🌲' },
  [TILE.MOUNTAIN]:      { name: 'Mountain',     color: '#57534e', walkable: false, decor: '▲' },
  [TILE.SNOW]:          { name: 'Snow',         color: '#f1f5f9', walkable: true },
  [TILE.ICE]:           { name: 'Ice',          color: '#bae6fd', walkable: true, decor: '❄' },
  [TILE.LAVA]:          { name: 'Lava',         color: '#dc2626', walkable: false, decor: '🔥' },
  [TILE.VOLCANIC_ROCK]: { name: 'Volcanic Rock',color: '#451a03', walkable: true },
  [TILE.SWAMP]:         { name: 'Swamp',        color: '#3f6212', walkable: true, decor: '🌿' },
  [TILE.SWAMP_WATER]:   { name: 'Murky Water',  color: '#365314', walkable: false, decor: '≈' },
  [TILE.DESERT]:        { name: 'Desert',       color: '#fbbf24', walkable: true },
  [TILE.DESERT_ROCK]:   { name: 'Desert Rock',  color: '#a16207', walkable: false, decor: '▲' },
  [TILE.PATH]:          { name: 'Path',         color: '#a8a29e', walkable: true },
  [TILE.WOOD_FLOOR]:    { name: 'Wood Floor',   color: '#92400e', walkable: true },
  [TILE.STONE_FLOOR]:   { name: 'Stone Floor',  color: '#71717a', walkable: true },
  [TILE.WALL]:          { name: 'Wall',         color: '#27272a', walkable: false, decor: '🧱' },
  [TILE.DOOR]:          { name: 'Door',         color: '#92400e', walkable: true, decor: '🚪' },
  [TILE.BRIDGE]:        { name: 'Bridge',       color: '#78350f', walkable: true },
  [TILE.CRYSTAL]:       { name: 'Crystal',      color: '#a78bfa', walkable: false, decor: '💎' },
  [TILE.VOID]:          { name: 'Void',         color: '#1e1b4b', walkable: true, decor: '✦' },
  [TILE.CLOUD]:         { name: 'Cloud',        color: '#f1f5f9', walkable: true, decor: '☁' },
  [TILE.RUINS]:         { name: 'Ruins',        color: '#78716c', walkable: true, decor: '🏛' },
  [TILE.FLOWERS]:       { name: 'Flowers',      color: '#f472b6', walkable: true, decor: '🌸' },
  [TILE.MUSHROOM]:      { name: 'Mushrooms',    color: '#9333ea', walkable: true, decor: '🍄' },
}

export function isWalkable(tile) {
  const info = TILE_INFO[tile]
  return info ? info.walkable : false
}

// Helper: build a rectangular island with water border
export function makeIsland(width, height, baseTile, fillFn) {
  const map = []
  for (let y = 0; y < height; y++) {
    const row = []
    for (let x = 0; x < width; x++) {
      row.push(fillFn(x, y, width, height))
    }
    map.push(row)
  }
  return map
}

// Helper: stamp a rectangle of tiles onto the map
export function stampRect(map, x, y, w, h, tile) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const tx = x + dx, ty = y + dy
      if (ty >= 0 && ty < map.length && tx >= 0 && tx < map[0].length) {
        map[ty][tx] = tile
      }
    }
  }
}

// Helper: stamp a building (walls + wood floor + door)
export function stampBuilding(map, x, y, w, h, floorTile = TILE.WOOD_FLOOR, wallTile = TILE.WALL, doorOnBottom = true) {
  // perimeter walls
  for (let dx = 0; dx < w; dx++) {
    if (y >= 0 && y < map.length && x + dx >= 0 && x + dx < map[0].length) map[y][x + dx] = wallTile
    if (y + h - 1 >= 0 && y + h - 1 < map.length && x + dx >= 0 && x + dx < map[0].length) map[y + h - 1][x + dx] = wallTile
  }
  for (let dy = 0; dy < h; dy++) {
    if (x >= 0 && x < map[0].length && y + dy >= 0 && y + dy < map.length) map[y + dy][x] = wallTile
    if (x + w - 1 >= 0 && x + w - 1 < map[0].length && y + dy >= 0 && y + dy < map.length) map[y + dy][x + w - 1] = wallTile
  }
  // interior floor
  stampRect(map, x + 1, y + 1, w - 2, h - 2, floorTile)
  // door
  if (doorOnBottom) {
    const doorX = x + Math.floor(w / 2)
    if (y + h - 1 < map.length && doorX < map[0].length) map[y + h - 1][doorX] = TILE.DOOR
  } else {
    const doorX = x + Math.floor(w / 2)
    if (y >= 0 && doorX < map[0].length) map[y][doorX] = TILE.DOOR
  }
}
