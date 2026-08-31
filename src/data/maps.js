// Maps: a chart size, a wind, and whatever land is in the way.
//
//   scroll    true  — open ocean; the chart slides to keep the fight centred
//             false — fixed waters; islands stay put and you must work round them
//   wind.speed 1 light airs · 2 moderate · 3 fresh gale
//   islands   { q, r, height } — 'low' blocks movement, 'tall' also blocks sight

export const WIND_SPEEDS = {
  1: { name: 'Light airs', mult: 0.6, shiftChance: 0.25 },
  2: { name: 'Moderate breeze', mult: 1, shiftChance: 0.4 },
  3: { name: 'Fresh gale', mult: 1.35, shiftChance: 0.55 },
};

// Small helper so island shapes stay readable below.
const blob = (q, r, height, cells) => cells.map(([dq, dr]) => ({ q: q + dq, r: r + dr, height }));

export const MAPS = {
  openSea: {
    id: 'openSea', name: 'Windward Passage',
    cols: 9, rows: 10, scroll: true,
    wind: { from: 0, speed: 2, shiftEvery: 3 },
    islands: [],
  },
  shoals: {
    id: 'shoals', name: 'The Serpent Shoals',
    cols: 11, rows: 12, scroll: false,
    wind: { from: 5, speed: 1, shiftEvery: 4 },
    islands: [
      ...blob(3, 2, 'low', [[0, 0], [1, 0], [0, 1]]),
      ...blob(7, 1, 'low', [[0, 0], [0, 1]]),
      ...blob(5, 6, 'low', [[0, 0], [1, -1], [1, 0]]),
    ],
  },
  cays: {
    id: 'cays', name: 'Dead Man’s Cays',
    cols: 11, rows: 12, scroll: false,
    wind: { from: 1, speed: 2, shiftEvery: 4 },
    islands: [
      ...blob(4, 1, 'tall', [[0, 0], [0, 1], [1, 0]]),
      ...blob(8, 3, 'tall', [[0, 0], [0, 1]]),
      ...blob(2, 7, 'low', [[0, 0], [1, 0]]),
    ],
  },
  gale: {
    id: 'gale', name: 'Mona Gale',
    cols: 10, rows: 11, scroll: true,
    wind: { from: 2, speed: 3, shiftEvery: 2 },
    islands: [],
  },
};

export const mapById = id => MAPS[id] || MAPS.openSea;

// Terrain lookup built once per game: "q,r" -> 'low' | 'tall'
export function terrainOf(map) {
  const t = new Map();
  for (const c of map.islands || []) t.set(c.q + ',' + c.r, c.height || 'low');
  return t;
}
