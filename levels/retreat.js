// Fighting Retreat — one level. Fields are described in levels/index.js.
export default {
  id: 'retreat',
  name: 'Fighting Retreat',
  map: 'gale',
  objective: { type: 'escape', turnLimit: 14, escapeDist: 8 },
  briefing:
`Two of them, to windward, and both faster off the wind than you are. There is no prize here and no glory — only the question of whether the ALACRITY comes home.

Get seven hexes clear of both, or hold them off until dark. Chain shot in their rigging is worth more than round shot in their hulls; a crippled pursuer is one that stops pursuing.

You point higher than either of them. Use it.`,
  ships: [
    { type: 'sloop', side: 'friendly', role: 'player', name: 'Alacrity', q: 4, r: 5, facing: 0,
      stats: { hull: 7, crew: 10 } },
    { type: 'cutter', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Furet', q: 3, r: 1, facing: 3 },
    { type: 'brig', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Insolent', q: 6, r: 0, facing: 3,
      stats: { crew: 9 } },
  ],
};
