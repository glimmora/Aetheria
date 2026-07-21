// ============================================================
// Mythral Server - World
// Manages all island instances, players, and monsters
// ============================================================

import { ISLAND_DEFS, getIslandMap, getIslandSpawnPoints, getIslandStart, placeNpcs, getIslandBuildings } from '../shared/islands.js'
import { getMonster } from '../shared/monsters.js'
import { getItem } from '../shared/items.js'
import { isWalkable, TILE_INFO } from '../shared/tiles.js'
import { CLASSES, SKILLS, getSkillsForClass } from '../shared/classes.js'
import {
  calculateBasicAttackDamage, calculateMonsterAttackDamage,
  calculateSkillDamage, computePlayerStats, applyXp, xpForLevel,
} from '../shared/combat.js'
import {
  addItemToInventory, removeItemFromInventory, countItem, hasItem,
  equipItem, unequipItem, useConsumable, buyItem, sellItem,
} from '../shared/inventory.js'
import {
  QUEST_STATUS, canAcceptQuest, acceptQuest, checkQuestCompletion,
  turnInQuest, getQuestProgressText,
} from '../shared/quests.js'
import { QUESTS } from '../shared/quests.js'
import { CONFIG, SERVER_EVENTS } from '../shared/protocol.js'
import { saveCharacter, getCharacterByName, countCharactersByOwner, getAllCharacters } from './db.js'
import { validateCharName } from './auth.js'
import {
  withLock, logSuspicious, validateMovement, validateAttackTarget,
  validateSkillUse, validateEquip, validateNpcProximity, validateShopBuy,
  validateShopSell, validateQuestAccept, validateQuestTurnIn, validateTravel,
  validateRespawn, sanitizeChatMessage, validateUseItem,
} from './security.js'

class IslandInstance {
  constructor(islandId, world) {
    this.islandId = islandId
    this.world = world
    this.def = ISLAND_DEFS[islandId]
    this.map = getIslandMap(islandId)
    this.spawnPoints = getIslandSpawnPoints(islandId)
    this.npcs = placeNpcs(islandId)
    this.monsters = new Map()      // id -> Monster
    this.players = new Map()       // socketId -> Player session
    this.nextMonsterId = 1
    this.spawnInitialMonsters()
  }

  spawnInitialMonsters() {
    for (const cfg of this.def.spawnConfig) {
      for (let i = 0; i < cfg.count; i++) {
        this.spawnMonster(cfg.monster)
      }
    }
  }

  spawnMonster(monsterDefId, forcedPos = null) {
    const def = getMonster(monsterDefId)
    if (!def) return null
    const pos = forcedPos || this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)]
    if (!pos) return null
    const id = `${this.islandId}_${monsterDefId}_${this.nextMonsterId++}`
    const monster = {
      id,
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
      aggro: false,
      aggroRange: def.aggroRange,
      attackRange: def.attackRange,
      moveCooldown: def.moveCooldown,
      boss: def.boss,
      finalBoss: def.finalBoss,
      x: pos.x,
      homeX: pos.x,
      homeY: pos.y,
      y: pos.y,
      lastMove: 0,
      lastAttack: 0,
      targetSocketId: null,
    }
    this.monsters.set(id, monster)
    this.broadcast('monster:spawn', this.serializeMonster(monster))
    return monster
  }

  serializeMonster(m) {
    return {
      id: m.id, defId: m.defId, name: m.name, icon: m.icon, color: m.color,
      level: m.level, hp: m.hp, maxHp: m.maxHp, element: m.element,
      x: m.x, y: m.y, boss: !!m.boss, finalBoss: !!m.finalBoss,
    }
  }

  serializePlayer(p) {
    return {
      id: p.socketId,
      name: p.character.name,
      classId: p.character.class,
      classDef: p.character.classDef,
      level: p.character.level,
      hp: p.character.hp,
      maxHp: p.character.maxHp,
      x: p.character.x,
      y: p.character.y,
      facing: p.character.facing,
      isSelf: false, // client sets this
    }
  }

  addPlayer(session) {
    this.players.set(session.socketId, session)
    // tell the new player about everyone else
    const others = [...this.players.values()]
      .filter(p => p.socketId !== session.socketId)
      .map(p => this.serializePlayer(p))
    const monsters = [...this.monsters.values()].map(m => this.serializeMonster(m))
    // tell others about the new player
    this.broadcast('player:joined', this.serializePlayer(session), session.socketId)
    return { others, monsters, npcs: this.npcs }
  }

  removePlayer(socketId) {
    const session = this.players.get(socketId)
    this.players.delete(socketId)
    if (session) {
      this.broadcast('player:left', { id: socketId })
      // save character on leave
      saveCharacter(session.character)
    }
  }

  broadcast(event, data, exceptSocketId = null) {
    for (const p of this.players.values()) {
      if (p.socketId === exceptSocketId) continue
      if (p.socket && p.socket.connected) {
        try { p.socket.emit(event, data) } catch (e) { /* socket may have died */ }
      }
    }
  }

  sendTo(socketId, event, data) {
    const p = this.players.get(socketId)
    if (p && p.socket && p.socket.connected) {
      try { p.socket.emit(event, data) } catch (e) { /* socket may have died */ }
    }
  }

  // Find a walkable tile near (x, y)
  findWalkableNear(x, y, maxRadius = 8) {
    for (let r = 0; r <= maxRadius; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx, ny = y + dy
          if (ny >= 0 && ny < this.map.length && nx >= 0 && nx < this.map[0].length) {
            if (isWalkable(this.map[ny][nx])) return { x: nx, y: ny }
          }
        }
      }
    }
    return null
  }

  isPositionBlocked(x, y, ignorePlayerSocketId = null, ignoreMonsterId = null) {
    if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) return true
    if (!isWalkable(this.map[y][x])) return true
    for (const p of this.players.values()) {
      if (p.socketId === ignorePlayerSocketId) continue
      if (p.character.x === x && p.character.y === y) return true
    }
    for (const m of this.monsters.values()) {
      if (m.id === ignoreMonsterId) continue
      if (m.x === x && m.y === y) return true
    }
    return false
  }

  // Game tick: monster AI
  tick(now) {
    const updates = [] // {id, x, y, hp, aggro}

    for (const m of this.monsters.values()) {
      if (m.hp <= 0) continue

      // Find nearest player on this island
      let nearestPlayer = null
      let nearestDist = Infinity
      for (const p of this.players.values()) {
        if (p.character.hp <= 0) continue
        const d = Math.abs(p.character.x - m.x) + Math.abs(p.character.y - m.y)
        if (d < nearestDist) { nearestDist = d; nearestPlayer = p }
      }

      // No players nearby — deaggro
      if (!nearestPlayer) {
        if (m.aggro) {
          m.aggro = false
          m.targetSocketId = null
          updates.push({ id: m.id, x: m.x, y: m.y, hp: m.hp, aggro: false })
        }
        continue
      }

      // Max chase distance from home — deaggro if too far
      if (m.homeX !== undefined && m.homeY !== undefined) {
        const homeDist = Math.abs(m.x - m.homeX) + Math.abs(m.y - m.homeY)
        if (homeDist > 8) {
          if (m.aggro) {
            m.aggro = false
            m.targetSocketId = null
            updates.push({ id: m.id, x: m.x, y: m.y, hp: m.hp, aggro: false })
          }
          continue
        }
      }

      // Aggro check
      if (!m.aggro && nearestDist <= m.aggroRange) {
        m.aggro = true
        m.targetSocketId = nearestPlayer.socketId
      }
      if (m.aggro && nearestDist > m.aggroRange * 2) {
        m.aggro = false
        m.targetSocketId = null
        updates.push({ id: m.id, x: m.x, y: m.y, hp: m.hp, aggro: false })
        continue
      }
      if (!m.aggro) continue

      // Attack if in range
      if (nearestDist <= m.attackRange) {
        if (now - (m.lastAttack || 0) > Math.max(600, 1500 - m.speed * 50)) {
          m.lastAttack = now
          const result = calculateMonsterAttackDamage(m, nearestPlayer.character)
          nearestPlayer.character.hp = Math.max(0, nearestPlayer.character.hp - result.damage)
          // notify player
          this.sendTo(nearestPlayer.socketId, 'fx:floating', {
            x: nearestPlayer.character.x, y: nearestPlayer.character.y,
            text: `-${result.damage}`, color: '#f87171', kind: 'damage'
          })
          this.sendTo(nearestPlayer.socketId, 'player:update', this.serializePlayerSelf(nearestPlayer))
          this.sendTo(nearestPlayer.socketId, 'log:combat', {
            msg: `${m.name} hit you for ${result.damage}.`, type: 'damage'
          })
          // broadcast HP update + position to others
          this.broadcast('player:hp', {
            id: nearestPlayer.socketId,
            hp: nearestPlayer.character.hp,
            maxHp: nearestPlayer.character.maxHp,
            x: nearestPlayer.character.x,
            y: nearestPlayer.character.y,
            facing: nearestPlayer.character.facing,
          }, nearestPlayer.socketId)
          if (nearestPlayer.character.hp <= 0) {
            this.world.handlePlayerDeath(nearestPlayer)
          } else {
            // auto counter-attack: player basic-attacks the monster that hit them
            this.world.playerAttackMonster(nearestPlayer, m, this)
          }
        }
        continue
      }

      // Move toward player
      if (now - (m.lastMove || 0) > (m.moveCooldown || 600)) {
        const dx = Math.sign(nearestPlayer.character.x - m.x)
        const dy = Math.sign(nearestPlayer.character.y - m.y)
        const candidates = []
        if (dx !== 0) candidates.push([m.x + dx, m.y])
        if (dy !== 0) candidates.push([m.x, m.y + dy])
        // diagonal step (only if both orthogonal neighbors are open — no corner cutting)
        if (dx !== 0 && dy !== 0) {
          const openX = !this.isPositionBlocked(m.x + dx, m.y, null, m.id)
          const openY = !this.isPositionBlocked(m.x, m.y + dy, null, m.id)
          if (openX && openY) candidates.push([m.x + dx, m.y + dy])
        }
        for (const [nx, ny] of candidates) {
          if (this.isPositionBlocked(nx, ny, null, m.id)) continue
          // Monsters cannot enter town/safe zones
          const tile = this.map?.[ny]?.[nx]
          if (tile !== undefined) {
            const info = TILE_INFO[tile]
            if (info && info.monsterSafe === false) continue
          }
          m.x = nx; m.y = ny
          m.lastMove = now
          updates.push({ id: m.id, x: m.x, y: m.y, hp: m.hp, aggro: true })
          break
        }
      }
    }
    if (updates.length > 0) {
      this.broadcast('monster:update', updates)
    }
  }


  serializePlayerSelf(session) {
    const c = session.character
    return {
      id: session.socketId,
      name: c.name,
      classId: c.class,
      classDef: c.classDef,
      level: c.level,
      xp: c.xp,
      xpForNext: xpForLevel(c.level),
      hp: c.hp, maxHp: c.maxHp,
      mp: c.mp, maxMp: c.maxMp,
      gold: c.gold,
      x: c.x, y: c.y,
      facing: c.facing,
      equipment: c.equipment,
      inventory: c.inventory,
      questProgress: c.questProgress,
      killCounts: c.killCounts,
      visitedIslands: c.visitedIslands,
      killedBosses: c.killedBosses,
      currentIsland: c.currentIsland,
      buffs: c.buffs || [],
    }
  }
}

export class World {
  constructor() {
    this.islands = new Map() // islandId -> IslandInstance
    this.sessions = new Map() // socketId -> session
  }

  getIsland(islandId) {
    if (!this.islands.has(islandId)) {
      this.islands.set(islandId, new IslandInstance(islandId, this))
    }
    return this.islands.get(islandId)
  }

  tickAll(now) {
    for (const island of this.islands.values()) {
      if (island.players.size > 0) {
        island.tick(now)
      }
    }
  }

  createSession(socket, character) {
    const session = {
      socketId: socket.id,
      socket,
      character,
      lastMove: 0,
      lastAttack: 0,
      skillCooldowns: {},
      lastChat: 0,
      buffs: character.buffs || [],
    }
    this.sessions.set(socket.id, session)
    return session
  }

  removeSession(socketId) {
    const session = this.sessions.get(socketId)
    if (!session) return
    const island = this.islands.get(session.character.currentIsland)
    if (island) island.removePlayer(socketId)
    this.sessions.delete(socketId)
  }

  // ===== Player Actions =====
  playerJoinIsland(session, islandId) {
    const island = this.getIsland(islandId)
    session.character.currentIsland = islandId
    if (!session.character.visitedIslands.includes(islandId)) {
      session.character.visitedIslands.push(islandId)
    }
    const islandState = island.addPlayer(session)
    island.players.set(session.socketId, session)
    // send full state to the joining player
    this.safeEmit(session.socket, 'state:sync', {
      islandId,
      islandDef: {
        id: island.def.id, name: island.def.name, subtitle: island.def.subtitle,
        biome: island.def.biome, levelRange: island.def.levelRange,
        description: island.def.description, backgroundColor: island.def.backgroundColor,
        width: island.map[0].length, height: island.map.length,
      },
      map: island.map,
      npcs: island.npcs,
      buildings: getIslandBuildings(islandId),
      monsters: islandState.monsters,
      otherPlayers: islandState.others,
      player: island.serializePlayerSelf(session),
    })
    saveCharacter(session.character)
  }

  playerMove(session, dx, dy) {
    if (!session) return
    // Validate movement input (anti-teleport: must be 1-tile cardinal)
    if (!validateMovement(dx, dy)) {
      logSuspicious(session.socketId, session.character?.name, 'move', `invalid dx=${dx} dy=${dy}`)
      return
    }
    const result = withLock(session.socketId, () => {
      const now = Date.now()
      if (now - session.lastMove < CONFIG.MOVE_COOLDOWN_MS) return 'cooldown'
      const c = session.character
      if (c.hp <= 0) return 'dead'
      const island = this.islands.get(c.currentIsland)
      if (!island) return 'no-island'
      const stats = computePlayerStats(c)
      const speedMs = Math.max(80, 200 - stats.speed * 8)
      if (now - session.lastMove < speedMs) return 'speed-cooldown'
      let facing = c.facing
      // dominant-axis facing (4-dir; sprite art has down/up/side only)
      if (dx < 0) facing = 'left'
      else if (dx > 0) facing = 'right'
      else if (dy < 0) facing = 'up'
      else if (dy > 0) facing = 'down'
      const nx = c.x + dx, ny = c.y + dy
      if (island.isPositionBlocked(nx, ny, session.socketId)) {
        c.facing = facing
        this.safeEmit(session.socket, 'player:update', { ...island.serializePlayerSelf(session), onlyFacing: true })
        return 'blocked'
      }
      // Check if a monster is on the target tile — if so, attack instead
      let attackingMonster = null
      for (const m of island.monsters.values()) {
        if (m.x === nx && m.y === ny && m.hp > 0) { attackingMonster = m; break }
      }
      if (attackingMonster) {
        c.facing = facing
        this.playerAttackMonster(session, attackingMonster, island)
        return 'attacked'
      }
      c.x = nx; c.y = ny; c.facing = facing
      session.lastMove = now
      // send updated position to the moving player
      this.safeEmit(session.socket, 'player:update', island.serializePlayerSelf(session))
      // broadcast movement to others on island
      island.broadcast('player:moved', island.serializePlayer(session), session.socketId)
      // check NPC interaction (auto-trigger dialog if walked into NPC)
      const npc = island.npcs.find(n => n.x === nx && n.y === ny)
      if (npc) {
        this.safeEmit(session.socket, 'npc:nearby', { npc })
      }
      return 'moved'
    })
    if (result === null) {
      // Action was locked — another action in progress
      logSuspicious(session.socketId, session.character?.name, 'move', 'action lock conflict')
    }
  }

  playerAttack(session, monsterId) {
    if (!session) return
    const result = withLock(session.socketId, () => {
      const c = session.character
      if (c.hp <= 0) return
      const island = this.islands.get(c.currentIsland)
      if (!island) return
      const monster = island.monsters.get(monsterId)
      // Validate target (anti-cheat: must exist, be alive, be on this island)
      const targetCheck = validateAttackTarget(session, monster, island)
      if (!targetCheck.ok) {
        logSuspicious(session.socketId, c.name, 'attack', `${targetCheck.reason}: ${monsterId}`)
        return
      }
      this.playerAttackMonster(session, monster, island)
    })
    if (result === null) {
      logSuspicious(session.socketId, session.character?.name, 'attack', 'action lock conflict')
    }
  }

  playerAttackMonster(session, monster, island) {
    const now = Date.now()
    if (now - session.lastAttack < CONFIG.ATTACK_COOLDOWN_MS) return
    const c = session.character
    if (c.hp <= 0) return
    // Guard: monster may have died between request and processing
    if (!island.monsters.has(monster.id) || monster.hp <= 0) return
    const stats = computePlayerStats(c)
    const attackSpeedMs = Math.max(400, 900 - stats.speed * 15)
    if (now - session.lastAttack < attackSpeedMs) return
    // range check (anti-cheat: can't attack from across the map)
    const dx = Math.abs(c.x - monster.x), dy = Math.abs(c.y - monster.y)
    const weapon = c.equipment?.weapon
    const weaponDef = weapon?.id ? getItem(weapon.id) : null
    const range = weaponDef?.class === 'ranger' ? 6 : (weaponDef?.class === 'mage' ? 6 : (weaponDef?.class === 'healer' ? 5 : 1))
    if (dx + dy > range) {
      this.safeEmit(session.socket, 'notify', { msg: 'Too far to attack!' })
      return
    }
    session.lastAttack = now
    c.facing = monster.x < c.x ? 'left' : (monster.x > c.x ? 'right' : c.facing)
    const result = calculateBasicAttackDamage(c, monster)
    monster.hp = Math.max(0, monster.hp - result.damage)
    monster.aggro = true
    monster.targetSocketId = session.socketId
    // fx
    island.broadcast('fx:floating', {
      x: monster.x, y: monster.y,
      text: `-${result.damage}${result.crit ? '!' : ''}`,
      color: result.crit ? '#fbbf24' : '#f87171', kind: 'damage'
    })
    this.safeEmit(session.socket, 'log:combat', {
      msg: `You hit ${monster.name} for ${result.damage}${result.crit ? ' (CRIT)' : ''}.`,
      type: 'player'
    })
    if (monster.hp <= 0) {
      this.handleMonsterDeath(session, monster, island)
    } else {
      island.broadcast('monster:update', [{ id: monster.id, x: monster.x, y: monster.y, hp: monster.hp, aggro: true }])
    }
  }

  playerUseSkill(session, skillId, targetMonsterId) {
    if (!session) return
    // Validate skill (anti-cheat: must belong to player's class, meet unlock level)
    const skillCheck = validateSkillUse(session, skillId)
    if (!skillCheck.ok) {
      logSuspicious(session.socketId, session.character?.name, 'skill', `${skillCheck.reason}: ${skillId}`)
      return
    }
    const result = withLock(session.socketId, () => {
      const c = session.character
      const skill = skillCheck.skill
      const now = Date.now()
      if (session.skillCooldowns[skillId] && now - session.skillCooldowns[skillId] < skill.cooldown) {
        this.safeEmit(session.socket, 'notify', { msg: `${skill.name} is on cooldown.` })
        return
      }
      if (c.mp < skill.manaCost) {
        this.safeEmit(session.socket, 'notify', { msg: 'Not enough mana!' })
        return
      }
      const island = this.islands.get(c.currentIsland)
      if (!island) return
      c.mp -= skill.manaCost
      session.skillCooldowns[skillId] = now
      if (skill.healMultiplier) {
        const stats = computePlayerStats(c)
        const heal = Math.floor(stats.magic * skill.healMultiplier)
        c.hp = Math.min(c.maxHp, c.hp + heal)
        island.broadcast('fx:floating', { x: c.x, y: c.y, text: `+${heal}`, color: '#4ade80', kind: 'heal' })
        this.safeEmit(session.socket, 'log:combat', { msg: `You cast ${skill.name} and heal ${heal} HP.`, type: 'player' })
        this.safeEmit(session.socket, 'player:update', island.serializePlayerSelf(session))
        return
      }
      if (skill.buff) {
        c.buffs = [...(c.buffs || []), { ...skill.buff, startTime: now, skillId }]
        this.safeEmit(session.socket, 'log:combat', { msg: `You cast ${skill.name}.`, type: 'player' })
        this.safeEmit(session.socket, 'player:update', island.serializePlayerSelf(session))
        return
      }
      // offensive skill
      let target = targetMonsterId
      if (!target) {
        // auto-target nearest monster in range
        let nearest = null, nearestDist = Infinity
        for (const m of island.monsters.values()) {
          if (m.hp <= 0) continue
          const d = Math.abs(m.x - c.x) + Math.abs(m.y - c.y)
          if (d < nearestDist && d <= 6) { nearestDist = d; nearest = m }
        }
        if (!nearest) {
          this.safeEmit(session.socket, 'notify', { msg: 'No target!' })
          // refund MP
          c.mp += skill.manaCost
          delete session.skillCooldowns[skillId]
          return
        }
        target = nearest.id
      }
      const monster = island.monsters.get(target)
      if (!monster || monster.hp <= 0) {
        this.safeEmit(session.socket, 'notify', { msg: 'Invalid target.' })
        c.mp += skill.manaCost
        delete session.skillCooldowns[skillId]
        return
      }
      const dmgResult = calculateSkillDamage(c, monster, skillId)
      monster.hp = Math.max(0, monster.hp - dmgResult.damage)
      monster.aggro = true
      monster.targetSocketId = session.socketId
      island.broadcast('fx:floating', {
        x: monster.x, y: monster.y,
        text: `-${dmgResult.damage}${dmgResult.crit ? '!' : ''}✦`,
        color: dmgResult.crit ? '#fbbf24' : '#c084fc', kind: 'damage'
      })
      this.safeEmit(session.socket, 'log:combat', { msg: `You cast ${skill.name} on ${monster.name} for ${dmgResult.damage}.`, type: 'player' })
      if (monster.hp <= 0) {
        this.handleMonsterDeath(session, monster, island)
      } else {
        island.broadcast('monster:update', [{ id: monster.id, x: monster.x, y: monster.y, hp: monster.hp, aggro: true }])
      }
      this.safeEmit(session.socket, 'player:update', island.serializePlayerSelf(session))
    })
    if (result === null) {
      logSuspicious(session.socketId, session.character?.name, 'skill', 'action lock conflict')
    }
  }

  handleMonsterDeath(session, monster, island) {
    // Guard: prevent double-kill (monster already removed by a concurrent attack)
    if (!island.monsters.has(monster.id)) return
    island.monsters.delete(monster.id)
    island.broadcast('monster:despawn', { id: monster.id })
    // XP, gold, drops
    const c = session.character
    c.killCounts[monster.defId] = (c.killCounts[monster.defId] || 0) + 1
    if (monster.boss) {
      c.killedBosses = c.killedBosses.includes(monster.defId) ? c.killedBosses : [...c.killedBosses, monster.defId]
    }
    const drops = this.rollDrops(monster)
    let goldGained = 0
    for (const drop of drops) {
      if (drop.id === 'gold_coin') {
        goldGained += drop.qty
      } else {
        // Enforce inventory limit
        if (c.inventory.length >= CONFIG.MAX_INVENTORY_SLOTS) {
          this.safeEmit(session.socket, 'notify', { msg: 'Inventory full! Drop lost.' })
          break
        }
        c.inventory = addItemToInventory(c.inventory, drop.id, drop.qty)
        const def = getItem(drop.id)
        this.safeEmit(session.socket, 'notify', { msg: `Looted: ${def?.icon || ''} ${def?.name || drop.id} x${drop.qty}` })
      }
    }
    if (goldGained > 0) c.gold = Math.max(0, c.gold + goldGained)
    const xpResult = applyXp(c, monster.xp)
    this.safeEmit(session.socket, 'fx:floating', { x: monster.x, y: monster.y, text: `+${monster.xp} XP`, color: '#22d3ee', kind: 'xp' })
    this.safeEmit(session.socket, 'log:combat', {
      msg: `You slain ${monster.name}! +${monster.xp} XP${goldGained ? `, +${goldGained} gold` : ''}.`,
      type: 'kill'
    })
    if (xpResult.leveledUp) {
      this.safeEmit(session.socket, 'player:levelup', { level: c.level })
      this.safeEmit(session.socket, 'notify', { msg: `Level Up! You are now level ${c.level}!` })
      this.safeEmit(session.socket, 'fx:floating', { x: c.x, y: c.y, text: 'LEVEL UP!', color: '#fde047', kind: 'levelup' })
      this.safeEmit(session.socket, 'log:combat', { msg: `Level up! You are now level ${c.level}!`, type: 'system' })
    }
    this.safeEmit(session.socket, 'player:update', island.serializePlayerSelf(session))
    // check quest completion
    this.checkQuests(session, island)
    // schedule respawn (capture islandId to avoid stale reference)
    const islandId = island.islandId
    const monsterDefId = monster.defId
    const respawnMs = monster.boss
      ? CONFIG.BOSS_RESPAWN_MS
      : CONFIG.MONSTER_RESPAWN_MIN_MS + Math.random() * (CONFIG.MONSTER_RESPAWN_MAX_MS - CONFIG.MONSTER_RESPAWN_MIN_MS)
    setTimeout(() => {
      const isl = this.islands.get(islandId)
      if (isl && isl.players.size > 0) {
        isl.spawnMonster(monsterDefId)
      }
    }, respawnMs)
    saveCharacter(c)
  }

  // Safe socket emit — catches errors if socket disconnected mid-operation
  safeEmit(socket, event, data) {
    if (!socket || !socket.connected) return
    try { socket.emit(event, data) } catch (e) {
      // Socket may have been destroyed between check and emit
    }
  }

  rollDrops(monster) {
    const drops = []
    if (!monster.drops) return drops
    for (const drop of monster.drops) {
      if (Math.random() < drop.chance) {
        const qty = drop.qty ? drop.qty[0] + Math.floor(Math.random() * (drop.qty[1] - drop.qty[0] + 1)) : 1
        drops.push({ id: drop.id, qty })
      }
    }
    const gold = monster.gold ? monster.gold[0] + Math.floor(Math.random() * (monster.gold[1] - monster.gold[0] + 1)) : 0
    if (gold > 0) drops.push({ id: 'gold_coin', qty: gold })
    return drops
  }

  handlePlayerDeath(session) {
    const c = session.character
    if (c.hp > 0) return // not actually dead, ignore
    const goldLost = Math.min(c.gold, Math.floor(c.gold * CONFIG.RESPAWN_HP_PENALTY_GOLD_PCT / 100))
    c.gold = Math.max(0, c.gold - goldLost)
    c.hp = 0
    this.safeEmit(session.socket, 'player:death', { goldLost })
    this.safeEmit(session.socket, 'log:combat', { msg: `You died! Lost ${goldLost} gold.`, type: 'death' })
    const island = this.islands.get(c.currentIsland)
    this.safeEmit(session.socket, 'player:update', island?.serializePlayerSelf(session))
    saveCharacter(c)
  }

  playerRespawn(session) {
    // Validate (anti-cheat: must actually be dead to respawn — prevents free HP/MP refill)
    const check = validateRespawn(session)
    if (!check.ok) {
      logSuspicious(session.socketId, session.character?.name, 'respawn', check.reason)
      return
    }
    const c = session.character
    const start = getIslandStart(c.currentIsland)
    c.hp = c.maxHp
    c.mp = c.maxMp
    c.x = start.x
    c.y = start.y
    c.buffs = []
    const island = this.islands.get(c.currentIsland)
    if (island) {
      island.broadcast('player:moved', island.serializePlayer(session))
      this.safeEmit(session.socket, 'player:respawn', island.serializePlayerSelf(session))
    }
    saveCharacter(c)
  }

  // ===== Inventory actions =====
  playerEquip(session, itemId) {
    // Validate (anti-cheat: must be equipment, match class, meet level)
    const check = validateEquip(session, itemId)
    if (!check.ok) {
      logSuspicious(session.socketId, session.character?.name, 'equip', `${check.reason}: ${itemId}`)
      this.safeEmit(session.socket, 'notify', { msg: `Cannot equip: ${check.reason}` })
      return
    }
    const result = withLock(session.socketId, () => {
      const c = session.character
      if (!hasItem(c.inventory, itemId, 1)) {
        return { error: 'item not in inventory' }
      }
      const equipResult = equipItem(c, c.inventory, itemId)
      c.equipment = equipResult.player.equipment
      c.inventory = equipResult.inventory
      return { ok: true }
    })
    if (result === null) {
      logSuspicious(session.socketId, session.character?.name, 'equip', 'action lock conflict')
      return
    }
    if (result.error) {
      this.safeEmit(session.socket, 'notify', { msg: result.error })
      return
    }
    const island = this.islands.get(session.character.currentIsland)
    this.safeEmit(session.socket, 'player:update', island.serializePlayerSelf(session))
    this.safeEmit(session.socket, 'notify', { msg: `Equipped ${getItem(itemId)?.name}.` })
    saveCharacter(session.character)
  }

  playerUnequip(session, slot) {
    // Validate slot name (anti-cheat: only valid equipment slots)
    if (!['weapon', 'armor', 'helmet', 'shield', 'boots', 'trinket'].includes(slot)) {
      logSuspicious(session.socketId, session.character?.name, 'unequip', `invalid slot: ${slot}`)
      return
    }
    const result = withLock(session.socketId, () => {
      const c = session.character
      if (!c.equipment || !c.equipment[slot]) {
        return { error: 'slot is empty' }
      }
      const equipResult = unequipItem(c, c.inventory, slot)
      c.equipment = equipResult.player.equipment
      c.inventory = equipResult.inventory
      return { ok: true }
    })
    if (result === null) {
      logSuspicious(session.socketId, session.character?.name, 'unequip', 'action lock conflict')
      return
    }
    if (result.error) {
      this.safeEmit(session.socket, 'notify', { msg: result.error })
      return
    }
    const island = this.islands.get(session.character.currentIsland)
    this.safeEmit(session.socket, 'player:update', island.serializePlayerSelf(session))
    saveCharacter(session.character)
  }

  playerUseItem(session, itemId) {
    // Validate (anti-cheat: must be consumable, meet level)
    const check = validateUseItem(session, itemId)
    if (!check.ok) {
      logSuspicious(session.socketId, session.character?.name, 'use-item', `${check.reason}: ${itemId}`)
      return
    }
    const result = withLock(session.socketId, () => {
      const c = session.character
      if (!hasItem(c.inventory, itemId, 1)) {
        return { error: 'item not in inventory' }
      }
      const useResult = useConsumable(c, c.inventory, itemId)
      if (!useResult.message) return { error: 'cannot use' }
      return { ok: true, message: useResult.message }
    })
    if (result === null) {
      logSuspicious(session.socketId, session.character?.name, 'use-item', 'action lock conflict')
      return
    }
    if (result.error) {
      this.safeEmit(session.socket, 'notify', { msg: result.error })
      return
    }
    const island = this.islands.get(session.character.currentIsland)
    this.safeEmit(session.socket, 'player:update', island.serializePlayerSelf(session))
    this.safeEmit(session.socket, 'notify', { msg: result.message })
    saveCharacter(session.character)
  }

  // ===== Shop =====
  playerBuy(session, npcId, itemId, qty) {
    const c = session.character
    const island = this.islands.get(c.currentIsland)
    // Validate (anti-cheat: must be near NPC, item in shop, qty valid, enough gold)
    const check = validateShopBuy(session, island, npcId, itemId, qty)
    if (!check.ok) {
      logSuspicious(session.socketId, c.name, 'buy', `${check.reason}: npc=${npcId} item=${itemId} qty=${qty}`)
      this.safeEmit(session.socket, 'notify', { msg: check.reason === 'not enough gold' ? 'Not enough gold!' : 'Cannot buy that.' })
      return
    }
    const result = withLock(session.socketId, () => {
      // Re-check gold inside lock (in case it changed)
      if (c.gold < check.total) return { error: 'not enough gold' }
      const buyResult = buyItem(c.inventory, c.gold, itemId, qty, check.entry.price)
      if (!buyResult.success) return { error: 'purchase failed' }
      c.inventory = buyResult.inventory
      c.gold = buyResult.gold
      return { ok: true }
    })
    if (result === null) {
      logSuspicious(session.socketId, c.name, 'buy', 'action lock conflict')
      return
    }
    if (result.error) {
      this.safeEmit(session.socket, 'notify', { msg: result.error === 'not enough gold' ? 'Not enough gold!' : 'Purchase failed.' })
      return
    }
    this.safeEmit(session.socket, 'player:update', island.serializePlayerSelf(session))
    this.safeEmit(session.socket, 'notify', { msg: `Bought ${qty}x ${getItem(itemId)?.name} for ${check.total} gold.` })
    saveCharacter(c)
  }

  playerSell(session, itemId, qty) {
    const c = session.character
    const island = this.islands.get(c.currentIsland)
    // Validate (anti-cheat: item exists, is sellable, player has enough)
    const check = validateShopSell(session, island, itemId, qty)
    if (!check.ok) {
      logSuspicious(session.socketId, c.name, 'sell', `${check.reason}: item=${itemId} qty=${qty}`)
      this.safeEmit(session.socket, 'notify', { msg: 'Cannot sell that.' })
      return
    }
    const result = withLock(session.socketId, () => {
      const sellResult = sellItem(c.inventory, itemId, qty)
      if (sellResult.gold === 0) return { error: 'sell failed' }
      c.inventory = sellResult.inventory
      c.gold = Math.max(0, (c.gold || 0) + sellResult.gold)
      return { ok: true, gold: sellResult.gold }
    })
    if (result === null) {
      logSuspicious(session.socketId, c.name, 'sell', 'action lock conflict')
      return
    }
    if (result.error) {
      this.safeEmit(session.socket, 'notify', { msg: 'Cannot sell this item.' })
      return
    }
    this.safeEmit(session.socket, 'player:update', island.serializePlayerSelf(session))
    this.safeEmit(session.socket, 'notify', { msg: `Sold ${qty}x ${getItem(itemId)?.name} for ${result.gold} gold.` })
    saveCharacter(c)
  }

  // ===== Quests =====
  playerAcceptQuest(session, questId) {
    const c = session.character
    const island = this.islands.get(c.currentIsland)
    // Validate (anti-cheat: must be on correct island, near quest giver, meet level)
    const check = validateQuestAccept(session, island, questId)
    if (!check.ok) {
      logSuspicious(session.socketId, c.name, 'quest-accept', `${check.reason}: ${questId}`)
      this.safeEmit(session.socket, 'notify', { msg: check.reason.includes('level') ? check.reason : 'You cannot accept this quest.' })
      return
    }
    const result = withLock(session.socketId, () => {
      c.questProgress = acceptQuest(c.questProgress, questId)
      return { ok: true }
    })
    if (result === null) {
      logSuspicious(session.socketId, c.name, 'quest-accept', 'action lock conflict')
      return
    }
    this.safeEmit(session.socket, 'notify', { msg: `Quest accepted: ${QUESTS[questId]?.title}` })
    this.safeEmit(session.socket, 'player:update', island.serializePlayerSelf(session))
    saveCharacter(c)
  }

  playerTurnInQuest(session, questId) {
    const c = session.character
    const island = this.islands.get(c.currentIsland)
    // Validate (anti-cheat: must be complete, near quest giver, have items for collect quests)
    const check = validateQuestTurnIn(session, island, questId)
    if (!check.ok) {
      logSuspicious(session.socketId, c.name, 'quest-turnin', `${check.reason}: ${questId}`)
      this.safeEmit(session.socket, 'notify', { msg: check.reason === 'quest not complete' ? 'Quest not yet complete.' : 'Cannot turn in this quest.' })
      return
    }
    const result = withLock(session.socketId, () => {
      const turnInResult = turnInQuest(c, c.inventory, c.questProgress, questId)
      // update character
      Object.assign(c, turnInResult.player)
      c.inventory = turnInResult.inventory
      c.questProgress = turnInResult.questProgress
      // apply pending XP
      if (c.pendingXp) {
        const xp = c.pendingXp
        delete c.pendingXp
        const xpResult = applyXp(c, xp)
        if (xpResult.leveledUp) {
          this.safeEmit(session.socket, 'player:levelup', { level: c.level })
          this.safeEmit(session.socket, 'notify', { msg: `Level Up! You are now level ${c.level}!` })
        }
      }
      return { ok: true }
    })
    if (result === null) {
      logSuspicious(session.socketId, c.name, 'quest-turnin', 'action lock conflict')
      return
    }
    this.safeEmit(session.socket, 'player:update', island.serializePlayerSelf(session))
    this.safeEmit(session.socket, 'notify', { msg: `Quest complete: ${QUESTS[questId]?.title}` })
    saveCharacter(c)
  }

  checkQuests(session, island) {
    const c = session.character
    const result = checkQuestCompletion(c, c.inventory, c.questProgress, c.killCounts)
    if (result.newlyCompleted.length > 0) {
      c.questProgress = result.questProgress
      for (const qId of result.newlyCompleted) {
        this.safeEmit(session.socket, 'notify', { msg: `Quest Complete: ${QUESTS[qId].title}! Return to the quest giver.` })
      }
      this.safeEmit(session.socket, 'player:update', island.serializePlayerSelf(session))
    }
  }

  // ===== Travel =====
  playerTravel(session, targetIslandId) {
    const c = session.character
    // Validate (anti-cheat: must be alive, valid destination)
    const check = validateTravel(session, targetIslandId)
    if (!check.ok) {
      logSuspicious(session.socketId, c.name, 'travel', `${check.reason}: ${targetIslandId}`)
      this.safeEmit(session.socket, 'notify', { msg: check.reason === 'player is dead' ? 'You cannot travel while dead.' : 'Invalid destination.' })
      return
    }
    const def = check.def
    // Validate: must be reachable from current island via a sailor NPC
    const currentIsland = this.islands.get(c.currentIsland)
    let reachable = false
    let requiredLevel = 1
    let sailorNpc = null
    if (currentIsland) {
      for (const npc of currentIsland.npcs) {
        if (!npc.travel) continue
        const options = npc.travel.options || (npc.travel.to ? [{ to: npc.travel.to, reqLevel: npc.reqLevel || 1 }] : [])
        for (const opt of options) {
          if (opt.to === targetIslandId) {
            reachable = true
            requiredLevel = opt.reqLevel || 1
            sailorNpc = npc
            break
          }
        }
        if (reachable) break
      }
    }
    if (!reachable) {
      logSuspicious(session.socketId, c.name, 'travel', `unreachable: ${targetIslandId}`)
      this.safeEmit(session.socket, 'notify', { msg: 'You cannot travel there from this island.' })
      return
    }
    if (c.level < requiredLevel) {
      this.safeEmit(session.socket, 'notify', { msg: `You must be level ${requiredLevel} to travel to ${def.name}.` })
      return
    }
    // Proximity check: must be near the sailor NPC
    const dist = Math.abs(c.x - sailorNpc.x) + Math.abs(c.y - sailorNpc.y)
    if (dist > 3) {
      this.safeEmit(session.socket, 'notify', { msg: 'You must be near the sailor to travel.' })
      return
    }
    const result = withLock(session.socketId, () => {
      // remove from current island
      if (currentIsland) {
        currentIsland.removePlayer(session.socketId)
        currentIsland.players.delete(session.socketId)
      }
      // place on new island
      const start = getIslandStart(targetIslandId)
      c.x = start.x; c.y = start.y
      c.hp = c.maxHp; c.mp = c.maxMp; c.buffs = []
      this.playerJoinIsland(session, targetIslandId)
      return { ok: true }
    })
    if (result === null) {
      logSuspicious(session.socketId, c.name, 'travel', 'action lock conflict')
      return
    }
    this.safeEmit(session.socket, 'notify', { msg: `Traveled to ${def.name}.` })
    saveCharacter(c)
  }

  // ===== Chat =====
  playerChat(session, message) {
    const c = session.character
    const now = Date.now()
    if (now - session.lastChat < CONFIG.CHAT_COOLDOWN_MS) return
    // Sanitize (anti-XSS: strip HTML tags, control chars, event handlers)
    const cleanMsg = sanitizeChatMessage(message)
    if (!cleanMsg) return
    if (cleanMsg.length > CONFIG.CHAT_MAX_LENGTH) return
    session.lastChat = now
    const island = this.islands.get(c.currentIsland)
    if (!island) return
    island.broadcast('chat', {
      playerId: session.socketId,
      playerName: c.name,
      message: cleanMsg,
      classColor: c.classDef?.color,
    })
  }

  // ===== Character creation =====
  createCharacter(ownerUsername, name, classId, gender = 'male') {
    const cls = CLASSES[classId]
    if (!cls) return { error: 'Invalid class' }
    const nameErr = validateCharName(name)
    if (nameErr) return { error: nameErr }
    if (getCharacterByName(name)) return { error: 'A character with that name already exists' }
    // Enforce per-account character limit
    const count = countCharactersByOwner(ownerUsername)
    if (count >= CONFIG.MAX_CHARACTERS_PER_ACCOUNT) {
      return { error: `Character limit reached (max ${CONFIG.MAX_CHARACTERS_PER_ACCOUNT} per account)` }
    }
    const character = {
      id: `char_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      owner: ownerUsername.toLowerCase(),
      name: name.trim(),
      class: classId,
      classDef: cls,
      gender,
      level: 1,
      xp: 0,
      gold: CONFIG.STARTING_GOLD,
      hp: cls.baseStats.hp,
      mp: cls.baseStats.mp,
      maxHp: cls.baseStats.hp,
      maxMp: cls.baseStats.mp,
      baseStats: { ...cls.baseStats },
      equipment: { weapon: null, armor: null, helmet: null, shield: null, boots: null, trinket: null },
      inventory: [],
      buffs: [],
      questProgress: {},
      killCounts: {},
      visitedIslands: ['lumina'],
      killedBosses: [],
      currentIsland: 'lumina',
      x: 30, y: 25,
      facing: 'down',
      createdAt: Date.now(),
    }
    // starting items
    for (const item of cls.startingItems) {
      character.inventory = addItemToInventory(character.inventory, item.id, item.qty)
    }
    // auto-equip starting weapon
    for (const item of cls.startingItems) {
      const def = getItem(item.id)
      if (def && def.type === 'weapon') {
        const result = equipItem(character, character.inventory, item.id)
        character.equipment = result.player.equipment
        character.inventory = result.inventory
      } else if (def && def.type === 'armor' && def.slot === 'armor') {
        const result = equipItem(character, character.inventory, item.id)
        character.equipment = result.player.equipment
        character.inventory = result.inventory
      }
    }
    // place at village center
    const start = getIslandStart('lumina')
    character.x = start.x; character.y = start.y
    saveCharacter(character)
    return { character }
  }

  // ===== Online players list =====
  getOnlinePlayersList() {
    const list = []
    for (const session of this.sessions.values()) {
      if (!session.character) continue
      const c = session.character
      list.push({
        id: session.socketId,
        name: c.name,
        class: c.class,
        classDef: { name: c.classDef?.name, color: c.classDef?.color, icon: c.classDef?.icon },
        level: c.level,
        currentIsland: c.currentIsland,
        hp: c.hp,
        maxHp: c.maxHp,
      })
    }
    return list
  }

  // ===== Inspect another player =====
  inspectPlayer(session, targetSocketId) {
    const target = this.sessions.get(targetSocketId)
    if (!target || !target.character) {
      this.safeEmit(session.socket, SERVER_EVENTS.ERROR, { message: 'Player not found.' })
      return
    }
    const c = target.character
    const stats = computePlayerStats(c)
    this.safeEmit(session.socket, 'player:inspect', {
      id: target.socketId,
      name: c.name,
      class: c.class,
      classDef: { name: c.classDef?.name, color: c.classDef?.color, icon: c.classDef?.icon },
      level: c.level,
      hp: c.hp,
      maxHp: stats.hp,
      mp: c.mp,
      maxMp: stats.mp,
      gold: c.gold,
      currentIsland: c.currentIsland,
      killedBosses: c.killedBosses || [],
      visitedIslands: c.visitedIslands || [],
      // equipment (visible)
      equipment: Object.fromEntries(
        Object.entries(c.equipment || {}).map(([slot, eq]) => [slot, eq?.id || null])
      ),
      stats: {
        attack: stats.attack,
        defense: stats.defense,
        magic: stats.magic,
        speed: stats.speed,
      },
    })
  }

  // ===== Leaderboard =====
  getLeaderboard(limit = CONFIG.LEADERBOARD_SIZE) {
    const allChars = getAllCharacters()
    allChars.sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level
      if (b.xp !== a.xp) return b.xp - a.xp
      return a.name.localeCompare(b.name)
    })
    return allChars.slice(0, limit).map((c, i) => ({
      rank: i + 1,
      name: c.name,
      class: c.class,
      classDef: { name: c.classDef?.name, color: c.classDef?.color, icon: c.classDef?.icon },
      level: c.level,
      currentIsland: c.currentIsland,
      killedBosses: (c.killedBosses || []).length,
    }))
  }

  // ===== Single-session enforcement =====
  // Kick any existing session for the same character (prevents dupes)
  kickExistingSessionForCharacter(characterId, exceptSocketId = null) {
    for (const [socketId, session] of this.sessions.entries()) {
      if (socketId === exceptSocketId) continue
      if (session.character && session.character.id === characterId) {
        // Kick the old session
        try {
          this.safeEmit(session.socket, 'kick', { reason: 'Your character logged in from another location.' })
          session.socket.disconnect(true)
        } catch {}
        this.removeSession(socketId)
        return true
      }
    }
    return false
  }

  // ===== Server stats =====
  getServerStats() {
    let totalMonsters = 0
    let totalIslands = 0
    for (const island of this.islands.values()) {
      totalIslands++
      totalMonsters += island.monsters.size
    }
    return {
      onlinePlayers: this.sessions.size,
      activeIslands: totalIslands,
      totalMonsters,
      uptime: process.uptime(),
    }
  }
}
