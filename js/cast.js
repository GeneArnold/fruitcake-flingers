// The elves and the sayings, loaded from elves/elves.json and sayings/sayings.json.
// Adding an elf is an entry in the file plus a face picture; no code changes.

let elves = [];
let sayings = { hit: [], miss: [], gentle: [], trash: [] };

export function setData(elvesJson, sayingsJson) {
  elves = elvesJson.elves;
  sayings = { ...sayings, ...sayingsJson };
}

export function everyone() {
  return elves;
}

export function elf(id) {
  return elves.find((e) => e.id === id) || null;
}

// Texture key of a face picture; a missing splat or dazed face falls back to the normal one.
export function faceKey(scene, e, kind = "normal") {
  const key = `face-${e.id}-${kind}`;
  return scene.textures.exists(key) ? key : `face-${e.id}-normal`;
}

// A random saying of one kind ("hit", "miss", "gentle" or "trash"), avoiding the one said last time.
const lastSaid = {};
export function randomSaying(kind) {
  const list = sayings[kind] || [];
  if (list.length === 0) return { text: "" };
  let pick = list[Math.floor(Math.random() * list.length)];
  if (list.length > 1 && pick === lastSaid[kind]) pick = list[(list.indexOf(pick) + 1) % list.length];
  lastSaid[kind] = pick;
  return pick;
}

// The recorded clip of a saying in this elf's voice, or null when it has not been recorded.
// Clips live at sayings/voices/v<voice>/<saying id>.mp3; `voices` on a saying lists which exist.
export function voiceClip(e, saying) {
  const recorded = saying.voices || [];
  if (!saying.id || recorded.length === 0) return null;
  const mine = `v${e?.voice ?? 0}`;
  const voice = recorded.includes(mine) ? mine : recorded[0];
  return `sayings/voices/${voice}/${saying.id}.mp3`;
}

// Elves come from a shuffled deck, refilled only when everyone has appeared, so all 20 pop up
// within a round or two.
let deck = [];

export function nextElf(busyIds) {
  for (let tries = 0; tries < 2; tries++) {
    if (deck.length === 0) deck = shuffle([...elves]);
    const i = deck.findLastIndex((e) => !busyIds.has(e.id));
    if (i >= 0) return deck.splice(i, 1)[0];
    deck = [];
  }
  return null;
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
