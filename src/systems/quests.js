// ============================================================
// Aetheria: Nine Isles - Quest system
// ============================================================

import { QUESTS, getQuest } from '../data/quests.js'

export const QUEST_STATUS = {
  AVAILABLE: 'available',
  ACTIVE: 'active',
  COMPLETE: 'complete',
  TURNED_IN: 'turned_in',
}

export function getQuestState(questProgress, questId) {
  return questProgress[questId] || QUEST_STATUS.AVAILABLE
}

export function canAcceptQuest(player, questProgress, questId) {
  const quest = getQuest(questId)
  if (!quest) return false
  const state = getQuestState(questProgress, questId)
  if (state !== QUEST_STATUS.AVAILABLE) return false
  if (player.level < quest.minLevel) return false
  return true
}

export function acceptQuest(questProgress, questId) {
  return { ...questProgress, [questId]: QUEST_STATUS.ACTIVE }
}

// Called when player kills a monster - update kill quests
export function onMonsterKilled(questProgress, monsterId) {
  const updated = { ...questProgress }
  for (const quest of Object.values(QUESTS)) {
    const state = updated[quest.id]
    if (state !== QUEST_STATUS.ACTIVE) continue
    if (quest.type !== 'kill' && quest.type !== 'boss') continue
    if (quest.target.monster !== monsterId) continue
    // we track count in a separate field; mark complete when count met (handled in Game)
  }
  return updated
}

// Check quest completion based on player state
export function checkQuestCompletion(player, inventory, questProgress, killCounts = {}) {
  const updated = { ...questProgress }
  const newlyCompleted = []
  for (const quest of Object.values(QUESTS)) {
    if (updated[quest.id] !== QUEST_STATUS.ACTIVE) continue
    let done = false
    if (quest.type === 'kill' || quest.type === 'boss') {
      done = (killCounts[quest.target.monster] || 0) >= quest.target.count
    } else if (quest.type === 'collect') {
      const have = inventory.filter(i => i.id === quest.target.item).reduce((s, i) => s + i.qty, 0)
      done = have >= quest.target.count
    }
    if (done) {
      updated[quest.id] = QUEST_STATUS.COMPLETE
      newlyCompleted.push(quest.id)
    }
  }
  return { questProgress: updated, newlyCompleted }
}

// Turn in a quest: give rewards, mark turned_in
export function turnInQuest(player, inventory, questProgress, questId) {
  const quest = getQuest(questId)
  if (!quest) return { player, inventory, questProgress }
  if (questProgress[questId] !== QUEST_STATUS.COMPLETE) {
    return { player, inventory, questProgress }
  }
  const updated = { ...questProgress, [questId]: QUEST_STATUS.TURNED_IN }
  // remove collected items
  let newInv = inventory
  if (quest.type === 'collect') {
    let remaining = quest.target.count
    const filtered = []
    for (const inv of inventory) {
      if (inv.id === quest.target.item && remaining > 0) {
        if (inv.qty > remaining) {
          filtered.push({ ...inv, qty: inv.qty - remaining })
          remaining = 0
        } else {
          remaining -= inv.qty
        }
      } else {
        filtered.push(inv)
      }
    }
    newInv = filtered
  }
  // apply rewards
  const newPlayer = { ...player }
  newPlayer.gold = (newPlayer.gold || 0) + (quest.reward.gold || 0)
  if (quest.reward.items) {
    for (const item of quest.reward.items) {
      newInv = addItemToInventoryHelper(newInv, item.id, item.qty)
    }
  }
  // XP handled separately to show level-up animation
  newPlayer.pendingXp = (newPlayer.pendingXp || 0) + (quest.reward.xp || 0)
  return { player: newPlayer, inventory: newInv, questProgress: updated }
}

function addItemToInventoryHelper(inventory, itemId, qty) {
  // mirror of inventory.js
  const existing = inventory.find(i => i.id === itemId)
  if (existing) {
    return inventory.map(i => i.id === itemId ? { ...i, qty: i.qty + qty } : i)
  }
  return [...inventory, { id: itemId, qty }]
}

// Get progress text for a quest
export function getQuestProgressText(quest, inventory, killCounts) {
  if (quest.type === 'kill' || quest.type === 'boss') {
    const cur = killCounts[quest.target.monster] || 0
    return `${Math.min(cur, quest.target.count)} / ${quest.target.count} ${quest.target.monster.replace(/_/g, ' ')} slain`
  }
  if (quest.type === 'collect') {
    const cur = inventory.filter(i => i.id === quest.target.item).reduce((s, i) => s + i.qty, 0)
    return `${Math.min(cur, quest.target.count)} / ${quest.target.count} collected`
  }
  return ''
}
