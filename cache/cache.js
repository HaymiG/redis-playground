import { createClient } from "redis";

const client = createClient();
await client.connect();

const TTL_SECONDS = 300; // cache lives for 5 minutes

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Pretend this is a heavy database query or a slow external API
async function slowQuery(itemId) {
  await sleep(2000);
  return { id: itemId, name: `Item ${itemId}`, fetchedAt: new Date().toISOString() };
}

// Cache-aside pattern
async function getItem(itemId) {
  const key = `item:${itemId}`;

  // 1) Check Redis first
  const cached = await client.get(key);
  if (cached !== null) {
    return { data: JSON.parse(cached), source: "cache" };
  }

  // 2) Cache miss: do the slow work
  const data = await slowQuery(itemId);

  // 3) Save the result in Redis with a timer, then return it
  await client.set(key, JSON.stringify(data), { EX: TTL_SECONDS });
  return { data, source: "slow query" };
}

async function timedCall(label, itemId) {
  const start = performance.now();
  const result = await getItem(itemId);
  const ms = performance.now() - start;
  console.log(`${label}: ${ms.toFixed(2)} ms (from ${result.source})`);
}

await client.del("item:1"); // make sure the first call is a real miss

await timedCall("Cold call", 1);
await timedCall("Warm call", 1);
await timedCall("Warm call", 1);

const ttl = await client.ttl("item:1");
console.log(`\nitem:1 will expire in about ${ttl} seconds`);

await client.quit();
