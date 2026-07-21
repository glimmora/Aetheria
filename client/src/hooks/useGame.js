// ============================================================
// Mythral Client - Networking hook
// Manages socket.io connection, auth, and game state received
// from the server. The server is authoritative; the client only
// sends inputs and renders the state it receives.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { SERVER_EVENTS, CLIENT_EVENTS, CONFIG } from '../../../shared/protocol.js'
import { findPath } from '../utils/pathfinding.js'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://${location.hostname}:12400`
  || (typeof window !== 'undefined' ? window.location.origin : '')

export function useGame() {
  const [screen, setScreen] = useState('connecting') // connecting | auth | char_select | game
  const [authError, setAuthError] = useState(null)
  const [username, setUsername] = useState(null)
  const [characters, setCharacters] = useState([])
  const [maxCharacters, setMaxCharacters] = useState(CONFIG.MAX_CHARACTERS_PER_ACCOUNT)
  const [token, setToken] = useState(() => localStorage.getItem('mythral_token'))
  const [player, setPlayer] = useState(null)
  const [currentIsland, setCurrentIsland] = useState(null)
  const [map, setMap] = useState(null)
  const [buildings, setBuildings] = useState([])
  const [npcs, setNpcs] = useState([])
  const [monsters, setMonsters] = useState([])
  const [otherPlayers, setOtherPlayers] = useState([])
  const [combatLog, setCombatLog] = useState([])
  const [floatingTexts, setFloatingTexts] = useState([])
  const [notification, setNotification] = useState(null)
  const [isDead, setIsDead] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [nearbyNpc, setNearbyNpc] = useState(null)
  const [onlinePlayers, setOnlinePlayers] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [inspectData, setInspectData] = useState(null)
  const [serverStats, setServerStats] = useState(null)
  const [connectionState, setConnectionState] = useState('connecting') // connecting | connected | disconnected | kicked
  const [kickReason, setKickReason] = useState(null)
  // UI window toggles
  const [activeInventory, setActiveInventory] = useState(false)
  const [activeQuestLog, setActiveQuestLog] = useState(false)
  const [activeCharacter, setActiveCharacter] = useState(false)
  const [activeMap, setActiveMap] = useState(false)
  const [activeHelp, setActiveHelp] = useState(false)
  const [activeOnline, setActiveOnline] = useState(false)
  const [activeLeaderboard, setActiveLeaderboard] = useState(false)
  const [activeSettings, setActiveSettings] = useState(false)
  // NPC dialog state (client-side only)
  const [activeDialog, setActiveDialog] = useState(null)
  const [activeShop, setActiveShop] = useState(null)
  const [activeQuestDialog, setActiveQuestDialog] = useState(null)
  const [activeTravel, setActiveTravel] = useState(null)
  // Settings (persisted to localStorage)
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('mythral_settings')
      return saved ? JSON.parse(saved) : {
        showDamageNumbers: true, showChat: true, showMinimap: true, autoLoot: true,
        movementMode: 'both', // 'wasd' | 'tap' | 'both'
        compactHud: false, leftHanded: false, joystickSize: 'medium', // mobile comfort
      }
    } catch {
      return { showDamageNumbers: true, showChat: true, showMinimap: true, autoLoot: true, movementMode: 'both', compactHud: false, leftHanded: false, joystickSize: 'medium' }
    }
  })
  const [isMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (window.matchMedia?.('(pointer: coarse)')?.matches ?? false)
  })
  const [pathTarget, setPathTarget] = useState(null) // {x, y} for visual marker
  const [particles, setParticles] = useState([])
  const [screenEffect, setScreenEffect] = useState(null) // 'damage' | 'heal' | 'levelup' | null
  const particlesRef = useRef([])

  const socketRef = useRef(null)
  const characterIdRef = useRef(null)
  const playerRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const pathQueueRef = useRef([])        // queued {dx, dy} steps for tap-to-move
  const pathTimerRef = useRef(null)      // interval that drains the path queue
  const currentPathTargetRef = useRef(null) // {x, y} of the current path target

  const notify = useCallback((msg, duration = 3500) => {
    const id = Date.now() + Math.random()
    setNotification({ msg, id, leaving: false })
    if (duration > 0) {
      setTimeout(() => setNotification(prev => prev && prev.id === id ? { ...prev, leaving: true } : null), duration - 300)
      setTimeout(() => setNotification(prev => prev && prev.id === id ? null : prev), duration)
    }
  }, [])

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => {
      const merged = { ...prev, ...newSettings }
      localStorage.setItem('mythral_settings', JSON.stringify(merged))
      return merged
    })
  }, [])

  // ---- Particle effects ----
  const spawnParticles = useCallback((x, y, type) => {
    const EFFECTS = {
      hit: { count: 8, duration: 600, colors: ['#fbbf24', '#fde047', '#fb7185'], size: 4, distance: 30 },
      crit: { count: 16, duration: 800, colors: ['#fbbf24', '#fde047', '#fff', '#fb7185'], size: 6, distance: 50 },
      heal: { count: 10, duration: 1000, colors: ['#4ade80', '#86efac', '#bbf7d0'], size: 4, distance: 20, rise: true },
      xp: { count: 6, duration: 900, colors: ['#22d3ee', '#67e8f9'], size: 3, distance: 10, rise: true },
      levelup: { count: 24, duration: 1500, colors: ['#fde047', '#fbbf24', '#fff', '#a78bfa', '#22d3ee'], size: 6, distance: 80 },
      death: { count: 12, duration: 1200, colors: ['#7f1d1d', '#dc2626', '#1f2937'], size: 5, distance: 40, fall: true },
      loot: { count: 8, duration: 700, colors: ['#fbbf24', '#fde047'], size: 4, distance: 25, rise: true },
    }
    const config = EFFECTS[type]
    if (!config) return
    const baseId = Date.now() + Math.random()
    const newParticles = []
    for (let i = 0; i < config.count; i++) {
      const angle = (i / config.count) * Math.PI * 2 + Math.random() * 0.5
      const dist = config.distance * (0.7 + Math.random() * 0.6)
      newParticles.push({
        id: `${baseId}-${i}`,
        x, y,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        color: config.colors[i % config.colors.length],
        size: config.size,
        duration: config.duration,
        rise: config.rise,
        fall: config.fall,
        delay: Math.random() * 100,
      })
    }
    setParticles(prev => [...prev, ...newParticles])
    // Cleanup
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.includes(p)))
    }, config.duration + 200)
  }, [])

  const triggerScreenEffect = useCallback((type) => {
    setScreenEffect({ type, id: Date.now() })
    setTimeout(() => setScreenEffect(null), type === 'levelup' ? 1000 : 600)
  }, [])

  // ---- Connect to server ----
  useEffect(() => {
    const sock = io(SERVER_URL, {
      auth: { token: token || null },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
    socketRef.current = sock

    sock.on('connect', () => {
      setConnectionState('connected')
      setKickReason(null)
      if (token) {
        setScreen('char_select')
        sock.emit(CLIENT_EVENTS.CHARACTER_LIST)
      } else {
        setScreen('auth')
      }
    })
    sock.on('connect_error', (err) => {
      const msg = err?.message || 'Connection failed'
      if (msg === 'Invalid token' || msg === 'No token provided') {
        localStorage.removeItem('mythral_token')
        setToken(null)
        setScreen('auth')
        setConnectionState('disconnected')
        // Stop the reconnect loop — reconnecting without a valid token is pointless
        sock.disconnect()
        return
      }
      notify(`Connection error: ${msg}`)
      setConnectionState('disconnected')
      setScreen('auth')
    })
    sock.on('reconnect_error', (err) => {
      notify(`Reconnect failed: ${err?.message || 'unknown error'}`)
    })
    sock.on('reconnect_failed', () => {
      notify('Cannot reach server. Check your connection.')
      setConnectionState('disconnected')
    })
    sock.on('disconnect', (reason) => {
      setConnectionState('disconnected')
      // Clear pathfinding on disconnect
      if (pathTimerRef.current) {
        clearInterval(pathTimerRef.current)
        pathTimerRef.current = null
      }
      pathQueueRef.current = []
      setPathTarget(null)
      if (reason === 'io server disconnect') {
        // server kicked us — socket.io won't auto-reconnect; show kick screen
      }
    })
    sock.on('reconnect', () => {
      setConnectionState('connected')
      notify('Reconnected to server.')
      // Re-select character if we were in-game
      if (characterIdRef.current) {
        sock.emit(CLIENT_EVENTS.CHARACTER_SELECT, { characterId: characterIdRef.current })
      } else {
        sock.emit(CLIENT_EVENTS.CHARACTER_LIST)
      }
    })
    sock.on('reconnect_attempt', (attempt) => {
      setConnectionState('connecting')
    })

    // ---- Auth events ----
    sock.on(SERVER_EVENTS.WELCOME, ({ username: u }) => setUsername(u))
    sock.on(SERVER_EVENTS.AUTH_OK, ({ token: t, username: u }) => {
      localStorage.setItem('mythral_token', t)
      setToken(t)
      setUsername(u)
      setScreen('char_select')
      sock.emit(CLIENT_EVENTS.CHARACTER_LIST)
    })
    sock.on(SERVER_EVENTS.AUTH_ERROR, ({ error }) => setAuthError(error))
    sock.on(SERVER_EVENTS.CHARACTER_LIST, ({ characters, maxCharacters: mc }) => {
      setCharacters(characters)
      if (mc) setMaxCharacters(mc)
      setScreen('char_select')
    })
    sock.on(SERVER_EVENTS.CHARACTER_CREATED, () => {
      sock.emit(CLIENT_EVENTS.CHARACTER_LIST)
      notify('Character created!')
    })
    sock.on(SERVER_EVENTS.CHARACTER_DELETED, ({ id }) => {
      setCharacters(prev => prev.filter(c => c.id !== id))
      notify('Character deleted.')
    })

    // ---- In-game events ----
    sock.on(SERVER_EVENTS.STATE_SYNC, (data) => {
      setMap(data.map)
      setNpcs(data.npcs || [])
      setBuildings(data.buildings || [])
      setMonsters(data.monsters || [])
      setOtherPlayers((data.otherPlayers || []).map(p => ({ ...p, isSelf: false })))
      setCurrentIsland(data.islandDef)
      setPlayer(data.player)
      setIsDead(data.player.hp <= 0)
      setChatMessages([])  // reset chat on island change
      setScreen('game')
    })

    sock.on(SERVER_EVENTS.PLAYER_UPDATE, (updated) => {
      setPlayer(prev => {
        if (!prev) return updated
        if (updated.onlyFacing) {
          return { ...prev, facing: updated.facing }
        }
        return { ...prev, ...updated }
      })
    })

    sock.on(SERVER_EVENTS.MONSTER_SPAWN, (m) => {
      setMonsters(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m])
    })
    sock.on(SERVER_EVENTS.MONSTER_UPDATE, (updates) => {
      const arr = Array.isArray(updates) ? updates : [updates]
      setMonsters(prev => prev.map(m => {
        const u = arr.find(x => x.id === m.id)
        return u ? { ...m, ...u } : m
      }))
    })
    sock.on(SERVER_EVENTS.MONSTER_DESPAWN, ({ id }) => {
      setMonsters(prev => prev.filter(m => m.id !== id))
    })

    sock.on(SERVER_EVENTS.PLAYER_JOINED, (p) => {
      setOtherPlayers(prev => prev.some(x => x.id === p.id) ? prev : [...prev, { ...p, isSelf: false }])
    })
    sock.on(SERVER_EVENTS.PLAYER_LEFT, ({ id }) => {
      setOtherPlayers(prev => prev.filter(p => p.id !== id))
    })
    sock.on(SERVER_EVENTS.PLAYER_MOVED, (p) => {
      setOtherPlayers(prev => prev.map(o => o.id === p.id ? { ...o, ...p, isSelf: false } : o))
    })
    sock.on(SERVER_EVENTS.PLAYER_HP_UPDATE, (p) => {
      setOtherPlayers(prev => prev.map(o => o.id === p.id ? { ...o, ...p, isSelf: false } : o))
    })

    sock.on(SERVER_EVENTS.FLOATING_TEXT, (fx) => {
      const id = Date.now() + Math.random()
      setFloatingTexts(prev => [...prev, { ...fx, id, startTime: Date.now() }])
      setTimeout(() => setFloatingTexts(prev => prev.filter(f => f.id !== id)), 1200)
      // Spawn particles based on effect kind
      if (fx.kind === 'damage') {
        spawnParticles(fx.x, fx.y, fx.text.includes('!') ? 'crit' : 'hit')
      } else if (fx.kind === 'heal') {
        spawnParticles(fx.x, fx.y, 'heal')
        triggerScreenEffect('heal')
      } else if (fx.kind === 'xp') {
        spawnParticles(fx.x, fx.y, 'xp')
      } else if (fx.kind === 'levelup') {
        spawnParticles(fx.x, fx.y, 'levelup')
        triggerScreenEffect('levelup')
      }
    })
    sock.on(SERVER_EVENTS.COMBAT_LOG, (entry) => {
      setCombatLog(prev => [...prev.slice(-30), { ...entry, id: Date.now() + Math.random() }])
    })
    sock.on(SERVER_EVENTS.NOTIFICATION, ({ msg }) => notify(msg))
    sock.on(SERVER_EVENTS.DEATH, ({ goldLost }) => {
      setIsDead(true)
      notify(`You died! Lost ${goldLost} gold.`)
      if (playerRef.current) {
        spawnParticles(playerRef.current.x, playerRef.current.y, 'death')
      }
      triggerScreenEffect('damage')
    })
    sock.on(SERVER_EVENTS.RESPAWN, (updatedPlayer) => {
      setIsDead(false)
      setPlayer(updatedPlayer)
    })
    sock.on(SERVER_EVENTS.LEVEL_UP, ({ level }) => {
      notify(`Level Up! Now level ${level}!`, 5000)
      triggerScreenEffect('levelup')
    })

    sock.on(SERVER_EVENTS.NEARBY_NPC, ({ npc }) => setNearbyNpc(npc))
    sock.on(SERVER_EVENTS.CHAT, (msg) => {
      setChatMessages(prev => [...prev.slice(-50), { ...msg, id: Date.now() + Math.random() }])
    })

    sock.on(SERVER_EVENTS.ONLINE_PLAYERS, ({ players }) => setOnlinePlayers(players))
    sock.on(SERVER_EVENTS.PLAYER_INSPECT, (data) => setInspectData(data))
    sock.on(SERVER_EVENTS.LEADERBOARD, ({ leaderboard }) => setLeaderboard(leaderboard))
    sock.on(SERVER_EVENTS.STATS, (stats) => setServerStats(stats))

    sock.on(SERVER_EVENTS.KICK, ({ reason }) => {
      setKickReason(reason)
      setConnectionState('kicked')
      setScreen('char_select')
      setPlayer(null)
      setMap(null)
      setMonsters([])
      setOtherPlayers([])
      characterIdRef.current = null
      notify(`Kicked: ${reason}`, 8000)
    })

    sock.on(SERVER_EVENTS.ERROR, ({ message }) => notify(message))

    return () => {
      sock.disconnect()
      socketRef.current = null
    }
  }, [token, notify])

  // Keep refs in sync directly (no useEffect needed — runs every render)
  playerRef.current = player

  // ---- Auth actions ----
  const register = useCallback(async (uname, password) => {
    setAuthError(null)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const r = await fetch(`${SERVER_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname, password }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await r.json()
      if (data.ok) {
        localStorage.setItem('mythral_token', data.token)
        setToken(data.token)
        setUsername(data.username)
        setScreen('char_select')
        socketRef.current?.emit(CLIENT_EVENTS.CHARACTER_LIST)
      } else {
        setAuthError(data.error || 'Registration failed')
      }
    } catch (e) {
      if (e.name === 'AbortError') setAuthError('Request timed out. Check your connection.')
      else setAuthError('Network error. Is the server running?')
    }
  }, [])

  const login = useCallback(async (uname, password) => {
    setAuthError(null)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const r = await fetch(`${SERVER_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname, password }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await r.json()
      if (data.ok) {
        localStorage.setItem('mythral_token', data.token)
        setToken(data.token)
        setUsername(data.username)
        setScreen('char_select')
        socketRef.current?.emit(CLIENT_EVENTS.CHARACTER_LIST)
      } else {
        setAuthError(data.error || 'Login failed')
      }
    } catch (e) {
      if (e.name === 'AbortError') setAuthError('Request timed out. Check your connection.')
      else setAuthError('Network error. Is the server running?')
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('mythral_token')
    setToken(null)
    setUsername(null)
    setCharacters([])
    setPlayer(null)
    characterIdRef.current = null
    setScreen('auth')
    socketRef.current?.disconnect()
  }, [])

  // ---- Character actions ----
  const createCharacter = useCallback((name, classId, gender = 'male') => {
    socketRef.current?.emit(CLIENT_EVENTS.CHARACTER_CREATE, { name, classId, gender })
  }, [])

  const selectCharacter = useCallback((characterId) => {
    characterIdRef.current = characterId
    socketRef.current?.emit(CLIENT_EVENTS.CHARACTER_SELECT, { characterId })
  }, [])

  const deleteCharacter = useCallback((characterId) => {
    socketRef.current?.emit(CLIENT_EVENTS.CHARACTER_DELETE, { characterId })
  }, [])

  // ---- In-game actions ----
  const sendMove = useCallback((dx, dy) => {
    // Cancel any active path when manual movement is used
    if (pathQueueRef.current.length > 0 || pathTimerRef.current) {
      if (pathTimerRef.current) {
        clearInterval(pathTimerRef.current)
        pathTimerRef.current = null
      }
      pathQueueRef.current = []
      currentPathTargetRef.current = null
      setPathTarget(null)
    }
    socketRef.current?.emit(CLIENT_EVENTS.MOVE, { dx, dy })
  }, [])

  // Tap-to-move: compute path and queue steps
  // Use refs for map/player so the callback is stable and always reads fresh data
  const mapRef = useRef(null)
  mapRef.current = map
  const sendMoveTo = useCallback((targetX, targetY) => {
    const curMap = mapRef.current
    const curPlayer = playerRef.current
    if (!curMap || !curPlayer) return
    // Cancel any existing path
    if (pathTimerRef.current) {
      clearInterval(pathTimerRef.current)
      pathTimerRef.current = null
    }
    const path = findPath(curMap, curPlayer.x, curPlayer.y, targetX, targetY)
    if (!path || path.length === 0) {
      notify('Cannot reach that location.')
      setPathTarget(null)
      return
    }
    pathQueueRef.current = path
    currentPathTargetRef.current = { x: targetX, y: targetY }
    setPathTarget({ x: targetX, y: targetY })
    // Drain the queue at a steady pace
    const stepDelay = 160
    pathTimerRef.current = setInterval(() => {
      const sock = socketRef.current
      if (!sock || !sock.connected) {
        clearInterval(pathTimerRef.current)
        pathTimerRef.current = null
        pathQueueRef.current = []
        setPathTarget(null)
        return
      }
      const step = pathQueueRef.current.shift()
      if (!step) {
        clearInterval(pathTimerRef.current)
        pathTimerRef.current = null
        currentPathTargetRef.current = null
        setPathTarget(null)
        return
      }
      sock.emit(CLIENT_EVENTS.MOVE, step)
    }, stepDelay)
  }, [notify])

  const stopMoveTo = useCallback(() => {
    if (pathTimerRef.current) {
      clearInterval(pathTimerRef.current)
      pathTimerRef.current = null
    }
    pathQueueRef.current = []
    currentPathTargetRef.current = null
    setPathTarget(null)
  }, [])

  const isMoving = useCallback(() => pathQueueRef.current.length > 0, [])

  const sendAttack = useCallback((monsterId) => {
    // Cancel pathing when attacking
    stopMoveTo()
    socketRef.current?.emit(CLIENT_EVENTS.ATTACK, { monsterId })
  }, [stopMoveTo])
  const sendSkill = useCallback((skillId, targetMonsterId) => {
    stopMoveTo()
    socketRef.current?.emit(CLIENT_EVENTS.SKILL, { skillId, targetMonsterId })
  }, [stopMoveTo])
  const sendUseItem = useCallback((itemId) => socketRef.current?.emit(CLIENT_EVENTS.USE_ITEM, { itemId }), [])
  const sendEquipItem = useCallback((itemId) => socketRef.current?.emit(CLIENT_EVENTS.EQUIP_ITEM, { itemId }), [])
  const sendUnequipItem = useCallback((slot) => socketRef.current?.emit(CLIENT_EVENTS.UNEQUIP_ITEM, { slot }), [])
  const sendBuyItem = useCallback((npcId, itemId, qty) => socketRef.current?.emit(CLIENT_EVENTS.BUY_ITEM, { npcId, itemId, qty }), [])
  const sendSellItem = useCallback((itemId, qty) => socketRef.current?.emit(CLIENT_EVENTS.SELL_ITEM, { itemId, qty }), [])
  const sendAcceptQuest = useCallback((questId) => socketRef.current?.emit(CLIENT_EVENTS.ACCEPT_QUEST, { questId }), [])
  const sendTurnInQuest = useCallback((questId) => socketRef.current?.emit(CLIENT_EVENTS.TURN_IN_QUEST, { questId }), [])
  const sendTravel = useCallback((islandId) => socketRef.current?.emit(CLIENT_EVENTS.TRAVEL, { islandId }), [])
  const sendRespawn = useCallback(() => socketRef.current?.emit(CLIENT_EVENTS.RESPAWN), [])
  const sendChat = useCallback((message) => socketRef.current?.emit(CLIENT_EVENTS.CHAT, { message }), [])
  const requestOnlinePlayers = useCallback(() => socketRef.current?.emit(CLIENT_EVENTS.REQUEST_ONLINE), [])
  const inspectPlayer = useCallback((playerId) => socketRef.current?.emit(CLIENT_EVENTS.INSPECT_PLAYER, { playerId }), [])
  const requestLeaderboard = useCallback(() => socketRef.current?.emit(CLIENT_EVENTS.REQUEST_LEADERBOARD), [])

  const quitToMenu = useCallback(() => {
    setPlayer(null)
    setMap(null)
    setMonsters([])
    setOtherPlayers([])
    setOnlinePlayers([])
    characterIdRef.current = null
    setActiveInventory(false); setActiveQuestLog(false); setActiveCharacter(false)
    setActiveMap(false); setActiveHelp(false); setActiveOnline(false)
    setActiveLeaderboard(false); setActiveSettings(false)
    setActiveDialog(null); setActiveShop(null); setActiveQuestDialog(null); setActiveTravel(null)
    setNearbyNpc(null)
    setScreen('char_select')
    socketRef.current?.emit(CLIENT_EVENTS.CHARACTER_LIST)
  }, [])

  // ---- Periodic request for online players while in-game ----
  useEffect(() => {
    if (screen !== 'game') return
    requestOnlinePlayers()
    const interval = setInterval(() => requestOnlinePlayers(), 10000)
    return () => clearInterval(interval)
  }, [screen, requestOnlinePlayers])

  return {
    // connection
    connectionState, kickReason,
    // auth
    screen, authError, username, characters, maxCharacters, token,
    // game state
    player, currentIsland, map, npcs, monsters, otherPlayers, buildings,
    combatLog, floatingTexts, notification, isDead, chatMessages, nearbyNpc,
    onlinePlayers, leaderboard, inspectData, serverStats,
    // UI toggles
    activeInventory, activeQuestLog, activeCharacter, activeMap, activeHelp,
    activeOnline, activeLeaderboard, activeSettings,
    activeDialog, activeShop, activeQuestDialog, activeTravel,
    setActiveInventory, setActiveQuestLog, setActiveCharacter, setActiveMap, setActiveHelp,
    setActiveOnline, setActiveLeaderboard, setActiveSettings,
    setActiveDialog, setActiveShop, setActiveQuestDialog, setActiveTravel,
    setNearbyNpc, setInspectData,
    // settings + mobile
    settings, updateSettings, isMobile, pathTarget,
    // particles + screen effects
    particles, screenEffect, spawnParticles, triggerScreenEffect,
    // actions
    register, login, logout,
    createCharacter, selectCharacter, deleteCharacter,
    sendMove, sendMoveTo, stopMoveTo, isMoving,
    sendAttack, sendSkill, sendUseItem, sendEquipItem, sendUnequipItem,
    sendBuyItem, sendSellItem, sendAcceptQuest, sendTurnInQuest, sendTravel, sendRespawn, sendChat,
    requestOnlinePlayers, inspectPlayer, requestLeaderboard,
    quitToMenu, notify,
    socketRef,
  }
}
