import { DIRNAMES } from './hex.js';
import { WIND_SPEEDS } from '../data/maps.js';
import { chance, rnd } from './rng.js';

// Point of sail: 0 in irons, 1 close-hauled, 2 reaching, 3 running.
export function attOf(facing, windFrom) {
  const d = Math.abs(facing - windFrom);
  return Math.min(d, 6 - d);
}

export const ATT_NAMES = ['In irons', 'Close-hauled', 'Reaching', 'Running'];

export const windProfile = wind => WIND_SPEEDS[wind.speed] || WIND_SPEEDS[2];

export const windLabel = wind => windProfile(wind).name + ' fr. ' + DIRNAMES[wind.from];

// How far a hull actually makes good once the strength of the wind is counted.
export function windScale(wind, hexes) {
  if (hexes <= 0) return 0;
  return Math.max(1, Math.round(hexes * windProfile(wind).mult));
}

// Wind shifts on the map's own clock. Returns the shift, or 0 for a steady wind.
export function maybeShift(wind, turn) {
  const every = wind.shiftEvery || 3;
  if (turn % every !== 0) return 0;
  if (!chance(windProfile(wind).shiftChance)) return 0;
  return rnd() < 0.5 ? 1 : -1;
}
