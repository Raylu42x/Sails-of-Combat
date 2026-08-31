import { DIRS, between, dist } from './hex.js';

// The board knows where the edges are, where the land is, and what can be seen.
export function createBoard(map) {
  const terrain = new Map();
  for (const c of map.islands || []) terrain.set(c.q + ',' + c.r, c.height || 'low');
  const soundings = new Map();
  for (const c of map.water || []) soundings.set(c.q + ',' + c.r, c.depth || 'deep');

  const inBounds = (q, r) => {
    const col = q, row = r + (q - (q & 1)) / 2;
    return col >= 0 && col < map.cols && row >= 0 && row < map.rows;
  };
  const landAt = (q, r) => terrain.get(q + ',' + r) || null;

  // 'deep' has no bottom worth anchoring in; 'shoal' can be touched at speed.
  const depthAt = (q, r) => soundings.get(q + ',' + r) || 'deep';

  return {
    map, terrain, soundings, inBounds, landAt, depthAt,
    // The lead finds bottom, so the anchor will hold.
    anchorable: (q, r) => depthAt(q, r) !== 'deep' && !landAt(q, r),
    isShoal: (q, r) => depthAt(q, r) === 'shoal',
    cols: map.cols, rows: map.rows,
    scrolls: !!map.scroll,

    // Every hex on the chart, for drawing and for scattering things about.
    cells() {
      const out = [];
      for (let col = 0; col < map.cols; col++) {
        for (let row = 0; row < map.rows; row++) {
          out.push({ q: col, r: row - (col - (col & 1)) / 2 });
        }
      }
      return out;
    },

    passable(q, r) { return inBounds(q, r) && !landAt(q, r); },

    // Tall land blocks the eye; low land and open water do not.
    sightBlocked(a, b) {
      if (dist(a, b) <= 1) return false;
      return between(a, b).some(c => landAt(c.q, c.r) === 'tall');
    },

    // Shots need the same clear lane the eye does.
    shotBlocked(a, b) { return this.sightBlocked(a, b); },

    // Where a ship blown to leeward ends up.
    driftTo(s, windFrom) {
      const d = DIRS[(windFrom + 3) % 6];
      return { q: s.q + d.q, r: s.r + d.r };
    },
  };
}
