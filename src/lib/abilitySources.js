/**
 * Provenance: where every ability a character holds actually came from.
 *
 * The Abilities tab is not a deck, it is a list of *sources*. The blood you
 * were born with, the trade you came up in, the levels you have lived through,
 * every talent set you have taken, and whatever you have strapped on — each of
 * those becomes one block on the tab, titled with the source itself.
 *
 * Inside a block the cards are grouped by the stratum that handed them over:
 * a talent's ranks, an item's name, the level a skill was learned at. So a
 * Mycomancer at Rank 2 is one block called Mycomancer holding a Rank 1 section
 * and a Rank 2 section, and no card ever appears without saying where it came
 * from.
 *
 * A source may also carry a *choice*, and there are two shapes of that. A
 * Mycomancer picks four Primal spells out of the school and may swap them at
 * every rest; a Cauldron Keeper mixes their own cards out of a vessel and a
 * handful of Reagents. Which cards those are is loadouts.js's and brews.js's
 * business, so a source only points at the set and lets the block raise the very
 * bench or chooser the Advancement tab raises.
 *
 * This file reads the codex and the character. It writes nothing, and it is the
 * only place that knows what counts as a source.
 */

import {
  getBackground,
  getBackgroundSkill,
  normalizeBackgroundSkills,
  skillCards,
} from './backgrounds.js';
import { brewLimits, brewingOf, knownIngredients } from './brews.js';
import { INGREDIENT_PARTS } from './ingredients.js';
import { EQUIPMENT_SLOTS, heldItem, normalizeEquipment, normalizeTrinkets } from './items.js';
import { getLineage, lineageCards } from './lineages.js';
import { levelForXp } from './characterModel.js';
import { normalizeLevelPicks } from './levelPicks.js';
import { loadoutOf, loadoutState } from './loadouts.js';
import { isMinionCard, minionModifiers, minionState } from './minions.js';
import { cardsAtRank, getTalent, normalizeTalents, rankInfo } from './talents.js';
import { getCard, itemEnchantments } from './weapons.js';

/* --------------------------------------------------------------- the parts */

/**
 * One card as a block prints it. `modifiers` rides along because the same card
 * reads differently in different hands: a lineage card whose colour has been
 * chosen prints that colour, and the stack has to be dealt the same rider the
 * brief was drawn with, or the card changes the moment you open it.
 */
function entry(card, modifiers = null) {
  return { card, modifiers };
}

/** A card that leaves something open, and what this character answered. */
export function answerOn(card, choices) {
  if (!card?.choice) return null;
  return card.choice.options.find((option) => option.id === choices?.[card.id]) ?? null;
}

/* Lineage cards and skills carry choices; nothing else in the codex does yet.
   Both lists arrive as `{ card, modifiers }` rows with the source's riders
   already on them, which is why there is no pass over them here: the rider that
   makes an answer print, and the one that casts a learned spell off the highest
   Attribute, are both the granting source's doing rather than this file's. See
   lineageCards in lineages.js and skillCards in backgrounds.js. */

function section(id, label, cards, note = null) {
  return { id, label, note, cards };
}

/** "spell" / "spells", the only plural rule this file needs. */
function plural(noun, count) {
  return count === 1 ? noun : `${noun}s`;
}

/** "3, 5 and 7". No Oxford comma, per the house voice. */
function listOut(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/**
 * When a pool may be re-chosen, said the way the granting card says it.
 *
 * `swap` is the permission, transcribed off that card (see loadouts.js). A set
 * that names no rest is offered none in the rest window, so the block must not
 * promise one — the panel on the sheet is what changes it then, and it can do it
 * whenever.
 */
function swapLine(spec) {
  /* A library is filled rather than re-chosen, and its permission is the other
     one: ARCANE RESEARCH adds a single card a rest where FUNGAL INVOCATION
     changes any number. Said in the verb, because "changed on a long rest" is the
     wrong promise for a book you are only ever allowed to add one page to. */
  const research = Array.isArray(spec?.research) ? spec.research : [];
  if (research.length > 0) {
    return `one more researched on ${listOut(research.map((kind) => `a ${kind} rest`))}`;
  }

  const rests = Array.isArray(spec?.swap) ? spec.swap : [];
  if (rests.length === 0) return 'changed on the sheet at any time';
  const words = rests.map((kind) => `a ${kind} rest`);
  return `changed on ${listOut(words)}`;
}

/**
 * A source named on the row that this build's codex has never heard of. It is
 * still a source: a table is free to invent its own lineage or its own set, and
 * quietly dropping the block would read as "you have nothing".
 */
function written(id, kind, title, note) {
  return { id, kind, title, note, art: null, sections: [], unknown: true };
}

/* ------------------------------------------------------------- the sources */

/** Your blood: the cards an ancestry hands out, choices and all. */
function lineageSource(character) {
  const name = String(character?.lineage ?? '').trim();
  if (!name) return null;

  const lineage = getLineage(name);
  if (!lineage) return written('lineage', 'lineage', name, 'Lineage, written in by hand');

  return {
    id: 'lineage',
    kind: 'lineage',
    title: lineage.name,
    note: 'Lineage',
    art: lineage.art ?? null,
    sections: [
      /* What this character *holds*, which for a Wildkin is the two traits they
         kept rather than the eight the pool offered. */
      section('traits', 'What your blood carries', lineageCards(lineage, character?.choices)),
    ],
  };
}

/** Your trade: the skills picked out of a background's own pool. */
function backgroundSource(character) {
  const name = String(character?.background ?? '').trim();
  if (!name) return null;

  const background = getBackground(name);
  if (!background) {
    return written('background', 'background', name, 'Background, written in by hand');
  }

  /* The skills, and behind any that taught a spell, the spell. "You can choose a
     Novice spell from any school" puts two cards on this tab and not one: the
     skill that made the promise, and the spell that answered it. `skillCards` is
     where that expansion lives, so this tab and the Advancement block read the
     same hand. */
  const held = normalizeBackgroundSkills(background, character?.background_skills)
    .map(getBackgroundSkill)
    .filter(Boolean);

  return {
    id: 'background',
    kind: 'background',
    title: background.name,
    note: 'Background',
    art: background.art ?? null,
    sections: [
      section('skills', 'Skills of the trade', skillCards(held, character?.choices)),
    ],
  };
}

/**
 * The road itself. Every odd level teaches a skill, and the level that taught
 * it is its provenance, so each one gets its own heading rather than being
 * lumped under one that says nothing about when it was learned.
 */
function learnedSource(character) {
  const picks = normalizeLevelPicks(character?.level_picks);
  const choices = character?.choices ?? {};

  const learned = Object.entries(picks)
    .map(([level, pick]) => ({ level: Number(level), card: getBackgroundSkill(pick.skill) }))
    .filter((row) => row.card)
    .sort((a, b) => a.level - b.level);

  if (learned.length === 0) return null;

  return {
    id: 'levels',
    kind: 'skill',
    title: 'Learned Along the Way',
    note: `${learned.length} ${plural('skill', learned.length)} from ${
      learned.length === 1 ? 'level' : 'levels'
    } ${listOut(learned.map((row) => row.level))}`,
    art: null,
    /* A skill learned here can teach a spell too, and the spell belongs under
       the level that bought it rather than in a block of its own. */
    sections: learned.map((row) =>
      section(`level-${row.level}`, `Level ${row.level}`, skillCards([row.card], choices))
    ),
  };
}

/**
 * One block per talent set held, one section per rank inside it. A rank section
 * holds exactly what that rank added, never everything the track has given so
 * far, so reading a Mycomancer block top to bottom is reading their career in
 * order.
 *
 * The set's own choice, if it has one, is a block of its own rather than a
 * section at the bottom of the set's. A Mycomancer's prepared spells are not a
 * rank's doing the way the rank cards are: they are a standing hand, swapped at
 * every rest, and they are what the player reaches for mid-session. Buried
 * under two ranks of talent cards they were the hardest thing on the tab to
 * find. The block still says whose they are, so the provenance the tab is built
 * on survives the split.
 */
function talentSources(character) {
  /* Worked out once for the whole list: a set that put a creature on the board
     prints that creature's numbers on the creature's own cards, so those cards
     are dealt with its rider rather than the reader's. Same block, same
     provenance — a Wyrm Bolt is still something the Draconic Bond gave you —
     only the numbers on it belong to the ally. */
  const creatures = minionState(character);

  return normalizeTalents(character?.talents).flatMap((held) => {
    const talent = getTalent(held.id);
    if (!talent) {
      return [
        written(
          `talent:${held.id}`,
          'talent',
          held.name,
          `Talent set · Rank ${held.rank}, written in by hand`
        ),
      ];
    }

    const creature = creatures.find((row) => row.id === talent.id) ?? null;
    const riders = creature ? minionModifiers(character, creature) : null;

    const sections = [];
    for (let rank = 1; rank <= held.rank; rank += 1) {
      const cards = cardsAtRank(talent, rank);
      if (cards.length === 0) continue;
      const title = rankInfo(rank)?.title;
      sections.push(
        section(
          `rank-${rank}`,
          `Rank ${rank}${title ? ` · ${title}` : ''}`,
          cards.map((card) => entry(card, riders && isMinionCard(card) ? riders : null))
        )
      );
    }

    const info = rankInfo(held.rank);
    const set = {
      id: `talent:${talent.id}`,
      kind: 'talent',
      title: talent.name,
      note: `Talent set · Rank ${held.rank}${info ? ` · ${info.title}` : ''}`,
      art: talent.art ?? null,
      sections,
    };

    /* What the set left to the player, as its own block or blocks. Two shapes
       so far, and a set could carry both, so they are gathered rather than
       returned one at a time. */
    const open = [];

    // The cards this set left to the player. loadoutState knows how many the
    // rank knows and which of the stored picks are still legal at it.
    const loadout = loadoutOf(talent)
      ? loadoutState(character?.talents, talent, { level: levelForXp(character?.xp) })
      : null;
    if (loadout) {
      open.push({
        id: `loadout:${talent.id}`,
        kind: 'loadout',
        title: loadout.spec.label,
        /* What it takes to change the hand, off the spec rather than asserted. It
           read "swapped at any rest" for every pool, which was already loose — a
           Mycomancer swaps on a long rest and not a short one — and became plainly
           wrong the moment a set arrived whose card grants no swap at all. */
        note: `${talent.name} · ${loadout.picks.length} of ${
          loadout.library ? loadout.capacity : loadout.known
        } ${loadout.library ? 'written down' : 'chosen'}, ${swapLine(loadout.spec)}`,
        art: talent.art ?? null,
        sections: [
          {
            ...section(
              `loadout-${loadout.spec.id}`,
              `Prepared ${plural(loadout.spec.noun, loadout.known)}`,
              loadout.picks
                .filter((pick) => pick.card)
                .map((pick) => entry(pick.card, pick.modifiers)),
              `${loadout.picks.length} of ${loadout.known} chosen`
            ),
            // Everything the block needs to raise the chooser and colour the count.
            loadout: { talent, state: loadout },
          },
        ],
      });
    }

    /* What this set brews *from*. Not a hand and not a rack: a finished Brew
       "takes effect immediately" and is never stored, so what a Keeper actually
       holds is the shelf their rank has opened. One section per kind, in the order
       BREW names them, because that order is the configuration rule.

       `aside` marks the block as one to read rather than to play from. An
       Ingredient is not a move: you never use Volcanic Shard, you put it in
       something. The Character tab's two blocks both skip it and offer BREW
       instead, which is the card that is actually played. */
    const brewing = brewingOf(talent) ? brewLimits(character?.talents, talent) : null;
    if (brewing) {
      const known = knownIngredients(brewing.spec, brewing.rank);
      open.push({
        id: `ingredients:${talent.id}`,
        kind: 'ingredient',
        title: 'Ingredients',
        note: `${talent.name} · ${known.length} known, ${listOut(brewing.tiers)}`,
        art: talent.art ?? null,
        aside: true,
        sections: INGREDIENT_PARTS.map((part) => {
          const rows = known.filter((ing) => ing.part === part.id);
          return rows.length === 0
            ? null
            : {
                ...section(
                  `ingredient-${part.id}`,
                  part.plural,
                  rows.map((card) => entry(card)),
                  part.rule
                ),
                // Only the first section carries the tools, so the block has one.
                brewing: part.id === INGREDIENT_PARTS[0].id ? { talent, limits: brewing } : null,
              };
        }).filter(Boolean),
      });
    }

    return [set, ...open];
  });
}

/**
 * What you earn by carrying the thing.
 *
 * A weapon's own two attacks are not here. Those are played from the Loadout
 * block on the Character tab and this tab would only be a second copy of them.
 * A spell an enchantment carries is a different matter: it is an ability the
 * bearer gains for as long as the item is equipped, so it belongs with every
 * other ability they hold, under the item that grants it.
 *
 * Trinkets are in it, and they are the likeliest place a carried spell will be
 * found: a ring exists to hold a working, where a breastplate is worn for its own
 * sake. Each one is titled "Trinket" rather than by a slot, because a trinket has
 * no slot to be named — see normalizeTrinkets in items.js.
 */
function gearSource(character) {
  const equipment = normalizeEquipment(character?.equipment);
  const places = [
    ...EQUIPMENT_SLOTS.map(({ key, label }) => ({ key, label, id: equipment[key] })),
    ...normalizeTrinkets(character?.trinkets).map((id, index) => ({
      key: `trinket-${index}`,
      label: 'Trinket',
      id,
    })),
  ];

  const sections = places.map(({ key, label, id }) => {
    const item = heldItem(character, id);
    if (!item) return null;

    /* Which spell is carried is the *item's* to say, not the enchantment's:
       `enchantment.spell` is only the flag that this working holds one at all,
       and the id sits on the item's own `enchants` entry. `itemEnchantments`
       spreads that entry, so `spell` here is the id. */
    const carried = itemEnchantments(item)
      .map(({ enchantment, spell }) => ({ enchantment, card: getCard(spell) }))
      .filter((row) => row.card);
    if (carried.length === 0) return null;

    // Dealt without the item's modifiers on purpose: an infusion changes what
    // the weapon hits for, not what a spell cast through it hits for.
    return section(
      `slot-${key}`,
      item.name,
      carried.map((row) => entry(row.card)),
      `${label}, by ${listOut(carried.map((row) => row.enchantment.name))}`
    );
  }).filter(Boolean);

  if (sections.length === 0) return null;

  const count = sections.reduce((total, part) => total + part.cards.length, 0);
  return {
    id: 'gear',
    kind: 'gear',
    title: 'Worn and Wielded',
    note: `${count} ${plural('spell', count)} your gear carries`,
    art: null,
    sections,
  };
}

/* ---------------------------------------------------------------- the list */

/**
 * Every source this character has, in the order they were come by: the blood
 * first, then the trade, then the road, then each set in the order it was
 * taken, and the gear last because it is the only one that changes between one
 * fight and the next.
 *
 * The player is free to rearrange them, and that arrangement is stored on the
 * character. This is only the order a sheet that has never been arranged comes
 * out in.
 */
export function abilitySources(character) {
  if (!character) return [];

  return [
    lineageSource(character),
    backgroundSource(character),
    learnedSource(character),
    ...talentSources(character),
    gearSource(character),
  ].filter(Boolean);
}

/** How many cards a source holds, across all of its sections. */
export function sourceCount(source) {
  return source.sections.reduce((total, part) => total + part.cards.length, 0);
}

/** Every card the character holds, once each, for the overview and the filter. */
export function allSourceCards(sources) {
  return sources.flatMap((source) => source.sections.flatMap((part) => part.cards));
}

/**
 * What the tab says about itself before you have read a single card: how many
 * abilities there are, and how they break down.
 *
 * Counted by what a card *is* rather than by where it came from, because the
 * question this answers is "what can I do", and the blocks below already
 * answer "where did it come from". A card with no kind of its own is a weapon
 * or gear ability, which is what the codex's own fallback treats it as.
 */
export function abilityOverview(sources) {
  const cards = allSourceCards(sources);

  const tally = new Map();
  for (const { card } of cards) {
    const kind = card.kind ?? 'ability';
    tally.set(kind, (tally.get(kind) ?? 0) + 1);
  }

  return {
    total: cards.length,
    /* Passives are worth their own number: they are the half of the sheet
       nobody remembers they have, and they never come up as a card you play. */
    passive: cards.filter(({ card }) => isPassive(card)).length,
    kinds: [
      ...KIND_ORDER.filter((kind) => tally.has(kind.id)),
      // A kind the codex grows after this list was written is still counted,
      // under its own name, rather than quietly missing from the total's
      // breakdown.
      ...[...tally.keys()]
        .filter((id) => !KIND_ORDER.some((kind) => kind.id === id))
        .sort()
        .map((id) => ({ id, label: titleCase(id), plural: `${titleCase(id)}s` })),
    ].map((kind) => ({ ...kind, count: tally.get(kind.id) })),
  };
}

/**
 * A card you never play: it is simply true of you while you hold it.
 *
 * `Long Rest` counts, and is the Enchanter's word. Their sheet writes it in the
 * slot every other set fills with `Ability` or `Passive`, on two cards that cost
 * nothing: ENCHANTING ("you have learned the art of imbuing an item") and WIELDER
 * OF WONDER ("the enchanter body is able to withstand"). Both are true of the
 * character from the moment they take the set; the tag says when the work those
 * capabilities allow gets done, not that the card is a move. Without this they
 * would sit on the combat quick bar as free actions, which is the one place a
 * night's labour cannot be taken.
 *
 * A card tagged `Long Rest` that does carry a cost is a move and stays one.
 */
export function isPassive(card) {
  if (card?.kind === 'passive') return true;
  if (card?.ap || card?.wp) return false;
  const tags = card?.tags ?? [];
  return tags.includes('Passive') || tags.includes('Long Rest');
}

/**
 * The kinds a card can be, in the order the overview reads them out.
 *
 * "Trait" rather than "Passive" for the lineage kind, because the passive
 * *count* beside it is the cross-cutting one — every card you never spend
 * anything on, whatever kind it is — and two numbers both labelled passive
 * sitting side by side would read as a contradiction.
 */
const KIND_ORDER = [
  { id: 'passive', label: 'Trait', plural: 'Traits' },
  { id: 'talent', label: 'Talent', plural: 'Talents' },
  { id: 'skill', label: 'Skill', plural: 'Skills' },
  { id: 'spell', label: 'Spell', plural: 'Spells' },
  /* Its own count rather than being folded in with talents: a move is chosen out
     of a pool and swapped at a rest, which is what a spell is and what a talent
     never is. Without the entry it fell through to the fallback below and the
     overview read "Martial-moves". */
  { id: 'martial-move', label: 'Martial Move', plural: 'Martial Moves' },
  { id: 'brew', label: 'Brew', plural: 'Brews' },
  { id: 'ability', label: 'Ability', plural: 'Abilities' },
];

function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/* ------------------------------------------------------------- the filters */

/**
 * Every tag the character's own cards carry, as the chip row wants them.
 *
 * Only tags that are actually held: a wall of chips for schools nobody in this
 * sheet can cast is a wall you read past. They are grouped so the row reads in
 * the order a card's banner reads — what it is, then what it is of.
 */
export function heldCardTags(sources) {
  const seen = new Set();
  for (const { card } of allSourceCards(sources)) {
    for (const tag of card.tags ?? []) seen.add(tag);
  }
  return [...seen].sort().map((tag) => ({ id: tag, label: tag, kind: 'card' }));
}

/** Everything about a card the search box may look inside. */
export function cardHaystack(card) {
  return [card.name, card.summary, card.body, card.sub_name, card.sub_body, card.type_line]
    .concat(card.tags ?? [])
    .concat(card.damage ?? [])
    .filter(Boolean)
    .join(' ');
}

/**
 * The sources narrowed to what matches, sections and all.
 *
 * A section that keeps nothing is dropped, and a source whose every section is
 * dropped goes with it, so a filter leaves you with the blocks that answer it
 * rather than a grid of empty blocks. The count of what went is the tab's job
 * to say, which is why this hands back the sources it kept and nothing else.
 *
 * With no filter on, every source stands, and this says so in one line rather
 * than measuring anything. That is not just a shortcut: a source the codex has
 * never heard of carries no cards to match, so measuring it would drop a block
 * the player can plainly see they have, and the page would then announce that
 * a block had been set aside by a filter nobody had set.
 */
export function filterSources(sources, keep, { active = true } = {}) {
  if (!active) return sources;

  return sources
    .map((source) => {
      const sections = source.sections
        .map((part) => ({ ...part, cards: part.cards.filter(({ card }) => keep(card)) }))
        .filter((part) => part.cards.length > 0);
      return sections.length > 0 ? { ...source, sections } : null;
    })
    .filter(Boolean);
}
