/**
 * The bestiary: what the party is fighting.
 *
 * A creature is not a character and it is not a minion. A character is a row
 * somebody owns and edits; a minion is a body a talent set hands to a character
 * and stores on their sheet. A creature is neither. It is **codex data**, shipped
 * with the site the way spells and weapons are, and the thing the table actually
 * plays is an *instance* of one, laid down inside an encounter. See
 * encounters.js, which owns the instance and never the printed page.
 *
 * ----------------------------------------------------------------- the source
 * The shape is transcribed from `data/Source Temp/Hazebound/Creatures/`, which
 * holds a blank template and one finished creature. Every field below is a line
 * on that page, in that page's own order:
 *
 *   LONG CREATURE NAME                Difficulty:   Minion - Level 1 - 10 XP
 *   Creature Type Details             Speed 3m(10f) / INI +3
 *      DEF: 8   HP: 8 (3d4)
 *      STR: 2  AGI: 2  INT: 2  WIT: 5
 *   Proficiencies:  Sense:  Language:
 *      AP: 6   RP: 3   WP: 8
 *   Blightbolt:                                                  ●●●●
 *     Ranged Attack. 10m(30f) + WIT - 1d4 + Half WIT Decay Damage
 *   Blight Surge:                                            ●●●●●●
 *     A creature you can see within 10m(30f) must make a WIT skill check 8 ...
 *   <the lore paragraph, in italic, at the foot>
 *
 * Two things about that page were superseded and both are noted where they bite:
 * it prints four attributes (STR/AGI/INT/WIT) where the live system runs on
 * three, and it gives its Minion 3 Reaction Points where a Minion now has none.
 *
 * ------------------------------------------------------- printed and derived
 * **What the page prints is printed here, and nothing recomputes it.** Health,
 * Defense, Speed, Willpower and the hit die are written per creature, because
 * the designer wrote them per creature: a Blightgeist has 8 Health at Level 1
 * where the character formula would hand it 30, and a bestiary that argued with
 * its own stat block would be worth nothing.
 *
 * What the page is silent about is derived exactly as a character's is, because
 * player cards roll against it and they must find the same numbers on both
 * sides of the table:
 *
 *   Initiative  Instinct + level, and the Blightgeist's printed +3 is that sum
 *   Reflex      Physique + Instinct
 *   Grit        Instinct + Mind
 *   Shield      half the printed Health, the site's own cap
 *
 * The hit die is the page's own arithmetic and is kept honest by hand: 3d4
 * averages 7.5 against a printed 8, so every die below averages what it sits
 * beside. `npm run lint:creatures` is what says so.
 *
 * ---------------------------------------------------------------- three ranks
 * Jules, 2026-08-31: "There is 3 type of enemies." They are RANKS below, and
 * they are data rather than three branches in a component:
 *
 *   Minion    "Low health enemies that easy to kill... their number is the
 *              danger. Cannot get reaction."
 *   General   "Stronger player level strength enemies, function like players
 *              with willpower and everything."
 *   Overlord  "whenever a player take a turn they gain 3 reaction points and
 *              their action bar is 12 by default. Have more health."
 *
 * A rank sets the two point pools and one rule about them, and that is the whole
 * of it: a Minion's Reaction Points are zero and can never be given, an
 * Overlord's Action Points are twelve and its Reaction Points arrive three at a
 * time on every player's turn.
 *
 * ------------------------------------------------------- environmental wards
 * "All of them can have passive that are environmental based like a lich which
 * has a shield that protects it until a pillar is destroyed."
 *
 * That is a passive whose condition is a *thing on the table* rather than
 * anything a sheet can check, so the sheet does not try. A passive carrying
 * `ward` is drawn with a switch beside it, the instance remembers which of its
 * wards have been broken, and the Game Master flips it when the pillars come
 * down. `while` is the sentence that holds while it stands, printed on the row
 * so nobody has to open the card to be reminded what they are turning off.
 *
 * This file reads nothing and writes nothing. It is a leaf, like spells.js.
 */

import { withArt } from './cardArt.js';

/* ------------------------------------------------------------------ the ranks */

/**
 * The three kinds of enemy, and what each one does with points.
 *
 * `reacts: false` is the Minion's whole rule and it is checked in one place
 * (`creatureStats`), so a Minion cannot be handed Reaction Points by a rank
 * default, a printed override, an Overlord's grant or a stray write.
 *
 * `perPlayerTurn` is the Overlord's grant. It is read by encounters.js when the
 * table crosses a turn and by nothing else; a rank with a zero there is simply
 * never asked.
 */
export const RANKS = [
  {
    id: 'minion',
    label: 'Minion',
    note: 'Their number is the danger.',
    color: 'var(--rank-minion)',
    ap: 6,
    reaction: 0,
    reacts: false,
    perPlayerTurn: 0,
    blurb:
      'Low Health and quick to kill. A Minion carries passives rather than special moves, and it cannot take reactions: it has no Reaction Points and can never be given any.',
  },
  {
    id: 'general',
    label: 'General',
    note: 'A body the party fights like one of their own.',
    color: 'var(--rank-general)',
    ap: 6,
    reaction: 6,
    reacts: true,
    perPlayerTurn: 0,
    blurb:
      'Player strength. A General runs on the clock a character does, six Action Points and six Reaction Points, and spends its own Willpower on everything it knows.',
  },
  {
    id: 'overlord',
    label: 'Overlord',
    note: 'The fight itself.',
    color: 'var(--rank-overlord)',
    ap: 12,
    reaction: 12,
    reacts: true,
    perPlayerTurn: 3,
    blurb:
      'A boss. An Overlord acts on twelve Action Points instead of six, and gains 3 Reaction Points every time a player takes a turn, so it answers the whole party rather than one of them.',
  },
];

const RANK_BY_ID = new Map(RANKS.map((rank) => [rank.id, rank]));

/** The rank a creature (or a rank id) belongs to. Minion for anything unknown. */
export function getRank(value) {
  const id = typeof value === 'string' ? value : value?.rank;
  return RANK_BY_ID.get(id) ?? RANKS[0];
}

/* ------------------------------------------------------------- the abilities */

/**
 * Everything a creature plays or simply is.
 *
 * Ordinary codex cards, in the codex's own shape, for the reason `minionCards`
 * gives: hand one to AbilityCard and it prints, hand one to UsePrompt and it
 * prices itself, hand one to rollPlan and it says what it rolls. A creature
 * needed no new component and gets no second grammar.
 *
 * `kind: 'creature'` for something it plays and `kind: 'passive'` for something
 * that is simply true of it, which is the split `isPassive` already makes and
 * the split the action block draws on: the first list is chips you tap, the
 * second is rows you read.
 *
 * The tags are the banner. `Creature` first so the card says what it is, then
 * the rank, then the type word off the creature's own type line, which is how
 * the printed page heads itself.
 */
export const CREATURE_CARDS = withArt([
  /* ------------------------------------------------------------- Blightgeist
     Both cards transcribed off Creature - Blightgeist.jpg, cost pips included:
     four green is 4 Action Points, two green and four purple is 2 and 4. */
  {
    id: 'blightbolt',
    name: 'Blightbolt',
    summary: 'A bolt of ambient rot, thrown at range for Decay damage.',
    kind: 'creature',
    tags: ['Creature', 'Minion', 'Undead'],
    ap: 4,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'Make a {stat} Ranged Attack {roll} against **an entity** you can see within **10 meters (30 feet)**.\n\n' +
      'On a hit, you deal [[1d4 + 0.5*stat]] {damage} damage.',
  },
  {
    id: 'blight-surge',
    name: 'Blight Surge',
    summary: 'A wave of blight that settles on anything that fails to shrug it off.',
    kind: 'creature',
    tags: ['Creature', 'Minion', 'Undead'],
    ap: 2,
    wp: 4,
    stat: 'mind',
    body:
      '**An entity** you can see within **10 meters (30 feet)** must make a {stat} skill check against 8 or gain [[1d4]] Blight.',
  },

  /* ---------------------------------------------------------------- Cinderling */
  {
    id: 'ember-rake',
    name: 'Ember Rake',
    summary: 'A raking swipe of burning cinder.',
    kind: 'creature',
    tags: ['Creature', 'Minion', 'Elemental'],
    ap: 3,
    stat: 'instinct',
    damage: ['Fire'],
    body:
      'Make an {stat} Melee Attack {roll} against **an entity** within **1 meter (3 feet)** of you.\n\n' +
      'On a hit, you deal [[1d4 + 0.5*stat]] {damage} damage.',
  },
  {
    id: 'death-throes',
    name: 'Death Throes',
    summary: 'It bursts when it dies, and takes whatever is beside it.',
    kind: 'passive',
    tags: ['Creature', 'Minion', 'Passive'],
    body:
      'When this creature drops to 0 Health, it bursts.\n\n' +
      '**All entities** within **3 meters (10 feet)** of it must make an {instinct} skill check against 10 or take [[2d4]] {damage:Fire} damage.',
  },

  /* --------------------------------------------------------- Fenrat Skirmisher */
  {
    id: 'gnashing-bite',
    name: 'Gnashing Bite',
    summary: 'A quick bite from something that never hunts alone.',
    kind: 'creature',
    tags: ['Creature', 'Minion', 'Beast'],
    ap: 3,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a {stat} Melee Attack {roll} against **an entity** within **1 meter (3 feet)** of you.\n\n' +
      'On a hit, you deal [[1d4 + 0.5*stat]] {damage} damage.',
  },
  {
    id: 'pack-tactics',
    name: 'Pack Tactics',
    summary: 'It fights better with its litter beside it.',
    kind: 'passive',
    tags: ['Creature', 'Minion', 'Passive'],
    body:
      'This creature has advantage on its Attack Rolls against **an entity** that another Fenrat is within **1 meter (3 feet)** of.',
  },

  /* ----------------------------------------------------------- Hollowed Knight */
  {
    id: 'grave-cleave',
    name: 'Grave Cleave',
    summary: 'A two-handed swing that carries through to a second body.',
    kind: 'creature',
    tags: ['Creature', 'General', 'Undead'],
    ap: 4,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a {stat} Melee Attack {roll} against **up to 2 entities** within **2 meters (6 feet)** of you.\n\n' +
      'On a hit, you deal [[2d6 + stat]] {damage} damage.',
  },
  {
    id: 'oathbroken-guard',
    name: 'Oathbroken Guard',
    summary: 'It steps in front of a blow meant for something else.',
    kind: 'creature',
    tags: ['Creature', 'General', 'Undead'],
    ap: 2,
    wp: 3,
    stat: 'physique',
    body:
      'When **an entity** within **2 meters (6 feet)** of you is hit, you take the damage instead and gain [[2*stat]] Shield against it.',
  },
  {
    id: 'hollow-vigil',
    name: 'Hollow Vigil',
    summary: 'What was left standing does not go down easily.',
    kind: 'passive',
    tags: ['Creature', 'General', 'Passive'],
    body:
      'The first time this creature would drop to 0 Health, it instead drops to 1 and gains [[3*stat]] Shield.',
    stat: 'physique',
  },

  /* ------------------------------------------------------------ Mireborn Hexer */
  {
    id: 'mire-hex',
    name: 'Mire Hex',
    summary: 'A hex that drags at the legs and holds a body in place.',
    kind: 'creature',
    tags: ['Creature', 'General', 'Humanoid'],
    ap: 3,
    wp: 4,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'Make a {stat} Roll {roll} against the Grit of **an entity** you can see within **12 meters (40 feet)**.\n\n' +
      'On a success, you deal [[2d6 + stat]] {damage} damage and it is rooted for **3 turns**.',
    sub_name: 'Overcast',
    sub_body:
      'You can spend an additional 2 Willpower to target **an additional entity** within range.',
  },
  {
    id: 'drown-the-lungs',
    name: 'Drown the Lungs',
    summary: 'Bog water, called into a chest that has no room for it.',
    kind: 'creature',
    tags: ['Creature', 'General', 'Humanoid'],
    ap: 5,
    wp: 6,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'Make a {stat} Roll {roll} against the Grit of **all entities** in a **4-meter (13-foot)** area centered on a point you can see within **12 meters (40 feet)**.\n\n' +
      'On a success, you deal [[3d6 + 2*stat]] {damage} damage, or half as much on a failure.',
  },
  {
    id: 'bog-born',
    name: 'Bog Born',
    summary: 'The mire is where it came from and where it is strongest.',
    kind: 'passive',
    tags: ['Creature', 'General', 'Passive'],
    ward: 'While the mire is unburned',
    while: 'While the mire around it is unburned, it has resistance to Frost and Decay damage, and it moves through mud at full Movement Speed.',
    body:
      'While the mire around it is unburned, this creature has resistance to {damage:Frost} and {damage:Decay} damage, and it moves through mud at its full Movement Speed.\n\n' +
      'Burn the mire and it loses both.',
  },

  /* ------------------------------------------------------------ Ashmaw Stalker */
  {
    id: 'pounce',
    name: 'Pounce',
    summary: 'It closes the distance and lands with its whole weight.',
    kind: 'creature',
    tags: ['Creature', 'General', 'Beast'],
    ap: 4,
    stat: 'instinct',
    damage: ['Blunt'],
    body:
      'Leap at **an entity** you can see within **12 meters (40 feet)** and land beside it.\n\n' +
      'Make an {stat} Melee Attack {roll} against it. On a hit, you deal [[2d6 + stat]] {damage} damage and it is knocked prone.',
  },
  {
    id: 'ashmaw-rend',
    name: 'Rend',
    summary: 'Two claws into a body that is already down.',
    kind: 'creature',
    tags: ['Creature', 'General', 'Beast'],
    ap: 3,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an {stat} Melee Attack {roll} against **an entity** within **2 meters (6 feet)** of you, with advantage if it is prone.\n\n' +
      'On a hit, you deal [[2d6 + stat]] {damage} damage.',
  },
  {
    id: 'blood-scent',
    name: 'Blood Scent',
    summary: 'It knows which of you is already hurt.',
    kind: 'passive',
    tags: ['Creature', 'General', 'Passive'],
    body:
      'This creature knows the Health of every entity within **30 meters (100 feet)**, and it has advantage on Attack Rolls against any of them below half their Health.',
  },

  /* ---------------------------------------------------------- Vaultkeeper Lich */
  {
    id: 'withering-word',
    name: 'Withering Word',
    summary: 'One syllable, and something ages a century in a breath.',
    kind: 'creature',
    tags: ['Creature', 'Overlord', 'Undead'],
    ap: 4,
    wp: 5,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'Make a {stat} Roll {roll} against the Grit of **an entity** you can see within **20 meters (65 feet)**.\n\n' +
      'On a success, you deal [[4d6 + 2*stat]] {damage} damage and it cannot restore Health for **3 turns**.',
  },
  {
    id: 'call-the-vault',
    name: 'Call the Vault',
    summary: 'The dead of the vault stand up where they fell.',
    kind: 'creature',
    tags: ['Creature', 'Overlord', 'Undead'],
    ap: 6,
    wp: 8,
    stat: 'mind',
    body:
      'Raise **up to 3 Minions** from the bodies in the vault, at a point you can see within **20 meters (65 feet)**.\n\n' +
      'They act on your Turn and they last **until the fight ends**.',
  },
  {
    id: 'ward-of-the-four-pillars',
    name: 'Ward of the Four Pillars',
    summary: 'Four pillars hold a ward, and the ward holds the lich.',
    kind: 'passive',
    tags: ['Creature', 'Overlord', 'Passive'],
    ward: 'While a pillar still stands',
    while: 'While any of the four pillars still stands, no damage reaches its Health.',
    body:
      'While any of the four pillars still stands, this creature takes no damage: every hit is spent on the ward instead.\n\n' +
      'Bring down all four and the ward falls with them.',
  },

  /* ----------------------------------------------------------- Thornmother */
  {
    id: 'thorn-volley',
    name: 'Thorn Volley',
    summary: 'The grove fires, and it fires at everyone.',
    kind: 'creature',
    tags: ['Creature', 'Overlord', 'Plant'],
    ap: 5,
    wp: 4,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a {stat} Ranged Attack {roll} against **all entities** you can see within **15 meters (50 feet)**.\n\n' +
      'On a hit, you deal [[3d6 + stat]] {damage} damage.',
  },
  {
    id: 'strangling-roots',
    name: 'Strangling Roots',
    summary: 'Roots come up under a body and do not let go.',
    kind: 'creature',
    tags: ['Creature', 'Overlord', 'Plant'],
    ap: 4,
    wp: 6,
    stat: 'physique',
    damage: ['Blunt'],
    body:
      'Make a {stat} Roll {roll} against the Reflex of **up to 3 entities** you can see within **15 meters (50 feet)**.\n\n' +
      'On a success, each is rooted and takes [[2d6 + stat]] {damage} damage at every Turn Start until it breaks free.',
  },
  {
    id: 'rooted-in-the-grove',
    name: 'Rooted in the Grove',
    summary: 'While the grove lives, so does she.',
    kind: 'passive',
    tags: ['Creature', 'Overlord', 'Passive'],
    ward: 'While the grove burns unchecked',
    while: 'While the grove is unburned, she restores 20 Health at every Turn Start.',
    body:
      'While the grove around her is unburned, this creature restores [[20]] Health at every Turn Start.\n\n' +
      'Set the grove alight and it stops.',
  },

  /* ------------------------------------------------------- Emberthrone Tyrant */
  {
    id: 'tyrants-breath',
    name: "Tyrant's Breath",
    summary: 'A cone of throne-fire, and nowhere in it is safe.',
    kind: 'creature',
    tags: ['Creature', 'Overlord', 'Dragon'],
    ap: 6,
    wp: 6,
    stat: 'physique',
    damage: ['Fire'],
    body:
      'Make a {stat} Roll {roll} against the Reflex of **all entities** in a **12-meter (40-foot)** cone in front of you.\n\n' +
      'On a success, you deal [[5d6 + 2*stat]] {damage} damage, or half as much on a failure.',
  },
  {
    id: 'wing-buffet',
    name: 'Wing Buffet',
    summary: 'One beat of the wings, and the front rank is on its back.',
    kind: 'creature',
    tags: ['Creature', 'Overlord', 'Dragon'],
    ap: 3,
    stat: 'physique',
    damage: ['Blunt'],
    body:
      'Make a {stat} Roll {roll} against the Reflex of **all entities** within **4 meters (13 feet)** of you.\n\n' +
      'On a success, you deal [[2d6 + stat]] {damage} damage and push it **6 meters (20 feet)** away, knocking it prone.',
  },
  {
    id: 'throne-of-embers',
    name: 'Throne of Embers',
    summary: 'It burns hotter the longer the braziers burn.',
    kind: 'passive',
    tags: ['Creature', 'Overlord', 'Passive'],
    ward: 'While a brazier is lit',
    while: 'While a brazier is lit, its damage is Elevated by 1 and it has resistance to Fire damage.',
    body:
      'While any of the six braziers is lit, this creature has resistance to {damage:Fire} damage and its damage is Elevated by 1.\n\n' +
      'Douse them all and both go out with them.',
  },
]);

const CARD_BY_ID = new Map(CREATURE_CARDS.map((card) => [card.id, card]));

/** One creature card by id, or null. Named apart from `getCard` on purpose:
    this file is a leaf and cannot reach the codex registry that holds them all. */
export function getCreatureCard(id) {
  return CARD_BY_ID.get(String(id ?? '')) ?? null;
}

/* -------------------------------------------------------------- the bestiary */

/**
 * Nine creatures, three of each rank, so every rule above has something on the
 * board proving it (Jules, 2026-08-31: "Imagine three of each for the test").
 *
 * The Blightgeist is not one of the nine invented: it is the finished creature
 * off the design sheet, transcribed line for line, and it is the one that fixes
 * what all the others are measured against.
 *
 * Ordered rank first and by level inside a rank, which is what every list of
 * these draws in and what `sortCreatures` hands back.
 */
export const CREATURES = [
  /* ================================================================ MINIONS */

  {
    /* Transcribed from data/Source Temp/Hazebound/Creatures/Creature -
       Blightgeist.jpg. Two readings are marked below and neither is a choice
       about what this creature is:

         attributes  the page prints STR 2, AGI 2, INT 2, WIT 5. The live system
                     runs on three, and the page's own Blightbolt casts off WIT,
                     so WIT is the caster's attribute and lands on Mind. STR is
                     Physique and AGI is Instinct. INT has nowhere of its own to
                     go and is the same 2 as the rest, so nothing is lost.
         reactions   the page prints RP: 3, and a Minion now cannot take
                     reactions at all. The rule wins over the page: this is 0,
                     and `creatureStats` is where it is forced. */
    id: 'blightgeist',
    name: 'Blightgeist',
    rank: 'minion',
    level: 1,
    xp: 10,
    type: 'Small Undead',
    difficulty: '',
    speed_m: 3,
    avoid: 8,
    armor: 0,
    health_max: 8,
    hit_die: '3d4',
    physique: 2,
    instinct: 2,
    mind: 5,
    willpower_max: 8,
    proficiencies: 'none',
    sense: 'Darkvision 10 meters (30 feet)',
    language: 'none',
    cards: ['blightbolt', 'blight-surge'],
    /* The foot of the page, with its one em dash restructured into a colon.
       Punctuation is the only edit allowed on the designer's prose. See
       docs/text-style.md. */
    lore:
      'Blightgeists are eerie manifestations of the ambient blight, clinging to existence with an insidious purpose: to propagate their malevolent blight onto any living beings unfortunate enough to cross their path.',
  },

  {
    id: 'cinderling',
    name: 'Cinderling',
    rank: 'minion',
    level: 2,
    xp: 15,
    type: 'Small Elemental',
    difficulty: '',
    speed_m: 5,
    avoid: 9,
    armor: 0,
    health_max: 5,
    hit_die: '2d4',
    physique: 2,
    instinct: 4,
    mind: 1,
    willpower_max: 0,
    proficiencies: 'none',
    sense: 'Darkvision 10 meters (30 feet)',
    language: 'none',
    cards: ['ember-rake', 'death-throes'],
    lore:
      'A cinderling is what is left when a fire is put out badly. It has no interest in warmth and no memory of what it burned, only the certainty that it is going out soon and the will to take something with it.',
  },

  {
    id: 'fenrat-skirmisher',
    name: 'Fenrat Skirmisher',
    rank: 'minion',
    level: 1,
    xp: 10,
    type: 'Small Beast',
    difficulty: '',
    speed_m: 6,
    avoid: 9,
    armor: 0,
    health_max: 7,
    hit_die: '2d6',
    physique: 3,
    instinct: 5,
    mind: 1,
    willpower_max: 0,
    proficiencies: 'Stealth',
    sense: 'Darkvision 15 meters (50 feet)',
    language: 'none',
    cards: ['gnashing-bite', 'pack-tactics'],
    lore:
      'Fenrats are the fen made ambulatory. One is a nuisance you kick away. Nine of them have already decided which of you is slowest, and they were counting long before you noticed them.',
  },

  /* =============================================================== GENERALS */

  {
    id: 'hollowed-knight',
    name: 'Hollowed Knight',
    rank: 'general',
    level: 4,
    xp: 450,
    type: 'Medium Undead',
    difficulty: '',
    speed_m: 4,
    avoid: 14,
    armor: 3,
    health_max: 91,
    hit_die: '14d12',
    physique: 6,
    instinct: 3,
    mind: 2,
    willpower_max: 22,
    proficiencies: 'Heavy Armor, Longsword',
    sense: 'Darkvision 15 meters (50 feet)',
    language: 'Common',
    cards: ['grave-cleave', 'oathbroken-guard', 'hollow-vigil'],
    lore:
      'The armor is still buckled the way its squire buckled it, the morning of a battle nobody now remembers the name of. Whatever is inside it has kept every habit of the knight and none of the reasons.',
  },

  {
    id: 'mireborn-hexer',
    name: 'Mireborn Hexer',
    rank: 'general',
    level: 5,
    xp: 800,
    type: 'Medium Humanoid',
    difficulty: '',
    speed_m: 4,
    avoid: 12,
    armor: 0,
    health_max: 66,
    hit_die: '12d10',
    physique: 4,
    instinct: 4,
    mind: 7,
    willpower_max: 34,
    proficiencies: 'Herbalism',
    sense: 'Darkvision 10 meters (30 feet)',
    language: 'Common, Sylvan',
    cards: ['mire-hex', 'drown-the-lungs', 'bog-born'],
    lore:
      'They were villagers once, on ground that went under and stayed under. What they learned down there they learned from the water, and the water has never once been asked to give something back.',
  },

  {
    id: 'ashmaw-stalker',
    name: 'Ashmaw Stalker',
    rank: 'general',
    level: 4,
    xp: 450,
    type: 'Large Beast',
    difficulty: '',
    speed_m: 8,
    avoid: 13,
    armor: 1,
    health_max: 104,
    hit_die: '16d12',
    physique: 7,
    instinct: 6,
    mind: 2,
    willpower_max: 20,
    proficiencies: 'Stealth, Tracking',
    sense: 'Blindsight 12 meters (40 feet)',
    language: 'none',
    cards: ['pounce', 'ashmaw-rend', 'blood-scent'],
    lore:
      'It hunts the burn scars, where the ash holds a scent for weeks and nothing else is patient enough to read one. You will hear it once, behind you, and that will be the only warning it intends to give.',
  },

  /* =============================================================== OVERLORDS */

  {
    /* The lich Jules named: "a lich which has a shield that protects it until a
       pillar is destroyed". Its ward is the first environmental passive in the
       codex and the shape every other one follows. */
    id: 'vaultkeeper-lich',
    name: 'Vaultkeeper Lich',
    rank: 'overlord',
    level: 8,
    xp: 4000,
    type: 'Medium Undead',
    difficulty: '',
    speed_m: 4,
    avoid: 17,
    armor: 2,
    health_max: 156,
    hit_die: '24d12',
    physique: 5,
    instinct: 5,
    mind: 10,
    willpower_max: 46,
    proficiencies: 'Arcana, Vault Lore',
    sense: 'Truesight 20 meters (65 feet)',
    language: 'Common, Draconic, Abyssal',
    cards: ['withering-word', 'call-the-vault', 'ward-of-the-four-pillars'],
    lore:
      'It has not left the vault in four hundred years and does not consider this an imprisonment. Everything it ever wanted is shelved here, catalogued, and it will explain the filing system to you at length before it kills you.',
  },

  {
    id: 'thornmother',
    name: 'Thornmother',
    rank: 'overlord',
    level: 9,
    xp: 6000,
    type: 'Huge Plant',
    difficulty: '',
    speed_m: 3,
    avoid: 16,
    armor: 4,
    health_max: 208,
    hit_die: '32d12',
    physique: 9,
    instinct: 3,
    mind: 6,
    willpower_max: 38,
    proficiencies: 'none',
    sense: 'Tremorsense 30 meters (100 feet)',
    language: 'Sylvan',
    cards: ['thorn-volley', 'strangling-roots', 'rooted-in-the-grove'],
    lore:
      'The grove is not where she lives. The grove is her, out to the last seedling, and every axe taken to it these two hundred years is a wound she has counted and kept.',
  },

  {
    id: 'emberthrone-tyrant',
    name: 'Emberthrone Tyrant',
    rank: 'overlord',
    level: 10,
    xp: 9000,
    type: 'Huge Dragon',
    difficulty: '',
    speed_m: 7,
    avoid: 18,
    armor: 5,
    health_max: 195,
    hit_die: '30d12',
    physique: 8,
    instinct: 6,
    mind: 7,
    willpower_max: 44,
    proficiencies: 'Intimidation',
    sense: 'Darkvision 30 meters (100 feet)',
    language: 'Common, Draconic',
    cards: ['tyrants-breath', 'wing-buffet', 'throne-of-embers'],
    lore:
      'It sits its hoard the way a king sits a throne, which is to say badly and without ever getting up. The braziers around it have been kept lit by hands it no longer bothers to look at.',
  },
];

const BY_ID = new Map(CREATURES.map((creature) => [creature.id, creature]));

/** One creature by id, or null for a link into nothing. */
export function getCreature(id) {
  return BY_ID.get(String(id ?? '')) ?? null;
}

/* --------------------------------------------------------------- the numbers */

/**
 * Everything a creature's page says about it, printed and derived together.
 *
 * The same shape `deriveStats` hands back for a character and `minionDerived`
 * for a creature on a leash, so the very same tiles draw all three. That is not
 * tidiness, it is the readability the whole block is built on: a Grit on an
 * enemy has to be drawn in the same box as a Grit on the party or nobody can
 * compare the two mid-fight.
 *
 * The printed numbers pass straight through. The four the page never printed
 * are the character's own arithmetic. The two point pools come off the rank
 * unless the creature overrode them, and a Minion's Reaction Points are forced
 * to zero last, after everything, because "cannot get reaction" is a rule about
 * the creature rather than a default about its rank.
 */
export function creatureStats(creature) {
  const rank = getRank(creature);
  const p = Math.floor(Number(creature?.physique) || 0);
  const i = Math.floor(Number(creature?.instinct) || 0);
  const m = Math.floor(Number(creature?.mind) || 0);
  const level = Math.max(1, Math.floor(Number(creature?.level) || 1));

  const health_max = Math.max(1, Math.floor(Number(creature?.health_max) || 1));
  const ap_max = Math.max(0, Math.floor(Number(creature?.ap_max ?? rank.ap) || 0));
  const printedReaction = Math.max(
    0,
    Math.floor(Number(creature?.reaction_max ?? rank.reaction) || 0)
  );

  return {
    health_max,
    shield_cap: Math.floor(health_max / 2),
    willpower_max: Math.max(0, Math.floor(Number(creature?.willpower_max) || 0)),
    avoid: Math.floor(Number(creature?.avoid) || 0),
    defense: Math.floor(Number(creature?.armor) || 0),
    initiative: i + level,
    // The one value that keeps its half, exactly as a character's does.
    speed_m: Number(creature?.speed_m) || 0,
    ap_max,
    // A Minion has none and can never be given any. The one place that is true.
    reaction_max: rank.reacts ? printedReaction : 0,
    reflex: p + i,
    grit: i + m,
  };
}

/** The cards it plays and the cards it simply is, split the codex's own way. */
export function creatureCards(creature) {
  return (creature?.cards ?? []).map(getCreatureCard).filter(Boolean);
}

/** What it plays: everything with a price on it. */
export function creatureMoves(creature) {
  return creatureCards(creature).filter((card) => card.kind !== 'passive');
}

/** What is simply true of it, wards included. */
export function creaturePassives(creature) {
  return creatureCards(creature).filter((card) => card.kind === 'passive');
}

/**
 * The passives whose condition is a thing on the table rather than anything the
 * sheet can check. Each is drawn with a switch, and the instance remembers which
 * ones have been broken. See `wardsOf` in encounters.js, which is what reads the
 * memory; this only says which passives have a switch at all.
 */
export function creatureWards(creature) {
  return creaturePassives(creature).filter((card) => Boolean(card.ward));
}

/* ---------------------------------------------------------------- the shelf */

/** Rank order, then level, then name: the order every list of creatures draws. */
export function sortCreatures(list) {
  const rankAt = (creature) => RANKS.findIndex((rank) => rank.id === creature?.rank);
  return [...list].sort(
    (a, b) =>
      rankAt(a) - rankAt(b) ||
      (a.level ?? 0) - (b.level ?? 0) ||
      String(a.name).localeCompare(String(b.name))
  );
}

/** The bestiary in its printed order, or one rank of it. */
export function bestiary(rank = null) {
  const list = rank ? CREATURES.filter((creature) => creature.rank === rank) : CREATURES;
  return sortCreatures(list);
}

/**
 * The line the printed page heads itself with: `Minion - Level 1 - 10 XP`.
 *
 * Hyphens rather than the site's own middot, because this one is the design
 * sheet's own punctuation and the block is a transcription of that sheet.
 */
export function difficultyLine(creature) {
  const rank = getRank(creature);
  const xp = Math.max(0, Math.floor(Number(creature?.xp) || 0));
  return `${rank.label} - Level ${creature?.level ?? 1} - ${xp} XP`;
}
