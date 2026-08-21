/**
 * The two halves of what a character *has*: what they can play, and what is
 * simply true of them.
 *
 * The Abilities tab files every card under whoever gave it (see
 * abilitySources.js) because "where did I get this" is the question a sheet
 * cannot otherwise answer. Mid-fight that is the wrong question. The two
 * questions then are "what can I do right now" and "what am I forgetting I
 * have", and this file answers exactly those two, for blocks 4 and 5.
 *
 * ------------------------------------------------------------ the two sides
 * Every card a character holds lands on exactly one side, by one rule:
 *
 *   active   something you play. It costs points, or it is a thing on your
 *            belt you reach for. It goes in the quick bar.
 *   standing something you never play. A passive, or a skill you are trained
 *            in. It goes in the recap.
 *
 * `isPassive` is the codex's own test and is reused unchanged. Skills join the
 * standing side whatever they cost, because a skill is not a move: it is a
 * thing you are good at, and it comes up when the table asks for a roll rather
 * than when you spend a turn.
 *
 * ---------------------------------------------------------- the quick bar
 * Grouped by *where you reach*, in the order you reach: your hands, your belt,
 * then what you know, then the actions everyone in the world has. The standard
 * actions come last on purpose. They never change and they are never
 * forgotten; the four spells you prepared this morning are the ones that need
 * to be under your thumb.
 *
 * The weapon in your hands and the loops on your belt appear here as well as
 * on the Loadout block, and that is the point of a quick bar. Block 3 is where
 * a loadout is *read* (which hand, how many charges, what is stowed). This is
 * where a turn is *spent*, and a turn that cannot reach your sword is not a
 * turn.
 *
 * ------------------------------------------------------------- the recap
 * Grouped by what a thing *is* rather than by where it came from, because the
 * blocks on the Abilities tab already answer the second one. Provenance is not
 * lost: it rides on each row as a note, so "Sharpsense · Draconic" still says
 * where it came from in the width a chip has.
 *
 * This file reads the character and the codex. It writes nothing.
 */

import { BASIC_ACTIONS } from './actions.js';
import { abilitySources, isPassive } from './abilitySources.js';
import { enchanterState, runningEnchants } from './enchanting.js';
import { getEnchantment } from './enchantments.js';
import { isMinionCard, minionModifiers } from './minions.js';
import {
  beltEntry,
  beltSlotCount,
  carriedItems,
  heldItem,
  wieldModifiers,
  normalizeBelt,
  normalizeEquipment,
} from './items.js';
import { getCard, itemEnchantments } from './weapons.js';
import { isWeaponAttack, spendTricks } from './tricks.js';
import {
  canEnterForm,
  enterForm,
  feralLocks,
  formFor,
  leaveForm,
  passesForm,
  sourceSet,
} from './feral.js';
import { addEffect } from './combatTurn.js';
import {
  LEDGER_NOTE_MAX,
  appendLedger,
  newLedgerId,
  shieldCapFor,
} from './characterModel.js';
import {
  attackModifiers,
  canLayMove,
  isMartialMove,
  moveEffect,
  moveSetFor,
  ridingLine,
  spendMoves,
} from './moves.js';

/* ------------------------------------------------------------------- parts */

/**
 * "Daggers - Triple Strike" is the printed name, and the row above already
 * says which weapon it belongs to. A chip has room for one of the two.
 */
export function shortName(card, fallback = '') {
  const name = card?.name ?? fallback;
  return String(name).split(' - ').pop();
}

/** A skill is standing whatever else it looks like. See the note above. */
function isStanding(card) {
  return card?.kind === 'skill' || isPassive(card);
}

/** Everything a source holds, flattened, with the stratum it sat under. */
function rowsOf(source) {
  return source.sections.flatMap((part) =>
    part.cards.map(({ card, modifiers }) => ({
      card,
      modifiers,
      source,
      section: part.label,
    }))
  );
}

/* --------------------------------------------------------- the quick bar */

/**
 * One playable thing, said the way both the chip and the use prompt need it.
 *
 * `extra` is whatever else the use writes besides the points: a charge off a
 * flask, and nothing else so far. It is computed here rather than in the block
 * so that the block only has to spend points and apply what it is handed.
 */
function move(key, card, { name, source, modifiers = null, note = null, extra = null, ...rest }) {
  return {
    key,
    card,
    name: name ?? shortName(card),
    source,
    modifiers,
    note,
    extra,
    ap: card?.ap ?? null,
    wp: card?.wp ?? null,
    variable: Boolean(card?.variable),
    converts: card?.converts ?? null,
    /* What using this opens once it is paid for. BREW opens the brewing window,
       because what a Brew costs is not known until it is mixed. It rides as data on
       the card, never read out of its prose. */
    opens: card?.opens ?? null,
    /* And whether the window is where it gets paid for. EPHEMERAL ENCHANTMENT
       prints 3 Action Points and `x` Willpower: charging the printed half at the
       chip and the rest in the window would ask the action-or-reaction question
       twice and take the Action Points off anyone who then closed the shelf. So a
       card marked this way opens its window first and pays for everything once,
       inside it. */
    pays: card?.pays ?? null,
    spent: false,
    ...rest,
  };
}

/** What the weapon in your hands does, printed for that weapon. */
function handGroup(character) {
  const equipment = normalizeEquipment(character?.equipment);
  const primary = heldItem(character, equipment.main_hand);
  if (!primary) return null;

  /* The weapon as this character swings it, so a hand chip prints the damage an
     Enchanter's own enchantments impose as well as the blade's own. */
  const modifiers = wieldModifiers(character, primary);
  const moves = (primary.abilities ?? [])
    .map(getCard)
    .filter(Boolean)
    .map((card) => {
      /* Whatever is waiting on the next swing: an AMBUSH already paid for, a
         Martial Move riding, and the advantage a Duelist has for holding this kind
         of weapon at all. All of it has to show on the chip and on the card
         *before* the attack is made — which is the whole of what both sets'
         Developpement Notes asked for. See attackModifiers in moves.js. */
      const riders = attackModifiers(character, card, modifiers);

      return move(`hand:${card.id}`, card, {
        source: `${primary.name} · in hand`,
        modifiers: riders,
        /* And named, so the prompt that is about to spend them says which. */
        note: ridingLine(riders),
      });
    });

  return moves.length > 0
    ? { id: 'hand', label: 'In Hand', note: primary.name, moves }
    : null;
}

/**
 * The filled loops, in loop order. An empty loop is not a move and is not
 * shown: block 3 is where you notice a loop is empty, and this block has no
 * width to spend saying nothing.
 */
function beltGroup(character, locks) {
  const belt = normalizeBelt(character?.belt);
  // A loop that has not opened yet cannot be reached, whatever is stored in it.
  const open = beltSlotCount(character);

  /* And the one thing that can shut every loop at once. FERAL FORM: "in this
     form you are unable to use items", and the belt is where this sheet uses
     one — armor is worn and a weapon is wielded, but a loop is reached for. A
     loop is offered refused rather than hidden, wearing the reason, which is what
     it already does for a flask with no charges left. */
  const shut = passesForm(null, locks, { item: true });

  const moves = belt
    .map((entry, index) => ({ state: beltEntry(character, entry), index }))
    .filter(({ state, index }) => state && index < open)
    .map(({ state, index }) => {
      const { item, charges, used, remaining, consumable, spent } = state;
      const card = getCard(item.abilities?.[0]);

      // A charged item spends one on the way out; anything else is only points.
      const nextBelt = charges > 0 ? [...belt] : null;
      if (nextBelt) nextBelt[index] = { id: item.id, used: used + 1 };

      return move(`belt:${index}`, card, {
        name: card?.name ?? item.name,
        source: `${item.name} · loop ${index + 1}`,
        note: charges > 0 ? chargeNote(remaining, consumable, item) : null,
        extra: shut.ok && nextBelt ? { belt: nextBelt } : null,
        spent: spent || !shut.ok,
        spentLabel: shut.ok ? undefined : 'No hands',
        spentNote: shut.ok ? undefined : shut.reason,
        charges,
        used,
        item,
      });
    });

  return moves.length > 0 ? { id: 'belt', label: 'On the Belt', note: null, moves } : null;
}

/** What the item loses on top of the points, said before it happens. */
function chargeNote(remaining, consumable, item) {
  const left = remaining - 1;
  if (left > 0) return `Spends a charge. ${left} of ${remaining} left after this.`;
  if (consumable) return 'This is the last of it. Using it finishes the item.';
  return item.recharge
    ? `Its last charge. It comes back after a ${item.recharge}.`
    : 'Its last charge.';
}

/** One group per source that holds something playable, in the codex's order. */
function knownGroups(character, locks) {
  /* Whether there is room for another Martial Move on the next swing. Asked once
     for the whole bar rather than once per chip: the answer is about the
     character, not the card, and working it out means reading every set that
     teaches moves. */
  const room = canLayMove(character);

  return abilitySources(character)
    /* A source can hold cards that are neither played nor standing. A Cauldron
       Keeper's Ingredients are the case: you never use one, you put it in a Brew,
       and BREW is the card that gets played. The Abilities tab reads them; neither
       block here lists them. */
    .filter((source) => !source.aside)
    .map((source) => {
      /* Which set this block belongs to, for the one lock that cares. A form
         forbids "non-Feral Curse abilities or spells", and the pool that set hands
         over is tagged `Martial Move` rather than with the set's own word, so the
         block it sits in is what says whose it is. */
      const set = sourceSet(source.id);

      const moves = rowsOf(source)
        /* And a card somebody else on your sheet plays is not on your bar. A
           draconic ally's Wyrm Bolt costs *its* Action Points, so offering it
           here would pay for it out of the wrong pool. It is on the creature's
           own bar instead — see minionBar below. */
        .filter(({ card }) => !isStanding(card) && !isMinionCard(card))
        .map(({ card, modifiers }) =>
          move(`${source.id}:${card.id}`, card, {
            source: `${card.name} · ${source.title}`,
            modifiers,
            ...martialUse(character, card, room),
            ...feralUse(character, card, set),
            ...formRefusal(card, locks, { set }),
          })
        );

      return moves.length > 0
        ? { id: source.id, label: source.title, note: source.note, moves }
        : null;
    })
    .filter(Boolean);
}

/**
 * The extra a Martial Move carries, or nothing at all for every other card.
 *
 * A move is not resolved when it is used: paying for it lays a rider on the
 * tracker and the next weapon attack carries it. So the whole of what using one
 * does is an `extra` on the row, and it is written here rather than in the block
 * for the same reason a flask's spent charge is — the block spends points and
 * applies what it was handed.
 *
 * The allowance rides in rather than being asked for per card. One move rides a
 * swing, or two for a Master Duelist, and a chip offered when there is no room is
 * a chip that takes your Willpower and lays nothing. It is shown refused instead,
 * wearing the reason, which is what the belt already does for a flask with no
 * charges left.
 */
function martialUse(character, card, room) {
  if (!isMartialMove(card)) return {};

  return {
    note: 'It waits on the tracker until you swing, and is spent the moment you do.',
    extra: room.ok
      ? {
          effects: addEffect(
            character?.effects,
            moveEffect(card, moveSetFor(character?.talents, card.id))
          ),
        }
      : null,
    spent: !room.ok,
    spentLabel: 'No room',
    spentNote: room.reason,
  };
}

/**
 * What a Feral Form does to a chip it will not let you play, or nothing at all
 * for everybody who is not in one.
 *
 * Refused and not hidden, which is the same call the belt and the Martial Move
 * allowance both make: a card that has quietly vanished reads as a bug, while one
 * wearing the reason reads as a rule. It is spread *after* `martialUse`, so a
 * move the form forbids says so rather than saying there is no room for it —
 * being unable to hold the card at all is the truer refusal of the two.
 *
 * `extra` is cleared with it. Nothing here is ever confirmed, since the chip is
 * dead, but a refused row carrying a written-out effects list is a loaded gun.
 */
function formRefusal(card, locks, opts) {
  if (!locks) return {};

  const pass = passesForm(card, locks, opts);
  if (pass.ok) return {};

  return { spent: true, spentLabel: 'Not in form', spentNote: pass.reason, extra: null };
}

/**
 * The extra a card that transforms its holder carries, or nothing at all for
 * every other card. CALL THE BEAST, and nothing else yet.
 *
 * A transformation is a write with two halves and a ceiling on one of them, and
 * it is exactly the shape `extra` was built for: the chip charges the printed
 * Action Point and Willpower, and the same confirmation applies the Health, the
 * Shield, the flag and the two ledger lines. One write, so a form entered off the
 * bar and one entered off the block cannot end up different.
 *
 * Refused, wearing the reason, when there is nothing for it to do: you are
 * already in the form, or half of what you have left rounds to nothing. Same
 * shape the belt gives an empty flask.
 */
function feralUse(character, card, set) {
  if (card?.opens !== 'feral' || !set) return {};

  const form = formFor(character, set);
  if (!form) return {};

  const can = canEnterForm(character, form);

  return {
    note: can.ok
      ? `${leadIn(character, form)} The difficulty goes back to ${form.base}.`
      : can.reason,
    extra: can.ok ? enterFormBody(character, form, card.name) : null,
    spent: !can.ok,
    spentLabel: form.inForm ? 'Already' : 'No blood',
    spentNote: can.reason,
  };
}

/** "25 Health for 25 Shield." What the chip says before it is tapped. */
function leadIn(character, form) {
  const result = enterForm(character, form, { cap: shieldCapFor(character) });
  return `${result.spend} Health for ${result.granted} Shield.`;
}

/* ---------------------------------------------------- entering and leaving */

/**
 * Entering a Feral Form, as one patch body: the two pools, the flag, the
 * difficulty back at its floor, and a ledger line for each pool that moved.
 *
 * Here rather than on the block for the same reason `spendUse` is here: there are
 * two ways in — the block's own Transform button and CALL THE BEAST on this bar —
 * and a form entered one way must be identical to one entered the other. The
 * Shield ceiling is worked out here too, because feral.js may not import
 * characterModel.js (it is imported *by* it, for `feralArmor`).
 *
 * Health and Shield both go through the ledger, because every other movement of
 * either on this sheet is logged and this is the largest one a character will
 * ever make on purpose.
 */
export function enterFormBody(character, form, why = 'Feral Rage') {
  const result = enterForm(character, form, { cap: shieldCapFor(character) });

  return {
    ...result.patch,
    ledger: ledgerRows(character, [
      { kind: 'health', delta: -result.spend, balance: result.health, note: `${why}: the price` },
      { kind: 'shield', delta: result.granted, balance: result.shield, note: `${why}: the hide` },
    ]),
  };
}

/**
 * Leaving it, and the Shield it throws away.
 *
 * "there is a butto to end trnasformation that also remove all shield" — so the
 * hide does not come off and leave its Shield behind. That Shield *was* the form.
 */
export function leaveFormBody(character, form) {
  const result = leaveForm(character, form);
  if (result.dropped === 0) return result.patch;

  return {
    ...result.patch,
    ledger: ledgerRows(character, [
      { kind: 'shield', delta: -result.dropped, balance: 0, note: `${form.spec.label} ended` },
    ]),
  };
}

/** Several movements, one write, in the order they happened. */
function ledgerRows(character, rows) {
  let ledger = character?.ledger;

  for (const row of rows) {
    if (row.delta === 0) continue;
    ledger = appendLedger(
      { ...character, ledger },
      {
        id: newLedgerId(),
        ts: new Date().toISOString(),
        kind: row.kind,
        delta: row.delta,
        note: String(row.note).slice(0, LEDGER_NOTE_MAX),
        balance: row.balance,
      }
    );
  }

  return ledger;
}

/**
 * What an enchantment has bound into something you are holding.
 *
 * NOVICE IMBUEMENT is the one enchantment that carries a spell instead of a
 * number: "a single Novice Spell is bound into the item ... whoever wields it may
 * cast that spell once, paying its costs as normal, whether or not they can cast
 * spells of their own." The last clause is why this is its own group rather than
 * a spell folded into a set's hand — a character with no casting of their own can
 * still cast this one, and it does not belong under a source that taught them
 * nothing.
 *
 * It reads the ephemeral tracker, because that is where an Ephemeral Enchantment
 * puts what it laid, and the spell rides on the effect that laid it. Its cost is
 * the spell's own, printed unchanged: "paying its costs as normal".
 */
function imbuedGroup(character, locks) {
  const moves = runningEnchants(character?.effects)
    .map(({ effect }) => ({ effect, card: getCard(effect.spell) }))
    .filter((row) => row.card)
    .map(({ effect, card }) =>
      move(`imbued:${effect.id}:${card.id}`, card, {
        source: `${card.name} · bound in by ${effect.name}`,
        note: effect.note || null,
        /* A casting bound into a thing you are holding is both halves of what a
           form forbids: somebody else's spell, out of an item. Refused on either
           lock, with no `set` to appeal to. */
        ...formRefusal(card, locks, {}),
      })
    );

  return moves.length > 0
    ? {
        id: 'imbued',
        label: 'Bound In',
        note: 'One casting each, from an enchantment',
        moves,
      }
    : null;
}


/**
 * One creature's own quick bar: the cards the set tagged as its, printed with
 * its numbers.
 *
 * The same `move` rows the character's bar is built from, so the block that
 * draws it raises the same UsePrompt and pays through the same `spendUse`. What
 * differs is only who is asked: the prompt is handed the creature as its
 * character (see minionActor), so an Action Point check reads the creature's
 * pool and a Willpower check reads its bonded's, which is exactly what ONE AND
 * THE SAME says.
 *
 * Standing cards are left out the same way they are on the character's bar. No
 * creature has one yet; if one arrives it reads on the character's Always On
 * block under the set's name, which is where every other passive of that set
 * already is.
 *
 * ------------------------------------------------------------ the basic ones
 * And then the actions everybody in the world has, last, exactly as they come
 * last on the character's bar. A creature on the board Moves, Hides, Grapples,
 * Shoves and Interacts, and it pays for all of it out of its own six Action
 * Points — so a bar that offered only the four cards its set printed was a bar
 * that could not walk. `basicGroup` is the character's own, unchanged: same
 * cards, same chips, same group that folds away once you know them by heart.
 */
export function minionBar(character, minion) {
  const modifiers = minionModifiers(character, minion);

  const moves = (minion.cards ?? [])
    .filter((card) => !isStanding(card))
    .map((card) =>
      move(`minion:${minion.id}:${card.id}`, card, {
        source: `${card.name} · ${minion.title}`,
        modifiers,
      })
    );

  const own =
    moves.length > 0
      ? [{ id: `minion:${minion.id}`, label: minion.spec.label, note: minion.title, moves }]
      : [];

  /* Its own moves carry `modifiers`, which is what makes Wyrm Bolt print the
     creature's Mind. A basic action has no numbers to bend, so it rides as it
     is — and the use prompt is handed the creature either way, so the six
     Action Points a Move costs come off the right sheet. */
  return [...own, basicGroup()];
}

/** What everybody has. Last, because it is the half nobody has to look up. */
function basicGroup() {
  return {
    id: 'basic',
    label: 'Basic Actions',
    note: 'Everyone, always',
    moves: BASIC_ACTIONS.map((card) =>
      move(`basic:${card.id}`, card, { source: `${card.name} · a basic action` })
    ),
  };
}

/**
 * The whole quick bar: every group that has something in it, in reaching
 * order. A character with nothing at all still gets the basic actions,
 * which is exactly right — that is what a level 1 with empty hands can do.
 */
export function quickBar(character) {
  if (!character) return [];

  /* What shape the character is in, asked once for the whole bar rather than once
     per chip. Null for everybody who is not mid-transformation, which is nearly
     everybody, and every group below then does exactly what it did before. See
     feralLocks in feral.js. */
  const locks = feralLocks(character);

  return [
    handGroup(character),
    beltGroup(character, locks),
    /* Before what you know: a bound casting is an hour old and is the thing most
       easily forgotten, which is the whole argument for where anything sits on
       this bar. */
    imbuedGroup(character, locks),
    ...knownGroups(character, locks),
    /* And the basic actions, never refused. A wolf still moves, hides and shoves,
       and a form that could not walk would be a bug rather than a rule. */
    basicGroup(),
  ].filter(Boolean);
}

/** How many moves a bar holds, for the count in the block's head. */
export function moveCount(groups) {
  return groups.reduce((total, group) => total + group.moves.length, 0);
}

/* ------------------------------------------------------------- the recap */

/**
 * One standing thing: the card, and the shortest true statement of where it
 * came from. A skill learned at level 5 says "Level 5" rather than the name of
 * the road that taught it, because the level is the thing that dates it.
 */
function standing(card, modifiers, from) {
  return {
    /* Keyed by where it came from as well as what it is, because one card can
       stand in a recap twice from two places. A group whose rows carry no
       provenance keys on the card alone rather than on the word "null". */
    key: from ? `${from}:${card.id}` : card.id,
    card,
    modifiers,
    name: card.name,
    from,
  };
}

/**
 * What has been worked into the gear you are wearing.
 *
 * Enchantments are not in abilitySources — that file hands out the spells an
 * enchantment *carries*, which are moves and belong in the bar. The working
 * itself is a standing effect on your own numbers ("damage becomes Cold, and
 * Empowered by 1"), which makes it exactly the kind of thing this block is
 * for: true of you right now, and the first thing forgotten.
 */
function workings(character) {
  /* `carriedItems` rather than the equipment map alone, so a ring counts. A
     trinket is where a working usually ends up — it is worn for nothing else —
     and a loop on the belt counts now too, so a working laid on a flask has to
     be listed here or it would be true of the character and written nowhere. */
  const rows = carriedItems(character).flatMap((item) =>
    itemEnchantments(item).map(({ enchantment }) => standing(enchantment, null, item.name))
  );

  /* Called Enchantments, because that is what they are and what the card that
     laid them calls them. "Workings" was this block's own word for the same
     thing, and a player reading their sheet has no reason to learn a second one. */
  return rows.length > 0
    ? { id: 'enchantments', label: 'Enchantments', note: 'Worked into what you carry', rows }
    : null;
}

/**
 * What an Enchanter is wearing on their own person.
 *
 * Its own group, under the card's own name, because it is a different *kind* of
 * standing thing from the rest: an enchantment on a hood is on the hood and goes
 * when the hood does, while these are on the Enchanter. WIELDER OF WONDER is the
 * card that put them there and is the only true answer to "where did this come
 * from", so it is the heading rather than the provenance on each row.
 *
 * **And the rows carry no provenance at all.** They spent it on the Magic Burden
 * each one cost to keep, until Jules ruled (2026-08-21) that a body slot costs
 * none. There is nothing left there to forget, the heading has already said where
 * these came from, and a row repeating "no Burden" under every one of them would
 * be the same sentence three times. `from` is optional and the row prints its
 * name and what it does.
 */
function wielderOfWonder(character) {
  const state = enchanterState(character);
  if (!state || state.worn.length === 0) return null;

  const rows = state.worn
    .map(getEnchantment)
    .filter(Boolean)
    .map((enchantment) => standing(enchantment, null, null));

  return {
    id: 'wielder-of-wonder',
    label: 'Wielder of Wonder',
    note: `${rows.length} of ${state.wornMax} on your person`,
    rows,
  };
}

/**
 * The recap, grouped by what a thing is: what is true of you, what you are
 * trained in, what an Enchanter has laid on their own person, and what your gear
 * is doing.
 *
 * A card lands in Traits or Skills by the same test the bar uses, so between
 * the two blocks every card a character holds is printed exactly once.
 */
export function passiveRecap(character) {
  if (!character) return [];

  const traits = [];
  const skills = [];

  for (const source of abilitySources(character)) {
    if (source.aside) continue;
    for (const { card, modifiers, section } of rowsOf(source)) {
      if (!isStanding(card)) continue;

      // The road's own source is titled "Learned Along the Way"; the level is
      // what actually dates the skill, and it is the section's label.
      const from = source.kind === 'skill' ? section : source.title;
      (card.kind === 'skill' ? skills : traits).push(standing(card, modifiers, from));
    }
  }

  return [
    traits.length > 0
      ? { id: 'traits', label: 'Traits', note: 'Always on', rows: traits }
      : null,
    skills.length > 0
      ? { id: 'skills', label: 'Skills', note: 'What you are trained in', rows: skills }
      : null,
    /* On your person before on your gear: what you are outlasts what you carry,
       and an enchantment worn on the body is the one nobody remembers is there. */
    wielderOfWonder(character),
    workings(character),
  ].filter(Boolean);
}

/** How many standing things a recap holds, for the count in the block's head. */
export function recapCount(groups) {
  return groups.reduce((total, group) => total + group.rows.length, 0);
}

/* ------------------------------------------------------------- the spend */

/**
 * The one write a confirmed use makes, as a patch body: the points, the
 * charge and anything else the request carries, together. Block 3 and the
 * quick bar both confirm through here, so a use costs the same wherever it
 * was tapped.
 *
 * The prompt has already refused anything the pools cannot cover, so nothing
 * here can drive one below zero. `amount` is what the prompt settled on — the
 * printed cost for an ordinary card, and wherever the dial was left for the
 * ones that have none.
 *
 * `free` is the one way past that refusal: the prompt's own "Use it anyway",
 * for a table that rules a use through regardless. The use happens exactly as it
 * would have: the charge off the flask, the effect it lays, the window it opens.
 * Not one point leaves a pool. That is the whole difference, and it lives here
 * rather than in the prompt so a waved-through use is the same write wherever it
 * was tapped.
 */
export function spendUse(request, character, mode, amount, { free = false } = {}) {
  const ap = Number(amount ?? request.ap) || 0;
  const wp = Number(request.wp) || 0;
  const body = { ...(request.extra ?? {}) };

  /* A weapon attack is what both kinds of rider were waiting for, and paying for
     one is the moment the sheet can be sure the swing happened. "Lost on use",
     from the Trickster's Developpement Notes, and "remove on the tracker on the
     attack" from the Duelist's.

     Both are cleared off the same list in turn, so a Duelist who ambushed and
     then laid a Wound loses both to one swing rather than whichever ran last.
     Started from whatever the request already put there, on the off chance a card
     ever carries an effects patch of its own.

     Guarded on the card rather than on the character, because a creature's block
     pays through here too and hands its own row in as `character`. No minion
     card is tagged Weapon Attack, so nothing there is touched. */
  if (isWeaponAttack(request.card)) {
    let effects = body.effects ?? character?.effects;
    let cleared = false;

    for (const spend of [spendTricks, spendMoves]) {
      const kept = spend(effects);
      if (kept) {
        effects = kept;
        cleared = true;
      }
    }
    if (cleared) body.effects = effects;
  }

  /* Waved through. Everything the use *does* is already in the body; the points
     are what an override withholds, so this is where it stops. */
  if (free) return body;

  if (request.converts === 'reaction') {
    // Anticipate spends nothing. The points cross from one pool to the other,
    // and the dial has already been held inside what both can hold.
    body.ap = character.ap - ap;
    body.reaction = Math.min(character.reaction_max, character.reaction + ap);
  } else {
    if (ap > 0) {
      if (mode === 'reaction') body.reaction = character.reaction - ap;
      else body.ap = character.ap - ap;
    }
    if (wp > 0) body.willpower = character.willpower - wp;
  }

  return body;
}
