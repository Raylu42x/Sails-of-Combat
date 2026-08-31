// Chart layers: what the eye wants on the paper varies by player and by
// moment. The control sits in the corner of the chart and remembers itself.
const KEY = 'soc.layers';

export const LAYERS = [
  { id: 'depth', name: 'Soundings', hint: 'Shoals and holding ground' },
  { id: 'arcs',  name: 'Gun arcs',  hint: 'Where your loaded guns will bear' },
  { id: 'track', name: 'Track',     hint: 'The hexes this turn’s orders will sail' },
  { id: 'range', name: 'Range line', hint: 'Bearing and distance to the enemy' },
];

function load() {
  const on = {};
  for (const l of LAYERS) on[l.id] = true;
  try { Object.assign(on, JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch (e) { /* private mode */ }
  return on;
}

export function createLayers(root, onChange) {
  const on = load();
  const wrap = document.createElement('div');
  wrap.className = 'layers';
  const btn = document.createElement('button');
  btn.className = 'layers-btn';
  btn.type = 'button';
  btn.title = 'Chart layers';
  btn.setAttribute('aria-label', 'Chart layers');
  btn.textContent = '≡ Layers';
  const menu = document.createElement('div');
  menu.className = 'layers-menu';
  wrap.append(btn, menu);
  root.appendChild(wrap);

  const rows = new Map();
  for (const l of LAYERS) {
    const row = document.createElement('button');
    row.className = 'layers-row';
    row.type = 'button';
    row.title = l.hint;
    row.innerHTML = '<span class="tick"></span><span class="nm"></span>';
    row.querySelector('.nm').textContent = l.name;
    row.addEventListener('pointerdown', ev => {
      ev.stopPropagation();
      on[l.id] = !on[l.id];
      try { localStorage.setItem(KEY, JSON.stringify(on)); } catch (e) { /* ignore */ }
      paint();
      onChange();
    });
    menu.appendChild(row);
    rows.set(l.id, row);
  }

  // A note, not a disabled control: open water simply has nothing to sound.
  const note = document.createElement('div');
  note.className = 'layers-note';
  menu.appendChild(note);

  let open = false;
  const setOpen = v => { open = v; wrap.classList.toggle('open', open); };
  btn.addEventListener('pointerdown', ev => { ev.stopPropagation(); setOpen(!open); });
  document.addEventListener('pointerdown', () => { if (open) setOpen(false); });
  menu.addEventListener('pointerdown', ev => ev.stopPropagation());

  function paint() {
    for (const l of LAYERS) rows.get(l.id).classList.toggle('on', !!on[l.id]);
  }
  paint();

  return {
    get: id => !!on[id],
    toggle(id) {
      on[id] = !on[id];
      try { localStorage.setItem(KEY, JSON.stringify(on)); } catch (e) { /* ignore */ }
      paint();
      onChange();
      return on[id];
    },
    // Called when a scenario starts, so the menu can say why a layer is blank.
    describe(ctx) {
      const sounded = (ctx.map.water || []).length > 0;
      note.textContent = sounded ? '' : 'This chart is open water — no soundings to show.';
      rows.get('depth').classList.toggle('empty', !sounded);
    },
  };
}
