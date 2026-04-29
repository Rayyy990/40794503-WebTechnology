//
//  audio.js — Audio manager (Phase 2)
//
//  Place these files in your audio/ folder:
//    audio/bgm.mp3       — looping background music
//    audio/thunder.mp3   — distortion effect sting
//    audio/wave.mp3      — wave incoming sound
//    audio/death.mp3     — player death sound
// ═══════════════════════════════════════════════════════

let masterVolume = 0.5;

// ── Audio elements ──────────────────────────────────────
const bgmAudio = new Audio('audio/bgm.mp3');
bgmAudio.loop   = true;
bgmAudio.volume = 0.3;
bgmAudio.addEventListener('error', () => {});

const effectAudio = new Audio('audio/thunder.mp3');
effectAudio.volume = 0.7;
effectAudio.addEventListener('error', () => {});

const waveAudio = new Audio('audio/wave.mp3');
waveAudio.volume = 0.5;
waveAudio.addEventListener('error', () => {});

const deathAudio = new Audio('audio/death.mp3');
deathAudio.volume = 0.6;
deathAudio.addEventListener('error', () => {});

// ── Volume sync ─────────────────────────────────────────
function syncVolume() {
  bgmAudio.volume    = masterVolume * 0.6;
  effectAudio.volume = masterVolume * 0.85;
  waveAudio.volume   = masterVolume * 0.5;
  deathAudio.volume  = masterVolume * 0.6;
}

// ── BGM controls ────────────────────────────────────────
function playBGM() {
  bgmAudio.currentTime = 0;
  bgmAudio.play().catch(() => {});
}
function stopBGM()   { bgmAudio.pause(); bgmAudio.currentTime = 0; }
function pauseBGM()  { bgmAudio.pause(); }
function resumeBGM() { bgmAudio.play().catch(() => {}); }

// ── Effect sound (thunder on distortion trigger) ────────
function playEffectSound() {
  effectAudio.currentTime = 0;
  effectAudio.play().catch(() => {});
}

// ── Wave incoming sound ─────────────────────────────────
function playWaveSound() {
  waveAudio.currentTime = 0;
  waveAudio.play().catch(() => {});
}

// ── Death sound ─────────────────────────────────────────
function playDeathSound() {
  stopBGM();
  deathAudio.currentTime = 0;
  deathAudio.play().catch(() => {});
}

// ── Stubs — kept so game.js never throws errors ─────────
function playThunderImpact() {}
function playTone()          {}
function unlockAudio()       {}
