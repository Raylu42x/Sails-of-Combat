import { createEmitter } from './events.js';
import { dist, unitPos } from './hex.js';
import { setSeed, chance } from './rng.js';
import { createBoard } from './board.js';
import { applyHelm, createShip, crewFrac, madeFast, mountsOf } from './ship.js';
import { attOf, maybeShift, windLabel } from './wind.js';
import { moveShips } from './movement.js';
import { applyFireResult, boardingRound, fireAll, startBoarding, tryGrapple } from './combat.js';
import { aiOrders, aiWantsGrapple } from './ai.js';
import { checkStrike, evaluate, prizeInReach } from './objectives.js';
import { mapById } from '../data/maps.js';
import { scenarioById } from '../data/scenarios.js';

// The game owns the rules and the clock. It never touches the DOM: it emits
// events for the UI and calls a `view` adapter for anything that takes time.
export function createGame(view) {
  const bus = createEmitter();
  const orders = { helm: 0, helmSet: true, sails: 'battle', shot: 'round', grapple: 'no', melee: 'press', cable: 'stand' };
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
      turn: 1, over: false, busy: false, log, prizes: [], afterTurns: 0,
      you: ships.find(s => s.isYou),
    };
    Object.assign(orders, { helm: 0, sails: 'battle', shot: 'round', grapple: 'no', melee: 'press', cable: 'stand' });
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
    if (key === 'helm') orders.helmSet = true;
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

  // Letting go is quick; weighing costs the turn. Neither can be done aground.
  function handleCable(s, cmd) {
    if (s.grounded || s.grappledTo) return;
    if (cmd === 'letgo' && s.anchor === 'up') {
      if (!ctx.board.anchorable(s.q, s.r)) {
        log('No bottom here — the lead finds no ground for an anchor.', 'you');
        return;
      }
      s.anchor = 'down';
      log(s.name + ' lets go the best bower and brings up.', s.isYou ? 'you' : 'foe');
    } else if (cmd === 'weigh' && s.anchor === 'down') {
      s.anchor = 'weighing';
      log('Hands to the capstan — the anchor is coming home. She lies still this turn.', 'you');
    }
  }

  // How far the helm will answer: hard over under way, and not at all with her
  // keel in the sand. A spring — a line from the cable to the quarter, hove on
  // by the capstan — swings a ship at anchor a long way round; that was the
  // whole point of rigging one, and it is how an anchored ship kept her
  // broadside on a moving enemy. Two points, same as a ship under way, but she
  // is warping herself round rather than steering.
  function helmLimit(s) {
    if (s.grounded) return 0;
    if (s.anchor !== 'up') return Math.min(2, s.turnMax);
    return s.turnMax;
  }

  // Fire is the one thing that actually destroyed ships of this period. It
  // spreads if it is not fought, it eats hull and hands while it burns, and if
  // it reaches the magazine there is nothing left to salvage — no prize, no
  // survivors, no second chance. Fighting it costs you the turn's gunnery.
  function burn(s) {
    if (!s.fire || s.struck) return;
    // The same gamble the player faces: a small fire with the enemy under your
    // guns is tempting to ignore for one more broadside. She takes that bet too,
    // and sometimes loses it.
    const fighting = s.isYou ? orders.shot === 'fireparty' : s.fire >= 2;
    const hands = crewFrac(s);
    if (fighting && chance(0.3 + 0.3 * hands)) {
      s.fire -= 1;
      log(s.fire > 0
        ? s.name + '’s people beat the fire back, but it is not out.'
        : 'The fire aboard ' + s.name + ' is drowned and out.',
        s.isYou ? 'you' : 'foe');
      return;
    }
    // Untended, or simply beyond them: it eats her.
    s.hull = Math.max(0, s.hull - 1);
    if (chance(0.5)) s.crew = Math.max(0, s.crew - 1);
    if (chance(fighting ? 0.15 : 0.45)) {
      s.fire += 1;
      log('The fire aboard ' + s.name + ' takes hold and spreads.', 'big');
    }
    if (s.fire >= 3 && chance(0.3)) {
      s.fire = 0;
      s.destroyed = true;
      s.struck = true;
      s.hull = 0;
      log(s.name + ' blows up — the fire has reached her magazine. Nothing is left of her.', 'big');
      bus.emit('exploded', s);
    }
  }

  // A beaten ship is worth nothing until she is manned, sailed into port and
  // adjudicated — that is where privateers were actually paid. Manning her costs
  // hands you may want later, and a battered hull fetches less, which is what
  // turns 'fire at her rigging, not her hull' into a money decision.
  function takePossession(s, ctx) {
    const prize = ctx.ships.find(o => o.struck && !o.destroyed && !o.taken &&
      o.side !== s.side && dist(s, o) <= 1);
    if (!prize) { log('There is no prize alongside to man.', 'you'); return false; }
    const party = Math.max(2, Math.round(prize.crewMax * 0.25));
    if (s.crew - party < 3) {
      log('You have not the hands to man her and still fight your own ship.', 'you');
      return false;
    }
    s.crew -= party;
    prize.taken = true;
    prize.side = s.side;
    const condition = prize.hull / prize.hullMax;
    prize.value = Math.round(100 * (0.35 + 0.65 * condition) *
      (0.6 + 0.4 * (prize.rigging / prize.rigMax)));
    ctx.prizes.push(prize);
    log('You put ' + party + ' hands aboard ' + prize.name + ' — she is your prize.', 'big');
    log(condition > 0.6
      ? prize.name + ' swims well: the court will pay handsomely for her.'
      : prize.name + ' is knocked about, and the court will price her accordingly.', 'you');
    bus.emit('prize', prize);
    return true;
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
      // How many turns she has spent in the same patch of sea under her own
      // orders. Riding at anchor or hard aground does not count as sulking.
      if (madeFast(s)) s.idleTurns = 0;
      else if (s.lastCell === s.q + ',' + s.r) s.idleTurns = (s.idleTurns || 0) + 1;
      else s.idleTurns = 0;
      s.lastCell = s.q + ',' + s.r;
      burn(s);
      if (s.anchor === 'weighing') {
        s.anchor = 'up';
        log(s.name + '’s anchor is catted — she is under way again.', s.isYou ? 'you' : 'foe');
      }
      if (s.grounded) {
        // Lay out a kedge, run the guns aft, and hope. Hands and slack canvas help.
        const odds = 0.15 + 0.3 * crewFrac(s) + (s.sails === 'takein' ? 0.2 : 0);
        if (chance(odds)) {
          s.grounded = false;
          log(s.name + ' warps off the shoal and floats free.', s.isYou ? 'you' : 'foe');
        } else if (s.isYou) {
          log('Still fast aground — she will not budge.', 'foe');
        }
      }
    }
    for (const s of ctx.ships) {
      if (checkStrike(s, ctx)) { log(s.name + ' strikes her colours!', 'big'); bus.emit('struck', s); }
    }
    const shift = maybeShift(ctx.wind, ctx.turn);
    ctx.windShifted = !!shift;
    if (shift) {
      ctx.wind.from = (ctx.wind.from + shift + 6) % 6;
      log('The wind ' + (shift === 1 ? 'veers' : 'backs') + ' — now from ' + ['N','NE','SE','S','SW','NW'][ctx.wind.from] + '.', 'big');
      for (const s of ctx.ships) s.inIrons = attOf(s.facing, ctx.wind.from) === 0;
    }
    // Once nothing is left to fight, the clock on securing a prize starts.
    const stillFighting = ctx.ships.some(o => !o.struck && o.side !== ctx.you.side);
    ctx.afterTurns = stillFighting ? 0 : (ctx.afterTurns || 0) + 1;
    ctx.turn += 1;
    log('— Turn ' + ctx.turn + ' —', 'turnhead');
    bus.emit('turn', ctx.turn);
  }

  function finish(verdict) {
    // What the prize court would pay you for, and what you burned instead.
    const took = ctx.prizes || [];
    const lost = ctx.ships.filter(o => o.destroyed && o.side !== ctx.you.side);
    const unmanned = ctx.ships.filter(o => o.struck && !o.taken && !o.destroyed &&
      o.side !== ctx.you.side);
    const notes = [];
    if (took.length) {
      notes.push('Prizes taken: ' + took.map(p2 => p2.name + ' (' + p2.value + ')').join(', ') + '.');
    }
    if (unmanned.length) {
      notes.push(unmanned.map(o => o.name).join(', ') +
        ' struck but was never manned — she is no prize of yours.');
    }
    if (lost.length) {
      notes.push(lost.map(o => o.name).join(', ') + ' blew up. Nothing to sell, and nobody to sell it.');
    }
    if (notes.length) verdict.text = verdict.text + '\n\n' + notes.join(' ');
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
      if (!ctx.boarding || ctx.boarding.a !== you || ctx.boarding.b !== foe) {
        ctx.boarding = startBoarding(you, foe);
      }
      // The enemy captain reads the fight: press home while winning, stand on
      // the defensive while losing, and only a beaten ship tries to cut free.
      const m = ctx.boarding.momentum;
      const foeAct = m <= -2 ? 'press' : m >= 2 ? 'hold' : (crewFrac(foe) < 0.4 ? 'hold' : 'boarders');
      const res = boardingRound(ctx.boarding, you, foe, orders.melee, foeAct, log);
      await view.melee(you, foe, res);
      if (res.parted) ctx.boarding = null;
      if (res.carried) {
        res.carried.struck = true;
        res.carried.grappledTo = null;
        (res.carried === foe ? you : foe).grappledTo = null;
        ctx.boarding = null;
        log(res.carried === foe
          ? 'Her quarterdeck is carried — the colours come down and the ship is yours!'
          : 'They have carried your quarterdeck. The Alacrity is taken.', 'big');
        bus.emit('struck', res.carried);
        // A deck carried by boarding IS possession — the boarders standing on
        // her quarterdeck are the prize crew, their toll already paid in the
        // melee. Without this she struck but never counted as taken, and the
        // most complete capture in the game was the one that paid nothing.
        if (res.carried === foe) {
          foe.taken = true;
          foe.side = you.side;
          const condition = foe.hull / foe.hullMax;
          foe.value = Math.round(100 * (0.35 + 0.65 * condition) *
            (0.6 + 0.4 * (foe.rigging / foe.rigMax)));
          ctx.prizes.push(foe);
          log(condition > 0.6
            ? foe.name + ' swims well: the court will pay handsomely for her.'
            : foe.name + ' is knocked about, and the court will price her accordingly.', 'you');
          bus.emit('prize', foe);
        }
      }
      for (const s of [you, foe]) if (checkStrike(s, ctx)) { log(s.name + ' strikes her colours!', 'big'); bus.emit('struck', s); }
    } else {
      // Manning a prize is what you do *instead* of sailing this turn — you
      // heave to alongside her and send a boat. Resolved before anyone moves,
      // or you would have sailed away from her by the time it happened.
      you.heaveTo = false;
      if (orders.grapple === 'prize') you.heaveTo = takePossession(you, ctx);
      const shift = recenter();
      you.sails = orders.sails;
      for (const s of acting) s.sails = aiPlan.get(s.uid).sails;

      handleCable(you, orders.cable);
      const from = new Map(ctx.ships.map(s => [s.uid, { q: s.q, r: s.r }]));
      const lim = helmLimit(you);
      const helm = Math.max(-lim, Math.min(lim, orders.helm));
      if (madeFast(you) && helm !== 0 && !you.grounded) {
        log('A spring on the cable warps her round to bring the guns to bear.', 'you');
      }
      applyHelm(you, helm, ctx.wind, log);
      for (const s of acting) {
        const l = helmLimit(s);
        applyHelm(s, Math.max(-l, Math.min(l, aiPlan.get(s.uid).helm)), ctx.wind, log);
      }
      const paths = moveShips(ctx, log);
      await view.animateMoves(from, paths, shift);

      let hooked = orders.grapple === 'yes' ? tryGrapple(you, ctx, true, log) : null;
      for (const s of acting) if (aiWantsGrapple(s, ctx)) hooked = tryGrapple(s, ctx, false, log) || hooked;
      if (hooked) {
        // The fight for the deck runs from here until one side carries it.
        if (you.grappledTo) ctx.boarding = startBoarding(you, you.grappledTo);
        bus.emit('grappled', hooked);
      }

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
    // A new turn starts with a fresh helm. The default is to stay on course —
    // and when the wind has shifted there is no default at all: the UI holds
    // Make It So until the captain gives her a course.
    orders.helm = 0;
    orders.helmSet = false;
    await view.pause(400);
    const verdict = evaluate(ctx);
    // Clear busy BEFORE the final change: that change is what repaints the
    // chart, and the renderer draws the track, arcs and range overlays only
    // when the turn is idle. Emitting it while busy left the chart bare until
    // the first tap of the next turn.
    ctx.busy = false;
    bus.emit('change', ctx);
    bus.emit('busy', false);
    if (verdict) finish(verdict);
  }

  // The fighting is done but the business may not be: a beaten ship alongside is
  // worth nothing until she is manned. The player says when to break off.
  const fightOver = () => ctx && !ctx.over &&
    !ctx.ships.some(o => !o.struck && o.side !== ctx.you.side) && !ctx.you.struck;
  const prizeWaiting = () => (ctx && !ctx.over ? prizeInReach(ctx) : null);
  function endAction() {
    if (!ctx || ctx.over) return;
    ctx.ended = true;
    const v = evaluate(ctx) || { done: true, won: true, title: 'Action Ended',
      text: 'You haul off and leave her to the sea.' };
    bus.emit('change', ctx);
    finish(v);
  }

  return { fightOver, prizeWaiting, endAction, on: bus.on.bind(bus), emit: bus.emit.bind(bus), start, state, setOrder, getOrders, execute, visibleTo, log };
}
