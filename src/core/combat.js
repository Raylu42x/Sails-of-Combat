import { dist, relBearing } from './hex.js';
import { chance, rnd } from './rng.js';
import { anyLoaded, crewFrac, isLoaded, mountsOf, shortHanded, speedOf } from './ship.js';
import { gunType } from '../data/ships.js';
import { attOf } from './wind.js';

export const SHOT = {
  round:  { name: 'round', range: 3, reload: 1 },
  chain:  { name: 'chain', range: 2, reload: 1 },
  grape:  { name: 'grape', range: 1, reload: 1 },
  double: { name: 'double', range: 1, reload: 2 },
};

export const mountLabel = (s, id) => s.type.mounts[id].label || id;

// Turns to load a piece: the shot, the gun, and how many hands are left.
export function reloadTurns(s, mount, shot) {
  const g = gunType(mount.gun);
  return Math.max(1, SHOT[shot].reload + (mount.reload || 0) + g.reload + 1 + shortHanded(s));
}

// Drawing a charge is quicker than loading one: the shot comes out, the new one
// goes in, and the powder is already there. Half a reload, never less than one
// turn — so changing your mind costs you this turn's fire, not two.
export function drawTurns(s, mount, shot) {
  return Math.max(1, Math.ceil(reloadTurns(s, mount, shot) / 2));
}

// A gun loaded with one kind of shot cannot fire another.
export const canFire = (s, id, shot) => isLoaded(s, id) && s.guns[id].shot === shot;
export const rangeOf = (mount, shot) => Math.max(1, SHOT[shot].range + gunType(mount.gun).rangeMod);
export const acceptsShot = (mount, shot) => {
  const only = gunType(mount.gun).only;
  return !only || only.includes(shot);
};

// No sights, no fire control. A gun crew laid by eye off a moving deck, and
// accuracy fell away sharply with distance — which is why these fights closed
// to pistol shot. Hit chance by range, before any modifier.
const HIT_AT = [0, 0.9, 0.68, 0.46];

// Everything that makes a gun crew better or worse than that.
export function hitChance(s, t, mount, shot, d, wind) {
  let p = HIT_AT[Math.min(d, 3)] || 0.35;
  p *= 0.9 + (s.quality - 1);                     // a crack crew against a poor one
  p -= 0.08 * shortHanded(s);                     // fewer hands, worse laying
  if (shot === 'double') p *= 0.8;                // two balls, wild
  if (shot === 'grape') p *= 1.1;                 // a shotgun at this range
  if (wind && wind.speed >= 3) p *= 0.82;         // she rolls in a gale
  if (wind && wind.speed <= 1) p *= 1.06;         // a steady platform
  if (t.sails === 'full') p *= 0.94;              // going fast, harder to lay on
  return Math.max(0.12, Math.min(0.95, p));
}

// In a fresh gale she lies over far enough that the lee ports are awash. Head
// to wind or dead before it she stands upright and both batteries can fire.
export function leeSide(s, wind) {
  if (!wind || wind.speed < 3) return null;
  const rel = (wind.from - s.facing + 6) % 6;
  if (rel === 1 || rel === 2) return 'port';   // wind on the starboard hand
  if (rel === 4 || rel === 5) return 'stbd';
  return null;
}

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

// Enemies this mount could actually engage with this shot, nearest first.
function inArc(s, ctx, mount, shot, enemies) {
  const range = rangeOf(mount, shot);
  return enemies
    .filter(t => {
      const d = dist(s, t);
      return d > 0 && d <= range &&
        mount.arcs.includes(relBearing(s, t, s.facing)) &&
        !ctx.board.shotBlocked(s, t);
    })
    .sort((a, b) => dist(s, a) - dist(s, b));
}

// Which batteries would have to draw their charge to obey this order. Only
// guns with something to shoot at draw — ordering grape while she is still a
// mile off leaves your round shot where it is.
export function wouldDraw(s, ctx, shot) {
  if (shot === 'hold' || s.sails === 'full') return [];
  const enemies = targetsFor(s, ctx);
  return mountsOf(s)
    .filter(([id, m]) => isLoaded(s, id) && acceptsShot(m, shot) &&
      s.guns[id].shot !== shot && inArc(s, ctx, m, shot, enemies).length)
    .map(([id, m]) => ({ id, mount: m, tag: m.tag }));
}

// Every loaded mount that bears fires this turn — broadside and chasers alike.
export function fireAll(s, ctx, shot, results) {
  if (shot === 'hold') return; // hold your fire and keep what is in the guns
  if (s.sails === 'full') {
    if (anyLoaded(s)) results.push({ s, none: true, fullsail: true });
    return;
  }
  const enemies = targetsFor(s, ctx);
  let fired = 0, bore = false, drew = 0, heeled = null;
  const lee = leeSide(s, ctx.wind);
  for (const [id, mount] of mountsOf(s)) {
    if (!isLoaded(s, id)) continue;
    // Blowing hard, she heels away from the wind and her lee gunports come
    // down to the water. They stay shut. This is what the weather gage costs
    // you: the windward ship cannot open the battery she is bearing.
    if (lee && id === lee && !mount.chaser) { heeled = mount.label || id; continue; }
    if (!acceptsShot(mount, shot)) continue;      // swivels take grape and nothing else
    const candidates = inArc(s, ctx, mount, shot, enemies);
    if (mount.arcs.some(a => enemies.some(t => relBearing(s, t, s.facing) === a))) bore = true;
    if (s.guns[id].shot !== shot) {               // wrong charge in the barrel
      // Only draw for a gun that has a mark to shoot at; otherwise she keeps
      // what she is holding and you have lost nothing.
      if (!candidates.length) continue;
      s.guns[id].reload = drawTurns(s, mount, shot);
      s.guns[id].shot = shot;
      drew++;
      continue;
    }
    if (!candidates.length) continue;
    results.push(resolveShot(s, candidates[0], id, mount, shot, ctx.wind));
    fired++;
  }
  if (drew) results.push({ s, none: true, drew });
  if (heeled && !fired) results.push({ s, none: true, heeled });
  if (!fired && !drew && !heeled) results.push({ s, none: true, broadside: bore, empty: !anyLoaded(s) });
}

function resolveShot(s, t, mountId, mount, shot, wind) {
  const d = dist(s, t);
  // The countdown also ticks at the end of this turn, which reloadTurns allows for.
  s.guns[mountId] = { reload: reloadTurns(s, mount, shot), shot };
  const trel = relBearing(t, s, t.facing);
  const rake = trel === 0 ? 'bow' : (trel === 3 ? 'stern' : null);
  const mult = (rake === 'bow' ? 1.5 : rake === 'stern' ? 2 : 1) *
    (mount.power || 1) * gunType(mount.gun).power;
  const rangeMod = d >= 3 ? -1 : 0;
  const r = { s, t, shot, rake, mount: mountId, label: mount.label || mountId,
    chaser: !!mount.chaser, hull: 0, rig: 0, crew: 0, rudder: false, d };
  // Raking fires down the whole length of her — a far bigger mark than a beam.
  const p = Math.min(0.95, hitChance(s, t, mount, shot, d, wind) * (rake ? 1.15 : 1));
  if (!chance(p)) {
    r.miss = true;
    r.short = d >= 3;   // at long range it plumps into the sea short of her
    return r;
  }
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
    else if (r.heeled) log('She lies over in the gale — the ' + r.heeled +
      ' ports are under water and cannot be opened.', 'you');
    else if (r.drew) log('Charged with the wrong shot — the crews draw ' +
      (r.drew === 1 ? 'the charge' : 'the charges') + ' and reload. Ready next turn.', 'you');
    else if (r.empty) log('Every battery is still reloading.', 'you');
    else log('Your guns find no bearing' + (r.broadside ? ' at this range.' : ' — she lies off your arcs.'), 'you');
    return;
  }
  const t = r.t;
  if (r.miss) {
    log(r.s.name + ' fires her ' + r.label + ' at ' + t.name + ' — ' +
        (r.short ? 'the shot plumps into the sea short of her.' : 'and the broadside goes wide.'),
        r.s.isYou ? 'you' : 'foe');
    return;
  }
  t.hull = Math.max(0, t.hull - r.hull);
  t.rigging = Math.max(0, t.rigging - r.rig);
  t.crew = Math.max(0, t.crew - r.crew);
  if (r.rudder) t.rudderJam = 2;
  const bits = [];
  if (r.hull) bits.push(r.hull + ' hull');
  if (r.rig) bits.push(r.rig + ' rigging');
  if (r.crew) bits.push(r.crew + ' crew');
  log(r.s.name + ' fires her ' + r.label + ' at ' + t.name + ' — ' + r.shot +
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

// --- boarding: a running fight for the deck, not a single roll -------------
//
// Momentum runs from -3 to +3 in the boarder's favour. Push it to +3 and the
// deck is carried; let it fall to -3 and your own is. Each side commits as much
// of the crew as it dares: everything at once wins ground and costs men, the
// boarding party alone is steadier, and standing on the defensive to repel
// boarders is the strongest posture but gains nothing.

export const COMMITMENT = {
  press:    { weight: 1.0,  toll: 1.0,  name: 'all hands' },
  boarders: { weight: 0.7,  toll: 0.55, name: 'the boarding party' },
  hold:     { weight: 0.45, toll: 0.35, name: 'repel boarders', defence: 1.35 },
  back:     { weight: 0.3,  toll: 0.4,  name: 'fall back' },
};

export const MOMENTUM_TEXT = [
  'driven back to your own quarterdeck',
  'losing the waist',
  'holding, barely',
  'deck to deck, neither giving',
  'the waist is yours',
  'she is nearly carried',
  'her quarterdeck is yours',
];
export const momentumText = m => MOMENTUM_TEXT[Math.max(0, Math.min(6, m + 3))];

export function startBoarding(a, b) {
  return { a, b, momentum: 0, round: 1 };
}

// Swivels loaded with grape, fired into the boarders as they come over.
function swivelSupport(s) {
  let bonus = 0;
  for (const [id, m] of mountsOf(s)) {
    if (gunType(m.gun).only && gunType(m.gun).only.includes('grape') &&
        isLoaded(s, id) && s.guns[id].shot === 'grape') {
      s.guns[id] = { reload: reloadTurns(s, m, 'grape'), shot: 'grape' };
      bonus += 0.25;
    }
  }
  return bonus;
}

export function boardingRound(fight, a, b, actA, actB, log) {
  const A = COMMITMENT[actA] || COMMITMENT.press;
  const B = COMMITMENT[actB] || COMMITMENT.press;

  if (actA === 'back') {
    // Cutting free is easier when you are not losing the fight for the deck.
    const odds = 0.45 + fight.momentum * 0.08 + 0.2 * crewFrac(a);
    if (chance(odds)) {
      a.grappledTo = null; b.grappledTo = null;
      log('You cut the lashings and sheer off — the ships part.', 'you');
      return { parted: true, aLoss: 0, bLoss: 0, done: true };
    }
    log('The grapnels hold and her boarders press on — you cannot break free!', 'foe');
  }

  const swivA = swivelSupport(a), swivB = swivelSupport(b);
  if (swivA && a.isYou) log('Your swivels sweep her gangway with grape as they come on.', 'you');
  if (swivB && b.isYou === false && a.isYou) log(b.name + '’s swivels rake your boarders with grape.', 'foe');

  const strength = (s, c, swiv, other) =>
    s.crew * s.quality * c.weight * (c.defence || 1) * (1 + swiv) *
    (0.65 + 0.35 * rnd()) * (s.crewMax > other.crewMax ? 1.08 : 1);

  const sA = strength(a, A, swivA, b);
  const sB = strength(b, B, swivB, a);
  const margin = (sA - sB) / Math.max(1, sA + sB); // -1 .. +1

  // Casualties fall on both sides; the losing side pays more, and how much
  // depends on how many men each captain sent over.
  const base = 1 + Math.round(2.2 * Math.abs(margin));
  const aLoss = Math.max(0, Math.round((margin > 0 ? 1 : base) * A.toll));
  const bLoss = Math.max(0, Math.round((margin > 0 ? base : 1) * B.toll));
  a.crew = Math.max(0, a.crew - aLoss);
  b.crew = Math.max(0, b.crew - bLoss);

  const swing = Math.abs(margin) > 0.28 ? 2 : Math.abs(margin) > 0.08 ? 1 : 0;
  fight.momentum = Math.max(-3, Math.min(3, fight.momentum + Math.sign(margin) * swing));
  fight.round += 1;

  log('Cutlass and pike across the gangway — ' + bLoss + ' of hers down, ' + aLoss +
      ' of yours. ' + momentumText(fight.momentum) + '.', margin > 0 ? 'you' : 'foe');

  // Nobody fights to the last man: a deck carried is a ship struck.
  let carried = null;
  if (fight.momentum >= 3 || b.crew <= 0) carried = b;
  else if (fight.momentum <= -3 || a.crew <= 0) carried = a;
  return { parted: false, aLoss, bLoss, carried, momentum: fight.momentum };
}
