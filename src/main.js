import { createGame } from './core/game.js';
import { createRenderer } from './render/renderer.js';
import { createHud } from './ui/hud.js';
import { createLog } from './ui/log.js';
import { createOrders } from './ui/orders.js';
import { createBanner } from './ui/banner.js';
import { createReference } from './ui/reference.js';
import { watchForUpdates } from './ui/updates.js';
import { decodeReplay, runReplay } from './core/replay.js';
import { createLayers } from './ui/layers.js';
import { sfx } from './audio/sfx.js';

const canvas = document.getElementById('sea');
const box = document.getElementById('boardBox');
const execBtn = document.getElementById('exec');

// The renderer needs the game (to read state) and the game needs the renderer
// (to play animations), so the view is handed over through a small relay.
let renderer = null;
const view = {
  pause: ms => renderer.view.pause(ms),
  animateMoves: (...a) => renderer.view.animateMoves(...a),
  animateShot: (...a) => renderer.view.animateShot(...a),
  melee: (...a) => renderer.view.melee(...a),
};

const game = createGame(view);
const layers = createLayers(box, () => renderer.draw());
renderer = createRenderer(canvas, box, game, layers);

const logView = createLog(document.getElementById('log'));
const hud = createHud(document.getElementById('ships'), document.getElementById('turnLabel'), game);
const orders = createOrders(document, document.getElementById('hint'), game, refresh);
const banner = createBanner(document.getElementById('banner'), startScenario,
  () => location.origin + location.pathname + '#r=' + game.replayString(),
  debugReport);

// Everything needed to reproduce and reason about a bug, as pasteable text:
// which build, which level, the whole world state, the replay, and the log.
function debugReport() {
  const ctx = game.state();
  if (!ctx) return 'no action running';
  const ships = ctx.ships.map(s =>
    s.name + ' (' + s.type.id + ') hull ' + s.hull + '/' + s.hullMax +
    ' rig ' + s.rigging + '/' + s.rigMax + ' crew ' + s.crew + '/' + s.crewMax +
    ' q' + s.quality + ' @' + s.q + ',' + s.r + ' f' + s.facing +
    (s.struck ? ' STRUCK' : '') + (s.taken ? ' TAKEN' : '') +
    (s.grappledTo ? ' GRAPPLED' : '') + (s.offBoard ? ' OFFBOARD' : ''));
  return [
    '### Sails of Combat report',
    'build: ' + document.lastModified + ' · ' + navigator.userAgent,
    'level: ' + ctx.scenario.id + ' · turn ' + ctx.turn +
      ' · wind from ' + ctx.wind.from + ' speed ' + ctx.wind.speed +
      (ctx.over ? ' · OVER' : ''),
    'replay: ' + location.origin + location.pathname + '#r=' + game.replayString(),
    '',
    'ships:', ...ships,
    '',
    'log:', ...logView.history().map(l => l.msg),
  ].join('\n');
}

function refresh() {
  const ctx = game.state();
  if (!ctx) return;
  hud.refresh(ctx);
  orders.refresh(ctx);
  renderer.draw();
}

game.on('log', ({ msg, cls }) => logView.write(msg, cls));
game.on('reset', ctx => {
  layers.describe(ctx);
  logView.clear();
  renderer.clearMemory();
  hud.build(ctx);
  renderer.resize();
});
game.on('change', refresh);
game.on('busy', busy => { execBtn.disabled = busy || game.state().over; });
game.on('finished', v => banner.showVerdict(v, logView.history()));
game.on('turn', () => sfx.bell());
game.on('struck', () => sfx.strike());
game.on('grappled', () => sfx.grapple());

function startScenario(id) {
  game.start(id);
  banner.setCurrent(game.state().scenario);
  execBtn.disabled = false;
  refresh();
}

execBtn.addEventListener('pointerdown', () => { sfx.wake(); game.execute(); });

// Offered only once nothing is left to fight and a beaten ship is still within
// reach: lay alongside and man her, or break off and leave her where she lies.
const endBtn = document.getElementById('endAction');
endBtn.addEventListener('pointerdown', () => { sfx.click(); game.endAction(); });
game.on('change', () => {
  const prize = game.fightOver() ? game.prizeWaiting() : null;
  endBtn.hidden = !prize;
  if (prize) endBtn.title = 'Break off and leave ' + prize.name + ' where she lies';
});
// LEVELS opens the picker over the action: abandon it, restart it, or go back.
watchForUpdates();
const reference = createReference(document.body);
document.getElementById('help').addEventListener('pointerdown', ev => { ev.stopPropagation(); reference.toggle(); });

document.getElementById('restart').addEventListener('pointerdown', () => {
  const ctx = game.state();
  if (!ctx || ctx.busy) return;
  sfx.click();
  banner.showPicker();
});

const muteBtn = document.getElementById('mute');
const paintMute = () => {
  muteBtn.textContent = sfx.muted ? '♪̸' : '♪';
  muteBtn.classList.toggle('off', sfx.muted);
};
muteBtn.addEventListener('pointerdown', () => { sfx.toggleMute(); if (!sfx.muted) sfx.click(); paintMute(); });
paintMute();

// Audio cannot start until the user has touched the page.
window.addEventListener('pointerdown', () => sfx.wake(), { once: true });

// Setting canvas.width clears the bitmap, so redraw in the same frame as the
// resize — a debounce here leaves the chart blank while the window settles.
let resizePending = false;
const onResize = () => {
  if (resizePending) return;
  resizePending = true;
  requestAnimationFrame(() => { resizePending = false; renderer.resize(); refresh(); });
};
// A burning ship must keep flickering while the player decides what to do
// about it, so idle turns still need frames.
(function idleFlames() {
  const ctx = game.state();
  if (ctx && !ctx.busy && (ctx.ships.some(s => s.fire && !s.struck) || (ctx.marksLeft || []).length)) renderer.draw();
  requestAnimationFrame(idleFlames);
})();

window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);

// Boot: set the first scenario up behind the briefing so the chart is drawn.
// A link with a fight in it opens that fight, not the menu.
// A link with a fight in it opens that fight rather than the menu: the seed and
// the orders are the whole action, so it plays out exactly as it was sailed.
const shared = decodeReplay(new URLSearchParams(location.hash.slice(1)).get('r') || '');
game.start(shared ? shared.levelId : banner.pending.id, shared ? shared.seed : undefined);
renderer.resize();
refresh();
if (shared) {
  banner.hide();
  logView.write('Replaying a recorded action — ' + shared.turns.length + ' turns.', 'turnhead');
  runReplay(game, shared)
    .catch(() => logView.write('That replay does not match this version of the game.', 'big'));
} else {
  banner.showBriefing(banner.pending);
}

// Keyboard orders: the helm on the arrows, shot on the number keys, space to
// give the order. Cheap to add, and the whole game becomes playable one-handed.
const SHOT_KEYS = { '1': 'round', '2': 'chain', '3': 'grape', '4': 'double', '5': 'hold' };
window.addEventListener('keydown', ev => {
  const ctx = game.state();
  if (!ctx || ev.metaKey || ev.ctrlKey || ev.altKey) return;
  const banner = document.getElementById('banner');
  if (banner.classList.contains('show')) return;
  const orders = game.getOrders();
  let handled = true;
  switch (ev.key) {
    case 'ArrowLeft':  game.setOrder('helm', String(Math.max(-ctx.you.turnMax, orders.helm - 1))); break;
    case 'ArrowRight': game.setOrder('helm', String(Math.min(ctx.you.turnMax, orders.helm + 1))); break;
    case 'ArrowUp':    game.setOrder('sails', orders.sails === 'takein' ? 'battle' : 'full'); break;
    case 'ArrowDown':  game.setOrder('sails', orders.sails === 'full' ? 'battle' : 'takein'); break;
    case ' ': case 'Enter': if (!execBtn.disabled) { sfx.wake(); game.execute(); } break;
    case 'l': case 'L': if (!ctx.busy) banner_showPicker(); break;
    case 'm': case 'M': sfx.toggleMute(); paintMute(); break;
    case '?': case '/': reference.toggle(); break;
    case 'd': case 'D': layers.toggle('depth'); break;
    case 'g': case 'G': layers.toggle('arcs'); break;
    default:
      if (SHOT_KEYS[ev.key]) game.setOrder('shot', SHOT_KEYS[ev.key]);
      else handled = false;
  }
  if (handled) { ev.preventDefault(); refresh(); }
});
const banner_showPicker = () => banner.showPicker();

// Debug handle: `__soc.game.state()` in the console while testing.
window.__soc = { game, renderer };
