/**
 * The maths behind a card's live values, and the damage types it prints.
 *
 * A card never states "1d6 + your Instinct" — it states what *this* character
 * rolls with *this* weapon: "1d8 + 4" once an Empowering enchantment has had
 * its say. `resolveValue` does that sum and hands back the working, so a tap
 * on the value can show where every part of it came from.
 */

import { ATTRIBUTES as ATTRIBUTE_INFO } from './attributes.js';

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
 */
export function attributeOf(word, defaultStat = 'instinct') {
  const key = String(word || '').toLowerCase();
  if (key === 'stat' || key === '') return ATTRIBUTES[defaultStat] ?? ATTRIBUTES.instinct;
  const resolved = ALIASES[key] ?? key;
  return ATTRIBUTES[resolved] ?? null;
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
export function resolveValue(expression, character, defaultStat = 'instinct', options = {}) {
  const empower = Math.max(0, Number(options.empower) || 0);
  const elevate = Math.max(0, Number(options.elevate) || 0);

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
            ? `${count} × d${faces} — rolled at the table`
            : `${count} × d${faces} — ${grew.join(', ')}`,
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

  const pieces = [...dice];
  // A lone stat still has to print something, so the zero shows.
  if (flat !== 0 || dice.length === 0) pieces.push(String(flat));

  return { text: pieces.join(' + '), dice, flat, parts };
}

/** The printed banner across a card's art: "MELEE - WEAPON ATTACK". */
export function cardBanner(card) {
  if (card?.type_line) return card.type_line;
  return (card?.tags ?? []).join(' - ').toUpperCase();
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
 */
export function cardGist(card, { character = null, modifiers = null } = {}) {
  // A set that casts off another attribute overrides what the card is printed
  // with; see castModifier in loadouts.js.
  const stat = modifiers?.stat ?? card?.stat ?? 'instinct';
  const damage = modifiers?.damage?.length ? modifiers.damage : card?.damage ?? [];
  const empower = Number(modifiers?.empower) || 0;
  const elevate = Number(modifiers?.elevate) || 0;
  const choice = modifiers?.choice ?? null;
  const context = { character, stat, damage, choice };

  return String(card?.body ?? '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\{\{([^}]+)\}\}/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, (_, expression) =>
      resolveValue(expression, character, stat, { empower, elevate }).text
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
