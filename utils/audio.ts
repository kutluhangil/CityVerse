const MUTE_STORAGE_KEY = 'cityverse_muted';

let audioCtx: AudioContext | null = null;
let ambientOsc: OscillatorNode | null = null;
let ambientOsc2: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

const readStoredMuted = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

let isMutedGlobal = readStoredMuted();

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) {
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export const setMuted = (muted: boolean): void => {
  isMutedGlobal = muted;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
    } catch {
      // Ignore storage errors
    }
  }
  if (!audioCtx || !ambientGain) return;
  ambientGain.gain.setValueAtTime(
    muted ? 0 : 0.012,
    audioCtx.currentTime,
  );
};

export const getMuted = (): boolean => isMutedGlobal;

export const playClickSound = (): void => {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Ignore audio hardware errors
  }
};

export const playBuildSound = (): void => {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(550, now + 0.15);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Ignore audio hardware errors
  }
};

export const playDemolishSound = (): void => {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.22;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.exponentialRampToValueAtTime(10, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + duration);
  } catch {
    // Ignore audio hardware errors
  }
};

export const playRewardSound = (): void => {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const noteLength = 0.07;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + index * noteLength);

      gain.gain.setValueAtTime(0.03, now + index * noteLength);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        now + (index + 1) * noteLength,
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * noteLength);
      osc.stop(now + (index + 1) * noteLength);
    });
  } catch {
    // Ignore audio hardware errors
  }
};

export const toggleAmbientHum = (active: boolean): void => {
  if (!active || isMutedGlobal) {
    if (ambientOsc) {
      try {
        ambientOsc.stop();
      } catch {
        // Ignore stop errors
      }
      ambientOsc = null;
    }
    if (ambientOsc2) {
      try {
        ambientOsc2.stop();
      } catch {
        // Ignore stop errors
      }
      ambientOsc2 = null;
    }
    ambientGain = null;
    return;
  }

  const ctx = getAudioContext();
  if (!ctx || ambientOsc) return;

  try {
    const now = ctx.currentTime;
    ambientOsc = ctx.createOscillator();
    ambientOsc2 = ctx.createOscillator();
    ambientGain = ctx.createGain();

    ambientOsc.type = 'triangle';
    ambientOsc.frequency.setValueAtTime(55, now);

    ambientOsc2.type = 'sine';
    ambientOsc2.frequency.setValueAtTime(55.4, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, now);

    ambientGain.gain.setValueAtTime(0.012, now);

    ambientOsc.connect(filter);
    ambientOsc2.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(ctx.destination);

    ambientOsc.start(now);
    ambientOsc2.start(now);
  } catch {
    ambientOsc = null;
    ambientOsc2 = null;
    ambientGain = null;
  }
};
