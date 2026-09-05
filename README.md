# Sails of Combat

A turn-based age-of-sail gunnery game that runs in the browser with no build
step, no dependencies and no server logic. You give orders — helm, sails, guns
— both sides commit blind, and then the turn plays out.

## Try it at: https://sailsofcombat.kervian.com/

## Playing

Each turn you set four orders and press **Make it so**:

| Order | What it does |
| --- | --- |
| **Helm** | Turn one or two points to port or starboard. Turning through the eye of the wind is a tack — a fore-and-aft rig usually makes it, a square rig often misses stays and is caught **in irons**. |
| **Sails** | *Full* is fastest but sends the gun crews aloft, so the guns stay silent. *Battle* is the fighting sail. *Take in* is slow but lets the topmen repair rigging. |
| **Guns** | *Round* hulls her, *chain* cuts her rigging, *grape* kills crew up close, *double* is a short-range hull-smasher that reloads slowly. *Hold* keeps what is in the barrels. **A loaded gun cannot fire a different charge** — order another kind and the crews draw the charge and reload, which costs one turn (two for double shot). Guns with nothing in range keep what they are holding, so choosing grape early never dumps your round shot. |
| **Cable** | Let go the anchor where the lead finds bottom, or weigh it again — which costs a whole turn. |
| **Close** | Grapple and board when you are alongside. Then choose how much of the crew to commit: *all hands*, the *boarding party* alone, *repel* on the defensive, or *cut free*. |

Keyboard: arrows for helm and sail, 1–5 for shot, space to give the order,
**L** for levels, **M** for sound, **D** for soundings, **G** for gun arcs.

**Layers**, top right of the chart, turns the overlays on and off — soundings,
gun arcs, your track for this turn, and the range line — and remembers what you
chose. Open water has no soundings to show, and the menu says so rather than
leaving you wondering.

Things worth knowing:

- **Guns miss.** There were no sights and no fire control: a crew laid by eye
  off a moving deck. Point-blank is nearly certain, long range is a lottery, and
  a crack crew, a steady sea and a raking angle all help. This is why fights
  closed to pistol shot.
- **Splinters do the killing.** A round shot punching through two feet of oak
  throws a storm of splinters off the inside of the hull, and that is what
  sweeps a gun deck — so the men a shot kills follow from the damage it does to
  her timbers. A rake down the length of the deck finds far more of them.
- **Square rigs sag to leeward.** Braced hard up, a square-rigged ship does not
  go where she points; she is pushed bodily sideways, and the harder it blows
  the more she slips. This is why a sloop claws off a lee shore and a brig
  sometimes does not.
- **Fire is the thing that actually destroys ships.** A heavy hit can set her
  alight. Left alone it spreads, eating hull and hands; call the **fire party**
  and every hand is at the buckets instead of the guns. If it reaches the
  magazine she blows up — no prize, no survivors, nothing to sell.
- **A beaten ship is not yet a prize.** She has to be manned: lay alongside
  after she strikes and **take possession**, which costs you hands you may want
  later. Her condition when she struck sets what the court will pay — which
  makes "fire at her rigging, not her hull" a money decision as much as a
  tactical one.
- **In a fresh gale she heels away from the wind and her lee gunports go under.**
  That battery cannot be opened at all — the price of the weather gage. Head to
  wind or dead before it she stands upright and both batteries bear.

- **Guns fire as they bear.** Each battery has its own arc, its own charge and
  its own reload clock. A ship with bow or stern chasers can fire them in the
  same turn as a broadside, which is what makes a stern chase worth sailing.
  The pale hexes on the chart are where your loaded guns will bear after the
  orders you have set.
- **The pieces differ.** Long guns reach a hex further; carronades hit far
  harder a hex closer; swivels take grape and nothing else, at one hex — and
  fire into boarders as they come over the rail.
- **Raking wins fights.** Crossing an enemy's bow does 1.5× damage; crossing
  her stern does 2× and may shoot away her rudder.
- **Wind is everything.** Speed depends on your point of sail and on how hard
  it is blowing. The wind shifts on the map's own schedule.
- **Tall islands block sight.** An enemy behind one disappears from the chart
  and leaves a dashed last-known bearing behind.
- **Draught matters.** A sloop creeps over a bank a guarda costa dare not go
  near, and the enemy captain knows it. Shallow water is a weapon.
- **Sound your way.** Broken water marks a shoal that will have your keel out
  of her at speed; tinted hexes are holding ground for an anchor. Deep water
  has no bottom to anchor in. At anchor a spring on the cable still answers one
  point of helm, so you can warp round and bring a fresh broadside to bear.
- **Crew losses tell before she strikes.** Under half the ship's complement she
  is short-handed and slow to reload; under a quarter she cannot carry full
  sail. She is only lost when there is nobody left to fight her.

## Project layout

```
index.html            markup only
src/main.js           wires the pieces together
src/audio/sfx.js      synthesised sound — no asset files
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
src/render/           canvas layout and drawing
src/ui/               log, ship cards, order buttons, briefing overlay
src/styles/           tokens, layout, components
tests/smoke.mjs       headless run of every scenario
tests/boarding.mjs    drives 40 boarding actions from alongside
tests/balance.mjs     win rates per scenario, for tuning
```

The core never touches the DOM. It emits events (`log`, `change`, `busy`,
`finished`) and calls a small `view` adapter for anything that takes time, so
the whole simulation can run headless — which is exactly what the smoke test
does.

## Adding content

**A new ship class** — add an entry to `src/data/ships.js`. `speeds` is hexes
made good at each point of sail (in irons, close-hauled, reaching, running).
`mounts` are gun groups; `arcs` are bearings relative to the bow, where 0 is
dead ahead, 1 and 2 are starboard, 3 is dead astern, 4 and 5 are port. `gun`
picks the piece from `GUN_TYPES` (long, medium, carronade, swivel) and `power`
scales the weight of metal on top of it.

**A new map** — add an entry to `src/data/maps.js`: size, wind direction and
strength, a list of island hexes with `height: 'low'` (blocks passage) or
`'tall'` (blocks passage and sight), and a list of `water` hexes with
`depth: 'anchorage'` (holding ground) or `'shoal'` (shallow enough to touch). Set `scroll: true` for open water, where
the chart slides to keep the fight centred, or `false` for fixed waters where
the land has to stay put.

**A new level** — add a file to `levels/` and a line to `levels/index.js`: a map, a list of
ships with sides and roles, an objective, and the briefing text. Any ship may
carry a `stats` override for hull, rigging, crew or quality, which is how a
level is made harder or easier without inventing a ship class. Objectives
that exist today are `duel`, `chase`, `protect` and `survive`; a new type is a
new case in `src/core/objectives.js`.

## The level editor

`editor.html` — open it the same way you open the game. It is a tool for people
building levels, not part of the game, so nothing links to it.

Draw the chart (islands low or tall, shoals, anchorages), set the wind, place
the ships and pick their class, side, role and mood, choose the goal, and write
the briefing. **Play it 60 times** runs the game's own rules over what you have
drawn and reports how often a captain choosing orders at random wins — the one
thing you cannot judge by eye, and how The Long Chase was found to be
unwinnable. **Export file** gives you the level to save into `levels/`.

It writes files; it cannot change the game by itself. Nothing is live until you
commit what it gives you.

Opening an existing level to edit it works too: the levels are plain modules, so
the editor imports them rather than parsing anything.

## Tests

```bash
node tests/smoke.mjs
node tests/boarding.mjs
node tests/balance.mjs 40      # win rate per scenario, for tuning
```

The first plays every scenario 25 times with random orders and a seeded RNG,
and fails if the rules throw or a fight never reaches a verdict. The second
lashes two ships together forty times and fights the boarding action out,
because boarding is hard to reach by chance. The third plays every level with a
competent stand-in captain and prints win rates — tuning by feel is how Convoy
Duty once ended up unwinnable.

## Docs

- [docs/WORKING-TOGETHER.md](docs/WORKING-TOGETHER.md) — branch, rebase and merge flow when several people are on it at once
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the pieces fit together
- [docs/ROADMAP.md](docs/ROADMAP.md) — what to build next, and why
- [docs/IDEAS.md](docs/IDEAS.md) — the unfiltered idea bank behind the roadmap
- [docs/decisions/](docs/decisions/) — decision records
