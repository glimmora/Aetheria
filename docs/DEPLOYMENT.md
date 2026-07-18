# Deployment Guide

How to put Mythral on the public internet. Covers single-VPS deployment, Docker, reverse proxy with nginx, SSL, and database migration.

---

## Table of Contents

1. [Deployment options at a glance](#1-deployment-options-at-a-glance)
2. [Option A: Single VPS (simplest)](#2-option-a-single-vps-simplest)
3. [Option B: Docker Compose](#3-option-b-docker-compose)
4. [Option C: Split deployment (static client + VPS server)](#4-option-c-split-deployment-static-client--vps-server)
5. [Nginx reverse proxy config](#5-nginx-reverse-proxy-config)
6. [SSL with Let's Encrypt](#6-ssl-with-lets-encrypt)
7. [Process management with PM2](#7-process-management-with-pm2)
8. [Environment variables checklist](#8-environment-variables-checklist)
9. [Database migration (JSON → PostgreSQL)](#9-database-migration-json--postgresql)
10. [Security checklist](#10-security-checklist)
11. [Monitoring and logs](#11-monitoring-and-logs)
12. [Backup strategy](#12-backup-strategy)

---

## 1. Deployment options at a glance

| Option | Best for | Cost | Complexity |
|---|---|---|---|
| **A. Single VPS** | Small/medium deployments (1-50 players) | $5-20/mo | Low |
| **B. Docker Compose** | Easier reproducible deploys, CI/CD | $5-20/mo + Docker | Medium |
| **C. Split deployment** | Static client on CDN, server on VPS | $0-5/mo CDN + $5-20/mo VPS | Medium |

For most use cases, **Option A** is the right starting point. Migrate to B or C when you outgrow it.

### Recommended VPS providers

- **Hetzner Cloud** — best value ($4-5/mo for 2 vCPU, 4GB RAM)
- **DigitalOcean** — friendly UI, $6-12/mo droplet
- **Vultr** — similar to DO, $6-12/mo
- **AWS Lightsail** — $5-10/mo, easy if you already use AWS
- **Fly.io** — Docker-native, generous free tier

### Minimum specs

- 1 vCPU
- 1 GB RAM (2 GB recommended)
- 20 GB disk (mostly for OS; Mythral data is tiny)
- Ubuntu 22.04 LTS or Debian 12

---

## 2. Option A: Single VPS (simplest)

### Step 1 — Provision a VPS

Create a fresh Ubuntu 22.04 server. SSH in:
```bash
ssh root@your-server-ip
```

### Step 2 — Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git
node --version    # v20.x
```

### Step 3 — Create a non-root user

```bash
adduser mythral
usermod -aG sudo mythral
su - mythral
```

### Step 4 — Clone the repo and install

```bash
cd /home/mythral
git clone https://github.com/glimmora/Mythral.git
cd Mythral
npm install
```

### Step 5 — Build the client

```bash
npm run build
# Output goes to client/dist/
```

### Step 6 — Configure environment

Create `/home/mythral/Mythral/.env`:
```bash
PORT=12000
CLIENT_ORIGIN=https://your-domain.com
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
NODE_ENV=production
```

### Step 7 — Have Express serve the built client

Edit `server/index.js` and add this line near the top (after `app.use(express.json())`):

```js
import express from 'express'
// ... existing imports

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

// Serve the built client (production)
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')))
// SPA fallback: serve index.html for any non-API route
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'))
  }
})
```

### Step 8 — Install PM2 and start the server

```bash
sudo npm install -g pm2
cd /home/mythral/Mythral
pm2 start server/index.js --name mythral
pm2 save
pm2 startup    # follow the instructions to make PM2 start on boot
```

### Step 9 — Verify

```bash
curl http://localhost:12400/health
# {"ok":true,"players":0,"uptime":5.2}

curl http://localhost:12400/
# Should return the built index.html
```

### Step 10 — Set up nginx + SSL (see sections 5 & 6)

---

## 3. Option B: Docker Compose

### Dockerfile

Create `Dockerfile` in the project root:

```dockerfile
FROM node:20-slim

WORKDIR /app

# Copy package files and install
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci --omit=dev

# Copy source
COPY shared/ ./shared/
COPY client/ ./client/
COPY server/ ./server/

# Build the client
RUN npm run build -w client

# Expose the server port
EXPOSE 4000

# Set production env
ENV NODE_ENV=production
ENV PORT=12000

CMD ["node", "server/index.js"]
```

### .dockerignore

```
node_modules
client/node_modules
server/node_modules
client/dist
data
*.log
.git
docs
scripts
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  mythral:
    build: .
    ports:
      - "4000:12000"
    environment:
      - NODE_ENV=production
      - PORT=12000
      - CLIENT_ORIGIN=https://your-domain.com
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data    # persist user/character data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:12400/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

### Build and run

```bash
# Generate a JWT secret
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")

# Build and start
docker compose up -d --build

# Check logs
docker compose logs -f mythral

# Stop
docker compose down
```

The `./data` volume persists user accounts and characters across container restarts.

---

## 4. Option C: Split deployment (static client + VPS server)

Best for: high-traffic client (CDN-cached) + central game server.

### Client side — deploy to a static host

**Vercel:**
```bash
cd client
npm install
npm run build
# Deploy the dist/ folder via Vercel CLI or connect the repo
```

**Netlify:**
```bash
cd client
npm install
npm run build
# Deploy dist/ via Netlify CLI
```

**Cloudflare Pages:**
- Connect your GitHub repo
- Build command: `cd client && npm install && npm run build`
- Build output directory: `client/dist`

**Set the client env var:**
- `VITE_SERVER_URL=https://api.your-domain.com`

### Server side — VPS

Follow [Option A](#2-option-a-single-vps-simplest) but skip step 7 (don't serve static files from Express). The server only handles API + WebSocket.

### CORS

Set `CLIENT_ORIGIN` to your client's domain:
```bash
CLIENT_ORIGIN=https://your-game.vercel.com
```

---

## 5. Nginx reverse proxy config

Nginx sits in front of Node.js and handles:
- SSL termination
- Static file caching (if not using Express for static)
- WebSocket upgrade headers for Socket.io
- Rate limiting (optional)

### /etc/nginx/sites-available/mythral

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certs (see section 6)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # WebSocket upgrade for Socket.io
    location /socket.io/ {
        proxy_pass http://127.0.0.1:12000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API and the rest
    location / {
        proxy_pass http://127.0.0.1:12000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable and reload

```bash
sudo ln -s /etc/nginx/sites-available/mythral /etc/nginx/sites-enabled/
sudo nginx -t          # test config
sudo systemctl reload nginx
```

---

## 6. SSL with Let's Encrypt

### Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### Get a certificate

```bash
sudo certbot --nginx -d your-domain.com
```

Certbot will:
1. Verify domain ownership via the HTTP challenge
2. Generate certs to `/etc/letsencrypt/live/your-domain.com/`
3. Update your nginx config to use them
4. Set up auto-renewal via systemd timer

### Test renewal

```bash
sudo certbot renew --dry-run
```

---

## 7. Process management with PM2

PM2 keeps your Node.js process alive across crashes and reboots.

### Common commands

```bash
pm2 start server/index.js --name mythral     # start
pm2 status                                    # list processes
pm2 logs mythral                             # tail logs
pm2 restart mythral                          # restart
pm2 stop mythral                             # stop
pm2 delete mythral                           # remove from PM2
pm2 monit                                     # real-time CPU/memory
```

### Start on boot

```bash
pm2 startup
# Run the command PM2 prints (it sets up a systemd service)
pm2 save                                      # save current process list
```

### Cluster mode (for multiple CPU cores)

```bash
pm2 start server/index.js --name mythral -i max
```

> **Warning:** Cluster mode with Socket.io requires a Redis adapter for cross-worker broadcasting. Without it, players on different workers cannot see each other. See [Architecture → Scaling](./ARCHITECTURE.md#14-scaling-considerations).

### pm2 ecosystem config

Create `ecosystem.config.cjs`:

```js
module.exports = {
  apps: [{
    name: 'mythral',
    script: 'server/index.js',
    instances: 1,            // use 1 unless you set up Redis adapter
    autorestart: true,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
    },
    env_file: '.env',
  }],
}
```

Start with:
```bash
pm2 start ecosystem.config.cjs
```

---

## 8. Environment variables checklist

Create `.env` in the project root (gitignored):

```bash
# Required
JWT_SECRET=replace-with-64+ char random hex string
CLIENT_ORIGIN=https://your-domain.com

# Optional (with defaults)
PORT=12000
NODE_ENV=production
```

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

For the client (if deployed separately), create `client/.env`:
```bash
VITE_SERVER_URL=https://your-domain.com
```

See [Configuration Reference](./CONFIGURATION.md) for the complete list.

---

## 9. Database migration (JSON → PostgreSQL)

The built-in JSON-file DB is fine for small deployments (up to ~100 active characters). For larger deployments, migrate to PostgreSQL.

### Step 1 — Install Postgres

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo -u postgres psql
```

```sql
CREATE USER mythral WITH PASSWORD 'strong-password';
CREATE DATABASE mythral OWNER mythral;
\q
```

### Step 2 — Create the schema

```sql
-- Run this as the mythral user
\c mythral

CREATE TABLE users (
  username TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  name TEXT UNIQUE NOT NULL,
  class TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  gold INTEGER NOT NULL DEFAULT 0,
  hp INTEGER NOT NULL,
  mp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  max_mp INTEGER NOT NULL,
  base_stats JSONB NOT NULL,
  equipment JSONB NOT NULL,
  inventory JSONB NOT NULL,
  buffs JSONB NOT NULL DEFAULT '[]',
  quest_progress JSONB NOT NULL DEFAULT '{}',
  kill_counts JSONB NOT NULL DEFAULT '{}',
  visited_islands JSONB NOT NULL DEFAULT '["lumina"]',
  killed_bosses JSONB NOT NULL DEFAULT '[]',
  current_island TEXT NOT NULL DEFAULT 'lumina',
  x INTEGER NOT NULL DEFAULT 30,
  y INTEGER NOT NULL DEFAULT 25,
  facing TEXT NOT NULL DEFAULT 'down',
  created_at BIGINT NOT NULL
);

CREATE INDEX idx_characters_owner ON characters(owner);
```

### Step 3 — Install the pg driver

```bash
npm install pg
```

### Step 4 — Reimplement `server/db.js`

Create `server/db-postgres.js` implementing the same 9 functions (see [Architecture → Persistence](./ARCHITECTURE.md#9-persistence-layer)). Replace the imports in `server/index.js` and `server/world.js`:

```js
// Old:
import * as db from './db.js'
// New:
import * as db from './db-postgres.js'
```

### Step 5 — Migrate existing data

Write a one-time migration script that reads `data/users.json` and `data/characters.json` and INSERTs them into Postgres.

---

## 10. Security checklist

Before going live, verify each item:

- [ ] **JWT_SECRET** is set to a 64+ char random string (not the default)
- [ ] **CLIENT_ORIGIN** is set to your actual domain (not localhost)
- [ ] **NODE_ENV=production**
- [ ] HTTPS is enforced (nginx redirects 80 → 443)
- [ ] Firewall allows only ports 22, 80, 443 (block direct access to port 12000)
- [ ] `data/` folder is backed up regularly (see [§12](#12-backup-strategy))
- [ ] PM2 is configured to restart on crash and on boot
- [ ] Server is not running as root (use the `mythral` user)
- [ ] Rate limiting is enabled on `/api/login` and `/api/register` (see [API.md](./API.md#rate-limiting))
- [ ] `sudo` requires a password
- [ ] SSH login uses a key, not a password (`PasswordAuthentication no` in `/etc/ssh/sshd_config`)
- [ ] Unattended upgrades are enabled (`sudo apt install unattended-upgrades`)
- [ ] You have tested the restore-from-backup procedure

### UFW firewall setup

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp       # SSH
sudo ufw allow 80/tcp       # HTTP (for Let's Encrypt + redirect)
sudo ufw allow 443/tcp      # HTTPS
sudo ufw enable
```

---

## 11. Monitoring and logs

### PM2 logs

```bash
pm2 logs mythral --lines 100    # last 100 lines
pm2 logs mythral --err          # errors only
```

Log files are at `/home/mythral/.pm2/logs/`.

### Log rotation

PM2 rotates logs by default (10MB, 30 files retained). To customize:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Server-side monitoring

Add structured logging to `server/index.js`:
```js
const startTime = Date.now()
setInterval(() => {
  const mem = process.memoryUsage()
  console.log(`[stats] players=${world.sessions.size} rss=${Math.round(mem.rss / 1024 / 1024)}MB heap=${Math.round(mem.heapUsed / 1024 / 1024)}MB uptime=${Math.round((Date.now() - startTime) / 1000)}s`)
}, 60000)
```

### External monitoring

- **UptimeRobot** — ping `https://your-domain.com/health` every 5 minutes, alert on downtime
- **PM2 Plus** — paid PM2 monitoring service with dashboards
- **Grafana + Prometheus** — overkill for small deployments, but powerful

---

## 12. Backup strategy

### What to back up

- `data/users.json` — user accounts (password hashes)
- `data/characters.json` — all character state

That's it. Everything else is in git.

### Automated daily backup

Create `/home/mythral/backup.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR=/home/mythral/backups
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Stop writes briefly by signaling PM2 to pause autosave
# (or just copy — JSON files are usually consistent enough)

cp /home/mythral/Mythral/data/users.json $BACKUP_DIR/users_$DATE.json
cp /home/mythral/Mythral/data/characters.json $BACKUP_DIR/characters_$DATE.json

# Compress
cd $BACKUP_DIR
tar czf mythral_backup_$DATE.tar.gz users_$DATE.json characters_$DATE.json
rm users_$DATE.json characters_$DATE.json

# Keep only the last 30 days
find $BACKUP_DIR -name "mythral_backup_*.tar.gz" -mtime +30 -delete

echo "Backup complete: mythral_backup_$DATE.tar.gz"
```

Make it executable and schedule it:
```bash
chmod +x /home/mythral/backup.sh
crontab -e
# Add this line:
0 3 * * * /home/mythral/backup.sh >> /home/mythral/backup.log 2>&1
```

This runs daily at 3 AM.

### Offsite backup

For extra safety, sync backups to S3 or another server:
```bash
# In backup.sh, after the tar:
aws s3 cp mythral_backup_$DATE.tar.gz s3://your-bucket/mythral/
```

### Restore procedure

```bash
cd /home/mythral/Mythral
pm2 stop mythral
# Extract the backup
tar xzf /home/mythral/backups/mythral_backup_YYYYMMDD_HHMMSS.tar.gz
cp users_*.json data/users.json
cp characters_*.json data/characters.json
pm2 start mythral
```

**Test this procedure before you need it.**

---

## See also

- **[Installation Guide](./INSTALL.md)** — Local setup
- **[Configuration](./CONFIGURATION.md)** — All environment variables
- **[Architecture](./ARCHITECTURE.md)** — How the server works
