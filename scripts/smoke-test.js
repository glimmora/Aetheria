// Smoke test: verify core game data and systems (now in shared/)
import { CLASSES, getSkillsForClass } from '../shared/classes.js'
import { ITEMS, getItem } from '../shared/items.js'
import { MONSTERS, getMonster } from '../shared/monsters.js'
import { ISLAND_DEFS, getIslandMap, placeNpcs, getIslandSpawnPoints } from '../shared/islands.js'
import { QUESTS, QUEST_STATUS } from '../shared/quests.js'
import { calculateBasicAttackDamage, applyXp, computePlayerStats } from '../shared/combat.js'
import { addItemToInventory, equipItem } from '../shared/inventory.js'

let pass = 0, fail = 0
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`) }
  else { fail++; console.error(`  ✗ ${msg}`) }
}

console.log('\n=== Mythral Smoke Test (shared/ data) ===\n')

console.log('Classes:')
assert(Object.keys(CLASSES).length === 4, '4 playable classes defined')
assert(getSkillsForClass('warrior', 1).length >= 1, 'Warrior has starting skills')

console.log('\nItems:')
assert(Object.keys(ITEMS).length >= 50, '50+ items defined')
assert(getItem('health_potion').heal === 60, 'Health potion heals 60')

console.log('\nMonsters:')
assert(Object.keys(MONSTERS).length >= 30, '30+ monsters defined')
assert(getMonster('voidlord_acheron').finalBoss, 'Voidlord Acheron is final boss')

console.log('\nIslands:')
const islandList = Object.values(ISLAND_DEFS)
assert(islandList.length === 9, '9 unique islands defined')
let totalNpcs = 0
for (const isl of islandList) {
  assert(isl.npcs.length >= 8 && isl.npcs.length <= 18, `${isl.name}: ${isl.npcs.length} NPCs`)
  totalNpcs += isl.npcs.length
}
console.log(`  Total NPCs: ${totalNpcs}`)

console.log('\nIsland map generation:')
for (const isl of islandList) {
  const map = getIslandMap(isl.id)
  assert(map && map.length > 0, `${isl.name}: map generated`)
  const spawns = getIslandSpawnPoints(isl.id)
  assert(spawns.length > 0, `${isl.name}: ${spawns.length} spawn points`)
}

console.log('\nNPC placement:')
for (const isl of islandList) {
  const npcs = placeNpcs(isl.id)
  assert(npcs.length === isl.npcs.length, `${isl.name}: all NPCs placed`)
}

console.log('\nQuests:')
const questList = Object.values(QUESTS)
console.log(`  Total quests: ${questList.length}`)
assert(questList.length >= 60, '60+ quests defined')
assert(QUEST_STATUS.AVAILABLE === 'available', 'QUEST_STATUS constant exported')

console.log('\nCombat:')
const player = {
  class: 'warrior', classDef: CLASSES.warrior, level: 5,
  hp: 150, maxHp: 150, mp: 30, maxMp: 30,
  baseStats: { ...CLASSES.warrior.baseStats },
  equipment: { weapon: { id: 'iron_sword' } }, buffs: [],
}
const stats = computePlayerStats(player)
assert(stats.attack === 24, `Warrior with iron sword attack = ${stats.attack}`)
const dmg = calculateBasicAttackDamage(player, getMonster('rat'))
assert(dmg.damage > 0, `Damage to rat = ${dmg.damage}`)

console.log('\nInventory:')
let inv = []
inv = addItemToInventory(inv, 'health_potion', 3)
assert(inv.length === 1 && inv[0].qty === 3, 'Stacking works')
inv = addItemToInventory(inv, 'iron_sword', 2)
assert(inv.length === 2 && inv[1].qty === 2, 'Equipment stacks by id')

console.log('\nXP/Level:')
const lvlPlayer = { ...player, xp: 0, level: 1 }
applyXp(lvlPlayer, 200)
assert(lvlPlayer.level > 1, `Level up from XP: now level ${lvlPlayer.level}`)

console.log(`\n=== Results: ${pass} passed, ${fail} failed ===\n`)
process.exit(fail > 0 ? 1 : 0)
