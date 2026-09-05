// A fight is a seed and a list of orders. Everything else — the AI's choices,
// every dice roll, the wind's mind — follows from those two things, because all
// randomness goes through rng.js. So a replay needs to carry nothing else.
//
// Format, kept short enough to live in a URL:
//
//   v1~<level id>~<seed base36>~<one 6-character group per turn>
//
// Each group is helm, sails, shot, grapple, melee, cable, one character each.

const HELM = ['-2', '-1', '0', '1', '2'];
const SAILS = ['full', 'battle', 'takein'];
const SHOT = ['round', 'chain', 'grape', 'double', 'hold', 'fireparty'];
const GRAPPLE = ['no', 'yes', 'prize'];
const MELEE = ['press', 'boarders', 'hold', 'back'];
const CABLE = ['stand', 'anchor', 'weigh'];

const code = (list, v) => {
  const i = list.indexOf(String(v));
  return (i < 0 ? 0 : i).toString(36);
};
const decode = (list, ch) => list[parseInt(ch, 36)] || list[0];

export function encodeTurn(orders) {
  return code(HELM, orders.helm) + code(SAILS, orders.sails) + code(SHOT, orders.shot) +
    code(GRAPPLE, orders.grapple) + code(MELEE, orders.melee) + code(CABLE, orders.cable);
}

export function decodeTurn(group) {
  return {
    helm: decode(HELM, group[0]),
    sails: decode(SAILS, group[1]),
    shot: decode(SHOT, group[2]),
    grapple: decode(GRAPPLE, group[3]),
    melee: decode(MELEE, group[4]),
    cable: decode(CABLE, group[5]),
  };
}

export function encodeReplay({ levelId, seed, turns }) {
  return ['v1', levelId, Number(seed).toString(36), turns.map(encodeTurn).join('')].join('~');
}

export function decodeReplay(text) {
  const [v, levelId, seed36, stream = ''] = String(text || '').trim().split('~');
  if (v !== 'v1' || !levelId) return null;
  const turns = [];
  for (let i = 0; i + 6 <= stream.length; i += 6) turns.push(decodeTurn(stream.slice(i, i + 6)));
  return { levelId, seed: parseInt(seed36, 36), turns };
}

// Play a recorded fight through a game, order by order. The same function
// serves the browser (with animation) and a test (with a stub view).
export async function runReplay(game, replay, onTurn) {
  game.start(replay.levelId, replay.seed);
  for (const t of replay.turns) {
    if (game.state().over) break;
    for (const [k, v] of Object.entries(t)) game.setOrder(k, v);
    await game.execute();
    if (onTurn) await onTurn(game.state());
  }
  return game.state();
}
