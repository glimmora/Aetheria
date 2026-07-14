# ⚔️ Aetheria: Nine Isles

A multiplayer browser MMORPG inspired by the classic **TibiaMe**, built with **React + Vite** (client) and **Node.js + Express + Socket.io** (server) in a **single shared world**.

> Top-down 2D tile-based MMO with real-time combat, **9 unique islands**, **113 NPCs**, **89 quests**, **35+ monsters** (including 8 bosses and a final boss), **4 playable classes**, and **server-authoritative multiplayer** — see other players, chat, and (eventually) trade on the same islands.

---

## 📚 Documentation

| Document | What it covers |
|---|---|
| **[Installation Guide](./docs/INSTALL.md)** | Step-by-step setup from zero to running (macOS, Linux, Windows) |
| **[Tutorial](./docs/TUTORIAL.md)** | How to play + how to develop (your first code change) |
| **[Architecture](./docs/ARCHITECTURE.md)** | Single-world server-authoritative design deep dive |
| **[Protocol Reference](./docs/PROTOCOL.md)** | Every Socket.io event with payload shapes |
| **[HTTP API](./docs/API.md)** | REST endpoints (auth, characters, health) |
| **[Deployment Guide](./docs/DEPLOYMENT.md)** | Production deploy (VPS, Docker, nginx, SSL, backups) |
| **[Development Guide](./docs/DEVELOPMENT.md)** | How to add islands, NPCs, quests, items, monsters, classes |
| **[Configuration](./docs/CONFIGURATION.md)** | All environment variables and tuning knobs |
| **[Changelog](./docs/CHANGELOG.md)** | Version history |

**Start here:** [Installation Guide](./docs/INSTALL.md) → [Tutorial](./docs/TUTORIAL.md)

---

## 🚀 Quick start

```bash
# 1. Clone
git clone https://github.com/glimmora/Aetheria.git
cd Aetheria

# 2. Install (hoists all deps for client + server)
npm install

# 3. Run both client and server in dev mode
npm run dev
```

- **Client:** http://localhost:5173
- **Server:** http://localhost:4000
- **Health check:** http://localhost:4000/health

Open the client in your browser, register an account, create a character, and start playing.

---

## 🏗 Architecture at a glance

```
Aetheria/
├── client/      # React + Vite frontend (renders server state)
├── server/      # Node + Express + Socket.io (authoritative game state)
├── shared/      # Pure data + logic, imported by BOTH client and server
├── scripts/     # Tests (smoke + end-to-end)
└── docs/        # Comprehensive documentation
```

**The server is authoritative.** Clients send inputs (move, attack, buy, quest) and render the state they receive. The single `World` instance per server process means all players share the same world — there are no shards, realms, or channels.

See [Architecture](./docs/ARCHITECTURE.md) for the full design.

---

## 🎮 Features

### For players
- 4 classes: **Warrior** ⚔️, **Mage** ✦, **Ranger** ➹, **Healer** ✚ (each with 2-4 skills, unlocking more at higher levels)
- 9 islands spanning levels 1-25, each with unique biome, monsters, and bosses
- Real-time combat with skills, elemental damage, critical hits, buffs
- 89 quests (kill / collect / boss types) with progress tracking
- Full inventory, equipment (6 slots), shops, buy/sell
- Island-local chat with other players
- Persistent characters — log in from any browser, your progress follows
- WASD or click-to-move, 1-6 for skills, I/Q/C/M for windows

### For developers
- Single-world server-authoritative design — no client trust
- 10 Hz server tick for monster AI
- JSON-file persistence (swap for Postgres/MongoDB by replacing one file)
- JWT auth with bcrypt password hashing
- 50 smoke tests + 19 end-to-end multiplayer tests
- All game data in `shared/` — edit a string, see it in-game within 2 seconds
- Comprehensive docs covering install, deploy, dev, and every protocol event

---

## 🌍 The Nine Isles

| # | Island | Biome | Levels | NPCs | Boss |
|---|--------|-------|--------|------|------|
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

---

## 🧪 Tests

```bash
npm run smoke             # 50 data-integrity tests (~1 second)
node scripts/e2e-test.js  # 19 end-to-end multiplayer tests (~5 seconds, requires server running)
```

Both must pass before merging. The E2E test starts an isolated session, registers a test user, creates a character, verifies state sync, and confirms persistence.

---

## 🛣 Roadmap

- [ ] Party system (group with friends, shared XP)
- [ ] Player-vs-player arena
- [ ] Player trading
- [ ] Global leaderboard
- [ ] Player-owned housing
- [ ] More islands and endgame raids
- [ ] Migrate persistence to PostgreSQL for >100 concurrent players

---

## 📜 Inspiration

Mechanics inspired by **TibiaMe** (the mobile MMO by CipSoft). All branding, names, art, and code are original.

## 📄 License

MIT — see [LICENSE](./LICENSE) (or just use it freely; this is a learning project).

---

## 🤝 Contributing

See [Development Guide](./docs/DEVELOPMENT.md). PRs welcome — please run `npm run smoke` before submitting.
