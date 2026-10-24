// Sound: placeholder effects made with the Web Audio API, plus recorded voice lines when a saying
// has a "voice" file. Browsers only allow sound after a tap, so unlock() runs on the first touch.
let ctx = null;
let enabled = true;
let noiseBuffer = null;
const voices = new Map(); // url → decoded AudioBuffer

export function setEnabled(on) {
  enabled = on;
}

export function unlock() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ctx = new AudioCtx();
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume();
}

function ready() {
  return enabled && ctx && ctx.state === "running";
}

function tone(freq, duration, { type = "square", volume = 0.06, slideTo = null, delay = 0 } = {}) {
  if (!ready()) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise(duration, { volume = 0.15, filter = 1200, type = "lowpass", delay = 0 } = {}) {
  if (!ready()) return;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = filter;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(f).connect(gain).connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

const SOUNDS = {
  whoosh() {
    noise(0.35, { volume: 0.12, filter: 900, type: "bandpass" });
  },
  splat() {
    noise(0.25, { volume: 0.35, filter: 500 });
    tone(180, 0.2, { type: "sine", volume: 0.15, slideTo: 60 });
  },
  thud() {
    tone(110, 0.25, { type: "sine", volume: 0.2, slideTo: 45 });
    noise(0.12, { volume: 0.1, filter: 300 });
  },
  smash() {
    noise(0.5, { volume: 0.25, filter: 3500, type: "highpass" });
    [1800, 2400, 2100].forEach((f, i) => tone(f, 0.12, { type: "triangle", volume: 0.05, delay: i * 0.05 }));
  },
  giggle() {
    [900, 1100, 950, 1200, 1000].forEach((f, i) => tone(f, 0.07, { type: "triangle", volume: 0.05, delay: i * 0.08 }));
  },
  pop() {
    tone(500, 0.08, { type: "sine", volume: 0.06, slideTo: 900 });
  },
  boing() {
    tone(220, 0.35, { type: "sine", volume: 0.1, slideTo: 520 });
  },
  bells() {
    [1568, 1760, 1568, 1976].forEach((f, i) => tone(f, 0.18, { type: "triangle", volume: 0.04, delay: i * 0.09 }));
  },
  combo() {
    [660, 880, 1100].forEach((f, i) => tone(f, 0.1, { type: "square", volume: 0.04, delay: i * 0.07 }));
  },
  cheer() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, { type: "triangle", volume: 0.07, delay: i * 0.12 }));
  },
  groan() {
    tone(300, 0.6, { type: "sawtooth", volume: 0.04, slideTo: 120 });
  },
};

export function play(name) {
  SOUNDS[name]?.();
}

// Plays a recorded voice line, fetched and decoded the first time it is needed.
let speaking = null;

export async function playVoice(url) {
  if (!url || !ready()) return false;
  try {
    let buffer = voices.get(url);
    if (!buffer) {
      const bytes = await (await fetch(url)).arrayBuffer();
      buffer = await ctx.decodeAudioData(bytes);
      voices.set(url, buffer);
    }
    // One elf talks at a time: a new line cuts off the last one.
    try {
      speaking?.stop();
    } catch {
      // it had already finished
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start();
    speaking = src;
    return true;
  } catch {
    return false;
  }
}
