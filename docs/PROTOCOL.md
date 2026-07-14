# Protocol Reference

The complete contract for Socket.io events and message shapes between the Aetheria client and server.

All event names and config constants are defined in [`shared/protocol.js`](../shared/protocol.js). Both the client and server import from this file to ensure they stay in sync.

---

## Table of Contents

- [Connection lifecycle](#connection-lifecycle)
- [Authentication events](#authentication-events)
- [Character events](#character-events)
- [In-game events (Client → Server)](#in-game-events-client--server)
- [In-game events (Server → Client)](#in-game-events-server--client)
- [Configuration constants](#configuration-constants)

---

## Connection lifecycle

### 1. HTTP register/login

The client first authenticates over HTTP to obtain a JWT:

```
POST /api/register { username, password }   →  { ok, token, username }
POST /api/login    { username, password }   →  { ok, token, username }
```

See [HTTP API reference](./API.md) for details.

### 2. Socket.io connection with JWT

The client stores the JWT in `localStorage` as `aetheria_token` and passes it as `auth` when connecting:

```js
const socket = io(SERVER_URL, {
  auth: { token },
  transports: ['websocket', 'polling'],
})
```

The server's Socket.io middleware (`io.use()`) verifies the JWT and attaches the payload to `socket.userPayload`. Invalid or missing tokens cause the connection to be rejected with an `Error`.

### 3. Disconnection

When a socket disconnects (page close, network loss), the server:
1. Looks up the session by `socket.id`
2. Saves the character to disk
3. Removes the session from its island
4. Broadcasts `player:left` to remaining players on that island

Reconnection is handled by Socket.io automatically (with exponential backoff). On reconnect, the client re-emits `character:select` to re-enter the world.

---

## Authentication events

These are mostly handled via HTTP (see [API.md](./API.md)) but can also be sent over the socket for convenience. The standard flow uses HTTP for register/login and socket for everything else.

---

## Character events

### `character:list` (Client → Server)

Request the list of characters owned by the authenticated user.

**Payload:** none

**Server response:** [`character:list`](#character_list-server--client)

---

### `character:list` (Server → Client)

**Payload:**
```ts
{
  characters: Array<{
    id: string,            // "char_1700000000_ab12cd"
    name: string,          // "Bob"
    class: string,         // "warrior" | "mage" | "ranger" | "healer"
    level: number,         // 1
    currentIsland: string, // "lumina"
  }>
}
```

---

### `character:create` (Client → Server)

Create a new character for the authenticated user.

**Payload:**
```ts
{
  name: string,    // 3-20 chars: letters, numbers, spaces, _, -
  classId: string, // "warrior" | "mage" | "ranger" | "healer"
}
```

**Server response:** [`character:created`](#character_created-server--client) on success, [`error`](#error-server--client) on failure.

**Validation rules:**
- Name length 3-20
- Name characters: `^[a-zA-Z0-9 _-]+$`
- Name must be unique across all characters
- `classId` must be one of the four valid classes
- Max 5 characters per account (enforced client-side; not yet enforced server-side)

---

### `character:created` (Server → Client)

**Payload:**
```ts
{
  id: string,
  name: string,
  class: string,
  level: number,
}
```

After receiving this, the client typically re-requests `character:list` to refresh the UI.

---

### `character:select` (Client → Server)

Enter the game world with a specific character.

**Payload:**
```ts
{ characterId: string }
```

**Server behavior:**
1. Loads the character from DB
2. Verifies ownership (`character.owner === socket.userPayload.username`)
3. Creates a `Session` and attaches it to the socket
4. Calls `world.playerJoinIsland(session, character.currentIsland)`
5. Server emits [`state:sync`](#state_sync-server--client) with the full island snapshot

**Server response:** [`state:sync`](#state_sync-server--client)

---

### `character:delete` (Client → Server)

Delete a character permanently. The character must be owned by the authenticated user and not currently in-game.

**Payload:**
```ts
{ characterId: string }
```

**Server response:** [`character:deleted`](#character_deleted-server--client)

---

### `character:deleted` (Server → Client)

**Payload:**
```ts
{ id: string }
```

---

## In-game events (Client → Server)

All in-game events require an active session (i.e., the client has selected a character). The server silently ignores events from sockets without a session.

### `move`

Request a one-tile movement.

**Payload:**
```ts
{
  dx: -1 | 0 | 1,  // x delta
  dy: -1 | 0 | 1,  // y delta
}
```

**Server behavior:**
- Validates the player is alive (`character.hp > 0`)
- Checks move cooldown (140ms base, reduced by speed stat)
- Checks the destination tile is walkable and not blocked by another entity
- If the destination has a monster, performs a basic attack instead of moving
- Updates `character.x`, `character.y`, `character.facing`
- Broadcasts [`player:moved`](#player_moved-server--client) to other players on the island
- If the destination has an NPC, emits [`npc:nearby`](#npc_nearby-server--client) to the moving player

**No direct response to the mover** — their position is updated implicitly via the next [`player:update`](#player_update-server--client) or by their own client-side prediction (currently the client does not predict; it waits for server state).

---

### `attack`

Perform a basic attack on a specific monster.

**Payload:**
```ts
{ monsterId: string }
```

**Server behavior:**
- Validates the monster exists on the player's island
- Validates range (depends on weapon class: 1 for melee, 6 for ranged)
- Checks attack cooldown (700ms base, reduced by speed stat)
- Computes damage via `calculateBasicAttackDamage()`
- Subtracts damage from monster HP
- Broadcasts [`fx:floating`](#fx_floating-server--client) damage number to all on island
- Sends [`log:combat`](#log_combat-server--client) to attacker
- Broadcasts [`monster:update`](#monster_update-server--client) with new HP
- If monster dies: handles drops, XP, level-up, schedules respawn, saves character

---

### `skill`

Use a class skill.

**Payload:**
```ts
{
  skillId: string,             // e.g., "firebolt"
  targetMonsterId?: string,    // optional; auto-targets nearest if omitted
}
```

**Server behavior:**
- Validates the player has the skill (correct class, meets unlock level)
- Checks cooldown and mana cost
- Deducts mana
- For heal/buff skills: applies to self, broadcasts `fx:floating`
- For damage skills: same flow as `attack` but using `calculateSkillDamage()`
- Sends [`player:update`](#player_update-server--client) to reflect new mana/HP

---

### `item:use`

Use a consumable item (potion, food, elixir).

**Payload:**
```ts
{ itemId: string }
```

**Server behavior:**
- Validates the player has the item
- Applies the effect (heal HP, restore MP, apply buff)
- Removes one unit from inventory
- Sends [`player:update`](#player_update-server--client) and [`notify`](#notify-server--client)

---

### `item:equip`

Equip an item from inventory to its slot.

**Payload:**
```ts
{ itemId: string }
```

**Server behavior:**
- Validates the player has the item
- Validates the item is equipment (weapon/armor/trinket)
- Validates class and level requirements
- Swaps the currently-equipped item (if any) back to inventory
- Sends [`player:update`](#player_update-server--client)

---

### `item:unequip`

Remove the item from an equipment slot and return it to inventory.

**Payload:**
```ts
{ slot: "weapon" | "armor" | "helmet" | "shield" | "boots" | "trinket" }
```

---

### `shop:buy`

Buy an item from an NPC's shop.

**Payload:**
```ts
{
  npcId: string,    // the NPC's id (must have a shop)
  itemId: string,   // the item to buy
  qty: number,      // quantity (1-99)
}
```

**Server behavior:**
- Validates the NPC is on the player's island and has a shop
- Validates the item is in the NPC's shop inventory
- Validates the player has enough gold
- Deducts gold, adds items to inventory
- Sends [`player:update`](#player_update-server--client) and [`notify`](#notify-server--client)

---

### `shop:sell`

Sell an item from inventory to any shop (50% of value).

**Payload:**
```ts
{
  itemId: string,
  qty: number,
}
```

---

### `quest:accept`

Accept a quest.

**Payload:**
```ts
{ questId: string }
```

**Server behavior:**
- Validates the quest exists and the player meets the level requirement
- Validates the quest is not already accepted/turned-in
- Adds the quest to `character.questProgress[questId] = "active"`
- Sends [`player:update`](#player_update-server--client) and [`notify`](#notify-server--client)

---

### `quest:turnin`

Turn in a completed quest for rewards.

**Payload:**
```ts
{ questId: string }
```

**Server behavior:**
- Validates the quest is in "complete" state
- Removes collected items (for collect quests)
- Adds gold and items to inventory
- Awards XP (may trigger level-up)
- Marks quest as "turned_in"
- Sends [`player:update`](#player_update-server--client) and [`notify`](#notify-server--client)

---

### `travel`

Travel to another island.

**Payload:**
```ts
{ islandId: string }
```

**Server behavior:**
- Validates the player meets the level requirement (the client must have requested this from a valid sailor NPC)
- Removes the player from the current island (broadcasts [`player:left`](#player_left-server--client))
- Updates `character.currentIsland` and `character.x/y` to the new island's village center
- Adds the player to the new island (broadcasts [`player:joined`](#player_joined-server--client))
- Sends [`state:sync`](#state_sync-server--client) for the new island
- Saves character

---

### `respawn`

Respawn after death.

**Payload:** none

**Server behavior:**
- Sets `character.hp = maxHp`, `mp = maxMp`
- Moves to village center of current island
- Sends [`player:respawn`](#player_respawn-server--client) and broadcasts [`player:moved`](#player_moved-server--client)

---

### `chat`

Send a chat message to the current island.

**Payload:**
```ts
{ message: string }
```

**Server behavior:**
- Throttles to 1 message per second per player
- Truncates to 200 characters
- Broadcasts [`chat`](#chat-server--client) to all players on the island

---

## In-game events (Server → Client)

### `welcome`

Sent immediately after a successful socket connection.

**Payload:**
```ts
{ username: string }
```

---

### `state:sync`

The full island snapshot, sent when a player joins an island (initial spawn or travel).

**Payload:**
```ts
{
  islandId: string,
  islandDef: {
    id: string,
    name: string,
    subtitle: string,
    biome: string,
    levelRange: [number, number],
    description: string,
    backgroundColor: string,
    width: number,
    height: number,
  },
  map: number[][],                 // 2D tile array
  npcs: Array<NPC>,                // all NPCs on the island
  monsters: Array<MonsterSnapshot>,
  otherPlayers: Array<PlayerSnapshot>,
  player: PlayerSelfState,         // the joining player's full state
}
```

The client stores all of this in React state and uses it to render the world. The `map` is sent only on `state:sync` — never updated incrementally.

---

### `player:update`

A delta update to the player's own state. Sent on any change to HP, MP, XP, gold, level, position, inventory, equipment, quest progress, kill counts, etc.

**Payload:**
```ts
{
  // All fields optional except id — only changed fields are sent
  id: string,
  name?: string,
  classId?: string,
  classDef?: object,
  level?: number,
  xp?: number,
  xpForNext?: number,
  hp?: number,
  maxHp?: number,
  mp?: number,
  maxMp?: number,
  gold?: number,
  x?: number,
  y?: number,
  facing?: "up" | "down" | "left" | "right",
  equipment?: object,
  inventory?: Array<{ id: string, qty: number }>,
  questProgress?: Record<string, string>,
  killCounts?: Record<string, number>,
  visitedIslands?: string[],
  killedBosses?: string[],
  currentIsland?: string,
  buffs?: Array<object>,
  onlyFacing?: boolean,    // if true, client should only update facing (movement was blocked)
}
```

---

### `player:joined`

Another player entered the island (spawned or traveled here).

**Payload:**
```ts
{
  id: string,            // socket id
  name: string,
  classId: string,
  classDef: object,
  level: number,
  hp: number,
  maxHp: number,
  x: number,
  y: number,
  facing: string,
  isSelf: false,
}
```

---

### `player:left`

Another player left the island (disconnected or traveled away).

**Payload:**
```ts
{ id: string }
```

---

### `player:moved`

Another player moved one tile.

**Payload:**
```ts
{
  id: string,
  x: number,
  y: number,
  facing: string,
  hp?: number,           // included if HP changed (they took damage)
}
```

---

### `monster:spawn`

A new monster appeared on the island (initial spawn or respawn after death).

**Payload:**
```ts
{
  id: string,
  defId: string,         // monster definition id (e.g., "rat")
  name: string,
  icon: string,
  color: string,
  level: number,
  hp: number,
  maxHp: number,
  element: string,
  x: number,
  y: number,
  boss: boolean,
  finalBoss: boolean,
}
```

---

### `monster:update`

One or more monsters changed state (moved or took damage).

**Payload:** Array of:
```ts
{
  id: string,
  x?: number,
  y?: number,
  hp?: number,
  aggro?: boolean,
}
```

---

### `monster:despawn`

A monster was removed (killed).

**Payload:**
```ts
{ id: string }
```

---

### `fx:floating`

A floating text effect (damage number, heal number, XP gain, level-up). Should be rendered at the given tile coordinates and animated upward.

**Payload:**
```ts
{
  x: number,
  y: number,
  text: string,           // "-25" or "+50 XP" or "LEVEL UP!"
  color: string,          // hex color
  kind: "damage" | "heal" | "xp" | "levelup",
}
```

---

### `log:combat`

A combat log entry, shown in the bottom-right log panel.

**Payload:**
```ts
{
  msg: string,
  type: "player" | "damage" | "kill" | "death" | "system",
}
```

---

### `notify`

A toast notification, shown briefly at the top of the screen.

**Payload:**
```ts
{ msg: string }
```

---

### `player:death`

The player's character died. The client shows the death screen.

**Payload:**
```ts
{ goldLost: number }
```

---

### `player:respawn`

The player respawned (after pressing the Respawn button). The client hides the death screen and updates the player state.

**Payload:** Same as `player:update` — a full PlayerSelfState.

---

### `player:levelup`

The player leveled up. The client shows a special level-up notification and floating text.

**Payload:**
```ts
{ level: number }
```

---

### `npc:nearby`

Sent when the player walks onto an NPC's tile. The client uses this to display a "Talk to [NPC name]" prompt.

**Payload:**
```ts
{ npc: NPC }
```

---

### `chat`

A chat message from a player on the same island.

**Payload:**
```ts
{
  playerId: string,
  playerName: string,
  message: string,
  classColor: string,
}
```

---

### `error`

A generic error message. Usually the result of a failed action (insufficient gold, item not found, etc.).

**Payload:**
```ts
{ message: string }
```

---

## Configuration constants

Defined in `shared/protocol.js`:

| Constant | Default | Description |
|---|---|---|
| `TICK_RATE_HZ` | `10` | Server tick rate for monster AI |
| `TICK_INTERVAL_MS` | `100` | Derived from `TICK_RATE_HZ` |
| `MOVE_COOLDOWN_MS` | `140` | Minimum time between player moves |
| `ATTACK_COOLDOWN_MS` | `700` | Minimum time between basic attacks |
| `RESPAWN_HP_PENALTY_GOLD_PCT` | `10` | % of gold lost on death |
| `AUTOSAVE_INTERVAL_MS` | `30000` | How often to save all characters |
| `MAX_INVENTORY_SLOTS` | `60` | (Not yet enforced) |
| `STARTING_GOLD` | `50` | Gold given to new characters |
| `CHAT_MAX_LENGTH` | `200` | Max chat message length |
| `CHAT_COOLDOWN_MS` | `1000` | Min time between chat messages |

---

## Adding new events

1. Add the event name to `SERVER_EVENTS` or `CLIENT_EVENTS` in `shared/protocol.js`
2. On the server, add a `socket.on(...)` handler in `server/index.js` (for client→server) or call `island.broadcast(...)` / `socket.emit(...)` (for server→client)
3. On the client, add a `sock.on(...)` listener in `client/src/hooks/useGame.js` and update React state
4. Add an action function (e.g., `sendMyNewEvent`) that emits the event
5. Document the payload shape in this file
6. Update the smoke or E2E test to cover the new event

---

## See also

- **[HTTP API](./API.md)** — REST endpoints (auth, character list, health)
- **[Architecture](./ARCHITECTURE.md)** — How the protocol fits into the bigger picture
- **[Configuration](./CONFIGURATION.md)** — Environment variables
