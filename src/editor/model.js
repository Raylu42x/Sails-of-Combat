// The level being drawn, and how to turn it back into a file.
//
// The shape here is exactly the shape of a file in levels/ — the editor is a
// way of writing that file, not a format of its own.
import { SHIP_TYPES } from '../data/ships.js';
export { PERSONALITIES, PERSONALITY_IDS } from '../data/personalities.js';

export const OBJECTIVES = {
  duel:    { label: 'Duel — beat every hostile ship', fields: { breakOffDist: 9 } },
  chase:   { label: 'Chase — run her down before she escapes', fields: { turnLimit: 16, escapeDist: 8 }, needs: 'quarry' },
  protect: { label: 'Protect — keep your charge alive', fields: { turnLimit: 12 }, needs: 'ward' },
  capture: { label: 'Capture — take a particular ship', fields: { turnLimit: 14 }, needs: 'prize' },
  escape:  { label: 'Escape — get clear of them', fields: { turnLimit: 12, escapeDist: 7 } },
  survive: { label: 'Survive — last the clock out', fields: { turnLimit: 12 } },
};

export const ROLES = ['player', 'enemy', 'quarry', 'ward', 'prize'];
export const MOODS = ['engage', 'flee', 'escort'];
export const DEPTHS = { shoal: 'Shoal — grounding risk', anchorage: 'Anchorage — holding ground' };
export const HEIGHTS = { low: 'Low island — blocks passage', tall: 'Tall island — blocks sight too' };
export const WIND_NAMES = ['N', 'NE', 'SE', 'S', 'SW', 'NW'];

export function blankLevel() {
  return {
    id: 'new-level',
    name: 'New Level',
    map: {
      cols: 11, rows: 12, scroll: false,
      wind: { from: 0, speed: 2, shiftEvery: 3 },
      islands: [], water: [],
    },
    objective: { type: 'duel', breakOffDist: 9 },
    briefing: '',
    ships: [],
  };
}

const key = c => c.q + ',' + c.r;
export const islandAt = (lvl, q, r) => (lvl.map.islands || []).find(c => key(c) === q + ',' + r);
export const waterAt = (lvl, q, r) => (lvl.map.water || []).find(c => key(c) === q + ',' + r);
export const shipAt = (lvl, q, r) => lvl.ships.find(s => s.q === q && s.r === r);

// Odd-q offset bounds, matching the board the game builds.
export const inBounds = (lvl, q, r) => {
  const row = r + (q - (q & 1)) / 2;
  return q >= 0 && q < lvl.map.cols && row >= 0 && row < lvl.map.rows;
};

export function cells(lvl) {
  const out = [];
  for (let col = 0; col < lvl.map.cols; col++) {
    for (let row = 0; row < lvl.map.rows; row++) {
      out.push({ q: col, r: row - (col - (col & 1)) / 2 });
    }
  }
  return out;
}

// --- what the level file will say ------------------------------------------
const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

function shipLine(s) {
  const bits = [`type: ${q(s.type)}`, `side: ${q(s.side)}`, `role: ${q(s.role)}`];
  if (s.ai && s.role !== 'player') bits.push(`ai: ${q(s.ai)}`);
  if (s.personality && s.personality !== 'professional' && s.role !== 'player') {
    bits.push(`personality: ${q(s.personality)}`);
  }
  bits.push(`name: ${q(s.name)}`, `q: ${s.q}`, `r: ${s.r}`, `facing: ${s.facing}`);
  if (s.anchor === 'down') bits.push("anchor: 'down'");
  const stats = Object.entries(s.stats || {}).filter(([, v]) => v !== '' && v != null);
  if (stats.length) bits.push('stats: { ' + stats.map(([k, v]) => `${k}: ${v}`).join(', ') + ' }');
  return '    { ' + bits.join(', ') + ' },';
}

function cellList(list, prop) {
  if (!list || !list.length) return '[]';
  return '[\n' + list.map(c => `      { q: ${c.q}, r: ${c.r}, ${prop}: ${q(c[prop])} },`).join('\n') + '\n    ]';
}

export function toFile(lvl) {
  const o = lvl.objective;
  const objBits = Object.entries(o)
    .map(([k, v]) => k === 'type' ? `type: ${q(v)}` : `${k}: ${v}`)
    .join(', ');
  return `// ${lvl.name} — one level. Fields are described in levels/index.js.
export default {
  id: ${q(lvl.id)},
  name: ${q(lvl.name)},
  map: {
    cols: ${lvl.map.cols}, rows: ${lvl.map.rows}, scroll: ${!!lvl.map.scroll},
    wind: { from: ${lvl.map.wind.from}, speed: ${lvl.map.wind.speed}, shiftEvery: ${lvl.map.wind.shiftEvery} },
    islands: ${cellList(lvl.map.islands, 'height')},
    water: ${cellList(lvl.map.water, 'depth')},
  },
  objective: { ${objBits} },
  briefing:
\`${(lvl.briefing || '').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`,
  ships: [
${lvl.ships.map(shipLine).join('\n')}
  ],
};
`;
}

export const shipClasses = () => Object.values(SHIP_TYPES);
