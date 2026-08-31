import { dist } from '../core/hex.js';
import { ATT_NAMES, attOf } from '../core/wind.js';
import { isLoaded, madeFast, mountsOf, shortHanded, simFacing, speedOf } from '../core/ship.js';
import { acceptsShot, momentumText } from '../core/combat.js';

const SHOT_TAG = { round: 'rnd', chain: 'chn', grape: 'grp', double: 'dbl' };

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
    document.getElementById('cableRow').classList.toggle('reserved', !soundings);
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
    if (far && orders.grapple === 'yes') game.setOrder('grapple', 'no');

    // Guns can always be *ordered* to load a type; full sail is what silences them.
    for (const b of document.getElementById('segShot').querySelectorAll('button')) {
      b.disabled = b.dataset.v !== 'hold' && orders.sails === 'full';
    }
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
      hintEl.textContent = 'Boarding ' + you.grappledTo.name + ' — ' +
        (f ? momentumText(f.momentum) : 'the ships are lashed together') +
        ' · your ' + you.crew + ' hands to her ' + you.grappledTo.crew;
      return;
    }
    const att = attOf(simFacing(you, orders.helm), ctx.wind.from);
    const spd = att === 0 ? 0 : speedOf(you, att, orders.sails, ctx.wind);
    // Each battery shows what is in it: a tick and the charge when it is ready,
    // the turns remaining when it is not.
    const batteries = mountsOf(you)
      .map(([id, m]) => m.tag + ' ' +
        (isLoaded(you, id) ? '✓' + (SHOT_TAG[you.guns[id].shot] || you.guns[id].shot) : you.guns[id].reload))
      .join(' · ');
    // Ordering a charge the guns are not holding costs a reload to draw.
    const willDraw = orders.shot !== 'hold' && mountsOf(you)
      .filter(([id, m]) => isLoaded(you, id) && acceptsShot(m, orders.shot) && you.guns[id].shot !== orders.shot)
      .map(([, m]) => m.tag);
    const gun = orders.sails === 'full' ? 'guns silent — full sail'
      : batteries + (orders.shot === 'hold' ? ' · held' : ' · ' + orders.shot) +
        (willDraw && willDraw.length ? ' · drawing ' + willDraw.join('/') : '');
    const hands = ['', ' · short-handed', ' · skeleton crew'][shortHanded(you)];
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
    hintEl.textContent = way + ground + hands + range + ' · ' + gun;
  }

  return { refresh };
}
