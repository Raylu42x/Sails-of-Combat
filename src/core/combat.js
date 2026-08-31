import { dist, relBearing } from './hex.js';
import { chance, rnd } from './rng.js';
import { anyLoaded, mountsOf, speedOf } from './ship.js';
import { attOf } from './wind.js';

export const SHOT = {
  round:  { name: 'round', range: 3, reload: 1 },
  chain:  { name: 'chain', range: 2, reload: 1 },
  grape:  { name: 'grape', range: 1, reload: 1 },
  double: { name: 'double', range: 1, reload: 2 },
};

export const MOUNT_LABEL = { port: 'port battery', stbd: 'starboard battery', bow: 'bow chaser', stern: 'stern chaser' };

// Which mount, if any, bears on a target — and whether it is loaded.
export function bearingMount(s, t) {
  const rel = relBearing(s, t, s.facing);
  for (const [id, m] of mountsOf(s)) {
    if (m.arcs.includes(rel)) return { id, mount: m, rel };
  }
  return null;
}

function targetsFor(s, ctx) {
  return ctx.ships.filter(o => !o.struck && o.side !== s.side);
}

// Every loaded mount that bears fires this turn — broadside and chasers alike.
export function fireAll(s, ctx, shot, results) {
  if (shot === 'hold') return;
  if (s.sails === 'full') {
    if (anyLoaded(s)) results.push({ s, none: true, fullsail: true });
    return;
  }
  const enemies = targetsFor(s, ctx);
  let fired = 0, bore = false;
  for (const [id, mount] of mountsOf(s)) {
    if (s.guns[id] !== 0) continue;
    const range = SHOT[shot].range;
    const candidates = enemies.filter(t => {
      const d = dist(s, t);
      if (d === 0) return false;
      if (!mount.arcs.includes(relBearing(s, t, s.facing))) return false;
      bore = true;
      return d <= range && !ctx.board.shotBlocked(s, t);
    });
    if (!candidates.length) continue;
    candidates.sort((a, b) => dist(s, a) - dist(s, b));
    results.push(resolveShot(s, candidates[0], id, mount, shot));
    fired++;
  }
  if (!fired) results.push({ s, none: true, broadside: bore, empty: !anyLoaded(s) });
}

function resolveShot(s, t, mountId, mount, shot) {
  const d = dist(s, t);
  // The battery countdown also ticks at the end of this turn, hence the +1.
  s.guns[mountId] = SHOT[shot].reload + (mount.reload || 0) + 1 + (s.crew / s.crewMax < 0.5 ? 1 : 0);
  const trel = relBearing(t, s, t.facing);
  const rake = trel === 0 ? 'bow' : (trel === 3 ? 'stern' : null);
  const mult = (rake === 'bow' ? 1.5 : rake === 'stern' ? 2 : 1) * (mount.power || 1);
  const rangeMod = d >= 3 ? -1 : 0;
  const r = { s, t, shot, rake, mount: mountId, chaser: !!mount.chaser, hull: 0, rig: 0, crew: 0, rudder: false };
  if (shot === 'round') {
    r.hull = Math.max(1, Math.round((2 + Math.floor(rnd() * 3) + rangeMod) * mult));
    if (chance(0.35)) r.crew = 1;
  } else if (shot === 'chain') {
    r.rig = Math.max(1, Math.round((2 + Math.floor(rnd() * 2)) * mult));
    if (t.sails === 'full') r.rig += 1;
  } else if (shot === 'grape') {
    r.crew = Math.max(1, Math.round((2 + Math.floor(rnd() * 3)) * mult));
  } else if (shot === 'double') {
    r.hull = Math.max(2, Math.round((3 + Math.floor(rnd() * 4)) * mult));
    if (chance(0.5)) r.crew = 1;
  }
  if (rake === 'stern' && chance(0.35)) r.rudder = true;
  return r;
}

export function applyFireResult(r, log) {
  const who = r.s.isYou ? 'you' : 'foe';
  if (r.none) {
    if (!r.s.isYou) return;
    if (r.fullsail) log('Gun crews are aloft — under full sail the guns stay silent.', 'you');
    else if (r.empty) log('Every battery is still reloading.', 'you');
    else log('Your guns find no bearing' + (r.broadside ? ' at this range.' : ' — she lies off your arcs.'), 'you');
    return;
  }
  const t = r.t;
  t.hull = Math.max(0, t.hull - r.hull);
  t.rigging = Math.max(0, t.rigging - r.rig);
  t.crew = Math.max(0, t.crew - r.crew);
  if (r.rudder) t.rudderJam = 2;
  const bits = [];
  if (r.hull) bits.push(r.hull + ' hull');
  if (r.rig) bits.push(r.rig + ' rigging');
  if (r.crew) bits.push(r.crew + ' crew');
  log(r.s.name + ' fires her ' + MOUNT_LABEL[r.mount] + ' at ' + t.name + ' — ' + r.shot +
      (r.rake ? ', RAKING her ' + r.rake + '!' : '') + ' (' + bits.join(', ') + ')',
      r.rake ? 'big' : who);
  if (r.rudder) log(t.name + '’s rudder is shot away — she cannot steer!', 'big');
  if (t.rigging === 0 && r.rig) log(t.name + ' is dismasted! She drifts helpless.', 'big');
}

// --- grappling and boarding -------------------------------------------------

export function tryGrapple(s, ctx, wants, log) {
  if (s.grappledTo || s.struck) return null;
  const enemy = ctx.ships.find(o => !o.struck && o.side !== s.side && dist(s, o) === 1 && !o.grappledTo);
  if (!enemy) {
    if (wants && s.isYou) log('No grapple — she is beyond the throw of a hook.', 'you');
    return null;
  }
  const slow = enemy.inIrons || enemy.rigging / enemy.rigMax <= 0.4 ||
    speedOf(enemy, attOf(enemy.facing, ctx.wind.from), enemy.sails, ctx.wind) <= 1;
  if (chance(slow ? 0.75 : 0.4)) {
    s.grappledTo = enemy; enemy.grappledTo = s;
    log('Grappling hooks bite — ' + s.name + ' and ' + enemy.name + ' are lashed together!', 'big');
    return enemy;
  }
  log((s.isYou ? 'Your' : 'Her') + ' hooks fall short — she sheers away.', s.isYou ? 'you' : 'foe');
  return null;
}

export function meleeRound(a, b, act, log) {
  if (act === 'back') {
    if (chance(0.7)) {
      a.grappledTo = null; b.grappledTo = null;
      log('You cut the lines and fend off — the ships part.', 'you');
      return { parted: true, aLoss: 0, bLoss: 0 };
    }
    log('The lines hold — you cannot break free!', 'foe');
  }
  const aS = a.crew * a.quality * (0.6 + 0.4 * rnd());
  const bS = b.crew * b.quality * (0.6 + 0.4 * rnd());
  let aLoss, bLoss;
  if (act === 'press') { bLoss = 2 + (aS > bS ? 2 : 0); aLoss = 1 + (bS > aS ? 2 : 0); }
  else { bLoss = aS > bS ? 1 : 0; aLoss = bS > aS ? 1 : 0; }
  a.crew = Math.max(0, a.crew - aLoss);
  b.crew = Math.max(0, b.crew - bLoss);
  log('Melee on the deck — ' + bLoss + ' of hers down, ' + aLoss + ' of yours.', aS > bS ? 'you' : 'foe');
  return { parted: false, aLoss, bLoss };
}
