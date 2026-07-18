// ============================================================
// Mythral - Shared protocol
// Event names and message shapes used by both client and server
// ============================================================

export const SERVER_EVENTS = {
  // Server → Client
  STATE_SYNC: 'state:sync',          // Full snapshot of player's current island state
  PLAYER_UPDATE: 'player:update',    // Update to player's own state (hp, mp, gold, xp, level, inventory, equipment, questProgress)
  MONSTER_SPAWN: 'monster:spawn',    // A new monster appeared
  MONSTER_UPDATE: 'monster:update',  // Monster state changed (position, hp)
  MONSTER_DESPAWN: 'monster:despawn',// Monster disappeared (killed or respawn-timer expired)
  PLAYER_JOINED: 'player:joined',    // Another player entered the island
  PLAYER_LEFT: 'player:left',        // Another player left the island
  PLAYER_MOVED: 'player:moved',      // Another player moved
  PLAYER_HP_UPDATE: 'player:hp',     // Another player's HP changed (visible HP bar)
  FLOATING_TEXT: 'fx:floating',      // Floating combat text to display
  COMBAT_LOG: 'log:combat',          // Combat log entry
  NOTIFICATION: 'notify',            // Toast notification
  DEATH: 'player:death',             // Player died
  RESPAWN: 'player:respawn',         // Player respawned
  LEVEL_UP: 'player:levelup',        // Player leveled up
  AUTH_OK: 'auth:ok',                // Login/register success
  AUTH_ERROR: 'auth:error',          // Login/register failure
  CHARACTER_LIST: 'character:list',  // List of player's characters
  CHARACTER_CREATED: 'character:created',
  CHARACTER_DELETED: 'character:deleted',
  ERROR: 'error',                    // Generic error
  WELCOME: 'welcome',                // Server greeting on connect
  ONLINE_PLAYERS: 'online:players',  // List of online players (island + global)
  PLAYER_INSPECT: 'player:inspect',  // Detailed info about another player
  LEADERBOARD: 'leaderboard',        // Top players by level
  KICK: 'kick',                      // Server kicked the client (e.g., duplicate login)
  NEARBY_NPC: 'npc:nearby',          // NPC walked into
  CHAT: 'chat',                      // Chat message
  STATS: 'server:stats',             // Server statistics
}

export const CLIENT_EVENTS = {
  // Client → Server
  AUTH_LOGIN: 'auth:login',
  AUTH_REGISTER: 'auth:register',
  AUTH_LOGOUT: 'auth:logout',
  CHARACTER_LIST: 'character:list',
  CHARACTER_CREATE: 'character:create', // { name, classId }
  CHARACTER_SELECT: 'character:select', // { characterId }
  CHARACTER_DELETE: 'character:delete', // { characterId }
  MOVE: 'move',                       // { dx, dy }
  ATTACK: 'attack',                   // { monsterId }
  SKILL: 'skill',                     // { skillId, targetMonsterId? }
  USE_ITEM: 'item:use',               // { itemId }
  EQUIP_ITEM: 'item:equip',           // { itemId }
  UNEQUIP_ITEM: 'item:unequip',       // { slot }
  BUY_ITEM: 'shop:buy',               // { npcId, itemId, qty }
  SELL_ITEM: 'shop:sell',             // { itemId, qty }
  ACCEPT_QUEST: 'quest:accept',       // { questId }
  TURN_IN_QUEST: 'quest:turnin',      // { questId }
  TRAVEL: 'travel',                   // { islandId }
  RESPAWN: 'respawn',
  CHAT: 'chat',                       // { message }
  REQUEST_ONLINE: 'online:request',   // Ask for online players list
  INSPECT_PLAYER: 'player:inspect',   // { playerId } — request another player's details
  REQUEST_LEADERBOARD: 'leaderboard:request',
  DISCONNECT: 'disconnect',
}

export const TICK_RATE_HZ = parseInt(process.env.TICK_RATE_HZ) || 10
export const TICK_INTERVAL_MS = 1000 / TICK_RATE_HZ

// ---- Leveling system ----
// Designed for a ~10-year progression to level 100 at 4 hours/day active play.
// Curve: xpForLevel(n) = XP_CURVE_BASE * XP_CURVE_GROWTH^n
//   - Level 1→2:   ~147 XP       (1-2 kills, minutes)
//   - Level 10→11: ~518 XP       (5 kills, minutes)
//   - Level 20→21: ~2,099 XP     (20 kills, ~30 min)
//   - Level 30→31: ~8,473 XP     (85 kills, ~2 hours)
//   - Level 50→51: ~138,666 XP   (1,400 kills, ~1 week)
//   - Level 70→71: ~2,270,000 XP (22,000 kills, ~2 months)
//   - Level 90→91: ~37,155,000 XP (370,000 kills, ~1 year)
//   - Level 99→100: ~131,584,000 XP (1.3M kills, ~3 years at this level alone)
// Total XP to reach 100: ~875,000,000
// At 1000 XP/min average high-level play = 875,000 min = ~10 years at 4hr/day
export const MAX_LEVEL = parseInt(process.env.MAX_LEVEL) || 100
export const XP_CURVE_BASE = parseFloat(process.env.XP_CURVE_BASE) || 128
export const XP_CURVE_GROWTH = parseFloat(process.env.XP_CURVE_GROWTH) || 1.15

// XP required to advance FROM `level` TO `level + 1`
export function xpForLevel(level) {
  if (level >= MAX_LEVEL) return Infinity
  return Math.floor(XP_CURVE_BASE * Math.pow(XP_CURVE_GROWTH, level))
}

// Total XP required to reach `level` (cumulative from level 1)
export function totalXpForLevel(level) {
  if (level <= 1) return 0
  if (level > MAX_LEVEL) level = MAX_LEVEL
  // Sum of geometric series: base * (growth^level - 1) / (growth - 1)
  return Math.floor(XP_CURVE_BASE * (Math.pow(XP_CURVE_GROWTH, level - 1) - 1) / (XP_CURVE_GROWTH - 1))
}

// Constants shared with client — all env-configurable
function envInt(name, def) {
  const v = process.env[name]
  if (v === undefined || v === '') return def
  const n = parseInt(v)
  return Number.isFinite(n) ? n : def
}

export const CONFIG = {
  // Gameplay
  MOVE_COOLDOWN_MS: envInt('MOVE_COOLDOWN_MS', 140),
  ATTACK_COOLDOWN_MS: envInt('ATTACK_COOLDOWN_MS', 700),
  RESPAWN_HP_PENALTY_GOLD_PCT: envInt('RESPAWN_HP_PENALTY_GOLD_PCT', 10),
  MAX_INVENTORY_SLOTS: envInt('MAX_INVENTORY_SLOTS', 60),
  STARTING_GOLD: envInt('STARTING_GOLD', 50),

  // Chat
  CHAT_MAX_LENGTH: envInt('CHAT_MAX_LENGTH', 200),
  CHAT_COOLDOWN_MS: envInt('CHAT_COOLDOWN_MS', 1000),

  // Account
  MAX_CHARACTERS_PER_ACCOUNT: envInt('MAX_CHARACTERS_PER_ACCOUNT', 5),

  // Rate limits
  AUTH_RATE_LIMIT_PER_15MIN: envInt('AUTH_RATE_LIMIT_PER_15MIN', 20),
  AUTH_RATE_LIMIT_WINDOW_MS: envInt('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  GENERAL_RATE_LIMIT_PER_MIN: envInt('GENERAL_RATE_LIMIT_PER_MIN', 120),

  // Server ops
  AUTOSAVE_INTERVAL_MS: envInt('AUTOSAVE_INTERVAL_MS', 30000),
  LEADERBOARD_SIZE: envInt('LEADERBOARD_SIZE', 50),
  SESSION_TIMEOUT_MS: envInt('SESSION_TIMEOUT_MS', 5 * 60 * 1000),
  ONLINE_BROADCAST_INTERVAL_MS: envInt('ONLINE_BROADCAST_INTERVAL_MS', 5000),
  STALE_SESSION_CLEANUP_INTERVAL_MS: envInt('STALE_SESSION_CLEANUP_INTERVAL_MS', 60000),

  // Monster respawns
  MONSTER_RESPAWN_MIN_MS: envInt('MONSTER_RESPAWN_MIN_MS', 60000),
  MONSTER_RESPAWN_MAX_MS: envInt('MONSTER_RESPAWN_MAX_MS', 120000),
  BOSS_RESPAWN_MS: envInt('BOSS_RESPAWN_MS', 120000),
}

export function ok(payload) { return { ok: true, ...payload } }
export function err(message, code) { return { ok: false, error: message, code: code || 'ERROR' } }
