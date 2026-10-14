# 01 - Fixed-Window Rate Limiter

Limits how many requests one user can make in a fixed time window. When the limit is passed, requests are blocked until the window resets.

## Redis commands used

| Command | What it does here |
|---------|-------------------|
| `INCR ratelimit:<userId>` | Adds 1 to the user's counter and returns the new value |
| `EXPIRE ratelimit:<userId> <seconds>` | Tells Redis to delete the counter after the window ends |

## How it works

1. On every request, run `INCR`. If the key does not exist, Redis creates it and returns `1`.
2. If the value is `1`, this is the first request of a new window, so set `EXPIRE`.
3. If the value is greater than the limit, **block** the request. Otherwise **allow** it.
4. When Redis deletes the key, the next request starts a new window.

```
Window starts ─────────────── 10 seconds ─────────────── Window ends
 req1 req2 req3 req4 req5  |  req6 (BLOCKED) req7 (BLOCKED)
 counter: 1 2 3 4 5        |  6 7
                                                    key deleted -> counter resets
```

## Run

Make sure Redis is running (`redis-cli ping` should reply `PONG`), then from the repo root:

```bash
npm install
node rate-limiter/rateLimiter.js
```

## Expected output

```
1 allowed
2 allowed
3 allowed
4 allowed
5 allowed
6 BLOCKED
7 BLOCKED
8 BLOCKED
Waiting 11 seconds for the window to reset...
After reset: allowed
```

## Configuration

| Constant | Demo value | Typical production value |
|----------|-----------|--------------------------|
| `LIMIT`  | 5         | 100                      |
| `WINDOW` | 10 sec    | 60 sec                   |

## Inspect it in redis-cli

```bash
redis-cli
> GET ratelimit:user1
> TTL ratelimit:user1
> DEL ratelimit:user1
```

## Known limitations

- **Boundary burst:** a user can send the full limit at the end of one window and again at the start of the next. Sliding-window or token-bucket limiters fix this.
- `INCR` and `EXPIRE` are two separate commands. If the app crashes between them, the key may never expire. A Lua script or `MULTI` makes them atomic.
- The limit is per `userId`. For anonymous endpoints, use the client IP address.