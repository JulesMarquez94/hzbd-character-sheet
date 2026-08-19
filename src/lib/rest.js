/**
 * Resting: the other half of a fight.
 *
 * A rest is the only thing on the sheet that moves several pools at once and
 * ends several effects at once, so it is the one thing that most wants to say
 * exactly what it is about to do *before* it does it. Everything here builds a
 * plan — a list of lines a dialog can print, and the single patch that carries
 * them out — and nothing writes anything on its own.
 *
 * ------------------------------------------------------------------ the two
 *   Short Rest   5 Supplies. Half your Health back. Ends what lasts "until a
 *                short rest".
 *   Long Rest    10 Supplies. All your Health and all your Willpower back.
 *                Ends everything a short rest ends, and everything that lasts
 *                until a long one.
 *
 * A long rest ends what a short rest ends, and never the other way round: an
 * effect written "until your next Long Rest" survives a nap.
 *
 * -------------------------------------------------------------- the preparing
 * A rest is also when a caster decides what they are carrying tomorrow. A set
 * that chooses its own cards says on the card itself which rests may re-choose
 * them — a Mycomancer's spells may be swapped after a short or a long one — so
 * the rest window offers the swap, and the swap rides in the rest's own patch.
 * Backing out of the rest backs out of the swap with it: nothing is written
 * until "Yes, rest" is pressed, which is the whole point of this file.
 *
 * ---------------------------------------------------------------- the labour
 * A long rest is also when work gets done. Several background skills are
 * actions taken *during* a long rest and paid for in Supplies — crafting a
 * potion, keeping vigil, foraging the ground around the camp. Those are listed
 * in the long rest's own window so they can be done there, which is the only
 * place they were ever going to be done.
 *
 * Their numbers are read off the designer's own card text rather than authored
 * a second time here, so a card that changes changes the button with it. The
 * verb beside each number is what says whether it leaves the crate or lands in
 * it ("expending 20 Supplies" against "gain 15 Supplies").
 *
 * ------------------------------------------------------------- the bookkeeping
 * Every supply movement is a ledger entry with its own reason, the same as one
 * typed into the crate by hand, because a rest that quietly drains ten supplies
 * is a rest nobody can account for afterwards. Overspending empties the crate
 * rather than going negative, exactly as the Supply ledger already does.
 */

import { appendLedger, clamp, formatNumber, newLedgerId } from './characterModel.js';
import { normalizeEffects } from './combatTurn.js';
import { getBackgroundSkill, normalizeBackgroundSkills, getBackground } from './backgrounds.js';
import { normalizeLevelPicks } from './levelPicks.js';
import { pickChanges } from './loadouts.js';

/** What each rest costs and what it gives back. */
export const RESTS = {
  short: {
    id: 'short',
    label: 'Short Rest',
    supplies: 5,
    // Ends only what says "short"; a long rest's effects sit through it.
    ends: ['short'],
    blurb: 'A few hours off your feet. Enough to bind a wound and eat.',
  },
  long: {
    id: 'long',
    label: 'Long Rest',
    supplies: 10,
    ends: ['short', 'long'],
    blurb: 'A full night. Everything comes back, and the work of the camp gets done.',
  },
};

export function getRest(kind) {
  return RESTS[kind] ?? null;
}

/* ------------------------------------------------------------- the labours */

/** "expending 20 Supplies" leaves the crate; "gain 15 Supplies" lands in it. */
const SPEND_WORDS = /expend|spend|pay|cost/gi;
const GAIN_WORDS = /gain|recover|receive|find/gi;

/**
 * Where a word last appears before a point in the text, or -1.
 *
 * The verb that governs a number is the nearest one *before* it, however far
 * back that is. A fixed window misses the second half of a sentence like the
 * Smith's "expending 30 Supplies to repair ... or 60 Supplies to reforge",
 * where the only verb is long behind the second number.
 */
function lastMatch(text, pattern) {
  let last = -1;
  pattern.lastIndex = 0;
  for (const found of text.matchAll(pattern)) last = found.index;
  return last;
}

/**
 * The supply movements a card names, in the order it names them.
 *
 * Read off the printed body, with the nearest verb before each number
 * deciding the direction. A card that names no number offers none, and the
 * dialog falls back to a free amount for it.
 */
export function labourOptions(card) {
  const whole = `${card?.body ?? ''}\n${card?.sub_body ?? ''}`.replace(/\*+/g, '');

  /* Only the paragraphs that speak of the rest itself. Field Medic names
     10 Supplies for its mid-combat stabilise a paragraph earlier, and that
     number must not come back as camp work. A card whose numbers sit outside
     such a paragraph still reads whole, so nothing new is silently dropped. */
  const restParts = whole.split(/\n{2,}/).filter((part) => /long rest/i.test(part));
  const text = restParts.length > 0 ? restParts.join('\n') : whole;

  const options = [];
  const seen = new Set();

  for (const match of text.matchAll(/(\d+)\s*(?:Supplies\b|(?=[.,]))/gi)) {
    const amount = Math.max(0, Math.floor(Number(match[1]) || 0));
    if (!amount || seen.has(amount)) continue;

    // Everything before the number, with the nearest verb winning.
    const lead = text.slice(0, match.index);
    const spend = lastMatch(lead, SPEND_WORDS);
    const gain = lastMatch(lead, GAIN_WORDS);
    if (spend === -1 && gain === -1) continue;

    seen.add(amount);
    options.push({ amount, gain: gain > spend });
  }

  return options;
}

/**
 * Everything this character can do during a long rest.
 *
 * A skill qualifies by saying so: it is tagged Labour, or its text names
 * taking a long rest as the moment it happens. Both, because the codex tags
 * most of them and describes all of them, and a skill that only describes it
 * is still a thing you can do.
 */
export function restLabours(character) {
  const background = getBackground(character?.background);
  const ids = [
    ...normalizeBackgroundSkills(background, character?.background_skills),
    ...Object.values(normalizeLevelPicks(character?.level_picks))
      .map((pick) => pick.skill)
      .filter(Boolean),
  ];

  const seen = new Set();
  const rows = [];

  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);

    const card = getBackgroundSkill(id);
    if (!card) continue;

    const text = `${card.body ?? ''}\n${card.sub_body ?? ''}`.replace(/\*+/g, '');
    const isLabour =
      (card.tags ?? []).includes('Labour') || /take a long rest|taking a long rest/i.test(text);
    if (!isLabour) continue;

    rows.push({ card, options: labourOptions(card) });
  }

  return rows;
}

/* ----------------------------------------------------------------- the plan */

/** "Bramble Whip and Rot Touch", "one, two and three". No Oxford comma. */
function listOut(words) {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/**
 * What a rest is about to do, said in lines, and the one patch that does it.
 *
 * `labours` is what the player chose to do during it: `[{ card, amount, gain }]`,
 * already priced. They ride in the same patch and the same ledger as the rest
 * itself, so one rest is one write however much work was done in it.
 *
 * `prepared` is the whole `talents` value as the player has just re-prepared it
 * in the window — the hands a choosing set carries out of the camp. It rides in
 * the same patch for the same reason, so a rest that is cancelled or refused
 * leaves yesterday's spells exactly where they were.
 */
export function restPlan(character, kind, labours = [], prepared = null) {
  const rest = getRest(kind);
  if (!rest) return null;

  const lines = [];
  const patch = {};
  let ledger = character?.ledger;

  /* ---- supplies: the rest itself, then each piece of work ---- */
  let supplies = Math.max(0, Math.floor(Number(character?.supplies) || 0));

  /* Nothing here empties the crate to make itself fit. A rest you cannot pay
     for does not happen, so the balance is allowed to go negative while the
     plan is being built and the whole thing is refused if it ever does. */
  const held = supplies;
  let short = 0;

  const move = (delta, note) => {
    supplies += delta;
    if (supplies < 0) {
      short = Math.max(short, -supplies);
      return delta;
    }

    ledger = appendLedger(
      { ...character, ledger },
      {
        id: newLedgerId(),
        ts: new Date().toISOString(),
        kind: 'supplies',
        delta,
        note,
        balance: supplies,
      }
    );
    return delta;
  };

  move(-rest.supplies, rest.label);
  lines.push({
    key: 'cost',
    label: `${rest.supplies} Supplies`,
    detail:
      supplies >= 0
        ? 'Out of the crate.'
        : `The crate holds ${formatNumber(held)}. You cannot pay for this rest.`,
    tone: supplies >= 0 ? 'cost' : 'warn',
  });

  for (const labour of labours) {
    const delta = labour.gain ? labour.amount : -labour.amount;
    const before = supplies;
    move(delta, labour.card.name);
    lines.push({
      key: `labour-${labour.card.id}-${labour.amount}`,
      label: `${labour.card.name}: ${delta > 0 ? '+' : ''}${delta} Supplies`,
      detail:
        supplies >= 0
          ? labour.gain
            ? 'Into the crate.'
            : 'Out of the crate.'
          : `Only ${formatNumber(Math.max(0, before))} left. This is beyond the crate.`,
      tone: supplies >= 0 ? (labour.gain ? 'gain' : 'cost') : 'warn',
    });
  }

  const affordable = short === 0;

  // A refused rest writes nothing at all. The lines above still describe what
  // it *would* have done, which is what the window needs in order to say why.
  if (affordable) {
    patch.supplies = supplies;
    patch.ledger = ledger;
  }

  /* Everything below only happens if the crate covered it. A rest nobody can
     pay for restores nothing and ends nothing: it did not happen. */
  if (!affordable) {
    return { rest, lines, patch: {}, supplies: held, affordable, short };
  }

  /* ---- health ---- */
  const healthMax = Math.max(0, Math.floor(Number(character?.health_max) || 0));
  const health = Math.floor(Number(character?.health) || 0);
  const backTo =
    kind === 'long' ? healthMax : clamp(health + Math.floor(healthMax / 2), health, healthMax);

  if (backTo !== health) {
    patch.health = backTo;
    lines.push({
      key: 'health',
      label: `Health ${health} to ${backTo}`,
      detail: kind === 'long' ? 'All of it.' : 'Half your maximum back.',
      tone: 'gain',
    });
  }

  /* ---- willpower: a long rest only, which is what the glossary says ---- */
  if (kind === 'long') {
    const wpMax = Math.max(0, Math.floor(Number(character?.willpower_max) || 0));
    const wp = Math.floor(Number(character?.willpower) || 0);
    if (wp !== wpMax) {
      patch.willpower = wpMax;
      lines.push({
        key: 'willpower',
        label: `Willpower ${wp} to ${wpMax}`,
        detail: 'Willpower comes back on a long rest.',
        tone: 'gain',
      });
    }
  }

  /* ---- what was re-prepared while the fire burned down ---- */
  if (prepared) {
    const changes = pickChanges(character?.talents, prepared);

    if (changes.length > 0) {
      patch.talents = prepared;

      for (const change of changes) {
        const said = [];
        if (change.dropped.length > 0) said.push(`${listOut(change.dropped)} put down`);
        if (change.learned.length > 0) said.push(`${listOut(change.learned)} taken up`);
        const moved = Math.max(change.dropped.length, change.learned.length);

        lines.push({
          key: `prepared-${change.talent.id}`,
          label: `${change.spec.label}: ${moved} changed`,
          detail: `${said.join(', ')}.`,
          tone: 'gain',
        });
      }
    }
  }

  /* ---- what the rest ends ---- */
  const effects = normalizeEffects(character?.effects);
  const ending = effects.filter((effect) => effect.until && rest.ends.includes(effect.until));

  if (ending.length > 0) {
    patch.effects = effects.filter((effect) => !ending.includes(effect));
    lines.push({
      key: 'ends',
      label: `${ending.length} ${ending.length === 1 ? 'effect ends' : 'effects end'}`,
      detail: ending.map((effect) => effect.name).join(', '),
      tone: 'end',
    });
  }

  const kept = effects.filter((effect) => effect.until === 'long' && kind === 'short');
  if (kept.length > 0) {
    lines.push({
      key: 'kept',
      label: `${kept.length} ${kept.length === 1 ? 'effect sits' : 'effects sit'} through it`,
      detail: `${kept.map((effect) => effect.name).join(', ')}. Only a long rest ends those.`,
      tone: 'keep',
    });
  }

  return { rest, lines, patch, supplies, affordable, short };
}

/**
 * Whether one piece of camp work is within reach, given that the rest itself
 * is paid for first. The chip that would overdraw the crate is offered dead
 * rather than left to fail at the last button.
 */
export function labourAffordable(character, kind, option) {
  if (option.gain) return true;
  const rest = getRest(kind);
  const held = Math.max(0, Math.floor(Number(character?.supplies) || 0));
  return held - (rest?.supplies ?? 0) - option.amount >= 0;
}
