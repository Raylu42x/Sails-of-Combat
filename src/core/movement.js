import { DIRS, same } from './hex.js';
import { attOf } from './wind.js';
import { speedOf } from './ship.js';

// The track a ship would sail this turn, stopping at land, at the chart's edge,
// or alongside anything already in the way.
export function pathOf(s, ctx, opts = {}) {
  const { board, wind, ships } = ctx;
  const facing = opts.facing !== undefined ? opts.facing : s.facing;
  const sails = opts.sails || s.sails;
  const inIrons = opts.inIrons !== undefined ? opts.inIrons : s.inIrons;
  const att = attOf(facing, wind.from);
  const v = inIrons || att === 0 ? 0 : speedOf(s, att, sails, wind);
  const blockers = ships.filter(o => o !== s && !o.struck);
  const cells = [];
  let cur = { q: s.q, r: s.r };
  for (let i = 0; i < v; i++) {
    const d = DIRS[facing];
    const nxt = { q: cur.q + d.q, r: cur.r + d.r };
    if (!board.passable(nxt.q, nxt.r)) break;
    if (blockers.some(o => same(o, nxt))) break;
    cells.push(nxt);
    cur = nxt;
  }
  return cells;
}

// Move everyone at once. Returns uid -> list of hexes, for the animation.
export function moveShips(ctx, log) {
  const { board, wind, ships } = ctx;
  const paths = {};
  for (const s of ships) paths[s.uid] = [];
  for (const s of ships) {
    if (s.struck || s.grappledTo) continue;
    const others = ships.filter(o => o !== s && !o.struck);
    if (s.inIrons || s.rigging <= 0) {
      const nxt = board.driftTo(s, wind.from);
      if (board.passable(nxt.q, nxt.r) && !others.some(o => same(o, nxt))) {
        paths[s.uid].push(nxt); s.q = nxt.q; s.r = nxt.r;
      }
      if (s.inIrons) log(s.name + ' hangs in irons, drifting to leeward.', s.isYou ? 'you' : 'foe');
      continue;
    }
    const path = pathOf(s, ctx);
    if (path.length) {
      const end = path[path.length - 1];
      paths[s.uid] = path;
      s.q = end.q; s.r = end.r;
    }
  }
  return paths;
}
