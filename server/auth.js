// ============================================================
// Aetheria Server - Auth helpers (bcrypt + JWT)
// ============================================================

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'aetheria-dev-secret-change-me-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('[SECURITY] WARNING: JWT_SECRET not set! Using insecure default. Set JWT_SECRET in .env')
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function validateUsername(username) {
  if (!username || typeof username !== 'string') return 'Username is required'
  if (username.length < 3) return 'Username must be at least 3 characters'
  if (username.length > 20) return 'Username must be at most 20 characters'
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return 'Username can only contain letters, numbers, underscores, and hyphens'
  return null
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') return 'Password is required'
  if (password.length < 6) return 'Password must be at least 6 characters'
  if (password.length > 100) return 'Password is too long'
  return null
}

export function validateCharName(name) {
  if (!name || typeof name !== 'string') return 'Character name is required'
  if (name.length < 3) return 'Character name must be at least 3 characters'
  if (name.length > 20) return 'Character name must be at most 20 characters'
  if (!/^[a-zA-Z0-9 _-]+$/.test(name)) return 'Character name can only contain letters, numbers, spaces, underscores, and hyphens'
  return null
}
