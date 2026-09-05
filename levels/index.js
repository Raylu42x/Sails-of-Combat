// The levels, in the order they are offered.
//
// One file per level in this folder. Adding a level means adding a file
// and a line here — the engine needs no changes, and two people can add
// levels at once without meeting in the same file.
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

import school from './school.js';
import duel from './duel.js';
import chase from './chase.js';
import protect from './protect.js';
import retreat from './retreat.js';
import banks from './banks.js';
import cays from './cays.js';
import cutout from './cutout.js';
import purse from './purse.js';
import squall from './squall.js';
import ratrun from './ratrun.js';

export const SCENARIOS = [
  school,
  duel,
  chase,
  protect,
  retreat,
  banks,
  cays,
  cutout,
  purse,
  squall,
  ratrun,
];

export const scenarioById = id => SCENARIOS.find(s => s.id === id) || SCENARIOS[0];
