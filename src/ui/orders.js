import { dist } from '../core/hex.js';
import { ATT_NAMES, attOf } from '../core/wind.js';
import { isLoaded, mountsOf, shortHanded, simFacing, speedOf } from '../core/ship.js';
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
    document.getElementById('ordersNormal').style.display = grappled ? 'none' : 'flex';
    document.getElementById('ordersBoarding').style.display = grappled ? 'flex' : 'none';

    // Helm: a stiff ship cannot put her helm hard over.
    for (const b of document.getElementById('segHelm').querySelectorAll('button')) {
      b.disabled = Math.abs(parseInt(b.dataset.v, 10)) > you.turnMax;
    }
    if (Math.abs(orders.helm) > you.turnMax) game.setOrder('helm', String(Math.sign(orders.helm) * you.turnMax));

    // Ground tackle: you can only let go where the lead finds bottom, and only
    // weigh what is already down.
    const canAnchor = you.anchor === 'up' && !you.grounded && ctx.board.anchorable(you.q, you.r);
    const canWeigh = you.anchor === 'down' && !you.grounded;
    document.getElementById('anchorBtn').disabled = !canAnchor;
    document.getElementById('weighBtn').disabled = !canWeigh;
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
    updateHint(ctx, nearest);
  }

  function updateHint(ctx, nearest) {
    if (ctx.over) return;
    const you = ctx.you;
    const orders = game.getOrders();
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
      : you.anchor === 'weighing' ? ' · weighing' : '';
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
