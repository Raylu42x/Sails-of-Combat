// Ship classes. Adding a new hull means adding an entry here — nothing else.
//
//   speeds   hexes made good at each point of sail:
//            [in irons, close-hauled, reaching, running]
//   rig      'fa' fore-and-aft (points high, tacks well) | 'sq' square
//   mounts   gun groups. `arcs` are bearings relative to the bow:
//            0 ahead, 1/2 starboard, 3 astern, 4/5 port.
//            Broadsides are heavy and slow; chasers are light and quick.

const BROADSIDE = arcs => ({ arcs, power: 1, reload: 0 });
const CHASER = arcs => ({ arcs, power: 0.5, reload: 0, chaser: true });

export const SHIP_TYPES = {
  sloop: {
    id: 'sloop', name: 'Bermuda sloop', short: 'sloop',
    rig: 'fa', speeds: [0, 2, 3, 1], turnMax: 2, tackOdds: 0.8,
    hull: 8, rigging: 8, crew: 12, quality: 1.15,
    mounts: {
      port: BROADSIDE([4, 5]),
      stbd: BROADSIDE([1, 2]),
    },
  },
  cutter: {
    id: 'cutter', name: 'Revenue cutter', short: 'cutter',
    rig: 'fa', speeds: [0, 2, 3, 2], turnMax: 2, tackOdds: 0.85,
    hull: 6, rigging: 7, crew: 9, quality: 1.1,
    mounts: {
      port: BROADSIDE([4, 5]),
      stbd: BROADSIDE([1, 2]),
      bow: CHASER([0]),
    },
  },
  brig: {
    id: 'brig', name: 'Brig', short: 'brig',
    rig: 'sq', speeds: [0, 1, 3, 2], turnMax: 2, tackOdds: 0.6,
    hull: 10, rigging: 9, crew: 11, quality: 1.05,
    mounts: {
      port: BROADSIDE([4, 5]),
      stbd: BROADSIDE([1, 2]),
      stern: CHASER([3]),
    },
  },
  guardacosta: {
    id: 'guardacosta', name: 'Guarda costa', short: 'guarda costa',
    rig: 'sq', speeds: [0, 1, 3, 2], turnMax: 1, tackOdds: 0.5,
    hull: 12, rigging: 10, crew: 10, quality: 1.0,
    mounts: {
      port: BROADSIDE([4, 5]),
      stbd: BROADSIDE([1, 2]),
    },
  },
  frigate: {
    id: 'frigate', name: 'Frigate', short: 'frigate',
    rig: 'sq', speeds: [0, 1, 3, 2], turnMax: 1, tackOdds: 0.55,
    hull: 16, rigging: 12, crew: 16, quality: 1.1,
    mounts: {
      port: { arcs: [4, 5], power: 1.4, reload: 1 },
      stbd: { arcs: [1, 2], power: 1.4, reload: 1 },
      bow: CHASER([0]),
      stern: CHASER([3]),
    },
  },
  merchantman: {
    id: 'merchantman', name: 'Merchantman', short: 'merchantman',
    rig: 'sq', speeds: [0, 1, 2, 2], turnMax: 1, tackOdds: 0.4,
    hull: 11, rigging: 8, crew: 7, quality: 0.8,
    mounts: {
      port: { arcs: [4, 5], power: 0.6, reload: 1 },
      stbd: { arcs: [1, 2], power: 0.6, reload: 1 },
    },
  },
};

export const shipType = id => SHIP_TYPES[id] || SHIP_TYPES.sloop;
