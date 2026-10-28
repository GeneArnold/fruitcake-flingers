// Sound: effects and holiday music made with the Web Audio API, plus recorded voice lines when a
// saying has a "voice" file. Browsers only allow sound after a tap, so unlock() runs on the first touch.
let ctx = null;
let enabled = true;
let noiseBuffer = null;
const voices = new Map(); // url → decoded AudioBuffer

export function setEnabled(on) {
  enabled = on;
  if (!on) stopMusic();
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

function tone(freq, duration, { type = "square", volume = 0.06, slideTo = null, delay = 0, at = null, out = null } = {}) {
  if (!ready()) return;
  const t0 = at ?? ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(out || ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise(duration, { volume = 0.15, filter = 1200, type = "lowpass", delay = 0, at = null, out = null } = {}) {
  if (!ready()) return;
  const t0 = at ?? ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = filter;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(f).connect(gain).connect(out || ctx.destination);
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
  // A level starting: a shake of sleigh bells and a rising "ta-da".
  levelStart() {
    for (let i = 0; i < 6; i++) noise(0.08, { volume: 0.08, filter: 6000, type: "highpass", delay: i * 0.06 });
    [392, 523, 659, 784].forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.13, { type: "square", volume: 0.045, delay: 0.3 + i * 0.12 }));
  },
};

export function play(name) {
  SOUNDS[name]?.();
}

// ---------------------------------------------------------------------------------------------
// Music: old carols (public domain) played quietly behind the game, one after another, with sleigh
// bells on the beat. A note is [name, beats]; notes are queued a little ahead so they stay in time.

const SONGS = [
  { name: "Jingle Bells", bpm: 168, notes: [
    ["E4", 1], ["E4", 1], ["E4", 2], ["E4", 1], ["E4", 1], ["E4", 2], ["E4", 1], ["G4", 1], ["C4", 1.5], ["D4", 0.5], ["E4", 4],
    ["F4", 1], ["F4", 1], ["F4", 1.5], ["F4", 0.5], ["F4", 1], ["E4", 1], ["E4", 1], ["E4", 0.5], ["E4", 0.5],
    ["E4", 1], ["D4", 1], ["D4", 1], ["E4", 1], ["D4", 2], ["G4", 2],
    ["E4", 1], ["E4", 1], ["E4", 2], ["E4", 1], ["E4", 1], ["E4", 2], ["E4", 1], ["G4", 1], ["C4", 1.5], ["D4", 0.5], ["E4", 4],
    ["F4", 1], ["F4", 1], ["F4", 1.5], ["F4", 0.5], ["F4", 1], ["E4", 1], ["E4", 1], ["E4", 0.5], ["E4", 0.5],
    ["G4", 1], ["G4", 1], ["F4", 1], ["D4", 1], ["C4", 4],
  ] },
  { name: "Deck the Halls", bpm: 150, notes: [
    ["G4", 1.5], ["F4", 0.5], ["E4", 1], ["D4", 1], ["C4", 1], ["D4", 1], ["E4", 1], ["C4", 1],
    ["D4", 0.5], ["E4", 0.5], ["F4", 0.5], ["D4", 0.5], ["E4", 1.5], ["D4", 0.5], ["C4", 1], ["B3", 1], ["C4", 2],
    ["G4", 1.5], ["F4", 0.5], ["E4", 1], ["D4", 1], ["C4", 1], ["D4", 1], ["E4", 1], ["C4", 1],
    ["D4", 0.5], ["E4", 0.5], ["F4", 0.5], ["D4", 0.5], ["E4", 1.5], ["D4", 0.5], ["C4", 1], ["B3", 1], ["C4", 2],
    ["D4", 1.5], ["E4", 0.5], ["F4", 1], ["D4", 1], ["E4", 1.5], ["F4", 0.5], ["G4", 1], ["D4", 1],
    ["E4", 0.5], ["F#4", 0.5], ["G4", 1], ["A4", 0.5], ["B4", 0.5], ["C5", 1], ["B4", 1], ["A4", 1], ["G4", 2],
    ["G4", 1.5], ["F4", 0.5], ["E4", 1], ["D4", 1], ["C4", 1], ["D4", 1], ["E4", 1], ["C4", 1],
    ["A4", 0.5], ["A4", 0.5], ["A4", 0.5], ["A4", 0.5], ["G4", 1.5], ["F4", 0.5], ["E4", 1], ["D4", 1], ["C4", 2],
  ] },
  { name: "We Wish You a Merry Christmas", bpm: 160, notes: [
    ["G4", 1], ["C5", 1], ["C5", 0.5], ["D5", 0.5], ["C5", 0.5], ["B4", 0.5], ["A4", 1], ["A4", 1], ["A4", 1],
    ["D5", 1], ["D5", 0.5], ["E5", 0.5], ["D5", 0.5], ["C5", 0.5], ["B4", 1], ["G4", 1], ["G4", 1],
    ["E5", 1], ["E5", 0.5], ["F5", 0.5], ["E5", 0.5], ["D5", 0.5], ["C5", 1], ["A4", 1], ["G4", 0.5], ["G4", 0.5],
    ["A4", 1], ["D5", 1], ["B4", 1], ["C5", 3],
  ] },
];

const STEPS = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
function pitch(name) {
  const [, letter, sharp, octave] = /^([A-G])(#?)(\d)$/.exec(name);
  return 440 * 2 ** ((STEPS[letter] + (sharp ? 1 : 0) + (octave - 4) * 12) / 12);
}

const music = { on: false, out: null, timer: null, song: Math.floor(Math.random() * SONGS.length), i: 0, t: 0, bell: 0 };

// Starts the music, or carries on where it stopped. It keeps playing from one level into the next.
export function startMusic() {
  if (music.on || !ready()) return;
  music.on = true;
  music.out = ctx.createGain();
  music.out.gain.value = 1;
  music.out.connect(ctx.destination);
  music.t = music.bell = ctx.currentTime + 0.15;
  queueMusic();
}

export function stopMusic() {
  if (!music.on) return;
  music.on = false;
  clearTimeout(music.timer);
  const out = music.out;
  out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
  setTimeout(() => out.disconnect(), 500);
}

function queueMusic() {
  if (!music.on || !ready()) {
    stopMusic();
    return;
  }
  const ahead = ctx.currentTime + 0.5;
  let song = SONGS[music.song];
  let beat = 60 / song.bpm;
  while (music.t < ahead) {
    if (music.i >= song.notes.length) {
      // A breath between carols, then the next one.
      music.song = (music.song + 1) % SONGS.length;
      music.i = 0;
      music.t += beat * 2;
      song = SONGS[music.song];
      beat = 60 / song.bpm;
      continue;
    }
    const [name, beats] = song.notes[music.i++];
    tone(pitch(name), beats * beat * 0.85, { type: "triangle", volume: 0.05, at: music.t, out: music.out });
    tone(pitch(name) * 2, Math.min(0.12, beats * beat * 0.5), { type: "square", volume: 0.008, at: music.t, out: music.out });
    music.t += beats * beat;
  }
  while (music.bell < ahead) {
    noise(0.07, { volume: 0.025, filter: 7000, type: "highpass", at: music.bell, out: music.out });
    music.bell += beat;
  }
  music.timer = setTimeout(queueMusic, 200);
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
