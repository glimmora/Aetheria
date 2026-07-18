# Development Guide

How to extend Mythral. Covers adding content (islands, NPCs, quests, items, monsters, classes) and modifying systems (combat, AI, persistence).

> **Prerequisite:** Read the [Architecture overview](./ARCHITECTURE.md) first to understand the single-world server-authoritative design before making changes.

---

## Table of Contents

1. [Project layout](#1-project-layout)
2. [The `shared/` contract — most common edits](#2-the-shared-contract--most-common-edits)
3. [Adding a new item](#3-adding-a-new-item)
4. [Adding a new monster](#4-adding-a-new-monster)
5. [Adding a new NPC](#5-adding-a-new-npc)
6. [Adding a new quest](#6-adding-a-new-quest)
7. [Adding a new island](#7-adding-a-new-island)
8. [Adding a new class skill](#8-adding-a-new-class-skill)
9. [Adding a new playable class](#9-adding-a-new-playable-class)
10. [Modifying combat balance](#10-modifying-combat-balance)
11. [Modifying monster AI](#11-modifying-monster-ai)
12. [Adding a new socket event](#12-adding-a-new-socket-event)
13. [Adding a new HTTP endpoint](#13-adding-a-new-http-endpoint)
14. [Testing your changes](#14-testing-your-changes)
15. [Code style and conventions](#15-code-style-and-conventions)

---

## 1. Project layout

```
Mythral/
├── client/      # React + Vite (renders server state)
├── server/      # Node.js + Express + Socket.io (authoritative)
├── shared/      # Pure data + logic, imported by both
├── scripts/     # Tests and helpers
└── docs/        # You are here
```

**Key principle:** Most content additions live in `shared/`. The server reads these files to spawn the world; the client reads them to render UI. You rarely need to touch `server/` or `client/` for content work.

| To add... | Edit... | Difficulty |
|---|---|---|
| A new item | `shared/items.js` | Easy |
| A new monster | `shared/monsters.js` + island spawn config | Easy |
| A new NPC dialog | `shared/islands.js` | Easy |
| A new NPC | `shared/islands.js` | Easy |
| A new quest | `shared/quests.js` + NPC `quest:` field | Easy |
| A new skill | `shared/classes.js` | Easy |
| A new island | `shared/islands.js` + `shared/islandGenerator.js` biome | Medium |
| A new class | `shared/classes.js` + client UI tweaks | Medium |
| A new socket event | `shared/protocol.js` + `server/index.js` + `client/src/hooks/useGame.js` | Medium |
| A new HTTP endpoint | `server/index.js` | Easy |
| Combat balance | `shared/combat.js` | Easy (but affects everything) |

---

## 2. The `shared/` contract — most common edits

The `shared/` folder is the source of truth for all game content. Both the client and server import from it. Because it is plain JavaScript (no React, no Node-only APIs), it works in both environments.

### File-by-file

| File | Contents |
|---|---|
| `protocol.js` | Event names, config constants (tick rate, cooldowns, etc.) |
| `classes.js` | 4 classes + 14 skills |
| `items.js` | 60+ items |
| `monsters.js` | 35+ monsters (incl. 8 bosses + final boss) |
| `tiles.js` | Tile type definitions and walkability |
| `islandGenerator.js` | Procedural map generation (fBm noise) |
| `islands.js` | 9 island definitions + 113 NPCs |
| `quests.js` | 89 quests + quest system logic |
| `combat.js` | Damage formulas, XP curves, leveling |
| `inventory.js` | Stack/equip/use/sell logic |

### Hot reload

- **Server** — uses `node --watch`, so changes to `shared/*.js` automatically restart the server
- **Client** — Vite HMR picks up changes to `shared/*.js` and hot-reloads the affected components

You can usually edit a `shared/` file, save, and see the change in your browser within 1-2 seconds without manually restarting anything.

---

## 3. Adding a new item

Open `shared/items.js`. Items are keyed by id. Add a new entry:

```js
flaming_longsword: {
  id: 'flaming_longsword',
  name: 'Flaming Longsword',
  type: 'weapon',           // weapon | armor | consumable | material | key | quest | trinket | currency
  slot: 'weapon',           // for equippable: weapon | armor | helmet | shield | boots | trinket
  class: 'warrior',         // which class can equip (omit for "any")
  attack: 25,               // +25 attack when equipped
  element: 'fire',          // optional: attacks with this element
  value: 350,               // shop value (sells for 50% of this)
  desc: 'A longsword wreathed in eternal flame.',
  icon: '🔥',
  reqLevel: 10,             // optional: minimum level to equip
},
```

### Item fields reference

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Must match the object key |
| `name` | string | yes | Display name |
| `type` | string | yes | See type table below |
| `slot` | string | for equipment | `weapon`, `armor`, `helmet`, `shield`, `boots`, `trinket` |
| `class` | string | for weapons | `warrior`, `mage`, `ranger`, `healer` |
| `attack` | number | optional | Bonus to attack stat |
| `defense` | number | optional | Bonus to defense stat |
| `magic` | number | optional | Bonus to magic stat |
| `speed` | number | optional | Bonus to speed stat |
| `hp` | number | optional | Bonus to max HP (for trinkets) |
| `mp` | number | optional | Bonus to max MP (for trinkets) |
| `element` | string | optional | `fire`, `ice`, `holy`, `shadow`, `water`, `air`, `none` |
| `heal` | number | for consumables | HP restored when used |
| `mana` | number | for consumables | MP restored when used |
| `buff` | object | for consumables | `{ attack?: 0.5, defense?: 1.0, speed?: 3, duration: 60000 }` |
| `value` | number | yes | Shop value in gold |
| `reqLevel` | number | optional | Minimum level to equip/use |
| `desc` | string | yes | Flavor text |
| `icon` | string | yes | Emoji or single character |

### Item types

| Type | Behavior |
|---|---|
| `weapon` | Equippable in weapon slot, used for attack damage |
| `armor` | Equippable in armor/helmet/shield/boots slot |
| `trinket` | Equippable in trinket slot (rings, amulets) |
| `consumable` | Usable from inventory (heals, mana, buffs) |
| `material` | Stackable, used for quests and crafting (future) |
| `key` | Quest-related, cannot be sold |
| `quest` | Quest turn-in item, cannot be sold |
| `currency` | Gold coins (`gold_coin` only) |

### Making the item obtainable

To make the item appear in-game, add it to one or more of:

**A monster's drop table** (`shared/monsters.js`):
```js
flamebrand: {
  // ...
  drops: [
    { id: 'flaming_longsword', chance: 0.05 },  // 5% drop chance
    { id: 'gold_coin', chance: 1, qty: [50, 100] },
  ],
}
```

**A shop** (`shared/islands.js`, find an NPC with `shop:`):
```js
{
  id: 'ember smitty',
  // ...
  shop: {
    name: "Smitty's Forge",
    items: [
      { id: 'flaming_longsword', price: 700, stock: 2 },
      // ...
    ],
  },
}
```

**A quest reward** (`shared/quests.js`):
```js
my_quest: {
  // ...
  reward: {
    xp: 500,
    gold: 200,
    items: [{ id: 'flaming_longsword', qty: 1 }],
  },
}
```

---

## 4. Adding a new monster

Open `shared/monsters.js`. Add:

```js
shadow_beast: {
  id: 'shadow_beast',
  name: 'Shadow Beast',
  icon: '🐺',
  level: 14,
  hp: 280,
  attack: 38,
  defense: 12,
  speed: 6,
  xp: 180,
  gold: [25, 50],
  color: '#1e1b4b',
  element: 'shadow',
  drops: [
    { id: 'void_crystal', chance: 0.25 },
    { id: 'bone_fragment', chance: 0.5 },
    { id: 'gold_coin', chance: 0.95, qty: [20, 45] },
  ],
  aggro: true,        // attacks player on sight
  aggroRange: 7,      // tiles
  attackRange: 1,     // 1 = melee, >1 = ranged
  moveCooldown: 500,  // ms between moves when chasing
  boss: false,
},
```

### Monster fields reference

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Must match the object key |
| `name` | string | yes | Display name |
| `icon` | string | yes | Emoji shown in the entity |
| `level` | number | yes | Used for tooltip display |
| `hp` | number | yes | Total HP |
| `attack` | number | yes | Damage per hit (before defense reduction) |
| `defense` | number | yes | Reduces incoming damage |
| `speed` | number | yes | Affects move cooldown and attack cooldown |
| `xp` | number | yes | XP awarded on kill |
| `gold` | `[min, max]` | yes | Gold range awarded on kill |
| `color` | string | yes | Hex color for the entity circle |
| `element` | string | yes | For elemental damage multipliers |
| `drops` | array | yes | Drop table (see below) |
| `aggro` | boolean | yes | Whether monster attacks on sight |
| `aggroRange` | number | yes | Aggro detection range in tiles |
| `attackRange` | number | yes | 1 for melee, >1 for ranged |
| `moveCooldown` | number | yes | Ms between moves when chasing |
| `boss` | boolean | optional | Adds golden border, longer respawn |
| `finalBoss` | boolean | optional | For the Voidlord Acheron only |

### Spawn it on an island

Edit the island's `spawnConfig` in `shared/islands.js`:

```js
shadowfen: {
  // ...
  spawnConfig: [
    { monster: 'bog_spirit', count: 8 },
    { monster: 'skeleton', count: 7 },
    { monster: 'shadow_beast', count: 5 },   // NEW
    { monster: 'lich_queen_mortis', count: 1 },
  ],
}
```

The map generator picks spawn points far from the village center. Restart the server (auto-reloads) — your new monster will appear.

---

## 5. Adding a new NPC

Open `shared/islands.js`. Find the island you want and add to its `npcs` array:

```js
const shadowfenNpcs = [
  // existing NPCs...
  {
    id: 'sf my_new_npc',
    name: 'Mysterious Stranger',
    role: 'Wanderer',
    x: 0, y: 0,           // will be assigned by placeNpcs()
    color: '#7c3aed',
    dialog: 'I have walked these swamps for a hundred years. I have seen things.',
    shop: null,           // or { name: "...", items: [...] }
    quest: 'sf_my_quest', // or array of quest ids, or null
    travel: null,         // or { options: [{ to: 'islandId', reqLevel: N }] }
  },
]
```

The NPC will be automatically placed inside one of the village buildings or in the village square by `placeNpcs()`. You don't need to manually assign `x` and `y`.

### NPC fields reference

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique; convention is `islandid npc_role` |
| `name` | string | yes | Display name |
| `role` | string | yes | Subtitle (e.g., "Blacksmith") |
| `x`, `y` | number | set to `0, 0` | Auto-assigned by `placeNpcs()` |
| `color` | string | yes | Hex color for the entity circle |
| `dialog` | string | yes | What they say when you talk to them |
| `shop` | object or null | optional | `{ name, items: [{ id, price, stock }] }` |
| `quest` | string, array, or null | optional | Quest id(s) offered by this NPC |
| `travel` | object or null | optional | `{ options: [{ to, reqLevel }] }` |

---

## 6. Adding a new quest

Open `shared/quests.js`. Add:

```js
sf_my_quest: {
  id: 'sf_my_quest',
  island: 'shadowfen',
  title: 'The Hundred-Year Walk',
  giver: 'sf my_new_npc',     // must match the NPC id
  minLevel: 12,
  type: 'kill',                // kill | collect | boss
  target: {
    monster: 'shadow_beast',  // for kill/boss
    count: 5,
  },
  // OR for collect:
  // target: { item: 'void_crystal', count: 5 },
  reward: {
    xp: 800,
    gold: 350,
    items: [{ id: 'amulet_of_warding', qty: 1 }],
  },
  description: 'The Mysterious Stranger asks you to slay 5 Shadow Beasts to avenge his fallen companions.',
  completion: 'The stranger nods. "You have done what I could not. Take this."',
},
```

Then ensure the NPC has this quest in their `quest` field (see [§5](#5-adding-a-new-npc)).

### Quest types

| Type | Target | Behavior |
|---|---|---|
| `kill` | `{ monster, count }` | Count increments on monster kill; auto-completes at count |
| `boss` | `{ monster, count: 1 }` | Same as kill but for boss monsters |
| `collect` | `{ item, count }` | Player must have N of the item; items are removed on turn-in |

### Multiple quests per NPC

The `quest` field accepts a string or an array:

```js
quest: ['sf_my_quest', 'sf_another_quest'],
```

The dialog window will show a button for each quest, with its current state (Available / In Progress / Ready to Turn In / Done).

---

## 7. Adding a new island

This is the most involved content addition. Plan for ~30-60 minutes.

### Step 1 — Pick an id, biome, and level range

Example: `crystalpeak`, biome `crystal`, levels 15-20.

### Step 2 — Check the biome is supported

Open `shared/islandGenerator.js` and look at `biomeBeachTile()`, `biomeGroundTile()`, `biomeHighTile()`, `biomePeakTile()`. If your biome is new, add cases:

```js
function biomeGroundTile(biome, rng) {
  switch (biome) {
    // existing cases...
    case 'crystal':
      return rng() < 0.3 ? TILE.CRYSTAL : TILE.STONE_FLOOR
  }
}
```

You may also want to add a new tile type in `shared/tiles.js`:

```js
CRYSTAL_PEAK: 28,    // new tile id (use next available number)

// In TILE_INFO:
[TILE.CRYSTAL_PEAK]: { name: 'Crystal Peak', color: '#c4b5fd', walkable: false, decor: '💎' },
```

### Step 3 — Define the island in `shared/islands.js`

Add a new entry to `ISLAND_DEFS`:

```js
crystalpeak: {
  id: 'crystalpeak',
  name: 'Crystalpeak Isle',
  subtitle: 'The Shimmering Spires',
  biome: 'crystal',
  levelRange: [15, 20],
  description: 'A glittering isle of massive crystal formations where geomancers harness the earth\'s power.',
  width: 65, height: 55, seed: 12345,
  backgroundColor: '#a78bfa',
  spawnConfig: [
    { monster: 'storm_elemental', count: 8 },
    { monster: 'whispering_wraith', count: 5 },
    { monster: 'shadow_beast', count: 4 },     // the monster you added in §4
    { monster: 'crystal_dragon', count: 1 },   // a new boss you'll add
  ],
  npcs: [
    {
      id: 'crystal elder_amber',
      name: 'Elder Amber',
      role: 'Crystal Sage',
      x: 0, y: 0, color: '#c4b5fd',
      dialog: 'The crystals sing, traveler. Listen closely, and they will guide you.',
      shop: {
        name: "Amber's Crystal Emporium",
        items: [
          { id: 'super_health_potion', price: 200, stock: 5 },
          { id: 'arcane_focus', price: 240, stock: 2 },
        ],
      },
      quest: 'crystal_main_quest',
    },
    // ... add 7-16 more NPCs (target 8-18 per island)
  ],
  portalTo: 'voidheart',     // next island in progression
  portalLevel: 18,
  portalPos: null,
},
```

### Step 4 — Add the boss monster

Add `crystal_dragon` to `shared/monsters.js` with `boss: true` and good drops.

### Step 5 — Add quests

Add 5-12 quests in `shared/quests.js` with `island: 'crystalpeak'`. Reference the NPCs you defined.

### Step 6 — Wire it into the travel network

Find a sailor NPC on a nearby island (e.g., Skyreach's Captain Gale) and add your island to their `travel.options`:

```js
{
  id: 'skyreach captain_gale',
  // ...
  travel: {
    options: [
      { to: 'voidheart', reqLevel: 18 },
      { to: 'crystalpeak', reqLevel: 15 },   // NEW
      { to: 'shadowfen', reqLevel: 10 },
    ],
  },
},
```

Also add a sailor NPC on your new island who can take players back:

```js
{
  id: 'crystal captain_gem',
  name: 'Captain Gem',
  role: 'Sailor',
  x: 0, y: 0, color: '#0ea5e9',
  dialog: 'My crystal-skiff can take you to Skyreach or Voidheart.',
  shop: null, quest: null,
  travel: {
    options: [
      { to: 'skyreach', reqLevel: 12 },
      { to: 'voidheart', reqLevel: 18 },
    ],
  },
},
```

### Step 7 — Test

```bash
npm run smoke     # verify data integrity
```

Then start the server and travel to your new island. Walk around, talk to NPCs, kill monsters, complete a quest.

### Step 8 — Update the world map and README

The client's World Map window (`MiscWindows.jsx`) auto-discovers islands from `ISLAND_DEFS`, so no UI changes needed. Update `docs/` references and the main README's island table.

---

## 8. Adding a new class skill

Open `shared/classes.js`. Add to the `SKILLS` object:

```js
shadow_step: {
  id: 'shadow_step',
  name: 'Shadow Step',
  class: 'ranger',          // warrior | mage | ranger | healer
  manaCost: 15,
  cooldown: 6000,           // ms
  range: 0,                 // 0 = self-cast, >0 = targeted
  buff: {
    speed: 3,               // +3 speed
    duration: 5000,         // 5 seconds
  },
  description: 'Vanish into shadow, gaining +3 speed for 5 seconds.',
  unlockLevel: 8,           // optional; omit for level-1 skill
},
```

### Skill behavior templates

**Damage skill (single target):**
```js
{
  damageMultiplier: 2.0,
  range: 6,
  element: 'fire',          // optional
  // ...
}
```

**Damage skill (AoE):**
```js
{
  damageMultiplier: 1.5,
  range: 6,
  aoe: true,
  // ...
}
```

**Heal:**
```js
{
  healMultiplier: 2.5,      // heals magic * 2.5
  range: 0,
  // ...
}
```

**Buff:**
```js
{
  buff: {
    attack: 0.5,            // +50% attack
    defense: 1.0,           // +100% defense
    speed: 3,               // +3 speed
    duration: 8000,
  },
  range: 0,
  // ...
}
```

**Bonus vs undead:**
```js
{
  damageMultiplier: 1.7,
  range: 5,
  element: 'holy',
  bonusVsUndead: 1.5,       // extra ×1.5 vs shadow element
  // ...
}
```

The skill is automatically:
- Available to characters of the specified class at the unlock level
- Shown in the skill bar (press 1-6 to use)
- Auto-targets the nearest monster in range if no target specified
- Tracked for cooldown and mana on the server

No client-side changes needed — the HUD reads from `getSkillsForClass()`.

---

## 9. Adding a new playable class

This is a bigger change. The class system is somewhat hard-coded in places.

### Step 1 — Add the class definition

In `shared/classes.js`:

```js
necromancer: {
  id: 'necromancer',
  name: 'Necromancer',
  description: 'A master of death who commands undead minions and drains life from foes.',
  color: '#10b981',
  icon: '☠',
  baseStats: {
    hp: 90,
    mp: 110,
    attack: 8,
    defense: 5,
    magic: 14,
    speed: 5,
  },
  growth: {
    hp: 10,
    mp: 16,
    attack: 1.5,
    defense: 1.2,
    magic: 3.2,
    speed: 0.7,
  },
  startingItems: [
    { id: 'bone_staff', qty: 1 },       // you need to add this item
    { id: 'necromancer_robe', qty: 1 }, // and this one
    { id: 'mana_potion', qty: 5 },
    { id: 'bread', qty: 3 },
  ],
  startingSkills: ['drain_life', 'raise_skeleton'],
},
```

### Step 2 — Add starting items

Add `bone_staff`, `necromancer_robe`, etc. to `shared/items.js` (see [§3](#3-adding-a-new-item)).

### Step 3 — Add skills

Add `drain_life`, `raise_skeleton`, and 2-3 more skills to the `SKILLS` object with `class: 'necromancer'`.

### Step 4 — Update the client UI

The Character Creation screen and Character Select screen iterate over `Object.values(CLASSES)`, so the new class appears automatically. But you may want to test the layout fits 5 cards instead of 4.

### Step 5 — Update equipment class restrictions

Weapons and armor in `shared/items.js` use `class: 'warrior'` etc. Add `class: 'necromancer'` to the items your new class should start with and be able to buy.

### Step 6 — Test

Create a new character with the new class. Verify:
- Starting items are correct
- Skills show in the skill bar
- Skills work as expected
- Level-up growth feels balanced

---

## 10. Modifying combat balance

Open `shared/combat.js`. Key functions:

### `calculateBasicAttackDamage(attacker, defender)`

```js
const variance = 0.85 + rng() * 0.3   // 0.85 to 1.15, crit if > 1.1
let damage = baseAttack * variance
damage *= elementalMultiplier          // see ELEMENTAL_MULTIPLIERS
damage = Math.max(1, damage - defender.defense * 0.6)
```

To make combat faster, increase `variance` or reduce the `0.6` defense multiplier. To make it more tactical, increase the elemental multipliers in `ELEMENTAL_MULTIPLIERS`.

### `calculateMonsterAttackDamage(monster, player)`

Same formula but uses `monster.attack` and `player.defense`. If monsters feel too weak, increase their `attack` in `shared/monsters.js` or reduce the `0.6` defense multiplier.

### `applyXp(player, xp)`

```js
export function xpForLevel(level) {
  return Math.floor(80 * Math.pow(level, 1.5))
}
```

To make leveling faster, reduce the `80` constant or the `1.5` exponent. To make it slower, increase them.

### `computePlayerStats(player)`

Calculates effective stats including equipment bonuses. If you add a new stat (e.g., `luck`), update this function and the growth curves in `shared/classes.js`.

---

## 11. Modifying monster AI

Open `server/world.js` and find `IslandInstance.tick(now)`.

The current AI:
1. Find nearest player on the island
2. If within `aggroRange`: become aggressive
3. If aggro and within `attackRange`: attack (cooldown-gated)
4. If aggro and out of range: step toward player (greedy, no pathfinding)
5. If no player within `aggroRange * 2`: lose aggro

### Common modifications

**Add wandering when idle:**
```js
if (!m.aggro && now - m.lastMove > 3000) {
  // Pick a random adjacent walkable tile
  const dirs = [[1,0], [-1,0], [0,1], [0,-1]]
  const [dx, dy] = dirs[Math.floor(Math.random() * 4)]
  // try to move...
}
```

**Add pathfinding:**
Replace the greedy step with A* or BFS. The map is small (max 70×60), so even unoptimized A* is fast enough. Consider using the `pathfinding` npm package.

**Add special abilities for bosses:**
Add a `specialAttackCooldown` field to boss monsters. In the tick, when in range and the special is off cooldown, emit a custom `fx:floating` and apply AoE damage to all nearby players.

**Kite behavior for ranged monsters:**
If a ranged monster (`attackRange > 1`) is too close to the player, have it step away instead of toward.

---

## 12. Adding a new socket event

### Step 1 — Define the event name

In `shared/protocol.js`:

```js
export const CLIENT_EVENTS = {
  // ...
  MY_NEW_ACTION: 'my:new-action',
}

export const SERVER_EVENTS = {
  // ...
  MY_NEW_RESPONSE: 'my:new-response',
}
```

### Step 2 — Handle it on the server

In `server/index.js`, add a listener:

```js
socket.on(CLIENT_EVENTS.MY_NEW_ACTION, (payload) => {
  const session = world.sessions.get(socket.id)
  if (!session) return

  // Do something with payload and session
  const result = world.doSomething(session, payload)

  // Respond to the client
  socket.emit(SERVER_EVENTS.MY_NEW_RESPONSE, result)

  // Or broadcast to the island
  const island = world.islands.get(session.character.currentIsland)
  if (island) island.broadcast(SERVER_EVENTS.MY_NEW_RESPONSE, result)
})
```

If the action mutates game state, add a method to `World` in `server/world.js` and call it from the handler.

### Step 3 — Handle it on the client

In `client/src/hooks/useGame.js`:

```js
// Listen for the response
sock.on(SERVER_EVENTS.MY_NEW_RESPONSE, (data) => {
  // Update React state
  setSomeState(data)
})

// Expose an action function
const sendMyNewAction = useCallback((payload) => {
  sock.emit(CLIENT_EVENTS.MY_NEW_ACTION, payload)
}, [])

// Return it from the hook
return {
  // ... existing returns
  sendMyNewAction,
}
```

### Step 4 — Use it in a component

In whatever component needs to trigger the action:

```jsx
function MyComponent({ game }) {
  const handleClick = () => game.sendMyNewAction({ foo: 'bar' })
  return <button onClick={handleClick}>Do the thing</button>
}
```

### Step 5 — Document it

Add the event to `docs/PROTOCOL.md` with its payload shape.

### Step 6 — Test it

Add a test case to `scripts/e2e-test.js`:
```js
const response = await new Promise((resolve) => {
  socket.once('my:new-response', resolve)
  socket.emit('my:new-action', { foo: 'bar' })
  setTimeout(() => resolve(null), 5000)
})
assert(response !== null, 'My new action got a response')
```

---

## 13. Adding a new HTTP endpoint

In `server/index.js`, add a route:

```js
app.get('/api/leaderboard', async (req, res) => {
  // Get all characters
  const allChars = []   // you'd need to add a db.getAllCharacters() function
  // Sort by level desc
  allChars.sort((a, b) => b.level - a.level)
  // Return top 10
  res.json({
    ok: true,
    leaderboard: allChars.slice(0, 10).map((c, i) => ({
      rank: i + 1,
      name: c.name,
      class: c.class,
      level: c.level,
    })),
  })
})
```

Document it in `docs/API.md`.

---

## 14. Testing your changes

### Smoke test (data integrity)

```bash
npm run smoke
```

Runs 50 checks against `shared/` data: classes have correct fields, items reference valid icons, monsters have valid drops, islands have 8-18 NPCs, quests reference valid NPCs, etc. Run this after every `shared/` edit.

### End-to-end test (multiplayer flow)

```bash
npm run dev:server   # in one terminal
node scripts/e2e-test.js   # in another
```

Runs 19 checks: register, login, create character, connect socket, receive state sync, verify persistence. Run this after changes to `server/` or `shared/protocol.js`.

### Manual testing checklist

For content additions, manually verify:

- [ ] New item appears in the right shop / monster drop / quest reward
- [ ] New item can be equipped (if equipment) and stats update
- [ ] New monster spawns on the correct island
- [ ] New monster's drops appear in inventory after kill
- [ ] New NPC is placed in a walkable location (not stuck in a wall)
- [ ] New NPC's dialog appears when talked to
- [ ] New quest can be accepted (meets level requirement)
- [ ] New quest progress updates correctly (kill count or item count)
- [ ] New quest can be turned in for rewards
- [ ] New skill appears in the skill bar at the correct level
- [ ] New skill's mana cost and cooldown work
- [ ] New skill's effect (damage, heal, buff) applies correctly

### Cross-browser testing

Test in at least:
- Chrome (latest)
- Firefox (latest)
- Safari (if on macOS)
- Mobile Chrome / Safari (responsive layout)

---

## 15. Code style and conventions

### File organization

- One export per file where possible
- Use named exports, not default exports (except for React components)
- Group related constants at the top of the file

### Naming

- **Files**: `camelCase.js` for logic, `PascalCase.jsx` for React components
- **Variables/functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Classes**: `PascalCase`
- **Event names**: `namespace:action` (e.g., `player:update`, `monster:spawn`)

### JavaScript style

- ES modules (`import`/`export`), not CommonJS (`require`)
- No TypeScript (keep the barrier to contribution low)
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multi-line arrays/objects

### React style

- Function components, not class components
- Hooks only (`useState`, `useEffect`, `useCallback`, `useRef`)
- One component per file
- Props destructured in the function signature
- CSS classes (not inline styles) for everything except dynamic values

### Server style

- Pure functions in `shared/` (no React, no Node-only APIs)
- Side effects (file I/O, network) only in `server/`
- Validate all client input on the server
- Never trust the client for HP, position, inventory, gold, or XP

### Comments

- Use the file header comment block for new files
- Comment non-obvious logic with `// Why: ...`
- Avoid commented-out code — delete it; git remembers

### Commit messages

Follow conventional commits:
```
feat: add Crystalpeak Isle with 12 NPCs and 8 quests
fix: monster AI getting stuck on water tiles
docs: add deployment guide
refactor: extract combat damage formula into shared function
chore: upgrade socket.io to 4.8
```

---

## See also

- **[Architecture](./ARCHITECTURE.md)** — Understand the design before changing it
- **[Protocol](./PROTOCOL.md)** — Socket event reference
- **[Configuration](./CONFIGURATION.md)** — Environment variables and tuning
