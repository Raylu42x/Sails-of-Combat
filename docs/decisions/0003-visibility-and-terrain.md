# 0003 — Terrain that blocks sight

**Decided:** 2026-08-30

## Context

Islands had to do two different jobs: some are low enough to sail past and see
over, and some are tall enough to hide a ship behind.

## Decision

Island hexes carry a `height`. `low` blocks movement. `tall` blocks movement and
sight. Sight is a cube-coordinate line walk between two hexes; if any hex
strictly between them is tall land, the line is blocked.

The same test gates four things, deliberately: gunfire, the AI's scoring, the
range readout, and whether the enemy is drawn at all. A ship you cannot see
leaves a dashed circle at her last known bearing.

## Why

One predicate, four consumers, no way for them to disagree — the player can
always trust that what is drawn is what can be shot.

## Cost

Maps with tall land must not scroll: `map.scroll` is false for them, because
sliding every ship to keep the fight centred would slide them relative to land
that cannot move. Open-ocean maps keep the scrolling camera.
