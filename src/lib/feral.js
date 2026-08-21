/**
 * The Feral Form: the second body a talent set can hand you that is your own.
 *
 * A Draconic Bond puts a creature on the board beside you (minions.js). A Feral
 * Curse does something else — it takes half the blood you have left and hands
 * back twice as much hide, and for as long as that hide holds you are the
 * creature. One body, two shapes, and the shape you are in changes what you may
 * do rather than adding somebody who may do it for you.
 *
 * What a form *is* lives here, generically, and what a particular one is made of
 * is a `feral` spec on the set in talents.js — the same split `loadout`,
 * `brewing`, `enchanting`, `minion`, `tricks` and `martial` all keep. A second
 * set that transforms its holder writes a different spec and changes no code.
 *
 * ------------------------------------------------------------------ the rules
 * All of these are the Feral Curse's own cards, transcribed rather than invented:
 *
 *   FERAL FORM   "Whenever you enter your Feral Form, you lose half your current
 *                 Health and gain twice as much Shield."
 *                "You remain in your Feral Form until all Shield is gone or you
 *                 take a Short Rest."
 *                "While in this form you have advantage on all attack rolls and
 *                 your Claws & Teeth attacks are Empowered by 1."
 *                "In this form you are unable to use items, non-Feral Curse
 *                 abilities or spells."
 *   FERAL RAGE   "make an Instinct roll with a difficulty of 8. On a failure the
 *                 difficulty increases by 1 for your next roll. It resets to 8 on
 *                 a transformation."
 *   BEAST WITHIN "you choose a Carnivore Mammal. This beast represents how your
 *                 ability manifests."
 *   BESTIAL SENSE  "Your maximum Shield is now equal to your Health instead of
 *                 half." The one sentence in the set that is an amendment rather
 *                 than a transcription: asked for in chat on 2026-08-21, and the
 *                 answer to FERAL FORM's own arithmetic. See feralShieldShare.
 *   FERAL HIDE   "your Armor is increased by half your Instinct."
 *   CALL THE BEAST  the form entered without the roll.
 *   BEAST AND DRIFTER  the form stops locking your own abilities and spells away.
 *
 * Every number above is spec data and none of it is hard-coded here.
 *
 * ------------------------------------------------------------------ the clock
 * The one thing worth knowing before reading anything else: **the form's clock
 * is the character's own Shield pool.** Not a counter, not a duration on the
 * tracker — the card says "until all Shield is gone", so being in the form is
 * `on && shield > 0` and the sheet only has to look. That is why nothing here
 * ticks and why an attack that eats the last of the Shield ends the form on the
 * very next render, with no press and no write.
 *
 * It also means the flag can outlive the form: a spent form whose Shield is
 * later restored by somebody else's ability reads as running again. Two readings
 * of "until all Shield is gone" and this file takes the state one rather than the
 * event one, because that is what the sentence says. Flagged in data/README.md.
 *
 * -------------------------------------------------------------------- storage
 * One `feral` jsonb column on the character, keyed by the set that granted the
 * form:
 *
 *   { "feral-curse": { beast, name, portrait_url, dc, on } }
 *
 * Identity and state together, because they are the same form. `dc` is where the
 * Feral Rage difficulty has climbed to and `on` is whether you gave in. Neither
 * belongs on the talent entry beside `picks`: that column is a record of what
 * levels bought, and this one moves several times a fight.
 *
 * A missing field reads as its floor — no name, no beast, the difficulty back at
 * 8 and out of the form — which is what makes a set just taken work with nothing
 * written for it yet.
 *
 * ------------------------------------------------------------------- this file
 * It reads the character and the codex, and it writes nothing: every function
 * hands back a value or a patch body for somebody else to save.
 *
 * It deliberately does **not** import characterModel.js, which imports this one
 * for `feralArmor` and `feralShieldShare`. So the Shield ceiling is handed *in*
 * rather than worked out here — this file only says what share of maximum Health
 * the pool is built from, and characterModel.js is the one place that turns a
 * share into the number — and the ledger rows a transformation deserves are
 * written by the two call sites that already hold `appendLedger`. Same
 * arrangement `stealPatch` has in tricks.js, and for the same reason.
 */

import { getTalent, normalizeTalents } from './talents.js';
import { heldItem, normalizeEquipment } from './items.js';

/** The longest a stored name or beast may be. Both are printed on one block. */
const NAME_MAX = 60;
const BEAST_MAX = 40;

/* --------------------------------------------------------------- the spec */

/** The feral spec a set carries, or null for every set that grants no form. */
export function feralOf(talent) {
  const set = typeof talent === 'string' ? getTalent(talent) : talent;
  return set?.feral ?? null;
}

/** Every set this character holds that can turn them into something. */
export function feralSets(talents) {
  return normalizeTalents(talents)
    .map((entry) => {
      const talent = getTalent(entry.id);
      const spec = feralOf(talent);
      return spec ? { talent, spec, entry } : null;
    })
    .filter(Boolean);
}

/** Whether this character has a form at all, which is what the block asks. */
export function knowsForm(talents) {
  return feralSets(talents).length > 0;
}

/* ------------------------------------------------------------- the storage */

/**
 * A stored `feral` column is only ever a hint — it may be a string, hold a set
 * this build has dropped, or carry a difficulty below the one the card floors it
 * at. This refuses anything that is plainly not a map of rows and leaves the
 * reading of each field to `feralState`, which is the only place that knows what
 * a spec's floors are.
 */
export function normalizeFeral(value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) return {};

  const clean = {};
  for (const [id, raw] of Object.entries(source)) {
    if (!raw || typeof raw !== 'object') continue;

    const row = {};
    if (typeof raw.name === 'string' && raw.name.trim()) row.name = raw.name.trim().slice(0, NAME_MAX);
    if (typeof raw.beast === 'string' && raw.beast.trim()) {
      row.beast = raw.beast.trim().slice(0, BEAST_MAX);
    }
    if (typeof raw.portrait_url === 'string' && raw.portrait_url.trim()) {
      row.portrait_url = raw.portrait_url.trim();
    }
    const dc = Number(raw.dc);
    if (Number.isFinite(dc)) row.dc = Math.floor(dc);
    if (raw.on) row.on = true;

    clean[id] = row;
  }
  return clean;
}

/* --------------------------------------------------------------- the state */

/**
 * Every form this character has, ready to be drawn. One row per set that grants
 * one, whether or not it has been named.
 *
 * `inForm` is the answer every other reader in the sheet actually wants, and it
 * is two things and-ed together: you gave in, and there is Shield left. See the
 * note on the clock at the top of this file.
 */
export function feralState(character) {
  if (!character) return [];

  /* The sets first, and out again for everybody who holds none. `deriveStats`
     runs on every render of an editable sheet and calls straight through here for
     FERAL HIDE, so a character with no such set must pay nothing at all for this
     file existing. Same reason `martialSets` is deliberately cheap in moves.js. */
  const sets = feralSets(character.talents);
  if (sets.length === 0) return [];

  const stored = normalizeFeral(character.feral);
  const shield = Math.max(0, Math.floor(Number(character.shield) || 0));

  return sets.map(({ talent, spec, entry }) => {
    const row = stored[talent.id] ?? {};
    const rank = entry.rank;

    const base = Math.max(1, Math.floor(Number(spec.rage?.base) || 8));
    /* The difficulty never sits below the card's own 8: a stored number under it
       is an older build or a hand-edit, and a floor is cheaper than a repair. */
    const difficulty = Math.max(base, Math.floor(Number(row.dc ?? base)));

    const on = Boolean(row.on);
    const inForm = on && shield > 0;

    return {
      id: talent.id,
      talent,
      spec,
      entry,
      rank,
      name: row.name ?? '',
      named: Boolean(row.name),
      beast: row.beast ?? '',
      chosen: Boolean(row.beast),
      portrait_url: row.portrait_url ?? null,
      difficulty,
      base,
      step: Math.max(1, Math.floor(Number(spec.rage?.step) || 1)),
      on,
      inForm,
      /* Given in, and the Shield that was holding it up is gone. The form is over
         by the card's own sentence; the flag is still set because nothing has
         written since. The block says so and offers the one press that clears it. */
      over: on && shield <= 0,
      shield,
      /* What this rank of the set may do, so no caller has to index a spec. */
      willing: Boolean(spec.willing?.[rank]),
      armorShare: Number(spec.armor?.[rank]) || 0,
      /* BESTIAL SENSE's share of maximum Health, and the one reading on this row
         that is true whether or not the form is running: it is a Novice passive
         and not something the hide does. `feralShieldShare` is what reads it. */
      shieldShare: Number(spec.shieldShare?.[rank]) || 0,
      opened: spec.opens?.[rank] ?? null,
      title: row.name || spec.label,
      /* The one line the block prints under the title: what it is, in the
         player's own two words when they have chosen them. */
      kin: row.beast || spec.kin || 'beast',
    };
  });
}

/** The form a block id names, or null. */
export function feralForBlock(list, id) {
  const match = /^feral:(.+)$/.exec(String(id));
  return match ? (list.find((row) => row.id === match[1]) ?? null) : null;
}

/**
 * The block ids a character's forms add to the Character tab, in factory order.
 *
 * One block and not two. A creature needed two because it has a stat block *and*
 * a turn to spend; a form has neither — its stats are the character's own, bent,
 * and it spends the character's points. What it needs is a picture, a clock and
 * three buttons, which fits one 360x640 cell with room left over.
 */
export function feralBlockIds(character) {
  return feralState(character).map((form) => `feral:${form.id}`);
}

/* ------------------------------------------------------------- the writers */

/** The `feral` column with one form's row merged, ready to be patched. */
export function writeFeral(character, id, body) {
  const stored = normalizeFeral(character?.feral);
  const row = { ...(stored[id] ?? {}), ...body };

  /* A field cleared is a field gone rather than an empty string sitting in the
     column. Same housekeeping normalizeMinions does on an emptied effects list. */
  for (const key of ['name', 'beast', 'portrait_url']) {
    if (typeof row[key] === 'string' && !row[key].trim()) delete row[key];
  }
  if (!row.on) delete row.on;

  return { feral: { ...stored, [id]: row } };
}

/** Name it, say what it is, give it a face. Everything commits as you type. */
export function setFeralIdentity(character, id, { name, beast, portrait_url }) {
  const body = {};
  if (name !== undefined) body.name = String(name).slice(0, NAME_MAX);
  if (beast !== undefined) body.beast = String(beast).slice(0, BEAST_MAX);
  if (portrait_url !== undefined) body.portrait_url = String(portrait_url);
  return writeFeral(character, id, body);
}

/**
 * Where the Feral Rage difficulty stands, moved by one step or set outright.
 *
 * "On a failure the difficulty increases by 1 for your next roll. It resets to 8
 * on a transformation." Both presses are on the block, because the roll itself is
 * the table's: the sheet is told about a Health change and never about what
 * caused it, so a sheet that asked for this roll would ask on every scratch.
 */
export function setFeralDifficulty(character, form, value) {
  const dc = Math.max(form.base, Math.min(99, Math.floor(Number(value) || 0)));
  return writeFeral(character, form.id, { dc });
}

/**
 * Whether the form can be entered right now, as `{ ok, reason }`.
 *
 * Refused for one reason and it is the card's own arithmetic: half of nothing is
 * nothing, so a character at 0 Health or below would pay nothing, gain nothing
 * and be out of the form on the same render. Bleeding out is not a transformation.
 */
export function canEnterForm(character, form) {
  if (!form) return { ok: false, reason: 'Nothing here turns into anything.' };
  if (form.inForm) return { ok: false, reason: `You are already in your ${form.spec.label}.` };

  const health = Math.floor(Number(character?.health) || 0);
  if (health <= 1) {
    return {
      ok: false,
      reason:
        'Half of what you have left rounds to nothing, so the form would buy no Shield and end the moment it began.',
    };
  }
  return { ok: true, reason: null };
}

/**
 * Entering the form: what it costs, what it buys, and the patch that does it.
 *
 * "You lose half your current Health and gain twice as much Shield." Half of
 * *current* and not of maximum, floored, and the gain is twice what was actually
 * paid — so the two halves of the sentence stay one sentence and a Feral Cursed
 * at 30 of 50 Health pays 15 and is owed 30.
 *
 * `cap` is the Shield ceiling, handed in rather than worked out: this file does
 * not import characterModel.js (see the header), and `syncDerived` clamps the
 * column to that ceiling on the very next render anyway, so a patch that ignored
 * it would be silently clipped instead of honestly reported. `clipped` is what
 * the ceiling ate, and it is the number the two call sites print.
 *
 * It used to eat exactly half of every full-Health transformation, because the
 * pool ceilinged at half maximum Health and twice half of it is the whole thing.
 * BESTIAL SENSE is the answer to that and it is `feral.shieldShare`, so a Feral
 * Cursed at full Health now pays half and receives all of it with nothing
 * clipped. The ceiling still bites for one who transforms with Shield already on
 * them, which is the honest case: it says how much was thrown away.
 *
 * Also resets the Feral Rage difficulty, because that is FERAL RAGE's own next
 * sentence: "It resets to 8 on a transformation." Every way into the form goes
 * through here, so there is nowhere for that reset to be forgotten.
 */
export function enterForm(character, form, { cap } = {}) {
  const health = Math.floor(Number(character?.health) || 0);
  const held = Math.max(0, Math.floor(Number(character?.shield) || 0));
  const ceiling = Math.max(0, Math.floor(Number(cap) || 0));

  const share = Number(form.spec.enter?.spend) || 0.5;
  const multiple = Number(form.spec.enter?.gain) || 2;

  const spend = Math.max(0, Math.floor(health * share));
  const owed = spend * multiple;
  const shield = Math.min(ceiling, held + owed);
  const granted = shield - held;

  return {
    spend,
    owed,
    granted,
    clipped: owed - granted,
    cap: ceiling,
    health: health - spend,
    shield,
    patch: {
      health: health - spend,
      shield,
      ...writeFeral(character, form.id, { on: true, dc: form.base }),
    },
  };
}

/**
 * Leaving it on purpose, and what that costs.
 *
 * The Developpement Notes: "there is a butto to end trnasformation that also
 * remove all shield." So the hide does not come off and stay on your bar — the
 * Shield *was* the form, and ending one ends the other. Which also means the
 * button is never free, and the block says how much it is about to throw away.
 */
export function leaveForm(character, form) {
  const held = Math.max(0, Math.floor(Number(character?.shield) || 0));

  return {
    dropped: held,
    patch: {
      shield: 0,
      ...writeFeral(character, form.id, { on: false }),
    },
  };
}

/** The flag cleared and nothing else, for a form whose Shield already ran out. */
export function settleForm(character, form) {
  return writeFeral(character, form.id, { on: false });
}

/* ------------------------------------------------------- what the form does */

/** Whether the thing in the main hand carries the tag a spec asks for. */
function tagged(item, tag) {
  if (!item || !tag) return false;
  return (item.tags ?? []).some((held) => String(held).toLowerCase() === String(tag).toLowerCase());
}

/** The weapon actually in hand. The stowed one is in nobody's hand. */
function inHand(character) {
  const equipment = normalizeEquipment(character?.equipment);
  return heldItem(character, equipment.main_hand);
}

/** Every form this character is currently *in*. Nearly always none. */
function running(character) {
  return feralState(character).filter((form) => form.inForm);
}

/**
 * What the forms this character is in do to one weapon attack, as
 * `{ advantage, empower, from }`, or null when they are in none.
 *
 * "While in this form you have advantage on all attack rolls and your Claws &
 * Teeth attacks are Empowered by 1." Two clauses with two different reaches, and
 * they are kept apart here:
 *
 *   advantage  every attack roll. Folded into `attackModifiers` in moves.js,
 *              which is called for a weapon attack — and inside the form a
 *              weapon attack is the *only* attack there is, since the same card
 *              forbids spells and every ability that is not this set's. A Master
 *              who has taken BEAST AND DRIFTER can attack with a spell again,
 *              and that one attack roll does not get the arrow. Flagged.
 *   empower    only the natural weapon's own two cards, so it is gated on that
 *              weapon's codex tag rather than on a pair of card ids: a second
 *              set of claws in the codex would want the same die.
 *
 * `from` is the sets granting it, so the arrow on the card can say why it is
 * there. Two Feral Cursed forms at once is not a thing the codex can produce
 * today, but they sum rather than max, because advantage stacks and a second
 * form would be a second card that was paid for.
 */
export function feralRiders(character) {
  const forms = running(character);
  if (forms.length === 0) return null;

  const item = inHand(character);
  let advantage = 0;
  let empower = 0;
  const from = [];

  for (const form of forms) {
    const gain = Math.max(0, Math.floor(Number(form.spec.advantage) || 0));
    const die =
      form.spec.empower && tagged(item, form.spec.empower.weapon)
        ? Math.max(0, Math.floor(Number(form.spec.empower.amount) || 0))
        : 0;

    if (gain + die === 0) continue;
    advantage += gain;
    empower += die;
    from.push({ talent: form.talent, advantage: gain, empower: die });
  }

  return advantage + empower > 0 ? { advantage, empower, from } : null;
}

/**
 * The Armor a form is worth, for `deriveStats`. FERAL HIDE, and nothing else yet.
 *
 * "your Armor is increased by half your Instinct" — a share of the attribute
 * rather than a flat number, so it is worked out where the attribute is known.
 * `stat` is handed in for exactly that reason: `deriveStats` has already added
 * every worn and running bonus to the three attributes by the time it gets here,
 * and reading `character.instinct` would use the unbent column instead.
 *
 * Which also means the point comes straight back off the moment the Shield runs
 * out, the same way a Duelist's AGILE comes off on a weapon swap. Nothing has to
 * remember to take it.
 */
export function feralArmor(character, stat) {
  const value = Math.max(0, Math.floor(Number(stat) || 0));

  return running(character).reduce(
    (total, form) => total + Math.floor(value * form.armorShare),
    0
  );
}

/**
 * The same Armor, kept per form so a reader can be told which hide lent it.
 *
 * `feralArmor` above is the sum `deriveStats` bakes into the column. This is the
 * same walk stopped one step earlier, in the shape `weaponRiders` hands its own
 * credits back in: `{ talent, armor }` for each form actually granting any, and
 * empty for a character in none. A form whose rank grants no share is left out
 * rather than credited with a zero.
 */
export function feralArmorFrom(character, stat) {
  const value = Math.max(0, Math.floor(Number(stat) || 0));

  return running(character)
    .map((form) => ({ talent: form.talent, armor: Math.floor(value * form.armorShare) }))
    .filter((row) => row.armor > 0);
}

/**
 * The share of maximum Health a Feral Cursed's Shield pool ceilings at, or 0 for
 * everybody whose sets say nothing about it.
 *
 * BESTIAL SENSE: "Your maximum Shield is now equal to your Health instead of
 * half." A share rather than a number for the same reason FERAL HIDE's Armor is
 * one, and 0 rather than null when nothing grants it, so a caller always gets a
 * number: characterModel.js takes the larger of this and the half everybody has,
 * which is what makes "instead of half" the *replacement* the card says it is
 * rather than a bonus stacked on top of one.
 *
 * `feralState` and not `running`, which is the whole point of it living here
 * beside `feralArmor` instead of inside it. The hide is a thing the form does and
 * comes straight back off when the Shield runs out; this is a Novice passive on a
 * card that never mentions the form, so the ceiling is up before the first
 * transformation and stays up after the last one. Which is what makes the form's
 * own "gain twice as much Shield" pay twice: a pool ceilinged at half maximum
 * Health could never hold twice half of it.
 *
 * The highest share and not the sum, by the same law every other rider on this
 * sheet obeys: two cards raising one ceiling raise it once. Which is moot until
 * a second transforming set exists, and it is the reading `moveAllowance` in
 * moves.js already took for the same shape of rule.
 */
export function feralShieldShare(character) {
  return feralState(character).reduce(
    (best, form) => Math.max(best, form.shieldShare),
    0
  );
}

/**
 * What the form will not let this character do, as `{ items, foreign, tag, from }`,
 * or null when they are in no form.
 *
 * "In this form you are unable to use items, non-Feral Curse abilities or
 * spells." Two locks. `tag` is what "Feral Curse abilities" means and it is the
 * set's own Tags column rather than a guess — every card on the tab carries it,
 * which is the same trick minions.js plays with `spec.tag`.
 *
 * BEAST AND DRIFTER at Rank 3 opens the second lock and leaves the first shut,
 * so `foreign` is false and `items` stays true for a Master. A character in two
 * forms at once would have to satisfy both, so the locks and-together across
 * forms and the openings only ever open their own.
 */
export function feralLocks(character) {
  const forms = running(character);
  if (forms.length === 0) return null;

  let items = false;
  let foreign = false;
  const tags = new Set();
  const sets = new Set();
  const from = [];

  for (const form of forms) {
    const opened = form.opened ?? {};
    const shut = {
      items: Boolean(form.spec.locks?.items) && !opened.items,
      foreign: Boolean(form.spec.locks?.foreign) && !opened.foreign,
    };
    if (!shut.items && !shut.foreign) continue;

    items = items || shut.items;
    foreign = foreign || shut.foreign;
    if (form.spec.locks?.tag) tags.add(form.spec.locks.tag);
    /* And the set itself, because a tag is not enough. The Martial Moves BEAST
       WITHIN teaches carry `Martial Move, Novice` and never the set's own tag, and
       that card says outright that they are what the form fights with. So a card
       held *through* this set passes whatever it is tagged. */
    sets.add(form.talent.id);
    from.push({ talent: form.talent, form, ...shut });
  }

  return items || foreign ? { items, foreign, tags, sets, from } : null;
}

/**
 * Whether one card survives the locks, as `{ ok, reason }`.
 *
 * Called once per chip on the quick bar with the locks worked out once for the
 * whole bar, the way `canLayMove` rides in rather than being asked per card.
 *
 * A card is the form's own if the *set* holding it is the one that granted the
 * form, or failing that if it carries a tag the form claims. Both, because the
 * two catch different things: the tag catches every rank of the set's own cards,
 * and the set catches the pool it hands over — a Feral Cursed's Martial Moves are
 * tagged `Martial Move` and nothing else, and BEAST WITHIN says in as many words
 * that they are what the beast fights with. A Duelist's copy of the same move is
 * refused, which is the literal reading and a good one: it was trained for a
 * blade.
 *
 * Basic actions are never refused. Moving, hiding and shoving are things a wolf
 * does, none of them is an item or an ability somebody taught you, and a form
 * that could not walk would be a bug rather than a rule.
 */
export function passesForm(card, locks, { basic = false, item = false, set = null } = {}) {
  if (!locks || basic) return { ok: true, reason: null };

  const label = locks.from[0]?.form?.spec?.label ?? 'your form';

  if (item) {
    return locks.items
      ? { ok: false, reason: `No hands for it. ${label} cannot use items.` }
      : { ok: true, reason: null };
  }

  if (!locks.foreign) return { ok: true, reason: null };

  if (set && locks.sets.has(set)) return { ok: true, reason: null };
  if ((card?.tags ?? []).some((tag) => locks.tags.has(tag))) return { ok: true, reason: null };

  const kind = card?.kind === 'spell' ? 'spell' : 'ability';
  return {
    ok: false,
    reason: `Not in ${label}. A ${kind} from anywhere else is out of reach until the form ends.`,
  };
}

/** The talent a quick bar source id belongs to, or null for one that is nobody's. */
export function sourceSet(id) {
  return /^(?:talent|loadout):(.+)$/.exec(String(id ?? ''))?.[1] ?? null;
}

/* ---------------------------------------------------------------- the rest */

/**
 * What a rest does to every form, as lines for the rest window and the patch
 * that carries them out, or null when there is nothing to do.
 *
 * "You remain in your Feral Form until all Shield is gone or you take a Short
 * Rest." A long rest ends everything a short rest ends, so `ends` is the rest's
 * own list from rest.js and the spec names which duration it belongs to.
 *
 * The Shield goes with it, exactly as it does when the button on the block is
 * pressed: the Shield was the form. That happens *before* the rest's own Health
 * is worked out in restPlan only in reading order — nothing here touches Health,
 * so the two writes cannot fight.
 */
export function feralRest(character, kind, ends = []) {
  const list = feralState(character);
  if (list.length === 0) return null;

  const patch = {};
  const lines = [];
  let column = normalizeFeral(character?.feral);
  let dropped = 0;

  for (const form of list) {
    if (!form.on) continue;
    if (!ends.includes(form.spec.ends ?? 'short')) {
      lines.push({
        key: `feral-kept-${form.id}`,
        label: `${form.title} sits through it`,
        detail: `Only a ${form.spec.ends === 'long' ? 'long' : 'short'} rest ends it.`,
        tone: 'keep',
      });
      continue;
    }

    column = { ...column, [form.id]: { ...(column[form.id] ?? {}) } };
    delete column[form.id].on;
    dropped += form.shield;

    lines.push({
      key: `feral-${form.id}`,
      label: `${form.title} ends`,
      detail:
        form.shield > 0
          ? `The hide comes off, and ${form.shield} Shield with it.`
          : 'The hide was already off. The rest settles it.',
      tone: 'end',
    });
  }

  if (lines.length === 0) return null;
  if (dropped > 0 || lines.some((line) => line.tone === 'end')) {
    patch.feral = column;
    if (dropped > 0) patch.shield = 0;
  }

  return { patch, lines };
}

/* ------------------------------------------------------------ the questions */

/**
 * Whether a form has been settled: named, and with a beast chosen.
 *
 * BEAST WITHIN asks for the animal "when you become Feral Cursed", so the
 * question belongs to the level that bought Rank 1 and the Advancement tab wears
 * a badge until it is answered — the same thing an unnamed draconic ally does.
 * The name is asked for with it, because a block titled "Feral Form" beside a
 * block titled with a character's name is the one thing on that tab nobody reads
 * twice.
 */
export function feralSettled(character, id) {
  const form = feralState(character).find((row) => row.id === id);
  return Boolean(form?.named && form?.chosen);
}

/** Whether any of this character's cards can be reached with a form running. */
export function inAnyForm(character) {
  return running(character).length > 0;
}

/** The form a set granted, for the windows that are handed a talent. */
export function formFor(character, talentId) {
  return feralState(character).find((row) => row.id === talentId) ?? null;
}

/**
 * The Feral Curse's weapon, named once.
 *
 * BEAST WITHIN: "While your hands are empty, you can use the Claws & Teeth
 * weapon", and the sheet's parenthesis under it says a weapon slot permanently
 * becomes that weapon. The two do not agree — a slot that always holds it is a
 * pair of hands that is never empty — so neither is built as a slot lock. What is
 * built is the tag: `feral.empower.weapon` is the weapon's own codex tag, so the
 * Empowered die lands on it whichever hand it is in and whoever put it there.
 * Flagged in data/README.md for a ruling.
 */
export const FERAL_WEAPON = 'claws-and-teeth';
