// ============================================================
// 2D Canvas lighting system
// Ambient light, torch glow, shadows, day/night
// ============================================================

// Time-of-day: 0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset, 1=midnight
const AMBIENT_COLORS = [
  { t: 0,    r: 10,  g: 10,  b: 40, a: 0.55 },  // midnight: deep blue dark
  { t: 0.2,  r: 40,  g: 20,  b: 60, a: 0.35 },  // pre-dawn: purple
  { t: 0.3,  r: 180, g: 120, b: 80, a: 0.1 },   // sunrise: warm orange tint
  { t: 0.5,  r: 255, g: 255, b: 240, a: 0 },    // noon: no overlay
  { t: 0.7,  r: 200, g: 130, b: 60, a: 0.08 },  // sunset: warm
  { t: 0.8,  r: 80,  g: 40,  b: 100, a: 0.3 },  // dusk: purple
  { t: 1,    r: 10,  g: 10,  b: 40, a: 0.55 },  // midnight
]

function lerpColor(c1, c2, t) {
  return {
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t,
    a: c1.a + (c2.a - c1.a) * t,
  }
}

// Get ambient color for time of day (0-1)
export function getAmbientColor(timeOfDay) {
  const t = ((timeOfDay % 1) + 1) % 1
  for (let i = 0; i < AMBIENT_COLORS.length - 1; i++) {
    const c1 = AMBIENT_COLORS[i]
    const c2 = AMBIENT_COLORS[i + 1]
    if (t >= c1.t && t <= c2.t) {
      const blend = (t - c1.t) / (c2.t - c1.t)
      return lerpColor(c1, c2, blend)
    }
  }
  return AMBIENT_COLORS[0]
}

// Apply ambient lighting overlay
export function applyAmbientLight(ctx, width, height, timeOfDay) {
  const c = getAmbientColor(timeOfDay)
  if (c.a <= 0) return
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

// Draw torch/lantern glow
export function drawTorchGlow(ctx, screenX, screenY, radius = 80, intensity = 1, time = 0) {
  // Flicker
  const flicker = 1 + Math.sin(time * 0.005) * 0.08 + Math.sin(time * 0.013) * 0.05
  const r = radius * flicker
  const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, r)
  grad.addColorStop(0, `rgba(255, 180, 60, ${0.25 * intensity * flicker})`)
  grad.addColorStop(0.3, `rgba(255, 140, 40, ${0.12 * intensity * flicker})`)
  grad.addColorStop(0.7, `rgba(255, 100, 20, ${0.04 * intensity * flicker})`)
  grad.addColorStop(1, 'rgba(255, 80, 10, 0)')
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.fillStyle = grad
  ctx.fillRect(screenX - r, screenY - r, r * 2, r * 2)
  ctx.restore()
}

// Draw entity shadow
export function drawShadow(ctx, x, y, width, height, opacity = 0.2) {
  ctx.save()
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`
  ctx.beginPath()
  ctx.ellipse(x + width / 2, y + height + 2, width / 2.5, height / 6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// Draw ambient occlusion at tile edges (subtle)
export function drawEdgeAO(ctx, x, y, w, h, edgeSize = 2) {
  ctx.save()
  // Bottom edge
  const gradB = ctx.createLinearGradient(x, y + h - edgeSize, x, y + h)
  gradB.addColorStop(0, 'rgba(0,0,0,0)')
  gradB.addColorStop(1, 'rgba(0,0,0,0.08)')
  ctx.fillStyle = gradB
  ctx.fillRect(x, y + h - edgeSize, w, edgeSize)
  // Right edge
  const gradR = ctx.createLinearGradient(x + w - edgeSize, y, x + w, y)
  gradR.addColorStop(0, 'rgba(0,0,0,0)')
  gradR.addColorStop(1, 'rgba(0,0,0,0.05)')
  ctx.fillStyle = gradR
  ctx.fillRect(x + w - edgeSize, y, edgeSize, h)
  ctx.restore()
}
