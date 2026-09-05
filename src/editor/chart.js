// Drawing the chart being edited. Deliberately its own small renderer: the
// game's is wired to a running game, and an editor needs to draw things a game
// never has — an empty chart, a ship with no rules attached, a hex under the
// cursor.
import { DIRS, SQ3, angleOf, unitPos } from '../core/hex.js';
import { shipType } from '../data/ships.js';
import { cells, islandAt, shipAt, waterAt } from './model.js';

const css = getComputedStyle(document.documentElement);
const C = n => css.getPropertyValue(n).trim();

export function createChart(canvas, level, onPick) {
  let S = 22, offX = 0, offY = 0, W = 0, H = 0, hover = null, selected = null;
  const cx = canvas.getContext('2d');

  function fit() {
    const box = canvas.parentElement;
    W = box.clientWidth; H = box.clientHeight;
    if (!W || !H) return;
    const lvl = level();
    S = Math.min(W / (1.5 * lvl.map.cols + 0.7), H / (SQ3 * (lvl.map.rows + 0.7)));
    const bw = S * (1.5 * lvl.map.cols + 0.5), bh = S * SQ3 * (lvl.map.rows + 0.5);
    offX = (W - bw) / 2 + S; offY = (H - bh) / 2 + S * 0.9;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const px = (q, r) => { const u = unitPos(q, r); return { x: S * u.x + offX, y: S * u.y + offY }; };

  // Which hex is under the pointer: try them all, take the nearest centre.
  function hexAt(x, y) {
    let best = null, bestD = S * S;
    for (const c of cells(level())) {
      const p = px(c.q, c.r);
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  }

  function hexPath(p, scale = 1) {
    cx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 3 * k;
      const X = p.x + S * scale * Math.cos(a), Y = p.y + S * scale * Math.sin(a);
      k ? cx.lineTo(X, Y) : cx.moveTo(X, Y);
    }
    cx.closePath();
  }

  function drawShip(s) {
    const p = px(s.q, s.r);
    const t = shipType(s.type);
    const prof = t.profile || { len: 0.72, beam: 0.32, bluff: 0.25, masts: 2, transom: 0.85 };
    const colour = s.role === 'player' ? C('--brass') : s.side === 'friendly' ? C('--ink') : C('--signal');
    cx.save();
    cx.translate(p.x, p.y);
    cx.rotate(angleOf(s.facing));
    const Lh = S * prof.len, W2 = S * prof.beam, bluff = prof.bluff;
    const stern = -Lh * 0.8, tw = W2 * prof.transom;
    cx.fillStyle = colour;
    cx.beginPath();
    cx.moveTo(Lh, 0);
    cx.quadraticCurveTo(Lh * (0.75 - bluff * 0.5), -W2 * (0.35 + bluff * 0.65), Lh * (0.2 + bluff * 0.1), -W2);
    cx.lineTo(stern, -tw); cx.lineTo(stern, tw);
    cx.lineTo(Lh * (0.2 + bluff * 0.1), W2);
    cx.quadraticCurveTo(Lh * (0.75 - bluff * 0.5), W2 * (0.35 + bluff * 0.65), Lh, 0);
    cx.closePath(); cx.fill();
    cx.strokeStyle = C('--sea'); cx.lineWidth = 2;
    for (let i = 0; i < prof.masts; i++) {
      const x = prof.masts === 1 ? -Lh * 0.1 : stern * 0.6 + (i / (prof.masts - 1)) * (Lh * 0.45 - stern * 0.6);
      cx.beginPath(); cx.moveTo(x, -W2 * 0.85); cx.lineTo(x, W2 * 0.85); cx.stroke();
    }
    cx.restore();
    if (s.anchor === 'down') {
      cx.fillStyle = C('--ink'); cx.font = '700 11px "Barlow Condensed", sans-serif';
      cx.textAlign = 'center'; cx.fillText('⚓', p.x, p.y + S * 0.95);
    }
    if (s === selected) {
      hexPath(p, 0.99);
      cx.strokeStyle = C('--flash'); cx.lineWidth = 2; cx.stroke();
    }
  }

  function draw() {
    const lvl = level();
    if (!W) fit();
    cx.clearRect(0, 0, W, H);
    cx.fillStyle = C('--sea'); cx.fillRect(0, 0, W, H);

    for (const c of cells(lvl)) {
      const p = px(c.q, c.r);
      const water = waterAt(lvl, c.q, c.r);
      if (water) {
        hexPath(p, 0.99);
        cx.fillStyle = water.depth === 'anchorage' ? C('--anchorage') : C('--sea-shallow');
        cx.fill();
      }
      hexPath(p);
      cx.strokeStyle = C('--chart-dim'); cx.lineWidth = 1; cx.stroke();
      if (water && water.depth === 'shoal') {
        cx.strokeStyle = C('--shoal'); cx.lineWidth = 1;
        for (let i = -1; i <= 1; i++) {
          const y = p.y + i * S * 0.3;
          cx.beginPath();
          for (let k = -2; k <= 2; k++) {
            const x = p.x + k * S * 0.18;
            k === -2 ? cx.moveTo(x, y) : cx.lineTo(x, y + (k % 2 ? S * 0.07 : -S * 0.07));
          }
          cx.stroke();
        }
      }
      const land = islandAt(lvl, c.q, c.r);
      if (land) {
        hexPath(p, 0.98);
        cx.fillStyle = land.height === 'tall' ? C('--land-tall') : C('--land');
        cx.fill();
        cx.strokeStyle = C('--land-shore'); cx.lineWidth = 1.6; cx.stroke();
        if (land.height === 'tall') {
          cx.strokeStyle = C('--ink-dim'); cx.lineWidth = 1.5;
          cx.beginPath();
          cx.moveTo(p.x - S * 0.32, p.y + S * 0.22);
          cx.lineTo(p.x, p.y - S * 0.32);
          cx.lineTo(p.x + S * 0.32, p.y + S * 0.22);
          cx.stroke();
        }
      }
    }

    for (const s of lvl.ships) drawShip(s);

    if (hover) {
      hexPath(px(hover.q, hover.r), 0.96);
      cx.strokeStyle = C('--flash'); cx.lineWidth = 1.5; cx.globalAlpha = 0.7;
      cx.stroke(); cx.globalAlpha = 1;
    }

    // Wind rose, so the chart is read the same way the game reads it.
    cx.save();
    cx.translate(30, 30);
    cx.strokeStyle = C('--ink-dim'); cx.lineWidth = 1;
    cx.beginPath(); cx.arc(0, 0, 15, 0, Math.PI * 2); cx.stroke();
    cx.rotate(angleOf(lvl.map.wind.from) + Math.PI);
    cx.strokeStyle = C('--flash'); cx.lineWidth = 1 + lvl.map.wind.speed * 0.6;
    cx.beginPath(); cx.moveTo(-9, 0); cx.lineTo(9, 0); cx.stroke();
    cx.beginPath(); cx.moveTo(9, 0); cx.lineTo(4, -4); cx.moveTo(9, 0); cx.lineTo(4, 4); cx.stroke();
    cx.restore();
    cx.fillStyle = C('--ink-dim'); cx.font = '600 9px "Barlow Condensed", sans-serif';
    cx.textAlign = 'center'; cx.fillText('WIND', 30, 56);
  }

  const toLocal = ev => {
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  };
  canvas.addEventListener('pointermove', ev => {
    const { x, y } = toLocal(ev);
    const c = hexAt(x, y);
    if (!hover || !c || hover.q !== c.q || hover.r !== c.r) { hover = c; draw(); }
  });
  canvas.addEventListener('pointerleave', () => { hover = null; draw(); });
  canvas.addEventListener('pointerdown', ev => {
    const { x, y } = toLocal(ev);
    const c = hexAt(x, y);
    if (c) onPick(c, ev);
  });

  return {
    draw, fit,
    select(s) { selected = s; draw(); },
    get selected() { return selected; },
    shipAtHex: (q, r) => shipAt(level(), q, r),
  };
}
