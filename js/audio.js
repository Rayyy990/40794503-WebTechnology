//
//  audio.js — Audio manager
//  Reality Distortion — Phase 2
//
//  Local files (optional — place in audio/ folder):
//    audio/bgm.mp3     — looping background music
//    audio/effect.mp3  — distortion effect sting
//                        (if missing, uses synth thunder below)
// ═══════════════════════════════════════════════════════

let masterVolume = 0.5;

//  Local file audio elements 
const bgmAudio    = new Audio('audio/bgm.mp3');
bgmAudio.loop     = true;
bgmAudio.volume   = 0.3;

const effectAudio = new Audio('audio/effect.mp3');
effectAudio.volume = 0.7;

//  Web Audio context 
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
  }
  return audioCtx;
}

//  Volume sync 
function syncVolume() {
  bgmAudio.volume    = masterVolume * 0.6;
  effectAudio.volume = masterVolume * 0.85;
}

//  BGM controls 
function playBGM() {
  bgmAudio.currentTime = 0;
  bgmAudio.play().catch(() => {});
}
function stopBGM()   { bgmAudio.pause(); bgmAudio.currentTime = 0; }
function pauseBGM()  { bgmAudio.pause(); }
function resumeBGM() { bgmAudio.play().catch(() => {}); }

//  Low-level tone helper 
function playTone(freq, type = 'sine', dur = 0.1, vol = 0.15, delay = 0) {
  try {
    const ac   = getAudioCtx();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
    gain.gain.setValueAtTime(vol * masterVolume, ac.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + dur);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + dur + 0.02);
  } catch (e) {}
}

//  Thunder impact — synthesized 
// Layered: sub-bass boom + mid crack + high sizzle + pitch-drop tail
function playThunderImpact() {
  try {
    const ac = getAudioCtx();
    const now = ac.currentTime;
    const vol = masterVolume;

    //  Layer 1: Sub-bass BOOM (the "DA" punch) 
    const boom = ac.createOscillator();
    const boomGain = ac.createGain();
    boom.connect(boomGain); boomGain.connect(ac.destination);
    boom.type = 'sine';
    boom.frequency.setValueAtTime(80, now);
    boom.frequency.exponentialRampToValueAtTime(25, now + 0.25);
    boomGain.gain.setValueAtTime(vol * 0.9, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    boom.start(now); boom.stop(now + 0.55);

    //  Layer 2: Mid crack — sharp attack (the "N") 
    const crack = ac.createOscillator();
    const crackGain = ac.createGain();
    const crackFilter = ac.createBiquadFilter();
    crack.connect(crackFilter); crackFilter.connect(crackGain); crackGain.connect(ac.destination);
    crack.type = 'sawtooth';
    crackFilter.type = 'bandpass';
    crackFilter.frequency.value = 800;
    crackFilter.Q.value = 2;
    crack.frequency.setValueAtTime(220, now);
    crack.frequency.exponentialRampToValueAtTime(55, now + 0.15);
    crackGain.gain.setValueAtTime(vol * 0.6, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    crack.start(now); crack.stop(now + 0.25);

    //  Layer 3: White noise rumble (the "EEE" tail) 
    const bufSize = ac.sampleRate * 0.8;
    const noiseBuffer = ac.createBuffer(1, bufSize, ac.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) noiseData[i] = Math.random() * 2 - 1;
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ac.createBiquadFilter();
    const noiseGain = ac.createGain();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(2000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.8);
    noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(ac.destination);
    noiseGain.gain.setValueAtTime(vol * 0.35, now + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    noise.start(now + 0.03); noise.stop(now + 0.9);

    //  Layer 4: High sizzle transient 
    const siz = ac.createOscillator();
    const sizGain = ac.createGain();
    siz.connect(sizGain); sizGain.connect(ac.destination);
    siz.type = 'square';
    siz.frequency.setValueAtTime(3200, now);
    siz.frequency.exponentialRampToValueAtTime(400, now + 0.06);
    sizGain.gain.setValueAtTime(vol * 0.25, now);
    sizGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    siz.start(now); siz.stop(now + 0.08);

  } catch (e) {}
}

//  Effect SFX (tries local file, falls back to thunder synth) 
function playEffectSound() {
  if (effectAudio.readyState >= 2) {
    effectAudio.currentTime = 0;
    effectAudio.play().catch(() => playThunderImpact());
  } else {
    playThunderImpact();
  }
}

//  Other SFX 
function playWaveSound() {
  playTone(330, 'sine', 0.1, 0.1);
  playTone(440, 'sine', 0.1, 0.1, 0.12);
  playTone(550, 'sine', 0.1, 0.1, 0.24);
}

function playDeathSound() {
  stopBGM();
  playTone(220, 'sawtooth', 0.4, 0.3);
  playTone(110, 'sawtooth', 0.6, 0.3, 0.1);
  playTone(55,  'square',   0.8, 0.2, 0.3);
}

function unlockAudio() { getAudioCtx(); }
