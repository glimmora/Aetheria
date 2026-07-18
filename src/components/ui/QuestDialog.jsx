// ============================================================
// Aetheria: Nine Isles - Quest Dialog (accept/turn-in)
// ============================================================

import React from 'react'
import { getItem } from '../../data/items.js'
import { QUEST_STATUS, getQuestProgressText } from '../../systems/quests.js'

export default function QuestDialog({ activeQuestDialog, player, inventory, killCounts, questProgress, onClose, onAccept, onTurnIn }) {
  if (!activeQuestDialog) return null
  const { npc, quest } = activeQuestDialog
  const state = questProgress[quest.id] || QUEST_STATUS.AVAILABLE
  const canAccept = player.level >= quest.minLevel
  const progressText = state === QUEST_STATUS.ACTIVE ? getQuestProgressText(quest, inventory, killCounts) : ''

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="quest-window aetheria-window" onClick={e => e.stopPropagation()} style={{ width: 540, maxWidth: '90vw' }}>
        <div className="aetheria-window-header">
          <span>❗ {quest.title}</span>
          <button className="aetheria-window-close" onClick={onClose}>×</button>
        </div>
        <div className="aetheria-window-body">
          <div className="quest-meta">
            <span className="quest-meta-item">📍 {quest.island.replace(/_/g, ' ')}</span>
            <span className="quest-meta-item">⭐ Req Lv {quest.minLevel}</span>
            <span className="quest-meta-item">🏷 {quest.type}</span>
          </div>

          <div className="quest-description">
            <div className="text-gold text-sm font-bold mb-1">QUEST DESCRIPTION</div>
            <p>{quest.description}</p>
          </div>

          <div className="quest-objective">
            <div className="text-gold text-sm font-bold mb-1">OBJECTIVE</div>
            {quest.type === 'kill' || quest.type === 'boss' ? (
              <p>Slay {quest.target.count} {quest.target.monster.replace(/_/g, ' ')}{quest.target.count > 1 ? 's' : ''}</p>
            ) : quest.type === 'collect' ? (
              <p>Collect {quest.target.count} {getItem(quest.target.item)?.name || quest.target.item}</p>
            ) : null}
            {progressText && <p className="text-green text-sm">{progressText}</p>}
          </div>

          <div className="quest-rewards">
            <div className="text-gold text-sm font-bold mb-1">REWARDS</div>
            <div className="quest-reward-list">
              <span className="quest-reward">⭐ {quest.reward.xp} XP</span>
              <span className="quest-reward">🪙 {quest.reward.gold} gold</span>
              {quest.reward.items?.map((item, i) => {
                const def = getItem(item.id)
                return def ? (
                  <span key={i} className="quest-reward">{def.icon} {def.name} x{item.qty}</span>
                ) : null
              })}
            </div>
          </div>

          <div className="quest-actions mt-4">
            {state === QUEST_STATUS.AVAILABLE && (
              <>
                {!canAccept && <span className="text-red text-sm">Requires level {quest.minLevel}.</span>}
                <button className="aetheria-btn aetheria-btn-success" disabled={!canAccept} onClick={() => onAccept(quest.id)}>
                  Accept Quest
                </button>
                <button className="aetheria-btn" onClick={onClose}>Decline</button>
              </>
            )}
            {state === QUEST_STATUS.ACTIVE && (
              <button className="aetheria-btn" onClick={onClose}>In Progress...</button>
            )}
            {state === QUEST_STATUS.COMPLETE && (
              <>
                <div className="text-green text-sm font-bold">✅ Quest Complete! Turn in for your reward.</div>
                <button className="aetheria-btn aetheria-btn-success" onClick={() => onTurnIn(quest.id)}>
                  Turn In
                </button>
                <button className="aetheria-btn" onClick={onClose}>Later</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
