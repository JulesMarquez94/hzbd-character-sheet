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

  { id: 'martial', label: 'Martial', kind: 'role' },
  { id: 'spellcasting', label: 'Spellcasting', kind: 'role' },
  { id: 'defense', label: 'Defense', kind: 'role' },
  { id: 'support', label: 'Support', kind: 'role' },
  { id: 'control', label: 'Control', kind: 'role' },
];

/* ------------------------------------------------------------- the codex */

const TALENT_SETS = [
  {
    id: 'guardian',
    name: 'Guardian',
    tagline: 'A bulwark who turns an enemy’s strength into an opening.',
    art: '/talents/guardian.jpg',
    tags: ['instinct', 'martial', 'defense', 'support'],
    stat: 'instinct',
    blurb:
      'The Guardian is a master of defense, a steadfast bulwark on the battlefield. Through rigorous training, they have perfected the art of using their shield not just to deflect blows but to turn an enemy’s strength against them.\n\n' +
      'They excel at absorbing devastating attacks, using their perfect form and timing to create crucial openings for themselves and their allies to strike back.\n\n' +
      'A Guardian’s presence is a source of unshakeable reassurance, turning the tide of battle by transforming an enemy’s offense into an opportunity for victory.',
    cards: [
      {
        id: 'shield-expertise',
        rank: 1,
        name: 'Shield Expertise',
        summary: 'With a shield: advantage on Instinct contests, Defense +1, and Martial Moves to learn.',
        kind: 'talent',
        tags: ['Talent', 'Guardian', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        body:
          'While wielding a weapon that includes a shield, you gain an advantage on {instinct} contested rolls {roll:instinct} and your Defense is increased by 1.\n\n' +
          'You learn a number of Novice Martial Moves equal to 1 + your Rank in Guardian.\n\n' +
          'At Rank 2, you can learn Adept Martial Moves, and at Rank 3, you gain access to Master Martial Moves.\n\n' +
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
          'When you do, you move to an empty space in melee range of that entity, and the cost of {{Intercept}} is increased by 1 Action Point.\n\n' +
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
        summary: 'Cast Primal spells, more of them each rank, and change them on a long rest.',
        kind: 'talent',
        tags: ['Talent', 'Mycomancer', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        body:
          'Your deep connection with the mycelial network lets you cast Primal Spells. You learn a number of Primal School spells equal to 2 + 2 x your Rank in Mycomancer.\n\n' +
          'Whenever you take a long rest, you can use your long rest action to change any number of learned spells.\n\n' +
          'At Rank 2, you can learn Adept Primal Spells, and at Rank 3, you gain access to Master Primal Spells.',
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
          'At least 1 Essence, exactly 1 Catalyst, and any number of Infusions.\n\n' +
          'You must pay the combined Action Point and Willpower cost of all chosen Ingredients. The resulting Brew takes effect immediately.\n\n' +
          'You gain access to Novice Ingredients at Rank 1, Adept Ingredients at Rank 2, and Master Ingredients at Rank 3.',
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
      'They excel at arming everyone around them. From a blade that takes on Fire to a hood that answers the first clash of a fight with a Shield, what they make holds from one fight to the next, and the only price a companion pays is the Magic Burden of carrying it. And where there is no night to spare, they can push an enchantment into an item at a touch, spending their own Willpower for an hour of borrowed wonder that weighs on no one.\n\n' +
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
          'At Rank 1 you learn Novice enchantments, at Rank 2 you learn Adept enchantments, and at Rank 3 you learn Master enchantments.\n\n' +
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
        summary: 'Enchantments apply to your own person, one for every rank you hold.',
        kind: 'talent',
        tags: ['Enchanter', 'Novice Talent', 'Long Rest'],
        ap: null,
        wp: null,
        stat: 'mind',
        body:
          'The enchanter body is able to withstand the power of enchantments onto itself. Enchantments apply to your person. Choose one when becoming an enchanter, you can change it during a Long Rest. The amount of such enchantments you can have is equal to your rank in enchanter.',
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
          'Laying it is a Long Rest action of its own, bought at the same price, and its Magic Burden is carried on top of the first one\u2019s.',
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
    /* House-written with the rest of the Overview. Mind because every roll the
       ally makes is a Mind roll and it has no other attribute it leans on;
       Martial because the ally is a body on the field that attacks and, once
       Empowered, is ridden; Support for the half of the set that is spent on
       somebody else's roll (DRAGON'S FAVOR, DRACONIC MARK, taking a wound in
       its stead); Control for FRIGHTFUL ROAR. */
    tags: ['mind', 'martial', 'support', 'control'],
    stat: 'mind',
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
         gains 1 Physique or 1 Instinct, alternating between the two." */
      base: { physique: 5, instinct: 4, mind: 6 },
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
      'They excel at being in two places at once. The ally is sent ahead to bolt, to breathe and to mark, while its bonded stands where they meant to stand, and a wound the ally takes can be pulled across and borne instead. Where the two of them cannot both be, the bond carries what one of them sees to the other, and a spell the drifter casts can be thrown from where the dragon stands.\n\n' +
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
        summary: 'Hide your ally in your shadow, where nothing can touch it, and call it back out.',
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
        summary: 'Your ally grows to the size of a horse, carries you, and Elevates its damage.',
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
];

/**
 * The sets as everything else sees them, with every card wearing its picture.
 *
 * The one line between the codex above and every reader of it. `withArt` puts
 * `art_url` and `art_thumb` on each card from cardArt.js, keyed by card id, and
 * a card with no picture keeps both fields as null rather than losing them —
 * which is what the plates on the sheet already draw empty. See the note at the
 * top of this file for why it happens here and not on each set by hand.
 */
export const TALENTS = TALENT_SETS.map((talent) => ({
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
 * reached, what was chosen in each, which slot is next to fill and which filled
 * slot can be handed back.
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
    // …and only the last filled one can be handed back.
    undoLevel: filled.length ? filled[filled.length - 1].level : null,
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
     off it. `all` is for the reader that wants the whole codex anyway. */
  return all ? options : options.filter((option) => option.ok);
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
  if (!talent) return serializeTalents(list);
  return serializeTalents([...list, { id: talent.id, name: talent.name, rank: 1, taken: [slot] }]);
}

/** Give the choice made at `level` back. A set left with no ranks is dropped. */
export function clearAt(talents, level) {
  const slot = Math.floor(Number(level));

  return serializeTalents(
    normalizeTalents(talents)
      .map((entry) =>
        entry.taken.includes(slot)
          ? { ...entry, taken: entry.taken.filter((l) => l !== slot), rank: entry.taken.length - 1 }
          : entry
      )
      .filter((entry) => entry.taken.length > 0)
  );
}

/**
 * Every rank bought above `level`, given back.
 *
 * A character who loses experience loses what that experience bought. Ranks
 * come off the top, so a Guardian 3 dropping to level 6 is a Guardian 2 with
 * Rank 3 gone rather than a Guardian 3 with a hole in the middle, and a set
 * left holding no ranks at all leaves the sheet with the spells it chose.
 */
export function pruneTalents(talents, level) {
  const top = Math.floor(Number(level) || 1);

  return serializeTalents(
    normalizeTalents(talents)
      .map((entry) => {
        const taken = entry.taken.filter((slot) => slot <= top);
        return taken.length === entry.taken.length
          ? entry
          : { ...entry, taken, rank: taken.length };
      })
      .filter((entry) => entry.taken.length > 0)
  );
}

