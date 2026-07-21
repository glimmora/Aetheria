// ============================================================
// Mythral - Mobile action buttons (Attack / Interact)
// Bottom-right cluster for thumb access. Attack auto-targets the
// nearest monster; Interact opens nearest NPC dialog.
// ============================================================
import React from 'react'

export default function MobileActionButtons({
  onInteract, nearNpc, leftHanded = false,
}) {
  return (
    <div className={`mobile-actions ${leftHanded ? 'left' : 'right'}`}>
      <button
        className={`action-btn interact ${nearNpc ? 'enabled' : 'dim'}`}
        onPointerDown={(e) => { e.preventDefault(); onInteract?.() }}
        title="Interact (nearest NPC)"
      >
        <span className="action-icon">💬</span>
        <span className="action-label">Talk</span>
      </button>
    </div>
  )
}
