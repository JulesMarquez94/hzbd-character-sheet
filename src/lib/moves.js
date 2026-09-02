/**
 * The Martial Move machinery: what may be added to a swing, how many at once,
 * and what a weapon in one hand is worth.
 *
 * The codex is martial.js and is a leaf. This is the half that has to look at a
 * character: which of their sets teach moves, what their rank allows, which of
 * the moves they hold may ride the card in front of them and what the thing in
 * their hands does about it.
 *
 * ------------------------------------------------------------ added, not laid
 * **Rewritten on 2026-09-02.** Jules:
 *
 *   "Now they are not their own action you need to do before, instead whenever
 *    you make a weapon attack, you can choose to add 1 Martial move to the
 *    attack. [...] When you have marital moves and you make a weapon attack (or
 *    later special weapon attack). Then you should see list of your martial move
 *    on the action preview before you pay the cost so you can add one, or two
 *    later on. So they are not longer their own action but something you can add
 *    on top to modify them."
 *
 * Until that day a move was its own use: you paid for it, it laid a pending rider
 * on the effects tracker (the same storage the Trickster's AMBUSH uses), and it
 * sat there until a weapon attack came along and spent it. All of that is gone. A
 * move is now **chosen inside the use prompt of the attack itself**, priced into
 * the same pay button, folded into the same printed card and spent by the same
 * press. Nothing waits, so nothing is forgotten and nothing is paid for a swing
 * that never happened.
 *
 * What that cost this file: `pendingMoves`, `pendingCount`, `canLayMove`,
 * `moveEffect` and `spendMoves` are all gone, along with the tracker row they
 * wrote and read. What replaced them is smaller and reads one way only:
 *
 *   heldMoves       every move this character actually holds, from every source
 *   offeredMoves    which of those may be added to *this* card, right now
 *   moveCost        what the chosen ones add to the price of the swing
 *   withMoves       what the chosen ones do to the swing's numbers
 *
 * The last one is what the old `moveRider` was, and the only difference is where
 * the list comes from: it used to be read off the tracker and it is now handed in
 * by whoever is asking. See UsePrompt.jsx, which is the one caller that chooses,
 * and combatBar.js, which is the one that pays.
 *
 * A row left on somebody's tracker by the old flow is inert: nothing reads a
 * `move` payload any more, so it lends no advantage and blocks no swing. It draws
 * as an ordinary row and can be dropped. Said in data/README.md, because a player
 * mid-campaign will see one.
 *
 * ------------------------------------------------------------ which attack
 * **The plain one, and the special one only when something says so.** Jules,
 * 2026-08-28, testing: "reckless is only for weapon attacks, then gets updated to
 * also special weapon attack if you have the rank 3 talent."
 *
 * That supersedes the 2026-08-21 ruling this file was built on ("in the case of
 * martial move it just apply to both"), and the cards were on the new side of it
 * all along. Every Martial Move in the codex that names an attack names the same
 * one: "Your next **Weapon Attack** is made with advantage". `Weapon Attack` and
 * `Special Weapon Attack` are two different tags in this codex, every weapon
 * teaches one card of each, and the broad test read both. So a RECKLESS bought for
 * a swing was quietly doubling the value of a Cleave.
 *
 * A move reads `isPlainAttack`, the same narrow test a Trickster's AMBUSH reads.
 * What widens it is a rank, declared as data on the set's `martial` block beside
 * `perAttack` and `onReaction`:
 *
 *   special: [null, false, true, true]   indexed by rank, the way both its
 *                                        neighbours already are
 *
 * `moveAllowance` reads it and hands it out with the rest, so the whole system
 * asks the same one question. **All four sets carry it from 2026-09-02**, at Rank
 * 2, each behind a card of its own that prints the rule: Jules asked for "a
 * talent that allow you to use martial move on weapon special attack" on every
 * set that teaches them. Until that day the field existed and nothing set it,
 * because a rank that widened a move with no card saying so would have been the
 * sheet inventing a talent.
 *
 * ---------------------------------------------------------------- the allowance
 * One move to a swing for everybody who knows one, and every set that teaches
 * them raises it to two at Rank 3: a Duelist's SHARP, a Colossus's PERFECT
 * TECHNIQUE, a Feral Curse's BESTIAL FRENZY and, since 2026-09-02, a Guardian's
 * PERFECT GUARD. Read off each set's `martial` spec, the way `pointCeilings`
 * reads THRILLED, so the rule is parsed out of a card exactly once.
 *
 * `onReaction` is the third of the rank-indexed rules and the redesign changed
 * what it means rather than what it is worth. It used to mean "you may lay a move
 * in the instant before a reaction attack", which was a thing you did because
 * laying one was an action of its own. Now that a move is added to the attack it
 * means the plainer thing: **your moves may ride a weapon attack you make as a
 * reaction.** RIPOSTE is the one card in the codex that can only be used that
 * way, and `offeredMoves` is where both halves of the rule meet.
 *
 * ---------------------------------------------------------- the weapon in hand
 * And the cards that hang on it, which are now two sets' worth. DEXTEROUS grants
 * a Duelist advantage with Finesse, Whip, Fist and Polearm weapons and AGILE grants
 * a point of Defense while one is in hand; GIANT SLAYER grants a Colossus advantage
 * with a Great Weapon, COLOSSAL FORCE Elevates a Heavy or Great Melee swing and
 * PERFECT TECHNIQUE adds a die for every move riding one. All of them are
 * conditions the sheet can actually check — the tag on the item — and all of them
 * are declared as `grants` on the set rather than known here by name. A set may
 * name more than one tag and both of these do; see `tagged` below.
 *
 * FOLLOW UP is the counter-example: the sheet does not know an attack missed, so
 * its reroll is a printed rule the table plays and this file only counts it for the
 * presentation page. Three Colossus cards sit on that same line, all of them
 * Action Point discounts with nowhere to be printed. See data/README.md.
 *
 * -------------------------------------------------------------------- this file
 * It reads the character, the codex, the loadouts and the pact. It writes
 * nothing: every function hands back a value for somebody else to store.
 */

import { getTalent, normalizeTalents } from './talents.js';
import { isMartialMove } from './martial.js';
import { loadoutOf, loadoutState } from './loadouts.js';
import { heldItem, normalizeEquipment } from './items.js';
import { isPlainAttack, isWeaponAttack, trickArrow, trickRider } from './tricks.js';
import { feralLocks, feralRiders, passesForm } from './feral.js';
import { pactBoonRows, pactState, pactWeaponRiders } from './pact.js';
import { bendsSwing, effectRiders, riderOf } from './riders.js';
import { mergeSources, sourceRow } from './attribution.js';

/** How many Martial Moves anybody who knows one may add to a single swing. */
export const MOVE_ALLOWANCE = 1;

/** The card kind the loadout specs point at. One string, in one place. */
const MOVE_KIND = 'martial-move';

/* --------------------------------------------------------------- the sets */

/**
 * Every set this character holds that teaches Martial Moves, as
 * `{ talent, rank, spec }`.
 *
 * A set teaches them if its `loadout` points at the move codex, which is the same
 * test that put the pool on their Abilities tab. `spec` is the set's `martial`
 * block when it carries one — what it does to the move *system* — and is null for
 * a set that only teaches a hand.
 *
 * **Deliberately cheap.** It does not resolve the loadout, because the two hottest
 * callers do not need it: `weaponRiders` runs inside `deriveStats`, which runs on
 * every render of an editable sheet, and `moveAllowance` runs once per chip on the
 * quick bar. Resolving a loadout means filtering and sorting the whole card
 * registry, and neither of those two ever looks at a pick. `withPicks` below is
 * the version that does.
 */
export function martialSets(talents) {
  const rows = [];

  for (const entry of normalizeTalents(talents)) {
    const talent = getTalent(entry.id);
    if (!talent) continue;
    if (loadoutOf(talent)?.kind !== MOVE_KIND) continue;
    rows.push({ talent, rank: entry.rank, spec: talent.martial ?? null });
  }

  return rows;
}

/** The same sets with each one's hand resolved, for the callers that need it. */
function withPicks(talents) {
  return martialSets(talents).map((row) => ({
    ...row,
    state: loadoutState(talents, row.talent),
  }));
}

/** Whether this character can hold a Martial Move at all. */
export function knowsMoves(talents) {
  return martialSets(talents).length > 0;
}

/**
 * The moves this character actually has prepared, each with the set that taught
 * it, oldest set first.
 *
 * Two sets can teach the same move — a Guardian 1 / Duelist 1 knows two hands out
 * of one pool — and both are listed rather than deduped: they were paid for twice
 * and either copy can be spent. An illegal pick (a rank lost, a card the codex
 * dropped) is left out, because a move that cannot be taken cannot be added.
 */
export function preparedMoves(talents) {
  return withPicks(talents).flatMap(({ talent, state }) =>
    (state?.picks ?? [])
      .filter((pick) => pick.card && pick.ok)
      .map((pick) => ({ card: pick.card, talent, modifiers: pick.modifiers }))
  );
}

/**
 * The set a prepared move was learned from, or null.
 *
 * The same shape `trickSetFor` and `brewSetFor` hand their windows, and for the
 * same reason: a card is played off a *set*, and only the character's own held
 * sets count — a move in the codex is not a move in hand.
 *
 * The first set that has it, when two do. A Guardian 1 / Duelist 1 who prepared
 * WOUND on both hands paid for it twice and holds two copies of it; which of the
 * two the swing is charged against is not a distinction worth storing.
 */
export function moveSetFor(talents, cardId) {
  if (!cardId) return null;

  for (const { talent, state } of withPicks(talents)) {
    if ((state?.picks ?? []).some((pick) => pick.id === cardId && pick.ok)) return talent;
  }
  return null;
}

/**
 * What the move system allows this character, as
 * `{ perAttack, onReaction, special, discount, from }`.
 *
 * `from` is the set that raised it, so the sheet can say whose rule it is when it
 * refuses a second move. A character with no set that teaches moves still gets a
 * shape rather than a null, so no caller has to branch — they just never reach a
 * point where it matters, since they hold no moves to lay.
 *
 * `special` is the third of the rank-indexed rules and the newest: whether this
 * character's moves reach a Special Weapon Attack as well as the plain one. No
 * set declares it today, so it is false for everybody, which is exactly what the
 * cards print. See "which attack" at the top of this file.
 */
export function moveAllowance(talents) {
  let perAttack = MOVE_ALLOWANCE;
  let onReaction = false;
  let special = false;
  let discount = 0;
  let from = null;

  for (const { talent, rank, spec } of martialSets(talents)) {
    const allowed = Math.max(MOVE_ALLOWANCE, Math.floor(Number(spec?.perAttack?.[rank]) || 0));
    if (allowed > perAttack) {
      perAttack = allowed;
      from = talent;
    }
    if (spec?.onReaction?.[rank]) {
      onReaction = true;
      if (!from) from = talent;
    }
    /* One set is enough. A Duelist 3 / Guardian 1 who bought the widening once
       has it on every move they hold, the same way `perAttack` is the best of
       what they hold rather than the worst. */
    if (spec?.special?.[rank]) {
      special = true;
      if (!from) from = talent;
    }
    /* And what a move costs this character less. MARTIAL SWIFTNESS and nothing
       else: "every Martial Move you add to an attack costs 1 less Willpower". The
       best of what they hold rather than the sum, the same reading `perAttack`
       takes, because two sets teaching the same cut is one cut. */
    const cut = whole(spec?.discount?.[rank]);
    if (cut > discount) discount = cut;
  }

  return { perAttack, onReaction, special, discount, from };
}

/**
 * Whether this character's Martial Moves reach a Special Weapon Attack.
 *
 * Its own name because three places ask it and none of them wants the rest of the
 * allowance: the rider that prints on a card, the spend that takes it off, and the
 * note written onto the tracker row.
 */
export function movesReachSpecial(talents) {
  return moveAllowance(talents).special;
}

/**
 * Whether a Martial Move waiting on the tracker rides *this* card.
 *
 * The one place the narrowing lives, so what a card prints and what a swing spends
 * cannot come apart. `trickRides` in tricks.js is the same function for the other
 * rider system, written the same way and for the same reason.
 */
export function moveRides(card, special = false) {
  return special ? isWeaponAttack(card) : isPlainAttack(card);
}

/* ---------------------------------------------------------- what is offered */

/**
 * Every Martial Move this character actually holds, from every source that hands
 * one over, as `{ card, talent, modifiers }`.
 *
 * Two places hand them out and both are read here, because a move you own is a
 * move you can add whichever door it came through:
 *
 *   a loadout   the hand a set prepares, re-chosen at a rest. Four sets.
 *   a pact      a boon of the Pact of Ordenance. FIRST BOON seals one with the
 *               bargain, three rungs of the ladder are moves, and an endless
 *               bargain keeps handing them over forever.
 *
 * The pact was a gap the old flow had and nobody noticed, because a pact move
 * arrived on the quick bar as a chip like anything else and the bar was where you
 * laid one. Now that the offer is built here, a pact boon that was not read here
 * would be a card the wielder paid a rank for and can never use.
 *
 * Deduped by nothing: two sources can teach the same move and both copies stand,
 * because they were paid for twice. Which of the two is spent is not a
 * distinction worth storing, and one of them being ticked is what the prompt
 * counts.
 */
export function heldMoves(character) {
  const held = preparedMoves(character?.talents);

  for (const state of pactState(character)) {
    for (const { card, modifiers } of pactBoonRows(state)) {
      if (isMartialMove(card)) held.push({ card, talent: state.talent, modifiers });
    }
  }

  return held;
}

/**
 * The moves that may be added to *this* card, right now, in the order they were
 * learned.
 *
 * Four questions, and every one of them is somebody else's rule read here:
 *
 *   does a move ride this card at all   `moveRides`, which is the plain attack
 *                                       unless a rank has widened it
 *   is this the reaction it needs       RIPOSTE and nothing else, and only on a
 *                                       weapon attack made as a reaction
 *   is a reaction allowed to carry one  `onReaction`, off the set's own spec
 *   does the shape you are in allow it  a Feral Form's locks, per move
 *
 * `reaction` is whether the swing being priced is itself a reaction, which the
 * prompt already knows: it is the flag that leaves only the Reaction way on
 * offer. A character whose sets have not bought `onReaction` is offered nothing
 * on a reaction attack, which is the same refusal the old flow made by refusing
 * to let one be laid in that instant.
 *
 * The last one is the Feral Curse's, and it is asked per move because the answer
 * is about the *set* rather than the card: a form has "no non-Feral Curse
 * abilities or spells", the moves BEAST WITHIN teaches carry no tag of their own,
 * and a Duelist's copy of the same move was trained for a blade. So the set that
 * taught each one is what `passesForm` is handed, exactly as the quick bar hands
 * it the block a chip sat in. A forbidden move is left out of the list rather than
 * offered refused: the prompt is asking what to add to this swing, and a row you
 * cannot tick is a longer list with no more choices in it.
 *
 * Empty for every card that is not a weapon attack, and for everybody who holds
 * no moves, so the prompt can ask this of every use and draw nothing almost every
 * time.
 */
export function offeredMoves(character, card, { reaction = false } = {}) {
  const talents = character?.talents;
  if (!moveRides(card, movesReachSpecial(talents))) return [];

  const { onReaction } = moveAllowance(talents);
  if (reaction && !onReaction) return [];

  const locks = feralLocks(character);

  return heldMoves(character).filter(
    ({ card: move, talent }) =>
      (reaction || !move.reaction) &&
      passesForm(move, locks, { set: talent?.id ?? null }).ok
  );
}

/**
 * What the chosen moves add to the price of the swing, as `{ wp, ap }`.
 *
 * `wp` is the sum of what they print, and it is the whole of what a move costs:
 * the Action Points belong to the attack, which is the change of 2026-09-02. See
 * the head of martial.js.
 *
 * `discount` is what the holder takes off each one, off `moveAllowance`. A Master
 * Colossus's MARTIAL SWIFTNESS is the only thing in the codex that grants it, and
 * it is **per move** rather than per swing, which is what the card says: "every
 * Martial Move you add to an attack costs 1 less Willpower". Floored per move as
 * well as in total, so a 1 Willpower RIPOSTE becomes free and never a credit.
 *
 * `ap` is signed and is almost always zero. RIPOSTE is the one card that touches
 * it, and it *gives* a point back, so the sum is floored where it is applied
 * rather than here: a card that printed 1 Action Point with two Ripostes riding
 * it must not come out at minus one.
 */
export function moveCost(cards = [], discount = 0) {
  const cut = Math.max(0, Math.floor(Number(discount) || 0));
  let wp = 0;
  let ap = 0;

  for (const card of cards) {
    wp += Math.max(0, Math.floor(Number(card?.wp) || 0) - cut);
    ap += Math.floor(Number(card?.rides?.ap) || 0);
  }

  return { wp, ap };
}

/**
 * The moves whose own text says who the swing lands on, so the target picker has
 * to read them.
 *
 * `aims` on the card and never a reading of its prose, which is the whole point:
 * SWEEP's "every entity within your reach" turned a one-target Strike into a
 * room, and COORDINATED ATTACK's "an ally within reach of the target" names
 * somebody who *acts* rather than somebody who is hit. A prose reader cannot tell
 * those two apart, since both are a body with an article in front of it, and a
 * picker that offered the ally as a target would deliver the swing's damage to
 * them. So the codex says which, in one field. See targetPlan in targeting.js.
 */
export function aimingMoves(cards = []) {
  return cards.filter((card) => card?.aims);
}

/* ------------------------------------------------------------- the riders */

/**
 * What one tracker row is doing to a roll, for the arrow drawn on it, or null.
 *
 * "so ability that are in the tracker would do th same as well" was the last
 * clause of the note that asked for the arrow. A row that is only *naming*
 * something gets none: there is no number, and an arrow with nothing in it is a
 * decoration.
 *
 * Two kinds of row carry one: a Trickster's rider, which carries what it was paid
 * for, and a card whose own text bends a roll. An AMBUSH waiting on the tracker is
 * the clearest case there is, since the Willpower is already spent and the arrow
 * is the only thing on the block saying what it bought.
 *
 * **A Martial Move used to be the third kind and is not any more.** Nothing lays a
 * move on the tracker since 2026-09-02: a move is added to the swing in the
 * prompt, so its d4 is on the printed card and never on a row. A row left behind
 * by the old flow draws no arrow, because it lends none.
 *
 * A Lucky Brew is the other direction of the same thing, and an Unlucky one is the
 * first row on this block to draw the arrow downward.
 */
export function effectAdvantage(effect) {
  const trick = trickArrow(effect);
  if (trick) return { advantage: trick.advantage, disadvantage: 0, from: [trick.name] };

  /* The card's own, off the table in riders.js. Named after the row, which is what
     the player typed or picked and the only name they can look up. */
  const rider = riderOf(effect?.card);
  const up = Math.max(0, Math.floor(Number(rider?.advantage) || 0));
  const down = Math.max(0, Math.floor(Number(rider?.disadvantage) || 0));
  if (up + down === 0) return null;

  return { advantage: up, disadvantage: down, from: [effect?.name || ''] };
}

/**
 * One weapon attack's modifiers with the chosen Martial Moves folded in, or the
 * same object back when none were chosen.
 *
 * This is what `moveRider` was, and the one difference is where the list comes
 * from: it used to be read off the effects tracker and it is handed in now. It
 * runs *after* `attackModifiers`, on top of what that folded, because the moves
 * are chosen inside the prompt and everything else on the swing was known before
 * the prompt opened. So a tick of a checkbox re-folds the moves without
 * re-deriving the weapon, the form, the pact and the tracker behind them.
 *
 * Advantage stacks (the glossary says so outright: each instance is another d4),
 * Empowered adds a die each time and Elevate grows the die each time, capped at a
 * d12 where the number is actually printed. So all three simply add up.
 *
 * Two things ride along besides the numbers:
 *
 *   riding    the names, which is what the sheet prints beside the attack and
 *             deliberately not on the card: "when possible updating the attack
 *             text to say (not on the card) that this attack will MARTIAL MOVE
 *             NAME".
 *   sources   one row a move, because two moves on one swing are two sources and
 *             the reader is entitled to know which of them bought which die. A
 *             move that only *names* something (WOUND, DRIVE BACK) writes no row:
 *             it is riding the attack without changing a number, and `ridingLine`
 *             is where that belongs. See attribution.js.
 *
 * And one number is not the moves' own. PERFECT TECHNIQUE Empowers a Colossus's
 * swing "for each Martial Move on the attack", which is a count nothing knew until
 * the moves were picked, so `attackModifiers` leaves its `perMove` on the object
 * for this to multiply out.
 */
export function withMoves(modifiers, cards = []) {
  if (cards.length === 0) return modifiers;

  let advantage = 0;
  let empower = 0;
  let elevate = 0;
  const names = [];
  const advantaged = [];
  const sources = [];

  for (const move of cards) {
    const gain = Math.max(0, Number(move.rides?.advantage) || 0);
    const die = Math.max(0, Number(move.rides?.empower) || 0);
    const step = Math.max(0, Number(move.rides?.elevate) || 0);

    advantage += gain;
    empower += die;
    elevate += step;
    names.push(move.name);
    /* Separately, because the arrow credits only what is bending the roll while
       the line beside the attack names everything that is riding it. */
    if (gain > 0) advantaged.push(move.name);

    const row = sourceRow(move.name, { advantage: gain, empower: die, elevate: step }, move.id);
    if (row) sources.push(row);
  }

  /* PERFECT TECHNIQUE: "Each Martial Move on the attack Empowers its damage by
     1." A die per move riding rather than a die for having any, so a Master
     Colossus who added two gets two and one who added none gets nothing. Its own
     source row, for the same reason every other fold keeps one. */
  const perMove = Math.max(0, Math.floor(Number(modifiers?.perMove) || 0));
  const technique = perMove * cards.length;
  const held =
    technique > 0
      ? [sourceRow(modifiers?.perMoveFrom ?? 'Your set', { empower: technique })].filter(Boolean)
      : [];

  return {
    ...(modifiers ?? {}),
    empower: (Number(modifiers?.empower) || 0) + empower + technique,
    elevate: (Number(modifiers?.elevate) || 0) + elevate,
    advantage: (Number(modifiers?.advantage) || 0) + advantage,
    advantageFrom: [...(modifiers?.advantageFrom ?? []), ...advantaged],
    sources: mergeSources(modifiers?.sources ?? [], sources, held),
    riding: [...(modifiers?.riding ?? []), ...names],
  };
}

/* -------------------------------------------------------- the weapon in hand */

/**
 * The weapon in the main hand, or null. Its own function because all three of the
 * Duelist's conditional cards ask the same question of it, and because "in hand"
 * means the primary: the stowed weapon is not in anybody's hand, which is the
 * whole point of the swap costing Action Points.
 */
function inHand(character) {
  const equipment = normalizeEquipment(character?.equipment);
  return heldItem(character, equipment.main_hand);
}

/**
 * Whether the thing in hand carries the tag a set's `martial` spec asks for.
 *
 * A spec may name **more than one**, and two of them do: the Duelist reads
 * `['Finesse', 'Whip', 'Fist', 'Polearm']` and the Colossus
 * `['Heavy Melee', 'Great Melee']` (2026-08-24, Jules: "Duelist is Finesse, Whip,
 * Fist and polearm" and "Colossus uses Heavy Melee and Great melee weapons"). Any
 * one of them is a match, because they are the kinds of weapon a set trains on
 * rather than conditions to meet at once.
 */
function tagged(item, tag) {
  if (!item || !tag) return false;
  const wanted = (Array.isArray(tag) ? tag : [tag]).map((one) => String(one).toLowerCase());
  return (item.tags ?? []).some((held) => wanted.includes(String(held).toLowerCase()));
}

/**
 * Every rider a set lays on the weapon currently in hand, summed across every set
 * the character holds, as `{ advantage, defense, from, item }`.
 *
 * Read off each set's own `martial` spec rather than off a set id, so a second set
 * that ever hangs something on a weapon tag needs no code here. `from` is the sets
 * that actually contributed, which is what lets the arrow on the card say why it
 * is there.
 *
 * ------------------------------------------------------------------- `grants`
 * A list rather than one block of numbers, because the Colossus is the first set
 * whose cards hang on **two different tags at once**: GIANT SLAYER grants
 * advantage with a Great Weapon and COLOSSAL FORCE Elevates a Two-Handed one,
 * and a Great Two-Handed Weapon is both. So each entry names the tag it wants,
 * falling back to the set's own `weapon` when it does not, which is what keeps the
 * Duelist's two entries reading as they always did.
 *
 * Every entry is rank-indexed the way `tricks.points` is, and carries any of four
 * things:
 *
 *   advantage  extra d4s on the attack roll, because Advantage stacks
 *   defense    a flat point of Defense while the thing is in hand
 *   elevate    the same dice one size up, capped at a d12 where it is printed
 *   perMove    another die *per Martial Move riding the swing*, which is
 *              PERFECT TECHNIQUE and nothing else so far
 */
export function weaponRiders(character, talents = character?.talents) {
  const item = inHand(character);

  let advantage = 0;
  let defense = 0;
  let elevate = 0;
  let perMove = 0;
  const from = [];

  for (const { talent, rank, spec } of martialSets(talents)) {
    for (const grant of spec?.grants ?? []) {
      const tag = grant.weapon ?? spec?.weapon;
      if (!tag || !tagged(item, tag)) continue;

      const gains = {
        advantage: whole(grant.advantage?.[rank]),
        defense: whole(grant.defense?.[rank]),
        elevate: whole(grant.elevate?.[rank]),
        perMove: whole(grant.perMove?.[rank]),
      };
      if (gains.advantage + gains.defense + gains.elevate + gains.perMove === 0) continue;

      advantage += gains.advantage;
      defense += gains.defense;
      elevate += gains.elevate;
      perMove += gains.perMove;
      /* `name` is the card the grant is, which is what a reader can look up, and
         it falls back to the set for a grant that never named one. The set is kept
         beside it because the arrow badge has always credited the set and there is
         no reason to move that: a 20-pixel arrow wants the shorter word. */
      from.push({ talent, name: grant.from ?? talent.name, ...gains });
    }
  }

  return { advantage, defense, elevate, perMove, from, item };
}

/** A rank's reading of a grant, floored at zero. A rank a set has not reached is null. */
function whole(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

/**
 * The flat Defense the weapon in hand is worth. AGILE, and nothing else yet.
 *
 * `deriveStats` reads this, which is what makes the point come *off* again the
 * moment a Duelist swaps to a Melee Heavy — the parenthesis the AGILE card was
 * carrying, honoured in the one place a Defense is worked out rather than printed
 * on the card as a warning.
 *
 * It is no longer the only weapon-in-hand Defense on the sheet: the three shielded
 * weapons carry a flat point of their own on the item. That one is gear and lands
 * through `equipmentEffects` in items.js, which reads the main hand alone for the
 * same reason this does.
 *
 * Takes the whole character because the answer depends on the equipment map and
 * on the talents column together.
 */
export function martialDefense(character) {
  return weaponRiders(character).defense;
}

/* --------------------------------------------------------- the folded rider */

/**
 * One weapon attack's modifiers with everything standing on it folded in: what
 * the blade itself gives, what a Trickster has bought, what the set that trained
 * this hand grants for holding this kind of weapon, what the bargain lends and
 * what shape the swinger is in.
 *
 * `base` is the item's own (`wieldModifiers` in items.js). This is the one
 * function the three places that print an attack call, so the chip on the quick
 * bar, the row on the Loadout block and the card in the use prompt can never
 * disagree about what the next swing does.
 *
 * **Martial Moves are deliberately not in it.** Everything folded here is true of
 * the swing before anybody decides anything; a move is a decision made inside the
 * prompt, so `withMoves` folds those on top of this. That split is what lets a
 * checkbox re-price a swing without re-deriving the weapon, the form, the pact
 * and the tracker on every tick. See "added, not laid" at the top of this file.
 *
 * It returns `base` untouched when nothing is standing on the swing, so a
 * character with none of this on their sheet pays nothing for the file existing.
 */
export function attackModifiers(character, card, base) {
  const trick = trickRider(character?.effects, card);
  const swings = isWeaponAttack(card);
  const worn = swings ? weaponRiders(character) : null;
  /* And the Pact of Ordenance's weapon, when it is the thing being swung. The
     weapon is itself a boon, so FIRST BOON's highest-Attribute rule and the
     two rank riders land on its attacks the way they land on a granted spell.
     Handed the card, because the Inventory tab opens the stowed weapon's own
     attacks through this same fold and those are not the pact's. See
     pactWeaponRiders in pact.js. */
  const bound = swings ? pactWeaponRiders(character, card) : null;
  /* And the Feral Curse's form, which grants advantage on every attack roll and
     another die to the natural weapon's own. Read here rather than in
     `weaponRiders` because it hangs on the *shape you are in* and not on the tag
     of the thing in your hand. See feralRiders in feral.js. */
  const hide = swings ? feralRiders(character) : null;
  /* And whatever is on the tracker. GIANT GROWTH grants Empowered and it does not
     care whose card it was: a row on the block bends the card under it. Read on
     every attack rather than only a weapon one, because a spell attack is an
     attack and "granting it Empowered" names no weapon.

     **Only on a card there is something to bend.** Empowered and Elevate are
     both about damage dice, so a card that rolls none has nothing for them to do:
     a Healing Potion is not Empowered by a GIANT GROWTH. `damage` is the field
     that answers it, and every card in the codex that deals any carries one.

     `weapon` is the second narrowing and there is exactly one card in it: KINDLE
     WEAPON changes what the *blade* is made of, so on anything that is not a
     weapon attack it is skipped rather than folded. See riders.js. */
  const bendable = swings || (card?.damage ?? []).length > 0;
  const running = bendable ? effectRiders(character?.effects, { weapon: swings }) : null;
  const laid = running && bendsSwing(running) ? running : null;
  const passive =
    (Number(worn?.advantage) || 0) +
    (Number(hide?.advantage) || 0) +
    (Number(laid?.advantage) || 0) +
    (Number(bound?.advantage) || 0);
  /* And what holding this weapon is worth that is not an arrow. A Rank 2 Colossus
     with a plain Two-Handed Weapon and nothing waiting on it has COLOSSAL FORCE's
     Elevate and no advantage at all, so a guard that counted only arrows would
     hand the untouched card back and drop the die size on the way out. */
  const held = (Number(worn?.elevate) || 0) + (Number(worn?.perMove) || 0);

  if (!trick && !laid && !hide && !bound && passive === 0 && held === 0) return base;

  const empower =
    (Number(base?.empower) || 0) +
    (Number(bound?.empower) || 0) +
    (Number(hide?.empower) || 0) +
    (Number(laid?.empower) || 0);
  const elevate =
    (Number(base?.elevate) || 0) +
    (Number(trick?.elevate) || 0) +
    /* COLOSSAL FORCE, and the first thing in the codex to Elevate a swing for the
       weapon in hand rather than for something that was paid for. */
    (Number(worn?.elevate) || 0) +
    (Number(laid?.elevate) || 0);

  /* A type a running card lays on the swing joins the ones already on it, the
     same way two infusions both stand: the renderer prints a list as "Decay or
     Fire" and neither of them is thrown away. Deduplicated, so a Fire Infusion
     under a KINDLE WEAPON is one Fire. */
  const damage = [...(base?.damage ?? [])];
  for (const type of laid?.damage ?? []) {
    if (!damage.includes(type)) damage.push(type);
  }

  /* PERFECT TECHNIQUE's die per Martial Move, carried rather than counted. Its
     number depends on how many moves end up on the swing, which nothing knows
     until the prompt is open, so it rides out on the object for `withMoves` to
     multiply. Zero for everybody but a Master Colossus with the right haft in
     their hands, and left off the object entirely then, so nothing downstream has
     to read a field that is almost always nothing. */
  const perMove = Math.max(0, Math.floor(Number(worn?.perMove) || 0));
  const perMoveFrom = perMove > 0
    ? (worn?.from ?? []).find((row) => Number(row.perMove) > 0)?.name ?? null
    : null;

  return {
    ...(base ?? {}),
    damage,
    empower,
    elevate,
    /* A Trickster's stolen Poison lends flat damage to the swing. `flat` on that
       rider is a *multiplier* on Instinct rather than a number, since "equal to
       your Instinct Attribute" means the Instinct they have when they swing, so
       the sum is done here, where the character is in hand. This fold used to be
       `withTrickRider` in tricks.js; it moved when a second kind of rider arrived,
       because a card cannot be printed off one of them and not the other. */
    bonus: (Number(base?.bonus) || 0) + (Number(trick?.flat) || 0) * instinctOf(character),
    /* The two the arrow on the card prints. Advantage stacks and cancels
       Disadvantage one for one, so both are counted and the badge nets them.
       An Unlucky Brew is the first card in the codex to hand the swinger
       Disadvantage, and the renderer understood both directions before it
       existed because the Developpement Notes asked it to. */
    advantage:
      (Number(base?.advantage) || 0) +
      passive +
      /* And what a Trickster bought. AMBUSH is paid for before the swing and its
         first line is "The Weapon Attack is made with Advantage", so the arrow has
         to be on the card the player is deciding off, which is the same reason the
         Elevate it also bought is folded in above. */
      (Number(trick?.advantage) || 0),
    disadvantage: (Number(base?.disadvantage) || 0) + (Number(laid?.disadvantage) || 0),
    /* And where it came from, so the badge can say. An arrow with a 3 in it and no
       explanation is a number the reader has to go and reconstruct. */
    advantageFrom: advantageSources(worn, hide, trick, laid, bound),
    /* And the same question asked about every other number on the card, itemised.
       The badge above has room for a list of names and this has room for what each
       of them actually did, which is what the use prompt prints under the two
       ways. "Everything that is modified need to be seen but only what modifies
       it", 2026-08-28. See attribution.js. */
    sources: attackSources({ base, worn, hide, bound, laid, trick, character }),
    /* The pact's best-attribute rule, riding the swing the way a loadout's
       `cast` rides a spell. Only when the pact lends one: nothing else on this
       path moves a card's attribute, and `modifiers.stat` wins over the card's
       own in every renderer. */
    ...(bound?.stat ? { stat: bound.stat } : {}),
    ...(perMove > 0 ? { perMove, perMoveFrom } : {}),
  };
}

/** A character's Instinct, floored — what a Trickster's lent damage is worth. */
function instinctOf(character) {
  return Math.floor(Number(character?.instinct) || 0);
}

/**
 * Every source changing this attack, itemised and named.
 *
 * `advantageSources` below answers the same question about one number, in names
 * only, because the badge it feeds is a 20-pixel arrow. This answers it about all
 * of them and says what each source did, for the one place that has the room.
 *
 * The order is the order a player would explain it in, and it is deliberately not
 * the order the sums are written in above: **what you carry, then what you are,
 * then what you paid for.** The blade and its workings first, because that is the
 * thing in your hands; the sets and the bargain next, because those are true of
 * you whatever you are holding; the form after; then the rider you bought this
 * turn, which is the only row that will not be there next turn.
 *
 * The Martial Moves used to be the last row and they are `withMoves`'s now: they
 * are chosen after this has run, and a list of sources built before the choice
 * cannot carry it. PERFECT TECHNIQUE goes with them, because its number is a count
 * of moves and this has none to count.
 *
 * Every row comes back through `sourceRow`, so a source that lent this attack
 * nothing is never credited on it. A Duelist's AGILE grants a point of Defense
 * for the same Finesse weapon that DEXTEROUS lends an arrow for, and only one of
 * those two is changing the swing.
 */
function attackSources({ base, worn, hide, bound, laid, trick, character }) {
  const held = (worn?.from ?? []).map((row) =>
    sourceRow(row.name ?? row.talent?.name, {
      advantage: row.advantage,
      elevate: row.elevate,
    })
  );

  const sworn = bound?.sources ?? [];

  const shape = (hide?.from ?? []).map((row) =>
    sourceRow(row.talent?.name, { advantage: row.advantage, empower: row.empower })
  );

  /* The tracker, named after the row rather than the card, because that is the
     name the player will go looking for on block 6. The card id rides separately
     for exactly that reason: a row typed in by hand is named whatever its owner
     called it, and the name is no longer the lookup. */
  const tracked = (laid?.from ?? []).map(({ id, name, rider }) =>
    sourceRow(
      name,
      {
        advantage: rider.advantage,
        disadvantage: rider.disadvantage,
        empower: rider.empower,
        elevate: rider.elevate,
        damage: rider.damage,
      },
      id
    )
  );

  /* A Trickster's rider is one row however many were laid, because `trickRider`
     has already summed them and its `flat` is a multiplier on Instinct rather
     than a number: the same fold the `bonus` above does. */
  const stolen = trick
    ? [
        sourceRow((trick.advantaged ?? [])[0] ?? 'A trick you bought', {
          advantage: trick.advantage,
          elevate: trick.elevate,
          bonus: (Number(trick.flat) || 0) * instinctOf(character),
        }),
      ]
    : [];

  return mergeSources(base?.sources ?? [], held, sworn, shape, tracked, stolen);
}

/**
 * Everything lending advantage to this swing, named: the sets that grant it for
 * the weapon in hand, then the bargain, then the form the swinger is in, then
 * what is on the tracker, then the trick bought for it. What you carry, then what
 * you are, then what you paid for. Only the ones actually granting any, so a set
 * that hangs a Defense bonus on the same weapon, or a form that only grants a die
 * of Empowered on some other weapon, is not credited with an arrow it had nothing
 * to do with.
 *
 * A Martial Move's own d4 is added by `withMoves`, onto the end of this list, for
 * the same reason its die is: it is not chosen yet when this runs.
 */
function advantageSources(worn, hide, trick, laid, bound = null) {
  const held = (worn?.from ?? []).filter((row) => row.advantage > 0).map((row) => row.talent.name);
  const shape = (hide?.from ?? []).filter((row) => row.advantage > 0).map((row) => row.talent.name);
  /* The pact's, named off its own rider: `from` there is the set's name, and
     ENDLESS BARGAIN is the card a reader will go looking for. */
  const sworn = bound && Number(bound.advantage) > 0 ? bound.advantageFrom ?? [bound.from] : [];
  /* And the tracker, named after the row rather than the card id: a Lucky Brew is
     tracked under whatever the row says, and that is the name the player will go
     looking for when they want to know where the arrow came from.

     Both directions, because the badge nets them and an arrow pointing *down* has
     the same question behind it. A row lending neither is left off, the same as a
     move that is only riding the swing. */
  const tracked = (laid?.from ?? [])
    .filter(({ rider }) => Number(rider.advantage) > 0 || Number(rider.disadvantage) > 0)
    .map(({ name }) => name);

  return [...held, ...sworn, ...shape, ...tracked, ...(trick?.advantaged ?? [])];
}

/**
 * "This attack will Wound and Taunt" — the one line the sheet prints beside an
 * attack that is carrying something, or null when it is carrying nothing.
 *
 * The move's own printed name, because that is what the player is about to pay
 * for and what the row in the prompt above it says.
 */
export function ridingLine(modifiers) {
  const names = modifiers?.riding ?? [];
  if (names.length === 0) return null;
  return `This attack will ${listAnd(names)}.`;
}

/** "Wound", "Wound and Taunting", "Wound, Reckless and Taunting". No Oxford comma. */
function listAnd(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** Whether a card is a Martial Move, re-exported so callers need one import. */
export { isMartialMove };
