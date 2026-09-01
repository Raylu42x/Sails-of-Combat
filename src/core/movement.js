import { DIRS, same } from './hex.js';
import { attOf } from './wind.js';
import { chance } from './rng.js';
import { madeFast, speedOf } from './ship.js';
import { draughtOf } from '../data/ships.js';

// The track a ship would sail this turn, stopping at land, at the chart's edge,
// or alongside anything already in the way.
export function pathOf(s, ctx, opts = {}) {
  const { board, wind, ships } = ctx;
  const facing = opts.facing !== undefined ? opts.facing : s.facing;
  const sails = opts.sails || s.sails;
  const inIrons = opts.inIrons !== undefined ? opts.inIrons : s.inIrons;
  const att = attOf(facing, wind.from);
  const v = inIrons || att === 0 ? 0 : speedOf(s, att, sails, wind);
  const blockers = ships.filter(o => o !== s); // a struck ship is still a hull in the way
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

// Move everyone at once — and mean it. Ships advance a hex at a time in
// lockstep, so no ship gets to sail her whole track before another one starts.
// Resolving them one after another instead would hand the ship that happens to
// be first in the list every piece of contested water, which is the player,
// every time.
export function moveShips(ctx, log) {
  const { board, wind, ships } = ctx;
  const paths = {};
  for (const s of ships) paths[s.uid] = [];

  // What each ship intends this turn, measured from where everyone starts.
  const movers = [];
  for (const s of ships) {
    if (s.struck || s.grappledTo || madeFast(s)) continue;
    if (s.inIrons || s.rigging <= 0) {
      movers.push({ s, drift: true, hexes: 1 });
      if (s.inIrons) log(s.name + ' hangs in irons, drifting to leeward.', s.isYou ? 'you' : 'foe');
      else log(s.name + ' has no rigging left to steer by — she drives to leeward.', s.isYou ? 'you' : 'foe');
      continue;
    }
    const att = attOf(s.facing, wind.from);
    movers.push({ s, drift: false, hexes: speedOf(s, att, s.sails, wind) });
  }
  if (!movers.length) return paths;

  // A surrendered ship is still a hull in the water: she blocks, she is not
  // sailed through.
  const at = new Map();
  for (const s of ships) at.set(s.q + ',' + s.r, s);
  const done = new Set();

  const maxHexes = Math.max(...movers.map(m => m.hexes));
  for (let step = 0; step < maxHexes; step++) {
    // Everyone still under way names the hex they want.
    const claims = new Map();
    for (const m of movers) {
      if (done.has(m.s.uid) || step >= m.hexes) continue;
      const nxt = m.drift ? board.driftTo(m.s, wind.from) : addStep(m.s, m.s.facing);
      if (!board.passable(nxt.q, nxt.r)) { done.add(m.s.uid); continue; }
      const k = nxt.q + ',' + nxt.r;
      if (!claims.has(k)) claims.set(k, { cell: nxt, want: [] });
      claims.get(k).want.push(m);
    }
    // Two ships for one hex: neither takes it. You do not sail through a rival
    // by winning a coin toss, you fall aboard her or bear away.
    for (const [k, claim] of claims) {
      if (claim.want.length > 1) {
        for (const m of claim.want) done.add(m.s.uid);
        continue;
      }
      const m = claim.want[0];
      const sitting = at.get(k);
      // The hex may be occupied by someone who is themselves moving on this
      // step; let them go first, and take it next time round.
      if (sitting && sitting !== m.s) { done.add(m.s.uid); continue; }
      at.delete(m.s.q + ',' + m.s.r);
      m.s.q = claim.cell.q; m.s.r = claim.cell.r;
      at.set(k, m.s);
      paths[m.s.uid].push({ q: claim.cell.q, r: claim.cell.r });
      // Crossing a shoal with way on her risks touching. Creeping is safer.
      if (!m.drift && board.isShoal(m.s.q, m.s.r)) {
        const fast = (m.hexes - step) > 1 || m.s.sails === 'full';
        const risk = Math.min(0.85, (fast ? 0.4 : 0.12) * draughtOf(m.s));
        if (chance(risk)) {
          m.s.grounded = true;
          done.add(m.s.uid);
          log(m.s.name + ' strikes the shoal and brings up hard aground!', 'big');
        }
      }
    }
  }
  return paths;
}

const addStep = (from, facing) => ({ q: from.q + DIRS[facing].q, r: from.r + DIRS[facing].r });
