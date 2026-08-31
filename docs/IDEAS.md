# Idea bank

Unfiltered. Nothing here is scheduled — [ROADMAP.md](ROADMAP.md) is the ordered
plan, this is the pile it gets picked from. Each entry says roughly what it
would touch so the cost is visible.

---

## Asked for (Bennett, 2026-08-30)

| Idea | Notes |
| --- | --- |
| Sound effects | Broadside, chaser, splash, ricochet, rigging carrying away, boarding clash, wind bed, turn bell. Volume by shot weight and distance. *New `src/audio/`, hooks off the same events the renderer already listens to.* |
| Abandon a level mid-action / change level from Restart | Today Restart replays the same scenario and the picker only appears at start and end. Wants Restart to open the picker, plus an explicit "Break off". *`ui/banner.js`, `main.js`.* |
| No crew = dead ship | Half there: a ship strikes at 2 crew. Wants crew loss to bite before that — reload speed, sail handling, tacking odds all scaling with crew. *`core/ship.js`, `core/combat.js`.* |
| Less rigging = slower | **Already in.** Speed is multiplied by `rigging / rigMax`, so a shot-up rig already costs you hexes. Worth surfacing in the HUD so it reads. |
| More weapon types | See *Guns and ammunition* below. |
| Anchors — a turn to weigh | Anchor to hold station in a current or a calm; weighing costs a turn; cannot anchor in deep water. Needs depth on the chart. *`data/maps.js` (depth), `core/board.js`, `core/movement.js`, `ui/orders.js`.* |
| Can't change ammunition while loaded | Ammunition becomes a property of the loaded battery, chosen when you load, not when you fire. Turns the gun order into a real commitment. *`core/combat.js`, `ui/orders.js`.* |
| Better boarding — crew against crew | See *Boarding* below. |
| **Future:** destroy a harbour defended by shore guns | See *Harbour assault* below. |

---

## Guns and ammunition

- **Gun types, not just shot types.** Long guns (range, accuracy) versus
  carronades (short, brutal) versus swivels (anti-personnel, only at 1 hex).
  A ship class picks a mix; the mount already has `power` and `reload` to hang
  this on.
- **Limited magazine.** So many rounds of each type. Running out of chain
  mid-chase is a story.
- **Aim high or aim low.** One order that biases every shot toward rigging or
  toward hull, at a cost in effect.
- **Heated shot** from a shore battery or a prepared ship — starts fires.
- **Langrage / bar shot** — the poor man's chain, made from scrap.
- **Double-shotting** — extra damage, half the range, extra reload. Already
  half-modelled as `double`; make the trade explicit.
- **Damp powder / misfires** in rain or after a soaking, especially for the lee
  battery when heeling.
- **Firing on the roll.** Choose the up-roll (rigging) or the down-roll (hull);
  a heavy sea makes the choice matter more.
- **Cross-decking gunners.** Move crew to one side: that battery reloads
  faster, the other far slower.
- **Individual gun damage.** Lose guns, not just hull, so a battered ship fires
  weaker broadsides rather than the same broadside with less hull behind it.

## Ship condition

- **Fire.** Spreads each turn, must be fought with crew that then is not
  fighting the ship, and reaches the magazine if ignored.
- **Flooding and pumps.** Hull damage below the waterline takes crew off the
  guns permanently or she settles.
- **Masts as separate parts** — foremast, main, mizzen. Losing one costs
  specific abilities (tacking, speed downwind) instead of a single rigging bar.
- **Sprung spars and jury rigs.** Repair partially, at reduced performance.
- **Rudder already exists** — extend it: steering by sails alone, badly.
- **Fouled hull.** Weeks at sea cost a hex of speed until you careen. A campaign
  mechanic that makes port visits matter.
- **Heel.** Under press of sail the lee guns cannot be run out.

## Crew

- **Stations:** gunners, topmen, marines, idlers. Grape kills whoever is
  exposed; losing topmen slows sail handling, losing gunners slows reloads.
- **Fatigue.** Turns at battle stations, at full sail, or fighting fires wear
  the crew down.
- **Officers with traits** — a gunner who reloads faster, a master who tacks
  better, a bosun who repairs faster. Persist across a campaign.
- **Morale as a visible number** driven by casualties, raking, a consort
  striking, and a captain's reputation. Drives surrender and boarding results
  instead of a hidden roll.
- **Prize crews.** Taking a prize costs you the crew to sail her.
- **Mutiny** if morale bottoms out.
- **Surgeon.** Some casualties come back after the action.

## Boarding

Today it is one melee roll per turn. Deeper:

- **Three phases:** grapple and hold, sweep the waist, storm the quarterdeck.
  Each phase can be broken off, at a price.
- **Compose the boarding party.** Send marines, sailors, or everyone — what you
  send is not defending your own deck.
- **Defender's advantages:** boarding nets, swivels loaded with grape raking
  the boarders as they come over, a higher deck.
- **Repel boarders** as an explicit order with its own posture.
- **Weapons:** pistols (one volley), cutlasses, pikes, axes for the nets.
- **Strike mid-melee.** Morale decides it, not annihilation.
- **Both ships fighting on** while grappled — guns muzzle-to-muzzle.
- **Cutting the cables** to break off, taking damage from the parting.

## Anchoring, boats and shallow water

- **Depth on the chart:** deep / anchorable / shoal / land. Anchoring needs
  ground to hold on; shoals risk grounding at speed.
- **Spring on the cable.** Anchored, you can still warp the ship round to bring
  a fresh broadside to bear — the classic defensive trick.
- **Tides** that change which hexes are shoal over the course of an action, and
  a tide window for entering or leaving a harbour.
- **Kedging and warping** — in a flat calm, send the boats out to tow.
- **Boats as units:** cutting-out expeditions, landing parties, rescuing
  swimmers, carrying a message to a consort.
- **Lee shore.** Being embayed with the wind onshore is its own losing
  condition, and anchoring is the escape.
- **Grounding** — stuck until you lighten ship or the tide lifts you.

## Harbour assault

- **Shore batteries** as immobile ships: heavy, long-ranged, can't manoeuvre,
  need many hits, and can be silenced rather than destroyed.
- **Forts with arcs.** Some guns cover the entrance, some the anchorage —
  sailing in at the right angle is the puzzle.
- **Chain booms and blockships** across the entrance, cut by a boat party.
- **Fire ships** sent downwind into a crowded anchorage.
- **Mortar vessels** lobbing over the headland — indirect fire that ignores
  line of sight, which the sight system makes interesting.
- **Targets in the harbour:** moored prizes to cut out, a magazine to blow, a
  slipway to burn. Objective becomes a checklist rather than a kill count.
- **The tide window.** Get in, do the work, get out before the ebb, under fire
  the whole time.
- **Alarm level.** Batteries start unmanned; every turn undetected is free.

## Weather and sea

- **Sea state.** A heavy sea slows everyone, closes the lower gun ports on the
  lee side, and spoils gunnery.
- **Squalls** that cross the chart as moving hexes, with a wind shift inside.
- **Fog and night** — a sight radius, so the tall-island rules generalise: you
  lose ships in the murk and hear guns without seeing them.
- **Currents** per map, pushing every ship a hex a turn.
- **Leeway.** Close-hauled, you make ground sideways as well as forward.
- **Storm damage.** Carrying full sail in a gale risks springing a mast.

## Level types beyond the four we have

- **Blockade** — hold a station for N turns while ships try to slip past.
- **Rendezvous / smuggling** — reach a hex undetected.
- **Rescue / tow** — take a crippled consort in tow and get her home, at half
  speed, while being hunted.
- **Convoy escort at scale** — several merchantmen, several raiders, and you
  cannot be everywhere.
- **Fighting retreat** — you are the quarry.
- **Pirate hunt** — the enemy is faster and will not close unless she thinks
  she is winning.
- **Duel with a nemesis** — a named ship that recurs across a campaign and
  remembers.
- **Boat action** — no ship at all, just the launches at night.

## Campaign and meta

- **Persistent ship and crew.** Damage, casualties and experience carry over;
  refits cost prize money.
- **Prize money and a prize court** — take her whole rather than sinking her,
  and get paid.
- **Reputation** with ports, admirals and the enemy; it changes who will fight
  you and who will run.
- **Ship customisation** — trade guns for speed, ballast for stability, crew
  for provisions.
- **Letters of marque** — privateer versus navy career paths with different
  scoring.
- **Permadeath** with a logbook of past captains.

## Presentation and feel

- **Arc overlay.** Highlight the hexes each loaded battery will cover after the
  helm order you are hovering — turns the arc rules from folklore into
  something you can see.
- **Ship inspector.** Tap any ship for her class, armament, and what you have
  observed of her damage.
- **Damage read on the hull** — sails torn, masts down, list to one side.
- **Smoke that drifts downwind** and briefly blocks sight, which the sight
  system already supports.
- **Replay.** Seed plus order log fully determines a fight; store, replay,
  share.
- **Post-action report** — a butcher's bill and a chart of the track both ships
  sailed.
- **Tutorial scenario** that introduces one order at a time.
- **Log filtering** — hide the misses, keep the hits.

## Multiplayer

- **Hot seat.** Both sides already commit blind; this is mostly a UI screen.
- **Play by link.** Seeded RNG plus an order log means a whole game fits in a
  URL or a short code.
- **Asynchronous fleet battles** — one player per ship in a squadron, with
  signalling limits between them.

## Codebase health

- **Unit tests** for `hex`, `wind` and `combat`, which are pure.
- **CI** running `node tests/smoke.mjs` on every push.
- **Balance harness** — run 500 headless games per scenario and print win rates,
  so tuning stops being guesswork. The smoke test is already 90% of this.
- **Offscreen canvas** for the static chart and terrain once maps get large.
- **Screen-reader view** of the board as text.
