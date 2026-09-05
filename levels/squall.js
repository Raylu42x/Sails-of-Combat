// Powder and Spray — one level. Fields are described in levels/index.js.
export default {
  id: 'squall',
  name: 'Powder and Spray',
  map: 'gale',
  objective: { type: 'duel', breakOffDist: 10 },
  briefing:
`You have the brig RATTLER in a full gale, and the French brig SANS PAREIL has the same wind and the same idea.

Blowing this hard, the ship heels: the battery on your lee side is under water and will not open. Which gun bears is decided by the tack you are on — and every tack is a gamble in a gale. Watch her lee side, take the weather gage, and put your iron where she cannot answer it.

Square rig runs down the sea handsomely, and claws off it badly. Do not let the wind sail you.`,
  ships: [
    { type: 'brig', side: 'friendly', role: 'player', name: 'Rattler', q: 4, r: 6, facing: 1 },
    { type: 'brig', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Sans Pareil', q: 5, r: 0, facing: 3,
      stats: { crew: 13, quality: 1.1 } },
  ],
};
