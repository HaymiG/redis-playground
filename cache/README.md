# 03 - Cache in Front of a Slow Call

Uses Redis as a cache so a slow operation (a heavy database query or an external API) only runs once, and later calls return instantly.

## Redis commands used

| Command | What it does here |
|---------|-------------------|
| `GET item:<id>` | Check if the result is already cached |
| `SET item:<id> <value> EX 300` | Save the result and delete it automatically after 300 seconds |
| `TTL item:<id>` | See how many seconds are left before the cache entry expires |

## The cache-aside pattern

```
Request
  |
  v
Check Redis ──hit──> return cached value (fast)
  |
 miss
  |
  v
Run the slow function
  |
  v
SET key value EX 300
  |
  v
Return the value
```

1. **Check Redis first.**
2. **On a miss**, run the slow function.
3. **Save** the result in Redis with an expiry time.
4. **Return** it. The next call is a hit.

## Run

```bash
node 03-cache/cache.js
```

## Expected output

```
Cold call: 2004.20 ms (from slow query)
Warm call: 0.93 ms (from cache)
Warm call: 0.64 ms (from cache)

item:1 will expire in about 300 seconds
```

The slow query is simulated with a 2 second delay. Your warm times will be around 1 ms or less.

## Inspect it in redis-cli

```bash
redis-cli
> GET item:1
> TTL item:1
> DEL item:1
```

## Notes

- **Expiry (TTL)** stops the cache from keeping old data forever. Choose it based on how fresh your data must be.
- If the underlying data changes, delete the key (`DEL`) so the next request fetches fresh data. This is called cache invalidation.
- Redis stores strings, so objects are saved with `JSON.stringify` and read with `JSON.parse`.