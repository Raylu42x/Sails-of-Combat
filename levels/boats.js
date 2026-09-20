// The Boats Come Out — one level. Fields are described in levels/index.js.
export default {
  id: 'boats',
  name: 'The Boats Come Out',
  map: 'openSea',
  objective: { type: 'duel', breakOffDist: 10 },
  briefing:
`Forty bales of silk out of a cave under the cliff, and they are in the ADDER's hold since four this morning. The gang want them back. They have come off after you in three armed boats, and they are not going home without the cargo or the cutter.

Not one of them would live ten minutes alongside you. All three at once is a different sum: while the starboard battery is reloading, two of them are lying under your quarter where nothing bears, and there are as many men in those boats as there are in your ship.

So do not let them arrive together. You point higher than any of them and you are the only vessel here that can choose the range — take the nearest on your own terms, and be somewhere else when the others come up.

Beat them, or lose the silk and the ship with it.`,
  ships: [
    { type: 'cutter', side: 'friendly', role: 'player', name: 'Adder', q: 4, r: 5, facing: 2,
      stats: { hull: 8, crew: 12, quality: 1.2 } },
    { type: 'sloop', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Mouette', personality: 'prizehunter',
      q: 4, r: 2, facing: 3, stats: { hull: 3, rigging: 4, crew: 4, quality: 0.55 } },
    { type: 'cutter', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Guêpe', personality: 'prizehunter',
      q: 7, r: -1, facing: 4, stats: { hull: 3, rigging: 4, crew: 4, quality: 0.55 } },
    { type: 'sloop', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Hirondelle', personality: 'cautious',
      q: 0, r: 2, facing: 2, stats: { hull: 3, rigging: 4, crew: 4, quality: 0.55 } },
  ],
};
