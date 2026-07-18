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
