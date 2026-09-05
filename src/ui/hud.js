import { dist } from '../core/hex.js';
import { personalityOf } from '../data/personalities.js';
import { ATT_NAMES, windLabel } from '../core/wind.js';
import { isLoaded, mountsOf, shortHanded } from '../core/ship.js';
import { gunType } from '../data/ships.js';

// Ship cards are built from the scenario, so a two-ship duel and a four-ship
// convoy action both lay themselves out without special cases.
export function createHud(shipsEl, turnEl, game) {
  let cards = new Map();

  // The ship sheet: everything the card has no room for. Your own ship shows
  // her charges and reloads; an enemy shows only what a glass would show.
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  const inner = document.createElement('div');
  inner.className = 'inner';
  sheet.appendChild(inner);
  document.body.appendChild(sheet);
  sheet.addEventListener('pointerdown', () => sheet.classList.remove('show'));

  const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function describeArcs(arcs) {
    const w = [];
    if (arcs.includes(0)) w.push('dead ahead');
    if (arcs.includes(1) || arcs.includes(2)) w.push('starboard');
    if (arcs.includes(3)) w.push('astern');
    if (arcs.includes(4) || arcs.includes(5)) w.push('port');
    return w.join(' & ');
  }
  function openSheet(s) {
    const t = s.type;
    const q = s.quality >= 1.1 ? 'crack' : s.quality >= 1 ? 'able' : 'green';
    const speeds = t.speeds.map((v, i) => ATT_NAMES[i] + ' ' + v).join(' · ');
    const mounts = mountsOf(s).map(([id, m]) => {
      const g = gunType(m.gun);
      const state = !s.isYou ? ''
        : isLoaded(s, id) ? ' — loaded: ' + s.guns[id].shot
        : ' — reloading, ' + s.guns[id].reload + ' turn' + (s.guns[id].reload === 1 ? '' : 's');
      return '<div class="mount">' + esc(m.label) + ' · ' + esc(g.name) +
        (m.chaser ? ' <span class="dim">(fires with the broadside)</span>' : '') +
        '<br><span class="dim">bears ' + describeArcs(m.arcs) + esc(state) + '</span></div>';
    }).join('');
    const hands = ['full complement', 'short-handed — reloads drag', 'skeleton crew — cannot carry full sail'][shortHanded(s)];
    inner.innerHTML =
      '<h3>' + esc(s.name) + ' · ' + esc(t.name) + '</h3>' +
      '<div>' + (t.rig === 'fa' ? 'fore-and-aft rig' : 'square rig') + ' · ' + esc(t.draught) + ' draught · ' + q + ' crew</div>' +
      '<div class="dim">' + speeds + ' <span>(hexes by point of sail)</span></div>' +
      '<div class="dim">helm ' + t.turnMax + ' point' + (t.turnMax === 1 ? '' : 's') + ' a turn · tacks ' + Math.round(t.tackOdds * 100) + '%</div>' +
      // What kind of fight she is looking for. Knowing it is what makes the
      // choice of how to meet her a decision rather than a surprise.
      (s.isYou ? '' : '<div class="tell">' + esc(personalityOf(s.personality).tell) + '</div>') +
      '<div class="mounts">' + mounts + '</div>' +
      '<div class="cond">hull ' + s.hull + '/' + s.hullMax + ' · rigging ' + s.rigging + '/' + s.rigMax + ' · crew ' + s.crew + '/' + s.crewMax + '</div>' +
      '<div class="dim">' + hands + (s.rudderJam > 0 ? ' · rudder fouled' : '') + (s.grounded ? ' · aground' : s.anchor !== 'up' ? ' · at anchor' : '') + '</div>' +
      '<div class="dim closehint">tap anywhere to close</div>';
    sheet.classList.add('show');
  }

  function build(ctx) {
    shipsEl.innerHTML = '';
    cards = new Map();
    for (const s of ctx.ships) {
      const cls = s.isYou ? 'you' : s.side === 'friendly' ? 'ward' : 'foe';
      const card = document.createElement('div');
      card.className = 'card ' + cls;
      card.innerHTML =
        '<div class="name"></div>' +
        ['Hull', 'Rig', 'Crew'].map(l =>
          '<div class="bar"><span class="lb"><span class="lb-full">' + l +
          '</span><span class="lb-abbr">' + l[0] + '</span></span><div class="track">' +
          '<div class="fill" data-k="' + l.toLowerCase() + '"></div></div></div>').join('');
      card.querySelector('.name').textContent = s.name + ' · ' + s.type.short;
      card.addEventListener('pointerdown', () => {
        const ctx2 = game.state();
        if (ctx2 && !ctx2.busy) openSheet(s);
      });
      shipsEl.appendChild(card);
      cards.set(s.uid, card);
    }
  }

  function refresh(ctx) {
    if (cards.size !== ctx.ships.length) build(ctx);
    for (const s of ctx.ships) {
      const card = cards.get(s.uid);
      if (!card) continue;
      const seen = s.isYou || game.visibleTo(ctx.you, s);
      card.classList.toggle('hidden-ship', !seen);
      card.classList.toggle('struck', s.struck);
      const set = (k, v, m) => { card.querySelector('[data-k="' + k + '"]').style.width = Math.max(0, 100 * v / m) + '%'; };
      set('hull', s.hull, s.hullMax);
      set('rig', s.rigging, s.rigMax);
      set('crew', s.crew, s.crewMax);
    }
    const obj = ctx.scenario.objective || {};
    const clock = obj.turnLimit ? ' / ' + obj.turnLimit : '';
    // Which action you are sailing, above the turn and the weather. You can
    // start one from the level list days later and have no idea which it was.
    turnEl.innerHTML = '';
    const name = document.createElement('div');
    name.className = 'level-name';
    name.textContent = ctx.scenario.name;
    const line = document.createElement('div');
    line.className = 'turn-line';
    line.textContent = 'Turn ' + ctx.turn + clock + ' · ' + windLabel(ctx.wind);
    turnEl.append(name, line);
  }

  return { build, refresh };
}
