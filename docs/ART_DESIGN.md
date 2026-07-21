# Mythral — Art Design Specification

This document is the single source of truth for the visual identity of Mythral's
pixel-art presentation. All assets are **generated procedurally in code**
(`client/src/art/` + `scripts/gen-assets.mjs`) — there are no hand-painted or
external image files, and nothing is derived from any existing game.

## Design pillars
- **Classic mobile MMORPG nostalgia** — readable, charming, vibrant fantasy.
- **32px native tile grid**, crisp pixels, integer-scale upscaling only.
- **Top-left light source** — consistent highlights top/left, shadows bottom/right.
- **Limited but rich palettes** — each material has a 5-stop ramp (base → shadow → mid → light → highlight) defined in `client/src/art/palette.js`.
- **Dithering** for smooth gradients in a pixel-friendly way (Bayer-ish / noise).
- **Autotiling** — tiles connect seamlessly via neighbor-rule variants + per-cell detail variation to kill repetition.

## Biome palettes
Defined in `palette.js` (`BIOME_TINT`). Each island reuses shared material ramps but
the generator can shift hue/value per biome (e.g. grassland vs volcanic).

## Sprite conventions
- Characters: ~24–28px tall bodies on a 32×40 canvas, feet anchored at bottom-center.
- 4 directions (down / up / left / right); left is a mirror of right.
- Animation states: idle, walk (4–6f), run, attack, cast, hurt, death, interact, sit, gather, fish, mine, craft, emote, celebrate.
- Monsters: same direction model, idle/walk/attack/hurt/death.

## Asset pipeline
1. `scripts/gen-assets.mjs` runs at build time → emits PNGs + `manifest.json` into `client/public/assets/`.
2. `client/src/art/registry.js` loads atlases and exposes `getFrame(key)`.
3. Renderer (`TileRenderer`, `EntitySpriteLayer`) blits frames; nothing references raw files directly.

## Expansion
New regions/biomes = new generator config + new atlas entries. The string-keyed
manifest means **zero code changes** to add content.
