// The score service's storage: one DynamoDB table, keys PK and SK, no indexes.
//   SCORES#<game>#<level>          SK <inverted score>#<at>#<player>   every round, best first
//   WEEK#<game>#<level>#<week>     same, kept 8 weeks (TTL on `expires`)
//   HITS#<game>                    SK <elf id>, `n` counts every hit by everyone
// Sorting by the inverted score makes "top 10" a plain query of the first 10 items.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { isoWeek } from "./handler.mjs";

const SCORE_SPAN = 10_000_000;

export function dynamoStore(table) {
  const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  const sortKey = (r) => `${String(SCORE_SPAN - r.score).padStart(8, "0")}#${r.at}#${r.player}`;

  return {
    async putRound(r) {
      const item = { SK: sortKey(r), initials: r.initials, score: r.score, at: r.at, player: r.player };
      await db.send(new PutCommand({ TableName: table, Item: { PK: `SCORES#${r.game}#${r.level}`, ...item } }));
      await db.send(new PutCommand({
        TableName: table,
        Item: { PK: `WEEK#${r.game}#${r.level}#${isoWeek(r.at)}`, ...item, expires: Math.floor(r.at / 1000) + 56 * 86400 },
      }));
    },

    async addHits(game, hits) {
      for (const [elf, n] of Object.entries(hits)) {
        await db.send(new UpdateCommand({
          TableName: table,
          Key: { PK: `HITS#${game}`, SK: elf },
          UpdateExpression: "ADD n :n",
          ExpressionAttributeValues: { ":n": n },
        }));
      }
    },

    async topScores(game, level, period, limit) {
      const pk = period === "week" ? `WEEK#${game}#${level}#${isoWeek(Date.now())}` : `SCORES#${game}#${level}`;
      const out = await db.send(new QueryCommand({
        TableName: table, KeyConditionExpression: "PK = :pk", ExpressionAttributeValues: { ":pk": pk }, Limit: limit,
      }));
      return (out.Items || []).map(({ initials, score, at, player }) => ({ initials, score, at, player }));
    },

    async mostWanted(game) {
      const hits = {};
      let start;
      do {
        const out = await db.send(new QueryCommand({
          TableName: table, KeyConditionExpression: "PK = :pk", ExpressionAttributeValues: { ":pk": `HITS#${game}` },
          ExclusiveStartKey: start,
        }));
        for (const item of out.Items || []) hits[item.SK] = item.n;
        start = out.LastEvaluatedKey;
      } while (start);
      return hits;
    },
  };
}
