import { SCENARIOS } from '../data/scenarios.js';
import { sfx } from '../audio/sfx.js';
import { progress } from './progress.js';

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
  // The two buttons swap jobs by mode, so the brass one is always the safe,
  // expected answer: take command before an action, resume during one.
  let primaryFn = () => {};
  let altFn = null;

  function renderList() {
    listEl.innerHTML = '';
    for (const sc of SCENARIOS) {
      const b = document.createElement('button');
      const done = progress.has(sc.id);
      b.className = 'pick' + (sc.id === pending.id ? ' on' : '') + (done ? ' won' : '');
      b.textContent = (done ? '✦ ' : '') + sc.name;
      if (done) b.title = 'Taken';
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
    btn.textContent = sc.id === current.id && el.dataset.inAction === '1'
      ? 'Begin again' : 'Take command';
    primaryFn = () => start(sc);
    altBtn.textContent = 'Resume action';
    altBtn.style.display = el.dataset.inAction === '1' ? '' : 'none';
    altFn = hide;
    show();
  }

  function showVerdict(v) {
    if (v.won) progress.record(current.id);
    mode = 'verdict';
    el.dataset.inAction = '0';
    titleEl.textContent = v.title;
    titleEl.style.color = v.won ? 'var(--brass)' : v.draw ? 'var(--ink)' : 'var(--signal)';
    textEl.textContent = v.text;
    btn.textContent = 'Sail again';
    primaryFn = () => start(pending);
    altBtn.style.display = 'none';
    altFn = null;
    show();
  }

  // Mid-action: pick another level, restart this one, or go back to it.
  function showPicker() {
    mode = 'picker';
    el.dataset.inAction = '1';
    pending = current;
    titleEl.textContent = 'Levels';
    titleEl.style.color = 'var(--ink)';
    textEl.textContent = 'Choose an action to sail — you will get its briefing before you commit. ' +
      'Nothing here abandons the action you are in unless you say so.';
    // Resume is the safe answer, so it is the one under your thumb.
    btn.textContent = 'Resume action';
    primaryFn = hide;
    altBtn.textContent = 'Begin ' + current.name + ' again';
    altBtn.style.display = '';
    altFn = () => start(current);
    show();
  }

  function hide() { el.classList.remove('show'); }

  function start(sc) {
    sfx.wake();
    pending = sc;
    current = sc;
    el.dataset.inAction = '1';
    hide();
    onStart(sc.id);
  }

  btn.addEventListener('pointerdown', () => { sfx.wake(); primaryFn(); });
  altBtn.addEventListener('pointerdown', () => { sfx.click(); if (altFn) altFn(); });

  return {
    showBriefing, showVerdict, showPicker, hide,
    get pending() { return pending; },
    setCurrent(sc) { current = sc; },
  };
}
