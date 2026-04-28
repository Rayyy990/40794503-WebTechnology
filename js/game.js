// ═══════════════════════════════════════════════════════
//  game.js — Core game loop, entities, input
//  Reality Distortion — Phase 2
//
//  Depends on: audio.js, particles.js, ui.js
// ═══════════════════════════════════════════════════════

//  Canvas 
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

//  Game State 
let player, chasers = [], falls = [], stars = [];
let keys        = {};
let gameRunning = false;
let paused      = false;
let animId;
let difficulty  = 'normal';
let score       = 0;
let highScore   = 0;
let waveCount   = 0;

let distortionInterval, waveInterval, fallInterval;
let removalTimeouts = [];

let currentEffect = 'None';
let shakeX = 0, shakeY = 0, shakeDecay = 0;
let lastTime = 0, deltaTime = 0;

window.screenShakeEnabled = true;

const EFFECTS = [
  'Reverse Controls',
  'Color Inversion',
  'Random Movement',
  'Speed Boost',
  'Screen Shake'
];

//  Read difficulty from URL 
(function readDifficulty() {
  const params = new URLSearchParams(window.location.search);
  difficulty = params.get('difficulty') || 'normal';
})();

//  Stars 
function initStars() {
  stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x:       Math.random() * canvas.width,
      y:       Math.random() * canvas.height,
      r:       Math.random() * 1.2 + 0.2,
      alpha:   Math.random() * 0.5 + 0.1,
      twinkle: Math.random() * Math.PI * 2,
      speed:   Math.random() * 0.02 + 0.005
    });
  }
}

function drawStars() {
  stars.forEach(s => {
    s.twinkle += s.speed;
    const a = s.alpha * (0.6 + 0.4 * Math.sin(s.twinkle));
    ctx.globalAlpha = a;
    ctx.fillStyle   = '#fff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

//  Init 
function init() {
  clearInterval(distortionInterval);
  clearInterval(waveInterval);
  clearInterval(fallInterval);
  removalTimeouts.forEach(t => clearTimeout(t));
  if (effectClearTimer) { clearTimeout(effectClearTimer); effectClearTimer = null; }
  removalTimeouts = [];
  cancelAnimationFrame(animId);

  player = {
    x:     canvas.width  / 2,
    y:     canvas.height / 2,
    r:     18,
    speed: 4,
    trail: []
  };

  chasers = []; falls = [];
  clearParticles();
  score = 0; waveCount = 0; nextWaveId = 0;
  gameRunning = true; paused = false;
  currentEffect = 'None';
  shakeDecay = 0;

  updateEffectHUD('None');
  updateScore(0);
  initStars();
  playBGM();

  spawnWave();
  startWaveSystem();
  startFalling();
  startDistortion();

  lastTime = performance.now();
  gameLoop(lastTime);
}

//  Waves 
// Each chaser carries a waveId so we can remove exactly
// the right group even after earlier groups have been removed.
let nextWaveId = 0;

function spawnWave() {
  waveCount++;
  playWaveSound();
  showWaveBanner();

  const count     = difficulty === 'easy' ? 2 : difficulty === 'normal' ? 3 : 4;
  const baseSpeed = difficulty === 'easy' ? 0.9 : difficulty === 'normal' ? 1.3 : 1.8;
  const waveId    = nextWaveId++;

  for (let i = 0; i < count; i++) {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
      case 0: x = Math.random() * canvas.width;  y = -30;                          break;
      case 1: x = canvas.width  + 30;            y = Math.random() * canvas.height; break;
      case 2: x = Math.random() * canvas.width;  y = canvas.height + 30;            break;
      case 3: x = -30;                           y = Math.random() * canvas.height; break;
    }
    chasers.push({
      x, y,
      r:      18,
      speed:  baseSpeed + Math.random() * 0.3,
      hue:    Math.random() * 30,
      pulse:  Math.random() * Math.PI * 2,
      waveId  // tag every chaser with its wave group
    });
  }

  spawnParticles(chasers[chasers.length - 1].x, chasers[chasers.length - 1].y, '#ff2d55', 8, 4, 0.5);

  // Insane: 25 s lifespan — Easy/Normal: 35 s lifespan
  const lifespan = difficulty === 'insane' ? 22000 : difficulty === 'normal' ? 32000 : 42000;
  const timeout = setTimeout(() => {
    if (!gameRunning) return;
    // Remove by waveId — safe regardless of array shifts
    for (let i = chasers.length - 1; i >= 0; i--) {
      if (chasers[i].waveId === waveId) chasers.splice(i, 1);
    }
  }, lifespan);
  removalTimeouts.push(timeout);
}

function startWaveSystem() {

  waveInterval = setInterval(() => {
    if (!gameRunning || paused) return;
    spawnWave();
  }, difficulty === 'insane' ? 8000 : difficulty === 'normal' ? 10000 : 10000);
}

//  Falling Objects 
function startFalling() {
  const interval = difficulty === 'insane' ? 900 : difficulty === 'normal' ? 1400 : 2000;
  fallInterval = setInterval(() => {
    if (!gameRunning || paused) return;
    if (falls.length > 8) return;
    falls.push({
      x:         Math.random() * (canvas.width - 40) + 20,
      y:         -40,
      size:      difficulty === 'insane' ? 38 : 32,
      speed:     difficulty === 'insane' ? 3.5 : difficulty === 'normal' ? 2.5 : 1.8,
      rotation:  0,
      rotSpeed:  (Math.random() - 0.5) * 0.08,
      hue:       Math.random() * 30 + 20
    });
  }, interval);
}

//  Distortion 
let effectClearTimer = null; // track the clear timeout so we can cancel it

function startDistortion() {
  const interval = difficulty === 'easy' ? 25000 : difficulty === 'normal' ? 16000 : 8000;
  distortionInterval = setInterval(() => {
    if (!gameRunning || paused) return;
    // Only fire a new effect if none is currently active
    if (currentEffect === 'None') triggerEffect();
  }, interval);
}

function triggerEffect() {
  // Cancel any pending clear from a previous effect
  if (effectClearTimer) { clearTimeout(effectClearTimer); effectClearTimer = null; }

  currentEffect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];

  if (currentEffect === 'Screen Shake' && window.screenShakeEnabled) {
    shakeDecay = 55; // was 30 — much stronger initial kick
  }

  playEffectSound();
  flashScreen();
  updateEffectHUD(currentEffect);

  const dur = difficulty === 'easy' ? 4000 : difficulty === 'normal' ? 6000 : 8000;
  effectClearTimer = setTimeout(() => {
    if (!gameRunning) return;
    currentEffect = 'None';
    effectClearTimer = null;
    updateEffectHUD('None');
  }, dur);
}

//  Update 
function update(dt) {
  score += dt * 30;
  updateScore(score);

  let moveX = 0, moveY = 0;
  if (keys['ArrowUp']    || keys['w'] || keys['W']) moveY = -1;
  if (keys['ArrowDown']  || keys['s'] || keys['S']) moveY =  1;
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) moveX = -1;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) moveX =  1;

  // Normalise diagonal
  if (moveX !== 0 && moveY !== 0) { moveX *= 0.707; moveY *= 0.707; }

  if (currentEffect === 'Reverse Controls') { moveX *= -1; moveY *= -1; }
  if (currentEffect === 'Random Movement') {
    // Much more severe — large random jolts that override intentional movement
    moveX += (Math.random() - 0.5) * 4.5;
    moveY += (Math.random() - 0.5) * 4.5;
  }

  player.speed = currentEffect === 'Speed Boost' ? 7.5 : 4.5;

  const px = player.x, py = player.y;
  player.x += moveX * player.speed;
  player.y += moveY * player.speed;
  player.x  = Math.max(player.r, Math.min(canvas.width  - player.r, player.x));
  player.y  = Math.max(player.r, Math.min(canvas.height - player.r, player.y));

  // Trail
  if (particleQuality > 0) {
    player.trail.unshift({ x: player.x, y: player.y });
    if (player.trail.length > 12) player.trail.pop();
    if (Math.hypot(player.x - px, player.y - py) > 2) {
      spawnTrail(player.x, player.y, 'rgba(0,245,255,0.6)');
    }
  }

  // Screen shake — re-kick every frame during the effect so it stays severe
  if (currentEffect === 'Screen Shake' && window.screenShakeEnabled) {
    // Constantly re-energise shake so it doesn't fade away during the effect
    if (shakeDecay < 40) shakeDecay = 40;
    shakeX = (Math.random() - 0.5) * shakeDecay;
    shakeY = (Math.random() - 0.5) * shakeDecay;
    shakeDecay *= 0.97; // very slow decay while effect is active
  } else if (shakeDecay > 0) {
    shakeX = (Math.random() - 0.5) * shakeDecay;
    shakeY = (Math.random() - 0.5) * shakeDecay;
    shakeDecay *= 0.88; // faster decay after effect ends
    if (shakeDecay < 0.5) shakeDecay = 0;
  } else { shakeX = 0; shakeY = 0; }

  // Chasers
  chasers.forEach(c => {
    c.pulse += 0.05;
    const dx   = player.x - c.x;
    const dy   = player.y - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) { c.x += dx / dist * c.speed; c.y += dy / dist * c.speed; }
    if (particleQuality > 0 && Math.random() < 0.3) spawnTrail(c.x, c.y, 'rgba(255,45,85,0.4)');
    if (dist < c.r + player.r) endGame();
  });

  // Falls
  for (let i = falls.length - 1; i >= 0; i--) {
    const f  = falls[i];
    const hw = f.size / 2;
    f.y        += f.speed;
    f.rotation += f.rotSpeed;
    if (player.x > f.x - hw && player.x < f.x + hw &&
        player.y > f.y - hw && player.y < f.y + hw) endGame();
    if (f.y - hw > canvas.height) falls.splice(i, 1);
  }

  updateParticles(dt);
}

//  Draw 
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  const grad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
  );
  grad.addColorStop(0, '#0a0a14');
  grad.addColorStop(1, '#020204');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars();
  drawParticles(ctx);

  // Apply visual effects via CSS on the canvas element — NOT ctx.filter
  if (currentEffect === 'Color Inversion') {
    canvas.style.filter = 'invert(1) hue-rotate(180deg)';
  } else {
    canvas.style.filter = 'none';
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);
  ctx.filter = 'none';

  // Grid
  ctx.strokeStyle = 'rgba(0,245,255,0.03)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  for (let x = 0; x < canvas.width;  x += 80) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
  for (let y = 0; y < canvas.height; y += 80) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
  ctx.stroke();

  // Player trail
  if (player && player.trail) {
    player.trail.forEach((t, i) => {
      ctx.globalAlpha = (1 - i / player.trail.length) * 0.15;
      ctx.fillStyle   = '#00f5ff';
      ctx.beginPath();
      ctx.arc(t.x, t.y, player.r * (1 - i / player.trail.length * 0.7), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // Player
  if (player) {
    const pg = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r * 3);
    pg.addColorStop(0, 'rgba(0,245,255,0.25)');
    pg.addColorStop(1, 'rgba(0,245,255,0)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle  = 'rgba(0,245,255,0.5)';
    ctx.lineWidth    = 1;
    ctx.fillStyle    = 'rgba(0,220,255,0.9)';
    ctx.shadowColor  = '#00f5ff';
    ctx.shadowBlur   = 20;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle  = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Chasers
  ctx.shadowBlur = 0;
  chasers.forEach(c => {
    const pulse = Math.sin(c.pulse) * 0.15 + 1;
    const cg    = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 3 * pulse);
    cg.addColorStop(0, 'rgba(255,45,85,0.2)');
    cg.addColorStop(1, 'rgba(255,45,85,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r * 3 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#ff2d55';
    ctx.shadowBlur  = 15;
    ctx.fillStyle   = `hsl(${350 + c.hue},90%,55%)`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle  = 'rgba(255,150,150,0.8)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Falling objects
  falls.forEach(f => {
    const hw = f.size / 2;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rotation);

    const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, hw * 2);
    fg.addColorStop(0, 'rgba(255,180,0,0.2)');
    fg.addColorStop(1, 'rgba(255,180,0,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(-hw * 2, -hw * 2, hw * 4, hw * 4);

    ctx.shadowColor = `hsl(${f.hue},100%,55%)`;
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = `hsl(${f.hue},90%,55%)`;
    ctx.fillRect(-hw, -hw, f.size, f.size);

    ctx.fillStyle  = 'rgba(255,255,255,0.25)';
    ctx.shadowBlur = 0;
    ctx.fillRect(-hw, -hw, f.size * 0.4, f.size * 0.4);
    ctx.restore();
  });

  ctx.shadowBlur = 0;
  ctx.restore();
}

//  Game Loop 
function gameLoop(now) {
  deltaTime = Math.min((now - lastTime) / 1000, 0.05);
  lastTime  = now;

  if (!paused && gameRunning) {
    update(deltaTime);
    draw();
  }
  animId = requestAnimationFrame(gameLoop);
}

//  End / Restart 
function endGame() {
  if (!gameRunning) return;
  gameRunning = false;

  if (player) {
    spawnParticles(player.x, player.y, '#00f5ff', 40, 6, 1.2);
    spawnParticles(player.x, player.y, '#ffffff', 20, 4, 0.8);
  }

  clearInterval(distortionInterval);
  clearInterval(waveInterval);
  clearInterval(fallInterval);
  removalTimeouts.forEach(t => clearTimeout(t));
  if (effectClearTimer) { clearTimeout(effectClearTimer); effectClearTimer = null; }
  cancelAnimationFrame(animId);

  playDeathSound();
  canvas.style.filter = 'none';

  const finalS  = Math.floor(score);
  const isHigh  = finalS > highScore;
  if (isHigh) highScore = finalS;

  setTimeout(() => { showGameOver(finalS, isHigh); }, 600);
}

function togglePause() {
  if (!gameRunning) return;
  paused = !paused;
  const panel = document.getElementById('pausePanel');
  if (panel) panel.classList.toggle('active', paused);
  if (paused) pauseBGM();
  else { resumeBGM(); lastTime = performance.now(); }
}

function restartGame() {
  hidePanel('gameOverPanel');
  setTimeout(() => init(), 100);
}

function goToMenu() { location.href = 'index.html'; }

//  Input 
window.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  keys[e.key] = true;
  if (e.key === 'Escape' && gameRunning) togglePause();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Mobile touch
let touchStart = { x: 0, y: 0 };
window.addEventListener('touchstart', e => {
  unlockAudio();
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
window.addEventListener('touchmove', e => {
  if (!gameRunning || paused) return;
  e.preventDefault();
  const dx = e.touches[0].clientX - touchStart.x;
  const dy = e.touches[0].clientY - touchStart.y;
  keys['ArrowLeft']  = dx < -8;
  keys['ArrowRight'] = dx >  8;
  keys['ArrowUp']    = dy < -8;
  keys['ArrowDown']  = dy >  8;
}, { passive: false });
window.addEventListener('touchend', () => {
  keys['ArrowLeft'] = keys['ArrowRight'] = keys['ArrowUp'] = keys['ArrowDown'] = false;
}, { passive: true });

//  Boot 
document.addEventListener('DOMContentLoaded', () => {
  unlockAudio();
  init();
});