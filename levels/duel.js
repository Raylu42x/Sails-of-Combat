// Broadside — one level. Fields are described in levels/index.js.
export default {
  id: 'duel',
  name: 'Broadside',
  map: 'openSea',
  objective: { type: 'duel', breakOffDist: 9 },
  briefing:
`Windward Passage, 1701. Your Bermuda sloop ALACRITY, 8 guns and a hungry crew, has been shadowing a Spanish guarda costa since dawn. She is bigger, square-rigged, and holds the weather gage — but you point closer to the wind than she ever will.

Each turn, set your orders — helm, sails, guns. Both ships commit blind, then the sea decides. Battle sail fights; full sail flies, but sends the gun crews aloft and silences your battery. Port and starboard batteries load and fire separately — a broadside takes a turn to reload, and your guns fire as she bears.

Cripple her rigging, bleed her crew, and take her whole… or be taken.`,
  ships: [
    { type: 'sloop', side: 'friendly', role: 'player', name: 'Alacrity', q: 4, r: 5, facing: 1 },
    { type: 'guardacosta', side: 'hostile', role: 'enemy', ai: 'engage', name: 'San Cristóbal', q: 4, r: -1, facing: 3 },
  ],
};
