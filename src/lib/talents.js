/**
 * Talent sets — the choice that decides what a character *is*.
 *
 * A Talent is a three-rank track. You take a set at Rank 1 and every rank
 * after that unlocks more cards on the same track, so a Guardian at Rank 2
 * holds everything Rank 1 gave them plus what Rank 2 adds. Ranks are never
 * swapped out; they stack.
 *
 * ------------------------------------------------------------------- ranks
 *   Rank 1  Novice   from level 1
 *   Rank 2  Adept    the character must be level 4 or higher
 *   Rank 3  Master   the character must be level 8 or higher
 *
 * ----------------------------------------------------------------- choices
 * A character gets one choice at level 1 and one more at every even level.
 * Each choice buys exactly one rank: either a brand-new Talent set (which
 * always arrives at Rank 1) or the next rank of one already taken. So a
 * level-8 character has had five choices and could be Guardian 3 + Mycomancer
 * 2, or five different sets at Rank 1, or anything between.
 *
 * -------------------------------------------------------------- card text
 * The cards here are codex cards, authored the same way weapons.js writes
 * them — `**bold**`, `{instinct}` for an attribute by name, `{damage:Necrotic}`
 * for a damage type, `{roll}` for what this character adds to a roll, and
 * `{{Intercept}}` to link another card. They are folded into the global card
 * registry by weapons.js, so every link resolves.
 *
 * ---------------------------------------------------------- what a set holds
 * A set may also leave something to the player, and there are two shapes of
 * that. A `loadout` spec picks cards out of the codex (loadouts.js); a
 * `brewing` spec composes one out of Ingredients at the moment it is used
 * (brews.js, and the Ingredient codex in ingredients.js). Both are described here
 * as plain data and resolved elsewhere, which is what keeps this file a leaf.
 *
 * A picked hand is stored on the character's talent entry, so handing the set back
 * takes its cards with it. A composed Brew is stored nowhere at all: it "takes
 * effect immediately" and is gone. The only thing brewing persists is whether the
 * Cauldron is out.
 *
 * And a set may change the *rules* rather than hand anything over, which is what
 * every remaining spec key is: `enchanting` (what may be laid and worn),
 * `minion` (a body on the board, minions.js), `tricks` (the Trickster's riders
 * and its steal table, tricks.js) and `martial` (what the Martial Move system
 * lets this set do, and what it hangs on the weapon in hand — moves.js). All of
 * them are numbers here and behaviour elsewhere, for the same reason: this file
 * is a leaf, and a spec that needed the codex to describe itself would cost it
 * that.
 *
 * ------------------------------------------------------- and a set may be empty
 * A set carrying `stub: true` is a **placeholder**: a name off the designer's
 * roster, the shelf it was filed under, and nothing else. No cards, no spec, no
 * prose of its own. It draws on the chooser wall so the shelf says what is
 * coming, it can never be taken, and it is replaced by a real entry the day its
 * sheet arrives. The roster and the reasoning are at the bottom of the codex.
 *
 * ------------------------------------------------------------ what to roll
 * A card that asks for a roll against another entity has exactly two shapes,
 * and every new card has to pick one:
 *
 *   an attack   —  "Make a {stat} Melee/Ranged Attack" — resolved against the
 *                  target's **Defense**.
 *   a roll      —  "Make a {stat} roll against the target's **Reflex**" (or
 *                  **Grit**) — everything that is not an attack.
 *
 * There is no third target number. A spell that is not swung at someone is
 * always contested against Reflex or Grit.
 *
 * ---------------------------------------------------------------- the art
 * The cards' pictures are not written on the cards. They live in cardArt.js,
 * keyed by card id and generated from the sheets' own Image column, and every
 * other family of cards in the codex wears them the same way: SPELLS and
 * BASIC_ACTIONS both hand their array through `withArt` at the bottom of their
 * own file. These did not, which is the whole reason nine Draconic Bond plates
 * sat in public/cards with nothing drawing them — a set's `art` is the set's
 * overview picture and was never its cards'.
 *
 * cardArt.js imports nothing, so taking it does not cost this file its leaf.
 *
 * This file is a leaf: nothing here may import weapons.js or items.js, which
 * both end up importing it back.
 */

import { ATTRIBUTES } from './attributes.js';
import { withArt } from './cardArt.js';

/* --------------------------------------------------------------- the ranks */

export const MAX_TALENT_RANK = 3;

/** What each rank is called, and the character level it opens at. */
export const TALENT_RANKS = [
  { rank: 1, title: 'Novice', minLevel: 1 },
  { rank: 2, title: 'Adept', minLevel: 4 },
  { rank: 3, title: 'Master', minLevel: 8 },
];

export function rankInfo(rank) {
  return TALENT_RANKS.find((entry) => entry.rank === rank) ?? null;
}

/** The character level a rank needs. Unknown ranks are treated as unreachable. */
export function minLevelForRank(rank) {
  return rankInfo(rank)?.minLevel ?? Infinity;
}


/* ---------------------------------------------------------------- the tags *
 * What a set is built around, so a wall of them can be narrowed to the ones
 * worth reading. Two kinds: the attribute a set leans on, and what it is for
 * at the table. A set carries one attribute and as many roles as fit it.
 */
export const TALENT_TAGS = [
  { id: 'physique', label: 'Physique', kind: 'attribute' },
  { id: 'instinct', label: 'Instinct', kind: 'attribute' },
  { id: 'mind', label: 'Mind', kind: 'attribute' },
  /* Not an attribute, and it wears the same `kind` anyway. A set can lean on
     something no attribute answers for: the Draconic Bond's whole spec is a
     second stat block that grows with its bonded's *level* and with nothing
     else. It is the same pseudo-attribute cardText.js prints for a `{level}`
     token, and the kind is `attribute` because that is what makes the filter
     behave — chips inside a kind widen ("Mind or Level"), chips across kinds
     narrow, and a kind of its own would make those two chips together match
     nothing at all. */
  { id: 'level', label: 'Level', kind: 'attribute' },

  { id: 'martial', label: 'Martial', kind: 'role' },
  { id: 'spellcasting', label: 'Spellcasting', kind: 'role' },
  { id: 'defense', label: 'Defense', kind: 'role' },
  { id: 'support', label: 'Support', kind: 'role' },
  { id: 'control', label: 'Control', kind: 'role' },
];

/* ------------------------------------------------------------- the shelves *
 * The chooser wall is cut by the attribute a set is built on, because that is
 * the first question anybody asks of it: my 6 is in Physique, so what does a 6
 * in Physique buy me. Three shelves are the three attributes, in the order the
 * whole sheet prints them, and the fourth is every set that leans on neither.
 *
 * The three read their label and their line off attributes.js, so a recolour or
 * a reword of what an attribute buys is made once and shows up here. `Other` has
 * no attribute to read, and its line says what lands there: the Draconic Bond,
 * whose ally is a stat block that grows on level alone.
 *
 * A set's shelf is its `stat` and nothing else, which is why that field is worth
 * having beside the tag that says the same thing — see the note on Guardian for
 * the one set whose shelf is not the attribute its cards roll.
 */
export const TALENT_CATEGORIES = [
  ...ATTRIBUTES.map(({ key, label, buys }) => ({ id: key, label, note: buys })),
  {
    id: 'other',
    label: 'Other',
    note: 'Scaled on your level, or on nothing you raise.',
  },
];

const OTHER_CATEGORY = TALENT_CATEGORIES[TALENT_CATEGORIES.length - 1];

/* ------------------------------------------------------------- the codex */

const TALENT_SETS = [
  {
    id: 'guardian',
    name: 'Guardian',
    tagline: 'A bulwark who turns an enemy’s strength into an opening.',
    art: '/talents/guardian.jpg',
    /* Physique, and every card below still rolls Instinct. Ruled by Jules on
       2026-08-23: a Guardian is built on the body that holds the shield up, so
       Physique is the attribute somebody choosing this set is choosing it *for*,
       and the Physique shelf is where they will look for it.

       The Instinct on the cards is a different question and is untouched. The
       contest SHIELD EXPERTISE gives advantage on is an Instinct contest because
       that is what the sheet prints, and a card's own `stat` is what it rolls —
       so the set's `stat` is the shelf and never the roll. These are the only two
       that disagree, which is exactly why both fields exist. */
    tags: ['physique', 'martial', 'defense', 'support'],
    stat: 'physique',
    /* SHIELD EXPERTISE has promised Martial Moves since the set was written, and
       until the move codex existed there was nothing for it to promise. Now there
       is (martial.js), so the promise is a spec: "a number of Novice Martial Moves
       equal to 1 + your Rank in Guardian", and "at Rank 2, you can learn Adept
       Martial Moves, and at Rank 3, you gain access to Master Martial Moves" —
       both read off that card and nothing added.

       No `swap`. The Mycomancer's FUNGAL INVOCATION and the Duelist's DEXTEROUS
       both print the sentence that lets a rest re-choose the hand; this card does
       not, and a rest is not the place to invent a rule a card never printed. The
       panel on the sheet still changes it at any time. Flagged in data/README.md.

       No `cast` either: nothing on this set names an attribute for its moves, so
       they print the codex's own default. */
    loadout: {
      id: 'guardian-martial-moves',
      label: 'Martial Moves',
      noun: 'martial move',
      kind: 'martial-move',
      group: 'tier',
      known: [null, 2, 3, 4],
      tiers: [null, ['Novice'], ['Novice', 'Adept'], ['Novice', 'Adept', 'Master']],
      note: 'A move waits on the tracker once you pay for it, and rides the next weapon attack you make.',
    },
    blurb:
      'The Guardian is a master of defense, a steadfast bulwark on the battlefield. Through rigorous training, they have perfected the art of using their shield not just to deflect blows but to turn an enemy’s strength against them.\n\n' +
      'They excel at absorbing devastating attacks, using their perfect form and timing to create crucial openings for themselves and their allies to strike back.\n\n' +
      'A Guardian’s presence is a source of unshakeable reassurance, turning the tide of battle by transforming an enemy’s offense into an opportunity for victory.',
    cards: [
      {
        id: 'shield-expertise',
        rank: 1,
        name: 'Shield Expertise',
        summary: 'With a shield: advantage on Instinct contests, Defense +1 and Martial Moves to learn.',
        kind: 'talent',
        tags: ['Talent', 'Guardian', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        body:
          'While wielding a weapon that includes a shield, you gain an advantage on {instinct} contested rolls {roll:instinct} and your Defense is increased by 1.\n\n' +
          'You learn a number of Novice Martial Moves equal to 1 + your Rank in Guardian.\n\n' +
          'At Rank 2, you can learn Adept Martial Moves, and at Rank 3, you gain access to Master Martial Moves.\n\n' + // text-style-ok: joins two clauses
          'After successfully blocking damage with a shield, your next weapon attack costs 1 less Action Point and can be used immediately after the block, even if you have already used a reaction to an action.',
      },
      {
        id: 'intercept',
        rank: 1,
        name: 'Intercept',
        summary: 'Take a hit meant for someone next to you, and block it for free.',
        kind: 'talent',
        tags: ['Talent', 'Guardian', 'Ability'],
        ap: 1,
        wp: 1,
        stat: 'instinct',
        /* **This card names an ability the codex no longer has.** The weapon wall
           was rebuilt on 2026-08-24 and the shield's second card went from a Block
           to a passive: "The shield give 3 Armor and 1 Defense, that is their
           special is a passive." So there is nothing left called Shield &
           One-handed Block for this to hand over free, and the same goes for
           SHIELD EXPERTISE's last sentence, which pays out "after successfully
           blocking damage with a shield".

           Left exactly as the designer wrote it rather than reworded, because what
           a Guardian gets instead is a ruling and not a transcription. Flagged in
           data/README.md. */
        body:
          'You prepare to intercept the next hit.\n\n' +
          'The next time an adjacent entity makes a successful roll to hit or is the victim of one, you can choose to take the hit instead.\n\n' +
          'If you intercept a hit that deals damage, you can use your Shield & One-handed Block ability without paying its action point cost, even if you have already used a reaction on the same action.',
      },
      {
        id: 'just-in-time',
        rank: 2,
        name: 'Just In Time',
        summary: 'Intercept for anyone you can see, moving to them as you do.',
        kind: 'talent',
        tags: ['Talent', 'Guardian', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        body:
          'You can now use {{Intercept}} on any entity you can see and could reach with a Move Action.\n\n' +
          'When you do, you move to an empty space in melee range of that entity, and the cost of {{Intercept}} is increased by 1 Action Point.\n\n' + // text-style-ok: joins two clauses
          'Additionally your Movement Speed is increased by 1.',
      },
      {
        id: 'given-opportunity',
        rank: 2,
        name: 'Given Opportunity',
        summary: 'The ally you intercepted for gets a free reaction attack.',
        kind: 'talent',
        tags: ['Talent', 'Guardian', 'Ability'],
        ap: 1,
        wp: 2,
        stat: 'instinct',
        body:
          'After you use {{Intercept}}, you can use this ability to allow the entity for which you intercepted to make a free reaction weapon attack.',
      },
      {
        id: 'bastions-fury',
        rank: 3,
        name: 'Bastion’s Fury',
        summary: 'Intercepting earns Reaction Points, and blocking feeds your next attack.',
        kind: 'talent',
        tags: ['Talent', 'Guardian', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        body:
          'Whenever you {{Intercept}} a hit, you gain 1 Reaction Point.\n\n' +
          'Whenever you block an attack, the damage of your next weapon attack is increased by the amount of damage you blocked.\n\n' +
          'Finally, your Martial Moves cost 1 less Action Point if they are used with a weapon attack whose cost has been reduced by {{Shield Expertise}}.',
      },
    ],
  },

  {
    id: 'mycomancer',
    name: 'Mycomancer',
    /* Tagline and blurb are the Overview tab's, and that tab was not in the
       2026-08-20 drop. Both still describe the cadaver economy the Ability tab
       withdrew that day — "turning the dead into power", "they turn fallen foes
       into a resource" — and neither has been rewritten here, because inventing
       replacement prose for a tab that simply did not export is how a set stops
       being the designer's. Flagged rather than fixed; see data/README.md. */
    tagline: 'A conduit of the mycelial network, turning the dead into power.',
    art: '/talents/mycomancer.jpg',
    tags: ['instinct', 'spellcasting', 'support', 'control'],
    stat: 'instinct',
    /* A set that does not only hand you cards, it hands you a *choice* of them.
       The numbers are read straight off Fungal Invocation: you know 2 + 2 x your
       rank in spells, Adept opens at Rank 2 and Master at Rank 3. Indexed by
       rank so the data stays plain, and resolved against the card codex by
       loadouts.js, which is what keeps this file a leaf. */
    loadout: {
      id: 'primal-spells',
      label: 'Primal Spells',
      noun: 'spell',
      kind: 'spell',
      /* The card said "Nature School" while the pool below was Primal, which is
         where the printed spells actually are. The 2026-08-20 sheet settled it
         in Primal's favour, in all three places the card names the school, so
         there is nothing left here to reconcile. */
      school: 'Primal',
      /* Mycelium Network: a Mycomancer casts with Instinct where the spell is
         printed for Mind. The rule belongs to the set rather than to the
         spells, because the same Primal spell in another caster's hands is
         still a Mind spell — so the swap rides along as a modifier on the
         cards this set prepares, and the codex card is never rewritten. */
      cast: 'instinct',
      known: [null, 4, 6, 8],
      tiers: [null, ['Novice'], ['Novice', 'Adept'], ['Novice', 'Adept', 'Master']],
      /* Which rests may re-prepare the hand, straight off Fungal Invocation:
         "Whenever you take a long rest, you can use your long rest action to
         change any number of learned spells." A long rest and no other — the
         short rest was withdrawn on 2026-08-20, and the swap now costs the long
         rest's action rather than riding along free. The rest window reads this
         to decide whether to offer the swap while the camp is being made, which
         is where the swap actually happens at a table. */
      swap: ['long'],
      note: 'Your long rest action can change any number of them, so nothing here is spent for good.',
    },
    blurb:
      'Mycomancers are living conduits of nature’s life and death cycle, their bodies host to a symbiotic mycelial network. This connection allows them to commune with and command the flora around them, weaving powerful spells that can either usher in renewal or accelerate decay.\n\n' +
      'They can also tap into a broader fungal web, using it to glean information from their surroundings or to establish a powerful link with their allies, bolstering their resolve and abilities. In battle, they turn fallen foes into a resource, hastening the decomposition of cadavers to cultivate vibrant patches of mushrooms. This morbid-yet-beautiful act strengthens their bond with the mycelial network, empowering their spells and ensuring that no life or death goes to waste.',
    cards: [
      {
        id: 'fungal-invocation',
        rank: 1,
        name: 'Fungal Invocation',
        summary: 'Cast Primal spells, more of them each rank and change them on a long rest.',
        kind: 'talent',
        tags: ['Talent', 'Mycomancer', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        body:
          'Your deep connection with the mycelial network lets you cast Primal Spells. You learn a number of Primal School spells equal to 2 + 2 x your Rank in Mycomancer.\n\n' +
          'Whenever you take a long rest, you can use your long rest action to change any number of learned spells.\n\n' +
          'At Rank 2, you can learn Adept Primal Spells, and at Rank 3, you gain access to Master Primal Spells.', // text-style-ok: joins two clauses
      },
      {
        id: 'mycelium-network',
        rank: 1,
        name: 'Mycelium Network',
        summary: 'Your Mycomancer spells cast off Instinct instead of Mind.',
        kind: 'talent',
        tags: ['Talent', 'Mycomancer', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        body:
          'When casting your Mycomancer spells, you use your {instinct} attribute instead of your {mind} Attribute.',
      },
      {
        id: 'fungal-bloom',
        rank: 1,
        name: 'Fungal Bloom',
        summary: 'A cloud of spores: allies inside gain Shield, enemies inside take Decay.',
        kind: 'talent',
        tags: ['Talent', 'Mycomancer', 'Ability'],
        ap: 4,
        wp: 4,
        stat: 'instinct',
        body:
          'You release a cloud of spores that affects all entities within 9 meters (30 feet).\n\n' +
          'Allies within the range of the cloud gain a shield equal to your {instinct} attribute.\n\n' +
          'Enemies within the range of the cloud take {damage:Decay} damage equal to your {instinct} attribute.',
      },
      {
        id: 'mycelial-bond',
        rank: 2,
        name: 'Mycelial Bond',
        summary: 'Bond willing allies into the network and speak to them without a word.',
        kind: 'talent',
        tags: ['Talent', 'Mycomancer', 'Ability'],
        ap: 2,
        wp: 1,
        stat: 'instinct',
        body:
          'You bond with a willing entity you can touch, making them a temporary part of the fungal network until your next long rest.\n\n' +
          'While bonded, you can communicate telepathically with all bonded entities.',
      },
      {
        id: 'sporadic-infusion',
        rank: 2,
        name: 'Sporadic Infusion',
        summary: 'A bonded ally’s next landed attack carries 4d6 + 4 x Instinct in Decay.',
        kind: 'talent',
        tags: ['Talent', 'Mycomancer', 'Ability'],
        ap: 4,
        wp: 5,
        stat: 'instinct',
        body:
          'You empower an ally through your mycelial bond, the next time this ally lands an attack they deal an additional [[4d6 + 4*stat]] in {damage:Decay} damage.',
      },
      {
        id: 'deepening-connection',
        rank: 3,
        name: 'Deepening Connection',
        summary: 'Bonds last until dismissed, capped at half your Instinct, and you can cast through one.',
        kind: 'talent',
        tags: ['Talent', 'Mycomancer', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        body:
          'Your Mycelial Bonds now last until you choose to dismiss them.\n\n' +
          'However, now the number of entities you can have bonded at the same time cannot exceed half of your {instinct} attribute.\n\n' +
          'When you cast a spell, you can choose to cast it through a Mycelial bonded ally, using them as a point of origin.',
      },
    ],
  },
  {
    id: 'cauldron-keeper',
    name: 'Cauldron Keeper',
    /* The sheet's Summary column, byte for byte. */
    tagline:
      'An opportunistic alchemist who transforms raw battlefield chaos into potent, custom brews.',
    art: '/talents/cauldron-keeper.jpg',
    /* The sheet's Tags column: "Support, Instinct". */
    tags: ['instinct', 'support'],
    stat: 'instinct',
    /* A third shape of choice, beside a fixed hand and a `loadout` of picked cards:
       this set *composes* what it plays. BREW's own text is the whole rule, and
       these are its numbers, indexed by rank so the data stays plain and resolved
       against the Ingredient codex by brews.js, which is what keeps this file a leaf.

         "At least 1 Essence, exactly 1 Catalyst, and any number of Infusions."
         "You gain access to Novice Ingredients at Rank 1, Adept Ingredients at
          Rank 2, and Master Ingredients at Rank 3."

       `essences` is the ceiling rather than the floor: one, until Improved Recipes
       at Rank 3 allows two that are not the same. The floor is always 1 and lives
       in brews.js with the rest of the configuration rule. */
    brewing: {
      id: 'brew',
      label: 'Brew',
      noun: 'Brew',
      tiers: [null, ['Novice'], ['Novice', 'Adept'], ['Novice', 'Adept', 'Master']],
      essences: [null, 1, 1, 2],
      catalysts: [null, 1, 1, 1],
      note: 'A Brew is mixed when you use it and takes effect immediately, so nothing here is chosen in advance.',
    },
    blurb:
      'The Cauldron Keeper is a master of mobile brewcraft, bearing a soul-bound Cauldron that bubbles continuously upon their back. Through deep alchemical instinct, they have perfected the art of distilling raw energy and harvested reagents on the move, turning the heat of combat into an ever-boiling laboratory.\n\n' +
      'They excel at adapting to the flow of battle, rapidly mixing volatile concoctions to address any threat. From releasing clouds of restorative vapors and protective shields to hurling corrosive, armor-melting sludges, their ability to customize Brews mid-fight leaves foes struggling to predict their next move.\n\n' +
      'A Cauldron Keeper’s presence is a source of endless adaptability, ensuring their party is never caught unprepared by turning the remnants of battle into an ever-shifting arsenal for victory.',
    cards: [
      {
        id: 'bound-cauldron',
        rank: 1,
        name: 'Bound Cauldron',
        summary: 'Summon the Cauldron or send it away.',
        kind: 'talent',
        tags: ['Cauldron keeper', 'Novice Talent', 'Ability'],
        ap: 2,
        wp: null,
        stat: 'instinct',
        /* No rider, on purpose: the sheet assumes the Cauldron is at your side
           and never checks, so using this spends the Action Points and nothing
           else. The card's own words about Summoning and Dismissing stand, and
           the table plays them. See src/lib/brews.js. */
        body:
          'You are bound to an enchanted Cauldron.\n\n' +
          'You can use this action to Summon it or Dismiss it.\n\n' +
          'While the Cauldron is Dismissed, it is kept in an extradimensional space no one can access.\n\n' +
          'While the Cauldron is present, it cannot leave your side and you are physically bound to it.\n\n' +
          'You need the Cauldron to use your ability.',
      },
      {
        id: 'brew',
        rank: 1,
        name: 'Brew',
        summary: 'Combine an Essence, a Catalyst and any Infusions, and pay for what you used.',
        kind: 'talent',
        tags: ['Cauldron keeper', 'Novice Talent', 'Ability'],
        ap: 'X',
        wp: 'X',
        stat: 'instinct',
        /* Mechanics as data, never read out of the prose: this is the card that
           raises the brewing window. Its printed cost is the sheet's own "x",
           because what a Brew costs is the sum of what went into it, and that is
           not known until it is mixed. See src/lib/brews.js. */
        opens: 'brew',
        body:
          'While your Cauldron is Summoned, you can combine Ingredients to unleash a magical effect.\n\n' +
          'You choose Ingredients from your known list in the following configuration:\n\n' +
          'At least 1 Essence, exactly 1 Catalyst and any number of Infusions.\n\n' +
          'You must pay the combined Action Point and Willpower cost of all chosen Ingredients. The resulting Brew takes effect immediately.\n\n' +
          'You gain access to Novice Ingredients at Rank 1, Adept Ingredients at Rank 2 and Master Ingredients at Rank 3.',
      },
      {
        id: 'efficient-brewing',
        rank: 2,
        name: 'Efficient Brewing',
        summary: 'Every Brew costs one Action Point less.',
        kind: 'talent',
        /* The sheet tags this "Adept Catalyst". Read as the Adept Talent instead,
           and tagged to match Improved Recipes: it carries no AP and no WP where
           every real Catalyst carries both, its text is about the Brew Action
           rather than about who a Brew reaches, and BREW needs exactly one
           Catalyst, so a Catalyst that only cut the cost would leave a Brew with
           nothing to affect. Flagged for the designer. */
        tags: ['Cauldron keeper', 'Adept Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        body:
          'You have refined your brewing process to be more economical.\n\n' +
          'The cost of your Brew Action is reduced by 1 Action Point.',
      },
      {
        id: 'improved-recipes',
        rank: 3,
        name: 'Improved Recipes',
        summary: 'Two Essences in one Brew, so long as they differ.',
        kind: 'talent',
        tags: ['Cauldron keeper', 'Master Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        body: 'When making a Brew, you can now have up to two Essences. They cannot be the same Essence.',
      },
    ],
  },

  {
    id: 'enchanter',
    name: 'Enchanter',
    /* The Overview tab did not arrive with the drop: the Ability tab and the
       Developpement Notes did, and the Overview was handed over to be written
       here. So `tagline`, `tags` and `blurb` are house-written rather than
       transcribed, and they are exported back out to
       data/Talent Set - Enchanter - Overview.csv in the sheet's own column
       order so the workbook can hold the same words. Every card below is the
       Ability tab, byte for byte. */
    tagline: 'An artisan of Willpower who turns ordinary gear into lasting wonder.',
    /* No plate yet. Paste a postimg link into the Overview tab's Image column
       and `npm run art` writes /talents/enchanter.jpg; until then the wall and
       the page draw the empty plate, the same as any card without art. */
    art: null,
    /* Written as "Support, Mind". Mind because nothing an Enchanter does is
       rolled: what an enchantment costs is Magic Burden, and how much of it a
       body can carry is Level + Mind + 10 (`magicBurdenMax` in items.js). Mind
       is what lets an Enchanter wear their own work. */
    tags: ['mind', 'support'],
    stat: 'mind',
    /* A fourth shape of choice, beside a fixed hand, a `loadout` of picked cards
       and a `brewing` spec. Ranks 2 and 3 add no cards at all: they widen what
       ENCHANTING may lay and what WIELDER OF WONDER may wear, and neither number
       can be counted off a card. Both are transcribed straight off those two
       cards, indexed by rank, so the presentation page can print a rank that
       hands out nothing new to read.

         "At Rank 1 you learn Novice enchantments, at Rank 2 you learn Adept
          enchantments, and at Rank 3 you learn Master enchantments."
         "The amount of such enchantments you can have is equal to your rank
          in enchanter."

       `supplyRate` is ENCHANTING's own 70, kept here rather than parsed back out
       of its prose the way every other number on the sheet is kept. Nothing reads
       it yet: the enchanting window the Developpement Notes ask for is unbuilt,
       and this is the one place it will look for the price. */
    enchanting: {
      id: 'enchanting',
      label: 'Enchanting',
      noun: 'enchantment',
      tiers: [null, ['Novice'], ['Novice', 'Adept'], ['Novice', 'Adept', 'Master']],
      worn: [null, 1, 2, 3],
      supplyRate: 70,
      /* How many enchantments one *item* may hold. One, until LAYERED
         ENCHANTMENT at Rank 3 makes it two. Indexed by rank like `worn` and
         `tiers`, so the shelf, the rank note and the writer all read one
         number, and the card below is the only thing that moves it.

         House-written, on Jules's instruction (2026-08-20): "an enchanter
         should not be able to add more than 1 enchant a time at novice ...
         then add a Master talent that allow to have 2 enchant on the same
         item". Flagged in data/README.md with the two card edits it came
         with. */
      perItem: [null, 1, 1, 2],
    },
    blurb:
      'The Enchanter is a master of imbuement, working their own Willpower into steel, leather and stone until it stays there. Through patient labour taken at the fire rather than in the thick of a fight, they have perfected the art of making an ordinary thing extraordinary, bought once in supplies and carried from that night onward.\n\n' +
      'They excel at arming everyone around them. From a blade that takes on Fire to a hood that answers the first clash of a fight with a Shield, what they make holds from one fight to the next, and the only price a companion pays is the Magic Burden of carrying it. And where there is no night to spare, they can push an enchantment into an item at a touch, spending their own Willpower for an hour of borrowed wonder that weighs on no one.\n\n' + // text-style-ok: joins two clauses
      'An Enchanter\u2019s presence is a source of quiet, compounding advantage, felt on everything the party carries long after the making. They are wielders of wonder themselves, and whatever they can work into a companion\u2019s gear they can bear upon their own person.',
    cards: [
      {
        id: 'enchanting',
        rank: 1,
        name: 'Enchanting',
        summary: 'Lay an enchantment on an item over a Long Rest, for 70 supplies per Magic Burden.',
        kind: 'talent',
        /* The sheet's third tag is "Long Rest" where every other set writes
           "Ability" or "Passive". It is kept, and `isPassive` in
           abilitySources.js was taught the word instead: a card that costs
           nothing and is worked at a Long Rest is not a move the quick bar can
           offer mid-fight. What it grants ("you have learned the art") is true
           of you from the moment you take it, which is what the recap means. */
        tags: ['Enchanter', 'Novice Talent', 'Long Rest'],
        ap: null,
        wp: null,
        stat: 'mind',
        /* Two house edits, on Jules's instruction (2026-08-20), and the only
           two words on this card that are not the sheet's:

           "actions" -> "action". A Long Rest buys exactly one, which is what
           the Status & Terms tab already says ("allows you to perform 1 Long
           Rest Action") and what the rest window now enforces. The plural was
           the one place on the sheet still promising two.

           The last line is new: "an item can hold one enchantment at a time".
           Rank 3's LAYERED ENCHANTMENT is what raises it, and a rule with no
           card saying it is a rule nobody can read. */
        body:
          'You have learned the art of imbuing an item with Willpower.\n\n' +
          'Whenever you take a Long Rest, you can use your Long Rest action to enchant.\n\n' +
          'Enchanting an item costs you an amount of supplies equal to 70 times the Magic Burden value of the enchantment.\n\n' +
          'At Rank 1 you learn Novice enchantments, at Rank 2 you learn Adept enchantments, and at Rank 3 you learn Master enchantments.\n\n' + // text-style-ok: joins two clauses
          'An item can hold one enchantment at a time.',
      },
      {
        id: 'ephemeral-enchantment',
        rank: 1,
        name: 'Ephemeral Enchantment',
        summary: 'Enchant an item you touch for an hour, for Willpower equal to its Magic Burden.',
        kind: 'talent',
        tags: ['Enchanter', 'Novice Talent', 'Ability'],
        ap: 3,
        /* The sheet's own "x": what it costs is the enchantment's Magic Burden,
           which is not known until one is chosen. Same shape as BREW's cost, and
           for the same reason the whole cost is worked out and paid in the window
           rather than at the chip. */
        wp: 'X',
        stat: 'mind',
        /* Mechanics as data, never read out of the prose. "You choose an
           enchantment you know" is a shelf, and this is what raises it. */
        opens: 'ephemeral',
        pays: 'window',
        body:
          'You temporarily enchant an item you can touch for the next 1 hour.\n\n' +
          'When doing so, you choose an enchantment you know, applying its effect to the wielder of the item.\n\n' +
          'Ephemeral Enchantment costs an amount of Willpower equal to the enchantment\u2019s Magic Burden.\n\n' +
          'This does not count toward the wielder\u2019s Magic Burden and makes the item Attuned to the person wielding it at the moment of enchantment.',
      },
      {
        id: 'wielder-of-wonder',
        rank: 1,
        name: 'Wielder of Wonder',
        summary: 'Enchantments apply to your own person, one for every rank you hold, and they weigh nothing.',
        kind: 'talent',
        tags: ['Enchanter', 'Novice Talent', 'Long Rest'],
        ap: null,
        wp: null,
        stat: 'mind',
        /* One house edit, on Jules's instruction (2026-08-21): the last line is
           new, and it is the ruling rather than a reading. The sheet's own
           sentence says the enchanter body "is able to withstand the power of
           enchantments onto itself" and then names no price at all, which the
           sheet had been reading as a silence to be filled the ordinary way, so
           the body slots were weighing on the Magic Burden meter. They do not.
           What is written into the body is withstood rather than carried.

           Worded out of EPHEMERAL ENCHANTMENT's own line for the same rule
           ("This does not count toward the wielder's Magic Burden"), so the set
           says its one free thing one way. `magicBurdenUsed` in items.js is
           where it is now true. */
        body:
          'The enchanter body is able to withstand the power of enchantments onto itself. Enchantments apply to your person. Choose one when becoming an enchanter, you can change it during a Long Rest. The amount of such enchantments you can have is equal to your rank in enchanter.\n\n' +
          'These do not count toward your Magic Burden.',
      },
      {
        id: 'layered-enchantment',
        rank: 3,
        name: 'Layered Enchantment',
        summary: 'An item can hold a second enchantment beside the first.',
        kind: 'talent',
        /* House-written on Jules's instruction (2026-08-20): "add a Master
           talent that allow to have 2 enchant on the same item". Not on the
           Ability tab, and exported back out to
           data/Talent Set - Enchanter - Ability.csv so the workbook can hold
           it. Named out of the set's own lexicon, the way every other card in
           it is, and its two sentences say only what the existing cards
           already imply about a second working: it is another night's labour,
           and the wielder carries both burdens.

           This is also what fills Rank 3, which until now added no card at
           all. `enchanting.perItem` is the number it moves. */
        tags: ['Enchanter', 'Master Talent', 'Long Rest'],
        ap: null,
        wp: null,
        stat: 'mind',
        body:
          'Your work no longer crowds itself out. An item you have enchanted can hold a second enchantment beside the first.\n\n' +
          'Laying it is a Long Rest action of its own, bought at the same price, and its Magic Burden is carried on top of the first one\u2019s.', // text-style-ok: joins two clauses
      },
    ],
  },

  {
    id: 'draconic-bond',
    name: 'Draconic Bond',
    /* The Overview tab did not arrive with the 2026-08-20 drop: the Ability tab
       and the Developpement Notes did, and the Overview was handed over to be
       written here. So `tagline`, `tags` and `blurb` are house-written rather
       than transcribed, and they are exported back out to
       data/Talent Set - Draconic Bond - Overview.csv in the sheet's own column
       order so the workbook can hold the same words. Every card below is the
       Ability tab, byte for byte. */
    tagline: 'A beast-bonded drifter who sends their dragon ahead and takes its wounds in its stead.',
    art: '/talents/draconic-bond.jpg',
    /* House-written with the rest of the Overview, and re-shelved on 2026-08-23.
       It read Mind, because every roll the ally makes is a Mind roll. Jules
       ruled Level instead: what a Draconic Bond actually buys is the second stat
       block below, and every number in it grows on level — 5 Health a level, a
       point of Mind every odd one and a point of Physique or Instinct every even
       one. A bonded who never raises Mind again still gets all of that. So the
       set leans on the level and lands on the Other shelf, and Mind is left to
       the cards, which roll it.

       Martial because the ally is a body on the field that attacks and, once
       Empowered, is ridden; Support for the half of the set that is spent on
       somebody else's roll (DRAGON'S FAVOR, DRACONIC MARK, taking a wound in
       its stead); Control for FRIGHTFUL ROAR. */
    tags: ['level', 'martial', 'support', 'control'],
    stat: 'level',
    /* A fifth shape of what a set can hand over, beside a fixed hand, a
       `loadout` of picked cards, a `brewing` spec and an `enchanting` one: this
       set hands over a *body*. Everything here is the Developpement Notes said
       as data, and minions.js is what resolves it — see the header there for
       why the split, and for the note's own sentences quoted in full.

       The set names its creature's tag rather than the sheet guessing at one.
       The Ability tab writes `Draconic Ally` on the four cards the creature
       plays and `Draconic Bond` on the five its bonded plays, so the split
       between the two quick bars is the designer's own column. */
    minion: {
      id: 'draconic-ally',
      label: 'Draconic Ally',
      noun: 'ally',
      kin: 'draconic beast',
      tag: 'Draconic Ally',
      /* "For this the draconic bond at level one it has 5 Physique, 4 Instinct,
         6 Mind. Every uneven level he gains 1 Mind, and every even level he
         gains 1 Physique or 1 Instinct, alternating between the two."

         The Mind is the one number here that is *not* the note's. Jules raised
         the base by one on 2026-08-20, so the ally opens on 7 rather than 6 —
         every roll it makes is a Mind roll and its Defense is its Grit, so one
         point of Mind is the whole creature a step up. The growth below is
         untouched: it is +1 at level one, not +1 a level. */
      base: { physique: 5, instinct: 4, mind: 7 },
      growth: { odd: ['mind'], even: ['physique', 'instinct'] },
      /* "The draconic ally health is 5 per level and 5 per physique." Half of
         what a character gets from each, which is the only place the two stat
         blocks part company besides Defense. */
      health: { perLevel: 5, perPhysique: 5 },
      /* "The draconic ally has a Defense equal to its Grit." */
      defense: 'grit',
      /* "If its health reach 0 it instantly is shown as dead, it cannot go in
         negative." So the bar bottoms out at nothing rather than running the
         second bar a character gets. What "dead" means for a bonded ally is
         ONE AND THE SAME's own business, and the block prints that line. */
      floor: 0,
      /* "If it would die, it instead retreats into your shadow and is unable to
         reemerge until you take a Long Rest." The long rest and no other: a
         short rest is offered nothing here because the card never printed one. */
      returns: 'long',
      down: 'Retreated into your shadow. It cannot reemerge until you take a Long Rest.',
      /* EMPOWERED BOND, at Rank 3: "its damage is Elevated by 1". Indexed by
         rank the way `loadout.known` is, so the rule is read off the card once
         and never parsed back out of its prose. */
      elevate: [null, 0, 0, 1],
      /* "You choose it scale color, Between Red (fire), Blue (Cold), White
         (lightning), Yellow (sacred), Purlple (psychic), Green (decay), for its
         type of damage."

         Not the same table as the Draconic *lineage*'s SCALE_COLOUR in
         lineages.js, which reads white as Cold, blue as Lightning and black as
         Decay. Both are the designer's, they disagree, and this one is the one
         the Draconic Bond notes print — flagged in data/README.md rather than
         quietly reconciled. */
      scales: {
        label: 'Scale colour',
        prompt: 'What colour is it, and what is its breath made of?',
        options: [
          { id: 'red', label: 'Red', damage: 'Fire' },
          { id: 'blue', label: 'Blue', damage: 'Cold' },
          { id: 'white', label: 'White', damage: 'Lightning' },
          { id: 'yellow', label: 'Yellow', damage: 'Sacred' },
          { id: 'purple', label: 'Purple', damage: 'Psychic' },
          { id: 'green', label: 'Green', damage: 'Decay' },
        ],
      },
    },
    blurb:
      'Those who take the Draconic Bond are never alone in a fight again. A draconic beast has knotted its life to theirs, and the two of them go on as one existence in two bodies: the ally spends its own Action Points and Reaction Points, draws on its bonded’s Willpower and breathes the element its scales were born in.\n\n' +
      'They excel at being in two places at once. The ally is sent ahead to bolt, to breathe and to mark, while its bonded stands where they meant to stand, and a wound the ally takes can be pulled across and borne instead. Where the two of them cannot both be, the bond carries what one of them sees to the other, and a spell the drifter casts can be thrown from where the dragon stands.\n\n' + // text-style-ok: joins two clauses
      'A Draconic Bond’s presence is a source of relentless pressure, felt from two directions at once. Grown to the size of a horse the ally is a mount as well as a weapon, and the roar it learns at the last is enough to leave a room full of enemies afraid of the pair of them.',
    cards: [
      {
        id: 'one-and-the-same',
        rank: 1,
        name: 'One and the Same',
        summary: 'A draconic ally that spends its own points, and a life knotted to yours.',
        kind: 'talent',
        tags: ['Draconic Bond', 'Novice Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'mind',
        body:
          'You have bonded with a draconic beast; your lives are now forever intertwined.\n\n' +
          'During your turn, you also control your draconic ally. It uses its own Action Points and Reaction Points, but uses your Willpower for its abilities.\n\n' +
          'Whenever your draconic ally takes damage, you can choose to take any amount of that damage yourself in its stead.\n\n' +
          'If it would die, it instead retreats into your shadow and is unable to reemerge until you take a Long Rest.\n\n' +
          'If you die, it dies along with you.',
      },
      {
        id: 'wyrm-bolt',
        rank: 1,
        name: 'Wyrm Bolt',
        summary: 'Your ally spits a bolt at 9 meters for 2d4 plus its own Mind.',
        kind: 'talent',
        tags: ['Draconic Ally', 'Novice Ability'],
        ap: 4,
        wp: null,
        stat: 'mind',
        /* "Mind Range Attack" on the sheet. Ranged Attack is the game's own
           defined term, printed that way on every other card the designer has
           written and on the Status & Terms tab, so the missing letter is read
           as the typo it is rather than transcribed into a term that would not
           light. Flagged in data/README.md. */
        body:
          'Your draconic ally shoots a magic projectile at an entity it can see within 9 meters (30 feet).\n\n' +
          'It makes a {stat} Ranged Attack {roll}.\n\n' +
          'On a hit, it deals [[2d4 + stat]] damage in your draconic ally’s chosen damage type.',
      },
      {
        id: 'dragons-favor',
        rank: 1,
        name: 'Dragon’s Favor',
        summary: 'Turn a roll that fell one short into a success, for either of you.',
        kind: 'talent',
        tags: ['Draconic Ally', 'Novice Ability'],
        ap: null,
        wp: 1,
        stat: 'mind',
        body:
          'Whenever you or your draconic ally make a roll and the result is 1 away from a success or Critical success, you can use this ability to add +1 to the roll and make it a success or Critical success.',
      },
      {
        id: 'draconic-recall',
        rank: 1,
        name: 'Draconic Recall',
        summary: 'Hide your ally in your shadow, where nothing can touch it, and call it back out.', // text-style-ok: closes an aside
        kind: 'talent',
        tags: ['Draconic Bond', 'Novice Talent', 'Ability'],
        ap: 3,
        wp: null,
        stat: 'mind',
        body:
          'You can have your draconic ally hide in your shadow; while doing so, it is one with you and cannot be targeted or impacted.\n\n' +
          'If it is hiding in your shadow, you can use this ability to have your draconic ally emerge in a free space next to you.',
      },
      {
        id: 'draconic-mark',
        rank: 2,
        name: 'Draconic Mark',
        summary: 'Whatever your ally hurts, your next attack on it is made with advantage.',
        kind: 'talent',
        tags: ['Draconic Bond', 'Adept Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'mind',
        body:
          'Whenever your draconic ally deals damage to an enemy, it bears a Draconic Mark until your next Turn End.\n\n' +
          'The next time you make an Attack Roll against the target, you can do so with Advantage.',
      },
      {
        id: 'dragon-breath',
        rank: 2,
        name: 'Dragon Breath',
        summary: 'A 6 meter cone against Reflex for 2d4 plus twice its Mind.',
        kind: 'talent',
        tags: ['Draconic Ally', 'Adept Ability'],
        ap: 4,
        wp: 2,
        stat: 'mind',
        body:
          'Your draconic ally breathes a torrent of magical energy in front of itself, affecting all entities in a 6 meter (20 feet) cone.\n\n' +
          'It makes a {stat} roll {roll} against the entities’ Reflex.\n\n' +
          'On a success, it deals [[2d4 + 2*stat]] damage in your draconic ally’s chosen damage type.',
      },
      {
        id: 'empowered-bond',
        rank: 3,
        name: 'Empowered Bond',
        summary: 'Your ally grows to the size of a horse, carries you and Elevates its damage.',
        kind: 'talent',
        tags: ['Draconic Bond', 'Master Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'mind',
        body:
          'You empower your draconic ally, increasing its size to that of a large horse. It can be used as a mount which can carry up to 300 kg.\n\n' +
          'Its damage is Elevated by 1.',
      },
      {
        id: 'frightful-roar',
        rank: 3,
        name: 'Frightful Roar',
        summary: 'A roar heard at 18 meters that leaves enemies Frightened of the pair of you.',
        kind: 'talent',
        tags: ['Draconic Ally', 'Master Ability'],
        ap: 4,
        wp: 4,
        stat: 'mind',
        /* The sheet spells Frightened out in a parenthesis at the foot of the
           card. It is a defined term, so the definition went to keywords.js in
           the designer's own words and the gloss came off the body — the same
           trade every other term on a card has made. See the note in
           keywords.js. */
        body:
          'While Empowered, you can have your draconic ally bellow a frightening roar intimidating all enemy entities within 18 meters (60 feet) that can hear it.\n\n' +
          'It makes a {stat} roll {roll} against the entities’ Grit.\n\n' +
          'On a success, they are Frightened of you and your draconic ally for the next 2 Turns.',
      },
      {
        id: 'draconic-link',
        rank: 3,
        name: 'Draconic Link',
        summary: 'See through your ally’s senses, and cast from where it stands.',
        kind: 'talent',
        tags: ['Draconic Bond', 'Master Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'mind',
        body:
          'Your bond now allows you to see through the senses of your draconic ally by going into a trance; while doing so, you lose control of your own body.\n\n' +
          'The bond also allows you to use your spells or abilities through your draconic ally, using it as the point of origin for the spell instead of yourself.\n\n' +
          'This can be done regardless of if you are in a trance or not.',
      },
    ],
  },
  {
    id: 'trickster',
    name: 'Trickster',
    /* Same shape the Draconic Bond arrived in: the Ability tab came on
       2026-08-20 with the Developpement Notes beside it, and no Overview tab. So
       `tagline`, `tags` and `blurb` are house-written and exported back out to
       data/Talent Set - Trickster - Overview.csv in the sheet's own column order,
       so the workbook can hold the same words. Every card below is the Ability
       tab, byte for byte. */
    tagline: 'A thief who strikes from where nobody is looking and is never standing where the blow lands.',
    art: '/talents/trickster.jpg',
    /* House-written with the rest of the Overview. Instinct because every roll
       the set asks for is an Instinct roll and it leans on nothing else; Martial
       because AMBUSH and STEAL are both spent on a weapon in hand; Defense for
       DODGE, which is the only card in the codex that makes a landed attack miss;
       Control for BLIND. Support is deliberately absent: SKULK is the one card
       that reaches an ally, and one clause is not a role. */
    tags: ['instinct', 'martial', 'defense', 'control'],
    stat: 'instinct',
    /* A sixth shape of what a set can hand over, beside a fixed hand, a
       `loadout` of picked cards, a `brewing` spec, an `enchanting` one and a
       `minion`: this set hands over things that wait on your *next* weapon
       attack, and a table to steal from. Everything here is the Ability tab and
       the Developpement Notes said as data, and tricks.js is what resolves it.

       Numbers only. What a row does to the sheet is tricks.js's business, which
       is the same split minions.js keeps. */
    tricks: {
      /* THRILLED, at Rank 3: "Your Action Points and Reaction Points maximum are
         increased to 7." Indexed by rank the way the minion's `elevate` is, so
         the rule is read off the card once and never parsed back out of its
         prose. `deriveStats` reads this, which is what makes the two pools' caps
         stop being the 6 they were hardcoded to.

         Rank 1 and 2 carry 6 rather than null so the reading is always a number:
         a Trickster who is not a Master has the ceiling everybody has. */
      points: [null, 6, 6, 7],
      steal: {
        /* "Roll a d4 and choose any one effect whose value is below the number
           you rolled."

           Read as *at or below*, and that is a reading rather than the sheet's
           word. Taken literally, "below" makes a roll of 1 steal nothing and
           makes row 4 unreachable at every roll a d4 can show — and row 4 is the
           "return" the Developpement Notes name as one of the options the window
           has to offer. Deleting a row the designer wrote is the larger
           invention, so the ladder runs 1 to 4 and every roll takes something.
           Flip `reach` to 'below' and the window follows it. Flagged in
           data/README.md for a ruling. */
        die: 4,
        reach: 'at-or-below',
        /* The four rows, in the sheet's own order, carrying the numbers its
           prose spells out in words. `flat` is the multiplier on Instinct:
           "twice", "equal to", "thrice". */
        rows: [
          { value: 1, id: 'healing-tonic', name: 'Healing Tonic', does: 'heal', dice: '2d6', flat: 2 },
          { value: 2, id: 'poison', name: 'Poison', does: 'poison', flat: 1 },
          { value: 3, id: 'protective-charm', name: 'Protective Charm', does: 'shield', flat: 3 },
          { value: 4, id: 'strange-dust', name: 'Strange Dust', does: 'dust', ap: 3, refund: true },
        ],
      },
    },
    blurb:
      'A Trickster wins the fight before it is a fair one. They work from cover and from behind, at a distance where nobody thinks to look, and the first anyone knows of them is the blade already in. Every advantage they take is one they made: a target that cannot see, a guard whose attention is elsewhere, a moment nobody was watching.\n\n' + // text-style-ok: joins two clauses
      'They excel at the opening blow and at not being there for the answer. A blinded target cannot swing at what it cannot find, and a strike thrown at something that never saw it coming lands harder for it. When the answer does come they are simply not where it lands, and a stealth that failed them once can be tried again on the strength of a distraction nobody can prove they caused.\n\n' +
      'A Trickster’s presence is a source of quiet theft, felt only once it is over. Hands that pick a pocket in the middle of a fight come back with whatever was in it, and at the last they move quickly enough to spend a turn nobody else could have afforded.',
    cards: [
      {
        id: 'blind',
        rank: 1,
        name: 'Blind',
        summary: 'An Instinct roll against Grit leaves a target unable to see until its turn ends.',
        kind: 'talent',
        tags: ['Trickster', 'Novice Talent', 'Ability'],
        ap: 1,
        wp: 1,
        stat: 'instinct',
        /* The sheet spells Blinded out in a parenthesis at the foot of the card.
           It is a defined term, so the definition went to keywords.js in the
           designer's own words and the gloss came off the body — the same trade
           FRIGHTFUL ROAR made, and the one every other term on a card has made.
           See the note in keywords.js. */
        body:
          'You attempt to Blind a target you can see within 3 meters (10 feet).\n' +
          'Make an {stat} roll {roll} against the target\'s Grit.\n' +
          'On a success, the target is Blinded until its Turn End.',
      },
      {
        id: 'ambush',
        rank: 1,
        name: 'Ambush',
        summary: 'Ride a weapon attack on somebody who cannot see you: Advantage, and the damage Elevated.',
        kind: 'talent',
        tags: ['Trickster', 'Novice Talent', 'Ability'],
        ap: null,
        /* The sheet's own "x". What this costs is the base damage dice of the
           attack it rides, so the number belongs to the weapon rather than to this
           card: `ambushUse` in combatBar.js reads it off whatever is in hand and
           the chip prints it. There is only one attack it can ride, which is what
           lets it be paid for at the chip like every other card rather than inside
           a window of its own. See src/lib/tricks.js. */
        wp: 'X',
        stat: 'instinct',
        /* Mechanics as data, never read out of the prose. `opens` names what
           paying for this *does* rather than a window it raises, the same as CALL
           THE BEAST's own. */
        opens: 'ambush',
        body:
          'When making a Weapon Attack against a target that cannot see you or is afflicted with the Stunned, Grappled or Constrained status. (The cost of this ability is equal to the weapon number of base damage dice before enchant or boost)\n\n' +
          'The Weapon Attack is made with Advantage.\n\n' +
          'On a hit, the Weapon Attack is Elevated a number of times equal to the Willpower paid.',
      },
      {
        id: 'skulk',
        rank: 1,
        name: 'Skulk',
        summary: 'Hide in plain sight at 9 meters, and Hide or palm anything with Advantage.',
        kind: 'talent',
        tags: ['Trickster', 'Novice Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        body:
          'You can use the {{Hide}} action even if entities can see you, as long as you are at least 9 meters (30 feet) away from them.\n' +
          'Additionally, when you or an ally within 3 meters (10 feet) use the {{Hide}} action or make a Skill Check related to sleight of hand or stealth, they do so with Advantage.',
      },
      {
        id: 'dodge',
        rank: 2,
        name: 'Dodge',
        summary: 'Beat the roll that just hit you and the attack misses instead.',
        kind: 'talent',
        tags: ['Trickster', 'Adept Talent', 'Ability'],
        ap: null,
        wp: 2,
        stat: 'instinct',
        body:
          'When an attack lands on you, you can use this ability to make an {stat} roll {roll} with a difficulty rating equal to the attack roll that hit you. On a success, the attack misses instead.',
      },
      {
        id: 'distract',
        rank: 2,
        name: 'Distract',
        summary: 'A failed Hiding or Stealth check gets one retry.',
        kind: 'talent',
        tags: ['Trickster', 'Adept Talent', 'Ability'],
        ap: null,
        wp: 1,
        stat: 'instinct',
        body:
          'If you fail a Hiding or Stealth-related Skill Check, you can use Distract once to immediately retry the check.',
      },
      {
        id: 'steal',
        rank: 3,
        name: 'Steal',
        summary: 'An Instinct attack on a humanoid, a d4 and one of four things out of its pockets.',
        kind: 'talent',
        tags: ['Trickster', 'Master Talent', 'Ability'],
        ap: 2,
        wp: 1,
        stat: 'instinct',
        /* Mechanics as data. The four rows are on the set's `tricks.steal` spec
           above, and the window is where the d4 is entered and the row applied,
           which is what the Developpement Notes asked for. */
        opens: 'steal',
        body:
          'You make an Attack Roll with your {stat} Attribute {roll}. On a hit, you steal something from a humanoid. Roll a d4 and choose any one effect whose value is below the number you rolled:\n' +
          '1: Healing Tonic · Restores [[2d6 + 2*stat]] in Health.\n' +
          '2: Poison · Your next Weapon Attacks deal additional damage equal to your {stat} Attribute.\n' +
          '3: Protective Charm · Provides a Shield equal to [[3*stat]].\n' +
          '4: Strange Dust · Grants 3 Action Points for the current round and refunds the Steal Willpower cost.',
      },
      {
        id: 'thrilled',
        rank: 3,
        name: 'Thrilled',
        summary: 'Both point pools hold 7 instead of 6.',
        kind: 'talent',
        tags: ['Trickster', 'Master Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        /* The last clause is the sheet's, unfinished: "and you start with Action
           Points each turn" names no number. Transcribed as it stands rather than
           completed, and only the half that can be read is built — the two caps
           go to 7, which `tricks.points` above carries into deriveStats. A turn
           already refills Action Points to whatever the cap is, so the clause is
           either that rule restated or a number that did not export. Flagged in
           data/README.md. */
        body:
          'Your Action Points and Reaction Points maximum are increased to 7 and you start with Action Points each turn.',
      },
    ],
  },

  {
    id: 'duelist',
    name: 'Duelist',
    /* Same shape the Draconic Bond and the Trickster arrived in: the Ability tab
       came on 2026-08-20 with the Developpement Notes beside it, and no Overview
       tab. So `tagline`, `tags` and `blurb` are house-written and exported back
       out to data/Talent Set - Duelist - Overview.csv in the sheet's own column
       order, so the workbook can hold the same words. Every card below is the
       Ability tab. */
    tagline: 'A blade in one hand and nothing in the other, moving faster than the answer.',
    /* No plate yet. Null rather than a path that is not there: the tiles draw the
       picture as a CSS background and would show nothing either way, but the
       summary and the presentation page use an `img` and would show a broken one.
       Drop the overview picture into `data/Duelist/` and run `npm run art:cards`;
       it lands at public/talents/duelist.jpg, and this becomes that path. The
       fourteen Martial Moves have no plates either, and their cards already draw
       the empty art window every unpainted card in the codex draws. */
    art: null,
    /* House-written with the rest of the Overview. Instinct because everything
       the set buys is footwork and finesse and it leans on nothing else; Martial
       because all four cards are about a weapon in one hand; Defense for AGILE,
       which is the only card here that changes a number nobody is swinging.
       Control and Support are deliberately absent: the moves this set hands out
       do plenty of both, but they belong to the move codex rather than to the
       set, and a set is tagged for what it *is*. */
    tags: ['instinct', 'martial', 'defense'],
    stat: 'instinct',
    /* The pool DEXTEROUS hands over. "You learn a number of Novice Martial Moves
       equal to 2 + your Rank in Duelist" is [null, 3, 4, 5], and "at Rank 2, you
       can learn Adept Martial Moves, and at Rank 3, you gain access to Master
       Martial Moves" is the tier ladder. `swap: ['long']` is the card's own next
       sentence, word for word the one FUNGAL INVOCATION prints, so the long rest
       window offers the change as one of the actions the night buys.

       `group: 'tier'` because a move has no school and no family to wall it by:
       the tier is the only thing that sorts the pool, so the chooser cuts it
       Novice, Adept, Master instead of leaving fourteen cards under one heading
       called Unfiled. See SubSchoolWall in LoadoutPick.jsx. */
    loadout: {
      id: 'duelist-martial-moves',
      label: 'Martial Moves',
      noun: 'martial move',
      kind: 'martial-move',
      group: 'tier',
      known: [null, 3, 4, 5],
      tiers: [null, ['Novice'], ['Novice', 'Adept'], ['Novice', 'Adept', 'Master']],
      swap: ['long'],
      note: 'Your long rest action can change any number of them, and a move you pay for waits on the tracker until you swing.',
    },
    /* A seventh shape of what a set can hand over, beside a fixed hand, a
       `loadout`, a `brewing` spec, an `enchanting` one, a `minion` and the
       Trickster's `tricks`: this set changes what the *move system* lets you do,
       and it hangs three of its four cards on the weapon in your hand.

       Numbers only. What each one does to the sheet is moves.js's business, which
       is the same split minions.js and tricks.js keep. Indexed by rank the way
       `tricks.points` is, so a reading is always a number rather than sometimes
       being absent: a Rank 1 Duelist has the allowance everybody has. */
    martial: {
      /* The tags the weapon has to carry one of, off the designer's own word of
         2026-08-24: "Duelist is Finesse, Whip, Fist and polearm." It was `One-Handed`
         until the weapon wall was rebuilt around families, then Finesse and Light
         Melee, and now it is four families rather than two.

         **This is wider than it was and narrower in one place.** The Whip, the Fist
         Weapon and both Polearms come in; Melee Light and its three enchanted
         cousins go out. Two of the four are Two-Handed, which retires the reading
         that this set was ever about the empty hand: it is about the *kind* of
         weapon, and the designer has now named the kinds twice. `Whip` is a family
         tag from the same pass, for the same reason a Wand is one.

         Great Polearm is in it, since it carries `Polearm` like the other two. A
         Duelist with a siege halberd is not a thing anybody has ruled on either
         way, and the tag the designer named is the tag that answers.

         The three shielded weapons carry `Shielded` rather than their family's
         tag, so on a literal reading a Duelist holding a shield still gets none of
         this. Flagged in data/README.md for a ruling. */
      weapon: ['Finesse', 'Whip', 'Fist', 'Polearm'],
      /* One entry per card that hangs on the weapon in hand. Neither names a tag,
         so both take the set's own, which is what they always read. The list is
         the Colossus's doing: it holds cards on two different tags at once and
         needed somewhere to say which. See `grants` in moves.js. */
      grants: [
        /* DEXTEROUS: "You have advantage when using One-handed weapons", read onto
           the four families the designer named on 2026-08-24. A count rather than a
           flag because Advantage stacks (each instance is another d4), which is
           what lets the arrow on the card print a number. */
        { advantage: [null, 1, 1, 1] },
        /* AGILE: "While you have a Finesse or Light Melee weapon in hand your
           Defense is increased by 1", now read against the four families. */
        { defense: [null, 1, 1, 1] },
      ],
      /* FOLLOW UP is deliberately not here. It hangs on the same weapon, but the
         sheet does not know an attack missed and never will, so its reroll is a
         printed rule the table plays. A number nothing reads would be a promise
         this file cannot keep. */
      /* SHARP, at Rank 3: "You can now use two Martial Moves on the same Weapon
         Attack, or use one Martial Move just before a Weapon Attack reaction."
         One is what everybody who knows a move gets; this is the only thing in
         the game that moves it. */
      perAttack: [null, 1, 1, 2],
      onReaction: [null, false, false, true],
    },
    blurb:
      'A Duelist fights with one hand and keeps the other free, and the free hand is the point. Everything they have is bought with the room a single blade leaves them: the footwork to be somewhere else when the answer comes, the balance to swing again after a swing that missed and the trained manoeuvres nobody with two hands on a haft has the time for.\n\n' +
      'They excel at deciding what an exchange is about. A Martial Move is not a bigger attack, it is a chosen one: a leg opened up, a guard drawn away, a weapon on the floor. A Duelist knows more of them than anybody else does and changes them out every night, so the answer they have ready is the one this fight needs rather than the one they trained for.\n\n' +
      'A Duelist’s presence is a source of quiet pressure. Nothing they do looks like much on its own, and at the last two of those chosen strikes ride the same swing, which is where all of it stops looking like nothing.',
    cards: [
      {
        id: 'dexterous',
        rank: 1,
        name: 'Dexterous',
        summary: 'Advantage with Finesse, Whip, Fist and Polearm weapons, and the Martial Moves to use them with.',
        kind: 'talent',
        tags: ['Duelist', 'Novice Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        /* Mechanics as data: the pool is the `loadout` above and the advantage is
           `martial.advantage`, neither of them read out of this prose.

           Four spellings corrected on the way in, each so a defined term lights
           rather than sitting in the sentence as plain text: "adventage" reads
           advantage, "Martial moves" reads Martial Moves, "long rest" keeps the
           lowercase FUNGAL INVOCATION prints it in, and "rank in duelist.." ends
           on one full stop. */
        body:
          'You have advantage when using Finesse, Whip, Fist or Polearm weapons.\n\n' +
          'You learn a number of Novice Martial Moves equal to 2 + your Rank in Duelist.\n\n' +
          'Whenever you take a long rest, you can use your long rest action to change any number of learned Martial Moves.\n\n' +
          'At Rank 2, you can learn Adept Martial Moves, and at Rank 3, you gain access to Master Martial Moves.', // text-style-ok: joins two clauses
      },
      {
        id: 'agile',
        rank: 1,
        name: 'Agile',
        summary: 'A Finesse, Whip, Fist or Polearm weapon in your hand is worth 1 Defense.',
        kind: 'talent',
        tags: ['Duelist', 'Novice Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        /* The sheet's parenthesis — "(note: if you use the swap function to go to
           another non one-handed weapon you loose this bonus)" — is guidance to
           whoever builds the sheet rather than rules text, and it names the swap
           button on the Inventory tab. It says nothing the first sentence does not
           already say, so it came off the card and went into the code that honours
           it: `duelistDefense` in moves.js reads the weapon in the main hand, so
           swapping to a two-hander takes the point back on the spot. */
        body: 'While you have a Finesse, Whip, Fist or Polearm weapon in hand your Defense is increased by 1.',
      },
      {
        id: 'follow-up',
        rank: 2,
        name: 'Follow Up',
        summary: 'Your first miss each turn with one of the four Duelist weapons gets one more try.',
        kind: 'talent',
        tags: ['Duelist', 'Adept Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        /* "your fist attack" reads first, and "that miss can be re rolled once"
           reads "that misses can be rerolled once" so that reroll lights. */
        body:
          'While you have a Finesse, Whip, Fist or Polearm weapon in hand, your first attack with one each turn that misses can be rerolled once.',
      },
      {
        id: 'sharp',
        rank: 3,
        name: 'Sharp',
        summary: 'Two Martial Moves on one swing, or one laid just before a reaction attack.',
        kind: 'talent',
        tags: ['Duelist', 'Master Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        /* Mechanics as data: `martial.perAttack` and `martial.onReaction` above.

           The sheet's long parenthesis is the whole move system rather than
           anything about this card — "in general just not for this, martial move
           are activate before the attack so they show in tracker until the attack
           is made. Remove on the tracker on the attack land and when possible
           updating the attack text to say (not on the card) that this attack will
           MARTIAL MOVE NAME". It is built, in moves.js and on the three places the
           sheet prints an attack, and it is not printed here: it describes how the
           sheet works, not what this card does. */
        body:
          'You can now use two Martial Moves on the same Weapon Attack, or use one Martial Move just before a Weapon Attack reaction.',
      },
    ],
  },

  {
    id: 'feral-curse',
    name: 'Feral Curse',
    /* The same shape the Draconic Bond, the Trickster and the Duelist arrived in:
       an `Ability` tab and a `Developpement Notes` tab on 2026-08-20, no
       `Overview` tab and no picture folder. So `tagline`, `tags` and `blurb` are
       house-written and exported back out to
       data/Talent Set - Feral cursed - Overview.csv in the sheet's own column
       order, so the workbook can hold the same words.

       Unlike those three, only *half* the cards are the sheet's. The tab carries
       four Novice cards and nothing above them, and the rest was asked for in
       chat on 2026-08-20: "you are in charge of making the overview and
       extrapolating ability for the feral curse at rank 2 and 3, at rank three
       there need to be something that allow martial move as reaction to do two at
       once." So the four Rank 1 cards are transcribed and the four above them are
       house-written and marked `house: true`, the same flag the eight
       house-written Martial Moves wear in martial.js. That flag is the list of
       what to overwrite the day a sheet arrives for them.

       Every house-written name is built out of the set's own words — Feral,
       Bestial, Beast, Rage — because that is the convention the Guardian and the
       Mycomancer set, and the one thing an extrapolation must not break. Nothing
       here invents a status either: Armor, Shield, advantage, Empowered and Short
       Rest are all in the glossary already. */
    tagline: 'Half your blood traded for a beast’s hide, and not always your say in when.',
    /* No plate yet. Null rather than a path that is not there, for the reason
       given on the Duelist: the tiles draw the picture as a CSS background and
       would show nothing either way, but the summary and the presentation page
       use an `img` and would show a broken one. Drop the overview picture into
       `data/Feral cursed/` and run `npm run art:cards`. */
    art: null,
    /* House-written with the rest of the Overview. Instinct because every roll
       the set names is one: FERAL RAGE rolls it, BESTIAL SENSE is the five senses
       and both Claws & Teeth cards are Instinct attacks. Martial because the
       whole set is a weapon and the manoeuvres for it. Defense because the form
       is bought in Shield and thickened in Armor, which is the only reason a
       transformation costing half your blood is worth making. */
    tags: ['instinct', 'martial', 'defense'],
    stat: 'instinct',
    /* The pool BEAST WITHIN hands over, on the same `loadout` spec a Mycomancer's
       spells and a Duelist's moves use. "You learn a number of Novice Martial
       Moves equal to 2 + your rank in Feral Cursed" is [null, 3, 4, 5], and "at
       Rank 2, you can learn Adept Martial Moves, and at Rank 3, you gain access
       to Master Martial Moves" is the tier ladder — the same count and the same
       ladder DEXTEROUS prints, off a different set's card.

       `swap: ['long']` is the card's own next sentence, word for word the one
       DEXTEROUS and FUNGAL INVOCATION both print, so the long rest window offers
       the change as one of the actions the night buys.

       `group: 'tier'` because a move has no school and no family: the tier is the
       only thing that sorts the pool. See SubSchoolWall in LoadoutPick.jsx. */
    loadout: {
      id: 'feral-martial-moves',
      label: 'Martial Moves',
      noun: 'martial move',
      kind: 'martial-move',
      group: 'tier',
      known: [null, 3, 4, 5],
      tiers: [null, ['Novice'], ['Novice', 'Adept'], ['Novice', 'Adept', 'Master']],
      swap: ['long'],
      note: 'Used with Claws & Teeth. Your long rest action can change any number of them, and a move you pay for waits on the tracker until you swing.',
    },
    /* What this set does to the Martial Move *system*, read by moves.js. The same
       spec the Duelist carries, and deliberately so: the rule was parsed out of a
       card once and every set that moves it writes the same keys.

       `weapon: 'Natural'` is the tag Claws & Teeth carries in weapons.js, and it
       is here only so the form's advantage has something to hang on. There is no
       `defense` and no rank of permanent `advantage`: nothing in this set is
       worth anything for merely holding the weapon, which is what separates it
       from AGILE and DEXTEROUS. Everything it grants is granted by the *form*,
       and feral.js is where that is read.

       BESTIAL FRENZY, at Rank 3: "You can now use two Martial Moves on the same
       Weapon Attack, or use one Martial Move just before a Weapon Attack
       reaction." A character holding a Master Duelist and a Master Feral Cursed
       gets two and not three — `moveAllowance` takes the highest rather than
       summing, because each card raises the same allowance rather than adding one
       of its own. */
    martial: {
      weapon: 'Natural',
      perAttack: [null, 1, 1, 2],
      onReaction: [null, false, false, true],
    },
    /* A seventh shape of what a set can hand over, beside a fixed hand, a
       `loadout`, a `brewing` spec, an `enchanting` one, a `minion`, the
       Trickster's `tricks` and the Duelist's `martial`: this one hands over a
       second body that is *yours*. Not a creature standing beside you but a form
       you go into, bought with half the blood you have left.

       Numbers only, and every one of them is a card's own sentence. What they do
       to the sheet is feral.js's business, which is the same split minions.js,
       tricks.js and moves.js keep. Indexed by rank wherever a rank moves it, so a
       reading is always a number rather than sometimes being absent. */
    feral: {
      id: 'feral-form',
      label: 'Feral Form',
      noun: 'form',
      kin: 'carnivore mammal',
      /* FERAL FORM: "you lose half your current Health and gain twice as much
         Shield." A share of what you are holding and a multiple of what it cost,
         so the two halves of one sentence stay one sentence. */
      enter: { spend: 0.5, gain: 2 },
      /* "You remain in your Feral Form until all Shield is gone or you take a
         Short Rest." Both halves: `ends` is the rest, and the Shield is read off
         the character, since a form whose clock is a pool is a form the sheet can
         simply look at. */
      ends: 'short',
      /* FERAL RAGE: "make an Instinct roll with a difficulty of 8. On a failure
         the difficulty increases by 1 for your next roll. It resets to 8 on a
         transformation." The trigger — losing Health or spending Willpower — is
         printed on the card and played at the table: the sheet is told about a
         Health change and never about the reason for it, so asking for the roll
         would mean asking on every scratch. The block holds the difficulty and
         the two presses that move it. */
      rage: { base: 8, step: 1 },
      /* "While in this form you have advantage on all attack rolls and your
         Claws & Teeth attacks are Empowered by 1." The advantage is on every
         attack; the Empowered is the natural weapon's alone, so it is gated on
         that weapon's own codex tag rather than on a pair of card ids. */
      advantage: 1,
      empower: { weapon: 'Natural', label: 'Claws & Teeth', amount: 1 },
      /* "In this form you are unable to use items, non-Feral Curse abilities or
         spells." `tag` is what "Feral Curse abilities" means, and it is the set's
         own Tags column rather than a guess: every card on the tab carries it. */
      locks: { items: true, foreign: true, tag: 'Feral Curse' },
      /* BEAST AND DRIFTER, at Rank 3: the form stops locking your own abilities
         and spells away. Items stay locked, because that card keeps them locked. */
      opens: [null, null, null, { foreign: true }],
      /* FERAL HIDE, at Rank 2: "your Armor is increased by half your Instinct".
         A share of the attribute rather than a flat number, floored where it is
         worked out. Indexed by rank the way the Duelist's `martial.defense` is. */
      armor: [null, 0, 0.5, 0.5],
      /* BESTIAL SENSE, at Rank 1: "Your maximum Shield is now equal to your
         Health instead of half."

         The share of maximum Health the Shield pool ceilings at, where everybody
         else's is a half. A share and not a flat number for the same reason
         `armor` is one, and indexed by rank because that is how every other
         rider here is read, even though the card that grants it is a Novice one
         and so no rank of the set is without it.

         It belongs on the *form* spec rather than beside the card, because the
         pool it raises is the form's own clock: "you remain in your Feral Form
         until all Shield is gone." Raising the ceiling is the one thing that
         makes "gain twice as much Shield" pay twice, and it is what closes the
         biggest open question the set had. See feralShieldShare in feral.js and
         `shield_cap` in characterModel.js.

         Unlike the four Rank 1 cards around it, this sentence is not on the tab.
         It was asked for in chat on 2026-08-21: "Bestial sense passive should
         also have an effect that read Your maximum shield is now equal to your
         health instead of half." So the card is transcribed and then amended,
         which is why it carries no `house` flag but is flagged in
         data/README.md. */
      shieldShare: [null, 1, 1, 1],
      /* CALL THE BEAST, at Rank 2: the form entered on purpose rather than rolled
         for. Which ranks may, and nothing about the price — that is printed on
         the card and charged by the prompt, like every other cost on the sheet. */
      willing: [null, false, true, true],
      /* "When you become Feral Cursed, you choose a Carnivore Mammal. This beast
         represents how your ability manifests." So it is identity and not
         mechanics: no card reads it, nothing derives from it, and two Feral Cursed
         who chose a wolf and a lynx play the same set.

         Eight suggestions rather than a closed list, because the card says any
         carnivore mammal and a menu of eight would be the sheet narrowing a choice
         the card left open. The window fills the field from a press and then lets
         it be typed over. */
      beasts: {
        label: 'Your beast',
        prompt: 'What carnivore is it? Any will do. These are only the common ones.',
        options: ['Wolf', 'Bear', 'Panther', 'Hyena', 'Wolverine', 'Badger', 'Fox', 'Lynx'],
      },
    },
    blurb:
      'A Feral Cursed carries something that is not theirs and does not ask. The curse takes half the blood left in them and hands back twice as much hide, and for as long as that hide holds they are a carnivore with a drifter’s training: teeth and claws in place of a weapon, advantage on everything they swing at and no hands left for a flask or a spell.\n\n' +
      'They excel at the moment a fight turns. Losing Health or spending Willpower is what wakes the beast, so the worse an hour goes the likelier it is that something else finishes it, and holding it in gets harder every time they hold it in. The animal they chose is not decoration either: the manoeuvres they train are trained for that mouth, and they are changed out every night the way a duelist changes a guard.\n\n' + // text-style-ok: joins two clauses
      'A Feral Cursed’s presence is a source of unease that arrives before the first blow does. Nothing about them is negotiable once the hide is on, and at the last they learn to keep their own mind inside it and to land two trained strikes on a single swing, which is the point at which the curse stops being a thing that happens to them.',
    cards: [
      {
        id: 'feral-form',
        rank: 1,
        name: 'Feral Form',
        summary: 'Half your Health for twice as much Shield, and a beast until the Shield runs out.',
        kind: 'talent',
        tags: ['Feral Curse', 'Novice Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        /* Mechanics as data: the whole card is the `feral` spec above, and none of
           it is read out of this prose.

           Four reads on the way in, each so a defined term lights rather than
           sitting in the sentence as plain text: "Advantage" reads advantage, the
           glossary's own casing; "your Teeth & Claws attack are Empowered by 1"
           reads "your **Claws & Teeth** attacks", which is the weapon's name in
           the codex; and "non-freal curse abilities or spells" reads "abilities
           and spells that are not Feral Curse ones".

           Bold and not a `{{link}}`. Every other double-brace in the codex names
           a *card*, and `getCard` resolves a card id or a printed card name, so a
           link to the weapon would have been the only dead one in 252 cards. The
           weapon's own two cards are Claws - Shred and Teeth - Bite, and neither
           of them is what this sentence is about.

           Three spellings for one weapon appear on this tab — "Teeth & Claws"
           here, "Tooth & Claw" and "tooth and claw" on BEAST WITHIN — and all
           three are the codex's `Claws & Teeth`. Flagged in data/README.md. */
        body:
          'Whenever you enter your Feral Form, you lose half your current Health and gain twice as much Shield.\n\n' +
          'You remain in your Feral Form until all Shield is gone or you take a Short Rest.\n\n' +
          'While in this form you have advantage on all attack rolls and your **Claws & Teeth** attacks are Empowered by 1.\n\n' +
          'In this form you are unable to use items, or abilities and spells that are not Feral Curse ones.',
      },
      {
        id: 'feral-rage',
        rank: 1,
        name: 'Feral Rage',
        summary: 'Blood or Willpower spent is a roll against 8, and the 8 climbs every time you hold it in.',
        kind: 'talent',
        tags: ['Feral Curse', 'Novice Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        /* Mechanics as data: `feral.rage` above, and the block on the Character
           tab is where the difficulty is held and moved.

           Seven reads, all of them spelling: "loose health" reads lose Health,
           "change" reads chance, "int" reads into, "diffuclity" reads difficulty,
           "enxt" reads next, "increase" reads increases, and "It reset to 8 ona
           transformation you can choose to willingly fail the roll" is two
           sentences run together and is set as two.

           Worth noticing what the last one says: a Feral Cursed may choose to
           *fail*, and nothing on this card lets them choose to succeed. At Rank 1
           the beast can only be refused, never called, which is the hole CALL THE
           BEAST was written to fill. */
        body:
          'Whenever you lose Health or spend Willpower, you have a chance to transform into your Feral Form.\n\n' +
          'Each time, make an {stat} roll {roll} with a difficulty of 8. On a failure the difficulty increases by 1 for your next roll. It resets to 8 on a transformation.\n\n' +
          'You can choose to willingly fail the roll.',
      },
      {
        id: 'beast-within',
        rank: 1,
        name: 'Beast Within',
        summary: 'A carnivore of your choosing, its teeth and claws, and the Martial Moves for that mouth.',
        kind: 'talent',
        tags: ['Feral Curse', 'Novice Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        /* Mechanics as data: the pool is the `loadout` above and the beast is
           `feral.beasts`, neither of them read out of this prose.

           Seven reads: "whci hyou" reads "which you", "tooth and claw" and
           "Tooth & Claw" both read **Claws & Teeth**, the weapon's name in the
           codex, "your rank in Feral Cursed.." reads "your Rank in Feral Curse."
           on one full stop and in the set's own spelling off the Tags column,
           "Martial moves" reads Martial Moves, and two double spaces close up.

           The sheet's parenthesis — "(note when bestial cursed one of your weapon
           slot permanently beomce tooth and claw.)" — is guidance to whoever built
           the sheet rather than rules text, so it came off the card and went into
           the code that honours it: the set grants Claws & Teeth, so the weapon is
           on the Feral Form block and reachable whatever is in your hands. The
           permanent *slot* is not built, and is flagged in data/README.md, because
           it also contradicts this card's own next clause: a slot that always
           holds the weapon is a pair of hands that is never empty. */
        body:
          'When you become Feral Cursed, you choose a Carnivore Mammal. This beast represents how your ability manifests.\n\n' +
          'While your hands are empty, you can use the **Claws & Teeth** weapon. You learn a number of Novice Martial Moves equal to 2 + your Rank in Feral Curse, which you can use with **Claws & Teeth**.\n\n' +
          'Whenever you take a long rest, you can use your long rest action to change any number of learned Martial Moves.\n\n' +
          'At Rank 2, you can learn Adept Martial Moves, and at Rank 3, you gain access to Master Martial Moves.', // text-style-ok: joins two clauses
      },
      {
        id: 'bestial-sense',
        rank: 1,
        name: 'Bestial Sense',
        summary: 'Advantage on any Skill Check that runs through your five senses, and a Shield pool the size of your Health.',
        kind: 'talent',
        tags: ['Feral Curse', 'Novice Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        /* Two reads. The card's own *name* is misspelled on the tab — "BEATIAL
           SENSE" — and is set as Bestial Sense, which is the only name correction
           in the set and carries no risk, because the id `bestial-sense` is new
           and nothing has ever pointed at the other spelling. And "You Advantage
           on Skill Checks" reads "You have advantage on Skill Checks": the verb is
           missing, and both terms light once it is there.

           And one *addition*, which is the only one in the set: the second
           sentence is not on the tab and was asked for in chat on 2026-08-21.
           Mechanics as data, like everything else here: it is `feral.shieldShare`
           above and none of it is read out of this prose. What it answers is the
           question this set shipped with — FERAL FORM buys "twice as much Shield"
           and the ceiling on the pool used to eat exactly half of that at full
           Health — so the two cards are read together and the Novice one is where
           the ceiling moves. Flagged in data/README.md as an amendment rather
           than a transcription. */
        body:
          'You have advantage on Skill Checks related to using your 5 senses.\n\n' +
          'Your maximum Shield is now equal to your Health instead of half of it.',
      },
      {
        id: 'feral-hide',
        rank: 2,
        name: 'Feral Hide',
        house: true,
        summary: 'The hide is worth Armor as well as Shield, at half your Instinct.',
        kind: 'talent',
        tags: ['Feral Curse', 'Adept Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        /* House-written. Mechanics as data: `feral.armor` above, which
           `deriveStats` reads, so the Armor tile moves the moment the form does
           and moves back the moment the Shield runs out.

           Why Armor and not more Shield: the form's clock *is* its Shield, so a
           card granting more of it would buy a longer fight rather than a better
           one. Armor is the same effect said the other way round, since every hit
           then costs the clock less, and it is a number the sheet already knows
           how to hold. */
        body: 'While you are in your Feral Form, your Armor is increased by half your {stat}, rounded down.',
      },
      {
        id: 'call-the-beast',
        rank: 2,
        name: 'Call the Beast',
        house: true,
        summary: 'Give in on purpose: the form, with no roll and the difficulty back to 8.',
        kind: 'talent',
        tags: ['Feral Curse', 'Adept Talent', 'Ability'],
        ap: 1,
        wp: 2,
        stat: 'instinct',
        /* House-written, and the hole it fills is FERAL RAGE's: that card lets a
           Feral Cursed choose to *fail* the roll and never to pass it, so at Rank
           1 the beast can only be refused.

           The Willpower is not decoration. "Whenever you lose Health or spend
           Willpower, you have a chance to transform" is the set's own trigger, so
           paying Willpower to force what Willpower already risks is this card
           agreeing with the one above it.

           `opens: 'feral'` because entering the form is a write with two halves
           and a ceiling on one of them, so the block's own window does it rather
           than the chip: see FERAL FORM's Shield cap in data/README.md. */
        opens: 'feral',
        body:
          'You stop holding it in. You enter your Feral Form without making a Feral Rage roll, and the difficulty of your next one resets to 8.\n\n' +
          'You lose half your current Health and gain twice as much Shield, as {{Feral Form}} says.',
      },
      {
        id: 'bestial-frenzy',
        rank: 3,
        name: 'Bestial Frenzy',
        house: true,
        summary: 'Two Martial Moves on one swing, or one laid just before a reaction attack.',
        kind: 'talent',
        tags: ['Feral Curse', 'Master Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        /* House-written, and asked for by name: "at rank three there need to be
           something that allow martial move as reaction to do two at once".

           Mechanics as data: `martial.perAttack` and `martial.onReaction` above,
           which is the same pair the Duelist's SHARP writes. The text is SHARP's
           two clauses deliberately unchanged — two cards that move the same
           allowance must say it the same way, or a table reading one of them will
           think the other does something else. */
        body:
          'You can now use two Martial Moves on the same Weapon Attack, or use one Martial Move just before a Weapon Attack reaction.',
      },
      {
        id: 'beast-and-drifter',
        rank: 3,
        name: 'Beast and Drifter',
        house: true,
        summary: 'Your own abilities and spells work inside the form. Your hands still do not.',
        kind: 'talent',
        tags: ['Feral Curse', 'Master Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        /* House-written. Mechanics as data: `feral.opens` above, read by the quick
           bar.

           It answers the one sentence on FERAL FORM that costs a Feral Cursed
           most — "in this form you are unable to use items, non-Feral Curse
           abilities or spells" — and it answers two thirds of it. Items stay
           locked, because a paw is the reason they were locked and mastering a
           curse does not give you thumbs. */
        body:
          'While you are in your Feral Form you can use your own abilities and spells, whatever taught them to you.\n\n' +
          'Your hands are still a beast’s, so you remain unable to use items.',
      },
    ],
  },

  {
    id: 'berserker',
    name: 'Berserker',
    /* The eighth set, and the first to arrive as a *character sheet* rather than
       a workbook: `Hazebound - Character Sheet V4 - BERSERKER.pdf`, 2026-08-23,
       with its cards printed as pictures. It was transcribed into
       `Talent Set - Berserker.xlsx` first, in the three tabs every other set
       arrives in, and this is that workbook: the Overview below is its Summary
       and Overview columns, and every card is its Ability tab.

       What the V4 sheet needed on the way in is written out on that workbook's
       `Developpement Notes` tab, twenty rows of it, and copied into
       data/README.md because the tab itself is gitignored. Four of those rows are
       open questions and each is noted on the card it belongs to. The two
       adaptations worth knowing here: the track was four ranks and is three, and
       every "at Rank N you learn X" line is gone, because the rank is the Tags
       column and holding it is what hands the card over.

       Its Ability tab carries two columns no other set's does, both written here
       rather than by the sheet: `id`, so the ids arrived with the drop instead of
       being read off the names, and `Source`, which says `sheet` on all nine rows.
       Nothing in this set is house-written. */
    tagline: 'Willpower poured into muscle, and every trick you pull cuts the rage shorter.',
    art: '/talents/berserker.jpg',
    /* Martial, Defense and Physique are the sheet's own Tags column. Physique is
       what the rage *raises* rather than what the set rolls: nothing here is
       contested against anybody, and the two numbers the cards move are the
       Physique BERSERKER'S RAGE hands over and the Physique IGNORE PAIN
       multiplies. Defense for the half of the set spent on not being stopped:
       taking 4d6 + 4 x Physique off a hit, refusing a contest against your Reflex
       or Grit, and walking through difficult terrain. */
    tags: ['physique', 'martial', 'defense'],
    stat: 'physique',
    blurb:
      'A Berserker channels raw willpower into their own body. Entering the rage bulks the muscle, surges the strength and turns every swing into something devastating, and a seasoned one can push it far enough to shrug off wounds and refuse a hold on their mind. The price is judgment: the bloodlust paying for all of it does not care who is standing nearest.\n\n' + // text-style-ok: joins two clauses
      'The rage runs on a clock of 10 turns, and that clock is the set’s whole currency. Rampage Skills are the powerful moves the state opens up, and not one of them is bought with Willpower alone. Each takes turns off the rage feeding it, so a Berserker who spends everything at once is a Berserker whose rage is already over.\n\n' + // text-style-ok: joins two clauses
      'That makes every rank a question about pace rather than power. Going berserk is cheap and it lasts a while. Getting anything out of it means deciding which turns you are willing to burn and which ones you need to still be standing in.',
    cards: [
      {
        id: 'going-berserk',
        rank: 1,
        name: 'Going Berserk',
        summary: 'Willpower into muscle, and the state that opens the Rampage Skills.',
        kind: 'talent',
        tags: ['Berserker', 'Novice Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'physique',
        body:
          'You can channel your willpower into your body, enhancing your strength while entering an altered state of mind driven by a vicious bloodlust for violence.\n\n' +
          'While in this state, you gain access to Rampage Skills: powerful moves that shorten the duration of your rage.',
      },
      {
        id: 'berserkers-rage',
        rank: 1,
        name: 'Berserker’s Rage',
        summary: 'Ten turns of extra Physique and bigger dice, and you swing at whoever is nearest.',
        kind: 'talent',
        tags: ['Berserker', 'Novice Talent', 'Ability'],
        ap: 1,
        wp: 4,
        stat: 'physique',
        /* The clock, and it needed no adapting. "for 10 turns" is written into the
           first sentence, which is where `effectDuration` reads a duration from,
           so the rage lands on the tracker as a row of 10 and comes off a turn at
           a time. Every Rampage card below takes turns off that row by hand.

           Two open questions, both left as the sheet wrote them. The Physique is
           the first thing in the codex that would bend a stat by the rank of the
           set holding it, and every rider in riders.js is a flat number, so none
           is declared here and the line is a rule the table applies. And the
           compulsion stays prose because the sheet does not know where anybody is
           standing: it cannot tell you the nearest target is your friend. */
        body:
          'You enter a Berserker’s Rage for 10 turns.\n\n' +
          'While in this state, you gain additional {physique} equal to your Berserker Rank. Your Damage Dice are Elevated by 1.\n\n' +
          'While raging, you are compelled to make at least one melee attack per turn, prioritizing it over any other action. If no enemies are within reach, you must attack the nearest target, even if it is an ally.\n\n' +
          'If no valid targets are within reach, you must use your Action Points to move toward the nearest target.',
      },
      {
        id: 'raging-blow',
        rank: 1,
        name: 'Raging Blow',
        summary: 'One turn off the rage buys advantage and a Critical Hit at Defense by 4.',
        kind: 'talent',
        tags: ['Berserker', 'Novice Talent', 'Ability', 'Rampage'],
        ap: 0,
        wp: 1,
        stat: 'physique',
        /* `ap: 0` rather than null, and the sheet prints the 0 for the same
           reason: a blank AP on that tab is what a passive has, so a card that
           genuinely costs no Action Points has to say the nothing out loud.

           "Critical Hit" is the glossary's term. The sheet said critical strike,
           which the glossary has never had. The clause that earns it, exceeding
           Defense by 4 or more, is untouched. */
        body:
          'Using this ability reduces the remaining turns of your {{Berserker’s Rage}} by 1.\n\n' +
          'Your next melee Weapon Attack is made with advantage, and it becomes a Critical Hit if the Attack Roll exceeds the target’s Defense by 4 or more.', // text-style-ok: joins two clauses
      },
      {
        id: 'master-of-pain',
        rank: 2,
        name: 'Master of Pain',
        summary: 'Raging Blow on a Special Attack, and advantage on Reflex and Grit.',
        kind: 'talent',
        tags: ['Berserker', 'Adept Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'physique',
        /* Two reads on the way in, both on the notes tab. "Melee Weapon Special
           Attack" is the codex's Special Weapon Attack, the tag every weapon's
           second card carries, and it is already melee or ranged by the weapon
           holding it. And the sheet's "enemies make saving throws against it with
           disadvantage" is the same rule from the other side: nothing makes a
           saving throw any more, a card is either swung at Defense or contested
           against Reflex or Grit, and either way the roll is the attacker's, so
           the enemy's disadvantage is your advantage.

           The picture in data/Berserker/ is called `Master of Rage.jpg`, which is
           neither this card's name nor anything else's. The sheet prints MASTER OF
           PAIN, on this tab and in the V4 sheet's own rank list, so that is the
           name and the file is placed by an alias in pull-card-art.mjs. */
        body:
          '{{Raging Blow}} can now be used with a Special Weapon Attack.\n\n' +
          'Rolls you make against a target’s Reflex or Grit as part of a Special Weapon Attack are made with advantage.',
      },
      {
        id: 'ignore-pain',
        rank: 2,
        name: 'Ignore Pain',
        summary: 'Two turns off the rage takes 4d6 + 4 x Physique off a hit.',
        kind: 'talent',
        tags: ['Berserker', 'Adept Talent', 'Ability', 'Rampage'],
        ap: 1,
        wp: 2,
        stat: 'physique',
        /* "4d6 + Four time your Physique Attribute" on the sheet, and the same
           number written the way every other card in the codex writes one. `stat`
           and not a literal `{physique}`: this is the holder's own attribute, and
           the literal form is reserved for a target's. */
        body:
          'Using this ability reduces the remaining turns of your {{Berserker’s Rage}} by 2.\n\n' +
          'As a reaction to taking damage, you can reduce that damage by [[4d6 + 4*stat]].',
      },
      {
        id: 'unstoppable',
        rank: 3,
        name: 'Unstoppable',
        summary: 'While raging, difficult terrain costs you nothing.',
        kind: 'talent',
        tags: ['Berserker', 'Master Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'physique',
        /* A Rank 4 card on the V4 sheet, and the cap is three. Master is where a
           fourth rank's cards land, and both of the old rank's are kept as cards
           of their own so nothing the sheet named is lost. */
        body: 'While raging, you can move through difficult terrain without penalty.',
      },
      {
        id: 'rage-through',
        rank: 3,
        name: 'Rage Through',
        summary: 'Two turns off the rage: the next roll against your Reflex or Grit fails.',
        kind: 'talent',
        tags: ['Berserker', 'Master Talent', 'Ability', 'Rampage'],
        ap: 0,
        wp: 2,
        stat: 'physique',
        /* The one card the V4 track never actually handed out: its Rank 3 line
           names Ignore Pain, which Rank 2 had already granted, so the sheet never
           says where this sits. Rank 3 is the slot with the broken line, so this
           is where it goes, which leaves the track 3 Novice, 2 Adept and 4 Master.
           Adept would even that to 3, 3 and 3 and is the other defensible reading.
           Open on the notes tab.

           "You automatically succeed on your next saving throw" read from the
           defending side, the same swap MASTER OF PAIN makes on the attacking one.
           Reflex and Grit are what anything aimed at your body or your will is
           contested against, and this is the clause the overview calls refusing a
           hold on your mind. */
        body:
          'Using this ability reduces the remaining turns of your {{Berserker’s Rage}} by 2.\n\n' +
          'The next roll contested against your Reflex or Grit automatically fails.',
      },
      {
        id: 'avatar-of-carnage',
        rank: 3,
        name: 'Avatar of Carnage',
        summary: 'Once a fight, Health buys a whole turn back: 6 Action Points.',
        kind: 'talent',
        tags: ['Berserker', 'Master Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'physique',
        /* Sacrifice and not spend: Sacrifice is the glossary's word for a cost
           that ignores reduction, mitigation and prevention. Plain spending would
           be stopped by Shield and by damage reduction, this set's own IGNORE PAIN
           included, which would let a Berserker buy the Action Points for nothing.

           No `uses` rider, and that is the fourth open question. "Once per combat"
           is a count plus the boundary that refills it, and the only boundaries
           the sheet can refill on are the short rest and the long one — see
           uses.js, which will not quietly refill a thing whose refill it is not.
           So the limit is a rule the table keeps.

           The price was twice your level when the workbook was written and is 5 x
           level on the tab that arrived, which is the sheet's to set: 6 Action
           Points is the whole ceiling, and a weapon attack costs 4 of them. */
        body: 'Once per combat, you can Sacrifice Health equal to [[5*level]] to regain 6 Action Points.',
      },
      {
        id: 'reckless-violence',
        rank: 3,
        name: 'Reckless Violence',
        summary: 'Two turns off the rage for a free attack, and a free action for them if it deals nothing.',
        kind: 'talent',
        tags: ['Berserker', 'Master Talent', 'Ability', 'Rampage'],
        ap: 0,
        wp: 1,
        stat: 'physique',
        /* "Once per round" is the third open question and stands as written, for
           the reason AVATAR OF CARNAGE's does: a round is neither of the two rests
           a use limit can be refilled on. */
        body:
          'Using this ability reduces the remaining turns of your {{Berserker’s Rage}} by 2.\n\n' +
          'Your next attack costs no Action Points. However, if the attack fails to deal damage, the target may take a free action of its choice.\n\n' +
          'This ability can only be used once per round.',
      },
    ],
  },

  {
    id: 'colossus',
    name: 'Colossus',
    /* The ninth set, and it arrived the same day the Berserker did, in the same
       three tabs: `Talent Set - Colossus.xlsx`, 2026-08-23. The Overview below is
       its Summary and Overview columns and every card is its Ability tab.

       It is the Duelist's opposite number and its own overview says so, so it is
       built out of the same two specs: a `loadout` that hands over Martial Moves
       and a `martial` block that says what the move system lets this set do.
       Everything new is in the second one, and it is one thing: a set whose cards
       hang on **two different weapon tags at once**. See `grants` in moves.js.

       Its Ability tab carries the Berserker's two extra columns, `id` and
       `Source`, and this is the first set whose `Source` is not one word. Five
       cards say `sheet`. COLOSSAL FORCE and COLOSSAL GRIP say `house`, and both
       are marked below.

       The same tab's `Developpement Notes` asked for a whole weapon category to
       go with it, and it was built: four Great Weapons in weapons.js, which is
       what GIANT SLAYER and COLOSSAL GRIP are about. Without them two of these
       seven cards would name a kind of weapon nothing in the codex is.

       Those four are the **Great** tier now, in name as well as in fact. The
       weapon wall was rebuilt off the designer's own cost table on 2026-08-24 and
       they confirmed the two are the same thing: Melee Great, Great Bow, Great
       Polearm and Paired Great Weapon cost 5, 5, 5 and 6 Action Points on
       Physique, which is what the Colossal four cost. The tag pass later that day
       renamed `Colossal` to `Great` on all four, and the two cards that print the
       category print Great Weapon with it. */
    tagline: 'A weapon too big for one hand, and the training to make one swing count for everything.',
    art: '/talents/colossus.jpg',
    /* Martial and Physique are the sheet's own Tags column, and Physique earns it
       twice over: it is what somebody choosing this set is choosing it for, and it
       is what every Great Weapon is swung on. No Defense and no Control, and
       deliberately so: nothing on this track buys a number that is not on an
       attack. */
    tags: ['physique', 'martial'],
    stat: 'physique',
    /* MARTIAL TRAINING, and the same pool DEXTEROUS hands over on the same terms.
       "You learn a number of Novice Martial Moves equal to 2 + your Rank in
       Colossus" is [null, 3, 4, 5], the tier ladder is the card's own last line,
       and `swap: ['long']` is the sentence between them, word for word the one
       FUNGAL INVOCATION prints.

       `group: 'tier'` for the reason the Duelist's carries it: a move has no
       school and no family, so the tier is the only thing that sorts the pool. */
    loadout: {
      id: 'colossus-martial-moves',
      label: 'Martial Moves',
      noun: 'martial move',
      kind: 'martial-move',
      group: 'tier',
      known: [null, 3, 4, 5],
      tiers: [null, ['Novice'], ['Novice', 'Adept'], ['Novice', 'Adept', 'Master']],
      swap: ['long'],
      note: 'Your long rest action can change any number of them, and this is the set that swings them with both hands on the haft.',
    },
    /* What this set does to the move system, and what it hangs on the weapon in
       hand. Numbers here, behaviour in moves.js, indexed by rank the way the
       Duelist's is. */
    martial: {
      /* MARTIAL TRAINING's own clause, and the tag every grant below falls back to
         when it names none. It was `Two-Handed` until the weapon wall was rebuilt
         around families, and the designer moved it on 2026-08-24: "Colossus to be
         Heavy & Great Melee".

         GIANT SLAYER below names `Great`, which is not one of these two. It does
         not have to be: the four weapons whose names say Great carry `Great` as a
         second tag, and a Great Bow is a Great Weapon without being a Melee one,
         which is exactly the reach that card has always had.

         **`Great` is the old `Colossal` renamed**, in the tag pass of 2026-08-24.
         The designer's own sheet spells the category "Colosal Weapon" on two
         cards, and both of them print "Great Weapon" now: a card that named a
         category no weapon carries would be a rule a player cannot check against
         the thing in their hands. Flagged in data/README.md.

         Read as a **permission** rather than a restriction, which is the reading
         the overview takes: a Martial Move is "the trained manoeuvres nobody with
         two hands on a haft has the time for", and this is the set that buys the
         time. Nothing enforces it either way, because `canLayMove` has never asked
         what is in your hand: a move is laid before the swing and the weapon can
         still be swapped. Flagged in data/README.md. */
      weapon: ['Heavy Melee', 'Great Melee'],
      grants: [
        /* GIANT SLAYER, at Rank 1: "When you attack with a Colosal Weapon, the
           attack is made with advantage." The one grant in the codex that names a
           tag its own set's `weapon` is not, and the whole reason `grants` is a
           list rather than a block. A count and not a flag, because Advantage
           stacks and the arrow on the card prints the number. */
        { weapon: 'Great', advantage: [null, 1, 1, 1] },
        /* COLOSSAL FORCE, at Rank 2: "Your Heavy and Great Melee Weapon Attacks
           are Elevated by 1." The first thing in the codex to Elevate a swing for
           the weapon in hand rather than for something that was paid for. */
        { elevate: [null, 0, 1, 1] },
        /* PERFECT TECHNIQUE's second sentence, at Rank 3: "Each Martial Move on
           the attack Empowers its damage by 1." On the same tag as its first
           sentence, which is what makes it a Heavy or Great Melee Weapon Attack, and per
           move rather than per attack. */
        { perMove: [null, 0, 0, 1] },
      ],
      /* PERFECT TECHNIQUE's first sentence: "You can now use two Martial Moves on
         the same Heavy or Great Melee Weapon Attack." Not gated on the weapon, the same way
         SHARP is not, because a move is laid before the swing and refusing the
         second one would be refusing it against a weapon that may not be the one
         it ends up riding. */
      perAttack: [null, 1, 1, 2],
      /* PRACTICED MOVES, at Rank 2: "When you make a Weapon Attack as a reaction,
         you can use a Martial Move with it." Two ranks earlier than the Duelist's
         SHARP buys the same thing, which is the trade for buying nothing else. */
      onReaction: [null, false, true, true],
    },
    blurb:
      'A Colossus fights with both hands on the haft and asks one question of every exchange: how much can be put behind a single swing. Where a Duelist buys options with a free hand, a Colossus buys weight. The weapon is too big to be quick and too heavy to be subtle, and neither of those is a problem once the thing it lands on has stopped being one.\n\n' + // text-style-ok: joins two clauses
      'What separates a Colossus from anybody else swinging something large is the training. Martial Moves are the trained motions that ride a swing: a wound opened, a guard broken, a weapon knocked out of a hand. A Colossus learns more of them than most and rebuilds the list every night, and at the top of the track two of them ride the same blow while each one adds a die to it.\n\n' + // text-style-ok: joins two clauses
      'The set rewards patience and punishes hesitation. Almost everything a Colossus has goes into one attack a turn, and a Master holding a Great Weapon in each hand spends the whole turn on it. Get that one right and there is not much left standing to answer it.', // text-style-ok: joins two clauses
    cards: [
      {
        id: 'martial-training',
        rank: 1,
        name: 'Martial Training',
        summary: 'Martial Moves by the handful, rebuilt every night and swung with both hands.',
        kind: 'talent',
        tags: ['Colossus', 'Novice Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'physique',
        /* Mechanics as data: the pool is the `loadout` above and the weapon clause
           is `martial.weapon`, neither of them read out of this prose.

           Transcribed with nothing changed. It is DEXTEROUS's three sentences with
           the set's own name in the first and one clause added to it, and that
           clause is the difference between the two sets. */
        body:
          'You learn a number of Novice Martial Moves equal to 2 + your Rank in Colossus, and you can use them with Heavy and Great Melee Weapons.\n\n' + // text-style-ok: joins two clauses
          'Whenever you take a long rest, you can use your long rest action to change any number of learned Martial Moves.\n\n' +
          'At Rank 2, you can learn Adept Martial Moves, and at Rank 3, you gain access to Master Martial Moves.', // text-style-ok: joins two clauses
      },
      {
        id: 'giant-slayer',
        rank: 1,
        name: 'Giant Slayer',
        summary: 'Every swing of a Great Weapon is made with advantage.',
        kind: 'talent',
        tags: ['Colossus', 'Novice Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'physique',
        /* Mechanics as data: the first entry in `martial.grants` above, keyed on
           the `Great` tag, so the arrow comes off the moment the weapon is stowed.
           The designer's "Colosal Weapon" reads Great Weapon, which is what the
           four weapons carrying the tag are called since the tag pass of
           2026-08-24. Their spelling and the old tag name are both in
           data/README.md. */
        body: 'When you attack with a Great Weapon, the attack is made with advantage.',
      },
      {
        id: 'colossal-force',
        rank: 2,
        name: 'Colossal Force',
        summary: 'Both hands on the haft is worth a die size on every swing.',
        kind: 'talent',
        tags: ['Colossus', 'Adept Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'physique',
        /* `house` on the Ability tab's Source column, and the transcription changed
           nothing: it arrived as one written sentence. Mechanics as data, the
           second entry in `martial.grants`.

           Elevated and not Empowered, which the sheet already got right: the same
           dice one size up, capped at a d12. A Melee Great weapon carries
           both tags, so a Rank 2 Colossus holding one has this and GIANT SLAYER
           at once. */
        body: 'Your Heavy and Great Melee Weapon Attacks are Elevated by 1.',
      },
      {
        id: 'practiced-moves',
        rank: 2,
        name: 'Practiced Moves',
        summary: 'A Martial Move rides a reaction attack, two ranks before a Duelist gets it.',
        kind: 'talent',
        tags: ['Colossus', 'Adept Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'physique',
        /* Half of this is data and half is not, and the half that is not is the
           first of three Action Point discounts on this set. `martial.onReaction`
           carries the permission, which is the same field SHARP raises at Rank 3.

           "That Martial Move costs no Action Points" is not wired, and the reason
           is the moment it would have to be charged: a move is laid *before* the
           swing, so the sheet does not yet know whether the attack it rides will
           be a reaction. Nothing can honestly discount it at the only moment it is
           paid for. See data/README.md, where all three discounts stand together
           as rules the table keeps. */
        body:
          'When you make a Weapon Attack as a reaction, you can use a Martial Move with it, and that Martial Move costs no Action Points.', // text-style-ok: joins two clauses
      },
      {
        id: 'perfect-technique',
        rank: 3,
        name: 'Perfect Technique',
        summary: 'Two Martial Moves on one swing, and every one of them adds a die.',
        kind: 'talent',
        tags: ['Colossus', 'Master Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'physique',
        /* Both sentences are data and they are two different fields, because they
           are two different questions: `martial.perAttack` is how many may wait,
           and the `perMove` grant is what each one that waited is worth. The
           second is per move, so a Colossus who laid one gets one die and a
           Colossus who laid two gets two.

           SHARP's other half is not here. A Duelist may "use one Martial Move just
           before a Weapon Attack reaction" at Rank 3; a Colossus bought that at
           Rank 2 with PRACTICED MOVES and this card only raises the count. */
        body:
          'You can now use two Martial Moves on the same Heavy or Great Melee Weapon Attack.\n\n' +
          'Each Martial Move on the attack Empowers its damage by 1.',
      },
      {
        id: 'martial-swiftness',
        rank: 3,
        name: 'Martial Swiftness',
        summary: 'Your Martial Moves cost no Action Points at all.',
        kind: 'talent',
        tags: ['Colossus', 'Master Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'physique',
        /* The second of the three discounts, and the cleanest of them: it is not
           conditional on anything. It is still a printed rule, because the sheet
           has nowhere to print a discounted cost. The chip on the quick bar can be
           told to charge 0, but the use prompt deals the card beside the button
           and the card prints what the codex says it costs, so the two would
           disagree at the moment somebody is deciding whether to pay. A card
           printing 1 beside a button charging 0 is worse than a rule the table
           reads once. See data/README.md. */
        body: 'Your Martial Moves no longer cost Action Points.',
      },
      {
        id: 'colossal-grip',
        rank: 3,
        name: 'Colossal Grip',
        summary: 'A Great Weapon in each hand, and every Great swing is a point cheaper.',
        kind: 'talent',
        tags: ['Colossus', 'Master Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'physique',
        /* `house` on the Source column, and the card the transcription had to work
           hardest on. It arrived as "You can now equped Pair Two-handed  colosall
           weapon, and your Colosall weapon attack cost 1 lest Aciton Points":
           equped reads equip, Pair reads Paired, lest reads less, Aciton reads
           Action, and the sentence gained the full stop it was missing. Their
           "colosall weapon" is printed Great Weapon, twice, since the tag pass of
           2026-08-24 renamed the category. Nothing about what it does was touched.

           Both halves are printed rules. The first is a gate on an *item* and the
           sheet has never had one: nothing stops anybody equipping Paired Great
           Weapons, the same way nothing stops a wizard putting on full plate. The
           second is the third Action Point discount, and it is refused for the
           reason MARTIAL SWIFTNESS's is.

           What is real is the weapons themselves. Paired Great Weapons are in
           weapons.js and weigh 16 kg, which is most of what a Physique 4 character
           can carry and the reason this is a Master card. */
        body:
          'You can now equip Paired Great Weapons, and your Great Weapon Attacks cost 1 less Action Point.', // text-style-ok: joins two clauses
      },
    ],
  },
  {
    id: 'arcanist',
    name: 'Arcanist',
    /* The eleventh set, from `Talent Set - Arcanist - Ability.csv`, 2026-08-24, and
       the first caster on the wall whose spells are not a *hand*.

       Every other choosing set prepares: a Mycomancer knows four Primal spells,
       swaps any number of them at a long rest and is never allowed a fifth. An
       Arcanist keeps a **library**. Spells go in one at a time, they stay in, and
       the ceiling is a formula off rank and level rather than a number per rank.
       That is the whole reason `capacity`, `start` and `research` exist on a
       loadout spec at all. See loadouts.js.

       ---------------------------------------------------------- the older draft
       `data/Conversion/Talent Set - Arcanist.xlsx` (2026-08-23) is a six-card
       proposal off the PDF: SPELLBOOK, TRANSCRIBING, IMPROVED FORMULAS, ARCANE
       SPECIALIST, ANALYTIC SIGHT and ARCHMAGI, with a cap of Mind + level and a
       24-hour transcription taken two hours at a time. **It is superseded** and
       none of it is built. The four-card sheet above is a day newer, the five
       pictures in `data/Arcanist/` are drawn for those four cards and the set
       plate, and the xlsx's own Special Feature tab called the half-transcribed
       spell "a progress bar the site has nowhere for". The new sheet deletes it:
       research is one long rest action that finishes in that rest, which the site
       already has a slot for. The proposal is logged in data/README.md rather than
       thrown away, because its Overview tab is where the fantasy below comes from. */
    tagline: 'A book bound to a life, and every spell in it was copied out by hand.',
    art: '/talents/arcanist.jpg',
    /* Mind, Support and Control are the superseded sheet's own Tags column, and
       they still fit a set whose reach is whatever it has written down. The
       fourth is added here: `spellcasting`, which is the role this whole track is,
       and a caster missing off the casting shelf would be a hole in the filter
       rather than a judgement. Flagged in data/README.md. */
    tags: ['mind', 'spellcasting', 'support', 'control'],
    stat: 'mind',
    /* ARCANE RESEARCH, as data. Four things here are new and each one is a
       sentence of that card:

         `start`      "You start with 5 Novice Spells of your choice from any
                      school". The free grant, and the only spells that arrive
                      without a rest.
         `capacity`   "a number of spells equal to your Rank in Arcanist
                      multiplied by 10 + your level", read as (rank x 10) + level.
                      Flagged in data/README.md.
         `research`   "Whenever you take a Long Rest you can take the Arcane
                      Research action and research a single spell". One spell, one
                      rest, where every other set's `swap` is any number.
         no `school`  "from any school". The first spec in the codex to name none,
                      which is a bigger change than it looks: see the tier gate in
                      loadouts.js.

       No `cast`. A spell is printed for Mind and an Arcanist casts on Mind, so
       there is nothing to override. The Mycomancer's `cast: 'instinct'` exists
       because that set rolls a spell on an attribute it was not written for.

       `tiers` is the ladder every casting set has, and this is the one card in the
       codex that does not print it. ARCANE RESEARCH says "research a single
       spell" and names no tier at all, so a literal reading lets a Rank 1
       Arcanist research a Master spell on the first night. The ladder is the
       reading that makes the rest of the codex work, and it is what the
       superseded sheet's TRANSCRIBING spelled out in as many words. Flagged in
       data/README.md. */
    loadout: {
      id: 'arcanist-spellbook',
      label: 'Spellbook',
      noun: 'spell',
      kind: 'spell',
      /* Cut by school, because that is the only question worth asking of a pool
         this set does not narrow: fifty-odd spells across Primal and Elemental,
         and a reader wants one shelf of it at a time. Every other spec groups by
         sub-school, which is the right cut when the school is already fixed. */
      group: 'school',
      start: 5,
      capacity: { perRank: 10, perLevel: 1 },
      tiers: [null, ['Novice'], ['Novice', 'Adept'], ['Novice', 'Adept', 'Master']],
      research: ['long'],
      /* OVERLOAD, at Rank 2, on the cards this set hands out rather than on the
         set: "All spells from your spellbook are Empowered and you have Advantage
         when rolling for those spells." Empowered is one more die of the same
         kind (see cardText.js), and the advantage is a count rather than a flag
         for the reason GIANT SLAYER's is: advantage stacks and the arrow prints
         the number. Both ride the prepared card, so a spell in the book shows the
         numbers this Arcanist actually rolls. */
      boost: {
        /* The card the arrow in a spell's corner names, so a reader with two
           sources of advantage can tell which one comes off. */
        from: 'Overload',
        empower: [null, 0, 1, 1],
        advantage: [null, 0, 1, 1],
      },
      /* PERFECT CASTING, at Rank 3, and the same shape running the other way:
         "Spells from your spellbook cost 1 less Action Point to cast, to a minimum
         of 1." Indexed by rank like the boost, and carrying its own floor because
         the card prints one.

         The cut rides the prepared card rather than the finished number, because
         every spell in the book prints a different cost for it to come off. It is
         resolved in cardCost in cardText.js, which is the only place a printed cost
         and a rider that cuts it are read together, and drawn as the old number
         struck through beside the orb wherever that cost appears: the card, the
         brief, the quick-bar chip and the button that charges it. */
      discount: {
        from: 'Perfect Casting',
        ap: [null, 0, 0, 1],
        floor: 1,
      },
      note: 'A spell goes in and stays in. Your long rest action researches one more, and the book only replaces a spell once it is full.',
    },
    /* SPELLBOOK's last sentence, which is the one number on this track that is not
       about spells: "Your spellbook grants you 4 Additional Willpower per Rank in
       Arcanist." Read by spellbook.js and summed into both places a Willpower
       maximum is worked out. */
    spellbook: {
      willpower: 4,
    },
    blurb:
      'An Arcanist does not know spells, they own them. The tome is bound to their being and comes when called even after it has been burned, and what it holds is exactly what has been written into it. Nothing arrives by revelation. A spell is found in somebody else’s book or taught by somebody who already has it, and then it is copied out by hand at the fire, one night’s work at a time.\n\n' + // text-style-ok: joins two clauses
      'They excel at breadth. Where another caster carries the handful their talent gave them and trades one away when the morning asks a different question, an Arcanist carries everything they have ever written down. No school is closed to them and nothing is ever given back. Given enough nights and enough books worth stealing from, the tome ends up holding more magic than any one caster was ever meant to have.\n\n' + // text-style-ok: joins two clauses
      'The book has to be held open and read aloud, which costs a hand and a voice. An Arcanist who can spare neither is a scholar standing in a fight with nothing to say. That is the whole bargain, and it is a good one: everything they have is on the page, the page is always with them, and what is written there only ever grows.', // text-style-ok: joins two clauses
    cards: [
      {
        id: 'spellbook',
        rank: 1,
        name: 'Spellbook',
        summary: 'A bound tome you summon at will, and 4 more Willpower for every rank.',
        kind: 'talent',
        tags: ['Arcanist', 'Novice Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'mind',
        /* Mechanics as data: the Willpower is `spellbook.willpower` above, times
           the rank, and nothing here is read out of this prose.

           The hand and the voice stay printed rather than checked. A voice is not
           on the sheet at all, and a free hand is: `martialDefense` in moves.js
           already reads what is held. It is still prose, because the sheet has
           nowhere to refuse a *spell* for what is in your hands and inventing one
           would refuse the Mycomancer's spells too. The table plays it. Flagged in
           data/README.md.

           Three changes and no more. "As an Arcanist you record" loses its first
           three words, the way MARTIAL TRAINING is not headed "As a Colossus": the
           card is in the set, and the tag says so. The comma splice after "bound
           tome" becomes the "and" it was standing in for, and "dismiss" gets the
           "it" it was missing. "Additional" is lowercased, because the codex
           capitalises a term and this is an adjective. The middle sentence is
           untouched. */
        body:
          'You record all your spells in a bound tome, and you can summon and dismiss it at will.\n\n' + // text-style-ok: joins two clauses
          'To be able to cast spells you need to have a free hand and be able to talk.\n\n' +
          'Your spellbook grants you 4 additional Willpower per Rank in Arcanist.',
      },
      {
        id: 'arcane-research',
        rank: 1,
        name: 'Arcane Research',
        summary: 'Five Novice spells to start, and one more researched every long rest.',
        kind: 'talent',
        tags: ['Arcanist', 'Novice Talent', 'Long Rest'],
        ap: null,
        wp: null,
        stat: 'mind',
        /* Mechanics as data: the whole `loadout` above. `Long Rest` and not
           `Passive`, the same tag the Enchanter's three evening cards carry, which
           is what puts the row in the rest window.

           Two changes. "you can take the Arcane Research action" becomes "you can
           use your long rest action", which is FUNGAL INVOCATION's idiom word for
           word: the site's rest buys one action and the card should say which one
           it is spending, rather than naming itself.

           And "multiplied by 10 + your level" is written out as the arithmetic it
           resolves to, because the sheet's phrasing reads two ways and they only
           agree at Rank 1: (rank x 10) + level, which is what precedence gives.
           Flagged in data/README.md. Everything else is the cell. */
        body:
          'Spells you know to cast are recorded in your spellbook. You start with 5 Novice Spells of your choice from any school inscribed in the spellbook.\n\n' +
          'Whenever you take a long rest you can use your long rest action to research a single spell to learn, adding it to your spellbook.\n\n' +
          'Your spellbook can hold a number of spells equal to 10 x your Rank in Arcanist plus your level. If you have reached your limit of transcribed spells you will have to replace a spell.',
      },
      {
        id: 'overload',
        rank: 2,
        name: 'Overload',
        summary: 'Every spell in the book is Empowered, and rolled with advantage.',
        kind: 'talent',
        tags: ['Arcanist', 'Adept Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'mind',
        /* Mechanics as data: `loadout.boost` above, so the numbers print on the
           spells themselves rather than being remembered against them.

           The cell verbatim but for one letter. Advantage is lowercased: the codex
           capitalises Empowered because it is a term off the Status & Terms sheet,
           and writes "made with advantage" in prose everywhere else. See RAGING
           BLOW. */
        body:
          'All spells from your spellbook are Empowered and you have advantage when rolling for those spells.',
      },
      {
        id: 'perfect-casting',
        rank: 3,
        name: 'Perfect Casting',
        summary: 'Every spell in the book costs 1 less Action Point, never below 1.',
        kind: 'talent',
        tags: ['Arcanist', 'Master Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'mind',
        /* Two readings on the way in.

           The sheet tags this `Long Rest`, which is ARCANE RESEARCH's tag two rows
           above it and cannot be this card's: nothing here is done at a rest. Read
           as `Passive`, which is what OVERLOAD beside it carries and what the
           superseded sheet's IMPROVED FORMULAS carried for the same sentence.
           Flagged in data/README.md.

           And the discount is **wired**, which reverses the standing ruling that
           every card cutting another card's Action Point cost stays prose. That
           ruling was never about the arithmetic: it was that `UsePrompt` deals the
           codex card beside the pay button, so a button charging 3 next to a card
           printing 4 reads as a bug at the exact moment somebody is deciding
           whether to pay. Being the fifth card on that line, after the Berserker's
           RECKLESS VIOLENCE and the Colossus's MARTIAL SWIFTNESS, PRACTICED MOVES
           and COLOSSAL GRIP, is what bought the place to print a discounted cost:
           the orb shows what is paid and strikes through what was printed, on the
           card and on the button alike, so the two can no longer disagree.

           Asked for outright, 2026-08-24: "The cost of spell shoud visible be
           reduced when yo utry to cast arcanist spell at master, same fro all
           acarnist effect."

           The other four stay in prose, and it is not the same call twice. They sit
           on sets that hand out no pool, so there is nothing of theirs riding the
           cards they discount: RECKLESS VIOLENCE cuts a Berserker's own attacks,
           which arrive off a weapon and not out of a spec. The rider they need is a
           different one. Flagged in data/README.md.

           "cannot bring the spell below 1" is written as the floor it is, in the
           words the designer used for the same rule on the superseded sheet: "to a
           minimum of 1". */
        body:
          'Spells from your spellbook cost 1 less Action Point to cast, to a minimum of 1.',
      },
    ],
  },
  {
    id: 'alchemist',
    name: 'Alchemist',
    /* The twelfth set, converted 2026-08-24 out of the pile rather than off a
       workbook. Three sources and no Ability tab anywhere:

         data/Source Temp/Hazebound/Tables/Alchemist - Potions.xlsx
           8 Novice potions, with a Willpower cost, an Improvised Brewing dice
           combination and full effect text for each.
         data/Source Temp/.../Skillsets/Alchemist/*.jpg
           three card renders, which is where every word of ALCHEMY,
           ALCHEMICAL INGREDIENTS and IMPROVISED BREWING comes from.
         data/Conversion/General Items.xlsx
           the 2026-08-23 pass, which converted the potion table as consumables
           and explicitly did **not** build the set: "the Alchemist is the
           Cauldron Keeper on the site already". Jules reversed that call on
           2026-08-24 and asked for both, so the potions are items *and* this is
           a set. The two sit on different shelves, which is what the roster
           itself says: Cauldron Keeper on Instinct, Alchemist on Mind.

       ------------------------------------------------------ the empty ranks
       The source is **Rank 1 only**. There is no Rank 2, 3, 4 or 5 card for the
       Alchemist anywhere in the pile, and the potions table is titled Novice.
       So the three Novice cards are transcribed and the two above them are
       house-written, in the set's own lexicon, each doing one thing this sheet
       can actually honour. Both are flagged in data/README.md and exported to
       data/templates/alchemist-ability.csv marked `house`. */
    tagline: 'A still, a crate of components and a night at the fire. Whatever tomorrow needs, bottled.',
    /* No plate yet. Drop pictures into data/Alchemist/ and run `npm run art`. */
    art: null,
    /* Mind is the roster’s column. Support and Control are this file’s reading of
       seven cards: five of the seven potions hand somebody a number they did not
       have, and the other two are a burning patch of ground and an hour of being
       trusted. No `spellcasting`: nothing here is cast, and the whole point of a
       flask is that it works in a hand that has never cast anything. */
    tags: ['mind', 'support', 'control'],
    stat: 'mind',
    /* ALCHEMY, as data. The sixth shape of spec in the codex and the first whose
       output is an **item**: a hand and a library pick cards (loadouts.js), a Brew
       composes one and throws it away (brews.js), a working becomes a rider on
       something you own (enchanting.js), and this fills the pack.

         `tiers`     "you have learned to brew all Novice Potions", read as the
                     ladder every other tiered set prints. The codex holds no
                     Adept or Master potion yet, so Ranks 2 and 3 open nothing
                     today and will the day one is written. Flagged.
         `perRest`   "during a long rest, you can craft two potions while still
                     benefiting from a long rest", and REFINED REAGENTS makes it
                     three. Brews a night, never flasks.
         `discount`  REFINED REAGENTS again, and `floor` is its own "to a minimum
                     of 10". Rank 3 still carries it, because ranks stack.
         `batch`     TWIN DISTILLATION: one brew, two flasks.
         `brew`      which rest offers it, the same shape `swap` and `research`
                     carry on a loadout. A short rest names none of this.

       What a potion costs is on the potion (utility.js), never here, so a row the
       designer reprices stays repriced. See alchemy.js for where those numbers
       came from and why the old table’s Willpower is not charged. */
    alchemy: {
      id: 'alchemy',
      label: 'Alchemy',
      noun: 'potion',
      tiers: [null, ['Novice'], ['Novice', 'Adept'], ['Novice', 'Adept', 'Master']],
      perRest: [null, 2, 3, 3],
      discount: [null, 0, 10, 10],
      floor: 10,
      batch: [null, 1, 1, 2],
      brew: ['long'],
      note: 'Brewed at the fire and carried away. Your long rest action buys the night’s batch, and the crate pays for the components.',
    },
    blurb:
      'An Alchemist does not cast. They distil. Every ingredient in the world carries an element that people have always read into it, and alchemy is the patience to draw that element back out of a feather or a pepper and hold it in glass. What comes out of the still is not a spell, and it does not need them standing there when it is drunk.\n\n' + // text-style-ok: joins two clauses
      'They excel at arriving prepared. Their work is done the night before, out of the same crate the whole party travels on, and the morning is when it gets handed round. A flask of borrowed Physique, a draught that closes a wound, a clay bottle that puts a burning patch of ground between the party and whatever is coming: none of it asks for Willpower at the moment it matters, because all of it was paid for hours ago.\n\n' + // text-style-ok: joins two clauses
      'An Alchemist’s presence is felt in what everybody else is carrying. Pressed with no night to spare, they can still brew out of whatever the ground around the camp gave up, and what that produces is real enough to save a life and gone by nightfall.', // text-style-ok: joins two clauses
    cards: [
      {
        id: 'alchemy',
        rank: 1,
        name: 'Alchemy',
        summary: 'Two Novice potions on a long rest, paid for out of the crate.',
        kind: 'talent',
        tags: ['Alchemist', 'Novice Talent', 'Long Rest'],
        ap: null,
        wp: null,
        stat: 'mind',
        /* Mechanics as data: the whole `alchemy` spec above. `Long Rest` and not
           `Passive`, the same tag ENCHANTING and ARCANE RESEARCH carry, which is
           what puts the row in the rest window.

           Three changes on the way in.

           The render is headed "Rank 1 - Novice Alchemist" and the card is called
           Alchemy, off its own first word. A card never names its own rank on this
           site: the Tags column carries it.

           "during a long rest, you can craft two potions while still benefiting
           from a long rest" becomes "whenever you take a long rest you can use
           your long rest action to brew two of them and still benefit from the
           rest". A rest here buys exactly one action and a card that spends it
           should say which one it is spending, which is FUNGAL INVOCATION’s idiom
           and ARCANE RESEARCH’s.

           "you need to have the required components and willpower available" is
           the sentence Jules asked to be converted, and the components are now
           priced in Supplies. The Willpower half is not charged: brewing happens
           inside a long rest and a long rest ends by filling Willpower, so it is a
           price nobody would ever pay. See alchemy.js, and data/README.md.

           The last line of the render, "You learn the Alchemical Ingredients and
           Improvised Brewing abilities", is dropped. Both are Novice Alchemist
           cards on this same rank, so the sentence hands over what the set has
           already handed over. */
        body:
          'Alchemy is the art of harnessing the elements and blending them with willpower to create a liquid with magical properties.\n\n' +
          'You have learned to brew all Novice Potions. Brewing a potion takes 1 hour, and whenever you take a long rest you can use your long rest action to brew two of them and still benefit from the rest.\n\n' + // text-style-ok: joins two clauses
          'To brew a potion you need its components. Every recipe prints what those cost in Supplies, and they come out of the crate on the night you brew it.',
      },
      {
        id: 'alchemical-ingredients',
        rank: 1,
        name: 'Alchemical Ingredients',
        summary: 'What an ingredient is worth is the element people read into it.',
        kind: 'talent',
        tags: ['Alchemist', 'Novice Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'mind',
        /* The render is tagged "Self / Alchemist Ability / n/a", which is a card
           with no cost, no target and no clock: a Passive, which is what this site
           calls that.

           Two changes. "feathers are associated with winds" becomes Wind, which is
           the name of that family everywhere in the codex, and it puts all four of
           IMPROVISED BREWING’s dice on words the site already uses.

           And the last paragraph is the coin sentence, converted. It read "when a
           recipe asks for 1000 coins' worth of Fire ingredients, this could be 100
           spicy peppers or a dragon flower". A recipe on this site asks in Supplies,
           so the example is priced in Supplies and the rest of the sentence is his. */
        body:
          'In alchemy the ingredient itself is not important, but rather the element that people associate with it. Alchemy is the process of distilling that elemental essence out of the ingredient to then combine them to create potions.\n\n' +
          'Determining an ingredient’s element is related to the perceived association. For example, feathers are associated with Wind, while spicy peppers are associated with Fire and Earth.\n\n' +
          'A recipe asks for its components in Supplies, and what you hand over for them is yours to picture: 20 Supplies of Fire could be a hundred spicy peppers or a single dragon flower.',
      },
      {
        id: 'improvised-brewing',
        rank: 1,
        name: 'Improvised Brewing',
        summary: 'Brew out of what the camp gave up for no Supplies, and drink it before the day is out.',
        kind: 'talent',
        tags: ['Alchemist', 'Novice Talent', 'Long Rest'],
        ap: null,
        wp: null,
        stat: 'mind',
        /* **Printed and not wired**, and the only card in this set that is. The
           rest window offers ALCHEMY and does not offer this, for two reasons that
           are both about what the sheet does not hold:

             it expires at the end of the day, and this site has no day. It has
             rests, and an item in the pack with no instance of its own for a state
             to live on (see forged.js: "nothing mechanical is stored").

             which means wiring it would hand over free potions that never spoil,
             and the spoiling is the whole reason they are free.

           So the card carries its own rule and the table plays it, the same way
           SPELLBOOK’s free hand and voice are played. Flagged in data/README.md as
           an open question. Every recipe still carries its dice on the shelf, so
           the combination the card sends you looking for is there to read.

           Two changes on the way in. "a number of d4s equal to half your power" is
           written out: old Power was the attribute plus the level, this site has no
           such number, and the conversion key says every "your power" becomes a die
           count and an attribute multiple. Halving the sum is what it resolves to.

           And "you still have to spend the required Willpower" becomes "costs no
           Supplies", which is the same sentence in the currency this pass moved the
           price into: improvised brewing is the path that skips the components, and
           the components are what Supplies now are. */
        body:
          'After you finish a long rest, you can brew potions through improvised brewing: ingredients you scavenged during your rest, infused heavily with willpower to make them viable.\n\n' +
          'To find what you gathered, you roll a number of d4s equal to your {mind} plus your level, halved and rounded down, and note every value. Each die is one component: 1 is Earth, 2 is Water, 3 is Fire and 4 is Wind.\n\n' + // text-style-ok: joins two clauses
          'Every recipe prints the combination of dice needed to craft it without having the exact ingredients, and a potion brewed this way costs no Supplies. It expires at the end of the day.\n\n' + // text-style-ok: joins two clauses
          'Instead of rolling, you can also choose to redo the exact same batch as the last one you did.',
      },
      {
        id: 'refined-reagents',
        rank: 2,
        name: 'Refined Reagents',
        summary: 'Three potions a night, and every one of them 10 Supplies cheaper.',
        kind: 'talent',
        tags: ['Alchemist', 'Adept Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'mind',
        /* **House-written.** The source has no Adept card, because it has no rank
           above 1 at all. Both numbers here are the two ALCHEMY already prints,
           moved: the count of brews and the price of one. Nothing new is invented
           for the sheet to hold, which is the whole test a house card has to pass.

           The discount reads the way PERFECT CASTING’s does, floor and all, because
           that is the shape this codex settled on for a cost cut that rides a pool
           the set hands out. See alchemy.js and data/README.md. */
        body:
          'Nothing you distil is wasted. You brew three potions on a long rest rather than two, and every potion you brew costs 10 fewer Supplies, to a minimum of 10.\n\n' + // text-style-ok: joins two clauses
          'Adept Potions are within your reach.',
      },
      {
        id: 'twin-distillation',
        rank: 3,
        name: 'Twin Distillation',
        summary: 'Every potion you brew comes out of the still twice.',
        kind: 'talent',
        tags: ['Alchemist', 'Master Talent', 'Passive'],
        ap: null,
        wp: null,
        stat: 'mind',
        /* **House-written**, for the same empty rank. A third card raising the
           count would have been the Adept card twice, so this doubles the output of
           a night instead of lengthening it: three brews and six flasks, at three
           prices. `batch` in the spec above is the whole of it. */
        body:
          'Your still runs true enough to fill a second flask off the same working. Every potion you brew comes out of it twice, and you keep both.\n\n' + // text-style-ok: joins two clauses
          'Master Potions are within your reach.',
      },
    ],
  },
];

/* ------------------------------------------------------------- the roster *
 * Twenty-three sets that have a name and nothing else.
 *
 * The designer keeps a roster of every set the game is going to have, four
 * columns wide and cut by the attribute each one leans on. Eleven of them are
 * written and sit in the codex above. These are the rest, standing in the codex
 * as placeholders so the wall reads as the whole plan rather than as the part of
 * it that happens to be finished.
 *
 * A placeholder reserves three things and promises nothing:
 *
 *   the id     what a saved sheet, a picture folder and a card link will point
 *              at once the set exists, settled now so it never has to move.
 *   the name   as the roster spells it, with its typos corrected and nothing
 *              else touched. See the rulings in data/README.md for the two the
 *              designer settled by hand.
 *   the shelf  the column it was filed under, which is the one design fact the
 *              roster actually carries.
 *
 * Everything else is deliberately absent. No tagline of its own, no blurb of its
 * own, no cards, no loadout, no spec of any kind. A placeholder that guessed at
 * what a Painseeker does would be this file inventing the game, which is the one
 * thing it must never do: the sheet is the design, and no sheet has arrived for
 * any of these.
 *
 * `stub: true` is what says so, and it is load-bearing in exactly one place:
 * `optionsAt` refuses to let a level be spent on one, and `chooseAt` refuses it
 * again in case anything ever asks around the wall. The tile still draws, on its
 * own shelf, reading "Not written yet" where a price would be.
 *
 * The day a set's Ability tab lands, its placeholder is replaced by the real
 * entry in the codex above and its line here goes. Nothing else has to change.
 */

/** What every placeholder says about itself, in one place so it says it once. */
const STUB_TAGLINE = 'On the roster. Nothing written for it yet.';

const STUB_BLURB =
  'This set has a name and a shelf, and that is all it has. It is on the roster the designer ' +
  'keeps and no sheet has been written for it, so there are no cards here, no ranks to read ' +
  'and nothing a level can be spent on.\n\n' +
  'What is held for it is the name above, the id underneath it and the attribute it will be ' +
  'built on. Everything that makes it playable arrives with its own sheet.';

/**
 * One placeholder, in the shape a written set has and empty in every field that
 * would otherwise be a guess.
 *
 * Written as a call rather than as twenty-three literals, which is the one place
 * in this file that is not plain data. Plain data here would be the same eight
 * lines twenty-three times over, and a reader skimming for the one set they came
 * looking for would have to read all of it to be sure that none of them said
 * anything different. A call says at a glance that none of them do.
 */
function placeholder(id, name, stat) {
  return {
    id,
    name,
    stub: true,
    tagline: STUB_TAGLINE,
    /* No plate, and the same null the Duelist and the Feral Curse carry rather
       than a path to a file that is not there: the tiles draw the picture as a
       CSS background and would show nothing either way, but the summary and the
       presentation page use an `img` and would show a broken one. */
    art: null,
    /* The roster's column is the only tag that is known, and it is the attribute
       the set was filed under. No role: a role is a reading of what the cards do,
       and there are no cards. The Other column names no attribute at all, so
       those carry nothing and the filter simply never matches them. */
    tags: stat === 'other' ? [] : [stat],
    /* `other` rather than the `level` the Draconic Bond carries. Both land on the
       Other shelf, but `level` is a claim, and it is the Draconic Bond's own: an
       ally whose stat block grows on nothing but the character's level. What a
       Weaver scales on is not known, so this says only which shelf it sits on. */
    stat,
    blurb: STUB_BLURB,
    cards: [],
  };
}

/* The roster, column by column and in its own row order, so every shelf reads
   its written sets first and then the rest of that column top to bottom. */
const TALENT_PLACEHOLDERS = [
  /* Physique, rows 1, 4, 5, 7, 8 and 9. Colossus, Berserker and Guardian are
     rows 2, 3 and 6 and are written.

     `Brawlere` is read as Brawler, and `Hamoturgy` as Hemoturgy, which the
     designer settled on 2026-08-24 against Haemoturgy and Haemothurgy. Both are
     recorded in data/README.md.

     Dragon Aspect is row 9 and the Draconic Bond is not on the roster at all. It
     stays exactly where it is on the Other shelf, ruled by the designer the same
     day: three dragon-shaped entries in the codex for now, and which of them the
     Draconic Bond turns out to be is a question its own sheet will answer. */
  placeholder('brawler', 'Brawler', 'physique'),
  placeholder('runebearer', 'Runebearer', 'physique'),
  placeholder('hemoturgy', 'Hemoturgy', 'physique'),
  placeholder('totemic', 'Totemic', 'physique'),
  placeholder('painseeker', 'Painseeker', 'physique'),
  placeholder('dragon-aspect', 'Dragon Aspect', 'physique'),

  /* Instinct, rows 5 to 8. Mycomancer, Duelist, Trickster, Cauldron and Feral
     Curse are rows 1, 2, 3, 4 and 9 and are written.

     Row 4 reads `Cauldron` and the written set is the Cauldron Keeper, which is
     the name on its own Ability tab and is kept. `SharpShooter` is read as
     Sharpshooter, the way the codex writes Spellblade and Spellquill. */
  placeholder('virtuoso', 'Virtuoso', 'instinct'),
  placeholder('flowing-fist', 'Flowing Fist', 'instinct'),
  placeholder('sharpshooter', 'Sharpshooter', 'instinct'),
  placeholder('wilder', 'Wilder', 'instinct'),

  /* Mind, rows 4 to 9. Arcanist, Enchanter and Alchemist are rows 1, 2 and 3 and
     are written.

     `SpellBlade` is read as Spellblade and `Tachticain` as Tactician. Row 9 reads
     `Elemental Aspe`, which is the column cutting the cell off rather than a typo,
     and is read as Elemental Aspect: it is the pair to Dragon Aspect on the
     Physique shelf.

     `Aclhemist` was read as Alchemist and stood here as a placeholder until
     2026-08-24, when its own sheet was converted. The Alchemist and the Cauldron
     Keeper both mix things and sit on different shelves, which is the roster’s own
     arrangement and is left alone. */
  placeholder('necromancer', 'Necromancer', 'mind'),
  placeholder('spellquill', 'Spellquill', 'mind'),
  placeholder('spellblade', 'Spellblade', 'mind'),
  placeholder('thaumaturge', 'Thaumaturge', 'mind'),
  placeholder('tactician', 'Tactician', 'mind'),
  placeholder('elemental-aspect', 'Elemental Aspect', 'mind'),

  /* Other, all six rows. Nothing on this column is written, and the Draconic
     Bond above it is the only thing on the shelf that is.

     Every name here is spelled as the roster spells it. Beastbond, Oathbound and
     Pactbound are one word each on the sheet and stay one word each. */
  placeholder('beastbond', 'Beastbond', 'other'),
  placeholder('oathbound', 'Oathbound', 'other'),
  placeholder('pactbound', 'Pactbound', 'other'),
  placeholder('quartermaster', 'Quartermaster', 'other'),
  placeholder('weaver', 'Weaver', 'other'),
  placeholder('weapon-master', 'Weapon Master', 'other'),
];

/** The whole codex: the written sets, then the roster standing in for the rest. */
const TALENT_CODEX = [...TALENT_SETS, ...TALENT_PLACEHOLDERS];

/**
 * The sets as everything else sees them, with every card wearing its picture.
 *
 * The one line between the codex above and every reader of it. `withArt` puts
 * `art_url` and `art_thumb` on each card from cardArt.js, keyed by card id, and
 * a card with no picture keeps both fields as null rather than losing them —
 * which is what the plates on the sheet already draw empty. See the note at the
 * top of this file for why it happens here and not on each set by hand.
 *
 * Reads the whole codex, written sets and roster placeholders alike. A
 * placeholder holds no cards, so `withArt` is handed an empty array and hands one
 * back: there is nothing here that has to know which kind it is looking at.
 */
export const TALENTS = TALENT_CODEX.map((talent) => ({
  ...talent,
  cards: withArt(talent.cards),
}));

/* ------------------------------------------------------------------ lookups */

/** Every talent card, flat — weapons.js folds this into the card registry. */
export const TALENT_CARDS = TALENTS.flatMap((talent) => talent.cards);

const TALENT_BY_ID = new Map(TALENTS.map((talent) => [talent.id, talent]));
const TALENT_BY_NAME = new Map(TALENTS.map((talent) => [talent.name.toLowerCase(), talent]));

/** A talent set by id or by printed name. */
export function getTalent(key) {
  if (!key) return null;
  return TALENT_BY_ID.get(key) ?? TALENT_BY_NAME.get(String(key).toLowerCase()) ?? null;
}


/** Tag descriptors for the ids a set lists, in the codex's own order. */
export function talentTags(talent) {
  const ids = new Set(talent?.tags ?? []);
  return TALENT_TAGS.filter((tag) => ids.has(tag.id));
}

/** Only the tags some set actually uses, so the filter row stays honest. */
export function usedTalentTags() {
  const ids = new Set(TALENTS.flatMap((talent) => talent.tags ?? []));
  return TALENT_TAGS.filter((tag) => ids.has(tag.id));
}

/** Which shelf a set sits on: the attribute it is built on, or Other. */
export function talentCategory(talent) {
  const set = typeof talent === 'string' ? getTalent(talent) : talent;
  return TALENT_CATEGORIES.find((category) => category.id === set?.stat) ?? OTHER_CATEGORY;
}

/**
 * A wall of sets cut into shelves, in the categories' own order.
 *
 * Handed whatever the caller was about to draw rather than the codex, so a
 * filtered wall is shelved by what survived the filter: an empty shelf is left
 * off entirely instead of printing a heading over nothing. Takes options the way
 * `optionsAt` hands them over, and anything else carrying a `talent`.
 */
export function talentShelves(options) {
  return TALENT_CATEGORIES.map((category) => ({
    category,
    options: options.filter((option) => talentCategory(option.talent) === category),
  })).filter((shelf) => shelf.options.length > 0);
}

/** The cards a rank *adds* — not everything the track has given so far. */
export function cardsAtRank(talent, rank) {
  return (talent?.cards ?? []).filter((card) => card.rank === rank);
}

/** Everything a character holding this talent at `rank` has earned from it. */
export function cardsThroughRank(talent, rank) {
  return (talent?.cards ?? []).filter((card) => card.rank <= rank);
}

/* --------------------------------------------------------- the enchanting spec
 *
 * The Enchanter's ranks 2 and 3 add no cards. They widen what ENCHANTING may lay
 * and what WIELDER OF WONDER may wear, and a presentation page that only printed
 * ranks with cards in them would print nothing at all for either. So the spec is
 * read here, the way loadouts.js reads a `loadout` and brews.js a `brewing`, and
 * this one needs no codex to answer: it is arithmetic on two of the set's own
 * sentences, which is why it can live in the leaf.
 */

/** The enchanting spec a set carries, or null for every set that lays nothing. */
export function enchantingOf(talent) {
  const set = typeof talent === 'string' ? getTalent(talent) : talent;
  return set?.enchanting ?? null;
}

/**
 * What a rank of an enchanting set opens, in the shape the presentation page's
 * other two notes already hand it: the tiers reachable, the tiers newly opened
 * over the rank below, and how many enchantments the Enchanter wears themselves.
 */
export function enchantPreview(talent, rank) {
  const spec = enchantingOf(talent);
  if (!spec) return null;

  const tiers = spec.tiers?.[rank] ?? [];
  const below = spec.tiers?.[rank - 1] ?? [];
  const worn = spec.worn?.[rank] ?? 0;
  const perItem = spec.perItem?.[rank] ?? 1;

  return {
    spec,
    tiers,
    opened: tiers.filter((tier) => !below.includes(tier)),
    /* What the rank below could already lay from, so a rank says what it *adds*
       rather than repeating the price of enchanting three times over. */
    kept: tiers.filter((tier) => below.includes(tier)),
    worn,
    /* Rank 1 is the first one, so it grows over nothing rather than over zero. */
    grew: worn > (spec.worn?.[rank - 1] ?? 0),
    /* How many one item may hold, and whether this rank is the one that moved
       it. LAYERED ENCHANTMENT is the only thing that ever does. */
    perItem,
    widened: perItem > (spec.perItem?.[rank - 1] ?? 1),
  };
}

/* -------------------------------------------------------------- the choices
 *
 * Advancement is a row of slots, one per level that hands out a choice. A slot
 * *is* the level, so what a choice may buy is decided by which slot it sits in
 * rather than by where the character has got to since — a Rank 2 can never end
 * up recorded against the level-2 slot.
 *
 * Slots fill in order and undo from the end. That one rule is what keeps every
 * stored list valid without a repair pass on every render: a talent's ranks can
 * only be bought bottom-up, so `taken` is always ascending and always exactly as
 * long as the rank held.
 */

/** Every level that hands out a choice: level 1, then each even level. */
export const ADVANCEMENT_LEVELS = [1, 2, 4, 6, 8, 10, 12];

/** The slots a character of this level has opened. */
export function advancementLevels(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1));
  return ADVANCEMENT_LEVELS.filter((l) => l <= lvl);
}

/** The next level that will hand out a choice, or null at the last one. */
export function nextAdvancementLevel(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1));
  return ADVANCEMENT_LEVELS.find((l) => l > lvl) ?? null;
}

/**
 * A stored `talents` value is only ever a hint: it may be missing, hold the old
 * `{ name, rank }` shape from before slots existed, or name a set this build has
 * never heard of. Whatever comes in, this returns entries carrying a valid
 * ascending `taken` — and a homebrew set typed in at the table survives as
 * `custom`, because deleting someone's talent to tidy a column would be worse
 * than showing it plain.
 */
/** A list of ids, each once, with the blanks and the non-strings dropped. */
function idList(value) {
  return [...new Set((Array.isArray(value) ? value : []).filter((id) => typeof id === 'string' && id))];
}

/** A map of key to id list, with the empty keys dropped. */
function idMap(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const out = {};

  for (const [key, list] of Object.entries(source)) {
    if (!key) continue;
    const ids = idList(Array.isArray(list) ? list : [list]);
    if (ids.length > 0) out[key] = ids;
  }
  return out;
}

export function normalizeTalents(value) {
  let list = value;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = null;
    }
  }

  const staged = [];
  const seen = new Set();

  for (const raw of Array.isArray(list) ? list : []) {
    if (!raw) continue;

    const entry = typeof raw === 'string' ? { name: raw } : raw;
    const talent = getTalent(entry.id ?? entry.name);
    const id = talent?.id ?? String(entry.id ?? entry.name ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);

    staged.push({
      id,
      // The Character tab reads `name` straight off the row for its tags, so it
      // is stored rather than looked up on every render.
      name: talent?.name ?? entry.name ?? id,
      rank: Math.min(MAX_TALENT_RANK, Math.max(1, Math.floor(Number(entry.rank) || 1))),
      taken: Array.isArray(entry.taken) ? entry.taken : null,
      // Card ids for a set that lets you choose what it teaches, such as a
      // Mycomancer's spells. Only ids are kept here, each once; whether they
      // are legal at the rank held is loadouts.js's business.
      picks: [...new Set((Array.isArray(entry.picks) ? entry.picks : []).filter(
        (pick) => typeof pick === 'string' && pick
      ))],
      /* What an Enchanter has laid, in the two places their cards put it: WIELDER
         OF WONDER's enchantments on their own person, and ENCHANTING's on the
         things they carry. Repaired for *shape* only, exactly as `picks` is —
         whether an id is real and whether the rank allows it is enchanting.js's
         business, the same division loadouts.js has with picks. */
      worn: idList(entry.worn),
      laid: idMap(entry.laid),
      custom: !talent,
    });
  }

  return repairSlots(staged);
}

/**
 * Give every entry an ascending `taken` no longer than MAX_TALENT_RANK, with no
 * two entries claiming the same slot.
 *
 * Levels a row already records are honoured first, so a list this app wrote
 * comes back out untouched. Anything still short of its stated rank — a row from
 * before slots were tracked — is topped up with the earliest free slot its next
 * rank is allowed to be bought at.
 */
function repairSlots(entries) {
  const used = new Set();

  for (const entry of entries) {
    const claimed = (entry.taken ?? [])
      .map((raw) => Math.floor(Number(raw)))
      .filter((l) => ADVANCEMENT_LEVELS.includes(l))
      .sort((a, b) => a - b);

    const taken = [];
    for (const level of claimed) {
      if (used.has(level) || taken.length >= MAX_TALENT_RANK) continue;
      if (level < minLevelForRank(taken.length + 1)) continue;
      used.add(level);
      taken.push(level);
    }
    entry.taken = taken;
  }

  for (const entry of entries) {
    while (entry.taken.length < entry.rank) {
      const need = minLevelForRank(entry.taken.length + 1);
      const after = entry.taken.length ? entry.taken[entry.taken.length - 1] : 0;
      const slot = ADVANCEMENT_LEVELS.find((l) => l >= need && l > after && !used.has(l));
      if (slot === undefined) break;
      used.add(slot);
      entry.taken.push(slot);
    }
    entry.rank = entry.taken.length;
  }

  return entries.filter((entry) => entry.taken.length > 0);
}

/**
 * The tab's whole picture: one slot per advancement level the character has
 * reached, what was chosen in each, which slot is next to fill and which slots
 * are holding a choice that can be handed back.
 *
 * `beyond` holds choices recorded above the current level — what a character
 * looks like after losing experience. Those ranks are left exactly where they
 * are and the tab says so, because silently dropping a rank someone played a
 * session with is not the sheet's call to make.
 */
export function advancementState(talents, level) {
  const list = normalizeTalents(talents);
  const levels = advancementLevels(level);

  const slots = levels.map((slotLevel) => {
    const entry = list.find((t) => t.taken.includes(slotLevel));
    return {
      level: slotLevel,
      talent: entry ? getTalent(entry.id) : null,
      entry: entry ?? null,
      // Which rank of that talent this slot bought.
      rank: entry ? entry.taken.indexOf(slotLevel) + 1 : null,
      filled: Boolean(entry),
    };
  });

  const openIndex = slots.findIndex((slot) => !slot.filled);
  const filled = slots.filter((slot) => slot.filled);
  const beyond = list.flatMap((entry) => entry.taken.filter((l) => !levels.includes(l)));

  return {
    talents: list,
    slots,
    // Slots fill in order: only the earliest empty one can be chosen in.
    openLevel: openIndex === -1 ? null : slots[openIndex].level,
    /* …but any filled one can be handed back, and doing so hands back the ones
       after it too. What used to stand here was `undoLevel`, the last filled
       level and the only one undo was offered on. See clearFrom(). */
    filledLevels: filled.map((slot) => slot.level),
    nextLevel: nextAdvancementLevel(level),
    beyond: beyond.sort((a, b) => a - b),
  };
}

/**
 * Every talent set measured against one slot: what taking it there would buy,
 * and — when it would buy nothing — the one sentence the tile should say.
 */
export function optionsAt(list, level, { all = false } = {}) {
  const owned = new Map(list.map((entry) => [entry.id, entry]));

  const options = TALENTS.map((talent) => {
    /* A set on the roster with nothing written for it cannot be bought at any
       level by anybody, so it is refused before its rank is even worked out.
       There is no rank to name: `rank: null` is the same shape a finished Master
       set hands back, and the tile prints the reason where a price would go. */
    if (talent.stub) {
      return { talent, held: 0, rank: null, ok: false, reason: 'Not written yet.' };
    }

    const held = owned.get(talent.id);
    if (!held) return { talent, held: 0, rank: 1, ok: true };

    const next = held.taken.length + 1;
    if (next > MAX_TALENT_RANK) {
      return { talent, held: held.taken.length, rank: null, ok: false, reason: 'Already at Master.' };
    }

    const need = minLevelForRank(next);
    if (level < need) {
      return {
        talent,
        held: held.taken.length,
        rank: next,
        ok: false,
        reason: `${rankInfo(next).title} needs level ${need}.`,
      };
    }
    return { talent, held: held.taken.length, rank: next, ok: true };
  });

  /* A wall of sets you cannot take is a wall you read once and never again:
     Master sets that are finished, and ranks the level cannot reach, are left
     off it. `all` is for the reader that wants the whole codex anyway.

     A roster placeholder is the exception, and it is kept on purpose. The other
     two are about *this* character: a set they have finished, a rank they have
     not reached yet, and both come back the moment that changes. A placeholder is
     about the game, it will not come back for anybody, and the whole point of
     standing it on the wall is that the shelf says what is coming. Ruled by the
     designer on 2026-08-24; see data/README.md. */
  return all ? options : options.filter((option) => option.ok || option.talent.stub);
}

/* ---------------------------------------------------- writing the talent list
 * Both of these take the stored list and hand back the next one, so the tab only
 * ever has to `patch({ talents: … })`. Neither mutates its input, and both hand
 * back rows fit for the column — `custom` and `talent` are worked out on read,
 * never written down.
 */

/** What actually goes in the `talents` column. Derived fields are dropped. */
export function serializeTalents(list) {
  return list.map(({ id, name, rank, taken, picks, worn, laid }) => ({
    id,
    name,
    rank,
    taken,
    ...(picks?.length ? { picks } : {}),
    ...(worn?.length ? { worn } : {}),
    ...(laid && Object.keys(laid).length ? { laid } : {}),
  }));
}

/**
 * Write down what a set that lets you choose its cards was pointed at. Ids are
 * stored against the set rather than the level, because the set is what teaches
 * them: a Mycomancer swapping spells after a long rest is not undoing a level.
 */
export function setTalentPicks(talents, talentId, picks) {
  const list = normalizeTalents(talents);
  const clean = [...new Set((Array.isArray(picks) ? picks : []).filter(Boolean))];

  return serializeTalents(
    list.map((entry) => (entry.id === talentId ? { ...entry, picks: clean } : entry))
  );
}


/** Spend the choice at `level` on a talent — a new set, or its next rank. */
export function chooseAt(talents, level, talentId) {
  const list = normalizeTalents(talents);
  const slot = Math.floor(Number(level));

  // A slot that is not real, or is already spent, is left alone.
  if (!ADVANCEMENT_LEVELS.includes(slot)) return serializeTalents(list);
  if (list.some((entry) => entry.taken.includes(slot))) return serializeTalents(list);

  const held = list.find((entry) => entry.id === talentId);
  if (held) {
    const next = held.taken.length + 1;
    const last = held.taken[held.taken.length - 1] ?? 0;
    if (next > MAX_TALENT_RANK || slot < minLevelForRank(next) || slot <= last) {
      return serializeTalents(list);
    }
    return serializeTalents(
      list.map((entry) =>
        entry.id === talentId ? { ...entry, rank: next, taken: [...entry.taken, slot] } : entry
      )
    );
  }

  const talent = getTalent(talentId);
  /* A roster placeholder is refused here as well as on the wall. The tile is
     already locked and its take button already disabled, so this is the model
     holding the same line the UI does: a level spent on a set with no cards would
     buy nothing at all and there would be no way to tell from the sheet. */
  if (!talent || talent.stub) return serializeTalents(list);
  return serializeTalents([...list, { id: talent.id, name: talent.name, rank: 1, taken: [slot] }]);
}

/**
 * Every rank bought at slot `limit` or later, given back. A set left holding no
 * ranks at all is dropped, and goes with the cards it had chosen.
 *
 * Ranks always come off the top, never out of the middle. A Guardian 3 losing
 * one rank is a Guardian 2 rather than a Guardian 3 with a hole in it, which is
 * the only shape `taken` can hold: the rank a slot bought is its position in
 * that list.
 */
function dropFrom(talents, limit) {
  return serializeTalents(
    normalizeTalents(talents)
      .map((entry) => {
        const taken = entry.taken.filter((slot) => slot < limit);
        return taken.length === entry.taken.length
          ? entry
          : { ...entry, taken, rank: taken.length };
      })
      .filter((entry) => entry.taken.length > 0)
  );
}

/**
 * Give the choice made at `level` back, and every talent choice made after it.
 *
 * Talent slots fill in order, because a Rank 2 has to know which level bought
 * Rank 1, so a slot handed back in the middle would leave a hole the tab cannot
 * draw. It used to answer that by only ever offering undo on the *last* filled
 * slot: to change your mind about level 2 you had to hand back level 6, then
 * level 4, then level 2, in that order, and nothing on the level-2 panel said so.
 *
 * Now the panel you are looking at is the one that answers, and the choices
 * standing on top of it come off with it. It is the same three clicks made into
 * one, and it is the button's job to say how many go.
 *
 * Only talents cascade. The attribute point and the skill each level hands out
 * stand on their own, and are given back one at a time wherever they were taken.
 */
export function clearFrom(talents, level) {
  const from = Math.floor(Number(level));

  // A slot that is not real gives nothing back, the same way chooseAt() spends
  // nothing on one. Without this a NaN would take the whole column with it.
  if (!ADVANCEMENT_LEVELS.includes(from)) return serializeTalents(normalizeTalents(talents));
  return dropFrom(talents, from);
}

/**
 * Every rank bought above `level`, given back.
 *
 * A character who loses experience loses what that experience bought, at the
 * moment the experience moves. `level` is kept, so a Guardian 3 dropping to
 * level 6 is a Guardian 2 with Rank 3 gone.
 */
export function pruneTalents(talents, level) {
  return dropFrom(talents, Math.floor(Number(level) || 1) + 1);
}

