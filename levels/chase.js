// The Long Chase — one level. Fields are described in levels/index.js.
export default {
  id: 'chase',
  name: 'The Long Chase',
  map: 'packetRun',
  objective: { type: 'chase', turnLimit: 16, escapeDist: 8 },
  briefing:
`A packet out of Cartagena runs for open water with the despatches aboard. She is slower than you but she has the legs of you downwind, and there is a steady breeze.

She will not stand and fight. Bring her to action — chase guns bear dead ahead, so keep her under your bowsprit — and cripple her rigging before she is hull down over the horizon.

Take her, or lose the despatches.`,
  ships: [
    { type: 'cutter', side: 'friendly', role: 'player', name: 'Alacrity', q: 4, r: 6, facing: 0 },
    { type: 'merchantman', side: 'hostile', role: 'quarry', ai: 'flee', name: 'Correo', q: 4, r: 2, facing: 0 },
  ],
};
