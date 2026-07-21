// ============================================================
// Mythral - PriceChart
// Lightweight, dependency-free SVG line chart showing a
// deterministic synthetic price trend for a shop item, with
// selectable timeframes (1H / 6H / 24H / 7D).
// Prices in Mythral are static config values, so the trend is a
// stable seeded random-walk around the item's base price — purely
// a visual aid, no backend/economy changes.
// ============================================================
import React, { useMemo, useState } from 'react'

const TIMEFRAMES = [
  { key: '1H', points: 12, stepMin: 5, label: '1H' },
  { key: '6H', points: 12, stepMin: 30, label: '6H' },
  { key: '24H', points: 24, stepMin: 60, label: '24H' },
  { key: '7D', points: 14, stepMin: 720, label: '7D' },
]

function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildSeries(base, seedKey, tf) {
  const rng = mulberry32(hashStr(seedKey + tf.key))
  const vals = []
  let v = base * (0.82 + rng() * 0.12)
  for (let i = 0; i < tf.points; i++) {
    const drift = (rng() - 0.48) * base * 0.08
    v = Math.max(base * 0.55, Math.min(base * 1.5, v + drift))
    vals.push(v)
  }
  // anchor last point to actual base price
  vals[vals.length - 1] = base
  return vals
}

export default function PriceChart({ basePrice, seedKey }) {
  const [tfKey, setTfKey] = useState('24H')
  const tf = TIMEFRAMES.find(t => t.key === tfKey) || TIMEFRAMES[2]
  const series = useMemo(() => buildSeries(basePrice, seedKey, tf), [basePrice, seedKey, tf])

  const W = 280, H = 90, pad = 6
  const min = Math.min(...series), max = Math.max(...series)
  const range = max - min || 1
  const stepX = (W - pad * 2) / (series.length - 1)
  const pts = series.map((v, i) => {
    const x = pad + i * stepX
    const y = pad + (H - pad * 2) * (1 - (v - min) / range)
    return [x, y]
  })
  const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${H - pad} L ${pts[0][0].toFixed(1)} ${H - pad} Z`
  const up = series[series.length - 1] >= series[0]
  const stroke = up ? 'var(--neon-emerald)' : 'var(--neon-rose)'

  return (
    <div className="price-chart">
      <div className="price-chart-head">
        <span className="price-chart-title text-xs text-dim">Price trend</span>
        <div className="price-chart-tf">
          {TIMEFRAMES.map(t => (
            <button
              key={t.key}
              className={`price-tf-btn ${t.key === tfKey ? 'active' : ''}`}
              onClick={() => setTfKey(t.key)}
            >{t.label}</button>
          ))}
        </div>
      </div>
      <svg className="price-chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H}>
        <defs>
          <linearGradient id="pcfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#pcfill)" />
        <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={stroke} />
      </svg>
      <div className="price-chart-foot text-xs text-dim">
        <span>Low 🪙{Math.round(min)}</span>
        <span>High 🪙{Math.round(max)}</span>
        <span className={up ? 'text-green' : 'text-red'}>{up ? '▲' : '▼'} {(((series[series.length-1]-series[0])/series[0])*100).toFixed(1)}%</span>
      </div>
    </div>
  )
}
