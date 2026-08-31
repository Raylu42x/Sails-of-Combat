import { createEmitter } from './events.js';
import { dist, unitPos } from './hex.js';
import { setSeed, chance } from './rng.js';
import { createBoard } from './board.js';
import { applyHelm, createShip, crewFrac, mountsOf } from './ship.js';
import { attOf, maybeShift, windLabel } from './wind.js';
import { moveShips } from './movement.js';
import { applyFireResult, fireAll, meleeRound, tryGrapple } from './combat.js';
import { aiOrders, aiWantsGrapple } from './ai.js';
import { checkStrike, evaluate } from './objectives.js';
import { mapById } from '../data/maps.js';
import { scenarioById } from '../data/scenarios.js';

// The game owns the rules and the clock. It never touches the DOM: it emits
// events for the UI and calls a `view` adapter for anything that takes time.
export function createGame(view) {
  const bus = createEmitter();
  const orders = { helm: 0, sails: 'battle', shot: 'round', grapple: 'no', melee: 'press' };
  const log = (msg, cls) => bus.emit('log', { msg, cls });

  let ctx = null;

  function start(scenarioId, seed) {
    setSeed(seed === undefined ? null : seed);
    const scenario = scenarioById(scenarioId);
    const map = mapById(scenario.map);
    const wind = Object.assign({ from: 0, speed: 2, shiftEvery: 3 }, map.wind);
    const ships = scenario.ships.map(createShip);
    ctx = {
      scenario, map, wind, ships, board: createBoard(map),
      turn: 1, over: false, busy: false, log,
      you: ships.find(s => s.isYou),
    };
    Object.assign(orders, { helm: 0, sails: 'battle', shot: 'round', grapple: 'no', melee: 'press' });
    bus.emit('reset', ctx);
    log(scenario.name + ' — ' + map.name + '. ' + windLabel(wind) + '.', 'turnhead');
    log('Set your orders, Captain, then MAKE IT SO.');
    bus.emit('change', ctx);
    return ctx;
  }

  // --- helpers the UI also wants ------------------------------------------
  const state = () => ctx;
  const setOrder = (key, value) => {
    orders[key] = key === 'helm' ? parseInt(value, 10) : value;
    bus.emit('change', ctx);
  };
  const getOrders = () => orders;

  const visibleTo = (a, b) => !ctx.board.sightBlocked(a, b);

  // Keep the fight centred on open-ocean charts by sliding every ship at once.
  function recenter() {
    if (!ctx.board.scrolls) return null;
    const you = ctx.you;
    const foe = ctx.ships.filter(s => !s.struck && s !== you)
      .sort((a, b) => dist(you, a) - dist(you, b))[0];
    if (!foe) return null;
    const mid = { q: Math.round((you.q + foe.q) / 2), r: Math.round((you.r + foe.r) / 2) };
    const centre = { q: Math.floor(ctx.map.cols / 2), r: Math.floor(ctx.map.rows / 5) };
    const dq = centre.q - mid.q, dr = centre.r - mid.r;
    if (!dq && !dr) return null;
    const moved = ctx.ships.filter(s => !s.struck);
    if (moved.some(s => !ctx.board.inBounds(s.q + dq, s.r + dr))) return null;
    for (const s of moved) { s.q += dq; s.r += dr; }
    const u = unitPos(dq, dr), u0 = unitPos(0, 0);
    return { dq, dr, x: u.x - u0.x, y: u.y - u0.y };
  }

  function endOfTurn() {
    for (const s of ctx.ships) {
      if (s.struck) continue;
      if (s.sails === 'takein' && s.rigging < s.rigMax && chance(0.35 + 0.55 * crewFrac(s))) {
        s.rigging += 1;
        log(s.name + '’s topmen knot and splice — rigging repaired.', s.isYou ? 'you' : 'foe');
      }
      for (const [id, mount] of mountsOf(s)) {
        const g = s.guns[id];
        if (g.reload > 0) {
          g.reload -= 1;
          if (g.reload === 0 && s.isYou) {
            log('Your ' + (mount.label || id) + ' is loaded with ' + g.shot + ' and run out.', 'you');
          }
        }
      }
      if (s.rudderJam > 0) s.rudderJam -= 1;
    }
    for (const s of ctx.ships) {
      if (checkStrike(s, ctx)) { log(s.name + ' strikes her colours!', 'big'); bus.emit('struck', s); }
    }
    const shift = maybeShift(ctx.wind, ctx.turn);
    if (shift) {
      ctx.wind.from = (ctx.wind.from + shift + 6) % 6;
      log('The wind ' + (shift === 1 ? 'veers' : 'backs') + ' — now from ' + ['N','NE','SE','S','SW','NW'][ctx.wind.from] + '.', 'big');
      for (const s of ctx.ships) s.inIrons = attOf(s.facing, ctx.wind.from) === 0;
    }
    ctx.turn += 1;
    log('— Turn ' + ctx.turn + ' —', 'turnhead');
    bus.emit('turn', ctx.turn);
  }

  function finish(verdict) {
    ctx.over = true;
    bus.emit('finished', verdict);
  }

  async function execute() {
    if (!ctx || ctx.over || ctx.busy) return;
    ctx.busy = true;
    bus.emit('busy', true);

    const you = ctx.you;
    const acting = ctx.ships.filter(s => !s.struck && !s.isYou);
    const aiPlan = new Map(acting.map(s => [s.uid, aiOrders(s, ctx)]));

    if (you.grappledTo) {
      const foe = you.grappledTo;
      const res = meleeRound(you, foe, orders.melee, log);
      await view.melee(you, foe, res);
      for (const s of [you, foe]) if (checkStrike(s, ctx)) { log(s.name + ' strikes her colours!', 'big'); bus.emit('struck', s); }
    } else {
      const shift = recenter();
      you.sails = orders.sails;
      for (const s of acting) s.sails = aiPlan.get(s.uid).sails;

      const from = new Map(ctx.ships.map(s => [s.uid, { q: s.q, r: s.r }]));
      applyHelm(you, orders.helm, ctx.wind, log);
      for (const s of acting) applyHelm(s, aiPlan.get(s.uid).helm, ctx.wind, log);
      const paths = moveShips(ctx, log);
      await view.animateMoves(from, paths, shift);

      let hooked = orders.grapple === 'yes' ? tryGrapple(you, ctx, true, log) : null;
      for (const s of acting) if (aiWantsGrapple(s, ctx)) hooked = tryGrapple(s, ctx, false, log) || hooked;
      if (hooked) bus.emit('grappled', hooked);

      const results = [];
      fireAll(you, ctx, orders.shot, results);
      for (const s of acting) fireAll(s, ctx, aiPlan.get(s.uid).shot, results);
      for (const r of results) {
        await view.animateShot(r, applyFireResult, log);
        if (r.t && checkStrike(r.t, ctx)) { log(r.t.name + ' strikes her colours!', 'big'); bus.emit('struck', r.t); }
        bus.emit('change', ctx);
      }
    }

    endOfTurn();
    await view.pause(400);
    const verdict = evaluate(ctx);
    bus.emit('change', ctx);
    ctx.busy = false;
    bus.emit('busy', false);
    if (verdict) finish(verdict);
  }

  return { on: bus.on.bind(bus), emit: bus.emit.bind(bus), start, state, setOrder, getOrders, execute, visibleTo, log };
}
