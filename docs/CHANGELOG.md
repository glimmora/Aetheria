# Changelog

All notable changes to Aetheria: Nine Isles are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

---

## [2.0.0] — 2026-07-14

### Added
- **Multiplayer client-server architecture** — converted from single-player client-only to a full server-authoritative MMO
- New folder structure: `client/` (React+Vite), `server/` (Node+Express+Socket.io), `shared/` (game data used by both)
- JWT-based authentication with bcrypt password hashing
- JSON-file persistence layer for users and characters
- Real-time multiplayer: see other players on the same island, island-local chat
- Character selection screen — create up to 5 characters per account
- Auth screen (login/register) replaces the old single-player main menu
- Chat box component for island-local chat
- `shared/protocol.js` — single source of truth for socket event names and config constants
- 10 Hz server tick loop with monster AI (aggro, chase, attack, leash)
- Server-authoritative combat, inventory, equipment, quests, travel, death/respawn
- Auto-save every 30 seconds + on shutdown
- Vite dev proxy for `/api` and `/socket.io` to avoid CORS in development
- End-to-end test suite (19 checks) covering register, login, socket connect, character create, state sync, persistence
- Comprehensive documentation: Install, Tutorial, Architecture, Protocol, API, Deployment, Development, Configuration guides
- New monster: **Wraith Queen Sylvana** (Mistwood Isle boss)
- New quest: **Slay the Wraith Queen** (Mistwood boss quest)
- Multi-quest support per NPC (quest field accepts string or array)

### Changed
- Refactored `useGameState` hook into `useGame` hook (network-backed)
- TileMap now receives the map from the server (was generating it client-side)
- GameScreen sends inputs to the server instead of mutating local state
- All UI components import from `shared/` instead of `src/data/` and `src/systems/`
- Merged `systems/quests.js` into `shared/quests.js` (single file for quest data + logic)
- Updated `.gitignore` to exclude `data/` (server runtime data)
- README rewritten as a documentation hub

### Removed
- `src/` folder (split into `client/src/` and `shared/`)
- `MainMenu.jsx` (replaced by `AuthScreen.jsx`)
- `CharacterCreation.jsx` (replaced by `CharSelectScreen.jsx`)
- `useGameState.js` (replaced by `useGame.js`)
- `save.js` (replaced by server-side persistence + JWT auth)

---

## [1.0.0] — 2026-07-14

### Added
- Initial release as a single-player browser MMORPG
- 4 playable classes: Warrior, Mage, Ranger, Healer
- 14 unique skills with cooldowns, mana costs, AoE, elemental damage, buffs, healing
- 9 unique islands with 113 NPCs total (8-18 per island):
  1. Lumina Isle (Lv 1-5, grassland, beginner)
  2. Emberfall Isle (Lv 5-10, volcanic) — Boss: Emberlord Pyros
  3. Frostpeak Isle (Lv 6-12, snow) — Boss: Frost Dragon
  4. Mistwood Isle (Lv 7-13, magic forest) — Boss: Wraith Queen Sylvana (added in 2.0)
  5. Sunscar Isle (Lv 8-14, desert) — Boss: Sun Titan
  6. Tidehaven Isle (Lv 9-15, coastal) — Boss: The Kraken
  7. Shadowfen Isle (Lv 10-18, swamp/undead) — Boss: Lich Queen Mortis
  8. Skyreach Isle (Lv 12-20, floating clouds) — Boss: Thunder Drake
  9. Voidheart Isle (Lv 18-25, void) — Final Boss: Voidlord Acheron
- 35+ monsters with AI (aggro, pathfinding, attack ranges), drop tables, gold, XP
- 8 boss monsters + 1 final boss (Voidlord Acheron)
- 89 quests (kill / collect / boss types) with multi-stage progress tracking
- 60+ items: weapons (per class), armor (5 slots), trinkets, consumables, materials, keys, currency
- Procedural island map generation with deterministic seeded fBm noise
- Tile-based movement with WASD or click-to-move
- Real-time combat with skills, buffs, elemental damage, critical hits
- Full inventory, equipment, and shop system
- NPC interactions: dialog, shops, quest givers, travel (sail between islands)
- Save/load via localStorage with auto-save every 30 seconds
- Death/respawn at village center with 10% gold penalty
- Polish: animated main menu with starfield, character creation screen with class stats preview
- HUD with HP/MP/XP bars, gold, stat readouts, 6-slot skill bar
- Windows: NPC dialog, shop (buy/sell), quest dialog (accept/turn-in), travel, inventory, quest log, character sheet, world map, help
- Floating combat text (damage, heal, XP, level-up)
- Combat log with color-coded entries
- 72 automated smoke tests covering classes, items, monsters, islands, NPCs, quests, combat, inventory, XP
- Cross-reference integrity validation (NPC-quest refs, travel routes, shop items, quest rewards, monster drops)

### Technical
- Built with React 18 + Vite 5
- Pure CSS for all game UI (no UI framework)
- localStorage for persistent save
- All game data in `src/data/*.js`, all systems in `src/systems/*.js`, central state in `src/hooks/useGameState.js`

---

## Versioning policy

- **Major** (X.0.0) — Breaking architecture changes, save-breaking changes
- **Minor** (1.X.0) — New features, new content (islands, classes, major systems)
- **Patch** (1.0.X) — Bug fixes, balance tweaks, documentation

Old saves may not be compatible across major versions. Always back up `data/` before upgrading.
