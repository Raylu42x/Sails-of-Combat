// Cutting Out — one level. Fields are described in levels/index.js.
export default {
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
      q: 5, r: 1, facing: 3, anchor: 'down', stats: { crew: 9, quality: 0.95 } },
    { type: 'cutter', side: 'hostile', role: 'enemy', ai: 'engage', name: 'Guarda del puerto', personality: 'cautious',
      q: 8, r: 4, facing: 0, stats: { hull: 5, crew: 5, quality: 0.8 } },
  ],
};
