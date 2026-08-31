import { shipType } from '../data/ships.js';
import { attOf, windScale } from './wind.js';
import { chance } from './rng.js';

let nextId = 1;

export function createShip(spec) {
  const t = shipType(spec.type);
  // Every battery starts loaded with round shot, run out and ready.
  const guns = {};
  for (const id of Object.keys(t.mounts)) guns[id] = { reload: 0, shot: 'round' };
  return {
    uid: 'S' + (nextId++),
    typeId: t.id, type: t,
    name: spec.name || t.name,
    side: spec.side || 'hostile',
    role: spec.role || 'enemy',
    ai: spec.ai || (spec.role === 'player' ? null : 'engage'),
    isYou: spec.role === 'player',
    q: spec.q, r: spec.r, facing: spec.facing || 0,
    rig: t.rig, speeds: t.speeds, turnMax: t.turnMax, tackOdds: t.tackOdds,
    quality: t.quality,
    hull: t.hull, hullMax: t.hull,
    rigging: t.rigging, rigMax: t.rigging,
    crew: t.crew, crewMax: t.crew,
    sails: 'battle', guns, rudderJam: 0, inIrons: false, struck: false,
    grappledTo: null, seen: true,
  };
}

export const mountsOf = s => Object.entries(s.type.mounts);
export const isLoaded = (s, id) => s.guns[id].reload === 0;
export const anyLoaded = s => Object.values(s.guns).some(g => g.reload === 0);
export const isAlive = s => !s.struck;

// How much of the crew is left to work the ship. Below half she is short-handed:
// slower to reload, slower to hand sail, and far less likely to stay in stays.
export const crewFrac = s => s.crew / s.crewMax;
export function shortHanded(s) {
  const f = crewFrac(s);
  return f >= 0.5 ? 0 : f >= 0.25 ? 1 : 2; // 0 full, 1 short, 2 skeleton
}

// Hexes she will make good this turn on this point of sail.
export function speedOf(s, att, sails, wind) {
  let v = s.speeds[att];
  const short = shortHanded(s);
  // A skeleton crew cannot carry full sail at all, and hands sail slowly.
  if (sails === 'full' && v > 0) v += short >= 2 ? 0 : 1;
  if (sails === 'takein') v = Math.min(v, 1);
  const frac = s.rigging / s.rigMax;
  if (frac <= 0) return 0;
  let hexes = Math.ceil(v * frac);
  if (short >= 2 && hexes > 1) hexes -= 1;
  return windScale(wind, hexes);
}

export function simFacing(s, helm) {
  let f = s.facing;
  const dir = Math.sign(helm);
  for (let i = 0; i < Math.abs(helm); i++) f = (f + dir + 6) % 6;
  return f;
}

// Put the helm over, one point at a time, with the eye of the wind to get through.
export function applyHelm(s, helm, wind, log) {
  if (s.rudderJam > 0) {
    if (helm !== 0) log(s.name + ' — rudder fouled, she will not answer the helm!', s.isYou ? 'you' : 'foe');
    return;
  }
  helm = Math.max(-s.turnMax, Math.min(s.turnMax, helm));
  if (s.inIrons) helm = Math.max(-1, Math.min(1, helm));
  const dir = Math.sign(helm);
  for (let i = 0; i < Math.abs(helm); i++) {
    const next = (s.facing + dir + 6) % 6;
    if (next === wind.from) {
      s.facing = next;
      // Missing stays is a crew failure as much as a wind one.
      const odds = s.tackOdds * (0.55 + 0.45 * crewFrac(s));
      if (chance(odds)) {
        s.inIrons = false;
        log(s.name + ' tacks through the eye of the wind — smartly done.', s.isYou ? 'you' : 'foe');
      } else {
        s.inIrons = true;
        log(s.name + ' misses stays — caught in irons!', 'big');
        return;
      }
    } else {
      s.facing = next;
      if (s.facing !== wind.from) s.inIrons = false;
    }
  }
  if (attOf(s.facing, wind.from) === 0) s.inIrons = true;
}
