// invaders-patch.js
// Agent 2: Invaders + Movement + Bullets
// Merge this file into index.html at the markers below.
// All coordinates are integers. No setTimeout for state transitions.
// Move-first architecture: entities move, then collision checks run.

// === MERGE INTO: Constants section ===
// (paste after existing constants)

var INVADER_BULLET_SPEED = 2;
var MAX_INVADER_BULLETS = 3;
var INVADER_FIRE_INTERVAL_BASE = 90; // frames between shots at full formation

// Squid sprite — 8x8, top row, 30 points
var SQUID_A = [
  [0,0,0,1,1,0,0,0],
  [0,0,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,0],
  [1,1,0,1,1,0,1,1],
  [1,1,1,1,1,1,1,1],
  [0,0,1,0,0,1,0,0],
  [0,1,0,1,1,0,1,0],
  [1,0,1,0,0,1,0,1]
];
var SQUID_B = [
  [0,0,0,1,1,0,0,0],
  [0,0,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,0],
  [1,1,0,1,1,0,1,1],
  [1,1,1,1,1,1,1,1],
  [0,1,0,0,0,0,1,0],
  [1,0,0,1,1,0,0,1],
  [0,1,0,0,0,0,1,0]
];

// Crab sprite — 11x8, middle rows (1-2), 20 points
var CRAB_A = [
  [0,0,1,0,0,0,0,0,1,0,0],
  [0,0,0,1,0,0,0,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,0,0],
  [0,1,1,0,1,1,1,0,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,0,1,1,1,1,1,1,1,0,1],
  [1,0,1,0,0,0,0,0,1,0,1],
  [0,0,0,1,1,0,1,1,0,0,0]
];
var CRAB_B = [
  [0,0,1,0,0,0,0,0,1,0,0],
  [1,0,0,1,0,0,0,1,0,0,1],
  [1,0,1,1,1,1,1,1,1,0,1],
  [1,1,1,0,1,1,1,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,1,1,1,0],
  [0,0,1,0,0,0,0,0,1,0,0],
  [0,1,0,0,0,0,0,0,0,1,0]
];

// Octopus sprite — 12x8, bottom rows (3-4), 10 points
var OCTOPUS_A = [
  [0,0,0,0,1,1,1,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,0,0,1,1,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,1,1,0,0,1,1,0,0,0],
  [0,0,1,1,0,1,1,0,1,1,0,0],
  [1,1,0,0,0,0,0,0,0,0,1,1]
];
var OCTOPUS_B = [
  [0,0,0,0,1,1,1,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,0,0,1,1,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,0,1,1,0,1,1,0,0],
  [0,1,0,0,1,0,0,1,0,0,1,0],
  [0,0,1,1,0,0,0,0,1,1,0,0]
];

// Explosion sprite — 12x8, shown for 10 frames on invader death
var INVADER_EXPLOSION = [
  [0,0,0,1,0,0,1,0,0,0,0,0],
  [1,0,0,0,0,0,0,0,0,0,0,1],
  [0,1,0,0,0,1,0,0,0,0,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,0,0,0,0,0,0,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,0,0,0,1,0,0,0,0,1,0],
  [1,0,0,0,0,0,0,0,0,0,0,1]
];

// Invader type descriptors — referenced by createInvaders()
var INVADER_TYPES = [
  { sprite: [SQUID_A,   SQUID_B],   points: 30, width: 8  }, // row 0 — top
  { sprite: [CRAB_A,    CRAB_B],    points: 20, width: 11 }, // row 1
  { sprite: [CRAB_A,    CRAB_B],    points: 20, width: 11 }, // row 2
  { sprite: [OCTOPUS_A, OCTOPUS_B], points: 10, width: 12 }, // row 3
  { sprite: [OCTOPUS_A, OCTOPUS_B], points: 10, width: 12 }  // row 4 — bottom
];


// === MERGE INTO: Game State section ===
// (add to existing state vars, inside or alongside initGame())

var invaders        = [];
var invaderBullets  = [];
var invaderDir      = 1;   // 1 = right, -1 = left
var invaderStepTimer  = 0;
var invaderAnimFrame  = 0; // 0 or 1 — toggles on every step
var invaderMoveInterval = 60; // frames between steps; shrinks as invaders die
var invaderFireTimer  = 0;


// === MERGE INTO: Functions section ===
// (add these functions; they reference CANVAS_W, GROUND_Y, PLAYER_Y
//  which must be defined in the Constants / State sections of index.html)

// ------------------------------------------------------------------
// createInvaders()
// Build the 5×11 formation. Call once per wave inside initGame().
// Wave number (0-based) determines starting Y offset (each wave starts
// 16px lower, clamped so they never start below the shield row).
// ------------------------------------------------------------------
function createInvaders(wave) {
  wave = wave || 0;
  var startY = 48 + Math.min(wave, 5) * 16; // each wave 16px lower, cap at 5
  var result = [];
  for (var row = 0; row < 5; row++) {
    for (var col = 0; col < 11; col++) {
      result.push({
        row:       row,
        col:       col,
        x:         26 + col * 16, // 16px column spacing
        y:         startY + row * 16, // 16px row spacing
        type:      INVADER_TYPES[row],
        alive:     true,
        exploding: 0 // counts down from 10 to 0
      });
    }
  }
  return result;
}

// ------------------------------------------------------------------
// resetInvaderState()
// Call at the start of each wave (inside initGame / wave-reset logic).
// ------------------------------------------------------------------
function resetInvaderState(wave) {
  invaders           = createInvaders(wave);
  invaderBullets     = [];
  invaderDir         = 1;
  invaderStepTimer   = 0;
  invaderAnimFrame   = 0;
  invaderMoveInterval = 60;
  invaderFireTimer   = 0;
}

// ------------------------------------------------------------------
// moveInvaders()
// Call once per game-logic frame. Handles step timing, edge detection,
// drop, direction reversal, and speed scaling.
// ------------------------------------------------------------------
function moveInvaders() {
  invaderStepTimer++;
  if (invaderStepTimer < invaderMoveInterval) return;
  invaderStepTimer = 0;
  invaderAnimFrame = 1 - invaderAnimFrame; // toggle sprite frame

  // Determine whether the formation would hit a wall on the next step
  var shouldDrop = false;
  for (var i = 0; i < invaders.length; i++) {
    var inv = invaders[i];
    if (!inv.alive) continue;
    var nextX = inv.x + invaderDir * 2; // 2px step
    if (nextX <= 4 || nextX + inv.type.width * 2 >= CANVAS_W - 4) {
      shouldDrop = true;
      break;
    }
  }

  if (shouldDrop) {
    // Drop the whole formation 8px, then reverse horizontal direction
    for (var i = 0; i < invaders.length; i++) {
      if (invaders[i].alive) invaders[i].y += 8;
    }
    invaderDir *= -1;
  } else {
    // Move all living invaders horizontally
    for (var i = 0; i < invaders.length; i++) {
      if (invaders[i].alive) invaders[i].x += invaderDir * 2;
    }
  }

  // Recalculate speed: 55 alive → 60 frames interval; 1 alive → 2 frames
  var alive = 0;
  for (var i = 0; i < invaders.length; i++) {
    if (invaders[i].alive) alive++;
  }
  invaderMoveInterval = Math.max(2, Math.floor(alive * 60 / 55));
}

// ------------------------------------------------------------------
// fireInvaderBullet()
// Call each frame (after incrementing invaderFireTimer).
// Fires from the bottom-most alive invader in a random column.
// ------------------------------------------------------------------
function fireInvaderBullet() {
  // Dynamic fire interval: matches invaderMoveInterval so fast-moving
  // formations also fire faster.
  var fireInterval = Math.max(30, invaderMoveInterval * 2);
  invaderFireTimer++;
  if (invaderFireTimer < fireInterval) return;
  if (invaderBullets.length >= MAX_INVADER_BULLETS) return;
  invaderFireTimer = 0;

  // Collect the bottom-most alive invader per column
  var shooters = [];
  for (var c = 0; c < 11; c++) {
    var bottomInv = null;
    for (var r = 4; r >= 0; r--) {
      var inv = invaders[r * 11 + c];
      if (inv && inv.alive) { bottomInv = inv; break; }
    }
    if (bottomInv) shooters.push(bottomInv);
  }
  if (shooters.length === 0) return;

  var shooter = shooters[Math.floor(Math.random() * shooters.length)];
  invaderBullets.push({
    x:     shooter.x + Math.floor(shooter.type.width), // center (scale=2, so width*2/2 = width)
    y:     shooter.y + 16, // bottom of sprite (8px * scale 2)
    speed: INVADER_BULLET_SPEED,
    type:  Math.floor(Math.random() * 3) // 0=rolling, 1=plunger, 2=squiggly (visual only)
  });
}

// ------------------------------------------------------------------
// moveInvaderBullets()
// Call once per game-logic frame. Removes bullets that pass GROUND_Y.
// ------------------------------------------------------------------
function moveInvaderBullets() {
  for (var i = invaderBullets.length - 1; i >= 0; i--) {
    invaderBullets[i].y += invaderBullets[i].speed;
    if (invaderBullets[i].y > GROUND_Y) {
      invaderBullets.splice(i, 1);
    }
  }
}

// ------------------------------------------------------------------
// checkBulletInvaderCollision(bullet)
// AABB test between one player bullet and all living invaders.
// Scale factor 2 applied to sprite dimensions.
// Returns the invader object if hit (and marks it), null otherwise.
// ------------------------------------------------------------------
function checkBulletInvaderCollision(bullet) {
  var SCALE = 2;
  var SPRITE_H = 8 * SCALE; // all invader sprites are 8 rows tall
  for (var i = 0; i < invaders.length; i++) {
    var inv = invaders[i];
    if (!inv.alive || inv.exploding > 0) continue;
    var iw = inv.type.width * SCALE;
    if (bullet.x >= inv.x && bullet.x <= inv.x + iw &&
        bullet.y >= inv.y && bullet.y <= inv.y + SPRITE_H) {
      inv.alive     = false;
      inv.exploding = 10; // 10-frame explosion display
      return inv;         // caller uses inv.type.points for scoring
    }
  }
  return null;
}

// ------------------------------------------------------------------
// checkInvaderBulletPlayerCollision(playerObj)
// Returns the invader bullet that hit the player, or null.
// playerObj: { x, y, width, height } — all in canvas pixels.
// Call after moveInvaderBullets(), before drawing.
// ------------------------------------------------------------------
function checkInvaderBulletPlayerCollision(playerObj) {
  for (var i = invaderBullets.length - 1; i >= 0; i--) {
    var b = invaderBullets[i];
    if (b.x >= playerObj.x && b.x <= playerObj.x + playerObj.width &&
        b.y >= playerObj.y && b.y <= playerObj.y + playerObj.height) {
      invaderBullets.splice(i, 1);
      return b;
    }
  }
  return null;
}

// ------------------------------------------------------------------
// checkInvadersReachedBottom()
// Returns true when any alive invader has descended to the player row.
// PLAYER_Y must be defined in the constants/state section.
// ------------------------------------------------------------------
function checkInvadersReachedBottom() {
  var SCALE = 2;
  for (var i = 0; i < invaders.length; i++) {
    if (invaders[i].alive && invaders[i].y + 8 * SCALE >= PLAYER_Y) {
      return true;
    }
  }
  return false;
}

// ------------------------------------------------------------------
// isWaveComplete()
// Returns true when every invader is dead (alive=false).
// Exploding invaders are treated as dead for wave-completion purposes.
// ------------------------------------------------------------------
function isWaveComplete() {
  for (var i = 0; i < invaders.length; i++) {
    if (invaders[i].alive) return false;
  }
  return true;
}

// ------------------------------------------------------------------
// drawInvaders(ctx, drawSprite)
// drawSprite(pixelArray, x, y, color, scale) is provided by the
// scaffold agent's sprite rendering system.
// ------------------------------------------------------------------
function drawInvaders(ctx, drawSprite) {
  for (var i = 0; i < invaders.length; i++) {
    var inv = invaders[i];
    if (inv.exploding > 0) {
      inv.exploding--;
      drawSprite(INVADER_EXPLOSION, inv.x, inv.y, '#ffffff', 2);
      continue;
    }
    if (!inv.alive) continue;
    var sprite = inv.type.sprite[invaderAnimFrame];
    drawSprite(sprite, inv.x, inv.y, '#ffffff', 2);
  }
}

// ------------------------------------------------------------------
// drawInvaderBullets(ctx)
// Each bullet is a 2×6 white rectangle regardless of visual type.
// (Visual type differentiation can be added in Phase 2 polish.)
// ------------------------------------------------------------------
function drawInvaderBullets(ctx) {
  ctx.fillStyle = '#ffffff';
  for (var i = 0; i < invaderBullets.length; i++) {
    var b = invaderBullets[i];
    ctx.fillRect(b.x, b.y, 2, 6);
  }
}

// ------------------------------------------------------------------
// tickInvaders()
// Convenience wrapper — call once per game-logic frame from the game loop.
// Replaces four separate calls when caller doesn't need granular control.
// ------------------------------------------------------------------
function tickInvaders() {
  moveInvaders();
  fireInvaderBullet();
  moveInvaderBullets();
}
