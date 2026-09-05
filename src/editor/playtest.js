// Testing a level by playing it. The rules run without a screen — that is what
// the headless harnesses rely on — so the editor can play the level you have
// just drawn, sixty times, and tell you whether it is any good before anyone
// commits it. This is the part of the job no one can do by eye: The Long Chase
// looked fine for weeks and could not be won.
import { createGame } from '../core/game.js';
import { OBJECTIVES, inBounds, islandAt } from './model.js';

// Things that make a level impossible rather than hard, checked as you draw.
export function validate(level) {
  const out = [];
  const you = level.ships.filter(s => s.role === 'player');
  if (!you.length) out.push('No player ship — place one.');
  if (you.length > 1) out.push('More than one player ship.');
  const needs = (OBJECTIVES[level.objective.type] || {}).needs;
  if (needs && !level.ships.some(s => s.role === needs)) {
    out.push(`A ${level.objective.type} level needs a ship with the ${needs} role.`);
  }
  if (!level.ships.some(s => s.side === 'hostile') && level.objective.type !== 'survive') {
    out.push('No hostile ships.');
  }
  const seen = new Set();
  for (const s of level.ships) {
    const k = s.q + ',' + s.r;
    if (seen.has(k)) out.push('Two ships on the same hex.');
    seen.add(k);
    if (!inBounds(level, s.q, s.r)) out.push(`${s.name} is off the chart.`);
    if (islandAt(level, s.q, s.r)) out.push(`${s.name} is standing on dry land.`);
  }
  if (!level.id.trim()) out.push('The level needs an id.');
  return out;
}

const HELM = ['-2', '-1', '0', '1', '2'];
const SHOT = ['round', 'chain', 'grape', 'double', 'hold'];
const SAILS = ['full', 'battle', 'takein'];

// One game, played by a captain who is not thinking very hard. That is the
// point: it measures the level, not the player.
async function playOnce(level, seed) {
  const view = {
    pause: async () => {},
    animateMoves: async () => {},
    animateShot: async () => {},
    melee: async () => {},
  };
  const game = createGame(view);
  let verdict = null;
  game.on('finished', v => { verdict = v; });
  const ctx = game.start(level, seed);
  let rand = seed;
  const rnd = () => { rand = (rand * 1103515245 + 12345) & 0x7fffffff; return rand / 0x7fffffff; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  let guard = 0;
  while (!verdict && guard++ < 80) {
    game.setOrder('helm', pick(HELM));
    game.setOrder('sails', pick(SAILS));
    game.setOrder('shot', pick(SHOT));
    game.setOrder('grapple', rnd() < 0.2 ? 'yes' : 'no');
    game.setOrder('melee', pick(['press', 'boarders', 'hold', 'back']));
    await game.execute();
  }
  return { verdict, turns: ctx.turn };
}

export async function playtest(level, runs = 60) {
  let won = 0, lost = 0, undecided = 0, turns = 0;
  const titles = new Map();
  for (let seed = 1; seed <= runs; seed++) {
    let r;
    try {
      r = await playOnce(level, seed);
    } catch (e) {
      return 'The level threw an error on seed ' + seed + ':\n\n' + e.message +
        '\n\nThat is a bug in the level, not in your drawing of it — most often a ship ' +
        'placed somewhere the rules cannot cope with.';
    }
    turns += r.turns;
    if (!r.verdict) { undecided++; continue; }
    titles.set(r.verdict.title, (titles.get(r.verdict.title) || 0) + 1);
    if (r.verdict.won) won++; else lost++;
    // Yield so the page keeps painting rather than locking up mid-run.
    if (seed % 10 === 0) await new Promise(res => setTimeout(res, 0));
  }
  const pct = n => Math.round(100 * n / runs);
  const lines = [
    `${runs} games, orders chosen at random — this measures the level, not the player.`,
    '',
    `  won        ${String(pct(won)).padStart(3)}%`,
    `  lost       ${String(pct(lost)).padStart(3)}%`,
    undecided ? `  undecided  ${String(pct(undecided)).padStart(3)}%   (ran out of turns with no verdict)` : null,
    `  average    ${(turns / runs).toFixed(1)} turns`,
    '',
    'How it ended:',
    ...[...titles.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `  ${String(n).padStart(3)} × ${t}`),
    '',
    verdictAdvice(pct(won), pct(undecided)),
  ].filter(l => l !== null);
  return lines.join('\n');
}

function verdictAdvice(win, undecided) {
  if (undecided > 20) {
    return 'A fifth of these never finished. Usually the two sides cannot reach each other —\n' +
      'check the wind, the sea room, and whether the turn limit is long enough to decide anything.';
  }
  if (win === 0) return 'Never won. Something is stopping it outright — the quarry may be faster than\nyou on every point of sail, or the goal may need a ship that cannot be reached.';
  if (win < 15) return 'Very hard. A thinking player will do better than this, but not four times better.';
  if (win > 85) return 'Nearly always won, even by a captain choosing orders at random. Worth more teeth.';
  return 'A reasonable spread. A player who is paying attention should do better than these numbers.';
}
