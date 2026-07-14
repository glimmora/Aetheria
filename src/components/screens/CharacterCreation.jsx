// ============================================================
// Aetheria: Nine Isles - Character Creation Screen
// ============================================================

import React, { useState } from 'react'
import { CLASSES } from '../../data/classes.js'

export default function CharacterCreation({ onCreate, onCancel }) {
  const [name, setName] = useState('')
  const [selectedClass, setSelectedClass] = useState('warrior')

  const classList = Object.values(CLASSES)

  const handleCreate = () => {
    if (!name.trim()) {
      alert('Please enter a hero name')
      return
    }
    onCreate(name.trim(), selectedClass)
  }

  const cls = CLASSES[selectedClass]

  return (
    <div className="char-create-bg">
      <div className="char-create-content">
        <h1 className="aetheria-title text-center mb-2" style={{ fontSize: 32 }}>Forge Your Hero</h1>
        <p className="text-center text-dim mb-4">Choose your name and class. Your destiny in Aetheria begins now.</p>

        <div className="char-create-name-section mb-4">
          <label className="text-gold text-sm font-bold">HERO NAME</label>
          <input
            type="text"
            className="char-create-input"
            value={name}
            onChange={e => setName(e.target.value.slice(0, 20))}
            placeholder="Enter your hero's name..."
            maxLength={20}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
          />
        </div>

        <div className="char-create-classes">
          {classList.map(c => (
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

        <div className="char-create-detail-panel aetheria-panel">
          <div className="char-create-detail-header" style={{ background: `linear-gradient(180deg, ${cls.color}33 0%, transparent 100%)` }}>
            <div className="char-create-detail-icon" style={{ color: cls.color }}>{cls.icon}</div>
            <div>
              <div className="char-create-detail-name" style={{ color: cls.color }}>{cls.name}</div>
              <div className="char-create-detail-desc text-sm text-dim">{cls.description}</div>
            </div>
          </div>
          <div className="char-create-stats">
            <div className="char-create-stat">
              <span className="text-red">❤ HP</span>
              <span className="font-bold">{cls.baseStats.hp}</span>
            </div>
            <div className="char-create-stat">
              <span className="text-blue">✦ MP</span>
              <span className="font-bold">{cls.baseStats.mp}</span>
            </div>
            <div className="char-create-stat">
              <span className="text-gold">⚔ ATK</span>
              <span className="font-bold">{cls.baseStats.attack}</span>
            </div>
            <div className="char-create-stat">
              <span className="text-green">🛡 DEF</span>
              <span className="font-bold">{cls.baseStats.defense}</span>
            </div>
            <div className="char-create-stat">
              <span className="text-purple">✧ MAG</span>
              <span className="font-bold">{cls.baseStats.magic}</span>
            </div>
            <div className="char-create-stat">
              <span className="text-dim">⚡ SPD</span>
              <span className="font-bold">{cls.baseStats.speed}</span>
            </div>
          </div>
          <div className="char-create-skills">
            <div className="text-gold text-sm font-bold mb-1">STARTING SKILLS</div>
            <div className="char-create-skill-list">
              {cls.startingSkills.map(skId => {
                const sk = SKILLS_LIST[skId]
                return sk ? (
                  <div key={skId} className="char-create-skill">
                    <span className="text-gold">{sk.name}</span>
                    <span className="text-dim text-xs"> — {sk.description}</span>
                  </div>
                ) : null
              })}
            </div>
          </div>
        </div>

        <div className="char-create-buttons mt-4">
          <button className="aetheria-btn" onClick={onCancel}>Back</button>
          <button className="aetheria-btn aetheria-btn-success" onClick={handleCreate}>
            Begin Your Adventure
          </button>
        </div>
      </div>
    </div>
  )
}

import { SKILLS as SKILLS_LIST } from '../../data/classes.js'
