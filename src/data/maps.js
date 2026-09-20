// Maps: a chart size, a wind, and whatever land is in the way.
//
//   scroll    true  — open ocean; the chart slides to keep the fight centred
//             false — fixed waters; islands stay put and you must work round them
//   wind.speed 1 light airs · 2 moderate · 3 fresh gale
//   islands   { q, r, height } — 'low' blocks movement, 'tall' also blocks sight
//   water     { q, r, depth }  — 'anchorage' holding ground for an anchor,
//                                'shoal' shallow enough to touch at speed.
//                                Anything unlisted is deep water: no bottom
//                                for an anchor, and nothing to run aground on.

export const WIND_SPEEDS = {
  1: { name: 'Light airs', mult: 0.6, shiftChance: 0.25 },
  2: { name: 'Moderate breeze', mult: 1, shiftChance: 0.4 },
  3: { name: 'Fresh gale', mult: 1.35, shiftChance: 0.55 },
};

// Small helper so island shapes stay readable below.
const blob = (q, r, height, cells) => cells.map(([dq, dr]) => ({ q: q + dq, r: r + dr, height }));
const water = (depth, cells) => cells.map(([q, r]) => ({ q, r, depth }));
// A shoreline is not a blob — it wanders. Listing its cells outright keeps the
// shape of a coast readable where a blob would not.
const coast = (height, cells) => cells.map(([q, r]) => ({ q, r, height }));

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
    // The shoals the place is named for, and the holding ground beside them.
    water: [
      ...water('shoal', [[2, 2], [4, 1], [4, 2], [3, 3], [6, 1], [8, 0], [5, 5], [6, 5], [4, 7]]),
      ...water('anchorage', [[3, 1], [2, 3], [7, 0], [6, 6], [5, 7], [4, 6]]),
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
    water: [
      ...water('shoal', [[3, 1], [5, 1], [4, 3], [8, 2], [9, 3], [1, 7], [3, 7]]),
      ...water('anchorage', [[3, 2], [5, 0], [7, 3], [2, 6], [4, 8]]),
    ],
  },
  bay: {
    id: 'bay', name: 'Careenage Bay',
    cols: 10, rows: 11, scroll: false,
    wind: { from: 3, speed: 1, shiftEvery: 5 },
    islands: [
      // A headland that hides the anchorage until you are round it.
      ...blob(2, 1, 'tall', [[0, 0], [0, 1], [1, 0], [1, 1]]),
      ...blob(7, 0, 'low', [[0, 0], [0, 1]]),
      ...blob(0, 6, 'low', [[0, 0], [1, 0]]),
    ],
    water: [
      ...water('anchorage', [[4, 1], [5, 1], [4, 2], [5, 0], [3, 2], [6, 1]]),
      ...water('shoal', [[3, 0], [6, 0], [2, 3], [6, 2], [7, 2], [1, 5]]),
    ],
  },
  packetRun: {
    id: 'packetRun', name: 'The Windward Passage, moderate',
    cols: 10, rows: 11, scroll: true,
    wind: { from: 2, speed: 2, shiftEvery: 4 },
    islands: [], water: [],
  },
  // A bight open to the north, with the beach across the foot of it and a bank
  // strung between the two headlands. In a northerly gale everything in here is
  // to leeward of everything else, which is the whole difficulty.
  bight: {
    id: 'bight', name: 'Salt Kettle Bight',
    cols: 11, rows: 12, scroll: false,
    wind: { from: 0, speed: 3, shiftEvery: 3 },
    islands: [
      // The two headlands that make the bight, north to south.
      ...coast('low', [[0, 5], [1, 5], [0, 6], [1, 6], [1, 7]]),
      ...coast('low', [[9, 1], [10, 0], [9, 2], [10, 1], [9, 3]]),
      // The beach across the foot of it. Nothing claws off this.
      ...coast('low', [[1, 10], [2, 9], [3, 9], [4, 8], [5, 8], [6, 7], [7, 7], [8, 6], [9, 6]]),
      ...coast('low', [[0, 11], [1, 11], [2, 10], [3, 10], [4, 9], [5, 9], [6, 8], [7, 8], [8, 7], [9, 7], [10, 6]]),
    ],
    water: [
      // Outlying heads off each point, then the bank across the head of the bight.
      ...water('shoal', [[2, 2], [8, -1], [2, 6], [8, 3], [2, 7], [3, 7], [7, 5], [8, 4]]),
      ...water('shoal', [[3, 8], [4, 7], [5, 7], [6, 6], [7, 6]]),
    ],
  },
  // Ten miles of sand a fathom under the keel, with a dry cay in the middle of
  // it and a gut at either end. The short way across is over the ground.
  flats: {
    id: 'flats', name: 'The Bonefish Flats',
    cols: 12, rows: 11, scroll: false,
    wind: { from: 3, speed: 2, shiftEvery: 4 },
    islands: [...coast('low', [[5, 2], [5, 3]])],
    water: [
      // The bank, west half and east half, with the guts left deep.
      ...water('shoal', [[0, 4], [2, 3], [3, 3], [4, 2], [0, 5], [2, 4], [3, 4], [4, 3]]),
      ...water('shoal', [[6, 1], [7, 1], [8, 0], [9, 0], [11, -1], [6, 2], [7, 2], [8, 1], [9, 1], [11, 0]]),
    ],
  },
  gale: {
    id: 'gale', name: 'Mona Gale',
    cols: 10, rows: 11, scroll: true,
    wind: { from: 2, speed: 3, shiftEvery: 2 },
    islands: [],
  },
};

// A level may name a shared chart ('cays') or carry its own inline — which is
// what the level editor writes, since drawing the water and placing the ships
// on it are the same act.
export const mapById = id => {
  if (id && typeof id === 'object') {
    return Object.assign({ id: 'inline', name: 'Uncharted water', cols: 9, rows: 10, scroll: false,
      wind: { from: 0, speed: 2, shiftEvery: 3 }, islands: [], water: [] }, id);
  }
  return MAPS[id] || MAPS.openSea;
};

// Terrain lookup built once per game: "q,r" -> 'low' | 'tall'
export function terrainOf(map) {
  const t = new Map();
  for (const c of map.islands || []) t.set(c.q + ',' + c.r, c.height || 'low');
  return t;
}
