# Installation Guide

This guide walks you through installing and running **Mythral** from a clean slate. Pick the path that matches your OS, then follow the steps in order.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Get the source code](#2-get-the-source-code)
3. [Install Node.js](#3-install-nodejs)
4. [Install project dependencies](#4-install-project-dependencies)
5. [Configure environment variables](#5-configure-environment-variables)
6. [Run in development mode](#6-run-in-development-mode)
7. [Run the production build](#7-run-the-production-build)
8. [Verify everything works](#8-verify-everything-works)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

| Requirement | Minimum version | Recommended |
|---|---|---|
| **Node.js** | 18 LTS | 20 LTS or newer |
| **npm** | 9 | 10+ |
| **OS** | Windows 10+, macOS 11+, Linux (any modern distro) | Linux or macOS |
| **RAM** | 1 GB free | 2 GB+ |
| **Disk** | 200 MB (without `node_modules`) | 500 MB |
| **Browser** | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ | Latest Chrome/Firefox |

You do **not** need PostgreSQL, MongoDB, Redis, Docker, or any external database — Mythral ships with a built-in JSON-file persistence layer that is fine for small/medium deployments. See [Deployment Guide](./DEPLOYMENT.md) if you want to swap it for a real database.

---

## 2. Get the source code

### Option A — Clone from GitHub (recommended)

```bash
git clone https://github.com/glimmora/Mythral.git
cd Mythral
```

### Option B — Download a ZIP

1. Visit https://github.com/glimmora/Mythral
2. Click **Code → Download ZIP**
3. Extract the archive
4. Open a terminal in the extracted folder

### Option C — Fork first (if you plan to modify)

```bash
# Fork via the GitHub UI, then:
git clone https://github.com/YOUR_USERNAME/Mythral.git
cd Mythral
git remote add upstream https://github.com/glimmora/Mythral.git
```

---

## 3. Install Node.js

### macOS (with Homebrew)
```bash
brew install node@20
node --version    # should print v20.x or newer
npm --version     # should print 10.x or newer
```

### Linux (Debian/Ubuntu)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### Linux (Fedora/RHEL)
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

### Windows
1. Download the LTS installer from https://nodejs.org/
2. Run the installer (accept all defaults)
3. Open **PowerShell** and verify:
```powershell
node --version
npm --version
```

### Using `nvm` (any OS — recommended for developers)
```bash
# Install nvm: https://github.com/nvm-sh/nvm
nvm install 20
nvm use 20
node --version
```

---

## 4. Install project dependencies

From the project root (the folder containing `package.json`, `client/`, `server/`, `shared/`):

```bash
npm install
```

This command installs **all** dependencies for both the client and server workspaces using npm workspaces. All packages are hoisted to the root `node_modules/` folder.

**Expected output:**
```
added 195 packages, and audited 196 packages in 8s
```

> **Note:** You may see warnings about `esbuild` install scripts — these are safe to ignore in development. They are required for Vite to function.

### Verifying the install

```bash
# Confirm key binaries are present
ls node_modules/.bin/vite        # client bundler
ls node_modules/.bin/esbuild     # vite dependency
node -e "require('express'); console.log('express OK')"
node -e "require('socket.io'); console.log('socket.io OK')"
node -e "require('bcryptjs'); console.log('bcryptjs OK')"
```

All four should print without errors.

---

## 5. Configure environment variables

Mythral works out of the box with sensible development defaults, but you **should** set a few environment variables before going to production.

### Development defaults (no action needed)

For local dev, you can skip this section entirely. The defaults are:

| Variable | Default | Used by |
|---|---|---|
| `PORT` | `4000` | server |
| `CLIENT_ORIGIN` | `http://localhost:5173` | server (CORS) |
| `JWT_SECRET` | `mythral-dev-secret-change-me` | server |
| `VITE_SERVER_URL` | `http://localhost:4000` | client |

### Production setup

Create a `.env` file in the project root (this file is gitignored — never commit it):

```bash
# .env
PORT=4000
CLIENT_ORIGIN=https://your-domain.com
JWT_SECRET=replace-with-a-long-random-string-at-least-32-chars
NODE_ENV=production
```

For the client, create `client/.env`:

```bash
# client/.env
VITE_SERVER_URL=https://api.your-domain.com
```

Generate a strong JWT secret with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

See [Configuration Reference](./CONFIGURATION.md) for the full list of options.

---

## 6. Run in development mode

### Run both client and server together (recommended)

```bash
npm run dev
```

This uses `concurrently` to start:
- **Server** on http://localhost:4000 (with `--watch` for auto-reload on file changes)
- **Client** on http://localhost:5173 (Vite dev server with HMR)

You should see output like:
```
[server] [db] Loaded 0 users, 0 characters
[server]
[server]   ⚔️  Mythral Server running on http://localhost:4000
[server]   🌐  CORS origin: http://localhost:5173
[server]   ⏱   Tick rate: 10 Hz
[server]   💾  Autosave: every 30s
[server]
[client]
[client]   VITE v5.4.21  ready in 265 ms
[client]
[client]   ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser to play.

### Run client and server separately (useful for debugging)

Terminal 1:
```bash
npm run dev:server
```

Terminal 2:
```bash
npm run dev:client
```

### What the Vite dev proxy does

The client's `vite.config.js` proxies these paths to the server during development, so the client and server can share the same origin in your browser:

- `/api/*` → `http://localhost:4000`
- `/socket.io/*` (with WebSocket upgrade) → `http://localhost:4000`

This means your client code can call `/api/login` without specifying a host, and Socket.io will auto-connect to the same origin.

---

## 7. Run the production build

### Build the client

```bash
npm run build
```

This produces optimized, minified static files in `client/dist/`:

```
client/dist/
├── index.html
├── favicon.svg
└── assets/
    ├── index-<hash>.js     (~315 KB, ~95 KB gzipped)
    └── index-<hash>.css    (~32 KB, ~6 KB gzipped)
```

### Serve the built client

For a quick local test:
```bash
npm run preview --workspace client
# Serves client/dist/ on http://localhost:4173
```

For production, you have three options — see [Deployment Guide](./DEPLOYMENT.md) for full details:

1. **Serve `client/dist/` from any static host** (Vercel, Netlify, Cloudflare Pages, S3+CloudFront, nginx) and run the server on a separate host.
2. **Have Express serve the static files** by adding one line to `server/index.js`:
   ```js
   app.use(express.static(path.join(__dirname, '..', 'client', 'dist')))
   ```
3. **Use Docker Compose** with the provided `Dockerfile` (see Deployment Guide).

### Start the production server

```bash
NODE_ENV=production node server/index.js
```

The server runs from source (no build step needed) because Node natively supports ES modules.

---

## 8. Verify everything works

### Quick smoke test (data integrity)

```bash
npm run smoke
```

Expected output:
```
=== Mythral Smoke Test (shared/ data) ===
...
=== Results: 50 passed, 0 failed ===
```

### End-to-end multiplayer test

Start the server in one terminal:
```bash
npm run dev:server
```

In another terminal, run the E2E test:
```bash
node scripts/e2e-test.js
```

Expected output:
```
=== Mythral Multiplayer E2E Test ===
...
=== Results: 19 passed, 0 failed ===
```

### Manual browser test

1. Open http://localhost:5173
2. Click **Register** and create an account
3. Create a character (e.g., "Bob", Warrior class)
4. You should spawn on Lumina Isle surrounded by 8 NPCs and ~26 monsters
5. Use WASD to move, click a rat to attack it
6. Open a second browser (or incognito window), register another account, create another character
7. Both characters should see each other on the same island
8. Type in the chat box (bottom-left) — both windows should see the message

### Health check

```bash
curl http://localhost:4000/health
# {"ok":true,"players":2,"uptime":123.45}
```

---

## 9. Troubleshooting

### "Cannot find module 'express'" / similar import errors

You skipped `npm install`. Run it from the project root:
```bash
npm install
```

### Port already in use

```
Error: listen EADDRINUSE: address already in use 0.0.0.0:4000
```

Find and kill the process holding the port:
```bash
# macOS / Linux
lsof -i :4000
kill -9 <PID>

# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

Or run on a different port:
```bash
PORT=5000 npm run dev:server
```

### Socket.io connection errors in the browser console

```
Cross-Origin Request Blocked
```

The server's CORS is set to allow `CLIENT_ORIGIN` (defaults to `http://localhost:5173`). If your client is served from a different origin, set the env var:
```bash
CLIENT_ORIGIN=http://localhost:3000 npm run dev:server
```

### "Invalid token" on socket connection

Your JWT in localStorage is stale or signed with an old secret. Open browser DevTools → Application → Local Storage → clear `mythral_token`, then refresh.

### Changes to `shared/` don't appear in the browser

The Vite dev server has HMR but may cache aggressively. Force a full reload:
- Hard refresh: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (macOS)
- Or restart the client: kill `npm run dev:client` and restart it

### Server crash on startup with "Cannot read properties of undefined"

Most likely a syntax error in `shared/` or `server/`. Run:
```bash
node scripts/smoke-test.js
```
to isolate data issues, then check `server/index.js` with:
```bash
node --check server/index.js
```

### Lost admin access / forgot password

There is no admin password — the JSON file DB stores users in `server/data/users.json` (or `data/users.json` depending on your setup). To reset:
```bash
# Stop the server
rm server/data/users.json server/data/characters.json
npm run dev:server
```

You will start fresh with no users. **This deletes all accounts and characters.**

### Performance issues with many players

The default JSON-file persistence and 10 Hz tick loop are fine up to ~50 concurrent players per island. For larger deployments:
- Swap `server/db.js` for Postgres or MongoDB (see [Deployment Guide](./DEPLOYMENT.md))
- Increase tick rate in `shared/protocol.js` (`TICK_RATE_HZ`)
- Run multiple server processes behind a load balancer (each process is a separate "world shard" — players on different shards cannot see each other)

---

## Next steps

- **[Tutorial](./TUTORIAL.md)** — A guided walkthrough for first-time players and developers
- **[Architecture](./ARCHITECTURE.md)** — How the single-world server-authoritative design works
- **[Deployment](./DEPLOYMENT.md)** — Put it on the public internet
- **[Development Guide](./DEVELOPMENT.md)** — Add new islands, NPCs, quests, items, monsters, or classes
