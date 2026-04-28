// ═══════════════════════════════════════════════════════
//  menu.js — Ambient starfield for menu/static pages
//  Reality Distortion — Phase 2
// ═══════════════════════════════════════════════════════

const bgCanvas = document.getElementById('bgCanvas');
if (bgCanvas) {
  const ctx = bgCanvas.getContext('2d');
  let stars  = [];

  function resize() {
    bgCanvas.width  = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    initStars();
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x:       Math.random() * bgCanvas.width,
        y:       Math.random() * bgCanvas.height,
        r:       Math.random() * 1.2 + 0.2,
        alpha:   Math.random() * 0.4 + 0.1,
        twinkle: Math.random() * Math.PI * 2,
        speed:   Math.random() * 0.015 + 0.003
      });
    }
  }

  function drawBg() {
    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    const grad = ctx.createRadialGradient(
      bgCanvas.width / 2, bgCanvas.height / 2, 0,
      bgCanvas.width / 2, bgCanvas.height / 2, bgCanvas.width * 0.8
    );
    grad.addColorStop(0, '#06060f');
    grad.addColorStop(1, '#020204');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

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
    requestAnimationFrame(drawBg);
  }

  window.addEventListener('resize', resize);
  resize();
  drawBg();
}
