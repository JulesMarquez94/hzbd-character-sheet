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
 * them — a Mycomancer's spells are changed with the long rest's own action — so
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
import { pickChanges, restSwaps } from './loadouts.js';
import { minionRest } from './minions.js';
import { feralRest } from './feral.js';
import {
  changeCost,
  enchantChanges,
  enchanterState,
  layingCost,
} from './enchanting.js';
import { SUPPLIES_PER_BURDEN, getEnchantment } from './enchantments.js';
import { characterGrants, heldItem } from './items.js';

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

/**
 * What a rest costs *this* character, which is not always what it costs.
 *
 * OZ'EM PICK: "the cost in supplies of short and long rest are reduced by 2." The
 * only enchantment that moves a rest rather than a stat, and the only reason this
 * is a function rather than the number on `RESTS`. Floored at nothing, because a
 * rest that paid you would be a strange kind of rest.
 *
 * `characterGrants` rather than the enchanting file's own reading, so a Pick
 * worked into a ring cuts the price the same as one laid on the Enchanter — and
 * two rings carrying it cut it once, which is the same-source law.
 *
 * Everything that prices a rest goes through here: the plan, and the two
 * affordability checks that offer a chip dead rather than letting it fail at the
 * last button.
 */
export function restPrice(character, kind) {
  const rest = getRest(kind);
  if (!rest) return 0;
  return Math.max(0, rest.supplies - characterGrants(character).restSupplies);
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

/** What an enchantment is called, for a line that names one. */
function enchantName(id) {
  return getEnchantment(id)?.name ?? String(id);
}

/**
 * What the thing being enchanted is called. An id the codex no longer knows still
 * gets a line rather than a blank, because the Supplies were spent either way.
 */
function itemName(character, id) {
  return heldItem(character, id)?.name ?? String(id);
}

/**
 * Everything an Enchanter can do while the fire burns down: how many enchantments
 * their own person may carry, what is on it, and what they have laid on what.
 *
 * Null for everyone who is not one, which is what the window checks.
 */
export function restEnchanting(character, kind) {
  if (kind !== 'long') return null;
  return enchanterState(character);
}

/* --------------------------------------------------------- the one action
 *
 * A rest buys **one** action, and the Status & Terms tab is where that comes
 * from: "successfully completing a Long Rest fully restores your Health and
 * Willpower, and allows you to perform 1 Long Rest Action." Jules put it plainly
 * on 2026-08-20: "you can only do 1 action per long rest, so if I m enchanting a
 * new weapon I cannot do another one".
 *
 * The window used to offer four different things at once, in four sections, each
 * enforcing its own limit and none of them enforcing that one: a night could
 * craft a potion, lay two enchantments, change what was worn *and* re-prepare a
 * whole hand. So the sections are gone and there is a **slot**. This is what the
 * slot may be filled with.
 *
 * One list, one shape, whatever the action actually is — the same trick
 * abilitySources.js plays with a "source". A new kind of long rest action is a
 * new branch here and a new step in the window, and nothing else has to learn
 * what it is.
 */

/**
 * Every action this character could spend this rest on.
 *
 * `talents` is the window's own draft rather than the row, so a shelf reopened
 * after a choice shows the choice. `kind` decides what is offered at all: nothing
 * below names a short rest, so a short rest gets an empty list and the window
 * shows no slot.
 */
export function restActions(character, kind, talents = character?.talents) {
  const held = { ...character, talents };
  const rows = [];

  /* ---- the work of the camp ----
     Background skills that are done *during* a rest, with the numbers parsed off
     the designer's own card text. One row per card; a card that offers two
     amounts asks which in its own step. */
  if (kind === 'long') {
    for (const { card, options } of restLabours(character)) {
      rows.push({
        id: `labour:${card.id}`,
        kind: 'labour',
        label: card.name,
        from: 'The work of the camp',
        note: card.summary ?? null,
        card,
        options,
      });
    }
  }

  /* ---- the Enchanter's evening ----
     Two of their three cards happen here, and they are two *actions* now rather
     than two rows of one section: laying a working costs the crate and changing
     what you wear costs nothing, and a night buys one of them. */
  const enchanter = restEnchanting(held, kind);
  if (enchanter) {
    const cap =
      enchanter.perItem === 1 ? 'one enchantment an item' : `up to ${enchanter.perItem} an item`;

    rows.push({
      id: 'enchant',
      kind: 'enchant',
      label: 'Enchant an item',
      from: 'Enchanting',
      note: `${enchanter.spec.supplyRate} Supplies a point of Magic Burden, and ${cap}.`,
      state: enchanter,
    });

    if (enchanter.wornMax > 0) {
      rows.push({
        id: 'worn',
        kind: 'worn',
        label: 'Change what you wear',
        from: 'Wielder of Wonder',
        note: `${enchanter.worn.length} of ${enchanter.wornMax} on your own person, and no Supplies to change them.`,
        state: enchanter,
      });
    }
  }

  /* ---- what a set re-prepares ----
     The permission is the granting card's: a Mycomancer's FUNGAL INVOCATION says
     the swap costs the long rest's action, which is exactly what this list is. */
  for (const { talent, state } of restSwaps(talents, kind)) {
    rows.push({
      id: `prepare:${talent.id}`,
      kind: 'prepare',
      label: `Change your ${plural(state.spec.noun, state.known)}`,
      from: `${talent.name} · ${state.spec.label}`,
      note:
        state.picks.length > 0
          ? state.picks.map((pick) => pick.card?.name ?? pick.id).join(' · ')
          : `Nothing prepared. This set knows ${state.known}.`,
      talent,
      state,
    });
  }

  return rows;
}

/** "spell" / "spells". */
function plural(noun, count) {
  return count === 1 ? noun : `${noun}s`;
}


/**
 * Whether one more thing could be laid, given that the rest itself is paid for
 * first and that everything already chosen in this window is paid for too. The
 * same law `labourAffordable` reads by: the choice you could never pay for is
 * offered dead rather than left to fail at the last button.
 */
export function layingAffordable(character, kind, prepared, enchantment) {
  const held = Math.max(0, Math.floor(Number(character?.supplies) || 0));
  const already = changeCost(enchantChanges(character?.talents, prepared ?? character?.talents));
  return held - restPrice(character, kind) - already - layingCost(enchantment) >= 0;
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

  const price = restPrice(character, kind);
  const cut = rest.supplies - price;

  move(-price, rest.label);
  lines.push({
    key: 'cost',
    label: `${price} Supplies`,
    detail:
      supplies < 0
        ? `The crate holds ${formatNumber(held)}. You cannot pay for this rest.`
        : cut > 0
          ? `Out of the crate. ${rest.supplies} less ${cut}, which is what you have laid on yourself.`
          : 'Out of the crate.',
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

  /* ---- what was laid while the fire burned down ----
     ENCHANTING is a Long Rest action ("whenever you take a Long Rest, you can use
     your Long Rest actions to enchant") and WIELDER OF WONDER is a Long Rest
     choice ("you can change it during a Long Rest"), so both belong here rather
     than on a control somewhere else on the sheet. Both write into the same
     `prepared` draft the spell swaps write into, which is why this reads it as a
     diff: one talents value, one patch, one ledger, and backing out of the rest
     backs out of the work. */
  if (prepared) {
    const changes = enchantChanges(character?.talents, prepared);

    for (const row of changes.laidAdded) {
      const enchantment = getEnchantment(row.id);
      const price = layingCost(enchantment);
      const before = supplies;
      move(-price, `${enchantment.name} laid on ${itemName(character, row.itemId)}`);

      lines.push({
        key: `laid-${row.itemId}-${row.id}`,
        label: `${enchantment.name}: ${price} Supplies`,
        detail:
          supplies >= 0
            ? `Worked into ${itemName(character, row.itemId)}, at ${SUPPLIES_PER_BURDEN} a point of Magic Burden.`
            : `Only ${formatNumber(Math.max(0, before))} left. This is beyond the crate.`,
        tone: supplies >= 0 ? 'cost' : 'warn',
      });
    }

    /* Taking one back off returns nothing: the supplies went into the work. */
    for (const row of changes.laidDropped) {
      lines.push({
        key: `stripped-${row.itemId}-${row.id}`,
        label: `${getEnchantment(row.id)?.name ?? row.id} stripped`,
        detail: `Off ${itemName(character, row.itemId)}. The Supplies it cost do not come back.`,
        tone: 'end',
      });
    }

    if (changes.wornAdded.length > 0 || changes.wornDropped.length > 0) {
      const said = [];
      if (changes.wornDropped.length > 0) {
        said.push(`${listOut(changes.wornDropped.map(enchantName))} taken off`);
      }
      if (changes.wornAdded.length > 0) {
        said.push(`${listOut(changes.wornAdded.map(enchantName))} put on`);
      }

      lines.push({
        key: 'worn',
        label: `On your own person: ${changes.wornAdded.length + changes.wornDropped.length} changed`,
        detail: `${said.join(', ')}. No Supplies: the card names none for changing what you wear.`,
        tone: 'gain',
      });
    }
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

  /* ---- whatever else is on the board with you ----
     A creature a talent set put there is restored by whichever rest its spec
     names, and for a draconic ally that is the long one: ONE AND THE SAME says
     an ally that would die "retreats into your shadow and is unable to reemerge
     until you take a Long Rest", so this is the only thing on the sheet that
     brings it back. Health full and Action Points full, the same two the rest
     gives its bonded, and the window prints a line per creature so nobody has
     to notice it happened.

     A creature's own tracker is ended by the same rest that ends its bonded's,
     so which durations this rest closes goes down with the call — the creature
     has no rest of its own to take. */
  const creatures = minionRest(character, kind, rest.ends);
  if (creatures) {
    Object.assign(patch, creatures.patch);
    lines.push(...creatures.lines);
  }

  /* ---- and what shape you are in ----
     FERAL FORM: "You remain in your Feral Form until all Shield is gone or you
     take a Short Rest." So a rest is one of the two things that takes the hide
     off, and it takes the Shield with it, exactly as the button on the block
     does — the Shield *was* the form. Which duration a form belongs to is on its
     own spec, and `rest.ends` is the same list the tracker above is closed
     against, so a long rest ends a short-rest form and never the other way
     round. See feral.js. */
  const shapes = feralRest(character, kind, rest.ends);
  if (shapes) {
    Object.assign(patch, shapes.patch);
    lines.push(...shapes.lines);
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

    /* One draft, two kinds of change written into it. The column is written when
       *either* moved: a rest where the only work was laying an enchantment still
       has to save the enchantment. The lines for that half were printed further
       up, with the Supplies they cost. */
    if (changes.length > 0 || enchantChanges(character?.talents, prepared).any) {
      patch.talents = prepared;
    }

    if (changes.length > 0) {
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
  const held = Math.max(0, Math.floor(Number(character?.supplies) || 0));
  return held - restPrice(character, kind) - option.amount >= 0;
}
