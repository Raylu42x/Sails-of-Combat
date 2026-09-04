// The Amsterdam’s Purse — one level. Fields are described in levels/index.js.
export default {
  id: 'purse',
  name: 'The Amsterdam’s Purse',
  map: 'packetRun',
  objective: { type: 'capture', turnLimit: 20 },
  briefing:
`The Dutch merchantman AMSTERDAM is deep-laden and slow — the richest hull you will see this season. Her master has bought himself a brig of war for company, and the brig means to earn her fee.

Every shot into the AMSTERDAM’s hull is money you are burning: the court pays for the ship you bring in, not the one you wrecked. Deal with the escort as you must, but take the purse whole.

Board her or force her colours down before she is gone.`,
  ships: [
    { type: 'cutter', side: 'friendly', role: 'player', name: 'Adder', q: 4, r: 6, facing: 0 },
    { type: 'merchantman', side: 'hostile', role: 'prize', ai: 'flee', name: 'Amsterdam', q: 4, r: 1, facing: 0,
      stats: { crew: 5, quality: 0.9 } },
    { type: 'cutter', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Zeehond', q: 7, r: 2, facing: 4,
      stats: { crew: 7, quality: 0.9 } },
  ],
};
