import { dist } from './hex.js';
import { chance } from './rng.js';

// Verdicts: { done, won, title, text } — or null while the fight goes on.
// Adding a level type means adding a case here.
const alive = (ships, pred) => ships.filter(s => !s.struck && pred(s));

export function evaluate(ctx) {
  const { ships, scenario, turn } = ctx;
  const obj = scenario.objective || { type: 'duel' };
  const you = ships.find(s => s.isYou);
  if (!you) return null;

  if (you.struck) {
    return { done: true, won: false, title: 'Struck',
      text: 'The ' + you.name + ' can fight no longer. You haul down your colours.' };
  }

  const hostiles = alive(ships, s => s.side === 'hostile');
  const quarry = ships.find(s => s.role === 'quarry');
  const ward = ships.find(s => s.role === 'ward');

  switch (obj.type) {
    case 'chase': {
      if (!quarry || quarry.struck) {
        return { done: true, won: true, title: 'Prize Taken',
          text: 'The ' + (quarry ? quarry.name : 'quarry') + ' strikes. The despatches are yours.' };
      }
      if (dist(you, quarry) >= (obj.escapeDist || 8)) {
        return { done: true, won: false, title: 'Lost Her',
          text: 'She is hull down and drawing away. The despatches go through.' };
      }
      if (obj.turnLimit && turn > obj.turnLimit) {
        return { done: true, won: false, title: 'Lost Her',
          text: 'Night comes on with her still ahead of you. The chase is over.' };
      }
      return null;
    }
    case 'protect': {
      if (!ward || ward.struck) {
        return { done: true, won: false, title: 'Convoy Lost',
          text: 'The ' + (ward ? ward.name : 'convoy') + ' is taken. You may as well not come home.' };
      }
      if (!hostiles.length) {
        return { done: true, won: true, title: 'Convoy Safe',
          text: 'Both privateers are beaten off. The ' + ward.name + ' swims, and so do you.' };
      }
      if (obj.turnLimit && turn > obj.turnLimit) {
        return { done: true, won: true, title: 'Convoy Safe',
          text: 'The anchorage guns open up over your masthead. The privateers haul their wind.' };
      }
      return null;
    }
    case 'survive': {
      if (obj.turnLimit && turn > obj.turnLimit) {
        return { done: true, won: true, title: 'Weathered It', text: 'You have held on long enough.' };
      }
      return null;
    }
    default: { // duel
      if (!hostiles.length) {
        return { done: true, won: true, title: 'Prize Taken',
          text: 'She strikes her colours. The prize court will pay well for this morning’s work.' };
      }
      const far = hostiles.every(h => dist(you, h) >= (obj.breakOffDist || 9));
      if (far) {
        return { done: true, won: false, draw: true, title: 'Action Broken Off',
          text: 'The ships part beyond gunshot. No prize today — but you live to hunt another day.' };
      }
      return null;
    }
  }
}

// A ship gives up when she is beaten, not only when she sinks.
export function checkStrike(s, ctx) {
  if (s.struck) return false;
  if (s.hull <= 0) { s.struck = true; return true; }
  if (s.crew <= 2) { s.struck = true; return true; }
  if (s.isYou) return false;
  const hullF = s.hull / s.hullMax, crewF = s.crew / s.crewMax, rigF = s.rigging / s.rigMax;
  const beaten = hullF <= 0.25 || crewF <= 0.25 || (rigF <= 0.15 && hullF <= 0.6);
  if (beaten && chance(0.5)) { s.struck = true; return true; }
  return false;
}
