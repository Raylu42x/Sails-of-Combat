// What a captain wants out of the fight. The AI's move search is the same for
// everyone — try every helm and sail setting, score the outcome, take the best.
// A personality is only a different set of weights on that scoring, which is
// why it costs almost nothing and changes the feel of a level so much.
//
//   standoff   the range she tries to hold, in hexes
//   armed      how much she values a position where her loaded guns bear
//   boarding   0 never grapples · 1 when winning · 2 goes looking for it
//   aim        what she shoots at when she has the choice
//   nerve      hull fraction below which she starts backing out of it
//
// `tell` is shown to the player on the enemy's ship sheet: choosing how to
// fight her should be an informed decision, not a surprise.

export const PERSONALITIES = {
  professional: {
    id: 'professional', name: 'professional',
    standoff: 1.5, armed: 6, boarding: 1, aim: 'balanced', nerve: 0.18,
    tell: 'holds the weather gage and fights at effective range',
  },
  cautious: {
    id: 'cautious', name: 'cautious',
    standoff: 2.6, armed: 4, boarding: 0, aim: 'hull', nerve: 0.45,
    tell: 'keeps her distance and will break off once she is hurt',
  },
  boarder: {
    id: 'boarder', name: 'boarder',
    standoff: 1.0, armed: 5, boarding: 2, aim: 'crew', nerve: 0.12,
    tell: 'means to come aboard — she will sweep your deck with grape first',
  },
  prizehunter: {
    id: 'prizehunter', name: 'prize-hunter',
    standoff: 1.6, armed: 6, boarding: 1.5, aim: 'rigging', nerve: 0.2,
    tell: 'wants you afloat and saleable — she will fire at your rigging',
  },
  reckless: {
    id: 'reckless', name: 'reckless',
    standoff: 0.9, armed: 7, boarding: 1.2, aim: 'smash', nerve: 0.05,
    tell: 'will close to pistol shot and double-shot her guns',
  },
};

export const personalityOf = id => PERSONALITIES[id] || PERSONALITIES.professional;
export const PERSONALITY_IDS = Object.keys(PERSONALITIES);
