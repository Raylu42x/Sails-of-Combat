# Status

One line per agent/human task. Check here before picking a worktree name.

- [core-modular-split] DONE split index.html into ES modules under src/, added
  README + docs/ (architecture, roadmap, ideas, decision records) and three
  test harnesses, and generalised the engine to fleets, ship classes with gun
  mounts, maps with wind strength, islands and soundings, and
  duel/chase/protect/capture/escape objectives.
  Then, in the same branch: synthesised sound, a level picker that opens over a
  running action, charges that belong to the loaded gun, gun types (long,
  carronade, swivel), crew losses that bite, anchoring and shoals with draught,
  boarding as a running fight for the deck, gun-arc overlay, keyboard orders,
  seven levels and a balance harness.
  (worktree: ../Sails-of-Combat-core-modular-split, branch agent/core-modular-split)
  Open: harbour assault (shore batteries, booms, fire ships, tide window) is
  the next big piece; docs/IDEAS.md holds the rest.
- [design-research-docs] DONE added the research library behind the original
  prototype: docs/RESEARCH-HISTORY.md (period sources, with design hooks),
  docs/RESEARCH-GAMES.md (what prior naval games got right and wrong), and
  docs/CAMPAIGN-DESIGN.md (a worked proposal for roadmap items 9 and 12:
  three layers, prize economy, officers, morale, the marque line).
  (branch agent/design-research-docs — Bryan's side)
- [helm-and-ship-details] DONE helm resets to stay-on-course each turn, and
  after a wind shift (or when the default course leads into irons) there is no
  silent default: the helm row flashes and Make It So waits for a course
  (issue #5). Tapping any ship card opens a detail sheet — rig, draught,
  speeds by point of sail, every mount with its gun, arc and (own ship only)
  charge and reload (issue #6). (branch agent/helm-and-ship-details — Bryan's side)
- [mixed-issue-sweep] DONE prize window, battery states, AI routing round banks,
  small screens, the anchor row, level name (issues #19 #20 #22 #27 #28).
- [render-ship-art] DONE per-class ship profiles (a sloop is a sharp sliver, a
  merchantman a bluff tub) and colour on the chart: shallow water tinted, land
  warm olive, a drawn shoreline (#21).
- [ui-boarding-legible] DONE momentum bar, stakes on the melee buttons, grapple
  odds quoted before you commit, loaded swivels named on both sides (#30).
- [render-bowsprit] DONE bowsprit drawn as a spar rather than a line, which with
  the helm over looked like a leftover of the course arrow.
- [core-fire-timing] DONE ships fire during the pass, timed by crew quality —
  green fires from where the turn ends, able the moment she bears, crack takes
  the best moment of the whole pass (#41). Cutting Out retuned: her crew is 0.95,
  which the briefing already claimed.
- [data-level-files] DONE split src/data/scenarios.js into one file per level
  under levels/, with levels/index.js listing them in play order (#46).
  Prerequisite for the level editor (#47).
  (worktree: ../Sails-of-Combat-data-level-files, branch agent/data-level-files)

Note for whoever picks this up: entries above were backfilled in one go — I let
STATUS.md go stale for several tasks while working fast, which is exactly the
signal Bryan relies on. Worth writing the line before starting, not after.
- [tools-level-editor] DONE editor.html — draw the chart, place ships, set the
  goal, write the briefing, play it 60 times against the real rules, export the
  file (#47). Opens existing levels for editing. Levels may now carry an inline
  map, and game.start() accepts a level object as well as an id — which is also
  what a replay (#49) will need.
  (worktree: ../Sails-of-Combat-tools-level-editor, branch agent/tools-level-editor)
- [core-ai-personalities] DONE five captains as weight sets over the one move
  search — cautious, boarder, prize-hunter, reckless, professional (#51). Each
  changes standoff range, how much she values a bearing, what she loads, whether
  she boards, and the nerve at which she breaks off. Her sheet names it. Cast
  into Convoy Duty, Cutting Out and The Rat Run; the editor offers it.
  (worktree: ../Sails-of-Combat-core-ai-personalities, branch agent/core-ai-personalities)
- [ui-colourblind] DONE one mark vocabulary on every surface — ▲ yours, △ a
  consort, ✕ hers — on the chart, the ship cards and every log line, plus a
  hatched fill for her half of the boarding bar (#50). Checked against an
  in-page deuteranopia simulation: the two ships become the same colour and are
  still told apart.
  (worktree: ../Sails-of-Combat-ui-colourblind, branch agent/ui-colourblind)
- [core-replay] DONE every fight is seeded and its orders recorded, so an action
  is a ~60-character string: 'Copy replay link' on the verdict screen, and a link
  with one in it plays that action back exactly (#49). tests/replay.mjs records
  and replays a fight in all ten levels and is now in CI — it doubles as the
  guard on nothing in core/ calling Math.random() directly.
  (worktree: ../Sails-of-Combat-core-replay, branch agent/core-replay)
