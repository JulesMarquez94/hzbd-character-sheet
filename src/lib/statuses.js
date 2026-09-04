/**
 * Conditions: what a card leaves on the body it lands on, by the game's own
 * word for it.
 *
 * Jules, 2026-09-04: "if I use renew it applies the effect to the target. Or
 * snake it create the poison status." RENEW already did the first half, because
 * its text says how long it runs and `castEffect` lays a row for anything that
 * does. SNAKE! did not do the second, and the reason is worth writing down:
 * "the target is poisoned" names no clock of its own. The clock is in the
 * glossary, under poisoned ("until they complete a Long Rest or regain any
 * amount of Health"), and nothing read the glossary as a duration. So a spell
 * that inflicted a condition landed a number and left the condition to memory.
 *
 * This file is the glossary read as rules. Every entry is a status keyword the
 * codex already lights (see keywords.js, whose ids these are), with the four
 * things a tracker row needs to know about it:
 *
 *   until     which rest ends it, when the glossary says one does
 *   rider     what it does to the numbers, where the sheet holds the number.
 *             Poisoned is Disadvantage on every roll and Diseased is -1 to all
 *             three attributes, so those bend the sheet the way a GIANT GROWTH
 *             row does (see riders.js). Frightened's Disadvantage is "against
 *             the one frightening them", which is a condition the sheet cannot
 *             see, so it stays a note.
 *   heals     whether healing clears it. Poisoned goes the moment any Health
 *             comes back; Bleed loses one stack.
 *   moves     whether a Move action clears it. Prone: "When the entity uses a
 *             move action the prone condition ends."
 *
 * `stacks` marks the one that stacks. Bleed is "Stackable" in the designer's
 * own word, and every other condition here is a state a body is either in or
 * not: two Poisoned rows would be one poisoning written twice.
 *
 * ------------------------------------------------------------ reading a card
 * `inflictedStatuses` reads which of these a card puts on its *target*, off the
 * card's own prose, the way rollPlan reads the dice and targeting.js reads the
 * count. "the target is poisoned", "they are rooted for 10 turns", "knocked
 * prone", "inflicts a Wound", "gains one stack of Bleed": all of it is the
 * codex's own phrasing and all of it is matched below. What is deliberately
 * *not* read is the same word used any other way: a condition removed ("shed
 * poisoned"), a condition on the caster ("your physical body is
 * incapacitated"), a condition as a precondition ("one that is stunned"), or a
 * condition the card refuses ("cannot be knocked prone").
 *
 * A status the card leaves to a choice is handed back `optional`: SHOVE's
 * "push the target back or knock it prone" is the player's call, so the prompt
 * offers it unticked rather than laying it on every shove. A staged one
 * ("rooted, constrained, then buried") is optional for the same reason.
 *
 * This file is a leaf. It reads prose and hands back plain objects.
 */

import { cardProse } from './cardText.js';

/* --------------------------------------------------------------- the table */

export const STATUSES = {
  poisoned: {
    id: 'poisoned',
    name: 'Poisoned',
    until: 'long',
    rider: { disadvantage: 1 },
    heals: true,
    line: 'Disadvantage on every roll. Ends at a Long Rest, or the moment any Health comes back.',
  },
  diseased: {
    id: 'diseased',
    name: 'Diseased',
    until: 'long',
    rider: { attributes: { physique: -1, instinct: -1, mind: -1 } },
    line: 'Minus 1 to all three attributes until a Long Rest.',
  },
  burn: {
    id: 'burn',
    name: 'Burn',
    until: 'short',
    line: 'Vulnerable to Fire damage until a Short Rest: it lands double.',
  },
  rooted: {
    id: 'rooted',
    name: 'Rooted',
    line: 'Cannot Move or Jump, and cannot be pushed or pulled.',
  },
  prone: {
    id: 'prone',
    name: 'Prone',
    rider: { disadvantage: 1 },
    moves: true,
    line: 'Disadvantage on attacks and Move costs double. Taking a Move action ends it.',
  },
  grappled: {
    id: 'grappled',
    name: 'Grappled',
    rider: { disadvantage: 1 },
    line:
      'No movement and disadvantage on attacks. Once a turn, a Physique roll against the grappler’s Reflex breaks free.',
  },
  stunned: {
    id: 'stunned',
    name: 'Stunned',
    line: 'No Actions and no Reactions while it lasts.',
  },
  constrained: {
    id: 'constrained',
    name: 'Constrained',
    line: 'No actions, though still aware of everything around.',
  },
  incapacitated: {
    id: 'incapacitated',
    name: 'Incapacitated',
    line: 'Cannot move, act or spend Reaction Points.',
  },
  unconscious: {
    id: 'unconscious',
    name: 'Unconscious',
    line: 'Down and unaware until somebody brings them round.',
  },
  asleep: {
    id: 'asleep',
    name: 'Asleep',
    line: 'Out cold. Any damage wakes them, and so does an action spent shaking them.',
  },
  blinded: {
    id: 'blinded',
    name: 'Blinded',
    line: 'Cannot see, so nothing that needs sight can be used.',
  },
  frightened: {
    id: 'frightened',
    name: 'Frightened',
    line: 'Disadvantage on every action against whoever frightened them.',
  },
  marked: {
    id: 'marked',
    name: 'Marked',
    line: 'Singled out. Whoever marked them knows where they are and hits them more easily.',
  },
  vulnerable: {
    id: 'vulnerable',
    name: 'Vulnerable',
    line: 'Takes double damage from the type the card names.',
  },
  bleed: {
    id: 'bleed',
    name: 'Bleed',
    stacks: true,
    heals: true,
    line: 'Takes 1d6 damage at every one of its Turn Starts. Healing takes one stack off.',
    /* Read by the turn prompts as the row's own clause, since a stack has no
       card sentence of its own to read the boundary off. Written the way the
       codex writes one, so turnTriggers finds it the way it finds a card's. */
    at: 'Takes 1d6 damage at its Turn Start.',
  },
  wound: {
    id: 'wound',
    name: 'Wound',
    line: 'Weapon attacks against them are Empowered.',
  },
};

/** The condition a row carries, or null for the rows that carry none. */
export function statusOf(id) {
  return id ? (STATUSES[String(id)] ?? null) : null;
}

/** The rider a condition lays on the body holding it, or null. */
export function statusRider(id) {
  return statusOf(id)?.rider ?? null;
}

/** Every condition, for the picker: name, and what ends it. */
export function trackableStatuses() {
  return Object.values(STATUSES).map((status) => ({
    status: status.id,
    name: status.name,
    until: status.until ?? null,
    label: status.until ? `Until a ${status.until} rest` : 'Until it ends',
    line: status.line,
  }));
}

/* ------------------------------------------------------------- the reading */

/** The words the codex inflicts with. Longer first, so "bleeding out" is not read as Bleed. */
const WORDS = Object.keys(STATUSES).sort((a, b) => b.length - a.length);
const WORD = `(${WORDS.join('|')})`;

/**
 * The lead-ins that put a condition on somebody. Each is tested against the
 * text immediately before the word, so "is knocked prone", "becomes rooted",
 * "are inflicted with Burn", "inflicts a Wound" and "gains one stack of Bleed"
 * all count, and a bare mention of the word does not.
 */
const LEAD_INS = [
  /\b(?:is|are|become|becomes|becoming|remain|remains|fall|falls|left)\s+(?:also\s+)?(?:knocked\s+|swallowed:\s*)?$/i,
  /\bknock(?:s|ed|ing)?\s+(?:it|them|the target|the entity|the creature)\s+$/i,
  /\b(?:inflicted|afflicted)\s+with\s+$/i,
  /\binflicts?\s+(?:an?\s+)?$/i,
  /\bgains?\s+(?:one|a|\d+)\s+stacks?\s+of\s+$/i,
  /\bsleeps,\s*$/i,
  /\ba stage:\s*$/i,
];

/** A condition named right after a noun and a comma, when a clock follows it: "your quarry, marked until". */
const APPOSITIVE = /,\s*$/;

/** The ways a list of them continues: "rooted and prone", "rooted, constrained, then buried". */
const CONTINUES = new RegExp(`^(?:,\\s*then\\s+|,\\s*|\\s+and\\s+|\\s+or\\s+)${WORD}\\b`, 'i');

/** Words that make the clause a condition, a removal or a refusal rather than an infliction. */
const HEDGED = /\b(?:if|when|whenever|while|unless|that|who|which|as long as)\b/i;
const UNDONE = /\b(?:shed|remove\w*|cure\w*|no longer|immune to|ignore\w*|cannot|instead of|treated as)\b/i;
/**
 * The subject is the caster: "your physical body is incapacitated", "or you
 * fall unconscious". Read on the clause with the lead-in taken back off, and
 * only where "you" opens the clause or follows a joining word: "of you are
 * inflicted with Burn" is about all entities near you and not about you.
 */
const SELF = /(?:^|[,:;]|\b(?:and|or|then|while|if|when|unless)\b)\s*(?:you|yourself|your(?:\s+\w+){0,2})\s*$/i;
/** A choice the card leaves open: "push it back or knock it prone". */
const CHOICE = /\bor\s+(?:\w+\s+){0,3}$/i;
/** A threshold, not a state: "While 2 or fewer Chains remain". */
const THRESHOLD = /\b\d+\s+or\s+(?:fewer|more|less)\b/i;
/** A later moment, not this cast: "When the spell ends, all entities in it become rooted". */
const LATER = /^When (?:the|this) spell ends\b/i;
/** A progression rather than a list: "rooted, constrained, then buried". */
const STAGED = /,\s*then\b/i;
/** The codex's own lead for a taken half. Stripped, because it is the half's whole point. */
const IF_YOU_DO = /^If you do,\s*/i;

/** Where one sentence ends and the next begins, without splitting "1.5 meters". */
const BREAK = /([.!?])\s+(?=[A-Z"'([])/;

function sentences(text) {
  const out = [];
  for (const paragraph of String(text ?? '').split(/\n+/)) {
    let rest = paragraph;
    let hit = BREAK.exec(rest);
    while (hit) {
      out.push(rest.slice(0, hit.index + 1));
      rest = rest.slice(hit.index + hit[0].length);
      hit = BREAK.exec(rest);
    }
    out.push(rest);
  }
  return out.map((line) => line.trim()).filter(Boolean);
}

/** The clause a position sits in: back to the last comma, colon or semicolon. */
function clauseBefore(text, at) {
  const from = Math.max(text.lastIndexOf(',', at - 1), text.lastIndexOf(':', at - 1), text.lastIndexOf(';', at - 1));
  return text.slice(from + 1, at);
}

/**
 * Every condition one sentence puts on somebody, as `{ id, optional, clause }`.
 * `clause` is the sentence itself, for whoever reads a clock off it.
 */
function readSentence(raw) {
  const text = raw.replace(IF_YOU_DO, '');
  const found = [];
  const pattern = new RegExp(`\\b${WORD}\\b`, 'gi');
  let match;

  while ((match = pattern.exec(text))) {
    const id = match[1].toLowerCase();
    const before = text.slice(0, match.index);
    const after = text.slice(match.index + match[0].length);

    const led =
      LEAD_INS.some((lead) => lead.test(before)) ||
      (APPOSITIVE.test(before) && /^\s+(?:until|for)\b/i.test(after));
    if (!led) continue;

    const clause = clauseBefore(text, match.index);
    if (HEDGED.test(clause) || UNDONE.test(clause)) continue;
    /* The verb's own subject, read back past the lead-in: "your physical body
       is incapacitated" is about the caster and lays nothing on anybody. */
    const subject = LEAD_INS.reduce((held, lead) => held.replace(lead, ''), clause);
    if (SELF.test(subject)) continue;

    const optional = CHOICE.test(before) || THRESHOLD.test(text) || LATER.test(text);
    found.push({ id, optional, clause: text });

    /* The rest of the list, if the sentence names more than one: "rooted and
       prone". A list joined by "or" is a choice and one that runs to a "then"
       is a progression ("rooted, constrained, then buried" sinks a stage at a
       time), so everything after the first is offered rather than laid. */
    let tail = after;
    let staged = STAGED.test(after);
    let more = CONTINUES.exec(tail);
    while (more) {
      staged = staged || /\bor\b/i.test(more[0]);
      found.push({ id: more[1].toLowerCase(), optional: optional || staged, clause: text });
      tail = tail.slice(more[0].length);
      more = CONTINUES.exec(tail);
      pattern.lastIndex = text.length - tail.length;
    }
  }

  return found;
}

/**
 * What this card leaves on its target, read off its main text and, when the
 * half is taken, off its second half too.
 *
 * Deduplicated by condition, a certain one winning over an optional one, so a
 * card that says "rooted" twice offers it once.
 */
export function inflictedStatuses(card, { half = false } = {}) {
  const texts = [card?.body, half ? card?.sub_body : null].filter(Boolean);
  const out = new Map();

  for (const raw of texts) {
    for (const line of sentences(cardProse(raw))) {
      for (const hit of readSentence(line)) {
        const held = out.get(hit.id);
        if (!held || (held.optional && !hit.optional)) out.set(hit.id, hit);
      }
    }
  }

  return [...out.values()];
}

/* ------------------------------------------------------------- what ends it */

/** A stored effects list as rows, without trusting it. The same read riders.js makes. */
function rows(effects) {
  let list = effects;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = null;
    }
  }
  return Array.isArray(list) ? list.filter((row) => row && typeof row === 'object') : [];
}

/**
 * The list after some Health came back: Poisoned goes, and one stack of Bleed
 * with it. Null when nothing on the list answers to healing, so the caller
 * writes nothing.
 *
 * "until they complete a Long Rest or regain any amount of Health" is the
 * poison's own clock, and "It loses one stack whenever it receives healing" is
 * the bleed's. Both are read here and nowhere else, so a heal delivered across
 * the table and one taken off a boundary prompt clear the same rows.
 */
export function healedEffects(effects) {
  const list = rows(effects);
  let bled = false;
  const kept = list.filter((row) => {
    const status = statusOf(row.status);
    if (!status?.heals) return true;
    if (status.stacks) {
      if (bled) return true;
      bled = true;
      return false;
    }
    return false;
  });
  return kept.length === list.length ? null : kept;
}

/**
 * The list after a Move action: Prone comes off. Null when nothing does.
 * "When the entity uses a move action the prone condition ends."
 */
export function movedEffects(effects) {
  const list = rows(effects);
  const kept = list.filter((row) => !statusOf(row.status)?.moves);
  return kept.length === list.length ? null : kept;
}

/** The names of the conditions running on a body, for a chip to wear. */
export function runningNames(effects) {
  return rows(effects)
    .filter((row) => row.turns !== 0 && row.name)
    .map((row) => String(row.name));
}
