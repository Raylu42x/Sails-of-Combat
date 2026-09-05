// Keeps the running page honest about its own version. The service worker makes
// a mixed set of modules impossible; this tells the player when the set they
// are running has been superseded, rather than leaving them to wonder.
export function watchForUpdates() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;

  // Registration happens in index.html, outside the module graph, so a
  // broken deploy can still install the worker that will heal it.

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    // A new worker took over mid-session. The page is still running the old
    // modules, so offer the reload rather than pulling it out from under them.
    show();
  });
}

function show() {
  if (document.getElementById('updateBar')) return;
  const bar = document.createElement('div');
  bar.id = 'updateBar';
  bar.className = 'update-bar';
  bar.innerHTML = '<span>A newer build of the game is ready.</span>';
  const btn = document.createElement('button');
  btn.textContent = 'Reload';
  btn.addEventListener('pointerdown', () => location.reload());
  const dismiss = document.createElement('button');
  dismiss.className = 'quiet';
  dismiss.textContent = 'Later';
  dismiss.addEventListener('pointerdown', () => bar.remove());
  bar.append(btn, dismiss);
  document.body.appendChild(bar);
}
