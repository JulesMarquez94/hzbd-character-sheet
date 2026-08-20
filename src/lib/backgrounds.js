/**
 * Backgrounds — what a character did before the adventure started.
 *
 * A background is the one choice on the sheet that looks backwards. Lineage is
 * the blood you were born with and a Talent Set is what you are becoming; a
 * background is the life you already lived, and it pays out in three currencies
 * at once:
 *
 *   the skills  — what that life taught you. Each background offers a pool and
 *                 lets you keep a few of them, and every one is a card, printed
 *                 and dealt exactly like a talent's or a weapon's, because
 *                 "spend 1 Willpower for advantage" is something you look up
 *                 mid-session and a paragraph about your youth is not.
 *   the kit     — a weapon, a full set of common armor, and the odds and ends
 *                 the trade leaves in your pockets. Taken once, at level 1.
 *   the purse   — the Coins and Supplies you show up with.
 *
 * The three trade against each other, and that trade is the whole design: a
 * Noble buys two skills and six hundred coins, a Scholar buys four skills and
 * almost nothing else, a Soldier gives up a skill to walk in carrying a second
 * weapon. Nothing here is meant to be strictly better than anything else.
 *
 * ------------------------------------------------------------------- source
 * Unlike lineages.js, this file was NOT transcribed from a designer's sheet —
 * there wasn't one. It is a first pass: the shapes come from the three skills
 * the designer wrote out by hand (Apothecary, Negotiator and Arcane Marshal,
 * all reproduced below as written), and everything around them is drafted to
 * match and balanced against the rest of the table. Every number in it —
 * `picks`, `coins`, `supplies`, and each skill's Willpower and Supply cost —
 * is the designer's to overrule. Change them here and the whole tab follows.
 *
 * --------------------------------------------------------------- card text
 * Card bodies use the same markers as every other card — see the header of
 * weapons.js. These are folded into the global registry by weapons.js, so every
 * link resolves and any of them can be dealt onto the pile.
 *
 * This file is a leaf: nothing here may import weapons.js or items.js. The kit
 * names item ids as plain strings and the block resolves them.
 */

/** How many skills a background may hand out. Nothing outside this range. */
export const MIN_SKILL_PICKS = 2;
export const MAX_SKILL_PICKS = 4;

/* ---------------------------------------------------------------- the tags *
 * Two kinds, so a wall of backgrounds can be narrowed twice over: the world
 * the life was lived in, and what it left the character good at. A background
 * carries one sphere and as many boons as fit it.
 */
export const BACKGROUND_TAGS = [
  { id: 'underworld', label: 'Underworld', kind: 'sphere' },
  { id: 'trade', label: 'Trade', kind: 'sphere' },
  { id: 'martial', label: 'Martial', kind: 'sphere' },
  { id: 'court', label: 'Court', kind: 'sphere' },
  { id: 'wilds', label: 'Wilds', kind: 'sphere' },
  { id: 'scholarly', label: 'Scholarly', kind: 'sphere' },
  { id: 'sacred', label: 'Sacred', kind: 'sphere' },
  { id: 'sea', label: 'Sea', kind: 'sphere' },

  { id: 'coin', label: 'Coin', kind: 'boon' },
  { id: 'supplies', label: 'Supplies', kind: 'boon' },
  { id: 'social', label: 'Social', kind: 'boon' },
  { id: 'stealth', label: 'Stealth', kind: 'boon' },
  { id: 'lore', label: 'Lore', kind: 'boon' },
  { id: 'survival', label: 'Survival', kind: 'boon' },
  { id: 'craft', label: 'Craft', kind: 'boon' },
  { id: 'warfare', label: 'Warfare', kind: 'boon' },
];

/* ------------------------------------------------------------- the skills *
 * Three shapes, and almost every skill in the game is one of them:
 *
 *   insight  — spend 1 Willpower for advantage on a named family of checks.
 *              The common case, and the cheapest.
 *   reroll   — spend 2 Willpower to take a failed check again. Costs more
 *              because it is bought after you already know you failed.
 *   labour   — an action taken during a Long Rest, paid for in Supplies. These
 *              are the reason the crate on the Character tab has a ledger.
 *
 * Skills are defined once, at module scope, and referenced by the pools that
 * offer them — several trades teach the same thing, and the wording must never
 * drift between them.
 */

const SKILL = { kind: 'skill', ap: null, wp: null };

/**
 * The one line a preview prints for a skill: its own domain, with the card's
 * emphasis dropped and the house's comma rules applied.
 *
 * Derived rather than written out twenty-eight times, because the domain is
 * already the exact phrase for what the skill is good for. A skill that does
 * something of its own writes its summary by hand instead.
 */
function skillSummary(lead, domain) {
  const plain = domain
    .replace(/\*\*/g, '')
    // No Oxford comma in a line the sheet writes for itself. Only a real
    // list carries one, so a lone comma joining two clauses is left alone.
    .replace(/,\s+(or|and)\s+/g, (match, word, at, whole) =>
      whole.slice(0, at).includes(',') ? ` ${word} ` : match
    );
  return `${lead} ${plain}.`;
}

/** Spend 1 Willpower, roll that check with advantage. */
function insight({ id, name, tags, domain, note = '' }) {
  return {
    ...SKILL,
    id,
    name,
    tags: ['Background Skill', ...tags],
    summary: skillSummary('Advantage on checks', domain),
    wp: 1,
    body:
      `Whenever you make a skill check ${domain}, you can spend 1 Willpower ` +
      'to give yourself advantage.' +
      (note ? `\n\n${note}` : ''),
  };
}

/** Spend 2 Willpower, take that failed check again. Once per check. */
function reroll({ id, name, tags, domain, note = '' }) {
  return {
    ...SKILL,
    id,
    name,
    tags: ['Background Skill', ...tags],
    summary: skillSummary('Reroll a failed check', domain),
    wp: 2,
    body:
      `When you fail a skill check ${domain}, you can spend 2 Willpower ` +
      'to reroll it.\n\nOnce per skill check: a second failure stands.' +
      (note ? `\n\n${note}` : ''),
  };
}

/* ----- shared: taught by more than one trade ----- */

/** The designer's own wording, kept as written. */
const APOTHECARY = {
  ...SKILL,
  id: 'apothecary',
  name: 'Apothecary',
  summary: 'Craft a Health Potion or a Poison from Supplies on a long rest.',
  tags: ['Background Skill', 'Labour', 'Craft'],
  body:
    'Whenever you take a Long Rest, you can take this action to craft either a ' +
    'Health Potion by expending 20 Supplies, or a Poison by expending 40.',
};

const NEGOTIATOR = {
  ...SKILL,
  id: 'negotiator',
  name: 'Negotiator',
  summary: 'Reroll a failed check to barter or persuade.',
  tags: ['Background Skill', 'Social'],
  wp: 2,
  body:
    'When you fail a skill check in an attempt to barter or persuade, you can ' +
    'spend 2 Willpower once to reroll it.',
};

const ARCANE_MARSHAL = {
  ...SKILL,
  id: 'arcane-marshal',
  name: 'Arcane Marshal',
  summary: 'Advantage on investigating arcane crime, and on reading people.',
  tags: ['Background Skill', 'Investigation', 'Lore'],
  wp: 1,
  body:
    'Whenever you make a skill check related to investigating arcane crime, or to ' +
    'gathering insight on people, you can spend 1 Willpower to give yourself ' +
    'advantage.',
};

const QUARTERMASTER = {
  ...SKILL,
  id: 'quartermaster',
  name: 'Quartermaster',
  summary: 'Half again as many Supplies for your coin, and more found on a long rest.',
  tags: ['Background Skill', 'Labour', 'Supplies'],
  body:
    'Whenever you buy Supplies, you receive half as many again as you paid for.\n\n' +
    'Whenever you take a Long Rest, you can take this action to go through the party’s ' +
    'packs and recover 10 Supplies that were about to be wasted.',
};

const FIELD_MEDIC = {
  ...SKILL,
  id: 'field-medic',
  name: 'Field Medic',
  summary: 'Stabilise a dying entity within reach, for Willpower and Supplies.',
  tags: ['Background Skill', 'Support', 'Supplies'],
  wp: 1,
  body:
    'When an entity within your reach drops to 0 Health or below, you can spend ' +
    '1 Willpower and expend 10 Supplies to stabilise them: they stop bleeding out ' +
    'at their current Health.\n\n' +
    'Whenever you take a Long Rest, you can take this action to expend 15 Supplies ' +
    'and lift one lingering injury or affliction from an ally.',
};

const PATHFINDER = insight({
  id: 'pathfinder',
  name: 'Pathfinder',
  tags: ['Survival'],
  domain: 'to navigate, to find a route or to travel without becoming lost',
});

/* ----- criminal ----- */

const CUTPURSE = insight({
  id: 'cutpurse',
  name: 'Cutpurse',
  tags: ['Stealth'],
  domain: 'to palm something, pick a pocket or conceal an object on your person',
});

const SHADOW_STEP = insight({
  id: 'shadow-step',
  name: 'Shadow Step',
  tags: ['Stealth'],
  domain: 'to move unseen, hide or go unheard',
});

const LOCKBREAKER = insight({
  id: 'lockbreaker',
  name: 'Lockbreaker',
  tags: ['Stealth', 'Craft'],
  domain: 'to open a lock, disarm a trap or find the seam in a mechanism',
});

const FENCE = {
  ...SKILL,
  id: 'fence',
  name: 'Fence',
  summary: 'Sell stolen or unmarked goods at their full value.',
  tags: ['Background Skill', 'Social', 'Coin'],
  wp: 1,
  body:
    'You always know who buys what, and what it is really worth.\n\n' +
    'You sell stolen or unmarked goods at their full value, and can spend ' +
    '1 Willpower to give yourself advantage on a skill check to appraise ' +
    'something or to find a buyer for it.',
};

/* ----- artisan ----- */

const APPRAISER = insight({
  id: 'appraiser',
  name: 'Appraiser',
  tags: ['Craft', 'Coin'],
  domain: 'to judge an object’s worth, materials, maker or authenticity',
});

const TINKER = insight({
  id: 'tinker',
  name: 'Tinker',
  tags: ['Craft'],
  domain: 'to understand, repair or improvise a mechanism or device',
});

const SMITH = {
  ...SKILL,
  id: 'smith',
  name: 'Smith',
  summary: 'Repair a damaged piece of gear at a forge on a long rest, for Supplies.',
  tags: ['Background Skill', 'Labour', 'Craft'],
  body:
    'Whenever you take a Long Rest, you can take this action to work at a forge or bench, ' +
    'expending 30 Supplies to repair a damaged piece of gear back to working order, ' +
    'or 60 Supplies to reforge a Common weapon or armor piece into any other of the ' +
    'same rarity.',
};

/* ----- soldier ----- */

const DRILLMASTER = insight({
  id: 'drillmaster',
  name: 'Drillmaster',
  tags: ['Warfare', 'Social'],
  domain: 'to give an order, hold a formation or intimidate through discipline',
});

const VETERANS_EYE = insight({
  id: 'veterans-eye',
  name: 'Veteran’s Eye',
  tags: ['Warfare'],
  domain:
    'to read a battlefield, judge an enemy’s strength or readiness, or spot an ambush',
});

const SIEGEWRIGHT = insight({
  id: 'siegewright',
  name: 'Siegewright',
  tags: ['Warfare', 'Craft'],
  domain: 'to fortify a position, breach one or work a siege engine',
});

/* ----- noble ----- */

const COURTIER = insight({
  id: 'courtier',
  name: 'Courtier',
  tags: ['Social'],
  domain: 'to observe etiquette, read a room or move through a court unremarked',
});

const HERALDRY = insight({
  id: 'heraldry',
  name: 'Heraldry',
  tags: ['Lore', 'Social'],
  domain: 'to recognise a house, seal, banner or bloodline, or the forgery of one',
});

const COMMANDING_PRESENCE = reroll({
  id: 'commanding-presence',
  name: 'Commanding Presence',
  tags: ['Social'],
  domain: 'made to command, overawe or be obeyed without argument',
});

const WELL_CONNECTED = insight({
  id: 'well-connected',
  name: 'Well Connected',
  tags: ['Social'],
  domain: 'to find the right person in a settlement, or to get an introduction to them',
});

const PATRON = reroll({
  id: 'patron',
  name: 'Patron',
  tags: ['Social', 'Coin'],
  domain: 'made to gain access, secure lodging or be believed',
  note:
    'You are trading on your house’s name rather than your own. A table may rule it worth ' +
    'less the further you travel from it.',
});

/* ----- scholar ----- */

const LOREKEEPER = insight({
  id: 'lorekeeper',
  name: 'Lorekeeper',
  tags: ['Lore'],
  domain: 'to recall history, place a text or name a ruin, dynasty or event',
});

const NATURALIST = insight({
  id: 'naturalist',
  name: 'Naturalist',
  tags: ['Lore', 'Survival'],
  domain: 'to identify a creature, plant, venom or disease, or predict how it behaves',
});

const CARTOGRAPHER = insight({
  id: 'cartographer',
  name: 'Cartographer',
  tags: ['Lore', 'Survival'],
  domain: 'to read or draw a map, or to retrace a route you have walked once before',
});

const LINGUIST = insight({
  id: 'linguist',
  name: 'Linguist',
  tags: ['Lore'],
  domain:
    'to decipher a script, cipher or dead tongue, or to make yourself understood without one',
});

const THEORIST = reroll({
  id: 'theorist',
  name: 'Theorist',
  tags: ['Lore'],
  domain: 'made to identify a spell, enchantment or ritual, or to work out what it will do',
});

/* ----- wanderer ----- */

const FORAGER = {
  ...SKILL,
  id: 'forager',
  name: 'Forager',
  summary: 'Work the land on a long rest outside a settlement, and come back with Supplies.',
  tags: ['Background Skill', 'Labour', 'Supplies'],
  body:
    'Whenever you take a Long Rest outside a settlement, you can take this action to work ' +
    'the land around the camp (snares, water, roots, deadfall) and gain 15 Supplies.\n\n' +
    'Barren ground, a frozen waste or a dead marsh may give up nothing at all. That is ' +
    'the table’s call.',
};

const BEAST_SENSE = insight({
  id: 'beast-sense',
  name: 'Beast Sense',
  tags: ['Survival'],
  domain: 'to track, calm or handle an animal',
});

const WEATHER_READ = insight({
  id: 'weather-read',
  name: 'Weather Read',
  tags: ['Survival'],
  domain: 'to predict the weather, find shelter or judge whether ground is safe to cross',
});

const TRAPPER = insight({
  id: 'trapper',
  name: 'Trapper',
  tags: ['Survival', 'Stealth'],
  domain: 'to set a snare, or to spot one set for you',
});

/* ----- sailor ----- */

const SEA_LEGS = insight({
  id: 'sea-legs',
  name: 'Sea Legs',
  tags: ['Survival'],
  domain: 'to keep your balance, climb rigging or resist being moved or knocked down',
});

const STORMWISE = insight({
  id: 'stormwise',
  name: 'Stormwise',
  tags: ['Survival'],
  domain: 'to handle a vessel, read a sky or a current, or ride out foul weather',
});

const DOCKSIDE_WORD = insight({
  id: 'dockside-word',
  name: 'Dockside Word',
  tags: ['Social'],
  domain: 'to gather rumour, cargo manifests or gossip in any port',
});

/* ----- devout ----- */

const SCRIPTURE = insight({
  id: 'scripture',
  name: 'Scripture',
  tags: ['Lore'],
  domain: 'to recall doctrine, place a relic or sacred site, or recognise the profane',
});

const ALMSGIVER = insight({
  id: 'almsgiver',
  name: 'Almsgiver',
  tags: ['Social'],
  domain: 'to be given shelter, food or safe passage by common folk',
});

const COMFORTER = reroll({
  id: 'comforter',
  name: 'Comforter',
  tags: ['Social'],
  domain: 'made to calm, console or steady someone who is afraid',
});

const VIGIL = {
  ...SKILL,
  id: 'vigil',
  name: 'Vigil',
  summary: 'Keep vigil over the camp on a long rest, for Supplies, and every ally feels it.',
  tags: ['Background Skill', 'Labour', 'Support'],
  body:
    'Whenever you take a Long Rest, you can take this action to keep vigil over the camp, ' +
    'expending 20 Supplies in oil, salt and incense.\n\n' +
    'Every ally who rests under it ends the rest with a Shield equal to your {mind}.',
};

/* --------------------------------------------------------------- the codex
 *
 * Fields:
 *   picks     — how many skills this background lets you keep, 2 to 4
 *   skills    — the pool it offers them from
 *   kit       — what you walk in carrying:
 *                 weapons   how many Common weapons you choose (Soldier: 2)
 *                 armor     always true — one full Common three-piece set
 *                 coins     starting Coins
 *                 supplies  starting Supplies
 *                 belt      codex item ids clipped to open belt loops
 *                 pack      written entries the item codex has no item for
 *
 * The trade, laid out so it can be checked at a glance:
 *
 *   SCHOLAR    4 skills · 100¢ · 20 su · 1 weapon  · 1 pack
 *   CRIMINAL   3 skills · 120¢ · 40 su · 1 weapon  · 2 belt, 1 pack
 *   WANDERER   3 skills · 100¢ · 70 su · 1 weapon  · 2 belt, 1 pack
 *   ARTISAN    3 skills · 200¢ · 60 su · 1 weapon  · 1 belt, 2 pack
 *   SAILOR     3 skills · 180¢ · 45 su · 1 weapon  · 1 belt, 2 pack
 *   DEVOUT     3 skills · 150¢ · 55 su · 1 weapon  · 1 belt, 2 pack
 *   SOLDIER    2 skills · 250¢ · 50 su · 2 weapons · 1 belt, 1 pack
 *   NOBLE      2 skills · 600¢ · 20 su · 1 weapon  · 2 pack
 */

export const BACKGROUNDS = [
  {
    id: 'criminal',
    name: 'Criminal',
    tagline: 'You learned the city from underneath it.',
    art: null,
    tags: ['underworld', 'stealth', 'social'],
    blurb:
      'You made your living on the wrong side of a door. Maybe you ran with a crew, maybe you worked alone and slept badly for it, but either way you know which windows are never latched and which watchmen are already paid.\n\n' +
      'The trade leaves marks. You count the exits before you sit down, you price everything you look at, and you have more friends than a respectable person should, none of whom will admit to knowing you.',
    picks: 3,
    skills: [CUTPURSE, SHADOW_STEP, LOCKBREAKER, FENCE, ARCANE_MARSHAL, NEGOTIATOR],
    kit: {
      weapons: 1,
      armor: true,
      coins: 120,
      supplies: 40,
      belt: ['thiefs-picks', 'smoke-vial'],
      pack: [
        {
          name: 'Forged Papers',
          note: 'A travel writ in someone else’s name. Good enough for a bored gate guard.',
        },
      ],
    },
  },

  {
    id: 'artisan',
    name: 'Artisan',
    tagline: 'A trade, a guild mark and hands that know the work.',
    art: null,
    tags: ['trade', 'craft', 'coin', 'supplies'],
    blurb:
      'You served your years and came out the other side with a craft: smith, alchemist, glazier, binder, it hardly matters which. What matters is that you can look at a made thing and see how it was made.\n\n' +
      'Guild work pays steadily and teaches patience, and you left carrying both: a full pack, a good name in one town and the quiet certainty that most problems are a materials problem.',
    picks: 3,
    skills: [APOTHECARY, SMITH, APPRAISER, TINKER, QUARTERMASTER, NEGOTIATOR],
    kit: {
      weapons: 1,
      armor: true,
      coins: 200,
      supplies: 60,
      belt: ['storm-lantern'],
      pack: [
        {
          name: 'Artisan’s Tools',
          note: 'The roll of your trade: files, pliers, a good glass and the one tool you made yourself.',
        },
        {
          name: 'Guild Ledger',
          note: 'Your record of work owed and owing. A guild hall anywhere will honour the mark on the cover.',
        },
      ],
    },
  },

  {
    id: 'soldier',
    name: 'Soldier',
    tagline: 'You were paid to stand in a line and not run.',
    art: null,
    tags: ['martial', 'warfare', 'supplies'],
    blurb:
      'A regiment, a levy, a mercenary company. You carried a weapon for wages, and you were good enough at it to still be here. You know how a camp is run, how a siege is dug and how long men will hold before they break.\n\n' +
      'What the army really taught you is redundancy: never carry one of anything you would die without. You still march with a spare.',
    picks: 2,
    skills: [FIELD_MEDIC, QUARTERMASTER, PATHFINDER, DRILLMASTER, VETERANS_EYE, SIEGEWRIGHT],
    kit: {
      // The one background that arms both hands. It pays for the second weapon
      // with a skill — two picks, where almost everything else gets three.
      weapons: 2,
      armor: true,
      coins: 250,
      supplies: 50,
      belt: ['bandage-roll'],
      pack: [
        {
          name: 'Campaign Kit',
          note: 'Mess tin, whetstone, oilcloth and a folded shelter half. Everything a march needs and nothing it does not.',
        },
      ],
    },
  },

  {
    id: 'noble',
    name: 'Noble',
    tagline: 'A name that opens doors, and the debts that come with it.',
    art: null,
    tags: ['court', 'social', 'coin'],
    blurb:
      'You were born to a house with land, or money, or at minimum a very old grievance. You were taught to dance, to ride, to read a room and never once to cook.\n\n' +
      'Whether you left in disgrace or on an errand, the name travels with you. It buys credit in places coin cannot, and it costs you something every time someone recognises it.',
    picks: 2,
    skills: [COURTIER, HERALDRY, COMMANDING_PRESENCE, WELL_CONNECTED, PATRON, NEGOTIATOR],
    kit: {
      weapons: 1,
      armor: true,
      // Two picks, and the deepest purse on the table by a wide margin — a
      // noble solves problems by paying someone else to have solved them.
      coins: 600,
      supplies: 20,
      belt: [],
      pack: [
        {
          name: 'Signet Ring',
          note: 'Your house’s seal, cut in silver. Pressed into wax it is worth far more than the ring.',
        },
        {
          name: 'Letter of Writ',
          note: 'A sealed introduction from your house, addressed to no one in particular. You will know when to spend it.',
        },
      ],
    },
  },

  {
    id: 'scholar',
    name: 'Scholar',
    tagline: 'Four things you know, and nothing at all in your pockets.',
    art: null,
    tags: ['scholarly', 'lore'],
    blurb:
      'An academy, a private library, a master who took you on and then died. You came up through books, and it shows. You have read about far more of the world than you have walked through.\n\n' +
      'You left with the only thing an education reliably produces: a great deal of knowledge, and no money whatsoever.',
    // The four-skill end of the range. It pays for the fourth pick with the
    // thinnest purse and the smallest kit in the codex.
    picks: 4,
    skills: [ARCANE_MARSHAL, LOREKEEPER, NATURALIST, CARTOGRAPHER, LINGUIST, THEORIST, APOTHECARY],
    kit: {
      weapons: 1,
      armor: true,
      coins: 100,
      supplies: 20,
      belt: [],
      pack: [
        {
          name: 'Field Journal',
          note: 'Half filled, cross-referenced and indexed in a hand only you can read.',
        },
      ],
    },
  },

  {
    id: 'wanderer',
    name: 'Wanderer',
    tagline: 'No town claims you, and the road has never run out.',
    art: null,
    tags: ['wilds', 'survival', 'supplies'],
    blurb:
      'You have been moving for as long as it matters. Outrider, trapper, pilgrim, exile. The name changes and the life does not. You have slept under more skies than roofs.\n\n' +
      'The wilds do not forgive carelessness, so you stopped being careless. You carry everything you need, and you know how to replace all of it.',
    picks: 3,
    skills: [PATHFINDER, FORAGER, BEAST_SENSE, WEATHER_READ, TRAPPER, APOTHECARY],
    kit: {
      weapons: 1,
      armor: true,
      coins: 100,
      // The fullest crate on the table, and Forager in the pool to keep it full.
      supplies: 70,
      belt: ['storm-lantern', 'grappling-hook'],
      pack: [
        {
          name: 'Bedroll & Snares',
          note: 'Oiled canvas, a bundle of wire and a bag of iron pegs. It has never once been dry.',
        },
      ],
    },
  },

  {
    id: 'sailor',
    name: 'Sailor',
    tagline: 'You have been further than most people believe there is to go.',
    art: null,
    tags: ['sea', 'survival', 'social'],
    blurb:
      'Deckhand, navigator, smuggler, whaler. You worked a vessel, and you worked it long enough that solid ground still feels wrong under you some mornings.\n\n' +
      'The sea teaches two things and teaches them hard: how to read weather that is about to kill you, and how to get along with people you cannot walk away from.',
    picks: 3,
    skills: [SEA_LEGS, STORMWISE, DOCKSIDE_WORD, PATHFINDER, QUARTERMASTER, NEGOTIATOR],
    kit: {
      weapons: 1,
      armor: true,
      coins: 180,
      supplies: 45,
      belt: ['grappling-hook'],
      pack: [
        {
          name: 'Sea Charts',
          note: 'A rolled bundle of coastlines, soundings and margin notes. Three of them are wrong and you know which.',
        },
        {
          name: 'Coil of Rope',
          note: 'Thirty fathoms of good line, spliced by you and worth rather more than it looks.',
        },
      ],
    },
  },

  {
    id: 'devout',
    name: 'Devout',
    tagline: 'You kept a vow long enough that it kept you.',
    art: null,
    tags: ['sacred', 'social', 'supplies'],
    blurb:
      'Temple, order or a shrine on a hill with three people attending. You gave years to something larger, and it gave you a shape to live inside. You may still believe every word of it. You may not. The habits stayed either way.\n\n' +
      'You sit with the dying, you feed whoever is at the door, and you have never once been turned away from a village you arrived at on foot.',
    picks: 3,
    skills: [FIELD_MEDIC, APOTHECARY, VIGIL, SCRIPTURE, ALMSGIVER, COMFORTER],
    kit: {
      weapons: 1,
      armor: true,
      coins: 150,
      supplies: 55,
      belt: ['healing-potion'],
      pack: [
        {
          name: 'Sacred Token',
          note: 'Worn smooth at one edge from being held. Whatever it depicts is no longer quite legible.',
        },
        {
          name: 'Book of Rites',
          note: 'The full order of service, birth to burial, annotated by four hands before yours.',
        },
      ],
    },
  },
];

/* ------------------------------------------------------------------ lookups */

/**
 * Every skill card in the codex, each exactly once — the shared ones sit in
 * several pools and must not be registered twice. weapons.js folds this into
 * the global card registry, so a background skill can be dealt onto the pile
 * and linked to like any other card.
 */
export const BACKGROUND_CARDS = [
  ...new Map(
    BACKGROUNDS.flatMap((background) => background.skills).map((skill) => [skill.id, skill])
  ).values(),
];

const BACKGROUND_BY_ID = new Map(BACKGROUNDS.map((b) => [b.id, b]));
const BACKGROUND_BY_NAME = new Map(BACKGROUNDS.map((b) => [b.name.toLowerCase(), b]));
const SKILL_BY_ID = new Map(BACKGROUND_CARDS.map((skill) => [skill.id, skill]));

/** By id or by name — the character row stores the plain name, as lineage does. */
export function getBackground(key) {
  if (!key) return null;
  const wanted = String(key).trim();
  return BACKGROUND_BY_ID.get(wanted) ?? BACKGROUND_BY_NAME.get(wanted.toLowerCase()) ?? null;
}

export function getBackgroundSkill(id) {
  return id ? SKILL_BY_ID.get(id) ?? null : null;
}

/** A background's tags as objects, in the order the tag table declares them. */
export function backgroundTags(background) {
  const held = new Set(background?.tags ?? []);
  return BACKGROUND_TAGS.filter((tag) => held.has(tag.id));
}

/** Only the tags something in the codex actually uses — the filter's whole list. */
export function usedBackgroundTags() {
  const used = new Set(BACKGROUNDS.flatMap((background) => background.tags));
  return BACKGROUND_TAGS.filter((tag) => used.has(tag.id));
}

/** How many skills a background hands out, held inside the allowed range. */
export function skillPicks(background) {
  const picks = Math.floor(Number(background?.picks) || MIN_SKILL_PICKS);
  return Math.min(MAX_SKILL_PICKS, Math.max(MIN_SKILL_PICKS, picks));
}

/* --------------------------------------------------------- reading the row */

/**
 * A stored skill list is only ever a hint. It may hold ids the codex has since
 * dropped, ids belonging to a background the character no longer has,
 * duplicates, or more picks than the background allows. Whatever comes in,
 * this returns ids that background really offers, each once, capped at its
 * pick count.
 */
export function normalizeBackgroundSkills(background, value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!Array.isArray(source) || !background) return [];

  const offered = new Set(background.skills.map((skill) => skill.id));
  const kept = [];
  for (const raw of source) {
    const id = typeof raw === 'string' ? raw : String(raw?.id ?? '');
    if (offered.has(id) && !kept.includes(id)) kept.push(id);
  }
  return kept.slice(0, skillPicks(background));
}

/**
 * A stored kit record, repaired. `null` means the kit has not been taken —
 * which is also how a malformed record is treated, since a record that cannot
 * be read cannot be handed back either.
 */
export function normalizeKit(value) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = null;
    }
  }
  if (!source || typeof source !== 'object') return null;

  const equipment = {};
  if (source.equipment && typeof source.equipment === 'object') {
    for (const [slot, id] of Object.entries(source.equipment)) {
      if (typeof id === 'string' && id) equipment[slot] = id;
    }
  }

  return {
    background: typeof source.background === 'string' ? source.background : '',
    armorSet: typeof source.armorSet === 'string' ? source.armorSet : '',
    weapons: (Array.isArray(source.weapons) ? source.weapons : []).filter(
      (id) => typeof id === 'string'
    ),
    // The three places a kit can put something, each recorded as it was handed
    // over: which slots it filled, which belt loops it clipped, and every id it
    // dropped in the pack — codex ids and minted `custom-` ones alike. This is
    // the whole receipt: handing back undoes exactly these and leaves anything
    // that has since moved on. A kit taken before slots were filled has only a
    // pack, and still hands back correctly.
    equipment,
    belt: (Array.isArray(source.belt) ? source.belt : [])
      .map((entry) => ({
        index: Math.floor(Number(entry?.index)),
        id: typeof entry?.id === 'string' ? entry.id : '',
      }))
      .filter((entry) => entry.id && Number.isFinite(entry.index) && entry.index >= 0),
    pack: (Array.isArray(source.pack) ? source.pack : []).filter((id) => typeof id === 'string'),
    coins: Math.max(0, Math.floor(Number(source.coins) || 0)),
    supplies: Math.max(0, Math.floor(Number(source.supplies) || 0)),
    ts: typeof source.ts === 'string' ? source.ts : '',
  };
}

/**
 * Everything the Advancement tab's background block needs, read off the
 * character row in one pass.
 *
 * `written` is what the row actually says. A name the codex does not know is
 * kept and shown as written rather than cleared — a table is free to invent
 * its own background, exactly as it may invent its own lineage.
 */
export function backgroundState(character) {
  const written = String(character?.background ?? '').trim();
  const background = getBackground(written);

  const skillIds = normalizeBackgroundSkills(background, character?.background_skills);
  const picks = background ? skillPicks(background) : 0;
  const kit = normalizeKit(character?.background_kit);

  return {
    written,
    background,
    skillIds,
    skills: skillIds.map(getBackgroundSkill).filter(Boolean),
    picks,
    remaining: Math.max(0, picks - skillIds.length),
    complete: Boolean(background) && skillIds.length >= picks,
    kit,
    taken: Boolean(kit),
  };
}

/* ----------------------------------------------------- writing the skill list
 * Both take the stored list and hand back the next one, so the block only ever
 * has to `patch({ background_skills: … })`. Neither mutates its input.
 */

/** Keep a skill, if that background offers it and a pick is still open. */
export function takeSkill(background, chosen, skillId) {
  const list = normalizeBackgroundSkills(background, chosen);
  if (list.includes(skillId)) return list;
  if (list.length >= skillPicks(background)) return list;
  if (!background?.skills.some((skill) => skill.id === skillId)) return list;
  return [...list, skillId];
}

/** Give a skill back. */
export function dropSkill(background, chosen, skillId) {
  return normalizeBackgroundSkills(background, chosen).filter((id) => id !== skillId);
}
