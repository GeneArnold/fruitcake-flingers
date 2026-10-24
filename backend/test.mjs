// Tests the score service against an in-memory store:  node backend/test.mjs
import assert from "node:assert/strict";
import { isoWeek, makeHandler } from "./handler.mjs";

function memoryStore() {
  const rounds = [];
  const hits = {};
  return {
    async putRound(r) {
      rounds.push(r);
    },
    async addHits(game, h) {
      for (const [id, n] of Object.entries(h)) hits[`${game}/${id}`] = (hits[`${game}/${id}`] || 0) + n;
    },
    async topScores(game, level, period, limit) {
      const week = isoWeek(Date.now());
      return rounds
        .filter((r) => r.game === game && r.level === level && (period === "all" || isoWeek(r.at) === week))
        .sort((a, b) => b.score - a.score || a.at - b.at)
        .slice(0, limit)
        .map(({ initials, score, at, player }) => ({ initials, score, at, player }));
    },
    async mostWanted(game) {
      return Object.fromEntries(Object.entries(hits).filter(([k]) => k.startsWith(`${game}/`)).map(([k, n]) => [k.split("/")[1], n]));
    },
  };
}

const handler = makeHandler(memoryStore(), "secret-ish");
const post = (body) => handler({ requestContext: { http: { method: "POST" } }, rawPath: "/rounds", body: JSON.stringify(body) });
const get = (path, q) => handler({ requestContext: { http: { method: "GET" } }, rawPath: path, queryStringParameters: q });
const json = (res) => JSON.parse(res.body);
const round = { game: "fruitcake", level: "mall", initials: "GEN", player: "p-1", score: 1200, hits: { jingles: 2, figgy: 1 }, code: "secret-ish" };

assert.equal((await post(round)).statusCode, 200);
assert.equal((await post({ ...round, initials: "BOB", player: "p-2", score: 4250, hits: { jingles: 1 } })).statusCode, 200);
assert.equal((await post({ ...round, score: 300, at: Date.now() - 40 * 86400_000 })).statusCode, 200); // old "at" is replaced by now

const all = json(await get("/scores", { game: "fruitcake", level: "mall", period: "all" })).scores;
assert.deepEqual(all.map((s) => [s.initials, s.score]), [["BOB", 4250], ["GEN", 1200], ["GEN", 300]]);
assert.equal(json(await get("/scores", { game: "fruitcake", level: "mall", period: "week" })).scores.length, 3);
assert.equal(json(await get("/scores", { game: "fruitcake", level: "house" })).scores.length, 0);
assert.deepEqual(json(await get("/most-wanted", { game: "fruitcake" })).hits, { jingles: 5, figgy: 2 });

// Rejections
assert.equal((await post({ ...round, code: "nope" })).statusCode, 403);
assert.equal((await post({ ...round, initials: "gene" })).statusCode, 400);
assert.equal((await post({ ...round, score: -5 })).statusCode, 400);
assert.equal((await post({ ...round, score: 2_000_000 })).statusCode, 400);
assert.equal((await post({ ...round, score: 12.5 })).statusCode, 400);
assert.equal((await post({ ...round, hits: { "Bad Id": 1 } })).statusCode, 400);
assert.equal((await post({ ...round, level: "../x" })).statusCode, 400);
assert.equal((await handler({ requestContext: { http: { method: "POST" } }, rawPath: "/rounds", body: "{nope" })).statusCode, 400);
assert.equal((await get("/nowhere", {})).statusCode, 404);
assert.equal((await get("/scores", { game: "fruitcake" })).statusCode, 400);

assert.equal(isoWeek(Date.UTC(2026, 0, 1)), "2026-W01");
assert.equal(isoWeek(Date.UTC(2026, 9, 24)), "2026-W43");
assert.equal(isoWeek(Date.UTC(2027, 0, 1)), "2026-W53");
console.log("score service: all tests pass");
