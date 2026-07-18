# Tutorial

A hands-on walkthrough for **players** (how to play the game) and **developers** (how to extend it). If you have not installed Mythral yet, start with the [Installation Guide](./INSTALL.md) first.

---

## Table of Contents

**For Players**
1. [Create your account and first character](#for-players)
2. [Movement and the camera](#2-movement-and-the-camera)
3. [Talking to NPCs](#3-talking-to-npcs)
4. [Combat basics](#4-combat-basics)
5. [Skills and the skill bar](#5-skills-and-the-skill-bar)
6. [Inventory and equipment](#6-inventory-and-equipment)
7. [Shops: buying and selling](#7-shops-buying-and-selling)
8. [Quests: accepting, tracking, turning in](#8-quests-accepting-tracking-turning-in)
9. [Death and respawn](#9-death-and-respawn)
10. [Traveling between islands](#10-traveling-between-islands)
11. [Multiplayer: chat and seeing other players](#11-multiplayer-chat-and-seeing-other-players)

**For Developers**
12. [Project layout recap](#for-developers)
13. [Your first code change: edit an NPC's dialog](#13-your-first-code-change-edit-an-npcs-dialog)
14. [Add a new item](#14-add-a-new-item)
15. [Add a new monster](#15-add-a-new-monster)
16. [Add a new quest](#16-add-a-new-quest)
17. [Add a new island](#17-add-a-new-island)
18. [Add a new class skill](#18-add-a-new-class-skill)
19. [Debugging tips](#19-debugging-tips)

---

# For Players

## 1. Create your account and first character

1. Open the game in your browser (default: http://localhost:5173)
2. You will land on the **Auth Screen**. Click the **Register** tab.
3. Enter a username (3–20 chars: letters, numbers, `_`, `-`) and password (6+ chars).
4. Click **Create Account**. You are logged in automatically.

You now see the **Character Select** screen. You have no characters yet — click **Create Your First Hero**.

5. Type a hero name (3–20 chars: letters, numbers, spaces, `_`, `-`).
6. Pick a class by clicking one of the four cards:

| Class | Icon | Playstyle | Starting HP/MP | Recommended for |
|---|---|---|---|---|
| **Warrior** | ⚔ | Tanky melee bruiser, gets in close | 150 HP / 30 MP | New players — forgiving and simple |
| **Mage** | ✦ | Ranged magic glass cannon | 80 HP / 120 MP | Players who like positioning and burst |
| **Ranger** | ➹ | Mobile ranged DPS with traps | 110 HP / 60 MP | Players who like kiting |
| **Healer** | ✚ | Balanced support, can self-heal and smite undead | 100 HP / 100 MP | Players who like flexibility |

7. Click **Create Hero**, then **Enter World** on the character card.

You will spawn at the village center of **Lumina Isle**, the beginner island.

## 2. Movement and the camera

| Input | Action |
|---|---|
| **W** / **↑** | Move up |
| **S** / **↓** | Move down |
| **A** / **←** | Move left |
| **D** / **→** | Move right |
| **Click a tile** | Take one step toward that tile |

The camera follows you and is locked to a 25×17 tile viewport. The tile you cannot walk on (water, walls, mountains, dense forest) blocks movement — your character will turn to face the direction but not move.

You cannot walk through other players, monsters, or NPCs.

## 3. Talking to NPCs

There are 113 NPCs across the nine islands. Each NPC has a colored circle with the letter **N**. They may have a small badge above them:

| Badge | Meaning |
|---|---|
| **❗** (yellow) | Has a quest you can accept |
| **$** (green) | Runs a shop |
| **⚓** (blue) | Sailor — can take you to another island |

**To talk:**
- Walk into the NPC (move onto their tile), or
- Click the NPC if you are adjacent

A dialog window opens showing the NPC's portrait, name, role, and a line of in-character text. Below the text are buttons for the actions that NPC offers (Trade, Quest, Travel, Farewell).

If you walk away from an NPC, the dialog stays open — close it with the **×** button or **Esc**.

## 4. Combat basics

Click a monster to attack it. **You must be in range**, which depends on your weapon:

| Weapon class | Range (tiles) |
|---|---|
| Sword, mace (Warrior, Healer melee) | 1 (adjacent) |
| Bow (Ranger) | 6 |
| Staff (Mage) | 6 |
| Scepter (Healer ranged) | 5 |

If you click a monster that is out of range, you will see a "Too far to attack!" toast.

**Damage calculation** (server-authoritative, you cannot cheat):
```
damage = (attack stat × random_variance) × elemental_multiplier − (defense × 0.6)
```
- `random_variance` is between 0.85 and 1.15 — if it exceeds 1.1, the hit is a **critical** (shown in yellow with `!`)
- Elemental multipliers: fire vs ice ×1.5, fire vs water ×0.7, holy vs shadow ×1.8, etc.
- Defense reduces damage by 60% of its value

Floating damage numbers appear above the target. The combat log (bottom-right of the screen) records every hit.

When a monster dies, it:
- Awards XP (gold number floats up)
- May drop items (auto-added to your inventory — you get a loot notification)
- Awards gold (added to your gold total immediately)

## 5. Skills and the skill bar

Your class skills appear in the **skill bar** at the bottom-center of the screen. Press **1** through **6** (or click the slot) to use a skill.

Skills have:
- **Mana cost** — shown below the skill name
- **Cooldown** — when on cooldown, a dark overlay covers the slot and shows the remaining seconds
- **Range** — offensive skills auto-target the nearest monster within 6 tiles

Some skills are unlocked at higher levels (e.g., Mage's **Meteor** unlocks at level 14). Locked skills appear grayed out in the Character window (**C**).

### Skill reference by class

**Warrior**
| Skill | Unlocked | Effect |
|---|---|---|
| Power Strike | Lv 1 | 220% melee damage, single target |
| Whirlwind | Lv 6 | 160% AoE damage to all adjacent foes |
| Berserk | Lv 12 | +50% attack for 8 seconds |

**Mage**
| Skill | Unlocked | Effect |
|---|---|---|
| Firebolt | Lv 1 | 180% magic fire damage, single target |
| Lesser Heal | Lv 1 | Heal self for 180% of magic |
| Frost Nova | Lv 6 | 140% AoE ice damage + root |
| Meteor | Lv 14 | 350% AoE fire damage |

**Ranger**
| Skill | Unlocked | Effect |
|---|---|---|
| Quick Shot | Lv 1 | 150% ranged damage |
| Bear Trap | Lv 5 | 120% damage + root next foe |
| Multi-Shot | Lv 12 | 140% AoE to all visible foes |

**Healer**
| Skill | Unlocked | Effect |
|---|---|---|
| Heal | Lv 1 | Heal self for 250% of magic |
| Smite | Lv 1 | 170% holy damage, 150% vs undead |
| Sanctuary | Lv 12 | Heal 300% + double defense for 8s |

## 6. Inventory and equipment

Press **I** to open the inventory. The window has two panels:

**Left — Equipment slots:**
- Helmet, Weapon, Armor, Shield, Boots, Trinket
- Click a filled slot to unequip (returns the item to your inventory)

**Right — Item grid:**
- All items stack by type (e.g., 5 Health Potions take one slot)
- Click an item to see its stats and actions:
  - **Equip** (if it is gear you can use)
  - **Use** (if it is a consumable)
  - **Sell** (sells 1 unit for 50% of its value — for bulk selling, talk to a shopkeeper)

Below the equipment slots, your effective stats are shown (these include bonuses from gear and active buffs).

## 7. Shops: buying and selling

Find an NPC with a green **$** badge and talk to them. Click **Trade** to open the shop window.

- **Buy tab** — Click an item to select it, set quantity with the +/- buttons, then **Buy**
- **Sell tab** — Click an item from your inventory to select, choose quantity, then **Sell**
- The shop shows your current gold at the top right
- Items you cannot afford or do not meet the level requirement for are dimmed

Each island has different shops. Lumina's blacksmith sells iron swords; Emberfall's volcano forge sells steel longswords; Voidheart's bazaar sells endgame legendary weapons.

## 8. Quests: accepting, tracking, turning in

NPCs with a yellow **❗** badge have a quest for you.

1. Talk to the NPC and click **Quest: [title]**
2. Read the description, objective, and rewards
3. Click **Accept Quest** (you must meet the level requirement)
4. Track your progress in the **Quest Log** (press **Q**)
5. When the objective is met, the quest moves to **Ready to Turn In**
6. Return to the quest giver — talk to them, click **Turn In**
7. Rewards are applied: XP (may trigger a level-up), gold, items

There are three quest types:
- **Kill** — Slay N of a specific monster
- **Collect** — Gather N of a specific item (turn-in removes the items)
- **Boss** — Slay a specific boss (these are the main story beats)

You can have unlimited active quests at once. Some NPCs offer multiple quests — they will show multiple buttons in their dialog.

## 9. Death and respawn

If your HP reaches 0:
- A red **YOU HAVE FALLEN** screen appears
- You lose **10% of your current gold** (rounded down)
- You have two options:
  - **Respawn at Village** — return to the village center of your current island with full HP and MP
  - **Return to Main Menu** — quit to character select (your progress is auto-saved either way)

You do **not** lose XP, levels, items, or equipment on death. Only gold.

## 10. Traveling between islands

Find an NPC with a blue **⚓** badge (usually named "Captain" or "Ferryman"). Talk to them and click **Travel**.

A list of destinations appears, each showing:
- The island name and subtitle
- Level range
- Whether you have visited before
- The level requirement to sail there

If you do not meet the level requirement, the **Sail** button is disabled. Pick a destination and click **Sail** — you (and your character) are teleported to the village center of that island.

### Travel progression

| From | To | Required level |
|---|---|---|
| Lumina | Emberfall | 5 |
| Emberfall | Frostpeak | 8 |
| Frostpeak | Mistwood | 9 |
| Mistwood | Sunscar | 10 |
| Sunscar | Tidehaven | 11 |
| Tidehaven | Shadowfen | 12 |
| Shadowfen | Skyreach | 14 |
| Skyreach | Voidheart | 18 |

You can also sail backward at any time (e.g., Skyreach back to Shadowfen) at the same level requirement.

## 11. Multiplayer: chat and seeing other players

Mythral is a real **multiplayer** game. Other players on the same island appear as colored circles with their name above. Their class icon and color show in the circle.

**Island chat** is at the bottom-left corner. Click the header to expand it, type a message, press **Enter** to send. The message is broadcast to every player on your current island.

> Chat is throttled to 1 message per second per player, and capped at 200 characters. There is no global chat (yet) — you must be on the same island to talk.

If you walk near another player, you can attack the same monsters they are attacking — but you cannot damage other players (PvP is not implemented; see [Roadmap](../README.md#roadmap)).

---

# For Developers

## 12. Project layout recap

```
Mythral/
├── client/      # React + Vite frontend (renders state from server)
├── server/      # Node.js + Express + Socket.io (authoritative game state)
├── shared/      # Pure data + logic, imported by both client and server
├── scripts/     # Tests and helpers
└── docs/        # You are here
```

The most important principle: **the server is authoritative**. The client only sends inputs and renders the state it receives. Never trust the client for HP, position, inventory, gold, or XP — always validate on the server.

## 13. Your first code change: edit an NPC's dialog

Open `shared/islands.js` and find the Lumina NPCs (search for `luminaNpcs`). Change Elder Ravenna's dialog:

```js
{
  id: 'lumina elder_ravenna',
  name: 'Elder Ravenna',
  role: 'Village Elder',
  dialog: 'Welcome, traveler! I have rewritten this line just now.',
  // ... rest unchanged
},
```

Save the file. The server auto-reloads (via `node --watch`). Refresh your browser. Talk to Elder Ravenna — your new line appears.

**That's it.** NPC dialog is plain text — no markup, no templating. Just edit the string.

## 14. Add a new item

Open `shared/items.js`. Items are plain objects keyed by id. Add a new weapon:

```js
my_custom_sword: {
  id: 'my_custom_sword',
  name: 'Sword of Testing',
  type: 'weapon',
  slot: 'weapon',
  class: 'warrior',
  attack: 50,
  element: 'fire',
  value: 500,
  desc: 'A glowing red blade that smells of sulfur.',
  icon: '🗡',
  reqLevel: 10,
},
```

To make it obtainable in-game, either:
- Add it to a monster's drop table in `shared/monsters.js`
- Add it to a shop in `shared/islands.js` (find an NPC with `shop:` and add to `items:`)
- Add it as a quest reward in `shared/quests.js`

Restart the server. The item now exists in the world.

## 15. Add a new monster

Open `shared/monsters.js` and add a new entry:

```js
my_goblin: {
  id: 'my_goblin',
  name: 'Tricky Goblin',
  icon: '👺',
  level: 3,
  hp: 50,
  attack: 12,
  defense: 4,
  speed: 5,
  xp: 25,
  gold: [5, 12],
  color: '#16a34a',
  element: 'none',
  drops: [
    { id: 'goblin_ear', chance: 0.7 },
    { id: 'my_custom_sword', chance: 0.02 },
    { id: 'gold_coin', chance: 0.8, qty: [3, 8] },
  ],
  aggro: true,
  aggroRange: 5,
  attackRange: 1,
  moveCooldown: 550,
},
```

To spawn it on an island, edit that island's `spawnConfig` in `shared/islands.js`:

```js
spawnConfig: [
  // existing spawns...
  { monster: 'my_goblin', count: 4 },
],
```

Restart the server. Walk to Lumina Isle (or wherever you added the spawn) and you will see four Tricky Goblins wandering around.

## 16. Add a new quest

Open `shared/quests.js`. Add a new entry:

```js
my_quest: {
  id: 'my_quest',
  island: 'lumina',
  title: 'Goblin Extermination',
  giver: 'lumina elder_ravenna',   // must match an NPC id
  minLevel: 2,
  type: 'kill',
  target: { monster: 'my_goblin', count: 5 },
  reward: {
    xp: 100,
    gold: 80,
    items: [{ id: 'my_custom_sword', qty: 1 }],
  },
  description: 'Elder Ravenna wants you to slay 5 Tricky Goblins.',
  completion: 'Elder Ravenna beams. "Excellent work! Take this sword."',
},
```

Then add the quest to the NPC. Open `shared/islands.js` and update Elder Ravenna's `quest` field (it can be a string or an array of strings):

```js
{
  id: 'lumina elder_ravenna',
  // ...
  quest: ['lumina_goblins', 'my_quest'],   // array supports multiple quests per NPC
},
```

Restart the server. Talk to Elder Ravenna — you will see two quest buttons.

## 17. Add a new island

This is the biggest change. You need to:

1. **Pick an id, biome, level range** — e.g., `crystalpeak`, biome `crystal`, levels 15-20
2. **Define the island** in `shared/islands.js`:

```js
crystalpeak: {
  id: 'crystalpeak',
  name: 'Crystalpeak Isle',
  subtitle: 'The Shimmering Spires',
  biome: 'crystal',           // see biomeBeachTile/biomeGroundTile/etc. in islandGenerator.js
  levelRange: [15, 20],
  description: 'A glittering isle of massive crystal formations.',
  width: 65, height: 55, seed: 12345,
  backgroundColor: '#a78bfa',
  spawnConfig: [
    { monster: 'storm_elemental', count: 8 },
    { monster: 'whispering_wraith', count: 5 },
    { monster: 'frost_dragon', count: 1 },   // boss
  ],
  npcs: [
    {
      id: 'crystal elder_amber',
      name: 'Elder Amber',
      role: 'Crystal Sage',
      x: 0, y: 0, color: '#c4b5fd',
      dialog: 'The crystals sing, traveler. Listen closely.',
      shop: null,
      quest: 'crystal_quest',
    },
    // ... 7-17 more NPCs
  ],
  portalTo: 'voidheart',     // next island in progression
  portalLevel: 18,
  portalPos: null,
},
```

3. **Add a biome tile mapping** if you used a new biome name — open `shared/tiles.js` and check that `biomeBeachTile()`, `biomeGroundTile()`, `biomeHighTile()`, `biomePeakTile()` in `shared/islandGenerator.js` handle your biome.

4. **Wire it into the travel network** — find a sailor NPC on a nearby island and add your island to their `travel.options`:

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

5. **Add quests** in `shared/quests.js` referencing `island: 'crystalpeak'`.

6. **Add a unique boss** in `shared/monsters.js` with `boss: true`.

7. Restart the server. Sail to your new island!

## 18. Add a new class skill

Open `shared/classes.js`. Find the `SKILLS` object and add:

```js
shadow_step: {
  id: 'shadow_step',
  name: 'Shadow Step',
  class: 'ranger',
  manaCost: 15,
  cooldown: 6000,
  range: 0,                // 0 = self-cast
  buff: { speed: 3, duration: 5000 },
  description: 'Vanish into shadow, gaining +3 speed for 5 seconds.',
  unlockLevel: 8,
},
```

The skill is automatically:
- Added to the skill bar of any ranger level 8+
- Castable via the 1-6 hotkeys or click
- Tracked for cooldown and mana on the server

The `class` field must match one of: `warrior`, `mage`, `ranger`, `healer`. The `unlockLevel` field gates it; omit for level-1 skills.

Skill behaviors supported:
- **Damage**: set `damageMultiplier` and `range` (>0)
- **AoE**: set `aoe: true`
- **Heal**: set `healMultiplier` (heals `magic * multiplier`)
- **Buff**: set `buff: { attack?: 0.5, defense?: 1.0, speed?: 3, duration: 8000 }`
- **Elemental**: set `element: 'fire' | 'ice' | 'holy' | 'shadow' | 'water' | 'air'`
- **Bonus vs type**: set `bonusVsUndead: 1.5` (extra multiplier vs shadow element)

## 19. Debugging tips

### Server-side logs

Add `console.log` anywhere in `server/world.js` — the server will print it to its terminal. The `--watch` flag restarts the server when files change.

### Client-side logs

Open browser DevTools (F12) → Console tab. The `useGame.js` hook logs every socket event if you add:
```js
sock.onAny((event, ...args) => console.log('[socket]', event, args))
```

### Inspecting game state

Add a temporary debug endpoint in `server/index.js`:
```js
app.get('/debug/world', (req, res) => {
  res.json({
    sessions: world.sessions.size,
    islands: [...world.islands.keys()],
    islandDetails: [...world.islands.entries()].map(([id, i]) => ({
      id, players: i.players.size, monsters: i.monsters.size,
    })),
  })
})
```

Then `curl http://localhost:12000/debug/world` to see the world state.

### Resetting the world

To wipe all users and characters (do this only in dev):
```bash
rm -f data/users.json data/characters.json
# restart the server
```

### Running tests after every change

```bash
npm run smoke          # 50 data-integrity checks (~1 second)
node scripts/e2e-test.js   # 19 end-to-end checks (~5 seconds, requires server running)
```

Make a habit of running `npm run smoke` before committing — it catches typos in item ids, broken quest references, missing monster spawns, etc.

---

## Where to go next

- **[Architecture](./ARCHITECTURE.md)** — Understand the single-world server-authoritative design before making big changes
- **[Protocol](./PROTOCOL.md)** — Every socket event documented with payload shapes
- **[API](./API.md)** — HTTP REST endpoints
- **[Deployment](./DEPLOYMENT.md)** — Put it on the internet
- **[Configuration](./CONFIGURATION.md)** — All environment variables and tuning knobs
