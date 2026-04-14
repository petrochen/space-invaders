# Space Invaders — Implementation Plan

## Lessons from Tetris & Pac-Man

### What went wrong (avoid repeating)

| Problem                                       | Root Cause                                         | Prevention                                                          |
| --------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| Pac-Man couldn't move                         | Entity at 13.5\*CELL, not grid-aligned             | **All positions must be integer pixels from the start**             |
| Ghost movement snap-back loop                 | Decided direction then moved (snap overwrote move) | **Move-first architecture: move → detect tile transition → decide** |
| canMove() ceil-1 bug                          | Wrong bounding box formula                         | **Use simple floor-based AABB collision from day 1**                |
| Ghost house exit overwritten by bounce        | Two systems writing same position                  | **Each entity has exactly ONE movement owner per frame**            |
| Dead state hung forever                       | setTimeout in sync simulation                      | **State transitions via frame counters, not setTimeout**            |
| initGame called initMaze before setting level | Order of initialization                            | **Set ALL state vars before calling dependent functions**           |
| `</script>` in JS comment broke test.html     | HTML parser sees tags in comments                  | **Never write HTML tags in JS strings/comments**                    |

### What worked well (keep doing)

- Single index.html, no build step, no dependencies
- Fixed timestep game loop with accumulator (`STEP = 1000/60`)
- HTML overlay for start/gameover (not canvas-drawn)
- Real button for start (not full-screen tap)
- Responsive CSS with breakpoints for phone sizes
- `Press Start 2P` font
- Web Audio API synthesizer
- Cloudflare Pages deploy
- Automated test suite from day 1
- Simulation fuzzer catches bugs unit tests miss

---

## Original 1978 Taito Space Invaders — Specs

### Screen

- 256x224 pixels (vertical orientation)
- We'll use a canvas that scales to fit, similar to Pac-Man approach

### Player (Laser Base)

- 13x8 pixels, moves horizontally only
- Speed: 2px/frame
- **1 bullet on screen at a time** (core mechanic)
- Bullet speed: 5px/frame upward

### Invader Formation (5 rows x 11 columns = 55)

| Row          | Type    | Points | Sprite                       |
| ------------ | ------- | ------ | ---------------------------- |
| 1 (top)      | Squid   | 30     | 8px wide, 2-frame animation  |
| 2-3          | Crab    | 20     | 11px wide, 2-frame animation |
| 4-5 (bottom) | Octopus | 10     | 12px wide, 2-frame animation |

### Invader Movement

- Move as a block: step right → step right → ... → hit edge → drop 8px → reverse
- Speed increases as invaders die (fewer invaders = faster cycle)
- Last invader: very fast (2-3x)
- 2-frame sprite animation toggles with each step

### Invader Bullets

- 3 types: rolling, plunger, squiggly (visual only, same logic)
- Max 3 on screen simultaneously
- Speed: ~2px/frame
- Fire from bottom-most invader in a random column
- Fire rate increases as invaders die

### Shields (4 bunkers)

- Positioned evenly across playfield
- Pixel-level erosion: both player and invader bullets destroy chunks
- Reset each new wave

### Mystery Ship (UFO)

- Appears every ~25 seconds, crosses top of screen
- Alternates left/right direction
- Scoring cycle: 50 → 100 → 150 → 300 (based on shot count, deterministic)
- Speed: 2px/frame

### Scoring & Lives

- 3 lives, extra life at 1,500 points
- High score persisted in localStorage
- Game over: all lives lost OR invaders reach player row

### Sound (4 elements)

1. **March** — 4-note bass loop (C3-B2-Bb2-A2), tempo synced to invader speed
2. **Shoot** — sharp white noise burst
3. **Invader death** — descending chirp
4. **UFO** — oscillating siren (ascending/descending)
5. **Player death** — long descending tone

### Colors (screen regions)

- Top: white (score, UFO area)
- Upper: red (UFO)
- Middle: white (invaders)
- Lower: green (shields, player)
- Bottom: green line (ground)

### Level Progression

- Infinite waves, shields reset each wave
- Each new wave starts 1 row lower
- Speed is always based on remaining invader count

---

## Architecture

```
index.html (~1500 lines)
├── CSS — responsive layout, overlays
├── HTML — canvas, score header, lives, overlay, D-pad, kb-hint
└── JS
    ├── Constants — dimensions, sprite data, speed tables, colors
    ├── Game State — score, lives, wave, entities, timers
    ├── Resize — scale canvas to viewport
    ├── Sprites — pixel art arrays for invaders (2 frames each), player, UFO, shields
    ├── Entity Creation — createPlayer, createInvaders, createShields, createUFO
    ├── Movement — movePlayer, moveInvaders (step+drop), moveUFO, moveBullets
    ├── Collision — AABB for bullets vs invaders/player/UFO, pixel-level for shields
    ├── Shield System — bitmap per shield, erosion on hit
    ├── Drawing — drawSprite, drawShields (from bitmap), drawBullets, drawExplosions
    ├── Overlay — HTML start/gameover with button
    ├── Input — keyboard (arrows+space), D-pad (left/right/fire), touch
    ├── Game Logic — fire, collision checks, wave complete, death, scoring
    ├── Particles — simple explosion sprites (4-frame)
    ├── Audio — Web Audio: march loop, shoot, invader death, UFO siren, player death
    ├── Game Loop — fixed timestep, accumulator
    └── Init — canvas, localStorage high score, resize
```

---

## Task Breakdown (for agent team)

### Phase 0: Infrastructure (me, before agents)

- [ ] P0-1: Create git repo + GitHub (`petrochen/space-invaders`)
- [ ] P0-2: Deploy to Cloudflare Pages (`space-invaders` project)
- [ ] P0-3: Create DNS CNAME `invaders.petrochenko.info`
- [ ] P0-4: Bind custom domain in Pages
- [ ] P0-5: Create CLAUDE.md

### Phase 1: Core Game (3 parallel agents)

**Agent 1 — Scaffold + Player + Rendering**

- HTML structure (canvas, header, overlay, D-pad)
- CSS responsive layout (reuse Pac-Man breakpoints)
- Canvas setup, resize logic
- Sprite rendering system (pixel arrays → canvas)
- Player ship: create, draw, move left/right
- Player bullet: fire (1 at a time), move, draw
- Score/lives display
- Game loop (fixed timestep)
- Start screen overlay with INSERT COIN button
- Keyboard + D-pad input

**Agent 2 — Invaders + Movement + Bullets**

- Invader formation: 5x11 grid, 3 types
- Sprite data: 2-frame pixel art for squid/crab/octopus
- Formation movement: step → edge detect → drop → reverse
- Speed scaling based on alive count
- Invader bullets: 3 types, fire from bottom of random column
- Max 3 bullets on screen
- Fire rate scaling
- Death animation (explosion sprite, 4 frames)

**Agent 3 — Shields + UFO + Scoring**

- Shield system: 4 bunkers as pixel bitmaps
- Pixel-level erosion (player bullet removes top chunk, invader removes bottom)
- Shield drawing from bitmap
- UFO: timing, movement, deterministic scoring cycle
- UFO siren sound
- Scoring: per type, UFO cycle, extra life at 1500
- High score localStorage
- Wave completion: reset shields, start lower
- Game over: lives=0 or invaders reach bottom

### Phase 2: Polish (2 parallel agents)

**Agent 4 — Audio**

- 4-note march bass loop synced to invader speed
- Shoot sound (white noise burst)
- Invader death chirp
- UFO oscillating siren
- Player death descending tone
- Explosion sound

**Agent 5 — Tests + Visuals**

- Color regions (red top, white middle, green bottom)
- Ground line
- Explosion particles
- test.html with unit tests + simulation fuzzer
- Lives display as ship sprites

### Phase 3: Integration & Deploy

- [ ] Merge all agents
- [ ] Resolve conflicts
- [ ] Playtesting
- [ ] Fix bugs
- [ ] Final deploy
- [ ] Update CLAUDE.md, README.md

---

## Key Design Decisions (pre-agreed)

1. **All coordinates are integers** — no 13.5 \* CELL nonsense
2. **State transitions via frame counters** — no setTimeout for game state
3. **Move-first, then collide** — entities move, then we check collisions
4. **One movement owner per entity** — no two systems writing the same position
5. **Sprites as pixel arrays** — `[[0,1,1,0],[1,1,1,1],...]` rendered to canvas with scaling
6. **Shields as bitmaps** — 2D boolean array, pixel-level collision
7. **Overlay for start/gameover** — HTML elements, not canvas-drawn
8. **Button starts game** — not full-screen tap
9. **Blur button after click** — prevent keyboard capture
10. **initGame sets ALL vars before calling dependent functions**
11. **Test suite from commit 1** — unit tests + fuzzer built alongside game

---

## File Deliverables

```
space-invaders/
├── index.html      — complete game
├── test.html       — automated tests + fuzzer
├── CLAUDE.md       — project guide for Claude Code
├── README.md       — project documentation
├── BACKLOG.md      — feature tracking
├── .gitignore      — .DS_Store, .wrangler
└── PLAN.md         — this file
```
