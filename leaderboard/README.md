# 02 - Leaderboard with Sorted Sets

A game leaderboard where Redis keeps players sorted by score. You never sort anything yourself.

## Redis commands used

| Command | What it does here |
|---------|-------------------|
| `ZADD leaderboard <score> <player>` | Adds a player, or updates their score |
| `ZREVRANGE leaderboard 0 9 WITHSCORES` | Top 10 players with scores (highest first) |
| `ZREVRANK leaderboard <player>` | A player's rank (0 = first place) |
| `ZINCRBY leaderboard <points> <player>` | Adds points to a player's score |

In the Node.js client these are `zAdd`, `zRangeWithScores` (with `{ REV: true }`), `zRevRank`, and `zIncrBy`.

## How it works

A **sorted set** is a Redis data type where every member has a score. Redis keeps the members ordered by score all the time, so when a score changes, the order updates automatically.

The script:
1. Adds 300 players with unique random scores.
2. Prints the top 10.
3. Looks up the rank of `player5`.
4. Adds 5000 points to `player5` and shows the rank jump to #1.
5. Checks all 300 ranks against a plain JavaScript sort to prove Redis is correct.
6. Changes 100 random scores and checks the leaderboard is still sorted.

## Run

```bash
node 02-leaderboard/leaderboard.js
```

## Expected output

Scores are random, so your numbers will be different.

```
Added 300 players

Top 10:
#1  player33  1000
#2  player137  945
...

player5 rank: 210 (score 288)
player5 rank after +5000 points: 1

Top 10 after the update:
#1  player5  5288
...

Verifying ranks...
All 300 ranks are correct

Changing 100 random scores...
Leaderboard is still sorted correctly
```

## Inspect it in redis-cli

```bash
redis-cli
> ZREVRANGE leaderboard 0 9 WITHSCORES
> ZREVRANK leaderboard player5
> ZCARD leaderboard
```

## Notes

- Adding or updating a score costs O(log N), so it stays fast even with millions of players.
- Players with the same score are ordered alphabetically by Redis. The demo uses unique scores so the check is simple.