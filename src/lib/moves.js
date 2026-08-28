/**
 * The Martial Move machinery — what is waiting on your next swing, how many may
 * wait at once, and what a weapon in one hand is worth.
 *
 * The codex is martial.js and is a leaf. This is the half that has to look at a
 * character: which of their sets teach moves, what their rank allows, what is on
 * the tracker right now and what the thing in their hands does about it.
 *
 * ------------------------------------------------------------------ the rider
 * Straight off the Duelist's Developpement Notes, on SHARP:
 *
 *   "martial move are activate before the attack so they show in tracker until
 *    the atakc is made. Remove on the tracker on the attack aland and when
 *    possible updating the attack text to say (not on the card) that this attack
 *    will "MARTIAL MOVE NAME""
 *
 * So a move is not a thing you do to a target, it is a thing you do to your own
 * next swing, and the swing has to *show* it before it is made. That is a pending
 * rider, and the sheet already has one: the Trickster's AMBUSH (tricks.js). Same
 * storage, same law, and deliberately so — a rider you cannot see is a rider you
 * will forget you paid for.
 *
 * A rider is an ordinary row on the effects tracker carrying a `move` object, and
 * the object is one field:
 *
 *   { move: { id: 'wing-clip' } }
 *
 * Only the id, because unlike an ambush a move's numbers are printed on its card
 * and never vary. An AMBUSH stores its Elevate because that number is *history* —
 * what was actually paid. A WING CLIP's single d4 of advantage is the card's, so
 * it is read back off the card and a fix to the codex fixes every rider already
 * laid. See `rides` in martial.js.
 *
 * ------------------------------------------------------------------ lost on use
 * `spendMoves` is the other half of the note, and it fires at the one moment the
 * sheet can be sure a weapon attack happened: when one is paid for. The note says
 * "remove on the attack land", and this does not wait for the landing. Nothing
 * here asks about the outcome, so nothing here can be wrong about it — the same
 * reading `spendTricks` takes, and for the same reason: what a move buys is the
 * attempt. Advantage applies to the roll and the roll has happened. Flagged in
 * data/README.md in case the designer means the other thing.
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
 * A move now reads `isPlainAttack`, the same narrow test a Trickster's AMBUSH
 * always read. What widens it is a rank, declared as data on the set's `martial`
 * block beside `perAttack` and `onReaction`:
 *
 *   special: [null, false, false, true]   indexed by rank, the way both its
 *                                         neighbours already are
 *
 * `moveAllowance` reads it and hands it out with the rest, so the whole system
 * asks the same one question. Nothing carries it yet: no card in the codex prints
 * the rule, and a rank that widened a move without a card saying so would be the
 * sheet inventing a talent. See data/README.md.
 *
 * The knock-on is that `spendMoves` now takes the card, because a move that did
 * not ride this attack must not be spent by it. It used to take none, and that was
 * the whole of the old ruling in one argument.
 *
 * ---------------------------------------------------------------- the allowance
 * One move to a swing for everybody who knows one, and two sets move it: a Master
 * Duelist's SHARP ("you can now use two Martial Moves on the same Weapon Attack,
 * or use one Martial Move just before a Weapon Attack reaction") and a Colossus,
 * who buys the reaction half at Rank 2 with PRACTICED MOVES and the count at Rank
 * 3 with PERFECT TECHNIQUE. Read off each set's `martial` spec, the way
 * `pointCeilings` reads THRILLED, so the rule is parsed out of a card exactly once.
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
 * It reads the character, the codex and the loadouts. It writes nothing: every
 * function hands back a value or a patch for somebody else to store.
 */

import { getTalent, normalizeTalents } from './talents.js';
import { getMartialMove, isMartialMove } from './martial.js';
import { loadoutOf, loadoutState } from './loadouts.js';
import { heldItem, normalizeEquipment } from './items.js';
import { isPlainAttack, isWeaponAttack, trickArrow, trickRider } from './tricks.js';
import { feralRiders } from './feral.js';
import { pactWeaponRiders } from './pact.js';
import { bendsSwing, effectRiders, riderOf } from './riders.js';
import { mergeSources, sourceRow } from './attribution.js';

/** What anybody who knows a move may have waiting on one swing. */
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
 * dropped) is left out, because a move that cannot be taken cannot be laid.
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
 * WOUND on both hands paid for it twice and can lay it twice; which of the two
 * names the tracker row is not a distinction worth storing.
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
 * `{ perAttack, onReaction, special, from }`.
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
  }

  return { perAttack, onReaction, special, from };
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

/* ------------------------------------------------------------- the riders */

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
 * Every Martial Move waiting on this character's next weapon attack, in the order
 * they were paid for, as `{ row, card }`.
 *
 * Reversed on the way out, because the tracker stores newest first — "the thing
 * you just picked up is the thing you are checking", see addEffect. That order is
 * right for a list you are reading and wrong for a sentence: "this attack will
 * Wing Clip and Reckless" should name them in the order the player bought them.
 * Nothing else here cares, since advantage, Empower and Elevate all just add up.
 *
 * A row counted down to nothing is still a row until the turn it ran out on ends,
 * and an expired rider must not still be adding advantage — so anything at zero
 * turns is left out here while staying on the block. Same rule `pendingTricks`
 * keeps, and the same one the tracker itself draws by.
 *
 * A rider naming a move this build's codex has never heard of is dropped rather
 * than shown: it can say nothing about the swing, so it cannot ride one.
 */
export function pendingMoves(effects) {
  return rows(effects)
    .filter((row) => row && typeof row === 'object' && row.move && row.turns !== 0)
    .map((row) => ({ row, card: getMartialMove(row.move.id) }))
    .filter((entry) => entry.card)
    .reverse();
}

/** How many moves are already waiting, which is what the allowance is measured against. */
export function pendingCount(effects) {
  return pendingMoves(effects).length;
}

/**
 * The rider every waiting move adds to one weapon attack, summed, in the shape
 * the card renderers understand — plus the names, which is what the sheet prints
 * beside the attack.
 *
 * Advantage stacks (the glossary says so outright: each instance is another d4),
 * Empowered adds a die each time and Elevate grows the die each time, capped at a
 * d12 where the number is actually printed. So all three simply add up.
 *
 * Only on the attack the moves actually name. Every Martial Move in the codex
 * says "your next Weapon Attack", which is the plain one, and a rank can widen
 * that to the special one: `special` is what `moveAllowance` answers. A reload
 * and a Shield Block are tagged Weapon *Move* and carry nothing either way. See
 * "which attack" at the top of this file.
 */
export function moveRider(effects, card, special = false) {
  if (!moveRides(card, special)) return null;

  let advantage = 0;
  let empower = 0;
  let elevate = 0;
  const names = [];
  const advantaged = [];
  const sources = [];

  for (const { card: move } of pendingMoves(effects)) {
    const gain = Math.max(0, Number(move.rides?.advantage) || 0);
    const die = Math.max(0, Number(move.rides?.empower) || 0);
    const step = Math.max(0, Number(move.rides?.elevate) || 0);

    advantage += gain;
    empower += die;
    elevate += step;
    names.push(move.name);
    // Separately, because the arrow credits only what is bending the roll while
    // the line beside the attack names everything that is riding it.
    if (gain > 0) advantaged.push(move.name);

    /* And the receipt. One row a move, because two moves riding one swing are two
       sources and the reader is entitled to know which of them bought which die.
       A move that only *names* something (WOUND, MOMENTUM) writes no row: it is
       riding the attack without changing a number, and `ridingLine` is where that
       belongs. See attribution.js. */
    const row = sourceRow(
      move.name,
      { advantage: gain, empower: die, elevate: step },
      move.id
    );
    if (row) sources.push(row);
  }

  return names.length > 0
    ? { advantage, empower, elevate, names, advantaged, sources }
    : null;
}

/**
 * What one tracker row is doing to a roll, for the arrow drawn on it, or null.
 *
 * "so ability that are in the tracker would do th same as well" — the last clause
 * of the note that asked for the arrow. A row that is only *naming* something
 * (WOUND, MOMENTUM) gets none: there is no number, and an arrow with nothing in
 * it is a decoration.
 *
 * Three kinds of row carry one: a Martial Move, whose d4s are printed on its own
 * card, a Trickster's rider, which carries what it was paid for, and a card whose
 * own text bends a roll. An AMBUSH waiting on the tracker is the clearest case
 * there is — the Willpower is already spent and the arrow is the only thing on the
 * block saying what it bought.
 *
 * A Lucky Brew is the other direction of the same thing, and an Unlucky one is the
 * first row on this block to draw the arrow downward.
 */
export function effectAdvantage(effect) {
  const card = effect?.move ? getMartialMove(effect.move.id) : null;
  const advantage = Math.max(0, Math.floor(Number(card?.rides?.advantage) || 0));
  if (advantage > 0) return { advantage, disadvantage: 0, from: [card.name] };

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
 * The effects list with every Martial Move rider taken off it, or null if none
 * was.
 *
 * **It takes the card now**, exactly the way `spendTricks` always has. It used to
 * take none, and that one missing argument was the whole of the 2026-08-21 ruling:
 * a move rode either of a weapon's two attacks, so whichever was paid for spent
 * it and there was nothing to check. Now a move rides the attack its own card
 * names, so a Cleave has to leave a RECKLESS sitting on the tracker waiting for
 * the swing it was bought for.
 *
 * Same law as the printing half, through the same `moveRides`, so the card that
 * showed the arrow is the card that takes it off.
 */
export function spendMoves(effects, card, special = false) {
  if (!moveRides(card, special)) return null;

  const list = rows(effects);
  const kept = list.filter((row) => !(row && typeof row === 'object' && row.move));
  return kept.length === list.length ? null : kept;
}

/**
 * The rider a move lays, as an effect row for the tracker.
 *
 * Open-ended on purpose: a move waits until you swing, not for a number of turns.
 * The note is what the tracker prints under the name, and it says the two things a
 * player needs from a row they are about to forget: that either of the weapon's
 * two attacks is the swing that takes it, and that it goes whether or not the
 * swing lands.
 */
export function moveEffect(card, talent = null, special = false) {
  return {
    name: card.name,
    /* What it rides, said the way this character's rank actually has it. A note
       promising a special attack to somebody whose moves do not reach one is the
       row lying about the thing it is there to remind you of. */
    note: special
      ? 'Rides your next weapon attack, special or not. Spent the moment you swing.'
      : 'Rides your next plain Weapon Attack, not a special one. Spent the moment you swing.',
    turns: null,
    until: null,
    from: talent?.name ? `${talent.name} · Martial Move` : 'Martial Move',
    card: card.id,
    move: { id: card.id },
  };
}

/**
 * Whether one more move may be laid right now, as `{ ok, reason }`.
 *
 * The refusal names the rule and whose it is, because "you cannot" with no reason
 * reads as a bug. A character who knows no moves is refused too, which is a case
 * the bar never reaches — you cannot tap a card you do not hold — but a window
 * that can be reached another way should not be the one place the rule is missing.
 */
export function canLayMove(character, talents = character?.talents) {
  const { perAttack, from } = moveAllowance(talents);
  const waiting = pendingCount(character?.effects);

  if (waiting < perAttack) return { ok: true, reason: null, waiting, perAttack };

  return {
    ok: false,
    waiting,
    perAttack,
    reason:
      perAttack === 1
        ? 'One Martial Move rides a swing. Make the attack, or drop the one waiting on the tracker.'
        : `${from?.name ?? 'Your set'} allows ${perAttack} on one swing, and ${perAttack} are waiting.`,
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
 * One weapon attack's modifiers with everything waiting on it folded in: what the
 * blade itself gives, what a Trickster has bought, what Martial Moves are riding,
 * what the set that trained this hand grants for holding this kind of weapon, and
 * what shape the swinger is in.
 *
 * `base` is the item's own (`wieldModifiers` in items.js). This is the one
 * function the three places that print an attack call, so the chip on the quick
 * bar, the row on the Loadout block and the card in the use prompt can never
 * disagree about what the next swing does.
 *
 * It returns `base` untouched when nothing is waiting, so a character with none of
 * this on their sheet pays nothing for the file existing.
 */
export function attackModifiers(character, card, base) {
  const trick = trickRider(character?.effects, card);
  /* Whether this character's moves reach a Special Weapon Attack. Asked once for
     the whole fold rather than inside `moveRider`, because the same answer decides
     what prints here and what the swing spends in combatBar.js, and the two must
     never disagree. See "which attack" at the top of this file. */
  const special = movesReachSpecial(character?.talents);
  const moves = moveRider(character?.effects, card, special);
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
     of the thing in your hand — see feralRiders in feral.js. */
  const hide = swings ? feralRiders(character) : null;
  /* And whatever is on the tracker. GIANT GROWTH grants Empowered and it does not
     care whose card it was: a row on the block bends the card under it. Read on
     every attack rather than only a weapon one, because a spell attack is an
     attack and "granting it Empowered" names no weapon.

     **Only on a card there is something to bend.** Empowered and Elevate are
     both about damage dice, so a card that rolls none has nothing for them to do:
     a RECKLESS waiting on the tracker is not itself Empowered by a GIANT GROWTH,
     and neither is a Healing Potion. `damage` is the field that answers it, and
     every card in the codex that deals any carries one.

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

  if (!trick && !moves && !laid && !hide && !bound && passive === 0 && held === 0) return base;

  const empower =
    (Number(base?.empower) || 0) +
    (Number(bound?.empower) || 0) +
    (Number(moves?.empower) || 0) +
    /* PERFECT TECHNIQUE: "Each Martial Move on the attack Empowers its damage by
       1." A die per move riding rather than a die for having any, so a Master
       Colossus who laid two gets two and one who laid none gets nothing. */
    (Number(worn?.perMove) || 0) * (moves?.names?.length ?? 0) +
    (Number(hide?.empower) || 0) +
    (Number(laid?.empower) || 0);
  const elevate =
    (Number(base?.elevate) || 0) +
    (Number(trick?.elevate) || 0) +
    (Number(moves?.elevate) || 0) +
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

  return {
    ...(base ?? {}),
    damage,
    empower,
    elevate,
    /* A Trickster's stolen Poison lends flat damage to the swing. `flat` on that
       rider is a *multiplier* on Instinct rather than a number — "equal to your
       Instinct Attribute" means the Instinct they have when they swing — so the sum
       is done here, where the character is in hand. This fold used to be
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
      (Number(moves?.advantage) || 0) +
      /* And what a Trickster bought. AMBUSH is paid for before the swing and its
         first line is "The Weapon Attack is made with Advantage", so the arrow has
         to be on the card the player is deciding off — the same reason the Elevate
         it also bought is folded in above. */
      (Number(trick?.advantage) || 0),
    disadvantage: (Number(base?.disadvantage) || 0) + (Number(laid?.disadvantage) || 0),
    /* And where it came from, so the badge can say. An arrow with a 3 in it and no
       explanation is a number the reader has to go and reconstruct. */
    advantageFrom: advantageSources(worn, moves, hide, trick, laid, bound),
    /* And the same question asked about every other number on the card, itemised.
       The badge above has room for a list of names and this has room for what each
       of them actually did, which is what the use prompt prints under the two
       ways. "Everything that is modified need to be seen but only what modifies
       it", 2026-08-28. See attribution.js. */
    sources: attackSources({ base, worn, hide, bound, laid, moves, trick, character }),
    /* The pact's best-attribute rule, riding the swing the way a loadout's
       `cast` rides a spell. Only when the pact lends one: nothing else on this
       path moves a card's attribute, and `modifiers.stat` wins over the card's
       own in every renderer. */
    ...(bound?.stat ? { stat: bound.stat } : {}),
    /* What the sheet prints beside the attack, and deliberately not on the card:
       "when possible updating the attack text to say (not on the card) that this
       attack will MARTIAL MOVE NAME". */
    riding: moves?.names ?? [],
  };
}

/** A character's Instinct, floored — what a Trickster's lent damage is worth. */
function instinctOf(character) {
  return Math.floor(Number(character?.instinct) || 0);
}

/**
 * Every source changing this attack, itemised and named.
 *
 * `advantageSources` above answers the same question about one number, in names
 * only, because the badge it feeds is a 20-pixel arrow. This answers it about all
 * of them and says what each source did, for the one place that has the room.
 *
 * The order is the order a player would explain it in, and it is deliberately not
 * the order the sums are written in above: **what you carry, then what you are,
 * then what you paid for.** The blade and its workings first, because that is the
 * thing in your hands; the sets and the bargain next, because those are true of
 * you whatever you are holding; the form after; then the two riders you bought
 * this turn, which are the only rows that will not be there next turn.
 *
 * Every row comes back through `sourceRow`, so a source that lent this attack
 * nothing is never credited on it. A Duelist's AGILE grants a point of Defense
 * for the same Finesse weapon that DEXTEROUS lends an arrow for, and only one of
 * those two is changing the swing.
 */
function attackSources({ base, worn, hide, bound, laid, moves, trick, character }) {
  /* PERFECT TECHNIQUE is the one rider whose number is not its own: "each Martial
     Move on the attack Empowers its damage by 1", so what it is worth depends on
     how many moves are riding. Worked out here the same way the sum above works
     it out, off the same two values. */
  const riding = moves?.names?.length ?? 0;

  const held = (worn?.from ?? []).map((row) =>
    sourceRow(row.name ?? row.talent?.name, {
      advantage: row.advantage,
      elevate: row.elevate,
      empower: (Number(row.perMove) || 0) * riding,
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

  return mergeSources(base?.sources ?? [], held, sworn, shape, tracked, moves?.sources ?? [], stolen);
}

/**
 * Everything lending advantage to this swing, named: the sets that grant it for
 * the weapon in hand, then the form the swinger is in, then the moves riding it,
 * then the trick bought for it, in that order — what you are, then what you paid
 * for. Only the ones actually granting any, so a set that hangs a Defense bonus on
 * the same weapon, or a form that only grants a die of Empowered on some other
 * weapon, is not credited with an arrow it had nothing to do with.
 */
function advantageSources(worn, moves, hide, trick, laid, bound = null) {
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

  /* `moveRider` hands the moves back in the order they were paid for. A move with
     no advantage of its own is riding the swing but not bending the roll, so it is
     left off — it is named on the attack row instead, which is where what a move
     *does* belongs. `trickRider` keeps the same distinction for the same reason: a
     stolen Poison rides the swing and lends it no arrow. */
  return [
    ...held,
    ...sworn,
    ...shape,
    ...tracked,
    ...(moves?.advantaged ?? []),
    ...(trick?.advantaged ?? []),
  ];
}

/**
 * "this attack will Wound and Taunt" — the one line the sheet prints beside an
 * attack that is carrying something, or null when it is carrying nothing.
 *
 * The move's own printed name, because that is what the player paid for and what
 * the tracker row above it says.
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
