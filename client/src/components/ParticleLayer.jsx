// ============================================================
// Mythral Client - Particle Effects System
// Renders GPU-accelerated particle bursts for combat, healing,
// level-ups, and ambient effects. Uses CSS animations only
// (no canvas) for simplicity and performance.
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react'

// Particle configurations per effect type
const EFFECTS = {
  // Combat hit — small spark burst
  hit: {
    count: 8,
    duration: 600,
    particles: [
      { color: '#fbbf24', size: 4, distance: 30, shape: 'star' },
      { color: '#fde047', size: 3, distance: 25, shape: 'dot' },
      { color: '#fb7185', size: 3, distance: 35, shape: 'dot' },
    ],
  },
  // Critical hit — bigger, more particles
  crit: {
    count: 16,
    duration: 800,
    particles: [
      { color: '#fbbf24', size: 6, distance: 50, shape: 'star' },
      { color: '#fde047', size: 5, distance: 40, shape: 'star' },
      { color: '#fff', size: 4, distance: 45, shape: 'dot' },
      { color: '#fb7185', size: 4, distance: 55, shape: 'dot' },
    ],
  },
  // Heal — rising green sparkles
  heal: {
    count: 10,
    duration: 1000,
    particles: [
      { color: '#4ade80', size: 4, distance: 20, shape: 'cross', rise: true },
      { color: '#86efac', size: 3, distance: 15, shape: 'dot', rise: true },
      { color: '#bbf7d0', size: 3, distance: 25, shape: 'dot', rise: true },
    ],
  },
  // XP gain — small rising motes
  xp: {
    count: 6,
    duration: 900,
    particles: [
      { color: '#22d3ee', size: 3, distance: 10, shape: 'dot', rise: true },
      { color: '#67e8f9', size: 2, distance: 15, shape: 'dot', rise: true },
    ],
  },
  // Level up — big celebration burst
  levelup: {
    count: 24,
    duration: 1500,
    particles: [
      { color: '#fde047', size: 6, distance: 80, shape: 'star' },
      { color: '#fbbf24', size: 5, distance: 70, shape: 'star' },
      { color: '#fff', size: 4, distance: 60, shape: 'dot' },
      { color: '#a78bfa', size: 5, distance: 75, shape: 'star' },
      { color: '#22d3ee', size: 4, distance: 65, shape: 'dot' },
    ],
  },
  // Death — dark particles falling
  death: {
    count: 12,
    duration: 1200,
    particles: [
      { color: '#7f1d1d', size: 5, distance: 40, shape: 'dot', fall: true },
      { color: '#dc2626', size: 4, distance: 30, shape: 'dot', fall: true },
      { color: '#1f2937', size: 3, distance: 50, shape: 'dot', fall: true },
    ],
  },
  // Loot drop — golden sparkle
  loot: {
    count: 8,
    duration: 700,
    particles: [
      { color: '#fbbf24', size: 4, distance: 25, shape: 'star', rise: true },
      { color: '#fde047', size: 3, distance: 20, shape: 'dot', rise: true },
    ],
  },
}

export function spawnEffect(particles, x, y, type) {
  const config = EFFECTS[type]
  if (!config) return
  const id = Date.now() + Math.random()
  const newParticles = []
  for (let i = 0; i < config.count; i++) {
    const pConfig = config.particles[i % config.particles.length]
    const angle = (i / config.count) * Math.PI * 2 + Math.random() * 0.5
    const dist = pConfig.distance * (0.7 + Math.random() * 0.6)
    newParticles.push({
      id: `${id}-${i}`,
      x, y,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      color: pConfig.color,
      size: pConfig.size,
      shape: pConfig.shape,
      duration: config.duration,
      rise: pConfig.rise,
      fall: pConfig.fall,
      delay: Math.random() * 100,
    })
  }
  particles.push(...newParticles)
  // Cleanup after duration
  setTimeout(() => {
    const idx = particles.indexOf(newParticles[0])
    if (idx > -1) particles.splice(idx, idx + newParticles.length)
  }, config.duration + 200)
}

export default function ParticleLayer({ particles, camX, camY, tileSize }) {
  if (!particles || particles.length === 0) return null
  return (
    <div className="particle-layer" style={{ pointerEvents: 'none' }}>
      {particles.map(p => (
        <div
          key={p.id}
          className={`particle particle-${p.shape} ${p.rise ? 'rise' : ''} ${p.fall ? 'fall' : ''}`}
          style={{
            left: (p.x - camX) * tileSize + tileSize / 2,
            top: (p.y - camY) * tileSize + tileSize / 2,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--size': `${p.size}px`,
            '--color': p.color,
            animationDuration: `${p.duration}ms`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  )
}
