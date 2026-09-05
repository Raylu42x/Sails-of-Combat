import { dist } from './hex.js';
import { chance } from './rng.js';

// Verdicts: { done, won, title, text } — or null while the fight goes on.
// Adding a level type means adding a case here.
const alive = (ships, pred) => ships.filter(s => !s.struck && pred(s));

// The strike is not the end of the business — securing her is. While a beaten
// ship still floats within reach and you have hands enough to man her, the
// action stays open so you can lay alongside and take possession. The player
// ends it with the End action button when they are done, or by sailing away.
// She must be near enough to reach when the fighting ends, and you get a few
// turns to lay alongside her — not the rest of the night. Terrain charts made
// the old 4-and-3 cruel: a hulk two banks away was unreachable before the
// window shut, and one five hexes off closed the action with no window at all.
const PRIZE_REACH = 6;
const PRIZE_WINDOW = 5;
export function prizeInReach(ctx) {
  const you = ctx.you;
  if (!you || you.struck || ctx.ended) return null;
  if ((ctx.afterTurns || 0) > PRIZE_WINDOW) return null;
  return ctx.ships.find(o => o.struck && !o.destroyed && !o.taken && !o.offBoard &&
    o.side !== you.side && dist(you, o) <= PRIZE_REACH) || null;
}

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
        if (prizeInReach(ctx)) return null;   // she has struck; go and take her
        const taken = quarry && quarry.taken;
        return { done: true, won: taken, title: taken ? 'Prize Taken' : 'She Struck, and Drifted',
          text: taken
            ? 'The ' + quarry.name + ' is yours, and the despatches with her.'
            : 'The ' + (quarry ? quarry.name : 'quarry') + ' struck — but you never put a man aboard her, ' +
              'and the despatches are still in her cabin as she drifts away in the dark.' };
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
        if (prizeInReach(ctx)) return null;
        return { done: true, won: true, title: 'Convoy Safe',
          text: 'The privateer is beaten off. The ' + ward.name + ' swims, and so do you.' };
      }
      if (obj.turnLimit && turn > obj.turnLimit) {
        return { done: true, won: true, title: 'Convoy Safe',
          text: 'The anchorage guns open up over your masthead. The privateer hauls his wind.' };
      }
      return null;
    }
    case 'capture': {
      const prize = ships.find(s => s.role === 'prize');
      if (prize && prize.struck) {
        if (prizeInReach(ctx)) return null;   // she has struck; go and take her
        const taken = prize.taken;
        return { done: true, won: taken, title: taken ? 'Cut Out' : 'She Struck, and Drifted',
          text: taken
            ? 'The ' + prize.name + ' is yours. Cut her cable, set the topsails, and take her out under the guns of the shore.'
            : 'The ' + prize.name + ' struck — but you never put a man aboard her, and she is no prize of yours.' };
      }
      if (obj.turnLimit && turn > obj.turnLimit) {
        return { done: true, won: false, title: 'The Alarm Is Given',
          text: 'Lights along the shore and drums beating to quarters. Whatever was worth cutting out is worth nothing now.' };
      }
      return null;
    }
    case 'escape': {
      const clear = hostiles.every(h => dist(you, h) >= (obj.escapeDist || 7));
      if (clear && hostiles.length) {
        return { done: true, won: true, title: 'Clear Away',
          text: 'The gunfire falls astern. You have your ship, your people, and the weather gage of a bad morning.' };
      }
      if (!hostiles.length) {
        return { done: true, won: true, title: 'Beat Them Off',
          text: 'Against every reasonable expectation, you have beaten them off outright.' };
      }
      if (obj.turnLimit && turn > obj.turnLimit) {
        return { done: true, won: true, title: 'Nightfall',
          text: 'Darkness comes down and hides you. They will not find you again tonight.' };
      }
      return null;
    }
    // A sailing school: no enemy, only marks to fetch. Teaching the helm, the
    // points of sail and the fact that you cannot sail into the eye of the wind
    // needs a level where being wrong costs a turn instead of the ship.
    case 'marks': {
      const left = (ctx.marksLeft || []).length;
      if (!left) {
        return { done: true, won: true, title: 'Well Sailed',
          text: 'Every mark fetched. You have the handling of her now — ' +
            'which is most of the fighting, and all of the getting away.' };
      }
      if (obj.turnLimit && turn > obj.turnLimit) {
        return { done: true, won: false, title: 'Time Up',
          text: left + ' mark' + (left === 1 ? '' : 's') + ' still to fetch. ' +
            'Watch the wind: she will not sail into the eye of it, and a reach is ' +
            'faster than running dead before it.' };
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
        if (prizeInReach(ctx)) return null;   // there is a prize to secure yet
        return { done: true, won: true, title: 'Action Won',
          text: 'She strikes her colours, and the sea is yours.' };
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
  if (s.crew <= 0) { s.struck = true; return true; } // not a soul left to fight her
  if (s.isYou) return false;
  const hullF = s.hull / s.hullMax, crewF = s.crew / s.crewMax, rigF = s.rigging / s.rigMax;
  const beaten = hullF <= 0.25 || crewF <= 0.25 || (rigF <= 0.15 && hullF <= 0.6);
  if (beaten && chance(0.5)) { s.struck = true; return true; }
  // A ship that cannot run, with an enemy standing off at close range, strikes
  // rather than be raked to pieces where she lies. Most fights of the period
  // ended exactly here — dismasted, aground, or pinned, with a sound hull and
  // no way out. Without this a crippled ship drifts on, technically unbeaten,
  // and a chase can be won on the water and lost on the clock.
  const helpless = s.rigging <= 0 || s.grounded;
  if (helpless) {
    const near = ctx.ships
      .filter(o => !o.struck && o.side !== s.side)
      .reduce((best, o) => Math.min(best, dist(s, o)), 99);
    if (near <= 2 && chance(0.55)) { s.struck = true; return true; }
  }
  return false;
}
