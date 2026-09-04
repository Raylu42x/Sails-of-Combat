// Headless smoke test: play every scenario through with random orders and make
// sure the rules never throw and every fight reaches a verdict.
//   node tests/smoke.mjs
import { createGame } from '../src/core/game.js';
import { SCENARIOS } from '../levels/index.js';

const noopView = {
  pause: async () => {},
  animateMoves: async () => {},
  animateShot: async (r, apply, log) => apply(r, log),
  melee: async () => {},
};

const HELM = [-2, -1, 0, 1, 2];
const SHOT = ['round', 'chain', 'grape', 'double', 'hold'];
const SAILS = ['full', 'battle', 'takein'];
const pick = (a, rnd) => a[Math.floor(rnd() * a.length)];

let failures = 0;

for (const sc of SCENARIOS) {
  for (let seed = 1; seed <= 25; seed++) {
    const game = createGame(noopView);
    let verdict = null;
    game.on('finished', v => { verdict = v; });
    try {
      game.start(sc.id, seed);
      const rnd = () => { // a separate stream, so orders do not disturb the sim seed
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
      };
      let guard = 0;
      while (!verdict && guard++ < 120) {
        const ctx = game.state();
        game.setOrder('helm', String(pick(HELM, rnd)));
        game.setOrder('sails', pick(SAILS, rnd));
        game.setOrder('shot', pick(SHOT, rnd));
        game.setOrder('grapple', rnd() < 0.2 ? 'yes' : 'no');
        if (game.fightOver && game.fightOver() && rnd() < 0.5) game.endAction();
        game.setOrder('melee', pick(['press', 'boarders', 'hold', 'back'], rnd));
        await game.execute();
        if (ctx.turn > 200) break;
      }
      if (!verdict) {
        console.error('FAIL ' + sc.id + ' seed ' + seed + ': no verdict after ' + guard + ' turns');
        failures++;
      }
    } catch (e) {
      console.error('FAIL ' + sc.id + ' seed ' + seed + ': ' + e.message);
      console.error(e.stack.split('\n').slice(1, 4).join('\n'));
      failures++;
    }
  }
  console.log((failures ? '✗' : '✓') + ' ' + sc.id.padEnd(9) + ' 25 runs');
}

console.log(failures ? failures + ' failure(s)' : 'all scenarios reach a verdict');
process.exit(failures ? 1 : 0);
