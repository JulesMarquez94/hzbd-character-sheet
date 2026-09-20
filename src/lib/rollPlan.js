import { attributeOf, cardProse, castStat, resolveValue } from './cardText.js';
import { isWeaponAttack } from './tricks.js';

/**
 * What a card is going to make you roll, read off the card.
 *
 * A card already says what it rolls. It has said so since the codex was typed:
 * `{roll}` is the check, and every `[[2d6 + 2*stat]]` is a handful of dice with
 * a number after it. So there is no new field on any card and no table of
 * exceptions here. The plan is the card's own text, in the order it is printed,
 * which is also the order it is read aloud at a table.
 *
 * That order matters more than it looks. "Make a {stat} Melee Attack {roll}
 * against an entity. On a hit, you deal [[1d6 + stat]] damage" is two links, and
 * the second one only happens because the first one landed. Printing order is
 * resolution order, so walking the text left to right is walking the chain.
 *
 * ------------------------------------------------------------ what is a link
 * Two kinds, and a third thing that looks like one and is not.
 *
 *   {roll}          a check. 2d6 plus what this character adds, against a DC.
 *   [[2d6 + stat]]  dice to roll, for damage or healing or a Shield.
 *   [[stat]]        **not a link.** "gain Shield equal to your Instinct" is a
 *                   number, not a throw. `resolveValue` says so itself: no
 *                   dice in it, nothing to roll. teeth-bite is the card that
 *                   has both in one sentence, and rolling the second would put
 *                   a die on the table for a value the card states outright.
 *
 * ------------------------------------------------------------- the first roll
 * Only the first `{roll}` becomes a check, and two cards in the codex have a
 * second one. That is deliberate rather than a limit worth removing: a chain
 * asks for its DC once, per Jules on 2026-08-30, so a card with two checks would
 * have to ask twice or guess that the second shares the first one's number.
 * Neither is obviously right, so the plan takes the one it is sure about. Both
 * cards are flagged in the checker.
 *
 * ----------------------------------------------------------- naming a throw
 * A throw is named for what it is *for*, which the card says in the word right
 * after the dice: "{damage} damage", "Health", "Shield". Read from the text
 * following the token rather than from the sentence around it, because a
 * sentence that deals damage and heals in one breath would otherwise call both
 * of them the same thing. Where the following word settles nothing the sentence
 * is asked, and where that settles nothing either the throw is just a Roll,
 * which is honest and costs nothing: the dice and the total are right either
 * way, and only the word above them was ever in question.
 */

/** A check or a value, wherever one appears in a card's text. */
const LINK = /\{roll(?::([a-zA-Z]+))?\}|\[\[([^\]]+)\]\]/g;

/** What the dice are for, when the words after them say. */
const AFTER = [
  [/^\s*(?:\{damage(?::[A-Za-z]+)?\}\s*)?damage\b/i, 'damage'],
  [/^\s*(?:\{damage(?::[A-Za-z]+)?\}\s*)?Health\b/i, 'healing'],
  [/^\s*Shield\b/i, 'shield'],
];

/**
 * A value the card lands more than once, and how many times.
 *
 * Two cards in the codex do this — the two Flurries — and they say it the way
 * every such card has, in the sentence the dice are in:
 *
 *   "the blade lands three times, each landing dealing [[1d6 + stat]] damage"
 *
 * Each landing is its own throw, per Jules on 2026-08-30, which matters for more
 * than tidiness: three separate d6 are not one d6 counted three times, and each
 * of them gets its own chance to explode.
 *
 * `twice` reads the same way and **no card says it any more.** The four Paired
 * weapons did until 2026-09-03, when Jules ruled the pair is the die count and
 * not the landing: a Paired Heavy rolls 4d4 once where it used to roll 2d4
 * twice. The pattern stays, because the next card to say the word will mean it
 * and because the guard under it has to stay either way. Held against a card
 * written in scripts/check-plan.mjs rather than one in the codex.
 *
 * That guard is against "twice the number of Damage Dice rolled", which is a
 * multiplier on a count rather than a repeat. That phrasing is on the Poison
 * potion, in a different paragraph from its dice, so the sentence scope already
 * keeps it out. The guard is here because the sentence scope is the only thing
 * keeping it out, and a card drop could put the two in one sentence.
 */
const REPEATS = [
  [/\btwice\b(?!\s+the\b)/i, 2],
  [/\b(?:three times|thrice)\b/i, 3],
  [/\bfour times\b/i, 4],
  [/\bfive times\b/i, 5],
];

/**
 * The chain a use is about to raise, as specs `present` can take.
 *
 *   card       the card being played
 *   character  whose numbers it prints. A creature plays its own.
 *   modifiers  what the holder brings: the stat it casts off, Empower, Elevate,
 *              a lent bonus, a whole added throw, and the advantage riding the
 *              swing. The same object AbilityCard prints the card with, so the
 *              dice that land are the dice the player was looking at when they
 *              pressed use. `added` is the one of them the card cannot print,
 *              and it is appended at the foot of the chain — see below.
 *   half       whether the card's second half was paid for. Eleven halves in
 *              the codex roll dice and none of them repeats the base card's,
 *              so a paid half is extra links rather than replacement ones.
 */
export function rollPlan(card, character, modifiers = null, { half = false } = {}) {
  const mods = modifiers ?? {};
  const who = mods.actor ?? character;
  const stat = castStat(mods.stat ?? card?.stat ?? 'instinct', who);
  const sums = {
    empower: Number(mods.empower) || 0,
    elevate: Number(mods.elevate) || 0,
    bonus: Number(mods.bonus) || 0,
  };
  /* What kind of damage, for the line the log prints under the rolls: "Dealt 17
     Necrotic damage". An Infusion replaces the card's printed type outright, so
     the holder's is read first, exactly as AbilityCard prints it. */
  const damage = mods.damage?.length ? mods.damage : (card?.damage ?? []);
  /* And what the card says about its own roll, which is a different thing from
     what the holder lends it: an Aimed Shot is made with disadvantage in
     anybody's hands. Added to the holder's arrows rather than replacing them,
     because they cancel one for one and the dice work that out. See
     `printedSwing` above. */
  const printed = printedSwing(card, { half });

  const links = [];
  const texts = [card?.body, half ? card?.sub_body : null];

  for (const raw of texts) {
    if (!raw) continue;
    /* Markers off first. A bold run may wrap a live value, so "**[[2d6]]**
       damage" would otherwise be asked what follows it and be told "** damage".
       See cardProse in cardText.js. */
    const text = cardProse(raw);

    LINK.lastIndex = 0;
    let match;
    while ((match = LINK.exec(text))) {
      const [whole, named, expression] = match;
      const after = text.slice(match.index + whole.length);

      if (expression === undefined) {
        // Already have the one check this chain will ask a DC for.
        if (links.some((link) => link.shape === 'check')) continue;

        const attribute = attributeOf(named ?? 'stat', stat);
        if (!attribute) continue;

        const sentence = sentenceAround(text, match.index);
        /* A Skill Check is the card's own words, exactly as an Attack Roll is.
           The log names a throw after the kind of roll it was (see STEP_WORDS in
           logChain.js), and "Skill Check" is the name the game gives this one:
           it is what the thirteen domain skills say they apply to, and it is
           what the tray's own custom roll has offered since it was written. */
        const kind = kindOf(card, sentence);

        links.push({
          shape: 'check',
          /* What the row in the log will be called. A weapon's swing is a Weapon
             Attack Roll, which is the codex's own tag for it, and everything else
             is an Attack Roll or a plain Roll depending on what the sentence
             says. Named after the *kind of roll* rather than after the card,
             because the entry above it already says which card. */
          kind,
          flat: resolveValue(attribute.key, who, stat, sums).flat,
          advantage: (Number(mods.advantage) || 0) + printed.advantage,
          disadvantage: (Number(mods.disadvantage) || 0) + printed.disadvantage,
          /* Which of the target's numbers this is judged by, when the card says.
             "against the Reflex of" and "against the Grit of" name the defense
             outright; an attack with no name rolls against Defense, which is
             what an attack is. Null for the checks that are against the world
             rather than a body — a Skill Check has no target to read a DC off.
             What this buys: a check aimed at a picked target carries its own DC
             instead of asking the table for a number the system knows. See
             usePlayCard.js. */
          against: againstOf(kind, sentence),
          /* The one question the sheet cannot answer for itself. A critical is 6
             over the DC, so without the number there is no verdict to give. */
          askDc: true,
          askVerdict: true,
        });
        continue;
      }

      const resolved = resolveValue(expression, who, stat, sums);
      // A value with no dice in it is a number the card states, not a throw.
      if (resolved.dice.length === 0) continue;

      const sentence = sentenceAround(text, match.index);
      /* And a value inside a menu is an option, not something that happened.
         STEAL lists four things you might have lifted, one of which restores
         [[2d6 + 2*stat]] Health, and rolling that during the attack would put a
         number on the table for an outcome the player has not picked and will
         probably not get. It is the only card in the codex shaped this way, and
         the rule is here rather than an exception for it by name. */
      if (isMenuEntry(text, match.index)) continue;
      const kind = purposeOf(after, sentence);
      const link = {
        shape: 'value',
        kind,
        dice: resolved.dice,
        flat: resolved.flat,
        parts: resolved.parts,
        askVerdict: false,
        // Only damage has a type. Healing and a Shield are what they are.
        damage: kind === 'damage' ? damage : [],
      };

      /* A landing each, rather than one throw counted twice. Three d6 are not
         one d6 read three times, and each landing explodes on its own. */
      for (let i = 0; i < repeatsOf(sentence); i += 1) links.push({ ...link });
    }
  }

  /* ------------------------------------------------- and what is not on the card
   * A whole extra throw the holder brings, appended after everything the card
   * itself says. VENOMOUS is the one source in the codex: a Wildkin who kept it
   * deals "an additional 1d4 Decay damage" with every weapon attack, and no card
   * in their hands is ever going to have that sentence printed on it.
   *
   * Last on purpose, so it lands after the check the swing has to pass: a chain
   * gates everything after the `{roll}` on the hit, and venom on a miss is venom
   * on nothing. Once per attack rather than once per landing, because the card
   * says "your weapon attack" and not "each landing" — a Flurry of three is one
   * dose.
   *
   * Empower and Elevate are deliberately not applied to it. Both are written
   * against the dice the *card* rolls, and this handful is not the card's: a Fire
   * Infusion Empowering a blade has nothing to say about the venom in the hand
   * holding it.
   *
   * Narrowed by whoever built the modifiers rather than here, exactly as `bonus`
   * is: `attackModifiers` only hangs one on a weapon attack. See bloodRiders in
   * moves.js.
   */
  for (const one of mods.added ?? []) {
    const resolved = resolveValue(one?.dice, who, stat);
    if (resolved.dice.length === 0) continue;

    links.push({
      shape: 'value',
      kind: 'damage',
      dice: resolved.dice,
      /* And the number beside the dice, where the source brought one. VENOMOUS
         is a bare 1d4 and SPORADIC INFUSION is "4d6 + 4 x the caster's Mind":
         the dice are the card's and the number was answered on the row, so it
         arrives already worked out rather than as an expression this file would
         have to resolve against the wrong sheet. */
      flat: resolved.flat + (Number(one.flat) || 0),
      parts: resolved.parts,
      askVerdict: false,
      damage: one.damage ? [one.damage] : [],
      /* Which card put it there, so the row in the log is not an unexplained
         handful of dice between the swing and its own damage. */
      from: one.from ?? null,
    });
  }

  return links;
}

/** Whether a card is going to ask for anything at all when it is played. */
export function rollsAnything(card, character, modifiers = null, options = {}) {
  return rollPlan(card, character, modifiers, options).length > 0;
}

/* --------------------------------------------------------------- the reading */

/**
 * Whether a value is an entry in a numbered list of options.
 *
 * "…whose value is below the number you rolled: 1: Healing Tonic · Restores
 * [[2d6 + 2*stat]] Health. 2: Poison · …". A menu has no full stops between its
 * entries, so the whole list reads as one sentence and the test is what sits
 * between the sentence starting and the dice: a bare "N:" is a list, not prose.
 */
function isMenuEntry(text, at) {
  const from = Math.max(text.lastIndexOf('.', at) + 1, text.lastIndexOf('\n', at) + 1);
  return /\b\d+\s*:\s*\S/.test(text.slice(from, at));
}

/**
 * Which of a body's three numbers a check is rolled against, or null.
 *
 * The codex says it in the sentence: "against the Reflex of up to 3 entities",
 * "against the Grit of all entities". An attack that names nothing is rolled
 * against Defense, because that is the glossary's own definition of an attack
 * ("rolled against the target's Defense"). A plain check that names nothing is
 * against the world — a climb, a search — and hands back null, so the DC stays
 * the table's question.
 */
function againstOf(kind, sentence) {
  if (/against[^.]{0,60}?\breflex\b/.test(sentence)) return 'reflex';
  if (/against[^.]{0,60}?\bgrit\b/.test(sentence)) return 'grit';
  if (kind === 'weapon' || kind === 'attack') return 'avoid';
  if (/against[^.]{0,60}?\bdefense\b/.test(sentence)) return 'avoid';
  return null;
}

/** How many times the card lands this value. One unless its sentence says more. */
function repeatsOf(sentence) {
  for (const [pattern, times] of REPEATS) {
    if (pattern.test(sentence)) return times;
  }
  return 1;
}

/** What the dice are for: the word after them, then the sentence, then nothing. */
function purposeOf(after, sentence) {
  for (const [pattern, kind] of AFTER) {
    if (pattern.test(after)) return kind;
  }
  if (/\bdamage\b/i.test(sentence)) return 'damage';
  /* "healing [[1d6 + level]]" puts the word in front of the dice, which is why
     the sentence is asked at all: Bandage Roll is the one card in the codex that
     says what it is for before saying how much. */
  if (/\bhealing\b|\bheals?\b|\bHealth\b/i.test(sentence)) return 'healing';
  return 'roll';
}

/**
 * The sentence a token sits in, lowercased, for the two questions the word after
 * it cannot settle: whether a Roll is an Attack Roll, and what a bare handful of
 * dice is for.
 */
/* --------------------------------------------- what the card says about itself
 *
 * A card that bends its own roll says so in the sentence the `{roll}` is in:
 * "Make an {stat} Ranged Attack {roll} **with disadvantage** against an entity",
 * which is every Aimed Shot, both Swift Strikes, the eight Paired attacks and
 * SMITE. Nothing read that sentence until 2026-09-19, so an Aimed Shot rolled
 * with no penalty at all and a Smite with no die: the card said one thing and
 * the dice did another, which is the one thing this file exists to prevent.
 *
 * **Only the sentence the roll is in.** RECKLESS's "the attack is made with
 * advantage" is about a swing it rides rather than one it makes, and it is
 * already folded by martial.js. A sentence with no `{roll}` in it is talking
 * about somebody else's roll, some later roll or no roll at all.
 *
 * **And only where it is not conditional.** "with advantage if it is prone" is
 * a fact about the table, so it is offered as a claim in the use prompt rather
 * than applied here, exactly as PACK BOND's adjacency is. See riders.js, and
 * `cardClaims` in moves.js for where the two lists meet.
 *
 * The arrow in the card's corner deliberately does not change. It is what the
 * *holder* lends the card (see AbilityCard.jsx), and a card's own printed
 * disadvantage is already in the words underneath it.
 */

/** "with advantage", "with 2 advantage", "takes 1 disadvantage", "gains advantage". */
const SAYS_SWING =
  /\b(?:with|gains?|granting|takes?)\s+(?:(\d+)\s+|double\s+)?(dis)?advantage\b/gi;

/** The word that turns the clause into a question only the table can answer. */
const CONDITIONAL = /\b(if|while|unless|when)\b/i;

/**
 * What a card's own text does to the roll it is asking for.
 *
 *   { advantage, disadvantage, claims }
 *
 * `claims` is the conditional half, in the shape riders.js uses, so the prompt
 * can offer a card's own "if it is prone" in the same row of boxes as a tracker
 * row's. Each carries the card's own words as its `when`.
 */
export function printedSwing(card, { half = false } = {}) {
  const out = { advantage: 0, disadvantage: 0, claims: [] };
  let at = 0;

  for (const raw of [card?.body, half ? card?.sub_body : null]) {
    if (!raw) continue;
    const text = cardProse(raw);
    const found = text.search(/\{roll(?::[a-zA-Z]+)?\}/);
    /* A taken half has no `{roll}` of its own and still bends the roll the card
       already made: BLOOD SPEAR's tithe buys "the attack is made with advantage
       and the damage is Empowered by 1". So where there is no check to sit
       beside, the sentence has to name *this* attack outright. That is a much
       narrower door and it has to be: three other halves in the codex say
       something about a roll in the same breath and none of them means this one
       — DARK BARGAIN Empowers the target's next action, DELAY Elevates the
       actions it held, and CONTAINMENT SPHERE gives the trapped entity
       disadvantage on its own breakout. All three name their subject, and none
       of them names the attack. See `ownClause` below. */
    const sentence = found < 0 ? ownClause(text) : sentenceAround(text, found);
    if (!sentence) continue;
    SAYS_SWING.lastIndex = 0;
    let match;
    while ((match = SAYS_SWING.exec(sentence))) {
      const [whole, count, down] = match;
      const size = /\bdouble\b/i.test(whole) ? 2 : Math.max(1, Number(count) || 1);
      const field = down ? 'disadvantage' : 'advantage';
      const when = conditionIn(sentence, match.index + whole.length);

      if (!when) {
        out[field] += size;
        continue;
      }
      at += 1;
      out.claims.push({
        id: `printed-${at}`,
        when,
        [field]: size,
        line: `${down ? 'Disadvantage' : 'Advantage'}${size > 1 ? ` ${size} times` : ''} ${when}`,
      });
    }
  }

  return out;
}

/**
 * What a taken half does to the card's own *dice*, as `{ empower, elevate }`.
 *
 * The other half of BLOOD SPEAR's tithe: "the attack is made with advantage and
 * the damage is Empowered by 1". The advantage rides the check and is read by
 * `printedSwing` above; this is the die, and it is read separately because the
 * two land in different places.
 *
 * **Not applied here, deliberately.** An Empower changes a number the card
 * *prints*: the damage would read 2d6 on the card and roll 3d6 on the table,
 * which is the one thing this file exists to prevent. So it is folded onto the
 * modifiers instead, by `withPrinted` in moves.js, which is what both the
 * printed card and the plan are built from. The arrow is the opposite case and
 * takes the opposite route, because the corner of a card is the *holder's* and
 * the card's own disadvantage is already in the words under it.
 *
 * Only a taken half, and only a sentence about this card's own attack. The same
 * narrow door `ownClause` opens, for the same three cards it keeps out.
 */
const SAYS_DICE = /\b(?:is|are)\s+(Empowered|Elevated)(?:\s+by\s+(\d+)|\s+(once|twice))?/gi;

export function printedDice(card, { half = false } = {}) {
  const out = { empower: 0, elevate: 0 };
  if (!half || !card?.sub_body) return out;

  const clause = ownClause(cardProse(card.sub_body));
  if (!clause) return out;

  SAYS_DICE.lastIndex = 0;
  let match;
  while ((match = SAYS_DICE.exec(clause))) {
    const [, word, count, said] = match;
    const size = Number(count) || (said === 'twice' ? 2 : 1);
    if (/^empowered$/i.test(word)) out.empower += size;
    else out.elevate += size;
  }
  return out;
}

/**
 * The sentence in a half that is about *this card's own* attack, or null.
 *
 * The subject has to be the attack or its damage and nothing else, which is
 * what "the attack is made with advantage" and "the damage is Empowered by 1"
 * both say and what "it makes its breakout Roll with disadvantage" plainly does
 * not. Two cards in the codex pass it, BLOOD SPEAR and VAMPIRIC TOUCH, and they
 * are the same sentence: it is the Blood family's own way of writing a tithe.
 */
const OWN_SUBJECT = /\b(?:the|this)\s+(?:attack|damage)(?:'s|’s)?\s+(?:is|are)\s+(?:made\s+with|Empowered|Elevated)/i;

function ownClause(text) {
  for (const line of String(text).split(/(?<=[.!?])\s+|\n+/)) {
    if (!OWN_SUBJECT.test(line)) continue;
    /* "If you do" is the codex's own lead for a taken half, and a half is only
       read here once it has been paid for: the condition is already answered,
       so leaving it in would turn an Overcast the player just bought into a box
       asking whether they bought it. statuses.js strips the same words for the
       same reason. */
    return line.replace(/^If you do,\s*/i, '').toLowerCase();
  }
  return null;
}

/**
 * The condition attached to a clause, in the card's own words, or null.
 *
 * A card hedges its own roll on either side of the phrase, and both are read:
 *
 *   after   "with advantage **if it is prone**", which runs to the end of the
 *           sentence. ASHMAW REND and PACK BITE.
 *   before  "**While wielding a weapon that includes a shield**, you gain
 *           advantage", which runs to the comma that closes it. SHIELD
 *           EXPERTISE, whose condition is a thing in your hands and which the
 *           set spec already answers for the Defense half.
 *
 * The one after wins where a sentence has both, because it is the nearer of the
 * two and the one the clause is actually hanging on.
 */
function conditionIn(sentence, at) {
  const after = sentence.slice(at);
  const near = CONDITIONAL.exec(after);
  if (near) return after.slice(near.index).replace(/[.\s]+$/, '').trim();

  const before = sentence.slice(0, at);
  const far = CONDITIONAL.exec(before);
  if (!far) return null;

  const clause = before.slice(far.index);
  const comma = clause.indexOf(',');
  return (comma < 0 ? clause : clause.slice(0, comma)).replace(/[.\s]+$/, '').trim();
}

/**
 * What kind of roll one `{roll}` is, read off the sentence it is printed in.
 *
 * A weapon's swing is a Weapon Attack Roll, which is the codex's own tag for it;
 * everything else is a Skill Check, an Attack Roll or a plain Roll depending on
 * what the sentence says. It names the row in the log, and since 2026-09-19 it
 * also says which running effects reach the roll: LUCK POTION's advantage is on
 * skill checks and POWER DRAUGHT's is on Attack Rolls, and neither of them is
 * talking about the other. See `only` in riders.js.
 */
function kindOf(card, sentence) {
  if (isWeaponAttack(card)) return 'weapon';
  if (sentence.includes('skill check')) return 'skill';
  if (sentence.includes('attack')) return 'attack';
  return 'check';
}

/**
 * The kind of roll a whole card asks for, or null for one that rolls no check.
 *
 * The same reading `rollPlan` makes link by link, asked of the card's first
 * `{roll}`, which is the only one a chain ever judges. Exported for the fold in
 * moves.js, so the word a rider is narrowed by and the word the log heads the
 * throw with can never be two different readings of one sentence.
 *
 * A card with no check at all answers null and every rider reaches it, which is
 * the right answer rather than a missing one: a card that rolls no check has no
 * kind to be wrong about, and its damage can still be Empowered.
 */
export function rollKind(card, { half = false } = {}) {
  for (const raw of [card?.body, half ? card?.sub_body : null]) {
    if (!raw) continue;
    const text = cardProse(raw);
    const at = text.search(/\{roll(?::[a-zA-Z]+)?\}/);
    if (at < 0) continue;
    return kindOf(card, sentenceAround(text, at));
  }
  return null;
}

function sentenceAround(text, at) {
  const from = Math.max(
    text.lastIndexOf('.', at) + 1,
    text.lastIndexOf('\n', at) + 1
  );
  const dot = text.indexOf('.', at);
  return text.slice(from, dot < 0 ? text.length : dot + 1).toLowerCase();
}
