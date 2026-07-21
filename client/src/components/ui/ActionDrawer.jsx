// ============================================================
// Mythral - Mobile Action Drawer
// Slide-up panel (opened from the menu ☰ button) holding the
// secondary HUD actions as large, labeled, thumb-friendly rows.
// ============================================================
import React from 'react'

const ACTIONS = [
  { key: 'char', icon: '👤', label: 'Character', title: 'Character (C)' },
  { key: 'inv', icon: '🎒', label: 'Inventory', title: 'Inventory (I)' },
  { key: 'quest', icon: '📜', label: 'Quests', title: 'Quest Log (Q)' },
  { key: 'map', icon: '🗺', label: 'World Map', title: 'World Map (M)' },
  { key: 'online', icon: '👥', label: 'Players', title: 'Online Players (P)' },
  { key: 'board', icon: '🏆', label: 'Leaderboard', title: 'Leaderboard (L)' },
  { key: 'help', icon: '❓', label: 'Help', title: 'Help (?)' },
  { key: 'settings', icon: '⚙', label: 'Settings', title: 'Settings' },
  { key: 'quit', icon: '🚪', label: 'Quit', title: 'Quit to Character Select' },
]

export default function ActionDrawer({ open, onClose, onAction }) {
  return (
    <>
      <div
        className={`action-drawer-scrim ${open ? 'open' : ''}`}
        onClick={onClose}
      />
      <div className={`action-drawer ${open ? 'open' : ''}`} role="menu">
        <div className="action-drawer-header">
          <span>Menu</span>
          <button className="action-drawer-close" onClick={onClose} title="Close">✕</button>
        </div>
        <div className="action-drawer-grid">
          {ACTIONS.map(a => (
            <button
              key={a.key}
              className="action-drawer-item"
              onClick={() => { onAction?.(a.key); onClose() }}
              title={a.title}
            >
              <span className="adi-icon">{a.icon}</span>
              <span className="adi-label">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
