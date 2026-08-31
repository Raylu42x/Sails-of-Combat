# 0002 — Fleets and scenarios instead of you-versus-foe

**Decided:** 2026-08-30

## Context

The original code had two variables, `you` and `foe`, threaded through
movement, gunnery, the AI and the win conditions. Protect missions need a third
ship, and a squadron action needs several. Win conditions were hard-coded to
"sink the other one".

## Decision

- One flat `ships` array. Each ship carries a `side` (`friendly` / `hostile`),
  which decides who shoots whom, and a `role` (`player` / `enemy` / `quarry` /
  `ward`), which is what the objectives inspect.
- Levels are data: a map, a ship list, an objective and a briefing.
- Objectives are one function returning a verdict or `null`; a new level type is
  a new `case`.
- The AI has a mood — `engage`, `flee` or `escort` — that changes only how a
  move is scored, not how moves are searched.

## Why

Every requested level type turns out to be a combination of these three axes.
"Chase" is a hostile with `ai: 'flee'` and an objective that watches distance.
"Protect" is a friendly with `role: 'ward'` and an objective that watches its
hull. Neither needed engine changes once the shape was right.

## Cost

Everything is a little more indirect than `you.hull`. The trade is that
`data/scenarios.js` is now the only file most new content touches.
