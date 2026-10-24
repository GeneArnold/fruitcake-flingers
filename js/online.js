// The family scoreboard online: sends finished rounds and reads the family boards.
// Rounds wait in the phone's outbox until they get through, so playing with no signal is fine.
// With no scoresUrl configured everything here quietly does nothing and the boards stay local.
import { CONFIG } from "./config.js";
import * as store from "./storage.js";

const TIMEOUT_MS = 5000;

export function enabled() {
  return Boolean(CONFIG.scoresUrl);
}

async function call(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(CONFIG.scoresUrl.replace(/\/$/, "") + path, {
      method: body ? "POST" : "GET",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify({ ...body, game: CONFIG.game, code: CONFIG.familyCode }) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Queues a finished round for the family board and tries to send everything waiting.
export function postRound(levelId, score, hits) {
  if (!enabled()) return;
  const player = store.get("player");
  const round = { level: levelId, score, hits, initials: player.initials, player: player.id, at: Date.now() };
  store.set("outbox", [...store.get("outbox"), round].slice(-50));
  return flush();
}

let flushing = null;
export function flush() {
  if (!enabled() || flushing) return flushing;
  flushing = (async () => {
    let sent = 0;
    while (store.get("outbox").length) {
      const [round, ...rest] = store.get("outbox");
      try {
        await call("/rounds", round);
      } catch {
        break; // offline or the service is down; try again next time
      }
      store.set("outbox", rest);
      sent++;
    }
    return sent;
  })().finally(() => (flushing = null));
  return flushing;
}

// The family's top 10 on a level. period: "all" or "week". → [{ initials, score, at }] or null
export async function topScores(levelId, period = "all") {
  if (!enabled()) return null;
  try {
    const q = new URLSearchParams({ game: CONFIG.game, level: levelId, period });
    return (await call(`/scores?${q}`)).scores;
  } catch {
    return null;
  }
}

// Which elves the whole family has hit most. → { elfId: hits } or null
export async function mostWanted() {
  if (!enabled()) return null;
  try {
    return (await call(`/most-wanted?game=${CONFIG.game}`)).hits;
  } catch {
    return null;
  }
}
