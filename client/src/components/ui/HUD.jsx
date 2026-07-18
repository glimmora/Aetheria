// ============================================================
// Mythral - HUD (top bar + skill bar + log)
// ============================================================

import React from 'react'
import { computePlayerStats } from '../../../../shared/combat.js'
import { getSkillsForClass } from '../../../../shared/classes.js'
import { xpForLevel } from '../../../../shared/combat.js'

export default function HUD({
  player, currentIsland, combatLog,
  onToggleInventory, onToggleQuestLog, onToggleCharacter, onToggleMap, onToggleHelp,
  onToggleOnline, onToggleLeaderboard, onToggleSettings,
  onUseSkill, targetMonster, gameTime,
  serverStats, onlineCount,
}) {
  if (!player) return null
  const stats = computePlayerStats(player)
  const hpPct = (player.hp / stats.hp) * 100
  const mpPct = (player.mp / stats.mp) * 100
  const xpPct = (player.xp / xpForLevel(player.level)) * 100
  const skills = getSkillsForClass(player.class, player.level)
  const islandName = currentIsland?.name || (typeof currentIsland === 'string' ? currentIsland.replace(/_/g, ' ') : '')

  return (
    <>
      {/* Top bar */}
      <div className="hud-top">
        <div className="hud-player-info">
          <div className="hud-portrait" style={{ background: player.classDef?.color }}>
            {player.classDef?.icon}
          </div>
          <div className="hud-bars">
            <div className="hud-name-row">
              <span className="hud-name">{player.name}</span>
              <span className="hud-class">Lv {player.level} {player.classDef?.name}</span>
            </div>
            <div className="hud-bar hp-bar">
              <div className="hud-bar-fill" style={{ width: `${hpPct}%`, background: 'linear-gradient(180deg, #ef4444 0%, #991b1b 100%)' }} />
              <span className="hud-bar-text">{player.hp} / {stats.hp}</span>
            </div>
            <div className="hud-bar mp-bar">
              <div className="hud-bar-fill" style={{ width: `${mpPct}%`, background: 'linear-gradient(180deg, #3b82f6 0%, #1e3a8a 100%)' }} />
              <span className="hud-bar-text">{player.mp} / {stats.mp}</span>
            </div>
            <div className="hud-bar xp-bar">
              <div className="hud-bar-fill" style={{ width: `${xpPct}%`, background: 'linear-gradient(180deg, #fbbf24 0%, #b45309 100%)' }} />
              <span className="hud-bar-text">XP {player.xp} / {xpForLevel(player.level)}</span>
            </div>
          </div>
        </div>

        <div className="hud-location">
          <div className="hud-island-name">{islandName}</div>
          <div className="hud-stats">
            <span className="hud-stat">⚔ {stats.attack}</span>
            <span className="hud-stat">🛡 {stats.defense}</span>
            <span className="hud-stat">✧ {stats.magic}</span>
            <span className="hud-stat">⚡ {stats.speed}</span>
          </div>
        </div>

        <div className="hud-resource">
          <div className="hud-online-count">👥 {onlineCount || 0} online</div>
          <div className="hud-gold">🪙 {player.gold}</div>
          <div className="hud-buttons">
            <button className="hud-btn" onClick={onToggleCharacter} title="Character (C)">C</button>
            <button className="hud-btn" onClick={onToggleInventory} title="Inventory (I)">I</button>
            <button className="hud-btn" onClick={onToggleQuestLog} title="Quest Log (Q)">Q</button>
            <button className="hud-btn" onClick={onToggleMap} title="World Map (M)">M</button>
            <button className="hud-btn" onClick={onToggleOnline} title="Online Players (P)">P</button>
            <button className="hud-btn" onClick={onToggleLeaderboard} title="Leaderboard (L)">L</button>
            <button className="hud-btn" onClick={onToggleHelp} title="Help (?)">?</button>
            <button className="hud-btn" onClick={onToggleSettings} title="Settings">⚙</button>
          </div>
        </div>
      </div>

      {/* Skill bar */}
      <div className="hud-skill-bar">
        {skills.slice(0, 6).map((skill, i) => {
          const cd = player.skillCooldowns?.[skill.id] || 0
          const cdRemaining = Math.max(0, skill.cooldown - (gameTime - cd))
          const cdPct = cdRemaining > 0 ? (cdRemaining / skill.cooldown) * 100 : 0
          const canUse = player.mp >= skill.manaCost && cdRemaining === 0
          return (
            <button
              key={skill.id}
              className={`skill-slot ${canUse ? 'ready' : 'cooldown'}`}
              onClick={() => onUseSkill(skill.id, targetMonster)}
              title={`${skill.name}\n${skill.description}\nMP: ${skill.manaCost}\nCooldown: ${skill.cooldown / 1000}s`}
            >
              <span className="skill-key">{i + 1}</span>
              <span className="skill-icon">{SKILL_ICONS[skill.id] || '✦'}</span>
              <span className="skill-name">{skill.name}</span>
              <span className="skill-cost">{skill.manaCost} MP</span>
              {cdRemaining > 0 && (
                <div className="skill-cooldown-overlay" style={{ height: `${cdPct}%` }}>
                  <span>{(cdRemaining / 1000).toFixed(1)}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Combat log */}
      <div className="hud-combat-log">
        {combatLog.slice(-8).map(entry => (
          <div key={entry.id} className={`log-entry log-${entry.type}`}>{entry.msg}</div>
        ))}
      </div>
    </>
  )
}

const SKILL_ICONS = {
  power_strike: '⚔',
  whirlwind: '🌀',
  berserk: '🔥',
  firebolt: '🔥',
  frost_nova: '❄',
  meteor: '☄',
  quick_shot: '➷',
  bear_trap: '🪤',
  multi_shot: '➹',
  heal: '✚',
  lesser_heal: '✚',
  smite: '☀',
  sanctuary: '🛡',
}
