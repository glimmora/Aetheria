// ============================================================
// Aetheria: Nine Isles - Save / Load system
// localStorage-backed persistent save
// ============================================================

const SAVE_KEY = 'aetheria_save_v1'
const SETTINGS_KEY = 'aetheria_settings_v1'

export function saveGame(state) {
  try {
    const data = {
      player: state.player,
      currentIsland: state.currentIsland,
      inventory: state.inventory,
      equipment: state.equipment,
      quests: state.quests,
      questProgress: state.questProgress,
      killedBosses: state.killedBosses,
      visitedIslands: state.visitedIslands,
      timestamp: Date.now(),
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    return true
  } catch (e) {
    console.error('Failed to save game:', e)
    return false
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load game:', e)
    return null
  }
}

export function hasSave() {
  try {
    return !!localStorage.getItem(SAVE_KEY)
  } catch {
    return false
  }
}

export function deleteSave() {
  try {
    localStorage.removeItem(SAVE_KEY)
    return true
  } catch {
    return false
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
