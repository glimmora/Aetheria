// ============================================================
// Mythral Server - Security & Validation helpers
// Anti-cheat: action locks, proximity checks, sanitization,
// audit logging. Every player action must pass through these.
// ============================================================

import { getItem, isEquipment } from '../shared/items.js'
import { SKILLS, getSkillsForClass } from '../shared/classes.js'
import { QUESTS, QUEST_STATUS } from '../shared/quests.js'
import { ISLAND_DEFS } from '../shared/islands.js'

// ---- Action Lock (per-session mutex) ----
// Prevents race conditions where a player sends two actions simultaneously
// that could both read+modify the same state (e.g., equip + sell same item).
const sessionLocks = new Map()

export function acquireLock(socketId) {
  if (sessionLocks.has(socketId)) return false
  sessionLocks.set(socketId, true)
  return true
}

export function releaseLock(socketId) {
  sessionLocks.delete(socketId)
}

// Wrapper: runs fn with an action lock, auto-releases on completion/error
export function withLock(socketId, fn) {
  if (!acquireLock(socketId)) return null // another action in progress
  try {
    return fn()
  } finally {
    releaseLock(socketId)
  }
}

// ---- Audit logging for suspicious actions ----
const suspiciousActions = []
const MAX_AUDIT_LOG = 500

export function logSuspicious(socketId, username, action, detail) {
  const entry = {
    time: new Date().toISOString(),
    socketId,
    username,
    action,
    detail: String(detail).slice(0, 200),
  }
  suspiciousActions.push(entry)
  if (suspiciousActions.length > MAX_AUDIT_LOG) {
    suspiciousActions.shift()
  }
  console.warn(`[SECURITY] ${entry.username} (${entry.action}): ${entry.detail}`)
}

export function getSuspiciousLog() {
  return [...suspiciousActions]
}

// ---- Movement validation ----
export function validateMovement(dx, dy) {
  // Must be exactly one tile in one cardinal direction
  if (!Number.isInteger(dx) || !Number.isInteger(dy)) return false
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) return false
  if (dx !== 0 && dy !== 0) return false  // no diagonal
  if (dx === 0 && dy === 0) return false  // must move
  return true
}

// ---- Combat target validation ----
export function validateAttackTarget(session, monster, island) {
  if (!session || !session.character) return { ok: false, reason: 'no session' }
  if (!monster) return { ok: false, reason: 'monster not found' }
  if (monster.hp <= 0) return { ok: false, reason: 'monster already dead' }
  // Monster must be on the player's island
  if (!island || !island.monsters.has(monster.id)) {
    return { ok: false, reason: 'monster not on this island' }
  }
  const c = session.character
  if (c.hp <= 0) return { ok: false, reason: 'player is dead' }
  return { ok: true }
}

// ---- Skill validation ----
export function validateSkillUse(session, skillId) {
  if (!session || !session.character) return { ok: false, reason: 'no session' }
  const c = session.character
  const skill = SKILLS[skillId]
  if (!skill) return { ok: false, reason: 'skill does not exist' }
  // Skill must belong to the player's class
  if (skill.class !== c.class) {
    return { ok: false, reason: `skill does not belong to class ${c.class}` }
  }
  // Player must meet unlock level
  if (skill.unlockLevel && c.level < skill.unlockLevel) {
    return { ok: false, reason: `skill requires level ${skill.unlockLevel}` }
  }
  if (c.hp <= 0) return { ok: false, reason: 'player is dead' }
  return { ok: true, skill }
}

// ---- Equipment validation ----
export function validateEquip(session, itemId) {
  if (!session || !session.character) return { ok: false, reason: 'no session' }
  const c = session.character
  const item = getItem(itemId)
  if (!item) return { ok: false, reason: 'item does not exist' }
  if (!isEquipment(item)) return { ok: false, reason: 'item is not equipment' }
  // Class restriction
  if (item.class && item.class !== c.class) {
    return { ok: false, reason: `item is for ${item.class}, not ${c.class}` }
  }
  // Level requirement
  if (item.reqLevel && c.level < item.reqLevel) {
    return { ok: false, reason: `requires level ${item.reqLevel}` }
  }
  if (c.hp <= 0) return { ok: false, reason: 'player is dead' }
  return { ok: true, item }
}

// ---- NPC proximity validation ----
// Player must be within `range` tiles of the NPC to interact
export function validateNpcProximity(session, island, npcId, range = 3) {
  if (!session || !session.character) return { ok: false, reason: 'no session' }
  if (!island) return { ok: false, reason: 'island not found' }
  const c = session.character
  const npc = island.npcs.find(n => n.id === npcId)
  if (!npc) return { ok: false, reason: 'npc not found on this island' }
  const dist = Math.abs(c.x - npc.x) + Math.abs(c.y - npc.y)
  if (dist > range) {
    return { ok: false, reason: `too far from npc (dist=${dist})` }
  }
  if (c.hp <= 0) return { ok: false, reason: 'player is dead' }
  return { ok: true, npc }
}

// ---- Shop buy validation ----
export function validateShopBuy(session, island, npcId, itemId, qty) {
  const proxCheck = validateNpcProximity(session, island, npcId, 3)
  if (!proxCheck.ok) return proxCheck
  const npc = proxCheck.npc
  if (!npc.shop) return { ok: false, reason: 'npc has no shop' }
  const entry = npc.shop.items.find(i => i.id === itemId)
  if (!entry) return { ok: false, reason: 'item not in this shop' }
  // Qty bounds
  if (!Number.isInteger(qty) || qty < 1) return { ok: false, reason: 'invalid qty' }
  if (qty > 99) return { ok: false, reason: 'qty too large' }
  const c = session.character
  const total = entry.price * qty
  if (c.gold < total) return { ok: false, reason: 'not enough gold' }
  return { ok: true, npc, entry, total }
}

// ---- Shop sell validation ----
export function validateShopSell(session, island, itemId, qty) {
  if (!session || !session.character) return { ok: false, reason: 'no session' }
  const c = session.character
  if (c.hp <= 0) return { ok: false, reason: 'player is dead' }
  if (!Number.isInteger(qty) || qty < 1) return { ok: false, reason: 'invalid qty' }
  if (qty > 99) return { ok: false, reason: 'qty too large' }
  const item = getItem(itemId)
  if (!item) return { ok: false, reason: 'item does not exist' }
  // Cannot sell quest items or keys
  if (item.type === 'quest' || item.type === 'key') {
    return { ok: false, reason: 'cannot sell quest/key items' }
  }
  if (item.value <= 0) return { ok: false, reason: 'item has no value' }
  // Check inventory has enough
  const have = c.inventory.filter(i => i.id === itemId).reduce((s, i) => s + i.qty, 0)
  if (have < qty) return { ok: false, reason: 'not enough items' }
  return { ok: true, item }
}

// ---- Quest accept validation ----
export function validateQuestAccept(session, island, questId) {
  if (!session || !session.character) return { ok: false, reason: 'no session' }
  const c = session.character
  if (c.hp <= 0) return { ok: false, reason: 'player is dead' }
  const quest = QUESTS[questId]
  if (!quest) return { ok: false, reason: 'quest does not exist' }
  // Quest must be for this island
  if (quest.island !== island?.islandId) {
    return { ok: false, reason: 'quest not available on this island' }
  }
  // Must find the quest giver NPC on this island and be near them
  const npc = island.npcs.find(n => {
    const qids = n.quest ? (Array.isArray(n.quest) ? n.quest : [n.quest]) : []
    return qids.includes(questId)
  })
  if (!npc) return { ok: false, reason: 'quest giver npc not found' }
  const dist = Math.abs(c.x - npc.x) + Math.abs(c.y - npc.y)
  if (dist > 3) return { ok: false, reason: 'too far from quest giver' }
  // Level check
  if (c.level < quest.minLevel) {
    return { ok: false, reason: `requires level ${quest.minLevel}` }
  }
  // State check
  const state = c.questProgress[questId]
  if (state && state !== QUEST_STATUS.AVAILABLE) {
    return { ok: false, reason: `quest already ${state}` }
  }
  return { ok: true, quest, npc }
}

// ---- Quest turn-in validation ----
export function validateQuestTurnIn(session, island, questId) {
  if (!session || !session.character) return { ok: false, reason: 'no session' }
  const c = session.character
  if (c.hp <= 0) return { ok: false, reason: 'player is dead' }
  const quest = QUESTS[questId]
  if (!quest) return { ok: false, reason: 'quest does not exist' }
  // State must be COMPLETE
  if (c.questProgress[questId] !== QUEST_STATUS.COMPLETE) {
    return { ok: false, reason: 'quest not complete' }
  }
  // Must be near quest giver
  const npc = island.npcs.find(n => {
    const qids = n.quest ? (Array.isArray(n.quest) ? n.quest : [n.quest]) : []
    return qids.includes(questId)
  })
  if (!npc) return { ok: false, reason: 'quest giver npc not found' }
  const dist = Math.abs(c.x - npc.x) + Math.abs(c.y - npc.y)
  if (dist > 3) return { ok: false, reason: 'too far from quest giver' }
  // For collect quests, verify player has the items
  if (quest.type === 'collect') {
    const have = c.inventory.filter(i => i.id === quest.target.item).reduce((s, i) => s + i.qty, 0)
    if (have < quest.target.count) {
      return { ok: false, reason: 'missing required items' }
    }
  }
  return { ok: true, quest, npc }
}

// ---- Travel validation ----
export function validateTravel(session, targetIslandId) {
  if (!session || !session.character) return { ok: false, reason: 'no session' }
  const c = session.character
  if (c.hp <= 0) return { ok: false, reason: 'player is dead' }
  const def = ISLAND_DEFS[targetIslandId]
  if (!def) return { ok: false, reason: 'invalid destination' }
  return { ok: true, def }
}

// ---- Respawn validation ----
export function validateRespawn(session) {
  if (!session || !session.character) return { ok: false, reason: 'no session' }
  const c = session.character
  if (c.hp > 0) return { ok: false, reason: 'player is not dead' }
  return { ok: true }
}

// ---- Chat sanitization ----
// Strips HTML/script tags, control characters, and truncates
export function sanitizeChatMessage(raw) {
  if (typeof raw !== 'string') return ''
  // Remove control characters (except newline/tab)
  let msg = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  // Strip HTML tags
  msg = msg.replace(/<[^>]*>/g, '')
  // Strip script/event handlers
  msg = msg.replace(/javascript:/gi, '')
  msg = msg.replace(/on\w+\s*=/gi, '')
  // Trim and truncate
  msg = msg.trim().slice(0, 200)
  return msg
}

// ---- Consumable use validation ----
export function validateUseItem(session, itemId) {
  if (!session || !session.character) return { ok: false, reason: 'no session' }
  const c = session.character
  if (c.hp <= 0) return { ok: false, reason: 'player is dead' }
  const item = getItem(itemId)
  if (!item) return { ok: false, reason: 'item does not exist' }
  if (item.type !== 'consumable') return { ok: false, reason: 'item is not consumable' }
  // Level requirement
  if (item.reqLevel && c.level < item.reqLevel) {
    return { ok: false, reason: `requires level ${item.reqLevel}` }
  }
  return { ok: true, item }
}
