# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-file browser Space Invaders game. No build step, no dependencies. The entire game is `index.html`.

Live: https://invaders.petrochenko.info (Cloudflare Pages, project name `space-invaders`)

## Deploy

```bash
npx wrangler pages deploy . --project-name space-invaders --branch main --commit-dirty=true
```

## Key Design Decisions

1. **All coordinates are integers** — no fractional tile positions
2. **State transitions via frame counters** — no setTimeout for game state
3. **Move-first, then collide** — entities move, then collision checks
4. **One movement owner per entity** — no two systems writing same position
5. **Sprites as pixel arrays** — rendered to canvas with scaling
6. **Shields as bitmaps** — 2D boolean array, pixel-level collision
7. **Overlay for start/gameover** — HTML elements, not canvas-drawn
8. **Button starts game** — not full-screen tap, blur after click
9. **initGame sets ALL vars before calling dependent functions**

## Architecture

Everything lives in `index.html`. Sections:

1. CSS — responsive layout, overlays, D-pad
2. HTML — canvas, score header, lives, overlay, D-pad
3. Constants — dimensions, sprites, speed tables, colors
4. Game State — score, lives, wave, entities, timers
5. Sprites — pixel art arrays for invaders (2 frames), player, UFO
6. Entities — createPlayer, createInvaders, createShields, createUFO
7. Movement — player, invader formation (step+drop), UFO, bullets
8. Collision — AABB for bullets, pixel-level for shields
9. Shield System — bitmap per shield, erosion
10. Drawing — sprites, shields, bullets, explosions, colored regions
11. Overlay — HTML start/gameover
12. Input — keyboard (arrows+space), D-pad, touch
13. Game Logic — fire, wave complete, death, scoring, extra life
14. Audio — Web Audio: march loop, shoot, death, UFO siren
15. Game Loop — fixed timestep (STEP=1000/60), accumulator
16. Init — canvas, localStorage, resize

## Game Specs (1978 Taito original)

- **Formation**: 5 rows x 11 cols = 55 invaders
- **Types**: Squid (30pts), Crab (20pts), Octopus (10pts)
- **Player bullet**: 1 on screen at a time, 5px/frame
- **Invader bullets**: max 3, 2px/frame, fire from bottom of column
- **Shields**: 4 bunkers, pixel-level erosion, reset each wave
- **UFO**: every ~25s, scoring cycle 50/100/150/300
- **Lives**: 3, extra at 1500 points
- **Speed**: scales with remaining invader count
