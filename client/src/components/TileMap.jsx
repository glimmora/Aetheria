// ============================================================
// Aetheria Client - Tile Map Renderer
// Renders the visible portion of the island map + entities.
// Now receives the map directly from the server's state sync.
// ============================================================

import React from 'react'
import { TILE_INFO } from '../../../shared/tiles.js'

const TILE_SIZE = 32

export default function TileMap({
  currentIsland,
  map,
  player,
  monsters,
  npcs,
  otherPlayers = [],
  floatingTexts,
  onTileClick,
}) {
  if (!map || !player) return null
  const w = map[0].length, h = map.length

  // Camera: center on player
  const viewW = Math.min(25, w)
  const viewH = Math.min(17, h)
  let camX = player.x - Math.floor(viewW / 2)
  let camY = player.y - Math.floor(viewH / 2)
  camX = Math.max(0, Math.min(w - viewW, camX))
  camY = Math.max(0, Math.min(h - viewH, camY))

  const tiles = []
  for (let y = 0; y < viewH; y++) {
    for (let x = 0; x < viewW; x++) {
      const tx = camX + x, ty = camY + y
      if (tx < 0 || tx >= w || ty < 0 || ty >= h) continue
      const tile = map[ty][tx]
      const info = TILE_INFO[tile] || { color: '#000' }
      tiles.push(
        <div
          key={`${x}-${y}`}
          className="tile"
          style={{
            left: x * TILE_SIZE,
            top: y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            background: info.color,
          }}
          onClick={() => onTileClick(tx, ty)}
        >
          {info.decor && <span className="tile-decor">{info.decor}</span>}
        </div>
      )
    }
  }

  const visibleMonsters = monsters.filter(m =>
    m.x >= camX && m.x < camX + viewW && m.y >= camY && m.y < camY + viewH
  )
  const visibleNpcs = npcs.filter(n =>
    n.x >= camX && n.x < camX + viewW && n.y >= camY && n.y < camY + viewH
  )
  const visibleOthers = otherPlayers.filter(p =>
    p.x >= camX && p.x < camX + viewW && p.y >= camY && p.y < camY + viewH
  )
  const visibleTexts = floatingTexts.filter(f =>
    f.x >= camX && f.x < camX + viewW && f.y >= camY && f.y < camY + viewH
  )

  return (
    <div
      className="tile-map-container"
      style={{
        width: viewW * TILE_SIZE,
        height: viewH * TILE_SIZE,
        background: currentIsland?.backgroundColor || '#000',
      }}
    >
      <div className="tile-layer">{tiles}</div>

      {/* NPCs */}
      {visibleNpcs.map(npc => (
        <div
          key={npc.id}
          className="entity npc"
          style={{
            left: (npc.x - camX) * TILE_SIZE,
            top: (npc.y - camY) * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
          }}
          onClick={(e) => { e.stopPropagation(); onTileClick(npc.x, npc.y) }}
          title={npc.name}
        >
          <div className="entity-icon" style={{ background: npc.color }}>N</div>
          <div className="entity-name" style={{ color: npc.color }}>{npc.name}</div>
          {npc.quest && <div className="entity-marker">!</div>}
          {npc.shop && <div className="entity-marker shop">$</div>}
          {npc.travel && <div className="entity-marker travel">⚓</div>}
        </div>
      ))}

      {/* Monsters */}
      {visibleMonsters.map(m => (
        <div
          key={m.id}
          className={`entity monster ${m.boss ? 'boss' : ''}`}
          style={{
            left: (m.x - camX) * TILE_SIZE,
            top: (m.y - camY) * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
          }}
          onClick={(e) => { e.stopPropagation(); onTileClick(m.x, m.y) }}
          title={`${m.name} (Lv ${m.level})`}
        >
          <div className="entity-icon monster-icon" style={{ background: m.color, fontSize: m.boss ? 20 : 16 }}>
            {m.icon}
          </div>
          <div className="entity-hp-bar">
            <div className="entity-hp-fill" style={{ width: `${(m.hp / m.maxHp) * 100}%` }} />
          </div>
          <div className="entity-name monster-name">{m.name}{m.boss ? ' ★' : ''}</div>
        </div>
      ))}

      {/* Other players */}
      {visibleOthers.map(p => (
        <div
          key={p.id}
          className="entity other-player"
          style={{
            left: (p.x - camX) * TILE_SIZE,
            top: (p.y - camY) * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
          }}
          title={`${p.name} (Lv ${p.level} ${p.classDef?.name || p.classId})`}
        >
          <div className="entity-icon other-player-icon" style={{ background: p.classDef?.color || '#a8a29e' }}>
            {p.classDef?.icon || '★'}
          </div>
          <div className="entity-name other-player-name">{p.name}</div>
        </div>
      ))}

      {/* Player (self) */}
      <div
        className="entity player"
        style={{
          left: (player.x - camX) * TILE_SIZE,
          top: (player.y - camY) * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
        }}
      >
        <div className="entity-icon player-icon" style={{ background: player.classDef?.color || '#fde047' }}>
          {player.classDef?.icon || '★'}
        </div>
        <div className="entity-name player-name">{player.name}</div>
      </div>

      {/* Floating texts */}
      {visibleTexts.map(f => (
        <div
          key={f.id}
          className={`floating-text ${f.kind}`}
          style={{
            left: (f.x - camX) * TILE_SIZE + TILE_SIZE / 2,
            top: (f.y - camY) * TILE_SIZE,
            color: f.color,
          }}
        >
          {f.text}
        </div>
      ))}

      <div className="map-edge-info">
        {currentIsland?.name} — {currentIsland?.subtitle}
      </div>
    </div>
  )
}
