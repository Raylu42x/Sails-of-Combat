import { SQ3, unitPos } from '../core/hex.js';

// Turns board coordinates into pixels and keeps the chart fitted to its box,
// whatever size the screen is — and, on top of the fit, lets the player lean
// in. Zoom is a multiplier on the fitted hex size; pan is a pixel offset from
// the centred position. At zoom 1 the pan is always zero, so the chart you
// get by default is exactly the one that fits.
export function createLayout(canvas, box) {
  const L = {
    S: 20, fitS: 20, dpr: 1, offX: 0, offY: 0, W: 0, H: 0, cols: 9, rows: 10,
    zoom: 1, panX: 0, panY: 0,
    minZoom: 1, maxZoom: 2.75,
    setBoard(cols, rows) { L.cols = cols; L.rows = rows; L.resize(); },
    // Measure the box and size the bitmap. Setting canvas.width clears it, so
    // this is only for real resizes; zooming and panning go through place().
    resize() {
      L.W = box.clientWidth; L.H = box.clientHeight;
      if (!L.W || !L.H) return;
      L.dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(L.W * L.dpr);
      canvas.height = Math.round(L.H * L.dpr);
      canvas.getContext('2d').setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
      L.place();
    },
    // Where the board sits for the current zoom and pan.
    place() {
      if (!L.W || !L.H) return;
      L.fitS = Math.min(L.W / (1.5 * L.cols + 0.7), L.H / (SQ3 * (L.rows + 0.7)));
      L.S = L.fitS * L.zoom;
      L.clampPan();
      const bw = L.S * (1.5 * L.cols + 0.5), bh = L.S * SQ3 * (L.rows + 0.5);
      L.offX = (L.W - bw) / 2 + L.S + L.panX;
      L.offY = (L.H - bh) / 2 + L.S * 0.9 + L.panY;
    },
    // The chart may be dragged until its edge reaches the edge of the box, and
    // half a hex further so the outermost cells are never pinned to the frame.
    // At zoom 1 it fits, and there is nothing to drag.
    clampPan() {
      const bw = L.S * (1.5 * L.cols + 0.5), bh = L.S * SQ3 * (L.rows + 0.5);
      const slackX = Math.max(0, (bw - L.W) / 2 + L.S * 0.5);
      const slackY = Math.max(0, (bh - L.H) / 2 + L.S * 0.5);
      L.panX = Math.max(-slackX, Math.min(slackX, L.panX));
      L.panY = Math.max(-slackY, Math.min(slackY, L.panY));
      if (L.zoom <= L.minZoom) { L.panX = 0; L.panY = 0; }
    },
    // Zoom about a point on the screen, so whatever is under the finger (or
    // the ship, when a button does it) stays put while the chart grows.
    setZoom(z, anchor) {
      const zoom = Math.max(L.minZoom, Math.min(L.maxZoom, z));
      if (!L.W || !L.H) { L.zoom = zoom; return; }
      const a = anchor || { x: L.W / 2, y: L.H / 2 };
      // The unit-space point under the anchor before the change.
      const ux = (a.x - L.offX) / L.S, uy = (a.y - L.offY) / L.S;
      L.zoom = zoom;
      const S = L.fitS * L.zoom;
      const bw = S * (1.5 * L.cols + 0.5), bh = S * SQ3 * (L.rows + 0.5);
      // Solve for the pan that puts the same unit point back under the anchor.
      L.panX = a.x - ux * S - ((L.W - bw) / 2 + S);
      L.panY = a.y - uy * S - ((L.H - bh) / 2 + S * 0.9);
      L.place();
    },
    panBy(dx, dy) { L.panX += dx; L.panY += dy; L.place(); },
    fit() { L.zoom = 1; L.panX = 0; L.panY = 0; L.place(); },
    get zoomed() { return L.zoom > L.minZoom; },
    px(q, r) {
      const u = unitPos(q, r);
      return { x: L.S * u.x + L.offX, y: L.S * u.y + L.offY };
    },
  };
  return L;
}
