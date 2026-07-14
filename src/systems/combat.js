// ============================================================
// Aetheria: Nine Isles - Combat system
// Handles player vs monster combat, damage calc, XP, drops
// ============================================================

import { getItem } from '../data/items.js'
import { getMonster } from '../data/monsters.js'
import { SKILLS } from '../data/classes.js'

const ELEMENTAL_MULTIPLIERS = {
  fire: { ice: 1.5, water: 0.7, fire: 0.5, plant: 1.3 },
  ice: { fire: 0.7, ice: 0.5, plant: 1.2 },
  water: { fire: 1.5, water: 0.5 },
  holy: { shadow: 1.8, holy: 1.0 },
  shadow: { holy: 0.5, shadow: 0.5 },
  air: { air: 0.5 },
}

export function getElementalMultiplier(attackerElement, defenderElement) {
  if (!attackerElement || attackerElement === 'none' || !defenderElement || defenderElement === 'none') return 1
  return ELEMENTAL_MULTIPLIERS[attackerElement]?.[defenderElement] ?? 1
}

// Calculate player's effective stats (including equipment)
export function computePlayerStats(player) {
  const cls = player.class
  const base = {
    hp: player.maxHp,
    mp: player.maxMp,
    attack: player.baseStats.attack,
    defense: player.baseStats.defense,
    magic: player.baseStats.magic,
    speed: player.baseStats.speed,
  }
  if (player.equipment) {
    for (const slot of ['weapon', 'armor', 'helmet', 'shield', 'boots', 'trinket']) {
      const item = player.equipment[slot]
      if (item && item.id) {
        const def = getItem(item.id)
        if (!def) continue
        if (def.attack) base.attack += def.attack
        if (def.defense) base.defense += def.defense
        if (def.magic) base.magic += def.magic
        if (def.speed) base.speed += def.speed
        if (def.hp) base.hp += def.hp
        if (def.mp) base.mp += def.mp
      }
    }
  }
  // Apply buffs
  if (player.buffs) {
    for (const buff of player.buffs) {
      if (buff.attack) base.attack = Math.floor(base.attack * (1 + buff.attack))
      if (buff.defense) base.defense = Math.floor(base.defense * (1 + buff.defense))
    }
  }
  return base
}

// Calculate damage for a basic attack
export function calculateBasicAttackDamage(attacker, defender, rng = Math.random) {
  const stats = computePlayerStats(attacker)
  const weapon = attacker.equipment?.weapon
  const weaponDef = weapon?.id ? getItem(weapon.id) : null
  const element = weaponDef?.element || 'none'
  const baseAttack = stats.attack
  const variance = 0.85 + rng() * 0.3
  let damage = baseAttack * variance
  // elemental multiplier
  const elemMult = getElementalMultiplier(element, defender.element || 'none')
  damage *= elemMult
  // defense reduction
  damage = Math.max(1, damage - (defender.defense || 0) * 0.6)
  return { damage: Math.floor(damage), element, crit: variance > 1.1 }
}

// Calculate skill damage
export function calculateSkillDamage(attacker, defender, skillId, rng = Math.random) {
  const skill = SKILLS[skillId]
  if (!skill) return calculateBasicAttackDamage(attacker, defender, rng)
  const stats = computePlayerStats(attacker)
  const isMagic = skill.class === 'mage' || skill.class === 'healer'
  const baseStat = isMagic ? stats.magic : stats.attack
  const variance = 0.85 + rng() * 0.3
  let damage = baseStat * skill.damageMultiplier * variance
  const elemMult = getElementalMultiplier(skill.element || 'none', defender.element || 'none')
  damage *= elemMult
  // bonus vs undead
  if (skill.bonusVsUndead && defender.element === 'shadow') {
    damage *= skill.bonusVsUndead
  }
  damage = Math.max(1, damage - (defender.defense || 0) * 0.5)
  return { damage: Math.floor(damage), element: skill.element || 'none', crit: variance > 1.1, skill: true }
}

// Monster attack on player
export function calculateMonsterAttackDamage(monster, player, rng = Math.random) {
  const variance = 0.85 + rng() * 0.3
  let damage = monster.attack * variance
  const stats = computePlayerStats(player)
  damage = Math.max(1, damage - stats.defense * 0.6)
  return { damage: Math.floor(damage), crit: variance > 1.1 }
}

// Generate loot drops for a monster
export function rollDrops(monster, rng = Math.random) {
  const drops = []
  if (!monster.drops) return drops
  for (const drop of monster.drops) {
    if (rng() < drop.chance) {
      const qty = drop.qty ? drop.qty[0] + Math.floor(rng() * (drop.qty[1] - drop.qty[0] + 1)) : 1
      drops.push({ id: drop.id, qty })
    }
  }
  // gold
  const gold = monster.gold ? monster.gold[0] + Math.floor(rng() * (monster.gold[1] - monster.gold[0] + 1)) : 0
  if (gold > 0) drops.push({ id: 'gold_coin', qty: gold })
  return drops
}

// XP needed to reach next level
export function xpForLevel(level) {
  return Math.floor(80 * Math.pow(level, 1.5))
}

// Apply XP gain and check for level up
export function applyXp(player, xp) {
  let leveledUp = false
  let levelsGained = 0
  player.xp += xp
  while (player.xp >= xpForLevel(player.level)) {
    player.xp -= xpForLevel(player.level)
    player.level += 1
    leveledUp = true
    levelsGained += 1
    // apply growth
    const cls = player.classDef
    if (cls) {
      const g = cls.growth
      player.maxHp += Math.floor(g.hp)
      player.maxMp += Math.floor(g.mp)
      player.baseStats.attack += g.attack
      player.baseStats.defense += g.defense
      player.baseStats.magic += g.magic
      player.baseStats.speed += g.speed
    }
    player.hp = player.maxHp
    player.mp = player.maxMp
  }
  return { leveledUp, levelsGained }
}

// Process a kill: drop loot, give XP
export function processKill(state, monster) {
  const drops = rollDrops(monster)
  const xpResult = applyXp(state.player, monster.xp)
  return { drops, xpResult, xpGained: monster.xp }
}
