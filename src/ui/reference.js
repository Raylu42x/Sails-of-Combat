// The manual, on one screen, reachable mid-action. The README explains all of
// this and nobody reads a README with a guarda costa crossing their stern.
const SECTIONS = [
  ['The wind', [
    ['Points of sail', 'In irons (dead into the wind) she stops. Close-hauled is slow, reaching is fastest, running before the wind is slower than reaching — the forecast line under the chart always says which you are on and what it is worth.'],
    ['Tacking', 'Turning through the eye of the wind. A fore-and-aft rig usually makes it; a square rig often misses stays and hangs in irons.'],
    ['The rose', 'Top left of the chart. The arrow flies with the wind, so it points where the wind is going.'],
  ]],
  ['Sails', [
    ['Full', 'Fastest — and the gun crews go aloft, so the guns stay silent.'],
    ['Battle', 'The fighting sail.'],
    ['Take in', 'Slow, but the topmen knot and splice: rigging repairs.'],
  ]],
  ['Guns', [
    ['Round', 'Hulls her, and the splinter storm off the inside of her timbers is what kills her people.'],
    ['Chain', 'Cuts rigging. Slows her, and a dismasted ship cannot run.'],
    ['Grape', 'Sweeps her deck. Close range only, and what you load before boarding.'],
    ['Double', 'Two balls: brutal, short-ranged, wild, and slow to reload.'],
    ['Charges', 'A loaded gun cannot fire a different shot. Order another kind and the crews draw the charge — one turn, two for double — and only for a battery that has something in range.'],
    ['As she bears', 'Each battery has its own arc and its own reload clock. Bow and stern chasers fire in the same turn as a broadside.'],
    ['Range', 'There were no sights. Point blank is nearly certain, three hexes is a lottery.'],
    ['Raking', 'Firing down her length. Across her bow is 1.5×; across her stern is 2× and may shoot her rudder away.'],
  ]],
  ['The sea floor', [
    ['Soundings', 'Tinted water is shallow. Broken water is a shoal — crossing it with way on risks going aground.'],
    ['Draught', 'A sloop draws little and can run over a bank a frigate dare not follow across.'],
    ['Anchoring', 'Only where the lead finds bottom. Weighing again costs a turn.'],
  ]],
  ['Closing', [
    ['Grappling', 'Only alongside. She sheers off if she still has way on her, so cripple her rigging first — the button tells you the odds.'],
    ['Boarding', 'A running fight for the deck. The bar shows who holds it; carry it and she is yours. Swivels loaded with grape are worth a quarter of the fight, hers as much as yours.'],
    ['Prizes', 'A beaten ship is worth nothing until you put hands aboard her — and a battered hull fetches less, which is why you fire at rigging when you want her whole.'],
  ]],
  ['Trouble', [
    ['Fire', 'It spreads if it is not fought, and fighting it costs you the turn’s gunnery. If it reaches the magazine there is nothing left of her.'],
    ['In irons', 'Head to wind with no way on. She drifts to leeward until you get her head round.'],
    ['Aground', 'She will not move until she warps off. Take in sail and hope.'],
  ]],
];

export function createReference(root) {
  const el = document.createElement('div');
  el.className = 'reference';
  el.hidden = true;
  const inner = document.createElement('div');
  inner.className = 'ref-inner';
  inner.innerHTML = '<h2>The vocabulary</h2>' + SECTIONS.map(([title, rows]) =>
    '<section><h3>' + title + '</h3>' + rows.map(([k, v]) =>
      '<div class="ref-row"><span class="ref-k">' + k + '</span><span class="ref-v">' + v + '</span></div>'
    ).join('') + '</section>').join('') +
    '<p class="ref-close">Tap anywhere to close</p>';
  el.appendChild(inner);
  el.addEventListener('pointerdown', () => { el.hidden = true; });
  root.appendChild(el);
  return {
    toggle() { el.hidden = !el.hidden; },
    open() { el.hidden = false; },
    get isOpen() { return !el.hidden; },
  };
}
