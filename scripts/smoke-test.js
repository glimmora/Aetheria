// Smoke test: verify core game data and systems
import { CLASSES, getSkillsForClass } from '../src/data/classes.js'
import { ITEMS, getItem } from '../src/data/items.js'
import { MONSTERS, getMonster } from '../src/data/monsters.js'
import { ISLAND_DEFS, getIslandMap, placeNpcs, getIslandSpawnPoints } from '../src/data/islands.js'
import { QUESTS } from '../src/data/quests.js'
import { calculateBasicAttackDamage, applyXp, computePlayerStats } from '../src/systems/combat.js'
import { addItemToInventory, equipItem } from '../src/systems/inventory.js'

let pass = 0, fail = 0
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`) }
  else { fail++; console.error(`  ✗ ${msg}`) }
}

console.log('\n=== Aetheria Smoke Test ===\n')

console.log('Classes:')
assert(Object.keys(CLASSES).length === 4, '4 playable classes defined')
assert(CLASSES.warrior && CLASSES.mage && CLASSES.ranger && CLASSES.healer, 'All four classes present')
assert(getSkillsForClass('warrior', 1).length >= 1, 'Warrior has starting skills')
assert(getSkillsForClass('mage', 14).length > getSkillsForClass('mage', 1).length, 'Mage unlocks more skills at higher level')

console.log('\nItems:')
assert(Object.keys(ITEMS).length >= 50, '50+ items defined')
assert(getItem('rusted_sword').type === 'weapon', 'Rusted sword is a weapon')
assert(getItem('health_potion').heal === 60, 'Health potion heals 60')

console.log('\nMonsters:')
assert(Object.keys(MONSTERS).length >= 30, '30+ monsters defined')
assert(getMonster('rat').level === 1, 'Rat is level 1')
assert(getMonster('voidlord_acheron').finalBoss, 'Voidlord Acheron is final boss')
const bosses = Object.values(MONSTERS).filter(m => m.boss)
console.log(`  Boss count: ${bosses.length}`)
assert(bosses.length >= 8, 'At least 8 bosses (one per non-beginner island)')

console.log('\nIslands:')
const islandList = Object.values(ISLAND_DEFS)
assert(islandList.length === 9, '9 unique islands defined')
let totalNpcs = 0
let totalMonsters = 0
for (const isl of islandList) {
  assert(isl.npcs.length >= 8 && isl.npcs.length <= 18, `${isl.name}: ${isl.npcs.length} NPCs (8-18 range)`)
  totalNpcs += isl.npcs.length
  totalMonsters += isl.spawnConfig.reduce((s, c) => s + c.count, 0)
}
console.log(`  Total NPCs: ${totalNpcs}`)
console.log(`  Total monster spawns: ${totalMonsters}`)

console.log('\nIsland map generation:')
for (const isl of islandList) {
  const map = getIslandMap(isl.id)
  assert(map && map.length > 0, `${isl.name}: map generated (${map.length}x${map[0]?.length})`)
  const spawns = getIslandSpawnPoints(isl.id)
  assert(spawns.length > 0, `${isl.name}: ${spawns.length} spawn points`)
}

console.log('\nNPC placement:')
for (const isl of islandList) {
  const npcs = placeNpcs(isl.id)
  assert(npcs.length === isl.npcs.length, `${isl.name}: all ${npcs.length} NPCs placed`)
  const withPos = npcs.filter(n => n.x !== 0 && n.y !== 0)
  assert(withPos.length === npcs.length, `${isl.name}: all NPCs have valid positions`)
}

console.log('\nQuests:')
const questList = Object.values(QUESTS)
console.log(`  Total quests: ${questList.length}`)
assert(questList.length >= 60, '60+ quests defined')
for (const isl of islandList) {
  const iq = questList.filter(q => q.island === isl.id)
  assert(iq.length >= 3, `${isl.name}: ${iq.length} quests`)
}

console.log('\nCombat:')
const player = {
  class: 'warrior',
  classDef: CLASSES.warrior,
  level: 5,
  hp: 150, maxHp: 150,
  mp: 30, maxMp: 30,
  baseStats: { ...CLASSES.warrior.baseStats },
  equipment: { weapon: { id: 'iron_sword' } },
  buffs: [],
}
const stats = computePlayerStats(player)
assert(stats.attack === 24, `Warrior with iron sword attack = ${stats.attack} (expected 24)`)
const dmg = calculateBasicAttackDamage(player, getMonster('rat'))
assert(dmg.damage > 0, `Damage to rat = ${dmg.damage}`)

console.log('\nInventory:')
let inv = []
inv = addItemToInventory(inv, 'health_potion', 3)
assert(inv.length === 1 && inv[0].qty === 3, 'Stacking consumables works')
inv = addItemToInventory(inv, 'iron_sword', 2)
assert(inv.length === 2 && inv[1].qty === 2, 'Equipment stacks by id (qty=2)')

console.log('\nXP/Level:')
const lvlPlayer = { ...player, xp: 0, level: 1 }
const result = applyXp(lvlPlayer, 200)
assert(lvlPlayer.level > 1, `Level up from XP: now level ${lvlPlayer.level}`)

console.log(`\n=== Results: ${pass} passed, ${fail} failed ===\n`)
process.exit(fail > 0 ? 1 : 0)
