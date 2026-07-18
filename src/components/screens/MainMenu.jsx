// ============================================================
// Aetheria: Nine Isles - Main Menu Screen
// ============================================================

import React, { useState, useEffect } from 'react'
import { hasSave } from '../../systems/save.js'
import { getAllIslands } from '../../data/islands.js'

export default function MainMenu({ onStartNew, onContinue }) {
  const [hasExistingSave, setHasExistingSave] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  useEffect(() => {
    setHasExistingSave(hasSave())
  }, [])

  return (
    <div className="main-menu-bg">
      <div className="main-menu-stars" />
      <div className="main-menu-content">
        <div className="main-menu-title-wrap">
          <div className="main-menu-title-glow">AETHERIA</div>
          <h1 className="main-menu-title">AETHERIA</h1>
          <div className="main-menu-subtitle">Nine Isles</div>
          <div className="main-menu-tagline">A Browser MMORPG</div>
        </div>

        <div className="main-menu-buttons">
          <button className="aetheria-btn aetheria-btn-primary" onClick={onStartNew}>
            New Adventure
          </button>
          {hasExistingSave && (
            <button className="aetheria-btn aetheria-btn-success" onClick={onContinue}>
              Continue
            </button>
          )}
          <button className="aetheria-btn" onClick={() => setShowAbout(true)}>
            About the Game
          </button>
        </div>

        <div className="main-menu-footer">
          Inspired by the classic TibiaMe · Built with React + Vite
        </div>
      </div>

      {showAbout && (
        <div className="about-overlay" onClick={() => setShowAbout(false)}>
          <div className="about-panel aetheria-panel" onClick={e => e.stopPropagation()}>
            <h2 className="aetheria-title text-center mb-2" style={{ fontSize: 28 }}>AETHERIA: NINE ISLES</h2>
            <p className="text-center text-dim mb-2">An epic browser MMORPG spanning nine unique islands</p>
            <div className="about-section">
              <h3 className="text-gold">The World</h3>
              <p>
                Aetheria is a vast archipelago of nine distinct islands, each with its own biome, inhabitants, monsters, and quests.
                Begin your journey on the peaceful Lumina Isle, and travel onward through volcanic Emberfall, frozen Frostpeak,
                the magical Mistwood, sunscorched Sunscar, coastal Tidehaven, haunted Shadowfen, skybound Skyreach, and finally
                the reality-shattering Voidheart Isle.
              </p>
            </div>
            <div className="about-section">
              <h3 className="text-gold">Features</h3>
              <ul>
                <li>Four playable classes: Warrior, Mage, Ranger, Healer</li>
                <li>Nine unique islands with 8-18 NPCs each (100+ total)</li>
                <li>60+ structured quests across all isles</li>
                <li>Tile-based movement with WASD or click-to-move</li>
                <li>Real-time combat with skills, buffs, and elemental damage</li>
                <li>Full inventory, equipment, and shop system</li>
                <li>50+ monsters including 9 epic bosses</li>
                <li>Save/load progress automatically in your browser</li>
              </ul>
            </div>
            <div className="about-section">
              <h3 className="text-gold">Controls</h3>
              <ul>
                <li><b>WASD / Arrow keys</b> — Move your character</li>
                <li><b>Click on monster</b> — Attack (must be in range)</li>
                <li><b>Click on NPC</b> — Talk, trade, or accept quests</li>
                <li><b>I</b> — Open Inventory · <b>Q</b> — Quest Log · <b>C</b> — Character</li>
                <li><b>1-6</b> — Use class skills</li>
                <li><b>Esc</b> — Close windows</li>
              </ul>
            </div>
            <div className="text-center mt-4">
              <button className="aetheria-btn" onClick={() => setShowAbout(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
