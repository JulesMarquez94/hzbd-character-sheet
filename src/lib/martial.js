/**
 * The Martial Move codex.
 *
 * Its own module rather than a section of weapons.js, for the same reason
 * spells.js is: weapons.js assembles the whole card registry, so reaching for
 * one move from it would drag talents, lineages and backgrounds into the bundle
 * a first-time visitor downloads. Moves depend on nothing but their own art, so
 * they can be reached on their own. weapons.js re-exports MARTIAL_MOVES.
 *
 * ------------------------------------------------------------------ what one is
 * **A Martial Move is not an action. It is something you add to a weapon
 * attack.** Jules, 2026-09-02:
 *
 *   "Now they are not their own action you need to do before, instead whenever
 *    you make a weapon attack, you can choose to add 1 Martial move to the
 *    attack. [...] So they are not longer their own action but something you can
 *    add on top to modify them."
 *
 * That replaces the whole of how these worked. A move used to be paid for on its
 * own, laid a rider on the effects tracker and waited there for the next swing;
 * now the swing itself is where it is chosen, in the use prompt, before the cost
 * is paid. Nothing waits, nothing is forgotten on a tracker and nothing is spent
 * on a move whose attack never happened. See moves.js for the machinery and
 * UsePrompt.jsx for the offer.
 *
 * The knock-on for this file is the price. **A move costs Willpower and nothing
 * else**: the Action Points belong to the attack it rides, and every move that
 * used to charge one was charging for being its own action. So `ap` is null on
 * all eighteen, and the one move that touches Action Points at all *gives* one
 * back (RIPOSTE). Jules priced four of them outright and the rest are read off
 * those four, tier by tier.
 *
 * Five of them are priced off the swing rather than off the tier. `scales` turns
 * `wp` from a cost into a rate: `'ap'` is what the move costs for every 2 Action
 * Points the attack costs, and `'dice'` is what it costs per Damage Die the
 * attack prints. RECKLESS, WOUND, REND and SUNDER are the four Jules asked for on
 * 2026-09-03, and AMBUSH is the fifth and the one that always read that way. See
 * `moveWillpower` below, which is the one place either sum is written, and
 * `moveCost` in moves.js, which is the one place the swing is handed to it.
 *
 * ------------------------------------------------------------- granted moves
 * **Not every Martial Move is in this file.** A talent set can hand one over
 * outright, as one of its own cards, and three do — see "the granted three" in
 * talents.js. Those are not learned from a pool, cannot be picked in a chooser
 * and are printed under their set on the Abilities tab; everything else about
 * them is a move, including this file's price rules. `heldMoves` in moves.js is
 * where the two kinds meet.
 *
 * ----------------------------------------------------------------- the banner
 * Two tags, in the order the printed cards read them: what it is, then the tier
 * it is learned at.
 *
 *   MARTIAL MOVE - NOVICE
 *
 * That is the reverse of a spell's banner ("NOVICE SPELL - PRIMAL - FLORA") and
 * it is deliberate — it is what the plates say. `tierOf` in loadouts.js looks
 * for the tier word in any tag rather than in the first one, so both orders
 * resolve. There is no school and no family: a move is a move, and the tier is
 * the only thing that gates it, which is why the chooser walls them by tier
 * (`group: 'tier'` on the spec) rather than by a sub-school none of them has.
 *
 * ------------------------------------------------------------------- `rides`
 * What the move does to the swing it is added to, as data, never read out of the
 * prose. Four keys, all optional, all the shapes the card renderers already
 * understand:
 *
 *   advantage  extra d4s on the attack roll. A count, because Advantage stacks.
 *   empower    another damage die of the same kind (2d6 -> 3d6).
 *   elevate    the same dice, one size up (2d6 -> 2d8), capped at d12. A count.
 *   ap         a signed change to what the attack itself costs. RIPOSTE's -1, and
 *              the word `'free'` for a swing that costs nothing at all: RECKLESS
 *              VIOLENCE, where the price is replaced rather than nudged, since
 *              minus six is wrong on a dagger and right on a Great Weapon.
 *
 * `'free'` is the one rider no number could hold, and it belongs to a granted
 * move rather than to any of the eighteen here. See `moveCost` in moves.js, which
 * is the only place it is read. `elevate` could hold a word too for one day —
 * `'paid'`, on AMBUSH — and Jules flattened that card to a single Elevate on
 * 2026-09-03, so the branch is gone and a count is a count again.
 *
 * A move with no `rides` still rides: WOUND, WING CLIP, DISARM, REND and most of
 * the rest change what the attack *does* without changing a number the sheet
 * prints, so the swing names them and the table plays the rest. That is also the
 * line for the conditional halves, and it is worth being strict about: RECKLESS
 * is advantage on every swing, so the sheet prints it; EXECUTE is Empowered only
 * against a target below half its Health, and the sheet does not know the
 * target's Health, so EXECUTE carries nothing. A printed number that might be
 * wrong is worse than a printed sentence the table reads.
 *
 * ------------------------------------------------------------------- two flags
 *   reaction   the move may only be added to a weapon attack made *as* a
 *              reaction. RIPOSTE and CONCUSS. The prompt hides both on an
 *              ordinary swing rather than offering a move that cannot be taken.
 *   aims       the move's own text says who the swing lands on, so the target
 *              picker has to read it. Nothing carries it today: SWEEP did, and
 *              the flag stays because the reading has to be data rather than a
 *              guess at prose — an ally named in COORDINATED ATTACK is not a
 *              body the attack is aimed at, and a prose reader cannot tell the
 *              difference. See `aimingMoves` in moves.js.
 *
 * ------------------------------------------------------------------ modular
 * Nothing here names an attribute it does not have to. Every move is written off
 * `{stat}`, and `stat: 'instinct'` below is only the default a holder with no
 * other claim rolls with — a set that teaches these off another attribute
 * carries `cast` on its loadout and the same card prints that attribute instead
 * (see castModifier in cardText.js). No set that teaches them names one, so none
 * carries `cast` yet.
 *
 * -------------------------------------------------------------- what is whose
 * **All eighteen are the designer's design and this file's words.** Jules handed
 * over the eighteen effects on 2026-09-02, six a tier, as one line each: "a
 * martial move that double the move action cost of the target until it next end
 * turn", "rend a martial move that applies a bleed per dice roll". So the
 * mechanics are the designer's and the sentences are this file's, which is the
 * reverse of the six Novice plates of 2026-08-20 — those were transcriptions,
 * and five of the six names survive here because the effect Jules asked for is
 * the effect the plate already had.
 *
 * Nothing is marked `house: true` any more for that reason: the flag meant "an
 * extrapolation nobody asked for", and there are none left. What is here instead
 * is a list of four durations, one distance and one rate that Jules did not state
 * and this file had to choose. They are all flagged in data/README.md and each one
 * is commented where it sits.
 *
 * The eighteen are not the same eighteen. MOMENTUM left on 2026-09-03 and CONCUSS
 * replaced it as a reaction that interrupts; the Master stun that held that name
 * is STUNNING STRIKE, and it gained a contest of its own. See both cards.
 *
 * Two statuses carry the weight of six of these cards, and both were given
 * outright the same day:
 *
 *   Bleed  "stackable status that deal 1d6 damage at the start turn of
 *          entities. Remove 1 stack when receive 1 heal."
 *   Wound  "singular status that make weapon and speacial weapon attack again
 *          the target empowred."
 *
 * Wound used to be the stacking damage-over-time and Bleed has taken that job,
 * so the two of them swapped roles rather than one being added. Both live in
 * keywords.js in the designer's own words. See data/README.md.
 */

import { withArt } from './cardArt.js';
import { sortCards } from './cardOrder.js';

/** What each tier is called, in the order a rank opens them. */
export const MOVE_TIERS = ['Novice', 'Adept', 'Master'];

export const MARTIAL_MOVES = withArt([
  /* ------------------------------------------------------------- Novice ----
   * "A martial move that make it so it increase the cost by 1 willpower but you
   * will be able to move before or after the attack" is the first of the six,
   * and it is the price of the whole tier: a Novice move costs 1 Willpower.
   */
  {
    id: 'concuss',
    name: 'Concuss',
    summary: 'The answer that stops what it was answering, if it lands and if it tells.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Novice'],
    ap: null,
    wp: 1,
    stat: 'instinct',
    /* "replace it with one that you can only take as a reaction that allow you
       to interrupt the action you react to granted that you land the attack and
       success at a roll with the weapon stat against the target grit", Jules on
       2026-09-03, and it replaces MOMENTUM outright.

       The second of the two moves that may only ride a reaction, and the first
       that asks for anything past the hit: two gates in the order they resolve,
       and the swing has to clear both. Interrupted is the Time family's keyword
       and its definition is the designer's own — the Action does not happen and
       its cost is spent anyway — which is what reacting into somebody's turn is
       worth.

       **The contest is printed rather than rolled.** A chain asks for its DC
       once (see rollPlan.js), the attack has already spent that question, and a
       second check would either ask twice or borrow the first one's number.
       Neither is right, so the sentence is the table's to resolve. Flagged in
       data/README.md.

       This is the id CONCUSS already had, and the Master stun that used to hold
       it is STUNNING STRIKE now. A stored pick of `concuss` therefore comes back
       as this card and not that one, which is the honest outcome: the name is
       what was chosen and the name is what moved. Said in data/README.md. */
    reaction: true,
    body:
      'Concuss can only be added to a Weapon Attack you make as a reaction.\n\n' +
      'On a hit, make an {stat} Roll {roll} against the Grit of the target. On a success, the Action you reacted to is Interrupted.',
  },
  {
    id: 'wound',
    name: 'Wound',
    summary: 'The hit leaves a Wound, and every weapon swing after it bites harder.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Novice'],
    ap: null,
    wp: 1,
    scales: 'ap',
    stat: 'instinct',
    /* Wound is a defined term and its definition is Jules's own sentence, in
       keywords.js. The card uses the word and never explains it, which is the
       law every term on every card keeps. The card's own name being the term is
       allowed here in a way it was not for Gore Armor: "inflicts a Wound on the
       target" is the term being *used*, not a title colliding with a stat.

       It `scales` at RECKLESS's rate, which is the price it already printed. An
       opening in a Great Weapon's swing is worth more than one in a dagger's for
       the same reason the swing is: the next attack through it is bigger. */
    body:
      'On a hit, this attack inflicts a Wound on the target.\n\n' +
      'Its cost is 1 Willpower for every 2 Action Points the attack costs.',
  },
  {
    id: 'wing-clip',
    name: 'Wing Clip',
    summary: 'Every step the target takes costs it double, and a flier comes down.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Novice'],
    ap: null,
    wp: 1,
    stat: 'instinct',
    /* "a martial move that double the move action cost of the target until it
       next end turn." The doubling replaces the plate's flat +1 Action Point and
       the plate's advantage is gone, since RECKLESS and nothing else buys that
       now. The flying clause stays: it is the plate's own and it is what makes
       the card Wing Clip. */
    body:
      'On a hit, the target’s {{Move}} action costs double until its next Turn End.\n\n' +
      'If the target is flying, it falls toward the ground up to **18 meters (60 feet)** if possible.',
  },
  {
    id: 'reckless',
    name: 'Reckless',
    summary: 'Advantage now, bought with advantage against you.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Novice'],
    ap: null,
    wp: 1,
    scales: 'ap',
    stat: 'instinct',
    rides: { advantage: 1, elevate: 1 },
    /* One of the four that `scales`: 1 Willpower on a Finesse Weapon's swing and
       3 on a Great one. Jules priced this one outright — "Rckelss is 1 [for a] 2
       action point cost or 2 for 4 ones" — and it is the rate the other three
       are read against. See `moveWillpower` below.

       **The Elevate came back on 2026-09-03**, on Jules's instruction: "update
       reckless to give elevated to the attack". The plate had an Empowered half
       and it was cut on 2026-09-02, when every move cost one flat Willpower and a
       die on top of advantage for the same 1 was the old card being its own
       action. The price is read off the swing now — 3 Willpower on a Great Weapon
       — so the card can carry both halves and still be paid for.

       Elevated rather than Empowered, which is what Jules asked for and is the
       better half of the two here: it is the same dice one size up, so it scales
       with whatever is in your hands instead of adding one die of whatever the
       weapon happens to roll. Wired, because both halves ride every swing — the
       line RECKLESS has always been on the right side of. */
    body:
      'The attack is made with advantage and its damage is Elevated once.\n\n' +
      'The next Attack Roll made against you is also made with advantage.\n\n' +
      'Its cost is 1 Willpower for every 2 Action Points the attack costs.',
  },
  {
    id: 'taunting',
    name: 'Taunting',
    summary: 'A target that can barely bring itself to aim at anybody but you.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Novice'],
    ap: null,
    wp: 1,
    stat: 'instinct',
    /* "Tautning attack that if lends make it give disavatage to the entity if it
       attack anyone else." The plate's advantage is gone for the same reason
       RECKLESS's Empowered is. Its opening line and its own reading of "anyone
       else" (Attack Rolls *and* skill checks) are kept. */
    body:
      'You draw your opponent’s focus away from your allies.\n\n' +
      'On a hit, the target has disadvantage on Attack Rolls and skill checks made against anybody other than you.',
  },
  {
    id: 'drive-back',
    name: 'Drive Back',
    summary: 'Weight behind the blow: they give ground, or they go down.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Novice'],
    ap: null,
    wp: 1,
    stat: 'instinct',
    /* "a pushing martial move", and the resolution is the Shove basic action's
       own sentence: push or prone, the attacker's choice. Twice Shove's distance,
       because this one is riding a hit that has already landed and costs
       Willpower on top of the swing.

       **Not called Shove.** That id is the basic action's and a card id is unique
       across the whole registry. Flagged in data/README.md. */
    body: 'On a hit, you push the target back **3 meters (10 feet)** or knock it prone.',
  },

  /* -------------------------------------------------------------- Adept ----
   * "a martial move that cost 3 willpower" and "a cheaper action point cost by
   * -1 for 1 willpower" are the two Jules priced, and 2 Willpower is the tier
   * between them.
   */
  {
    id: 'guarded',
    name: 'Guarded',
    summary: 'A stance inside the swing: harder to hit, to shake and to catch.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Adept'],
    ap: null,
    wp: 3,
    stat: 'instinct',
    /* "a martial move that cost 3 willpower and increase you dfense, girt and
       reflex by 1."

       **The duration is chosen and the ruling is open.** Jules named none, and a
       defensive stance with no clock is either permanent or nothing. Until your
       next Turn Start is the reading that makes it a stance: it covers the round
       you spent it in and comes off when your turn comes round again.

       Printed prose rather than a wired rider. `EFFECT_RIDERS` in riders.js can
       move a Defense and cannot move a Grit or a Reflex, and two of the three
       numbers moving is worse than none of them: the player would trust the tile
       and be wrong about two. Flagged in data/README.md as wiring worth doing. */
    body:
      'Your Defense, Grit and Reflex are each increased by 1 until your next Turn Start.',
  },
  {
    id: 'disarm',
    name: 'Disarm',
    summary: 'What they were holding is on the floor, and bending down costs them.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Adept'],
    ap: null,
    wp: 2,
    stat: 'instinct',
    /* "disarm a martialmvoe that if the attack lands then the eneity cannot use
       its weapon attack or special weapon attack until it use an action to pick
       it up." The old card's contest against Grit is gone: the landing is the
       contest now. "It cannot make a weapon attack" covers both attacks by the
       term's own definition, which is why the card says it once. */
    body:
      'On a hit, whatever the target was holding lands **3 meters (10 feet)** away in a direction of your choice.\n\n' +
      'Until it takes the {{Interact}} action to pick the thing up, it cannot make a Weapon Attack.',
  },
  {
    id: 'riposte',
    name: 'Riposte',
    summary: 'Only on the answer, and it makes the answer a point cheaper.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Adept'],
    ap: null,
    wp: 1,
    stat: 'instinct',
    /* "a martial move that is only usable as a reaction to being attacked
       allowing a cheaper action point cost by -1 for 1 willpower."

       The only move whose `rides` touches the cost of the swing, and the only one
       the prompt hides on an ordinary attack. Jules wrote "action point cost",
       and a reaction is paid out of Reaction Points on this sheet, so the card
       names the pool that will actually be charged. Flagged in data/README.md. */
    rides: { ap: -1 },
    reaction: true,
    body:
      'Riposte can only be added to a Weapon Attack you make as a reaction to being attacked.\n\n' +
      'That attack costs 1 less Reaction Point.',
  },
  {
    id: 'lunge',
    name: 'Lunge',
    summary: 'Three more meters of reach, bought for the one swing.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Adept'],
    ap: null,
    wp: 2,
    stat: 'instinct',
    /* "one that isluning attack." A lunge is reach and nothing else, so the card
       is one line. The distance is chosen: **3 meters** is one step of the grid
       every other card on the sheet measures in, and it is the same number DRIVE
       BACK pushes. Flagged in data/README.md. */
    body: 'Your reach for this attack is increased by **3 meters (10 feet)**.',
  },
  {
    id: 'disengage',
    name: 'Disengage',
    summary: 'Nothing can answer it, and you are out of the way before it tries.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Adept'],
    ap: null,
    wp: 2,
    stat: 'instinct',
    /* "one that iswow style disegengaging attack that acannot be reacted to."
       Both halves: the swing cannot be answered, and you leave. The leap is half
       your Movement Speed rather than a flat number so it scales with the
       Instinct the sheet already derives it from. */
    body:
      'The attack cannot be answered with a reaction.\n\n' +
      'After it, you can move up to half your Movement Speed away from the target as part of the same action.',
  },
  {
    id: 'piercing',
    name: 'Piercing',
    summary: 'The plate might as well not be there.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Adept'],
    ap: null,
    wp: 3,
    stat: 'instinct',
    /* "m,atial move htat make it ignore armor." Armor is flat reduction off
       every hit that lands, so this is the one line. Priced with GUARDED, since
       against a heavily plated target it is worth more than a die. */
    body: 'The damage of this attack ignores the target’s Armor.',
  },

  /* ------------------------------------------------------------- Master ----
   * "cost 6 Willpower" and "very expensive" are the two Jules priced, and the
   * rest of the tier is read between them.
   */
  {
    id: 'stunning-strike',
    name: 'Stunning Strike',
    summary: 'A blow that takes the fight out of them for the rest of the round.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Master'],
    ap: null,
    wp: 6,
    stat: 'instinct',
    /* "A martial move that cost 6 Willpower and if the attack land it stuns the
       target", 2026-09-02, and this card was called CONCUSS until 2026-09-03,
       when that name went back to a Novice reaction move and this one was
       renamed: "then name concuss stunig strike".

       It kept the price and gained the gate the new CONCUSS is built on. Jules,
       the same day: "Do the same for stunning blow[,] i require reflex." So the
       hit is no longer the whole of it — a stun is contested, the way an
       interrupt is, and the two differ only in which of the target's numbers
       answers. Grit is what shrugs off a blow to the head; Reflex is what rides
       it out. The contest is printed rather than rolled for the reason it is on
       CONCUSS: see there, and data/README.md.

       **The duration is chosen and the ruling is open.** A stun with no clock
       ends the fight. Until its next Turn End is the reading that costs the
       target the turn you took from it and no more. Flagged in data/README.md. */
    body:
      'On a hit, make an {stat} Roll {roll} against the Reflex of the target.\n\n' +
      'On a success, the target is stunned until its next Turn End.',
  },
  {
    id: 'execute',
    name: 'Execute',
    summary: 'Everything already below half goes down faster.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Master'],
    ap: null,
    wp: 4,
    stat: 'instinct',
    /* "A martial move that is an excute, dive are empowred nad elevated on
       entites iwth less than 50%."

       No `rides`, deliberately. Both halves are real riders and both are
       conditional on a number the sheet does not hold: the target's Health is
       the Game Master's, and a card that printed 3d8 against a target who turned
       out to be on 60% would be lying at the moment the player decided. So the
       condition is printed and the table applies it. Same call REND's old
       Wound clause made, and for the same reason. */
    body:
      'If the target is below half its maximum Health, this attack’s damage is Empowered by 1 and Elevated once.',
  },
  {
    id: 'coordinated-attack',
    name: 'Coordinated Attack',
    summary: 'Somebody beside you swings too, and it costs them nothing.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Master'],
    ap: null,
    wp: 4,
    stat: 'instinct',
    /* "a martial mvove called coordinated attack. if there is an ally in range
       with a weapon you can have them make a free weapon attack."

       No `aims` flag: the ally is somebody who *acts*, not a body this attack
       lands on, so the target picker must not offer them a chip. That is the
       whole reason `aims` is data rather than a prose reading — "an ally within
       reach" is indistinguishable from "an entity within reach" to a reader that
       only has the sentence. See the header. */
    body:
      'An ally within reach of the target, holding a weapon, can make a Weapon Attack against it as part of this action without paying its cost.',
  },
  {
    id: 'rend',
    name: 'Rend',
    summary: 'One stack of Bleed for every die the swing rolls.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Master'],
    ap: null,
    wp: 2,
    scales: 'ap',
    stat: 'instinct',
    /* "rend a martial move that applies a bleed per dice roll." Per die the
       attack rolls, so a swing that has been Empowered bleeds for more: the
       number is the one the card beside the button already prints, which is what
       makes "per dice roll" a thing the player can count before they pay.

       Bleed is a defined term and its definition is Jules's own sentence, in
       keywords.js.

       It printed a flat 5 until 2026-09-03, when Jules priced the rate outright:
       "Rend is 2 for 2", so 2 Willpower on a Finesse Weapon's swing and 6 on a
       Great one. That is the card pricing itself honestly for the first time —
       the stacks it lays are counted off the swing's own dice, so a swing worth
       more dice was always worth more Bleed for the same 5. */
    body:
      'On a hit, the target gains one stack of Bleed for each Damage Die this attack rolls.\n\n' +
      'Its cost is 2 Willpower for every 2 Action Points the attack costs.',
  },
  {
    id: 'sunder',
    name: 'Sunder',
    summary: 'For one swing, whatever they are made of, they are made of paper.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Master'],
    ap: null,
    wp: 3,
    scales: 'ap',
    stat: 'instinct',
    /* "very expensive martial move that treat the target as vulnerable to the
       attack." Vulnerable is double damage from that damage type, which is worth
       more than any other single line in this file, so it is the dearest card
       here.

       It printed a flat 7 until 2026-09-03, when it became one of the four that
       `scales`. **The rate is chosen and the ruling is open**: 3 Willpower for
       every 2 Action Points, a rung above the REND Jules priced, which comes out
       at 3 on a Finesse Weapon's swing and 9 on a Great one. Doubling the damage
       is worth the most of anything in this file, and it is worth most of all on
       the swing that had the most to double — which is why this card of all of
       them should never have had one number. Flagged in data/README.md, since
       "very expensive" is a direction rather than a rate. */
    body:
      'The target is treated as vulnerable to this attack’s damage.\n\n' +
      'Its cost is 3 Willpower for every 2 Action Points the attack costs.',
  },
  {
    id: 'breach',
    name: 'Breach',
    summary: 'A hole in the guard that stays open until their turn closes.',
    kind: 'martial-move',
    tags: ['Martial Move', 'Master'],
    ap: null,
    wp: 3,
    stat: 'instinct',
    /* "a martial move the lowers defense." By how much and for how long are both
       chosen: 2 points, which is what a Defense Draught grants in the other
       direction doubled, and until its next Turn End, which is the clock WING
       CLIP and CONCUSS both keep. Flagged in data/README.md. */
    body: 'On a hit, the target’s Defense is reduced by 2 until its next Turn End.',
  },
]);

/* ---------------------------------------------------------------- the price
 * What one move costs the swing it is added to.
 *
 * Thirteen of the eighteen print one number and that number is the whole answer.
 * The other five print a **rate**, read off the attack in front of you, and
 * `scales` says which of the two rates it is:
 *
 *   'ap'    per 2 Action Points the attack costs, rounded up
 *   'dice'  per Damage Die the attack prints
 *
 * The first is Jules's instruction of 2026-09-03:
 *
 *   "I want you to make it so Reckless, Wound, Rend, Sunder to scale of the
 *    weapon base action point cost. being for example Rckelss is 1 [for] 2
 *    action point cost or 2 for 4 ones. Rend is 2 for 2"
 *
 * The second is AMBUSH's own printed cost, which has read that way since the
 * Trickster arrived: "Willpower equal to the weapon's printed number of damage
 * dice, before any enchantment or boost". It became a Martial Move the same day
 * and brought its rate with it. See the granted moves in talents.js.
 *
 * A cost-2 weapon pays exactly the printed number under `'ap'`, and a 1d6 weapon
 * under `'dice'`, which is what keeps the orb on the plate honest either way: the
 * plate shows the rate and the cheapest swing in the game is the one it is quoted
 * against. **No swing at all pays the plate too**, both rates alike, which is
 * what a codex list and a presentation page are handed — the alternative is
 * AMBUSH printing 0 Willpower everywhere it is read outside a prompt, since
 * nothing has told it how many dice to count.
 *
 * **Why these five and not the other thirteen.** What a move is worth is not
 * always what the swing is worth. DISARM knocks a weapon out of a hand and the
 * hand does not care what hit it; LUNGE is three meters whatever you are holding.
 * These five are the ones whose value is the swing's own: RECKLESS doubles the
 * chance of landing it and raises its dice, WOUND opens the next one, REND counts
 * the dice it rolled, SUNDER doubles what it dealt, AMBUSH raises the dice by
 * however many there were. A Great Weapon bought the first four for a dagger's
 * price until the day this was written.
 *
 * `'ap'` rounds **up**, so the rung is what matters and not the parity: a 3-point
 * swing pays what a 4-point one pays, and the crossbow and the firearms, which
 * are off the cost column at 1 Action Point, pay the same as the 2s. Nothing
 * costs less than the printed rate.
 *
 * The attack's **base** cost and dice, not what the holder pays or rolls: an
 * Arcanist's discount, a Quick Draw and an Empowering enchantment are all things
 * you bought, and a move getting dearer or cheaper because of one would be
 * charging you twice. "Before any enchantment or boost" is AMBUSH's own words for
 * the same rule.
 */
export function moveWillpower(card, swing = null) {
  const printed = Math.max(0, Math.floor(Number(card?.wp) || 0));
  if (!card?.scales || !swing) return printed;

  /* Floored at one die, so nothing is ever free by accident. Every plain weapon
     attack in the codex rolls at least one — scripts/check-moves.mjs asserts it,
     because a `'dice'` rate has no meaning without it — and the floor is what
     keeps a swing that somehow rolled none charging the plate instead of nothing. */
  if (card.scales === 'dice') return printed * Math.max(1, swingDice(swing));

  const cost = Math.max(1, Math.floor(Number(swing.ap) || 2));
  return printed * Math.ceil(cost / 2);
}

/**
 * How many Damage Dice an attack prints, off its own text.
 *
 * The most any one of its live values rolls, rather than the sum: a card that
 * deals `[[2d6 + stat]]` and heals `[[1d6]]` prints two Damage Dice and not
 * three. Read off `body` and not off a field, because the codex has never had a
 * field for it — the printed expression *is* the number, which is also what
 * "before any enchantment or boost" asks for.
 *
 * Zero for a card with no dice at all, which is how a swing that cannot be
 * ambushed prices an AMBUSH at nothing and the prompt refuses it.
 */
export function swingDice(card) {
  let most = 0;
  for (const [, expression] of String(card?.body ?? '').matchAll(/\[\[([^\]]+)\]\]/g)) {
    const found = /(\d*)d\d+/i.exec(expression);
    if (found) most = Math.max(most, Number(found[1] || 1));
  }
  return most;
}

/* -------------------------------------------------------------------- lookups
 * A move by id or by printed name, and the tier a card sits at. weapons.js folds
 * this file into the global registry, so `getCard` reaches every move as well —
 * these are for the callers that want *only* moves and must not drag the
 * registry in behind them.
 */

const MOVE_BY_ID = new Map(MARTIAL_MOVES.map((card) => [card.id, card]));
const MOVE_BY_NAME = new Map(MARTIAL_MOVES.map((card) => [card.name.toLowerCase(), card]));

export function getMartialMove(key) {
  if (!key) return null;
  return MOVE_BY_ID.get(key) ?? MOVE_BY_NAME.get(String(key).toLowerCase()) ?? null;
}

/** Whether a card is one of these, wherever it arrived from. */
export function isMartialMove(card) {
  return card?.kind === 'martial-move';
}

/** The tier word a move's tags carry: "Novice", "Adept", "Master", or null. */
export function moveTier(card) {
  for (const tag of card?.tags ?? []) {
    if (MOVE_TIERS.includes(tag)) return tag;
  }
  return null;
}

/**
 * Every move at the given tiers, up the ladder.
 *
 * The file is already written Novice, Adept, Master, so this changes nothing
 * today. It goes through cardOrder.js anyway because a list that *happens* to be
 * right is not the same as one that is ordered: the day a nineteenth move is
 * written in beside its cousins rather than at the bottom of its tier, this
 * still comes out climbing.
 */
export function movesAt(tiers = MOVE_TIERS) {
  const wanted = new Set(tiers);
  return sortCards(MARTIAL_MOVES.filter((card) => wanted.has(moveTier(card))));
}
