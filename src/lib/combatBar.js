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
import {
  EQUIPMENT_SLOTS,
  beltEntry,
  beltSlotCount,
  getItem,
  normalizeBelt,
  normalizeEquipment,
} from './items.js';
import { getCard, itemEnchantments, itemModifiers } from './weapons.js';

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
    spent: false,
    ...rest,
  };
}

/** What the weapon in your hands does, printed for that weapon. */
function handGroup(character) {
  const equipment = normalizeEquipment(character?.equipment);
  const primary = getItem(equipment.main_hand);
  if (!primary) return null;

  const modifiers = itemModifiers(primary);
  const moves = (primary.abilities ?? [])
    .map(getCard)
    .filter(Boolean)
    .map((card) =>
      move(`hand:${card.id}`, card, {
        source: `${primary.name} — in hand`,
        modifiers,
      })
    );

  return moves.length > 0
    ? { id: 'hand', label: 'In Hand', note: primary.name, moves }
    : null;
}

/**
 * The filled loops, in loop order. An empty loop is not a move and is not
 * shown: block 3 is where you notice a loop is empty, and this block has no
 * width to spend saying nothing.
 */
function beltGroup(character) {
  const belt = normalizeBelt(character?.belt);
  // A loop that has not opened yet cannot be reached, whatever is stored in it.
  const open = beltSlotCount(character);

  const moves = belt
    .map((entry, index) => ({ state: beltEntry(entry), index }))
    .filter(({ state, index }) => state && index < open)
    .map(({ state, index }) => {
      const { item, charges, used, remaining, consumable, spent } = state;
      const card = getCard(item.abilities?.[0]);

      // A charged item spends one on the way out; anything else is only points.
      const nextBelt = charges > 0 ? [...belt] : null;
      if (nextBelt) nextBelt[index] = { id: item.id, used: used + 1 };

      return move(`belt:${index}`, card, {
        name: card?.name ?? item.name,
        source: `${item.name} — loop ${index + 1}`,
        note: charges > 0 ? chargeNote(remaining, consumable, item) : null,
        extra: nextBelt ? { belt: nextBelt } : null,
        spent,
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
function knownGroups(character) {
  return abilitySources(character)
    /* A source can hold cards that are neither played nor standing. A Cauldron
       Keeper's Ingredients are the case: you never use one, you put it in a Brew,
       and BREW is the card that gets played. The Abilities tab reads them; neither
       block here lists them. */
    .filter((source) => !source.aside)
    .map((source) => {
      const moves = rowsOf(source)
        .filter(({ card }) => !isStanding(card))
        .map(({ card, modifiers }) =>
          move(`${source.id}:${card.id}`, card, {
            source: `${card.name} — ${source.title}`,
            modifiers,
          })
        );

      return moves.length > 0
        ? { id: source.id, label: source.title, note: source.note, moves }
        : null;
    })
    .filter(Boolean);
}

/** What everybody has. Last, because it is the half nobody has to look up. */
function basicGroup() {
  return {
    id: 'basic',
    label: 'Basic Actions',
    note: 'Everyone, always',
    moves: BASIC_ACTIONS.map((card) =>
      move(`basic:${card.id}`, card, { source: `${card.name} — a basic action` })
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
  return [handGroup(character), beltGroup(character), ...knownGroups(character), basicGroup()]
    .filter(Boolean);
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
    key: `${from}:${card.id}`,
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
  const equipment = normalizeEquipment(character?.equipment);

  const rows = EQUIPMENT_SLOTS.flatMap(({ key }) => {
    const item = getItem(equipment[key]);
    if (!item) return [];
    return itemEnchantments(item).map(({ enchantment }) =>
      standing(enchantment, null, item.name)
    );
  });

  return rows.length > 0
    ? { id: 'workings', label: 'Workings', note: 'Worked into what you wear', rows }
    : null;
}

/**
 * The recap, grouped by what a thing is: what is true of you, what you are
 * trained in, and what your gear is doing.
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
 */
export function spendUse(request, character, mode, amount) {
  const ap = Number(amount ?? request.ap) || 0;
  const wp = Number(request.wp) || 0;
  const body = { ...(request.extra ?? {}) };

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
