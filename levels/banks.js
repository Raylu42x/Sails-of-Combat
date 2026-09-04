// Over the Banks — one level. Fields are described in levels/index.js.
export default {
  id: 'banks',
  name: 'Over the Banks',
  map: 'shoals',
  objective: { type: 'duel', breakOffDist: 10 },
  briefing:
`A heavy guarda costa, against eight guns and a hungry crew — and the only reason you are still afloat is that she draws three times the water you do.

Fight her over the banks. She dare not follow you across the shallows, and every hex of broken water between you is a hex her carronades cannot reach across. Cross her bows, cut up her rigging, and let the ground do the rest.

Go aground yourself and it is over.`,
  ships: [
    { type: 'sloop', side: 'friendly', role: 'player', name: 'Alacrity', q: 2, r: 8, facing: 0 },
    { type: 'guardacosta', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Amphitrite', q: 8, r: 1, facing: 3,
      stats: { hull: 14, crew: 12 } },
  ],
};
