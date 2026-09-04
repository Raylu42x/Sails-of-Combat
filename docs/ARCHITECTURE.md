# Architecture

## The one rule

`src/core/` contains the rules and nothing else. No `document`, no `window`, no
`canvas`. Everything the core wants to say, it emits; everything it wants drawn,
it asks the `view` adapter for. That is what lets `tests/smoke.mjs` play whole
scenarios in Node with a four-line stub view, and it is the constraint to
protect when adding features.

## Flow of a turn

```
  UI button ──► game.execute()
                   │
                   ├─ aiOrders() for every non-player ship        (core/ai.js)
                   ├─ recenter the chart if the map scrolls
                   ├─ applyHelm() for everyone                    (core/ship.js)
                   ├─ moveShips() — simultaneous                  (core/movement.js)
                   │     └─ await view.animateMoves(...)          (render/renderer.js)
                   ├─ tryGrapple()                                (core/combat.js)
                   ├─ fireAll() per ship, one result per mount    (core/combat.js)
                   │     └─ await view.animateShot(result, apply)
                   ├─ endOfTurn() — repairs, reloads, strikes, wind shift
                   └─ evaluate() — a verdict, or null             (core/objectives.js)
                          │
                          └─ emit 'finished' ──► banner
```

Events the core emits, all consumed in `src/main.js`:

| Event | Payload | UI reaction |
| --- | --- | --- |
| `log` | `{ msg, cls }` | append a line to the captain's log |
| `reset` | `ctx` | clear the log, rebuild ship cards, resize the chart |
| `change` | `ctx` | refresh HUD, orders and chart |
| `busy` | `bool` | disable **Make it so** during the animation |
| `finished` | verdict | show the end-of-action overlay |

## The context object

`game.state()` returns the whole world:

```js
{ scenario, map, wind, board, ships, you, turn, over, busy }
```

`ships` is a flat list. There is no "player ship and enemy ship" any more —
`side` (`friendly` / `hostile`) decides who shoots whom, and `role`
(`player` / `enemy` / `quarry` / `ward`) is what objectives look at. Adding a
third ship to a scenario needs no engine change; the HUD builds its cards from
this list.

## Levels

One file per level in `levels/`, plus `levels/index.js` listing them in play
order. A level is data — a map, a ship list, an objective and a briefing — and
adding one needs no engine change. They are kept as small modules rather than
JSON so they load unchanged in the browser and in Node, which is what lets the
test harnesses import them directly with no loader and no build step.

## Coordinates

Flat-top hexes in axial `(q, r)`, drawn as odd-q offset. `core/hex.js` owns all
of it and is pure — `unitPos()` gives a layout position at unit scale, and
`render/layout.js` multiplies by the current hex size. That separation is why
bearings and sight lines can be computed in Node with no canvas.

Sight lines use a cube-coordinate line walk (`hex.line`). `board.sightBlocked()`
returns true if any hex strictly between two ships is tall land; the same test
gates gunfire, the AI's plans, the range readout and whether an enemy is drawn
at all.

## Gun mounts and charges

A mount is `{ label, tag, arcs, gun, power, reload, chaser }` on the ship class,
and `gun` names a piece in `GUN_TYPES` that modifies range, weight of metal and
loading time. A ship's `guns[id]` holds `{ reload, shot }` — the countdown and
**the charge that is actually in the barrel**. Ordering a different kind of shot
does not change what a loaded gun fires: `fireAll` makes the crew draw the
charge instead, which costs a reload. That one rule is why the gun order is a
commitment rather than a menu. `fireAll()`
walks every mount that is loaded, finds the nearest enemy inside its arc, in
range and in sight, and resolves one shot per mount. Broadsides and chasers go
through the identical path — a chaser is just a mount with `power: 0.5` whose
arc is `[0]` or `[3]`. Reload counters live per mount in `ship.guns`.

## Depth and ground tackle

`board.depthAt()` returns `deep`, `anchorage` or `shoal`; `anchorable()` and
`isShoal()` are the two predicates the rest of the game asks. A ship carries
`anchor` (`up` / `down` / `weighing`) and `grounded`, and `madeFast()` is the
single test for "going nowhere this turn" that movement, the helm limit and the
forecast line all share.

## Boarding

`ctx.boarding` is `{ a, b, momentum, round }` and lives only while two ships are
lashed together. `boardingRound()` takes both captains' commitments, works out
one contest of strength, applies casualties to both sides, and moves momentum;
at ±3 the deck is carried and that ship strikes. The AI's commitment is chosen
in `game.js` from the momentum it can see, so a losing captain stands on the
defensive.

## Randomness

Everything random goes through `core/rng.js`. `setSeed(n)` swaps in a
deterministic generator, which is what makes the smoke test reproducible. Never
call `Math.random()` inside `core/`.

## Rendering

`render/layout.js` fits the chart to its box and knows the hex size; it is the
only place that reads `clientWidth`. `render/renderer.js` draws and owns the
transient effects (tracers, flashes, floaters, shake, camera pan) plus the
last-known-position memory for ships hidden behind land. Animations resolve
through promises the core awaits, and fall back to a timer when the tab is
hidden so a backgrounded turn still finishes.

## Styling

Three stylesheets: tokens and resets (`base.css`), the responsive shell
(`layout.css`), and the widgets (`components.css`). The layout is one column on
phones and a chart-plus-panel grid from 720px up; the canvas is sized in JS from
its box, so it follows whatever the CSS decides.
