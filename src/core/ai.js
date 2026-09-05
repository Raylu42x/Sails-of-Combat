import { angleOf, dist, relBearing } from './hex.js';
import { rnd } from './rng.js';
import { attOf } from './wind.js';
import { isLoaded, mountsOf } from './ship.js';
import { draughtOf } from '../data/ships.js';
import { personalityOf } from '../data/personalities.js';
import { acceptsShot, rangeOf } from './combat.js';
import { pathOf } from './movement.js';
import { distanceField } from './route.js';

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
  const who = personalityOf(s.personality);
  // Hurt badly enough, a captain with anything to lose stops trying to win and
  // starts trying to leave. How badly is the difference between a coastguard
  // doing a job and a privateer who has already spent his luck.
  const beaten = (s.hull / s.hullMax) < who.nerve || (s.crew / s.crewMax) < who.nerve;
  const wants = beaten && mood !== 'escort' ? 'flee' : mood;
  const ward = mood === 'escort' ? ctx.ships.find(o => o.role === 'ward' && !o.struck) : null;
  const helms = [];
  for (let h = -s.turnMax; h <= s.turnMax; h++) helms.push(h);
  let best = null;

  // How far every hex is from her mark, sailed rather than measured — so a bank
  // between the two ships is something to sail round, not a wall to sit behind.
  const field = distanceField(ctx.board, foe, s);
  const ward2 = ward ? distanceField(ctx.board, ward, s) : null;

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
      const sailed = field.at(pos.q, pos.r);   // distance as she would have to sail it
      let score = 0;

      // Can anything shoot from there?
      let armed = false;
      for (const [id, m] of mountsOf(s)) {
        if (!isLoaded(s, id)) continue;
        if (m.arcs.includes(relBearing(pos, foe, f))) armed = true;
      }
      if (wants === 'flee') {
        score += Math.min(sailed, 12) * 2.2;               // put water between us
        if (armed && d <= 2) score += 2;                   // a parting shot is welcome
        if (sails === 'full') score += 2.5;
        if (sails === 'takein') score -= 3;
      } else if (wants === 'escort' && ward) {
        score -= Math.abs(ward2.at(pos.q, pos.r) - 1.5) * 2.5; // stay by the charge
        score -= Math.abs(sailed - 1.5);
        if (armed && d <= 3) score += 4;
      } else {
        score -= Math.abs(sailed - who.standoff) * 2;      // the range she likes
        if (armed && d <= 3) score += who.armed;
        if (sails === 'full' && armed && d <= 3) score -= 5; // full sail silences the guns
        if (sails === 'takein') score -= 2;
      }
      if (ctx.board.shotBlocked(pos, foe)) score += wants === 'flee' ? 3 : -3; // land in the way
      // A ship lying motionless is a ship not being handled. Near a bank every
      // move either touches the ground or opens the range, so standing still
      // used to win the argument every turn and she would park there for the
      // rest of the action — a free target, and an infinite staring contest.
      // Wanting way on breaks the tie, and wanting it more each turn she has
      // sat there makes her work round the shoal rather than sulk beside it.
      if (!path.length) score -= 2.5 + 1.6 * (s.idleTurns || 0);
      // A deep-draught ship will not follow a sloop over a bank, and knows it.
      if (ctx.board.isShoal(pos.q, pos.r)) score -= 5 * draughtOf(s);
      if (attOf(f, wind.from) === 0) score -= 100;
      // A nudge to keep the weather gage (or run off before it, when fleeing).
      const gage = ((foe.q - pos.q) * 1.5 * wv.x + (foe.r - pos.r) * 1.5 * wv.y) * (wants === 'flee' ? 0.03 : -0.06);
      score += gage + rnd() * 0.8;
      if (!best || score > best.score) best = { helm, sails, score, endDist: d };
    }
  }
  if (!best) best = { helm: 0, sails: 'battle', endDist: dist(s, foe) };

  // What she loads is what she is after.
  let shot = 'round';
  const close = best.endDist <= 1, near = best.endDist <= 2;
  if (wants === 'flee') shot = near ? 'chain' : 'round';
  else if (who.aim === 'rigging') shot = near ? 'chain' : 'round';          // take her whole
  else if (who.aim === 'crew') shot = close ? 'grape' : near ? 'chain' : 'round';
  else if (who.aim === 'smash') shot = close ? 'double' : 'round';
  else if (who.aim === 'hull') shot = 'round';                              // no fancy business
  else if (close) shot = foe.crew / foe.crewMax > 0.45 ? 'grape' : 'double';
  else if (near && foe.rigging / foe.rigMax > 0.45 && ctx.turn <= 6) shot = 'chain';

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
  const who = personalityOf(s.personality);
  if (!who.boarding) return false;                     // some captains never board
  const foe = nearestEnemy(s, ctx);
  if (!foe || dist(s, foe) !== 1) return false;
  // A boarder will take an even fight; a careful one wants the odds first.
  const edge = 1.2 / who.boarding;
  return foe.crew * edge < s.crew && s.crew / s.crewMax > 0.5;
}
