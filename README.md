# Aetheria: Nine Isles

A multiplayer browser MMORPG inspired by the classic **TibiaMe**, built with **React + Vite** (client) and **Node.js + Express + Socket.io** (server).

> Top-down 2D tile-based MMO with real-time combat, 9 unique islands, 113 NPCs, 89 quests, 35+ monsters, 4 playable classes, and **server-authoritative multiplayer** — see other players, chat, and (eventually) trade on the same islands.

## ⚔️ Architecture

```
Aetheria/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx            # Root component (screen router)
│   │   ├── hooks/
│   │   │   └── useGame.js     # Socket.io client + state receiver
│   │   └── components/
│   │       ├── TileMap.jsx    # Tile renderer + entities
│   │       ├── screens/       # Auth, CharSelect, Game
│   │       └── ui/            # HUD, Dialog, Shop, Inventory, etc.
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                    # Node.js + Express + Socket.io backend
│   ├── index.js               # HTTP + WebSocket server entry
│   ├── world.js               # Authoritative game state (World, Island, Monster AI)
│   ├── db.js                  # JSON-file persistence layer
│   ├── auth.js                # bcrypt + JWT helpers
│   └── package.json
├── shared/                    # Code used by BOTH client and server
│   ├── protocol.js            # Socket event names, constants, config
│   ├── classes.js             # 4 playable classes + 14 skills
│   ├── items.js               # 60+ items
│   ├── monsters.js            # 35+ monsters (incl. 8 bosses)
│   ├── tiles.js               # Tile definitions
│   ├── islandGenerator.js     # Procedural fBm-noise map generator
│   ├── islands.js             # 9 island defs + 113 NPCs
│   ├── quests.js              # 89 quests + quest system logic
│   ├── combat.js              # Damage calc, XP, leveling
│   └── inventory.js           # Stack/equip/use/sell logic
├── scripts/
│   ├── smoke-test.js          # Data integrity tests (50 checks)
│   └── e2e-test.js            # End-to-end multiplayer tests (19 checks)
├── package.json               # Root workspace
└── README.md
```

### Server-authoritative design

- The server holds the **only true game state**: player positions, HP, MP, inventory, equipment, quest progress, monster positions/HP.
- Clients send **inputs** (move, attack, skill, equip, buy, accept-quest, travel) and **render** the state they receive.
- A 10 Hz server tick runs **monster AI** (aggro, pathfinding, attacks) for all islands with players on them.
- All state changes (kills, drops, XP, level-ups, deaths) are resolved on the server and broadcast to affected clients.
- Combat log, floating damage numbers, and notifications are pushed from server to client.

## 🚀 Quick start

### Prerequisites
- Node.js 18+ (tested on Node 24)
- npm 9+

### Install (one command, hoists all deps)
```bash
npm install
```

### Run both client and server concurrently (dev mode)
```bash
npm run dev
```
- Client: http://localhost:5173
- Server: http://localhost:4000

Or run them separately:
```bash
npm run dev:server   # just the server (port 4000)
npm run dev:client   # just the client (port 5173, proxies /api & /socket.io to 4000)
```

### Production build (client only — server runs from source)
```bash
npm run build       # builds client → client/dist/
```

To run the server in production:
```bash
NODE_ENV=production PORT=4000 node server/index.js
```
Then serve `client/dist/` from any static host (or wire it through Express by adding `app.use(express.static('client/dist'))`).

## 🎮 How to play

1. Open http://localhost:5173
2. **Register** a new account (username + password, stored hashed with bcrypt)
3. **Create a character** — choose a name and one of 4 classes:
   - ⚔️ **Warrior** — high HP, melee bruiser (Power Strike, Whirlwind, Berserk)
   - ✦ **Mage** — fragile but devastating ranged magic (Firebolt, Frost Nova, Meteor)
   - ➹ **Ranger** — quick, precise, ranged (Quick Shot, Bear Trap, Multi-Shot)
   - ✚ **Healer** — balanced support (Heal, Smite, Sanctuary)
4. **Enter the world** on Lumina Isle (the beginner island)
5. Move with **WASD/Arrows**, click monsters to attack, click NPCs to talk/trade/quest
6. Press **1-6** to use class skills (auto-targets nearest monster in range)
7. Open windows: **I** Inventory · **Q** Quest Log · **C** Character · **M** Map · **?** Help
8. Find sailor NPCs (⚓ marker) to **travel between islands** (level-gated)
9. Slay all 8 island bosses, then challenge the **Voidlord Acheron** on Voidheart Isle
10. **Island chat** (bottom-left) lets you talk to other players on the same island

## 🌍 The Nine Isles

| # | Island | Biome | Level Range | NPCs | Boss |
|---|--------|-------|-------------|------|------|
| 1 | Lumina Isle | Grassland | 1-5 | 8 | — (beginner) |
| 2 | Emberfall Isle | Volcanic | 5-10 | 12 | Emberlord Pyros |
| 3 | Frostpeak Isle | Snow | 6-12 | 10 | Frost Dragon |
| 4 | Mistwood Isle | Magic Forest | 7-13 | 14 | Wraith Queen Sylvana |
| 5 | Sunscar Isle | Desert | 8-14 | 11 | Sun Titan |
| 6 | Tidehaven Isle | Coastal | 9-15 | 13 | The Kraken |
| 7 | Shadowfen Isle | Swamp/Undead | 10-18 | 15 | Lich Queen Mortis |
| 8 | Skyreach Isle | Floating Clouds | 12-20 | 12 | Thunder Drake |
| 9 | Voidheart Isle | Void | 18-25 | 18 | Voidlord Acheron (final) |

**Total: 113 NPCs · 89 quests · 35+ monsters · 60+ items · 8 bosses + 1 final boss**

## 🧪 Tests

```bash
npm run smoke     # 50 data-integrity tests (classes, items, monsters, islands, NPCs, quests, combat, inventory)
node scripts/e2e-test.js   # 19 end-to-end multiplayer tests (register, login, socket, character, state sync, persistence)
```

Both must be passing before merge. The E2E test starts an isolated session, registers a test user, creates a character, verifies state sync, and confirms persistence.

## 🔐 Auth & persistence

- **Passwords** are hashed with bcrypt (10 rounds) before storage
- **JWT tokens** (7-day expiry) authenticate both HTTP API and Socket.io connections
- **Characters** are persisted to `server/data/characters.json` (JSON file DB)
- **Users** are persisted to `server/data/users.json`
- The server **auto-saves** every 30 seconds and on graceful shutdown
- To swap to a real database, replace `server/db.js` with Postgres/MongoDB equivalents — no other code changes needed

## 🔧 Configuration

Environment variables (server):
- `PORT` — HTTP/WS port (default: 4000)
- `CLIENT_ORIGIN` — CORS origin (default: http://localhost:5173)
- `JWT_SECRET` — secret for signing JWTs (default: dev-only secret — **change in production**)

Environment variables (client):
- `VITE_SERVER_URL` — server URL (default: `http://localhost:4000` in dev, empty in production)

## 📡 Protocol

See `shared/protocol.js` for the full event-name and message-shape contract between client and server. Key events:

**Client → Server**: `auth:login`, `character:create`, `character:select`, `move`, `attack`, `skill`, `item:equip`, `shop:buy`, `quest:accept`, `travel`, `chat`

**Server → Client**: `state:sync` (full island snapshot on join), `player:update` (self-state delta), `monster:spawn/update/despawn`, `player:joined/left/moved`, `fx:floating` (damage numbers), `log:combat`, `notify`, `player:death/respawn/levelup`, `chat`

## 🛣 Roadmap (not yet implemented)

- [ ] Party system (group with friends, shared XP)
- [ ] Player-vs-player arena
- [ ] Player trading
- [ ] Global leaderboard
- [ ] Player-owned housing
- [ ] More islands and endgame raids
- [ ] Migrate persistence to PostgreSQL

## 📜 Inspiration

Mechanics inspired by **TibiaMe** (the mobile MMO by CipSoft). All branding, names, art, and code are original.

## 📄 License

MIT
