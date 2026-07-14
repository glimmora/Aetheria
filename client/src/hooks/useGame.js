// ============================================================
// Aetheria Client - Networking hook
// Manages socket.io connection, auth, and game state received
// from the server. The server is authoritative; the client only
// sends inputs and renders the state it receives.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { SERVER_EVENTS, CLIENT_EVENTS, CONFIG } from '../../../shared/protocol.js'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:4000' : '')

export function useGame() {
  const [screen, setScreen] = useState('connecting') // connecting | auth | char_select | game
  const [authError, setAuthError] = useState(null)
  const [username, setUsername] = useState(null)
  const [characters, setCharacters] = useState([])
  const [maxCharacters, setMaxCharacters] = useState(CONFIG.MAX_CHARACTERS_PER_ACCOUNT)
  const [token, setToken] = useState(() => localStorage.getItem('aetheria_token'))
  const [player, setPlayer] = useState(null)
  const [currentIsland, setCurrentIsland] = useState(null)
  const [map, setMap] = useState(null)
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
      const saved = localStorage.getItem('aetheria_settings')
      return saved ? JSON.parse(saved) : { showDamageNumbers: true, showChat: true, showMinimap: true, autoLoot: true }
    } catch {
      return { showDamageNumbers: true, showChat: true, showMinimap: true, autoLoot: true }
    }
  })

  const socketRef = useRef(null)
  const characterIdRef = useRef(null)
  const reconnectTimerRef = useRef(null)

  const notify = useCallback((msg, duration = 3500) => {
    setNotification({ msg, id: Date.now() + Math.random(), leaving: false })
    if (duration > 0) {
      // Start fade-out 300ms before removal
      setTimeout(() => setNotification(prev => prev ? { ...prev, leaving: true } : null), duration - 300)
      setTimeout(() => setNotification(null), duration)
    }
  }, [])

  const updateSettings = useCallback((newSettings) => {
    const merged = { ...settings, ...newSettings }
    setSettings(merged)
    localStorage.setItem('aetheria_settings', JSON.stringify(merged))
  }, [settings])

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
      if (err.message === 'Invalid token' || err.message === 'No token provided') {
        localStorage.removeItem('aetheria_token')
        setToken(null)
        setScreen('auth')
        setConnectionState('disconnected')
      }
    })
    sock.on('disconnect', (reason) => {
      setConnectionState('disconnected')
      if (reason === 'io server disconnect') {
        // server kicked us — don't auto-reconnect
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
      localStorage.setItem('aetheria_token', t)
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
    })
    sock.on(SERVER_EVENTS.COMBAT_LOG, (entry) => {
      setCombatLog(prev => [...prev.slice(-30), { ...entry, id: Date.now() + Math.random() }])
    })
    sock.on(SERVER_EVENTS.NOTIFICATION, ({ msg }) => notify(msg))
    sock.on(SERVER_EVENTS.DEATH, ({ goldLost }) => {
      setIsDead(true)
      notify(`You died! Lost ${goldLost} gold.`)
    })
    sock.on(SERVER_EVENTS.RESPAWN, (updatedPlayer) => {
      setIsDead(false)
      setPlayer(updatedPlayer)
    })
    sock.on(SERVER_EVENTS.LEVEL_UP, ({ level }) => {
      notify(`Level Up! Now level ${level}!`, 5000)
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

  // ---- Auth actions ----
  const register = useCallback((uname, password) => {
    setAuthError(null)
    fetch(`${SERVER_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: uname, password }),
    }).then(r => r.json()).then(data => {
      if (data.ok) {
        localStorage.setItem('aetheria_token', data.token)
        setToken(data.token)
        setUsername(data.username)
        setScreen('char_select')
        socketRef.current?.emit(CLIENT_EVENTS.CHARACTER_LIST)
      } else {
        setAuthError(data.error)
      }
    }).catch(e => setAuthError(e.message || 'Network error'))
  }, [])

  const login = useCallback((uname, password) => {
    setAuthError(null)
    fetch(`${SERVER_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: uname, password }),
    }).then(r => r.json()).then(data => {
      if (data.ok) {
        localStorage.setItem('aetheria_token', data.token)
        setToken(data.token)
        setUsername(data.username)
        setScreen('char_select')
        socketRef.current?.emit(CLIENT_EVENTS.CHARACTER_LIST)
      } else {
        setAuthError(data.error)
      }
    }).catch(e => setAuthError(e.message || 'Network error'))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('aetheria_token')
    setToken(null)
    setUsername(null)
    setCharacters([])
    setPlayer(null)
    characterIdRef.current = null
    setScreen('auth')
    socketRef.current?.disconnect()
  }, [])

  // ---- Character actions ----
  const createCharacter = useCallback((name, classId) => {
    socketRef.current?.emit(CLIENT_EVENTS.CHARACTER_CREATE, { name, classId })
  }, [])

  const selectCharacter = useCallback((characterId) => {
    characterIdRef.current = characterId
    socketRef.current?.emit(CLIENT_EVENTS.CHARACTER_SELECT, { characterId })
  }, [])

  const deleteCharacter = useCallback((characterId) => {
    socketRef.current?.emit(CLIENT_EVENTS.CHARACTER_DELETE, { characterId })
  }, [])

  // ---- In-game actions ----
  const sendMove = useCallback((dx, dy) => socketRef.current?.emit(CLIENT_EVENTS.MOVE, { dx, dy }), [])
  const sendAttack = useCallback((monsterId) => socketRef.current?.emit(CLIENT_EVENTS.ATTACK, { monsterId }), [])
  const sendSkill = useCallback((skillId, targetMonsterId) => socketRef.current?.emit(CLIENT_EVENTS.SKILL, { skillId, targetMonsterId }), [])
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
    player, currentIsland, map, npcs, monsters, otherPlayers,
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
    // settings
    settings, updateSettings,
    // actions
    register, login, logout,
    createCharacter, selectCharacter, deleteCharacter,
    sendMove, sendAttack, sendSkill, sendUseItem, sendEquipItem, sendUnequipItem,
    sendBuyItem, sendSellItem, sendAcceptQuest, sendTurnInQuest, sendTravel, sendRespawn, sendChat,
    requestOnlinePlayers, inspectPlayer, requestLeaderboard,
    quitToMenu, notify,
    socketRef,
  }
}
