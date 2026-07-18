# Configuration Reference

All environment variables, configuration constants, and tuning knobs for Aetheria: Nine Isles.

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
| `PORT` | `4000` | HTTP and WebSocket port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin (your client URL) |
| `JWT_SECRET` | `aetheria-dev-secret-change-me` | Secret for signing JWTs — **change in production** |
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
| `VITE_SERVER_URL` | `http://localhost:4000` (dev) or empty (prod) | Server URL for socket.io and fetch |

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

These are not environment variables — they are constants in `shared/protocol.js` that affect both client and server. Change them in code, then restart the server and rebuild the client.

| Constant | Default | Description |
|---|---|---|
| `TICK_RATE_HZ` | `10` | Server tick rate (monster AI updates per second) |
| `TICK_INTERVAL_MS` | `100` | Derived: `1000 / TICK_RATE_HZ` |
| `MOVE_COOLDOWN_MS` | `140` | Minimum ms between player moves |
| `ATTACK_COOLDOWN_MS` | `700` | Minimum ms between basic attacks |
| `RESPAWN_HP_PENALTY_GOLD_PCT` | `10` | % of gold lost on death |
| `AUTOSAVE_INTERVAL_MS` | `30000` | How often to save all characters |
| `MAX_INVENTORY_SLOTS` | `60` | Max inventory slots (not yet enforced) |
| `STARTING_GOLD` | `50` | Gold given to new characters |
| `CHAT_MAX_LENGTH` | `200` | Max chat message length |
| `CHAT_COOLDOWN_MS` | `1000` | Min ms between chat messages per player |

### Example: faster tick rate

Edit `shared/protocol.js`:
```js
export const TICK_RATE_HZ = 20    // was 10
export const TICK_INTERVAL_MS = 1000 / TICK_RATE_HZ   // = 50
```

Restart the server. Monster AI is now twice as responsive, but CPU usage roughly doubles.

### Example: more forgiving death

```js
export const RESPAWN_HP_PENALTY_GOLD_PCT = 0   // no gold loss on death
```

### Example: higher starting gold

```js
export const STARTING_GOLD = 500   // was 50
```

Only affects new characters created after the change.

---

## Default ports

| Service | Port | Purpose |
|---|---|---|
| Server (dev & prod) | `4000` | HTTP API + WebSocket |
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
3. **Restart the server daily** via PM2 cron: `pm2 start aetheria --cron-restart="0 3 * * *"`

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
- [ ] Firewall blocks direct access to port 4000 (only 80/443 open)
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
