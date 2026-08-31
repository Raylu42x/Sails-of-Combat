import { SCENARIOS } from '../data/scenarios.js';
import { sfx } from '../audio/sfx.js';

// One overlay, three modes:
//   briefing — before an action, with the level picker above it
//   verdict  — after one
//   picker   — opened mid-action from LEVELS, so a fight can be abandoned or
//              restarted without reloading the page
export function createBanner(el, onStart) {
  const titleEl = el.querySelector('#bTitle');
  const textEl = el.querySelector('#bText');
  const listEl = el.querySelector('#bList');
  const btn = el.querySelector('#bBtn');
  const altBtn = el.querySelector('#bAlt');
  let pending = SCENARIOS[0];
  let current = SCENARIOS[0];
  let mode = 'briefing';

  function renderList() {
    listEl.innerHTML = '';
    for (const sc of SCENARIOS) {
      const b = document.createElement('button');
      b.className = 'pick' + (sc.id === pending.id ? ' on' : '');
      b.textContent = sc.name;
      if (sc.id === current.id && mode === 'picker') b.title = 'The action you are in';
      b.addEventListener('pointerdown', () => { sfx.click(); showBriefing(sc); });
      listEl.appendChild(b);
    }
  }

  function show() {
    renderList();
    el.classList.add('show');
  }

  function showBriefing(sc) {
    pending = sc;
    mode = 'briefing';
    titleEl.textContent = sc.name;
    titleEl.style.color = 'var(--brass)';
    textEl.textContent = sc.briefing;
    btn.textContent = sc.id === current.id ? 'Take command' : 'Take command';
    altBtn.textContent = 'Resume action';
    altBtn.style.display = el.dataset.inAction === '1' ? '' : 'none';
    show();
  }

  function showVerdict(v) {
    mode = 'verdict';
    el.dataset.inAction = '0';
    titleEl.textContent = v.title;
    titleEl.style.color = v.won ? 'var(--brass)' : v.draw ? 'var(--ink)' : 'var(--signal)';
    textEl.textContent = v.text;
    btn.textContent = 'Sail again';
    altBtn.style.display = 'none';
    show();
  }

  // Mid-action: pick another level, restart this one, or go back to it.
  function showPicker() {
    mode = 'picker';
    el.dataset.inAction = '1';
    pending = current;
    titleEl.textContent = 'Levels';
    titleEl.style.color = 'var(--ink)';
    textEl.textContent = 'Choose an action to sail, or resume the one you are in. ' +
      'Choosing the level you are already sailing starts it again from the beginning.';
    btn.textContent = 'Restart this action';
    altBtn.textContent = 'Resume action';
    altBtn.style.display = '';
    show();
  }

  const hide = () => el.classList.remove('show');

  btn.addEventListener('pointerdown', () => {
    sfx.wake();
    current = pending;
    el.dataset.inAction = '1';
    hide();
    onStart(pending.id);
  });
  altBtn.addEventListener('pointerdown', () => { sfx.click(); hide(); });

  return {
    showBriefing, showVerdict, showPicker, hide,
    get pending() { return pending; },
    setCurrent(sc) { current = sc; },
  };
}
