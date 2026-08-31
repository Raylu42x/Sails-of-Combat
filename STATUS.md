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
- [helm-and-ship-details] DONE helm resets to stay-on-course each turn, and
  after a wind shift (or when the default course leads into irons) there is no
  silent default: the helm row flashes and Make It So waits for a course
  (issue #5). Tapping any ship card opens a detail sheet — rig, draught,
  speeds by point of sail, every mount with its gun, arc and (own ship only)
  charge and reload (issue #6). (branch agent/helm-and-ship-details — Bryan's side)
