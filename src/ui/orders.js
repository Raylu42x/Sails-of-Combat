import { dist } from '../core/hex.js';
import { ATT_NAMES, attOf } from '../core/wind.js';
import { anyLoaded, mountsOf, simFacing, speedOf } from '../core/ship.js';
import { MOUNT_LABEL, SHOT } from '../core/combat.js';

const MOUNT_TAG = { port: 'P', stbd: 'S', bow: 'Bow', stern: 'Stern' };

// Wires the order segments, keeps them honest about what this ship can do,
// and writes the one-line forecast under the chart.
export function createOrders(root, hintEl, game, onChange) {
  const segs = [
    ['segHelm', 'helm'], ['segSails', 'sails'], ['segShot', 'shot'],
    ['segGrap', 'grapple'], ['segMelee', 'melee'],
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

    const enemies = ctx.ships.filter(s => !s.struck && s.side !== you.side);
    const nearest = enemies.sort((a, b) => dist(you, a) - dist(you, b))[0];
    const far = !nearest || dist(you, nearest) > 2;
    const grapBtn = document.getElementById('grapBtn');
    grapBtn.disabled = far;
    if (far && orders.grapple === 'yes') game.setOrder('grapple', 'no');

    for (const b of document.getElementById('segShot').querySelectorAll('button')) {
      b.disabled = (b.dataset.v !== 'hold') && (!anyLoaded(you) || orders.sails === 'full');
    }
    syncSegs(ctx);
    updateHint(ctx, nearest);
  }

  function updateHint(ctx, nearest) {
    if (ctx.over) return;
    const you = ctx.you;
    const orders = game.getOrders();
    if (you.grappledTo) { hintEl.textContent = 'Grappled with ' + you.grappledTo.name + ' — steel decides now.'; return; }
    const att = attOf(simFacing(you, orders.helm), ctx.wind.from);
    const spd = att === 0 ? 0 : speedOf(you, att, orders.sails, ctx.wind);
    const batteries = mountsOf(you)
      .map(([id]) => MOUNT_TAG[id] + ' ' + (you.guns[id] === 0 ? '✓' : you.guns[id]))
      .join(' · ');
    const gun = orders.sails === 'full' ? 'guns silent — full sail'
      : batteries + (orders.shot === 'hold' ? ' · held' : ' · ' + orders.shot);
    const range = nearest
      ? ' · range ' + dist(you, nearest) + (game.visibleTo(you, nearest) ? '' : ' (lost from sight)')
      : '';
    hintEl.textContent = ATT_NAMES[att] + ' → ' + spd + ' hex' + (spd === 1 ? '' : 'es') + range + ' · ' + gun;
  }

  return { refresh };
}
