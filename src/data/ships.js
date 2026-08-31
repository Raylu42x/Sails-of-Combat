// Ship classes. Adding a new hull means adding an entry here — nothing else.
//
//   speeds   hexes made good at each point of sail:
//            [in irons, close-hauled, reaching, running]
//   rig      'fa' fore-and-aft (points high, tacks well) | 'sq' square
//   draught  'shallow' | 'medium' | 'deep' — how much water she needs, and so
//            how badly a shoal treats her. A sloop creeps over banks a frigate
//            dare not go near.
//   mounts   gun groups, keyed by an id that is also the reload slot.
//            arcs are bearings relative to the bow: 0 ahead, 1/2 starboard,
//            3 astern, 4/5 port. `gun` picks the piece; `power` scales the
//            weight of metal on top of it.

// The pieces themselves. Range is a modifier on the shot's own range.
export const GUN_TYPES = {
  long:      { name: 'long gun',  rangeMod: 1,  power: 1,   reload: 0 },
  medium:    { name: 'gun',       rangeMod: 0,  power: 1,   reload: 0 },
  carronade: { name: 'carronade', rangeMod: -1, power: 1.7, reload: 0 },
  // Swivels are man-killers on the rail: grape only, and only alongside.
  swivel:    { name: 'swivel',    rangeMod: -2, power: 0.5, reload: -1, only: ['grape'] },
};

export const gunType = id => GUN_TYPES[id] || GUN_TYPES.medium;

const battery = (side, gun, power = 1) => ({
  label: side === 'port' ? 'port battery' : 'starboard battery',
  tag: side === 'port' ? 'P' : 'S',
  arcs: side === 'port' ? [4, 5] : [1, 2],
  gun, power,
});
const chaser = (where, gun = 'long') => ({
  label: where === 'bow' ? 'bow chaser' : 'stern chaser',
  tag: where === 'bow' ? 'Bow' : 'Stn',
  arcs: where === 'bow' ? [0] : [3],
  gun, power: 0.5, chaser: true,
});
const swivels = side => ({
  label: side === 'port' ? 'port swivels' : 'starboard swivels',
  tag: side === 'port' ? 'Pw' : 'Sw',
  arcs: side === 'port' ? [4, 5] : [1, 2],
  gun: 'swivel', power: 1,
});

export const SHIP_TYPES = {
  sloop: {
    id: 'sloop', draught: 'shallow', name: 'Bermuda sloop', short: 'sloop',
    rig: 'fa', speeds: [0, 2, 3, 1], turnMax: 2, tackOdds: 0.8,
    hull: 8, rigging: 8, crew: 12, quality: 1.15,
    mounts: { port: battery('port', 'long'), stbd: battery('stbd', 'long') },
  },
  cutter: {
    id: 'cutter', draught: 'shallow', name: 'Revenue cutter', short: 'cutter',
    rig: 'fa', speeds: [0, 2, 3, 2], turnMax: 2, tackOdds: 0.85,
    hull: 6, rigging: 7, crew: 9, quality: 1.1,
    mounts: {
      port: battery('port', 'medium'), stbd: battery('stbd', 'medium'),
      bow: chaser('bow'),
    },
  },
  brig: {
    id: 'brig', draught: 'medium', name: 'Brig', short: 'brig',
    rig: 'sq', speeds: [0, 1, 3, 2], turnMax: 2, tackOdds: 0.6,
    hull: 10, rigging: 9, crew: 11, quality: 1.05,
    mounts: {
      port: battery('port', 'carronade'), stbd: battery('stbd', 'carronade'),
      stern: chaser('stern'),
    },
  },
  guardacosta: {
    id: 'guardacosta', draught: 'deep', name: 'Guarda costa', short: 'guarda costa',
    rig: 'sq', speeds: [0, 1, 3, 2], turnMax: 1, tackOdds: 0.5,
    hull: 12, rigging: 10, crew: 10, quality: 1.0,
    mounts: {
      port: battery('port', 'medium'), stbd: battery('stbd', 'medium'),
      portSw: swivels('port'), stbdSw: swivels('stbd'),
    },
  },
  frigate: {
    id: 'frigate', draught: 'deep', name: 'Frigate', short: 'frigate',
    rig: 'sq', speeds: [0, 1, 3, 2], turnMax: 1, tackOdds: 0.55,
    hull: 16, rigging: 12, crew: 16, quality: 1.1,
    mounts: {
      port: battery('port', 'long', 1.4), stbd: battery('stbd', 'long', 1.4),
      bow: chaser('bow'), stern: chaser('stern'),
    },
  },
  merchantman: {
    id: 'merchantman', draught: 'medium', name: 'Merchantman', short: 'merchantman',
    rig: 'sq', speeds: [0, 1, 2, 2], turnMax: 1, tackOdds: 0.4,
    hull: 11, rigging: 8, crew: 7, quality: 0.8,
    mounts: {
      port: battery('port', 'medium', 0.6), stbd: battery('stbd', 'medium', 0.6),
    },
  },
};

export const DRAUGHT = { shallow: 0.45, medium: 1, deep: 1.9 };
export const draughtOf = s => DRAUGHT[(s.type || s).draught] || 1;

export const shipType = id => SHIP_TYPES[id] || SHIP_TYPES.sloop;
