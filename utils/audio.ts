let audioCtx: AudioContext | null = null;
let ambientOsc: OscillatorNode | null = null;
let ambientOsc2: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;
let isMutedGlobal = false;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const setMuted = (muted: boolean) => {
  isMutedGlobal = muted;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (muted) {
    if (ambientGain) {
      ambientGain.gain.setValueAtTime(0, ctx.currentTime);
    }
  } else {
    if (ambientGain) {
      ambientGain.gain.setValueAtTime(0.012, ctx.currentTime); // Low hum level
    }
  }
};

export const getMuted = () => isMutedGlobal;

export const playClickSound = () => {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

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
};

export const playBuildSound = () => {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

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
};

export const playDemolishSound = () => {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.22;

  // Create White Noise
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
};

export const playRewardSound = () => {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (classic reward arpeggio)
  const noteLength = 0.07;

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now + index * noteLength);

    gain.gain.setValueAtTime(0.03, now + index * noteLength);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (index + 1) * noteLength);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + index * noteLength);
    osc.stop(now + (index + 1) * noteLength);
  });
};

export const toggleAmbientHum = (active: boolean) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (active) {
    if (ambientOsc) return; // Already running

    const now = ctx.currentTime;
    ambientOsc = ctx.createOscillator();
    ambientOsc2 = ctx.createOscillator();
    ambientGain = ctx.createGain();

    ambientOsc.type = 'triangle';
    ambientOsc.frequency.setValueAtTime(55, now); // A1 note

    ambientOsc2.type = 'sine';
    ambientOsc2.frequency.setValueAtTime(55.4, now); // Detuned sine for chorus

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, now);

    // If muted initially, set gain to 0, otherwise set low volume hum
    ambientGain.gain.setValueAtTime(isMutedGlobal ? 0 : 0.012, now);

    ambientOsc.connect(filter);
    ambientOsc2.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(ctx.destination);

    ambientOsc.start(now);
    ambientOsc2.start(now);
  } else {
    // Stop ambient hum
    if (ambientOsc) {
      try {
        ambientOsc.stop();
      } catch (e) {}
      ambientOsc = null;
    }
    if (ambientOsc2) {
      try {
        ambientOsc2.stop();
      } catch (e) {}
      ambientOsc2 = null;
    }
    ambientGain = null;
  }
};
