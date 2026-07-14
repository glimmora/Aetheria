// ============================================================
// Aetheria Client - Character Select Screen
// ============================================================

import React, { useState } from 'react'
import { CLASSES } from '../../../../shared/classes.js'
import { ISLAND_DEFS } from '../../../../shared/islands.js'

export default function CharSelectScreen({ username, characters, maxCharacters, onSelect, onCreate, onDelete, onLogout }) {
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [selectedClass, setSelectedClass] = useState('warrior')
  const [error, setError] = useState(null)
  const max = maxCharacters || 5
  const atLimit = characters.length >= max

  const handleCreate = () => {
    setError(null)
    if (!name.trim() || name.trim().length < 3) {
      setError('Name must be at least 3 characters')
      return
    }
    if (name.trim().length > 20) {
      setError('Name must be at most 20 characters')
      return
    }
    onCreate(name.trim(), selectedClass)
    setName('')
    setShowCreate(false)
  }

  return (
    <div className="char-select-bg">
      <div className="char-select-content">
        <div className="char-select-header">
          <div>
            <h1 className="aetheria-title" style={{ fontSize: 28 }}>Your Heroes</h1>
            <div className="text-dim text-sm">Welcome back, <span className="text-gold">{username}</span> · {characters.length}/{max} characters</div>
          </div>
          <button className="aetheria-btn" onClick={onLogout}>Logout</button>
        </div>

        {!showCreate && (
          <>
            <div className="char-select-grid">
              {characters.length === 0 && (
                <div className="char-select-empty">
                  <div className="text-dim mb-2">You have no characters yet.</div>
                  <button className="aetheria-btn aetheria-btn-primary" onClick={() => setShowCreate(true)}>
                    Create Your First Hero
                  </button>
                </div>
              )}
              {characters.map(c => {
                const cls = CLASSES[c.class]
                const isl = ISLAND_DEFS[c.currentIsland]
                return (
                  <div key={c.id} className="char-card">
                    <div className="char-card-portrait" style={{ background: cls?.color }}>
                      {cls?.icon}
                    </div>
                    <div className="char-card-info">
                      <div className="char-card-name">{c.name}</div>
                      <div className="char-card-class" style={{ color: cls?.color }}>
                        Level {c.level} {cls?.name}
                      </div>
                      <div className="char-card-island text-xs text-dim">
                        Last seen: {isl?.name}
                      </div>
                    </div>
                    <div className="char-card-actions">
                      <button className="aetheria-btn aetheria-btn-success" onClick={() => onSelect(c.id)}>
                        Enter World
                      </button>
                      <button className="aetheria-btn aetheria-btn-danger text-sm" onClick={() => {
                        if (confirm(`Delete ${c.name}? This cannot be undone.`)) onDelete(c.id)
                      }}>Delete</button>
                    </div>
                  </div>
                )
              })}
              {characters.length > 0 && !atLimit && (
                <div className="char-card char-card-new" onClick={() => setShowCreate(true)}>
                  <div className="char-card-new-icon">+</div>
                  <div className="char-card-new-text">New Hero</div>
                </div>
              )}
            </div>
          </>
        )}

        {showCreate && (
          <div className="char-create-form aetheria-panel">
            <h2 className="aetheria-title mb-2" style={{ fontSize: 22 }}>Forge a New Hero</h2>
            <label className="auth-label">HERO NAME</label>
            <input
              type="text"
              className="auth-input"
              value={name}
              onChange={e => setName(e.target.value.slice(0, 20))}
              placeholder="3-20 chars: letters, numbers, spaces, _ -"
              maxLength={20}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
            />
            <div className="text-gold text-sm font-bold mt-4 mb-1">CHOOSE CLASS</div>
            <div className="char-create-classes">
              {Object.values(CLASSES).map(c => (
                <div
                  key={c.id}
                  className={`char-create-class-card ${selectedClass === c.id ? 'selected' : ''}`}
                  style={selectedClass === c.id ? { borderColor: c.color, boxShadow: `0 0 24px ${c.color}88` } : {}}
                  onClick={() => setSelectedClass(c.id)}
                >
                  <div className="char-create-class-icon" style={{ color: c.color }}>{c.icon}</div>
                  <div className="char-create-class-name" style={{ color: c.color }}>{c.name}</div>
                </div>
              ))}
            </div>
            <div className="char-create-detail-panel">
              <div className="text-sm text-dim">{CLASSES[selectedClass].description}</div>
              <div className="char-create-stats mt-2">
                <div className="char-create-stat"><span className="text-red">❤ HP</span><span className="font-bold">{CLASSES[selectedClass].baseStats.hp}</span></div>
                <div className="char-create-stat"><span className="text-blue">✦ MP</span><span className="font-bold">{CLASSES[selectedClass].baseStats.mp}</span></div>
                <div className="char-create-stat"><span className="text-gold">⚔ ATK</span><span className="font-bold">{CLASSES[selectedClass].baseStats.attack}</span></div>
                <div className="char-create-stat"><span className="text-green">🛡 DEF</span><span className="font-bold">{CLASSES[selectedClass].baseStats.defense}</span></div>
                <div className="char-create-stat"><span className="text-purple">✧ MAG</span><span className="font-bold">{CLASSES[selectedClass].baseStats.magic}</span></div>
                <div className="char-create-stat"><span className="text-dim">⚡ SPD</span><span className="font-bold">{CLASSES[selectedClass].baseStats.speed}</span></div>
              </div>
            </div>
            {error && <div className="auth-error mt-2">{error}</div>}
            <div className="char-create-buttons mt-4">
              <button className="aetheria-btn" onClick={() => { setShowCreate(false); setError(null) }}>Cancel</button>
              <button className="aetheria-btn aetheria-btn-success" onClick={handleCreate}>Create Hero</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
