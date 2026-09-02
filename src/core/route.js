import { DIRS } from './hex.js';
import { draughtOf } from '../data/ships.js';

// A distance field over the whole chart, measured the way this particular hull
// would actually have to sail it: banks are expensive for a deep ship rather
// than merely disliked, and land is impassable.
//
// One-ply scoring off straight-line distance cannot see round an obstacle. A
// ship at the edge of a shoal belt found that every legal move either touched a
// bank or increased the straight-line distance, so standing still won the
// argument every turn and she parked there for the rest of the action. With a
// real field, "three hexes round the end of the bank" is simply closer than
// "sit here", and she sails it.
export function distanceField(board, from, ship) {
  const cost = new Map();
  const shoalCost = 1 + 4 * draughtOf(ship);   // a sloop shrugs; a frigate does not
  const start = from.q + ',' + from.r;
  cost.set(start, 0);
  // Small board, cheap moves: Dijkstra with a plain queue re-scanned on
  // improvement is more than fast enough and keeps this readable.
  const queue = [{ q: from.q, r: from.r, c: 0 }];
  while (queue.length) {
    queue.sort((a, b) => a.c - b.c);
    const cur = queue.shift();
    const k = cur.q + ',' + cur.r;
    if (cur.c > (cost.get(k) ?? Infinity)) continue;
    for (const d of DIRS) {
      const nq = cur.q + d.q, nr = cur.r + d.r;
      if (!board.passable(nq, nr)) continue;
      const step = board.isShoal(nq, nr) ? shoalCost : 1;
      const nk = nq + ',' + nr;
      const next = cur.c + step;
      if (next < (cost.get(nk) ?? Infinity)) {
        cost.set(nk, next);
        queue.push({ q: nq, r: nr, c: next });
      }
    }
  }
  return {
    at(q, r) { return cost.get(q + ',' + r) ?? 99; },
  };
}
