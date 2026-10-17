# 04 - Distributed Lock

A lock that makes sure only one worker at a time can use a shared resource, even when the workers run in different processes or on different servers.

## Redis commands used

| Command | What it does here |
|---------|-------------------|
| `SET lock:<resource> <token> NX EX 10` | Take the lock only if nobody has it. `NX` = only if the key does not exist. `EX 10` = safety timer of 10 seconds |
| Lua script (`GET` + `DEL`) | Release the lock only if the token matches |

## How it works

**Acquire:** each worker creates a unique random token and tries `SET ... NX EX 10`.
- Reply `OK` means the worker got the lock.
- Reply `null` means someone else already holds it.

**Safety timer (`EX 10`):** if a worker crashes while holding the lock, Redis deletes the key after 10 seconds, so the lock is never stuck forever.

**Safe release:** a worker may only delete the lock if the stored token is its own. Otherwise a slow worker whose lock already expired could delete the lock of another worker. The check and the delete run together in one Lua script, so no one can slip in between them.

```lua
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
```

## Run

```bash
node distributed-lock/lock.js
```

## Expected output

Either worker can win, but only one does.

```
--- Two workers compete ---
Worker A: got the lock, working...
Worker B: lock is taken, giving up
Worker A: released (yes)

--- Safe release demo ---
Lock acquired by the owner
Release with wrong token: NOT deleted
Lock still exists: true
Release with correct token: deleted
```

## Inspect it in redis-cli

Run this while the workers are running (the work step lasts 3 seconds):

```bash
redis-cli
> GET lock:report
> TTL lock:report
```

## Known limitations

- This is a single-Redis-server lock, which is good for learning and for many real apps. For very strict safety across multiple Redis servers, look into the Redlock algorithm.
- If the work takes longer than the TTL, the lock expires and another worker can enter. Pick a TTL longer than your work, or renew the lock while working.