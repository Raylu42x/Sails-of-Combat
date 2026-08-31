# Working together

More than one person — or agent session — is committing to this repo now. This
is the flow that keeps that from turning into merge archaeology.

## The shape of it

`main` is always playable. Nothing is committed to it directly; everything
arrives through a pull request that CI has run.

```
main ──●────────●──────────●────────►
        \      /  \       /
         ●────●    ●─────●            one branch per topic, short-lived
```

**One branch per topic, cut fresh from `main` each time.** Not one long-running
branch that you keep adding to — once a PR merges, that branch is spent. Cut a
new one from the updated `main` for the next piece of work. (Reusing a merged
branch is how you end up with a PR whose commit list no longer matches what is
actually unmerged.)

Names: `agent/<area>-<slug>` — `agent/ui-target-lock`, `agent/core-currents`,
`agent/docs-campaign`. The same `<area>-<slug>` is the worktree name and the
STATUS.md key, so one grep finds all three.

## Before you start

```bash
git fetch origin
git worktree add ../Sails-of-Combat-<area>-<slug> -b agent/<area>-<slug> origin/main
```

A worktree per task means two sessions never fight over one checkout, and an
unfinished experiment never blocks a quick fix.

## Before you open the PR

```bash
git fetch origin
git rebase origin/main     # never merge main into your branch
node tests/smoke.mjs && node tests/boarding.mjs && node tests/balance.mjs
```

## When several PRs are open at once

GitHub tells you each PR is mergeable **against `main` as it is now**. It does
not tell you whether two open PRs collide with *each other* — and that is the
common case when two people are working the same week.

Check it before choosing a merge order, without merging anything:

```bash
git fetch origin 'refs/pull/*/head:refs/remotes/pr/*'
git merge-tree --write-tree --name-only pr/7 pr/8
```

Exit code 0 means the two are independent and the order does not matter. A list
of files means whoever lands second has to rebase and fix those files by hand.

**Merge order, cheapest first:** docs-only PRs, then the smallest code PR, then
the largest. Rebase each remaining branch onto `main` after every merge and let
CI run again — a clean textual merge is not proof the game still works, which
is exactly what the test harnesses are for.

## Keeping conflicts rare

- **Small PRs, one topic each.** A 200-line PR rebases in a minute; a 2,000-line
  one is a weekend.
- **Land docs separately from code.** They never conflict with anything.
- **STATUS.md is the worst file in the repo for this** — every task edits the
  same few lines, so every pair of concurrent branches conflicts there and
  nowhere else. Either add your line as the last thing before you push, or
  leave it out of the PR entirely and let the PR list speak for itself.
- **Do not reformat what you are not changing.** A stray whitespace pass turns
  a three-line conflict into a three-hundred-line one.

## Review

Nothing here needs ceremony, but two questions are worth asking of any PR:

1. Does CI pass, and did the author say what they actually verified?
2. Would the next person understand *why* from the commit message alone?

The commit message is the only thing that survives. Write it for someone with
no memory of the conversation that produced the change.
