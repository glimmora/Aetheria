// ============================================================
// Mythral - Death screen
// ============================================================

import React from 'react'

export default function DeathScreen({ player, onRespawn, onQuit }) {
  return (
    <div className="death-overlay">
      <div className="death-panel">
        <div className="death-title">YOU HAVE FALLEN</div>
        <div className="death-subtitle">Mythral mourns the loss of {player?.name || 'a brave hero'}...</div>
        <div className="death-actions">
          <button className="mythral-btn mythral-btn-success" onClick={onRespawn}>
            Respawn at Village
          </button>
          <button className="mythral-btn" onClick={onQuit}>
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
