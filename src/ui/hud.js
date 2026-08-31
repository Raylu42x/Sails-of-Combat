import { dist } from '../core/hex.js';
import { windLabel } from '../core/wind.js';

// Ship cards are built from the scenario, so a two-ship duel and a four-ship
// convoy action both lay themselves out without special cases.
export function createHud(shipsEl, turnEl, game) {
  let cards = new Map();

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
          '<div class="bar"><span class="lb">' + l + '</span><div class="track">' +
          '<div class="fill" data-k="' + l.toLowerCase() + '"></div></div></div>').join('');
      card.querySelector('.name').textContent = s.name + ' · ' + s.type.short;
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
    turnEl.textContent = 'Turn ' + ctx.turn + clock + ' · ' + windLabel(ctx.wind);
  }

  return { build, refresh };
}
