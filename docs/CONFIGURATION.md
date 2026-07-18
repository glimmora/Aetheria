# Configuration Reference

All environment variables, configuration constants, and tuning knobs for Mythral.

---

## Table of Contents

- [Environment variables](#environment-variables)
  - [Server](#server)
  - [Client](#client)
- [Configuration constants (`shared/protocol.js`)](#configuration-constants-sharedprotocoljs)
- [Default ports](#default-ports)
- [Tuning guide](#tuning-guide)
  - [Server performance](#server-performance)
  - [Combat balance](#combat-balance)
  - [Monster AI](#monster-ai)
  - [Player progression](#player-progression)
- [Security checklist](#security-checklist)

---

## Environment variables

### Server

Set these in `server/.env`, the project-root `.env`, or as shell environment variables.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `12000` | HTTP and WebSocket port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin (your client URL) |
| `JWT_SECRET` | `mythral-dev-secret-change-me` | Secret for signing JWTs — **change in production** |
| `NODE_ENV` | `development` | `production` enables stricter behavior |

#### `PORT`

The port the server listens on. Must be unprivileged (>1024) unless running as root (not recommended).

```bash
PORT=8080 node server/index.js
```

#### `CLIENT_ORIGIN`

Used by the CORS middleware. Set this to your client's URL in production:

```bash
# Same-origin (client served by Express):
CLIENT_ORIGIN=https://your-domain.com

# Split deployment (client on Vercel, server on VPS):
CLIENT_ORIGIN=https://your-game.vercel.com
```

For development with the default Vite proxy, leave this as the default (`http://localhost:5173`).

#### `JWT_SECRET`

The secret used to sign and verify JWTs. **Must be changed in production.** Generate a strong one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

If you change the secret, all existing tokens become invalid (users will need to log in again).

#### `NODE_ENV`

- `development` (default) — verbose logging, no caching
- `production` — enables Express production optimizations, suppresses stack traces in error responses

### Client

Set these in `client/.env`. Vite exposes them to the browser via `import.meta.env.VITE_*`.

| Variable | Default | Description |
|---|---|---|
| `VITE_SERVER_URL` | `http://localhost:12000` (dev) or empty (prod) | Server URL for socket.io and fetch |

#### `VITE_SERVER_URL`

In development with the Vite proxy, this can be empty (the client uses relative URLs and the proxy forwards them). In split deployment, set it to your server's URL:

```bash
# client/.env
VITE_SERVER_URL=https://api.your-domain.com
```

The client uses this in two places:
1. `useGame.js` — for `io(SERVER_URL, ...)` (socket.io connection)
2. `useGame.js` — for `fetch(\`${SERVER_URL}/api/...\`)` (HTTP requests)

If `VITE_SERVER_URL` is empty, the client uses same-origin relative URLs (works when Express serves the client).

---

## Configuration constants (`shared/protocol.js`)

These are **environment variables** read by `shared/protocol.js` at startup. Set them in `.env`, then restart the server and rebuild the client.

### Leveling System

The leveling curve is designed for a **~10-year progression** to level 100 at 4 hours/day active play.

| Variable | Default | Description |
|---|---|---|
| `MAX_LEVEL` | `100` | Maximum level a character can reach |
| `XP_CURVE_BASE` | `128` | Base multiplier for the XP curve |
| `XP_CURVE_GROWTH` | `1.15` | Exponential growth factor per level |

**Formula:** `xpForLevel(n) = XP_CURVE_BASE * XP_CURVE_GROWTH^n`

**Progression table (default settings):**

| Level | XP for next | Total XP | Est. time at 4hr/day |
|---|---|---|---|
| 1→2 | 147 | 147 | ~1 minute |
| 10→11 | 518 | 2,820 | ~5 minutes |
| 20→21 | 2,099 | 13,510 | ~30 minutes |
| 30→31 | 8,473 | 54,740 | ~2 hours |
| 50→51 | 138,666 | 894,000 | ~1 week |
| 70→71 | 2,270,000 | 14,600,000 | ~2 months |
| 90→91 | 37,155,000 | 239,000,000 | ~1 year |
| 99→100 | 131,584,000 | 875,000,000 | ~3 years (this level alone) |

**Total XP to reach level 100: ~875,000,000**
At ~1000 XP/min average high-level play = 875,000 minutes = **~10 years at 4hr/day**

**To adjust the curve:**
- **Faster leveling:** increase `XP_CURVE_GROWTH` (e.g., `1.10` = ~5 years, `1.05` = ~2 years)
- **Slower leveling:** decrease `XP_CURVE_GROWTH` (e.g., `1.20` = ~20 years, `1.25` = ~40 years)
- **Shift entire curve:** adjust `XP_CURVE_BASE` (higher = more XP needed at all levels)
- **Lower cap:** set `MAX_LEVEL=50` for a shorter progression

```bash
# Example: 5-year curve to level 100
MAX_LEVEL=100
XP_CURVE_BASE=128
XP_CURVE_GROWTH=1.10

# Example: hardcap at level 50 with default pacing
MAX_LEVEL=50
XP_CURVE_BASE=128
XP_CURVE_GROWTH=1.15
```

Query the full curve at any time via `GET /api/xp-curve`.

### Gameplay & Server Constants

| Variable | Default | Description |
|---|---|---|
| `TICK_RATE_HZ` | `10` | Server tick rate (monster AI updates per second) |
| `MOVE_COOLDOWN_MS` | `140` | Minimum ms between player moves |
| `ATTACK_COOLDOWN_MS` | `700` | Minimum ms between basic attacks |
| `RESPAWN_HP_PENALTY_GOLD_PCT` | `10` | % of gold lost on death |
| `AUTOSAVE_INTERVAL_MS` | `30000` | How often to save all characters |
| `MAX_INVENTORY_SLOTS` | `60` | Max inventory slots per character |
| `STARTING_GOLD` | `50` | Gold given to new characters |
| `CHAT_MAX_LENGTH` | `200` | Max chat message length |
| `CHAT_COOLDOWN_MS` | `1000` | Min ms between chat messages per player |
| `MAX_CHARACTERS_PER_ACCOUNT` | `5` | Max characters per user account |
| `AUTH_RATE_LIMIT_PER_15MIN` | `20` | Auth attempts per IP per 15 min |
| `GENERAL_RATE_LIMIT_PER_MIN` | `120` | General socket events per IP per min |
| `LEADERBOARD_SIZE` | `50` | Number of entries in leaderboard |
| `MONSTER_RESPAWN_MIN_MS` | `60000` | Min monster respawn time |
| `MONSTER_RESPAWN_MAX_MS` | `120000` | Max monster respawn time |
| `BOSS_RESPAWN_MS` | `120000` | Boss respawn time |
| `ONLINE_BROADCAST_INTERVAL_MS` | `5000` | How often to broadcast online players |
| `STALE_SESSION_CLEANUP_INTERVAL_MS` | `60000` | How often to clean up stale sessions |
| `SOCKET_PING_INTERVAL` | `10000` | Socket.io heartbeat interval |
| `SOCKET_PING_TIMEOUT` | `5000` | Socket.io heartbeat timeout |
| `BODY_LIMIT` | `64kb` | Express body size limit |
| `BCRYPT_ROUNDS` | `10` | Bcrypt rounds for password hashing |
| `JWT_EXPIRES_IN` | `7d` | JWT token expiry |

### Example: faster tick rate

```bash
# .env
TICK_RATE_HZ=20
```

Restart the server. Monster AI is now twice as responsive, but CPU usage roughly doubles.

### Example: more forgiving death

```bash
# .env
RESPAWN_HP_PENALTY_GOLD_PCT=0
```

Only affects new characters created after the change.

---

## Default ports

| Service | Port | Purpose |
|---|---|---|
| Server (dev & prod) | `12000` | HTTP API + WebSocket |
| Client (Vite dev server) | `5173` | Vite default |
| Client (Vite preview) | `4173` | For `npm run preview` |
| Client (production build) | any | Served by nginx/CDN/Express |

To change the server port:
```bash
PORT=8080 npm run dev:server
```

To change the client dev port, edit `client/vite.config.js`:
```js
server: {
  host: '0.0.0.0',
  port: 3000,    // change from 5173
}
```

---

## Tuning guide

### Server performance

**Symptom:** High CPU usage, monster AI feels sluggish with many players.

**Knobs:**
1. **Lower `TICK_RATE_HZ`** — `5` instead of `10` halves CPU usage but makes monsters feel slower
2. **Skip empty islands in the tick** — already implemented (`if (island.players.size > 0)`)
3. **Reduce aggro ranges** — fewer monsters aggroing = fewer AI decisions per tick
4. **Reduce monster counts** in `shared/islands.js` `spawnConfig`

**Symptom:** High memory usage.

**Knobs:**
1. **Reduce island sizes** in `shared/islands.js` (`width`, `height`)
2. **Reduce monster counts** — each monster is ~200 bytes in memory
3. **Restart the server daily** via PM2 cron: `pm2 start mythral --cron-restart="0 3 * * *"`

**Symptom:** Slow disk writes (autosave blocking the event loop).

**Knobs:**
1. **Increase `AUTOSAVE_INTERVAL_MS`** — `60000` (1 minute) instead of `30000`
2. **Migrate to PostgreSQL** — see [Deployment → Database migration](./DEPLOYMENT.md#9-database-migration-json--postgresql)

### Combat balance

All combat math is in `shared/combat.js`.

**Symptom:** Combat feels too fast (players die too quick).

**Knobs:**
1. **Reduce damage variance** — change `0.85 + rng() * 0.3` to `0.9 + rng() * 0.2` (narrower range, fewer big hits)
2. **Increase defense multiplier** — change `damage - defense * 0.6` to `damage - defense * 0.8`
3. **Reduce monster `attack` values** in `shared/monsters.js`
4. **Increase player `hp` growth** in `shared/classes.js` `growth.hp`

**Symptom:** Combat feels too slow (grindy).

**Knobs:**
1. **Increase damage variance** — `0.8 + rng() * 0.4`
2. **Decrease defense multiplier** — `damage - defense * 0.4`
3. **Increase monster `xp` values** in `shared/monsters.js`
4. **Reduce XP needed per level** — `xpForLevel(level) = 60 * Math.pow(level, 1.4)`

### Monster AI

AI behavior is in `server/world.js` `IslandInstance.tick()`.

**Symptom:** Monsters too aggressive.

**Knobs:**
1. **Reduce `aggroRange`** in `shared/monsters.js` — `4` instead of `7`
2. **Set `aggro: false`** — monsters only attack when attacked first
3. **Increase leash range** — change `aggroRange * 2` to `aggroRange * 3` (monsters give up chase sooner)

**Symptom:** Monsters too passive.

**Knobs:**
1. **Increase `aggroRange`** — `10` instead of `7`
2. **Set `aggro: true`** on more monsters
3. **Reduce `moveCooldown`** — `300` instead of `500` (faster chase)

### Player progression

**Symptom:** Leveling too fast.

**Knobs:**
1. **Increase XP curve** — `xpForLevel(level) = 120 * Math.pow(level, 1.6)`
2. **Reduce monster `xp` values** in `shared/monsters.js`
3. **Reduce quest `reward.xp`** in `shared/quests.js`

**Symptom:** Leveling too slow.

**Knobs:**
1. **Decrease XP curve** — `xpForLevel(level) = 50 * Math.pow(level, 1.3)`
2. **Increase monster `xp` values**
3. **Increase quest `reward.xp`**

---

## Security checklist

Before deploying to production, verify:

- [ ] `JWT_SECRET` is set to a 64+ character random string (not the default)
- [ ] `CLIENT_ORIGIN` is set to your actual client domain
- [ ] `NODE_ENV=production`
- [ ] HTTPS is enforced (nginx redirects HTTP → HTTPS)
- [ ] Firewall blocks direct access to port 12000 (only 80/443 open)
- [ ] The server is not running as root
- [ ] Rate limiting is enabled on `/api/login` and `/api/register` (see [API.md](./API.md#rate-limiting))
- [ ] `data/` folder is backed up regularly
- [ ] SSH login uses a key, not a password
- [ ] Unattended security upgrades are enabled

See [Deployment → Security checklist](./DEPLOYMENT.md#10-security-checklist) for detailed instructions.

---

## See also

- **[Installation](./INSTALL.md)** — Setting up locally
- **[Deployment](./DEPLOYMENT.md)** — Going to production
- **[Development](./DEVELOPMENT.md)** — Modifying the game
