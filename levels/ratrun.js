// The Rat Run — one level. Fields are described in levels/index.js.
export default {
  id: 'ratrun',
  name: 'The Rat Run',
  map: 'cays',
  objective: { type: 'escape', turnLimit: 9, escapeDist: 9 },
  briefing:
`For once the fat hull is yours. The MARGUERITE is loaded to her marks with sugar, you have six popguns and a crew who signed on to sail, not to fight — and two hunters have the scent.

You cannot outfight them, and in open water you cannot outrun them. But the tall cays blind them, the banks bar them, and a ship they cannot see is a ship they cannot take. Thread the rat run, break their line of sight, and be gone.

Get clear, or last until dark.`,
  ships: [
    { type: 'merchantman', side: 'friendly', role: 'player', name: 'Marguerite', q: 2, r: 8, facing: 1,
      stats: { crew: 8, hull: 13, rigging: 9 } },
    { type: 'cutter', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Vulture', q: 7, r: 2, facing: 4,
      stats: { hull: 4, crew: 5, quality: 0.85 } },
    { type: 'sloop', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Kite', q: 7, r: 1, facing: 4,
      stats: { hull: 5, crew: 6, quality: 0.85 } },
  ],
};
