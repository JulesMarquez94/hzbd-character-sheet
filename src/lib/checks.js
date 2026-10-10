/**
 * What a card says about a Skill Check *you* are the one making.
 *
 * SKILL CHECK is the one card in the codex whose attribute is a decision, and
 * the second half of what its prompt asks is what you are bringing to the roll.
 * Fourteen background skills were the whole of that answer until 2026-09-04,
 * when Jules reported the hole: "Feral sense is not visible as a possible option
 * to check when doing skill check." A Feral Cursed's BESTIAL SENSE reads "you
 * have advantage on skill checks related to using your 5 senses", and the prompt
 * had never heard of it, because the reader walked the background tab and
 * nothing else.
 *
 * So the law lives here, in a file that asks about a *card* and knows nothing
 * about where it came from. Three sources hand cards to it now: the trade you
 * came up in, every talent set you have taken, and the blood you were born with.
 * `characterCheckCards` in levelPicks.js composes them, for the reason every
 * composed reading lives there — it is the only file that can see all three.
 *
 * ---------------------------------------------------------------------- the law
 * **Whether a card speaks is read off its prose. What it is worth is read off
 * `grants`.** Two halves, and they answer different questions:
 *
 *   the prose  says the card has something to do with a check you are making,
 *              which is what puts it in front of the player at all;
 *   `grants`   says what ticking it costs and what it lends, which is what makes
 *              it a toggle rather than a line.
 *
 * A card that speaks and carries no rider comes back with both numbers at zero,
 * and the prompt prints it as what it is: a card that is yours to apply and that
 * the sheet cannot spend for you. Three do today. SKILLED swaps the check's own
 * 2d6 for 2d8, MASTERMIND maximises them once a Long Rest, and DISTRACT buys a
 * retry after the roll has already failed. None of the three is a die added to
 * this roll, and a dead toggle would be worse than a line naming the card.
 *
 * ------------------------------------------------------------ matching phrases
 * The prose is matched as **phrases and never as the words "skill check"**,
 * because plenty of cards mention one without it being yours to bring:
 *
 *   HELPFUL   "whenever **an ally** makes a skill check" is not this check.
 *   TAILOR    reads a stranger's clothes "without doing a skill check", which is
 *             the absence of one.
 *
 * Every phrase below is here because a card in the codex is written that way,
 * and each is named beside it. A drop that writes a fifteenth sentence a new way
 * adds a line here, which is the price of reading prose rather than a list of
 * ids: the sentence stays the thing that says it, so the card and the sheet can
 * never drift apart.
 */

/** The sentences that mean "a skill check you are the one making". */
const YOURS = [
  /* The thirteen domain skills and STREETWISE, all "whenever you make a skill
     check ... you can spend 1 Willpower", and SKILLED, which says it about any
     check at all. */
  /\byou make a skill check\b/i,
  /* SKULK, whose subject is "you or an ally within 3 meters", so the verb it
     reaches is a bare one. */
  /\bor make a skill check\b/i,
  /* DISTRACT, which speaks about a check you have already failed. */
  /\byou fail a[^.]*\bskill check\b/i,
  /* MASTERMIND, which does not roll one at all. */
  /\btreat a skill check\b/i,
  /* BESTIAL SENSE and anything else written as a standing advantage rather than
     as a thing you do. The clause has to hold both halves, so a card handing the
     advantage to somebody else never matches: it is `you` and the advantage on a
     check, inside one sentence. */
  /\byou\b[^.]*\badvantage on (?:all )?skill checks?\b/i,
];

/** Whether this card has anything to say about a check its holder is making. */
export function speaksToACheck(card) {
  const body = String(card?.body ?? '');
  return YOURS.some((phrase) => phrase.test(body));
}

/**
 * One card as the prompt offers it.
 *
 * `summary` is the domain in the card's own words, which is the whole question
 * the player is answering by ticking it: no column anywhere says that this
 * attempt is about a map or about listening at a door. A card whose own summary
 * is about something else says the domain in `grants.checkWhen` instead, which
 * the two cards that do two things both need. SKULK's summary is about hiding in
 * plain sight and BESTIAL SENSE's carries a Shield pool, and neither tells a
 * player what they are about to tick.
 *
 * `from` is where the card came from, printed beside it because two cards can
 * cover the same ground from two different sources. A Wildkin's SHARP SENSE and
 * a Feral Cursed's BESTIAL SENSE are both the five senses, at different prices.
 */
export function checkRow(card, from = '') {
  return {
    id: card.id,
    name: card.name,
    summary: card.grants?.checkWhen ?? card.summary ?? '',
    from,
    wp: Math.max(0, Math.floor(Number(card.grants?.checkWp) || 0)),
    advantage: Math.max(0, Math.floor(Number(card.grants?.checkAdvantage) || 0)),
  };
}

/** Every card in this list that speaks to a check, as rows, in the order given. */
export function checkCards(cards, from = '') {
  return (Array.isArray(cards) ? cards : [])
    .filter((card) => card && speaksToACheck(card))
    .map((card) => checkRow(card, from));
}
