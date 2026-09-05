// Convoy Duty — one level. Fields are described in levels/index.js.
export default {
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
    { type: 'cutter', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Vautour', personality: 'prizehunter', q: 2, r: 3, facing: 3 },
  ],
};
