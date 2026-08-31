# The campaign layer — a worked design

A concrete proposal for roadmap items 9 (morale and striking) and 12
(campaign), grounded in docs/RESEARCH-HISTORY.md and RESEARCH-GAMES.md.
Nothing here is committed; it is a design to argue with.

## Three layers, three fidelities

The structure that keeps any one encounter from becoming toilsome: not every
encounter deserves the full board.

1. **The port (campaign/management).** Menus and decisions, no board. Choose
   the next venture, spend prize money, recruit, repair, hear rumors. Two or
   three heavy choices per visit. This is where the story branches.
2. **Vignettes (encounters between battles).** A chase, a storm, a ruse —
   played as 3–5 dramatic decision points, each one meaty choice with dice
   behind it, resolved in a minute. Historically a chase took days; we
   compress days into five beats. The vignette's outcome SETS UP the battle:
   win the chase and the tactical fight opens with you holding the gage and
   her rigging already nicked; lose it and she's gone, or you meet her escort
   on bad terms.
3. **The board (tactical battle).** The existing game, reserved for fights
   that matter — and always opening from an interesting position, because the
   vignette chose it.

Build order: the board exists; vignettes next; port last.

## The prize economy is the progression system

No XP, no levels, no loot tiers. You capture ships, and every capture is a
decision: sell her, keep her (switch hulls), strip her guns, ransom her
people. Money buys known things from a short shipwright's list — a dozen
items, each changing how the ship plays (coppered bottom, raked masts, chase
guns, reinforced scantlings) — not a tech tree. Damage persists between
actions; repairs cost money and time; losses are permanent. Sinking a prize
is losing money, which teaches the era's logic without a tutorial line.

## Officers absorb complexity

A sailing master improves tacking odds; a gunner speeds reloads; a bosun
repairs mid-action; a surgeon converts crew losses to recoverable wounded.
Recruited in port, killed by grapeshot, mourned. They improve by surviving
named actions, not by XP bars. This is how the game gets deeper without the
player managing more — the tactician gives the same orders, the ship answers
better.

## Crew morale: the Blackbeard loop

A single visible unrest track. It rises with casualties, hunger, withheld
shares, and hard choices; it falls with prizes, shore leave, and paid-out
shares. Checked against the captain's standing at story moments — fail badly
and the crew votes you out (campaign end or a brutal vignette; pirate
captains were elected). Morale also feeds the existing strike checks: a
happy crew fights longer before the colors come down. Visible number, driven
by decisions the player actually makes — never a bar that fills on its own.

## The marque line is the spine

The one big branching choice the era hands us: sail under a letter of marque
(legal, ranked, a navy cut of every prize, ports open) or on your own account
(keep everything, welcome nowhere, a price on your head that grows). Every
scenario chain can hang off where the player stands on that line, and events
can move it — wars end, commissions expire, pardons are offered. Per-faction
standing with concrete, priced consequences (port prices, repair access,
ransom values) beats an abstract reputation number.

## Choice-chains, not open world

Sid Meier's Pirates! proved the career fantasy; we swap its open world for
authored consequence — a chain of scenarios where port choices gate which
action comes next and how it opens. Persistent state: ship, crew, officers,
morale, purse, standing. The engine's scenario format already supports this;
the campaign is mostly a save format, a between-actions screen, and writing.

## Failure model

Decide it explicitly (Sunless Sea's postmortem warns what happens if you
don't). Proposal: the CAPTAIN is the save. Losing a battle rarely kills you —
historically it didn't — it costs the ship, the cargo, the standing.
Captured privateers were exchanged; captured pirates hanged (the marque line
again). A campaign death offers a legacy start: a protégé with one carried
advantage, so long runs accumulate knowledge rather than resetting to zero.

## Tone

Straight naval fiction — Aubrey–Maturin, not fantasy. If the weird ever
enters, it enters through the crew: sentiment, superstition, what the men
believe they saw in the fog. The engine never confirms it.
