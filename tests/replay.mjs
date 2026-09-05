// A recorded fight must replay to the same world, or a replay is a story rather
// than a record. Also the guard on rng.js: the day something calls Math.random()
// inside the rules, this test is what notices.
//   node tests/replay.mjs
import { createGame } from '../src/core/game.js';
import { decodeReplay, runReplay } from '../src/core/replay.js';
import { SCENARIOS } from '../levels/index.js';

const view = { pause: async () => {}, animateMoves: async () => {}, animateShot: async () => {}, melee: async () => {} };
const HELM = ['-2', '-1', '0', '1', '2'];
const SHOT = ['round', 'chain', 'grape', 'double', 'hold'];
const SAILS = ['full', 'battle', 'takein'];

const snapshot = ctx => JSON.stringify({
  turn: ctx.turn, over: ctx.over,
  ships: ctx.ships.map(s => [s.name, s.q, s.r, s.facing, s.hull, s.rigging, s.crew, s.struck, s.taken]),
});

let failures = 0;
for (const sc of SCENARIOS) {
  const g = createGame(view);
  g.start(sc.id);
  let rand = 7;
  const rnd = () => { rand = (rand * 1103515245 + 12345) & 0x7fffffff; return rand / 0x7fffffff; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  for (let i = 0; i < 12 && !g.state().over; i++) {
    g.setOrder('helm', pick(HELM));
    g.setOrder('sails', pick(SAILS));
    g.setOrder('shot', pick(SHOT));
    g.setOrder('grapple', rnd() < 0.25 ? 'yes' : 'no');
    await g.execute();
  }
  const original = snapshot(g.state());
  const text = g.replayString();

  const g2 = createGame(view);
  const replayed = snapshot(await runReplay(g2, decodeReplay(text)));

  if (original !== replayed) {
    console.error('FAIL ' + sc.id + ' — replay diverged');
    console.error('  recorded: ' + original.slice(0, 160));
    console.error('  replayed: ' + replayed.slice(0, 160));
    failures++;
  } else {
    console.log('✓ ' + sc.id.padEnd(9) + ' replays exactly (' + text.length + ' chars)');
  }
}
console.log(failures ? failures + ' replay(s) diverged' : 'every recorded fight replays to the same world');
process.exit(failures ? 1 : 0);
