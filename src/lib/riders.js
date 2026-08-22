/**
 * What a running effect does to the numbers.
 *
 * The tracker has always been able to hold a name, a count and a note. Three
 * kinds of row already carried a *mechanical* consequence on top of that, and
 * each was wired in on its own:
 *
 *   ench   an Ephemeral Enchantment, whose grants reach `deriveStats` through
 *          `ephemeralGrants` in enchanting.js
 *   trick  a Trickster's AMBUSH or stolen Poison, waiting on the next swing
 *   move   a Martial Move, waiting on the same swing
 *
 * Everything else on the block was a note the table read and applied by hand.
 * Which is fine for "Grappled" and wrong for GIANT GROWTH: the card says the
 * Movement Speed doubles, and a row that left the Speed tile showing 5 was the
 * sheet knowing a rule and not applying it.
 *
 * So this is the fourth rider, and the one keyed on the card itself. A card in
 * the table below is a card whose *printed text* names a number this sheet
 * already holds. Tracking it moves that number, and dropping the row moves it
 * back.
 *
 * ----------------------------------------------------------- whoever cast it
 * **A rider is keyed on the card and not on the caster.** That is the whole
 * reason it lives here rather than being applied at the moment of use: when the
 * druid across the table casts GIANT GROWTH on you, nothing has been spent on
 * your sheet and there is no use for anything to hang off. You track their
 * card, and your Speed doubles. See `trackableCards` in combatTurn.js, which is
 * what lets you reach a card you do not own.
 *
 * ------------------------------------------------------------- two channels
 * The riders split by where the number they name lives, and the split mirrors
 * the two that already existed:
 *
 *   the sheet    speed, speedFactor, defense, armor, healthMax, willpowerMax
 *                and the three attributes. Folded into `deriveStats` through
 *                the same `extra` argument an Ephemeral Enchantment uses, and
 *                mirrored term for term in statMath.js so the tooltip on a
 *                doubled Speed says which card doubled it.
 *
 *   the swing    empower, elevate, advantage, disadvantage and damage. Folded
 *                into `attackModifiers` in moves.js, beside what a Martial Move
 *                and a form already put there.
 *
 * Nothing in between. A card that changes something this sheet does not hold
 * (a resistance, a skill check, an area of difficult terrain) carries no rider
 * and stays a note, because a rider that lands nowhere is a promise the sheet
 * cannot keep.
 *
 * ------------------------------------------------------------ transcribed
 * Every entry quotes the clause it was read from. The clause is the design and
 * this table is only its arithmetic: if the two ever disagree, the card is
 * right. A card whose printed rule is *conditional* on something the sheet
 * cannot see is deliberately absent, and the ones that were considered and left
 * out are listed at the foot of the table with the reason.
 *
 * ------------------------------------------------------ the same-source law
 * "Unless they say otherwise, effects do not stack from the same source."
 * One card is one source however many rows of it are on the block: two GIANT
 * GROWTHS are one doubling. Deduplicated by card id on the way in, the same way
 * `grantsFrom` deduplicates a working laid twice.
 *
 * Two *different* cards are two sources and do stack. The flat numbers add and
 * the factors multiply, because "doubling" and "increased by 50%" are both
 * written against whatever the Speed already was.
 *
 * A row that has run out carries nothing. It sits on the block for the rest of
 * the turn wearing "Ended" so you can see what expired, and a thing that has
 * expired is not still bending a number.
 *
 * This file is a leaf. It reads no codex and no character, only a card id and
 * the numbers beside it, which is what lets characterModel.js and moves.js both
 * import it without either of them pulling the other in.
 */

/* ------------------------------------------------------------- the shape */

/** A rider with nothing in it, so every caller reads the same fields. */
function noRider() {
  return {
    attributes: { physique: 0, instinct: 0, mind: 0 },
    healthMax: 0,
    willpowerMax: 0,
    /* Flat metres on the Movement Speed, and the factor it is then multiplied
       by. Two fields because the codex writes both: CELERITY moves you "2
       further" and GIANT GROWTH doubles whatever you already had. */
    speed: 0,
    speedFactor: 1,
    /* Defense, meaning the stat the sheet prints as Defense. `avoid` in the
       column names, for reasons that predate this file. */
    defense: 0,
    armor: 0,
    /* What one weapon attack does differently. Same three words the rest of the
       sheet uses: Empowered adds a die, Elevate grows the die, and advantage is
       a d4 on the roll. */
    empower: 0,
    elevate: 0,
    advantage: 0,
    disadvantage: 0,
    /* Damage types that replace the weapon's own, as a list for the same reason
       `itemModifiers` keeps a list: two cards can each name one and neither of
       them is lost. */
    damage: [],
    /* Which cards contributed, so a tile and an arrow can both say why. */
    from: [],
    any: false,
  };
}

/* ---------------------------------------------------------- the table */

/**
 * The cards whose running effect moves a number on this sheet, by card id.
 *
 * `line` is what the tracker row and the stat tooltip print. It says what the
 * card does to *this* sheet, in the fewest words that stay true, because it is
 * read at a table while something else is happening.
 */
export const EFFECT_RIDERS = {
  /* "tripling its size, doubling its Movement Speed and granting it Empowered
     for 10 turns."

     The size is the table's to picture and Empowered is defined in the glossary
     as one more die of the same kind, so the two the sheet can hold are the
     factor on the Speed and the die on the swing. */
  'giant-growth': {
    speedFactor: 2,
    empower: 1,
    line: 'Movement Speed doubled, and your damage Empowered by 1',
  },

  /* "The target gains [[2d6 + 2*stat]] in Shield and +1 Defense."

     The Shield is a roll the table makes and lands in the pool by hand. The
     Defense is a point, and a point is a thing this sheet can hold. */
  barkskin: {
    defense: 1,
    line: 'Defense raised by 1 while the Shield holds',
  },

  /* "When the imbued weapon lands a hit, its damage is Empowered by 1 and the
     damage type becomes Fire." */
  'kindle-weapon': {
    empower: 1,
    damage: ['Fire'],
    line: 'Your weapon deals Fire, Empowered by 1',
  },

  /* "Entities affected by the Brew have their Movement Speed increased by 50%." */
  'wisp-of-mist': {
    speedFactor: 1.5,
    line: 'Movement Speed increased by half',
  },

  /* "Entities affected by a Lucky Brew gain Advantage on their next Skill Check
     or Attack Roll."

     The skill check is the table's. The Attack Roll is the sheet's, so the arrow
     is drawn and the row says what it is for. */
  'lucky-clover': {
    advantage: 1,
    line: 'Advantage on your next Attack Roll or Skill Check',
  },

  /* "Entities affected by an Unlucky Brew gain Disadvantage on their next Skill
     Check or Attack Roll." */
  'unlucky-clover': {
    disadvantage: 1,
    line: 'Disadvantage on your next Attack Roll or Skill Check',
  },

  /* -------------------------------------------------- considered and left out
   *
   * Cards that plainly last and plainly matter, whose rule this sheet cannot
   * apply without inventing something the card does not say. Each is still
   * trackable, and each still prints its own card on the row.
   *
   *   air-control      Light air "increases all entities' Movement Speed by 3",
   *                    Dense doubles the Move cost instead. One card with two
   *                    modes chosen at cast, and the tracker has nowhere to
   *                    record which was chosen.
   *   wild-strider     "your Movement Speed cannot be reduced by any effect"
   *                    is a floor rather than a bonus, and the only thing on
   *                    this sheet that reduces a Speed is being overloaded.
   *                    Whether the spell beats a full pack is the table's call.
   *   verdant-field    "Standing in the field elevates your Flora spells by 1"
   *                    depends on where you are standing.
   *   pack-bond        every clause is conditional on who is adjacent to whom.
   *   draconic-scale   resistance to a chosen damage type. The sheet holds no
   *                    resistances yet, on a card or anywhere else.
   *   sharpen-sense    advantage on skill checks that use a sense. The sheet
   *                    does not roll skill checks.
   *   skillseed-nut    the same, for one named skill.
   *   feral-form       a form, not a row. Its advantage and its die come off
   *                    `feralRiders` in feral.js, and its clock is the Shield.
   *   thrilled         a permanent ceiling, off `pointCeilings` in tricks.js.
   *   martial moves    the `move` rider already carries these, laid by the
   *                    quick bar and spent by the swing.
   */
};

/* ------------------------------------------------------------ reading it */

/** The rider a card lays while it runs, or null for a card that lays none. */
export function riderOf(cardId) {
  const entry = cardId ? EFFECT_RIDERS[String(cardId)] : null;
  return entry ?? null;
}

/** Whether tracking this card will move a number on the sheet. */
export function cardHasRider(cardId) {
  return Boolean(riderOf(cardId));
}

/** What tracking this card does, in words, or null. */
export function riderLine(cardId) {
  return riderOf(cardId)?.line ?? null;
}

/**
 * A stored effects list, as rows, without trusting it.
 *
 * The same defensive read `runningEnchants` does in enchanting.js, and for the
 * same reason: an effects list is stored jsonb, this file is a leaf and both of
 * its callers are on a render path.
 */
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
 * Every rider running on this character, summed.
 *
 * A row counts when it names a card the table above knows and it has not run
 * out. `turns === 0` is a row that ended at the top of this turn and is being
 * shown for one turn so it is not missed, which is not the same as a row that
 * is still doing something.
 *
 * Deduplicated by card id, so the same card tracked twice is one source. `from`
 * is the names in the order they were met, which is what a tile or an arrow
 * credits.
 */
export function runningRiders(effects) {
  const total = noRider();
  const seen = new Set();

  for (const row of rows(effects)) {
    if (row.turns === 0) continue;

    const id = row.card ? String(row.card) : '';
    const rider = riderOf(id);
    if (!rider || seen.has(id)) continue;
    seen.add(id);

    total.any = true;
    total.from.push({ id, name: String(row.name ?? id), rider });

    for (const [key, value] of Object.entries(rider.attributes ?? {})) {
      if (key in total.attributes) total.attributes[key] += Math.floor(Number(value) || 0);
    }
    total.healthMax += Math.floor(Number(rider.healthMax) || 0);
    total.willpowerMax += Math.floor(Number(rider.willpowerMax) || 0);
    total.speed += Number(rider.speed) || 0;
    /* Factors multiply. "Doubling" and "increased by 50%" are each written
       against whatever the Speed already was, so two of them are threefold and
       not two and a half fold. */
    if (rider.speedFactor) total.speedFactor *= Number(rider.speedFactor) || 1;
    total.defense += Math.floor(Number(rider.defense) || 0);
    total.armor += Math.floor(Number(rider.armor) || 0);
    total.empower += Math.max(0, Math.floor(Number(rider.empower) || 0));
    total.elevate += Math.max(0, Math.floor(Number(rider.elevate) || 0));
    total.advantage += Math.max(0, Math.floor(Number(rider.advantage) || 0));
    total.disadvantage += Math.max(0, Math.floor(Number(rider.disadvantage) || 0));
    for (const type of rider.damage ?? []) {
      if (!total.damage.includes(type)) total.damage.push(type);
    }
  }

  return total;
}

/**
 * The same sum, or null when nothing is running.
 *
 * Every caller is on a render path and every caller has a cheap answer for
 * "nothing", so the null saves them all the same branch. `runningRiders` above
 * is the one that always hands back a shape.
 */
export function effectRiders(effects) {
  const total = runningRiders(effects);
  return total.any ? total : null;
}

/**
 * What is bending the *sheet*, named, for `liveShift` and the stat tooltips.
 *
 * Only the six sheet-side fields. A card that lends nothing but a die to a swing
 * is not shifting any tile, and crediting it on one would be the sheet pointing
 * at a number that never moved.
 */
export function riderShift(effects) {
  const total = runningRiders(effects);
  if (!total.any) return [];

  return total.from
    .filter(({ rider }) => bendsSheet(rider))
    .map(({ name, rider }) => ({ name, rider }));
}

/** Whether a rider moves a stat tile rather than only a swing. */
export function bendsSheet(rider) {
  if (!rider) return false;

  const attributes = Object.values(rider.attributes ?? {}).some((value) => Number(value) || 0);
  return Boolean(
    attributes ||
      rider.healthMax ||
      rider.willpowerMax ||
      rider.speed ||
      (rider.speedFactor && Number(rider.speedFactor) !== 1) ||
      rider.defense ||
      rider.armor
  );
}

/** Whether a rider changes one weapon attack rather than a stat tile. */
export function bendsSwing(rider) {
  if (!rider) return false;
  return Boolean(
    rider.empower ||
      rider.elevate ||
      rider.advantage ||
      rider.disadvantage ||
      (rider.damage ?? []).length > 0
  );
}
