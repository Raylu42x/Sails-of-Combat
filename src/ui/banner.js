import { SCENARIOS } from '../data/scenarios.js';

// One overlay does three jobs: the scenario picker, the briefing, and the
// verdict at the end of the action.
export function createBanner(el, onStart) {
  const titleEl = el.querySelector('#bTitle');
  const textEl = el.querySelector('#bText');
  const listEl = el.querySelector('#bList');
  const btn = el.querySelector('#bBtn');
  let pending = SCENARIOS[0];

  function renderList(activeId) {
    listEl.innerHTML = '';
    for (const sc of SCENARIOS) {
      const b = document.createElement('button');
      b.className = 'pick' + (sc.id === activeId ? ' on' : '');
      b.textContent = sc.name;
      b.addEventListener('pointerdown', () => { pending = sc; showBriefing(sc); });
      listEl.appendChild(b);
    }
  }

  function showBriefing(sc) {
    pending = sc;
    titleEl.textContent = sc.name;
    titleEl.style.color = 'var(--brass)';
    textEl.textContent = sc.briefing;
    listEl.style.display = 'flex';
    renderList(sc.id);
    btn.textContent = 'Take command';
    el.classList.add('show');
  }

  function showVerdict(v) {
    titleEl.textContent = v.title;
    titleEl.style.color = v.won ? 'var(--brass)' : v.draw ? 'var(--ink)' : 'var(--signal)';
    textEl.textContent = v.text;
    listEl.style.display = 'flex';
    renderList(pending.id);
    btn.textContent = 'Sail again';
    el.classList.add('show');
  }

  const hide = () => el.classList.remove('show');
  btn.addEventListener('pointerdown', () => { hide(); onStart(pending.id); });

  return { showBriefing, showVerdict, hide, get pending() { return pending; } };
}
