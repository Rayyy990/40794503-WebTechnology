// ═══════════════════════════════════════════════════════
//  particles.js — Particle system
//  Reality Distortion — Phase 2
// ═══════════════════════════════════════════════════════

let particles = [];
let particleQuality = 2; // 0=Off, 1=Low, 2=High

/**
 * Spawn an explosion burst of particles
 * @param {number} x       - Origin X
 * @param {number} y       - Origin Y
 * @param {string} color   - CSS color string
 * @param {number} count   - Number of particles (scaled by quality)
 * @param {number} speed   - Max speed
 * @param {number} life    - Max lifetime in seconds
 */
function spawnParticles(x, y, color, count = 10, speed = 3, life = 0.8) {
  if (particleQuality === 0) return;
  const actual = particleQuality === 1 ? Math.ceil(count * 0.5) : count;

  for (let i = 0; i < actual; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = Math.random() * speed + 1;
    particles.push({
      x, y,
      vx:      Math.cos(angle) * spd,
      vy:      Math.sin(angle) * spd,
      color,
      life:    Math.random() * life + 0.2,
      maxLife: life + 0.2,
      r:       Math.random() * 3 + 1,
      gravity: 0.05
    });
  }
}

/**
 * Spawn a single small trail particle
 * @param {number} x
 * @param {number} y
 * @param {string} color
 */
function spawnTrail(x, y, color) {
  if (particleQuality === 0) return;
  particles.push({
    x: x + (Math.random() - 0.5) * 4,
    y: y + (Math.random() - 0.5) * 4,
    vx:      (Math.random() - 0.5) * 0.5,
    vy:      (Math.random() - 0.5) * 0.5,
    color,
    life:    0.25,
    maxLife: 0.25,
    r:       Math.random() * 2 + 0.5,
    gravity: 0
  });
}

/**
 * Update all particles (call once per frame)
 * @param {number} dt - Delta time in seconds
 */
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x   += p.vx;
    p.y   += p.vy;
    p.vy  += p.gravity;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

/**
 * Draw all particles onto ctx (call once per frame after updateParticles)
 * @param {CanvasRenderingContext2D} ctx
 */
function drawParticles(ctx) {
  particles.forEach(p => {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

/** Clear all particles (e.g. on restart) */
function clearParticles() {
  particles = [];
}
