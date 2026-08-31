# Sails of Combat

A turn-based age-of-sail gunnery game that runs in the browser with no build
step, no dependencies and no server logic. You give orders — helm, sails, guns
— both sides commit blind, and then the turn plays out.

## Running it

ES modules will not load from `file://`, so serve the folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Any static host works — GitHub Pages serves
this repo as-is.

## Playing

Each turn you set four orders and press **Make it so**:

| Order | What it does |
| --- | --- |
| **Helm** | Turn one or two points to port or starboard. Turning through the eye of the wind is a tack — a fore-and-aft rig usually makes it, a square rig often misses stays and is caught **in irons**. |
| **Sails** | *Full* is fastest but sends the gun crews aloft, so the guns stay silent. *Battle* is the fighting sail. *Take in* is slow but lets the topmen repair rigging. |
| **Guns** | *Round* hulls her at long range, *chain* cuts her rigging, *grape* kills crew up close, *double* is a short-range hull-smasher that reloads slowly. *Hold* keeps the batteries loaded. |
| **Close** | Grapple and board when you are alongside — then it is crew against crew. |

Things worth knowing:

- **Guns fire as they bear.** Each battery has its own arc and its own reload
  clock. A ship with bow or stern chasers can fire them in the same turn as a
  broadside, which is what makes a stern chase worth sailing.
- **Raking wins fights.** Crossing an enemy's bow does 1.5× damage; crossing
  her stern does 2× and may shoot away her rudder.
- **Wind is everything.** Speed depends on your point of sail and on how hard
  it is blowing. The wind shifts on the map's own schedule.
- **Tall islands block sight.** An enemy behind one disappears from the chart
  and leaves a dashed last-known bearing behind.

## Project layout

```
index.html            markup only
src/main.js           wires the pieces together
src/core/             the rules — no DOM anywhere in here
  hex.js              hex maths, distance, bearings, sight lines
  rng.js              the one source of randomness (seedable)
  wind.js             points of sail, wind strength, wind shifts
  ship.js             ship instances, speed, helm, tacking
  board.js            chart bounds, land, what blocks sight
  movement.js         tracks and simultaneous movement
  combat.js           gun arcs, damage, grappling, boarding
  ai.js               enemy orders (engage / flee / escort)
  objectives.js       win and loss conditions per level type
  game.js             the turn loop
src/data/             content, as plain data
  ships.js            ship classes and their gun mounts
  maps.js             charts, wind, islands
  scenarios.js        levels
src/render/           canvas layout and drawing
src/ui/               log, ship cards, order buttons, briefing overlay
src/styles/           tokens, layout, components
tests/smoke.mjs       headless run of every scenario
```

The core never touches the DOM. It emits events (`log`, `change`, `busy`,
`finished`) and calls a small `view` adapter for anything that takes time, so
the whole simulation can run headless — which is exactly what the smoke test
does.

## Adding content

**A new ship class** — add an entry to `src/data/ships.js`. `speeds` is hexes
made good at each point of sail (in irons, close-hauled, reaching, running).
`mounts` are gun groups; `arcs` are bearings relative to the bow, where 0 is
dead ahead, 1 and 2 are starboard, 3 is dead astern, 4 and 5 are port. Give a
mount `power` below 1 and it is a light chaser; above 1 and it is a heavy
battery.

**A new map** — add an entry to `src/data/maps.js`: size, wind direction and
strength, and a list of island hexes with `height: 'low'` (blocks passage) or
`'tall'` (blocks passage and sight). Set `scroll: true` for open water, where
the chart slides to keep the fight centred, or `false` for fixed waters where
the land has to stay put.

**A new level** — add an entry to `src/data/scenarios.js`: a map, a list of
ships with sides and roles, an objective, and the briefing text. Objectives
that exist today are `duel`, `chase`, `protect` and `survive`; a new type is a
new case in `src/core/objectives.js`.

## Tests

```bash
node tests/smoke.mjs
```

Plays every scenario 25 times with random orders and a seeded RNG, and fails if
the rules throw or a fight never reaches a verdict.

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the pieces fit together
- [docs/ROADMAP.md](docs/ROADMAP.md) — what to build next, and why
- [docs/decisions/](docs/decisions/) — decision records
