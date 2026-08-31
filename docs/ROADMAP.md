# Roadmap

The ordered plan. The unfiltered pile it is picked from lives in
[IDEAS.md](IDEAS.md).

Where the game could go next, roughly in the order that gets the most game for
the least work. Nothing here is committed to — it is a menu, and each item says
what it touches so the cost is visible before anyone starts.

## Now — cheap, and the game feels different immediately

1. **More levels.** The engine already supports duel, chase, protect and
   survive. Four scenarios is a demo; twelve is a game. *Touches:
   `data/scenarios.js` only.*
2. **Level select that remembers progress.** Scenario list is already in the
   overlay; store completions in `localStorage` and unlock in order. *Touches:
   `ui/banner.js`, one small store module.*
3. **Difficulty per level.** Enemy `quality` and crew are already ship-class
   fields; let a scenario override them. *Touches: `data/scenarios.js`,
   `core/ship.js` (accept overrides in `createShip`).*
4. **Keyboard orders.** Arrow keys for helm, number keys for shot, space for
   Make it so. Free accessibility win. *Touches: `ui/orders.js`.*
5. **Target lock.** With more than two ships, let the player pick which enemy
   the batteries prefer instead of always the nearest. *Touches: `ui/orders.js`,
   `core/combat.js` (a `preferred` argument to `fireAll`).*

## Next — new mechanics the current shape already invites

6. **Shallows and currents.** `board.js` already classifies terrain; add
   `shoal` (passable but risks grounding) and per-map current vectors that
   push ships each turn. *Touches: `data/maps.js`, `core/board.js`,
   `core/movement.js`.*
7. **Crew stations.** Split crew into gunners, topmen and boarders so grape
   shot hurts different things depending on where it lands, and orders trade
   between reload speed, sail handling and melee. *Touches: `core/ship.js`,
   `core/combat.js`, `ui/orders.js`.*
8. **Damage control orders.** Plug shot holes, fish a sprung mast, clear a
   fouled rudder — a fourth order row that competes with fighting. *Touches:
   `core/game.js` end-of-turn, `ui/orders.js`.*
9. **Morale and striking.** Ships currently strike on a hidden roll. Make
   morale a visible number driven by casualties, raking and losing consorts, so
   surrender is something you can drive on purpose. *Touches:
   `core/objectives.js`, `core/ship.js`, `ui/hud.js`.*
10. **Gun quality and heat.** Long guns versus carronades, and a battery that
    fires every turn losing accuracy. *Touches: `data/ships.js`,
    `core/combat.js`.*
11. **Weather that changes mid-action.** Squalls that arrive on a schedule, gust
    fronts that change wind strength as well as direction, night actions with a
    shortened sight range. *Touches: `core/wind.js`, `core/board.js`,
    `data/maps.js`.*

## Later — bigger swings

12. **Campaign.** Carry one ship between scenarios: damage persists, prize money
    buys refits and better crew, losses are permanent. Needs a save format and
    a between-action screen. *Touches: new `core/campaign.js`, new UI screen,
    `data/scenarios.js` for the chain.*
13. **Squadron command.** Give the player two or three ships and an order set
    per ship, with signals limiting what can be commanded at range. The ship
    list is already a flat array, so the rules side is mostly there; the UI is
    the work.
14. **Hot-seat and asynchronous multiplayer.** Both sides commit orders blind,
    which is already how the turn works. Same-device hot-seat is a UI change;
    play-by-link needs the seeded RNG plus an order log — the replay format
    below is the enabler.
15. **Replays.** Seed plus order log fully determines a fight (that is why
    `rng.js` exists). Store it, replay it, share it. *Touches: `core/game.js` to
    record orders.*
16. **Proper art.** Hull silhouettes per ship class, sail states, smoke that
    drifts downwind, a chart that looks drawn rather than generated.

## Health of the codebase

17. **Unit tests for the maths.** `hex.js`, `wind.js` and `combat.js` are pure
    and easy to pin down; the smoke test only proves nothing explodes.
18. **CI.** Run `node tests/smoke.mjs` on every push — one workflow file.
19. **Performance pass.** The chart redraws entirely every frame. Fine at
    11×12; cache the static grid and terrain to an offscreen canvas before maps
    get large.
20. **Accessibility.** The canvas is invisible to a screen reader. A live text
    summary of positions and bearings, focus-visible order buttons (already
    there) and a reduced-motion path that skips animation (`base.css` has the
    media query; the renderer should honour it too).


## Requested, not yet scheduled

Raised 2026-08-30, written up in [IDEAS.md](IDEAS.md) with the files each would
touch. Not started.

- Sound effects, driven off the events the renderer already listens to.
- Break off a level in progress, and reach the level picker from Restart.
- Crew loss that bites before a ship strikes — reloads, sail handling, tacking.
  (Rigging damage already slows a ship; that one is done and just needs saying
  in the HUD.)
- More weapon types: long guns, carronades, swivels, limited magazines.
- Anchoring — a turn to weigh, and no anchoring in deep water. Needs depth on
  the chart, which shoals and grounding would then share.
- Ammunition chosen when a battery is loaded, not when it fires, so you cannot
  switch types on a loaded gun.
- Boarding as a real crew-against-crew fight rather than one roll a turn.
- **Future:** harbour assault — shore batteries, forts with fixed arcs, booms,
  fire ships, and a tide window to get back out.
