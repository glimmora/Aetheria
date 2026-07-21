// ============================================================
// Mythral Server - HTTP + WebSocket entry point
// Hardened with rate limiting, input validation, single-session
// enforcement, leaderboard, online-players list, player inspect.
// ============================================================

import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { fileURLToPath } from 'url'
import path from 'path'

import { SERVER_EVENTS, CLIENT_EVENTS, TICK_RATE_HZ, TICK_INTERVAL_MS, CONFIG, MAX_LEVEL, xpForLevel, totalXpForLevel } from '../shared/protocol.js'
import { World } from './world.js'
import * as db from './db.js'
import {
  hashPassword, verifyPassword, signToken, verifyToken,
  validateUsername, validatePassword,
} from './auth.js'
import { CLASSES } from '../shared/classes.js'
import { ISLAND_DEFS } from '../shared/islands.js'
import { getSuspiciousLog } from './security.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Load .env from project root (not server/ subdir, which is the CWD when
// running via npm workspaces)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const PORT = parseInt(process.env.PORT) || 12400
const HOST = process.env.HOST || '0.0.0.0'
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://152.53.102.150'
const CLIENT_ORIGIN_PRODUCTION = process.env.CLIENT_ORIGIN // explicit, no fallback in prod
const BODY_LIMIT = process.env.BODY_LIMIT || '64kb'
const PING_INTERVAL = parseInt(process.env.SOCKET_PING_INTERVAL) || 10000
const PING_TIMEOUT = parseInt(process.env.SOCKET_PING_TIMEOUT) || 5000

const app = express()
// CORS: in production, set CLIENT_ORIGIN to your exact domain for security.
// In dev, allow any origin for convenience (Vite dev server, mobile, etc.)
const corsOrigin = process.env.NODE_ENV === 'production'
  ? (CLIENT_ORIGIN_PRODUCTION || false)
  : true
app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json({ limit: BODY_LIMIT }))

const httpServer = http.createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
  pingInterval: PING_INTERVAL,
  pingTimeout: PING_TIMEOUT,
})

const world = new World()

// ---- Simple in-memory rate limiter ----
class RateLimiter {
  constructor(limit, windowMs) {
    this.limit = limit
    this.windowMs = windowMs
    this.buckets = new Map() // key -> [{ time }]
    // Garbage collect every minute
    setInterval(() => this.gc(), 60 * 1000).unref()
  }
  gc() {
    const now = Date.now()
    for (const [key, times] of this.buckets.entries()) {
      const valid = times.filter(t => now - t < this.windowMs)
      if (valid.length === 0) this.buckets.delete(key)
      else this.buckets.set(key, valid)
    }
  }
  check(key) {
    const now = Date.now()
    const times = (this.buckets.get(key) || []).filter(t => now - t < this.windowMs)
    if (times.length >= this.limit) return false
    times.push(now)
    this.buckets.set(key, times)
    return true
  }
}

const authLimiter = new RateLimiter(CONFIG.AUTH_RATE_LIMIT_PER_15MIN, CONFIG.AUTH_RATE_LIMIT_WINDOW_MS)
const generalLimiter = new RateLimiter(CONFIG.GENERAL_RATE_LIMIT_PER_MIN, 60 * 1000)

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'
}

// ---- HTTP routes ----
app.get('/health', (req, res) => {
  const stats = world.getServerStats()
  res.json({ ok: true, players: stats.onlinePlayers, ...stats })
})

app.get('/api/stats', (req, res) => {
  const stats = world.getServerStats()
  res.json({
    ok: true,
    ...stats,
    totalCharacters: db.getAllCharacters().length,
    totalUsers: db.getAllUsersCount(),
  })
})

// Security audit log (admin only — protected by JWT, could add role check)
app.get('/api/security/audit', (req, res) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
  const token = auth.slice(7)
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Invalid token' })
  res.json({ ok: true, suspicious: getSuspiciousLog() })
})

app.get('/api/leaderboard', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || CONFIG.LEADERBOARD_SIZE, CONFIG.LEADERBOARD_SIZE)
  const leaderboard = world.getLeaderboard(limit)
  res.json({ ok: true, leaderboard })
})

// XP curve info — lets players see the full progression table
app.get('/api/xp-curve', (req, res) => {
  const levels = []
  for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
    levels.push({
      level: lvl,
      xpForNext: lvl < MAX_LEVEL ? xpForLevel(lvl) : 0,
      totalXp: totalXpForLevel(lvl),
    })
  }
  res.json({
    ok: true,
    maxLevel: MAX_LEVEL,
    levels,
  })
})

app.post('/api/register', async (req, res) => {
  const ip = clientIp(req)
  if (!authLimiter.check(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Please try again later.' })
  }
  const { username, password } = req.body || {}
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid request body' })
  }
  const uErr = validateUsername(username)
  if (uErr) return res.status(400).json({ error: uErr })
  const pErr = validatePassword(password)
  if (pErr) return res.status(400).json({ error: pErr })
  if (db.getUser(username)) return res.status(409).json({ error: 'Username already taken' })
  try {
    const hash = await hashPassword(password)
    const user = db.createUser(username, hash)
    const token = signToken({ username: user.username })
    res.json({ ok: true, token, username: user.displayName })
  } catch (e) {
    console.error('[auth] Register error:', e)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/login', async (req, res) => {
  const ip = clientIp(req)
  if (!authLimiter.check(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Please try again later.' })
  }
  const { username, password } = req.body || {}
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid request body' })
  }
  const user = db.getUser(username)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  try {
    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = signToken({ username: user.username })
    res.json({ ok: true, token, username: user.displayName })
  } catch (e) {
    console.error('[auth] Login error:', e)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/api/characters', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
  const token = auth.slice(7)
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Invalid token' })
  const chars = db.getCharactersByOwner(payload.username)
  res.json({
    ok: true,
    characters: chars.map(c => ({
      id: c.id, name: c.name, class: c.class, level: c.level, currentIsland: c.currentIsland,
    })),
    maxCharacters: CONFIG.MAX_CHARACTERS_PER_ACCOUNT,
  })
})

// ---- Socket.io auth middleware ----
io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token || typeof token !== 'string') return next(new Error('No token provided'))
  const payload = verifyToken(token)
  if (!payload) return next(new Error('Invalid token'))
  socket.userPayload = payload
  next()
})

// ---- Validation helpers ----
function isStr(v) { return typeof v === 'string' && v.length > 0 && v.length < 1000 }
function isInt(v, min = 1, max = 99) { return Number.isInteger(v) && v >= min && v <= max }
function sanitizeQty(v) {
  const n = parseInt(v)
  if (!Number.isInteger(n) || n < 1) return 1
  if (n > 99) return 99
  return n
}

io.on('connection', (socket) => {
  console.log(`[socket] ${socket.userPayload.username} connected (${socket.id})`)
  socket.emit(SERVER_EVENTS.WELCOME, { username: socket.userPayload.username })

  // Debug: log all events received
  socket.onAny((event, ...args) => {
    console.log(`[socket] ${socket.userPayload.username} ← ${event}${event === 'move' ? ' dx=' + args[0]?.dx + ' dy=' + args[0]?.dy : ''}`)
  })

  // Wrapper: catch errors in handlers so one bad event doesn't crash the server
  function safeHandler(fn) {
    return (...args) => {
      try { fn(...args) }
      catch (e) {
        console.error(`[socket] Handler error from ${socket.id}:`, e.message)
        try { socket.emit(SERVER_EVENTS.ERROR, { message: 'Internal server error' }) } catch {}
      }
    }
  }

  // ---- Character list ----
  socket.on(CLIENT_EVENTS.CHARACTER_LIST, safeHandler(() => {
    if (!generalLimiter.check(socket.id)) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Too many requests. Slow down.' })
      return
    }
    const chars = db.getCharactersByOwner(socket.userPayload.username)
    socket.emit(SERVER_EVENTS.CHARACTER_LIST, {
      characters: chars.map(c => ({
        id: c.id, name: c.name, class: c.class, level: c.level, currentIsland: c.currentIsland,
      })),
      maxCharacters: CONFIG.MAX_CHARACTERS_PER_ACCOUNT,
    })
  }))

  // ---- Character create ----
  socket.on(CLIENT_EVENTS.CHARACTER_CREATE, safeHandler((data = {}) => {
    if (!generalLimiter.check(socket.id)) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Too many requests. Slow down.' })
      return
    }
    const { name, classId, gender } = data
    if (!isStr(name) || !isStr(classId)) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Invalid character data' })
      return
    }
    const result = world.createCharacter(socket.userPayload.username, name, classId, gender)
    if (result.error) {
      socket.emit(SERVER_EVENTS.ERROR, { message: result.error })
      return
    }
    socket.emit(SERVER_EVENTS.CHARACTER_CREATED, {
      id: result.character.id, name: result.character.name,
      class: result.character.class, level: result.character.level,
    })
  }))

  // ---- Character select (enter game) ----
  socket.on(CLIENT_EVENTS.CHARACTER_SELECT, safeHandler((data = {}) => {
    const { characterId } = data
    if (!isStr(characterId)) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Invalid character' })
      return
    }
    const char = db.getCharacter(characterId)
    if (!char || char.owner !== socket.userPayload.username) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Character not found' })
      return
    }
    // Single-session enforcement: kick any existing session for this character
    world.kickExistingSessionForCharacter(characterId, socket.id)
    // Ensure classDef is populated (loaded from JSON might lose prototype)
    if (!char.classDef) {
      char.classDef = CLASSES[char.class]
    }
    const session =     world.createSession(socket, char)
    world.playerJoinIsland(session, char.currentIsland)
  }))

  socket.on(CLIENT_EVENTS.CHARACTER_DELETE, safeHandler((data = {}) => {
    const { characterId } = data
    if (!isStr(characterId)) return
    const char = db.getCharacter(characterId)
    if (!char || char.owner !== socket.userPayload.username) return
    // Cannot delete a character that is currently in-game (on another session)
    for (const s of world.sessions.values()) {
      if (s.character && s.character.id === characterId) {
        socket.emit(SERVER_EVENTS.ERROR, { message: 'Cannot delete a character that is currently in-game.' })
        return
      }
    }
    db.deleteCharacter(characterId)
    socket.emit(SERVER_EVENTS.CHARACTER_DELETED, { id: characterId })
  }))

  // ---- In-game events (all require active session) ----
  function requireSession() {
    return world.sessions.get(socket.id)
  }

  socket.on(CLIENT_EVENTS.MOVE, safeHandler((data = {}) => {
    const session = requireSession()
    if (!session) return
    const { dx, dy } = data
    if (!Number.isInteger(dx) || !Number.isInteger(dy)) return
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) return
    if (dx === 0 && dy === 0) return
    world.playerMove(session, dx, dy)
  }))

  socket.on(CLIENT_EVENTS.ATTACK, safeHandler((data = {}) => {
    const session = requireSession()
    if (!session) return
    if (!isStr(data.monsterId)) return
    world.playerAttack(session, data.monsterId)
  }))

  socket.on(CLIENT_EVENTS.SKILL, safeHandler((data = {}) => {
    const session = requireSession()
    if (!session) return
    if (!isStr(data.skillId)) return
    const target = isStr(data.targetMonsterId) ? data.targetMonsterId : null
    world.playerUseSkill(session, data.skillId, target)
  }))

  socket.on(CLIENT_EVENTS.USE_ITEM, safeHandler((data = {}) => {
    const session = requireSession()
    if (!session) return
    if (!isStr(data.itemId)) return
    world.playerUseItem(session, data.itemId)
  }))
  socket.on(CLIENT_EVENTS.EQUIP_ITEM, safeHandler((data = {}) => {
    const session = requireSession()
    if (!session) return
    if (!isStr(data.itemId)) return
    world.playerEquip(session, data.itemId)
  }))
  socket.on(CLIENT_EVENTS.UNEQUIP_ITEM, safeHandler((data = {}) => {
    const session = requireSession()
    if (!session) return
    const slot = data.slot
    if (!['weapon', 'armor', 'helmet', 'shield', 'boots', 'trinket'].includes(slot)) return
    world.playerUnequip(session, slot)
  }))

  socket.on(CLIENT_EVENTS.BUY_ITEM, safeHandler((data = {}) => {
    const session = requireSession()
    if (!session) return
    if (!isStr(data.npcId) || !isStr(data.itemId)) return
    const qty = sanitizeQty(data.qty)
    world.playerBuy(session, data.npcId, data.itemId, qty)
  }))
  socket.on(CLIENT_EVENTS.SELL_ITEM, safeHandler((data = {}) => {
    const session = requireSession()
    if (!session) return
    if (!isStr(data.itemId)) return
    const qty = sanitizeQty(data.qty)
    world.playerSell(session, data.itemId, qty)
  }))

  socket.on(CLIENT_EVENTS.ACCEPT_QUEST, safeHandler((data = {}) => {
    const session = requireSession()
    if (!session) return
    if (!isStr(data.questId)) return
    world.playerAcceptQuest(session, data.questId)
  }))
  socket.on(CLIENT_EVENTS.TURN_IN_QUEST, safeHandler((data = {}) => {
    const session = requireSession()
    if (!session) return
    if (!isStr(data.questId)) return
    world.playerTurnInQuest(session, data.questId)
  }))

  socket.on(CLIENT_EVENTS.TRAVEL, safeHandler((data = {}) => {
    const session = requireSession()
    if (!session) return
    if (!isStr(data.islandId)) return
    if (!ISLAND_DEFS[data.islandId]) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Invalid destination' })
      return
    }
    world.playerTravel(session, data.islandId)
  }))

  socket.on(CLIENT_EVENTS.RESPAWN, safeHandler(() => {
    const session = requireSession()
    if (!session) return
    world.playerRespawn(session)
  }))

  socket.on(CLIENT_EVENTS.CHAT, safeHandler((data = {}) => {
    const session = requireSession()
    if (!session) return
    const msg = data.message
    if (typeof msg !== 'string') return
    world.playerChat(session, msg)
  }))

  // ---- New: online players, inspect, leaderboard ----
  socket.on(CLIENT_EVENTS.REQUEST_ONLINE, safeHandler(() => {
    const list = world.getOnlinePlayersList()
    socket.emit(SERVER_EVENTS.ONLINE_PLAYERS, { players: list })
  }))

  socket.on(CLIENT_EVENTS.INSPECT_PLAYER, safeHandler((data = {}) => {
    const session = requireSession()
    if (!session) return
    if (!isStr(data.playerId)) return
    world.inspectPlayer(session, data.playerId)
  }))

  socket.on(CLIENT_EVENTS.REQUEST_LEADERBOARD, safeHandler((data = {}) => {
    const limit = Math.min(parseInt(data.limit) || CONFIG.LEADERBOARD_SIZE, CONFIG.LEADERBOARD_SIZE)
    const leaderboard = world.getLeaderboard(limit)
    socket.emit(SERVER_EVENTS.LEADERBOARD, { leaderboard })
  }))

  socket.on('disconnect', (reason) => {
    console.log(`[socket] ${socket.userPayload?.username || '?'} disconnected (${socket.id}) — ${reason}`)
    world.removeSession(socket.id)
  })
})

// ---- Game loop ----
setInterval(() => {
  const now = Date.now()
  world.tickAll(now)
}, TICK_INTERVAL_MS)

// ---- Autosave ----
setInterval(() => {
  for (const session of world.sessions.values()) {
    if (session.character) db.saveCharacter(session.character)
  }
}, CONFIG.AUTOSAVE_INTERVAL_MS)

// ---- Periodic online players broadcast ----
setInterval(() => {
  if (world.sessions.size === 0) return
  const list = world.getOnlinePlayersList()
  for (const session of world.sessions.values()) {
    if (session.socket && session.socket.connected) {
      session.socket.emit(SERVER_EVENTS.ONLINE_PLAYERS, { players: list })
    }
  }
}, CONFIG.ONLINE_BROADCAST_INTERVAL_MS)

// ---- Init ----
await db.loadAll()
httpServer.listen(PORT, HOST, () => {
  console.log(`\n  ⚔️  Mythral Server running on http://${HOST}:${PORT}`)
  console.log(`  🌐  CORS origin: ${typeof corsOrigin === 'string' ? corsOrigin : (corsOrigin ? 'any (dev)' : 'disabled')}`)
  console.log(`  ⏱   Tick rate: ${TICK_RATE_HZ} Hz`)
  console.log(`  💾  Autosave: every ${CONFIG.AUTOSAVE_INTERVAL_MS / 1000}s`)
  console.log(`  🛡   Rate limits: auth=${CONFIG.AUTH_RATE_LIMIT_PER_15MIN}/15min, general=${CONFIG.GENERAL_RATE_LIMIT_PER_MIN}/min`)
  console.log(`  👤  Max characters per account: ${CONFIG.MAX_CHARACTERS_PER_ACCOUNT}`)
  console.log(`  🔧  NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`)
})

// graceful shutdown
async function shutdown(signal) {
  console.log(`\n[server] ${signal} received, shutting down...`)
  for (const session of world.sessions.values()) {
    if (session.character) db.saveCharacter(session.character)
  }
  await db.saveAllNow()
  process.exit(0)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

// ---- Global error handlers: prevent crashes from unhandled errors ----
process.on('uncaughtException', (err) => {
  console.error('[server] UNCAUGHT EXCEPTION:', err.message)
  console.error(err.stack)
  // Don't exit — try to keep serving. Log the error and continue.
  // In production, you may want to exit + restart via PM2.
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[server] UNHANDLED REJECTION:', reason)
  // Don't exit — log and continue
})

// ---- Socket.io server-level error handling ----
io.engine.on('connection_error', (err) => {
  console.error('[socket.io] Connection error:', err.message)
})

// ---- Periodic cleanup: remove stale sessions (safety net) ----
setInterval(() => {
  for (const [socketId, session] of world.sessions.entries()) {
    if (!session.socket || !session.socket.connected) {
      console.log(`[cleanup] Removing stale session ${socketId}`)
      world.removeSession(socketId)
    }
  }
}, CONFIG.STALE_SESSION_CLEANUP_INTERVAL_MS)
