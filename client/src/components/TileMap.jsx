// ============================================================
// Mythral Client - Tile Map Renderer (Isometric projection)
// Diamond tiles + depth-sorted entities/props + smooth camera.
// Logical world stays a 2D grid (map[y][x]); only projection is iso.
// ============================================================

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { TILE_INFO } from '../../../shared/tiles.js'
import { drawTileSprite, drawDecorSprite, drawBuildingSprite, getDecorProp } from '../art/tileRenderer.js'
import { drawEntity } from '../art/entitySprite.js'
import { applyAmbientLight, drawTorchGlow, drawShadow } from '../utils/lighting.js'
import { WeatherSystem } from '../utils/weather.js'

const BASE_TILE = 32
const MIN_TILE = 14
const LERP_FACTOR = 0.18
const SNAP_THRESHOLD = 0.15
const BUFFER = 6
// Duration (ms) of the visual slide between two adjacent tiles. Should be
// slightly shorter than the server move cooldown so steps chain smoothly.
const MOVE_DUR = 150

// Iso tile native box: 2:1 diamond (width TW, height TH = TW/2)
const ISO_W = 64
const ISO_H = 32

export default function TileMap({
  currentIsland, map, monsters, npcs, otherPlayers = [],
  floatingTexts, pathTarget, particles = [], onTileClick, onTileDoubleClick, player, buildings = [],
  weather = 'clear', timeOfDay = 0.5, screenShake = 0,
}) {
  if (!map || !player || !map.length || !map[0]) return null
  const w = map[0].length, h = map.length

  // ---- Auto tile size: scale to fit viewport (smooth on render) ----
  const vw = window.innerWidth, vh = window.innerHeight
  const isMobile = vw < 768
  const cols = isMobile ? 8 : 22
  const ts = Math.max(MIN_TILE, Math.min(96, Math.round(vw / cols)))
  const viewW = Math.min(25, Math.floor(vw / ts) + BUFFER)
  const viewH = Math.min(17, Math.floor(vh / ts) + BUFFER)
  const bufW = viewW + BUFFER * 2, bufH = viewH + BUFFER * 2

  const TW = ts, TH = ts / 2
  const headroom = Math.ceil(ts * 1.6)
  const offsetX = (bufH - 1) * (TW / 2)
  const offsetY = headroom
  // project buffer-local grid (lx,ly) -> canvas px (tile diamond box top-left)
  const projX = (lx, ly) => (lx - ly) * (TW / 2) + offsetX
  const projY = (lx, ly) => (lx + ly) * (TH / 2) + offsetY

  const tileCanvasW = (bufW + bufH - 2) * (TW / 2) + TW
  const tileCanvasH = (bufW + bufH - 2) * (TH / 2) + TH + offsetY
  const containerW = (viewW + viewH) * (TW / 2)
  const containerH = (viewW + viewH) * (TH / 2) + headroom

  // Viewport top vertex (clamped camera position maps here in the container)
  const viewTopX = containerW / 2 - (viewW - viewH) * ts / 4
  const viewTopY = containerH / 2 - (viewW + viewH) * ts / 8

  const tsRef = useRef(BASE_TILE)
  tsRef.current = ts

  const clickRef = useRef(onTileClick)
  clickRef.current = onTileClick
  const doubleClickRef = useRef(onTileDoubleClick)
  doubleClickRef.current = onTileDoubleClick

  // Target camera (anchor) — 2D clamp so buffer stays on the map
  let targetCamX = player.x - Math.floor(viewW / 2)
  let targetCamY = player.y - Math.floor(viewH / 2)
  targetCamX = Math.max(0, Math.min(w - viewW, targetCamX))
  targetCamY = Math.max(0, Math.min(h - viewH, targetCamY))

  // Buffer anchor
  const anchorRef = useRef({ x: targetCamX - BUFFER, y: targetCamY - BUFFER })
  const cx = targetCamX + viewW / 2, cy = targetCamY + viewH / 2
  const acx = anchorRef.current.x + bufW / 2, acy = anchorRef.current.y + bufH / 2
  let needsRedraw = false
  if (Math.abs(cx - acx) > BUFFER - 1 || Math.abs(cy - acy) > BUFFER - 1) {
    anchorRef.current = { x: targetCamX - BUFFER, y: targetCamY - BUFFER }
    needsRedraw = true
  }
  const ax = anchorRef.current.x, ay = anchorRef.current.y

  // Live metrics used by rAF (so resize/ts changes stay correct)
  const metricRef = useRef({})
  metricRef.current = { T: ts, offsetX, offsetY, containerW, containerH, ax, ay, viewW, viewH, viewTopX, viewTopY }

  const tileCanvasRef = useRef(null)
  const entityCanvasRef = useRef(null)
  const lastKey = useRef('')
  const assetReadyRef = useRef(false)

  // ---- Pan/drag state ----
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const pointerRef = useRef({ down: false, startX: 0, startY: 0, baseX: 0, baseY: 0 })
  const wasPanningRef = useRef(false)
  const lastPlayerPosRef = useRef({ x: player.x, y: player.y })

  // Pass 1+2: Base tiles (diamonds) + cached on camera-anchor shift.
  // Drawn back-to-front by (x+y) so nearer tiles overlap farther ones.
  useEffect(() => {
    const key = `${ax},${ay}`
    if (!needsRedraw && lastKey.current === key) return
    lastKey.current = key
    const canvas = tileCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (canvas.width !== tileCanvasW) canvas.width = tileCanvasW
    if (canvas.height !== tileCanvasH) canvas.height = tileCanvasH
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, tileCanvasW, tileCanvasH)

    const maxSum = (bufW - 1) + (bufH - 1)
    for (let s = 0; s <= maxSum; s++) {
      for (let x = 0; x < bufW; x++) {
        const y = s - x
        if (y < 0 || y >= bufH) continue
        const tx = ax + x, ty = ay + y
        if (tx < 0 || tx >= w || ty < 0 || ty >= h) continue
        const tile = map[ty][tx]
        const info = TILE_INFO[tile] || { color: '#000' }
        const px = projX(x, y), py = projY(x, y)
        const drawn = drawTileSprite(ctx, tx, ty, tile, px, py, ts)
        if (!drawn) {
          ctx.fillStyle = info.color || '#000'
          ctx.beginPath()
          ctx.moveTo(px + TW / 2, py)
          ctx.lineTo(px + TW, py + TH / 2)
          ctx.lineTo(px + TW / 2, py + TH)
          ctx.lineTo(px, py + TH / 2)
          ctx.closePath()
          ctx.fill()
        }
      }
    }
    assetReadyRef.current = true
  }, [ax, ay, w, h, bufW, bufH, map, needsRedraw, ts, tileCanvasW, tileCanvasH, offsetX, offsetY])

  // rAF: camera + entity sprites (with props) + lighting/weather overlay
  const smoothCam = useRef({ x: targetCamX, y: targetCamY })
  const targetRef = useRef({ x: targetCamX, y: targetCamY })
  // Reset smooth camera on island travel (map change) to avoid lerping from old position
  const prevMapRef = useRef(map)
  if (prevMapRef.current !== map) {
    prevMapRef.current = map
    smoothCam.current.x = targetCamX
    smoothCam.current.y = targetCamY
  }
  const wrapperRef = useRef(null)
  const overlayRef = useRef(null)
  const rafRef = useRef(null)
  const weatherSysRef = useRef(new WeatherSystem())
  const shakeRef = useRef(screenShake)
  shakeRef.current = screenShake
  // Entity position interpolation (smooth slide between tiles)
  const entRenderRef = useRef(new Map())   // id -> {x, y} (float grid coords)
  const entAnimRef = useRef(new Map())     // id -> {fromX,fromY,toX,toY,start,active}
  targetRef.current.x = targetCamX
  targetRef.current.y = targetCamY

  // Determine weather from island biome (optional override via props)
  const weatherRef = useRef(weather || 'clear')
  if (!weather && currentIsland?.biome) {
    const wmap = { lumina: 'clear', emberfall: 'ember', frostpeak: 'snow', mistwood: 'fog', sunscar: 'sandstorm', tidehaven: 'rain', shadowfen: 'fog', skyreach: 'wind', voidheart: 'storm' }
    weatherRef.current = wmap[currentIsland.biome] || 'clear'
  }
  // Smooth day/night cycle (full day ~ 8 min) unless prop provided
  const dayLengthMs = 8 * 60 * 1000
  const getTimeOfDay = () => (typeof timeOfDay === 'number' ? timeOfDay : ((Date.now() % dayLengthMs) / dayLengthMs))

  // Interpolate an entity's rendered grid position so it slides smoothly
  // between tiles instead of teleporting. `id` uniquely identifies the entity.
  function interpEntity(id, gx, gy, now) {
    let a = entAnimRef.current.get(id)
    if (!a) {
      a = { fromX: gx, fromY: gy, toX: gx, toY: gy, start: 0, active: false }
      entAnimRef.current.set(id, a)
    }
    if (gx !== a.toX || gy !== a.toY) {
      const prev = entRenderRef.current.get(id)
      const fromX = prev ? prev.x : gx
      const fromY = prev ? prev.y : gy
      // Large jumps (island travel, respawn, teleport) snap instead of slide
      if (Math.abs(gx - fromX) + Math.abs(gy - fromY) > 3) {
        a.fromX = gx; a.fromY = gy; a.toX = gx; a.toY = gy; a.active = false
      } else {
        a.fromX = fromX; a.fromY = fromY
        a.toX = gx; a.toY = gy; a.start = now; a.active = true
      }
    }
    let x = gx, y = gy
    if (a.active) {
      const t = Math.min((now - a.start) / MOVE_DUR, 1)
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2 // easeInOutQuad
      x = a.fromX + (a.toX - a.fromX) * e
      y = a.fromY + (a.toY - a.fromY) * e
      if (t >= 1) a.active = false
    }
    entRenderRef.current.set(id, { x, y })
    return { x, y }
  }

  useEffect(() => {
    let lastTime = performance.now()
    const tick = (now) => {
      const dt = Math.min(now - lastTime, 50)
      lastTime = now
      // Interpolated player position drives the camera so the player stays
      // centered on screen and the world scrolls smoothly while walking.
      const pr = playerRef.current
      const pp = pr ? interpEntity('__player__', pr.x, pr.y, now) : null
      if (pp) {
        targetRef.current.x = Math.max(0, Math.min(w - viewW, pp.x - Math.floor(viewW / 2)))
        targetRef.current.y = Math.max(0, Math.min(h - viewH, pp.y - Math.floor(viewH / 2)))
      }
      const cam = smoothCam.current, tgt = targetRef.current
      const dx = tgt.x - cam.x, dy = tgt.y - cam.y
      if (Math.abs(dx) < SNAP_THRESHOLD && Math.abs(dy) < SNAP_THRESHOLD) { cam.x = tgt.x; cam.y = tgt.y }
      else { cam.x += dx * LERP_FACTOR; cam.y += dy * LERP_FACTOR }

      // shake offset
      const T = tsRef.current
      const sh = shakeRef.current || 0
      const shx = sh ? (Math.random() - 0.5) * sh : 0
      const shy = sh ? (Math.random() - 0.5) * sh : 0

      const w = worldRef.current
      const m = metricRef.current
      const rax = w.ax, ray = w.ay

      // ---- camera/wrapper transform: align clamped camera to viewTop ----
      const cdx = cam.x - rax, cdy = cam.y - ray
      const canvasCamX = (cdx - cdy) * (m.T / 2) + m.offsetX
      const canvasCamY = (cdx + cdy) * (m.T / 4) + m.offsetY
      // Auto-reset pan offset when player moves
      const ppos = playerRef.current
      const lpp = lastPlayerPosRef.current
      if (ppos.x !== lpp.x || ppos.y !== lpp.y) {
        dragOffsetRef.current = { x: 0, y: 0 }
        lpp.x = ppos.x; lpp.y = ppos.y
      }
      const po = dragOffsetRef.current
      if (wrapperRef.current) {
        wrapperRef.current.style.transform =
          `translate3d(${m.viewTopX - canvasCamX + shx + po.x}px, ${m.viewTopY - canvasCamY + shy + po.y}px, 0)`
      }

      // ---- entity + prop canvas ----
      const ec = entityCanvasRef.current
      if (ec) {
        const ectx = ec.getContext('2d')
        if (ec.width !== tileCanvasW) ec.width = tileCanvasW
        if (ec.height !== tileCanvasH) ec.height = tileCanvasH
        ectx.imageSmoothingEnabled = false
        ectx.clearRect(0, 0, tileCanvasW, tileCanvasH)
        const p = playerRef.current

        // Build draw list: props + entities, sorted back-to-front by (x+y)
        const list = []
        for (let y = 0; y < bufH; y++) {
          for (let x = 0; x < bufW; x++) {
            const tx = rax + x, ty = ray + y
            if (tx < 0 || tx >= w || ty < 0 || ty >= h) continue
            const prop = getDecorProp(map[ty][tx], tx, ty)
            if (prop) list.push({ x: tx, y: ty, kind: 'prop', prop })
          }
        }
        const inBuf = (e) => e.x >= rax - 1 && e.x < rax + bufW + 1 && e.y >= ray - 1 && e.y < ray + bufH + 1
        for (const b of w.buildings) {
          if (inBuf(b)) list.push({ x: b.x + (b.w >> 1), y: b.y + (b.h >> 1), kind: 'building', buildingType: b.buildingType, bw: b.w, bh: b.h })
        }
        for (const m of w.monsters) if (inBuf(m)) list.push({ ...m, _kind: 'mon' })
        for (const op of w.otherPlayers) if (inBuf(op)) list.push({ ...op, _kind: 'pl' })
        for (const n of w.npcs) if (inBuf(n)) list.push({ ...n, _kind: 'npc' })
        if (p && pp) list.push({ ...p, x: pp.x, y: pp.y, _kind: 'me' })
        list.sort((a, b) => {
          const depth = (item) => item.x + item.y + (item.kind === 'building' ? (item.bh || 1) * 0.5 : 0)
          return depth(a) - depth(b)
        })

        for (const e of list) {
          const lx = e.x - rax, ly = e.y - ray
          const bx = (lx - ly) * (m.T / 2) + m.offsetX
          const by = (lx + ly) * (m.T / 4) + m.offsetY
          drawShadow(ectx, bx + m.T / 2 - 12, by + m.T / 4, 24, 8)
          if (e.kind === 'prop') {
            drawDecorSprite(ectx, e.prop, e.x, e.y, bx, by - m.T / 2, m.T)
          } else if (e.kind === 'building') {
            drawBuildingSprite(ectx, `building.${e.buildingType}`, { w: e.bw, h: e.bh }, bx, by - m.T / 2, m.T)
          } else {
            drawEntity(ectx, e, bx, by - m.T / 2, m.T, now / 1000)
          }
        }
        // Sync player nameplate (DOM overlay) to interpolated position
        if (playerPlateRef.current && pp) {
          const lx = pp.x - rax, ly = pp.y - ray
          const sx = (lx - ly) * (m.T / 2) + m.offsetX
          const sy = (lx + ly) * (m.T / 4) + m.offsetY
          playerPlateRef.current.style.transform = `translate3d(${sx}px, ${sy - m.T / 2}px, 0)`
        }
      }

      // ---- overlay: ambient light + torch glows + weather ----
      const ov = overlayRef.current
      if (ov) {
        const octx = ov.getContext('2d')
        if (ov.width !== containerW) ov.width = containerW
        if (ov.height !== containerH) ov.height = containerH
        octx.clearRect(0, 0, containerW, containerH)
        applyAmbientLight(octx, containerW, containerH, getTimeOfDay())
        for (const npc of w.npcs) {
          if (npc.shop || npc.travel) {
            const sx = m.viewTopX + ((npc.x - tgt.x) - (npc.y - tgt.y)) * (m.T / 2) + shx
            const sy = m.viewTopY + ((npc.x - tgt.x) + (npc.y - tgt.y)) * (m.T / 4) + shy
            if (sx > -100 && sx < containerW + 100 && sy > -100 && sy < containerH + 100) {
              drawTorchGlow(octx, sx, sy, 70, 0.9, now)
            }
          }
        }
        weatherSysRef.current.update(dt, weatherRef.current, containerW, containerH)
        weatherSysRef.current.draw(octx, containerW, containerH)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [map])

  // Walking state -> player anim
  const prevPos = useRef({ x: player.x, y: player.y })
  const [isWalking, setIsWalking] = useState(false)
  useEffect(() => {
    if (player.x !== prevPos.current.x || player.y !== prevPos.current.y) {
      setIsWalking(true)
      prevPos.current = { x: player.x, y: player.y }
      const t = setTimeout(() => setIsWalking(false), 250)
      return () => clearTimeout(t)
    }
  }, [player.x, player.y])

  const playerRef = useRef(player)
  playerRef.current = { ...player, isWalking }
  const playerPlateRef = useRef(null) // player nameplate div (synced to interpolated pos in rAF)
  const worldRef = useRef({ monsters, npcs, otherPlayers, ax, ay })
  worldRef.current = { monsters, npcs, otherPlayers, buildings, ax, ay }

  // ---- iso screen position of a grid coord (for DOM overlays) ----
  const isoScreen = (gx, gy) => {
    const lx = gx - ax, ly = gy - ay
    return { x: (lx - ly) * (ts / 2) + offsetX, y: (lx + ly) * (ts / 4) + offsetY }
  }
  const entityStyle = (ex, ey) => {
    const s = isoScreen(ex, ey)
    return { transform: `translate3d(${s.x}px, ${s.y - ts / 2}px, 0)`, width: ts, height: ts }
  }
  const flx = ax - 1, fly = ay - 1, crx = ax + bufW + 1, cry = ay + bufH + 1

  // ---- click -> grid (inverse iso projection) ----
  const handleCanvasClick = useCallback((e) => {
    if (wasPanningRef.current) { wasPanningRef.current = false; return }
    const canvas = tileCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = (e.clientX - rect.left) * (canvas.width / rect.width)
    const py = (e.clientY - rect.top) * (canvas.height / rect.height)
    const a = (px - offsetX - TW / 2) / (TW / 2)
    const b = (py - offsetY - TH / 2) / (TH / 2)
    const lx = (a + b) / 2
    const ly = (b - a) / 2
    const tileX = Math.round(lx) + ax
    const tileY = Math.round(ly) + ay
    if (tileX >= 0 && tileX < w && tileY >= 0 && tileY < h) clickRef.current(tileX, tileY)
  }, [ax, ay, w, h, ts, offsetX, offsetY])

  // ---- double-click -> grid (inverse iso projection, same math) ----
  const handleCanvasDoubleClick = useCallback((e) => {
    const canvas = tileCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = (e.clientX - rect.left) * (canvas.width / rect.width)
    const py = (e.clientY - rect.top) * (canvas.height / rect.height)
    const a = (px - offsetX - TW / 2) / (TW / 2)
    const b = (py - offsetY - TH / 2) / (TH / 2)
    const lx = (a + b) / 2
    const ly = (b - a) / 2
    const tileX = Math.round(lx) + ax
    const tileY = Math.round(ly) + ay
    if (tileX >= 0 && tileX < w && tileY >= 0 && tileY < h) doubleClickRef.current?.(tileX, tileY)
  }, [ax, ay, w, h, ts, offsetX, offsetY])

  // ---- Pointer handlers for drag-to-pan ----
  const handlePointerDown = useCallback((e) => {
    const pr = pointerRef.current
    pr.down = true
    pr.startX = e.clientX
    pr.startY = e.clientY
    pr.baseX = dragOffsetRef.current.x
    pr.baseY = dragOffsetRef.current.y
    wasPanningRef.current = false
  }, [])

  const handlePointerMove = useCallback((e) => {
    const pr = pointerRef.current
    if (!pr.down) return
    const dx = e.clientX - pr.startX
    const dy = e.clientY - pr.startY
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      wasPanningRef.current = true
      dragOffsetRef.current.x = pr.baseX + (pr.startX - e.clientX)
      dragOffsetRef.current.y = pr.baseY + (pr.startY - e.clientY)
    }
  }, [])

  const handlePointerUp = useCallback((e) => {
    pointerRef.current.down = false
  }, [])

  const facingLeft = player.facing === 'left'

  // Initial (pre-rAF) transform so the first frame is already camera-aligned
  const initCdx = targetCamX - ax, initCdy = targetCamY - ay
  const initCanvasCamX = (initCdx - initCdy) * (ts / 2) + offsetX
  const initCanvasCamY = (initCdx + initCdy) * (ts / 4) + offsetY
  const initTransform = `translate3d(${viewTopX - initCanvasCamX}px, ${viewTopY - initCanvasCamY}px, 0)`

  return (
    <div className="tile-map-container" style={{ width: containerW, height: containerH, background: currentIsland?.backgroundColor || '#000' }}>
      <div ref={wrapperRef} style={{ position: 'absolute', top: 0, left: 0, width: tileCanvasW, height: tileCanvasH, transform: initTransform }}>
        <canvas ref={tileCanvasRef} onClick={handleCanvasClick} onDoubleClick={handleCanvasDoubleClick}
          onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
          style={{ position: 'absolute', top: 0, left: 0, width: tileCanvasW, height: tileCanvasH, imageRendering: 'pixelated', touchAction: 'none', zIndex: 0 }} />
        <canvas ref={entityCanvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: tileCanvasW, height: tileCanvasH, imageRendering: 'pixelated', zIndex: 1, pointerEvents: 'none' }} />

        {/* DOM overlays: nameplates, HP bars, markers, particles, floating text */}
        {/* pointerEvents: none on container so canvas gets clicks; entities have pointerEvents: auto */}
        {/* pointerdown/move/up bubble from entities to enable drag-to-pan when starting on an entity */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}
          onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
          {npcs.filter(n => n.x >= flx && n.x < crx && n.y >= fly && n.y < cry).map(npc => (
            <div key={npc.id} className="entity npc" style={{ ...entityStyle(npc.x, npc.y), pointerEvents: 'auto' }}
              onClick={(e) => { e.stopPropagation(); clickRef.current(npc.x, npc.y) }} title={npc.name}>
              <div className="entity-name npc-name" style={{ color: npc.color }}>{npc.name}</div>
              {npc.quest && <div className="entity-marker">!</div>}
              {npc.shop && <div className="entity-marker shop">$</div>}
              {npc.travel && <div className="entity-marker travel">&#9875;</div>}
            </div>
          ))}
          {monsters.filter(m => m.x >= flx && m.x < crx && m.y >= fly && m.y < cry).map(m => (
            <div key={m.id} className={`entity monster ${m.boss ? 'boss' : ''}`} style={entityStyle(m.x, m.y)}
              onClick={(e) => { e.stopPropagation(); clickRef.current(m.x, m.y) }} title={`${m.name} (Lv ${m.level})`}>
              <div className="entity-hp-bar"><div className="entity-hp-fill" style={{ width: `${m.maxHp > 0 ? (m.hp / m.maxHp) * 100 : 0}%` }} /></div>
              <div className="entity-name monster-name">{m.name}{m.boss ? ' ★' : ''}</div>
            </div>
          ))}
          {otherPlayers.filter(p => p.x >= flx && p.x < crx && p.y >= fly && p.y < cry).map(p => (
            <div key={p.id} className="entity other-player" style={entityStyle(p.x, p.y)}
              onClick={(e) => { e.stopPropagation(); clickRef.current(p.x, p.y) }} title={`${p.name} (Lv ${p.level})`}>
              {p.hp !== undefined && p.maxHp && p.hp < p.maxHp && (
                <div className="other-player-hp-bar"><div className="other-player-hp-fill" style={{ width: `${(p.hp / p.maxHp) * 100}%` }} /></div>
              )}
              <div className="entity-name other-player-name">{p.name} <span style={{ color: '#64748b', fontSize: 9 }}>(Lv {p.level})</span></div>
            </div>
          ))}
          {pathTarget && pathTarget.x >= ax && pathTarget.x < ax + bufW && pathTarget.y >= ay && pathTarget.y < ay + bufH && (
            <div className="path-destination" style={{ transform: `translate3d(${isoScreen(pathTarget.x, pathTarget.y).x}px, ${isoScreen(pathTarget.x, pathTarget.y).y - ts / 2}px, 0)` }} />
          )}
          <div ref={playerPlateRef} className={`entity player ${isWalking ? 'walking' : ''} ${facingLeft ? 'facing-left' : ''}`} style={entityStyle(player.x, player.y)}>
            <div className="entity-name player-name">{player.name}</div>
          </div>
          {floatingTexts.filter(f => f.x >= flx && f.x < crx && f.y >= fly && f.y < cry).map(f => {
            const s = isoScreen(f.x, f.y)
            return (
              <div key={f.id} className={`floating-text ${f.kind}`} style={{ transform: `translate3d(${s.x + ts / 2}px, ${s.y - ts / 2}px, 0)`, color: f.color }}>{f.text}</div>
            )
          })}
          <div className="particle-layer">
            {particles.filter(p => p.x >= flx && p.x < crx && p.y >= fly && p.y < cry).map(p => {
              const s = isoScreen(p.x, p.y)
              return (
                <div key={p.id} className={`particle particle-dot ${p.rise ? 'rise' : ''} ${p.fall ? 'fall' : ''}`}
                  style={{ left: s.x + ts / 2, top: s.y - ts / 2,
                    '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--size': `${p.size}px`, '--color': p.color,
                    animationDuration: `${p.duration}ms`, animationDelay: `${p.delay}ms` }} />
              )
            })}
          </div>
        </div>
      </div>
      <canvas ref={overlayRef} style={{ position: 'absolute', top: 0, left: 0, width: containerW, height: containerH, pointerEvents: 'none', zIndex: 3 }} />
    </div>
  )
}
