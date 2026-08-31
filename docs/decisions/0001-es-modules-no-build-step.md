# 0001 — ES modules, no build step

**Decided:** 2026-08-30

## Context

The game was one 852-line `index.html`: theme, markup, rules, AI and renderer in
a single IIFE. It needed to grow to many maps, many ship classes, several level
types and more than two ships in the water, and more than one person is likely
to work on it.

## Decision

Split into native ES modules loaded straight from `index.html`. No bundler, no
package manager, no transpiler.

## Why

- The game has no dependencies. A build step would be pure overhead and one more
  thing to keep working.
- Any static host serves it, GitHub Pages included, with zero configuration.
- Modules load in the browser and in Node with the same paths, which is what
  makes a headless test possible.

## Rejected

- **Keep the single file.** It was already at the limit where a change in one
  place quietly broke another.
- **Vite / a bundler.** Buys hot reload and minification, costs a toolchain and
  a `node_modules`. Revisit only if a dependency ever becomes worth having.
- **A framework.** The UI is a dozen buttons and a canvas.

## Cost

`file://` no longer works — the game must be served over HTTP. The README says
so, and `python3 -m http.server` is one line.
