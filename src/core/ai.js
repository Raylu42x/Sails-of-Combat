import { angleOf, dist, relBearing } from './hex.js';
import { rnd } from './rng.js';
import { attOf } from './wind.js';
import { isLoaded, mountsOf } from './ship.js';
import { acceptsShot, rangeOf } from './combat.js';
import { pathOf } from './movement.js';

const nearestEnemy = (s, ctx) => ctx.ships
  .filter(o => !o.struck && o.side !== s.side)
  .sort((a, b) => dist(s, a) - dist(s, b))[0] || null;

// One shared search: try every helm and sail setting, score the outcome,
// take the best. What differs between AI moods is only the scoring.
export function aiOrders(s, ctx) {
  const foe = nearestEnemy(s, ctx);
  if (!foe) return { helm: 0, sails: 'battle', shot: 'hold' };
  if (s.grappledTo) return { helm: 0, sails: 'battle', shot: foe.crew > 4 ? 'grape' : 'round' };

  const wind = ctx.wind;
  const wv = { x: Math.cos(angleOf(wind.from)), y: Math.sin(angleOf(wind.from)) };
  const mood = s.ai || 'engage';
  const ward = mood === 'escort' ? ctx.ships.find(o => o.role === 'ward' && !o.struck) : null;
  const helms = [];
  for (let h = -s.turnMax; h <= s.turnMax; h++) helms.push(h);
  let best = null;

  for (const helm of helms) {
    let f = s.facing, risky = false;
    const dir = Math.sign(helm);
    for (let i = 0; i < Math.abs(helm); i++) { f = (f + dir + 6) % 6; if (f === wind.from) risky = true; }
    if (risky) continue;
    for (const sails of ['battle', 'full', 'takein']) {
      const inIrons = attOf(f, wind.from) === 0;
      const path = pathOf(s, ctx, { facing: f, sails, inIrons });
      const end = path.length ? path[path.length - 1] : { q: s.q, r: s.r };
      const pos = { q: end.q, r: end.r };
      const d = dist(pos, foe);
      let score = 0;

      // Can anything shoot from there?
      let armed = false;
      for (const [id, m] of mountsOf(s)) {
        if (!isLoaded(s, id)) continue;
        if (m.arcs.includes(relBearing(pos, foe, f))) armed = true;
      }
      if (mood === 'flee') {
        score += d * 2.2;                                  // put water between us
        if (armed && d <= 2) score += 2;                   // a parting shot is welcome
        if (sails === 'full') score += 2.5;
        if (sails === 'takein') score -= 3;
      } else if (mood === 'escort' && ward) {
        score -= Math.abs(dist(pos, ward) - 1.5) * 2.5;    // stay alongside the charge
        score -= Math.abs(d - 1.5);
        if (armed && d <= 3) score += 4;
      } else {
        score -= Math.abs(d - 1.5) * 2;                    // lay her alongside
        if (armed && d <= 3) score += 6;
        if (sails === 'full' && armed && d <= 3) score -= 5; // full sail silences the guns
        if (sails === 'takein') score -= 2;
      }
      if (ctx.board.shotBlocked(pos, foe)) score += mood === 'flee' ? 3 : -3; // land in the way
      if (ctx.board.isShoal(pos.q, pos.r)) score -= 6;                        // no captain wants this
      if (attOf(f, wind.from) === 0) score -= 100;
      // A nudge to keep the weather gage (or run off before it, when fleeing).
      const gage = ((foe.q - pos.q) * 1.5 * wv.x + (foe.r - pos.r) * 1.5 * wv.y) * (mood === 'flee' ? 0.03 : -0.06);
      score += gage + rnd() * 0.8;
      if (!best || score > best.score) best = { helm, sails, score, endDist: d };
    }
  }
  if (!best) best = { helm: 0, sails: 'battle', endDist: dist(s, foe) };

  let shot = 'round';
  if (mood === 'flee') shot = best.endDist <= 2 ? 'chain' : 'round';
  else if (best.endDist <= 1) shot = foe.crew / foe.crewMax > 0.45 ? 'grape' : 'double';
  else if (best.endDist <= 2 && foe.rigging / foe.rigMax > 0.45 && ctx.turn <= 6) shot = 'chain';

  // Drawing a good charge to load a better one wastes the turn that matters.
  // If something is loaded and will bear, fire what is in the gun.
  const readyNow = mountsOf(s)
    .filter(([id, m]) => isLoaded(s, id) && acceptsShot(m, s.guns[id].shot) &&
      best.endDist <= rangeOf(m, s.guns[id].shot))
    .map(([id]) => s.guns[id].shot);
  if (readyNow.length && !readyNow.includes(shot)) shot = readyNow[0];
  return { helm: best.helm, sails: best.sails, shot };
}

// Does this ship want to board? Only the aggressive ones, and only when winning.
export function aiWantsGrapple(s, ctx) {
  if (s.ai !== 'engage') return false;
  const foe = nearestEnemy(s, ctx);
  if (!foe) return false;
  return foe.crew * 1.2 < s.crew && s.crew / s.crewMax > 0.5 && dist(s, foe) === 1;
}
