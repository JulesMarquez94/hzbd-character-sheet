/**
 * The bestiary: what the party is fighting.
 *
 * A creature is not a character and it is not a minion. A character is a row
 * somebody owns and edits; a minion is a body a talent set hands to a character
 * and stores on their sheet. A creature is neither. It is **codex data**, shipped
 * with the site the way spells and weapons are, and the thing the table actually
 * plays is an *instance* of one, laid down inside an encounter at a level of its
 * own. See encounters.js, which owns the instance and never the printed page.
 *
 * ----------------------------------------------------------------- the source
 * The shape is transcribed from `data/Source Temp/Hazebound/Creatures/`, which
 * holds a blank template and one finished creature:
 *
 *   LONG CREATURE NAME                Difficulty:   Minion - Level 1 - 10 XP
 *   Creature Type Details             Speed 3m(10f) / INI +3
 *      DEF: 8   HP: 8 (3d4)
 *      STR: 2  AGI: 2  INT: 2  WIT: 5
 *   Proficiencies:  Sense:  Language:
 *      AP: 6   RP: 3   WP: 8
 *   Blightbolt:                                                  ●●●●
 *     Ranged Attack. 10m(30f) + WIT - 1d4 + Half WIT Decay Damage
 *   <the lore paragraph, in italic, at the foot>
 *
 * ------------------------------------------------------------- a creature scales
 * Jules, 2026-08-31: "All enemies should have a level scale option... most enemy
 * should have a strong stat that reach 12 the max at the same time they hit
 * level 12. Should have the same stat pattern as others. Just for the conversion
 * to health or willpower is custom value. Then the rest get bonus set at the
 * creation."
 *
 * So **almost nothing about a creature is a printed number any more.** It is a
 * shape plus a handful of coefficients, and a level turns those into a stat
 * block. Which means a Blightgeist can be dropped into a level 9 fight and still
 * be a Blightgeist.
 *
 * The curve is **the character's own**, which is what "the same stat pattern as
 * others" asks for. A character starts at 4 in each attribute, takes +2 and +1
 * on two different attributes at level 1, and +1 on two different attributes at
 * every odd level after (see levelPicks.js). Read against a creature's declared
 * `primary` and `secondary`:
 *
 *   primary    4 + 2 + one per odd level from 3
 *   secondary  4 + 1 + one per odd level from 3
 *   the third  4
 *
 * plus the creature's own `bonus`, which is the "rest set at the creation" half:
 * a flat spread that makes a Thornmother slow and enormous and a Blightgeist
 * frail. **A `bonus` of +1 on the primary is what carries it to 12 at level 12**,
 * where a character without a lineage tops out at 11.
 *
 * What stays custom per creature is exactly what Jules named, and no more:
 *
 *   health      `perLevel` and `perPhysique`, where a character is 10 and 10
 *   willpower   `perLevel`, `perMind` and `flat`, where a character is 2, 2, 10
 *
 * And one thing that is not an attribute and has to come from somewhere:
 *
 *   avoid       Instinct + `avoid_bonus`, which is exactly how a character's
 *               Defense works (their Instinct plus what they are wearing), so a
 *               level 12 Minion is not hit automatically. Jules's ruling. A
 *               creature wearing a full armor family changes what that base is
 *               made of, exactly as a character's set does: see CREATURE_ARMOR.
 *
 * Speed and Armor stay printed, because neither is an attribute and neither
 * breaks at level 12 the way an unscaled Defense would.
 *
 * ------------------------------------------------------- Health is not rolled
 * Jules, 2026-09-02: "Health is not rolled." A creature's Health is the number
 * the conversions produce and nothing else. The design sheet printed a hit die
 * beside it ("HP: 8 (3d4)") and this file used to derive one, so that the count
 * always averaged the Health; the ruling supersedes the page the way the Minion
 * reaction rule supersedes its printed RP: 3, and both supersedes are marked
 * where they happen.
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
 * `ward` is drawn with a switch, the instance remembers which of its wards have
 * been broken, and the Game Master flips it when the pillars come down. `while`
 * is the sentence that holds while it stands, printed on the row so nobody has
 * to open the card to be reminded what they are turning off.
 *
 * ------------------------------------------------------- and forged creatures
 * Everything above is the codex's. A table can also forge a creature of its own,
 * which is a row in the database rather than a page in this file, and it has to
 * answer to `getCreature` like any other because every reader of a creature goes
 * through that. So there is one mutable map beside the frozen list, filled from
 * above by src/lib/customCreatures.js. See the note on FORGED for the two rules
 * that make it safe, one of which is why `creatureCards` takes card objects as
 * well as ids.
 *
 * This file reads nothing and writes nothing. It is a leaf, like spells.js.
 */

import { withArt } from './cardArt.js';

/** The ceiling a creature climbs to, and the one characters climb to. Repeated
    rather than imported: this file is a leaf and characterModel.js is not. */
export const CREATURE_MAX_LEVEL = 12;

/** What every body on the board starts each attribute at. ATTRIBUTE_BASE's twin,
    repeated for the same reason. */
const BASE = 4;

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

/* ---------------------------------------------------------------- conjured */

/**
 * The one body on the table that is not a creature: a thing a spell made.
 *
 * HARD LIGHT's wall, DEVOURING BLOSSOM's flower, GUARDIAN ANGEL's angel and
 * SHAPE EARTH's pillar all have Health and Defense the card works out off the
 * caster, and nothing else: no attributes, no turn, no cards. They are put in
 * an encounter's pile as rows whose `creature` is this stub, so that every
 * writer keyed on a creature id still resolves, and whose numbers ride on the
 * row itself. See `addConjured` in encounters.js.
 *
 * Deliberately not in RANKS and not in CREATURES: it is not on the bestiary
 * shelf, it is never added by hand, and no rank rule is about it.
 */
export const CONJURED_ID = 'conjured';

export const CONJURED_RANK = {
  id: 'conjured',
  label: 'Conjured',
  note: 'Made by a spell, and gone when it is.',
  color: 'var(--haze-glow)',
  ap: 0,
  reaction: 0,
  reacts: false,
  perPlayerTurn: 0,
  blurb:
    'A thing a spell made: a wall, a flower, a guardian. It has Health and Defense and nothing else. It takes no turn of its own. It is gone when its Health is, when its caster rests or when its card says so.',
};

const CONJURED_CREATURE = {
  id: CONJURED_ID,
  name: 'Conjured',
  type: 'Conjured',
  rank: 'minion',
  level: 1,
  primary: 'physique',
  secondary: 'instinct',
  health: { perLevel: 0, perPhysique: 0 },
  willpower: {},
  speed_m: 0,
  armor: 0,
  xp: 0,
  cards: [],
  lore: 'Something a spell put on the table. Read the card that made it for what it does.',
};

/* ------------------------------------------------------------------ the armor */

/**
 * What a creature is wearing, as one of the three armor families a character
 * can wear a full set of.
 *
 * Jules, 2026-09-02: "Instead of adding a value to armor let the creator choose
 * light, heavy or spelled. Let them give a bonus." A creature has no armor
 * slots to fill, so what it has is the *family*, and the family means exactly
 * what a full set means for a character: it changes what Defense is built from.
 * See docs/rulebook.md 7.2, and ARMOR_SETS in items.js, which is the same three
 * rules for the sheet's own gear.
 *
 * Repeated here rather than imported, for the reason CREATURE_MAX_LEVEL and
 * BASE are repeated: this file is a leaf, and items.js reaches weapons.js, which
 * reaches back here.
 *
 * `base` is which of the creature's numbers Defense starts from, and `half` is
 * Heavy's rider on top of it. The bonus a Game Master types is `avoid_bonus`,
 * which is added whatever the family: "flat Defense from gear stacks on top of a
 * set bonus" is the rulebook's own second ruling, and it is the reason a family
 * is a choice about the *base* rather than a replacement for the whole number.
 *
 * A creature wearing nothing at all is the first entry, and it is what every
 * printed page in this file is: Defense off Instinct, which is what it always
 * was, so nothing had to be rewritten when the families arrived.
 */
export const CREATURE_ARMOR = [
  {
    id: 'none',
    label: 'None',
    note: 'Hide, scales, or nothing at all.',
    base: 'instinct',
    half: false,
    active: 'Defense is its Instinct.',
  },
  {
    id: 'light',
    label: 'Light',
    note: 'Leather and quickness.',
    base: 'reflex',
    half: false,
    active: 'Defense is equal to its Reflex.',
  },
  {
    id: 'heavy',
    label: 'Heavy',
    note: 'Plate. What it wears is what saves it.',
    base: 'instinct',
    half: true,
    active: 'Defense is increased by half its Armor.',
  },
  {
    /* The rulebook and items.js both call this family **Magic Armor**; Jules
       named it "spelled", which is what backgrounds.js calls it on SPELLED ARMOR
       MASTERY. The codex's own word wins here so that a creature and a character
       are read against one table, and the disagreement between those two files
       is left where it is rather than doubled. */
    id: 'magic',
    label: 'Magic',
    note: 'Worked cloth and wards.',
    base: 'grit',
    half: false,
    active: 'Defense is based on its Grit.',
  },
];

const ARMOR_BY_ID = new Map(CREATURE_ARMOR.map((armor) => [armor.id, armor]));

/** The armor family a creature (or a family id) wears. None for anything
    unknown, which is what every printed page in this file wears. */
export function getCreatureArmor(value) {
  const id = typeof value === 'string' ? value : value?.armor_set;
  return ARMOR_BY_ID.get(id) ?? CREATURE_ARMOR[0];
}

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
 * off the design sheet, and its `bonus` and coefficients are set so that **at
 * its own printed level 1 it prints its own page**: STR 2, WIT 5, DEF 8, HP 8
 * (3d4), WP 8. Everything above level 1 is the curve's.
 *
 * `level` is the level the creature is *written* at, and it is only a default:
 * an encounter sets its own (see `foeLevel` in encounters.js).
 *
 * `xp` is XP **per level**, so the Difficulty line reads its own arithmetic at
 * whatever level it is standing at.
 */
export const CREATURES = [
  /* ================================================================ MINIONS */

  {
    /* Transcribed from data/Source Temp/Hazebound/Creatures/Creature -
       Blightgeist.jpg. Two readings are marked here and neither is a choice
       about what this creature is:

         attributes  the page prints STR 2, AGI 2, INT 2, WIT 5. The live system
                     runs on three, and the page's own Blightbolt casts off WIT,
                     so WIT is the caster's attribute and lands on Mind. STR is
                     Physique and AGI is Instinct. INT has nowhere of its own to
                     go, and it printed the same 2 as STR, so nothing is lost.
         reactions   the page prints RP: 3, and a Minion now cannot take
                     reactions at all. The rule wins over the page: this is 0,
                     and `creatureStats` is where it is forced.

       At level 1 the numbers below reproduce the page exactly. Checked by
       `npm run lint:creatures`, which is the only reason to trust that sentence. */
    id: 'blightgeist',
    name: 'Blightgeist',
    rank: 'minion',
    level: 1,
    xp: 10,
    type: 'Small Undead',
    primary: 'mind',
    secondary: 'instinct',
    bonus: { physique: -2, instinct: -3, mind: -1 },
    health: { perLevel: 4, perPhysique: 2 },
    willpower: { perLevel: 1, perMind: 1, flat: 2 },
    avoid_bonus: 6,
    armor: 0,
    speed_m: 3,
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
    xp: 8,
    type: 'Small Elemental',
    primary: 'instinct',
    secondary: 'physique',
    bonus: { physique: -1, instinct: -2, mind: -3 },
    health: { perLevel: 2, perPhysique: 1 },
    willpower: { perLevel: 0, perMind: 0, flat: 0 },
    avoid_bonus: 4,
    armor: 0,
    speed_m: 5,
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
    primary: 'instinct',
    secondary: 'physique',
    bonus: { physique: -1, instinct: -1, mind: -3 },
    health: { perLevel: 1, perPhysique: 1.5 },
    willpower: { perLevel: 0, perMind: 0, flat: 0 },
    avoid_bonus: 4,
    armor: 0,
    speed_m: 6,
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
    xp: 110,
    type: 'Medium Undead',
    primary: 'physique',
    secondary: 'instinct',
    bonus: { physique: 1, instinct: -2, mind: -2 },
    health: { perLevel: 8, perPhysique: 8 },
    willpower: { perLevel: 2, perMind: 2, flat: 8 },
    avoid_bonus: 6,
    armor: 4,
    speed_m: 4,
    cards: ['grave-cleave', 'oathbroken-guard', 'hollow-vigil'],
    lore:
      'The armor is still buckled the way its squire buckled it, the morning of a battle nobody now remembers the name of. Whatever is inside it has kept every habit of the knight and none of the reasons.',
  },

  {
    id: 'mireborn-hexer',
    name: 'Mireborn Hexer',
    rank: 'general',
    level: 5,
    xp: 130,
    type: 'Medium Humanoid',
    primary: 'mind',
    secondary: 'instinct',
    bonus: { physique: -1, instinct: -1, mind: 1 },
    health: { perLevel: 6, perPhysique: 6 },
    willpower: { perLevel: 2, perMind: 2, flat: 10 },
    avoid_bonus: 4,
    armor: 0,
    speed_m: 4,
    cards: ['mire-hex', 'drown-the-lungs', 'bog-born'],
    lore:
      'They were villagers once, on ground that went under and stayed under. What they learned down there they learned from the water, and the water has never once been asked to give something back.',
  },

  {
    id: 'ashmaw-stalker',
    name: 'Ashmaw Stalker',
    rank: 'general',
    level: 4,
    xp: 110,
    type: 'Large Beast',
    primary: 'physique',
    secondary: 'instinct',
    bonus: { physique: 1, instinct: 1, mind: -2 },
    health: { perLevel: 8, perPhysique: 8 },
    willpower: { perLevel: 2, perMind: 2, flat: 6 },
    avoid_bonus: 4,
    armor: 1,
    speed_m: 8,
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
    xp: 500,
    type: 'Medium Undead',
    primary: 'mind',
    secondary: 'instinct',
    bonus: { physique: -1, instinct: 0, mind: 1 },
    health: { perLevel: 14, perPhysique: 14 },
    willpower: { perLevel: 2, perMind: 3, flat: 10 },
    avoid_bonus: 6,
    armor: 2,
    speed_m: 4,
    cards: ['withering-word', 'call-the-vault', 'ward-of-the-four-pillars'],
    lore:
      'It has not left the vault in four hundred years and does not consider this an imprisonment. Everything it ever wanted is shelved here, catalogued, and it will explain the filing system to you at length before it kills you.',
  },

  {
    id: 'thornmother',
    name: 'Thornmother',
    rank: 'overlord',
    level: 9,
    xp: 650,
    type: 'Huge Plant',
    primary: 'physique',
    secondary: 'mind',
    /* Instinct 1 at every level: a grove does not dodge. What keeps her alive is
       eight Armor and two hundred Health, which is the shape of the thing. */
    bonus: { physique: 1, instinct: -3, mind: 0 },
    health: { perLevel: 10, perPhysique: 10 },
    willpower: { perLevel: 2, perMind: 2, flat: 8 },
    avoid_bonus: 9,
    armor: 8,
    speed_m: 3,
    cards: ['thorn-volley', 'strangling-roots', 'rooted-in-the-grove'],
    lore:
      'The grove is not where she lives. The grove is her, out to the last seedling, and every axe taken to it these two hundred years is a wound she has counted and kept.',
  },

  {
    id: 'emberthrone-tyrant',
    name: 'Emberthrone Tyrant',
    rank: 'overlord',
    level: 10,
    xp: 900,
    type: 'Huge Dragon',
    primary: 'physique',
    secondary: 'mind',
    bonus: { physique: 1, instinct: 2, mind: 1 },
    health: { perLevel: 10, perPhysique: 10 },
    willpower: { perLevel: 2, perMind: 2, flat: 10 },
    avoid_bonus: 8,
    armor: 5,
    speed_m: 7,
    cards: ['tyrants-breath', 'wing-buffet', 'throne-of-embers'],
    lore:
      'It sits its hoard the way a king sits a throne, which is to say badly and without ever getting up. The braziers around it have been kept lit by hands it no longer bothers to look at.',
  },
];

const BY_ID = new Map(CREATURES.map((creature) => [creature.id, creature]));

/* ----------------------------------------------------------- forged creatures

   Everything above is codex data, frozen at build time. This is the other half:
   creatures a table forged for itself, which arrive from the database and have
   to answer to `getCreature` like any other, because *every* reader of a
   creature goes through it. An encounter row names a creature by id; the block,
   the runner, the log and the shelf all resolve that id here. A forged creature
   that could not be found by id would be a creature nothing could draw.

   So there is one mutable map beside the frozen one, and it is filled from
   above: see src/lib/customCreatures.js, which is the only writer. This file
   stays a leaf — it reads nothing, fetches nothing and imports nothing new.

   Two rules about what goes in it:

     the id is prefixed. A forged creature's id is `custom:<row uuid>`, so it can
     never collide with a printed one and any reader can tell at a glance which
     half of the bestiary a stored encounter is pointing at.

     the cards are already resolved. A printed creature names its cards by id and
     `getCreatureCard` finds them, because they are in this file. A forged one can
     learn *anything a character can play*, which lives in the registry in
     weapons.js — and weapons.js imports this file, so this file can never import
     it back. The loader is above both, so it resolves the cards on the way in and
     what lands here carries card objects rather than ids. `creatureCards` below
     takes either.

   The map is per session and holds whatever the signed-in account could read. It
   is emptied and refilled on load rather than merged, so signing in as somebody
   else cannot leave another account's shelf behind. */

const FORGED = new Map();

/** The prefix every forged creature's id carries. */
export const FORGED_PREFIX = 'custom:';

/** Whether an id names a forged creature rather than a printed one. */
export function isForgedId(id) {
  return String(id ?? '').startsWith(FORGED_PREFIX);
}

/**
 * Put the forged creatures this account can read into the registry, replacing
 * whatever was there. Each one must already carry a prefixed `id` and resolved
 * `cards`; see `hydrateCreature` in customCreatures.js, which is what builds
 * them and the only place that should call this.
 */
export function registerForged(list = []) {
  FORGED.clear();
  for (const creature of list) {
    if (!creature || !isForgedId(creature.id)) continue;
    FORGED.set(creature.id, creature);
  }
}

/** Empty the forged half. Signing out, and the checkers between cases. */
export function clearForged() {
  FORGED.clear();
}

/** Every forged creature in the registry, in the bestiary's own order. */
export function forgedCreatures() {
  return sortCreatures([...FORGED.values()]);
}

/** One creature by id, or null for a link into nothing. Forged or printed: an
    id is an id, and every reader of one comes through here. */
export function getCreature(id) {
  const key = String(id ?? '');
  if (key === CONJURED_ID) return CONJURED_CREATURE;
  return BY_ID.get(key) ?? FORGED.get(key) ?? null;
}

/** Any level, held inside the twelve every body on the board climbs. */
export function clampCreatureLevel(level) {
  return Math.min(CREATURE_MAX_LEVEL, Math.max(1, Math.floor(Number(level) || 1)));
}

/* --------------------------------------------------------------- the curve */

/**
 * How many of the character's odd-level attribute grants a level has reached.
 *
 * Levels 3, 5, 7, 9 and 11, so five of them by level 12. Level 1 is not one:
 * its grant is the +2 and the +1, which are counted separately below.
 */
function oddGrants(level) {
  return Math.max(0, Math.floor((clampCreatureLevel(level) - 1) / 2));
}

/**
 * A creature's three attributes at a level.
 *
 * The character's own growth, read against the creature's declared primary and
 * secondary: base 4 everywhere, +2 on the primary and +1 on the secondary at
 * level 1, and one more on each of those two at every odd level after. Then the
 * creature's own `bonus`, which is the part set when it was written.
 *
 * Nothing is clamped at the top. A `bonus` of +1 on the primary puts it at 12 at
 * level 12, which is what Jules asked for, and a creature written with +3 would
 * reach 14 and be a deliberate monster rather than a bug.
 */
export function creatureAttributes(creature, level) {
  const climbs = oddGrants(level);
  const primary = creature?.primary ?? 'physique';
  const secondary = creature?.secondary ?? 'instinct';
  const bonus = creature?.bonus ?? {};

  const values = { physique: BASE, instinct: BASE, mind: BASE };
  values[primary] += 2 + climbs;
  if (secondary !== primary) values[secondary] += 1 + climbs;

  for (const key of ['physique', 'instinct', 'mind']) {
    values[key] = Math.max(1, values[key] + Math.floor(Number(bonus[key]) || 0));
  }

  return values;
}

/* --------------------------------------------------------------- the numbers */

/**
 * Everything a creature is at a level, printed and derived together.
 *
 * The same shape `deriveStats` hands back for a character and `minionDerived`
 * for a creature on a leash, so the very same tiles draw all three. That is not
 * tidiness, it is the readability the whole block is built on: a Grit on an
 * enemy has to be drawn in the same box as a Grit on the party or nobody can
 * compare the two mid-fight.
 *
 * Four things are the creature's own and everything else is the character's own
 * arithmetic run against the numbers above:
 *
 *   health      `perLevel` per level and `perPhysique` per Physique
 *   willpower   `perLevel`, `perMind` and a `flat`
 *   avoid       the armor family's base plus `avoid_bonus`, exactly as a
 *               character's Defense is a set's base plus what they wear. With no
 *               family that base is Instinct, which is what it has always been,
 *               and Heavy adds half the Armor on top. See CREATURE_ARMOR.
 *   speed/armor printed, because neither is an attribute
 *
 * A Minion's Reaction Points are forced to zero last, after everything, because
 * "cannot get reaction" is a rule about the creature rather than a default about
 * its rank.
 */
export function creatureStats(creature, level = null) {
  const rank = getRank(creature);
  const lvl = clampCreatureLevel(level ?? creature?.level);
  const attributes = creatureAttributes(creature, lvl);
  const { physique: p, instinct: i, mind: m } = attributes;

  const health_max = Math.max(
    1,
    Math.floor(
      (Number(creature?.health?.perLevel) || 0) * lvl +
        (Number(creature?.health?.perPhysique) || 0) * p
    )
  );

  const willpower_max = Math.max(
    0,
    Math.floor(
      (Number(creature?.willpower?.perLevel) || 0) * lvl +
        (Number(creature?.willpower?.perMind) || 0) * m +
        (Number(creature?.willpower?.flat) || 0)
    )
  );

  const ap_max = Math.max(0, Math.floor(Number(creature?.ap_max ?? rank.ap) || 0));
  const printedReaction = Math.max(
    0,
    Math.floor(Number(creature?.reaction_max ?? rank.reaction) || 0)
  );

  /* What it is wearing, and the two numbers that come out of it. Armor is read
     first because Heavy's rider is taken from the whole of it, which is the
     rulebook's own ruling for a character and the same one here. */
  const armor = getCreatureArmor(creature);
  const defense = Math.max(0, Math.floor(Number(creature?.armor) || 0));
  const reflex = p + i;
  const grit = i + m;
  const avoidBase = armor.base === 'reflex' ? reflex : armor.base === 'grit' ? grit : i;
  const avoid = Math.max(
    0,
    avoidBase +
      Math.floor(Number(creature?.avoid_bonus) || 0) +
      (armor.half ? Math.floor(defense / 2) : 0)
  );

  return {
    level: lvl,
    attributes,
    health_max,
    shield_cap: Math.floor(health_max / 2),
    willpower_max,
    // The DEF on the printed page: how hard it is to hit.
    avoid,
    // And the Armor: flat reduction after a hit lands.
    defense,
    // Which family it is wearing, so a block can say what its Defense is made of.
    armor,
    initiative: i + lvl,
    // The one value that keeps its half, exactly as a character's does.
    speed_m: Number(creature?.speed_m) || 0,
    ap_max,
    // A Minion has none and can never be given any. The one place that is true.
    reaction_max: rank.reacts ? printedReaction : 0,
    reflex,
    grit,
    // What the whole party is worth for killing it, at this level.
    xp: Math.max(0, Math.floor((Number(creature?.xp) || 0) * lvl)),
  };
}

/**
 * The cards it plays and the cards it simply is, split the codex's own way.
 *
 * A printed creature names its cards by id and they are found in this file. A
 * forged one arrives with the card objects already on it, because what it may
 * learn is *anything a character can play* and that registry is above this file
 * (see the note on FORGED). So an entry is taken as it is when it is already a
 * card, and looked up when it is a string. Nothing else in the codex needs the
 * second case, and nothing outside customCreatures.js should produce one.
 */
export function creatureCards(creature) {
  return (creature?.cards ?? [])
    .map((entry) => (entry && typeof entry === 'object' ? entry : getCreatureCard(entry)))
    .filter(Boolean);
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
 * ones have been broken. See `breakWard` in encounters.js, which is what reads
 * the memory; this only says which passives have a switch at all.
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

/**
 * The bestiary in its printed order, or one rank of it.
 *
 * Both halves: the printed creatures and whatever this account's forged ones are
 * (see FORGED). One list rather than two, because every caller of this — the
 * Bestiary tab, the encounter shelf — is asking "what can I put on the table",
 * and a creature a Game Master made an hour ago is as much of an answer as the
 * Blightgeist. `forged: true` on the row is how a caller tells them apart.
 */
export function bestiary(rank = null) {
  const all = [...CREATURES, ...FORGED.values()];
  const list = rank ? all.filter((creature) => creature.rank === rank) : all;
  return sortCreatures(list);
}

/**
 * The line the printed page heads itself with: `Minion - Level 1 - 10 XP`.
 *
 * Hyphens rather than the site's own middot, because this one is the design
 * sheet's own punctuation and the block is a transcription of that sheet. The
 * level and the XP are both this creature's *at this level*, so the line stays
 * true wherever it is standing.
 */
export function difficultyLine(creature, level = null) {
  const rank = getRank(creature);
  const stats = creatureStats(creature, level);
  return `${rank.label} - Level ${stats.level} - ${stats.xp} XP`;
}
