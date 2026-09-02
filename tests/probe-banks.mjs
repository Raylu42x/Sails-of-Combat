// Repro for #22: does the enemy actually work her way round the banks, or park?
import { createGame } from '../src/core/game.js';
const view = { pause: async()=>{}, animateMoves: async()=>{}, animateShot: async (r,a,l)=>a(r,l), melee: async()=>{} };

let stuck = 0;
for (const seed of [11, 22, 33]) {
  const g = createGame(view);
  const ctx = g.start('banks', seed);
  const foe = ctx.ships.find(s => !s.isYou);
  const seen = new Set();
  const track = [];
  for (let i = 0; i < 12; i++) {
    g.setOrder('helm', '0'); g.setOrder('sails', 'battle'); g.setOrder('shot', 'hold');
    await g.execute();
    seen.add(foe.q + ',' + foe.r);
    track.push(foe.q + ',' + foe.r);
    if (ctx.over) break;
  }
  const camping = seen.size <= 4;
  if (camping) stuck++;
  console.log('seed ' + seed + ': ' + seen.size + ' unique cells  ' +
    (camping ? '← CAMPING' : 'working') + '\n   ' + track.join(' → '));
}
console.log(stuck ? '\n' + stuck + ' of 3 seeds camp' : '\nshe works the board on every seed');
process.exit(stuck > 1 ? 1 : 0);
