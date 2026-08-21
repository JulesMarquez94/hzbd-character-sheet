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
 * ---------------------------------------------------------------- the allowance
 * One move to a swing for everybody who knows one, and a Master Duelist's SHARP
 * is the only thing in the game that moves it: "you can now use two Martial Moves
 * on the same Weapon Attack, or use one Martial Move just before a Weapon Attack
 * reaction." Read off the set's `martial` spec, the way `pointCeilings` reads
 * THRILLED, so the rule is parsed out of a card exactly once.
 *
 * ---------------------------------------------------------- the weapon in hand
 * And the three Duelist cards that hang on it. DEXTEROUS grants advantage with
 * one-handed weapons and AGILE grants a point of Defense while one is in hand,
 * and both are conditions the sheet can actually check — the tag on the item.
 * FOLLOW UP is not: the sheet does not know an attack missed, so its reroll is a
 * printed rule the table plays and this file only counts it for the presentation
 * page.
 *
 * -------------------------------------------------------------------- this file
 * It reads the character, the codex and the loadouts. It writes nothing: every
 * function hands back a value or a patch for somebody else to store.
 */

import { getTalent, normalizeTalents } from './talents.js';
import { getMartialMove, isMartialMove } from './martial.js';
import { loadoutOf, loadoutState } from './loadouts.js';
import { heldItem, normalizeEquipment } from './items.js';
import { isWeaponAttack, trickArrow, trickRider } from './tricks.js';
import { feralRiders } from './feral.js';

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
 * `{ perAttack, onReaction, from }`.
 *
 * `from` is the set that raised it, so the sheet can say whose rule it is when it
 * refuses a second move. A character with no set that teaches moves still gets a
 * shape rather than a null, so no caller has to branch — they just never reach a
 * point where it matters, since they hold no moves to lay.
 */
export function moveAllowance(talents) {
  let perAttack = MOVE_ALLOWANCE;
  let onReaction = false;
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
  }

  return { perAttack, onReaction, from };
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
 * Only on a weapon attack. A move rides "your next Weapon Attack" and nothing
 * else, and the glossary is narrow about what one is — either of the two attacks
 * the weapon in your hands teaches you, which is what `isWeaponAttack` reads off
 * the tags.
 */
export function moveRider(effects, card) {
  if (!isWeaponAttack(card)) return null;

  let advantage = 0;
  let empower = 0;
  let elevate = 0;
  const names = [];
  const advantaged = [];

  for (const { card: move } of pendingMoves(effects)) {
    const gain = Math.max(0, Number(move.rides?.advantage) || 0);
    advantage += gain;
    empower += Math.max(0, Number(move.rides?.empower) || 0);
    elevate += Math.max(0, Number(move.rides?.elevate) || 0);
    names.push(move.name);
    // Separately, because the arrow credits only what is bending the roll while
    // the line beside the attack names everything that is riding it.
    if (gain > 0) advantaged.push(move.name);
  }

  return names.length > 0 ? { advantage, empower, elevate, names, advantaged } : null;
}

/**
 * What one tracker row is doing to a roll, for the arrow drawn on it, or null.
 *
 * "so ability that are in the tracker would do th same as well" — the last clause
 * of the note that asked for the arrow. A row that is only *naming* something
 * (WOUND, MOMENTUM) gets none: there is no number, and an arrow with nothing in
 * it is a decoration.
 *
 * Two kinds of row carry one: a Martial Move, whose d4s are printed on its own
 * card, and a Trickster's rider, which carries what it was paid for. An AMBUSH
 * waiting on the tracker is the clearest case there is — the Willpower is already
 * spent and the arrow is the only thing on the block saying what it bought.
 */
export function effectAdvantage(effect) {
  const card = effect?.move ? getMartialMove(effect.move.id) : null;
  const advantage = Math.max(0, Math.floor(Number(card?.rides?.advantage) || 0));
  if (advantage > 0) return { advantage, disadvantage: 0, from: [card.name] };

  const trick = trickArrow(effect);
  return trick ? { advantage: trick.advantage, disadvantage: 0, from: [trick.name] } : null;
}

/** The effects list with every Martial Move rider taken off it, or null if none was. */
export function spendMoves(effects) {
  const list = rows(effects);
  const kept = list.filter((row) => !(row && typeof row === 'object' && row.move));
  return kept.length === list.length ? null : kept;
}

/**
 * The rider a move lays, as an effect row for the tracker.
 *
 * Open-ended on purpose: a move waits until you swing, not for a number of turns.
 * The note is what the tracker prints under the name, and it says the one thing a
 * player needs from a row they are about to forget — that it is spent by swinging
 * whether or not the swing lands.
 */
export function moveEffect(card, talent = null) {
  return {
    name: card.name,
    note: 'Rides your next weapon attack. Spent the moment you swing.',
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

/** Whether the thing in hand carries the tag a set's `martial` spec asks for. */
function tagged(item, tag) {
  if (!item || !tag) return false;
  return (item.tags ?? []).some((held) => String(held).toLowerCase() === String(tag).toLowerCase());
}

/**
 * Every rider a set lays on the weapon currently in hand, summed across every set
 * the character holds, as `{ advantage, defense, from, item }`.
 *
 * Read off each set's own `martial` spec rather than off a set id, so a second set
 * that ever hangs something on a weapon tag needs no code here. `from` is the sets
 * that actually contributed, which is what lets the arrow on the card say why it
 * is there.
 */
export function weaponRiders(character, talents = character?.talents) {
  const item = inHand(character);

  let advantage = 0;
  let defense = 0;
  const from = [];

  for (const { talent, rank, spec } of martialSets(talents)) {
    if (!spec?.weapon || !tagged(item, spec.weapon)) continue;

    const gains = {
      advantage: Math.max(0, Math.floor(Number(spec.advantage?.[rank]) || 0)),
      defense: Math.max(0, Math.floor(Number(spec.defense?.[rank]) || 0)),
    };
    if (gains.advantage + gains.defense === 0) continue;

    advantage += gains.advantage;
    defense += gains.defense;
    from.push({ talent, ...gains });
  }

  return { advantage, defense, from, item };
}

/**
 * The flat Defense the weapon in hand is worth. AGILE, and nothing else yet.
 *
 * `deriveStats` reads this, which is what makes the point come *off* again the
 * moment a Duelist swaps to a two-hander — the parenthesis the AGILE card was
 * carrying, honoured in the one place a Defense is worked out rather than printed
 * on the card as a warning.
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
  const moves = moveRider(character?.effects, card);
  const swings = isWeaponAttack(card);
  const worn = swings ? weaponRiders(character) : null;
  /* And the Feral Curse's form, which grants advantage on every attack roll and
     another die to the natural weapon's own. Read here rather than in
     `weaponRiders` because it hangs on the *shape you are in* and not on the tag
     of the thing in your hand — see feralRiders in feral.js. */
  const hide = swings ? feralRiders(character) : null;
  const passive = (Number(worn?.advantage) || 0) + (Number(hide?.advantage) || 0);

  if (!trick && !moves && passive === 0 && !hide) return base;

  const empower =
    (Number(base?.empower) || 0) + (Number(moves?.empower) || 0) + (Number(hide?.empower) || 0);
  const elevate =
    (Number(base?.elevate) || 0) + (Number(trick?.elevate) || 0) + (Number(moves?.elevate) || 0);

  return {
    ...(base ?? {}),
    damage: base?.damage ?? [],
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
       Disadvantage one for one, so both are counted and the badge nets them. No
       card in the codex grants Disadvantage on your own swing yet; the field is
       here because the Developpement Notes asked for the arrow to work both ways,
       and a renderer that only understands one direction is one that has to be
       found and changed the first time something does. */
    advantage:
      (Number(base?.advantage) || 0) +
      passive +
      (Number(moves?.advantage) || 0) +
      /* And what a Trickster bought. AMBUSH is paid for before the swing and its
         first line is "The Weapon Attack is made with Advantage", so the arrow has
         to be on the card the player is deciding off — the same reason the Elevate
         it also bought is folded in above. */
      (Number(trick?.advantage) || 0),
    disadvantage: Number(base?.disadvantage) || 0,
    /* And where it came from, so the badge can say. An arrow with a 3 in it and no
       explanation is a number the reader has to go and reconstruct. */
    advantageFrom: advantageSources(worn, moves, hide, trick),
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
 * Everything lending advantage to this swing, named: the sets that grant it for
 * the weapon in hand, then the form the swinger is in, then the moves riding it,
 * then the trick bought for it, in that order — what you are, then what you paid
 * for. Only the ones actually granting any, so a set that hangs a Defense bonus on
 * the same weapon, or a form that only grants a die of Empowered on some other
 * weapon, is not credited with an arrow it had nothing to do with.
 */
function advantageSources(worn, moves, hide, trick) {
  const held = (worn?.from ?? []).filter((row) => row.advantage > 0).map((row) => row.talent.name);
  const shape = (hide?.from ?? []).filter((row) => row.advantage > 0).map((row) => row.talent.name);

  /* `moveRider` hands the moves back in the order they were paid for. A move with
     no advantage of its own is riding the swing but not bending the roll, so it is
     left off — it is named on the attack row instead, which is where what a move
     *does* belongs. `trickRider` keeps the same distinction for the same reason: a
     stolen Poison rides the swing and lends it no arrow. */
  return [...held, ...shape, ...(moves?.advantaged ?? []), ...(trick?.advantaged ?? [])];
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
