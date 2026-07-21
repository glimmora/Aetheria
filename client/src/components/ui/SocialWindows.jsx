// ============================================================
// Mythral Client - Online Players, Leaderboard, MiniMap,
// Settings, PlayerInspect windows
// ============================================================

import React, { useState, useEffect } from 'react'
import { CLASSES } from '../../../../shared/classes.js'
import { ISLAND_DEFS } from '../../../../shared/islands.js'
import { getItem } from '../../../../shared/items.js'
import { TILE_INFO } from '../../../../shared/tiles.js'

// ---- Online Players Window ----
export function OnlinePlayersWindow({ active, onlinePlayers, currentIsland, onClose, onInspect }) {
  if (!active) return null
  const onMyIsland = onlinePlayers.filter(p => p.currentIsland === currentIsland)
  const elsewhere = onlinePlayers.filter(p => p.currentIsland !== currentIsland)

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="mythral-window" onClick={e => e.stopPropagation()} style={{ width: 480, maxWidth: '95vw', maxHeight: '85vh' }}>
        <div className="mythral-window-header">
          <span>👥 Online Players ({onlinePlayers.length})</span>
          <button className="mythral-window-close" onClick={onClose}>×</button>
        </div>
        <div className="mythral-window-body">
          <div className="online-section">
            <div className="text-gold text-sm font-bold mb-1">ON YOUR ISLAND ({onMyIsland.length})</div>
            {onMyIsland.length === 0 && <div className="text-dim text-sm">No one else here.</div>}
            {onMyIsland.map(p => (
              <div key={p.id} className="online-row">
                <div className="online-portrait" style={{ background: p.classDef?.color }}>{p.classDef?.icon}</div>
                <div className="online-info">
                  <div className="online-name" style={{ color: p.classDef?.color }}>{p.name}</div>
                  <div className="text-xs text-dim">Lv {p.level} {p.classDef?.name}</div>
                </div>
                <button className="mythral-btn text-sm" onClick={() => onInspect(p.id)}>Inspect</button>
              </div>
            ))}
          </div>
          <div className="online-section mt-4">
            <div className="text-gold text-sm font-bold mb-1">ELSEWHERE ({elsewhere.length})</div>
            {elsewhere.length === 0 && <div className="text-dim text-sm">No one else online.</div>}
            {elsewhere.map(p => {
              const isl = ISLAND_DEFS[p.currentIsland]
              return (
                <div key={p.id} className="online-row">
                  <div className="online-portrait" style={{ background: p.classDef?.color }}>{p.classDef?.icon}</div>
                  <div className="online-info">
                    <div className="online-name" style={{ color: p.classDef?.color }}>{p.name}</div>
                    <div className="text-xs text-dim">Lv {p.level} {p.classDef?.name} · {isl?.name}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Player Inspect Window ----
export function PlayerInspectWindow({ inspectData, onClose }) {
  if (!inspectData) return null
  const cls = CLASSES[inspectData.class]
  const isl = ISLAND_DEFS[inspectData.currentIsland]
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="mythral-window" onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '95vw' }}>
        <div className="mythral-window-header">
          <span>👤 {inspectData.name}</span>
          <button className="mythral-window-close" onClick={onClose}>×</button>
        </div>
        <div className="mythral-window-body">
          <div className="char-portrait-section">
            <div className="char-portrait" style={{ background: inspectData.classDef?.color }}>
              <span style={{ fontSize: 40 }}>{inspectData.classDef?.icon}</span>
            </div>
            <div className="char-portrait-info">
              <div className="char-portrait-name">{inspectData.name}</div>
              <div className="char-portrait-class" style={{ color: inspectData.classDef?.color }}>
                Level {inspectData.level} {inspectData.classDef?.name}
              </div>
              <div className="text-xs text-dim mt-1">Currently on: {isl?.name}</div>
              <div className="text-xs text-gold mt-1">Bosses slain: {inspectData.killedBosses?.length || 0}</div>
              <div className="text-xs text-dim">Islands visited: {inspectData.visitedIslands?.length || 0}</div>
            </div>
          </div>
          <div className="char-stats-section mt-4">
            <div className="text-gold text-sm font-bold mb-1">COMBAT STATS</div>
            <div className="char-stats-grid">
              <div className="char-stat"><span>❤ HP</span><span className="font-bold text-red">{inspectData.hp}/{inspectData.maxHp}</span></div>
              <div className="char-stat"><span>✦ MP</span><span className="font-bold text-blue">{inspectData.mp}/{inspectData.maxMp}</span></div>
              <div className="char-stat"><span>⚔ Attack</span><span className="font-bold text-gold">{inspectData.stats?.attack}</span></div>
              <div className="char-stat"><span>🛡 Defense</span><span className="font-bold text-green">{inspectData.stats?.defense}</span></div>
              <div className="char-stat"><span>✧ Magic</span><span className="font-bold text-purple">{inspectData.stats?.magic}</span></div>
              <div className="char-stat"><span>⚡ Speed</span><span className="font-bold text-blue">{inspectData.stats?.speed}</span></div>
            </div>
          </div>
          <div className="char-skills-section mt-4">
            <div className="text-gold text-sm font-bold mb-1">EQUIPMENT</div>
            <div className="equipment-slots" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
              {['helmet', 'weapon', 'armor', 'shield', 'boots', 'trinket'].map(slot => {
                const eqId = inspectData.equipment?.[slot]
                const item = eqId ? getItem(eqId) : null
                return (
                  <div key={slot} className={`equipment-slot ${item ? 'filled' : ''}`} style={{ aspectRatio: 'auto', padding: 8, minHeight: 50 }}>
                    <div className="equipment-slot-label">{slot.toUpperCase()}</div>
                    {item ? (
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <div style={{ fontSize: 22 }}>{item.icon}</div>
                        <div style={{ fontSize: 10, color: '#d4c4a8' }}>{item.name}</div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', marginTop: 12, color: '#57534e' }}>—</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Leaderboard Window ----
export function LeaderboardWindow({ active, leaderboard, onClose }) {
  if (!active) return null
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="mythral-window" onClick={e => e.stopPropagation()} style={{ width: 560, maxWidth: '95vw', maxHeight: '85vh' }}>
        <div className="mythral-window-header">
          <span>🏆 Leaderboard</span>
          <button className="mythral-window-close" onClick={onClose}>×</button>
        </div>
        <div className="mythral-window-body">
          {leaderboard.length === 0 ? (
            <div className="text-dim text-center p-4">No characters yet. Be the first!</div>
          ) : (
            <div className="leaderboard-list">
              {leaderboard.map((entry, i) => (
                <div key={i} className={`leaderboard-row ${i < 3 ? `rank-${i + 1}` : ''}`}>
                  <div className="leaderboard-rank">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${entry.rank}`}
                  </div>
                  <div className="leaderboard-portrait" style={{ background: entry.classDef?.color }}>
                    {entry.classDef?.icon}
                  </div>
                  <div className="leaderboard-info">
                    <div className="leaderboard-name" style={{ color: entry.classDef?.color }}>{entry.name}</div>
                    <div className="text-xs text-dim">Lv {entry.level} {entry.classDef?.name}</div>
                  </div>
                  <div className="leaderboard-extra">
                    <div className="text-xs text-gold">★ {entry.killedBosses} bosses</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Settings Window ----
export function SettingsWindow({ active, settings, onUpdate, onClose, onLogout }) {
  if (!active) return null
  const toggle = (key) => () => onUpdate({ [key]: !settings[key] })
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="mythral-window" onClick={e => e.stopPropagation()} style={{ width: 400, maxWidth: '95vw' }}>
        <div className="mythral-window-header">
          <span>⚙ Settings</span>
          <button className="mythral-window-close" onClick={onClose}>×</button>
        </div>
        <div className="mythral-window-body">
          <div className="settings-row">
            <div>
              <div className="font-bold">Damage Numbers</div>
              <div className="text-xs text-dim">Show floating damage/heal/XP numbers</div>
            </div>
            <button className={`toggle-btn ${settings.showDamageNumbers ? 'on' : 'off'}`} onClick={toggle('showDamageNumbers')}>
              {settings.showDamageNumbers ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="settings-row">
            <div>
              <div className="font-bold">Chat Box</div>
              <div className="text-xs text-dim">Show island chat panel</div>
            </div>
            <button className={`toggle-btn ${settings.showChat ? 'on' : 'off'}`} onClick={toggle('showChat')}>
              {settings.showChat ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="settings-row">
            <div>
              <div className="font-bold">Mini-map</div>
              <div className="text-xs text-dim">Show corner mini-map</div>
            </div>
            <button className={`toggle-btn ${settings.showMinimap ? 'on' : 'off'}`} onClick={toggle('showMinimap')}>
              {settings.showMinimap ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="settings-row">
            <div>
              <div className="font-bold">Auto-loot</div>
              <div className="text-xs text-dim">Automatically pick up monster drops</div>
            </div>
            <button className={`toggle-btn ${settings.autoLoot ? 'on' : 'off'}`} onClick={toggle('autoLoot')}>
              {settings.autoLoot ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="settings-row">
            <div>
              <div className="font-bold">Movement Mode</div>
              <div className="text-xs text-dim">Tap-to-move pathfinding for click/touch</div>
            </div>
            <div className="settings-mode-buttons">
              <button
                className={`mode-btn ${(settings.movementMode || 'both') === 'tap' ? 'active' : ''}`}
                onClick={() => onUpdate({ movementMode: 'tap' })}
              >Tap</button>
              <button
                className={`mode-btn ${(settings.movementMode || 'both') === 'wasd' ? 'active' : ''}`}
                onClick={() => onUpdate({ movementMode: 'wasd' })}
              >WASD</button>
              <button
                className={`mode-btn ${(settings.movementMode || 'both') === 'both' ? 'active' : ''}`}
                onClick={() => onUpdate({ movementMode: 'both' })}
                >Both</button>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <div className="font-bold">Compact HUD</div>
              <div className="text-xs text-dim">Hide less-critical info for more screen space</div>
            </div>
            <button className={`toggle-btn ${settings.compactHud ? 'on' : 'off'}`} onClick={toggle('compactHud')}>
              {settings.compactHud ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="settings-row">
            <div>
              <div className="font-bold">Left-handed</div>
              <div className="text-xs text-dim">Swap joystick & actions to opposite thumbs</div>
            </div>
            <button className={`toggle-btn ${settings.leftHanded ? 'on' : 'off'}`} onClick={toggle('leftHanded')}>
              {settings.leftHanded ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="settings-row">
            <div>
              <div className="font-bold">Joystick Size</div>
              <div className="text-xs text-dim">On-screen movement control size</div>
            </div>
            <div className="settings-mode-buttons">
              <button className={`mode-btn ${(settings.joystickSize || 'medium') === 'small' ? 'active' : ''}`} onClick={() => onUpdate({ joystickSize: 'small' })}>S</button>
              <button className={`mode-btn ${(settings.joystickSize || 'medium') === 'medium' ? 'active' : ''}`} onClick={() => onUpdate({ joystickSize: 'medium' })}>M</button>
              <button className={`mode-btn ${(settings.joystickSize || 'medium') === 'large' ? 'active' : ''}`} onClick={() => onUpdate({ joystickSize: 'large' })}>L</button>
            </div>
          </div>
          <div className="settings-divider" />
          <div className="text-xs text-dim mb-2">Settings are saved to your browser localStorage.</div>
          <button className="mythral-btn mythral-btn-danger w-full" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Mini-map (corner widget) ----
export function MiniMap({ map, player, monsters, npcs, otherPlayers, currentIsland }) {
  if (!map || !player) return null
  const w = map[0].length, h = map.length
  const scale = 3  // pixels per tile
  const mw = w * scale, mh = h * scale
  // Sample tiles (every other tile for performance)
  const tiles = []
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const t = map[y][x]
      const info = TILE_INFO[t]
      if (!info) continue
      // Skip water (transparent) to show background
      if (t === 0 || t === 1) continue
      tiles.push(
        <div key={`${x}-${y}`} style={{
          position: 'absolute',
          left: x * scale, top: y * scale,
          width: scale, height: scale,
          background: info.color,
        }} />
      )
    }
  }
  return (
    <div className="minimap-container" style={{ width: mw, height: mh }}>
      <div className="minimap-tiles">{tiles}</div>
      {/* NPCs */}
      {npcs.map(n => (
        <div key={n.id} className="minimap-dot npc" style={{
          left: n.x * scale - 1, top: n.y * scale - 1,
        }} title={n.name} />
      ))}
      {/* Monsters */}
      {monsters.map(m => (
        <div key={m.id} className={`minimap-dot monster ${m.boss ? 'boss' : ''}`} style={{
          left: m.x * scale - 1, top: m.y * scale - 1,
          background: m.boss ? '#fbbf24' : '#f87171',
        }} title={m.name} />
      ))}
      {/* Other players */}
      {otherPlayers.map(p => (
        <div key={p.id} className="minimap-dot player" style={{
          left: p.x * scale - 1, top: p.y * scale - 1,
        }} title={p.name} />
      ))}
      {/* Self */}
      <div className="minimap-dot self" style={{
        left: player.x * scale - 2, top: player.y * scale - 2,
      }} />
      <div className="minimap-label">{currentIsland?.name}</div>
    </div>
  )
}

// ---- Connection status indicator ----
export function ConnectionIndicator({ connectionState, kickReason }) {
  const config = {
    connected: { color: '#4ade80', label: 'Connected' },
    connecting: { color: '#fbbf24', label: 'Connecting...' },
    disconnected: { color: '#f87171', label: kickReason || 'Disconnected' },
    kicked: { color: '#dc2626', label: 'Kicked' },
  }
  const c = config[connectionState] || config.disconnected
  const showSpinner = connectionState === 'connecting'
  return (
    <div className={`connection-indicator ${connectionState !== 'connected' ? 'connection-warn' : ''}`}>
      <span className="connection-dot" style={{ background: c.color }} />
      {showSpinner && <span className="connection-spin" />}
      <span style={{ color: c.color }}>{c.label}</span>
      {kickReason && <span className="text-dim text-xs" style={{ marginLeft: 6 }}>{kickReason}</span>}
    </div>
  )
}
