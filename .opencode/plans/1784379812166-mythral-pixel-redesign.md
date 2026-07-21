# Mythral Visual Redesign — Plan (Pixel-Art MMORPG Overhaul)

## Context

Mythral is a working browser MMORPG (React/Vite client + Node/Socket.io authoritative server). **All current visuals are procedural**: tiles drawn with `fillRect` noise on canvas (`client/src/utils/proceduralTiles.js`), entities rendered as colored DOM `<div>`s with Unicode glyphs (`TileMap.jsx`), and a neon/glassmorphism UI (`global.css`/`game.css`) using Cinzel/Rajdhani fonts. There are **zero image/sprite assets** in the game. The server sends only game-state (tile-ID arrays, entity positions, HP, emoji `icon`, hex `color`) — no assets.

**Goal:** Convert the entire visual presentation into a polished, original, classic mobile-MMORPG pixel-art style while preserving 100% of gameplay, networking, backend, data, quests, combat, inventory, crafting, and progression. No copyrighted art; everything generated originally in code.

**Decisions (confirmed with user):**
1. **Procedural pixel-art engine** — a deterministic, code-based asset generator that paints crisp original PNGs (tiles, sprites, UI, FX) at build time. No hand-painted art; no external asset packs.
2. **Full vertical slice first** — build the complete pipeline + assets for **Island 1 (Lumina Isle, grassland)** end-to-end, then replicate the pattern across all 9 islands. Verify the look before mass-expanding.
3. **Full pixel-art conversion** — replace neon/glass UI with a cohesive fantasy pixel-art UI + bitmap pixel font; sprites for everything.

The authoritative server, `shared/*` game logic, `protocol.js`, `combat.js`, `quests.js`, `inventory.js`, and `data/*.json` are **untouched** except for adding an optional `sprite`/asset-key string to `TILE_INFO`/monster/item/class defs (purely additive metadata the client reads).

---

## Architecture Overview

```
Build-time (Node script, no browser):
  scripts/gen-assets.mjs  ──▶  client/public/assets/*.png  (atlas + sheets)
                                      │
Runtime (client):                      │
  AssetRegistry  ──loads──▶  Image() objects (cached, pixelated)
  TileRenderer   ──draws──▶  canvas tilemap (autotiling + variations)
  SpriteRenderer ──draws──▶  entity sprites (players/monsters/npcs) w/ animation
  UISkin         ──CSS +──▶  pixel-art UI chrome + bitmap font
  FXLayer        ──canvas──▶  lighting, weather, particles, day/night, screen shake
```

### Key principles
- **Deterministic generation** (seeded PRNG) so assets are reproducible and can be regenerated/extended.
- **Autotiling**: generate neighbor-rule tile edge variants per tile type with N randomized detail variations; runtime chooses variant from neighbor bitmask + position hash → seamless maps, no repetition.
- **Sprite atlas**: all generated PNGs packed into a few atlases to minimize draw calls / HTTP requests (mobile perf).
- **`imageRendering: 'pixelated'`** already on the tile canvas — preserve and extend to all sprite canvases; render at native integer scale, upscale via CSS transform (already the camera approach).
- **No server changes** for art; only additive `sprite`/palette keys in `shared/` metadata consumed by client.

---

## Phase 0 — Research & Foundation (do first)

Create `docs/ART_DESIGN.md` capturing the agreed art direction: cohesive 32px base tile grid, limited-but-rich master palette per biome, readable silhouettes, consistent light source (top-left), dithering/shading conventions. Document the per-biome palette so all generated assets share hue families. This becomes the spec the generator and future artists follow.

Deliverables:
- `docs/ART_DESIGN.md` — palette, shading rules, silhouette language, naming conventions.
- `client/src/art/palette.js` — master color ramps (base/shadow/mid/light/highlight) per biome + element colors (fire/ice/water/holy/shadow/air) as a single source of truth for the generator.
- `client/src/art/prng.js` — seeded deterministic PRNG + value-noise (reuse `mulberry32` style from existing `islandGenerator.js`).

---

## Phase 1 — Build-time Pixel-Art Generator

New: `scripts/gen-assets.mjs` (Node). To avoid native build issues, use a **pure-JS PNG encoder** (e.g. `pngjs`, which is pure JS / already likely available via deps) rather than `node-canvas`. It imports `client/src/art/palette.js` and `shared/tiles.js` and emits PNGs into `client/public/assets/`.

Generator modules (each a pure function: params → pixel buffer → PNG):
- `gen-tiles.mjs` — for every tile ID in `shared/tiles.js`: base tile + autotile neighbor-rule variants (corner/edge transitions to water/grass/path/etc.) + 3–4 detail variations. Output packed atlas `tiles.png` + `tiles.json` (frame rects).
- `gen-decor.mjs` — trees (multiple species), bushes, flowers, rocks, fences, signs, barrels, crates, lamps, statues, ruins, bridges, mushrooms, cacti, palms, snow piles, lily pads, crystal clusters, etc. Tall/decorative objects drawn with vertical offset so they overlap neighboring tiles correctly.
- `gen-characters.mjs` — 4 class base bodies (warrior/mage/ranger/healer) + layered equipment pieces (helmet, armor, weapon, shield, cape, accessory) composited per class. Each: idle, walk (4–6 frames), run, attack, cast, hurt, death, interact, sit, gather, fish, mine, craft, emote, celebrate — in 4 directions (down/up/left/right; left mirrors right).
- `gen-monsters.mjs` — every monster family by biome (replace emoji `icon` with generated sprite key), each with idle/walk/attack/hurt/death cycles; boss + elite variants; wildlife/pets.
- `gen-ui.mjs` — UI chrome pieces: panel borders (9-slice), buttons, bars (hp/mp/xp), hotbar slots, inventory/equipment frames, icons for items/skills/quests/currency, cursors, minimap frame, window close/max, notification toasts, loading screen art, login/char-select backgrounds, tooltip frame.
- `gen-fx.mjs` — particle sprites (spark, ember, leaf, dust, smoke, snowflake, raindrop, bubble, sparkle), spell effect frames, torch glow, water ripple, shadow blob, damage-number not needed (text).

Output manifest: `client/public/assets/manifest.json` mapping logical keys (e.g. `tile.grass.0`, `char.warrior.walk.down.2`, `ui.icon.sword`) → atlas file + frame rect + anchor offset. This decouples generation from rendering.

Run via `npm run gen:assets` (add to root `package.json` scripts) and as a prebuild step.

---

## Phase 2 — Client Runtime: Asset & Render Systems

New `client/src/art/` runtime:
- `AssetRegistry.js` — loads all atlases once, caches `Image` objects, exposes `getFrame(key)`. Lazy-loads per-island atlases.
- `autotile.js` — computes neighbor bitmask → selects correct tile frame + position-hash variation. Replaces `drawTile`/`drawDecoration` in `proceduralTiles.js`.
- `SpriteAnimator.js` — frame timing, direction, state machine (idle/walk/attack/...), interpolation, object pooling of sprite instances.
- `TileRenderer.js` — rewrites `TileMap.jsx` base-canvas pass to blit sprite frames instead of procedural `fillRect`. Keeps the existing buffer-shift camera technique (proven, performant).
- `EntitySpriteLayer.js` — replaces the DOM `<div>` glyph entities (player/npc/monster/otherPlayers) with canvas-drawn sprites positioned via the same `translate3d` camera transform. Keeps nameplates/HP bars as lightweight DOM or canvas.

Modified files:
- `client/src/components/TileMap.jsx` — swap procedural passes for `TileRenderer` + `EntitySpriteLayer`; keep camera lerp, lighting/weather overlay, click handling, buffer logic.
- `client/src/utils/proceduralTiles.js` — keep as fallback/debug only; primary path is sprite blitting.
- `shared/tiles.js` — additive: each `TILE_INFO` entry gets `sprite: '<key>'` (no behavior change).
- `shared/monsters.js`, `shared/items.js`, `shared/classes.js` — additive `sprite` key per entry (e.g. `icon` stays for fallback; `sprite` drives the renderer). No logic change.

---

## Phase 3 — Enhanced Rendering Pipeline (preserve crisp pixels)

Extend existing `utils/lighting.js` + `utils/weather.js` (already canvas-based, good foundation):
- **Soft ambient lighting + day/night cycle**: drive `timeOfDay` already passed to `TileMap`; add smooth tint gradients, torch point-lights, global illumination tint per biome.
- **Dynamic shadows**: blob shadows under entities + directional shadow from tile features.
- **Bloom / glow**: additive pass for magic/crystal/ lava/torch.
- **Atmospheric fog**, **cloud shadows** drifting.
- **Animated water**: tile-sheet frames cycling (ripple/reflection) instead of static gradient.
- **Weather**: upgrade rain/storm/snow/wind already present; add wind-blown leaves, embers, butterflies, dust, smoke particles as generated FX sprites.
- **Screen shake** on impactful events (boss hits, deaths, level-ups) — add a camera impulse hook.
- **Area transitions / cinematic**: fade/wipe between islands.
- All effects drawn on the existing overlay canvas or a new FX canvas, **crisp pixel** where appropriate (FX can be soft).

Performance (mobile-first 60 FPS):
- Texture atlases (few large PNGs, not hundreds of files).
- Sprite batching via single canvas draws; existing buffer-shift reduces redraws.
- Object pooling for particles/entities.
- Lazy-load per-island atlases; preload on travel.
- Integer-scale upscaling; avoid per-frame allocations.
- Keep `TILE_SIZE=32`; render world at 1x, CSS-transform scale for zoom.

---

## Phase 4 — Full Pixel-Art UI Reskin

Replace neon/glassmorphism with original fantasy pixel-art UI:
- **Bitmap pixel font**: add a pixel font (self-generated from palette or a permissively-licensed pixel font) and scope `--font-display`/`--font-ui` in `global.css`; keep Cinzel only for the title logo if desired.
- **`global.css` + `game.css`**: new palette variables (parchment/gold/wood/stone fantasy tones), 9-slice panel borders from generated `ui.png`, pixel buttons with hover/press states, shimmer as subtle pixel highlight.
- Reskin every window in `components/ui/*`: HUD (portrait, hp/mp/xp bars as pixel bars), Inventory, Equipment, Character, Skills, Quests, Minimap, World Map, Crafting, Trading (future), Chat, Guild (future), Shop, NPC Dialog, Notifications, Tooltips, Loading, Settings, Login, CharSelect. Use generated icons + frames; keep all existing DOM structure/logic.
- **Smooth UI animations, hover effects, responsive layouts, accessibility** (focus states, reduced-motion already partially present — extend).
- **Cursors, transitions, toasts** as generated sprites/CSS.

Files touched: `styles/global.css`, `styles/game.css`, all `components/ui/*.jsx` (visual only — no logic/prop changes where avoidable), `components/screens/*.jsx`.

---

## Phase 5 — Vertical Slice: Island 1 (Lumina Isle)

Apply the full pipeline to **Lumina Isle (grassland, L1–5)** end-to-end:
- Generate grassland biome tile set + autotiles (grass, dark grass, flowers, forest, path, water, bridge, sand, wood/stone floor, walls, door, ruins) + all decorations (trees, bushes, flowers, rocks, fences, signs, barrels, crates, lamps, statue, fountain).
- Generate the 4 class hero sprites with all animations + grassland monster family sprites (rats, dogs, goblins, spiders, wolves, beetles, etc.) + NPC variants (sailor, healer, elder, smith, merchant… as distinct sprite types, not "N" glyph).
- Full UI reskin active.
- Lighting/weather/day-night/world feel on Island 1.
- Verify it runs (`npm run dev`), looks cohesive, holds ~60 FPS.

This is the checkpoint. Review with user, then **replicate the generator config per biome** to roll out Islands 2–9 (already data-driven via `shared/islands.js` biome + `tiles.js` colors). Each subsequent island mainly needs: biome palette + tile/decoration/monster sprite sets generated from the same engine with biome parameters.

---

## Phase 6 — Rollout to All 9 Islands + Extras

- Generate per-biome tile/decoration/monster/NPC sprite sets for Emberfall (volcanic), Frostpeak (snow), Mistwood (magic forest), Sunscar (desert), Tidehaven (coastal), Shadowfen (swamp), Skyreach (cloud), Voidheart (void).
- Towns: building footprints are tile IDs (server `stampBuilding`); add new decoration sprites for taverns, blacksmith, guild hall, magic shop, temple, inn, library, farms, docks, castle. Add `TILE` IDs if needed (docs show pattern `CRYSTAL_PEAK: 28`) — server keeps walkability logic unchanged.
- Seasonal variations: parameter flag in generator for tint/snow-overlay variants (extensible, not required for slice).
- Remove ALL placeholders: retire the procedural `fillRect` tile path as default, remove emoji glyph entities, remove debug artifacts, unused CSS, duplicated textures.

---

## Phase 7 — Asset Management & Expansion Architecture

- `client/src/art/registry.js` + `manifest.json` designed for **expansion packs**: new regions = new atlas + manifest entry; loader keyed by string so adding `tiles/crystal_peak/*` requires zero code changes.
- Document adding new biomes/monsters/items in `docs/DEVELOPMENT.md` (append an "Adding Art" section) and `docs/ART_DESIGN.md`.
- Keep `gen-assets` idempotent & fast; only regenerate changed sets (hash cache) to keep build times low.

---

## Verification

- `npm run gen:assets` produces `client/public/assets/**` + `manifest.json` with no errors.
- `npm run dev` (or `npm run build` + preview) → game loads, Island 1 renders with pixel sprites, camera/lighting/weather work.
- `npm run smoke` + `node scripts/e2e-test.js` still pass (gameplay untouched).
- No console errors; FPS stable (add a simple FPS counter to HUD debug if helpful).
- Visual audit checklist: no emoji-glyph entities remain in-world, no neon UI, all tiles autotile seamlessly, sprites animate in all 4 directions.
- Confirm no copyrighted/derived artwork (all generated from original palette/code).

## Risks / Notes
- **Native canvas in Node**: prefer a pure-JS PNG encoder (`pngjs`) to avoid `node-canvas` native build issues in this environment. Validate early in Phase 1.
- **Volume**: full 9-island + all animations is large; the vertical-slice-first approach de-risks by validating the engine on Island 1 before mass generation.
- **Server untouched** except additive metadata; preserves all multiplayer/backend behavior.
- This is a multi-session effort; Phase 5 is the agreed first deliverable checkpoint.
