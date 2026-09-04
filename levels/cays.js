// Among the Cays — one level. Fields are described in levels/index.js.
export default {
  id: 'cays',
  name: 'Among the Cays',
  map: 'cays',
  objective: { type: 'duel', breakOffDist: 12 },
  briefing:
`A French brig has run in among Dead Man's Cays to lie in wait. The tall cays block sight as well as passage — you will lose her behind the rock, and she will lose you.

Round the headland with your battery loaded, and be the one who fires first.`,
  ships: [
    { type: 'sloop', side: 'friendly', role: 'player', name: 'Alacrity', q: 2, r: 8, facing: 0 },
    { type: 'brig', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Sans Pareil', q: 8, r: 0, facing: 3,
      stats: { hull: 9, crew: 9, quality: 0.95 } },
  ],
};
