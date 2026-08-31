// Random numbers live behind one door so a scenario can be seeded and replayed.
let impl = Math.random;

export function setSeed(seed) {
  if (seed === null || seed === undefined) { impl = Math.random; return; }
  let a = seed >>> 0;
  impl = function mulberry32() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rnd = () => impl();
export const chance = p => impl() < p;
export const randInt = n => Math.floor(impl() * n);
export const pick = arr => arr[randInt(arr.length)];
