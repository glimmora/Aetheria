// ============================================================
// Aetheria: Nine Isles - Quest Log Window
// ============================================================

import React, { useState } from 'react'
import { QUESTS, getQuestsForIsland } from '../../../../shared/quests.js'
import { QUEST_STATUS, getQuestProgressText } from '../../../../shared/quests.js'
import { ISLAND_DEFS } from '../../../../shared/islands.js'
import { getItem } from '../../../../shared/items.js'

export default function QuestLogWindow({ active, player, inventory, killCounts, questProgress, currentIsland, onClose }) {
  const [filter, setFilter] = useState('active')
  if (!active || !player) return null

  const allQuests = Object.values(QUESTS)
  const activeQuests = allQuests.filter(q => questProgress[q.id] === QUEST_STATUS.ACTIVE)
  const completeQuests = allQuests.filter(q => questProgress[q.id] === QUEST_STATUS.COMPLETE)
  const turnedInQuests = allQuests.filter(q => questProgress[q.id] === QUEST_STATUS.TURNED_IN)
  const availableQuests = allQuests.filter(q =>
    !questProgress[q.id] && player.level >= q.minLevel &&
    ISLAND_DEFS[q.island] && (player.level >= ISLAND_DEFS[q.island].levelRange[0] - 2)
  )

  let shownQuests = []
  if (filter === 'active') shownQuests = activeQuests
  else if (filter === 'complete') shownQuests = completeQuests
  else if (filter === 'done') shownQuests = turnedInQuests
  else if (filter === 'available') shownQuests = availableQuests

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="questlog-window aetheria-window" onClick={e => e.stopPropagation()} style={{ width: 720, maxWidth: '95vw', maxHeight: '85vh' }}>
        <div className="aetheria-window-header">
          <span>❗ Quest Log</span>
          <button className="aetheria-window-close" onClick={onClose}>×</button>
        </div>
        <div className="aetheria-window-body">
          <div className="questlog-tabs">
            <button className={`questlog-tab ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>
              Active ({activeQuests.length})
            </button>
            <button className={`questlog-tab ${filter === 'complete' ? 'active' : ''}`} onClick={() => setFilter('complete')}>
              Ready to Turn In ({completeQuests.length})
            </button>
            <button className={`questlog-tab ${filter === 'available' ? 'active' : ''}`} onClick={() => setFilter('available')}>
              Available ({availableQuests.length})
            </button>
            <button className={`questlog-tab ${filter === 'done' ? 'active' : ''}`} onClick={() => setFilter('done')}>
              Completed ({turnedInQuests.length})
            </button>
          </div>

          <div className="questlog-list">
            {shownQuests.length === 0 && (
              <div className="text-dim text-center p-4">
                No quests in this category. {filter === 'available' && 'Talk to NPCs (marked with !) to accept quests.'}
              </div>
            )}
            {shownQuests.map(q => {
              const state = questProgress[q.id] || QUEST_STATUS.AVAILABLE
              const island = ISLAND_DEFS[q.island]
              const progressText = state === QUEST_STATUS.ACTIVE ? getQuestProgressText(q, inventory, killCounts) : ''
              return (
                <div key={q.id} className="questlog-entry">
                  <div className="questlog-entry-header">
                    <span className="font-bold text-gold">{q.title}</span>
                    <span className="text-xs text-dim">{island?.name}</span>
                  </div>
                  <div className="text-sm text-dim">{q.description}</div>
                  {progressText && <div className="text-sm text-green mt-1">📊 {progressText}</div>}
                  <div className="questlog-reward text-xs">
                    <span className="text-gold">⭐ {q.reward.xp} XP</span>
                    <span className="text-gold">🪙 {q.reward.gold}</span>
                    {q.reward.items?.map((item, i) => {
                      const def = getItem(item.id)
                      return def ? <span key={i}>{def.icon} {def.name}</span> : null
                    })}
                  </div>
                  {state === QUEST_STATUS.COMPLETE && (
                    <div className="text-green text-sm font-bold mt-1">✅ Return to {q.giver.split(' ').slice(1).join(' ')} to turn in!</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
