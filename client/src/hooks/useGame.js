// ============================================================
// Aetheria Client - Networking hook
// Manages socket.io connection, auth, and game state received
// from the server. The server is authoritative; the client only
// sends inputs and renders the state it receives.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { SERVER_EVENTS, CLIENT_EVENTS } from '../../../shared/protocol.js'
import { CLASSES } from '../../../shared/classes.js'
import { getItem } from '../../../shared/items.js'
import { ISLAND_DEFS } from '../../../shared/islands.js'
import { QUESTS } from '../../../shared/quests.js'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:4000' : '')

export function useGame() {
  const [screen, setScreen] = useState('connecting') // connecting | auth | char_select | char_create | game
  const [authError, setAuthError] = useState(null)
  const [username, setUsername] = useState(null)
  const [characters, setCharacters] = useState([])
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
  // UI window toggles
  const [activeInventory, setActiveInventory] = useState(false)
  const [activeQuestLog, setActiveQuestLog] = useState(false)
  const [activeCharacter, setActiveCharacter] = useState(false)
  const [activeMap, setActiveMap] = useState(false)
  const [activeHelp, setActiveHelp] = useState(false)
  // NPC dialog state (client-side only — dialog text doesn't need server sync)
  const [activeDialog, setActiveDialog] = useState(null)
  const [activeShop, setActiveShop] = useState(null)
  const [activeQuestDialog, setActiveQuestDialog] = useState(null)
  const [activeTravel, setActiveTravel] = useState(null)

  const socketRef = useRef(null)

  // ---- Connect to server ----
  useEffect(() => {
    const sock = io(SERVER_URL, {
      auth: { token: token || null },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    })
    socketRef.current = sock

    sock.on('connect', () => {
      setScreen(token ? 'char_select' : 'auth')
      if (token) sock.emit(CLIENT_EVENTS.CHARACTER_LIST)
    })
    sock.on('connect_error', (err) => {
      if (err.message === 'Invalid token' || err.message === 'No token provided') {
        localStorage.removeItem('aetheria_token')
        setToken(null)
        setScreen('auth')
      }
    })
    sock.on('disconnect', () => {
      setScreen('connecting')
    })

    sock.on(SERVER_EVENTS.WELCOME, ({ username: u }) => setUsername(u))
    sock.on(SERVER_EVENTS.AUTH_OK, ({ token: t, username: u }) => {
      localStorage.setItem('aetheria_token', t)
      setToken(t)
      setUsername(u)
      setScreen('char_select')
      sock.emit(CLIENT_EVENTS.CHARACTER_LIST)
    })
    sock.on(SERVER_EVENTS.AUTH_ERROR, ({ error }) => setAuthError(error))
    sock.on(SERVER_EVENTS.CHARACTER_LIST, ({ characters }) => {
      setCharacters(characters)
      setScreen('char_select')
    })
    sock.on(SERVER_EVENTS.CHARACTER_CREATED, () => {
      sock.emit(CLIENT_EVENTS.CHARACTER_LIST)
    })
    sock.on(SERVER_EVENTS.CHARACTER_DELETED, ({ id }) => {
      setCharacters(prev => prev.filter(c => c.id !== id))
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
      setScreen('game')
    })

    sock.on(SERVER_EVENTS.PLAYER_UPDATE, (updated) => {
      setPlayer(prev => {
        if (!prev) return updated
        // sometimes update only carries partial info (e.g., facing-only)
        if (updated.onlyFacing) {
          return { ...prev, facing: updated.facing }
        }
        return { ...prev, ...updated }
      })
    })

    sock.on(SERVER_EVENTS.MONSTER_SPAWN, (m) => {
      setMonsters(prev => {
        if (prev.some(x => x.id === m.id)) return prev
        return [...prev, m]
      })
    })
    sock.on(SERVER_EVENTS.MONSTER_UPDATE, (updates) => {
      // updates can be a single object or array
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
      setOtherPlayers(prev => {
        if (prev.some(x => x.id === p.id)) return prev
        return [...prev, { ...p, isSelf: false }]
      })
    })
    sock.on(SERVER_EVENTS.PLAYER_LEFT, ({ id }) => {
      setOtherPlayers(prev => prev.filter(p => p.id !== id))
    })
    sock.on(SERVER_EVENTS.PLAYER_MOVED, (p) => {
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
    sock.on(SERVER_EVENTS.NOTIFICATION, ({ msg }) => {
      setNotification({ msg, id: Date.now() + Math.random() })
      setTimeout(() => setNotification(null), 3500)
    })
    sock.on(SERVER_EVENTS.DEATH, ({ goldLost }) => {
      setIsDead(true)
      setNotification({ msg: `You died! Lost ${goldLost} gold.`, id: Date.now() + Math.random() })
      setTimeout(() => setNotification(null), 3500)
    })
    sock.on(SERVER_EVENTS.RESPAWN, (updatedPlayer) => {
      setIsDead(false)
      setPlayer(updatedPlayer)
    })
    sock.on(SERVER_EVENTS.LEVEL_UP, ({ level }) => {
      setNotification({ msg: `Level Up! Now level ${level}!`, id: Date.now() + Math.random() })
      setTimeout(() => setNotification(null), 3500)
    })

    sock.on('npc:nearby', ({ npc }) => {
      setNearbyNpc(npc)
    })

    sock.on('chat', (msg) => {
      setChatMessages(prev => [...prev.slice(-30), { ...msg, id: Date.now() + Math.random() }])
    })

    sock.on(SERVER_EVENTS.ERROR, ({ message }) => {
      setNotification({ msg: message, id: Date.now() + Math.random() })
      setTimeout(() => setNotification(null), 3500)
    })

    return () => {
      sock.disconnect()
      socketRef.current = null
    }
  }, [token])

  // ---- Auth actions ----
  const register = useCallback((username, password) => {
    setAuthError(null)
    fetch(`${SERVER_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
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
    }).catch(e => setAuthError(e.message))
  }, [])

  const login = useCallback((username, password) => {
    setAuthError(null)
    fetch(`${SERVER_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
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
    }).catch(e => setAuthError(e.message))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('aetheria_token')
    setToken(null)
    setUsername(null)
    setCharacters([])
    setPlayer(null)
    setScreen('auth')
    socketRef.current?.disconnect()
  }, [])

  // ---- Character actions ----
  const createCharacter = useCallback((name, classId) => {
    socketRef.current?.emit(CLIENT_EVENTS.CHARACTER_CREATE, { name, classId })
  }, [])

  const selectCharacter = useCallback((characterId) => {
    socketRef.current?.emit(CLIENT_EVENTS.CHARACTER_SELECT, { characterId })
  }, [])

  const deleteCharacter = useCallback((characterId) => {
    socketRef.current?.emit(CLIENT_EVENTS.CHARACTER_DELETE, { characterId })
  }, [])

  // ---- In-game actions ----
  const sendMove = useCallback((dx, dy) => {
    socketRef.current?.emit(CLIENT_EVENTS.MOVE, { dx, dy })
  }, [])
  const sendAttack = useCallback((monsterId) => {
    socketRef.current?.emit(CLIENT_EVENTS.ATTACK, { monsterId })
  }, [])
  const sendSkill = useCallback((skillId, targetMonsterId) => {
    socketRef.current?.emit(CLIENT_EVENTS.SKILL, { skillId, targetMonsterId })
  }, [])
  const sendUseItem = useCallback((itemId) => {
    socketRef.current?.emit(CLIENT_EVENTS.USE_ITEM, { itemId })
  }, [])
  const sendEquipItem = useCallback((itemId) => {
    socketRef.current?.emit(CLIENT_EVENTS.EQUIP_ITEM, { itemId })
  }, [])
  const sendUnequipItem = useCallback((slot) => {
    socketRef.current?.emit(CLIENT_EVENTS.UNEQUIP_ITEM, { slot })
  }, [])
  const sendBuyItem = useCallback((npcId, itemId, qty) => {
    socketRef.current?.emit(CLIENT_EVENTS.BUY_ITEM, { npcId, itemId, qty })
  }, [])
  const sendSellItem = useCallback((itemId, qty) => {
    socketRef.current?.emit(CLIENT_EVENTS.SELL_ITEM, { itemId, qty })
  }, [])
  const sendAcceptQuest = useCallback((questId) => {
    socketRef.current?.emit(CLIENT_EVENTS.ACCEPT_QUEST, { questId })
  }, [])
  const sendTurnInQuest = useCallback((questId) => {
    socketRef.current?.emit(CLIENT_EVENTS.TURN_IN_QUEST, { questId })
  }, [])
  const sendTravel = useCallback((islandId) => {
    socketRef.current?.emit(CLIENT_EVENTS.TRAVEL, { islandId })
  }, [])
  const sendRespawn = useCallback(() => {
    socketRef.current?.emit(CLIENT_EVENTS.RESPAWN)
  }, [])
  const sendChat = useCallback((message) => {
    socketRef.current?.emit(CLIENT_EVENTS.CHAT, { message })
  }, [])
  const quitToMenu = useCallback(() => {
    setPlayer(null)
    setMap(null)
    setMonsters([])
    setOtherPlayers([])
    setScreen('char_select')
    socketRef.current?.emit(CLIENT_EVENTS.CHARACTER_LIST)
  }, [])

  return {
    // state
    screen, authError, username, characters,
    player, currentIsland, map, npcs, monsters, otherPlayers,
    combatLog, floatingTexts, notification, isDead, chatMessages, nearbyNpc,
    activeInventory, activeQuestLog, activeCharacter, activeMap, activeHelp,
    activeDialog, activeShop, activeQuestDialog, activeTravel,
    // setters
    setActiveInventory, setActiveQuestLog, setActiveCharacter, setActiveMap, setActiveHelp,
    setActiveDialog, setActiveShop, setActiveQuestDialog, setActiveTravel,
    setNearbyNpc,
    // actions
    register, login, logout,
    createCharacter, selectCharacter, deleteCharacter,
    sendMove, sendAttack, sendSkill, sendUseItem, sendEquipItem, sendUnequipItem,
    sendBuyItem, sendSellItem, sendAcceptQuest, sendTurnInQuest, sendTravel, sendRespawn, sendChat,
    quitToMenu,
    socketRef,
  }
}
