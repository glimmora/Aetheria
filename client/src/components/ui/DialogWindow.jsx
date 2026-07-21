// ============================================================
// Mythral - NPC Dialog Window
// ============================================================

import React from 'react'
import { QUESTS } from '../../../../shared/quests.js'
import { QUEST_STATUS } from '../../../../shared/quests.js'

export default function DialogWindow({ activeDialog, questProgress, onClose, onOpenShop, onOpenQuest, onOpenTravel }) {
  if (!activeDialog) return null
  const npc = activeDialog.npc
  // Quest can be a string or array of quest IDs
  const questIds = npc.quest ? (Array.isArray(npc.quest) ? npc.quest : [npc.quest]) : []
  const quests = questIds.map(qid => QUESTS[qid]).filter(Boolean)
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-window mythral-window" onClick={e => e.stopPropagation()} style={{ width: 520, maxWidth: '90vw' }}>
        <div className="mythral-window-header">
          <span>{npc.name}</span>
          <button className="mythral-window-close" onClick={onClose}>×</button>
        </div>
        <div className="mythral-window-body">
          <div className="dialog-npc-info">
            <div className="dialog-npc-portrait" style={{ background: npc.color }}>
              {npc.name[0]}
            </div>
            <div>
              <div className="dialog-npc-name" style={{ color: npc.color }}>{npc.name}</div>
              <div className="dialog-npc-role text-dim text-sm">{npc.role}</div>
            </div>
          </div>

          <div className="dialog-text">{npc.dialog}</div>

          <div className="dialog-actions">
            {npc.shop && (
              <button className="mythral-btn" onClick={() => onOpenShop(npc)}>
                🛒 Trade
              </button>
            )}
            {quests.map(q => {
              const state = questProgress[q.id] || QUEST_STATUS.AVAILABLE
              if (state === QUEST_STATUS.AVAILABLE) {
                return (
                  <button key={q.id} className="mythral-btn mythral-btn-primary" onClick={() => onOpenQuest({ ...npc, quest: q.id })}>
                    ❗ Quest: {q.title}
                  </button>
                )
              }
              if (state === QUEST_STATUS.ACTIVE) {
                return (
                  <button key={q.id} className="mythral-btn" disabled>
                    ⏳ {q.title} (In Progress)
                  </button>
                )
              }
              if (state === QUEST_STATUS.COMPLETE) {
                return (
                  <button key={q.id} className="mythral-btn mythral-btn-success" onClick={() => onOpenQuest({ ...npc, quest: q.id })}>
                    ✅ Turn In: {q.title}
                  </button>
                )
              }
              return (
                <button key={q.id} className="mythral-btn" disabled>
                  ✓ {q.title} (Done)
                </button>
              )
            })}
            {npc.travel && (
              <button className="mythral-btn mythral-btn-primary" onClick={() => onOpenTravel(npc)}>
                ⚓ Travel
              </button>
            )}
            <button className="mythral-btn" onClick={onClose}>Farewell</button>
          </div>
        </div>
      </div>
    </div>
  )
}
