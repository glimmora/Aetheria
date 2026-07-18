// ============================================================
// Mythral Server - Persistence layer
// Simple JSON file storage for users and characters.
// Swap for Postgres/MongoDB by replacing this file only.
// ============================================================

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const CHARS_FILE = path.join(DATA_DIR, 'characters.json')

let users = new Map()      // username -> { username, passwordHash, createdAt }
let characters = new Map() // characterId -> full character state
let dirty = false

async function ensureDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }) } catch {}
}

export async function loadAll() {
  await ensureDir()
  try {
    const u = await fs.readFile(USERS_FILE, 'utf-8')
    const uArr = JSON.parse(u)
    users = new Map(uArr.map(x => [x.username, x]))
  } catch { users = new Map() }
  try {
    const c = await fs.readFile(CHARS_FILE, 'utf-8')
    const cArr = JSON.parse(c)
    characters = new Map(cArr.map(x => [x.id, x]))
  } catch { characters = new Map() }
  console.log(`[db] Loaded ${users.size} users, ${characters.size} characters`)
}

let saveTimer = null
export function saveAll() {
  dirty = true
  if (saveTimer) return
  saveTimer = setTimeout(async () => {
    saveTimer = null
    if (!dirty) return
    dirty = false
    try {
      await ensureDir()
      await fs.writeFile(USERS_FILE, JSON.stringify([...users.values()], null, 2))
      await fs.writeFile(CHARS_FILE, JSON.stringify([...characters.values()], null, 2))
    } catch (e) {
      console.error('[db] Save failed:', e.message)
    }
  }, 500)
}

export async function saveAllNow() {
  try {
    await ensureDir()
    await fs.writeFile(USERS_FILE, JSON.stringify([...users.values()], null, 2))
    await fs.writeFile(CHARS_FILE, JSON.stringify([...characters.values()], null, 2))
    console.log('[db] Force-saved all data')
  } catch (e) {
    console.error('[db] Force-save failed:', e.message)
  }
}

// ---- Users ----
export function getUser(username) {
  return users.get(username.toLowerCase())
}
export function createUser(username, passwordHash) {
  const user = {
    username: username.toLowerCase(),
    displayName: username,
    passwordHash,
    createdAt: Date.now(),
  }
  users.set(user.username, user)
  saveAll()
  return user
}
export function getAllUsersCount() {
  return users.size
}

// ---- Characters ----
export function getCharacter(id) {
  return characters.get(id)
}
export function getCharactersByOwner(username) {
  return [...characters.values()].filter(c => c.owner === username.toLowerCase())
}
export function countCharactersByOwner(username) {
  const lower = username.toLowerCase()
  let n = 0
  for (const c of characters.values()) if (c.owner === lower) n++
  return n
}
export function getAllCharacters() {
  return [...characters.values()]
}
export function saveCharacter(char) {
  characters.set(char.id, char)
  saveAll()
}
export function deleteCharacter(id) {
  const existed = characters.delete(id)
  if (existed) saveAll()
  return existed
}
export function getCharacterByName(name) {
  const lower = name.toLowerCase()
  for (const c of characters.values()) {
    if (c.name.toLowerCase() === lower) return c
  }
  return null
}
