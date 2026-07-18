// ============================================================
// Mythral - Travel Window
// ============================================================

import React from 'react'
import { ISLAND_DEFS } from '../../../../shared/islands.js'

export default function TravelWindow({ activeTravel, player, visitedIslands, onTravel, onClose }) {
  if (!activeTravel) return null
  const npc = activeTravel.npc
  const options = npc.travel?.options || (npc.travel ? [{ to: npc.travel, reqLevel: npc.reqLevel || 1 }] : [])

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="travel-window mythral-window" onClick={e => e.stopPropagation()} style={{ width: 480, maxWidth: '90vw' }}>
        <div className="mythral-window-header">
          <span>⚓ {npc.name}</span>
          <button className="mythral-window-close" onClick={onClose}>×</button>
        </div>
        <div className="mythral-window-body">
          <p className="text-dim text-sm mb-2">"Where would you sail to, traveler?"</p>
          <div className="travel-options">
            {options.map((opt, i) => {
              const def = ISLAND_DEFS[opt.to]
              if (!def) return null
              const canTravel = player.level >= opt.reqLevel
              const visited = visitedIslands.includes(opt.to)
              return (
                <div key={i} className={`travel-option ${!canTravel ? 'disabled' : ''}`}>
                  <div className="travel-option-header">
                    <span className="travel-option-name" style={{ color: def.backgroundColor === '#000' || def.backgroundColor === '#0a0a0a' ? '#a78bfa' : def.backgroundColor }}>
                      {def.name}
                    </span>
                    <span className="text-dim text-xs">{def.subtitle}</span>
                  </div>
                  <div className="text-sm text-dim">{def.description.slice(0, 100)}...</div>
                  <div className="travel-option-meta">
                    <span className="text-xs">Lv {def.levelRange[0]}-{def.levelRange[1]}</span>
                    {visited && <span className="text-green text-xs">✓ Visited</span>}
                    {!canTravel && <span className="text-red text-xs">Requires level {opt.reqLevel}</span>}
                  </div>
                  <button
                    className="mythral-btn mythral-btn-primary text-sm mt-1"
                    disabled={!canTravel}
                    onClick={() => onTravel(opt.to)}
                  >
                    Sail to {def.name}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
