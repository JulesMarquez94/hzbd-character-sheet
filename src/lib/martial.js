/**
 * The Martial Move codex.
 *
 * Its own module rather than a section of weapons.js, for the same reason
 * spells.js is: weapons.js assembles the whole card registry, so reaching for
 * one move from it would drag talents, lineages and backgrounds into the bundle
 * a first-time visitor downloads. Moves depend on nothing but their own art, so
 * they can be reached on their own. weapons.js re-exports MARTIAL_MOVES.
 *
 * ------------------------------------------------------------------ what one is
 * A Martial Move is not an attack. It is a thing you do to your own *next*
 * attack: you pay for it, it waits, and the swing that follows carries it. Two
 * talent sets teach them — the Guardian's SHIELD EXPERTISE and the Duelist's
 * DEXTEROUS — and both say the same three things: how many you know, that the
 * count grows with your rank, and that Rank 2 opens Adept and Rank 3 opens
 * Master. So a move is picked out of this codex by a `loadout` spec exactly the
 * way a Mycomancer picks spells (loadouts.js), and the waiting is a pending
 * rider on the effects tracker exactly the way an AMBUSH is (moves.js).
 *
 * ----------------------------------------------------------------- the banner
 * Two tags, in the order the printed cards read them: what it is, then the tier
 * it is learned at.
 *
 *   MARTIAL MOVE - NOVICE
 *
 * That is the reverse of a spell's banner ("NOVICE SPELL - PRIMAL - FLORA") and
 * it is deliberate — it is what the plates say. `tierOf` in loadouts.js looks
 * for the tier word in any tag rather than in the first one, so both orders
 * resolve. There is no school and no family: a move is a move, and the tier is
 * the only thing that gates it, which is why the chooser walls them by tier
 * (`group: 'tier'` on the spec) rather than by a sub-school none of them has.
 *
 * ------------------------------------------------------------------- `rides`
 * What the move does to the swing it is waiting on, as data, never read out of
 * the prose. Three keys, all optional, all the shapes the card renderers already
 * understand:
 *
 *   advantage  extra d4s on the attack roll. A count, because Advantage stacks.
 *   empower    another damage die of the same kind (2d6 -> 3d6).
 *   elevate    the same dice, one size up (2d6 -> 2d8), capped at d12.
 *
 * A move with no `rides` still rides: WOUND, CONCUSS, MOMENTUM, SWEEP and BLEED
 * all change what the attack *does* without changing a number the sheet prints,
 * so the tracker names them on the attack and the table plays the rest. That is
 * also the line for the conditional halves, and it is worth being strict about:
 * RECKLESS is Empowered "on a hit" and every hit is one, so the sheet prints it;
 * REND is Empowered only if the target already carried a Wound, and the sheet has
 * no idea whether it did, so REND carries nothing. A printed number that might be
 * wrong is worse than a printed sentence the table reads.
 *
 * ------------------------------------------------------------------ modular
 * Nothing here names an attribute it does not have to. Every move is written off
 * `{stat}`, and `stat: 'instinct'` below is only the default a holder with no
 * other claim rolls with — a set that teaches these off another attribute
 * carries `cast` on its loadout and the same card prints that attribute instead
 * (see castModifier in cardText.js). Neither set that teaches them names one, so
 * neither carries `cast` yet.
 *
 * -------------------------------------------------------------- what is whose
 * **The six Novice moves are transcribed**, from the six card plates Jules
 * handed over on 2026-08-20 (WOUND, WING CLIP, CONCUSS, MOMENTUM, RECKLESS,
 * TAUNTING — WING CLIP arrived twice). Costs are read off the orbs: a plate with
 * one orb costs only that, so CONCUSS and MOMENTUM carry no Action Points.
 *
 * **The eight above them are house-written**, asked for in chat on 2026-08-20:
 * "extrapolate to also have 4 adept and 4 master new ones". They are marked
 * `house: true` and are the only cards in this file that are not off a plate. If
 * a sheet ever arrives for them, that flag is the list of what to overwrite.
 * They are built out of terms the glossary already defines and invent no new
 * status — the one thing an extrapolation must not do, because a status nobody
 * has written down is a rule the table cannot look up.
 *
 * Three spellings corrected on the way in and nothing else, each one so a
 * defined term lights rather than sits in the prose as plain text:
 * "Movemend Speed" reads Movement Speed, "the entity Move Action cost" reads
 * "the entity's {{Move}} action cost", and TAUNTING's "opponent" keeps its
 * apostrophe. See data/README.md.
 */

import { withArt } from './cardArt.js';
import { sortCards } from './cardOrder.js';

/** What each tier is called, in the order a rank opens them. */
export const MOVE_TIERS = ['Novice', 'Adept', 'Master'];

export const MARTIAL_MOVES = withArt([
  /* ------------------------------------------------------------- Novice ---- */
  {
    id: 'wound',
    name: 'Wound',
    summary: 'Your next hit leaves a Wound: 1d6 Decay at every Turn Start until it is healed.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Novice'],
    ap: 1,
    wp: 1,
    stat: 'instinct',
    /* The plate spells Wound out in a parenthesis at the foot of the card. It is
       a defined term, so the definition went to keywords.js in the designer's own
       words and the gloss came off the body — the same trade BLIND and FRIGHTFUL
       ROAR made, and the one every other term on a card has made. The card's own
       name is the term, which is allowed here in a way it was not for Gore Armor:
       "will inflict a Wound on the target" is the term being *used*, not a title
       colliding with an unrelated stat. */
    body: 'Your next Weapon Attack that hits will inflict a Wound on the target.',
  },
  {
    id: 'wing-clip',
    name: 'Wing Clip',
    summary: 'Advantage, a dearer Move for the target and a flying one comes down 18 meters.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Novice'],
    ap: 1,
    wp: 1,
    stat: 'instinct',
    rides: { advantage: 1 },
    body:
      'Your next Weapon Attack is made with advantage, and on a hit the entity’s {{Move}} action cost is increased by 1 Action Point.\n\n' +
      'If this hits a flying entity, it falls down toward the ground up to **18 meters (60 feet)** if possible.',
  },
  {
    id: 'concuss',
    name: 'Concuss',
    summary: 'Takes 2 Reaction Points, cancels what you interrupted and swings inside the reaction.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Novice'],
    ap: null,
    wp: 2,
    stat: 'instinct',
    body:
      'If your next Weapon Attack hits, it removes 2 Reaction Points from the target entity.\n\n' +
      'If this attack hits **an entity** that you are taking a reaction to, that entity’s current action is cancelled.\n\n' +
      'When you take Concuss as a reaction, you can make a Weapon Attack as part of the same reaction by paying the standard Action Point cost for the attack.',
  },
  {
    id: 'momentum',
    name: 'Momentum',
    summary: 'Move your whole speed before or after the swing, inside the same action.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Novice'],
    ap: null,
    wp: 1,
    stat: 'instinct',
    body:
      'You coordinate your steps with your strikes to remain mobile on the battlefield.\n\n' +
      'The next time you take the Weapon Attack action, before or after the attack, you can move a distance equal to your Movement Speed as part of the same action.\n\n' +
      'If you choose to move before the attack, the announced target must be in range at the end of the movement or the attack fails even if a different target is in range.',
  },
  {
    id: 'reckless',
    name: 'Reckless',
    summary: 'Advantage and one more damage die, bought with advantage on the answer.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Novice'],
    ap: 1,
    wp: 1,
    stat: 'instinct',
    rides: { advantage: 1, empower: 1 },
    body:
      'Your next Weapon Attack is made with advantage, and on a hit its damage is Empowered by 1.\n\n' +
      'The next Attack Roll made against you is made with advantage.',
  },
  {
    id: 'taunting',
    name: 'Taunting',
    summary: 'Advantage, and a target that can barely aim at anybody but you.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Novice'],
    ap: 1,
    wp: 1,
    stat: 'instinct',
    rides: { advantage: 1 },
    body:
      'You perform a tactical maneuver to draw your opponent’s focus away from your allies.\n\n' +
      'Your next Weapon Attack is made with advantage.\n\n' +
      'On a hit, the target has disadvantage on Attack Rolls and skill checks made against targets other than yourself.',
  },

  /* -------------------------------------------------------------- Adept ----
   * House-written. See "what is whose" above.
   */
  {
    id: 'rend',
    name: 'Rend',
    summary: 'Two Wounds at once, and a target already bleeding takes an extra die.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Adept'],
    ap: 1,
    wp: 2,
    stat: 'instinct',
    house: true,
    body:
      'Your next Weapon Attack that hits will inflict 2 Wounds on the target.\n\n' +
      'If the target was already carrying a Wound, the attack’s damage is Empowered by 1.',
  },
  {
    id: 'disarm',
    name: 'Disarm',
    summary: 'Advantage, then a roll against Grit that puts what they held on the floor.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Adept'],
    ap: 2,
    wp: 2,
    stat: 'instinct',
    rides: { advantage: 1 },
    house: true,
    body:
      'Your next Weapon Attack is made with advantage.\n\n' +
      'On a hit, roll your {stat} {roll} against the target’s Grit. On a success, whatever it was holding lands **3 meters (10 feet)** away in a direction of your choice, and it must take the {{Interact}} action to pick the thing up again.',
  },
  {
    id: 'feint',
    name: 'Feint',
    summary: 'Advantage, no reaction allowed to it and your Willpower back if it misses.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Adept'],
    ap: 1,
    wp: 2,
    stat: 'instinct',
    rides: { advantage: 1 },
    house: true,
    body:
      'Your next Weapon Attack is made with advantage, and the target cannot spend Reaction Points to answer it.\n\n' +
      'If the attack misses, the Willpower spent on this move comes back.',
  },
  {
    id: 'sweep',
    name: 'Sweep',
    summary: 'One swing at everything within reach, and everything it hits goes down.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Adept'],
    ap: 2,
    wp: 1,
    stat: 'instinct',
    house: true,
    body:
      'Your next Weapon Attack is made against **every entity** within your reach rather than against one of them.\n\n' +
      'On a hit, the entity is knocked prone.',
  },

  /* ------------------------------------------------------------- Master ----
   * House-written. See "what is whose" above.
   */
  {
    id: 'riposte',
    name: 'Riposte',
    summary: 'A miss against you buys a swing back, with advantage and Elevated twice.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Master'],
    ap: null,
    wp: 3,
    stat: 'instinct',
    rides: { advantage: 1, elevate: 2 },
    house: true,
    body:
      'When an attack made against you misses, you can use Riposte as a reaction.\n\n' +
      'You make a Weapon Attack against the entity that missed, paying the standard Action Point cost for the attack.\n\n' +
      'That attack is made with advantage and its damage is Elevated twice.',
  },
  {
    id: 'execute',
    name: 'Execute',
    summary: 'A guaranteed Critical Hit on anything already down, held or bleeding.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Master'],
    ap: 2,
    wp: 3,
    stat: 'instinct',
    rides: { advantage: 1 },
    house: true,
    body:
      'Your next Weapon Attack is a Critical Hit if it hits **an entity** that is prone, grappled, stunned or carrying a Wound.\n\n' +
      'Against anything else it is made with advantage and nothing more.',
  },
  {
    id: 'perfect-form',
    name: 'Perfect Form',
    summary: 'The swing cannot miss and its dice grow a size. Nothing else may ride it.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Master'],
    ap: 1,
    wp: 4,
    stat: 'instinct',
    rides: { elevate: 1 },
    house: true,
    body:
      'Your next Weapon Attack cannot miss, and its damage is Elevated once.\n\n' +
      'You cannot use this move on an attack that is already carrying another Martial Move.',
  },
  {
    id: 'bleed',
    name: 'Bleed',
    summary: 'A Wound on the target and everything beside it, and no healing while it lasts.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Master'],
    ap: 2,
    wp: 3,
    stat: 'instinct',
    house: true,
    body:
      'Your next Weapon Attack that hits will inflict a Wound on the target and on **every entity** within **3 meters (10 feet)** of it.\n\n' +
      'For as long as the target carries a Wound inflicted by this move, it cannot regain Health.',
  },
]);

/* -------------------------------------------------------------------- lookups
 * A move by id or by printed name, and the tier a card sits at. weapons.js folds
 * this file into the global registry, so `getCard` reaches every move as well —
 * these are for the callers that want *only* moves and must not drag the
 * registry in behind them.
 */

const MOVE_BY_ID = new Map(MARTIAL_MOVES.map((card) => [card.id, card]));
const MOVE_BY_NAME = new Map(MARTIAL_MOVES.map((card) => [card.name.toLowerCase(), card]));

export function getMartialMove(key) {
  if (!key) return null;
  return MOVE_BY_ID.get(key) ?? MOVE_BY_NAME.get(String(key).toLowerCase()) ?? null;
}

/** Whether a card is one of these, wherever it arrived from. */
export function isMartialMove(card) {
  return card?.kind === 'martial-move';
}

/** The tier word a move's tags carry: "Novice", "Adept", "Master", or null. */
export function moveTier(card) {
  for (const tag of card?.tags ?? []) {
    if (MOVE_TIERS.includes(tag)) return tag;
  }
  return null;
}

/**
 * Every move at the given tiers, up the ladder.
 *
 * The file is already written Novice, Adept, Master, so this changes nothing
 * today. It goes through cardOrder.js anyway because a list that *happens* to be
 * right is not the same as one that is ordered: the day a fifteenth move is
 * written in beside its cousins rather than at the bottom of its tier, this
 * still comes out climbing.
 */
export function movesAt(tiers = MOVE_TIERS) {
  const wanted = new Set(tiers);
  return sortCards(MARTIAL_MOVES.filter((card) => wanted.has(moveTier(card))));
}
