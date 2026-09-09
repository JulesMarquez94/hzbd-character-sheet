/**
 * Runes: a spell cut into the skin, and what it costs to fire one.
 *
 * The ninth shape of what a talent set can hand over, beside a fixed hand, a
 * `loadout`, a `brewing` spec, an `enchanting` one, a `minion`, the Trickster's
 * `tricks`, the Duelist's `martial`, the Feral Curse's `feral` and the Pact's
 * `pact`: this one hands over a **slate**. The spells are an ordinary loadout,
 * chosen out of the codex and stored as picks the way a Mycomancer's hand is,
 * and everything that is *not* ordinary about them is in this file.
 *
 * Three things, and they are the whole set:
 *
 *   the slate    how many runes a body holds. Half your Physique plus 4 a rank,
 *                which is the first ceiling in the codex an attribute moves. It
 *                is `capacity.perStat` on the loadout spec, not here: the pool
 *                machinery already knows how to hold a ceiling and this file
 *                does not need a second copy of it.
 *   fired once   a rune fires once and is dead until the next Long Rest. That is
 *                the `card_uses` tracker exactly, so it *is* the `card_uses`
 *                tracker: `runeLimit` below is what makes an ordinary spell card
 *                answer "once, and a Long Rest fills it" for the one person who
 *                has it cut into their arm. See uses.js.
 *   brought back RECHARGED: a Short Rest returns fired runes whose Willpower
 *                costs add up to no more than your Physique. A budget spent
 *                against a list, chosen in the rest window.
 *
 * Same split as minions.js, feral.js and pact.js: the `runes` spec on the set in
 * talents.js says what THIS set's runework is made of, and this file knows what
 * a rune IS. talents.js stays a leaf.
 *
 * ------------------------------------------------------------------ storage
 * **No column of its own, and that is the design rather than a shortcut.** What
 * is inscribed is `picks` on the talent entry, which is where every chosen pool
 * on this sheet lives. What has been fired is `card_uses`, keyed by the spell's
 * own id, which is where every spent use on this sheet lives. A Runebearer
 * writes nothing a sheet did not already have a place for, so there is no
 * migration behind this set and no third record to fall out of step with the
 * other two.
 *
 * One consequence worth knowing: `card_uses` is keyed by the card and not by
 * where the card came from, on purpose and by the stacking law (see uses.js). So
 * a Runebearer who also knows Barkskin from somewhere else has one Barkskin
 * tracker between the two, and firing the rune spends the spell for the day. It
 * is the same law that stops two rings both carrying Defibrillation buying two
 * saves, read on a set that cuts its spells into itself.
 *
 * ------------------------------------------------------------------- imports
 * uses.js imports this file, so this file may not import uses.js. It reads the
 * `card_uses` column directly, with its own small repair, and never writes it:
 * a patch that spends a use is `spendCardUse`'s, and a patch that brings one
 * back is `reviveRunes` below, which is the only write in here.
 */

import { capacityAt, heldPicks, loadoutModifiers, loadoutOf } from './loadouts.js';
import { getCard } from './weapons.js';
import { getTalent, normalizeTalents } from './talents.js';

/* ------------------------------------------------------------ the spec reads */

/** The runes spec on a set, or null. Accepts an id or the talent itself. */
export function runesOf(talent) {
  const set = typeof talent === 'string' ? getTalent(talent) : talent;
  return set?.runes ?? null;
}

/**
 * Every held set that cuts its spells into its holder: `[{ talent, spec, entry }]`.
 *
 * A set with a `runes` spec and no `loadout` would be a slate with nothing to cut
 * into it, so both are required and a set carrying one without the other is
 * simply not a rune set.
 */
export function runeSets(talents) {
  return normalizeTalents(talents)
    .map((entry) => {
      const talent = getTalent(entry.id);
      const spec = runesOf(talent);
      return talent && spec && loadoutOf(talent) ? { talent, spec, entry } : null;
    })
    .filter(Boolean);
}

/* ------------------------------------------------------------- what is fired */

/**
 * The `card_uses` column, read rather than trusted, the way every jsonb column
 * on this sheet is read.
 *
 * Deliberately not `normalizeUses` from uses.js: that repairs a count against the
 * card's own limit and this file may not import it. All this needs is "has this
 * id been spent at all", so a positive number is spent and everything else is
 * not.
 */
function usedIds(character) {
  let source = character?.card_uses;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) return new Set();

  return new Set(
    Object.entries(source)
      .filter(([, count]) => Math.floor(Number(count) || 0) > 0)
      .map(([id]) => id)
  );
}

/**
 * What a rune costs to bring back, which is the spell's own printed Willpower.
 *
 * RECHARGED budgets in the spell's cost and the spell's cost is what the card
 * prints, not what firing it charged: firing charges nothing, and a budget
 * measured against nothing would bring the whole slate back every time. So the
 * number here is the one on the card in the codex, which is also the one the
 * rune's own orb shows struck through.
 */
export function runeCost(card) {
  return Math.max(0, Math.floor(Number(card?.wp_cost ?? card?.wp) || 0));
}

/* --------------------------------------------------------------- the slate */

/**
 * Every slate this character carries, each with its runes and their state.
 *
 * `level` is only ever the third term of a ceiling and no rune spec carries a
 * `perLevel`, so it is read off the row rather than off the XP table: this file
 * may not import characterModel.js, which imports it.
 *
 * A rank of 0 is a set on the sheet with nothing bought yet, and it has no slate
 * at all rather than an empty one.
 */
export function runeState(character) {
  const talents = character?.talents;
  const used = usedIds(character);
  const level = Math.max(1, Math.floor(Number(character?.level) || 1));

  return runeSets(talents)
    .map(({ talent, spec, entry }) => {
      const rank = Math.max(0, Math.floor(Number(entry.rank) || 0));
      if (rank < 1) return null;

      const pool = loadoutOf(talent);
      const capacity = capacityAt(pool, rank, level, character);
      const modifiers = loadoutModifiers(pool, rank);

      const runes = heldPicks(talents, talent.id).map((id) => {
        const card = getCard(id) ?? null;
        return {
          id,
          card,
          /* A pick the codex no longer answers for is kept and shown rather than
             dropped, exactly as `loadoutState` keeps one: quietly deleting
             somebody's rune is worse than showing them one they have to fix. */
          cost: card ? runeCost(card) : 0,
          fired: used.has(id),
          modifiers,
        };
      });

      const spent = runes.filter((rune) => rune.fired);

      return {
        id: talent.id,
        talent,
        spec,
        pool,
        rank,
        capacity,
        runes,
        modifiers,
        cut: runes.length,
        room: Math.max(0, capacity - runes.length),
        spent,
        /* Over its ceiling: a rank handed back, or a Physique that fell. Shown
           rather than trimmed, the same way an illegal pick is. */
        over: Math.max(0, runes.length - capacity),
        recharge: rechargeOf(character, spec, rank),
      };
    })
    .filter(Boolean);
}

/** One set's slate by id, or null. */
export function runeSlate(character, talentId) {
  return runeState(character).find((row) => row.id === talentId) ?? null;
}

/** The Character-tab block each slate carries, in the order the sets are held. */
export function runeBlockIds(character) {
  return runeState(character).map((row) => `rune:${row.id}`);
}

/* -------------------------------------------------------------- the tracker */

/**
 * The limit an inscribed spell answers to, or null for every card that is not
 * cut into this character.
 *
 * This is the seam the whole set hangs on. `cardLimit` in uses.js reads a rider
 * printed on the card, and no spell may carry one: Barkskin is once a day for a
 * Runebearer and unlimited for everybody else, so the limit belongs to the
 * *holder* rather than to the card. uses.js asks here whenever the card itself
 * has nothing to say, which makes an inscribed spell a once-a-Long-Rest card for
 * exactly the person who inscribed it.
 *
 * The shape is `cardLimit`'s own, down to `fills`, so everything downstream is
 * untouched: the quick bar greys the chip, the prompt says what using it costs
 * the card, and `usesRest` hands it back on a Long Rest with a line saying so.
 */
export function runeLimit(character, cardId) {
  if (!cardId) return null;

  for (const { talent, entry } of runeSets(character?.talents)) {
    if (Math.floor(Number(entry.rank) || 0) < 1) continue;
    if (!heldPicks(character?.talents, talent.id).includes(cardId)) continue;

    return { max: 1, recharge: 'Long Rest', fills: 'long' };
  }

  return null;
}

/** Whether a card is cut into this character's skin at all. */
export function isRune(character, cardId) {
  return runeLimit(character, cardId) !== null;
}

/* ------------------------------------------------------------ what a rest gives */

/**
 * RECHARGED, as a budget: what a Short Rest could bring back, and how much of
 * the slate it may reach.
 *
 * Null until the rank that grants it, which keeps the rest window quiet for
 * every Runebearer who has not bought it. The budget itself is an attribute
 * rather than a number on the card, so it grows with the body the runes are cut
 * into, which is the shape the original card had and the reason it survived the
 * move to the Master rung.
 */
function rechargeOf(character, spec, rank) {
  const rule = spec?.recharge ?? null;
  if (!rule || rank < Math.max(1, Math.floor(Number(rule.rank) || 1))) return null;

  const budget = Math.max(0, Math.floor(Number(character?.[rule.stat]) || 0));
  return { ...rule, budget };
}

/**
 * The whole of what a rest of this kind offers a Runebearer: which runes are
 * fired, what each costs to bring back, and how much may be spent bringing them.
 *
 * One row per set, and only for a set that has something to offer tonight. A
 * slate with nothing fired is left out, because a chooser that can only be
 * opened and closed again is a row that asks to be tapped and then apologises.
 *
 * **A Long Rest is deliberately not offered here.** It brings every rune back on
 * its own, through `usesRest`, so a budget on top of it would be a choice
 * between things that are all already happening.
 */
export function runeRecharges(character, kind) {
  if (kind !== 'short') return [];

  return runeState(character)
    .filter((slate) => slate.recharge && slate.spent.length > 0)
    .map((slate) => ({
      talent: slate.talent,
      slate,
      budget: slate.recharge.budget,
      from: slate.recharge.from ?? slate.talent.name,
      /* Cheapest first, so the tap order is the one that fits the most back
         under the budget and a player does not have to sort a list to spend it
         well. */
      spent: [...slate.spent].sort((a, b) => a.cost - b.cost),
    }));
}

/**
 * What one chosen set of runes costs against the budget, and whether it fits.
 *
 * Read rather than enforced at the tap: the chooser offers a rune it cannot
 * afford as refused-with-a-reason rather than hiding it, which is how every
 * other budget on this sheet reads.
 */
export function rechargeSpend(row, ids = []) {
  const chosen = (row?.spent ?? []).filter((rune) => ids.includes(rune.id));
  const cost = chosen.reduce((sum, rune) => sum + rune.cost, 0);
  const budget = Math.max(0, Math.floor(Number(row?.budget) || 0));

  return { chosen, cost, budget, left: budget - cost, fits: cost <= budget };
}

/**
 * What bringing runes back does: their counts struck out of `card_uses`, and a
 * line apiece saying which came back and what it cost the budget.
 *
 * The same `{ patch, lines }` shape `beltRest`, `usesRest`, `feralRest` and
 * `minionRest` hand the rest window, and the same column `spendCardUse` writes
 * and `usesRest` clears: a rune brought back by a Short Rest is
 * indistinguishable from one that was never fired, which is what "brought back"
 * has to mean.
 *
 * Null when nothing was chosen, so a rest that recharges nothing writes nothing
 * and prints nothing.
 */
export function reviveRunes(character, ids = []) {
  const stored = usedIds(character);
  const bringing = ids.filter((id) => stored.has(id));
  if (bringing.length === 0) return null;

  let source = character?.card_uses;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  const next = { ...(source && typeof source === 'object' && !Array.isArray(source) ? source : {}) };
  for (const id of bringing) delete next[id];

  return {
    patch: { card_uses: next },
    lines: bringing.map((id) => {
      const card = getCard(id);
      return {
        key: `rune-${id}`,
        label: `${card?.name ?? id} lights again`,
        detail: `Brought back off the slate. ${runeCost(card)} against the budget.`,
        tone: 'gain',
      };
    }),
  };
}

/* --------------------------------------------------------- what a slate lends */

/**
 * RUNIC NETWORK: "Your maximum Willpower is increased by your Physique."
 *
 * The same shape `spellbookWillpowerFrom` hands back, for the same two readers:
 * `deriveStats` in characterModel.js, which is what gets written to the column,
 * and `statMath` in statMath.js, which is what the tile's breakdown promises adds
 * up to it. A rider that landed in one and not the other would make the tooltip
 * lie, which is what scripts/check-stat-math.mjs exists to catch.
 *
 * `attributes` is handed in rather than read off the row, because both callers
 * have already worked out the *effective* ones: a ring that lends Physique lends
 * the Willpower that comes with it, the same way it lends Health. Which
 * attribute is the spec's own `willpower.stat`, so a second set leaning on a
 * different one is a word in the codex and no change here.
 *
 * Summed across sets rather than taking the highest, like the spellbook and
 * unlike the ceiling rules in feral.js and moves.js. Two sets each cutting their
 * own runes are two sources; the stacking law bites within a source, not across
 * them. Moot until a second such set exists.
 */
export function runeWillpowerFrom(talents, attributes) {
  const rows = [];

  for (const { talent, spec, entry } of runeSets(talents)) {
    const rule = spec?.willpower ?? null;
    if (!rule) continue;

    const rank = Math.max(0, Math.floor(Number(entry.rank) || 0));
    if (rank < Math.max(1, Math.floor(Number(rule.rank) || 1))) continue;

    const held = Math.max(0, Math.floor(Number(attributes?.[rule.stat]) || 0));
    const willpower = Math.floor(held * Math.max(0, Number(rule.per) || 0));
    if (willpower > 0) rows.push({ talent, willpower });
  }

  return rows;
}

/** The same, summed. 0 for everybody whose sets cut no runes. */
export function runeWillpower(talents, attributes) {
  return runeWillpowerFrom(talents, attributes).reduce((total, row) => total + row.willpower, 0);
}
