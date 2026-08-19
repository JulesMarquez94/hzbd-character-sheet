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
 * This file is a leaf: nothing here may import weapons.js or items.js, which
 * both end up importing it back.
 */

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

export const TALENTS = [
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
    tagline: 'A conduit of the mycelial network, turning the dead into power.',
    art: '/talents/mycomancer.jpg',
    tags: ['instinct', 'spellcasting', 'support', 'control'],
    stat: 'instinct',
    /* A set that does not only hand you cards, it hands you a *choice* of them.
       The numbers are read straight off Fungal Invocation: you know 2 + 2 x your
       rank in spells, Adept opens at Rank 2 and Master at Rank 3. Indexed by
       rank so the data stays plain, and resolved against the card codex by
       loadouts.js, which is what keeps this file a leaf.

       The card says "Nature School" while the pool below is Primal, which is
       where the printed spells actually are. The designer's own two words to
       reconcile; changing `school` here is the whole switch. */
    loadout: {
      id: 'primal-spells',
      label: 'Primal Spells',
      noun: 'spell',
      kind: 'spell',
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
         "After a successful short or long rest, you can swap out any number of
         spells you know to any other eligible spell." The rest window reads
         this to decide whether to offer the swap while the camp is being made,
         which is where the swap actually happens at a table. */
      swap: ['short', 'long'],
      note: 'After a short or long rest you can swap any of them for others you are eligible for, so nothing here is spent for good.',
    },
    blurb:
      'Mycomancers are living conduits of nature’s life and death cycle, their bodies host to a symbiotic mycelial network. This connection allows them to commune with and command the flora around them, weaving powerful spells that can either usher in renewal or accelerate decay.\n\n' +
      'They can also tap into a broader fungal web, using it to glean information from their surroundings or to establish a powerful link with their allies, bolstering their resolve and abilities. In battle, they turn fallen foes into a resource, hastening the decomposition of cadavers to cultivate vibrant patches of mushrooms. This morbid-yet-beautiful act strengthens their bond with the mycelial network, empowering their spells and ensuring that no life or death goes to waste.',
    cards: [
      {
        id: 'fungal-invocation',
        rank: 1,
        name: 'Fungal Invocation',
        summary: 'Cast Nature spells, more of them each rank, and a fresh corpse cheapens one.',
        kind: 'talent',
        tags: ['Talent', 'Mycomancer', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        body:
          'Your deep connection with the mycelial network lets you cast Nature Spells. You learn a number of Nature School spells equal to 2 + 2 x your Rank in Mycomancer.\n\n' +
          'After a successful short or long rest, you can swap out any number of spells you know to any other eligible spell.\n\n' +
          'At Rank 2, you can learn Adept Nature Spells, and at Rank 3, you gain access to Master Nature Spells.\n\n' +
          'You also have a unique ability to draw power from the dead. By touching a fresh cadaver as you cast a spell, you can reduce its cost by 1 Willpower. You can use this once per spell cast.',
      },
      {
        id: 'mycelium-network',
        rank: 1,
        name: 'Mycelium Network',
        summary: 'Cast with Instinct instead of Mind, and question the network on a long rest.',
        kind: 'talent',
        tags: ['Talent', 'Mycomancer', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        body:
          'As a Mycomancer, you have an advantage on rolls related to natural elements or their exploration.\n\n' +
          'When casting spells, you can use your {instinct} attribute instead of your {mind} attribute.\n\n' +
          'You are proficient with any weapon that relies on your {instinct} attribute.\n\n' +
          'During a long rest, you can perform the Mycelial Communion action. When you do, make a roll using your Mycomancer rank as a roll modifier. On a success, you learn the answers to 3 yes or no questions about anything within 5 kilometers (3 miles) of you. On a critical success, you learn the answers to 5 such questions instead.',
      },
      {
        id: 'fungal-bloom',
        rank: 1,
        name: 'Fungal Bloom',
        summary: 'Spores that shield allies and burn enemies, spreading from every corpse they make.',
        kind: 'talent',
        tags: ['Talent', 'Mycomancer', 'Ability'],
        ap: 4,
        wp: 4,
        stat: 'instinct',
        body:
          'You release a cloud of spores that affects all entities within 9 meters (30 feet).\n\n' +
          'Allies within the range of the cloud gain a shield equal to your {instinct} attribute.\n\n' +
          'Enemies within the range of the cloud take {damage:Necrotic} damage equal to your {instinct} attribute.\n\n' +
          'If there is a fresh cadaver within range, it explodes into spores, replicating the ability for free from the cadaver’s location. This effect also triggers if an enemy dies from the damage dealt by {{Fungal Bloom}}.',
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
        id: 'sporatic-infusion',
        rank: 2,
        name: 'Sporatic Infusion',
        summary: "An ally's next hit deals extra Necrotic damage equal to your Instinct.",
        kind: 'talent',
        tags: ['Talent', 'Mycomancer', 'Ability'],
        ap: 1,
        wp: 1,
        stat: 'instinct',
        body:
          'You can use this ability to make an ally’s next successful attack deal additional {damage:Necrotic} damage equal to your {instinct} attribute.',
      },
      {
        id: 'deepening-connection',
        rank: 3,
        name: 'Deepening Connection',
        summary: 'Bonds last until dismissed, and every cheapened spell heals those bonded.',
        kind: 'talent',
        tags: ['Talent', 'Mycomancer', 'Passive'],
        ap: null,
        wp: null,
        stat: 'instinct',
        body:
          'Your Mycelial Bonds now last until you choose to dismiss them.\n\n' +
          'However, now the number of entities you can have bonded at the same time cannot exceed half of your {instinct} attribute.\n\n' +
          'Additionally, whenever you use {{Fungal Invocation}} to reduce the cost of a spell, all bonded members of your network regain 1 Willpower.\n\n' +
          'When you cast a spell that targets yourself, you can choose to have it also target all of your Mycelial Bonded entities without increasing the spell’s cost.\n' +
          'You must take a long rest before you can use this feature again.',
      },
      {
        id: 'moldy-reanimation',
        rank: 3,
        name: 'Moldy Reanimation',
        summary: 'Reanimate a minion corpse to fight for you until your next long rest.',
        kind: 'talent',
        tags: ['Talent', 'Mycomancer', 'Ability'],
        ap: 4,
        wp: 2,
        stat: 'instinct',
        body:
          'You can reanimate the cadaver of a Minion entity you can touch.\n\n' +
          'The reanimated Minion follows your orders and fights for you until your next long rest, but it is mindless.\n\n' +
          'It takes its turn at the end of your turn, and before it acts, you can give it a new order as a free action. If you don’t give it an order, it will rush and attack the closest enemy.\n\n' +
          'This ability fails if you try to reanimate the cadaver of a Minion that is a higher level than you.',
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
        summary: 'Summon the Cauldron or send it away. You need it to brew.',
        kind: 'talent',
        tags: ['Cauldron keeper', 'Novice Talent', 'Ability'],
        ap: 2,
        wp: null,
        stat: 'instinct',
        /* Mechanics as data, never read out of the prose: using this flips the
           Cauldron between Summoned and Dismissed, in the same write as the
           Action Points. See src/lib/brews.js. */
        toggles: 'cauldron',
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
];

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
      /* Whether a Cauldron Keeper's Cauldron is Summoned. Bound Cauldron keeps it
         "in an extradimensional space no one can access" until it is summoned, and
         BREW only works "While your Cauldron is Summoned", so this is a fact about
         the character rather than about a level. Anything unrecognised reads as
         dismissed, which is the state a character who has pressed nothing is in. */
      cauldron: entry.cauldron === 'summoned' ? 'summoned' : null,
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
  return list.map(({ id, name, rank, taken, picks, cauldron }) => ({
    id,
    name,
    rank,
    taken,
    ...(picks?.length ? { picks } : {}),
    // Only written when it is out. Dismissed is the default and costs no column.
    ...(cauldron ? { cauldron } : {}),
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

/**
 * Summon a set's Cauldron, or send it away. Stored against the set rather than
 * against the level for the same reason picks are: the set is what the Cauldron
 * belongs to, and handing the set back takes the Cauldron with it.
 */
export function setTalentCauldron(talents, talentId, cauldron) {
  const list = normalizeTalents(talents);
  const state = cauldron === 'summoned' ? 'summoned' : null;

  return serializeTalents(
    list.map((entry) => (entry.id === talentId ? { ...entry, cauldron: state } : entry))
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

