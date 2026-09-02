// The captain's log — one line per thing that happened.
//
// The window is small and a turn can produce a dozen lines, so things that
// resolve early (letting go an anchor, catting it again) were scrolled away by
// the gunnery before anyone read them. Tapping the log opens the whole action.
export function createLog(el) {
  const lines = [];

  const overlay = document.createElement('div');
  overlay.className = 'logfull';
  const inner = document.createElement('div');
  inner.className = 'inner';
  overlay.appendChild(inner);
  overlay.addEventListener('pointerdown', () => overlay.classList.remove('show'));
  document.body.appendChild(overlay);

  el.title = 'Tap for the whole action';
  el.addEventListener('pointerdown', () => {
    inner.innerHTML = '';
    for (const l of lines) {
      const d = document.createElement('div');
      if (l.cls) d.className = l.cls;
      d.textContent = l.msg;
      inner.appendChild(d);
    }
    const foot = document.createElement('div');
    foot.className = 'closehint';
    foot.textContent = 'tap anywhere to close';
    inner.appendChild(foot);
    overlay.classList.add('show');
    inner.scrollTop = inner.scrollHeight;
  });

  return {
    history() { return lines.slice(); },
    clear() { lines.length = 0; el.innerHTML = ''; },
    write(msg, cls) {
      lines.push({ msg, cls });
      const d = document.createElement('div');
      if (cls) d.className = cls;
      d.textContent = msg;
      el.appendChild(d);
      el.scrollTop = el.scrollHeight;
    },
  };
}
