// ============================================================
// Mythral Art - Sprite Animator + Entity renderer
// Renders players/monsters/npcs as pixel sprites on canvas with
// animation state, direction, frame timing. Object-pooled.
// ============================================================
import { drawFrame, getFrame, isLoaded } from './registry.js'

// Map server monster icon/name -> generated sprite base key
// (grassland family; others fall back gracefully)
const MONSTER_SPRITE = {
  '🐀': 'mon.rat', '🐕': 'mon.wild_dog', '👺': 'mon.goblin', '🕷': 'mon.spider',
  '🐺': 'mon.wolf', '🪲': 'mon.beetle', '🟢': 'mon.slime', '🔥': 'mon.boss_giant',
  '👹': 'mon.boss_giant', '👿': 'mon.boss_giant', '👾': 'mon.boss_giant',
}

const CLASS_SPRITE = {
  warrior: 'char.warrior', mage: 'char.mage', ranger: 'char.ranger', healer: 'char.healer',
}

const STATE_FRAMES = { idle: 2, walk: 4, attack: 3, cast: 3, hurt: 2, death: 4 }

export function monsterSpriteKey(icon) {
  return MONSTER_SPRITE[icon] || 'mon.slime'
}
export function classSpriteKey(cls) {
  return CLASS_SPRITE[cls] || 'char.warrior'
}
export function npcSpriteKey(role) {
  return `npc.${role || 'default'}`
}

function dirToKey(facing) {
  if (facing === 'left' || facing === 'right') return 'side'
  if (facing === 'up') return 'up'
  return 'down'
}

// Determine animation state from entity flags
export function entityState(entity, isPlayer) {
  if (entity.dead || entity.hp <= 0) return 'death'
  if (entity.attacking) return 'attack'
  if (entity.casting) return 'cast'
  if (entity.hurtTime && Date.now() - entity.hurtTime < 250) return 'hurt'
  if (entity.moving || (isPlayer && entity.isWalking)) return 'walk'
  return 'idle'
}

// Draw an entity sprite. Returns true if drawn.
// ctx: canvas 2d, entity: {x,y,facing,...}, px,py: screen px of tile top-left, S: tile size
export function drawEntity(ctx, entity, px, py, S, time, opts = {}) {
  if (!isLoaded()) return false
  const scale = S / 32
  const kind = entity._kind
  let base, h
  if (kind === 'npc') {
    base = npcSpriteKey(entity.role)
    h = 40
  } else if (kind === 'mon' || (!entity.classDef && entity.icon)) {
    base = monsterSpriteKey(entity.icon)
    h = 32
  } else {
    base = classSpriteKey(entity.classDef?.name?.toLowerCase?.() || entity.class)
    h = 40
  }

  const dir = dirToKey(entity.facing)
  const flip = entity.facing === 'left'
  const state = entityState(entity, kind === 'me') || 'idle'
  const frames = STATE_FRAMES[state] || 2

  const gender = entity.gender || 'male'

  // frame timing
  const speed = state === 'walk' ? 0.18 : state === 'attack' ? 0.3 : state === 'death' ? 0.12 : 0.1
  const t = Math.floor((time * speed) + (entity._animSeed || 0)) % frames
  const key = `${base}.${gender}.${state}.${dir}.${t}`

  const fr = getFrame(key) || getFrame(`${base}.${gender}.idle.${dir}.0`) || getFrame(`${base}.male.idle.${dir}.0`) || getFrame(`${base}.male.idle.down.0`)
  if (!fr) return false

  // anchor: feet at bottom-center of the entity tile
  const drawW = fr.sw * scale
  const drawH = fr.sh * scale
  const dx = px + S / 2 - drawW / 2
  const dy = py + S - drawH
  return drawFrame(ctx, key, dx, dy, scale, flip)
}
