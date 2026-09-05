/**
 * Sintetizador de Música de Fondo (BGM Calypso Tropical en Tiempo Real)
 * Genera en tiempo real música tropical caribeña utilizando exclusivamente la Web Audio API,
 * sin necesidad de archivos .mp3 externos pesados.
 *
 * Instrumentos Sintetizados:
 * 1. Steel Pan Tropical (synthSteelDrum): Tono fundamental y sobretonos armónicos metálicos (2.76x) con decaimiento percusivo.
 * 2. Plucks Acuáticos (synthBubblePluck): Barrido de frecuencia ascendente imitando el estallido de gotas de agua.
 * 3. Campanillas (synthChimeNote): Ondas sinusoidales con brillo brillante.
 * 4. Bajo Calypso (synthBassNote): Bajo redondo con filtro pasa-bajos cálido.
 * 5. Bongó Caribeño (synthBongo): Golpe rápido con caída de frecuencia percusiva.
 * 6. Maraca / Shaker (synthMaraca): Buffer de ruido blanco filtrado con envolvente de amplitud exponencial.
 */

// Singleton states
let audioCtx: AudioContext | null = null;
let bgmMasterGain: GainNode | null = null;
let isBgmPlaying = false;
let bgmTimer: number | null = null;
let currentBeat = 0;
let nextBeatTime = 0;
let userVolume = 0.34; // Volumen por defecto solicitado (0.34)

// Subscriptores de estado para reactividad en la UI
type BgmStateListener = (playing: boolean, volume: number, beat: number) => void;
const listeners = new Set<BgmStateListener>();

export function subscribeBgmState(cb: BgmStateListener): () => void {
  listeners.add(cb);
  cb(isBgmPlaying, userVolume, currentBeat);
  return () => {
    listeners.delete(cb);
  };
}

function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb(isBgmPlaying, userVolume, currentBeat);
    } catch (e) {
      console.error(e);
    }
  });
}

/**
 * Obtener o inicializar el AudioContext
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Master Gain de la Música
 */
export function getBgmGain(ctx: AudioContext): GainNode {
  if (!bgmMasterGain) {
    bgmMasterGain = ctx.createGain();
    bgmMasterGain.gain.setValueAtTime(userVolume, ctx.currentTime);
    bgmMasterGain.connect(ctx.destination);
  }
  return bgmMasterGain;
}

/**
 * 1. Tambor de acero Tropical (Steel Drum / Steel Pan)
 * Tono fundamental y sobretonos armónicos metálicos (2.76x) con decaimiento percusivo.
 */
export function synthSteelDrum(ctx: AudioContext, freq: number, t: number, durSec = 0.35) {
  if (freq <= 0) return;
  const master = getBgmGain(ctx);
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, t);

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2.76, t);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(freq * 1.8, t);
  filter.Q.value = 2.4;

  const gain1 = ctx.createGain();
  gain1.gain.setValueAtTime(0.001, t);
  gain1.gain.linearRampToValueAtTime(0.25, t + 0.008);
  gain1.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(durSec * 1.1, 0.45));

  // Conexión armónica
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain1);
  gain1.connect(master);

  osc1.start(t);
  osc2.start(t);
  osc1.stop(t + 0.5);
  osc2.stop(t + 0.5);
}

/**
 * 2. Plucks Acuáticos (synthBubblePluck)
 * Barrido de frecuencia ascendente imitando el estallido de gotas de agua / burbuja.
 */
export function synthBubblePluck(ctx: AudioContext, freq: number, t: number, durSec = 0.15) {
  if (freq <= 0) return;
  const master = getBgmGain(ctx);
  const osc = ctx.createOscillator();
  osc.type = 'sine';

  // Barrido de frecuencia ascendente imitando burbuja de agua
  osc.frequency.setValueAtTime(freq * 0.75, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.6, t + 0.05);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(freq * 1.3, t);
  filter.Q.value = 3.8;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(0.18, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.08, durSec));

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  osc.start(t);
  osc.stop(t + 0.2);
}

/**
 * 3. Campanillas (synthChimeNote)
 * Ondas sinusoidales con brillo brillante y resonancia cristalina.
 */
export function synthChimeNote(ctx: AudioContext, freq: number, t: number, durSec = 0.4) {
  if (freq <= 0) return;
  const master = getBgmGain(ctx);
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);

  // Armónico de destello brillante
  const oscHarmonic = ctx.createOscillator();
  oscHarmonic.type = 'sine';
  oscHarmonic.frequency.setValueAtTime(freq * 3, t);

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(800, t);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(0.14, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(durSec, 0.35));

  const harmGain = ctx.createGain();
  harmGain.gain.setValueAtTime(0.04, t);
  harmGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

  osc.connect(filter);
  oscHarmonic.connect(harmGain);
  harmGain.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  osc.start(t);
  oscHarmonic.start(t);
  osc.stop(t + 0.5);
  oscHarmonic.stop(t + 0.5);
}

/**
 * 4. Bajo Calypso (synthBassNote)
 * Bajo redondo con filtro pasa-bajos cálido y ritmo caribeño.
 */
export function synthBassNote(ctx: AudioContext, freq: number, t: number, durSec = 0.26) {
  if (freq <= 0) return;
  const master = getBgmGain(ctx);
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, t);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(320, t);
  filter.Q.value = 1.2;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(0.28, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.15, durSec));

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  osc.start(t);
  osc.stop(t + 0.35);
}

/**
 * 5. Bongó Caribeño (synthBongo)
 * Golpe rápido con caída de frecuencia percusiva.
 */
export function synthBongo(ctx: AudioContext, t: number, isHigh = false) {
  const master = getBgmGain(ctx);
  const osc = ctx.createOscillator();
  osc.type = 'sine';

  const startFreq = isHigh ? 460 : 310;
  const endFreq = isHigh ? 210 : 130;

  osc.frequency.setValueAtTime(startFreq, t);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.05);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(isHigh ? 600 : 380, t);
  filter.Q.value = 2.0;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(isHigh ? 0.2 : 0.24, t + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + (isHigh ? 0.075 : 0.095));

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  osc.start(t);
  osc.stop(t + 0.12);
}

/**
 * 6. Maraca / Shaker (synthMaraca)
 * Buffer de ruido blanco filtrado con envolvente de amplitud exponencial.
 */
export function synthMaraca(ctx: AudioContext, t: number, accent = false) {
  const master = getBgmGain(ctx);
  const bufferSize = Math.floor(ctx.sampleRate * 0.035);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(accent ? 7200 : 5800, t);
  filter.Q.value = 2.0;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(accent ? 0.12 : 0.06, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + (accent ? 0.045 : 0.03));

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  noise.start(t);
  noise.stop(t + 0.05);
}

// ==========================================
// RITMO & COMPOSICIÓN CALYPSO TROPICAL (120 BPM)
// ==========================================

// Frecuencias de notas musicales (Escala Pentatónica Mayor caribeña C / F / G)
const C3 = 130.81;
const D3 = 146.83;
const E3 = 164.81;
const F3 = 174.61;
const G3 = 196.00;
const A3 = 220.00;
const Bb3 = 233.08;
const C4 = 261.63;
const D4 = 293.66;
const E4 = 329.63;
const F4 = 349.23;
const G4 = 392.00;
const A4 = 440.00;
const B4 = 493.88;
const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.25;
const G5 = 783.99;

// Partitura de Steel Pan (Melodía Tropical alegre en 32 pulsos de semicorchea)
const STEEL_PAN_MELODY: number[] = [
  // Compás 1 (Calypso riff clásico)
  G4, 0, C5, 0, E5, 0, D5, C5,
  A4, 0, G4, 0, E4, 0, G4, 0,
  // Compás 2 (Respuesta sincopada)
  A4, 0, C5, 0, D5, 0, C5, 0,
  G4, E4, D4, C4, D4, 0, 0, 0,
  // Compás 3 (Variación festiva con notas altas)
  E5, 0, G5, 0, E5, 0, D5, C5,
  D5, 0, E5, 0, C5, 0, A4, 0,
  // Compás 4 (Cierre tropical rítmico)
  C5, 0, G4, 0, A4, 0, B4, G4,
  C5, 0, C5, 0, 0, 0, 0, 0,
];

// Bajo Calypso característico (Groove sincopado caribeño)
const BASS_LINE: number[] = [
  // Compás 1: C - G
  C3, 0, 0, C3, 0, 0, G3, 0,
  C3, 0, 0, C3, 0, 0, G3, 0,
  // Compás 2: F - C
  F3, 0, 0, F3, 0, 0, C3, 0,
  G3, 0, 0, G3, 0, 0, C3, 0,
  // Compás 3: C - A
  C3, 0, 0, C3, 0, 0, A3, 0,
  D3, 0, 0, D3, 0, 0, G3, 0,
  // Compás 4: G - C
  G3, 0, 0, G3, 0, 0, G3, 0,
  C3, 0, 0, C3, 0, 0, C3, 0,
];

// Plucks Acuáticos (Gotas de agua sincopadas en contratiempo)
const WATER_PLUCKS: number[] = [
  0, E4, 0, G4, 0, C5, 0, 0,
  0, D4, 0, A4, 0, G4, 0, 0,
  0, G4, 0, C5, 0, E5, 0, 0,
  0, A4, 0, G4, 0, E4, 0, 0,
];

// Campanillas brillantes (Destellos de agua en compases clave)
const CHIMES: number[] = [
  C5, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, G5, 0, 0, 0,
  E5, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, C5, 0, 0, 0,
];

// Bongós caribeños: 0 = nada, 1 = bongo grave, 2 = bongo agudo
const BONGOS: number[] = [
  1, 0, 2, 0, 1, 2, 0, 2,
  2, 0, 1, 0, 2, 1, 2, 0,
  1, 0, 2, 0, 1, 2, 0, 2,
  2, 0, 1, 0, 2, 2, 1, 2,
];

/**
 * Planificador en tiempo real (Audio Lookahead Scheduler)
 * Programa eventos con anticipación para una precisión rítmica perfecta sin latencia.
 */
function bgmScheduler() {
  if (!isBgmPlaying) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const secondsPerBeat = 60.0 / 120.0; // 120 BPM
  const stepTime = secondsPerBeat / 4; // Semicorcheas (16th notes)
  const scheduleAheadTime = 0.12; // Programar 120ms hacia adelante

  while (nextBeatTime < ctx.currentTime + scheduleAheadTime) {
    const step = currentBeat % 32;

    // 1. Maraca continua con acento en contratiempo
    const maracaAccent = step % 4 === 2 || step % 8 === 0;
    synthMaraca(ctx, nextBeatTime, maracaAccent);

    // 2. Bongó caribeño
    const bongoVal = BONGOS[step];
    if (bongoVal === 1) {
      synthBongo(ctx, nextBeatTime, false);
    } else if (bongoVal === 2) {
      synthBongo(ctx, nextBeatTime, true);
    }

    // 3. Bajo Calypso
    const bassNote = BASS_LINE[step];
    if (bassNote > 0) {
      synthBassNote(ctx, bassNote, nextBeatTime, stepTime * 1.8);
    }

    // 4. Pluck acuático (Burbuja)
    const pluckNote = WATER_PLUCKS[step];
    if (pluckNote > 0) {
      synthBubblePluck(ctx, pluckNote, nextBeatTime, stepTime * 1.2);
    }

    // 5. Steel Pan Tropical
    const panNote = STEEL_PAN_MELODY[step];
    if (panNote > 0) {
      synthSteelDrum(ctx, panNote, nextBeatTime, stepTime * 1.6);
    }

    // 6. Campanillas cristalinas
    const chimeNote = CHIMES[step];
    if (chimeNote > 0) {
      synthChimeNote(ctx, chimeNote, nextBeatTime, stepTime * 2.5);
    }

    // Avanzar al siguiente pulso
    nextBeatTime += stepTime;
    currentBeat++;
    notifyListeners();
  }
}

/**
 * Control de Reproducción: Iniciar BGM Calypso
 */
export function startBgm(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  isBgmPlaying = true;
  nextBeatTime = ctx.currentTime + 0.05;
  currentBeat = 0;
  if (bgmTimer !== null) {
    clearInterval(bgmTimer);
  }
  // Ejecutar el planificador cada 35ms
  bgmTimer = window.setInterval(bgmScheduler, 35);
  notifyListeners();
}

/**
 * Control de Reproducción: Detener BGM Calypso
 */
export function stopBgm(): void {
  isBgmPlaying = false;
  if (bgmTimer !== null) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }
  notifyListeners();
}

/**
 * Alternar reproducción (Play / Pause)
 */
export function toggleBgm(): boolean {
  if (isBgmPlaying) {
    stopBgm();
  } else {
    startBgm();
  }
  return isBgmPlaying;
}

/**
 * Ajustar volumen maestro de la música de fondo (0.0 a 1.0)
 */
export function setBgmVolume(val: number): void {
  userVolume = Math.max(0, Math.min(1, val));
  if (bgmMasterGain && audioCtx) {
    bgmMasterGain.gain.setValueAtTime(userVolume, audioCtx.currentTime);
  }
  notifyListeners();
}

/**
 * Obtener volumen actual
 */
export function getBgmVolume(): number {
  return userVolume;
}

/**
 * Estado actual de reproducción
 */
export function isBgmActive(): boolean {
  return isBgmPlaying;
}
