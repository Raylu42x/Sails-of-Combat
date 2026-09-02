import { dist } from '../core/hex.js';
import { ATT_NAMES, attOf } from '../core/wind.js';
import { isLoaded, madeFast, mountsOf, shortHanded, simFacing, speedOf } from '../core/ship.js';
import { acceptsShot, drawTurns, grappleOdds, leeSide, momentumText, swivelsReady, wouldDraw } from '../core/combat.js';

const SHOT_TAG = { round: 'rnd', chain: 'chn', grape: 'grp', double: 'dbl' };
// A glyph per charge: a ball, two balls linked by a bar, a scatter of small
// shot, and two balls on one charge. They survive a narrow screen where three
// letters do not.
export const SHOT_ICON = { round: '●', chain: '∞', grape: '∴', double: '⦿' };

// Wires the order segments, keeps them honest about what this ship can do,
// and writes the one-line forecast under the chart.
export function createOrders(root, hintEl, game, onChange) {
  const segs = [
    ['segHelm', 'helm'], ['segSails', 'sails'], ['segShot', 'shot'],
    ['segGrap', 'grapple'], ['segMelee', 'melee'], ['segCable', 'cable'],
  ];

  for (const [id, key] of segs) {
    const seg = document.getElementById(id);
    if (!seg) continue;
    seg.addEventListener('pointerdown', ev => {
      const b = ev.target.closest('button');
      const ctx = game.state();
      if (!b || b.disabled || !ctx || ctx.busy) return;
      for (const x of seg.querySelectorAll('button')) x.classList.remove('on');
      b.classList.add('on');
      game.setOrder(key, b.dataset.v);
      onChange();
    });
  }

  function syncSegs(ctx) {
    const orders = game.getOrders();
    for (const [id, key] of segs) {
      const seg = document.getElementById(id);
      if (!seg) continue;
      const val = String(orders[key]);
      for (const b of seg.querySelectorAll('button')) b.classList.toggle('on', b.dataset.v === val);
    }
  }

  function refresh(ctx) {
    const you = ctx.you;
    const orders = game.getOrders();
    const grappled = !!you.grappledTo;
    paintMomentum(ctx);
    const normal = document.getElementById('ordersNormal');
    const boarding = document.getElementById('ordersBoarding');
    const area = document.getElementById('ordersArea');
    // Boarding swaps five order rows for one. Hold the block's height so the
    // buttons below it do not jump up the screen mid-action.
    if (!grappled && normal.offsetHeight) area.style.minHeight = normal.offsetHeight + 'px';
    normal.style.display = grappled ? 'none' : 'flex';
    boarding.style.display = grappled ? 'flex' : 'none';

    // Helm: a stiff ship cannot put her helm hard over.
    for (const b of document.getElementById('segHelm').querySelectorAll('button')) {
      b.disabled = Math.abs(parseInt(b.dataset.v, 10)) > you.turnMax;
    }
    if (Math.abs(orders.helm) > you.turnMax) game.setOrder('helm', String(Math.sign(orders.helm) * you.turnMax));

    // Ground tackle. On open-ocean charts there is no bottom anywhere, so the
    // row is hidden entirely rather than sitting there greyed out.
    const soundings = (ctx.map.water || []).length > 0;
    // On a chart with no bottom anywhere the row is gone entirely rather than
    // sitting there as an empty gap. The controls below it do not move when it
    // goes, because the log above takes up the slack.
    document.getElementById('cableRow').hidden = !soundings;
    const overGround = ctx.board.anchorable(you.q, you.r);
    const canAnchor = you.anchor === 'up' && !you.grounded && overGround;
    const canWeigh = you.anchor === 'down' && !you.grounded;
    const anchorBtn = document.getElementById('anchorBtn');
    const weighBtn = document.getElementById('weighBtn');
    anchorBtn.disabled = !canAnchor;
    weighBtn.disabled = !canWeigh;
    anchorBtn.title = you.grounded ? 'She is already fast aground'
      : you.anchor !== 'up' ? 'The anchor is already down'
      : overGround ? 'Let go the best bower here — the lead finds bottom'
      : 'No bottom here. Anchor over the tinted hexes, where there is holding ground.';
    weighBtn.title = canWeigh ? 'Weigh the anchor — it costs this turn'
      : 'Nothing to weigh: the anchor is up';
    if ((orders.cable === 'letgo' && !canAnchor) || (orders.cable === 'weigh' && !canWeigh)) {
      game.setOrder('cable', 'stand');
    }

    const enemies = ctx.ships.filter(s => !s.struck && s.side !== you.side);
    const nearest = enemies.sort((a, b) => dist(you, a) - dist(you, b))[0];
    const far = !nearest || dist(you, nearest) > 2;
    const grapBtn = document.getElementById('grapBtn');
    grapBtn.disabled = far;
    // The hooks are a gamble with knowable odds: she sheers off with way on
    // her, and cannot when she is crippled. Say so, so the loop is learnable.
    if (!far && nearest) {
      const odds = grappleOdds(you, nearest, ctx);
      grapBtn.title = odds.slow
        ? nearest.name + ' is crippled and cannot sheer off — the hooks will very likely bite (' +
          Math.round(odds.p * 100) + '%)'
        : nearest.name + ' still has way on her — the hooks will likely miss (' +
          Math.round(odds.p * 100) + '%). Cripple her rigging first.';
    } else {
      grapBtn.title = 'She is beyond the throw of a hook';
    }
    // A ship that has struck is a prize, but only if you put people aboard her.
    const prizeBtn = document.getElementById('prizeBtn');
    const beaten = ctx.ships.find(o => o.struck && !o.destroyed && !o.taken &&
      o.side !== you.side && dist(you, o) <= 1);
    prizeBtn.style.display = beaten ? '' : 'none';
    prizeBtn.disabled = !beaten;
    if (beaten) prizeBtn.title = 'Put a prize crew aboard ' + beaten.name +
      ' — she is worth nothing until she is manned and sailed in';
    if (!beaten && orders.grapple === 'prize') game.setOrder('grapple', 'no');
    if (far && orders.grapple === 'yes') game.setOrder('grapple', 'no');

    // Guns can always be *ordered* to load a type; full sail is what silences them.
    for (const b of document.getElementById('segShot').querySelectorAll('button')) {
      if (b.dataset.v === 'fireparty') {
        // Only offered when there is something to fight.
        b.disabled = !you.fire;
        b.style.display = you.fire ? '' : 'none';
        continue;
      }
      b.disabled = b.dataset.v !== 'hold' && orders.sails === 'full';
    }
    if (!you.fire && orders.shot === 'fireparty') game.setOrder('shot', 'round');
    syncSegs(ctx);

    // No silent course. After a wind shift the helm has no default at all, and
    // the default may never carry her quietly into irons — either way the turn
    // waits until the captain gives her a course (straight ahead counts, but
    // it must be chosen). A jammed rudder or a ship made fast has no helm to give.
    const canSteer = !grappled && !madeFast(you) && !(you.rudderJam > 0);
    const intoIrons = attOf(simFacing(you, orders.helm), ctx.wind.from) === 0;
    const needsHelm = canSteer && !orders.helmSet && (ctx.windShifted || intoIrons);
    const helmSeg = document.getElementById('segHelm');
    helmSeg.parentElement.classList.toggle('warn', needsHelm);
    if (needsHelm) for (const b of helmSeg.querySelectorAll('button')) b.classList.remove('on');
    const execBtn = document.getElementById('exec');
    if (execBtn) execBtn.disabled = !!ctx.busy || !!ctx.over || needsHelm;
    updateHint(ctx, nearest, needsHelm);
  }

  // Seven ticks with the middle one neutral: three her way, three yours, and
  // the ends are the goal line. Carrying the deck at ±3 stops being a surprise.
  function paintMomentum(ctx) {
    const bar = document.getElementById('momentum');
    if (!bar) return;
    const fight = ctx.boarding;
    const m = fight ? fight.momentum : 0;
    const ticks = [...bar.querySelectorAll('.m-tick')];
    ticks.forEach((t, i) => {
      const slot = i - 3;                       // -3 hers … 0 even … +3 yours
      const held = m > 0 ? (slot > 0 && slot <= m) : m < 0 ? (slot < 0 && slot >= m) : slot === 0;
      t.classList.toggle('on-you', held && m > 0);
      t.classList.toggle('on-foe', held && m < 0);
      t.classList.toggle('on-even', held && m === 0);
    });
    bar.classList.toggle('at-goal', Math.abs(m) >= 2);
    bar.title = fight ? momentumText(m) : 'the ships are lashed together';
  }

  function updateHint(ctx, nearest, needsHelm) {
    if (ctx.over) return;
    const you = ctx.you;
    const orders = game.getOrders();
    if (needsHelm) {
      hintEl.textContent = ctx.windShifted
        ? 'The wind has shifted — give her a course before the turn can run.'
        : 'She will be in irons — give her helm before the turn can run.';
      return;
    }
    if (you.grappledTo) {
      const f = ctx.boarding;
      const her = you.grappledTo;
      const swiv = [];
      if (swivelsReady(you)) swiv.push('your swivels loaded with grape');
      if (swivelsReady(her)) swiv.push('HER swivels loaded');
      hintEl.textContent = 'Boarding ' + her.name + ' — ' +
        (f ? momentumText(f.momentum) : 'the ships are lashed together') +
        ' · your ' + you.crew + ' hands to her ' + her.crew +
        (swiv.length ? ' · ' + swiv.join(', ') : '');
      return;
    }
    const att = attOf(simFacing(you, orders.helm), ctx.wind.from);
    const spd = att === 0 ? 0 : speedOf(you, att, orders.sails, ctx.wind);
    // Each battery shows what is in it: a tick and the charge when it is ready,
    // the turns remaining when it is not.
    // In a gale the lee ports are under water; that battery is marked, not counted.
    const lee = leeSide(you, ctx.wind);
    // What every battery is actually holding, and what it is about to do about
    // the order you have given. The shot row is a standing preference, not an
    // immediate command: a battery only draws a charge when it has a mark to
    // fire at, so one can load chain this turn while another waits, holding its
    // round shot until something comes into its arc. That stagger reads as a
    // fault unless the state is on screen.
    const drawing = new Set(wouldDraw(you, ctx, orders.shot).map(d => d.id));
    const batteries = mountsOf(you)
      .map(([id, m]) => {
        const held = you.guns[id].shot;
        const icon = SHOT_ICON[held] || held;
        if (lee && id === lee && !m.chaser) return m.tag + ' ~awash';
        if (!isLoaded(you, id)) return m.tag + ' ' + icon + ' ' + you.guns[id].reload;
        if (orders.shot === 'hold' || held === orders.shot) return m.tag + ' ' + icon + '✓';
        if (!acceptsShot(m, orders.shot)) return m.tag + ' ' + icon + '✓';
        if (drawing.has(id)) return m.tag + ' ' + icon + '→' + (SHOT_ICON[orders.shot] || '');
        return m.tag + ' ' + icon + ' waits';
      })
      .join(' · ');
    // Ordering a charge the guns are not holding costs a turn to draw — but
    // only for a battery that has something in reach to fire it at.
    const draws = wouldDraw(you, ctx, orders.shot);
    const willDraw = draws.map(d => d.tag);
    const drawCost = draws.reduce((n, d) => Math.max(n, drawTurns(you, d.mount, orders.shot)), 0);
    const gun = orders.sails === 'full' ? 'guns silent — full sail'
      : batteries + (orders.shot === 'hold' ? ' · held' : ' · ' + orders.shot) +
        (willDraw.length
          ? ' · drawing ' + willDraw.join('/') + ' (' + drawCost + ' turn' + (drawCost === 1 ? '' : 's') + ')'
          : '');
    const hands = ['', ' · short-handed', ' · skeleton crew'][shortHanded(you)];
    const ablaze = you.fire ? ' · ABLAZE' + (you.fire > 1 ? ' (' + you.fire + ')' : '') : '';
    const ground = you.grounded ? ' · AGROUND'
      : you.anchor === 'down' ? ' · at anchor'
      : you.anchor === 'weighing' ? ' · weighing'
      : ctx.board.anchorable(you.q, you.r) ? ' · holding ground'
      : '';
    const range = nearest
      ? ' · range ' + dist(you, nearest) + (game.visibleTo(you, nearest) ? '' : ' (lost from sight)')
      : '';
    const way = you.grounded ? 'Aground → 0 hexes'
      : you.anchor !== 'up' ? 'Riding at anchor → 0 hexes'
      : ATT_NAMES[att] + ' → ' + spd + ' hex' + (spd === 1 ? '' : 'es');
    hintEl.textContent = way + ground + ablaze + hands + range + ' · ' + gun;
  }

  return { refresh };
}
