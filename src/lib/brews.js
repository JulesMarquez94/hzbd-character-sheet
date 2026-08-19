/**
 * Brewing: the Cauldron Keeper's own kind of choice.
 *
 * A talent set can leave something to the player in three shapes now. Most teach
 * a fixed hand. A Mycomancer carries a `loadout` and *picks* cards out of a
 * school (loadouts.js). A Cauldron Keeper carries a `brewing` spec and
 * *composes* one, out of Ingredients, at the moment they use it.
 *
 * ------------------------------------------------------------------ the rule
 * BREW's own card text is the whole rule, and this file does nothing it does not
 * say:
 *
 *   "While your Cauldron is Summoned, you can combine Ingredients to unleash a
 *    magical effect. You choose Ingredients from your known list in the following
 *    configuration: At least 1 Essence, exactly 1 Catalyst, and any number of
 *    Infusions. You must pay the combined Action Point and Willpower cost of all
 *    chosen Ingredients. The resulting Brew takes effect immediately.
 *    You gain access to Novice Ingredients at Rank 1, Adept Ingredients at Rank 2,
 *    and Master Ingredients at Rank 3."
 *
 * Two cards bend it, and both are the designer's:
 *
 *   Improved Recipes   Rank 3. "you can now have up to two Essences. They cannot
 *                      be the same Essence."
 *   Efficient Brewing  Rank 2. "The cost of your Brew Action is reduced by 1
 *                      Action Point."
 *
 * -------------------------------------------------------- nothing is stored
 * A Brew "takes effect immediately", so there is no shelf of finished Brews and
 * this file keeps none. What is mixed is a *draft*, held in the window while the
 * player assembles it, priced live, and gone the moment it is drunk. Nothing here
 * outlives the window.
 *
 * ------------------------------------------------------- the Cauldron is there
 * The Cauldron is assumed present, always. Bound Cauldron summons it and sends it
 * away in the fiction, and this file used to record which and refuse to brew while
 * it was away — one more thing to press before the thing you meant to press. A
 * Cauldron Keeper is written as "bearing a soul-bound Cauldron that bubbles
 * continuously upon their back", so the sheet takes it at its word and never asks.
 *
 * This file reads the Ingredient codex and the character. Nothing here may import
 * weapons.js, which imports talents.js, which this imports.
 */

import { artFor, thumbFor } from './cardArt.js';
import { INGREDIENTS, INGREDIENT_PARTS, getIngredient } from './ingredients.js';
import { getTalent, normalizeTalents } from './talents.js';

/* ------------------------------------------------------------------ the spec */

/** The brewing spec a set carries, or null for every set that does not brew. */
export function brewingOf(talent) {
  const set = typeof talent === 'string' ? getTalent(talent) : talent;
  return set?.brewing ?? null;
}

/** Which Ingredient tiers a rank has access to. */
export function tiersAt(spec, rank) {
  return spec?.tiers?.[rank] ?? [];
}

/** The tiers a rank opens that the rank below could not reach. */
export function openedAt(spec, rank) {
  const below = tiersAt(spec, rank - 1);
  return tiersAt(spec, rank).filter((tier) => !below.includes(tier));
}

/** How many Essences one Brew may hold at a rank. One, or two at Master. */
export function essenceCap(spec, rank) {
  return spec?.essences?.[rank] ?? 0;
}

/** Every Ingredient a rank knows, in the codex's order. */
export function knownIngredients(spec, rank) {
  const tiers = tiersAt(spec, rank);
  return INGREDIENTS.filter((row) => tiers.includes(row.tier));
}

/**
 * What this character's rank and cards allow, gathered once so the window and the
 * validator can never disagree about it.
 *
 * `essences` is a ceiling and the floor is BREW's "at least 1". They are separate
 * numbers because the floor is BREW's rule and the ceiling is Improved Recipes',
 * and only the ceiling moves with rank.
 */
export function brewLimits(talents, talent) {
  const spec = brewingOf(talent);
  if (!spec) return null;

  const id = talent.id ?? talent;
  const entry = normalizeTalents(talents).find((row) => row.id === id);
  const rank = entry?.rank ?? 0;

  return {
    spec,
    rank,
    tiers: tiersAt(spec, rank),
    essences: essenceCap(spec, rank),
    catalysts: spec.catalysts?.[rank] ?? 1,
    /* Both riders are just "does the character hold that card", which is a
       question about rank and nothing else, because a rank hands over all of its
       cards at once. */
    improvedRecipes: rank >= 3,
    efficientBrewing: rank >= 2,
  };
}

/* ----------------------------------------------------------------- the draft */

/** An empty Cauldron. `choices` holds what the brewer decided, keyed by Ingredient. */
export function blankBrew() {
  return { essences: [], catalyst: null, infusions: [], choices: {} };
}

/** The Ingredients in a draft, in the order the finished Brew reads them. */
export function draftParts(draft) {
  const essences = (draft?.essences ?? []).map(getIngredient).filter(Boolean);
  const catalyst = getIngredient(draft?.catalyst);
  const infusions = (draft?.infusions ?? []).map(getIngredient).filter(Boolean);
  return {
    essences,
    catalyst,
    infusions,
    all: [catalyst, ...essences, ...infusions].filter(Boolean),
  };
}

/** How many doses of one Ingredient a draft holds. */
export function doseOf(draft, id) {
  const ing = getIngredient(id);
  if (!ing) return 0;
  if (ing.part === 'catalyst') return draft?.catalyst === id ? 1 : 0;
  const list = ing.part === 'essence' ? draft?.essences : draft?.infusions;
  return (list ?? []).filter((held) => held === id).length;
}

/**
 * Add one Ingredient to a draft, obeying the configuration rule rather than
 * checking it afterwards.
 *
 * A Catalyst *replaces* rather than refuses: "exactly 1 Catalyst" means reaching
 * for a second one is a change of mind, not a mistake, and making the player take
 * the first one out first would be a rule enforced against them.
 */
export function addIngredient(draft, id, limits) {
  const ing = getIngredient(id);
  if (!ing || !limits) return draft;
  if (!limits.tiers.includes(ing.tier)) return draft;

  if (ing.part === 'catalyst') {
    return { ...draft, catalyst: id };
  }
  if (ing.part === 'essence') {
    const held = draft.essences ?? [];
    if (held.length >= limits.essences) return draft;
    // Improved Recipes: "They cannot be the same Essence."
    if (held.includes(id)) return draft;
    return { ...draft, essences: [...held, id] };
  }
  /* "any number of Infusions", and nothing says the same one may not go in twice.
     Improved Recipes forbids duplicate Essences by name, which is the only such
     restriction the designer wrote. Flagged for them. */
  return { ...draft, infusions: [...(draft.infusions ?? []), id] };
}

/** Take one Ingredient back out. An Essence or Infusion goes by position. */
export function dropIngredient(draft, part, index) {
  if (part === 'catalyst') return { ...draft, catalyst: null };
  const key = part === 'essence' ? 'essences' : 'infusions';
  return { ...draft, [key]: (draft[key] ?? []).filter((_, at) => at !== index) };
}

/** Write down what the brewer decided for an Ingredient that asks. */
export function setBrewChoice(draft, id, value) {
  return { ...draft, choices: { ...(draft.choices ?? {}), [id]: value } };
}

/** What the brewer answered for one Ingredient, as the label it should print. */
export function brewAnswer(draft, ing) {
  const answer = draft?.choices?.[ing?.id];
  if (answer === undefined || answer === null || String(answer).trim() === '') return null;
  return ing.choice?.options?.find((option) => option.id === answer)?.label ?? String(answer);
}

/* ------------------------------------------------------------------ the price */

/**
 * What the Brew costs, with the working, so the window can show where every point
 * went rather than a bare total.
 *
 * The sum is the designer's: "the combined Action Point and Willpower cost of all
 * chosen Ingredients". Two things take Action Points back off it, and both say so
 * on their own card: Quicksilver ("reduce the Action Point cost of the Brew by 1")
 * once for every dose stirred in, and Efficient Brewing ("The cost of your Brew
 * Action is reduced by 1 Action Point") once, for holding it.
 *
 * The floor is 0. Neither card says a Brew can pay Action Points back, and no pool
 * on this sheet is ever driven below zero.
 */
export function brewCost(draft, limits) {
  const { all, infusions } = draftParts(draft);

  const apParts = all.map((ing) => ({ label: ing.name, ap: Number(ing.ap) || 0 }));
  const wpParts = all.map((ing) => ({ label: ing.name, wp: Number(ing.wp) || 0 }));

  const grossAp = apParts.reduce((sum, part) => sum + part.ap, 0);
  const wp = wpParts.reduce((sum, part) => sum + part.wp, 0);

  const cuts = [];
  const quicksilver = infusions.filter((ing) => ing.id === 'quicksilver').length;
  if (quicksilver > 0) {
    cuts.push({ label: quicksilver > 1 ? `Quicksilver x${quicksilver}` : 'Quicksilver', ap: quicksilver });
  }
  if (limits?.efficientBrewing) cuts.push({ label: 'Efficient Brewing', ap: 1 });

  const cut = cuts.reduce((sum, row) => sum + row.ap, 0);

  return {
    ap: Math.max(0, grossAp - cut),
    wp,
    grossAp,
    cut,
    apParts,
    wpParts,
    cuts,
    /* True when the reductions ran past the floor, so the window can say so
       rather than printing a total that quietly ignored one of them. */
    floored: grossAp - cut < 0,
  };
}

/* ---------------------------------------------------------------- the checks */

/**
 * What the draft still needs, in the designer's own terms. One line each, so the
 * window prints them as they are rather than deciding what to say.
 */
export function brewProblems(draft, limits) {
  if (!limits) return ['This character does not brew.'];

  const { essences, catalyst, all } = draftParts(draft);
  const problems = [];

  if (essences.length < 1) problems.push('At least 1 Essence.');
  if (!catalyst) problems.push('Exactly 1 Catalyst.');

  // Every Ingredient that asks the brewer something has to have been answered.
  for (const ing of all) {
    if (!ing.choice) continue;
    if (brewAnswer(draft, ing) === null) {
      problems.push(`${ing.name}: ${ing.choice.label.toLowerCase()}.`);
    }
  }

  return problems;
}

export function brewReady(draft, limits) {
  return brewProblems(draft, limits).length === 0;
}

/**
 * Every Ingredient measured against the draft: what may go in, how much is
 * already in, and for the rest the one line saying why not.
 *
 * A Catalyst is never refused for being full, because reaching for another swaps
 * it. See addIngredient.
 */
export function ingredientOptions(draft, limits) {
  if (!limits) return [];

  const { essences } = draftParts(draft);

  return INGREDIENTS.map((ing) => {
    const held = doseOf(draft, ing.id);
    const row = { ingredient: ing, held };

    if (!limits.tiers.includes(ing.tier)) {
      return { ...row, ok: false, reason: `${ing.tier} needs a higher rank` };
    }
    if (ing.part === 'essence') {
      if (held > 0) return { ...row, ok: false, reason: 'In already, and Essences cannot repeat' };
      if (essences.length >= limits.essences) {
        return {
          ...row,
          ok: false,
          reason: limits.essences === 1 ? 'One Essence at this rank' : 'Two Essences is the most',
        };
      }
    }
    return { ...row, ok: true };
  });
}

/** The shelf cut into its kinds, in the order BREW names them. */
export function shelfByPart(options) {
  return INGREDIENT_PARTS.map((part) => ({
    ...part,
    options: options.filter((option) => option.ingredient.part === part.id),
  })).filter((group) => group.options.length > 0);
}

/**
 * What the Infusions do to the Brew's own numbers.
 *
 * Mana Crystal says "The Brew's effects are Empowered and Elevated", which is not
 * a clause to print but a change to every die the Brew rolls. So it rides as a
 * modifier on the composed card, the way an enchantment rides a weapon's, and the
 * renderer applies it: 2d6 becomes 3d8. Stirring in two of them stacks.
 */
export function brewModifiers(draft) {
  const crystals = draftParts(draft).infusions.filter((ing) => ing.id === 'mana-crystal').length;
  return crystals > 0 ? { empower: crystals, elevate: crystals } : null;
}

/* ------------------------------------------------------- the composed Brew */

/**
 * What a mixed Brew is called.
 *
 * The set’s own noun, and nothing else. It used to be named after its Essence
 * ("Four-Leaf Clover Brew"), which reads as that Ingredient’s own card and says
 * nothing about the Catalyst, which is what decides where the Brew even lands.
 * What is in it is on the window that mixed it, Ingredient by Ingredient, and
 * the summary line under the title says what it all comes to.
 */
export function brewName(limits) {
  return limits?.spec?.noun ?? 'Brew';
}

/**
 * One Ingredient's contribution to the finished Brew.
 *
 * The opening line of every Ingredient card is flavour about dropping the thing
 * into the pot ("You drop a bloated, neon-colored frog into the brew"), which is
 * worth reading once on the Ingredient's own card and not four times over on the
 * Brew. So the Brew quotes the paragraphs *after* it, unchanged.
 *
 * It quotes them without naming what they came from. A Brew is one effect rather
 * than a bill of materials: what is wanted at the table is what happens, in the
 * order it happens. What went in is still on the window that mixed it, and every
 * Ingredient's own card is one tap away there.
 *
 * One paragraph is left out, and only where it has already been answered: the
 * line that *asks* the brewer to decide. Draconic Scale says "The brewer chooses
 * one of the following damage types: Fire, Cold, …" and the Brew has no business
 * reciting nine options when the answer is printed in front of the paragraph it
 * governs. The test is deliberately narrow, on paragraphs that open with "The
 * brewer", so Purifying Crystal keeps its "When this infusion is added to the
 * Brew, the brewer chooses …", which is not an instruction but the whole of what
 * it does.
 *
 * Nothing is reworded and nothing is summarised. The Ingredient's own card is one
 * tap away and says every word.
 */
function contribution(ing, draft) {
  const paras = String(ing.body).split(/\n\n+/);
  const said = brewAnswer(draft, ing);

  const rules = (paras.length > 1 ? paras.slice(1) : paras).filter(
    (para) => !(said && /^The brewer (chooses|names)\b/.test(para))
  );

  /* The answer is still printed, because the paragraph it governs calls it "the
     chosen damage type" and nothing else on the Brew would say which. */
  return `${said ? `(${said}) ` : ''}${rules.join(' ')}`;
}

/**
 * The draft as a card, printed for whoever is brewing it.
 *
 * Read in the order it resolves: the Catalyst first, because who the Brew reaches
 * decides what the rest of the sentences are even about, then the Essences, then
 * whatever was stirred in on top. Every number is still a token, resolved against
 * the brewer by the same renderer that prints a spell.
 */
export function brewCard(draft, limits) {
  const { essences, catalyst, infusions, all } = draftParts(draft);
  if (essences.length === 0 || !catalyst) return null;

  const cost = brewCost(draft, limits);
  const damage = [...new Set(all.flatMap((ing) => ing.damage ?? []))];

  return {
    id: 'brew-mixed',
    name: brewName(limits),
    /* BREW's own picture. The card is mixed rather than printed, so it is not in
       the codex and `withArt` never sees it; the art is the same art all the
       same, because this is what that card does. */
    art_url: artFor('brew'),
    art_thumb: thumbFor('brew'),
    kind: 'brew',
    tags: ['Cauldron keeper', 'Brew'],
    ap: cost.ap,
    wp: cost.wp,
    stat: 'instinct',
    ...(damage.length > 0 ? { damage } : {}),
    /* Each Ingredient's own one-line summary, in the order the card below reads
       them — what the Brew does, not what was dropped in it. */
    summary: [catalyst, ...essences, ...infusions].map((ing) => ing.summary).join(' '),
    body: [catalyst, ...essences, ...infusions]
      .map((ing) => contribution(ing, draft))
      .join('\n\n'),
  };
}

/* ------------------------------------------------------------- the Cauldron */

/**
 * The set whose Cauldron a card belongs to.
 *
 * BREW carries `opens: 'brew'`, and the block that took the payment then has to
 * know *whose* Cauldron to open. It is answered off the codex rather than written
 * on the card: the set that taught the card owns the Cauldron, and the character
 * has to actually hold the set.
 */
export function brewSetFor(talents, cardId) {
  if (!cardId) return null;

  for (const held of normalizeTalents(talents)) {
    const set = getTalent(held.id);
    if (!set?.brewing) continue;
    if (!(set.cards ?? []).some((card) => card.id === cardId)) continue;
    return set;
  }
  return null;
}

/* ------------------------------------------------------------- the preview */

/**
 * What a rank opens, for the presentation page that has not taken the set yet.
 * The same shape rankPreview hands the loadout note, so the page can print either
 * without knowing which kind of set it is reading.
 */
export function brewPreview(talent, rank) {
  const spec = brewingOf(talent);
  if (!spec) return null;

  const tiers = tiersAt(spec, rank);
  const opened = openedAt(spec, rank);

  return {
    spec,
    tiers,
    opened,
    essences: essenceCap(spec, rank),
    deeper: essenceCap(spec, rank) > essenceCap(spec, rank - 1),
    count: INGREDIENTS.filter((ing) => opened.includes(ing.tier)).length,
    reach: INGREDIENTS.filter((ing) => tiers.includes(ing.tier)).length,
    byPart: INGREDIENT_PARTS.map((part) => ({
      ...part,
      count: INGREDIENTS.filter((ing) => ing.part === part.id && opened.includes(ing.tier)).length,
    })),
  };
}
