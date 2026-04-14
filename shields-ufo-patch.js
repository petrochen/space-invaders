// ============================================================
// shields-ufo-patch.js
// Agent 3: Shields, UFO, Wave Management, Advanced Scoring
//
// HOW TO MERGE:
//   Search for each "=== MERGE INTO:" marker and insert the
//   code block into the matching section of index.html.
//   Dependencies: expects canvas width as CANVAS_W, and
//   invaders[], createInvadersAtY(), drawSprite() to exist.
// ============================================================


// === MERGE INTO: Constants section ===

var SHIELD_TEMPLATE = [
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
  [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
  [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1]
];

var SHIELD_POSITIONS = [
  { x: 32,  y: 192 },
  { x: 77,  y: 192 },
  { x: 122, y: 192 },
  { x: 167, y: 192 }
];

var UFO_SPRITE = [
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,1,0,0,1,1,0,0,1,1,1,0,0],
  [0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0]
];

var UFO_INTERVAL = 1500; // frames between appearances (~25 seconds at 60fps)
var UFO_SPEED = 1;
var UFO_SCORES = [100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100];

var EXTRA_LIFE_SCORE = 1500;


// === MERGE INTO: Game State section ===

var shields = [];

var ufo = null;           // { x, y, dir, scoreValue } or null
var ufoTimer = 0;
var ufoScoreIndex = 0;
var ufoScorePopup = null; // { x, y, text, timer }

var wave = 1;
var waveStartY = 48;

var extraLifeAwarded = false; // reset each new game


// === MERGE INTO: Functions section ===

// ---- Shield creation ----

function createShields() {
  shields = [];
  for (var i = 0; i < 4; i++) {
    // Deep-copy template so each shield has independent bitmap
    var bitmap = SHIELD_TEMPLATE.map(function(row) { return row.slice(); });
    shields.push({
      x: SHIELD_POSITIONS[i].x,
      y: SHIELD_POSITIONS[i].y,
      bitmap: bitmap
    });
  }
}

// ---- Shield drawing ----

function drawShields(ctx) {
  ctx.fillStyle = '#00FF00';
  for (var si = 0; si < shields.length; si++) {
    var s = shields[si];
    for (var r = 0; r < 16; r++) {
      for (var c = 0; c < 22; c++) {
        if (s.bitmap[r][c]) {
          ctx.fillRect(s.x + c, s.y + r, 1, 1);
        }
      }
    }
  }
}

// ---- Shield-bullet collision (pixel-level erosion) ----
// goingUp: true for player bullet, false for invader bullet
// Returns true if bullet was absorbed by a shield.

function checkBulletShieldCollision(bullet, goingUp) {
  for (var si = 0; si < shields.length; si++) {
    var s = shields[si];
    var lx = Math.floor(bullet.x - s.x);
    var ly = Math.floor(bullet.y - s.y);
    if (lx < 0 || lx >= 22 || ly < 0 || ly >= 16) continue;
    if (s.bitmap[ly] && s.bitmap[ly][lx]) {
      // Erode a 3x3 chunk around the hit point, biased toward entry direction
      var erodeR = 3;
      for (var dy = -erodeR; dy <= erodeR; dy++) {
        // Player bullet enters from bottom (goingUp) — erode upward rows more
        if (goingUp  && dy > 1)  continue;
        // Invader bullet enters from top — erode downward rows more
        if (!goingUp && dy < -1) continue;
        for (var dx = -erodeR; dx <= erodeR; dx++) {
          var ny = ly + dy;
          var nx = lx + dx;
          if (ny >= 0 && ny < 16 && nx >= 0 && nx < 22) {
            s.bitmap[ny][nx] = 0;
          }
        }
      }
      return true; // bullet absorbed
    }
  }
  return false;
}

// ---- Invader-shield collision (invaders destroy shields on overlap) ----

function checkInvaderShieldCollision() {
  for (var ii = 0; ii < invaders.length; ii++) {
    var inv = invaders[ii];
    if (!inv.alive) continue;
    var iw = inv.type.width;
    for (var si = 0; si < shields.length; si++) {
      var s = shields[si];
      // Broad AABB check first
      if (inv.x + iw > s.x && inv.x < s.x + 22 &&
          inv.y + 8  > s.y && inv.y < s.y + 16) {
        // Destroy every shield pixel that overlaps the invader bounding box
        for (var r = 0; r < 16; r++) {
          for (var c = 0; c < 22; c++) {
            var sx = s.x + c;
            var sy = s.y + r;
            if (sx >= inv.x && sx < inv.x + iw &&
                sy >= inv.y && sy < inv.y + 8) {
              s.bitmap[r][c] = 0;
            }
          }
        }
      }
    }
  }
}

// ---- UFO update ----

function updateUFO() {
  if (ufo === null) {
    ufoTimer++;
    if (ufoTimer >= UFO_INTERVAL) {
      ufoTimer = 0;
      var dir = (Math.random() < 0.5) ? 1 : -1;
      ufo = {
        x: dir === 1 ? -16 : CANVAS_W,
        y: 24,
        dir: dir,
        scoreValue: UFO_SCORES[ufoScoreIndex % UFO_SCORES.length]
      };
      ufoScoreIndex++;
      playUFOSiren(); // hook — implement in audio section
    }
    return;
  }

  ufo.x += ufo.dir * UFO_SPEED;

  if (ufo.x < -20 || ufo.x > CANVAS_W + 20) {
    ufo = null;
    stopUFOSiren(); // hook — implement in audio section
  }
}

// ---- UFO-bullet collision ----
// Returns { points, x, y } if UFO was hit, null otherwise.

function checkBulletUFOCollision(bullet) {
  if (!ufo) return null;
  if (bullet.x >= ufo.x      && bullet.x <= ufo.x + 16 &&
      bullet.y >= ufo.y      && bullet.y <= ufo.y + 7) {
    var result = { points: ufo.scoreValue, x: ufo.x, y: ufo.y };
    ufoScorePopup = {
      x: ufo.x,
      y: ufo.y,
      text: '' + ufo.scoreValue,
      timer: 60
    };
    stopUFOSiren(); // hook — implement in audio section
    ufo = null;
    return result;
  }
  return null;
}

// ---- UFO drawing ----

function drawUFO(ctx) {
  if (ufo) {
    drawSprite(ctx, UFO_SPRITE, ufo.x, ufo.y, '#FF0000', 1);
  }
  // Score popup after UFO destruction
  if (ufoScorePopup) {
    ufoScorePopup.timer--;
    ctx.save();
    ctx.fillStyle = '#FF0000';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ufoScorePopup.text, ufoScorePopup.x + 8, ufoScorePopup.y + 4);
    ctx.restore();
    if (ufoScorePopup.timer <= 0) ufoScorePopup = null;
  }
}

// ---- Extra life check ----
// Call once per frame after score update.

function checkExtraLife() {
  if (!extraLifeAwarded && score >= EXTRA_LIFE_SCORE) {
    extraLifeAwarded = true;
    lives++;
    playExtraLife(); // hook — implement in audio section
  }
}

// ---- Wave management ----

function startNewWave() {
  wave++;
  // Each wave starts 8px lower, capped so invaders don't start below playfield
  waveStartY = Math.min(48 + (wave - 1) * 8, 88);
  invaders = createInvadersAtY(waveStartY);
  createShields(); // shields reset each wave
  invaderDir = 1;
  invaderStepTimer = 0;
  invaderBullets = [];
  ufo = null;
  ufoTimer = 0;
  stopUFOSiren(); // hook — implement in audio section
}

// ---- New game reset (call from initGame) ----

function resetShieldsUFOWave() {
  wave = 1;
  waveStartY = 48;
  ufo = null;
  ufoTimer = 0;
  ufoScoreIndex = 0;
  ufoScorePopup = null;
  extraLifeAwarded = false;
  createShields();
  stopUFOSiren(); // hook — implement in audio section
}

// ---- Audio stubs (no-ops until audio section implements them) ----
// These prevent ReferenceErrors if audio is not yet wired up.

if (typeof playUFOSiren  === 'undefined') { var playUFOSiren  = function() {}; }
if (typeof stopUFOSiren  === 'undefined') { var stopUFOSiren  = function() {}; }
if (typeof playExtraLife === 'undefined') { var playExtraLife = function() {}; }
