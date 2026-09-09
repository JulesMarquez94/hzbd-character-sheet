/**
 * The Ossuary: a pool of Marrow, a menu of bodies and a debt on the maximum
 * Willpower for every one of them you are holding together.
 *
 * The tenth shape of what a talent set can hand over, beside a fixed hand, a
 * `loadout`, a `brewing` spec, an `enchanting` one, a `minion`, the Trickster's
 * `tricks`, the Duelist's `martial`, the Feral Curse's `feral`, the Pact's
 * `pact` and the Runebearer's `runes`. This one hands over a **graveyard**.
 *
 * Three things, and they are the whole set:
 *
 *   the Marrow   how much animating stuff a Necromancer has to give, which is
 *                their Mind and nothing else. "The number of necromantic bones
 *                you have is equal to your Mind", the third and last thing the
 *                designer said about it on 2026-09-09.
 *   the bodies   seven kinds at 3, 6 and 9 Marrow, opening on the rank ladder.
 *                What each one *is* is a `minion` roster and belongs to
 *                minions.js; what each one *costs* is here.
 *   the debt     "for each construct that you have active you also reduce your
 *                maximum Willpower." **One per Marrow the body cost**, which is
 *                Jules's ruling of 2026-09-09 and replaces the flat two a body
 *                this file opened with: "max willpower is reduce by 1 per marrow
 *                it cost to animate the body." So a skeleton is 3 and an
 *                abomination is 9, and the Ossuary's two numbers are the same
 *                number read twice. It is the second thing in the codex that
 *                comes *off* a derived maximum rather than adding to one. The
 *                first is a slate of runes, and this file floors its debt exactly
 *                as runes.js does.
 *
 * ------------------------------------------------------------- a body that fell
 * "An undead minion that reaches 0 is destroyed and the resources are freed, but
 * the Willpower comes back on a Long Rest" (Jules, 2026-09-09). So the two halves
 * of what a body holds come apart the moment it falls, and this is the only place
 * in the codex where two costs of one thing end at different times:
 *
 *   the Marrow      back at once. It is animating stuff and there is nothing left
 *                   to animate.
 *   the Willpower   held until the row leaves the column, which is a Long Rest
 *                   sweeping the wreck up or its keeper laying it to rest.
 *
 * Which is what the block's own prose always said — "its Marrow is already back
 * in your Ossuary, and a Long Rest is what sweeps up the rest of it" — and what
 * the arithmetic did not do until now.
 *
 * It also means this file has to be able to tell a destroyed body from a standing
 * one, which the note on imports below says it cannot. It can, for the one
 * question it is asking: a stored Health of nothing is a body at nothing, because
 * a floor of 0 is the whole of what `floor` says and an absent Health means full.
 * See `fallen`.
 *
 * Same split as minions.js, feral.js, pact.js and runes.js: the `undead` spec on
 * the set in talents.js says what THIS set's graveyard is made of, and this file
 * knows what an Ossuary IS. talents.js stays a leaf.
 *
 * ------------------------------------------------------------------ storage
 * **No column of its own.** What is raised is the `minions` column, which is
 * where every body on this sheet already lives, and what it costs is worked out
 * from the list every time. So there is no `marrow: 6` anywhere and nothing to
 * fall out of step: a body's Marrow is spent because the body is in the column,
 * and it comes back because the row went away.
 *
 * That is the same law the Runebearer's slate keeps, and for the same reason the
 * conversion workbook gave for it: "the list is the record and the number is
 * always computed from it, never stored. Store the number and one bad edit costs
 * a player their Willpower for good."
 *
 * ------------------------------------------------------------------- imports
 * characterModel.js imports this file, so this file may not import
 * characterModel.js, and may not import minions.js either, which does. It reads
 * the `minions` column directly with its own small repair, and it **writes
 * nothing**: the patch that raises a body is `addMinion`'s and the patch that
 * buries one is `dropMinion`'s, both in minions.js, called from the rest window
 * and the block, which are free to import either.
 *
 * The one consequence worth knowing is that this file cannot ask what a body's
 * *ceiling* is: that is `minionDerived`'s. It never needs to. Whether a body has
 * fallen is a Health against its floor and the floor is nothing, so `fallen`
 * answers it off the row alone; everything else here is a count of what the rows
 * cost, read off the codex.
 */

import { getCard } from './weapons.js';
import { getTalent, normalizeTalents } from './talents.js';

/* ------------------------------------------------------------ the spec reads */

/** The undead spec on a set, or null. Accepts an id or the talent itself. */
export function undeadOf(talent) {
  const set = typeof talent === 'string' ? getTalent(talent) : talent;
  return set?.undead ?? null;
}

/**
 * Every held set that keeps an Ossuary: `[{ talent, spec, entry, rank }]`.
 *
 * A set with an `undead` spec and no `minion` roster would be a pool with
 * nothing to spend it on, so both are required and a set carrying one without
 * the other simply keeps no Ossuary. A rank of 0 is a set on the sheet with
 * nothing bought yet and is left out: there is no pool until a rank opens one.
 */
export function undeadSets(talents) {
  return normalizeTalents(talents)
    .map((entry) => {
      const talent = getTalent(entry.id);
      const spec = undeadOf(talent);
      const roster = talent?.minion?.roster;
      if (!talent || !spec || !Array.isArray(roster) || roster.length === 0) return null;

      const rank = Math.max(0, Math.floor(Number(entry.rank) || 0));
      return rank > 0 ? { talent, spec, entry, rank, roster } : null;
    })
    .filter(Boolean);
}

/**
 * The `minions` column, read rather than trusted, the way every jsonb column on
 * this sheet is read.
 *
 * Deliberately not `normalizeMinions` from minions.js, which this file may not
 * import. All this needs of a row is which set raised it and which kind it is,
 * so everything else is left alone: a row with neither is somebody else's
 * creature and is skipped rather than repaired.
 */
function storedBodies(character) {
  let source = character?.minions;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) return [];

  return Object.entries(source)
    .filter(([, row]) => row && typeof row === 'object' && row.set && row.kind)
    .map(([id, row]) => ({ id, set: String(row.set), kind: String(row.kind), row }));
}

/** What one kind costs, floored at nothing so a spec with no price is free. */
function costOf(kind) {
  return Math.max(0, Math.floor(Number(kind?.cost) || 0));
}

/**
 * Whether a stored body has been destroyed.
 *
 * A Health of nothing, and nothing else: `floor: 0` on the spec is the whole of
 * "it cannot go in negative", and `resolveMinion` in minions.js reads the same
 * row to the same answer. An **absent** Health is a full one — a body raised a
 * moment ago has none written yet — which is why this asks whether the field is a
 * number before it asks what the number is. Written by hand rather than borrowed,
 * because the borrow would be an import this file may not make.
 */
function fallen(row) {
  const health = Number(row?.health);
  return Number.isFinite(health) && Math.floor(health) <= 0;
}

/** The rung a kind opens at. 1 for a kind that names none. */
function rungOf(kind) {
  return Math.max(1, Math.floor(Number(kind?.rank) || 1));
}

/* --------------------------------------------------------------- the Marrow */

/**
 * What the pool holds, off the rule rather than off a number.
 *
 * `{ stat, per }`, and a Necromancer's is `mind` at 1 apiece, which is the whole
 * of "the number of bones you have is equal to your Mind". Read against whatever
 * attributes are handed in, which is a character on every caller: a ring that
 * lends Mind lends the Marrow that comes with it, the same way it lends the
 * Willpower.
 *
 * A rank term is deliberately absent, and it is absent because he took it out.
 * The shape is a rule so that putting one back is a line in the codex.
 */
function marrowCap(spec, attributes, rank) {
  const rule = spec?.marrow ?? null;
  if (!rule) return 0;

  const held = Math.max(0, Math.floor(Number(attributes?.[rule.stat]) || 0));
  const perStat = Math.max(0, Number(rule.per) || 0);
  const perRank = Math.max(0, Number(rule.perRank) || 0);
  return Math.floor(held * perStat + Math.max(0, Math.floor(Number(rank) || 0)) * perRank);
}

/**
 * How much of its keeper's maximum Willpower one point of Marrow holds.
 *
 * A rate rather than a table, and **per Marrow rather than per body** since
 * 2026-09-09: "max willpower is reduce by 1 per marrow it cost to animate the
 * body." It was `burden: [null, 2, 2, 1]`, two a body with a rank rider taking
 * it to one, and it went for two reasons. The designer's number is per Marrow;
 * and per body priced three skeletons at six Willpower and one abomination at
 * two, which had the cheap end of the roster costing more to keep than the
 * expensive end.
 *
 * A rank term is gone with it. What a rank buys is which bodies are within
 * reach, and nothing else. Written as a rule so a ruling that puts a discount
 * back is a field in the codex and no change here.
 */
function burdenRate(spec) {
  return Math.max(0, Number(spec?.burden?.perMarrow) || 0);
}

/**
 * Every Ossuary this character keeps: what is in it, what it holds and what it
 * is costing them.
 *
 * One row per set, and only for a set whose rank has opened the pool. `bodies` is
 * the rows in the column that belong to it, each with the kind it is and what
 * that kind cost, in the order they were raised.
 *
 * `attributes` may be handed in by a caller that has already bent them, which is
 * what `deriveStats` does: it works out the effective Mind before it asks, so a
 * ring worth 2 Mind is worth 2 Marrow. Every other caller passes the character
 * and gets the column's own numbers.
 */
export function marrowState(character, attributes = character) {
  const rows = storedBodies(character);

  return undeadSets(character?.talents).map(({ talent, spec, entry, rank, roster }) => {
    const kinds = new Map(roster.map((kind) => [kind.id, kind]));

    const perMarrow = burdenRate(spec);

    const bodies = rows
      .filter((row) => row.set === talent.id)
      .map((row) => {
        const kind = kinds.get(row.kind) ?? null;
        const cost = costOf(kind);
        return {
          ...row,
          kind,
          cost,
          known: Boolean(kind),
          /* Destroyed, which is what decides whether its Marrow is back. Its
             Willpower is owed either way. */
          down: fallen(row.row),
          willpower: Math.floor(cost * perMarrow),
        };
      });

    const total = marrowCap(spec, attributes, rank);
    /* Two sums over one list, and they come apart the moment a body falls. See
       "a body that fell" at the top: the Marrow of a destroyed body is back at
       once, and its Willpower is held until the row leaves the column. */
    const spent = bodies.reduce((sum, body) => sum + (body.down ? 0 : body.cost), 0);
    const held = bodies.reduce((sum, body) => sum + body.cost, 0);
    const wrecks = bodies.filter((body) => body.down);

    return {
      id: talent.id,
      talent,
      spec,
      entry,
      rank,
      roster,
      bodies,
      /* And the wrecks on their own, because three of the block's own lines are
         about them and every one of them would otherwise be a filter at the
         render site. */
      wrecks,
      total,
      spent,
      /* What is left to spend, floored at nothing. A Mind that fell, or a rank
         handed back, can leave an Ossuary holding more than it should: the block
         says so rather than pretending, and `over` is what it says it with. */
      left: Math.max(0, total - spent),
      over: Math.max(0, spent - total),
      /* The rate, and the whole of the debt, which is what the Willpower tile
         needs. `owed` counts every row in the column and `spent` does not, so a
         Necromancer standing over a wreck has Marrow to spend and no Willpower
         to show for it until the morning. */
      perMarrow,
      owed: Math.floor(held * perMarrow),
      /* What the wrecks are holding out of that, so a block can say what a Long
         Rest is about to give back. */
      wrecked: wrecks.reduce((sum, body) => sum + body.willpower, 0),
    };
  });
}

/** One set's Ossuary by id, or null. */
export function ossuary(character, talentId) {
  return marrowState(character).find((row) => row.id === talentId) ?? null;
}

/** The Character-tab block each Ossuary carries, in the order the sets are held. */
export function ossuaryBlockIds(character) {
  return marrowState(character).map((row) => `ossuary:${row.id}`);
}

/* ------------------------------------------------------------- what it costs */

/**
 * The Willpower every Ossuary is holding: what each body standing in it takes
 * off its keeper's maximum.
 *
 * The same shape `runeDebtFrom` hands back and for the same two readers:
 * `deriveStats` in characterModel.js, which is what gets written to the column,
 * and `statMath` in statMath.js, which is what the tile's breakdown promises adds
 * up to it. A debt that landed in one and not the other would make the tooltip
 * lie, which is what scripts/check-stat-math.mjs exists to catch.
 *
 * `room` is everything the maximum is made of *before* anything is taken off,
 * and the debt is capped at it so a maximum can never go below zero. Both readers
 * pass the same number, and they pass it having already taken a slate of runes
 * out of it: a drifter carrying both pays both, in the order the sheet works them
 * out, and neither can push the other below the floor.
 *
 * `owed` rides along so a block can say what the Ossuary *should* be costing when
 * the floor is holding part of it back.
 */
export function undeadBurdenFrom(character, attributes = character, room = Infinity) {
  let left = Number.isFinite(room) ? Math.max(0, Math.floor(room)) : Infinity;
  const rows = [];

  for (const state of marrowState(character, attributes)) {
    if (state.owed <= 0) continue;

    const willpower = Math.min(state.owed, left);
    left -= willpower;
    rows.push({ talent: state.talent, willpower, owed: state.owed, bodies: state.bodies.length });
  }

  return rows;
}

/** The same, summed. 0 for everybody holding no bodies. */
export function undeadBurden(character, attributes = character, room = Infinity) {
  return undeadBurdenFrom(character, attributes, room).reduce(
    (total, row) => total + row.willpower,
    0
  );
}

/* -------------------------------------------------------------- what it holds */

/**
 * The menu: every kind this Ossuary could raise, with what it costs and why it
 * cannot be raised tonight if it cannot.
 *
 * Every kind is offered, including the ones a rank has not opened and the ones
 * there is no Marrow for, each refused with its own reason. That is how every
 * other wall on this sheet reads: a Necromancer at Rank 1 should be able to see
 * what a Master rung is for, and hiding four of the seven would make the block
 * look like the whole set.
 *
 * Ordered by price and then by the roster's own order, so the three you can
 * afford at Rank 1 are the three at the top.
 */
export function undeadOffers(state) {
  if (!state) return [];

  return state.roster
    .map((kind) => {
      const cost = costOf(kind);
      const rung = rungOf(kind);

      if (state.rank < rung) {
        return { kind, cost, rung, ok: false, gate: 'rank', reason: `${cost} Marrow, and a higher rank` };
      }
      if (cost > state.left) {
        return {
          kind,
          cost,
          rung,
          ok: false,
          gate: 'marrow',
          reason: `${cost} Marrow, and you have ${state.left} left`,
        };
      }
      return { kind, cost, rung, ok: true, gate: null, reason: null };
    })
    .sort((a, b) => a.cost - b.cost || state.roster.indexOf(a.kind) - state.roster.indexOf(b.kind));
}

/* ------------------------------------------------------- what a body may know

 * Two kinds rise knowing spells and one rises knowing Martial Moves, chosen the
 * night they stand up and never again. The pool each may choose from is on the
 * kind (`spells`, `moves`), and these are what turn it into cards.
 *
 * Deliberately **not** a `loadout`. A loadout's picks live on the talent entry,
 * which is one pool for the whole set, and these are one pool per *body*: two
 * skeleton magi are two spellbooks, and destroying one must not touch the other.
 * So they are stored on the body's own row and resolved here. See "the cards" in
 * minions.js.
 */

/** The tier word a card's tags carry: "Novice Spell" to "Novice". */
function tierOf(card) {
  for (const tag of card?.tags ?? []) {
    const match = /^(Novice|Adept|Master)\b/.exec(tag);
    if (match) return match[1];
  }
  return null;
}

/**
 * Everything a kind of body could have risen knowing, in printed order.
 *
 * `rule` is the kind's own `spells` or `moves` spec: a count, the rungs it may
 * reach, and for a spell pool the school and the families under it. The undead
 * cleric's is "3 Novice or Adept spells of Ethereal Light or Ethereal Shadow",
 * which is the designer's own sentence said as four fields.
 *
 * `kind` is the card kind out of the registry, `'spell'` or `'martial-move'`, so
 * one function answers both.
 */
function poolFor(rule, kind, cards) {
  if (!rule) return [];

  const tiers = Array.isArray(rule.tiers) ? rule.tiers : null;
  const families = Array.isArray(rule.families) ? rule.families : null;

  return cards.filter((card) => {
    if (card.kind !== kind || card.placeholder) return false;
    if (tiers && !tiers.includes(tierOf(card))) return false;
    /* The banner reads "NOVICE SPELL · ETHEREAL · LIGHT": the tier, the school,
       then the family. Same two tags loadouts.js reads, read the same way. */
    if (rule.school && (card.tags ?? [])[1] !== rule.school) return false;
    if (families && !families.includes((card.tags ?? [])[2])) return false;
    return true;
  });
}

/**
 * The spells a kind of body may rise knowing, and how many of them.
 *
 * `{ count, options }`, or null for every kind that rises knowing none. The
 * options are ordinary codex cards, so the window that chooses them can deal the
 * real card and the body that ends up with them prints its own numbers on them.
 */
export function undeadSpellPool(kind, cards) {
  const rule = kind?.spells ?? null;
  if (!rule) return null;

  return {
    count: Math.max(0, Math.floor(Number(rule.count) || 0)),
    rule,
    options: poolFor(rule, 'spell', cards),
  };
}

/** The same for Martial Moves, which the abomination and nothing else rises with. */
export function undeadMovePool(kind, cards) {
  const rule = kind?.moves ?? null;
  if (!rule) return null;

  return {
    count: Math.max(0, Math.floor(Number(rule.count) || 0)),
    rule,
    options: poolFor(rule, 'martial-move', cards),
  };
}

/* ------------------------------------------------------------- the raising */

/**
 * What a body needs answered before it can stand up, and whether it has been.
 *
 * Four questions and one of them is optional. The name, because two ghouls have
 * to be told apart; the corpse, because there is no raising without one; and the
 * spells or the moves, for the three kinds that rise knowing something. A
 * picture is never owed.
 *
 * `corpse` is one of three answers and the third is a rank's:
 *
 *   fresh     a body they have. Free, and it is the card's own first line.
 *   built     no body, so one is made: 100 Supplies out of the crate.
 *   remains   DEEPER GRAVES, from the rank named by `spec.remains`. What is left
 *             of one of their own is corpse enough, and raising over it is what
 *             finally clears the row away.
 */
export function raiseDraft(state, offer, draft = {}) {
  const spec = state?.spec ?? null;
  const kind = offer?.kind ?? null;

  const spells = kind?.spells ? Math.max(0, Math.floor(Number(kind.spells.count) || 0)) : 0;
  const moves = kind?.moves ? Math.max(0, Math.floor(Number(kind.moves.count) || 0)) : 0;

  const chosenSpells = Array.isArray(draft.spells) ? draft.spells.filter(Boolean) : [];
  const chosenMoves = Array.isArray(draft.moves) ? draft.moves.filter(Boolean) : [];

  const named = typeof draft.name === 'string' && draft.name.trim().length > 0;
  const corpse = CORPSES.includes(draft.corpse) ? draft.corpse : null;

  /* The rank that opens a body's own remains, and whether there is anything left
     to raise over. **A wreck and not any body of theirs**, which this file can
     now tell apart: `fallen` reads it off the row, and offering a standing ghoul
     as a corpse was the window inviting a Necromancer to pull one down to save a
     hundred Supplies. */
  const remains = Math.max(0, Math.floor(Number(spec?.remains) || 0));
  const reusable = remains > 0 && state.rank >= remains && state.wrecks.length > 0;

  /* And *which* of their own it comes out of, which is a question the answer
     raises. Held to a wreck this Ossuary actually has, so a stale id off an
     earlier draft is no answer at all: without this the remains could be chosen,
     no wreck named, and a free corpse taken for nothing. */
  const over = reusable && state.wrecks.some((body) => body.id === draft.over) ? draft.over : null;

  const supplies =
    corpse === 'built' ? Math.max(0, Math.floor(Number(spec?.supplies) || 0)) : 0;

  return {
    kind,
    cost: offer?.cost ?? 0,
    named,
    corpse,
    reusable,
    over,
    supplies,
    spells: { need: spells, chosen: chosenSpells.slice(0, spells) },
    moves: { need: moves, chosen: chosenMoves.slice(0, moves) },
    /* Everything answered, so the rest window may write it. A body with nothing
       left open is what "Yes, rest" is allowed to stand up. */
    ready:
      Boolean(kind) &&
      Boolean(offer?.ok) &&
      named &&
      corpse !== null &&
      (corpse !== 'remains' || over !== null) &&
      chosenSpells.length === spells &&
      chosenMoves.length === moves,
  };
}

/** The three answers to the corpse question, in the order the window offers them. */
export const CORPSES = ['fresh', 'remains', 'built'];

/**
 * The row to write for a body that has been answered for, ready for `addMinion`.
 *
 * Nothing here is stored that can be worked out again: no cost, no burden, no
 * rank. The kind is the record, and everything the kind is worth is read off the
 * codex every time.
 */
export function raiseBody(draft, { name, portrait_url } = {}) {
  const body = { name: String(name ?? '').trim().slice(0, 60) };
  if (portrait_url) body.portrait_url = String(portrait_url).trim();
  if (draft.spells.chosen.length > 0) body.spells = [...draft.spells.chosen];
  if (draft.moves.chosen.length > 0) body.moves = [...draft.moves.chosen];
  return body;
}

/**
 * What tonight's raising will say it did, as the rest window's own lines.
 *
 * One line for the body and one for the corpse, because the second is where the
 * Supplies go and a hundred of them is the largest single thing a rest can spend.
 * The Supplies themselves are moved by restPlan, which owns the crate; this only
 * says what they were for.
 */
export function raiseLines(state, draft, name) {
  const lines = [
    {
      key: `raise-${draft.kind.id}`,
      label: `${name} stands up`,
      detail: `${draft.kind.label}, at ${draft.cost} Marrow. ${state.left - draft.cost} left in your ${state.spec.label}.`,
      tone: 'gain',
    },
  ];

  if (draft.corpse === 'remains') {
    lines.push({
      key: 'raise-corpse',
      label: 'Raised out of your own remains',
      detail: 'No corpse to find and no Supplies to spend. Lay the wreck it came out of to rest.',
      tone: 'keep',
    });
  }

  const held = draft.kind.spells ? draft.spells.chosen : [];
  if (held.length > 0) {
    lines.push({
      key: 'raise-spells',
      label: `It rose knowing ${held.length} ${held.length === 1 ? 'spell' : 'spells'}`,
      detail: `${held.map((id) => getCard(id)?.name ?? id).join(', ')}. It never learns another.`,
      tone: 'gain',
    });
  }

  const drilled = draft.kind.moves ? draft.moves.chosen : [];
  if (drilled.length > 0) {
    lines.push({
      key: 'raise-moves',
      label: `It remembers ${drilled.length} ${drilled.length === 1 ? 'Martial Move' : 'Martial Moves'}`,
      detail: `${drilled.map((id) => getCard(id)?.name ?? id).join(', ')}. Added to its own swings.`,
      tone: 'gain',
    });
  }

  const debt = burdenOf(state, draft.cost);
  if (debt > 0) {
    lines.push({
      key: 'raise-burden',
      label: `Maximum Willpower ${debt} lower`,
      detail: `A body takes ${state.perMarrow} for every Marrow it cost. That is ${state.owed + debt} in all, and every point of it is in something standing or in something broken.`,
      tone: 'cost',
    });
  }

  return lines;
}

/** What a body of this price takes off its keeper's maximum Willpower. */
export function burdenOf(state, cost) {
  return Math.floor(Math.max(0, Math.floor(Number(cost) || 0)) * (state?.perMarrow ?? 0));
}

/**
 * Which Ossuaries could raise something on a rest of this kind, for the rest
 * window's action list.
 *
 * Offered whenever the set is held and the rest is the one its spec names, even
 * with no Marrow left: a Necromancer opening the menu wants to see their Ossuary,
 * and "6 of 9 spent, and nothing you can afford tonight" is the answer to the
 * question they were asking. The window's own step is where a kind is refused
 * with its reason.
 */
export function undeadRaises(character, kind) {
  return marrowState(character)
    .filter((state) => (state.spec.rests ?? ['long']).includes(kind))
    .map((state) => ({ state, offers: undeadOffers(state) }));
}

/**
 * What the Ossuary line under the rest's action slot says: what is left, and
 * what that is enough for.
 *
 * Two facts and no more, because the slot has one line: the pool, and the
 * cheapest thing still within reach. A Necromancer with nothing affordable is
 * told that instead of being told a number they cannot spend.
 */
export function marrowNote(state, offers) {
  const open = offers.filter((offer) => offer.ok);
  const pool = `${state.left} of ${state.total} Marrow left`;

  if (open.length === 0) {
    return state.total === 0
      ? `${pool}. Raise your Mind and there will be something to spend.`
      : `${pool}. Nothing you can raise tonight fits in it.`;
  }

  const names = open.map((offer) => offer.kind.label.toLowerCase());
  const said = names.length <= 1 ? names[0] : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
  return `${pool}. Enough for a ${said}.`;
}

/* ------------------------------------------------------------- the command */

/**
 * The card that wakes a set's bodies, and whether it is running.
 *
 * "Having the undead minion act requires the necromancer to spend two Action
 * Points to use the Command action." The card is an ordinary card and it plays
 * through the same prompt every other use goes through, laying its own one-turn
 * row because its text says "until your next Turn End".
 *
 * What it *costs* is no longer printed on it, which is the one thing that
 * changed on 2026-09-09: "command the undead cost should be 1 action point per 4
 * marrow currently used." A flat two was the same price for one skeleton and for
 * a procession of five, and the whole shape of the set is that an army is
 * expensive to keep. See `commandCost`.
 *
 * `commandedBy` in minions.js is what each body reads. This is what the block
 * reads, so the press and the state come out of one place.
 */
export function commandOf(state) {
  const id = state?.spec?.command?.card;
  return id ? getCard(id) ?? null : null;
}

/**
 * What waking them costs right now, in Action Points.
 *
 * One per `command.perMarrow` of the Marrow **in use**, rounded up, and never
 * less than one. In use rather than in the column, because a wreck is not
 * something you can tell to do anything: a Necromancer whose ghoul went down
 * mid-fight pays for what is still standing.
 *
 * Floored at one so the card is never free. Rounded up so the fourth Marrow and
 * the first cost the same, which is what "per 4" means at a table.
 */
export function commandCost(state) {
  const per = Math.max(1, Math.floor(Number(state?.spec?.command?.perMarrow) || 0));
  const used = Math.max(0, Math.floor(Number(state?.spent) || 0));
  return Math.max(1, Math.ceil(used / per));
}

/**
 * The rider that puts that price on the card, keyed by card id.
 *
 * `apSet` is the same field a pool's own price uses (see `loadoutModifiers` in
 * loadouts.js), and it lands the same way: `cardCost` prints the new number with
 * the printed one struck through beside it, and the use prompt charges what is
 * printed after the rider. So the quick bar, the Ossuary block, the Abilities tab
 * and the dealt card all read one number without any of them knowing where it
 * came from.
 *
 * Empty for a set whose command names no rate, which keeps whatever it printed.
 */
export function commandRiders(character, talentId = null) {
  const riders = {};

  for (const state of marrowState(character)) {
    if (talentId && state.id !== talentId) continue;
    const id = state.spec?.command?.card;
    if (!id || !(Number(state.spec.command.perMarrow) > 0)) continue;

    riders[id] = { apSet: commandCost(state), costFrom: [state.spec.label] };
  }

  return riders;
}

/** Whether this Ossuary's bodies have been woken and can still act this turn. */
export function commanded(character, state) {
  const id = state?.spec?.command?.card;
  if (!id) return false;

  const rows = Array.isArray(character?.effects) ? character.effects : [];
  return rows.some((row) => row?.card === id && Math.floor(Number(row?.turns) || 0) !== 0);
}
