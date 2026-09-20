// A Lee Shore — one level. Nothing here is shooting at you; the wind is the
// whole of the opposition. Going in was free. Getting out is the level.
export default {
  id: 'leeshore',
  name: 'A Lee Shore',
  map: 'bight',
  objective: {
    type: 'marks',
    turnLimit: 9,
    marks: [
      { q: 6, r: 6, label: 'Wreck' },     // alongside her, over the bank
      { q: 5, r: -2, label: 'Offing' },   // deep water, nine hexes dead to windward
    ],
  },
  briefing:
`The wind came into the north in the middle watch and has been rising ever since, and the ADDER is inside Salt Kettle Bight with the beach under her lee.

There is a ship on the bank at the head of it — a square-rigged brig, from the look of what is left of her masts, who tried to claw off this shore in the night and could not. Lay alongside what is left of her, then take your ship out past the heads into the offing.

She will not sail into the eye of the wind, so you cannot simply point at the open sea: you must make your northing a board at a time, first one tack and then the other, and every board you waste is water you lose to leeward. The bank across the head of the bight is under three feet at this state of the tide. Cross it with way on her and you will do what the brig did.

A fore-and-aft rig is the only reason this is a problem and not an obituary. Get out, or go ashore where she did.`,
  ships: [
    { type: 'cutter', side: 'friendly', role: 'player', name: 'Adder', q: 5, r: 4, facing: 3 },
    { type: 'hulk', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Wreck on the bank',
      q: 7, r: 6, facing: 1, anchor: 'down', stats: { crew: 8, quality: 0.3 } },
  ],
};
