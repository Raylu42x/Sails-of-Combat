// Touch and Go — one level. Fields are described in levels/index.js.
export default {
  id: 'touchandgo',
  name: 'Touch and Go',
  map: 'flats',
  objective: { type: 'chase', turnLimit: 11, escapeDist: 7 },
  briefing:
`The SAINTE-ANNE is a free-trader's cutter — half as big again as the ADDER, stouter in the hull, and drawing no more water, because the men who build for the trade build for these grounds. She carries the same canvas in the same breeze on the same point of sailing. Nothing you do aloft will gain you a fathom on her.

What lies between her and the open sea is the Bonefish Flats: a mile of sand with a fathom over it at the top of the tide, a dry cay in the middle, and a deep gut at either end four miles apart. Go round by a gut and she is gone. Go straight across and the ground is under you.

That is the whole of it. Carry sail over the flats and you may strike; take in and creep and you will feel your way safely across while she draws ahead. She has the same choice to make, and her master is in a greater hurry than you are.

She is bigger than you and she can take more punishment than you can give her quickly. Cripple her before she is hull down, or the run goes through.`,
  ships: [
    { type: 'cutter', side: 'friendly', role: 'player', name: 'Adder', q: 5, r: 6, facing: 0 },
    { type: 'cutter', side: 'hostile', role: 'quarry', ai: 'flee', name: 'Sainte-Anne', q: 7, r: 3, facing: 0,
      stats: { hull: 10, rigging: 11, crew: 10, quality: 1.05 } },
  ],
};
