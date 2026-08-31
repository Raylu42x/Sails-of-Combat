// The captain's log — one line per thing that happened.
export function createLog(el) {
  return {
    clear() { el.innerHTML = ''; },
    write(msg, cls) {
      const d = document.createElement('div');
      if (cls) d.className = cls;
      d.textContent = msg;
      el.appendChild(d);
      el.scrollTop = el.scrollHeight;
    },
  };
}
