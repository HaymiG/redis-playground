import { createClient } from "redis";
import { randomUUID } from "node:crypto";

const client = createClient();
await client.connect();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Lua script: delete the key ONLY if the stored token matches.
// Redis runs the whole script as one step, so nobody can sneak in between
// the "check" and the "delete".
const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

// SET lock:<resource> <token> NX EX 10
// NX = only set if the key does NOT exist, EX = safety timer in seconds
async function acquire(resource, token, ttl = 10) {
  const result = await client.set(`lock:${resource}`, token, { NX: true, EX: ttl });
  return result === "OK"; // null means somebody else holds the lock
}

async function release(resource, token) {
  const deleted = await client.eval(RELEASE_SCRIPT, {
    keys: [`lock:${resource}`],
    arguments: [token],
  });
  return deleted === 1;
}

async function worker(name, resource) {
  const token = randomUUID(); // unique id that proves "this lock is mine"

  const got = await acquire(resource, token);
  if (!got) {
    console.log(`${name}: lock is taken, giving up`);
    return;
  }

  console.log(`${name}: got the lock, working...`);
  await sleep(3000); // pretend to do important work
  const released = await release(resource, token);
  console.log(`${name}: released (${released ? "yes" : "no, lock expired or was not mine"})`);
}

await client.del("lock:report"); // clean start

// Demo 1: two workers compete for the same resource
console.log("--- Two workers compete ---");
await Promise.all([worker("Worker A", "report"), worker("Worker B", "report")]);

// Demo 2: you can never delete someone else's lock
console.log("\n--- Safe release demo ---");
const ownerToken = randomUUID();
await acquire("report", ownerToken);
console.log("Lock acquired by the owner");

const wrongRelease = await release("report", "some-other-token");
console.log(`Release with wrong token: ${wrongRelease ? "deleted" : "NOT deleted"}`);
console.log(`Lock still exists: ${(await client.exists("lock:report")) === 1}`);

const rightRelease = await release("report", ownerToken);
console.log(`Release with correct token: ${rightRelease ? "deleted" : "NOT deleted"}`);

await client.quit();
