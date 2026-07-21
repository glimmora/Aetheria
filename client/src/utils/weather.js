// ============================================================
// Canvas-based weather system
// Rain, snow, fog, wind, lightning
// ============================================================

export class WeatherSystem {
  constructor() {
    this.particles = []
    this.lightningTimer = 0
    this.lightningFlash = 0
    this.windAngle = 0
    this.windStrength = 0
  }

  // Update weather particles
  update(dt, weather, canvasW, canvasH, windAngle = 0, windStrength = 0) {
    this.windAngle = windAngle
    this.windStrength = windStrength

    // Spawn new particles based on weather
    if (weather === 'rain' || weather === 'storm') {
      const count = weather === 'storm' ? 8 : 4
      for (let i = 0; i < count; i++) {
        this.particles.push({
          type: 'rain',
          x: Math.random() * canvasW,
          y: -10,
          vx: windStrength * Math.cos(windAngle) * 2,
          vy: 8 + Math.random() * 4,
          life: 1,
          len: 6 + Math.random() * 4,
        })
      }
      // Lightning during storms
      if (weather === 'storm') {
        this.lightningTimer -= dt
        if (this.lightningTimer <= 0) {
          this.lightningFlash = 1
          this.lightningTimer = 3000 + Math.random() * 8000
        }
      }
    } else if (weather === 'snow') {
      if (Math.random() < 0.3) {
        this.particles.push({
          type: 'snow',
          x: Math.random() * canvasW,
          y: -5,
          vx: Math.sin(Date.now() * 0.001) * 0.5 + windStrength * Math.cos(windAngle),
          vy: 1 + Math.random() * 1.5,
          life: 1,
          size: 2 + Math.random() * 2,
          wobble: Math.random() * Math.PI * 2,
        })
      }
    } else if (weather === 'fog') {
      if (this.particles.length < 15) {
        this.particles.push({
          type: 'fog',
          x: -100,
          y: Math.random() * canvasH,
          vx: 0.2 + Math.random() * 0.3,
          vy: (Math.random() - 0.5) * 0.1,
          life: 1,
          size: 150 + Math.random() * 200,
          alpha: 0.03 + Math.random() * 0.04,
        })
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * dt * 0.06
      p.y += p.vy * dt * 0.06

      if (p.type === 'rain') {
        p.life -= dt * 0.003
      } else if (p.type === 'snow') {
        p.wobble += dt * 0.003
        p.x += Math.sin(p.wobble) * 0.3
        p.life -= dt * 0.0008
      } else if (p.type === 'fog') {
        p.life -= dt * 0.0003
      }

      // Remove dead particles
      if (p.life <= 0 || p.y > canvasH + 20 || p.x > canvasW + 200) {
        this.particles.splice(i, 1)
      }
    }

    // Fade lightning
    if (this.lightningFlash > 0) {
      this.lightningFlash -= dt * 0.004
      if (this.lightningFlash < 0) this.lightningFlash = 0
    }
  }

  // Draw weather effects
  draw(ctx, canvasW, canvasH) {
    for (const p of this.particles) {
      if (p.type === 'rain') {
        ctx.save()
        ctx.strokeStyle = `rgba(160, 200, 255, ${0.3 * p.life})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x + p.vx * 0.5, p.y + p.len)
        ctx.stroke()
        ctx.restore()
      } else if (p.type === 'snow') {
        ctx.save()
        ctx.fillStyle = `rgba(240, 245, 255, ${0.7 * p.life})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      } else if (p.type === 'fog') {
        ctx.save()
        ctx.globalAlpha = p.alpha * p.life
        ctx.fillStyle = '#c8d0d8'
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.4, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    // Lightning flash
    if (this.lightningFlash > 0) {
      ctx.save()
      ctx.fillStyle = `rgba(220, 230, 255, ${this.lightningFlash * 0.4})`
      ctx.fillRect(0, 0, canvasW, canvasH)
      ctx.restore()
    }
  }
}
