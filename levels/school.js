// Sailing School — the first level. No enemy, nothing shooting back: only the
// wind, four marks, and an old hulk moored for the gun crews to practise on.
//
// It teaches in the order the game asks for it: put the helm over, discover you
// cannot sail into the eye of the wind, find out that a reach is faster than
// running dead before it, and see what range does to gunnery.
export default {
  id: 'school',
  name: 'Sailing School',
  map: {
    cols: 11, rows: 11, scroll: false,
    wind: { from: 0, speed: 2, shiftEvery: 99 },   // a steady breeze while you learn
    islands: [],
    water: [],
  },
  objective: {
    type: 'marks',
    turnLimit: 32,
    // Laid round the start, one to each quarter, all well inside the chart so
    // a learner cannot sail into a corner and stick there.
    marks: [
      { q: 8, r: 1, label: 'A' },     // to leeward and across — an easy reach
      { q: 5, r: -1, label: 'B' },    // dead to windward: she will not point at it
      { q: 2, r: 4, label: 'C' },     // back across the wind
      { q: 5, r: 7, label: 'D' },     // home, running free
    ],
  },
  briefing:
`Portsmouth harbour, and nobody shooting at you for once. Four marks are laid out in the roads, and an old hulk is moored for the gun crews to practise on.

Fetch the marks in any order. Two things will teach themselves in the doing:

She will not sail into the eye of the wind. Look at the rose in the corner — the arrow flies with the wind, so it points where the wind is going. Try to sail straight into it and she stops dead, caught in irons, and drifts. Come at it on a slant instead, first one way and then the other.

She is not fastest running dead before the wind, either. Watch the forecast line under the chart: it tells you your point of sail and how many hexes that is worth. A reach — the wind on your beam — beats running, every time.

The hulk cannot fire back and cannot sink. Try a broadside at three hexes and again at one, and watch how much of the difference is simply range.`,
  ships: [
    { type: 'sloop', side: 'friendly', role: 'player', name: 'Alacrity', q: 5, r: 3, facing: 2 },
    { type: 'hulk', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Old hulk',
      q: 7, r: 0, facing: 2, anchor: 'down', stats: { crew: 3 } },
  ],
};
