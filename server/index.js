// ============================================================
// Aetheria Server - HTTP + WebSocket entry point
// ============================================================

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { fileURLToPath } from 'url'
import path from 'path'

import { SERVER_EVENTS, CLIENT_EVENTS, TICK_INTERVAL_MS, CONFIG } from '../shared/protocol.js'
import { World } from './world.js'
import * as db from './db.js'
import {
  hashPassword, verifyPassword, signToken, verifyToken,
  validateUsername, validatePassword,
} from './auth.js'
import { CLASSES } from '../shared/classes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 4000
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

const httpServer = http.createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

const world = new World()

// ---- HTTP routes for auth (alternative to socket-based auth) ----
app.get('/health', (req, res) => {
  res.json({ ok: true, players: world.sessions.size, uptime: process.uptime() })
})

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body || {}
  const uErr = validateUsername(username)
  if (uErr) return res.status(400).json({ error: uErr })
  const pErr = validatePassword(password)
  if (pErr) return res.status(400).json({ error: pErr })
  if (db.getUser(username)) return res.status(409).json({ error: 'Username already taken' })
  const hash = await hashPassword(password)
  const user = db.createUser(username, hash)
  const token = signToken({ username: user.username })
  res.json({ ok: true, token, username: user.displayName })
})

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {}
  const user = db.getUser(username)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
  const token = signToken({ username: user.username })
  res.json({ ok: true, token, username: user.displayName })
})

app.get('/api/characters', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
  const token = auth.slice(7)
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Invalid token' })
  const chars = db.getCharactersByOwner(payload.username)
  res.json({ ok: true, characters: chars.map(c => ({
    id: c.id, name: c.name, class: c.class, level: c.level, currentIsland: c.currentIsland,
  })) })
})

// ---- Socket.io auth + game events ----
io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('No token provided'))
  const payload = verifyToken(token)
  if (!payload) return next(new Error('Invalid token'))
  socket.userPayload = payload
  next()
})

io.on('connection', (socket) => {
  console.log(`[socket] ${socket.userPayload.username} connected (${socket.id})`)
  socket.emit(SERVER_EVENTS.WELCOME, { username: socket.userPayload.username })

  // ---- Character list ----
  socket.on(CLIENT_EVENTS.CHARACTER_LIST, () => {
    const chars = db.getCharactersByOwner(socket.userPayload.username)
    socket.emit(SERVER_EVENTS.CHARACTER_LIST, {
      characters: chars.map(c => ({
        id: c.id, name: c.name, class: c.class, level: c.level, currentIsland: c.currentIsland,
      })),
    })
  })

  // ---- Character create ----
  socket.on(CLIENT_EVENTS.CHARACTER_CREATE, ({ name, classId } = {}) => {
    const result = world.createCharacter(socket.userPayload.username, name, classId)
    if (result.error) {
      socket.emit(SERVER_EVENTS.ERROR, { message: result.error })
      return
    }
    socket.emit(SERVER_EVENTS.CHARACTER_CREATED, {
      id: result.character.id, name: result.character.name,
      class: result.character.class, level: result.character.level,
    })
  })

  // ---- Character select (enter game) ----
  socket.on(CLIENT_EVENTS.CHARACTER_SELECT, ({ characterId } = {}) => {
    const char = db.getCharacter(characterId)
    if (!char || char.owner !== socket.userPayload.username) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Character not found' })
      return
    }
    // ensure classDef is populated (loaded from JSON might lose prototype)
    if (!char.classDef) {
      char.classDef = CLASSES[char.class]
    }
    const session = world.createSession(socket, char)
    world.playerJoinIsland(session, char.currentIsland)
  })

  socket.on(CLIENT_EVENTS.CHARACTER_DELETE, ({ characterId } = {}) => {
    const char = db.getCharacter(characterId)
    if (!char || char.owner !== socket.userPayload.username) return
    db.deleteCharacter(characterId)
    socket.emit(SERVER_EVENTS.CHARACTER_DELETED, { id: characterId })
  })

  // ---- In-game events ----
  socket.on(CLIENT_EVENTS.MOVE, ({ dx, dy } = {}) => {
    const session = world.sessions.get(socket.id)
    if (!session) return
    world.playerMove(session, dx || 0, dy || 0)
  })

  socket.on(CLIENT_EVENTS.ATTACK, ({ monsterId } = {}) => {
    const session = world.sessions.get(socket.id)
    if (!session) return
    world.playerAttack(session, monsterId)
  })

  socket.on(CLIENT_EVENTS.SKILL, ({ skillId, targetMonsterId } = {}) => {
    const session = world.sessions.get(socket.id)
    if (!session) return
    world.playerUseSkill(session, skillId, targetMonsterId)
  })

  socket.on(CLIENT_EVENTS.USE_ITEM, ({ itemId } = {}) => {
    const session = world.sessions.get(socket.id)
    if (!session) return
    world.playerUseItem(session, itemId)
  })
  socket.on(CLIENT_EVENTS.EQUIP_ITEM, ({ itemId } = {}) => {
    const session = world.sessions.get(socket.id)
    if (!session) return
    world.playerEquip(session, itemId)
  })
  socket.on(CLIENT_EVENTS.UNEQUIP_ITEM, ({ slot } = {}) => {
    const session = world.sessions.get(socket.id)
    if (!session) return
    world.playerUnequip(session, slot)
  })

  socket.on(CLIENT_EVENTS.BUY_ITEM, ({ npcId, itemId, qty } = {}) => {
    const session = world.sessions.get(socket.id)
    if (!session) return
    world.playerBuy(session, npcId, itemId, qty || 1)
  })
  socket.on(CLIENT_EVENTS.SELL_ITEM, ({ itemId, qty } = {}) => {
    const session = world.sessions.get(socket.id)
    if (!session) return
    world.playerSell(session, itemId, qty || 1)
  })

  socket.on(CLIENT_EVENTS.ACCEPT_QUEST, ({ questId } = {}) => {
    const session = world.sessions.get(socket.id)
    if (!session) return
    world.playerAcceptQuest(session, questId)
  })
  socket.on(CLIENT_EVENTS.TURN_IN_QUEST, ({ questId } = {}) => {
    const session = world.sessions.get(socket.id)
    if (!session) return
    world.playerTurnInQuest(session, questId)
  })

  socket.on(CLIENT_EVENTS.TRAVEL, ({ islandId } = {}) => {
    const session = world.sessions.get(socket.id)
    if (!session) return
    world.playerTravel(session, islandId)
  })

  socket.on(CLIENT_EVENTS.RESPAWN, () => {
    const session = world.sessions.get(socket.id)
    if (!session) return
    world.playerRespawn(session)
  })

  socket.on(CLIENT_EVENTS.CHAT, ({ message } = {}) => {
    const session = world.sessions.get(socket.id)
    if (!session) return
    world.playerChat(session, message)
  })

  socket.on('disconnect', () => {
    console.log(`[socket] ${socket.userPayload?.username || '?'} disconnected (${socket.id})`)
    world.removeSession(socket.id)
  })
})

// ---- Game loop ----
let lastTick = Date.now()
setInterval(() => {
  const now = Date.now()
  world.tickAll(now)
  lastTick = now
}, TICK_INTERVAL_MS)

// ---- Autosave ----
setInterval(() => {
  for (const session of world.sessions.values()) {
    if (session.character) db.saveCharacter(session.character)
  }
}, CONFIG.AUTOSAVE_INTERVAL_MS)

// ---- Init ----
await db.loadAll()
httpServer.listen(PORT, () => {
  console.log(`\n  ⚔️  Aetheria Server running on http://localhost:${PORT}`)
  console.log(`  🌐  CORS origin: ${CLIENT_ORIGIN}`)
  console.log(`  ⏱   Tick rate: ${1000 / TICK_INTERVAL_MS} Hz`)
  console.log(`  💾  Autosave: every ${CONFIG.AUTOSAVE_INTERVAL_MS / 1000}s\n`)
})

// graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[server] Shutting down...')
  for (const session of world.sessions.values()) {
    if (session.character) db.saveCharacter(session.character)
  }
  await db.saveAllNow()
  process.exit(0)
})
process.on('SIGTERM', async () => {
  for (const session of world.sessions.values()) {
    if (session.character) db.saveCharacter(session.character)
  }
  await db.saveAllNow()
  process.exit(0)
})
