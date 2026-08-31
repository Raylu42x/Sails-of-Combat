import { createGame } from './core/game.js';
import { createRenderer } from './render/renderer.js';
import { createHud } from './ui/hud.js';
import { createLog } from './ui/log.js';
import { createOrders } from './ui/orders.js';
import { createBanner } from './ui/banner.js';

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
renderer = createRenderer(canvas, box, game);

const logView = createLog(document.getElementById('log'));
const hud = createHud(document.getElementById('ships'), document.getElementById('turnLabel'), game);
const orders = createOrders(document, document.getElementById('hint'), game, refresh);
const banner = createBanner(document.getElementById('banner'), startScenario);

function refresh() {
  const ctx = game.state();
  if (!ctx) return;
  hud.refresh(ctx);
  orders.refresh(ctx);
  renderer.draw();
}

game.on('log', ({ msg, cls }) => logView.write(msg, cls));
game.on('reset', ctx => {
  logView.clear();
  renderer.clearMemory();
  hud.build(ctx);
  renderer.resize();
});
game.on('change', refresh);
game.on('busy', busy => { execBtn.disabled = busy || game.state().over; });
game.on('finished', v => banner.showVerdict(v));

function startScenario(id) {
  game.start(id);
  execBtn.disabled = false;
  refresh();
}

execBtn.addEventListener('pointerdown', () => game.execute());
document.getElementById('restart').addEventListener('pointerdown', () => {
  const ctx = game.state();
  if (!ctx || ctx.busy) return;
  startScenario(ctx.scenario.id);
});

let resizeTimer = null;
const onResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { renderer.resize(); refresh(); }, 60);
};
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);

// Boot: set the first scenario up behind the briefing so the chart is drawn.
game.start(banner.pending.id);
renderer.resize();
refresh();
banner.showBriefing(banner.pending);

// Debug handle: `__soc.game.state()` in the console while testing.
window.__soc = { game, renderer };
