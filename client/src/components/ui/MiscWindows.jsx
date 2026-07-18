// ============================================================
// Mythral - Character Sheet & World Map windows
// ============================================================

import React from 'react'
import { computePlayerStats, xpForLevel } from '../../../../shared/combat.js'
import { getSkillsForClass, SKILLS } from '../../../../shared/classes.js'
import { ISLAND_DEFS } from '../../../../shared/islands.js'

export function CharacterWindow({ active, player, onClose }) {
  if (!active || !player) return null
  const stats = computePlayerStats(player)
  const skills = getSkillsForClass(player.class, player.level)
  const xpNeeded = xpForLevel(player.level)

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="mythral-window" onClick={e => e.stopPropagation()} style={{ width: 560, maxWidth: '95vw', maxHeight: '85vh' }}>
        <div className="mythral-window-header">
          <span>👤 Character</span>
          <button className="mythral-window-close" onClick={onClose}>×</button>
        </div>
        <div className="mythral-window-body">
          <div className="char-portrait-section">
            <div className="char-portrait" style={{ background: player.classDef?.color }}>
              <span style={{ fontSize: 48 }}>{player.classDef?.icon}</span>
            </div>
            <div className="char-portrait-info">
              <div className="char-portrait-name">{player.name}</div>
              <div className="char-portrait-class" style={{ color: player.classDef?.color }}>
                Level {player.level} {player.classDef?.name}
              </div>
              <div className="char-portrait-xp text-sm text-dim">
                {player.xp} / {xpNeeded} XP
              </div>
              <div className="char-portrait-gold text-gold">
                🪙 {player.gold} gold
              </div>
            </div>
          </div>

          <div className="char-stats-section mt-4">
            <div className="text-gold text-sm font-bold mb-1">COMBAT STATS</div>
            <div className="char-stats-grid">
              <div className="char-stat"><span>❤ Max HP</span><span className="font-bold text-red">{stats.hp}</span></div>
              <div className="char-stat"><span>✦ Max MP</span><span className="font-bold text-blue">{stats.mp}</span></div>
              <div className="char-stat"><span>⚔ Attack</span><span className="font-bold text-gold">{stats.attack}</span></div>
              <div className="char-stat"><span>🛡 Defense</span><span className="font-bold text-green">{stats.defense}</span></div>
              <div className="char-stat"><span>✧ Magic</span><span className="font-bold text-purple">{stats.magic}</span></div>
              <div className="char-stat"><span>⚡ Speed</span><span className="font-bold text-blue">{stats.speed}</span></div>
            </div>
          </div>

          <div className="char-skills-section mt-4">
            <div className="text-gold text-sm font-bold mb-1">SKILLS</div>
            <div className="char-skills-list">
              {skills.map(sk => (
                <div key={sk.id} className="char-skill">
                  <div className="char-skill-header">
                    <span className="text-gold font-bold">{sk.name}</span>
                    <span className="text-xs text-dim">{sk.manaCost} MP · CD {sk.cooldown / 1000}s</span>
                  </div>
                  <div className="text-xs text-dim">{sk.description}</div>
                </div>
              ))}
              {/* Show locked skills */}
              {Object.values(SKILLS).filter(s => s.class === player.class && s.unlockLevel && player.level < s.unlockLevel).map(sk => (
                <div key={sk.id} className="char-skill locked">
                  <div className="char-skill-header">
                    <span className="text-dim font-bold">🔒 {sk.name}</span>
                    <span className="text-xs text-red">Requires level {sk.unlockLevel}</span>
                  </div>
                  <div className="text-xs text-dim">{sk.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function WorldMapWindow({ active, currentIsland, visitedIslands, player, killedBosses, onClose }) {
  if (!active) return null
  const islands = Object.values(ISLAND_DEFS)
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="mythral-window" onClick={e => e.stopPropagation()} style={{ width: 720, maxWidth: '95vw', maxHeight: '85vh' }}>
        <div className="mythral-window-header">
          <span>🗺 World Map</span>
          <button className="mythral-window-close" onClick={onClose}>×</button>
        </div>
        <div className="mythral-window-body">
          <p className="text-dim text-sm mb-2">Click on a visited island to see its details. Travel via sailor NPCs at the docks.</p>
          <div className="worldmap-grid">
            {islands.map((isl, i) => {
              const visited = visitedIslands.includes(isl.id)
              const isCurrent = currentIsland === isl.id
              const boss = isl.spawnConfig.find(c => {
                const m = c.monster
                return m.includes('pyros') || m.includes('dragon') || m.includes('titan') || m.includes('kraken') || m.includes('mortis') || m.includes('drake') || m.includes('acheron')
              })
              const bossKilled = boss && killedBosses.includes(boss.monster)
              return (
                <div key={isl.id} className={`worldmap-island ${isCurrent ? 'current' : ''} ${!visited ? 'unvisited' : ''}`}>
                  <div className="worldmap-island-num">{i + 1}</div>
                  <div className="worldmap-island-name" style={{ color: isl.backgroundColor === '#000' || isl.backgroundColor === '#0a0a0a' ? '#a78bfa' : isl.backgroundColor }}>
                    {isl.name}
                  </div>
                  <div className="text-xs text-dim">{isl.subtitle}</div>
                  <div className="text-xs">Lv {isl.levelRange[0]}-{isl.levelRange[1]}</div>
                  {visited ? (
                    <div className="text-xs text-green">✓ Visited</div>
                  ) : (
                    <div className="text-xs text-dim">Not yet visited</div>
                  )}
                  {boss && (
                    <div className="text-xs">
                      {bossKilled ? <span className="text-green">★ Boss slain</span> : <span className="text-red">★ Boss alive</span>}
                    </div>
                  )}
                  {isCurrent && <div className="text-xs text-gold font-bold">📍 You are here</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function HelpWindow({ active, onClose }) {
  if (!active) return null
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="mythral-window" onClick={e => e.stopPropagation()} style={{ width: 560, maxWidth: '95vw', maxHeight: '85vh' }}>
        <div className="mythral-window-header">
          <span>? Help</span>
          <button className="mythral-window-close" onClick={onClose}>×</button>
        </div>
        <div className="mythral-window-body">
          <div className="help-section">
            <div className="text-gold font-bold mb-1">MOVEMENT</div>
            <div className="text-sm">WASD or Arrow keys to move. You can also click on a tile to step toward it.</div>
          </div>
          <div className="help-section mt-4">
            <div className="text-gold font-bold mb-1">COMBAT</div>
            <div className="text-sm">Click on a monster to attack. Melee weapons (swords, maces) hit adjacent tiles. Ranged weapons (bows, staves) can hit up to 6 tiles away. Use skill bar (1-6 keys or click) for special abilities.</div>
          </div>
          <div className="help-section mt-4">
            <div className="text-gold font-bold mb-1">NPC INTERACTION</div>
            <div className="text-sm">Walk into an NPC or click on them to start a dialog. NPCs marked with ❗ have quests. NPCs marked with 🛒 have shops. NPCs marked with ⚓ can sail you to other islands.</div>
          </div>
          <div className="help-section mt-4">
            <div className="text-gold font-bold mb-1">INTERFACE SHORTCUTS</div>
            <ul className="text-sm">
              <li><b>I</b> — Inventory</li>
              <li><b>Q</b> — Quest Log</li>
              <li><b>C</b> — Character Sheet</li>
              <li><b>M</b> — World Map</li>
              <li><b>1-6</b> — Use skills</li>
              <li><b>Esc</b> — Close dialogs</li>
            </ul>
          </div>
          <div className="help-section mt-4">
            <div className="text-gold font-bold mb-1">DEATH</div>
            <div className="text-sm">If you fall in battle, you will respawn at the village center of your current island with full HP/MP, but lose 10% of your gold. Choose your fights wisely!</div>
          </div>
          <div className="help-section mt-4">
            <div className="text-gold font-bold mb-1">PROGRESSION</div>
            <div className="text-sm">Defeat monsters to gain XP and level up. Higher levels unlock new skills and let you travel to new islands. Bosses drop legendary loot — but they are tough. Bring potions!</div>
          </div>
        </div>
      </div>
    </div>
  )
}
