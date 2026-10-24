// Everything the game remembers, in localStorage on this phone only.
// The browser may clear it (clearing site data, or uninstalling the app); that only costs scores.
const KEY = "fruitcake.v2";
const BOARD_SIZE = 10;

const DEFAULTS = {
  player: null,    // { id, initials }: who plays on this phone; id tells two "BOB"s apart online
  sound: true,
  level: 0,        // the level last chosen on the title screen
  boards: {},      // level id → this phone's top 10, [{ initials, score, at }], best first
  hits: {},        // elf id → times hit on this phone
  rounds: 0,
  outbox: [],      // finished rounds waiting to be sent to the family board
  challenge: null, // { initials, score, level } from a challenge link, until it is played
};

let cache = null;

function load() {
  if (cache) return cache;
  try {
    cache = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage full or blocked (private window): keep playing, just without saving.
  }
}

export function get(name) {
  return load()[name];
}

export function set(name, value) {
  load()[name] = value;
  persist();
}

export function setInitials(initials) {
  const data = load();
  data.player = { id: data.player?.id || randomId(), initials };
  persist();
}

function randomId() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function board(levelId) {
  return load().boards[levelId] || [];
}

// This phone's best round on any level.
export function topScore() {
  return Math.max(0, ...Object.values(load().boards).flat().map((r) => r.score));
}

// Saves a finished round on this phone's board. → { rank (1-10, or 0 if it missed the board),
// previousTop (this phone's best before this round, on any level) }
export function recordRound(levelId, score, hits) {
  const data = load();
  const previousTop = topScore();
  const entry = { initials: data.player.initials, score, at: Date.now() };
  // A round that scored nothing stays off the board.
  const list = score > 0
    ? [...board(levelId), entry].sort((a, b) => b.score - a.score || a.at - b.at).slice(0, BOARD_SIZE)
    : board(levelId);
  data.boards[levelId] = list;
  for (const [id, n] of Object.entries(hits)) data.hits[id] = (data.hits[id] || 0) + n;
  data.rounds++;
  persist();
  const rank = score > 0 ? list.indexOf(entry) + 1 : 0;
  return { rank, previousTop };
}
