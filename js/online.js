// The family scoreboard online, through the Shed service: sends finished rounds and reads the boards.
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
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Queues a finished round for the family board and tries to send everything waiting.
export function postRound(levelId, score, hits) {
  if (!enabled()) return;
  const player = store.get("player");
  const round = { board: levelId, score, counts: { hits }, initials: player.initials, player: player.id, at: Date.now() };
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
        await call("/scores", round);
      } catch (err) {
        // The service turned this round down (4xx): sending it again won't help, so let it go.
        // Anything else is no signal or the service being down: try again next time.
        if (!(err.status >= 400 && err.status < 500 && err.status !== 429)) break;
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
    const q = new URLSearchParams({ board: levelId, period });
    return (await call(`/scores?${q}`)).scores;
  } catch {
    return null;
  }
}

// Which elves the whole family has hit most. → { elfId: hits } or null
export async function mostWanted() {
  if (!enabled()) return null;
  try {
    return (await call("/counters/hits")).counts;
  } catch {
    return null;
  }
}
