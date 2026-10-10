/**
 * The Weave codex — the magic a Weaver puts into a weapon, released on the hit.
 *
 * Its own module rather than a section of weapons.js, for the reason martial.js
 * is: weapons.js assembles the whole card registry, so reaching for one weave
 * from it would drag talents, lineages and backgrounds into the bundle a
 * first-time visitor downloads. Weaves depend on nothing but their own art, so
 * they can be reached on their own. weapons.js re-exports WEAVES.
 *
 * ------------------------------------------------------------------ what one is
 * **A weave is not an action and it is not a spell. It is magic you release
 * through a hit.** Jules, 2026-09-10, handing the set over:
 *
 *   "use the information you have to make the weaver whcih hte fletcher but for
 *    all weapon. Effects you can choose to atctive when you hit with an attack
 *    like a smite. Magic empweremnt on weapons."
 *
 * So the shape is the Martial Move's shape and the fiction is a caster's: the
 * weave is ticked on inside the attack's own use prompt, priced into the same
 * pay button and spent by the same press. Nothing waits on a tracker and nothing
 * is paid for a swing that never happened. See weaver.js for the machinery and
 * UsePrompt.jsx for the offer.
 *
 * ------------------------------------------------------- against the other two
 * Two things in the codex are already added to a swing, and a weave is neither
 * of them. It is worth being exact about the line, because all three are priced
 * in Willpower and all three are ticked in the same dialog:
 *
 *   a Martial Move   **bends the swing.** Advantage, a bigger die, a disarm, a
 *                    push. It is training, it is free of magic, and it never
 *                    adds a die of its own. martial.js.
 *   a bound spell    **arrives where the swing lands.** A whole spell out of the
 *                    whole codex, cast through one weapon a Spellblade put a
 *                    hand on, priced off its own Action Points. spellblade.js.
 *   a weave          **comes out of the wound.** One effect, written for this
 *                    purpose and nothing else, released through *any* weapon and
 *                    priced by its rung alone.
 *
 * The last of those three is the whole of what the designer asked for: the
 * Fletcher's trick, which is one weapon's, given to every weapon there is.
 *
 * ------------------------------------------------------------------ the banner
 * Two tags, in the order a Martial Move's read: what it is, then the rung it is
 * learned at.
 *
 *   WEAVE - NOVICE
 *
 * `tierOf` in loadouts.js looks for the rung in any tag rather than in the
 * first one, so this order resolves exactly as `['Martial Move', 'Novice']`
 * does. There is no school and no family: a weave is a weave, and the rung is
 * the only thing that gates it, which is why the chooser walls them by tier
 * (`group: 'tier'` on the spec).
 *
 * ---------------------------------------------------------------- the price
 * **Willpower and nothing else.** The Action Points belong to the attack it
 * rides, so `ap` is null on all eighteen. What one costs is its rung, read off
 * the two ladders the codex already keeps:
 *
 *   Novice  1 Willpower, which is what a Novice Martial Move costs
 *   Adept   2 or 3, which is the Adept move's range
 *   Master  4 to 6, which is the Master move's
 *
 * And the damage climbs on the spell codex's own stair rather than on a new one:
 * `1d6 + stat` at Novice, `2d6 + 2*stat` at Adept, `4d6 + 4*stat` at Master, the
 * dice count and the multiplier always equal, which is how every damaging spell
 * in the codex is written.
 *
 * A carried weave is cheaper than the same effect carried as a spell, and it
 * should be: a Spellblade pays the spell's Willpower plus a surcharge for its
 * Action Points and can reach the entire codex, while a weave can be released
 * through nothing but a swing and there are only eighteen of them.
 *
 * ------------------------------------------------------------------- `rides`
 * Nothing here carries one. A Martial Move's `rides` moves a number the swing's
 * own card prints — advantage, Empowered, Elevated, the Action Points — and a
 * weave moves none of them: it is a second thing resolving where the first one
 * landed, which is exactly the shape the bound-spell channel already carries.
 * So the whole of what a weave does is its own text, rolled after the swing's
 * own roll. See `castPlan` in combatBar.js and `rollPlan` in usePlayCard.js.
 *
 * **Which means the miss enforces itself and nothing had to be written for it.**
 * A chain stops dead at a failed check, and a weave's damage is a link behind
 * the Attack Roll, so a weave released on a swing that missed rolls nothing. The
 * Willpower still goes, because payment is unconditional on this sheet and is
 * taken when the swing is paid for. Same law the Spellblade keeps, said in
 * data/README.md.
 *
 * -------------------------------------------------------------- what is whose
 * **All eighteen are this file's, and that is the thing to know about them.**
 * The designer gave three sentences and a comparison, quoted above, and named no
 * weave, no price and no number. Every name, every effect and every cost below
 * was chosen here off the two ladders the codex already keeps, and the whole list
 * is logged in data/README.md under "The Weaver, 2026-09-10" so it can be thrown
 * away and replaced by a sheet the day one arrives. It is written to be replaced.
 *
 * What was *not* invented is the vocabulary. Every effect here is a keyword the
 * codex already defines (Burn, Bleed, rooted, blinded, prone, Shield, Armor) or a
 * damage type already in `DAMAGE_TYPES`. Nothing below teaches the game a new
 * word, which is the one discipline that keeps an invented list from becoming an
 * invented ruleset.
 *
 * ------------------------------------------------------------------- modular
 * Nothing here names an attribute it does not have to. Every weave is written
 * off `{stat}`, and `stat: 'mind'` below is only the default a holder with no
 * other claim prints. The Weaver's own pool carries `cast: 'highest'`, so a
 * weave in a Weaver's hands prints and rolls whichever attribute they stand
 * highest in — see castModifier in cardText.js. Same arrangement martial.js
 * keeps with its Instinct.
 */

import { withArt } from './cardArt.js';
import { sortCards } from './cardOrder.js';

/** What each tier is called, in the order a rank opens them. */
export const WEAVE_TIERS = ['Novice', 'Adept', 'Master'];

export const WEAVES = withArt([
  /* -------------------------------------------------------------- Novice ----
   * Six, 1 Willpower each, `1d6 + stat` each. One paragraph and one rider, so
   * the whole tier reads at a glance and a Rank 1 Weaver choosing three of six
   * is choosing between effects rather than between sizes.
   *
   * Five of the six are a damage type with a clause on it and the sixth spends
   * the hit on yourself, which is the shape the tier needed: a Weaver whose
   * party is losing has something to release that is not more damage.
   */
  {
    id: 'emberthread',
    name: 'Emberthread',
    summary: 'Fire out of the wound, and it keeps burning.',
    kind: 'weave',
    tags: ['Weave', 'Novice'],
    ap: null,
    wp: 1,
    stat: 'mind',
    /* Burn is the codex's own status and its stack rules are keywords.js's, so
       the card names it and glosses nothing. The plainest weave there is, and
       deliberately first: it is the one a reader uses to work out what the whole
       list is doing. */
    body: 'On a hit, deal [[1d6 + stat]] {damage:Fire} damage and the target gains Burn.',
  },
  {
    id: 'rimethread',
    name: 'Rimethread',
    summary: 'Cold, and the ice takes the ground with it.',
    kind: 'weave',
    tags: ['Weave', 'Novice'],
    ap: null,
    wp: 1,
    stat: 'mind',
    /* rooted rather than a Movement Speed number, because rooted is the word the
       codex defines and a card that invents its own way of saying "cannot move"
       is a card the tracker cannot read. `until its next Turn End` is the shape
       `effectDuration` reads. */
    body:
      'On a hit, deal [[1d6 + stat]] {damage:Cold} damage and the target is rooted until its next Turn End.',
  },
  {
    id: 'arcthread',
    name: 'Arcthread',
    summary: 'Lightning that does not stop at the one you hit.',
    kind: 'weave',
    tags: ['Weave', 'Novice'],
    ap: null,
    wp: 1,
    stat: 'mind',
    /* The tier's one reach past the target, and the reason it costs the same as
       the rest: it is the same damage twice rather than more damage once, and a
       second body within 3 meters is not always there. */
    body:
      'On a hit, deal [[1d6 + stat]] {damage:Lightning} damage to the target and to **an entity** within **3 meters (10 feet)** of it.',
  },
  {
    id: 'leechthread',
    name: 'Leechthread',
    summary: 'What it takes out of them goes into you.',
    kind: 'weave',
    tags: ['Weave', 'Novice'],
    ap: null,
    wp: 1,
    stat: 'mind',
    /* "the damage dealt" rather than a second live value, so the two numbers can
       never disagree: what was rolled once is what comes back. Necrotic is the
       type the talent cards print where a weapon prints Decay. */
    body:
      'On a hit, deal [[1d6 + stat]] {damage:Necrotic} damage. You restore Health equal to the damage dealt.',
  },
  {
    id: 'wardthread',
    name: 'Wardthread',
    summary: 'The weave closes over you instead of over them.',
    kind: 'weave',
    tags: ['Weave', 'Novice'],
    ap: null,
    wp: 1,
    stat: 'mind',
    /* The one Novice weave that leaves the target alone. `gain X Shield` and
       never "in Shield", which lint:cards holds the codex to. */
    body: 'On a hit, you gain [[1d6 + stat]] Shield.',
  },
  {
    id: 'hazethread',
    name: 'Hazethread',
    summary: 'It goes into the head, and the next swing goes wide.',
    kind: 'weave',
    tags: ['Weave', 'Novice'],
    ap: null,
    wp: 1,
    stat: 'mind',
    /* Written the way RECKLESS writes the same shape from the other side ("The
       next Attack Roll made against you is also made with advantage"), so the
       codex says one thing one way. */
    body:
      'On a hit, deal [[1d6 + stat]] {damage:Psychic} damage. The next Attack Roll the target makes is made with disadvantage.',
  },

  /* --------------------------------------------------------------- Adept ----
   * Six at 2 or 3 Willpower and `2d6 + 2*stat`, and the tier is not the Novice
   * one made bigger. What a rank buys here is *shape*: an area, a body that is
   * not the target, a defence taken away. A Weaver who wanted more Fire would
   * rather have Emberthread and the two Willpower.
   */
  {
    id: 'burstweave',
    name: 'Burstweave',
    summary: 'The weave comes apart where it lands and takes the room with it.',
    kind: 'weave',
    tags: ['Weave', 'Adept'],
    ap: null,
    wp: 3,
    stat: 'mind',
    /* The dearer end of the tier, because a swing that was one body's problem is
       now everybody's. Force is the untyped-looking type the codex uses for a
       burst with no element behind it. */
    body:
      'On a hit, deal [[2d6 + 2*stat]] {damage:Force} damage to **all entities** within **3 meters (10 feet)** of the target.',
  },
  {
    id: 'rustweave',
    name: 'Rustweave',
    summary: 'Decay in the wound, and the armor goes with it.',
    kind: 'weave',
    tags: ['Weave', 'Adept'],
    ap: null,
    wp: 2,
    stat: 'mind',
    /* BREACH takes 2 off a Defense for 3 Willpower at Master and this takes 2
       off an Armor for 2 at Adept, which is not the same number: Armor is
       subtracted from damage and Defense is what an Attack Roll is measured
       against, and the codex's own move list prices the second one dearer. */
    body:
      'On a hit, deal [[2d6 + 2*stat]] {damage:Decay} damage and the target’s Armor is reduced by 2 until its next Turn End.',
  },
  {
    id: 'sunthread',
    name: 'Sunthread',
    summary: 'Light in the wound, and they cannot see past it.',
    kind: 'weave',
    tags: ['Weave', 'Adept'],
    ap: null,
    wp: 3,
    stat: 'mind',
    /* blinded is the keyword and its reading is keywords.js's. The dearer end,
       because a blinded attacker is a whole turn taken off somebody. */
    body:
      'On a hit, deal [[2d6 + 2*stat]] {damage:Sacred} damage and the target is blinded until its next Turn End.',
  },
  {
    id: 'mendthread',
    name: 'Mendthread',
    summary: 'The thread runs the other way, and an ally comes back up.',
    kind: 'weave',
    tags: ['Weave', 'Adept'],
    ap: null,
    wp: 2,
    stat: 'mind',
    /* The set's one card that heals somebody else, and the reason the Weaver is
       tagged Support as well as Martial. `restore X Health` and never "in
       Health". Sight and a range, the way every spell that reaches an ally is
       written. */
    body:
      'On a hit, **an ally** you can see within **9 meters (30 feet)** restores [[2d6 + 2*stat]] Health.',
  },
  {
    id: 'hollowthread',
    name: 'Hollowthread',
    summary: 'Whatever was holding their Shield up is cut.',
    kind: 'weave',
    tags: ['Weave', 'Adept'],
    ap: null,
    wp: 2,
    stat: 'mind',
    /* No damage at all, which is what makes it worth 2 Willpower against a room
       whose Shield is the thing keeping it standing. The only weave in the list
       that deals none, and the reason it is here is that a set built entirely out
       of extra dice has one answer to everything. */
    body:
      'On a hit, the target’s Shield is reduced to 0 and it cannot gain Shield until its next Turn End.',
  },
  {
    id: 'windthread',
    name: 'Windthread',
    summary: 'The weave lets go all at once and puts them on their back.',
    kind: 'weave',
    tags: ['Weave', 'Adept'],
    ap: null,
    wp: 2,
    stat: 'mind',
    /* DRIVE BACK is 3 meters or prone for 1 Willpower at Novice; this is 6
       meters and prone and a die of Force for 2 at Adept. Both, rather than the
       move's either, which is what the rung and the extra Willpower buy. */
    body:
      'On a hit, deal [[2d6 + 2*stat]] {damage:Force} damage, and the target is pushed back **6 meters (20 feet)** and knocked prone.',
  },

  /* -------------------------------------------------------------- Master ----
   * Six from 4 to 6 Willpower. Two of them are simply enormous, and the other
   * four are things no rung below can do at all: a whole reach hit at once, a
   * caster cut off from their magic, rot that keeps working after the turn ends,
   * and a Weaver leaving the place they just struck.
   *
   * `4d6 + 4*stat` is the tier's damage where a card deals it flat, which is
   * where an Adept spell's top end and a Master spell's bottom end meet.
   */
  {
    id: 'unmaking',
    name: 'Unmaking',
    summary: 'All of it at once, into one body.',
    kind: 'weave',
    tags: ['Weave', 'Master'],
    ap: null,
    wp: 6,
    stat: 'mind',
    /* The list's one card with no clause on it, and it earns its place by being
       the answer when the clause is not the thing you need. Priced at the top of
       the tier for the same reason STUNNING STRIKE is: nothing is asked of the
       target and nothing can go wrong. */
    body: 'On a hit, deal [[4d6 + 4*stat]] {damage:Force} damage.',
  },
  {
    id: 'crossweave',
    name: 'Crossweave',
    summary: 'One swing, and the weave finds everything you could have hit.',
    kind: 'weave',
    tags: ['Weave', 'Master'],
    ap: null,
    wp: 6,
    stat: 'mind',
    /* Reach and not a radius, so the answer is the weapon in your hands rather
       than a number: a Great Weapon's Crossweave is a room and a dagger's is an
       arm's length, which is the set's whole argument for being about weapons. */
    body:
      'On a hit, deal [[3d6 + 3*stat]] {damage:Force} damage to **all entities** within your reach.',
  },
  {
    id: 'severing-thread',
    name: 'Severing Thread',
    summary: 'It cuts the one thread they were casting along.',
    kind: 'weave',
    tags: ['Weave', 'Master'],
    ap: null,
    wp: 5,
    stat: 'mind',
    /* The only card in the codex that stops a caster casting, and it is the
       Weaver's to have: a set whose whole trade is magic run along a thread is
       the set that can cut somebody else's. No damage, because taking a mage's
       turn away is the effect.

       Both clauses end at the same Turn End, so the row it lays has one clock. */
    body:
      'On a hit, the target cannot cast spells and cannot take reactions until its next Turn End.',
  },
  {
    id: 'doomthread',
    name: 'Doomthread',
    summary: 'The weave stays in the wound and keeps unravelling.',
    kind: 'weave',
    tags: ['Weave', 'Master'],
    ap: null,
    wp: 5,
    stat: 'mind',
    /* `for the next **3 turns**` is the duration shape effectDuration reads, so
       the row this lays counts itself down. Turn Start and not Turn End, which is
       where every other repeating damage in the codex lands (Bleed, Burn). */
    body:
      'On a hit, the target takes [[2d6 + 2*stat]] {damage:Decay} damage at each of its Turn Starts for the next **3 turns**.',
  },
  {
    id: 'shroudweave',
    name: 'Shroudweave',
    summary: 'The weave closes behind the swing and they cannot find you in it.',
    kind: 'weave',
    tags: ['Weave', 'Master'],
    ap: null,
    wp: 4,
    stat: 'mind',
    /* Wardthread grown up and given a second clause, which is the one place in
       the list where a rung really is the same idea made bigger. The cheapest
       Master weave, because it does nothing to the fight and everything for the
       one body holding the weapon. */
    body:
      'On a hit, you gain [[2d6 + 2*stat]] Shield and the next Attack Roll made against you is made with disadvantage.',
  },
  {
    id: 'riftthread',
    name: 'Riftthread',
    summary: 'You follow the thread out of the place you swung from.',
    kind: 'weave',
    tags: ['Weave', 'Master'],
    ap: null,
    wp: 4,
    stat: 'mind',
    /* "as part of this action" is what keeps it off the Move action's cost, the
       same clause DISENGAGE uses for the same job. Around the target and not
       around you, so the reward for landing the hit is being somewhere the target
       is not. */
    body:
      'On a hit, you can move to any point you can see within **9 meters (30 feet)** of the target as part of this action.',
  },
]);

/* -------------------------------------------------------------------- lookups
 * A weave by id or by printed name, and the tier a card sits at. weapons.js
 * folds this file into the global registry, so `getCard` reaches every weave as
 * well — these are for the callers that want *only* weaves and must not drag the
 * registry in behind them. Same three martial.js exports and for the same reason.
 */

const WEAVE_BY_ID = new Map(WEAVES.map((card) => [card.id, card]));
const WEAVE_BY_NAME = new Map(WEAVES.map((card) => [card.name.toLowerCase(), card]));

export function getWeave(key) {
  if (!key) return null;
  return WEAVE_BY_ID.get(key) ?? WEAVE_BY_NAME.get(String(key).toLowerCase()) ?? null;
}

/** Whether a card is one of these, wherever it arrived from. */
export function isWeave(card) {
  return card?.kind === 'weave';
}

/** The tier word a weave's tags carry: "Novice", "Adept", "Master", or null. */
export function weaveTier(card) {
  for (const tag of card?.tags ?? []) {
    if (WEAVE_TIERS.includes(tag)) return tag;
  }
  return null;
}

/**
 * Every weave at the given tiers, up the ladder.
 *
 * Through cardOrder.js rather than off the file's own order, for the reason
 * `movesAt` is: a list that *happens* to be right is not the same as one that is
 * ordered, and the day a nineteenth weave is written in beside its cousins
 * rather than at the bottom of its tier, this still comes out climbing.
 */
export function weavesAt(tiers = WEAVE_TIERS) {
  const wanted = new Set(tiers);
  return sortCards(WEAVES.filter((card) => wanted.has(weaveTier(card))));
}
