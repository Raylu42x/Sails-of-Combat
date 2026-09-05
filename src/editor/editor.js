// The editor itself: paint the chart, place the ships, set the goal, and get a
// file you commit. It runs the game's own rules to test what you drew, so the
// tool and the game can never disagree about what a level means.
import { createChart } from './chart.js';
import {
  DEPTHS, HEIGHTS, MOODS, OBJECTIVES, PERSONALITIES, ROLES, WIND_NAMES,
  blankLevel, cells, inBounds, islandAt, shipAt, shipClasses, toFile, waterAt,
} from './model.js';
import { playtest, validate } from './playtest.js';

let level = blankLevel();
let tool = 'low';
const $ = id => document.getElementById(id);
const chart = createChart($('chart'), () => level, onPick);

// --- painting ---------------------------------------------------------------
const TOOLS = [
  { id: 'low', label: 'Low island' },
  { id: 'tall', label: 'Tall island' },
  { id: 'shoal', label: 'Shoal' },
  { id: 'anchorage', label: 'Anchorage' },
  { id: 'water', label: 'Clear' },
  { id: 'ship', label: 'Ship' },
  { id: 'select', label: 'Select' },
];

function onPick(cell, ev) {
  const { q, r } = cell;
  if (!inBounds(level, q, r)) return;
  const existing = shipAt(level, q, r);

  if (tool === 'select' || (existing && tool !== 'water')) {
    if (existing) { chart.select(existing); paintShipPanel(); return; }
  }
  const drop = list => { const i = list.findIndex(c => c.q === q && c.r === r); if (i >= 0) list.splice(i, 1); };

  if (tool === 'water') {
    drop(level.map.islands); drop(level.map.water);
    if (existing) { level.ships.splice(level.ships.indexOf(existing), 1); chart.select(null); paintShipPanel(); }
  } else if (tool === 'low' || tool === 'tall') {
    if (existing) return;                       // land under a ship is a level that cannot start
    drop(level.map.islands); drop(level.map.water);
    level.map.islands.push({ q, r, height: tool });
  } else if (tool === 'shoal' || tool === 'anchorage') {
    drop(level.map.islands); drop(level.map.water);
    level.map.water.push({ q, r, depth: tool });
  } else if (tool === 'ship') {
    if (existing || islandAt(level, q, r)) return;
    const first = !level.ships.length;
    const s = {
      type: first ? 'sloop' : 'guardacosta',
      side: first ? 'friendly' : 'hostile',
      role: first ? 'player' : 'enemy',
      ai: first ? null : 'engage',
      name: first ? 'Alacrity' : 'Unnamed', personality: 'professional',
      q, r, facing: 0, anchor: 'up', stats: {},
    };
    level.ships.push(s);
    chart.select(s);
    paintShipPanel();
  }
  chart.draw();
  touched();
}

// --- panels -----------------------------------------------------------------
function option(value, label, selected) {
  const o = document.createElement('option');
  o.value = value; o.textContent = label;
  if (selected) o.selected = true;
  return o;
}

function paintTools() {
  const box = $('tools');
  box.innerHTML = '';
  for (const t of TOOLS) {
    const b = document.createElement('button');
    b.textContent = t.label;
    b.className = t.id === tool ? 'on' : '';
    b.addEventListener('click', () => { tool = t.id; paintTools(); paintToolHint(); });
    box.appendChild(b);
  }
}
function paintToolHint() {
  const text = {
    low: HEIGHTS.low, tall: HEIGHTS.tall, shoal: DEPTHS.shoal, anchorage: DEPTHS.anchorage,
    water: 'Clear a hex back to open water — and remove a ship standing on it.',
    ship: 'Click open water to place a ship. The first one you place is you.',
    select: 'Click a ship to select and edit her.',
  }[tool];
  $('toolHint').textContent = text;
}

function paintObjective() {
  const sel = $('fObjType');
  if (!sel.options.length) {
    for (const [id, o] of Object.entries(OBJECTIVES)) sel.appendChild(option(id, o.label));
    sel.addEventListener('change', () => {
      const spec = OBJECTIVES[sel.value];
      level.objective = Object.assign({ type: sel.value }, spec.fields);
      paintObjective(); touched();
    });
  }
  sel.value = level.objective.type;
  const box = $('objFields');
  box.innerHTML = '';
  for (const [k, v] of Object.entries(level.objective)) {
    if (k === 'type') continue;
    const lab = document.createElement('label');
    lab.textContent = k.replace(/([A-Z])/g, ' $1').toLowerCase() + ' ';
    const inp = document.createElement('input');
    inp.type = 'number'; inp.value = v; inp.min = 1;
    inp.addEventListener('input', () => { level.objective[k] = Number(inp.value); touched(); });
    lab.appendChild(inp);
    box.appendChild(lab);
  }
}

function paintShipPanel() {
  const s = chart.selected;
  $('shipEmpty').hidden = !!s;
  $('shipFields').hidden = !s;
  if (!s) return;
  const type = $('sType');
  if (!type.options.length) for (const t of shipClasses()) type.appendChild(option(t.id, t.name));
  type.value = s.type;
  $('sName').value = s.name;
  const side = $('sSide');
  if (!side.options.length) { side.appendChild(option('friendly', 'friendly')); side.appendChild(option('hostile', 'hostile')); }
  side.value = s.side;
  const role = $('sRole');
  if (!role.options.length) for (const r of ROLES) role.appendChild(option(r, r));
  role.value = s.role;
  const person = $('sPersonality');
  if (!person.options.length) {
    for (const p of Object.values(PERSONALITIES)) person.appendChild(option(p.id, p.name + ' — ' + p.tell));
  }
  person.value = s.personality || 'professional';
  const ai = $('sAi');
  if (!ai.options.length) { ai.appendChild(option('', '— none (you) —')); for (const m of MOODS) ai.appendChild(option(m, m)); }
  ai.value = s.ai || '';
  $('sAnchor').checked = s.anchor === 'down';
  const face = $('sFacing');
  face.innerHTML = '';
  for (let f = 0; f < 6; f++) {
    const b = document.createElement('button');
    b.textContent = WIND_NAMES[f];
    b.className = s.facing === f ? 'on' : '';
    b.addEventListener('click', () => { s.facing = f; paintShipPanel(); chart.draw(); touched(); });
    face.appendChild(b);
  }
  for (const [id, key] of [['stHull', 'hull'], ['stRig', 'rigging'], ['stCrew', 'crew'], ['stQuality', 'quality']]) {
    $(id).value = s.stats && s.stats[key] != null ? s.stats[key] : '';
  }
}

// --- wiring -----------------------------------------------------------------
function bind(id, get, set, event = 'input') {
  const el = $(id);
  el.addEventListener(event, () => { set(el); chart.fit(); chart.draw(); touched(); });
  return () => { const v = get(); if (el.type === 'checkbox') el.checked = v; else el.value = v; };
}

const refreshers = [
  bind('fId', () => level.id, el => level.id = el.value.trim().replace(/\s+/g, '-')),
  bind('fName', () => level.name, el => level.name = el.value),
  bind('fCols', () => level.map.cols, el => level.map.cols = clampInt(el.value, 5, 20)),
  bind('fRows', () => level.map.rows, el => level.map.rows = clampInt(el.value, 5, 20)),
  bind('fScroll', () => level.map.scroll, el => level.map.scroll = el.checked, 'change'),
  bind('fShift', () => level.map.wind.shiftEvery, el => level.map.wind.shiftEvery = clampInt(el.value, 1, 12)),
  bind('fBriefing', () => level.briefing, el => level.briefing = el.value),
  bind('fWindFrom', () => level.map.wind.from, el => level.map.wind.from = Number(el.value), 'change'),
  bind('fWindSpeed', () => level.map.wind.speed, el => level.map.wind.speed = Number(el.value), 'change'),
];
const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, parseInt(v, 10) || lo));

for (const [id, key] of [['sType', 'type'], ['sName', 'name'], ['sSide', 'side'], ['sRole', 'role'], ['sAi', 'ai'], ['sPersonality', 'personality']]) {
  $(id).addEventListener(id === 'sName' ? 'input' : 'change', () => {
    const s = chart.selected; if (!s) return;
    s[key] = $(id).value || null;
    chart.draw(); paintShipPanel(); touched();
  });
}
$('sAnchor').addEventListener('change', () => {
  const s = chart.selected; if (!s) return;
  s.anchor = $('sAnchor').checked ? 'down' : 'up';
  chart.draw(); touched();
});
for (const [id, key] of [['stHull', 'hull'], ['stRig', 'rigging'], ['stCrew', 'crew'], ['stQuality', 'quality']]) {
  $(id).addEventListener('input', () => {
    const s = chart.selected; if (!s) return;
    s.stats = s.stats || {};
    const v = $(id).value;
    if (v === '') delete s.stats[key]; else s.stats[key] = Number(v);
    touched();
  });
}
$('sDelete').addEventListener('click', () => {
  const s = chart.selected; if (!s) return;
  level.ships.splice(level.ships.indexOf(s), 1);
  chart.select(null); paintShipPanel(); chart.draw(); touched();
});

function fillWindSelects() {
  const from = $('fWindFrom');
  if (!from.options.length) WIND_NAMES.forEach((n, i) => from.appendChild(option(i, n)));
  const sp = $('fWindSpeed');
  if (!sp.options.length) {
    sp.appendChild(option(1, 'Light airs'));
    sp.appendChild(option(2, 'Moderate breeze'));
    sp.appendChild(option(3, 'Fresh gale'));
  }
}

// --- the note line: what is wrong with this level right now ------------------
function touched() {
  const problems = validate(level);
  const note = $('note');
  note.textContent = problems.length ? problems[0] : 'Ready to test';
  note.style.color = problems.length ? 'var(--signal)' : 'var(--ink-dim)';
  $('btnPlaytest').disabled = problems.length > 0;
}

// --- export and playtest -----------------------------------------------------
function sheet(title, body) {
  $('sheetTitle').textContent = title;
  $('sheetBody').textContent = body;
  $('sheet').hidden = false;
}
$('btnClose').addEventListener('click', () => { $('sheet').hidden = true; });
$('btnCopy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('sheetBody').textContent);
    $('btnCopy').textContent = 'Copied';
    setTimeout(() => { $('btnCopy').textContent = 'Copy'; }, 1200);
  } catch (e) { /* clipboard blocked — the text is on screen to select */ }
});
$('btnDownload').addEventListener('click', () => {
  const blob = new Blob([toFile(level)], { type: 'text/javascript' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = level.id + '.js';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('btnExport').addEventListener('click', () => {
  sheet('Save as levels/' + level.id + '.js',
    toFile(level) +
    '\n// Then add it to levels/index.js:\n' +
    "//   import " + level.id.replace(/\W/g, '') + " from './" + level.id + ".js';\n" +
    '//   ...and a line in the SCENARIOS list, in play order.\n');
});
$('btnPlaytest').addEventListener('click', async () => {
  $('btnPlaytest').disabled = true;
  $('btnPlaytest').textContent = 'Playing…';
  const report = await playtest(level, 60);
  $('btnPlaytest').textContent = 'Play it 60 times';
  $('btnPlaytest').disabled = false;
  sheet('60 games, played by the rules themselves', report);
});

// --- opening a level that already exists ------------------------------------
// The levels are plain modules, so the editor imports them rather than parsing
// anything. A named chart is copied in whole, because the editor edits water,
// not references to water.
async function fillOpen() {
  const [{ SCENARIOS }, { mapById }] = await Promise.all([
    import('../../levels/index.js'),
    import('../data/maps.js'),
  ]);
  const sel = $('fOpen');
  sel.appendChild(option('', 'Open a level…'));
  for (const sc of SCENARIOS) sel.appendChild(option(sc.id, sc.name));
  sel.addEventListener('change', () => {
    const sc = SCENARIOS.find(x => x.id === sel.value);
    sel.value = '';
    if (!sc) return;
    const map = mapById(sc.map);
    level = {
      id: sc.id, name: sc.name,
      map: {
        cols: map.cols, rows: map.rows, scroll: !!map.scroll,
        wind: Object.assign({ from: 0, speed: 2, shiftEvery: 3 }, map.wind),
        islands: (map.islands || []).map(c => ({ ...c })),
        water: (map.water || []).map(c => ({ ...c })),
      },
      objective: { ...sc.objective },
      briefing: sc.briefing || '',
      ships: sc.ships.map(sh => ({
        type: sh.type, side: sh.side, role: sh.role, ai: sh.ai || null,
        name: sh.name, q: sh.q, r: sh.r, facing: sh.facing || 0,
        personality: sh.personality || 'professional',
        anchor: sh.anchor || 'up', stats: { ...(sh.stats || {}) },
      })),
    };
    chart.select(null);
    for (const r of refreshers) r();
    paintObjective(); paintShipPanel(); chart.fit(); chart.draw(); touched();
  });
}

// --- boot --------------------------------------------------------------------
fillWindSelects();
fillOpen();
paintTools();
paintToolHint();
paintObjective();
paintShipPanel();
for (const r of refreshers) r();
chart.fit();
chart.draw();
touched();
window.addEventListener('resize', () => { chart.fit(); chart.draw(); });
window.__editor = { get level() { return level; }, set level(v) { level = v; }, chart, toFile };
