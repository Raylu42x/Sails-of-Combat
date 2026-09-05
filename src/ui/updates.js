// Keeps the running page honest about its own version. The service worker makes
// a mixed set of modules impossible; this tells the player when the set they
// are running has been superseded, rather than leaving them to wonder.
export function watchForUpdates() {
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;

  // Registration happens in index.html, outside the module graph, so a
  // broken deploy can still install the worker that will heal it.

  if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      // A new worker took over mid-session. The page is still running the old
      // modules, so offer the reload rather than pulling it out from under them.
      show();
    });
  }

  // A pinned home-screen app RESUMES rather than reloads: the same page
  // instance can live for days while deploys pass it by, and network-first
  // fetching only helps at load time. So the page checks the server's deploy
  // stamp — a cache-proof HEAD of the site root — whenever it comes back to
  // the foreground and every ten minutes while it is there. A newer stamp at
  // a menu reloads on the spot; mid-action it offers the bar instead of
  // pulling the fight out from under the player.
  let baseline = null;
  const stamp = async () => {
    try {
      const res = await fetch('./?since=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
      return res.headers.get('last-modified') || res.headers.get('etag');
    } catch (e) { return null; /* offline: nothing to compare against */ }
  };
  const check = async () => {
    const now = await stamp();
    if (!now) return;
    if (!baseline) { baseline = now; return; }
    if (now === baseline) return;
    baseline = now;
    const banner = document.getElementById('banner');
    if (banner && banner.classList.contains('show')) location.reload();
    else show();
  };
  check();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  window.addEventListener('pageshow', ev => { if (ev.persisted) check(); });
  setInterval(() => { if (!document.hidden) check(); }, 10 * 60 * 1000);
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
