# Redis Playground

Four small projects for learning Redis with Node.js. Each project is one file in its own folder, with its own README.

| # | Project | Folder | Redis feature |
|---|---------|--------|---------------|
| 1 | Fixed-window rate limiter | [`01-rate-limiter`](./01-rate-limiter) | `INCR`, `EXPIRE` |
| 2 | Leaderboard | [`02-leaderboard`](./02-leaderboard) | Sorted sets (`ZADD`, `ZREVRANGE`, `ZREVRANK`) |
| 3 | Cache in front of a slow call | [`03-cache`](./03-cache) | `SET ... EX`, `GET`, `TTL` |
| 4 | Distributed lock | [`04-distributed-lock`](./04-distributed-lock) | `SET ... NX EX`, Lua script |

## Requirements

- Node.js 18 or newer
- Redis server running on `localhost:6379`

## Setup (Ubuntu)

```bash
sudo apt install redis-server
sudo systemctl start redis-server
redis-cli ping        # should reply PONG
```

```bash
git clone https://github.com/HaymiG/redis-playground.git
cd redis-playground
npm install
```

## Run

```bash
npm run rate-limiter
npm run leaderboard
npm run cache
npm run lock
```

Or run a file directly, for example `node 02-leaderboard/leaderboard.js`.

## Project structure

```
redis-playground/
├── rate-limiter/
│   ├── rateLimiter.js
│   └── README.md
├── leaderboard/
│   ├── leaderboard.js
│   └── README.md
├── cache/
│   ├── cache.js
│   └── README.md
├── distributed-lock/
│   ├── lock.js
│   └── README.md
├── package.json
├── .gitignore
└── README.md
```

## Tech stack

- Node.js (ES modules)
- Redis
- [`redis`](https://www.npmjs.com/package/redis) npm client