// ============================================================
// Aetheria Client - BFS Pathfinding
// Finds the shortest walkable path between two tiles.
// Used for tap-to-move navigation.
// ============================================================

import { TILE_INFO } from '../../../shared/tiles.js'

/**
 * BFS pathfinding from (startX, startY) to (endX, endY).
 * Returns an array of {dx, dy} steps, or null if no path found.
 * Static obstacles only (water, walls, etc.) — dynamic obstacles
 * (monsters, other players) are handled by the server.
 */
export function findPath(map, startX, startY, endX, endY, maxIterations = 2000) {
  if (!map) return null
  const h = map.length
  const w = map[0].length
  if (startX < 0 || startX >= w || startY < 0 || startY >= h) return null
  if (endX < 0 || endX >= w || endY < 0 || endY >= h) return null
  if (startX === endX && startY === endY) return []

  // End must be walkable
  const endTile = map[endY][endX]
  if (!TILE_INFO[endTile] || !TILE_INFO[endTile].walkable) return null

  // BFS with visited set
  const visited = new Uint8Array(w * h)
  const parent = new Int32Array(w * h).fill(-1)
  const queue = [startY * w + startX]
  visited[startY * w + startX] = 1

  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]
  let iterations = 0

  while (queue.length > 0 && iterations < maxIterations) {
    iterations++
    const current = queue.shift()
    const cx = current % w
    const cy = Math.floor(current / w)

    if (cx === endX && cy === endY) {
      // Reconstruct path
      const steps = []
      let node = current
      while (node !== startY * w + startX && parent[node] !== -1) {
        const px = parent[node] % w
        const py = Math.floor(parent[node] / w)
        const nx = node % w
        const ny = Math.floor(node / w)
        steps.unshift({ dx: nx - px, dy: ny - py })
        node = parent[node]
      }
      return steps
    }

    for (const [dx, dy] of dirs) {
      const nx = cx + dx
      const ny = cy + dy
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
      const idx = ny * w + nx
      if (visited[idx]) continue
      const tile = map[ny][nx]
      const info = TILE_INFO[tile]
      if (!info || !info.walkable) continue
      visited[idx] = 1
      parent[idx] = current
      queue.push(idx)
    }
  }

  return null // no path found
}
