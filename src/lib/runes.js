/**
 * Runes: a spell inscribed on the skin, and what it costs to keep and to fire.
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
 *   the slate    how many runes a body carries. Half your Physique plus 4 a rank,
 *                which is the first ceiling in the codex an attribute moves. It
 *                is `capacity.perStat` on the loadout spec, not here: the pool
 *                machinery already knows how to hold a ceiling and this file
 *                does not need a second copy of it. Two of them are inscribed
 *                the day the set is taken (`start: 2`) and the rest one a night.
 *   fired once   a rune fires once and is dead until the next Long Rest. That is
 *                the `card_uses` tracker exactly, so it *is* the `card_uses`
 *                tracker: `runeLimit` below is what makes an ordinary spell card
 *                answer "once, and a Long Rest fills it" for the one person who
 *                has it inscribed on their arm. See uses.js.
 *   twice over   the same spell may be inscribed more than once, and each copy is
 *                its own firing. Two copies are two entries in `picks`, which is
 *                the whole of the storage: `runeLimit` hands the card as many
 *                uses as there are copies and the existing count spends them one
 *                at a time. See `repeat` in loadouts.js.
 *   brought back RECHARGED: a Short Rest returns up to 4 fired runes, whatever
 *                they cost. A count spent against a list, chosen in the rest
 *                window.
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
 * saves, read on a set that writes its spells onto itself.
 *
 * The same keying is what makes a second copy free of new storage. Two Barkskins
 * on one arm are not two rows, they are one row counting to two, so nothing
 * downstream had to learn what a copy is: the chip greys after the second
 * firing and the morning clears the count.
 *
 * ------------------------------------------------------------------- imports
 * uses.js imports this file, so this file may not import uses.js. It reads the
 * `card_uses` column directly, with its own small repair, and never writes it:
 * a patch that spends a use is `spendCardUse`'s, and a patch that brings one
 * back is `reviveRunes` below, which is the only write in here.
 */

import { capacityAt, copiesOf, heldPicks, loadoutModifiers, loadoutOf } from './loadouts.js';
import { getCard } from './weapons.js';
import { getTalent, normalizeTalents } from './talents.js';

/* ------------------------------------------------------------ the spec reads */

/** The runes spec on a set, or null. Accepts an id or the talent itself. */
export function runesOf(talent) {
  const set = typeof talent === 'string' ? getTalent(talent) : talent;
  return set?.runes ?? null;
}

/**
 * Every held set that writes its spells onto its holder: `[{ talent, spec, entry }]`.
 *
 * A set with a `runes` spec and no `loadout` would be a slate with nothing to
 * write on it, so both are required and a set carrying one without the other is
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

/** The `card_uses` column as an object, or an empty one. Read, never trusted. */
function storedUses(character) {
  let source = character?.card_uses;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  return source && typeof source === 'object' && !Array.isArray(source) ? source : {};
}

/**
 * How many firings are spent against each card id.
 *
 * Deliberately not `normalizeUses` from uses.js: that repairs a count against the
 * card's own limit and this file may not import it. It was a Set of "has this
 * been spent at all" until a slate could hold two of the same rune, and a Set
 * cannot say that one of two Barkskins is gone. So it counts, and the caller
 * clamps against the copies it actually has.
 */
function usedCounts(character) {
  const counts = new Map();

  for (const [id, count] of Object.entries(storedUses(character))) {
    const spent = Math.floor(Number(count) || 0);
    if (spent > 0) counts.set(id, spent);
  }

  return counts;
}

/**
 * What a rune is worth, which is the spell's own printed Willpower.
 *
 * This is the number the slate holds off the maximum for as long as the rune is
 * on, and it is the one on the card in the codex rather than what firing it
 * charged: firing charges nothing. It is also the number the rune's own orb
 * shows struck through.
 *
 * It stopped being what a *recharge* is measured in on 2026-09-09, when the
 * Master card went from a Willpower allowance to a count of four runes. It is
 * still printed beside every fired rune in the rest window, because which four
 * to bring back is a decision made on what they were worth.
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
  const used = usedCounts(character);
  const level = Math.max(1, Math.floor(Number(character?.level) || 1));

  return runeSets(talents)
    .map(({ talent, spec, entry }) => {
      const rank = Math.max(0, Math.floor(Number(entry.rank) || 0));
      if (rank < 1) return null;

      const pool = loadoutOf(talent);
      const capacity = capacityAt(pool, rank, level, character);
      const modifiers = loadoutModifiers(pool, rank);

      /* One row per **copy**, because that is what a rune is now: the same spell
         inscribed twice is two runes, two firings and twice the Willpower off the
         maximum, and a list that folded them into one row with a number on it
         would be the one place on the sheet where two runes read as one.

         Which copy is fired is decided by the count and not by the row: the
         column holds "barkskin: 1" and knows nothing about which of the two arms
         it came off, so the copies are marked in order and the last one inscribed
         is the last one to go dark. Identical copies make that a distinction
         without a difference, which is why the count can stay one row. */
      const seen = new Map();
      const runes = heldPicks(talents, talent.id).map((id) => {
        const card = getCard(id) ?? null;
        const copy = (seen.get(id) ?? 0) + 1;
        seen.set(id, copy);

        return {
          id,
          /* What a list renders against, since two copies wear one id. */
          key: copy > 1 ? `${id}#${copy}` : id,
          copy,
          copies: 0,
          card,
          /* A pick the codex no longer answers for is kept and shown rather than
             dropped, exactly as `loadoutState` keeps one: quietly deleting
             somebody's rune is worse than showing them one they have to fix. */
          cost: card ? runeCost(card) : 0,
          fired: copy <= (used.get(id) ?? 0),
          modifiers,
        };
      });
      /* And how many of each there are, laid on every row of that id once they
         are all counted, so a row can say "the second of two" without the block
         counting the list again. */
      for (const rune of runes) rune.copies = seen.get(rune.id) ?? 1;

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
        /* What the slate is holding of the maximum, uncapped. The floor in
           `runeDebtFrom` is the arithmetic's repair; what a block should print is
           what these runes actually cost, and the warning beside it is what says
           the maximum has run out. */
        debt: runes.reduce((sum, rune) => sum + rune.cost, 0),
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
 * inscribed on this character.
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

  /* **The count is the copies**, which is the whole of what "the same spell can
     be inscribed more than once, each one a single use" needed (Jules,
     2026-09-09). Two Fire Seeds on one arm are one tracker row counting to two,
     so the chip greys after the second firing and the morning clears both.

     Summed across sets rather than taken at the highest, the same way
     `runeWillpowerFrom` sums: two sets that each inscribed it are two runes and
     two firings. Moot until a second rune set exists. */
  let max = 0;
  for (const { talent, entry } of runeSets(character?.talents)) {
    if (Math.floor(Number(entry.rank) || 0) < 1) continue;
    max += copiesOf(heldPicks(character?.talents, talent.id), cardId);
  }

  return max > 0 ? { max, recharge: 'Long Rest', fills: 'long' } : null;
}

/** Whether a card is inscribed on this character at all. */
export function isRune(character, cardId) {
  return runeLimit(character, cardId) !== null;
}

/* ------------------------------------------------------------ what a rest gives */

/**
 * RECHARGED, as a budget: how many fired runes a Short Rest may light again.
 *
 * Null until the rank that grants it, which keeps the rest window quiet for
 * every Runebearer who has not bought it.
 *
 * **A count of runes since 2026-09-09**, where it used to be a Willpower
 * allowance spent against their printed costs. The old shape was the original
 * card's and it paid out backwards: a Physique of 8 brought back four cantrips
 * or none of the one Master spell the slate was built around. "Have the tattoo
 * return be 4 by master" is a flat four, whatever they cost, and `rule.count` is
 * where the four lives. A rule naming a `stat` instead reads the same number off
 * an attribute, so a set that wants "a Physique of them" can say so without this
 * going back to being a price.
 */
function rechargeOf(character, spec, rank) {
  const rule = spec?.recharge ?? null;
  if (!rule || rank < Math.max(1, Math.floor(Number(rule.rank) || 1))) return null;

  const count = rule.stat
    ? Math.max(0, Math.floor(Number(character?.[rule.stat]) || 0))
    : Math.max(0, Math.floor(Number(rule.count) || 0));

  return { ...rule, count };
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
      budget: slate.recharge.count,
      from: slate.recharge.from ?? slate.talent.name,
      /* **Dearest first**, which is the reverse of the order this list had while
         the budget was Willpower. Cheapest first was the order that fitted the
         most back under a price; four runes is four runes, so the order that
         spends it best is the one that starts with the spell that cost the most
         to inscribe. Tapping straight down the list is the strong play either
         way, which is the whole point of sorting it. */
      spent: [...slate.spent].sort((a, b) => b.cost - a.cost),
    }));
}

/**
 * What one chosen set of runes costs against the budget, and whether it fits.
 *
 * A rune apiece since 2026-09-09, so `cost` counts rows rather than adding up
 * Willpower. The two names are kept because the window prints the same sentence
 * either way: what has been spent, and what is left of it.
 *
 * Read rather than enforced at the tap: the chooser offers a rune it cannot
 * afford as refused-with-a-reason rather than hiding it, which is how every
 * other budget on this sheet reads.
 */
export function rechargeSpend(row, keys = []) {
  const chosen = (row?.spent ?? []).filter((rune) => keys.includes(rune.key));
  const budget = Math.max(0, Math.floor(Number(row?.budget) || 0));
  const cost = chosen.length;

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
export function reviveRunes(character, keys = []) {
  const used = usedCounts(character);

  /* The keys name copies and the column counts firings, so what comes back is
     how many of each id were chosen. A key for a rune with nothing spent against
     it brings nothing back, which is what the `Math.min` says: a stale draft
     cannot conjure a firing that was never made. */
  const bringing = new Map();
  for (const key of keys) {
    const id = String(key).split('#')[0];
    const spent = used.get(id) ?? 0;
    if (spent <= 0) continue;
    bringing.set(id, Math.min(spent, (bringing.get(id) ?? 0) + 1));
  }
  if (bringing.size === 0) return null;

  const next = { ...storedUses(character) };
  for (const [id, count] of bringing) {
    const left = (used.get(id) ?? 0) - count;
    if (left > 0) next[id] = left;
    else delete next[id];
  }

  return {
    patch: { card_uses: next },
    lines: [...bringing].map(([id, count]) => {
      const card = getCard(id);
      const name = card?.name ?? id;

      return {
        key: `rune-${id}`,
        label: count > 1 ? `${name} x${count} light again` : `${name} lights again`,
        detail: `Brought back off the slate, ${
          count === 1 ? 'one rune' : `${count} runes`
        } of what the rest allows.`,
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
 * unlike the ceiling rules in feral.js and moves.js. Two sets each writing their
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

/** The same, summed. 0 for everybody whose sets carry no runes. */
export function runeWillpower(talents, attributes) {
  return runeWillpowerFrom(talents, attributes).reduce((total, row) => total + row.willpower, 0);
}

/* ------------------------------------------------------------- what it costs */

/**
 * The Willpower a slate is holding: the sum of what every inscribed spell would
 * have cost to cast, taken off the maximum for as long as the rune is on.
 *
 * **This is the idea the whole set is built on**, and it is why firing a rune
 * costs nothing: the Willpower was paid once, on the night the rune went on, and
 * it stays paid. Remove the rune and it comes back. So the number is never
 * stored anywhere. It is computed from the list every time, exactly as the
 * conversion workbook's Special Feature tab insisted: "the list is the record and
 * the number is always computed from it, never stored. Store the number and one
 * bad edit costs a player their Willpower for good."
 *
 * -------------------------------------------------------------------- the floor
 * `room` is everything the maximum is made of *before* the runes are taken off,
 * and the debt is capped at it so a maximum can never go below zero. It is a
 * repair rather than a rule: the chooser warns long before a slate gets there,
 * and the only way to arrive over the line is to lose the rank or the Physique
 * that was paying for it.
 *
 * Both readers pass the same `room`, which is what keeps `deriveStats` and
 * `statMath` from disagreeing about a floored number. Flagged in data/README.md,
 * because whether a Runebearer should be *refused* the inscription instead is
 * Jules's call.
 */
export function runeDebtFrom(talents, room = Infinity) {
  let left = Number.isFinite(room) ? Math.max(0, Math.floor(room)) : Infinity;
  const rows = [];

  for (const { talent } of runeSets(talents)) {
    const owed = heldPicks(talents, talent.id).reduce(
      (sum, id) => sum + runeCost(getCard(id)),
      0
    );
    if (owed <= 0) continue;

    const willpower = Math.min(owed, left);
    left -= willpower;
    /* `owed` rides along so a block can say what the slate *should* be costing
       when the floor is holding part of it back. */
    rows.push({ talent, willpower, owed });
  }

  return rows;
}

/** The same, summed. 0 for everybody holding no runes. */
export function runeDebt(talents, room = Infinity) {
  return runeDebtFrom(talents, room).reduce((total, row) => total + row.willpower, 0);
}
