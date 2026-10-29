// Everything the game remembers, in localStorage on this phone only.
// The browser may clear it (clearing site data, or uninstalling the app); that only costs scores.
const KEY = "fruitcake.v2";
const BOARD_SIZE = 10;
// A game runs through every level, so there is one board, under this name.
// Boards named after levels are from before, when each level was played on its own.
export const GAME_BOARD = "game";

const DEFAULTS = {
  player: null,    // { initials }: who plays on this phone
  sound: true,
  boards: {},      // board name → this phone's top 10, [{ initials, score, at }], best first
  hits: {},        // elf id → times hit on this phone
  rounds: 0,
  challenge: null, // { initials, score } from a challenge link, until it is played
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
  data.player = { initials };
  persist();
}

export function board(name = GAME_BOARD) {
  return load().boards[name] || [];
}

// This phone's best game.
export function topScore() {
  return Math.max(0, ...board().map((r) => r.score));
}

// Saves a finished game on this phone's board. → { rank (1-10, or 0 if it missed the board),
// previousTop (this phone's best before this game) }
export function recordRound(boardName, score, hits) {
  const data = load();
  const previousTop = topScore();
  const entry = { initials: data.player.initials, score, at: Date.now() };
  // A round that scored nothing stays off the board.
  const list = score > 0
    ? [...board(boardName), entry].sort((a, b) => b.score - a.score || a.at - b.at).slice(0, BOARD_SIZE)
    : board(boardName);
  data.boards[boardName] = list;
  for (const [id, n] of Object.entries(hits)) data.hits[id] = (data.hits[id] || 0) + n;
  data.rounds++;
  persist();
  const rank = score > 0 ? list.indexOf(entry) + 1 : 0;
  return { rank, previousTop };
}
