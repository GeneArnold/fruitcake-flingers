// The family score service: one Lambda behind a function URL, shared by every game.
//   POST /rounds        { game, level, initials, player, score, hits, at, code } → { ok: true }
//   GET  /scores        ?game=&level=&period=all|week → { scores: [{ initials, score, at, player }] }
//   GET  /most-wanted   ?game= → { hits: { elfId: n } }
// CORS is set on the function URL itself (template.yaml), not here.
// The family code only keeps random internet traffic out; it is in the game, so it is not a secret.

const NAME = /^[a-z0-9-]{1,32}$/;
const INITIALS = /^[A-Z]{1,3}$/;
const PLAYER = /^[A-Za-z0-9-]{1,64}$/;
const MAX_SCORE = 1_000_000;

export function makeHandler(store, familyCode) {
  return async (event) => {
    const method = event.requestContext?.http?.method || "GET";
    const path = event.rawPath || "/";
    try {
      if (method === "POST" && path === "/rounds") return await postRound(store, familyCode, parseBody(event));
      if (method === "GET" && path === "/scores") return await getScores(store, event.queryStringParameters || {});
      if (method === "GET" && path === "/most-wanted") return await getMostWanted(store, event.queryStringParameters || {});
      return reply(404, { error: "not found" });
    } catch (err) {
      if (err.status) return reply(err.status, { error: err.message });
      console.error(err);
      return reply(500, { error: "server error" });
    }
  };
}

async function postRound(store, familyCode, body) {
  if (body.code !== familyCode) throw bad("wrong family code", 403);
  const { game, level, initials, player, score, hits = {} } = body;
  if (!NAME.test(game ?? "") || !NAME.test(level ?? "")) throw bad("bad game or level");
  if (!INITIALS.test(initials ?? "")) throw bad("bad initials");
  if (!PLAYER.test(player ?? "")) throw bad("bad player");
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) throw bad("bad score");
  const hitList = Object.entries(hits);
  if (hitList.length > 50 || hitList.some(([id, n]) => !NAME.test(id) || !Number.isInteger(n) || n < 1 || n > 100)) throw bad("bad hits");
  const at = Number.isInteger(body.at) && Math.abs(Date.now() - body.at) < 30 * 86400_000 ? body.at : Date.now();
  await store.putRound({ game, level, initials, player, score, at });
  if (hitList.length) await store.addHits(game, Object.fromEntries(hitList));
  return reply(200, { ok: true });
}

async function getScores(store, q) {
  if (!NAME.test(q.game ?? "") || !NAME.test(q.level ?? "")) throw bad("bad game or level");
  const period = q.period === "week" ? "week" : "all";
  return reply(200, { scores: await store.topScores(q.game, q.level, period, 10) });
}

async function getMostWanted(store, q) {
  if (!NAME.test(q.game ?? "")) throw bad("bad game");
  return reply(200, { hits: await store.mostWanted(q.game) });
}

function parseBody(event) {
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString() : event.body;
    return JSON.parse(raw || "{}");
  } catch {
    throw bad("bad json");
  }
}

function bad(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

function reply(statusCode, body) {
  return { statusCode, headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}

// ISO week, e.g. "2026-W43", for the weekly boards.
export function isoWeek(ms) {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d - yearStart) / 86400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
