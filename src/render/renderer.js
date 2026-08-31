import { angleOf, dist, relBearing } from '../core/hex.js';
import { attOf } from '../core/wind.js';
import { pathOf } from '../core/movement.js';
import { isLoaded, mountsOf, simFacing } from '../core/ship.js';
import { acceptsShot, rangeOf } from '../core/combat.js';
import { createLayout } from './layout.js';
import { sfx } from '../audio/sfx.js';

const css = getComputedStyle(document.documentElement);
const C = n => css.getPropertyValue(n).trim();
const now = () => performance.now();

export function createRenderer(canvas, box, game) {
  const cx = canvas.getContext('2d');
  const L = createLayout(canvas, box);
  const fx = { shipPos: {}, tracer: null, flashes: [], floaters: [], shake: 0, muzzle: null, pan: { x: 0, y: 0 } };
  const lastSeen = new Map(); // uid -> {q, r} for ships hidden behind tall land

  const colorFor = s => s.isYou ? C('--brass') : s.side === 'friendly' ? C('--ink') : C('--signal');

  // A hidden tab gets no animation frames, so fall back to a timer — otherwise
  // a turn started and then backgrounded would never finish.
  const schedule = fn => (document.hidden ? setTimeout(fn, 16) : requestAnimationFrame(fn));

  function tween(ms, fn) {
    return new Promise(res => {
      const t0 = now();
      (function stepFrame() {
        const k = Math.min(1, (now() - t0) / ms);
        fn(k); draw();
        if (k < 1) schedule(stepFrame); else res();
      })();
    });
  }
  const sleepDraw = ms => tween(ms, () => {});
  const addFlash = (x, y, color, big) => fx.flashes.push({ x, y, color, big, t0: now(), life: big ? 480 : 340 });
  const addFloater = (x, y, text, color) => fx.floaters.push({ x, y: y - L.S * 0.3, text, color, t0: now(), life: 950 });
  const shipPx = s => fx.shipPos[s.uid] || L.px(s.q, s.r);

  // --- the view adapter the game calls for anything that takes time --------
  const view = {
    pause: sleepDraw,
    async animateMoves(from, paths, shift) {
      const ctx = game.state();
      if (shift) fx.pan = { x: -shift.x * L.S, y: -shift.y * L.S };
      const tracks = ctx.ships.map(s => {
        const startCell = from.get(s.uid);
        const wp = [L.px(startCell.q, startCell.r)].concat((paths[s.uid] || []).map(c => L.px(c.q, c.r)));
        return { s, wp };
      });
      const lerp = (wp, k) => {
        if (wp.length === 1) return wp[0];
        const t = k * (wp.length - 1), i = Math.min(wp.length - 2, Math.floor(t)), f = t - i;
        return { x: wp[i].x + (wp[i + 1].x - wp[i].x) * f, y: wp[i].y + (wp[i + 1].y - wp[i].y) * f };
      };
      const panFrom = { x: fx.pan.x, y: fx.pan.y };
      await tween(shift ? 640 : 520, k => {
        const e = 1 - (1 - k) * (1 - k);
        fx.pan = { x: panFrom.x * (1 - e), y: panFrom.y * (1 - e) };
        for (const t of tracks) fx.shipPos[t.s.uid] = lerp(t.wp, k);
      });
      fx.shipPos = {}; fx.pan = { x: 0, y: 0 };
    },
    async animateShot(r, apply, log) {
      if (r.none) { apply(r, log); return; }
      const A = L.px(r.s.q, r.s.r), B = L.px(r.t.q, r.t.r);
      fx.muzzle = { x: A.x, y: A.y, tx: B.x, ty: B.y, t0: now(), life: 200 };
      sfx.gun(r.chaser ? 0.6 : 1, dist(r.s, r.t));
      await sleepDraw(120);
      await tween(r.chaser ? 180 : 240, k => { fx.tracer = { x1: A.x, y1: A.y, x2: B.x, y2: B.y, k }; });
      fx.tracer = null; fx.muzzle = null;
      apply(r, log);
      if (r.rake) sfx.rake();
      else sfx.hit(r.rig && !r.hull ? 'rig' : r.crew && !r.hull ? 'crew' : 'hull');
      const color = r.crew && !r.hull ? C('--signal') : C('--flash');
      addFlash(B.x, B.y, color, !!r.rake || r.shot === 'double');
      if (r.rake || r.shot === 'double') fx.shake = 1;
      let dy = 0;
      if (r.hull) { addFloater(B.x, B.y + dy, '−' + r.hull + ' HULL', C('--flash')); dy += 14; }
      if (r.rig) { addFloater(B.x, B.y + dy, '−' + r.rig + ' RIG', C('--brass')); dy += 14; }
      if (r.crew) { addFloater(B.x, B.y + dy, '−' + r.crew + ' CREW', C('--signal')); dy += 14; }
      if (r.rake) addFloater(B.x, B.y - L.S * 0.9, 'RAKED — ' + r.rake.toUpperCase() + '!', C('--flash'));
      await sleepDraw(r.chaser ? 300 : 400);
    },
    async melee(a, b, res) {
      sfx.clash();
      const A = shipPx(a), B = shipPx(b);
      addFlash((A.x + B.x) / 2, (A.y + B.y) / 2, C('--signal'), true);
      if (res.bLoss) addFloater(B.x, B.y, '−' + res.bLoss + ' CREW', C('--signal'));
      if (res.aLoss) addFloater(A.x, A.y, '−' + res.aLoss + ' CREW', C('--brass'));
      fx.shake = 0.7;
      await sleepDraw(600);
    },
  };

  // --- drawing ------------------------------------------------------------
  function hexPath(p, scale = 1) {
    cx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 3 * k;
      const X = p.x + L.S * scale * Math.cos(a), Y = p.y + L.S * scale * Math.sin(a);
      k ? cx.lineTo(X, Y) : cx.moveTo(X, Y);
    }
    cx.closePath();
  }

  function drawSoundings(ctx) {
    for (const cell of ctx.map.water || []) {
      const p = L.px(cell.q, cell.r);
      if (cell.depth === 'shoal') {
        // Broken water over the bank.
        cx.strokeStyle = C('--shoal'); cx.lineWidth = 1;
        for (let i = -1; i <= 1; i++) {
          const y = p.y + i * L.S * 0.32;
          cx.beginPath();
          for (let k = -3; k <= 3; k++) {
            const x = p.x + k * L.S * 0.14;
            k === -3 ? cx.moveTo(x, y) : cx.lineTo(x, y + (k % 2 ? L.S * 0.06 : -L.S * 0.06));
          }
          cx.stroke();
        }
      } else if (cell.depth === 'anchorage') {
        hexPath(p, 0.96);
        cx.fillStyle = C('--anchorage');
        cx.fill();
      }
    }
  }

  function drawTerrain(ctx) {
    for (const cell of ctx.map.islands || []) {
      const p = L.px(cell.q, cell.r);
      const tall = cell.height === 'tall';
      hexPath(p, 0.98);
      cx.fillStyle = tall ? C('--land-tall') : C('--land');
      cx.fill();
      cx.strokeStyle = C('--chart'); cx.lineWidth = 1; cx.stroke();
      if (tall) { // a peak, to say the sight line stops here
        cx.strokeStyle = C('--ink-dim'); cx.lineWidth = 1.5;
        cx.beginPath();
        cx.moveTo(p.x - L.S * 0.35, p.y + L.S * 0.25);
        cx.lineTo(p.x, p.y - L.S * 0.35);
        cx.lineTo(p.x + L.S * 0.35, p.y + L.S * 0.25);
        cx.stroke();
      }
    }
  }

  function drawShip(ctx, s) {
    const p = shipPx(s);
    const color = colorFor(s);
    cx.save();
    cx.translate(p.x, p.y);
    cx.rotate(angleOf(s.facing));
    const Lh = L.S * 0.72, W2 = L.S * 0.32;
    cx.globalAlpha = s.struck ? 0.35 : 1;
    cx.fillStyle = color;
    cx.beginPath();
    cx.moveTo(Lh, 0);
    cx.lineTo(Lh * 0.25, -W2);
    cx.lineTo(-Lh * 0.8, -W2 * 0.85);
    cx.lineTo(-Lh * 0.8, W2 * 0.85);
    cx.lineTo(Lh * 0.25, W2);
    cx.closePath(); cx.fill();
    cx.strokeStyle = C('--sea'); cx.lineWidth = 2;
    const n = s.sails === 'full' ? 3 : (s.sails === 'battle' ? 2 : 1);
    for (let i = 0; i < n; i++) {
      cx.beginPath();
      cx.moveTo(-Lh * 0.5 + i * Lh * 0.4, -W2 * 0.55);
      cx.lineTo(-Lh * 0.5 + i * Lh * 0.4, W2 * 0.55);
      cx.stroke();
    }
    if (s.isYou) {
      // Battery state: a bright strake for each loaded broadside, a bright
      // pip fore or aft for a loaded chaser. Local +y is starboard.
      cx.lineWidth = 2;
      const mark = (id, x1, x2, y) => {
        if (!(id in s.guns)) return;
        cx.strokeStyle = s.guns[id].reload === 0 ? C('--flash') : C('--chart');
        cx.beginPath(); cx.moveTo(x1, y); cx.lineTo(x2, y); cx.stroke();
      };
      mark('stbd', -Lh * 0.55, Lh * 0.15, W2 + 3.5);
      mark('port', -Lh * 0.55, Lh * 0.15, -W2 - 3.5);
      mark('stbdSw', -Lh * 0.2, Lh * 0.15, W2 + 6.5);
      mark('portSw', -Lh * 0.2, Lh * 0.15, -W2 - 6.5);
      mark('bow', Lh * 0.6, Lh * 0.95, 0);
      mark('stern', -Lh * 1.05, -Lh * 0.9, 0);
    }
    cx.globalAlpha = 1;
    cx.restore();
    // Ground tackle, drawn where the cable would be: down from her bows.
    if (s.anchor !== 'up' || s.grounded) {
      cx.save();
      cx.strokeStyle = s.grounded ? C('--signal') : C('--flash');
      cx.lineWidth = 1.5;
      cx.setLineDash([3, 2]);
      cx.beginPath();
      cx.moveTo(p.x, p.y);
      cx.lineTo(p.x + L.S * 0.5, p.y + L.S * 0.5);
      cx.stroke();
      cx.setLineDash([]);
      cx.beginPath();
      cx.arc(p.x + L.S * 0.55, p.y + L.S * 0.55, L.S * 0.1, 0, Math.PI * 2);
      cx.stroke();
      cx.restore();
    }
    const tag = s.struck ? 'STRUCK' : s.grounded ? 'AGROUND' : s.inIrons ? 'IN IRONS' : null;
    if (tag) {
      cx.fillStyle = C('--flash');
      cx.font = '700 10px "Barlow Condensed", sans-serif';
      cx.textAlign = 'center';
      cx.fillText(tag, p.x, p.y - L.S * 0.85);
    }
  }

  function drawGhostTrack(ctx) {
    const you = ctx.you;
    const orders = game.getOrders();
    const f = simFacing(you, orders.helm);
    const inIrons = attOf(f, ctx.wind.from) === 0;
    const path = inIrons ? [] : pathOf(you, ctx, { facing: f, sails: orders.sails, inIrons });
    cx.fillStyle = 'rgba(217,164,65,0.16)';
    for (const c of path) { hexPath(L.px(c.q, c.r)); cx.fill(); }
    drawArcs(ctx, path.length ? path[path.length - 1] : you, f);
  }

  // Where the guns will bear from where this turn's orders leave her: only the
  // batteries that are loaded with the charge you have ordered, since a gun
  // holding something else has to be drawn first.
  function drawArcs(ctx, from, facing) {
    const you = ctx.you;
    const orders = game.getOrders();
    if (orders.shot === 'hold' || orders.sails === 'full') return;
    for (const [id, mount] of mountsOf(you)) {
      if (!isLoaded(you, id) || !acceptsShot(mount, orders.shot)) continue;
      if (you.guns[id].shot !== orders.shot) continue;
      const range = rangeOf(mount, orders.shot);
      cx.fillStyle = mount.chaser ? 'rgba(242,233,216,0.07)' : 'rgba(242,233,216,0.05)';
      for (const c of ctx.board.cells()) {
        const d = dist(from, c);
        if (d < 1 || d > range) continue;
        if (!mount.arcs.includes(relBearing(from, c, facing))) continue;
        if (ctx.board.landAt(c.q, c.r)) continue;
        if (ctx.board.sightBlocked(from, c)) continue;
        hexPath(L.px(c.q, c.r), 0.9);
        cx.fill();
      }
    }
  }

  function drawRangeLine(ctx, target) {
    const a = L.px(ctx.you.q, ctx.you.r), b = L.px(target.q, target.r);
    cx.strokeStyle = C('--ink-dim'); cx.lineWidth = 1;
    cx.globalAlpha = 0.5; cx.setLineDash([2, 5]);
    cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
    cx.setLineDash([]); cx.globalAlpha = 1;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    cx.fillStyle = C('--sea');
    cx.beginPath(); cx.arc(mx, my, 9, 0, Math.PI * 2); cx.fill();
    cx.strokeStyle = C('--ink-dim'); cx.stroke();
    cx.fillStyle = C('--ink');
    cx.font = '600 11px "IBM Plex Mono", monospace';
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.fillText(String(dist(ctx.you, target)), mx, my + 0.5);
    cx.textBaseline = 'alphabetic';
  }

  function drawWindRose(ctx) {
    const wx = 28, wy = 28;
    cx.save();
    cx.translate(wx, wy);
    cx.strokeStyle = C('--ink-dim'); cx.lineWidth = 1;
    cx.beginPath(); cx.arc(0, 0, 15, 0, Math.PI * 2); cx.stroke();
    cx.rotate(angleOf(ctx.wind.from) + Math.PI);
    cx.strokeStyle = C('--flash'); cx.lineWidth = 1 + ctx.wind.speed * 0.6;
    cx.beginPath(); cx.moveTo(-9, 0); cx.lineTo(9, 0); cx.stroke();
    cx.beginPath(); cx.moveTo(9, 0); cx.lineTo(4, -4); cx.moveTo(9, 0); cx.lineTo(4, 4); cx.stroke();
    cx.restore();
    cx.fillStyle = C('--ink-dim');
    cx.font = '600 9px "Barlow Condensed", sans-serif';
    cx.textAlign = 'center';
    cx.fillText('WIND ' + '·'.repeat(ctx.wind.speed), wx, wy + 26);
  }

  function draw() {
    const ctx = game.state();
    if (!ctx || !L.W) return;
    cx.save();
    cx.clearRect(0, 0, L.W, L.H);
    cx.fillStyle = C('--sea'); cx.fillRect(0, 0, L.W, L.H);
    if (fx.shake > 0) {
      cx.translate((Math.random() - 0.5) * 7 * fx.shake, (Math.random() - 0.5) * 7 * fx.shake);
      fx.shake = Math.max(0, fx.shake - 0.06);
    }
    cx.save();
    cx.translate(fx.pan.x, fx.pan.y);

    cx.strokeStyle = C('--chart-dim'); cx.lineWidth = 1;
    for (const c of ctx.board.cells()) { hexPath(L.px(c.q, c.r)); cx.stroke(); }
    drawSoundings(ctx);
    drawTerrain(ctx);

    const idle = !ctx.over && !ctx.busy && !ctx.you.grappledTo && !ctx.you.struck;
    if (idle) drawGhostTrack(ctx);

    const hostiles = ctx.ships.filter(s => s.side !== ctx.you.side && !s.struck);
    const nearestVisible = hostiles
      .filter(s => game.visibleTo(ctx.you, s))
      .sort((a, b) => dist(ctx.you, a) - dist(ctx.you, b))[0];
    if (idle && nearestVisible) drawRangeLine(ctx, nearestVisible);

    for (const s of ctx.ships) {
      if (s.grappledTo && s.isYou) {
        const a = shipPx(s), b = shipPx(s.grappledTo);
        cx.strokeStyle = C('--flash'); cx.lineWidth = 2; cx.setLineDash([4, 3]);
        cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
        cx.setLineDash([]);
      }
    }

    for (const s of ctx.ships) {
      if (s.isYou) continue;
      const seen = game.visibleTo(ctx.you, s);
      if (seen) { lastSeen.set(s.uid, { q: s.q, r: s.r }); drawShip(ctx, s); }
      else {
        const mark = lastSeen.get(s.uid);
        if (!mark) continue;
        const p = L.px(mark.q, mark.r); // last known bearing, behind the land
        cx.globalAlpha = 0.35;
        cx.strokeStyle = colorFor(s); cx.lineWidth = 1;
        cx.setLineDash([3, 3]);
        cx.beginPath(); cx.arc(p.x, p.y, L.S * 0.45, 0, Math.PI * 2); cx.stroke();
        cx.setLineDash([]); cx.globalAlpha = 1;
      }
    }
    drawShip(ctx, ctx.you);

    if (fx.muzzle) {
      const m = fx.muzzle;
      if (now() - m.t0 < m.life) {
        cx.save(); cx.translate(m.x, m.y); cx.rotate(Math.atan2(m.ty - m.y, m.tx - m.x));
        cx.strokeStyle = C('--flash'); cx.lineWidth = 2;
        for (const sp of [-0.25, 0, 0.25]) {
          cx.save(); cx.rotate(sp);
          cx.beginPath(); cx.moveTo(L.S * 0.5, 0); cx.lineTo(L.S * 0.95, 0); cx.stroke();
          cx.restore();
        }
        cx.restore();
      }
    }
    if (fx.tracer) {
      const t = fx.tracer;
      const X = t.x1 + (t.x2 - t.x1) * t.k, Y = t.y1 + (t.y2 - t.y1) * t.k;
      cx.strokeStyle = C('--flash'); cx.lineWidth = 2;
      cx.beginPath();
      cx.moveTo(t.x1 + (X - t.x1) * 0.7, t.y1 + (Y - t.y1) * 0.7);
      cx.lineTo(X, Y); cx.stroke();
      cx.fillStyle = C('--flash');
      cx.beginPath(); cx.arc(X, Y, 2.5, 0, Math.PI * 2); cx.fill();
    }
    const tNow = now();
    fx.flashes = fx.flashes.filter(f => tNow - f.t0 < f.life);
    for (const f of fx.flashes) {
      const k = (tNow - f.t0) / f.life;
      const R = (f.big ? L.S * 1.15 : L.S * 0.7) * (0.3 + 0.7 * k);
      cx.globalAlpha = 1 - k;
      cx.strokeStyle = f.color; cx.lineWidth = f.big ? 3 : 2;
      cx.beginPath(); cx.arc(f.x, f.y, R, 0, Math.PI * 2); cx.stroke();
      if (f.big) {
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 3 * i + k * 0.6;
          cx.beginPath();
          cx.moveTo(f.x + Math.cos(a) * R * 0.5, f.y + Math.sin(a) * R * 0.5);
          cx.lineTo(f.x + Math.cos(a) * R * 1.25, f.y + Math.sin(a) * R * 1.25);
          cx.stroke();
        }
      }
      cx.globalAlpha = 1;
    }
    fx.floaters = fx.floaters.filter(f => tNow - f.t0 < f.life);
    cx.font = '700 12px "IBM Plex Mono", monospace';
    cx.textAlign = 'center';
    for (const f of fx.floaters) {
      const k = (tNow - f.t0) / f.life;
      cx.globalAlpha = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
      cx.fillStyle = f.color;
      cx.fillText(f.text, f.x, f.y - k * 26);
      cx.globalAlpha = 1;
    }
    cx.restore(); // end pan
    drawWindRose(ctx);
    cx.restore();
  }

  function resize() {
    const ctx = game.state();
    if (ctx) L.setBoard(ctx.map.cols, ctx.map.rows);
    else L.resize();
    draw();
  }

  return { view, draw, resize, layout: L, clearMemory: () => lastSeen.clear() };
}
