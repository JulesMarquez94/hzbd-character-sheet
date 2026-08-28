/**
 * The maths behind a card's live values, and the damage types it prints.
 *
 * A card never states "1d6 + your Instinct" — it states what *this* character
 * rolls with *this* weapon: "1d8 + 4" once an Empowering enchantment has had
 * its say. `resolveValue` does that sum and hands back the working, so a tap
 * on the value can show where every part of it came from.
 */

import { ATTRIBUTES as ATTRIBUTE_INFO, HIGHEST, highestAttribute } from './attributes.js';

/* The three attributes plus the `level` pseudo-attribute, keyed for token
   lookup. Labels and colours come from attributes.js so a rename or recolour
   never has to be made twice. */
export const ATTRIBUTES = {
  ...Object.fromEntries(
    ATTRIBUTE_INFO.map(({ key, label, color }) => [key, { key, label, color }])
  ),
  level: { key: 'level', label: 'Level', color: 'var(--copper)' },
  /* Movement Speed is not an attribute you raise, it is one the sheet derives
     (3 + half your Instinct). It is here anyway because Move and Jump have to
     print how far *this* character actually goes, and "up to your Movement
     Speed" is a pointer at a number rather than the number. `exact` because
     speed is the one value on the sheet that keeps its halves — flooring 5.5
     into 5 would quietly shorten every other step. */
  speed: { key: 'speed_m', label: 'Movement Speed', color: 'var(--stat-speed)', exact: true },
};

const ALIASES = {
  phy: 'physique',
  ins: 'instinct',
  mnd: 'mind',
  lvl: 'level',
};

/**
 * Which attribute a token names. `stat` is the card's own attribute — the one
 * the weapon attacks with — so one body can be shared by weapons that key off
 * different attributes.
 *
 * It is handed a *key*, never HIGHEST: this function has no character to measure
 * one against, and the fallback it would take is Instinct, which is a wrong
 * answer rather than a missing one. Everything that renders resolves the stat
 * first (see castStat), so a HIGHEST arriving here is a call site that forgot,
 * and it says so rather than quietly printing somebody else's attribute.
 */
export function attributeOf(word, defaultStat = 'instinct') {
  if (import.meta.env?.DEV && defaultStat === HIGHEST) {
    console.error(
      '[hazebound] attributeOf was handed the highest-Attribute rule instead of an attribute, ' +
        'so this card is about to print Instinct. Resolve it with castStat first.'
    );
  }
  const key = String(word || '').toLowerCase();
  if (key === 'stat' || key === '') return ATTRIBUTES[defaultStat] ?? ATTRIBUTES.instinct;
  const resolved = ALIASES[key] ?? key;
  return ATTRIBUTES[resolved] ?? null;
}

/* ---------------------------------------------------- what a card rolls with
 * Three answers, in the order they win. The card's own `stat` is the bottom of
 * the pile, whatever the codex printed it with; a source that casts off another
 * attribute overrides it with a rider; and a source that casts off "your
 * highest Attribute" overrides it with a *rule* rather than a key.
 */

/**
 * The rider a source imposes on the cards it hands out: `{ cast: 'instinct' }`
 * becomes `{ stat: 'instinct' }`, and the card prints that attribute's numbers
 * instead of the ones it was written with.
 *
 * A Mycomancer's loadout carries one (see loadouts.js), and so does the choice
 * on every card that teaches a spell "cast with your highest Attribute" — INNATE
 * X in lineages.js and INNATE SPELL X in backgrounds.js, where the cast is
 * HIGHEST.
 */
export function castModifier(spec) {
  return spec?.cast ? { stat: spec.cast } : null;
}

/**
 * A stat resolved against whoever is about to roll it.
 *
 * Every stat but one is already a key and comes straight back out. HIGHEST is
 * the exception: it is an instruction, and this is the one place it becomes an
 * attribute. Called wherever a stat first meets its character — `resolveValue`
 * for every number, `CardText` and `cardGist` for every printed name — so
 * nothing downstream of those ever sees the word.
 */
export function castStat(stat, character) {
  return stat === HIGHEST ? highestAttribute(character) : stat;
}

/* ------------------------------------------------------------ damage types */

/**
 * The house colours for damage, straight off the design tokens. Cards and
 * item panels are both dark, so a type is written in its own colour the way
 * stat names are everywhere else on the sheet.
 */
export const DAMAGE_TYPES = {
  Sharp: { color: 'var(--dmg-sharp)' },
  Blunt: { color: 'var(--dmg-blunt)' },
  Force: { color: 'var(--dmg-force)' },
  Fire: { color: 'var(--dmg-fire)' },
  Cold: { color: 'var(--dmg-frost)' },
  Frost: { color: 'var(--dmg-frost)' },
  Lightning: { color: 'var(--dmg-lightning)' },
  Psychic: { color: 'var(--dmg-psychic)' },
  Decay: { color: 'var(--dmg-decay)' },
  /* Toxic Toad's, from the Cauldron Keeper sheet. Its own token rather than
     Decay's: they are different types on the designer's own list, and Draconic
     Scale offers resistance to one without the other. */
  Poison: { color: 'var(--dmg-poison)' },
  // The talent cards print this where the weapon cards print Decay; same rot.
  Necrotic: { color: 'var(--dmg-decay)' },
  Sacred: { color: 'var(--dmg-sacred)' },
  // The placeholder type a focus deals until an Imbue names a real one.
  Elemental: { color: 'var(--haze-glow)' },
};

export function damageStyle(type) {
  return DAMAGE_TYPES[type] ?? null;
}

/* ------------------------------------------------- empowering and elevating
 * Two different things, and the designer's General Rules · Status & Terms sheet
 * is what tells them apart:
 *
 *   Empowered  one more die of the same kind. 2d6 becomes 3d6.
 *   Elevate    the same number of dice, one size larger. 2d6 becomes 2d8, and
 *              nothing goes past a d12.
 *
 * They were one function here until that sheet arrived, and the one function did
 * Elevate's job under Empowered's name. Splitting them changes printed numbers on
 * every card an Empowering enchantment touches, which is the correct change and
 * worth knowing about.
 */

const DIE_LADDER = [4, 6, 8, 10, 12];

/** Elevate: the die size a step up the ladder, capped at d12. */
export function elevateDie(faces, steps = 0) {
  const index = DIE_LADDER.indexOf(Number(faces));
  if (index < 0 || !steps) return Number(faces);
  return DIE_LADDER[Math.min(DIE_LADDER.length - 1, index + Math.max(0, steps))];
}

/** Empowered: one more die of the same kind for each step. */
export function empowerCount(count, steps = 0) {
  return Math.max(1, (Number(count) || 1) + Math.max(0, Number(steps) || 0));
}

const DICE_TERM = /^(\d*)d(\d+)$/i;
const STAT_TERM = /^(?:(\d+)\s*[x*×]\s*)?([a-z]+)$/i;

/**
 * "2d6 + 2*stat" against a character with Instinct 4 becomes:
 *
 *   { text: '2d6 + 8', flat: 8, parts: [ …dice…, …stat… ] }
 *
 * With `empower: 1` — a Cold or Decay Infusion, say — the same expression prints
 * "3d6 + 8": Empowered adds a die. With `elevate: 1` it prints "2d8 + 8" instead:
 * Elevate keeps the count and grows the die. A Cauldron Keeper's Mana Crystal
 * grants both at once, and prints "3d8 + 8".
 *
 * Dice are left as dice; they are rolled at the table, not by the sheet.
 * Everything else is summed into the single flat number that follows them.
 */
export function resolveValue(expression, character, printedStat = 'instinct', options = {}) {
  /* "Your highest Attribute" is worked out here rather than by every caller:
     this is the one function that turns a stat into a number, so a card cast off
     the highest can never print one attribute's name over another's value. */
  const defaultStat = castStat(printedStat, character);
  const empower = Math.max(0, Number(options.empower) || 0);
  const elevate = Math.max(0, Number(options.elevate) || 0);
  /* And a flat number added to the total — damage something else on the sheet is
     lending this swing. A Trickster's stolen Poison is the only source so far
     (see tricks.js), and it is already resolved to a number by the time it gets
     here, because what it is worth is "your Instinct Attribute" and not the
     attribute this card happens to be printed against.

     It only lands on an expression that rolls dice. teeth-bite is the one card
     in the codex with two live values, "[[2d6 + 2*stat]] as damage and gain
     Shield equal to [[stat]]", and lending damage to a swing must never quietly
     raise the shield it also grants. Every weapon attack's damage rolls dice and
     nothing else on one of those cards does, so the die is the tell. */
  const bonus = Math.max(0, Number(options.bonus) || 0);

  const terms = String(expression || '')
    .split('+')
    .map((term) => term.trim())
    .filter(Boolean);

  const dice = [];
  const parts = [];
  let flat = 0;

  for (const term of terms) {
    const diceMatch = DICE_TERM.exec(term);
    if (diceMatch) {
      const printedCount = Number(diceMatch[1] || 1);
      const printedFaces = Number(diceMatch[2]);
      const count = empowerCount(printedCount, empower);
      const faces = elevateDie(printedFaces, elevate);
      const text = `${count}d${faces}`;
      dice.push(text);

      // Say which of the two moved it, since they are different words on a card.
      const grew = [];
      if (count !== printedCount) grew.push(`Empowered up from ${printedCount}d${printedFaces}`);
      if (faces !== printedFaces) grew.push(`Elevated up from d${printedFaces}`);

      parts.push({
        kind: 'dice',
        text,
        detail:
          grew.length === 0
            ? `${count} × d${faces} · rolled at the table`
            : `${count} × d${faces} · ${grew.join(', ')}`,
      });
      continue;
    }

    const statMatch = STAT_TERM.exec(term);
    if (statMatch) {
      const attribute = attributeOf(statMatch[2], defaultStat);
      if (attribute) {
        const mult = Number(statMatch[1] || 1);
        const raw = Number(character?.[attribute.key]) || 0;
        const value = attribute.exact ? raw : Math.floor(raw);
        const total = mult * value;
        flat += total;
        parts.push({
          kind: 'stat',
          text: String(total),
          color: attribute.color,
          detail:
            mult === 1
              ? `your ${attribute.label} (${value})`
              : `${mult} × your ${attribute.label} (${value})`,
        });
        continue;
      }
    }

    const number = Number(term);
    if (!Number.isNaN(number)) {
      flat += number;
      parts.push({ kind: 'flat', text: String(number), detail: 'a flat bonus' });
    }
  }

  if (bonus > 0 && dice.length > 0) {
    flat += bonus;
    parts.push({ kind: 'flat', text: String(bonus), detail: `lent to this swing (${bonus})` });
  }

  const pieces = [...dice];
  // A lone stat still has to print something, so the zero shows.
  if (flat !== 0 || dice.length === 0) pieces.push(String(flat));

  return { text: pieces.join(' + '), dice, flat, parts };
}

/* ------------------------------------------------- the title and the banner
 * A weapon card is the one kind that belongs to something. Every other card in
 * the codex is called what it is; `Short Bow - Shoot` is called what it is and
 * *whose* it is, and printing both in the title made the title mostly the
 * weapon: a reader holding a Short Bow already knows they are holding one.
 *
 * So on Jules's instruction of 2026-08-24 — "the weapon name should be in the
 * banner not the title, so Short bow shoot should just be called Shoot, and in
 * the banner above read Ranged - Weapon Attack - Shortbow" — the two are split:
 *
 *   title    Shoot
 *   banner   RANGED - WEAPON ATTACK - SHORT BOW
 *
 * `name` is untouched and stays the whole of it, because the name is the card's
 * *identity* rather than its heading: it is what every {{link}} resolves against,
 * what the art work list names its files for, and what a saved row that mentions
 * a card mentions. Only what is drawn changed.
 *
 * The split is read off the card's own `weapon`, never off the punctuation in its
 * name. A name is prose and a codex is full of cards with a dash in them; the
 * field is data, and scripts/check-weapons.mjs holds it in step with the name.
 */

/* --------------------------------------------------------- prose to read from
 * A card's text is read by more than the renderer. `effectDuration` reads how
 * long it lasts off it, `secondHalf` reads what its optional half costs, and the
 * search box looks inside it. All of those match on the words, and the words
 * carry emphasis markers: since 2026-08-25 every range, target and duration in
 * the codex is written **bold** (see the note in keywords.js), so "for **10
 * turns**" and "**an entity**" is the normal shape of a sentence rather than the
 * exception.
 *
 * A marker in the middle of a phrase is invisible to a reader and fatal to a
 * regex — GIANT GROWTH's "for each additional entity" is what a Multicast says to
 * mean it repeats, and "for **each additional entity**" said it to nobody. So
 * every parser takes the markers off first, in one place, rather than each of
 * them growing its own `\*\*` in the middle of every pattern.
 */

/** Card prose with its emphasis markers off, for anything matching on words. */
export function cardProse(text) {
  return String(text ?? '').replace(/\*\*/g, '');
}

/* ------------------------------------------------------------- what it costs
 * A card prints its own Action Points and the codex never changes them. What a
 * *holder* costs it is another matter, and this is where the two meet.
 */

/**
 * What a card costs in the hands that are holding it: the printed cost, less
 * whatever the holder's own riders take off it.
 *
 * The Arcanist's PERFECT CASTING is the first: "Spells from your spellbook cost 1
 * less Action Point to cast, to a minimum of 1." The cut is the holder's, so it
 * cannot be written into fifty spells, and it cannot be resolved on the spec
 * either, because every spell in the book prints a different number for it to come
 * off. See `loadoutModifiers` in loadouts.js, which lays `apCut`, `apFloor` and
 * `apCutFrom` on the cards a pool hands out.
 *
 * Everything a reader needs comes back, not just the number:
 *
 *   ap        what is actually paid, and what every orb and every pool draws on
 *   printed   what the card was written with, so a cut can be shown as one
 *   cut       how much came off, and 0 for every card nobody is discounting
 *   from      what is lending the cut, named, the way `advantageFrom` is
 *
 * Both card shapes, the same way the card face reads them: a row typed into the
 * Abilities tab states `ap_cost`, a codex card states `ap`.
 *
 * A cost that is not a number is handed straight back. A passive prints no cost at
 * all, and an Interact costs whatever the table says it costs: there is nothing
 * there for a discount to come off, and `0 - 1` floored at 1 would invent a price
 * for a card that has none.
 */
export function cardCost(card, modifiers = null) {
  const printed = card?.ap_cost ?? card?.ap;
  const wp = card?.wp_cost ?? card?.wp;
  const flat = { ap: printed, wp, printed, cut: 0, from: [] };

  const cut = Math.max(0, Math.floor(Number(modifiers?.apCut) || 0));
  if (cut === 0 || !Number.isFinite(Number(printed))) return flat;

  /* The floor is the card's own word and not a house rule: "to a minimum of 1".
     A card that printed 0 or 1 keeps what it printed, since a floor is a floor
     and not a raise. */
  const floor = Math.max(0, Math.floor(Number(modifiers?.apFloor) || 0));
  const ap = Math.max(Math.min(Number(printed), floor), Number(printed) - cut);
  if (ap === Number(printed)) return flat;

  return { ap, wp, printed: Number(printed), cut: Number(printed) - ap, from: modifiers?.apCutFrom ?? [] };
}

/** What a card prints as its heading: its name, less the weapon it belongs to. */
export function cardTitle(card) {
  const name = card?.name ?? '';
  const weapon = card?.weapon;
  if (!weapon) return name;

  const prefix = `${weapon} - `;
  return name.startsWith(prefix) ? name.slice(prefix.length) : name;
}

/**
 * The printed banner across a card's art: "MELEE - WEAPON ATTACK", and on a
 * weapon card the weapon it belongs to after them.
 */
export function cardBanner(card) {
  if (card?.type_line) return card.type_line;
  const parts = [...(card?.tags ?? []), ...(card?.weapon ? [card.weapon] : [])];
  return parts.join(' - ').toUpperCase();
}

/* ------------------------------------------------------------- the gist */

/**
 * A card's rules text as one flat line: every token spent, every mark of
 * emphasis dropped, every paragraph run together.
 *
 * This is what a brief prints instead of the card (see CardBrief.jsx). A
 * summary stays quiet on purpose: no lit keywords, no tappable dice, no second
 * half. All of that is on the card itself, one tap away, and printing it small
 * as well would only leave two things to read where there should be one.
 *
 * The numbers are still this character's. "1d6 + 8" is worth reading at a
 * glance in a way "1d6 + 2*stat" never is, which is the whole point of the
 * line.
 *
 * `part: 'sub'` reads the card's second half instead of its main text, resolved
 * the same way. The brief never asks for it. The turn prompt does, because every
 * Upkeep in the codex is written down there and an Upkeep is the one thing on a
 * card that comes due while you are looking at something else. See
 * turnTriggers.js.
 */
export function cardGist(card, { character = null, modifiers = null, part = 'body' } = {}) {
  // A set that casts off another attribute overrides what the card is printed
  // with; see castModifier above.
  const printedStat = modifiers?.stat ?? card?.stat ?? 'instinct';
  /* And a card somebody *else* on your sheet plays resolves against them. A
     draconic ally's Wyrm Bolt is "2d4 + Mind", and the Mind it means is the
     ally's, not its bonded's — see minionModifiers in minions.js. Nothing but
     a creature passes this, so every other card still reads off the character
     it was handed. */
  const who = modifiers?.actor ?? character;
  const damage = modifiers?.damage?.length ? modifiers.damage : card?.damage ?? [];
  const empower = Number(modifiers?.empower) || 0;
  const elevate = Number(modifiers?.elevate) || 0;
  const bonus = Number(modifiers?.bonus) || 0;
  const choice = modifiers?.choice ?? null;
  /* And "your highest" is whoever's card this is: an ally's Wyrm Bolt reads the
     ally's best attribute, the same way its numbers are the ally's. */
  const stat = castStat(printedStat, who);
  const context = { character: who, stat, damage, choice };

  return cardProse(part === 'sub' ? card?.sub_body : card?.body)
    .replace(/\{\{([^}]+)\}\}/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, (_, expression) =>
      resolveValue(expression, who, stat, { empower, elevate, bonus }).text
    )
    .replace(/\{([a-zA-Z]+(?::[A-Za-z]+)?)\}/g, (whole, word) => gistToken(word, context) ?? whole)
    // Paragraphs become sentences in a row, and the stray spaces a spent token
    // leaves behind ("deal 1d6 + 8 in  damage") close up.
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?)])/g, '$1')
    .trim();
}

/** One `{token}`, written the way the card would print it but in plain text. */
function gistToken(word, { character, stat, damage, choice }) {
  const lower = word.toLowerCase();

  if (lower === 'choice') return choice?.label ?? '';

  if (lower.startsWith('roll')) {
    // With nobody to roll it there is no number, the same silence the card keeps.
    if (!character) return '';
    const attribute = attributeOf(word.includes(':') ? word.split(':')[1] : 'stat', stat);
    if (!attribute) return '';
    return `(+${resolveValue(attribute.key, character, stat).flat})`;
  }

  if (lower.startsWith('damage')) {
    const types = word.includes(':') ? [word.split(':')[1]] : damage;
    return listOr(types ?? []);
  }

  return attributeOf(word, stat)?.label ?? null;
}

/** "Sharp", "Fire or Cold", "Fire, Cold or Force". No Oxford comma. */
function listOr(words) {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} or ${words[words.length - 1]}`;
}
