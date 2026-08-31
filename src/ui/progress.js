// Which actions have been won, kept in the browser between visits.
const KEY = 'soc.won';

function read() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); }
  catch (e) { return new Set(); }
}

let won = read();

export const progress = {
  has: id => won.has(id),
  all: () => new Set(won),
  record(id) {
    won.add(id);
    try { localStorage.setItem(KEY, JSON.stringify([...won])); } catch (e) { /* private mode */ }
  },
  clear() {
    won = new Set();
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  },
};
