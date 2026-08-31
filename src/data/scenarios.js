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
//   ship.stats  optional { hull, rigging, crew, quality } override, for
//               tuning a level without inventing a new ship class

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
    objective: { type: 'protect', turnLimit: 9 },
    briefing:
`You have the brig RATTLER this morning, and a charge you did not ask for. The sugar hoy MARGUERITE is worth more than your ship, your crew and your commission together, and she sails like a haystack. A privateer has come out of the shoals after her.

Light airs today — nobody moves fast, and the shoals will not move at all. Put yourself between her and him for nine turns and the anchorage guns will do the rest.

Sound your way: the pale water is a bank that will have your keel out of her at speed, and the tinted patches are holding ground where an anchor will bite. Anchored, a spring on the cable still lets you warp round and bring a broadside to bear — but weighing again costs you a turn.

If she strikes, you may as well not come home.`,
    ships: [
      { type: 'brig', side: 'friendly', role: 'player', name: 'Rattler', q: 4, r: 6, facing: 0 },
      { type: 'merchantman', side: 'friendly', role: 'ward', ai: 'flee', name: 'Marguerite', q: 5, r: 7, facing: 0,
        stats: { hull: 14, crew: 9 } },
      { type: 'cutter', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Vautour', q: 2, r: 3, facing: 3 },
    ],
  },
  {
    id: 'retreat',
    name: 'Fighting Retreat',
    map: 'gale',
    objective: { type: 'escape', turnLimit: 12, escapeDist: 7 },
    briefing:
`Two of them, to windward, and both faster off the wind than you are. There is no prize here and no glory — only the question of whether the ALACRITY comes home.

Get seven hexes clear of both, or hold them off until dark. Chain shot in their rigging is worth more than round shot in their hulls; a crippled pursuer is one that stops pursuing.

You point higher than either of them. Use it.`,
    ships: [
      { type: 'sloop', side: 'friendly', role: 'player', name: 'Alacrity', q: 4, r: 5, facing: 0,
        stats: { hull: 7, crew: 10 } },
      { type: 'cutter', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Furet', q: 3, r: 1, facing: 3 },
      { type: 'brig', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Insolent', q: 6, r: 0, facing: 3,
        stats: { crew: 9 } },
    ],
  },
  {
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
      { type: 'brig', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Sans Pareil', q: 8, r: 0, facing: 3,
        stats: { hull: 9, crew: 9, quality: 0.95 } },
    ],
  },
  {
    id: 'cutout',
    name: 'Cutting Out',
    map: 'bay',
    objective: { type: 'capture', turnLimit: 14 },
    briefing:
`The Spanish brig SANTA RITA lies at anchor in Careenage Bay behind the headland, taking in water. Her people are ashore by half. Cut her out.

She will not run — she cannot, with her anchor down — but a ship at anchor is not helpless: a spring on her cable brings her broadside round as fast as you can cross her stern.

Light airs, a bank on either hand, and holding ground under the headland if you want to bring up and fight it out at anchor yourself. Grapple her and carry her deck before the shore takes notice.`,
    ships: [
      { type: 'sloop', side: 'friendly', role: 'player', name: 'Alacrity', q: 1, r: 8, facing: 0 },
      { type: 'brig', side: 'hostile', role: 'prize', ai: 'engage', name: 'Santa Rita',
        q: 5, r: 1, facing: 3, anchor: 'down', stats: { crew: 9 } },
      { type: 'cutter', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Guarda del puerto',
        q: 8, r: 4, facing: 0, stats: { hull: 5, crew: 5, quality: 0.8 } },
    ],
  },
];

export const scenarioById = id => SCENARIOS.find(s => s.id === id) || SCENARIOS[0];
