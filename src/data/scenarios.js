// Scenarios bolt a map, a set of ships and a win condition together.
// A new level is a new entry here; the engine needs no changes.
//
//   objective.type
//     'duel'    — beat every hostile ship
//     'chase'   — cripple or board the quarry before she runs / time runs out
//     'protect' — keep the warded ship alive for `turnLimit` turns
//   ship.side   'friendly' | 'hostile'
//   ship.role   'player' | 'enemy' | 'quarry' | 'ward'
//   ship.ai     'engage' | 'flee' | 'escort'

export const SCENARIOS = [
  {
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
  },
  {
    id: 'chase',
    name: 'The Long Chase',
    map: 'gale',
    objective: { type: 'chase', turnLimit: 14, escapeDist: 8 },
    briefing:
`A packet out of Cartagena runs for open water with the despatches aboard. She is slower than you but she has the legs of you downwind, and a fresh gale is blowing.

She will not stand and fight. Bring her to action — chase guns bear dead ahead, so keep her under your bowsprit — and cripple her rigging before she is hull down over the horizon.

Take her, or lose the despatches.`,
    ships: [
      { type: 'cutter', side: 'friendly', role: 'player', name: 'Alacrity', q: 4, r: 6, facing: 0 },
      { type: 'merchantman', side: 'hostile', role: 'quarry', ai: 'flee', name: 'Correo', q: 4, r: 2, facing: 0 },
    ],
  },
  {
    id: 'protect',
    name: 'Convoy Duty',
    map: 'shoals',
    objective: { type: 'protect', turnLimit: 12 },
    briefing:
`The sugar hoy MARGUERITE is worth more than your ship, your crew and your commission together, and she sails like a haystack. Two privateers have come out of the shoals after her.

Light airs today — nobody moves fast, and the shoals will not move at all. Put yourself between her and them for twelve turns and the anchorage guns will do the rest.

If she strikes, you may as well not come home.`,
    ships: [
      { type: 'sloop', side: 'friendly', role: 'player', name: 'Alacrity', q: 4, r: 6, facing: 0 },
      { type: 'merchantman', side: 'friendly', role: 'ward', ai: 'flee', name: 'Marguerite', q: 5, r: 7, facing: 0 },
      { type: 'cutter', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Vautour', q: 2, r: 3, facing: 3 },
      { type: 'cutter', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Hirondelle', q: 8, r: 0, facing: 3 },
    ],
  },
  {
    id: 'cays',
    name: 'Among the Cays',
    map: 'cays',
    objective: { type: 'duel', breakOffDist: 12 },
    briefing:
`A French brig has run in among Dead Man's Cays to lie in wait. The tall cays block sight as well as passage — you will lose her behind the rock, and she will lose you.

Round the headland with your battery loaded, and be the one who fires first.`,
    ships: [
      { type: 'sloop', side: 'friendly', role: 'player', name: 'Alacrity', q: 2, r: 8, facing: 0 },
      { type: 'brig', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Sans Pareil', q: 8, r: 0, facing: 3 },
    ],
  },
];

export const scenarioById = id => SCENARIOS.find(s => s.id === id) || SCENARIOS[0];
