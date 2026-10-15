import { createClient } from "redis";

const client = createClient();
await client.connect();

const KEY = "leaderboard";
const PLAYER_COUNT = 300;

await client.del(KEY); // clean start

// We keep our own copy of the scores ONLY to double-check Redis.
// Redis does all the real sorting.
const scores = new Map();

// Unique scores (1..1000) so there are no ties to worry about
const pool = Array.from({ length: 1000 }, (_, i) => i + 1);
pool.sort(() => Math.random() - 0.5);

for (let i = 0; i < PLAYER_COUNT; i++) {
        scores.set(`player${i}`, pool[i]);
}

// 1) Record scores: ZADD leaderboard <score> <player>
await client.zAdd(
  KEY,
  [...scores].map(([value, score]) => ({ score, value }))
);
console.log(`Added ${PLAYER_COUNT} players`);

// 2) Top 10: ZREVRANGE leaderboard 0 9 WITHSCORES
async function printTop10() {
  const top = await client.zRangeWithScores(KEY, 0, 9, { REV: true });
  top.forEach((entry, i) => {
    console.log(`#${i + 1}  ${entry.value}  ${entry.score}`);
  });
}

console.log("\nTop 10:");
await printTop10();

// 3) Rank of one player: ZREVRANK leaderboard <player>  (0 = first place)
const rank = await client.zRevRank(KEY, "player5");
console.log(`\nplayer5 rank: ${rank + 1} (score ${scores.get("player5")})`);

// 4) Change a score. Redis re-orders everything by itself.
await client.zIncrBy(KEY, 5000, "player5");
scores.set("player5", scores.get("player5") + 5000);

const newRank = await client.zRevRank(KEY, "player5");
console.log(`player5 rank after +5000 points: ${newRank + 1}`); // should be 1

console.log("\nTop 10 after the update:");
await printTop10();

// 5) Verify every rank against our own copy
async function verifyAllRanks() {
  const expected = [...scores]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  for (let i = 0; i < expected.length; i++) {
    const redisRank = await client.zRevRank(KEY, expected[i]);
    if (redisRank !== i) {
      throw new Error(`Wrong rank for ${expected[i]}: Redis=${redisRank}, expected=${i}`);
    }
  }
  console.log(`All ${expected.length} ranks are correct`);
}

console.log("\nVerifying ranks...");
await verifyAllRanks();

// 6) Change 100 random scores, then check the order is still correct.
// Random changes can create ties, so we check that scores never go up
// as we move down the list.
console.log("\nChanging 100 random scores...");
for (let i = 0; i < 100; i++) {
  const name = `player${Math.floor(Math.random() * PLAYER_COUNT)}`;
  const points = Math.floor(Math.random() * 50) + 1;
  await client.zIncrBy(KEY, points, name);
}

const all = await client.zRangeWithScores(KEY, 0, -1, { REV: true });
let stillSorted = true;
for (let i = 1; i < all.length; i++) {
  if (all[i - 1].score < all[i].score) stillSorted = false;
}
console.log(stillSorted ? "Leaderboard is still sorted correctly" : "Sorting problem!");

await client.quit();