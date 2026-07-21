// ============================================================
// Mythral - Virtual Joystick (mobile movement control)
// Drag-anywhere thumb zone; emits direction via onMove(dx,dy).
// 8-direction snap, throttled emit (~120ms) to respect server tick.
// ============================================================
import React, { useRef, useState, useCallback, useEffect } from 'react'

const EMIT_MS = 120
const DEADZONE = 0.18
// 8-direction snap vectors
const DIRS = [
  [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1],
]

export default function Joystick({ onMove, onStop, leftHanded = false, size = 'medium' }) {
  const baseRef = useRef(null)
  const [active, setActive] = useState(false)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const [dirLabel, setDirLabel] = useState('')
  const intervalRef = useRef(null)
  const lastDirRef = useRef('0,0')
  const curRef = useRef({ dx: 0, dy: 0 })

  const pickDir = (nx, ny) => {
    // nx,ny in -1..1
    const mag = Math.hypot(nx, ny)
    if (mag < DEADZONE) return [0, 0]
    // snap to nearest of 8 directions
    let best = DIRS[0], bestDot = -Infinity
    const norm = [nx / mag, ny / mag]
    for (const d of DIRS) {
      const dot = d[0] * norm[0] + d[1] * norm[1]
      if (dot > bestDot) { bestDot = dot; best = d }
    }
    return best
  }

  const startEmit = useCallback(() => {
    if (intervalRef.current) return
    const tick = () => {
      const { dx, dy } = curRef.current
      if (dx !== 0 || dy !== 0) onMove?.(dx, dy)
    }
    tick()
    intervalRef.current = setInterval(tick, EMIT_MS)
  }, [onMove])

  const stopEmit = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    curRef.current = { dx: 0, dy: 0 }
    onStop?.()
  }, [onStop])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null } }
  }, [])

  const handleDown = (e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setActive(true)
    startEmit()
  }

  const handleMove = (e) => {
    if (!active) return
    const rect = baseRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    let nx = (e.clientX - cx) / (rect.width / 2)
    let ny = (e.clientY - cy) / (rect.height / 2)
    const mag = Math.hypot(nx, ny)
    const maxMag = 1
    if (mag > maxMag) { nx /= mag; ny /= mag }
    const [dx, dy] = pickDir(nx, ny)
    setKnob({ x: dx * (rect.width / 2) * 0.55, y: dy * (rect.height / 2) * 0.55 })
    setDirLabel(dx === 0 && dy === 0 ? '' : `${dx === 0 ? '' : dx < 0 ? '◀' : '▶'}${dy === 0 ? '' : dy < 0 ? '▲' : '▼'}`)
    const key = `${dx},${dy}`
    if (key !== lastDirRef.current) {
      lastDirRef.current = key
      curRef.current = { dx, dy }
    }
  }

  const handleUp = (e) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    setActive(false)
    setKnob({ x: 0, y: 0 })
    setDirLabel('')
    lastDirRef.current = '0,0'
    stopEmit()
  }

  const sizePx = size === 'small' ? 110 : size === 'large' ? 160 : 132

  return (
    <div
      ref={baseRef}
      className={`joystick ${active ? 'active' : ''} ${leftHanded ? 'left' : 'right'}`}
      style={{ width: sizePx, height: sizePx }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onTouchStart={(e) => e.preventDefault()}
    >
      <div className="joystick-base" />
      <div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      {dirLabel && <div className="joystick-dir">{dirLabel}</div>}
    </div>
  )
}
