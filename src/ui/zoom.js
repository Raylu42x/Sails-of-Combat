// Chart zoom: lean in on the fight, drag the chart about, and let go again.
// Pinch on a phone, the wheel on a desk, or the buttons in the corner — all
// three go through the one layout, which keeps the point under your finger
// where it was while the chart grows round it. Zoom never changes a rule:
// the core does not know the chart has a scale.
const STEP = 1.35;

export function createZoom(box, canvas, layout, game, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'zoom';
  const mk = (cls, text, title) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = text;
    b.title = title;
    b.setAttribute('aria-label', title);
    wrap.appendChild(b);
    return b;
  };
  const inBtn = mk('zoom-in', '+', 'Zoom in (+)');
  const outBtn = mk('zoom-out', '−', 'Zoom out (−)');
  const fitBtn = mk('zoom-fit', '⌖', 'Fit the chart (0)');
  box.appendChild(wrap);

  // The buttons zoom on your own ship when she is on screen, so leaning in
  // means leaning in on her — and on the middle of the chart when she is not.
  function anchorOnYou() {
    const ctx = game.state();
    if (!ctx || !ctx.you) return null;
    const p = layout.px(ctx.you.q, ctx.you.r);
    const inside = p.x >= 0 && p.x <= layout.W && p.y >= 0 && p.y <= layout.H;
    return inside ? p : null;
  }
  function changed() {
    inBtn.disabled = layout.zoom >= layout.maxZoom - 1e-6;
    outBtn.disabled = !layout.zoomed;
    fitBtn.hidden = !layout.zoomed;
    box.classList.toggle('zoomed', layout.zoomed);
    onChange();
  }
  const zoomBy = (f, anchor) => { layout.setZoom(layout.zoom * f, anchor); changed(); };
  const zoomIn = () => zoomBy(STEP, anchorOnYou());
  const zoomOut = () => zoomBy(1 / STEP, anchorOnYou());
  const fit = () => { layout.fit(); changed(); };

  inBtn.addEventListener('pointerdown', ev => { ev.stopPropagation(); zoomIn(); });
  outBtn.addEventListener('pointerdown', ev => { ev.stopPropagation(); zoomOut(); });
  fitBtn.addEventListener('pointerdown', ev => { ev.stopPropagation(); fit(); });

  // A point on the canvas, in the layout's pixels.
  const local = ev => {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  };

  // The wheel zooms about the cursor. Trackpads send small deltas fast and
  // mice send big ones slowly; an exponential keeps both feeling even.
  canvas.addEventListener('wheel', ev => {
    ev.preventDefault();
    zoomBy(Math.exp(-ev.deltaY * 0.0018), local(ev));
  }, { passive: false });

  // One finger drags the chart when it is zoomed; two pinch it. Every pointer
  // is captured, so a drag that wanders off the chart still ends cleanly.
  const pts = new Map();
  let drag = null, pinch = null;
  const two = () => {
    const [a, b] = [...pts.values()];
    return { d: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  };
  canvas.addEventListener('pointerdown', ev => {
    canvas.setPointerCapture(ev.pointerId);
    pts.set(ev.pointerId, local(ev));
    if (pts.size === 1) drag = { ...local(ev) };
    else if (pts.size === 2) { drag = null; pinch = { ...two(), zoom: layout.zoom }; }
  });
  canvas.addEventListener('pointermove', ev => {
    if (!pts.has(ev.pointerId)) return;
    const p = local(ev);
    pts.set(ev.pointerId, p);
    if (pinch && pts.size >= 2) {
      const now = two();
      // Scale about the fingers' midpoint, then carry the chart with them.
      layout.setZoom(pinch.zoom * now.d / pinch.d, now.mid);
      layout.panBy(now.mid.x - pinch.mid.x, now.mid.y - pinch.mid.y);
      pinch.mid = now.mid;
      changed();
    } else if (drag && layout.zoomed) {
      layout.panBy(p.x - drag.x, p.y - drag.y);
      drag = p;
      changed();
    }
  });
  const release = ev => {
    pts.delete(ev.pointerId);
    if (pts.size < 2) pinch = null;
    if (pts.size === 0) drag = null;
    else if (pts.size === 1) drag = { ...[...pts.values()][0] };
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  changed();
  return { zoomIn, zoomOut, fit, refresh: changed };
}
