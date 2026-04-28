// ═══════════════════════════════════════════════════════
//  ui.js — HUD updates, panels, settings
//  Reality Distortion — Phase 2
// ═══════════════════════════════════════════════════════

//  Panel helpers 
function showPanel(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function hidePanel(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

//  Effect HUD 
/**
 * Update the effect indicator in the HUD
 * @param {string} effectName - Current effect name or 'None'
 */
function updateEffectHUD(effectName) {
  const dot  = document.getElementById('effectDot');
  const name = document.getElementById('effectName');
  if (!dot || !name) return;

  const hasEffect = effectName !== 'None';
  dot.classList.toggle('active', hasEffect);
  name.className  = 'effect-name' + (hasEffect ? ' has-effect' : '');
  name.innerText  = hasEffect ? effectName : 'No Effect';
}

//  Score HUD 
/**
 * Update score display
 * @param {number} score
 */
function updateScore(score) {
  const el = document.getElementById('score');
  if (el) el.innerText = Math.floor(score);
}

//  Wave Banner 
function showWaveBanner() {
  const el = document.getElementById('waveIndicator');
  if (!el) return;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 1500);
}

//  Screen Flash 
function flashScreen(color = 'rgba(255,45,85,0.15)') {
  const el = document.getElementById('effectFlash');
  if (!el) return;
  el.style.background = color;
  el.style.opacity    = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 200);
}

//  Game Over Panel 
/**
 * Show game over with final score and optional high score badge
 * @param {number}  score
 * @param {boolean} isHighScore
 */
function showGameOver(score, isHighScore) {
  const finalEl = document.getElementById('finalScore');
  const badge   = document.getElementById('hsBadge');
  if (finalEl) finalEl.innerText = Math.floor(score);
  if (badge)   badge.style.display = isHighScore ? 'inline-block' : 'none';
  showPanel('gameOverPanel');
}

//  Settings 
function initSettings() {
  const volSlider      = document.getElementById('volumeSlider');
  const particleSlider = document.getElementById('particleSlider');
  const shakeSlider    = document.getElementById('shakeSlider');
  const volLabel       = document.getElementById('volLabel');
  const particleLabel  = document.getElementById('particleLabel');
  const shakeLabel     = document.getElementById('shakeLabel');

  if (volSlider) {
    volSlider.oninput = e => {
      masterVolume = parseFloat(e.target.value);
      if (volLabel) volLabel.innerText = Math.round(masterVolume * 100) + '%';
      if (typeof syncVolume === 'function') syncVolume();
    };
  }

  if (particleSlider) {
    const pLabels = ['Off', 'Low', 'High'];
    particleSlider.oninput = e => {
      particleQuality = parseInt(e.target.value);
      if (particleLabel) particleLabel.innerText = pLabels[particleQuality];
    };
  }

  if (shakeSlider) {
    shakeSlider.oninput = e => {
      const on = parseInt(e.target.value) === 1;
      if (shakeLabel) shakeLabel.innerText = on ? 'On' : 'Off';
      // screenShakeEnabled can be read by game.js
      window.screenShakeEnabled = on;
    };
  }
}

//  Resume / Restart button wiring 
function wireGameButtons() {
  const resumeBtn  = document.getElementById('resumeBtn');
  const restartBtn = document.getElementById('restartBtn');

  if (resumeBtn)  resumeBtn.addEventListener('click',  () => togglePause());
  if (restartBtn) restartBtn.addEventListener('click', () => restartGame());
}

//  Init on DOM ready 
document.addEventListener('DOMContentLoaded', () => {
  initSettings();
  wireGameButtons();
});
