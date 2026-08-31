import { SQ3, unitPos } from '../core/hex.js';

// Turns board coordinates into pixels and keeps the chart fitted to its box,
// whatever size the screen is.
export function createLayout(canvas, box) {
  const L = {
    S: 20, dpr: 1, offX: 0, offY: 0, W: 0, H: 0, cols: 9, rows: 10,
    setBoard(cols, rows) { L.cols = cols; L.rows = rows; L.resize(); },
    resize() {
      L.W = box.clientWidth; L.H = box.clientHeight;
      if (!L.W || !L.H) return;
      L.S = Math.min(L.W / (1.5 * L.cols + 0.7), L.H / (SQ3 * (L.rows + 0.7)));
      const bw = L.S * (1.5 * L.cols + 0.5), bh = L.S * SQ3 * (L.rows + 0.5);
      L.offX = (L.W - bw) / 2 + L.S;
      L.offY = (L.H - bh) / 2 + L.S * 0.9;
      L.dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(L.W * L.dpr);
      canvas.height = Math.round(L.H * L.dpr);
      canvas.getContext('2d').setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
    },
    px(q, r) {
      const u = unitPos(q, r);
      return { x: L.S * u.x + L.offX, y: L.S * u.y + L.offY };
    },
  };
  return L;
}
