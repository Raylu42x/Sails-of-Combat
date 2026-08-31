// Flat-top hexes in axial (q, r) coordinates, laid out on screen as odd-q offset.
// Everything here is pure maths — no canvas, no DOM, no game state.

export const DIRS = [
  { q: 0, r: -1 }, { q: 1, r: -1 }, { q: 1, r: 0 },
  { q: 0, r: 1 }, { q: -1, r: 1 }, { q: -1, r: 0 },
];
export const DIRNAMES = ['N', 'NE', 'SE', 'S', 'SW', 'NW'];
export const SQ3 = Math.sqrt(3);

// Unit-scale layout position. Multiply by hex size and add an origin to draw.
export const unitPos = (q, r) => ({ x: 1.5 * q, y: SQ3 * (r + q / 2) });

export const key = (q, r) => q + ',' + r;

export const add = (a, d) => ({ q: a.q + d.q, r: a.r + d.r });
export const step = (a, facing) => add(a, DIRS[facing]);
export const same = (a, b) => a.q === b.q && a.r === b.r;

export function dist(a, b) {
  const dq = a.q - b.q, dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

// Which of the six facings points from a towards b.
export function dirBetween(a, b) {
  const A = unitPos(a.q, a.r), B = unitPos(b.q, b.r);
  const ang = Math.atan2(B.y - A.y, B.x - A.x) * 180 / Math.PI;
  return (Math.round((ang + 90) / 60) % 6 + 6) % 6;
}

// Bearing of b relative to a's bow, 0 = dead ahead, 3 = dead astern.
export const relBearing = (a, b, facing) => (dirBetween(a, b) - facing + 6) % 6;

export const angleOf = facing => (-90 + 60 * facing) * Math.PI / 180;

// --- cube helpers, used for drawing straight lines across the chart ---
const toCube = h => ({ x: h.q, z: h.r, y: -h.q - h.r });
const fromCube = c => ({ q: c.x, r: c.z });
function cubeRound(c) {
  let rx = Math.round(c.x), ry = Math.round(c.y), rz = Math.round(c.z);
  const dx = Math.abs(rx - c.x), dy = Math.abs(ry - c.y), dz = Math.abs(rz - c.z);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return { x: rx, y: ry, z: rz };
}

// Hexes crossed by the line from a to b, endpoints included.
export function line(a, b) {
  const n = dist(a, b);
  if (n === 0) return [{ q: a.q, r: a.r }];
  const A = toCube(a), B = toCube(b), out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push(fromCube(cubeRound({
      x: A.x + (B.x - A.x) * t,
      y: A.y + (B.y - A.y) * t,
      z: A.z + (B.z - A.z) * t,
    })));
  }
  return out;
}

// The hexes strictly between a and b — what a shot has to fly over.
export const between = (a, b) => line(a, b).slice(1, -1);
