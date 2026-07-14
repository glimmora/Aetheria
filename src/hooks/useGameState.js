// ============================================================
// Aetheria: Nine Isles - Core game state hook
// The heart of the game: player, monsters, NPC interactions
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { CLASSES, SKILLS, getSkillsForClass } from '../data/classes.js'
import { ITEMS, getItem } from '../data/items.js'
import { MONSTERS, getMonster } from '../data/monsters.js'
import { ISLAND_DEFS, getIslandMap, getIslandSpawnPoints, getIslandStart, placeNpcs, getIslandDef } from '../data/islands.js'
import { QUESTS } from '../data/quests.js'
import { TILE, TILE_INFO, isWalkable } from '../data/tiles.js'
import {
  calculateBasicAttackDamage, calculateMonsterAttackDamage, calculateSkillDamage,
  rollDrops, applyXp, xpForLevel, computePlayerStats
} from '../systems/combat.js'
import {
  addItemToInventory, removeItemFromInventory, countItem, hasItem,
  equipItem, unequipItem, useConsumable, buyItem, sellItem,
} from '../systems/inventory.js'
import {
  QUEST_STATUS, canAcceptQuest, acceptQuest, checkQuestCompletion, turnInQuest,
  getQuestProgressText,
} from '../systems/quests.js'
import { saveGame, loadGame, hasSave, deleteSave } from '../systems/save.js'

const TILE_SIZE = 28
const VIEW_TILES_X = 25
const VIEW_TILES_Y = 17

// Create a new player character
export function createPlayer(name, classId) {
  const cls = CLASSES[classId]
  if (!cls) return null
  const player = {
    name: name || 'Hero',
    class: classId,
    classDef: cls,
    level: 1,
    xp: 0,
    gold: 50,
    hp: cls.baseStats.hp,
    mp: cls.baseStats.mp,
    maxHp: cls.baseStats.hp,
    maxMp: cls.baseStats.mp,
    baseStats: { ...cls.baseStats },
    equipment: { weapon: null, armor: null, helmet: null, shield: null, boots: null, trinket: null },
    buffs: [],
    x: 30, y: 25,
    facing: 'down',
    moveCooldown: 0,
    attackCooldown: 0,
    skillCooldowns: {},
  }
  // starting items
  let inventory = []
  for (const item of cls.startingItems) {
    inventory = addItemToInventory(inventory, item.id, item.qty)
  }
  // auto-equip starting weapon
  for (const item of cls.startingItems) {
    const def = getItem(item.id)
    if (def && def.type === 'weapon') {
      const result = equipItem(player, inventory, item.id)
      player.equipment = result.player.equipment
      inventory = result.inventory
    } else if (def && def.type === 'armor' && def.slot === 'armor') {
      const result = equipItem(player, inventory, item.id)
      player.equipment = result.player.equipment
      inventory = result.inventory
    }
  }
  return { player, inventory }
}

// Spawn monsters for an island
export function spawnIslandMonsters(islandId) {
  const def = ISLAND_DEFS[islandId]
  if (!def) return []
  const spawnPoints = getIslandSpawnPoints(islandId)
  const monsters = []
  let spawnIdx = 0
  for (const cfg of def.spawnConfig) {
    for (let i = 0; i < cfg.count; i++) {
      const pos = spawnPoints[spawnIdx % spawnPoints.length]
      spawnIdx++
      const m = getMonster(cfg.monster)
      if (!m || !pos) continue
      monsters.push({
        id: `${islandId}_${cfg.monster}_${i}_${Date.now()}_${Math.random()}`,
        defId: m.id,
        name: m.name,
        icon: m.icon,
        color: m.color,
        level: m.level,
        hp: m.hp,
        maxHp: m.hp,
        attack: m.attack,
        defense: m.defense,
        speed: m.speed,
        element: m.element,
        xp: m.xp,
        gold: m.gold,
        drops: m.drops,
        aggro: m.aggro,
        aggroRange: m.aggroRange,
        attackRange: m.attackRange,
        moveCooldown: m.moveCooldown,
        boss: m.boss,
        finalBoss: m.finalBoss,
        x: pos.x,
        y: pos.y,
        lastMove: 0,
        lastAttack: 0,
        target: null,
      })
    }
  }
  return monsters
}

export function useGameState() {
  const [screen, setScreen] = useState('main_menu') // main_menu | character_creation | game
  const [player, setPlayer] = useState(null)
  const [inventory, setInventory] = useState([])
  const [currentIsland, setCurrentIsland] = useState('lumina')
  const [monsters, setMonsters] = useState([])
  const [npcs, setNpcs] = useState([])
  const [questProgress, setQuestProgress] = useState({})
  const [killCounts, setKillCounts] = useState({})
  const [visitedIslands, setVisitedIslands] = useState(['lumina'])
  const [killedBosses, setKilledBosses] = useState([])
  const [combatLog, setCombatLog] = useState([])
  const [floatingTexts, setFloatingTexts] = useState([])
  const [activeDialog, setActiveDialog] = useState(null) // { npc }
  const [activeShop, setActiveShop] = useState(null)
  const [activeQuestDialog, setActiveQuestDialog] = useState(null)
  const [activeTravel, setActiveTravel] = useState(null)
  const [activeInventory, setActiveInventory] = useState(false)
  const [activeQuestLog, setActiveQuestLog] = useState(false)
  const [activeCharacter, setActiveCharacter] = useState(false)
  const [activeMap, setActiveMap] = useState(false)
  const [activeHelp, setActiveHelp] = useState(false)
  const [notification, setNotification] = useState(null)
  const [isDead, setIsDead] = useState(false)
  const [gameTime, setGameTime] = useState(0)
  const [playerPath, setPlayerPath] = useState([]) // for click-to-move
  const monsterRefreshRef = useRef(0)
  const lastTickRef = useRef(0)
  const stateRef = useRef(null)

  // ----- Notifications -----
  const notify = useCallback((msg, duration = 3500) => {
    setNotification({ msg, id: Date.now() + Math.random() })
    setTimeout(() => setNotification(null), duration)
  }, [])

  const addLog = useCallback((msg, type = 'info') => {
    setCombatLog(prev => [...prev.slice(-30), { msg, type, id: Date.now() + Math.random() }])
  }, [])

  const addFloatingText = useCallback((x, y, text, color = '#fff', kind = 'damage') => {
    const id = Date.now() + Math.random()
    setFloatingTexts(prev => [...prev, { id, x, y, text, color, kind, startTime: Date.now() }])
    setTimeout(() => setFloatingTexts(prev => prev.filter(f => f.id !== id)), 1200)
  }, [])

  // ----- Save state ref for use in callbacks -----
  useEffect(() => {
    stateRef.current = { player, inventory, currentIsland, questProgress, killCounts, visitedIslands, killedBosses }
  })

  // ----- New Game -----
  const startNewGame = useCallback((name, classId) => {
    const result = createPlayer(name, classId)
    if (!result) return
    const startIsland = 'lumina'
    const start = getIslandStart(startIsland)
    const newPlayer = { ...result.player, x: start.x, y: start.y }
    setPlayer(newPlayer)
    setInventory(result.inventory)
    setCurrentIsland(startIsland)
    setQuestProgress({})
    setKillCounts({})
    setVisitedIslands([startIsland])
    setKilledBosses([])
    setCombatLog([{ msg: `Welcome to Aetheria, ${newPlayer.name}!`, type: 'system', id: 1 }])
    const newMonsters = spawnIslandMonsters(startIsland)
    setMonsters(newMonsters)
    const newNpcs = placeNpcs(startIsland)
    setNpcs(newNpcs)
    setScreen('game')
    setIsDead(false)
    setTimeout(() => notify('Use WASD or arrow keys to move. Click monsters to attack. Click NPCs to talk!'), 200)
  }, [notify])

  // ----- Continue (Load) -----
  const continueGame = useCallback(() => {
    const data = loadGame()
    if (!data) return
    const cls = CLASSES[data.player.class]
    const newPlayer = { ...data.player, classDef: cls, buffs: [], moveCooldown: 0, attackCooldown: 0, skillCooldowns: {} }
    setPlayer(newPlayer)
    setInventory(data.inventory || [])
    setCurrentIsland(data.currentIsland || 'lumina')
    setQuestProgress(data.questProgress || {})
    setKillCounts({})
    setVisitedIslands(data.visitedIslands || ['lumina'])
    setKilledBosses(data.killedBosses || [])
    setCombatLog([{ msg: `Welcome back, ${newPlayer.name}!`, type: 'system', id: 1 }])
    const newMonsters = spawnIslandMonsters(data.currentIsland || 'lumina')
    setMonsters(newMonsters)
    const newNpcs = placeNpcs(data.currentIsland || 'lumina')
    setNpcs(newNpcs)
    setScreen('game')
    setIsDead(false)
  }, [])

  // ----- Save current game -----
  const save = useCallback(() => {
    if (!player) return false
    return saveGame({
      player, inventory, currentIsland, questProgress, killCounts, visitedIslands, killedBosses,
    })
  }, [player, inventory, currentIsland, questProgress, killCounts, visitedIslands, killedBosses])

  // ----- Auto-save every 30 seconds -----
  useEffect(() => {
    if (screen !== 'game' || !player) return
    const interval = setInterval(() => {
      save()
    }, 30000)
    return () => clearInterval(interval)
  }, [screen, player, save])

  // ----- Travel to another island -----
  const travelTo = useCallback((islandId) => {
    if (!player) return
    const def = ISLAND_DEFS[islandId]
    if (!def) return
    const start = getIslandStart(islandId)
    setPlayer(prev => ({ ...prev, x: start.x, y: start.y, hp: prev.maxHp, mp: prev.maxMp, buffs: [] }))
    setCurrentIsland(islandId)
    const newMonsters = spawnIslandMonsters(islandId)
    setMonsters(newMonsters)
    const newNpcs = placeNpcs(islandId)
    setNpcs(newNpcs)
    setVisitedIslands(prev => prev.includes(islandId) ? prev : [...prev, islandId])
    setActiveTravel(null)
    setActiveDialog(null)
    notify(`Traveled to ${def.name}.`)
    addLog(`Traveled to ${def.name}.`, 'system')
  }, [player, notify, addLog])

  // ----- Movement -----
  const movePlayer = useCallback((dx, dy) => {
    if (!player || isDead) return
    const map = getIslandMap(currentIsland)
    if (!map) return
    const now = Date.now()
    if (now - (player.moveCooldown || 0) < 120) return
    const stats = computePlayerStats(player)
    const speedMs = Math.max(80, 200 - stats.speed * 8)
    if (now - (player.moveCooldown || 0) < speedMs) return
    let facing = player.facing
    if (dx < 0) facing = 'left'
    else if (dx > 0) facing = 'right'
    else if (dy < 0) facing = 'up'
    else if (dy > 0) facing = 'down'
    const nx = player.x + dx
    const ny = player.y + dy
    if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) return
    if (!isWalkable(map[ny][nx])) {
      setPlayer(prev => ({ ...prev, facing }))
      return
    }
    // check monster collision (block)
    const blockingMonster = monsters.find(m => m.x === nx && m.y === ny)
    if (blockingMonster) {
      // attack instead
      performAttack(blockingMonster)
      return
    }
    setPlayer(prev => ({ ...prev, x: nx, y: ny, facing, moveCooldown: now }))
    // check NPC interaction (auto-trigger dialog if next to NPC and walking into them)
    const nearbyNpc = npcs.find(n => n.x === nx && n.y === ny)
    if (nearbyNpc) {
      setActiveDialog({ npc: nearbyNpc })
    }
    // check portal tile (water tile at portal position triggers travel prompt)
    checkPortalTile(nx, ny)
  }, [player, isDead, currentIsland, monsters, npcs])

  // ----- Check portal -----
  const checkPortalTile = useCallback((x, y) => {
    const def = ISLAND_DEFS[currentIsland]
    if (!def || !def.portalTo) return
    if (player.level < (def.portalLevel || 99)) return
    // simple: if player reaches the border of the map, show travel prompt
    const map = getIslandMap(currentIsland)
    if (!map) return
    const w = map[0].length, h = map.length
    const margin = 2
    if (x <= margin || x >= w - margin - 1 || y <= margin || y >= h - margin - 1) {
      // find a sailor NPC for travel options
      const sailor = npcs.find(n => n.travel)
      if (sailor) {
        setActiveDialog({ npc: sailor })
      } else {
        notify(`You feel a strange wind... Perhaps a sailor could take you onward.`)
      }
    }
  }, [currentIsland, player, npcs, notify])

  // ----- Combat: player attacks monster -----
  const performAttack = useCallback((monster) => {
    if (!player || isDead) return
    const now = Date.now()
    const stats = computePlayerStats(player)
    const attackSpeedMs = Math.max(400, 900 - stats.speed * 15)
    if (now - (player.attackCooldown || 0) < attackSpeedMs) return
    // distance check
    const dx = Math.abs(player.x - monster.x), dy = Math.abs(player.y - monster.y)
    const weapon = player.equipment?.weapon
    const weaponDef = weapon?.id ? getItem(weapon.id) : null
    const range = weaponDef?.class === 'ranger' ? 6 : (weaponDef?.class === 'mage' ? 6 : (weaponDef?.class === 'healer' ? 5 : 1))
    if (dx + dy > range) {
      notify('Too far to attack!')
      return
    }
    setPlayer(prev => ({ ...prev, attackCooldown: now, facing: monster.x < prev.x ? 'left' : (monster.x > prev.x ? 'right' : prev.facing) }))
    const result = calculateBasicAttackDamage(player, monster)
    const newHp = monster.hp - result.damage
    addFloatingText(monster.x, monster.y, `-${result.damage}${result.crit ? '!' : ''}`, result.crit ? '#fbbf24' : '#f87171')
    addLog(`You hit ${monster.name} for ${result.damage}${result.crit ? ' (CRIT)' : ''}.`, 'player')
    if (newHp <= 0) {
      // monster dies
      handleMonsterDeath(monster)
    } else {
      setMonsters(prev => prev.map(m => m.id === monster.id ? { ...m, hp: newHp, aggro: true, target: 'player' } : m))
    }
  }, [player, isDead, addFloatingText, addLog, notify])

  // ----- Combat: use skill on monster -----
  const performSkill = useCallback((skillId, targetMonster) => {
    if (!player || isDead) return
    const skill = SKILLS[skillId]
    if (!skill) return
    const now = Date.now()
    if (player.skillCooldowns?.[skillId] && now - player.skillCooldowns[skillId] < skill.cooldown) {
      notify(`${skill.name} is on cooldown.`)
      return
    }
    if (player.mp < skill.manaCost) {
      notify('Not enough mana!')
      return
    }
    // deduce mana
    setPlayer(prev => ({
      ...prev,
      mp: prev.mp - skill.manaCost,
      skillCooldowns: { ...(prev.skillCooldowns || {}), [skillId]: now },
    }))
    if (skill.healMultiplier) {
      // healing skill
      const stats = computePlayerStats(player)
      const heal = Math.floor(stats.magic * skill.healMultiplier)
      const newHp = Math.min(player.maxHp, player.hp + heal)
      setPlayer(prev => ({ ...prev, hp: newHp }))
      addFloatingText(player.x, player.y, `+${heal}`, '#4ade80', 'heal')
      addLog(`You cast ${skill.name} and heal ${heal} HP.`, 'player')
      return
    }
    if (skill.buff) {
      // buff skill
      setPlayer(prev => ({ ...prev, buffs: [...(prev.buffs || []), { ...skill.buff, startTime: now, skillId }] }))
      addLog(`You cast ${skill.name}.`, 'player')
      return
    }
    if (!targetMonster) {
      notify('No target!')
      return
    }
    const result = calculateSkillDamage(player, targetMonster, skillId)
    const newHp = targetMonster.hp - result.damage
    addFloatingText(targetMonster.x, targetMonster.y, `-${result.damage}${result.crit ? '!' : ''}${result.skill ? '✦' : ''}`, result.crit ? '#fbbf24' : '#c084fc')
    addLog(`You cast ${skill.name} on ${targetMonster.name} for ${result.damage}.`, 'player')
    if (newHp <= 0) {
      handleMonsterDeath(targetMonster)
    } else {
      setMonsters(prev => prev.map(m => m.id === targetMonster.id ? { ...m, hp: newHp, aggro: true, target: 'player' } : m))
    }
  }, [player, isDead, addFloatingText, addLog, notify])

  // ----- Handle monster death -----
  const handleMonsterDeath = useCallback((monster) => {
    setMonsters(prev => prev.filter(m => m.id !== monster.id))
    // track kill count
    setKillCounts(prev => ({ ...prev, [monster.defId]: (prev[monster.defId] || 0) + 1 }))
    if (monster.boss) {
      setKilledBosses(prev => prev.includes(monster.defId) ? prev : [...prev, monster.defId])
    }
    // roll drops
    const drops = rollDrops(monster)
    let goldGained = 0
    if (drops.length > 0) {
      setInventory(prev => {
        let inv = prev
        for (const drop of drops) {
          if (drop.id === 'gold_coin') {
            goldGained += drop.qty
          } else {
            inv = addItemToInventory(inv, drop.id, drop.qty)
          }
        }
        return inv
      })
      if (goldGained > 0) {
        setPlayer(prev => ({ ...prev, gold: (prev.gold || 0) + goldGained }))
      }
    }
    // XP
    setPlayer(prev => {
      const newPlayer = { ...prev }
      const xpResult = applyXp(newPlayer, monster.xp)
      if (xpResult.leveledUp) {
        addLog(`Level up! You are now level ${newPlayer.level}!`, 'system')
        addFloatingText(prev.x, prev.y, 'LEVEL UP!', '#fde047', 'levelup')
        notify(`Level Up! You are now level ${newPlayer.level}!`)
      }
      return newPlayer
    })
    addFloatingText(monster.x, monster.y, `+${monster.xp} XP`, '#22d3ee', 'xp')
    addLog(`You slain ${monster.name}! Gained ${monster.xp} XP${goldGained ? ` and ${goldGained} gold` : ''}.`, 'kill')
    // respawn this monster after delay (3-5 minutes)
    const respawnMs = monster.boss ? 120000 : 60000 + Math.random() * 60000
    setTimeout(() => {
      respawnMonster(monster)
    }, respawnMs)
  }, [addLog, addFloatingText, notify, currentIsland])

  // ----- Respawn a single monster -----
  const respawnMonster = useCallback((deadMonster) => {
    if (screen !== 'game') return
    const def = getMonster(deadMonster.defId)
    if (!def) return
    const spawnPoints = getIslandSpawnPoints(currentIsland)
    if (spawnPoints.length === 0) return
    const pos = spawnPoints[Math.floor(Math.random() * spawnPoints.length)]
    const newMonster = {
      id: `${currentIsland}_${def.id}_${Date.now()}_${Math.random()}`,
      defId: def.id,
      name: def.name,
      icon: def.icon,
      color: def.color,
      level: def.level,
      hp: def.hp,
      maxHp: def.hp,
      attack: def.attack,
      defense: def.defense,
      speed: def.speed,
      element: def.element,
      xp: def.xp,
      gold: def.gold,
      drops: def.drops,
      aggro: def.aggro,
      aggroRange: def.aggroRange,
      attackRange: def.attackRange,
      moveCooldown: def.moveCooldown,
      boss: def.boss,
      finalBoss: def.finalBoss,
      x: pos.x,
      y: pos.y,
      lastMove: 0,
      lastAttack: 0,
      target: null,
    }
    setMonsters(prev => [...prev, newMonster])
  }, [screen, currentIsland])

  // ----- Game tick: monster AI, buff expiry -----
  useEffect(() => {
    if (screen !== 'game' || !player) return
    const interval = setInterval(() => {
      const now = Date.now()
      setGameTime(now)
      // Monster AI
      setMonsters(prevMonsters => {
        let changed = false
        const updated = prevMonsters.map(m => {
          if (m.hp <= 0) return m
          // check aggro
          const dist = Math.abs(m.x - player.x) + Math.abs(m.y - player.y)
          if (!m.aggro && dist <= m.aggroRange) {
            changed = true
            return { ...m, aggro: true, target: 'player' }
          }
          if (m.aggro && dist > m.aggroRange * 2) {
            changed = true
            return { ...m, aggro: false, target: null }
          }
          if (!m.aggro) return m
          // attack if in range
          if (dist <= m.attackRange) {
            if (now - (m.lastAttack || 0) > Math.max(600, 1500 - m.speed * 50)) {
              changed = true
              const result = calculateMonsterAttackDamage(m, player)
              setPlayer(prev => {
                if (!prev) return prev
                const newHp = prev.hp - result.damage
                if (newHp <= 0) {
                  setIsDead(true)
                  addLog(`You were slain by ${m.name}!`, 'death')
                  return { ...prev, hp: 0 }
                }
                return { ...prev, hp: newHp }
              })
              addFloatingText(player.x, player.y, `-${result.damage}`, '#f87171')
              return { ...m, lastAttack: now }
            }
            return m
          }
          // move toward player
          if (now - (m.lastMove || 0) > (m.moveCooldown || 600)) {
            const map = getIslandMap(currentIsland)
            if (!map) return m
            const dx = Math.sign(player.x - m.x)
            const dy = Math.sign(player.y - m.y)
            // try x first, then y
            const candidates = []
            if (dx !== 0) candidates.push([m.x + dx, m.y])
            if (dy !== 0) candidates.push([m.x, m.y + dy])
            for (const [nx, ny] of candidates) {
              if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) continue
              if (!isWalkable(map[ny][nx])) continue
              // don't step on another monster or player
              const blocked = prevMonsters.some(o => o.id !== m.id && o.x === nx && o.y === ny)
              if (blocked) continue
              if (nx === player.x && ny === player.y) continue
              changed = true
              return { ...m, x: nx, y: ny, lastMove: now }
            }
          }
          return m
        })
        return changed ? updated : prevMonsters
      })
      // Expire buffs
      setPlayer(prev => {
        if (!prev || !prev.buffs || prev.buffs.length === 0) return prev
        const validBuffs = prev.buffs.filter(b => now - (b.startTime || 0) < (b.duration || 0))
        if (validBuffs.length !== prev.buffs.length) {
          return { ...prev, buffs: validBuffs }
        }
        return prev
      })
      // Quest completion check
      const result = checkQuestCompletion(player, inventory, questProgress, killCounts)
      if (result.newlyCompleted.length > 0) {
        setQuestProgress(result.questProgress)
        for (const qId of result.newlyCompleted) {
          const q = QUESTS[qId]
          notify(`Quest Complete: ${q.title}! Return to the quest giver.`)
          addLog(`Quest complete: ${q.title}`, 'system')
        }
      }
    }, 100)
    return () => clearInterval(interval)
  }, [screen, player, currentIsland, inventory, questProgress, killCounts, addFloatingText, addLog, notify])

  // ----- NPC Interactions -----
  const talkToNpc = useCallback((npc) => {
    setActiveDialog({ npc })
  }, [])

  const closeDialog = useCallback(() => {
    setActiveDialog(null)
    setActiveShop(null)
    setActiveQuestDialog(null)
    setActiveTravel(null)
  }, [])

  const openShop = useCallback((npc) => {
    if (!npc.shop) return
    setActiveShop({ npc })
    setActiveDialog(null)
  }, [])

  const openQuestDialog = useCallback((npc) => {
    if (!npc.quest) return
    const q = QUESTS[npc.quest]
    if (!q) return
    setActiveQuestDialog({ npc, quest: q })
    setActiveDialog(null)
  }, [])

  const openTravel = useCallback((npc) => {
    if (!npc.travel) return
    setActiveTravel({ npc })
    setActiveDialog(null)
  }, [])

  // ----- Accept a quest -----
  const handleAcceptQuest = useCallback((questId) => {
    if (!canAcceptQuest(player, questProgress, questId)) {
      notify('You cannot accept this quest yet.')
      return
    }
    setQuestProgress(prev => acceptQuest(prev, questId))
    const q = QUESTS[questId]
    notify(`Quest accepted: ${q.title}`)
    addLog(`Quest accepted: ${q.title}`, 'system')
    setActiveQuestDialog(null)
  }, [player, questProgress, notify, addLog])

  // ----- Turn in a quest -----
  const handleTurnInQuest = useCallback((questId) => {
    if (questProgress[questId] !== QUEST_STATUS.COMPLETE) {
      notify('Quest not yet complete.')
      return
    }
    const q = QUESTS[questId]
    const result = turnInQuest(player, inventory, questProgress, questId)
    setPlayer(result.player)
    setInventory(result.inventory)
    setQuestProgress(result.questProgress)
    // Apply pending XP
    if (result.player.pendingXp) {
      setPlayer(prev => {
        const newPlayer = { ...prev }
        const xp = newPlayer.pendingXp
        delete newPlayer.pendingXp
        const xpResult = applyXp(newPlayer, xp)
        if (xpResult.leveledUp) {
          addLog(`Level up! You are now level ${newPlayer.level}!`, 'system')
          addFloatingText(newPlayer.x, newPlayer.y, 'LEVEL UP!', '#fde047', 'levelup')
          notify(`Level Up! You are now level ${newPlayer.level}!`)
        }
        return newPlayer
      })
    }
    notify(`Quest complete: ${q.title}`)
    addLog(`Quest turned in: ${q.title}. Reward received!`, 'system')
    setActiveQuestDialog(null)
  }, [player, inventory, questProgress, notify, addLog, addFloatingText])

  // ----- Buy item from shop -----
  const handleBuyItem = useCallback((itemId, price, qty = 1) => {
    if (!player) return
    if (player.gold < price * qty) {
      notify('Not enough gold!')
      return
    }
    const result = buyItem(inventory, player.gold, itemId, qty, price)
    if (!result.success) {
      notify('Purchase failed.')
      return
    }
    setInventory(result.inventory)
    setPlayer(prev => ({ ...prev, gold: result.gold }))
    const item = getItem(itemId)
    notify(`Bought ${qty}x ${item.name} for ${price * qty} gold.`)
  }, [player, inventory, notify])

  // ----- Sell item -----
  const handleSellItem = useCallback((itemId, qty = 1) => {
    if (!player) return
    const result = sellItem(inventory, itemId, qty)
    if (result.gold === 0) {
      notify('Cannot sell this item.')
      return
    }
    setInventory(result.inventory)
    setPlayer(prev => ({ ...prev, gold: (prev.gold || 0) + result.gold }))
    const item = getItem(itemId)
    notify(`Sold ${qty}x ${item.name} for ${result.gold} gold.`)
  }, [player, inventory, notify])

  // ----- Equip item from inventory -----
  const handleEquipItem = useCallback((itemId) => {
    if (!player) return
    const result = equipItem(player, inventory, itemId)
    setPlayer(result.player)
    setInventory(result.inventory)
    notify(`Equipped ${getItem(itemId).name}.`)
  }, [player, inventory, notify])

  // ----- Unequip item -----
  const handleUnequipItem = useCallback((slot) => {
    if (!player) return
    const result = unequipItem(player, inventory, slot)
    setPlayer(result.player)
    setInventory(result.inventory)
    notify(`Unequipped.`)
  }, [player, inventory, notify])

  // ----- Use consumable -----
  const handleUseConsumable = useCallback((itemId) => {
    if (!player) return
    const result = useConsumable(player, inventory, itemId)
    if (result.message) {
      setPlayer(result.player)
      setInventory(result.inventory)
      notify(result.message)
    }
  }, [player, inventory, notify])

  // ----- Respawn after death -----
  const respawn = useCallback(() => {
    if (!player) return
    // respawn at village center of current island
    const start = getIslandStart(currentIsland)
    setPlayer(prev => ({ ...prev, x: start.x, y: start.y, hp: prev.maxHp, mp: prev.maxMp, buffs: [], gold: Math.floor((prev.gold || 0) * 0.9) }))
    setIsDead(false)
    notify(`You have respawned at the village. Lost 10% gold.`)
    addLog(`You respawned at ${ISLAND_DEFS[currentIsland].name}.`, 'system')
  }, [player, currentIsland, notify, addLog])

  // ----- Quit to main menu -----
  const quitToMenu = useCallback(() => {
    if (player) save()
    setScreen('main_menu')
    setPlayer(null)
    setInventory([])
    setMonsters([])
    setNpcs([])
    setActiveDialog(null)
    setActiveShop(null)
    setActiveQuestDialog(null)
    setActiveTravel(null)
    setActiveInventory(false)
    setActiveQuestLog(false)
    setActiveCharacter(false)
    setActiveMap(false)
    setIsDead(false)
  }, [player, save])

  // ----- Click to attack/move -----
  const handleTileClick = useCallback((tileX, tileY) => {
    if (!player || isDead) return
    // check if clicked on monster
    const monster = monsters.find(m => m.x === tileX && m.y === tileY)
    if (monster) {
      // ranged attack? if too far, just attack anyway (will fail with notify)
      performAttack(monster)
      return
    }
    // check NPC
    const npc = npcs.find(n => n.x === tileX && n.y === tileY)
    if (npc) {
      // if adjacent, talk; else move toward
      const dist = Math.abs(player.x - npc.x) + Math.abs(player.y - npc.y)
      if (dist <= 1) {
        setActiveDialog({ npc })
        return
      }
    }
    // otherwise, attempt to step toward target tile (one step at a time)
    const dx = Math.sign(tileX - player.x)
    const dy = Math.sign(tileY - player.y)
    if (dx !== 0 && dy === 0) movePlayer(dx, 0)
    else if (dx === 0 && dy !== 0) movePlayer(0, dy)
    else if (dx !== 0 && dy !== 0) {
      // move on the longer axis
      if (Math.abs(tileX - player.x) > Math.abs(tileY - player.y)) movePlayer(dx, 0)
      else movePlayer(0, dy)
    }
  }, [player, isDead, monsters, npcs, performAttack, movePlayer])

  return {
    // state
    screen, setScreen,
    player, setPlayer,
    inventory, setInventory,
    currentIsland, setCurrentIsland,
    monsters, setMonsters,
    npcs,
    questProgress,
    killCounts,
    visitedIslands,
    killedBosses,
    combatLog,
    floatingTexts,
    activeDialog, activeShop, activeQuestDialog, activeTravel,
    activeInventory, activeQuestLog, activeCharacter, activeMap, activeHelp,
    notification, isDead, gameTime,
    // actions
    startNewGame, continueGame, save, quitToMenu,
    movePlayer, performAttack, performSkill,
    talkToNpc, closeDialog, openShop, openQuestDialog, openTravel,
    handleAcceptQuest, handleTurnInQuest,
    handleBuyItem, handleSellItem,
    handleEquipItem, handleUnequipItem, handleUseConsumable,
    travelTo, respawn, handleTileClick,
    setActiveInventory, setActiveQuestLog, setActiveCharacter, setActiveMap, setActiveHelp,
    // utilities
    notify,
  }
}
