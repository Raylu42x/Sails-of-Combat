// Boarding is hard to reach by chance in a live game, so drive it directly:
// lash two ships together and fight for the deck until someone carries it.
//   node tests/boarding.mjs
import { createGame } from '../src/core/game.js';
import { setSeed } from '../src/core/rng.js';

const noopView = {
  pause: async () => {}, animateMoves: async () => {},
  animateShot: async (r, apply, log) => apply(r, log), melee: async () => {},
};

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error('FAIL ' + msg); failures++; } };

let carried = 0, parted = 0, longest = 0;

for (let seed = 1; seed <= 40; seed++) {
  const game = createGame(noopView);
  let verdict = null;
  game.on('finished', v => { verdict = v; });
  game.start('duel', seed);
  const ctx = game.state();
  const you = ctx.you, foe = ctx.ships[1];

  // Bring them alongside and hold them there: anchored ships do not sail off.
  foe.q = you.q; foe.r = you.r - 1; foe.facing = 3;
  you.anchor = 'down'; foe.anchor = 'down';
  game.setOrder('grapple', 'yes');
  game.setOrder('shot', 'hold');

  let guard = 0;
  while (!you.grappledTo && guard++ < 12 && !verdict) await game.execute();
  check(you.grappledTo, 'seed ' + seed + ': never grappled from alongside');
  if (!you.grappledTo) continue;

  const startCrew = you.crew + foe.crew;
  let rounds = 0;
  while (you.grappledTo && !verdict && rounds++ < 25) {
    game.setOrder('melee', seed % 4 === 0 && rounds > 3 ? 'back' : rounds < 3 ? 'boarders' : 'press');
    await game.execute();
  }
  longest = Math.max(longest, rounds);
  check(rounds < 25, 'seed ' + seed + ': boarding never resolved');
  check(you.crew + foe.crew < startCrew, 'seed ' + seed + ': a boarding action with no casualties');
  if (you.struck || foe.struck) carried++;
  else if (!you.grappledTo) parted++;
}

console.log('decks carried: ' + carried + ' · broken off: ' + parted + ' · longest fight: ' + longest + ' rounds');
console.log(failures ? failures + ' failure(s)' : 'boarding resolves every time');
process.exit(failures ? 1 : 0);
