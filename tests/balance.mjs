// Balance harness: play every scenario many times with a competent captain and
// print how often it is won. Tuning by feel is how Convoy Duty ended up
// unwinnable; this is the cheap way to notice.
//   node tests/balance.mjs [runs-per-scenario]
import { createGame } from '../src/core/game.js';
import { SCENARIOS } from '../src/data/scenarios.js';
import { aiOrders } from '../src/core/ai.js';
import { dist } from '../src/core/hex.js';

const RUNS = Number(process.argv[2]) || 60;
const noopView = {
  pause: async () => {}, animateMoves: async () => {},
  animateShot: async (r, apply, log) => apply(r, log), melee: async () => {},
};

// The stand-in captain is the enemy AI pointed the other way: run when the
// objective is to get clear, otherwise go for whatever is trying to kill you.
// (Escorting by hovering near the charge scores far worse than putting the
// privateer under fire, which is what a human does too.)
function playerMood(scenario) {
  return scenario.objective.type === 'escape' ? 'flee' : 'engage';
}

const rows = [];
for (const sc of SCENARIOS) {
  let won = 0, lost = 0, draw = 0, turns = 0;
  for (let seed = 1; seed <= RUNS; seed++) {
    const game = createGame(noopView);
    let verdict = null;
    game.on('finished', v => { verdict = v; });
    game.start(sc.id, seed);
    const ctx = game.state();
    ctx.you.ai = playerMood(sc);
    let guard = 0;
    while (!verdict && guard++ < 60) {
      const you = ctx.you;
      if (you.grappledTo) {
        const m = ctx.boarding ? ctx.boarding.momentum : 0;
        game.setOrder('melee', m < -1 ? 'hold' : 'press');
      } else {
        const plan = aiOrders(you, ctx);
        game.setOrder('helm', String(plan.helm));
        game.setOrder('sails', plan.sails);
        game.setOrder('shot', plan.shot);
        const foe = ctx.ships.filter(s => !s.struck && s.side !== you.side)
          .sort((a, b) => dist(you, a) - dist(you, b))[0];
        const worthBoarding = foe && dist(you, foe) === 1 && you.crew > foe.crew * 1.15;
        game.setOrder('grapple', worthBoarding ? 'yes' : 'no');
      }
      await game.execute();
    }
    turns += ctx.turn;
    if (!verdict) draw++;
    else if (verdict.won) won++;
    else if (verdict.draw) draw++;
    else lost++;
  }
  rows.push({ id: sc.id, won, lost, draw, avg: (turns / RUNS).toFixed(1) });
}

console.log('scenario   win%   loss%  draw%  avg turns   (' + RUNS + ' runs each)');
for (const r of rows) {
  const pc = n => String(Math.round(100 * n / RUNS)).padStart(4);
  console.log(r.id.padEnd(10) + pc(r.won) + '   ' + pc(r.lost) + '   ' + pc(r.draw) + '     ' + r.avg);
}
const bad = rows.filter(r => r.won === 0 || r.won === RUNS);
if (bad.length) {
  console.log('\nAlways the same result, which usually means broken rather than hard: ' +
    bad.map(r => r.id).join(', '));
}
