# Architecture

Aetheria: Nine Isles uses a **single-world, server-authoritative** architecture over WebSocket. This document explains the design, the data flow, and the rationale behind each major decision.

---

## Table of Contents

1. [High-level diagram](#1-high-level-diagram)
2. [The single-world principle](#2-the-single-world-principle)
3. [Folder structure and the `shared/` contract](#3-folder-structure-and-the-shared-contract)
4. [Server: Express + Socket.io](#4-server-express--socketio)
5. [The `World` class and island instances](#5-the-world-class-and-island-instances)
6. [The 10 Hz tick loop](#6-the-10-hz-tick-loop)
7. [Monster AI](#7-monster-ai)
8. [Combat resolution](#8-combat-resolution)
9. [Persistence layer](#9-persistence-layer)
10. [Authentication and JWT flow](#10-authentication-and-jwt-flow)
11. [Client architecture](#11-client-architecture)
12. [State synchronization strategy](#12-state-synchronization-strategy)
13. [Why not WebRTC / peer-to-peer?](#13-why-not-webrtc--peer-to-peer)
14. [Scaling considerations](#14-scaling-considerations)

---

## 1. High-level diagram

```
┌────────────────────────────────────────────────────────────┐
│                      Browser (Client)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React UI (HUD, TileMap, Dialogs, Inventory, Chat)   │  │
│  └─────────────┬────────────────────────────────────────┘  │
│                │ render                                     │
│  ┌─────────────▼────────────────────────────────────────┐  │
│  │  useGame hook (socket.io-client)                     │  │
│  │  • sends inputs: move, attack, skill, buy, etc.      │  │
│  │  • receives state: player, monsters, other players   │  │
│  └─────────────┬────────────────────────────────────────┘  │
└────────────────┼───────────────────────────────────────────┘
                 │ WebSocket (Socket.io)
                 │ TLS in production
┌────────────────┼───────────────────────────────────────────┐
│                ▼           Server (Node.js)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express HTTP   (POST /api/register, /api/login,     │  │
│  │                  GET /api/characters, /health)       │  │
│  └─────────────┬────────────────────────────────────────┘  │
│  ┌─────────────▼────────────────────────────────────────┐  │
│  │  Socket.io server (JWT auth middleware)              │  │
│  │  • receives client inputs                            │  │
│  │  • emits state updates to affected players           │  │
│  └─────────────┬────────────────────────────────────────┘  │
│  ┌─────────────▼────────────────────────────────────────┐  │
│  │  World (singleton)                                   │  │
│  │  • sessions: Map<socketId, Session>                  │  │
│  │  • islands:  Map<islandId, IslandInstance>           │  │
│  │  • tickAll() at 10 Hz                                │  │
│  └─────────────┬────────────────────────────────────────┘  │
│  ┌─────────────▼────────────────────────────────────────┐  │
│  │  Persistence (server/db.js)                          │  │
│  │  • JSON files: users.json, characters.json           │  │
│  │  • debounced writes + 30s autosave                   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 2. The single-world principle

Aetheria runs **one `World` instance per server process**. There are no "shards", "realms", or "channels" — every player who connects to your server plays in the same world.

Concretely, in `server/index.js`:

```js
const world = new World()   // exactly one, created at startup
```

The `World` class (in `server/world.js`) holds:
- `sessions: Map<socketId, Session>` — every connected player
- `islands: Map<islandId, IslandInstance>` — lazily-created sub-regions

When a player travels to "Emberfall Isle", they join the *same* `IslandInstance` that every other Emberfall visitor is on. If you and your friend both travel to Emberfall, you will see each other.

### Why one world?

- **Simplicity** — no cross-shard messaging, no character transfers, no "which shard is my friend on?"
- **Shared economy** — everyone competes for the same boss spawns, the same shop inventory
- **Real multiplayer feel** — running into strangers is what makes an MMO an MMO

### Trade-off

One server process = one CPU core effectively (Node is single-threaded). For >200 concurrent players you would need to either:
- Spin up multiple server processes (each is its own world — players cannot see across them)
- Cluster the server with `node:cluster` and use Redis pub/sub for cross-worker broadcasts
- Shard by island (worker 1 owns islands 1-3, worker 2 owns 4-6, etc.)

For 95% of small/medium deployments, one world is plenty.

---

## 3. Folder structure and the `shared/` contract

```
Aetheria/
├── client/      # Browser code only
├── server/      # Server-only code
└── shared/      # Imported by BOTH client and server
```

The `shared/` folder is the contract between client and server. It contains:

| File | What | Why shared |
|---|---|---|
| `protocol.js` | Event names, config constants | Both sides must agree on the wire format |
| `classes.js` | 4 playable classes + 14 skills | Client shows class info; server uses growth curves |
| `items.js` | 60+ item definitions | Client renders item icons/stats; server validates drops |
| `monsters.js` | 35+ monster definitions | Client renders monster icons; server runs AI |
| `tiles.js` | Tile walkability info | Client renders tiles; server checks walkability |
| `islandGenerator.js` | Procedural map generation | Server generates the map; client receives it as a 2D array |
| `islands.js` | 9 island defs + 113 NPCs | Server spawns monsters/NPCs; client renders them |
| `quests.js` | 89 quests + quest logic | Client shows quest UI; server tracks progress |
| `combat.js` | Damage formulas, XP curves | Server is authoritative; client could compute for prediction (not used currently) |
| `inventory.js` | Stack/equip/use/sell logic | Server is authoritative; logic shared for consistency |

### Importing from `shared/`

From the server (in `server/*.js`):
```js
import { World } from './world.js'
import { CLASSES } from '../shared/classes.js'
import { CONFIG } from '../shared/protocol.js'
```

From the client (in `client/src/components/ui/*.jsx`, 4 levels deep):
```js
import { CLASSES } from '../../../../shared/classes.js'
```

The Vite dev server resolves these paths natively (the alias in `client/vite.config.js` is a fallback). In production, the build bundles everything.

---

## 4. Server: Express + Socket.io

The server (`server/index.js`) is a single Node.js process that runs:

1. **Express HTTP server** on `PORT` (default 4000)
   - `POST /api/register` — create account
   - `POST /api/login` — get JWT
   - `GET /api/characters` — list player's characters (requires JWT)
   - `GET /health` — server status

2. **Socket.io server** attached to the same HTTP server
   - All real-time game traffic flows over WebSocket
   - A JWT auth middleware rejects unauthenticated sockets
   - Game events are dispatched to the `World` singleton

3. **The game tick loop** (`setInterval` at 10 Hz)
   - Runs monster AI for all islands with players
   - See [§6](#6-the-10-hz-tick-loop)

4. **Autosave loop** (`setInterval` at 30 s)
   - Saves every active character to disk

### Why both HTTP and WebSocket?

- **HTTP** for one-shot operations: register, login, character list. These are stateless and easy to test with `curl`.
- **WebSocket** for the game itself: every keypress, every monster update, every chat message. WebSocket is bidirectional, low-latency, and stays open.

You could do everything over Socket.io (some games do), but splitting makes auth flow cleaner and gives you a public REST API for free.

---

## 5. The `World` class and island instances

The `World` class is the brain of the server:

```js
class World {
  constructor() {
    this.islands = new Map()    // islandId -> IslandInstance
    this.sessions = new Map()   // socketId -> Session
  }

  getIsland(islandId) {
    if (!this.islands.has(islandId)) {
      this.islands.set(islandId, new IslandInstance(islandId))
    }
    return this.islands.get(islandId)
  }
  // ...
}
```

**Lazy island instantiation** — an `IslandInstance` (with monsters and the map) is only created when the first player visits that island. This keeps memory usage proportional to active players, not total content.

### `IslandInstance`

Each island instance owns:

| Field | Type | Purpose |
|---|---|---|
| `map` | `number[][]` | 2D tile array (0 = deep water, 3 = grass, etc.) |
| `npcs` | `object[]` | Static NPCs with positions, dialog, shops, quests |
| `monsters` | `Map<id, Monster>` | Live monsters with HP, position, AI state |
| `players` | `Map<socketId, Session>` | Players currently on this island |
| `spawnPoints` | `{x,y}[]` | Walkable tiles far from village (for monster spawns) |

When a player joins an island, the server sends a `state:sync` event containing the entire visible state (map, NPCs, monsters, other players, and the player's own full state). After that, only deltas are sent.

### `Session`

A `Session` is created when a player selects a character:

```js
{
  socketId,         // socket.id
  socket,           // the raw Socket.io socket
  character,        // the full character state (HP, inventory, etc.)
  lastMove,         // timestamp of last move (for cooldown)
  lastAttack,
  skillCooldowns,   // { skillId: timestamp }
  lastChat,
  buffs,
}
```

The session is the bridge between a connected socket and a character. One socket = one session = one active character.

---

## 6. The 10 Hz tick loop

```js
setInterval(() => {
  const now = Date.now()
  world.tickAll(now)
}, TICK_INTERVAL_MS)   // 100ms = 10 Hz
```

The tick loop is the heartbeat of the server. On every tick:

1. **For each island with at least one player**, call `island.tick(now)`
2. Inside `island.tick(now)`:
   - For each monster:
     - Find the nearest player on this island
     - If within aggro range: become aggressive (broadcast `monster:update`)
     - If aggro and within attack range: attack the player (cooldown-gated)
     - If aggro and out of range: step one tile toward the player
     - If too far from any player (2× aggro range): lose aggro
3. **Player buffs expire** — checked on a separate cleanup pass

### Why 10 Hz?

- Fast enough to feel responsive (monster moves every 100ms when chasing)
- Slow enough to not burn CPU on a single-threaded server
- Most MMOs tick at 10-20 Hz server-side; the client renders at 60 FPS using interpolation (we currently do not interpolate, but the architecture allows it)

You can change this in `shared/protocol.js`:
```js
export const TICK_RATE_HZ = 10  // try 20 for snappier AI, 5 for less CPU
```

### What the tick does NOT do

- Player movement (player moves are event-driven, not tick-driven)
- Combat resolution for player-initiated attacks (resolved immediately on input)
- Chat (event-driven)
- Persistence (separate 30s interval)

This keeps the tick loop fast — it only handles AI.

---

## 7. Monster AI

The AI is intentionally simple but believable. Each monster:

1. **Idle** — wanders randomly (currently does not wander; stands still)
2. **Detect** — if a player comes within `aggroRange` tiles, become aggressive
3. **Chase** — move one tile toward the player every `moveCooldown` ms
4. **Attack** — if within `attackRange` tiles, attack every `Math.max(600, 1500 - speed*50)` ms
5. **Leash** — if no player within `aggroRange * 2`, lose aggro and return to idle

Monsters do not pathfind around obstacles — they step greedily toward the player (try X axis, then Y axis). This can cause them to get stuck on walls, which is acceptable for this style of tile-based MMO.

Ranged monsters (attackRange > 1) stop chasing once in range and shoot from where they stand.

### Bosses

Boss monsters (`boss: true`) behave the same but have:
- Higher HP and damage (visible in the entity card)
- Better drop tables (guaranteed legendary drops)
- Longer respawn time (2 minutes vs 60-90s for normal monsters)
- A golden border and `★` in their name when rendered

The final boss (`voidlord_acheron`) has `finalBoss: true` for an extra UI flourish.

---

## 8. Combat resolution

All combat is resolved on the server. The client only sees the results (damage numbers, HP bar changes, deaths).

### Player attacks monster

```
1. Client clicks monster → emits 'attack' { monsterId }
2. Server receives → validates (player alive? monster exists? in range? cooldown ready?)
3. Server computes damage:
   damage = (attack × random(0.85, 1.15)) × elementalMultiplier − (defense × 0.6)
   crit if random > 1.10
4. Server subtracts damage from monster.hp
5. Server broadcasts:
   - 'fx:floating' to all on island (the -25 damage number)
   - 'log:combat' to attacker ("You hit Rat for 25")
   - 'monster:update' to all on island (new HP)
6. If monster.hp <= 0:
   - Remove monster from island.monsters
   - Broadcast 'monster:despawn'
   - Roll drops, add to attacker inventory, add gold, award XP
   - If XP caused level-up: emit 'player:levelup' + 'fx:floating LEVEL UP'
   - Schedule respawn after 60-120s
   - Save character to disk
```

### Monster attacks player

The same flow but reversed. The server broadcasts the damage number to the player and updates their HP via `player:update`.

### Skills

Skills go through `playerUseSkill()` which:
1. Validates cooldown and mana
2. Deducts mana
3. For heals/buffs: applies directly to player, broadcasts `fx:floating`
4. For damage skills: same flow as basic attack but using `calculateSkillDamage()` (which applies the skill's `damageMultiplier` and element)
5. Auto-targets the nearest monster if no `targetMonsterId` was provided

---

## 9. Persistence layer

`server/db.js` is a thin JSON-file persistence layer. There is no database.

### Files

| File | Contents |
|---|---|
| `data/users.json` | Array of `{ username, displayName, passwordHash, createdAt }` |
| `data/characters.json` | Array of full character objects (HP, inventory, equipment, quest state, etc.) |

### Write strategy

- **Debounced** — `saveAll()` sets a 500ms timer; rapid calls coalesce into one disk write
- **Auto-save** — every 30 seconds, all active sessions are saved
- **On event** — character is saved after every meaningful state change (kill, level-up, item pickup, equip, quest turn-in, travel, death)
- **On shutdown** — `SIGINT`/`SIGTERM` handlers force-save everything

### Why JSON files?

- Zero setup — no database to install
- Human-readable — you can inspect `characters.json` to debug
- Sufficient for small/medium deployments (up to ~100 active characters)
- Easy to migrate — see below

### Swapping for a real database

Replace `server/db.js` with a Postgres/MongoDB equivalent. The public API is small:

```js
loadAll()                          // async, called at startup
saveAll()                          // debounced batch save
saveAllNow()                       // force-save (used on shutdown)
getUser(username)                  // → user object or null
createUser(username, passwordHash) // → user object
getCharacter(id)                   // → character object or null
getCharactersByOwner(username)     // → array
saveCharacter(char)                // upsert
deleteCharacter(id)                // remove
getCharacterByName(name)           // for uniqueness check
```

Re-implement these 9 functions against your database of choice and the rest of the server works unchanged.

---

## 10. Authentication and JWT flow

```
1. User submits register form
   ↓
2. Client POST /api/register { username, password }
   ↓
3. Server:
   - Validates username (3-20 chars, alphanumeric)
   - Validates password (6+ chars)
   - Checks username is not taken
   - Hashes password with bcrypt (10 rounds)
   - Saves user to data/users.json
   - Signs JWT with { username } payload, 7-day expiry
   - Returns { ok, token, username }
   ↓
4. Client stores token in localStorage as 'aetheria_token'
   ↓
5. Client connects Socket.io with auth: { token }
   ↓
6. Server's Socket.io auth middleware:
   - Verifies JWT signature and expiry
   - Attaches payload to socket.userPayload
   - Calls next() or rejects with Error
   ↓
7. All subsequent socket events carry the verified identity
```

### Why JWT instead of session cookies?

- Works for both HTTP API and WebSocket (cookies are awkward with WebSocket)
- Stateless — server does not need to look up a session on every event
- Easy to scale horizontally (any server can verify the same JWT if they share the secret)

### Security notes

- JWTs are signed but **not encrypted** — never put sensitive data in the payload
- The JWT secret is in `JWT_SECRET` env var — **change it in production**
- Tokens expire after 7 days; the client does not auto-refresh (user must re-login)
- Passwords are hashed with bcrypt (10 rounds ≈ 100ms per hash, resistant to brute force)

---

## 11. Client architecture

The client is a single-page React app built with Vite.

```
client/src/
├── main.jsx                    # Mounts <App/> into #root
├── App.jsx                     # Routes between screens based on game.screen
├── hooks/
│   └── useGame.js              # THE state hub — socket.io client + state receiver
└── components/
    ├── TileMap.jsx             # Renders the visible tiles + entities
    ├── screens/
    │   ├── AuthScreen.jsx      # Login/register
    │   ├── CharSelectScreen.jsx# Pick/create/delete character
    │   └── GameScreen.jsx      # The in-game view (hosts HUD + windows)
    └── ui/
        ├── HUD.jsx             # HP/MP/XP bars, skill bar, combat log
        ├── DialogWindow.jsx    # NPC dialog
        ├── ShopWindow.jsx      # Buy/sell
        ├── QuestDialog.jsx     # Accept/turn-in quest
        ├── TravelWindow.jsx    # Sail between islands
        ├── InventoryWindow.jsx # Equipment + item grid
        ├── QuestLogWindow.jsx  # Active/complete/available quests
        ├── MiscWindows.jsx     # Character sheet, world map, help
        ├── DeathScreen.jsx     # "You have fallen" overlay
        └── ChatBox.jsx         # Island-local chat
```

### `useGame` — the single hook

`useGame()` is the **only** hook the client uses for game state. It:

1. Connects to the server on mount (with JWT from localStorage)
2. Listens to every `SERVER_EVENTS.*` event and updates React state
3. Exposes action functions (`sendMove`, `sendAttack`, `sendBuyItem`, etc.) that emit socket events
4. Manages all UI window toggles (inventory, quest log, etc.)

`App.jsx` calls `useGame()` once and passes the result down to whichever screen is active. There is no Redux, Zustand, or context — just one hook with `useState` + `useCallback`.

### Why not split into multiple hooks?

A single hook keeps the socket connection lifecycle simple (one connection per app instance) and avoids prop-drilling through context providers. The state shape is well-defined and the hook is ~300 lines — manageable.

---

## 12. State synchronization strategy

Aetheria uses a hybrid sync model:

### On join (full state)

When a player joins an island (initial spawn or travel), the server sends a `state:sync` event containing:

```js
{
  islandId, islandDef,
  map,                    // the full 2D tile array (sent once)
  npcs,                   // all NPC positions on this island
  monsters,               // all current monster states
  otherPlayers,           // other players on this island (id, name, position, class)
  player,                 // the joining player's full state (HP, MP, inventory, etc.)
}
```

The client stores all of this in React state and renders it.

### On change (delta updates)

After the initial sync, only changes are sent:

| Event | When | Sent to |
|---|---|---|
| `player:update` | Self state changes (HP, MP, gold, XP, inventory, equipment, position) | Just the affected player |
| `player:moved` | Another player moved | All others on the island |
| `player:joined` | New player entered the island | All others on the island |
| `player:left` | Player left (disconnect or travel) | All others on the island |
| `monster:spawn` | New monster appeared (initial spawn or respawn) | All on the island |
| `monster:update` | Monster moved or took damage | All on the island |
| `monster:despawn` | Monster died | All on the island |
| `fx:floating` | Damage/heal/XP number | All on the island (so everyone sees the same numbers) |
| `log:combat` | Combat log entry | Just the affected player |
| `notify` | Toast notification | Just the affected player |
| `chat` | Chat message | All on the island |

### What is NOT synced

- The map (sent once on join, never updated — maps are static)
- NPC positions (NPCs don't move)
- Other players' HP/MP/inventory (privacy + bandwidth)
- Other players' equipment (could be added for visual variety, but not currently)

### Why not full state every tick?

Sending the full island state to every player at 10 Hz would be wasteful and would not scale. Delta updates mean a quiet island generates almost no traffic.

---

## 13. Why not WebRTC / peer-to-peer?

A peer-to-peer architecture (each client sends its position directly to other clients) would reduce server load, but:

- **Cheating** — clients could lie about their position, HP, damage. The server-authoritative model prevents this.
- **NAT traversal** — WebRTC requires STUN/TURN servers, which are operationally complex.
- **Discovery** — clients need a server to find each other anyway.

For a 9-island MMO with up to ~100 concurrent players, the server-authoritative model on a single Node process is the right trade-off.

---

## 14. Scaling considerations

### Vertical scaling (bigger server)

A single Node.js process can handle roughly:
- **50-100 concurrent players** comfortably (CPU-bound by the tick loop)
- **500+ registered accounts** (storage is small JSON files)

To go bigger vertically, just rent a bigger VPS. The bottleneck is the single-threaded tick loop.

### Horizontal scaling (multiple processes)

If you outgrow one process, options are:

1. **Cluster mode with shared state** — use `node:cluster` to spawn N workers, each handling a subset of socket connections. Use Redis pub/sub to broadcast cross-worker events. This is the standard Socket.io scaling pattern.

2. **Island sharding** — each worker process owns a subset of islands. Players traveling between islands "hop" servers (the new server pulls the character state from the shared DB). More complex but scales better.

3. **World sharding** — run multiple `World` instances as separate "realms" (like classic MMO shards). Players pick a realm at character creation and cannot switch. Simplest to implement but breaks the "one world" promise.

For most deployments, option 1 (cluster + Redis) is the right call when you hit ~100 concurrent players.

### Database migration

The JSON-file DB is fine up to a few hundred characters. Past that, swap `server/db.js` for:
- **PostgreSQL** with `pg` — best for relational queries (leaderboards, account management)
- **MongoDB** with `mongoose` — best for flexible character schemas (easy to add new fields)

See [§9](#9-persistence-layer) for the API you need to implement.

---

## Further reading

- **[Protocol Reference](./PROTOCOL.md)** — Every socket event with payload shapes
- **[HTTP API](./API.md)** — REST endpoints
- **[Configuration](./CONFIGURATION.md)** — Environment variables and tuning
- **[Deployment](./DEPLOYMENT.md)** — Production setup
- **[Development Guide](./DEVELOPMENT.md)** — How to add content
