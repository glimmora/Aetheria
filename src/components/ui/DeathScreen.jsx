// ============================================================
// Aetheria: Nine Isles - Death screen
// ============================================================

import React from 'react'

export default function DeathScreen({ player, onRespawn, onQuit }) {
  return (
    <div className="death-overlay">
      <div className="death-panel">
        <div className="death-title">YOU HAVE FALLEN</div>
        <div className="death-subtitle">Aetheria mourns the loss of {player?.name || 'a brave hero'}...</div>
        <div className="death-actions">
          <button className="aetheria-btn aetheria-btn-success" onClick={onRespawn}>
            Respawn at Village
          </button>
          <button className="aetheria-btn" onClick={onQuit}>
            Return to Main Menu
          </button>
        </div>
        <div className="death-note text-dim text-sm">
          Respawning will restore your HP and MP but cost 10% of your gold.
        </div>
      </div>
    </div>
  )
}
