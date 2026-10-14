import { createClient } from "redis";

const client = createClient(); 
await client.connect();

const LIMIT = 5;    
const WINDOW = 10;  

async function isAllowed(userId) {
  const key = `ratelimit:${userId}`;
  const count = await client.incr(key);  

  if (count === 1) {
    await client.expire(key, WINDOW);     
  }

  return count <= LIMIT;                 
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Demo: send 8 requests quickly
for (let i = 1; i <= 8; i++) {
  const ok = await isAllowed("user1");
  console.log(i, ok ? "allowed" : "BLOCKED");
}

console.log(`Waiting ${WINDOW + 1} seconds for the window to reset...`);
await sleep((WINDOW + 1) * 1000);

console.log("After reset:", (await isAllowed("user1")) ? "allowed" : "BLOCKED");

await client.quit();