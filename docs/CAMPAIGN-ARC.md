# The campaign arc — a demotion in three acts

Bryan and Claude's working design, building on CAMPAIGN-DESIGN.md. A draft to
argue with; the format below is built to be extended, re-ordered and filled
in later, and several deliberate blanks are marked OPEN.

## The shape: the ship gets smaller, the freedom gets bigger

A career told downhill in tonnage — brig, cutter, schooner — which is the
reverse of every power fantasy, and the point. King's officer, revenue
drudge, free captain. The schooner is not the starter ship; she is the
destination.

## Act I — The King's Brig

You are the RATTLER's first lieutenant, and you take command UNEXPECTEDLY —
mid-crisis, the captain down, the convoy scattered, no orders that survive
contact. (The most historical origin there is: acting commands inherited in
the worst hour, and often never confirmed.) One connected operation told as
3–4 linked actions, the same hull carrying its damage forward: the escort
(Convoy Duty), the weather and the wolves (Fighting Retreat), the French
brig that has shadowed you all week (Powder and Spray). Those levels exist;
the act is connective tissue and consequence.

It ends in the grey: the convoy's fate is argued over your head, and you are
broken down to a revenue cutter. WHAT ACTUALLY HAPPENED — whose fault, whose
patron, what was in the one ship that burned — is deliberately fog. OPEN: we
decide later, or never entirely; the not-knowing is the wound the campaign
carries.

Crew: advances a little here, not much. You inherit a navy crew; they are
not yet YOURS.

## Act II — The Cutter (the skilling ground)

The ADDER, and small jobs in scattered places: chases, smugglers,
despatches, seizures (The Long Chase lives here; the level editor makes more
of these cheap — this act is the natural home for guest levels). Structure:
a JOB BOARD, not a chain — more jobs offered than you can take (say 5 of 8),
and **the jobs you choose are the specialization system**:

- chase work trains the MASTER (sailing, tacking) and chase-gunnery
- boarding and cutting-out work trains the boarding gang and the GUNNER's
  close game
- salvage and storm work trains the CARPENTER and BOSUN
- escort and patrol train steadiness (morale, repel-boarders)

No XP menus. The build emerges from which missions you sailed, and a capped
act means no run masters everything — replay value is a different set of
choices, not a bigger number. The act ends with the offer: a letter of
marque, or something less legal, and the schooner.

## Act III — The Sloop, then the Schooner (the full cycle)

The act OPENS in the sloop — the ALACRITY, which resolves her marked-OPEN
question: she is the free captain's first ship. Scrappy underdog work where
a brig is a fight you decline (the sloop can beat one only flawlessly — she
outranges and outpoints, but two carronade broadsides end her), and
avoiding that fight IS the gameplay. Prize money and reputation earn the
SCHOONER as the act's midpoint reward, her refit shaped by the act-II
specialization. And the finale closes the campaign's full circle: BRIGS
AGAIN — the class you began in — but now fought the new way, out-thought
instead of out-slugged. The navy may even send YOUR OLD BRIG, under some
patron's favourite, to hunt her former first lieutenant.

Fore-and-aft, weatherly, LONG GUNS — the out-point-and-out-range game, the
strategic counter to brawling brigs (historically the Baltimore-privateer
archetype, down to the Long Tom pivot). She arrives WITH A FLAVOUR: the act-
II specialization shapes her refit and how this act plays — a chase-built
run fights her differently than a boarding-built one. The full prize economy
switches on (acts I–II suppress it naturally: navy prizes belong to the
crown, cutter seizures pay fixed bounties — the economy teaches itself in
stages). The marque-vs-piracy line is the branching spine; existing sloop
levels adapt or sit alongside; harbour assault is the finale seat.

NEEDS: a schooner entry in ships.js (data only).

## The map layer: orders, the patrol, the cruise

How the player moves between actions differs per act, and the period hands
us the lore for all three (the shape owes a debt to FTL):

- **Act I — under sealed orders.** The admiral dictates the spine; discretion
  lives inside it. Period despatches ended "…and you are to use your best
  discretion in the King's service" — so each node offers a discretionary
  choice, and those choices are exactly what the court-martial later argues
  over your head. The fog feeds itself.
- **Act II — the patrol.** A cutter held a CRUISING GROUND: a stretch of
  coast to police, the beat her captain's own business. The map is a sea
  chart of the station — ports, inlets and cays as nodes, sailed legs as
  edges, jobs surfacing at nodes and expiring with time. The edges obey the
  wind rose: downwind legs are cheap, beats to windward cost time — the
  tactical game's gravity governing the strategic layer with no new
  concepts.
- **Act III — the cruise.** The privateer's own word for it: a hunting
  ground, an intent, months of provisions, the route entirely yours.
  Chained sea areas (Windward Passage → the Mona → the Spanish Main), each
  a small node map, advancing toward the finale. The fuel is WATER AND
  PROVISIONS — cruises ended when the beer ran out — which is the pressure
  that keeps freedom from being aimless (the Sunless Sea lesson from
  RESEARCH-GAMES).

## Progression: the warrant officers

The crew's growth lives in a few named ratings, matching the period's actual
trades — and giving fireTier company:

- GUNNER — exists today (fire timing tiers). The template.
- CARPENTER — hull. Between actions: how much hull comes back, and the odds
  of a bonus repair. Hull does NOT heal in combat (a later carpenter skill
  may slow leaks, nothing more).
- BOSUN (+ sailmaker, folded in) — rigging and canvas. Owns both repair
  progressions' other half:
  - Between actions: rigging restored, chance of more.
  - In combat: TAKE IN already repairs rigging. It gains LIMITS — the ship
    is still under stress. Wind-scaled: light airs ×1.5, moderate ×1, gale
    ×0.5. And a per-action CAP (only so much spare cordage and canvas
    aboard), the cap being what the bosun's level raises.
- MASTER — sailing: tack odds, maybe a point of speed at one attitude.

Between missions, when stores are short: CHOOSE hull or rigging — the
carpenter and the bosun cannot both have the dockyard's day. Level decides
how much the chosen trade returns.

A small named core follows you down the ladder from act to act — the reason
crew quality can RISE as the hulls shrink. The dead weight stays with the
navy; the good ones are yours.

## Persistence and failure

Same boat across an act: damage, crew and stores carry action to action;
repairs cost the between-mission choice above. Act transitions change the
ship by STORY, not by shop. Failure: OPEN — leaning bend-don't-block (a lost
action worsens the next one's opening and the story's tone rather than
demanding a retry), but undecided.

## The data shape (so all of this stays cheap to change)

campaign = acts → nodes → edges, one file. A node: { level id, intro text,
outro text per outcome, choices, carry rules }. Levels stay standalone (the
picker keeps working); nodes can be inserted, acts extended, branches filled
in later. The job board is a node whose choices are level refs. Nothing
above requires engine work beyond: a save blob, carry-over of ship state,
the warrant ratings, and the between-mission screen.

## Deliberately OPEN

- What actually happened at the convoy (the fog).
- Failure model (bend vs retry).
- Marque line: one hard fork vs sliding reputation.
- ~~Whether the sloop ALACRITY appears at all~~ — RESOLVED: she opens act
  III as the free captain's first ship; the schooner is earned mid-act.
