// ============================================================
// Aetheria: Nine Isles - Shared protocol
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
}

export const CLIENT_EVENTS = {
  // Client → Server
  AUTH_LOGIN: 'auth:login',          // { username, password }
  AUTH_REGISTER: 'auth:register',    // { username, password }
  AUTH_LOGOUT: 'auth:logout',
  CHARACTER_LIST: 'character:list',
  CHARACTER_CREATE: 'character:create', // { name, classId }
  CHARACTER_SELECT: 'character:select', // { characterId }
  CHARACTER_DELETE: 'character:delete', // { characterId }
  MOVE: 'move',                       // { dx, dy } or { x, y }
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
  CHAT: 'chat',                       // { message } (island-local chat)
  DISCONNECT: 'disconnect',
}

export const TICK_RATE_HZ = 10
export const TICK_INTERVAL_MS = 1000 / TICK_RATE_HZ

// Constants shared with client
export const CONFIG = {
  MOVE_COOLDOWN_MS: 140,
  ATTACK_COOLDOWN_MS: 700,
  RESPAWN_HP_PENALTY_GOLD_PCT: 10,
  AUTOSAVE_INTERVAL_MS: 30000,
  MAX_INVENTORY_SLOTS: 60,
  STARTING_GOLD: 50,
  CHAT_MAX_LENGTH: 200,
  CHAT_COOLDOWN_MS: 1000,
}

export function ok(payload) { return { ok: true, ...payload } }
export function err(message, code) { return { ok: false, error: message, code: code || 'ERROR' } }
