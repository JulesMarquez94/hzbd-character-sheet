import { CRIT_BAND, SWING_FACES, judge, rollDie, signOf } from './dice.js';

/**
 * What can still be done about a roll that has already landed.
 *
 * A roll in this game is not over when the dice stop. Karma buys a second look,
 * and the codex has cards that buy one too: DRAGON'S FAVOR turns a roll that
 * fell one short into a success for a Willpower. Both of them are decisions made
 * *after* seeing the result, which is exactly what makes them interesting and
 * exactly what the roller has to be built to allow.
 *
 * So this file answers one question: given a landed roll and a character, what
 * may they still spend, and what would it do? The surface draws the answers as
 * buttons. Nothing here spends anything or rolls anything.
 *
 * ------------------------------------------------------- offered, not suggested
 * An offer is only made when it could change the band. Jules was precise about
 * this on 2026-08-31: Karma appears "only if karma would allow to roll a value
 * that move it to a success or critical success, so if it 4 away". A d4 rolls 1
 * to 4, so four short is reachable and five short is not, and an offer to spend
 * a Karma on a roll it cannot rescue is worse than no offer at all.
 *
 * The same test, with its own reach, is what gates every other one: a card that
 * adds +1 is offered when the gap is exactly 1.
 *
 * ------------------------------------------------------------------ no DC
 * With no DC there is no gap to measure, and the conditions above cannot be
 * evaluated at all. On Jules's ruling the offers are made anyway, but only after
 * the table has called the band: the sheet cannot do the arithmetic and the
 * people at the table can, so it stops pretending and asks them first. See
 * `interventionsFor`, which takes the verdict rather than working it out.
 *
 * ------------------------------------------------------------- naming a source
 * Every offer carries the name of what is paying for it, because that is the
 * whole reason to show it: "you have a thing that could fix this, and here is
 * what it is". A button that said only "+1" would be asking the player to
 * remember which of their cards it came from.
 */

/** The reach of each kind of help, as the most it can add to a total. */
const KARMA_REACH = SWING_FACES;

/**
 * Karma, which every character has and most have some of.
 *
 * The glossary has said what it does since before the roller existed: "Spend 1
 * after seeing a die result to add 1d4 to it." So it is not a card and not a
 * talent, it is a pool, and the only question is whether spending it could
 * matter.
 */
function karmaOffer(character) {
  const held = Math.max(0, Math.floor(Number(character?.karma) || 0));
  if (held < 1) return null;

  return {
    id: 'karma',
    label: 'Karma',
    cost: '1 Karma',
    source: 'Karma',
    detail: 'Spend 1 Karma to add 1d4 to this roll. Once per roll.',
    tone: 'var(--stat-karma)',
    reach: KARMA_REACH,
    /* A die rather than a number, so the d4 lands on the table with the rest of
       the roll and every renderer, the log and the replay all get it for free. */
    adds: { dice: [{ sides: SWING_FACES, role: 'karma' }] },
    spends: { karma: 1 },
    left: held,
  };
}

/**
 * The cards that buy a second look.
 *
 * A list rather than a field on the card, because these are rules about *rolls*
 * and the cards that carry them say so in prose that no parser is going to read
 * reliably. DRAGON'S FAVOR is the one the codex has today. Its own text is the
 * spec: "Whenever you or your draconic ally make a roll and the result is 1 away
 * from a success or Critical success, you can use this ability to add +1 to the
 * roll and make it a success or Critical success."
 */
const CARD_OFFERS = [
  {
    card: 'dragons-favor',
    id: 'dragons-favor',
    label: 'Dragon’s Favor',
    cost: '1 Willpower',
    source: 'Draconic Bond',
    detail:
      'Spend 1 Willpower to add +1 to a roll that fell exactly one short, making it a success ' +
      'or a Critical success.',
    tone: 'var(--stat-wp)',
    /* Exactly one, not up to one. The card says "1 away", and a card that only
       ever adds +1 has nothing to offer a roll that is two short. */
    reach: 1,
    exact: true,
    adds: { flat: 1 },
    spends: { wp: 1 },
  },
];

/**
 * How far short of the next band a total is, or null when it is already there.
 *
 * The next band up is a success for anything that failed, and a Critical success
 * for anything that merely succeeded. A Critical success has nothing above it.
 */
export function gapToNextBand(total, dc) {
  if (dc === null || dc === undefined) return null;
  const target = Number(dc);
  if (!Number.isFinite(target)) return null;

  if (total < target) return target - total;
  if (total < target + CRIT_BAND) return target + CRIT_BAND - total;
  return null;
}

/**
 * Everything this character could still spend on this roll.
 *
 * `held` is the card ids the character actually has, which the caller reads off
 * the sheet: this file knows what a card would do and not who owns one.
 *
 * `verdict` is passed in rather than computed so that a roll the table called by
 * hand is treated as called. With no DC every offer whose condition cannot be
 * evaluated is made anyway, once there is a verdict to react to.
 */
export function interventionsFor({
  result,
  character,
  held = [],
  spent = [],
  verdict = null,
} = {}) {
  if (!result) return [];

  /* Nothing to rescue. A Critical success is the top band, and a damage roll has
     no band at all: there is nothing for a d4 to move it into. */
  const band = verdict ?? result.verdict;
  if (result.shape !== 'check' || band === 'critical-success' || !band) return [];

  const gap = gapToNextBand(result.total, result.dc);
  const blind = gap === null && result.dc === null;
  const ours = new Set(held);

  return [karmaOffer(character), ...CARD_OFFERS.filter((offer) => ours.has(offer.card))]
    .filter(Boolean)
    .filter((offer) => !spent.includes(offer.id))
    .filter((offer) => {
      /* No DC, so no arithmetic. The table has already said what the roll was,
         and whether a +1 helps is theirs to know. */
      if (blind) return true;
      if (gap === null) return false;
      return offer.exact ? gap === offer.reach : gap <= offer.reach;
    })
    .map((offer) => ({ ...offer, gap: blind ? null : gap }));
}

/**
 * A landed roll with an intervention folded into it.
 *
 * The dice it adds are appended and the flat it adds is added, and then the whole
 * thing is judged again from scratch. Re-judging rather than nudging the verdict
 * along is the point: the bands are `judge`'s to decide, and a second opinion
 * about what a total means is exactly the kind of thing that drifts.
 *
 * `random` is handed in so a checker can script it, exactly as `rollCheck` and
 * `rollValue` take one. The die itself is thrown by dice.js's own `rollDie`,
 * because a second implementation of "roll a die" is a second thing that can
 * disagree with the first.
 */
export function applyIntervention(result, offer, random = Math.random) {
  const dice = [...result.dice];
  let id = dice.length;

  for (const add of offer.adds?.dice ?? []) {
    dice.push({
      id: id++,
      sides: add.sides,
      value: rollDie(add.sides, random),
      role: add.role ?? 'karma',
      from: null,
      /* Named on the die itself, so the log row and a replay on somebody else's
         screen can both say where the extra number came from. */
      source: offer.source,
    });
  }

  const flat = result.flat + (Number(offer.adds?.flat) || 0);
  const total = dice.reduce((sum, die) => sum + signOf(die.role) * die.value, flat);

  /* A roll with a DC re-judges itself. A roll without one goes back to the table:
     they called a band off the old total and the total has just changed, so the
     honest thing is to ask again rather than keep an answer to a different
     question. The four buttons come back. */
  const called = result.dc === null || result.dc === undefined;

  return {
    ...result,
    dice,
    flat,
    total,
    verdict: called ? null : (judge(total, result.dc) ?? result.verdict),
    calledByHand: called ? false : result.calledByHand,
    /* What was spent on it, in order. The log prints this and the surface reads
       it to stop offering the same thing twice. */
    interventions: [...(result.interventions ?? []), offer.id],
  };
}
