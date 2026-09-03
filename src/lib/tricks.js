/**
 * The Trickster's machinery — what waits on your next weapon attack, and what
 * comes out of a stranger's pockets.
 *
 * Every other talent set hands over cards, or a hand to pick, or a body. This
 * one hands over two things the sheet has never had to hold before, and both of
 * them come straight out of the Developpement Notes rather than out of a card:
 *
 *   "for the next time after he use ambush, the weapon attack should reflect
 *    the increase in damage. Thi should be lost on use."
 *
 *   "then when he use steal, it should show the options after he press use. so
 *    he can slect which one and apply it. which would include the damage
 *    increase ,return ect."
 *
 * ------------------------------------------------------------------ the rider
 * So a rider is not a thing you do to a target, it is a thing you do to your own
 * next swing, and the swing has to *show* it before it is made. That is a
 * pending rider, and this file is where one lives.
 *
 * **AMBUSH was the reason this half exists and it is not here any more.** On
 * 2026-09-03 it became a granted Martial Move, chosen and paid for inside the
 * swing's own prompt, which is a strictly better answer to the sentence quoted
 * above: the attack does not merely reflect the increase, the increase is bought
 * as part of it. See "the granted three" in talents.js. What is left riding is
 * STEAL's Poison row, which is a menu outcome rather than an ability and has no
 * moment of its own to be chosen in.
 *
 * A rider is stored on the effects tracker, as an ordinary row carrying a
 * `trick` object. Nothing new was added to the schema for it, because the
 * tracker is already exactly this: the list of what is running on you right now,
 * drawn on the Turn block, countable, clearable, and shared by the one other
 * thing on the sheet that carries a mechanical payload rather than a note (an
 * Ephemeral Enchantment and its `ench` key — see enchanting.js). A rider you
 * cannot see is a rider you will forget you paid for.
 *
 *   { trick: { id: 'ambush', elevate: 2, advantage: 1 } }
 *                                            the next Weapon Attack is made
 *                                            with Advantage and Elevated twice
 *   { trick: { id: 'poison', flat: 1 } }      and deals another 1 x Instinct
 *
 * `elevate` is a number because it is history: "a number of times equal to the
 * Willpower paid" is about what was actually paid, and a Trickster who swaps
 * weapons afterwards does not get a different answer. `flat` is a *multiplier*
 * on Instinct rather than a number, because Poison says "equal to your Instinct
 * Attribute" and means the Instinct you have when you swing. `advantage` is a
 * number of d4s, stored rather than derived for the same reason the Elevate is:
 * the row is the receipt for what the Willpower bought.
 *
 * "Lost on use" is `spendTricks`, and the sheet spends them at the one moment it
 * can be sure a weapon attack happened: when one is paid for.
 *
 * ------------------------------------------------------- what counts as a swing
 * The glossary is broad: a Weapon Attack is "either of the two attacks the weapon
 * in your hands teaches you". Neither Shield Block nor a reload is one of the two
 * — those are tagged Weapon *Move*, which is the designer's own distinction and
 * the reason any of this can be read off the tags rather than guessed at.
 *
 * AMBUSH is narrower than the glossary, and that narrowing is Jules's own ruling
 * on 2026-08-21: "Ambush only apply on Weapon Attack, not special attack." So an
 * ambush rides the plain attack a weapon teaches, and the special one neither
 * prints it nor spends it. A stolen Poison keeps the broad reading and rides
 * either, which is the reading a Martial Move keeps as well (moves.js). That is
 * why `trickRides` exists rather than one test for every rider: one swing can be
 * the wrong attack for one rider and the right one for another.
 *
 * ------------------------------------------------------------------- the table
 * STEAL is the other half. Its four rows are on the set's own `tricks.steal`
 * spec in talents.js, numbers only; this file is what turns a chosen row into a
 * patch on the sheet. Three of the four are arithmetic the sheet can do on its
 * own. The fourth is not: Healing Tonic restores "2d6 + twice your Instinct",
 * and the 2d6 is rolled at the table. The sheet asks for it rather than
 * inventing it, which is the same law `shieldRolls` keeps in enchanting.js.
 *
 * ----------------------------------------------------------------- this file
 * A leaf. It imports talents.js and nothing else, because characterModel.js has
 * to be able to read THRILLED's point ceilings and characterModel is upstream of
 * almost everything. Anything here that needs a card is handed the card.
 */

import { getTalent, normalizeTalents } from './talents.js';

/** The set this file is about. One id, in one place. */
export const TRICKSTER = 'trickster';

/** The one rider narrower than the glossary. See "what counts as a swing" above. */
const AMBUSH = 'ambush';

/* -------------------------------------------------------------- the set */

/**
 * The Trickster on this character, as `{ talent, rank, spec }`, or null.
 *
 * `spec` is the set's `tricks` block — the numbers the designer wrote. Reading
 * it through here rather than off `getTalent` directly means one place knows
 * that a set might not carry one.
 */
export function tricksterOf(talents) {
  const entry = normalizeTalents(talents).find((row) => row.id === TRICKSTER);
  if (!entry) return null;

  const talent = getTalent(TRICKSTER);
  if (!talent?.tricks) return null;

  return { talent, rank: entry.rank, spec: talent.tricks };
}

/**
 * What the two point pools hold for this character: 6 for everybody, 7 for a
 * Master Trickster.
 *
 * THRILLED is the only thing in the game that moves either ceiling, and both
 * were hardcoded to 6 in `deriveStats` before it existed. Returned as one shape
 * whether or not the character has the set, so the caller never branches.
 */
export function pointCeilings(talents) {
  const trickster = tricksterOf(talents);
  const points = trickster?.spec?.points ?? null;
  const max = Array.isArray(points) ? Number(points[trickster.rank]) || 6 : 6;
  return { ap: max, reaction: max };
}

/**
 * The set a Trickster card was played off, or null.
 *
 * The same shape `brewSetFor` hands the Cauldron, and for the same reason: a
 * window is opened by a card and needs the set the card came out of, and only the
 * character's own held sets count — a card in the codex is not a card in hand.
 */
export function trickSetFor(talents, cardId) {
  if (!cardId) return null;

  for (const held of normalizeTalents(talents)) {
    const set = getTalent(held.id);
    if (!set?.tricks) continue;
    if (!(set.cards ?? []).some((card) => card.id === cardId)) continue;
    return set;
  }
  return null;
}

/* ------------------------------------------------------------- the riders */

/**
 * Whether a card is one of the two attacks a weapon teaches.
 *
 * The tags, not the prose. See "what counts as a swing" above.
 */
export function isWeaponAttack(card) {
  return (card?.tags ?? []).some((tag) => /Weapon Attack$/i.test(String(tag)));
}

/**
 * Whether a card is the *plain* attack a weapon teaches, rather than its special
 * one.
 *
 * The narrower of the two tests, and the one an AMBUSH is measured against. Every
 * weapon in the codex teaches exactly one card tagged `Weapon Attack`, so this is
 * one card per weapon and there is nothing left to choose between: the price of an
 * ambush is knowable the moment a weapon is in hand, which is what let the window
 * that used to ask go away.
 */
export function isPlainAttack(card) {
  return (card?.tags ?? []).some((tag) => /^Weapon Attack$/i.test(String(tag).trim()));
}

/**
 * Whether one rider payload rides this card.
 *
 * The one place the narrowing lives, and it is read by both halves of a rider's
 * life: `trickRider` below prints it and `spendTricks` spends it, so the swing
 * that carries a rider is always the swing that takes it off. An ambush laid and
 * then followed by a Triple Strike is still waiting afterwards, because it was
 * never riding that swing.
 *
 * **Only STEAL's Poison row lays one of these now.** AMBUSH became a granted
 * Martial Move on 2026-09-03 and nothing writes an `ambush` payload any more, so
 * the narrowing on that id is here for the rows already sitting on people's
 * trackers: somebody mid-session has one they paid Willpower for, and it goes on
 * behaving exactly as it did until the swing spends it. Deleting the branch would
 * have quietly widened it onto a Special Weapon Attack, which is the one thing
 * the ruling it came from forbids.
 */
export function trickRides(trick, card) {
  if (!trick) return false;
  return trick.id === AMBUSH ? isPlainAttack(card) : isWeaponAttack(card);
}

/** A stored effects list, whatever shape it arrived in. */
function rows(effects) {
  if (Array.isArray(effects)) return effects;
  if (typeof effects !== 'string') return [];
  try {
    const parsed = JSON.parse(effects);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Every rider waiting on this character's next weapon attack, oldest first, or
 * every rider waiting on *this* attack when one is handed in.
 *
 * A row that has run out of turns is still a row until the turn it ran out on
 * ends, and a rider that has expired must not still be adding damage — so
 * anything counted down to nothing is left out here while staying on the block,
 * which is the same thing the tracker itself does.
 */
export function pendingTricks(effects, card = null) {
  return rows(effects).filter(
    (row) =>
      row &&
      typeof row === 'object' &&
      row.trick &&
      row.turns !== 0 &&
      (card === null || trickRides(row.trick, card))
  );
}

/**
 * The rider a card is carrying, summed, as the modifier shape the card
 * renderers already understand: `{ elevate, flat, advantage, advantaged }`.
 *
 * `flat` comes back as a multiplier on Instinct rather than a number of damage,
 * because that is what Poison is, and the card is the thing that knows which
 * attribute it is printed against.
 *
 * Elevate stacks — the glossary says so outright — so two riders on one swing
 * add up, capped at a d12 by `elevateDie` where the number is actually printed.
 *
 * Advantage does not, and that is the one place these two part company: "unless
 * they say otherwise effects don't stack from the same source", so two ambushes
 * bought for one swing are two payments of Elevate and one arrow. Deduped by the
 * card the arrow came off, here, because this is the one place the sum happens.
 * `advantaged` is what lent it, named, which is what the arrow credits.
 *
 * Only the riders that ride this card, which is `trickRides`' business rather
 * than this one's: a Special Weapon Attack is a weapon attack and a stolen Poison
 * rides it, while the ambush on the tracker beside it does not.
 */
export function trickRider(effects, card) {
  let elevate = 0;
  let flat = 0;
  const arrows = new Map();

  for (const row of pendingTricks(effects, card)) {
    elevate += Math.max(0, Number(row.trick.elevate) || 0);
    flat += Math.max(0, Number(row.trick.flat) || 0);

    const arrow = trickArrow(row);
    if (arrow) arrows.set(arrow.id, arrow);
  }

  const lent = [...arrows.values()];
  const advantage = lent.reduce((sum, arrow) => sum + arrow.advantage, 0);

  return elevate > 0 || flat > 0 || advantage > 0
    ? { elevate, flat, advantage, advantaged: lent.map((arrow) => arrow.name) }
    : null;
}

/**
 * How many d4s of Advantage a rider payload carries.
 *
 * The one function that knows an AMBUSH is "made with Advantage", and it is a
 * number rather than a flag because the arrow on the card adds it to everything
 * else bending the same roll.
 *
 * A payload laid before the number was written onto it still carries it: AMBUSH
 * has always been made with Advantage, and the alternative is a Trickster
 * mid-session losing the arrow they have already paid the Willpower for. That
 * reading is here rather than at the two call sites so a rider normalized on the
 * way out of storage and one read straight off the tracker cannot disagree.
 */
export function trickAdvantage(trick) {
  const paid = trick?.advantage ?? (trick?.id === AMBUSH ? 1 : 0);
  return Math.max(0, Math.floor(Number(paid) || 0));
}

/**
 * The Advantage one tracker row is lending and the card lending it, as
 * `{ id, name, advantage }`, or null.
 *
 * Two arrows are drawn off this: the one on the attack the rider is waiting on
 * (`trickRider` above) and the one on the row itself (`effectAdvantage` in
 * moves.js). They are the same claim, so they read the same function.
 */
export function trickArrow(row) {
  const trick = row?.trick;
  if (!trick) return null;

  const advantage = trickAdvantage(trick);
  return advantage > 0 ? { id: trick.id, name: trickName(trick.id), advantage } : null;
}

/**
 * The card a rider was bought off, named — what the arrow credits.
 *
 * Off the codex rather than off the row, because the row's own name carries the
 * attack it was bought for ("Ambush · Daggers - Triple Strike") and an arrow is
 * crediting the ability, not the swing. Falls back to the set for a rider with no
 * card of its own: a stolen Poison has none, and lends no Advantage either.
 */
function trickName(id) {
  const set = getTalent(TRICKSTER);
  return (set?.cards ?? []).find((card) => card.id === id)?.name ?? set?.name ?? 'Trickster';
}

/* `withTrickRider` used to live here: a weapon card's modifiers with this file's
   rider folded in. A second kind of rider arrived with the Duelist — a Martial
   Move waiting on the same swing — and a card cannot be printed off one of them
   and not the other, so the fold moved to `attackModifiers` in moves.js and every
   call site went with it. `trickRider` above is what that function reads. Poison's
   multiplier becomes a number there rather than here, and for the same reason it
   always did: "equal to your Instinct Attribute" means the Instinct they have when
   they swing, and the card it is about to be printed on may be a Physique card. */

/**
 * The effects list with every rider this attack carried taken off it, or null if
 * it carried none.
 *
 * "Thi should be lost on use" — and it is lost whether the swing hit or missed,
 * because AMBUSH's Willpower buys the attempt: Advantage applies to the roll,
 * and the roll has happened. Nothing here asks about the outcome, so nothing
 * here can be wrong about it.
 *
 * What it does ask about is the card, because a rider that did not ride this
 * swing was not spent by it: a Trickster who ambushes and then makes a Triple
 * Strike has made an attack and still has the ambush. Same test the printing side
 * reads, so the two can never disagree about which swing a rider belonged to.
 */
export function spendTricks(effects, card) {
  const list = rows(effects);
  const kept = list.filter(
    (row) => !(row && typeof row === 'object' && row.trick && trickRides(row.trick, card))
  );
  return kept.length === list.length ? null : kept;
}

/* -------------------------------------------------------------------- gone
 *
 * `ambushCost`, `ambushOption`, `ambushLine` and `ambushEffect` stood here until
 * 2026-09-03. AMBUSH became a granted Martial Move that day — see "the granted
 * three" in talents.js — so nothing prices it off the weapon in hand any more,
 * nothing writes it onto the tracker, and nothing has a sentence to print about
 * what it will do when the swing comes: it is added inside the swing's own prompt
 * and paid for there, and the printed card shows both halves before a point is
 * spent. `moveWillpower` in martial.js is what the price arithmetic became, one
 * line of it, because "1 Willpower per Damage Die" is now a rate a move can
 * carry rather than a function of its own.
 *
 * `diceCount` went with them, and that is the whole reason this note is here
 * rather than a silent deletion: `swingDice` in martial.js is the same reading,
 * moved to the file that now needs it.
 *
 * What stayed is everything above and everything below — the reading side of a
 * rider, and STEAL. See the note over `trickRides`.
 */

/* ------------------------------------------------------------------- steal */

/** A character's Instinct, floored, which is what every row on the table reads. */
function instinctOf(character) {
  return Math.floor(Number(character?.instinct) || 0);
}

/**
 * The four rows of STEAL's table, printed for this character.
 *
 * `value` is the row's own number on the card, `reachable` is whether the d4
 * allows it, and `line` is what taking it will actually do, in the numbers this
 * character has right now. A row the roll denies is still shown: the point of a
 * d4 is knowing what you missed.
 */
export function stealTable(spec, character, roll = null) {
  const stat = instinctOf(character);
  const reach = spec?.reach === 'below' ? (v) => roll !== null && v < roll : (v) => roll !== null && v <= roll;

  return (spec?.rows ?? []).map((row) => ({
    ...row,
    reachable: reach(row.value),
    /* What taking it will do, in this character's own numbers, so the window can
       say it before it does it. */
    line: stealLine(row, stat),
  }));
}

/** One row said in this character's numbers. */
function stealLine(row, stat) {
  const n = (Number(row.flat) || 0) * stat;
  switch (row.does) {
    case 'heal':
      return `Restores ${row.dice} + ${n} Health. The ${row.dice} is yours to roll.`;
    case 'poison':
      return `Your next weapon attack deals another ${n} damage.`;
    case 'shield':
      return `${n} Shield, up to what you can hold.`;
    case 'dust':
      return `${row.ap} Action Points now, and the Willpower this cost comes back.`;
    default:
      return '';
  }
}

/** Whether a row needs a die rolled at the table before it can be applied. */
export function stealNeedsRoll(row) {
  return Boolean(row?.dice);
}

/**
 * The patch that applies one row of the table.
 *
 * `rolled` is what the table got on the row's own dice, and is only read by the
 * one row that has any. `cap` is the character's shield ceiling, handed in
 * because it is characterModel's to work out and this file is below it.
 *
 * Returns `{ patch, said }` — the columns to write, and one line saying what
 * happened, which is what the window prints and what the ledger records. A row
 * that cannot be applied returns a null patch rather than a silent no-op.
 */
export function stealPatch(row, character, { rolled = 0, cap = 0, wp = 0 } = {}) {
  const stat = instinctOf(character);
  const n = (Number(row?.flat) || 0) * stat;

  switch (row?.does) {
    case 'heal': {
      const max = Math.floor(Number(character?.health_max) || 0);
      const gain = Math.max(0, Math.floor(Number(rolled) || 0)) + n;
      const health = Math.min(max, Math.floor(Number(character?.health) || 0) + gain);
      return {
        patch: { health },
        said: `${gain} Health back, to ${health} of ${max}.`,
      };
    }

    case 'shield': {
      const held = Math.floor(Number(character?.shield) || 0);
      const shield = Math.min(Math.max(0, Math.floor(cap)), held + n);
      return {
        patch: { shield },
        said:
          shield - held < n
            ? `${shield - held} Shield, to ${shield}. Your cap took the rest.`
            : `${n} Shield, to ${shield}.`,
      };
    }

    case 'dust': {
      /* "Grants 3 Action Points for the current round and refunds the Steal
         Willpower cost." Capped at the pool's own ceiling, which is the law
         everywhere else points are put *in* — see combatReactionGrant. A Master
         Trickster's ceiling is 7, so THRILLED is what makes this land in full. */
      const apMax = Math.floor(Number(character?.ap_max) || 0);
      const ap = Math.min(apMax, Math.floor(Number(character?.ap) || 0) + (Number(row.ap) || 0));
      const wpMax = Math.floor(Number(character?.willpower_max) || 0);
      const willpower = Math.min(
        wpMax,
        Math.floor(Number(character?.willpower) || 0) + Math.max(0, Math.floor(wp))
      );
      return {
        patch: { ap, willpower },
        said: `Action Points to ${ap} of ${apMax}, and ${wp} Willpower back.`,
      };
    }

    case 'poison': {
      /* The one row that writes no column at all. It lays a rider instead, and
         the caller is what owns the effects list — so this hands back the row to
         put on it rather than the list itself. */
      return {
        patch: null,
        effect: {
          name: 'Poison',
          note: `Your next weapon attack deals another ${n} damage. Lost the moment you swing.`,
          turns: null,
          until: null,
          from: 'Trickster · Steal',
          trick: { id: 'poison', flat: Number(row.flat) || 0 },
        },
        said: `Your next weapon attack carries another ${n}.`,
      };
    }

    default:
      return { patch: null, said: '' };
  }
}
