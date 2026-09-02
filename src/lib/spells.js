/**
 * The spell codex.
 *
 * Its own module rather than a section of weapons.js, and the reason is the
 * landing page. weapons.js pulls in talents, lineages, backgrounds and the
 * basic actions to assemble the full card registry, so importing one spell
 * from it dragged the entire codex into the bundle a first-time visitor
 * downloads — the very thing the lazy routes in App.jsx exist to avoid. Spells
 * depend on nothing but their own art, so they can be reached on their own.
 *
 * weapons.js re-exports SPELLS, so every existing import of it still works.
 */

import { withArt } from './cardArt.js';


/**
 * The spell codex, transcribed from the designer's sheet
 * ("Spells — Primal Spells", pulled 2026-08-19) exactly as it reads.
 *
 * A spell's banner is its three tags in order: the tier it is learned at, the
 * school it belongs to, and the family inside that school. Those three are what
 * a talent set draws on, so they are the tags and not prose.
 *
 *   tier    Novice Spell · Adept Spell · Master Spell · Legendary Spell · Unique Spell
 *   school  Primal · Nature · Arcane · Elemental · Ethereal
 *   family  Flora · Wild · Life · Blood · Energy · Water · Light · Shadow
 *
 * ------------------------------------------------------------------ modular
 * Nothing here names an attribute it does not have to. Every spell is written
 * off `{stat}` and its numbers off `*stat`, and `stat: 'mind'` below is only
 * the default a caster with no other claim rolls with. A Mycomancer's loadout
 * carries `cast: 'instinct'` (see castModifier in cardText.js), so the same
 * card printed in their hand reads Instinct and prints Instinct's numbers.
 * `cast: 'highest'` is the other one a source can impose: not an attribute but
 * the rule that the holder's best one is used, which is what every spell an
 * Innate card hands over is cast with. See castStat in cardText.js.
 * Write `{mind}` on a spell only if it must be Mind for every caster alive.
 *
 * ---------------------------------------------------------------- the unique
 * **A Unique Spell is not a rank.** It is a spell that exists on one item and
 * nowhere else, so no talent set can ever prepare it and no rank opens it: it
 * arrives through a Unique Imbuement on the thing that carries it (see
 * enchantments.js) and leaves again when the item does.
 *
 * Two gates already keep it out of every pool without a line being added to
 * either. `loadoutOptions` refuses a card whose school is not the set's, and no
 * set's school is Elemental, Ethereal or Nightmare — real shelves since
 * 2026-08-20 and 2026-08-25, but still nobody's to prepare from; `spellsAt` in
 * EnchantWindow.jsx matches the tier word, and Novice, Adept and Master do not
 * match Unique. So the only way to hold one is to hold the item, whatever
 * school it names.
 *
 * ------------------------------------------------------------ the legendary
 * **A Legendary Spell is a rung nothing reaches yet.** THEON PERFECT REPLICANTS
 * arrived with the Ethereal drop on 2026-08-25 as the first of them, and no set
 * on the wall opens a fourth tier. It needs no gate of its own for the same
 * reason Unique needs none: `tierOf` in loadouts.js reads Novice, Adept and
 * Master and nothing else, so a Legendary card falls off the ladder and is
 * refused by name ("Legendary is not a rung any set reaches"), and `spellsAt`
 * matches the same three words, so no Imbuement can bind one either.
 *
 * The day a set reaches it, the ladder in that set's `tiers` is the only thing
 * that has to learn the word.
 *
 * The one attribute named outright is {physique}, on the Blood Tithe halves:
 * what a tithe costs is paid by the body, not by whatever the caster happens to
 * cast with, so those stay Physique for everybody.
 *
 * Most spells carry a second, optional half. The names are the designer's and
 * mean different things: **Overcast** spends more to do more, **Multicast**
 * spends more to hit more, **Upkeep** is a toll paid each turn to keep the
 * spell alive, and **Blood Tithe** pays in Health rather than Willpower.
 */
export const SPELLS = withArt([
  /* ----------------------------------------------------- Primal · Flora ---- */
  {
    id: 'bramble-whip',
    name: 'Bramble Whip',
    summary: 'A vine whips one target at range for Sharp damage. Multicast for more targets.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Flora'],
    ap: 2,
    wp: 1,
    stat: 'mind',
    damage: ['Sharp'],
    body:
      'You summon forth a vine from the ground to whip **an entity** you can see within **9 meters (30 feet)**.\n\n' +
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[1d6 + 2*stat]] {damage} damage.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 1 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },
  {
    id: 'barkskin',
    name: 'Barkskin',
    summary: 'Bark over a creature you touch: a Shield and Defense +1 until the Shield is gone.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Flora'],
    ap: 3,
    wp: 2,
    stat: 'mind',
    body:
      'You cover the skin of **an entity** you can touch with bark.\n\n' +
      'The target gains [[2d6 + 2*stat]] Shield and +1 Defense. The effect ends when all Shield is depleted.',
    sub_name: 'Overcast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 1 Willpower any number of times. For each time you do, the target gains an additional [[1d6 + stat]] Shield.',
  },
  {
    id: 'entangling-roots',
    name: 'Entangling Roots',
    summary: 'Roots hold everything in a 6-meter area. Six Action Points to tear free.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Flora'],
    ap: 3,
    wp: 2,
    stat: 'mind',
    body:
      'Roots burst from the ground, covering a **6-meter (20-foot)** area centered on a point you can see within **15 meters (50 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against the Reflex of **all entities** in the area. On a success, they are rooted for **10 turns (1 minute)**.\n\n' +
      'Entities rooted by this spell can spend 6 Action Points to break out of the vines.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'sleeping-spores',
    name: 'Sleeping Spores',
    summary: 'An unseen cloud puts a whole area to sleep for an hour. A fight makes it harder.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Flora'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    body:
      'You manifest a **6-meter (20-foot)** cloud of invisible, odorless spores centered on a point you can see within **9 meters (30 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against the Grit of **all entities** in the area. Entities that are currently in combat or can see you gain advantage on the roll.\n\n' +
      'On a success, the entity falls asleep for **1 hour**. This effect ends early if the target takes damage or **an entity** uses an action to shake them awake.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'parasitic-spore',
    name: 'Parasitic Spore',
    summary: 'A spore burrows in and rots the target every turn while you feed off it.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Flora'],
    ap: 4,
    wp: 3,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'You launch a burrowing spore pod at **an entity** you can see within **12 meters (40 feet)**. Make a {stat} Ranged Attack {roll}. On a hit, the spore embeds itself in the target.\n\n' +
      'At your Turn End, the spore deals [[2d6 + 2*stat]] {damage} damage to the target, and you regain Health equal to half the damage dealt.',
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, pay 2 Willpower to keep the spore in place. Miss the Upkeep and the spell ends.',
  },
  {
    id: 'verdant-field',
    name: 'Verdant Field',
    summary: 'Greenery for 30 meters: rest inside for Shield, Karma and stronger Flora spells.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Flora'],
    ap: 3,
    wp: 4,
    stat: 'mind',
    body:
      'You create a field of greenery in a **30-meter (100-foot)** radius around you for **1 hour**.\n\n' +
      'A Short Rest inside grants [[2d6 + 2*stat]] Shield and 1 Karma. Standing in the field elevates your Flora spells by 1.',
    sub_name: 'Overcast',
    sub_body:
      'When casting this spell, you may spend an additional 3 Action Points and 4 Willpower to make the field last **24 hours** (permanent in natural terrain). A Long Rest inside then also grants these benefits and costs 1 fewer Supplies.',
  },
  {
    id: 'thorn-rampart',
    name: 'Thorn Rampart',
    summary: 'A wall of briars that blocks sight and tears anything trying to cross it.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Flora'],
    ap: 4,
    wp: 6,
    stat: 'mind',
    damage: ['Sharp'],
    body:
      'You conjure a dense wall of razor-sharp briars at a location you can see within **15 meters (50 feet)** for **10 turns (1 minute)**.\n\n' +
      'The wall can be up to **12 meters (40 feet)** long, **1.5 meters (5 feet)** thick and **3 meters (10 feet)** tall, blocking line of sight.\n\n' +
      '**Any entity** attempting to pass through the wall or having their Turn Start in it takes [[3d6 + 3*stat]] {damage} damage, and you make a {stat} Roll {roll} against that entity’s Grit.\n\n' +
      'On a success, the entity becomes rooted **until its next Turn End**.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'naturalize',
    name: 'Naturalize',
    summary: 'Rot a common object out of existence. Overcast to reach uncommon ones.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Flora'],
    ap: 3,
    wp: 4,
    stat: 'mind',
    body:
      'You touch a common object, instantly breaking it down into decaying organic matter.\n\n' +
      'The object cannot exceed 200 kg (440 lbs) or a **2-meter (6-foot)** cube, and cannot be metallic.\n\n' +
      'If the object is worn or held by **an entity**, destroying it takes a successful {stat} Melee Attack {roll} against them.',
    sub_name: 'Overcast',
    sub_body:
      'When casting this spell, you may spend an additional 3 Action Points and 6 Willpower to target uncommon objects.',
  },

  /* ============================================== Primal · Flora, the Masters ==
   * The family's four Master spells, pulled 2026-08-26 from `data/Flora/Spells -
   * Primal - Flora.csv` with their four pictures in `data/Flora/`.
   *
   * Flora is the codex's oldest family: the eight cards above are the opening drop
   * of 2026-08-19, and this sheet holds all eight of them unchanged with four new
   * rows under them. Nothing already printed moved. Only the top rung is new.
   *
   * ---------------------------------------- the second Primal family to top out
   * Primal had no Master spell at all until the Death family brought four the same
   * day (see its own header below). These four double that, and every one of them
   * is something a Mycomancer's Rank 3 now opens over its Rank 2. Wild followed with
   * four of its own later the same day, and Life brought a whole Adept and Master
   * rung after that, so the school is 52 spells at 20 Novice, 16 Adept and 16
   * Master, and the four families that reached the rung own four apiece: Blood
   * alone is still the four Novice cards it opened with.
   *
   * ------------------------------------------------------- the sheet's own hand
   * **This is the first drop written in the codex's own notation.** The cells carry
   * `[[2d6 + 2*stat]]` where every earlier sheet wrote "2d6 + 2 x Mind", `{roll}`
   * and `{damage}` where they belong, and metres with their feet already beside
   * them. So the transcription is close to a copy and the readings below are the
   * whole of what it took, where the Death sheet the same day needed ten ranges
   * repaired before a card could print at all.
   *
   * ------------------------------------------------------------- the readings
   * - **IMPALING GROVE writes the damage token and never names a type.** The cell
   *   says "you deal [[4d6 + 4*stat]] {damage} damage", and `{damage}` prints the
   *   type the card declares — which this card declares nowhere. It prints untyped,
   *   the call COMPRESSION BLAST and CORPSE STRIDE both took: a damage type is what
   *   a resistance answers, so it is not one to hand out. Sharp is the obvious
   *   answer and it is what the family's other two physical cards deal (BRAMBLE
   *   WHIP's vine, THORN RAMPART's briars). Third card in a row with this hole, and
   *   worth settling for all three at once.
   * - **SEEDLING SPIRITS counts its spirits off Mind and the card counts them off
   *   the caster's own attribute**, which is the same turn every card above it
   *   takes: the sheet has always written "Make a Mind Roll" and the codex has
   *   always printed the caster's. There is no live token for a half, so a half is
   *   written as the attribute's *name*, the way GLACIAL ACCRETION does. That
   *   one keeps Mind because its cap and its throw measure the same Ice Spikes;
   *   here the count and the healing are separate quantities, so the whole card
   *   stays on one attribute and a Mycomancer calls up spirits by Instinct.
   * - **BLIGHT POLLEN's Blood Tithe is the first not paid in Physique.** "Health
   *   equal to your 3xlevel" reads as three times the caster's level and prints
   *   `[[3*level]]`; every other tithe in the codex costs `{physique}`, on the
   *   grounds that a body pays it. A level is not an attribute, so nothing casts
   *   off it and `secondHalf` prices this the same way either. Whether a tithe is
   *   allowed to leave Physique is the designer's call.
   * - Spelling and grammar, without further comment: "BLight Pollen", "1 Action
   *   Points", "The spirit cannot be target otherwise". DEVOURING BLOSSOM's "for 10
   *   turns" gained the "(1 minute)" its three siblings and the row under it print.
   *
   * ----------------------------------------------------------- what it confirms
   * DEVOURING BLOSSOM's flower is a conjured thing with a Health bar, and it landed
   * on the ladder HARD LIGHT already set: `[[10*stat]]` Health and `[[2*stat]]`
   * Defense, the same two expressions in the same order, off a sheet that has never
   * seen that card. It is not a minion — nothing here hands over a body with a
   * sheet of its own (see minions.js) — it is an object on the table, which is all
   * SHAPE EARTH's wall and HARD LIGHT's bridge are either.
   *
   * --------------------------------------------------------------- not wired
   * All four are offered on the tracker: three print a count of turns and IMPALING
   * GROVE's rooted runs to a Turn End, so `effectDuration` has a clock for every
   * one of them. The Death drop offered five of its twelve.
   *
   * **BLIGHT POLLEN moves two numbers and neither is wired.** Its diseased is
   * SICKNESS's problem exactly — -1 to all three attributes, `growth-elixir`'s own
   * shape, on a card whose other half gives the caster a reason to hold the row
   * too, so a rider would take the point off the wrong sheet. And "cannot restore
   * Health" is a rule rather than a number: nothing on this sheet can refuse a
   * heal, which is the wall DEATH WAIL's second sentence hit. Both are written up
   * beside sickness in riders.js.
   */
  {
    id: 'devouring-blossom',
    name: 'Devouring Blossom',
    summary: 'A carnivorous flower with a Health bar of its own. What it catches is held and rotted.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Flora'],
    ap: 5,
    wp: 10,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'A carnivorous flower opens at a point you can see within **15 meters (50 feet)** for **10 turns (1 minute)**. It has Health equal to [[10*stat]] and Defense equal to [[2*stat]].\n\n' +
      'At your Turn End, it snaps at **an entity** within **3 meters (10 feet)**. Make a {stat} Roll {roll} against its Reflex. On a success, the entity is swallowed: grappled and taking [[2d6 + 2*stat]] {damage} damage at each of its Turn Starts.\n\n' +
      'The flower holds **up to 2 entities**, and frees what it holds when destroyed.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* "half your {stat}" and not "half your {mind}": see "the readings" above. */
    id: 'seedling-spirits',
    name: 'Seedling Spirits',
    summary: 'A spirit per ally, healing them each turn, crushed to shed a poison or a disease.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Flora'],
    ap: 4,
    wp: 12,
    stat: 'mind',
    body:
      'You call up a number of plant spirits equal to half your {stat}, each in a space you can see within **9 meters (30 feet)**, for **10 turns (1 minute)**.\n\n' +
      'Each spirit follows an ally of your choice and moves with them. At that ally’s Turn Start, it restores [[1d6 + stat]] Health.\n\n' +
      'An ally can spend 1 Action Point to crush their spirit and shed poisoned, diseased or bleeding out. The spirit is then gone, and cannot be targeted otherwise.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* The damage is untyped because the sheet names no type, and Sharp is the
       obvious answer: see "the readings" above. */
    id: 'impaling-grove',
    name: 'Impaling Grove',
    summary: 'Hardwood spears through a twelve-meter area, leaving everything rooted and prone.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Flora'],
    ap: 5,
    wp: 9,
    stat: 'mind',
    body:
      /* One paragraph and not the usual two, and it is the fit that decided it:
         the break between the declaration and the roll costs this card 0.03 of
         its type size, which is the difference between 0.895 and fine print and
         0.930 in the band RAIN OF FIRE and PESTILENT CLOUD already sit in. The
         sheet's "erupt from the ground" came off for the same reason, and is the
         only thing that did. */
      'Hardwood spears erupt in a **12-meter (40-foot)** area centered on a point you can see within **18 meters (60 feet)**. Make a {stat} Roll {roll} against the Reflex of **all entities** in the area. On a success, you deal [[4d6 + 4*stat]] damage and they are rooted and prone **until their next Turn End**.',
    sub_name: 'Overcast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 3 Willpower any number of times. For each time you do, the area grows **3 meters (10 feet)**.',
  },
  {
    /* The one tithe in the codex not paid in Physique: see "the readings" above. */
    id: 'blight-pollen',
    name: 'Blight Pollen',
    summary: 'A cone of grey pollen that shuts healing off. Tithe blood to leave them diseased.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Flora'],
    ap: 3,
    wp: 4,
    stat: 'mind',
    body:
      'You exhale a **9-meter (30-foot)** cone of grey pollen.\n\n' +
      'Make a {stat} Roll {roll} against the Grit of **all entities** in the area. On a success, they cannot restore Health for **5 turns**.',
    sub_name: 'Blood Tithe',
    sub_body:
      'When casting this spell, you may sacrifice Health equal to [[3*level]]. If you do, they are also diseased.',
  },

  /* ------------------------------------------------------ Primal · Wild ---- */
  {
    id: 'wild-strider',
    name: 'Wild Strider',
    summary: 'Moving costs 1 Action Point, nothing slows you, and you jump twice as far.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Wild'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    body:
      'You embody the freedom of the wild **until your next Long Rest**. ' +
      'The Action Point cost of your {{Move}} action can no longer exceed 1 and your Movement Speed cannot be reduced. Your Jump Distance and Jump Height are doubled.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 1 Willpower any number of times. For each time you do, target **an additional entity** you can see within **6 meters (20 feet)**.',
  },
  {
    id: 'snake',
    name: 'Snake!',
    summary: 'A snake spirit strikes for Decay damage and leaves the target poisoned.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Wild'],
    ap: 4,
    wp: 2,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'You manifest a snake spirit which hurls itself at **an entity** you can see within **6 meters (20 feet)**.\n\n' +
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[2d6 + 2*stat]] {damage} damage, and the target is poisoned.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'sharpen-sense',
    name: 'Sharpen Senses',
    summary: 'An hour of advantage on anything your five senses decide.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Wild'],
    ap: 4,
    wp: 3,
    stat: 'mind',
    body:
      'You channel the spirit of the wild to heighten your perception for **1 hour**.\n\n' +
      'For the duration of the spell, you gain advantage on all skill checks that rely on one of your five senses.',
    sub_name: 'Overcast',
    sub_body:
      'While this spell is active, you may spend 2 Willpower to reroll a failed skill check that relies on one of your five senses. You can only use this effect once per skill check.',
  },
  {
    id: 'primal-roar',
    name: 'Primal Roar',
    summary: 'A roar that costs every enemy who hears it their next two Action Points running.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Wild'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    body:
      'You emulate the ferocity of the wild, letting out a bellowing roar that echoes across the battlefield.\n\n' +
      'Make a {stat} Roll {roll} against the Grit of **all hostile entities** that can hear you within **36 meters (120 feet)**.\n\n' +
      'On a success, the entity must spend 2 Action Points on its next turn to move away from you. If the target has any Reaction Points available, it immediately spends them to start moving away from you first.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'wild-sweep',
    name: 'Wild Sweep',
    summary: 'A great bird carries the target 12 meters wherever you want it.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Wild'],
    ap: 4,
    wp: 3,
    stat: 'mind',
    damage: ['Sharp'],
    body:
      'You manifest the spirit of a large flying creature to swoop at **an entity** you can see within **12 meters (40 feet)**.\n\n' +
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[2d6 + 2*stat]] {damage} damage and the target is carried **12 meters (40 feet)** where you choose.',
    sub_name: 'Overcast',
    sub_body:
      'When this spell hits, you may spend an additional 1 Action Point and 1 Willpower any number of times. For each time you do, it is carried an additional **3 meters (10 feet)**.',
  },
  {
    id: 'savage-slam',
    name: 'Savage Slam',
    summary: 'A beast slams a cone in front of you for Force damage. Overcast to hit all around.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Wild'],
    ap: 4,
    wp: 5,
    stat: 'mind',
    damage: ['Force'],
    body:
      'You manifest the spirit of a mighty beast to slam the ground in a **6-meter (20-foot)** cone in front of you.\n\n' +
      'Make a {stat} Attack Roll {roll} against **all entities** in the area. On a hit, you deal [[4d6 + 4*stat]] {damage} damage.',
    sub_name: 'Overcast',
    sub_body:
      'When casting this spell, you may spend an additional 2 Action Points and 2 Willpower to affect a **6-meter (20-foot)** radius centered on you instead of a cone.',
  },
  {
    id: 'pack-bond',
    name: 'Pack Bond',
    summary: 'Five allies hunt as one: harder to hit apart, deadlier together, vengeful when one falls.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Wild'],
    ap: 3,
    wp: 4,
    stat: 'mind',
    body:
      'You form a predatory bond with **up to 5 allies** you can see for **10 turns (1 minute)**, binding you together as a Wild Pack. While this spell is active:\n\n' +
      'Attack Rolls against a member have disadvantage while it is adjacent to another member. Members gain advantage on Attack Rolls against **an entity** adjacent to at least 2 members.\n\n' +
      'If a member falls unconscious or dies, every remaining member’s next attack is a guaranteed Critical Hit. Friendly fire and self-harm cannot trigger this.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'bird-view',
    name: 'Bird View',
    summary: 'Ride a spectral bird half a kilometer out. Your body is left where it stands.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Wild'],
    ap: 6,
    wp: 2,
    stat: 'mind',
    body:
      'You manifest a small spectral flying creature and project your consciousness into it for up to **1 hour**.\n\n' +
      'For the duration, you gain an aerial view of the surrounding area through the creature’s senses up to **500 meters (1,500 feet)** away from your physical body.\n\n' +
      'While controlling the creature, your physical body is incapacitated and cannot take actions.\n\n' +
      'You may end Bird View early.',
    sub_name: null,
    sub_body: null,
  },

  /* =============================================== Primal · Wild, the Masters ==
   * The family's four Master spells, pulled 2026-08-26 from `data/Spells - Primal
   * - Wild.csv` with their four pictures in `data/Wild/`.
   *
   * The eight cards above are the opening Primal drop of 2026-08-19 and this sheet
   * holds all eight of them unchanged, four new rows under them. Nothing already
   * printed moved, and those eight cells still carry their pre-readability-pass
   * wording where the cards above carry the pass's. Only the top rung is new.
   * The Flora sheet arrived in exactly this shape earlier the same day.
   *
   * ----------------------------------------- the third Primal family to top out
   * Primal had no Master spell at all until this morning, when Death brought four
   * and Flora four more. These are the third set, and Life's eight followed them
   * the same day to take the school to 52 spells at 20 Novice, 16 Adept and 16
   * Master. Four of its five families now own four Masters apiece, and Blood alone
   * is still the four Novice cards it opened with. A Mycomancer's Rank 3 offers 52
   * where its Rank 2 offers 36.
   *
   * ------------------------------------------------------- the sheet's own hand
   * The second sheet written in the codex's own notation, and it only needed it
   * once: STAMPED's cell carries `[[6d6 + 6*stat]]`, `{roll}` and `{damage}`, and
   * the other three name no number at all. Metres arrive with their feet already
   * beside them on every row. So the transcription is a copy, and the readings
   * below are the whole of what it took.
   *
   * ------------------------------------------------------------- the readings
   * - **The name STAMPED is the one thing here worth a second look.** The cell
   *   says it, the picture file says it, and the card's own first line says "a
   *   herd of beast spirits charges", which is a stampede. Transcribed as the
   *   sheet spells it, because a card name is the designer's word and nothing but
   *   his own prose suggests the other one. Renaming it is one edit here plus an
   *   ALIASES entry in `pull-card-art.mjs`, since the plate is `Stamped.jpg`.
   * - **STAMPED writes the damage token and names no type.** `{damage}` prints
   *   the type the card declares and this card declares none, so it prints
   *   untyped, the call COMPRESSION BLAST, CORPSE STRIDE and IMPALING GROVE all
   *   took, and the fourth card in a row with the hole. Force is the obvious
   *   answer here: it is what SAVAGE SLAM's beast deals two rungs down in this
   *   same family, and a herd running you over is the same kind of blow.
   * - **QUARRY empowers and elevates with no count for either**, so the card
   *   prints Empowered and Elevated bare. DREDGE CORPSE's Overcast is written the
   *   same way and reads the same, and the two are worth settling at once.
   * - **QUARRY's sense has no clock of its own.** "You sense it at any distance
   *   and through total cover" hangs off the marked duration in the paragraph
   *   above it, which is the reading that makes the card one effect rather than
   *   two, and the tracker reads that Long Rest for the whole card.
   * - CRITTER FORM's Multicast is **GIANT GROWTH's shape to the word**: 3
   *   Willpower for each additional entity you can touch, no Action Point on top.
   *   It is the codex's second half priced in Willpower alone, and `secondHalf`
   *   already reads "for each additional" as the repeat (see overcast.js).
   * - Spelling and grammar, without further comment: the four names arrived in
   *   sentence case where the sheet's own eight rows above them are capitals.
   *
   * --------------------------------------------------------------- not wired
   * Two of the four are offered on the tracker: QUARRY's mark runs to a Long Rest
   * and CRITTER FORM's shape for an hour, so `effectDuration` has a clock for
   * both. STAMPED's prone carries its own end in the keyword, a move action ends
   * it, and MOLT resolves the instant it is cast, so neither wants a row.
   *
   * **QUARRY is the closest thing to a wired rider this family has, and it is not
   * wired either.** Empowered and Elevated are numbers the sheet knows how to
   * bend, but both are printed without a count and both apply only to damage
   * against one named entity, which is a condition the tracker cannot see: a
   * rider raises a number on a sheet, never a number against a target. Written up
   * beside sickness in the considered-and-left-out list in riders.js.
   */
  {
    /* The sheet's spelling of the name, and the damage is untyped because the
       sheet names no type: see "the readings" above. */
    id: 'stamped',
    name: 'Stamped',
    summary: 'A herd tramples a 24-meter line, knocking down everything that fails to get clear.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Wild'],
    ap: 5,
    wp: 10,
    stat: 'mind',
    body:
      'A herd of beast spirits charges in a **24-meter (80-foot)** straight line originating from yourself.\n\n' +
      'Make a {stat} Roll {roll} against the Reflex of **all entities** in the line. On a success, you deal [[6d6 + 6*stat]] damage and they are knocked prone, or half as much on a failure.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* Empowered and Elevated print bare because the sheet gives no count for
       either: see "the readings" above. */
    id: 'quarry',
    name: 'Quarry',
    summary: 'Mark one entity until you rest. You always know where it is and you hit it harder.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Wild'],
    ap: 4,
    wp: 10,
    stat: 'mind',
    body:
      'You name **an entity** you can see within **36 meters (120 feet)** as your quarry, marked **until your next Long Rest**.\n\n' +
      'You sense it at any distance and through total cover, and your damage against it is Empowered and Elevated.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* The Multicast is GIANT GROWTH's to the word, Willpower and no Action Point:
       see "the readings" above. */
    id: 'critter-form',
    name: 'Critter Form',
    summary: 'An hour as a rabbit or a rat. Your sheet is unchanged and you cannot act while shaped.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Wild'],
    ap: 3,
    wp: 4,
    stat: 'mind',
    body:
      'You take the shape of a small critter you choose for **1 hour**: a rabbit, a rat or the like. Anything that sees you sees an ordinary animal.\n\n' +
      'You keep every number on your sheet and gain no movement or breathing you lacked, so the shape flies only if you fly. You cannot speak, attack, cast spells or use items while shaped.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend 3 Willpower for **each additional entity** you can touch.',
  },
  {
    id: 'molt',
    name: 'Molt',
    summary: 'Shed your skin and every effect on it, good or bad, and step out 6 meters.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Wild'],
    ap: 2,
    wp: 8,
    stat: 'mind',
    body:
      'You shed your skin and leave it standing where you were. This can be used while constrained.\n\n' +
      'Every effect on you ends, harmful or not, and you appear in an unoccupied space you can see within **6 meters (20 feet)**.',
    sub_name: null,
    sub_body: null,
  },

  /* ------------------------------------------------------ Primal · Life ---- */
  {
    id: 'force-inebriation',
    name: 'Force Inebriation',
    summary: 'Ferment a target’s blood and poison them. Out of combat they think they fell ill.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Life'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    body:
      'You attempt to ferment the blood of **an entity** you can see within **15 meters (50 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success, the target becomes poisoned. Outside of combat, the target is unaware of the spell’s source and believes it fell suddenly ill.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 1 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },
  {
    id: 'sense-life',
    name: 'Sense Life',
    summary: 'A minute of seeing every living thing nearby through walls and dark.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Life'],
    ap: 1,
    wp: 1,
    stat: 'mind',
    body:
      'You open your awareness to the pulse of surrounding life.\n\n' +
      'For **10 turns (1 minute)**, you sense the exact location and health state of **all living entities** within **18 meters (60 feet)**, even through total cover or darkness.',
    sub_name: 'Overcast',
    sub_body:
      'While this spell is active, you may spend 3 Action Points and 3 Willpower to mark **an entity** within range. You keep sensing its location and health state **until your next Long Rest**, even past your range.',
  },
  {
    id: 'renew',
    name: 'Renew',
    summary: 'Healing on touch, and again at the start of their next two turns.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Life'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    body:
      'You mend the flesh of **an entity** you touch, restoring [[1d6 + stat]] Health immediately and again at the Turn Start of the target’s next **2 turns**.',
    sub_name: 'Overcast',
    sub_body:
      'When casting this spell, you may spend an additional 2 Action Points and 2 Willpower. If you do, you instantly restore [[2d6 + 2*stat]] Health to **all entities** currently affected by your Renew, regardless of range or line of sight.',
  },
  {
    id: 'giant-growth',
    name: 'Giant Growth',
    summary: 'Triple a creature’s size, double its speed and leave it Empowered for a minute.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Life'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    body:
      'You infuse **an entity** you can touch with life energy, tripling its size, doubling its Movement Speed and granting it Empowered for **10 turns**.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend 3 Willpower for **each additional entity** you can touch.',
  },

  /* ============================= Primal · Life, the Adepts and the Masters ==
   * The family's eight upper cards, pulled 2026-08-26 from `data/Spells - Primal
   * - Life.csv` with their eight pictures in `data/Life/`.
   *
   * The four cards above are the opening Primal drop of 2026-08-19 and this sheet
   * holds all four of them unchanged, eight new rows under them. Nothing already
   * printed moved, and those four cells still carry their pre-readability-pass
   * wording where the cards above carry the pass's. Only the top two rungs are new.
   * The Flora and Wild sheets arrived in the same shape earlier the same day, and
   * this is the first of the three to bring a whole Adept rung with it.
   *
   * ---------------------------------------- the fourth Primal family to top out
   * Primal had no Master spell at all until this morning, when Death brought four,
   * then Flora four and Wild four. These eight take the school to 52 spells at 20
   * Novice, 16 Adept and 16 Master, and four of its five families now stand at a
   * full twelve. **Blood is the last one left**, and it is still the four Novice
   * cards it opened with. A Mycomancer's Rank 3 offers 52 where its Rank 2 offers
   * 36, and the Arcanist, which names no school, goes from 48, 85 and 121 to 48,
   * 89 and 129.
   *
   * ------------------------------------------------------- the sheet's own hand
   * The third sheet in the codex's own notation and the first that only half
   * commits to it. HEAL, VIGOR and SEVER LIFE carry `[[...]]`, `{roll}` and
   * `{damage}`; EXPOSED NERVES and HIBERNATION are longhand from the drops before
   * it ("2d6 + 2 x Mind", "Make Mind roll"), and HEAL's cell writes
   * `[[4d6 + 4*Mind]]` with the attribute inside the token, which every spell here
   * takes off `*stat` instead. Metres arrive with their feet beside them.
   *
   * ------------------------------------------------------------- the readings
   * - **AGONY is printed as EXPOSED NERVES**, asked for in chat on the day of the
   *   drop. The plate is still `Agony.jpg`, so the rename is this entry plus an
   *   ALIASES row in `pull-card-art.mjs`, which is the same two-line trade the
   *   STAMPED note above describes and the first time the codex has taken it.
   * - **RESURRECTION is spelled out.** The cell says REssurection and the picture
   *   says Ressurection, which is two different misspellings of one English word
   *   rather than a name, and that is what separates it from STAMPED one family
   *   over: nothing here is a word on its own. Aliased for the same reason.
   * - **VIGOR arrived with no Action Point and no Willpower**, the only blank in
   *   the sheet, and it is read as **3 and 3**. Every repeatable half on this
   *   family prices its repeat one Willpower under the card's own cost (FORCE
   *   INEBRIATION 2 to 1, PURGE 3 to 2, HEAL 4 to 3), and VIGOR's repeat is 2, so
   *   the card reads 3. The 3 Action Points are the only count the rung has not
   *   already used between PURGE's 2 and HEAL's 4. **Worth Jules's word.**
   * - **VIGOR's half is labelled OVERCAST and written as a MULTICAST**, word for
   *   word the sentence HEAL and PURGE carry two rows above it. Printed as a
   *   Multicast, because the codex's own split is that an Overcast spends more to
   *   do more and a Multicast spends more to hit more (see the header of this
   *   file), and buying another target is the second of those. **Worth Jules's
   *   word**, since the label is his too.
   * - **LIFE LINK's leash converts wrong.** The cast range is "12 meters (40
   *   feet)" and the leash three lines later is "12 meters (60 feet)". Twelve
   *   metres is forty feet, and a leash at the cast range is what makes the card
   *   one shape, so both are printed 40. If the leash was meant to be longer than
   *   the cast, it is 18 meters and not 12.
   * - **EXPOSED NERVES and SEVER LIFE both write the damage token and name no
   *   type**, so both print untyped. That is the fifth and sixth card in a row
   *   with the hole after COMPRESSION BLAST, CORPSE STRIDE, IMPALING GROVE and
   *   STAMPED, and the whole set is still one ruling.
   * - **RESURRECTION never says what a success does.** Its second paragraph gives
   *   a body dead under a minute back at 1 Health, its third rolls for anything
   *   older and names only the failure. Read as returning at 1 Health, which is
   *   the only rate the card states.
   * - **HIBERNATION's Upkeep is the first in the codex not paid at a Turn Start.**
   *   "At each Long Rest, pay 10 Willpower" is the right clock for a spell that
   *   runs a day, `secondHalf` prices it off the same words, and the tracker takes
   *   its 24 hours off the body before it ever reads the toll.
   * - Spelling and grammar, without further comment: the eight names arrived in
   *   four different cases, HIBERNATION's roll sentence carried a comma splice and
   *   a repeated clause, and SEVER LIFE closed on a stray `**`.
   *
   * --------------------------------------------------------------- the wiring
   * **EXPOSED NERVES is the first Life card that moves a number**, and the number
   * is the one it prints: disadvantage, on the sheet of whoever holds the row.
   * That is UNLUCKY CLOVER's rider exactly, down to the same trade it documents
   * (the Attack Roll is the sheet's, the skill check is the table's), and the card
   * carries a clock of its own so the row expires on its own. In riders.js.
   *
   * Six of the eight are offered on the tracker: EXPOSED NERVES for a turn, VIGOR
   * for an hour, HIBERNATION for a day, LIFE LINK for 5 turns and SEVER LIFE until
   * a Long Rest. HEAL and PURGE resolve the instant they are cast and want no row.
   *
   * **VIGOR is the closest thing to a second rider and it cannot be one.**
   * `healthMax` is a field the table already holds, but the number is `[[3*stat]]`
   * off the *caster's* Mind and a rider is keyed on the card rather than on the
   * caster, so the sheet holding the row has no way to work it out. Every entry in
   * EFFECT_RIDERS today is a literal constant, and that is why. SEVER LIFE is the
   * same wall from the other side: its cut to maximum Health is the damage rolled,
   * which is a number no table can carry. Both are written up in the
   * considered-and-left-out list in riders.js.
   */
  {
    id: 'heal',
    name: 'Heal',
    summary: 'Mend one entity at range, and Multicast to mend the whole party.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Life'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    body:
      'You mend the flesh of **an entity** you can see within **9 meters (30 feet)**.\n\n' +
      'You restore [[4d6 + 4*stat]] Health.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 3 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },
  {
    id: 'purge',
    name: 'Purge',
    summary: 'A touch of raw life strips one negative effect, off as many as you pay for.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Life'],
    ap: 2,
    wp: 3,
    stat: 'mind',
    body:
      'You flood **an entity** you touch with raw life energy.\n\n' +
      'You remove one negative effect from the target.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 2 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },
  {
    /* AGONY on the sheet and on the plate, renamed in chat. The damage is untyped
       because the sheet names no type: see "the readings" above. */
    id: 'exposed-nerves',
    name: 'Exposed Nerves',
    summary: 'Set a target’s nerves alight for damage and disadvantage on its Rolls.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Life'],
    ap: 3,
    wp: 4,
    stat: 'mind',
    body:
      'You set every nerve in **an entity** you can see within **12 meters (40 feet)** alight.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success, you deal [[2d6 + 2*stat]] {damage} damage and it has disadvantage on Rolls **until its next Turn End**.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* The 3 and the 3 are read off the rung rather than printed on the sheet, and
       the half is labelled Overcast there: see "the readings" above. */
    id: 'vigor',
    name: 'Vigor',
    summary: 'An hour of swollen life: more maximum Health, and the Health to fill it.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Life'],
    ap: 3,
    wp: 3,
    stat: 'mind',
    body:
      'You swell the life of **an entity** you touch for **1 hour**.\n\n' +
      'Its maximum Health rises by [[3*stat]] and it restores that much Health.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 2 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },
  {
    /* The one Upkeep in the codex paid at a rest rather than at a Turn Start: see
       "the readings" above. */
    id: 'hibernation',
    name: 'Hibernation',
    summary: 'A dying entity sleeps out a day, untouchable, for as long as you keep paying.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Life'],
    ap: 4,
    wp: 10,
    stat: 'mind',
    body:
      'You put **an entity** you touch below 10% of its maximum Health into a deathlike sleep for **24 hours**.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success it sleeps, incapacitated and immune to all damage. It does not breathe or bleed, and cannot be brought down.', // text-style-ok: joins two clauses
    sub_name: 'Upkeep',
    sub_body:
      'At each Long Rest, pay 10 Willpower to keep the sleeper under. Miss the Upkeep and the spell ends.',
  },
  {
    /* REssurection in the cell and Ressurection on the plate, which is a
       misspelling twice over rather than a name: see "the readings" above. */
    id: 'resurrection',
    name: 'Resurrection',
    summary: 'Call the dead back, and the longer they have been gone the harder it gets.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Life'],
    ap: 6,
    wp: 12,
    stat: 'mind',
    body:
      'You attempt to return **an entity** you touch to life.\n\n' +
      'If it has been dead for less than **1 minute**, it returns at 1 Health.\n\n' +
      'Otherwise, make a {stat} Roll {roll} with a difficulty of 14, raised by 1 for every hour since it died. On a failure the spell fails and the body is destroyed.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* The leash is printed at the cast range, because the sheet's own conversion
       of it does not hold: see "the readings" above. */
    id: 'life-link',
    name: 'Life Link',
    summary: 'Five turns where a party splits every wound and every heal evenly.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Life'],
    ap: 4,
    wp: 10,
    stat: 'mind',
    body:
      'You link **up to 5 entities** you can see within **12 meters (40 feet)** for **5 turns**.\n\n' +
      'Health any linked entity loses or restores is split evenly between all of them, rounding down.\n\n' +
      'A linked entity more than **12 meters (40 feet)** from you at its Turn End leaves the link.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* Untyped for the same reason EXPOSED NERVES is: see "the readings" above. */
    id: 'sever-life',
    name: 'Sever Life',
    summary: 'A cut that takes away the maximum Health to hold it, until they rest.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Life'],
    ap: 4,
    wp: 8,
    stat: 'mind',
    body:
      'You cut into the life of **an entity** you can see within **9 meters (30 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success, you deal [[4d6 + 4*stat]] {damage} damage and its maximum Health falls by the damage dealt **until its next Long Rest**.',
    sub_name: null,
    sub_body: null,
  },

  /* ----------------------------------------------------- Primal · Blood ---- */
  {
    id: 'bleeding-trail',
    name: 'Bleeding Trail',
    summary: 'A red mist only you can see, leading to whoever the blood belonged to.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Blood'],
    ap: 6,
    wp: 4,
    stat: 'mind',
    body:
      'You touch a blood sample to create a trail of red mist that only you can see.\n\n' +
      'The trail lasts for **12 hours** and, if followed, leads you directly to the entity the blood came from.',
    sub_name: 'Blood Tithe',
    sub_body:
      'When casting this spell, you may sacrifice Health equal to your {physique} [[physique]]. If you do, you receive a clear mental image of the entity the blood originated from.',
  },
  {
    id: 'blood-spear',
    name: 'Blood Spear',
    summary: 'A thrown spear of blood. Pay in Health for advantage and a bigger die.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Blood'],
    ap: 3,
    wp: 3,
    stat: 'mind',
    damage: ['Sharp'],
    body:
      'You manifest a spear of blood and hurl it at **an entity** you can see within **9 meters (30 feet)**.\n\n' +
      'Make a {stat} Ranged Attack {roll} against the target. On a hit, you deal [[3d6 + 3*stat]] {damage} damage.',
    sub_name: 'Blood Tithe',
    sub_body:
      'When casting this spell, you may sacrifice Health equal to your {physique} [[physique]]. If you do, the attack is made with advantage and the damage is Empowered by 1.',
  },
  {
    id: 'gore-armor',
    name: 'Gore Armor',
    summary: 'Spend Health to wear it: three Physique out, six Physique of Shield back.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Blood'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    body:
      'You expend some of your blood to create a protective layer.\n\n' +
      'You sacrifice Health equal to [[3*physique]] and gain Shield equal to [[6*physique]].',
    sub_name: 'Blood Tithe',
    /* "this spell" rather than "Gore Armor", which every other card does say.
       Armor is a defined term, and a keyword is lit wherever it appears — so
       printing this card's own name would colour half of it as the Armor stat
       and offer "flat damage reduction" as the explanation, on a card that
       grants Shield and no Armor at all. It is the only name in the codex a
       keyword collides with. */
    sub_body:
      'When casting this spell, you may sacrifice a further Health equal to [[2*physique]]. If you do, you gain additional Shield equal to the Health sacrificed.',
  },
  {
    id: 'vampiric-touch',
    name: 'Vampiric Touch',
    summary: 'Drain a creature you touch for Decay damage and take back half as Health.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Blood'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'You attempt to drain the life force of **an entity** you can touch.\n\n' +
      'Make a {stat} Melee Attack {roll} against the target. On a hit, you deal [[3d6 + 3*stat]] {damage} damage and regain Health equal to half the damage dealt.',
    sub_name: 'Blood Tithe',
    /* "this spell" rather than "Vampiric Touch", for the same reason Gore
       Armor says it: touch is a defined range and a keyword is lit wherever it
       appears, so printing the name would colour half of it as a range and
       offer "close enough to put a hand on" as the explanation of a word being
       used as a name. */
    sub_body:
      'When casting this spell, you may sacrifice Health equal to your {physique} [[physique]]. If you do, the attack is made with advantage and the damage is Empowered by 1.',
  },

  /* ======================================================== Primal · Death ====
   * The school's fifth family, pulled 2026-08-26 from `data/Spells - Primal -
   * Death.csv` with its eleven pictures in `data/Death/`.
   *
   * **Death is a family and Primal is the school.** All eleven Tags cells read
   * "Novice Spell, Primal, Death", so the banner is the ordinary three and the word
   * Death goes on the shelf beside Flora, Wild, Life and Blood rather than beside
   * Primal, Elemental and Ethereal. The sheet's own filename says the same thing in
   * the same order the four Ethereal drops did: the school, then the family.
   *
   * It is the first family added to any school but Ethereal since the Elemental
   * pull, and the first thing Primal has grown since the codex's opening drop on
   * 2026-08-19.
   *
   * ------------------------------------------- the first Master spells in Primal
   * **Primal had no Master spell at all until this drop**: 24 cards in four
   * families, sixteen Novice and eight Adept. Death's four were the school's first,
   * and Flora's four (DEVOURING BLOSSOM, SEEDLING SPIRITS, IMPALING GROVE, BLIGHT
   * POLLEN) followed later the same day, with Wild's four after them and Life's
   * whole Adept and Master rung after that, so Primal stands at 52 spells: 20
   * Novice, 16 Adept and 16 Master.
   *
   * That moves a pool nobody touched. The Mycomancer draws Primal by tier and its
   * Rank 3 offered the same 24 cards its Rank 2 did, because the extra rung it
   * opened had nothing standing on it. Death took Rank 3 to 36, Flora took it to 40,
   * Wild to 44 and Life to 52, and Life's Adepts took Rank 2 from 32 to 36, so for
   * the first time reaching the top of that set is worth something. The Arcanist,
   * which names no school, goes from 44, 77 and 101 to 48, 85 and 113 on this drop,
   * and to 48, 89 and 129 once Flora, Wild and Life landed.
   *
   * --------------------------------------------------------- the twelfth row
   * Four Novice, four Adept and four Master, which is what every Ethereal family
   * landed. **It did not arrive that way.** The sheet's twelfth row was not absent,
   * it was *blank*: a row carrying "Master Spell, Primal, Death" in its Tags cell
   * and nothing in any other column, so a fourth Master had been laid out and never
   * written.
   *
   * GORE SPIKE is that row, handed over in chat later the same day with its picture
   * dropped into `data/Death/` beside the other eleven. It is the only card in
   * the family that did not come off the CSV, which is why its cell is quoted on the
   * card itself rather than here.
   *
   * ------------------------------------------------------------- what it retires
   * Nothing. Unlike the Spacial drop, which finally filed the one loose Arcane
   * card, this one stands nothing down: no placeholder claimed the word Death and
   * no card moved into it. Arcane and Nature are still empty shelves.
   *
   * ----------------------------------------------------------------- the rolls
   * Six contests and they are not all one shape, which is what settles SICKNESS
   * below. Three are the caster's Roll against a named defense: CORRUPT LIFE and
   * ENBRITTLE against Grit, GORE BLAST against the Reflex of an area. Three are
   * attacks against Defense: ROTTING TOUCH in melee, SICKNESS and GORE SPIKE at
   * range. MIMIC DEATH's inspection is a seventh Roll and is not the caster's at
   * all.
   *
   * GORE SPIKE is the family's only Master attack and closes a hole the other three
   * left: UNALIVE deals its damage without rolling for it, ENBRITTLE rolls against
   * Grit and DEATH WAIL rolls nothing, so the top rung had no Attack Roll on it.
   *
   * ----------------------------------------------------------------- the halves
   * Five, all the designer's word and all read the way the codex uses it. Four
   * Overcasts: SICKNESS spreads what is already running, PESTILENT CLOUD walks it,
   * DREDGE CORPSE and CORPSE STRIDE both buy more at the moment of casting. CORRUPT
   * LIFE's Multicast is a genuine one.
   *
   * Two of the five open later than a cast (SICKNESS's on a diseased entity,
   * PESTILENT CLOUD's on a cloud already up), so the parse in overcast.js charges
   * them as their own spend rather than as a rider. The other three keep "When
   * casting". Three of the five said "pay" where the codex says "spend", which is
   * the word the price is read off.
   *
   * ------------------------------------------------------- three terms came off
   * The drop glosses three effects at the foot of the cards that inflict them, and
   * a gloss on a card is what keywords.js exists to absorb. All three moved and all
   * three sentences are the designer's own:
   *
   * - **diseased**, off SICKNESS: -1 to all attributes until a Long Rest.
   * - **vulnerable**, off ENBRITTLE, which spells it out in a parenthesis marked
   *   "(note ...)". BURN has been defined in terms of the word since 2026-08-20 and
   *   it was never lit. It is now, on three cards.
   * - **Corpse Carrion**, off GORE BLAST. The term carries what it does and the
   *   card keeps how long, the way BLIND prints a duration over the blinded
   *   keyword: effectDuration in combatTurn.js reads its count off the card's own
   *   prose, so the 5 turns had to stay printed. Its damage is the caster's
   *   attribute and is written out in words, which no other detail in that file has
   *   had to do.
   *
   * ------------------------------------------------------------- the readings
   * Every one of these is a cell that could not be printed as it stood.
   *
   * - **Ten ranges had the metres and lost the feet**: "6 meter ()", "9 Meter ()",
   *   "12 meter ()", "18 meter ()", "15 meter ()", "6meter ()", "3 Meter ()". The
   *   conversion is the codex's own three metres to ten feet, which is the call
   *   WALL OF FLAMES documents. UNALIVE's "9 meter (30 feet)" is the only range on
   *   the sheet that arrived whole.
   * - **DREDGE CORPSE names no range at all**: "at a point you can see on the
   *   ground". Every other card in the family gives a distance. Left as line of
   *   sight rather than given a number the sheet does not carry, and it is the
   *   first thing to check.
   * - **SICKNESS is an attack and not a Roll.** Its cell says "You make a Mind roll
   *   attack. On a hit", and it names no defense to roll against, where the family's
   *   three Rolls all name one and all resolve "on a success". An attack is rolled
   *   against Defense by definition, so reading it that way invents nothing; reading
   *   it as a Roll would have meant choosing a defense for it. Printed as a **Ranged
   *   Attack**, because the target is 6 metres off and the codex's attack sentence
   *   names which kind.
   * - **MIMIC DEATH's inspection Roll is the examiner's, not the caster's**, so it
   *   prints no {roll} and it prints {mind} rather than {stat}: the examiner's Mind
   *   is Mind whoever cast the spell, and a Mycomancer casting this off Instinct
   *   must not make the examiner roll Instinct. CONTAINMENT SPHERE prints {stat} for
   *   the trapped entity's breakout, which is the same question answered the other
   *   way. Worth settling once for both.
   * - **CORPSE STRIDE's Overcast deals damage and names no type**, the hole
   *   COMPRESSION BLAST had. Every other damaging card in this family says Decay and
   *   this one says nothing, so it prints untyped rather than being given a type it
   *   does not carry: a damage type is what a resistance answers. Decay is the
   *   obvious answer. Its "2d66" is 2d6.
   * - **DREDGE CORPSE's Overcast names two defined terms and no amount**:
   *   "empowering and elevating abilities using a the corpse". Empowered is one more
   *   die and Elevated is one step of die size, both of which the glossary already
   *   says, but the cell gives no count for either. The card prints the two words
   *   bare. How many of each is a ruling, and it is the second thing to check.
   * - **DEATH WAIL's cell ends on a comma**: "gain shield equal to your maximum,".
   *   Maximum Health is the only reading that resolves, and it is what the card
   *   prints.
   * - **GORE BLAST hits for [[1d6 + stat]]**, the smallest damage on any Adept spell
   *   in the codex that catches an area. That looks like the point rather than a
   *   slip: what the card is really for is the Corpse Carrion behind it.
   * - **UNALIVE costs 12 Willpower and GORE SPIKE costs 10**, where nothing else in
   *   Primal had ever charged more than THORN RAMPART's 6. Both stand as written.
   *   Neither is the codex's highest, which is the 30 THEON PERFECT REPLICANTS and
   *   TERRA COTTA DISK both ask; 12 ties LIGHTSTRIDER GATEWAY and GUARDIAN ANGEL.
   *   The pair is worth reading side by side, since GORE SPIKE lands 6d6 + 6x the
   *   attribute for 4 and 10 and always keeps it, where UNALIVE lands 8d6 + 8x for
   *   5 and 12 and is negated outright unless the hit kills.
   * - **GORE SPIKE's cell writes the damage token as {decay}**, and it prints as
   *   {damage} over a Decay on the card. Every other card in the codex writes it the
   *   second way, and the difference is not cosmetic: {damage} prints whatever type
   *   the card is carrying, so a Decay Infusion or a Draconic Scale can move it,
   *   where a type written into the token could never be moved by anything.
   * - Spelling and grammar, throughout and without further comment: "O n a hit",
   *   "your del", "nad", "withn", "coprse", "concious", "YOu", "a corpse emerge",
   *   "turn stat", "that last for", "agiasnt", "entitles", "wtih", "CorpsCarriosn",
   *   "nleash a beam co carkcling magic etempty", "weakend to constitution",
   *   "Wilppower", "diseases by Sickenss", "entites", "along rest".
   *
   * --------------------------------------------------------------- not wired
   * Nothing here moves a number on the sheet, which is where the last four drops
   * have all landed. **SICKNESS came closest and is written up in riders.js rather
   * than wired**: diseased is -1 to all three attributes, which is the shape
   * `growth-elixir` already takes, but a rider is keyed on the card and this card's
   * Overcast gives the caster a reason to hold the row as well as the target, so
   * wiring it would take a point off the wrong sheet.
   *
   * That leaves SICKNESS untrackable, because its duration is the diseased
   * keyword's and not its own prose. SNAKE SPIRIT has had the same hole since the
   * opening drop, for the same reason, with poisoned.
   *
   * Five of the twelve are offered on the tracker (MIMIC DEATH, PESTILENT CLOUD,
   * CORRUPT LIFE, GORE BLAST and DEATH WAIL) and five of the seven left out are
   * instants with nothing to run, GORE SPIKE among them. **SICKNESS and ENBRITTLE are the two that plainly
   * last and are still not offered**, and both for the same reason: what they leave
   * on a target has no clock printed on the card. ENBRITTLE's runs until the next
   * time the target takes damage, which is a condition and not a duration.
   *
   * DEATH WAIL is the other one worth naming: it hands out Shield equal to a full
   * Health bar and then forbids healing until a Long Rest, and the second half of
   * that is a rule the sheet has no channel for, so wiring the first half alone
   * would be a promise half kept.
   */

  /* -------------------------------------------------------- Primal · Death ---- */
  {
    id: 'rotting-touch',
    name: 'Rotting Touch',
    summary: 'Rot away whatever you can put a hand on, for four dice of Decay.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Death'],
    ap: 5,
    wp: 4,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'You attempt to rot away **an entity** you can touch.\n\n' +
      'Make a {stat} Melee Attack {roll} against the target. On a hit, you deal [[4d6 + 4*stat]] {damage} damage.',
  },
  {
    /* An attack, because the cell says "attack" and "on a hit" and names no defense
       to roll against. Ranged, because the target is 6 metres off. See "the
       readings" above. */
    id: 'sickness',
    name: 'Sickness',
    summary: 'Infect one target at range. Overcast to spread it to everything around them.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Death'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    body:
      'You attempt to infect **an entity** you can see within **6 meters (20 feet)**.\n\n' +
      'Make a {stat} Ranged Attack {roll} against the target. On a hit, the target is diseased.',
    sub_name: 'Overcast',
    sub_body:
      'While an entity is diseased by this spell, you may spend 4 Action Points and 4 Willpower. If you do, **all entities** within **6 meters (20 feet)** of it are also diseased.',
  },
  {
    /* {mind} rather than {stat}, and no {roll}: the inspection is the examiner's
       Roll and not the caster's. See "the readings" above. */
    id: 'mimic-death',
    name: 'Mimic Death',
    summary: 'You and five others pass for corpses for an hour, until one of you moves.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Death'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    body:
      'You disguise yourself and **up to 5 entities** you can see within **9 meters (30 feet)** as corpses for **1 hour**, at a freshness you choose.\n\n' +
      'A disguised entity stays conscious, and taking any action breaks the spell.\n\n' +
      'A physical inspection treats it as a corpse unless the examiner succeeds on a {mind} Roll against your Grit.',
  },
  {
    /* The one card in the family that names no range, and the Overcast names two
       defined terms with no amount for either. See "the readings" above. */
    id: 'dredge-corpse',
    name: 'Dredge Corpse',
    summary: 'Pull a corpse up out of the ground. Overcast and it comes up bloated.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Death'],
    ap: 2,
    wp: 1,
    stat: 'mind',
    body: 'A corpse rises from the earth at a point on the ground you can see.',
    sub_name: 'Overcast',
    sub_body:
      'When casting this spell, you may spend an additional 2 Action Points and 2 Willpower. If you do, the corpse rises bloated. Any ability that uses it is Empowered and Elevated.',
  },
  {
    id: 'pestilent-cloud',
    name: 'Pestilent Cloud',
    summary: 'A plague cloud that sits on the field for five turns. Overcast to walk it.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Death'],
    ap: 5,
    wp: 4,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'You raise a Pestilent Cloud in a **6-meter (20-foot)** area centered on a point you can see within **12 meters (40 feet)** that lasts for **5 turns**.\n\n' +
      'An entity that enters the cloud, or is inside it at its Turn Start, takes [[2d6 + 2*stat]] {damage} damage.',
    sub_name: 'Overcast',
    sub_body:
      'While this spell is active, you may spend 2 Action Points and 2 Willpower to move the cloud to another point you can see within range.',
  },
  {
    /* The damage carries no type: the cell named none where the rest of the family
       says Decay, so it prints untyped. See "the readings" above. */
    id: 'corpse-stride',
    name: 'Corpse Stride',
    summary: 'Step to any corpse in sight. Overcast and it goes up behind you.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Death'],
    ap: 1,
    wp: 1,
    stat: 'mind',
    body: 'You teleport to a corpse you can see within **18 meters (60 feet)**.',
    sub_name: 'Overcast',
    sub_body:
      'When casting this spell, you may spend an additional 2 Action Points and 2 Willpower. If you do, the corpse explodes, dealing [[2d6 + 2*stat]] damage to **all entities** within **3 meters (10 feet)** of it.',
  },
  {
    id: 'corrupt-life',
    name: 'Corrupt Life',
    summary: 'A curse that turns every point of healing the target receives into Decay.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Death'],
    ap: 2,
    wp: 4,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'You curse **an entity** you can see within **6 meters (20 feet)** for **2 turns**.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success, Health the target would restore is converted into {damage} damage.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 3 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },
  {
    id: 'gore-blast',
    name: 'Gore Blast',
    summary: 'Detonate a corpse. What survives carries Corpse Carrion for five turns.',
    kind: 'spell',
    tags: ['Adept Spell', 'Primal', 'Death'],
    ap: 3,
    wp: 4,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'A corpse you can see within **15 meters (50 feet)** explodes.\n\n' +
      'Make a {stat} Roll {roll} against the Reflex of **all entities** within **6 meters (20 feet)** of it. On a success, you deal [[1d6 + stat]] {damage} damage and afflict them with Corpse Carrion for **5 turns**.',
  },
  {
    id: 'unalive',
    name: 'Unalive',
    summary: 'Eight dice of Decay that either kill outright or do nothing at all.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Death'],
    ap: 5,
    wp: 12,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'You unleash a beam of crackling magic at **an entity** you can see within **9 meters (30 feet)**.\n\n' +
      'You deal [[8d6 + 8*stat]] {damage} damage. If it does not reduce the target to 0 Health it is negated, and if it does the target dies instantly.\n\n' +
      'This damage cannot be modified in any way.',
  },
  {
    id: 'enbrittle',
    name: 'Enbrittle',
    summary: 'Weaken one target so the next damage it takes lands for double.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Death'],
    ap: 3,
    wp: 5,
    stat: 'mind',
    body:
      'You attempt to weaken the constitution of **an entity** you can see within **15 meters (50 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success, the next time the target takes damage it is vulnerable to that damage type.',
  },
  {
    /* "gain shield equal to your maximum," is where the cell stops. Maximum Health
       is the only reading that resolves. See "the readings" above. */
    id: 'death-wail',
    name: 'Death Wail',
    summary: 'One free return from the brink, and no healing at all after it.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Death'],
    ap: 4,
    wp: 5,
    stat: 'mind',
    body:
      'You ward yourself with necrotic magic **until your next Long Rest**.\n\n' +
      'The next time you would be brought down, you return to 1 Health instead and gain Shield equal to your maximum Health.\n\n' +
      'You cannot restore Health until you take a Long Rest, and any Health damage you take kills you instantly.',
  },
  {
    /* The twelfth row, handed over in chat on 2026-08-26 rather than arriving on
       the sheet, which left it blank. See "the twelfth row" above.

       Written as `{decay}` in the cell and printed as `{damage}` over a
       `damage: ['Decay']`, which is the form every other card in the codex
       takes: the token prints the card's own type, and writing the type into the
       token would stop a Decay Infusion from ever moving it. */
    id: 'gore-spike',
    name: 'Gore Spike',
    summary: 'Burst a corpse into a spike and run one thing beside it through.',
    kind: 'spell',
    tags: ['Master Spell', 'Primal', 'Death'],
    ap: 4,
    wp: 10,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'A corpse you can see within **15 meters (50 feet)** erupts into a spike of gore.\n\n' +
      'Make a {stat} Ranged Attack {roll} against **an entity** within **6 meters (20 feet)** of it. On a hit, you deal [[6d6 + 6*stat]] {damage} damage.',
  },

  /* ---------------------------------------------------- Arcane · Energy ----
   * **Empty, and this is where it was.** CONTAINMENT SPHERE stood here as the
   * codex's only Arcane spell and the only card in it no sheet covered: it had no
   * drop behind it, no picture on disk, and data/README.md had been carrying it as
   * an exception on both counts since the Primal pull.
   *
   * The Spacial sheet on 2026-08-25 has it as an Adept Ethereal Spacial spell with
   * a picture beside it, so the card moved down to that family with its id intact
   * and the school it was parked in is empty again. Arcane is where Nature is now:
   * a word on the shelf in cardOrder.js with nothing standing on it, waiting for a
   * sheet.
   */

  /* ======================================================== Elemental ====
   *
   * The whole school, pulled 2026-08-20 from the `data/Elemental/` folder — 29
   * card renders rather than a CSV, one family per subfolder, transcribed off
   * the cards themselves. Elemental is a main school now, level with Primal:
   * same three-tag banner, same tiers, same shelves. No talent set casts from
   * it yet, so nothing reaches these through a loadout — but an Imbuement binds
   * "a NOVICE spell" with no school named, so they reach items from the day
   * they exist, and the Master rows below are the first Master spells in the
   * codex at all (MASTER IMBUEMENT stops apologising; see EnchantWindow.jsx).
   *
   * **Every roll was brought onto the two legal targets.** The cards predate the
   * ruling that a spell rolls Mind — an Attack against Defense, or a Roll
   * against Grit or Reflex — and eight of them still rolled at Instinct, at
   * Physique, or backwards (the target rolling against the caster). All eight
   * are converted and each one is flagged where it sits; the card renders keep
   * the old wording, and `templates/elemental-spells.csv` holds the codex state
   * in the sheet's own column order so the workbook can catch up. The one
   * target-rolled contest kept is MAGMA CHAINS' breakout, because a breakout
   * paid for in the target's own Action Points is how CONTAINMENT SPHERE and
   * the grappled rule already work.
   *
   * The other decisions on record, in data/README.md with the full list:
   * the Wind family (three Novice banners print AIR, the folder and the Adept
   * card say WIND), four cards whose printed title or filename disagree
   * (CLOAK OF FLAMES prints "PRODUCE FLAME", MAGMA SURGE prints "MAGAM SURGE"
   * in a file called MAGMA SLIDE, VOLTAIC JOLT's file is named LIGHTNING
   * STRIKE, KINDLE WEAPON's file says WEAPONS), the Burn and Stunned glosses
   * moved to keywords.js, the Upkeep halves inlined to their number the way
   * PARASITIC SPORE prints its own, and "2 meters (10 feet)" read as 2 meters
   * (6 feet), because the metre leads every cell in this codex.
   */

  /* ------------------------------------------------------ Elemental · Fire ---- */
  {
    id: 'produce-flame',
    name: 'Produce Flame',
    summary: 'A palm-held flame that lights the road. Overcast hurls it for real damage.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Fire'],
    ap: 2,
    wp: null,
    stat: 'mind',
    damage: ['Fire'],
    /* "inthe palm" on the card reads "in the palm", and "Mind Range Attack" reads
       Ranged, the same missing letter WYRM BOLT had. */
    body:
      'You conjure a small flickering flame in the palm of your hand, illuminating a **15-meter (50-foot)** area around it.\n\n' +
      'Dropping the flame extinguishes it.',
    sub_name: 'Overcast',
    sub_body:
      'You can spend 2 Action Points and 4 Willpower to hurl the flame at **an entity** you can see within **15 meters (50 feet)**. Make a {stat} Ranged Attack {roll}. On a hit, you deal [[3d6 + 3*stat]] {damage} damage.',
  },
  {
    /* The card render titles itself PRODUCE FLAME — a paste left over from the
       card before it. The filename and the body are a cloak, so the filename
       named it. */
    id: 'cloak-of-flames',
    name: 'Cloak of Flames',
    summary: 'Five turns of wearing fire that singes whoever starts their turn beside you.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Fire'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    damage: ['Fire'],
    body:
      'You envelop yourself in a fiery cloak that lasts for **5 turns**.\n\n' +
      'Entities having their Turn Start within **1.5 meters (5 feet)** of you take [[stat]] {damage} damage.',
    /* The Burn parenthesis at the card's foot went to keywords.js word for word,
       the trade FRIGHTFUL ROAR and BLIND both made. */
    sub_name: 'Overcast',
    sub_body:
      'You can spend 2 Action Points and 4 Willpower to make the cloak flare outward.\n\n' +
      '**All entities** within **3 meters (10 feet)** of you are inflicted with Burn.',
  },
  {
    id: 'kindle-weapon',
    name: 'Kindle Weapon',
    summary: 'A touched weapon burns, Empowered and dealing Fire for as long as you feed it.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Fire'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    body:
      'You imbue a weapon you can touch with flames.\n\n' +
      'When the imbued weapon lands a hit, its damage is Empowered by 1 and the damage type becomes {damage:Fire}.',
    /* The card prints "UPKEEP 1" and a sentence about "the Upkeep amount"; the
       number went into the sentence, which is how PARASITIC SPORE prints its
       own toll. Same on every Upkeep half below. */
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, pay 1 Willpower to keep the weapon kindled. Miss the Upkeep and the spell ends.',
  },
  {
    id: 'fire-seed',
    name: 'Fire Seed',
    summary: 'Plant an unseen ember in somebody and always know where it is. Overcast detonates it.',
    kind: 'spell',
    tags: ['Adept Spell', 'Elemental', 'Fire'],
    ap: 3,
    wp: 2,
    stat: 'mind',
    damage: ['Fire'],
    body:
      'You embed a seed of elemental fire in **an entity** you can see within **9 meters (30 feet)**. The target is unaware unless it saw you cast.\n\n' +
      'The seed lasts **until the target takes a Long Rest**, and while it does you know its direction.',
    sub_name: 'Overcast',
    sub_body:
      'If you have any active Fire Seed, you may pay 3 Action Points and 4 Willpower to detonate. Every seed explodes, dealing [[3d6 + 3*stat]] {damage} damage to its target and **any entities** within **4.5 meters (15 feet)**.',
  },
  {
    id: 'molten-grasp',
    name: 'Molten Grasp',
    summary: 'Melt through metal and stone barehanded. Overcast leaves the heat in something they hold.',
    kind: 'spell',
    tags: ['Adept Spell', 'Elemental', 'Fire'],
    ap: 4,
    wp: 3,
    stat: 'mind',
    damage: ['Fire'],
    /* The card writes the area as "1.5² meters (5² feet)"; a superscript is not
       prose, so it reads "square meters" here. */
    body:
      'You ignite your hands, melting metal and stone with your touch for **5 turns**. For the duration, you can melt up to **1.5 square meters (5 square feet)** of metal on a surface up to **15 cm (6 inches)** thick.',
    sub_name: 'Overcast',
    sub_body:
      'You can spend 2 Action Points and 3 Willpower to transfer the heat into a metallic object. For the rest of the duration, entities in contact with the object at their Turn Start take [[2d6 + 2*stat]] {damage} damage.',
  },
  {
    id: 'wall-of-flames',
    name: 'Wall of Flames',
    summary: 'A 15-meter wall of fire that blocks sight and burns whatever crosses it.',
    kind: 'spell',
    tags: ['Adept Spell', 'Elemental', 'Fire'],
    ap: 4,
    wp: 5,
    stat: 'mind',
    damage: ['Fire'],
    /* The card says the wall is "2 meters (10 feet) thick". The metre leads
       every measurement in this codex, so 2 meters won and the parenthesis
       reads (6 feet), the conversion NATURALIZE already uses. Flagged in
       data/README.md — say the word and it becomes 3 meters (10 feet) instead. */
    body:
      'You conjure a wall of fire at a location you can see within **15 meters (50 feet)**.\n\n' +
      'The wall is **15 meters (50 feet)** long and **2 meters (6 feet)** thick, and it does not have to be a straight line. The wall blocks line of sight.\n\n' +
      '**Any entity** passing through the wall or having their Turn Start within it takes [[4d6 + 4*stat]] {damage} damage.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'blazing-suns',
    name: 'Blazing Suns',
    summary: 'Four orbiting suns for three hours. Spend one to make any damage or healing bigger.',
    kind: 'spell',
    tags: ['Master Spell', 'Elemental', 'Fire'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    damage: ['Fire'],
    body:
      'You conjure 4 small spheres of fire that hover around you, illuminating **15 meters (50 feet)** for **3 hours**.',
    sub_name: 'Overcast',
    sub_body:
      'Whenever you deal damage or heal, you can spend 1 Willpower to expend one of your spheres.\n\n' +
      'Doing so increases the damage or healing by [[2*stat]] {damage} damage when applicable.',
  },
  {
    id: 'cauterize',
    name: 'Cauterize',
    summary: 'Sear a wound closed: some Fire damage, a lot of Health back, Bleed and Poison gone.',
    kind: 'spell',
    tags: ['Master Spell', 'Elemental', 'Fire'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    damage: ['Fire'],
    body:
      'You use swift and intense heat to cauterize the wound of **an entity** you can see within **9 meters (30 feet)**.\n\n' +
      'The target takes [[2d6 + 2*stat]] {damage} damage and then regains [[5d6 + 5*stat]] Health. This removes any Bleed or Poison effect.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 3 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },
  {
    id: 'rain-of-fire',
    name: 'Rain of Fire',
    summary: 'Fire falls on a 12-meter circle, and keeps falling every turn you pay for it.',
    kind: 'spell',
    tags: ['Master Spell', 'Elemental', 'Fire'],
    ap: 4,
    wp: 6,
    stat: 'mind',
    damage: ['Fire'],
    /* The card rolled "against the Instinct" of everyone in the area. Instinct
       is not a roll target — fire out of the sky is dodged, so it is Reflex. */
    body:
      'You call down a rain of fire in a **12-meter (40-foot)** radius on a point you can see within **30 meters (100 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against the Reflex of **all entities** in the area. On a success, you deal [[4d6 + 4*stat]] {damage} damage, or half as much on a failure. Another wave falls at your Turn Start while you pay the Upkeep.',
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, pay 3 Willpower to keep the rain falling. Miss the Upkeep and the spell ends.',
  },

  /* ----------------------------------------------------- Elemental · Water ---- */
  {
    id: 'control-water',
    name: 'Control Water',
    summary: 'An hour of moving water: currents, walking on it or parting it around you.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Water'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    body:
      'You gain control over water within **3 meters (10 feet)** for the next **1 hour**, in the following ways:\n\n' +
      'Create Currents: currents move objects and entities at a speed of your choice, up to **18 meters (60 feet)** per turn.\n\n' +
      'Water Tension: targets of your choice can walk on water.\n\n' +
      'Part Water: you part a body of water in a sphere around you, letting you walk underwater.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* **Not `create-water`.** The Tidebound lineage trait already holds that id —
       its card is the one that says "You learn the Create Water spell", and until
       this pull there was no such spell for it to mean. Same collision RESILIENCE
       had, resolved the same way: the older record keeps the id, because an id is
       what a saved character points at. The printed names still collide, and that
       is flagged in data/README.md. */
    id: 'create-water-spell',
    name: 'Create Water',
    summary: 'Two liters of water from thin air. Overcast fires what is nearby as a cutting beam.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Water'],
    ap: 1,
    wp: null,
    stat: 'mind',
    damage: ['Sharp'],
    body:
      'You condense the moisture in the air. You create up to 2 liters (0.5 gallons) of water in an open container or on a surface you can see within **9 meters (30 feet)**.',
    sub_name: 'Overcast',
    sub_body:
      'If there is at least 1 liter (0.25 gallons) of water within **9 meters (30 feet)**, you may spend 3 Action Points and 1 Willpower. You hurl the water as a high-pressure beam at **an entity** in that range. Make a {stat} Ranged Attack {roll}. On a hit, you deal [[2d6 + 2*stat]] {damage} damage.',
  },
  {
    id: 'ice-armor',
    name: 'Ice Armor',
    summary: 'A frost Shield that fires an ice spike back at whoever chips it.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Water'],
    ap: 4,
    wp: 2,
    stat: 'mind',
    damage: ['Sharp'],
    body:
      'You coat your body in a layer of protective frost that lashes out when shattered.\n\n' +
      'You gain [[2d6 + 2*stat]] Shield.\n\n' +
      'When an attack causes you to lose Shield, an ice spike immediately fires at the attacker if they are within **9 meters (30 feet)** and you can see them. The target takes [[1d6 + stat]] {damage} damage.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'drain-fluids',
    name: 'Drain Fluids',
    summary: 'Siphon a body’s fluids for Decay damage every turn you keep paying.',
    kind: 'spell',
    tags: ['Adept Spell', 'Elemental', 'Water'],
    ap: 4,
    wp: 2,
    stat: 'mind',
    damage: ['Decay'],
    /* The card rolled "against the target's Physique". Physique is not a roll
       target — holding your insides where they belong is Grit, the same save
       FORCE INEBRIATION already asks for. */
    body:
      'You reach out to siphon the internal fluids of **an entity** you can see within **9 meters (30 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success, the target takes [[2d6 + 2*stat]] {damage} damage, and then again at each of your Turn Starts.',
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, pay 2 Willpower to keep siphoning. Miss the Upkeep and the spell ends. The spell also ends if you cannot see the target at your Turn Start.',
  },
  {
    id: 'flash-freeze',
    name: 'Flash Freeze',
    summary: 'A skin of ice that steals the target’s next action.',
    kind: 'spell',
    tags: ['Adept Spell', 'Elemental', 'Water'],
    ap: 3,
    wp: 3,
    stat: 'mind',
    /* The card rolled "against the target's Physique". A sudden burst is
       dodged before it sets, so it is Reflex. */
    body:
      'You release a sudden burst of freezing water to encase **an entity** you can see within **9 meters (30 feet)** in a thin layer of ice.\n\n' +
      'Make a {stat} Roll {roll} against the target’s Reflex. On a success, the target’s next Action is prevented.\n\n' +
      'This effect ends once the target attempts to take an Action.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'tidal-wave',
    name: 'Tidal Wave',
    summary: 'A nine-meter wave that sweeps everything twelve meters, into walls if they are there.',
    kind: 'spell',
    tags: ['Adept Spell', 'Elemental', 'Water'],
    ap: 4,
    wp: 5,
    stat: 'mind',
    damage: ['Blunt'],
    /* The card had the roll backwards — "entities caught in its path make a
       Physique roll against your Mind". The caster rolls here, and standing
       your ground against a wave is Grit. */
    body:
      'You create and send a tidal wave crashing onto your foes.\n\n' +
      'The wave starts at a point you can see within **24 meters (80 feet)** and moves **12 meters (40 feet)** in a direction of your choice. It is **9 meters (30 feet)** wide and **3 meters (10 feet)** tall.\n\n' +
      'Make a {stat} Roll {roll} against the Grit of **all entities** caught in its path. On a success, the entity is pushed **12 meters (40 feet)**.\n\n' +
      'If they encounter an obstacle before they are moved the full distance, they take [[3d6 + 3*stat]] {damage} damage.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* DEEP SEA ACCRETION's learnable twin, and the reason the unique one now says
       so in its own comment: same aura, a fifth of the duration, spikes at 2
       Willpower rather than 4. **{mind} on both halves for the same reason the
       unique carries it** — the cap is "half your Mind", there is no live token
       for a half, and a set that someday casts Elemental off another attribute
       must not build spikes against one attribute and throw them with another. */
    id: 'glacial-accretion',
    name: 'Glacial Accretion',
    summary: 'Five turns where spent Willpower becomes orbiting Ice Spikes. Overcast throws them all.',
    kind: 'spell',
    tags: ['Master Spell', 'Elemental', 'Water'],
    ap: 2,
    wp: 4,
    stat: 'mind',
    damage: ['Sharp'],
    body:
      'For the next **5 turns**, you manifest a freezing aura that crystallizes your spent energy into jagged shards of ice.\n\n' +
      'Every 2 Willpower you spend forms an Ice Spike that orbits you, up to half your {mind}.',
    sub_name: 'Overcast',
    sub_body:
      'You may spend 3 Action Points to hurl all active Ice Spikes at **an entity** you can see within **18 meters (60 feet)**. Make a {mind} Ranged Attack {roll}. On a hit, you deal [[1d6 + mind]] {damage} damage for each Ice Spike consumed.',
  },
  {
    id: 'ice-block',
    name: 'Ice Block',
    summary: 'Entomb a target in ice: stunned and untouchable by anything but Psychic, while you pay.',
    kind: 'spell',
    tags: ['Master Spell', 'Elemental', 'Water'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    /* The card rolled "against the target's Instinct" and glossed Stunned at its
       foot. The roll is Reflex — ice forming around you is outrun, not outwilled
       — and the gloss went to keywords.js word for word, retiring the
       provisional wording Amber Shard had been leaning on. */
    body:
      'You condense water and freeze it around **an entity** you can see within **18 meters (60 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against the target’s Reflex. On a success, the entity is encased in ice, becoming stunned and immune to all non-{damage:Psychic} damage.',
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, pay 4 Willpower to keep the ice frozen. Miss the Upkeep and the spell ends.',
  },
  {
    id: 'water-vortex',
    name: 'Water Vortex',
    summary: 'A fifteen-meter whirlpool that drags everything toward its center each turn.',
    kind: 'spell',
    tags: ['Master Spell', 'Elemental', 'Water'],
    ap: 4,
    wp: 6,
    stat: 'mind',
    /* The card had this backwards too — each entity rolled Physique against the
       caster's Mind, with Advantage for height. The caster rolls, against Grit,
       and the height clause turned over with it: what was the target's Advantage
       is Disadvantage on your roll. */
    body:
      'You manifest a swirling vortex of water at a point you can see within **9 meters (30 feet)** that lasts for **10 turns (1 minute)**. The vortex has a **15-meter (50-foot)** radius and is Difficult Terrain.\n\n' +
      'At **each entity**’s Turn Start within the area, make a {stat} Roll {roll} against its Grit. On a success, the entity is pulled **9 meters (30 feet)** toward the center of the vortex.\n\n' +
      'The roll takes 1 disadvantage against entities **3 meters (10 feet)** tall or more, and 1 more for every **1.5 meters (5 feet)** over it.',
    sub_name: null,
    sub_body: null,
  },

  /* ------------------------------------------------------ Elemental · Wind ----
   * The three Novice banners print AIR; the folder, the Adept card and this
   * codex say WIND. One word to turn back if the designer rules the other way.
   */
  {
    id: 'air-control',
    name: 'Air Control',
    summary: 'Fifteen meters of your air: thick enough to slow everyone, or thin enough to hurry them.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Wind'],
    ap: 3,
    wp: 3,
    stat: 'mind',
    /* "Slow Fall" is capitalised like a defined term and defined nowhere. Kept
       as printed and flagged in data/README.md beside Difficult Terrain. */
    body:
      'You control air density in a **15-meter (50-foot)** area centered on yourself.\n\n' +
      'When you cast it, you choose to make the air:\n\n' +
      'Dense: Doubling the Action Point cost of the {{Move}} action for **all entities** within range and granting them the Slow Fall effect for **10 turns (1 minute)**.\n\n' +
      'Light: Increases **all entities**’ Movement Speed by 3. Outside of combat, it increases how much you can travel by foot by 50%.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'fling',
    name: 'Fling',
    summary: 'Instantly displace yourself 15 meters. Walls hurt. Overcast brings others along.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Wind'],
    ap: 1,
    wp: 1,
    stat: 'mind',
    damage: ['Force'],
    body:
      'You use strong force to instantly displace yourself to a point you can see within **15 meters (50 feet)**.\n\n' +
      'If you would collide with an obstacle before reaching your destination, you stop and take [[6d6]] {damage} damage.',
    sub_name: 'Overcast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 1 Willpower any number of times. For each time you do, target **an additional entity** within touch: it moves the same distance in the same direction.',
  },
  {
    id: 'wind-blade',
    name: 'Wind Blade',
    summary: 'A cutting arc of air at range for Sharp damage.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Wind'],
    ap: 2,
    wp: 1,
    stat: 'mind',
    damage: ['Sharp'],
    body:
      'You launch a sharp wind blade at **an entity** you can see within **15 meters (50 feet)**.\n\n' +
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[2d6 + stat]] {damage} damage.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'hurl',
    name: 'Hurl',
    summary: 'A gust that throws a body nine meters wherever you point it.',
    kind: 'spell',
    tags: ['Adept Spell', 'Elemental', 'Wind'],
    ap: 3,
    wp: 3,
    stat: 'mind',
    damage: ['Blunt'],
    /* The card rolled "against the target's Physique" — Grit, for the same
       reason as TIDAL WAVE. "an another entity" reads "another entity". */
    body:
      'You create a strong gust of wind in an attempt to hurl **an entity** you can see within **9 meters (30 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against the target’s Grit. On a success, the entity is moved **9 meters (30 feet)** in a direction of your choice.\n\n' +
      'If the entity collides with **another entity**, both take [[2d6 + 2*stat]] {damage} damage and the movement stops.',
    sub_name: null,
    sub_body: null,
  },

  /* ------------------------------------------------- Elemental · Lightning ---- */
  {
    id: 'lightning-strike',
    name: 'Lightning Strike',
    summary: 'Lightning on a point you choose, and yesterday’s point struck again for free.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Lightning'],
    ap: 3,
    wp: 1,
    stat: 'mind',
    damage: ['Lightning'],
    /* "against its Instinct" on the card — Reflex, like RAIN OF FIRE. */
    body:
      'You call down lightning to strike a point you can see within **9 meters (30 feet)**.\n\n' +
      'If the space is occupied by **an entity**, make a {stat} Roll {roll} against its Reflex. On a success, you deal [[2d6 + 2*stat]] {damage} damage, or half as much on a failure.\n\n' +
      'If you used Lightning Strike in the last **12 hours**, the last point you struck with lightning is also struck.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* The file is named "ADEPT SPELL - ELEMENTAL - LIGHTNING - LIGHTNING STRIKE"
       and the card inside it is this one. The CSV's Image column carries the
       filename, so the art lands here rather than on the Novice card twice. */
    id: 'voltaic-jolt',
    name: 'Voltaic Jolt',
    summary: 'Become lightning: teleport six meters and shock everything you pass through.',
    kind: 'spell',
    tags: ['Adept Spell', 'Elemental', 'Lightning'],
    ap: 3,
    wp: 2,
    stat: 'mind',
    damage: ['Lightning'],
    body:
      'You turn into pure energy and instantly teleport yourself to a point you can see within **6 meters (20 feet)**.\n\n' +
      '**All entities** in a line between your start and end point take [[1d6 + stat]] {damage} damage.',
    sub_name: 'Overcast',
    /* The one second half in the codex whose opening clause does not say when it
       happens and cannot mean "later". Voltaic Jolt is instantaneous — you are
       energy and then you are somewhere else — so entities carried "along with
       you" are carried during that one cast and nowhere else. Every other
       "You can spend..." half sits on a spell that is still standing when it is
       paid for. See sub_when in overcast.js. */
    sub_when: 'cast',
    sub_body:
      'You can spend 1 Action Point and 2 Willpower to teleport any number of entities you can touch along with you. They move the same distance parallel to you.',
  },
  {
    id: 'galvanize',
    name: 'Galvanize',
    summary: 'Charge a touched body so every hit it takes sparks for extra Lightning.',
    kind: 'spell',
    tags: ['Master Spell', 'Elemental', 'Lightning'],
    ap: 4,
    wp: 5,
    stat: 'mind',
    damage: ['Lightning'],
    body:
      'You infuse **an entity** you can touch with volatile electrical energy that reacts to impacts: it becomes Galvanized.\n\n' +
      'Whenever a Galvanized entity is hit, a spark erupts which deals an additional [[stat]] {damage} damage to them.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 4 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },

  /* ----------------------------------------------------- Elemental · Magma ---- */
  {
    id: 'slag-shot',
    name: 'Slag Shot',
    summary: 'A pellet of magma: Fire damage, Burn and Multicast fires again and again.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Magma'],
    ap: 3,
    wp: 1,
    stat: 'mind',
    damage: ['Fire'],
    body:
      'You fire a small orb of magma at **an entity** you can see within **15 meters (50 feet)**.\n\n' +
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[1d6 + stat]] {damage} damage and the target is afflicted with Burn.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 1 Willpower any number of times. For each time you do, cast Slag Shot an additional time.',
  },
  {
    id: 'magma-chains',
    name: 'Magma Chains',
    summary: 'Three molten chains: stunned until they tear free, rooted after, burned every turn.',
    kind: 'spell',
    tags: ['Adept Spell', 'Elemental', 'Magma'],
    ap: 5,
    wp: 5,
    stat: 'mind',
    damage: ['Fire'],
    /* The one target-rolled contest this pull kept. A breakout paid for in the
       target's own Action Points is CONTAINMENT SPHERE's shape and the grappled
       rule's, so the designer's "Physique roll against your Mind" stands. */
    body:
      'Chains made of magma erupt from the ground, binding **an entity** you can see within **6 meters (20 feet)**.\n\n' +
      'The entity is bound by 3 Chains. It can spend 2 Action Points to make a {physique} Roll against your {stat}: on a success it breaks 1 Chain, on a critical success 2.\n\n' +
      'While 3 Chains remain, the target is stunned and can only attempt to break Chains. While 2 or fewer Chains remain, the target is rooted.\n\n' +
      'At its Turn Start, the entity takes [[stat]] {damage} damage.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* Three names on one card: the file says MAGMA SLIDE, the title line says
       MAGAM SURGE, and the banner says MAGMA. The title's own words won with
       their letters put back — flagged in data/README.md in case the file
       remembers an older name on purpose. */
    id: 'magma-surge',
    name: 'Magma Surge',
    summary: 'Flood a nine-meter circle with magma, then let it set around their ankles.',
    kind: 'spell',
    tags: ['Master Spell', 'Elemental', 'Magma'],
    ap: 4,
    wp: 6,
    stat: 'mind',
    damage: ['Fire'],
    body:
      'You flood a point you can see within **18 meters (60 feet)**, forming a **9-meter (30-foot)** magma pool that is Difficult Terrain.\n\n' +
      '**Any entity** entering the pool or with its Turn Start in it takes [[3d6 + 3*stat]] {damage} damage.',
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, pay 2 Willpower to keep the magma molten. Miss the Upkeep and the spell ends. When the spell ends, the magma solidifies and **all entities** in it become rooted **until their next Turn End**.', // text-style-ok: joins two clauses
  },

  /* ======================================================= Elemental · Earth ====
   *
   * The family's other eight cards, pulled 2026-08-26 from `data/Spells -
   * Elemental - Earth.csv` with nine pictures in `data/Earth/`: eight new ones
   * and a redraw of SHAPE EARTH, the one card the family already had.
   *
   * Earth arrived with the school on 2026-08-20 as a single loose render at the
   * top of `data/Elemental/`, no family folder under it and no rung above Novice.
   * This is the drop that fills it in, three cards a rung, which is the shape Fire
   * and Water have had since the school opened. **Earth is the fifth of the
   * school's seven families to reach Master** and the third to stand at a full
   * nine, beside Fire and Water. Lightning and Magma reach Master on one card a
   * rung. Wind is the short one now, three Novice cards and one Adept, and Steam
   * is still an empty folder with somebody else's HURL in it.
   *
   * The school goes from 30 spells to 38, and an Imbuement can bind either of the
   * two new Novice ones from the day they exist.
   *
   * ------------------------------------------------------- the sheet's own hand
   * Longhand, like every Elemental cell before it: "Make a Mind Ranged Attack
   * roll", "2d6 + Mind Blunt damage", "4d6 + 4 × Mind Shield". The markers are put
   * back the way the school's first pull put them back, and the numbers come off
   * `*stat` rather than off Mind, so an Instinct caster prints through the same
   * card. Metres arrive with their feet beside them on five of the eight rows and
   * with the brackets left empty on three.
   *
   * ------------------------------------------------------------- the readings
   * - **AEGIS OF STONE is spelled out.** The Name cell says "Aegis of Stron" and
   *   the picture says `Aegiis of stone.jpg`, which is two different misspellings
   *   of one English phrase rather than a name. The same read RESURRECTION got one
   *   school over, aliased in `pull-card-art.mjs` for the same reason.
   * - **STONEFLESH's resistance gloss went to the glossary.** The cell spells it
   *   out inside its own sentence, "(reistance means halved damaged)", and a
   *   defined term is never glossed in prose as well. `keywords.js` carries
   *   **resistance** now, which is the trade BURN made in this school's first pull
   *   and VULNERABLE made on the Death sheet. Five card bodies have printed the
   *   word with nothing behind it since each of them arrived, and all five light.
   * - **STONEFLESH costs 8 Willpower, and no Novice spell in the codex costs more
   *   than 4.** It is level with the priciest Adept, double every other Novice,
   *   and it is what the sheet says. **Worth Jules's word.**
   * - **STONEFLESH names "physical damage"**, a category the codex does not
   *   define. The only other card that uses the word is the Soak background's
   *   "non-physical damage", unlit since it arrived. Left plain, and it belongs on
   *   the statuses tab data/README.md has been asking for since August.
   * - **TREMOR SENSE and SINKHOLE are both labelled OVERCAST over an empty cell.**
   *   Neither prints a second half, because there is no half to print. **Worth
   *   Jules's word**: either the label is a leftover or two riders went missing on
   *   the way out of the sheet.
   * - **Three conversions arrived empty.** TREMOR SENSE reads "18 meter ()",
   *   EARTH GLIDE "20 meter (.)" and MOUNTAIN'S WEIGHT "9 meters ( feet)". Filled
   *   at the codex's own rates: 60 feet, 65 feet and 30 feet, the middle one being
   *   the conversion SINGULARITY settled a day earlier.
   * - **EARTHQUAKE doubles against "inaniamte entity"**, printed as inanimate
   *   ones. Nothing in the codex defines one, and SHAPE EARTH's wall two rungs up
   *   is the only thing in the school with Health of its own, so this is very
   *   likely the card that was meant to break it. On the statuses tab's pile with
   *   Difficult Terrain and Slow Fall.
   * - **MOUNTAIN'S WEIGHT has no clock.** The boulder holds until 6 Action Points
   *   get the target out from under it, which is the card's only exit and is
   *   priced the way a grapple's is. Read as constrained until freed.
   * - **STONE BARRAGE and EARTHQUAKE print Blunt**, which is the sheet's own word
   *   on both rows and the first typed damage this family has had.
   * - **EARTHQUAKE and EARTH GLIDE carry every mechanic on their rows and not
   *   every sentence.** Both were cut to fit, against the real renderer rather
   *   than the estimate: EARTHQUAKE first printed at 0.894 and EARTH GLIDE at
   *   0.902, under and on the codex's floor. What went was repetition. The
   *   Difficult Terrain sentence folded into the cast that makes it, "the damage
   *   is double on inanimate entity" became "Inanimate ones take double", and
   *   EARTH GLIDE's "You move through earth and stone" is a second telling of the
   *   sentence above it, so its Movement Speed moved up into that one. 0.949 and
   *   0.965 now. See docs/card-text.md: cut words, never mechanics.
   * - Spelling and grammar, without further comment: "YOu", "teh", "entites",
   *   "isnbile one", "silouhte", "imapre you vision", "your resitant", "bouldr",
   *   "boulder rock", a missing space after a comma in STONEFLESH, and a "He" that
   *   is every entity the spell can land on.
   *
   * ------------------------------------------------------ the shelf and the art
   * Nothing new to shelve or colour. Earth has been sixth on the Elemental shelf
   * in `cardOrder.js` and had `--family-earth` in `index.css` since those files
   * existed, both put there by the drop that brought SHAPE EARTH.
   *
   * The nine pictures are 1200x896 art plates, no white border and no banner, so
   * `data/Earth/` joins `FAMILY_FOLDERS` and `PLATE_FOLDERS` in
   * `pull-card-art.mjs` and the crop stays off. `data/Fire/` arrived in the same
   * drop and does the same for Fire's nine, which are all redraws of art the codex
   * already had: they are the eighth and ninth folders claimed as a family rather
   * than a school, and the first two under Elemental.
   *
   * SHAPE EARTH's plate is cut from the drop now rather than out of the 2026-08-20
   * render, which is the retirement the school's own note predicted: "a drop of
   * art-only files would retire them, and nothing needs renaming when it comes".
   * Ten renders in `data/Elemental/` are dead weight now and the art run names one
   * of them on every pass. Deleting `data/Elemental/FIRE/` and the loose SHAPE
   * EARTH render beside it makes the report go quiet, and loses nothing.
   */
  {
    id: 'shape-earth',
    name: 'Shape Earth',
    summary: 'Reshape a three-meter cube of ground into wall, pillar or whatever you need.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Earth'],
    ap: 3,
    wp: 3,
    stat: 'mind',
    body:
      'You reach out with your mind, causing earth, mud or stone to flow like thick liquid into a shape of your choosing.\n\n' +
      'You reshape a **3-meter (10-foot)** cube of earth or stone you can see within **9 meters (30 feet)** into a new form (such as a wall, a pillar or a simple stone object).\n\n' +
      'The object has a Defense equal to [[stat + level]] and Health equal to [[5*stat]].',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'stone-barrage',
    name: 'Stone Barrage',
    summary: 'Tear a rock out of the ground and throw it. Multicast buys another target.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Earth'],
    ap: 2,
    wp: 1,
    stat: 'mind',
    damage: ['Blunt'],
    body:
      'You tear a stone loose from the ground and hurl it at **an entity** you can see within **12 meters (40 feet)**.\n\n' +
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[2d6 + stat]] {damage} damage.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 1 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },
  {
    /* The gloss the cell put inside its own sentence is the Resistance entry in
       keywords.js now. See "the readings" above. */
    id: 'stoneflesh',
    name: 'Stoneflesh',
    summary: 'Skin of packed stone: a large Shield, resistance to the physical and half your Speed.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Earth'],
    ap: 4,
    wp: 8,
    stat: 'mind',
    body:
      'Your skin hardens into a shell of packed stone.\n\n' +
      'You gain [[4d6 + 4*stat]] Shield. While the Shield holds, you cannot be moved against your will or knocked prone, you have resistance to physical damage and your Movement Speed is halved.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'tremor-sense',
    name: 'Tremor Sense',
    summary: 'An hour of reading the ground: everything standing on it, invisible or walled off.',
    kind: 'spell',
    tags: ['Adept Spell', 'Elemental', 'Earth'],
    ap: 3,
    wp: 3,
    stat: 'mind',
    body:
      'You extend your senses into the earth, sensing **all entities** within **18 meters (60 feet)** for **1 hour**.\n\n' +
      'While they touch the ground or stone you know their exact position and see them as silhouettes through walls and darkness, invisible ones included.\n\n' +
      'You ignore blinded and any other effect that would impair your vision.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'earth-glide',
    name: 'Earth Glide',
    summary: 'Swim twenty meters through solid stone, blind. Bring company for a price.',
    kind: 'spell',
    tags: ['Adept Spell', 'Elemental', 'Earth'],
    ap: 3,
    wp: 3,
    stat: 'mind',
    body:
      'You loosen the stone around you and pass through it like water at your Movement Speed for up to **20 meters (65 feet)**.\n\n' +
      'You cannot see while inside. If the spell ends while you are enclosed, you are pushed to the nearest open space and knocked prone.',
    sub_name: 'Overcast',
    sub_body:
      'When casting this spell, you may spend an additional 2 Action Points and 3 Willpower to bring **any entities** you can touch along with you.',
  },
  {
    id: 'sinkhole',
    name: 'Sinkhole',
    summary: 'Drop a six-meter circle of ground into a pit nobody climbs out of quickly.',
    kind: 'spell',
    tags: ['Adept Spell', 'Elemental', 'Earth'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    body:
      'The ground gives way in a **6-meter (20-foot)** area centered on a point you can see within **15 meters (50 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against the Reflex of **all entities** in the area. On a success, the entity falls into the pit and is knocked prone.\n\n' +
      'The pit is **3 meters (10 feet)** deep and its walls are Difficult Terrain.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'mountains-weight',
    name: 'Mountain’s Weight',
    summary: 'A boulder pins one entity. Six Action Points is the only way out from under it.',
    kind: 'spell',
    tags: ['Master Spell', 'Elemental', 'Earth'],
    ap: 4,
    wp: 5,
    stat: 'mind',
    body:
      'You settle the weight of a mountain onto **an entity** you can see within **9 meters (30 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against its Reflex. On a success, the target is constrained under a boulder.\n\n' +
      'The target or an ally can spend 6 Action Points to get it out from under the boulder.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'earthquake',
    name: 'Earthquake',
    summary: 'Break an eighteen-meter radius of ground, and keep breaking it every turn you pay.',
    kind: 'spell',
    tags: ['Master Spell', 'Elemental', 'Earth'],
    ap: 4,
    wp: 6,
    stat: 'mind',
    damage: ['Blunt'],
    body:
      'You split an **18-meter (60-foot)** radius of ground you can see within **30 meters (100 feet)** into Difficult Terrain.\n\n' +
      'Make a {stat} Roll {roll} against the Grit of **all entities** in the area. On a success, you deal [[4d6 + 4*stat]] {damage} damage and they are knocked prone, or half as much on a failure. Inanimate ones take double.',
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, pay 4 Willpower to break the ground again. Miss the Upkeep and the spell ends.',
  },
  {
    id: 'aegis-of-stone',
    name: 'Aegis of Stone',
    summary: 'Four slabs orbit you for three hours. Spend one to take the weight off a hit.',
    kind: 'spell',
    tags: ['Master Spell', 'Elemental', 'Earth'],
    ap: 2,
    wp: 3,
    stat: 'mind',
    body: 'You raise 4 slabs of stone that orbit your body for **3 hours**.',
    sub_name: 'Overcast',
    sub_body:
      'Whenever you take damage, you can spend 1 Willpower to expend one of your slabs.\n\n' +
      'Doing so reduces the damage taken by [[2d6 + 2*stat]].',
  },

  /* ======================================================= Elemental · Storm ====
   *
   * The eighth family, pulled 2026-08-27 from `data/Spells - Elemental -
   * Storm.csv` with three pictures in `data/Storm/`. One card a rung, which is
   * the compound shape: Storm is wind and water, the way Magma is fire and
   * earth, and a compound family runs three deep where a base element runs nine.
   *
   * The school goes from 38 spells to 41, and an Imbuement can bind DOWNPOUR
   * from the day it exists.
   *
   * ------------------------------------------------------- the sheet's own hand
   * Longhand, like every Elemental cell before it: "Make a Mind Roll roll",
   * "2d6 + 2 × Mind Cold damage". The markers are put back the way the school's
   * first pull put them back, and the numbers come off `*stat` rather than off
   * Mind, so an Instinct caster prints through the same card.
   *
   * ------------------------------------------------------------- the readings
   * - **EYE OF THE STORM costs 6 Willpower and the sheet says 10.** Asked for in
   *   the drop itself, "reduce the cost of eye fo teh storm to 6", so the cast is
   *   the designer's second number and the 4 Willpower Upkeep is untouched.
   * - **DOWNPOUR's radius is twice its range**, a **36-meter** circle placed at
   *   **18 meters**, which makes it the largest area in the codex by three times
   *   and puts the caster well inside their own weather. It is what the cell
   *   says, so it is what prints. **Worth Jules's word**: 3.6 or 6 meters would
   *   both read as the number that was meant.
   * - **The conversion arrived empty.** DOWNPOUR reads "36-meter ()", filled at
   *   the codex's own rate as 120 feet, which is the third Elemental sheet in a
   *   row to leave a bracket open.
   * - **HAILSTORM prints Cold, the school's first.** `DAMAGE_TYPES` answers to
   *   Cold and Frost off one token and every real use in the codex writes Cold,
   *   so the sheet's own word needed nothing done to it.
   * - **Storm deals Cold and Blunt and no Lightning**, which is the sheet's own
   *   choice on both rows and the thing that keeps the Lightning family's edge.
   * - **EYE OF THE STORM carries a printed duration and an Upkeep at once.**
   *   HIBERNATION and SHADOW BIND are the two cards that already do, so the
   *   **10 turns (1 minute)** is the ceiling and the toll is what reaches it.
   * - **The Upkeep is spelled out.** The Secondary Effect cell reads "4
   *   Willpower or ti stops", which is the toll and its consequence in shorthand,
   *   and it prints in the codex's own Upkeep shape.
   * - **Three plurals light now.** DOWNPOUR prints "Ranged Attacks" and EYE OF
   *   THE STORM prints "Attack Rolls" and "Turn Starts". All three singulars have
   *   been defined terms since keywords.js existed, and a term is listed by its
   *   printed forms rather than guessed at by suffix, so all three arrived half
   *   lit, with the colour stopping in the middle of a phrase. Adding the plurals
   *   lights them in the five other card bodies that have printed one since each
   *   arrived, which is the trade STONEFLESH's **resistance** made a day earlier.
   *
   *   `.ac-kw` is bold, so lighting a phrase widens it and the fitter can feel it.
   *   All eight cards were measured before and after: only PACK BOND moved, 0.934
   *   to 0.930, one step of the binary search, and nothing came near the floor.
   * - **EYE OF THE STORM was cut to fit**, against the real renderer rather than
   *   the estimate: it first printed at 0.902, level with SENSE LIFE for the worst
   *   card in the codex. What went was repetition. "calm within 3 meters of you"
   *   already says "around you" a second time, and "at each of their Turn Starts
   *   you deal ... damage to them" is the long way round "take ... damage at each
   *   of their Turn Starts", which is what MAGMA CHAINS and PESTILENT CLOUD
   *   already print. Nineteen characters of load, two rungs of type: 0.969 now.
   *   See docs/card-text.md: cut words, never mechanics.
   * - Spelling and grammar, without further comment: "Downpou" on the picture and
   *   "ti stops" in the Upkeep cell.
   *
   * ------------------------------------------------------ the shelf and the art
   * **Storm is new to the shelf and to the palette.** It goes seventh on the
   * Elemental shelf in `cardOrder.js`, after Earth and in the order this file
   * writes it, and `--family-storm` is a slate taken between Wind's teal and
   * Water's blue and pulled down on saturation so it reads as neither. See
   * index.css: a storm sky is the one thing in this school that is grey.
   *
   * The three pictures are 2400x1792 art plates, no white border and no banner,
   * so `data/Storm/` joins `FAMILY_FOLDERS` and `PLATE_FOLDERS` in
   * `pull-card-art.mjs` and the crop stays off. Nothing in `data/Elemental/` holds
   * a Storm render, so unlike `data/Fire/` and `data/Earth/` a day earlier these
   * three shadow nothing and the run says nothing about them.
   */
  {
    id: 'downpour',
    name: 'Downpour',
    summary: 'Driving rain for a minute. Shots into it are rolled with disadvantage and fires go out.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Storm'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    /* The radius is twice the range and the conversion cell was empty. Both are
       in "the readings" above. */
    body:
      'Driving rain falls in a **36-meter (120-foot)** radius on a point you can see within **18 meters (60 feet)** for **10 turns (1 minute)**.\n\n' +
      'Ranged Attacks made into or through the area have disadvantage, and any fire in the area is extinguished.', // text-style-ok: joins two clauses
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'hailstorm',
    name: 'Hailstorm',
    summary: 'Hail on a nine-meter circle for Cold damage, and ice underfoot for a minute after.',
    kind: 'spell',
    tags: ['Adept Spell', 'Elemental', 'Storm'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    damage: ['Cold'],
    body:
      'Hail falls in a **9-meter (30-foot)** radius on a point you can see within **24 meters (80 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against the Reflex of **all entities** in the area. On a success, you deal [[2d6 + 2*stat]] {damage} damage, or half as much on a failure.\n\n' +
      'The ice left behind makes the area Difficult Terrain for **10 turns (1 minute)**.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* 10 Willpower on the sheet, 6 here, asked for in the drop. See "the
       readings" above. */
    id: 'eye-of-the-storm',
    name: 'Eye of the Storm',
    summary: 'A storm that walks with you: calm at the middle, violent out to eighteen meters.',
    kind: 'spell',
    tags: ['Master Spell', 'Elemental', 'Storm'],
    ap: 4,
    wp: 6,
    stat: 'mind',
    damage: ['Blunt'],
    body:
      'A storm opens around you for **10 turns (1 minute)**, calm within **3 meters (10 feet)** and violent out to **18 meters (60 feet)**. It moves with you.\n\n' +
      '**All entities** in the violent band have disadvantage on Attack Rolls, and take [[2d6 + 2*stat]] {damage} damage at each of their Turn Starts.', // text-style-ok: joins two clauses
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, pay 4 Willpower to keep the storm turning. Miss the Upkeep and the spell ends.',
  },

  /* ========================================================= Elemental · Mud ====
   *
   * The ninth family, pulled 2026-08-27 from `data/Spells - Elemental - Mud.csv`
   * with three pictures in `data/Mud/`. One card a rung, which is the compound
   * shape: Mud is water and earth, the way Storm is wind and water, and a
   * compound family runs three deep where a base element runs nine.
   *
   * The school goes from 40 learnable spells to 43 (44 rows with DEEP SEA
   * ACCRETION, which is Unique and item-bound), and the Arcanist, which names no
   * school, from 51, 96 and 140 to **52, 98 and 143**. No talent set casts from
   * Elemental, so no set's pool moves, and an Imbuement binds "a NOVICE spell"
   * with no school named, so MIRE can reach an item from the day it exists.
   *
   * ------------------------------------------------------- the sheet's own hand
   * Longhand, like every Elemental cell before it: "Make a Mind Roll roll",
   * "3d6 + 3 × Mind Blunt damage". The markers are put back the way the school's
   * first pull put them back, and the numbers come off `*stat` rather than off
   * Mind, so an Instinct caster prints through the same card.
   *
   * ------------------------------------------------------------- the readings
   * - **The whole family holds one entity down**, three ways: MIRE trips whoever
   *   walks in, ENGULF seals one target, DROWNING EARTH sinks a crowd by degrees.
   *   Every rung is a Reflex or Grit contest and none of them is save-or-suffer
   *   with no way out: each prints its own price in Action Points to escape.
   * - **`buried` is not a defined term and this is the card that wants one.**
   *   DROWNING EARTH's ladder is "rooted, then constrained, then buried". The
   *   first two are keywords carrying their own explanations and the third is
   *   prose the card glosses itself, "buried and taking [damage] at each Turn
   *   Start". That is readable as printed, because the damage is stated on the
   *   line, so it is transcribed as prose rather than lit. **Worth Jules's word**:
   *   whether buried is a status with rules of its own (does it stop actions the
   *   way constrained does? does it suffocate? does it end when the spell does?)
   *   is a design answer, and inventing one here would be inventing design. Until
   *   then it reads as the ordinary English word, which is how Difficult Terrain
   *   has sat in five card bodies since the school arrived.
   * - **The ladder has no stated floor.** An entity that fails once is rooted and
   *   one that fails three times is buried. Nothing says what a fourth failure
   *   does, and nothing says the stages fall off when the entity leaves the
   *   slurry. The Upkeep is the only clock, which is EARTHQUAKE's shape, so the
   *   spell ending is what releases them.
   * - **ENGULF deals 1d6 + Mind at Adept**, where the rung's damage is otherwise
   *   2d6 + 2 × Mind. It is a per-turn toll rather than a cast, and MAGMA CHAINS
   *   is the precedent: an Adept card that binds one entity and bills it [[stat]]
   *   at each Turn Start. Engulf asks more per turn than that does, and it is the
   *   sheet's own number either way.
   * - **DROWNING EARTH casts for 5 Action Points**, the only Master spell in the
   *   school that does. Every other one casts at 4 and MAGMA CHAINS spends 5 at
   *   Adept, so the number is unusual rather than unprecedented, and it is what
   *   the cell says.
   * - **The escape clause changed one verb.** The sheet reads "can use 4 action
   *   poitns"; the codex spends Action Points and never uses them, which is
   *   MOUNTAIN'S WEIGHT's word and CONTAINMENT SPHERE's. ENGULF's own clause was
   *   already "can spend".
   * - **ENGULF rolls its escape against your Grit** rather than against your Mind.
   *   MAGMA CHAINS is the one other card where a target buys a contest with its
   *   own Action Points and it rolls Physique against your Mind. Grit is a defence
   *   and the sentence works, so the sheet's own word stands.
   * - Spelling, without further comment: "netity", "poitns" and "teh" in DROWNING
   *   EARTH's cell.
   * - **DROWNING EARTH is the biggest card in this drop by a long way and it had
   *   to be cut to fit.** It arrived at a load of 696 against a 600 ceiling, the
   *   worst overrun of any card pulled so far, because it carries four mechanics
   *   and an Upkeep: an area, a per-turn contest, a three-rung ladder with damage
   *   on the last rung, an escape priced in Action Points, and a toll. The Upkeep
   *   alone is 192 of the budget (92 of prose and the flat 100 a second half
   *   costs), so the body had about 310 to work in.
   *
   *   What went was repetition and one paragraph break, never a mechanic. The
   *   clock is now said once: the paragraph opens "At the Turn Start of **any
   *   entity** in the area", so the buried rung's damage inherits it rather than
   *   printing "at each Turn Start" a second time. The escape moved into the same
   *   paragraph as the ladder it undoes, which is worth 30 on its own and reads
   *   better beside "sinks a stage": "rise a stage" is the sheet's "reduce the
   *   effect by 1 stage" in half the words and the exact inverse of the verb above
   *   it. The range dropped "on a point", which is EARTHQUAKE's own shorter form
   *   for an area made of ground, and the Upkeep holds "it" where "the ground"
   *   was. 696 to 593. See docs/card-text.md: cut words, never mechanics.
   *
   *   That leaves it 3 short of EARTHQUAKE's 596, and EARTHQUAKE is the card that
   *   proved the static estimate wrong by printing at 0.894 under a 0.9 floor. So
   *   the fit was taken off the renderer rather than the number: **0.961**, better
   *   than RAIN OF FIRE and level with EYE OF THE STORM, and MIRE and ENGULF both
   *   print at full size. The estimate reads this card high because it counts
   *   markers at source length, and this one carries 36 characters of `{stat}`,
   *   `{roll}`, `[[3d6 + 3*stat]]` and `{damage}` that render to about 17. The
   *   harness was proved first against SENSE LIFE, RAIN OF FIRE, PESTILENT CLOUD,
   *   EARTHQUAKE and EYE OF THE STORM, and read all five to the recorded digit.
   *
   * ------------------------------------------------------ the shelf and the art
   * **Mud is new to the shelf and to the palette**, eighth on the Elemental shelf
   * in `cardOrder.js`, after Storm and in the order this file writes it.
   *
   * `--family-mud` is the one token in this school that could not be sited the way
   * Storm's was. Storm took the midpoint of the two families it is made of because
   * Wind and Water sit 32 degrees apart on hue. **Water and Earth sit 174 degrees
   * apart, so their midpoint is green or purple and the method does not transfer.**
   * The lean is taken on the axis the law already names instead: Mud is Earth's
   * hue, separated on lightness and saturation, which is what water does to earth.
   * See index.css for the measured result.
   *
   * The three pictures are 2400x1792 art plates, no white border and no banner, so
   * `data/Mud/` joins `FAMILY_FOLDERS` and `PLATE_FOLDERS` in `pull-card-art.mjs`
   * and the crop stays off. All three filenames are the card names, so nothing goes
   * in `ALIASES`, and nothing in `data/Elemental/` holds a Mud render, so like
   * Storm a day earlier these three shadow nothing and the run says nothing about
   * them.
   */
  {
    id: 'mire',
    name: 'Mire',
    summary: 'Six meters of deep mud for a minute. Everything that walks into it goes down.',
    kind: 'spell',
    tags: ['Novice Spell', 'Elemental', 'Mud'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    body:
      'The ground softens into deep mud in a **6-meter (20-foot)** area centered on a point you can see within **12 meters (40 feet)** for **10 turns (1 minute)**.\n\n' +
      'The area is Difficult Terrain. When **an entity** enters it, make a {stat} Roll {roll} against its Reflex. On a success, the entity is knocked prone.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'engulf',
    name: 'Engulf',
    summary: 'Mud seals one entity in, and bills it every turn it stays there.',
    kind: 'spell',
    tags: ['Adept Spell', 'Elemental', 'Mud'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    damage: ['Blunt'],
    body:
      'Mud rises over **an entity** you can see within **9 meters (30 feet)**, sealing it inside.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success, the entity is constrained and takes [[1d6 + stat]] {damage} damage at its Turn Start.\n\n' +
      'The entity can spend 3 Action Points to make a {physique} Roll against your Grit: on a success it breaks free.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* `buried` is the sheet's own word and the codex has no such status. It is
       transcribed as prose and flagged in "the readings" above. */
    id: 'drowning-earth',
    name: 'Drowning Earth',
    summary: 'Twelve meters of slurry that swallows by degrees: rooted, then held, then under.',
    kind: 'spell',
    tags: ['Master Spell', 'Elemental', 'Mud'],
    ap: 5,
    wp: 6,
    stat: 'mind',
    damage: ['Blunt'],
    body:
      'The ground turns to slurry in a **12-meter (40-foot)** radius you can see within **24 meters (80 feet)**.\n\n' +
      'At the Turn Start of **any entity** in the area, make a {stat} Roll {roll} against its Reflex. On a success it sinks a stage: rooted, constrained, then buried, taking [[3d6 + 3*stat]] {damage} damage. It can spend 4 Action Points to rise a stage.',
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, pay 3 Willpower to keep it churning. Miss the Upkeep and the spell ends.',
  },

  /* ========================================================= Ethereal ====
   *
   * The whole school, pulled 2026-08-25 from `data/Spells - Ethereal -
   * Light.csv` with its thirteen pictures in `data/Ethereal/`. Ethereal is a
   * main school level with Primal and Elemental, and Light is its first family:
   * same three-tag banner, same tiers, same shelves.
   *
   * **This retires UNWRITTEN LIGHT.** Flag 4 in lineages.js was that a
   * Celestial's INNATE LIGHT promised a Novice Light Spell the codex had not
   * got, so the ancestry could never be settled and a stand-in held the slot.
   * Four real ones arrive here, the shelf is read off the codex, and the
   * stand-in is deleted at the foot of this file. UNWRITTEN SHADOW stays: the
   * Shadow school is still unwritten.
   *
   * ------------------------------------------------------------- the banners
   * The sheet writes the three tags in two orders — four rows read "Ethereal,
   * Novice Spell, Light" and the other nine lead with the tier. The banner is
   * tier, school, family everywhere in this codex and `schoolOf` reads position,
   * so all thirteen are normalised to that and nothing else moves.
   *
   * LEGENDARY SPELL is a fourth rung, and THEON PERFECT REPLICANTS is the first
   * card in the codex to carry it. See "the legendary" in the header: it needs no
   * gate, because the two that read the ladder read three words and this is not
   * one of them.
   *
   * ------------------------------------------------------------- the id that moved
   * **BARRIER is `barrier-spell`.** A Novice *enchantment* already holds
   * `barrier` and already prints that name (2d6 in Shield at combat start), and
   * SPELLS folds into `CARDS` before ENCHANTMENTS, so the spell on the plain id
   * would not have collided so much as swallowed it: `getCard('barrier')` would
   * have stopped answering with the enchantment and a tracker row written for it
   * would have opened the spell. Same call RESILIENCE and CREATE WATER made, for
   * the same reason: an id is what a saved character points at, so the older
   * record keeps it. The printed names still collide, and a table will see two
   * cards called Barrier. Worth renaming one at the source.
   *
   * ------------------------------------------------------------- the rolls
   * **Three rolls were brought onto the two legal targets** — a {stat} Attack
   * against Defense, or a {stat} Roll against Grit or Reflex, rolled by the
   * caster. LIGHT's burst named no defense at all, SIGIL OF TRUTH named Grit in
   * the possessive-less "against all entities Grit", and CELESTIAL EDICT named
   * Reflex the same way. The two that named one keep it; LIGHT's went to Grit,
   * which is what BLIND already rolls against to blind somebody.
   *
   * BEND LIGHT's is the one target-rolled contest kept, the exception MAGMA
   * CHAINS' breakout already is: the roll is made by the *entity the spell is on*
   * when it acts, which may be an ally on the far side of the map, so it is
   * neither the caster's roll nor the caster's attribute. It carries `{instinct}`
   * as a name and no `{roll}`, because the number belongs to whoever makes it and
   * this card has no way to know who that is. CONTAINMENT SPHERE's breakout
   * prints no attribute for the same reason.
   *
   * "it must make an Instinct roll agasitn the target Grit" is read as the target
   * of the *action*, not of the spell: the entity is the spell's target, so
   * against its own Grit is a contest with itself. Acting on somebody and rolling
   * against their Grit to stay unseen is the sentence that reading gives back.
   *
   * ------------------------------------------------------------- the halves
   * **BEND LIGHT's half is a Multicast, not the Overcast the sheet labels it.**
   * Its prose is word for word BOLSTER's and WINGS OF RADIANCE's, both of which
   * the same sheet labels MULTICAST, and what it buys is another target. That is
   * what Multicast means in this codex (see the header) and the label is the only
   * thing that changed.
   *
   * **SIGIL OF TRUTH's opens later.** The sheet's copy begins "When casting
   * Sigil of Truth", which the parse in overcast.js reads as a rider on the cast
   * and prices on top of it, and then spends on consuming a branding that cannot
   * exist until an entity has lied. So it opens "While a branding lasts", which
   * is the same 2 Action Points and 2 Willpower charged as its own spend the way
   * every other later half is. "If you do You can consume" is the same paste.
   *
   * ------------------------------------------------------------- the readings
   * Every one of these is a cell that could not be printed as it stood.
   *
   * - **Six ranges had the metres and lost the feet**: "6 meter (feet)", "9
   *   Meter (feet)", "15 Meter (feeet)". The metre leads every cell in this codex
   *   and the conversion is the codex's own (6/20, 9/30, 15/50), which is the
   *   call WALL OF FLAMES documents.
   * - **LIGHT is cast "within range" and names none.** Its own illumination is a
   *   15-meter radius, so that is the range it is read at. The one reading here
   *   that adds a number the sheet does not carry anywhere on the row.
   * - **LIGHTFORGED WEAPON teleports "to a point within range"** and that range
   *   is the row's own 15 meters, written out.
   * - "at the start of each of your turns" is **Turn Start**, the defined term.
   * - **ORBITING ARSENAL's weapons "float around"** and the card never says what
   *   they orbit. Read as around you, which is what the title says.
   * - **GUARDIAN ANGEL says what it looks like twice**: "take the appearance you
   *   whish, taking the form of a medium-sized entity of your choice". The second
   *   is the specific one, so it is the one that survives.
   * - "gain the benefits of Bolster" is a `{{link}}` to the card, which is the
   *   Novice spell three rows above it.
   * - **THEON PERFECT REPLICANTS' second sentence is two sentences run together**:
   *   "This Action will target all Entities you can see you can choose if you
   *   want it to have it target only hostile or allied entities."
   * - Spelling, throughout and without further comment: "an halo", "the rob
   *   explode", "Lightfroged", "additoanl", "rol lagaisnt", "elegible", "lauch",
   *   "en entity", "cna", "enity", "abiltiy", "houe", "feeet", "unconcious",
   *   "3turns", "agaisnt", "adjacvent", "tht", "minnutes", "whish", "ocmpletly",
   *   "invisble", "entty", "agasitn", "your perform".
   *
   * ------------------------------------------------------------- two names
   * **"Lightmade Weapon" is kept as its own term.** ORBITING ARSENAL conjures
   * six of them and calls them that twice; the stray "the Lightforged" in the
   * middle of its Overcast is a paste from the row above and is dropped. They are
   * not LIGHTFORGED WEAPON's weapon — that one teleports and swings itself every
   * turn, these are thrown one at a time — so collapsing the two names would have
   * made a Novice card's routine run six times off an Adept one. Worth settling
   * at the source, and this is the reading that changes nothing if it is wrong.
   *
   * **THEON PERFECT REPLICANTS reads like a possessive with no apostrophe.** Left
   * as the sheet prints it, the same way SPROUT WINGS' Celestial wording is.
   *
   * ------------------------------------------------------------- not wired
   * Nothing here moves a number on the sheet. Four of the thirteen are effects a
   * tracker row would want to carry — BOLSTER's advantage, WINGS OF RADIANCE's
   * flight, BEND LIGHT's two advantage and GUARDIAN ANGEL's damage sink — and
   * none of them has a rider in riders.js. They print, they can be dealt, and the
   * table does the arithmetic, which is where every effect starts.
   */

  /* ------------------------------------------------------- Ethereal · Light ---- */
  {
    /* `barrier-spell`, not `barrier`. See "the id that moved" above. */
    id: 'barrier-spell',
    name: 'Barrier',
    summary: 'A barrier of light on somebody you touch, three dice deep in Shield.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Light'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    body:
      'You create a barrier made of light on **an entity** you can touch.\n\n' +
      'The target gains [[3d6 + 3*stat]] Shield.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'bolster',
    name: 'Bolster',
    summary: 'A halo for an hour. Everything the target does is rolled with advantage.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Light'],
    ap: 3,
    wp: 4,
    stat: 'mind',
    body:
      'You form a halo on **an entity** you can see within **6 meters (20 feet)** that lasts for **1 hour**.\n\n' +
      'The halo grants advantage to all actions for its duration.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 3 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },
  {
    id: 'light',
    name: 'Light',
    summary: 'An orb of golden light that shows you fifty feet of road. Overcast bursts it to blind.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Light'],
    ap: 2,
    wp: null,
    stat: 'mind',
    /* "within range" is read as the row's own 15 meters, and the burst rolls
       against Grit the way BLIND does. Both in "the readings" above. */
    body:
      'You conjure an orb of golden light at a point you can see within **15 meters (50 feet)**, illuminating a **15-meter (50-foot)** radius.',
    sub_name: 'Overcast',
    sub_body:
      'While this spell is active, you may spend 2 Action Points and 2 Willpower. If you do, the orb explodes. Make a {stat} Roll {roll} against the Grit of **all entities** within **6 meters (20 feet)**. On a success, they are blinded **until their next Turn End**.',
  },
  {
    id: 'lightforged-weapon',
    name: 'Lightforged Weapon',
    summary: 'A weapon of light that teleports and strikes for Sacred damage every turn.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Light'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    damage: ['Sacred'],
    /* A Melee Attack, on both halves. The weapon teleports beside its target and
       swings at what is adjacent to it, which is what "within reach" means in
       keywords.js; the sheet's second half says only "attack" and takes the
       first's word for which. */
    body:
      'You conjure a weapon of pure light in any shape at a point you can see within **15 meters (50 feet)**. It lasts **3 turns** and cannot be damaged or destroyed. ' +
      'When cast and at your Turn Start, it teleports in range and makes a {stat} Melee Attack {roll} against **an adjacent entity**. On a hit, it deals [[2d6 + 2*stat]] {damage} damage.',
    sub_name: 'Overcast',
    sub_body:
      'While this spell is active, you may spend 4 Action Points for another such attack at **an eligible entity**.',
  },
  {
    id: 'orbiting-arsenal',
    name: 'Orbiting Arsenal',
    summary: 'Six weapons of light in orbit for an hour, thrown one at a time.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Light'],
    ap: 4,
    wp: 6,
    stat: 'mind',
    damage: ['Sacred'],
    /* "Lightmade" is this card's own term and is kept. See "two names" above.
       Nothing on the row says a launched weapon is spent, and "while you still
       have Lightmade Weapons active" is the only thing that hints it: left as
       printed rather than made to say so. */
    body:
      'You conjure 6 Lightmade Weapons taking the form you wish, and they float around you for up to **1 hour**.',
    sub_name: 'Overcast',
    sub_body:
      'While you still have Lightmade Weapons active, you may spend 2 Action Points. If you do, you launch a Lightmade Weapon at **an entity** you can see within **9 meters (30 feet)**. Make a {stat} Ranged Attack {roll}. On a hit, you deal [[2d6 + 2*stat]] {damage} damage.',
  },
  {
    id: 'wings-of-radiance',
    name: 'Wings of Radiance',
    summary: 'Golden wings on somebody at range: three hours of flight at their own speed.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Light'],
    ap: 3,
    wp: 4,
    stat: 'mind',
    /* "its Movement Speed" in plain words and not `{speed}`. The token resolves
       against whoever holds the card, and these wings are on somebody else. The
       trade SPROUT WINGS makes in lineages.js, for the same reason. */
    body:
      'You manifest golden, feathered wings on **an entity** you can see within **9 meters (30 feet)** that last for **3 hours**.\n\n' +
      'While the wings last, the entity can fly at a speed equal to its Movement Speed.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 3 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },
  {
    id: 'sigil-of-truth',
    name: 'Sigil of Truth',
    summary: 'Bind a whole room to a sigil that brands whoever lies to you.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Light'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    body:
      'You manifest a Sigil of Truth against any number of entities you can see. Make a {stat} Roll {roll} against each one’s Grit. On a success, it is bound to the sigil. ' +
      'If a bound entity lies, the sigil shatters and brands it for **1 hour**.',
    /* Opens "While a branding lasts" rather than the sheet's "When casting", so
       the parse charges it as its own spend. See "the halves" above. */
    sub_name: 'Overcast',
    sub_body:
      'While a branding lasts, you may spend 2 Action Points and 2 Willpower any number of times. For each time you do, consume a branding: its entity must answer a yes-or-no question truthfully.',
  },
  {
    id: 'hard-light',
    name: 'Hard Light',
    summary: 'A wall, a bridge or whatever else you need, built out of solid light.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Light'],
    ap: 6,
    wp: 6,
    stat: 'mind',
    body:
      'You conjure a static construct of solid light in a shape you wish, such as a wall or a bridge, at a point you can see within **15 meters (50 feet)**.\n\n' +
      'The construct cannot exceed a volume of **125 cubic meters (5x5x5 meters)**.\n\n' +
      'The construct has Health equal to [[10*stat]] and Defense equal to [[2*stat]]. It lasts until it is destroyed, you take a Long Rest or you fall unconscious.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'celestial-edict',
    name: 'Celestial Edict',
    summary: 'Forbid one kind of action for three turns. Breaking the edict calls down lightning.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Light'],
    ap: 4,
    wp: 6,
    stat: 'mind',
    damage: ['Sacred'],
    body:
      'You issue a divine edict to **an entity** that can hear you within **9 meters (30 feet)**, forbidding it from taking a specific type of action for **3 turns**.\n\n' +
      'When proclaiming the edict, choose one: movement, weapon actions, casting a spell or using an ability.\n\n' +
      'Whenever the entity attempts an action matching the proclaimed edict, make a {stat} Roll {roll} against its Reflex.\n\n' +
      'On a success, a bolt of sacred lightning strikes them, dealing [[2d6 + 2*stat]] {damage} damage.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'lightstrider-gateway',
    name: 'Lightstrider Gateway',
    summary: 'A portal that carries whoever steps through it five kilometers at light speed.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Light'],
    ap: 6,
    wp: 12,
    stat: 'mind',
    body:
      'You manifest a portal of pure light in a space adjacent to you and designate a point you can see within **5 kilometers (3 miles)** that lasts for **15 minutes**.\n\n' +
      'Entities that walk through the portal are transformed into pure light, traveling at light speed to reappear at the chosen point.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'guardian-angel',
    name: 'Guardian Angel',
    summary: 'An angel that eats every hit your allies take, and bolsters them while it stands.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Light'],
    ap: 5,
    wp: 12,
    stat: 'mind',
    body:
      'You manifest a Guardian Angel at a point you can see within **6 meters (20 feet)** for **10 turns**, in the form of a medium-sized entity of your choice.\n\n' +
      'The Guardian Angel cannot be damaged directly and has Health equal to [[20*stat]].\n\n' +
      'Whenever **an ally** in its line of sight takes damage, that damage is negated and the Guardian Angel loses that much Health instead.\n\n' +
      'While it stands, allies in its line of sight gain the benefits of {{Bolster}}.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'bend-light',
    name: 'Bend Light',
    summary: 'An hour of near-invisibility. Acting on anything risks giving it away.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Light'],
    ap: 3,
    wp: 4,
    stat: 'mind',
    /* The roll is the hidden entity's and not the caster's, so it names the
       attribute and prints no number. Both halves of that, and the reading of
       "the target", are in "the rolls" above. */
    body:
      'You bend light around **an entity** you can see within **6 meters (20 feet)** for **1 hour**. It is almost invisible, with 2 advantage on hiding and stealth.\n\n' +
      'Taking any action but movement asks an {instinct} Roll against its target’s Grit. On a failure, the spell ends.',
    /* Labelled OVERCAST on the sheet and read as the Multicast its own words
       are. See "the halves" above. */
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 3 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },
  {
    /* The first Legendary Spell in the codex. Nothing reaches the rung and
       nothing has to: see "the legendary" in the header. */
    id: 'theon-perfect-replicants',
    name: 'Theon Perfect Replicants',
    summary: 'Your next single-target Action hits everything you can see at once.',
    kind: 'spell',
    tags: ['Legendary Spell', 'Ethereal', 'Light'],
    ap: 6,
    wp: 30,
    stat: 'mind',
    body:
      'The next Action you perform that targets **a single entity** is blessed by celestial might.\n\n' +
      'That Action targets **every entity** you can see instead. You may have it target only hostile entities or only allied ones.',
    sub_name: null,
    sub_body: null,
  },


  /* ======================================================== Ethereal · Shadow ====
   *
   * The school's second family, pulled 2026-08-25 from `data/Spells - Ethereal -
   * Shadow.csv` with its twelve pictures in `data/Shadow/`. Light arrived earlier
   * the same day and set the shape; this is the same three-tag banner under the
   * same school, and the sheet writes all twelve in tier, school, family order
   * already, so nothing had to be normalised.
   *
   * Four Novice, four Adept, four Master, and no Legendary. THEON PERFECT
   * REPLICANTS is still the only card on the fourth rung.
   *
   * **This retires UNWRITTEN SHADOW, and with it flag 4 in lineages.js.** An
   * Infernal's INNATE SHADOW promised a Novice Shadow Spell the codex had not
   * got, so the ancestry could never be settled and a stand-in held the slot.
   * Four real ones arrive here, the shelf is read off the codex, and the stand-in
   * is deleted at the foot of this file. That was the last of the two, so no
   * lineage card is left whose question the codex cannot answer.
   *
   * ------------------------------------------------------------- the mirror
   * Shadow is written against Light on purpose and three pairs are exact. SCOURGE
   * is BOLSTER inverted at the same 3 Action Points and 4 Willpower, a crown for a
   * halo and disadvantage on every action for advantage on every action, down to
   * the Multicast costing the same 1 and 3. JULES' ABSOLUTE EDICT is CELESTIAL
   * EDICT's opposite number, compelling one action where the other forbids one.
   * GLOOM ECHO doubles your next Action where THEON PERFECT REPLICANTS widens it.
   *
   * Worth knowing because it is what settled one of the readings below: a Shadow
   * card missing a number its Light twin carries is read at the twin's.
   *
   * -------------------------------------------------- what the codex learned
   * **CONSTRAINED is a keyword now.** SHADOW BIND glosses it at its own foot,
   * "Constrained entities cannot take actions but are still aware of their
   * surroundings", and a defined term is never glossed in prose as well (see the
   * writing rule at the top of keywords.js). So the sentence moved to keywords.js
   * word for word and the parenthetical came off, which is exactly the trade ICE
   * BLOCK made for Stunned. The Trickster's AMBUSH has named the Constrained
   * status since 2026-08-23 with nothing behind the word; it is lit now.
   *
   * ------------------------------------------------------------- the rolls
   * Every contest here is the caster's own, so all six are a {stat} Roll against
   * Grit or Reflex, or a {stat} Ranged Attack. Nothing needed BEND LIGHT's
   * target-rolled exception.
   *
   * **CLOUD MIND asks for a saving throw and this system has none.** "if they
   * succeed the saving throw" is the sheet's only borrowed term, and it is the
   * caster who rolls here, so the sentence is read from the other end: the target
   * learns its mind was altered when the spell ends or when the roll fails. Same
   * event, named the way the codex names it.
   *
   * ------------------------------------------------------------- the halves
   * Seven, all labelled correctly for once: two Multicasts, three Overcasts and
   * two Upkeeps.
   *
   * **Two of them open later than the sheet has them.** EFFIGY's Overcast reads
   * "You can spend 2 Action Points and 2 Willpower" and says nothing about when,
   * and its doll cannot be scryed through before it exists; SHADOW BIND's Upkeep
   * is the same shape. Both open on the state they need, the way SIGIL OF TRUTH's
   * does, so the parse in overcast.js charges them as their own spend rather than
   * as a rider on the cast. DARK BARGAIN's genuinely is a rider on the cast and
   * keeps "When casting". HAUNTING SHADOWS already opened "While Haunting Shadows
   * is active" and needed nothing.
   *
   * **UMBRAL FORM's Upkeep says "may" and not "must".** Every other Upkeep in the
   * codex is a toll on a spell that would otherwise run on; this one lasts until
   * your next Turn Start on its own, so the payment buys another turn rather than
   * preventing an ending. The house sentence follows it unchanged, because not
   * paying does end the spell.
   *
   * ------------------------------------------------------------- the readings
   * Every one of these is a cell that could not be printed as it stood.
   *
   * - **Four ranges had the metres and lost the feet**: "6 Meter (feet)", "9 meter
   *   (feet)", "12 Meter (feet)". The metre leads every cell in this codex and the
   *   conversion is the codex's own three metres to ten feet, which is the call
   *   WALL OF FLAMES documents. 12 meters is the first 40 feet in the codex.
   * - **JULES' ABSOLUTE EDICT is cast "within range" and names none**, the same
   *   hole LIGHT had. Read at CELESTIAL EDICT's 9 meters: same tier, same school,
   *   same "an entity that can hear you", and it is the card this one mirrors. The
   *   codex had the answer rather than having to invent one.
   * - **DARK BARGAIN names no range at all**, not even a broken one. Left at "an
   *   entity you can see", which is a limit of its own. The one card in the drop
   *   that ends without a distance.
   * - "At the start of its turn" and "At each Start Turn" are **Turn Start**, and
   *   "before the end of its next turn" is its **next Turn End**. The defined
   *   terms.
   * - **SHADOW BIND's "10 turns" is written out as 10 turns (1 minute)**, the form
   *   ENTANGLING ROOTS uses. The codex prints the minute beside the count.
   * - **SCOURGE names its own effect twice**, "a Crown of shadow" and then "The
   *   Crown of Shadows". The second is the one that survives, which is the call
   *   GUARDIAN ANGEL's double description documents.
   * - **JULES' ABSOLUTE EDICT says the command must be possible twice**, once as
   *   "If the command is impossible, the spell fails" and once as the feasibility
   *   sentence with the non-flying example. Same call, and the survivor carries
   *   the consequence the general one stated.
   * - **DARK BARGAIN's Health is the target's own**, "Health equal to your 3 x
   *   their level", where "your" is a paste from the column beside it. It is 3
   *   times the target's level and the target may be anybody, so it is written in
   *   plain words with no live value at all. The trade WINGS OF RADIANCE makes
   *   with "its Movement Speed", for the same reason.
   * - **EFFIGY mirrors "health"** and means the stat, so it is Health and lit.
   * - Spelling and grammar, throughout and without further comment: "scarficice",
   *   "conditions.The", "Cognite", "can ear you", "agaisth", "emeerge", "aciton",
   *   "umbral from", "your have", "can slips", "traverser", "enitites", "thier",
   *   "thir", "teh", "paranoi", "stoping", "form taking", "disvetnage",
   *   "addtional", "Start Turn", "with 9 Meter".
   *
   * ------------------------------------------------------------- one name
   * **COGNITE DISTORTION is read as COGNITIVE DISTORTION.** "Cognite" is not a
   * word in any of the sheet's languages, cognitive distortion is the real term
   * the card describes, and `data/Shadow/Cognitive Distortion.jpg` is what the
   * picture drawn for it is called. Three things agreeing against one typo, and it
   * is the only card name in the drop that moved. Worth confirming at the source,
   * because a name is what a table calls a card.
   *
   * ------------------------------------------------------------- not wired
   * Nothing here moves a number on the sheet, which is where the Light drop landed
   * too. Six are effects a tracker row would want to carry, and the two worth
   * naming are HAUNTING SHADOWS, which stops a rest and stops Health coming back,
   * and GLOOM SPIKE, which ends any effect the target was paying Upkeep for.
   * Neither has a rider in riders.js. They print, they can be dealt, and the table
   * does the arithmetic, which is where every effect starts.
   */

  /* ------------------------------------------------------ Ethereal · Shadow ---- */
  {
    /* BOLSTER inverted, cost for cost. See "the mirror" above. */
    id: 'scourge',
    name: 'Scourge',
    summary: 'A crown of shadow for an hour. Everything the target does is rolled with disadvantage.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Shadow'],
    ap: 3,
    wp: 4,
    stat: 'mind',
    body:
      'You form a Crown of Shadows on **an entity** you can see within **6 meters (20 feet)**, weakening its soul for **1 hour**.\n\n' +
      'The Crown of Shadows imposes disadvantage on all actions the entity attempts.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 3 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },
  {
    id: 'cloud-mind',
    name: 'Cloud Mind',
    summary: 'An hour where nobody finds you odd, and they only know once it lifts.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Shadow'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    /* "if they succeed the saving throw" is read from the caster's end, because
       the caster is who rolls. See "the rolls" above. */
    body:
      'You cloud the mind of **an entity** you can see within **9 meters (30 feet)** for **1 hour**.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success, it finds nothing odd about you and your allies. When the spell ends, or if the roll fails, it knows its mind was altered.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 1 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },
  {
    id: 'gloom-spike',
    name: 'Gloom Spike',
    summary: 'A spike of shadow to the mind that also cuts whatever the target was upkeeping.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Shadow'],
    ap: 2,
    wp: 3,
    stat: 'mind',
    damage: ['Psychic'],
    body:
      'You assault the mind of **an entity** you can see within **9 meters (30 feet)** with a spike of shadow.\n\n' +
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[2d6 + 2*stat]] {damage} damage.\n\n' +
      'It also ends any effect the entity was paying Upkeep for.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* No range on the row at all, and the Health is the target's own level rather
       than anything this caster can be asked for. Both in "the readings" above. */
    id: 'dark-bargain',
    name: 'Dark Bargain',
    summary: 'Offer blood for one good roll. They pay it, and they choose whether to.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Shadow'],
    ap: 1,
    wp: 1,
    stat: 'mind',
    body:
      'You offer **an entity** you can see a dark bargain.\n\n' +
      'If it accepts, it sacrifices Health equal to 3 times its level and gains advantage on its next action.',
    sub_name: 'Overcast',
    sub_body:
      'When casting this spell, you may spend an additional 2 Willpower. If the target accepts, it sacrifices a further Health equal to 3 times its level and also gains Empowered and Elevated on its next action.',
  },
  {
    id: 'shadow-hex',
    name: 'Shadow Hex',
    summary: 'Ten minutes of waking nightmare. Every failure the target rolls draws blood.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Shadow'],
    ap: 3,
    wp: 3,
    stat: 'mind',
    damage: ['Psychic'],
    body:
      'You afflict **an entity** you can see within **9 meters (30 feet)** with a creeping, waking nightmare that lasts for **10 minutes**.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success, the target is hexed.\n\n' +
      'Whenever a hexed target fails a roll, it takes [[1d6 + stat]] {damage} damage.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'effigy',
    name: 'Effigy',
    summary: 'A doll that shows you how somebody is doing, and can be looked through.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Shadow'],
    ap: 6,
    wp: 6,
    stat: 'mind',
    body:
      'You create a small doll linked to **an entity** you can see within **9 meters (30 feet)**, or to one whose physical sample you hold, such as hair, blood or skin.\n\n' +
      'The effigy mirrors the target’s physical condition, Health and active statuses. It lasts until it is destroyed or the target dies.',
    /* Opens on the doll rather than on the cast, because there is nothing to scry
       through until one exists. See "the halves" above. */
    sub_name: 'Overcast',
    sub_body:
      'While the effigy lasts, you may spend 2 Action Points and 2 Willpower to scry a brief, soundless 10-second vision of the target’s location.',
  },
  {
    /* The sheet prints COGNITE DISTORTION. See "one name" above. */
    id: 'cognitive-distortion',
    name: 'Cognitive Distortion',
    summary: 'Six words the target believes for an hour, until something hurts them.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Shadow'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    body:
      'You trick the mind of **an entity** that can hear you within **9 meters (30 feet)**, altering its perception of reality for **1 hour**.\n\n' +
      'You make a statement to the target of no more than six words. It cannot be directly harmful to the target, and it cannot lead to the target killing itself.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success, the target believes the statement to be true and only realizes it has been tricked when the spell ends.\n\n' +
      'The spell ends if the target takes any damage.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* The gloss the sheet put at this card's foot is the Constrained entry in
       keywords.js now. See "what the codex learned" above. */
    id: 'shadow-bind',
    name: 'Shadow Bind',
    summary: 'Chains of shadow that hold for a minute, as long as you keep winning the contest.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Shadow'],
    ap: 4,
    wp: 6,
    stat: 'mind',
    body:
      'Chains of shadow attempt to bind **an entity** you can touch for **10 turns (1 minute)**.\n\n' +
      'Make a {stat} Roll {roll} against its Reflex. On a success, it is constrained.',
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, pay 2 Willpower to keep the chains bound. Miss the Upkeep and the spell ends.\n\n' +
      'Each time you pay it, make another {stat} Roll {roll} against the target’s Reflex. On a failure, the spell ends.',
  },
  {
    /* Read at CELESTIAL EDICT's 9 meters, which is the card this one mirrors, and
       the two sentences about possibility are read as one. Both in "the readings"
       above. */
    id: 'jules-absolute-edict',
    name: 'Jules’ Absolute Edict',
    summary: 'Name an action and a target. They do it on their turn, or it costs them eight dice.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Shadow'],
    ap: 2,
    wp: 10,
    stat: 'mind',
    damage: ['Psychic'],
    body:
      'You issue an edict, commanding **an entity** that can hear you within **9 meters (30 feet)** to take a specific action of your choice, against a target of your choice.\n\n' +
      'At its Turn Start, it must fulfill your command. If the target refuses to obey before its **next Turn End**, it takes [[8d6 + 8*stat]] {damage} damage.\n\n' +
      'The edict must command an action that is feasible for the entity, so you cannot order a non-flying creature to fly. The spell fails if the command is impossible. The command may involve actions that put the creature at risk.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'haunting-shadows',
    name: 'Haunting Shadows',
    summary: 'A day of paranoia: no rest, no healing and a way out through their shadow.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Shadow'],
    ap: 6,
    wp: 4,
    stat: 'mind',
    body:
      'You send shadow to haunt **an entity** you can see within **12 meters (40 feet)** for **24 hours**.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success, paranoia grips it while the spell lasts: it cannot rest, cannot regain Health and has disadvantage on skill checks.',
    sub_name: 'Overcast',
    sub_body:
      'While this spell is active, you may spend 4 Action Points and 12 Willpower to emerge from the haunted target’s shadow with **up to 5 entities** you can touch, ending the spell.',
  },
  {
    id: 'umbral-form',
    name: 'Umbral Form',
    summary: 'Become shadow for a turn: resistant to everything, and thin enough to pass a keyhole.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Shadow'],
    ap: 4,
    wp: 5,
    stat: 'mind',
    body:
      'You turn yourself into an umbral form, made of shadow **until your next Turn Start**. While made of shadow you have resistance to all damage.\n\n' +
      'You can slip through any gap air can travel through, between bars and under doors, as long as the passage does not exceed 6 seconds.',
    /* "may" rather than the house "must", because this form ends on its own. See
       "the halves" above. */
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, you may pay 3 Willpower to hold the umbral form **until your next Turn Start**. Miss the Upkeep and the spell ends.',
  },
  {
    id: 'gloom-echo',
    name: 'Gloom Echo',
    summary: 'Your shadow performs your next Action again, die for die.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Shadow'],
    ap: 2,
    wp: 8,
    stat: 'mind',
    body:
      'Your shadow emerges from the ground, and the next Action you take is also performed by your shadow.\n\n' +
      'The echo is an exact duplicate of that Action, using the same dice results and values.',
    sub_name: null,
    sub_body: null,
  },


  /* ========================================================== Ethereal · Time ====
   *
   * The school's third family, pulled 2026-08-25 from `data/Spells - Ethereal -
   * Time.csv` with its twelve pictures in `data/Time/`. Light landed that morning
   * and Shadow that afternoon; this is the same three-tag banner under the same
   * school, and the sheet writes all twelve in tier, school, family order already,
   * so nothing had to be normalised.
   *
   * Four Novice, four Adept, four Master, and no Legendary. THEON PERFECT
   * REPLICANTS is still the only card on the fourth rung.
   *
   * No lineage waits on this one. Light and Shadow each had an Innate card
   * promising a Novice spell the codex had not got, and Time has none: no ancestry
   * names the family, so nothing was standing in and nothing is retired here. The
   * Ethereal school simply got a third shelf.
   *
   * -------------------------------------------------- what the codex learned
   * **INTERRUPTED is a keyword now, and the sheet asked for it in so many words.**
   * UNDO's cell ends with a note to the developer rather than card text: "lets add
   * the interrupted key word whcih means the next action in question does not
   * happen but the cost is still spent". That is a definition, so it went to
   * keywords.js in the designer's own sense and the note came off the card, which
   * is the same trade SHADOW BIND made for Constrained the same day.
   *
   * The word was already in the codex once, in CONCUSS's summary, and a summary is
   * printed as plain text rather than through CardText. So nothing that used to
   * read as ordinary English is lit by this.
   *
   * ------------------------------------------------------------- the rolls
   * Five contests, all the caster's own and all against Grit: SLOW, CHRONO LOCK,
   * UNDO and TEMPORAL COLLAPSE, plus FORESIGHT's Overcast, which is priced off a
   * roll rather than making one. TEMPORAL EROSION makes no roll at all and simply
   * lands, which MAGMA CHAINS' per-turn damage is the precedent for.
   *
   * ------------------------------------------------------------- the halves
   * Five, all labelled correctly: two Multicasts and three Overcasts.
   *
   * **Two of the three Overcasts open later than a cast.** FORESIGHT's is bought
   * when a roll it covered fails, and DELAY's when the delay runs out, so neither
   * is a rider on the cast and the parse in overcast.js charges them as their own
   * spend. CHRONO ANOMALY's already opened "While Chrono Anomaly is active" and
   * needed nothing. Both Multicasts are genuine riders and keep "When casting".
   *
   * ------------------------------------------------------------- the readings
   * Every one of these is a cell that could not be printed as it stood.
   *
   * - **Six ranges had the metres and lost the feet**: "9 meter (feet)", "6 Meter
   *   (feet)", "9 meter()", "3 (feet) Meter". The metre leads every cell in this
   *   codex and the conversion is the codex's own three metres to ten feet, which
   *   is the call WALL OF FLAMES documents. REVERSE and TEMPORAL COLLAPSE print
   *   "9 meter (30 feet)" intact on the same sheet, so the family settles its own
   *   broken cells rather than being read against another.
   * - **DELAY calls itself Chrono Lock, twice.** "Until the Chrono lock ends" in
   *   the body and "When Chrono Lock ends" in the Overcast are both pastes from
   *   the row above it, which really is CHRONO LOCK. This card is DELAY in its
   *   Name column, on its picture and in everything it describes, so both now name
   *   it. The same call ORBITING ARSENAL's stray "the Lightforged" documents.
   * - **TEMPORAL EROSION arrived with no Action Point and no Willpower cost.** Not
   *   a blank meaning free, the way LIGHT's empty Willpower cell is: it deals
   *   damage every turn for five turns, and no spell in the codex has ever had an
   *   empty AP column. Priced at 3 and 3, which is where its two Novice neighbours
   *   sit (SLOW at 3 and 2, FORESIGHT at 2 and 4) and what SHADOW HEX charges a
   *   rung up for the same creeping-damage shape. **This is the one number in the
   *   drop that is not the designer's**, and it is the first thing to check.
   * - **TEMPORAL MEND's weight limit says "100 kg (imperial value here)"**, a note
   *   to whoever was going to convert it. 220 lbs, in the form TELEKINESIS prints.
   * - **CHRONO ANOMALY's Overcast repositions it "within range" and names none**,
   *   the same hole LIGHT had. Read at the row's own 6 meters.
   * - **FORESIGHT covers "the next Attribute you make"**, which is an Attribute
   *   Roll with the noun dropped. Left in plain words with no live value: the roll
   *   it covers may be any attribute, not the one this spell was cast with, so a
   *   number here would print the wrong one.
   * - **TIME SKIP charges "1 level of Exhaustion" and the codex has no such term.**
   *   Nothing in keywords.js defines it and nothing else in the codex spends it, so
   *   it prints as the plain words the sheet wrote and is not lit. It is the second
   *   thing to check.
   * - "At each of the entity Start Turn" and "on their next Turn Start" are **Turn
   *   Start**, and "until the end of its next turn" and "its next End Turn" are its
   *   **next Turn End**. The defined terms.
   * - **CHRONO LOCK gives its duration twice**, "for a turn" and then "until the
   *   end of its next turn". The second is the one that survives, which is the call
   *   GUARDIAN ANGEL's double description documents.
   * - Spelling and grammar, throughout and without further comment: "tunrs", "you
   *   can within", "ot its", "moer than", "bunrt", "with 6 Meter", "with in",
   *   "their Grits", "tis grits", "Addtional", "loose", "repostion", "ntunred",
   *   "had happen", "teh cost", "is undo", "Start Turn", "End Turn", "all effect",
   *   "Upkeep are", "Damage and Healing effect".
   *
   * ------------------------------------------------------------- one name
   * **The Name column prints TEMPORAL COLLAPSE and the picture is `Temporall
   * Collapse.jpg`.** The sheet is the authority on what a card is called, so the
   * codex prints TEMPORAL COLLAPSE and the file is aliased in pull-card-art.mjs.
   * No card name moved in this drop.
   *
   * ------------------------------------------------------------- not wired
   * Nothing here moves a number on the sheet, which is where both earlier Ethereal
   * drops landed too. Four are effects a tracker row would want to carry, and the
   * two worth naming are SLOW, which takes 2 Action Points off a turn that has not
   * started yet, and CHRONO ANOMALY, which hands 2 back to everybody standing in
   * it. Neither has a rider in riders.js. They print, they can be dealt, and the
   * table does the arithmetic, which is where every effect starts.
   *
   * SELF HELP and TIME SKIP move a turn rather than a number, and combatBar.js has
   * nothing that can hold a turn open or hand one back. Prose, and the table runs
   * them.
   */

  /* -------------------------------------------------------- Ethereal · Time ---- */
  {
    id: 'slow',
    name: 'Slow',
    summary: 'Slow one target at range so their next turn opens two Action Points short.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Time'],
    ap: 3,
    wp: 2,
    stat: 'mind',
    body:
      'You slow time for **an entity** you can see within **9 meters (30 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success, it has 2 fewer Action Points at its next Turn Start.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 1 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },
  {
    /* The average is left in plain words. See "the readings" above: the roll this
       covers need not be the one the spell was cast with. */
    id: 'foresight',
    name: 'Foresight',
    summary: 'Take the average on your next roll instead of rolling, and buy it back if it still fails.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Time'],
    ap: 2,
    wp: 4,
    stat: 'mind',
    body:
      'You catch a glimpse of the future.\n\n' +
      'For the next Attribute Roll you make, you take the average result instead of rolling the dice.',
    /* Opens on the failure rather than on the cast, so the parse charges it as its
       own spend. See "the halves" above. */
    sub_name: 'Overcast',
    sub_body:
      'When you fail an Attribute Roll covered by Foresight, you may spend 6 Willpower. If you do, the action is undone and is as if it never happened. This does not refund the cost of the action it applies to.',
  },
  {
    /* **The 3 and the 3 are not the designer's.** The sheet left both columns empty
       on a spell that deals damage for five turns. See "the readings" above. */
    id: 'temporal-erosion',
    name: 'Temporal Erosion',
    summary: 'Five turns of time eating at one target, a die and a Mind at a time.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Time'],
    ap: 3,
    wp: 3,
    stat: 'mind',
    damage: ['Decay'],
    body:
      'You use time to erode **an entity** you can see within **9 meters (30 feet)** for **5 turns**.\n\n' +
      'At its Turn Start, it takes [[1d6 + stat]] {damage} damage.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* "Undoing wounds" on the sheet, and Wound is a defined term this card does
       not mean. Reworded rather than exempted, the way GORE ARMOR and VAMPIRIC
       TOUCH were. See the writing rule at the top of keywords.js. */
    id: 'reverse',
    name: 'Reverse',
    summary: 'Run somebody’s injuries backwards for three dice and three Minds of Health.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Time'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    body:
      'You reverse time for **an entity** you can see within **9 meters (30 feet)**, running its injuries backwards.\n\n' +
      'You restore [[3d6 + 3*stat]] Health to the entity.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 3 Willpower any number of times. For each time you do, target **an additional eligible entity**.',
  },
  {
    /* "100 kg (imperial value here)" is a note to the converter, and 220 lbs is the
       form TELEKINESIS prints. See "the readings" above. */
    id: 'temporal-mend',
    name: 'Temporal Mend',
    summary: 'Wind one broken object back to whole, up to a hundred kilos of it.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Time'],
    ap: 4,
    wp: 8,
    stat: 'mind',
    body:
      'You restore a non-magical object you can see to its undamaged state.\n\n' +
      'The object cannot exceed 100 kg (220 lbs) in weight.\n\n' +
      'It can restore burnt books, mend broken doors and mend cloth. It does not work on living things.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* The duration is given twice and the precise one survives. See "the readings"
       above. */
    id: 'chrono-lock',
    name: 'Chrono Lock',
    summary: 'Freeze one target in time, stunned until its next turn is over.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Time'],
    ap: 4,
    wp: 6,
    stat: 'mind',
    body:
      'You attempt to freeze **an entity** you can see within **6 meters (20 feet)** in time.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success, the target is stunned **until its next Turn End**.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* The sheet calls this card Chrono Lock twice, on both halves, and both are
       pastes from the row above. See "the readings" above. */
    id: 'delay',
    name: 'Delay',
    summary: 'Everything aimed at one target is held back and lands all at once on its turn.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Time'],
    ap: 3,
    wp: 2,
    stat: 'mind',
    body:
      'You delay time for **an entity** you can see within **9 meters (30 feet)** **until its next Turn End**.\n\n' +
      'Until the spell ends, all spells, attacks and abilities aimed at the target are delayed.\n\n' +
      'Everything held this way is executed all at once at the target’s **next Turn End**.',
    /* Opens on the ending rather than on the cast, so the parse charges it as its
       own spend. See "the halves" above. */
    sub_name: 'Overcast',
    sub_body:
      'When this spell ends, you may spend 3 Willpower. If you do, every delayed action is Elevated by 1.',
  },
  {
    /* The gloss the sheet put at this card's foot is the Interrupted entry in
       keywords.js now. See "what the codex learned" above. */
    id: 'undo',
    name: 'Undo',
    summary: 'Interrupt one target’s next Action. It still pays for it.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Time'],
    ap: 4,
    wp: 6,
    stat: 'mind',
    body:
      'You use time magic to undo events that are not in your favour, targeting **an entity** you can see within **9 meters (30 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success, the entity’s next Action is interrupted.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'chrono-anomaly',
    name: 'Chrono Anomaly',
    summary: 'A bubble of bent time: two Action Points a turn inside it, three lost on the way out.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Time'],
    ap: 4,
    wp: 10,
    stat: 'mind',
    body:
      'You bend time in a **3-meter (10-foot)** area around a point you can see within **6 meters (20 feet)** for **5 turns**.\n\n' +
      'An entity with its Turn Start inside gains 2 additional Action Points. Leaving costs 3 Action Points, or 3 Reaction Points if it has none left.',
    /* "within range" is read as the row's own 6 meters. See "the readings" above. */
    sub_name: 'Overcast',
    sub_body:
      'While this spell is active, you may spend 2 Action Points to reposition it around any point within **6 meters (20 feet)**.',
  },
  {
    /* The sheet's Name column prints TEMPORAL COLLAPSE and the picture is called
       `Temporall Collapse.jpg`. See "one name" above. */
    id: 'temporal-collapse',
    name: 'Temporal Collapse',
    summary: 'Run one target’s clock out: every short effect on it resolves and ends at once.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Time'],
    ap: 4,
    wp: 8,
    stat: 'mind',
    body:
      'You accelerate time for **an entity** you can see within **9 meters (30 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against its Grit. On a success, you end every effect on it with a duration shorter than 20 turns or 30 minutes.\n\n' +
      'Damage and healing effects instantly deal or restore everything they had left, as if every remaining turn had happened at once. Any effect the entity was paying Upkeep for ends outright.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'self-help',
    name: 'Self Help',
    summary: 'Pull yourself in from the near future for a second turn, and skip the one after.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Time'],
    ap: 2,
    wp: 6,
    stat: 'mind',
    body:
      'You summon yourself from the near future to help you.\n\n' +
      'At your next Turn End, you immediately take a second turn.\n\n' +
      'You then skip the turn that would have followed it.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* Exhaustion is not a term this codex defines, so it prints as the plain words
       the sheet wrote. See "the readings" above. */
    id: 'time-skip',
    name: 'Time Skip',
    summary: 'Step six seconds forward. Nothing can touch you, and doing it twice a day costs you.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Time'],
    ap: 3,
    wp: 8,
    stat: 'mind',
    body:
      'You propel yourself 6 seconds forward in time, immediately ending your turn and disappearing from existence.\n\n' +
      '**Until your next Turn Start**, you cannot be targeted, interacted with, damaged or affected by any entity, spell or environmental effect.\n\n' +
      'You then reappear in the space you occupied, or the nearest unoccupied one if it is taken.\n\n' +
      'Casting this spell more than once before completing a Long Rest gives you 1 level of Exhaustion for each additional cast.',
    sub_name: null,
    sub_body: null,
  },

  /* ======================================================= Ethereal · Spacial ====
   *
   * The school's fourth family, pulled 2026-08-25 from `data/Spells - Ethreal -
   * Spacial.csv` with its twelve pictures in `data/Space/`. Light, Shadow and Time
   * all landed earlier the same day; this is the same three-tag banner under the
   * same school, and the sheet writes all twelve in tier, school, family order
   * already, so nothing had to be normalised.
   *
   * Four Novice, four Adept, four Master, and no Legendary. THEON PERFECT
   * REPLICANTS is still the only card on the fourth rung.
   *
   * ------------------------------------------------------------- the spelling
   * **The family is Spacial, with a c.** That is what all twelve Tags cells say and
   * what the sheet's own filename says. Two of the cards are named with a t
   * (SPATIAL FOLD, SPATIAL TRANSPOSITION), a third says "spatial pocket" in its
   * body, and the picture folder is called Space. The Tags column is what a banner
   * prints and what a filter chips, so the tag is the sheet's Spacial and the card
   * names are the sheet's Spatial. Neither was corrected against the other.
   *
   * ------------------------------------------- what this retires: the Arcane one
   * **CONTAINMENT SPHERE was the codex's only Arcane spell and is a Spacial one
   * now.** It had no sheet behind it and no picture on disk, and data/README.md
   * carried it as the exception to both. This sheet has it at the same tier, the
   * same 4 and 4, and the same three paragraphs, with a render beside it. So it is
   * the same card finally filed, and it moved rather than being written twice:
   * the id `containment-sphere` is unchanged, so a spellbook already holding it
   * still resolves and simply reads Ethereal · Spacial from here on.
   *
   * Two things about it did change, both the sheet's: the trapped entity is
   * **Constrained** where the old card said stunned, which is the keyword SHADOW
   * BIND defined that afternoon and the better word for a thing sealed in a sphere,
   * and the Overcast costs **3 Willpower** where it used to cost 2.
   *
   * Arcane is empty again, which is exactly where Nature has always been: a word on
   * the shelf in cardOrder.js with nothing standing on it.
   *
   * ------------------------------------------------------------- the rolls
   * Seven contests, all the caster's own and all against Reflex: COMPRESSION BLAST,
   * WARP TIDE, PORTAL TRICK, ENERGY BEAM, SPATIAL TRANSPOSITION, BANISHMENT VAULT
   * and EVENT HORIZON. No family in the codex has leaned this hard on one defense.
   * CONTAINMENT SPHERE's breakout is the eighth roll and is the trapped entity's,
   * so it prints no {roll} — see the note on the card.
   *
   * ------------------------------------------------------------- the halves
   * Six, and five are labelled the way the codex uses the word: three Overcasts
   * that buy more (COMPRESSION BLAST widens, ENERGY BEAM bends, CONTAINMENT SPHERE
   * hampers the breakout), one that closes a spell early (SPATIAL FOLD), one that
   * spends the beacon you left (TRANSPOSITION BEACON), and BANISHMENT VAULT's
   * Multicast, which is a genuine one.
   *
   * **DIMENSIONAL POCKET's is called a Multicast and moves an item rather than
   * catching a target.** Multicast means spending more to reach more, and one more
   * item in the pocket is the nearest thing this card has to another target. The
   * sheet's word stands, and it is worth a glance: an Overcast is what the same
   * half would be called if the thing it reached were not countable.
   *
   * Three of the six open later than a cast (SPATIAL FOLD, TRANSPOSITION BEACON and
   * DIMENSIONAL POCKET all begin "While X is active", CONTAINMENT SPHERE's on the
   * breakout), so the parse in overcast.js charges them as their own spend rather
   * than as a rider. COMPRESSION BLAST's, ENERGY BEAM's and BANISHMENT VAULT's are
   * genuine riders and keep "When casting".
   *
   * ------------------------------------------------------------- the readings
   * Every one of these is a cell that could not be printed as it stood.
   *
   * - **Nine ranges had the metres and lost the feet**: "3 Meter()", "9 Meter ()",
   *   "with 18 meter ()", "with in 9 Meters ()", "1.5m ()", "20 meter ()". The metre
   *   leads every cell in this codex and the conversion is the codex's own three
   *   metres to ten feet, which is the call WALL OF FLAMES documents.
   * - **EVENT HORIZON's 20 meters is the first range off the codex's ladder.**
   *   Every other distance in the codex is a multiple of 3 metres or the two halves
   *   1.5 and 4.5, and 20 is neither, so it converts to 65 feet rather than to one
   *   of the round numbers the rest of the codex prints. The number is the
   *   designer's and it stands. 18 meters (60 feet) is what it would be on the
   *   ladder, and SPATIAL TRANSPOSITION on the same rung is already there.
   * - **ENERGY BEAM arrived with no Action Point and no Willpower cost**, the same
   *   hole TEMPORAL EROSION had on the Time sheet. Priced at 4 and 5, which is what
   *   SAVAGE SLAM and WALL OF FLAMES both charge for the same shape: an Adept spell
   *   catching everything in an area for [[4d6 + 4*stat]]. **This is the one number
   *   in the drop that is not the designer's**, and it is the first thing to check.
   * - **COMPRESSION BLAST deals damage and names no type.** Its two siblings both
   *   say Force and this one says nothing, so it prints untyped rather than being
   *   given a type it does not carry: a damage type is what a resistance answers,
   *   and DRACONIC SCALE grants one without the other. It is the second thing to
   *   check, and Force is the obvious answer.
   * - **SPATIAL FOLD's Overcast calls the spell Dimensional Pocket**, a paste from
   *   the row two above it, and its second sentence closes "the Spatial Fold". The
   *   card is SPATIAL FOLD in its Name column, on its picture and in everything it
   *   describes, so both halves name it. The same call DELAY documents.
   * - **ENERGY BEAM's Overcast calls the spell Arcane Ray** and bends "the ray".
   *   Same paste, same call: the Name column, the picture and the body all say
   *   Energy Beam, so the half says Energy Beam and bends the beam.
   * - **DIMENSIONAL POCKET's weight limit says "20 Kg (imperial value)"**, a note to
   *   whoever was going to convert it, exactly as TEMPORAL MEND's did. 44 lbs, in
   *   the form TELEKINESIS prints.
   * - **DIMENSIONAL REACH is cast with "special magic".** Left as the sheet wrote
   *   it. It is a real word in a real sentence, so the COGNITE reading does not
   *   apply, but every other card in the family says space or spatial and this one
   *   is called DIMENSIONAL REACH. It is the third thing to check.
   * - **PORTAL TRICK intercepts "the next attack and entity you can see"**, which is
   *   an attack *of* an entity with one letter turned. Nothing else in the sentence
   *   parses: a portal that intercepts an entity is what CONTAINMENT SPHERE does.
   * - "Until the end of your next turn" is your **next Turn End** and "At each of
   *   your Turn end" is **at your Turn End**. The defined terms.
   * - Spelling and grammar, throughout and without further comment: "abiltieis",
   *   "YOu", "agasn", "tey", "entitles", "this two points", "are connect",
   *   "is redirect", "entiteis", "Transpostion", "that last for", "orginaly",
   *   "intendend", "all action apply", "htier", "teh", "They banished",
   *   "item fall out into the ground".
   *
   * ------------------------------------------------------------- not wired
   * Nothing here moves a number on the sheet, which is where all three earlier
   * Ethereal drops landed. Five are effects a tracker row would want to carry, and
   * the two worth naming are DIMENSIONAL POCKET, which holds two items off the
   * Inventory tab until a Long Rest, and BANISHMENT VAULT, which takes an entity
   * off the board for two turns. Neither has a rider in riders.js, and the pocket
   * in particular would want the bag to know: it is the first card in the codex
   * that changes what a character is carrying without the item leaving the sheet.
   * They print, they can be dealt, and the table does the arithmetic, which is
   * where every effect starts.
   */

  /* ----------------------------------------------------- Ethereal · Spacial ---- */
  {
    /* "20 Kg (imperial value)" is a note to the converter, and 44 lbs is the form
       TELEKINESIS prints. See "the readings" above. */
    id: 'dimensional-pocket',
    name: 'Dimensional Pocket',
    summary: 'Stow two things in a pocket of nowhere until you sleep. Nothing living, nothing heavy.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Spacial'],
    ap: 1,
    wp: 1,
    stat: 'mind',
    body:
      'You stow **up to 2 items** from your hands or belt into an extradimensional space **until your next Long Rest**.\n\n' +
      'An item stowed this way can only be found by magical means, and cannot exceed 20 kg (44 lbs) or be alive.\n\n' +
      'When the spell ends, the items fall to the ground.',
    /* Called a Multicast on a half that moves an item rather than catching a
       target. The sheet's word stands. See "the halves" above. */
    sub_name: 'Multicast',
    sub_body:
      'While this spell is active, you may spend 1 Action Point and 1 Willpower to retrieve an item or stow an additional one.',
  },
  {
    /* **The damage carries no type.** The sheet named none and its two siblings both
       say Force, so it prints untyped. See "the readings" above. */
    id: 'compression-blast',
    name: 'Compression Blast',
    summary: 'Crush three meters of space at range. Overcast doubles what it catches.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Spacial'],
    ap: 5,
    wp: 3,
    stat: 'mind',
    body:
      'You compress space **3 meters (10 feet)** around a point you can see within **9 meters (30 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against the Reflex of **all entities** in the area. On a success, you deal [[3d6 + 3*stat]] damage.',
    sub_name: 'Overcast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 2 Willpower to widen the area to **6 meters (20 feet)**.',
  },
  {
    /* "special magic" is the sheet's, and it is left alone. See "the readings"
       above. */
    id: 'dimensional-reach',
    name: 'Dimensional Reach',
    summary: 'Nine more meters of reach on your next action, whatever it turns out to be.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Spacial'],
    ap: 1,
    wp: 1,
    stat: 'mind',
    body:
      'You use special magic to extend the range of your abilities.\n\n' +
      'The range of your next action is increased by **9 meters (30 feet)**.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'warp-tide',
    name: 'Warp Tide',
    summary: 'A wave of folded space that shoves everything around you six meters back.',
    kind: 'spell',
    tags: ['Novice Spell', 'Ethereal', 'Spacial'],
    ap: 3,
    wp: 2,
    stat: 'mind',
    body:
      'You attempt to push away **all entities** within **6 meters (20 feet)** of you.\n\n' +
      'Make a {stat} Roll {roll} against their Reflex. On a success, they are pushed **6 meters (20 feet)**.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* The sheet calls this card Dimensional Pocket in its Overcast, a paste from the
       row two above it. See "the readings" above. */
    id: 'spatial-fold',
    name: 'Spatial Fold',
    summary: 'Two points eighteen meters apart, joined. A meter and a half of movement crosses it.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Spacial'],
    ap: 3,
    wp: 4,
    stat: 'mind',
    body:
      'You fold space between two points you can see within **18 meters (60 feet)**.\n\n' +
      '**Until your next Turn End**, the two points in space are connected, allowing **any entity** to walk through with **1.5 meters (5 feet)** of movement to instantly emerge on the other side.',
    /* Opens on the spell already being up rather than on the cast, so the parse
       charges it as its own spend. See "the halves" above. */
    sub_name: 'Overcast',
    sub_body:
      'While this spell is active, you may spend 2 Action Points. If you do, you close the Spatial Fold early.',
  },
  {
    /* "the next attack and entity you can see" is an attack *of* an entity. See
       "the readings" above. */
    id: 'portal-trick',
    name: 'Portal Trick',
    summary: 'Hang a portal in front of one target. Its next attack arrives back at itself.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Spacial'],
    ap: 3,
    wp: 4,
    stat: 'mind',
    body:
      'You prepare to use a portal to intercept the next attack of **an entity** you can see within **9 meters (30 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against its Reflex. On a success, the entity’s next attack is redirected through a portal at itself.',
    sub_name: null,
    sub_body: null,
  },
  {
    /* **The 4 and the 5 are not the designer's.** The sheet left both columns empty
       on the family's one damage spell. See "the readings" above. */
    id: 'energy-beam',
    name: 'Energy Beam',
    summary: 'A nine-meter line of pure energy. Overcast bends it into a second line.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Spacial'],
    ap: 4,
    wp: 5,
    stat: 'mind',
    damage: ['Force'],
    body:
      'You release a beam of pure energy in a **9-meter (30-foot)** straight line originating from yourself.\n\n' +
      'Make a {stat} Roll {roll} against the Reflex of **all entities** in the line. On a success, you deal [[4d6 + 4*stat]] {damage} damage.',
    /* The sheet calls this card Arcane Ray in its Overcast, and bends "the ray".
       Same paste and same call as Spatial Fold's. See "the readings" above. */
    sub_name: 'Overcast',
    sub_body:
      'When casting this spell, you may spend 1 Action Point and 2 Willpower to bend the beam at any point along its line, projecting an additional **9-meter (30-foot)** line in any direction from that point.',
  },
  {
    /* **This is the old Arcane · Energy card, filed.** Same id, same tier, same
       costs, and the school the sheet gives it. See "what this retires" above.

       The breakout prints `{stat}` as a name and no `{roll}`: the roll is the
       trapped entity's, so the number belongs to whoever is in the sphere and this
       card has no way to know who that is. BEND LIGHT is the other one. */
    id: 'containment-sphere',
    name: 'Containment Sphere',
    summary: 'Seal one target in dense arcane energy, Constrained until it breaks out.',
    kind: 'spell',
    tags: ['Adept Spell', 'Ethereal', 'Spacial'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    body:
      'You enclose **an entity** you can see within **6 meters (20 feet)** inside a sphere of dense arcane energy. While trapped inside, the entity is constrained.\n\n' +
      'The trapped entity can spend 3 Action Points to make a {stat} Roll against your {stat}. On a success, the sphere shatters and the effect ends.',
    sub_name: 'Overcast',
    sub_body:
      'When **a trapped entity** attempts to break out, you may spend 3 Willpower. If you do, it makes its breakout Roll with disadvantage.',
  },
  {
    id: 'transposition-beacon',
    name: 'Transposition Beacon',
    summary: 'Leave a marker behind. Two Action Points brings you back to it any time within the hour.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Spacial'],
    ap: 6,
    wp: 8,
    stat: 'mind',
    body:
      'You place a Transposition Beacon at your current location that lasts for up to **1 hour**.',
    /* Opens on the beacon already being out rather than on the cast, so the parse
       charges it as its own spend. See "the halves" above. */
    sub_name: 'Overcast',
    sub_body:
      'While this spell is active, you may spend 2 Action Points. If you do, you instantly teleport to the location of your beacon, removing it.',
  },
  {
    id: 'spatial-transposition',
    name: 'Spatial Transposition',
    summary: 'Swap two people eighteen meters apart. As a reaction, it swaps who the blow lands on.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Spacial'],
    ap: 3,
    wp: 6,
    stat: 'mind',
    body:
      'You attempt to swap the position of **two entities** you can see within **18 meters (60 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against the Reflex of unwilling entities. On a success, you instantly swap the physical locations of both targets.\n\n' +
      'If you use this as a reaction, all actions apply to the swapped target instead of the originally intended one unless it would mean an entity is targeting itself.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'banishment-vault',
    name: 'Banishment Vault',
    summary: 'Put one target in a pocket outside the world for two turns. Multicast to vault a crowd into it.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Spacial'],
    ap: 4,
    wp: 8,
    stat: 'mind',
    body:
      'You attempt to trap **an entity** you can see within **9 meters (30 feet)** in an extradimensional space for **2 turns**. Make a {stat} Roll {roll} against its Reflex. On a success, the target is banished to an isolated pocket, off the battlefield entirely. It can still take its turn.',
    sub_name: 'Multicast',
    sub_body:
      'When casting this spell, you may spend an additional 1 Action Point and 6 Willpower any number of times. For each time you do, target **an additional eligible entity**, banished into the same pocket.',
  },
  {
    /* **20 meters is the first range in the codex off its own ladder**, so it
       converts to 65 feet rather than to a round number. See "the readings" above. */
    id: 'event-horizon',
    name: 'Event Horizon',
    summary: 'A singularity that drags everything within twelve meters into itself, every turn for three.',
    kind: 'spell',
    tags: ['Master Spell', 'Ethereal', 'Spacial'],
    ap: 5,
    wp: 7,
    stat: 'mind',
    damage: ['Force'],
    body:
      'You manifest a singularity at a point you can see within **20 meters (65 feet)** that lasts for **3 turns**.\n\n' +
      'At your **Turn End**, the singularity attempts to pull **all entities** within **12 meters (40 feet)** to it. Make a {stat} Roll {roll} against their Reflex.\n\n' +
      'On a success, you pull them **12 meters (40 feet)** toward the singularity and they take [[2d6 + 2*stat]] {damage} damage.',
    sub_name: null,
    sub_body: null,
  },

  /* ------------------------------------------------------- the unique ones ---- */
  {
    /* Not off the Primal sheet. Jules handed this one over in chat on 2026-08-20
       as "UNIQUE SPELL - ELEMENTAL - WATER", and the trident it lives on came
       with it. Two spellings corrected on the way in and nothing else: "5 Hour"
       reads "5 hours", and "each Ice Spikes consumed" reads "each Ice Spike
       consumed". "ELEMENAL" in the heading is Elemental.

       **{mind}, not {stat}**, both halves, which is the exception the header
       above allows rather than the rule it sets. The cap is "half your Mind" and
       there is no live token for a half — the codex writes those as the
       attribute's name, the way Deepening Connection writes "half of your
       {instinct}". Having the cap name Mind while the attack said {stat} would
       let a set that recast this in Instinct build spikes against one attribute
       and throw them with another. Nothing recasts it today — Elemental is a
       real school as of 2026-08-20, but no set's school, and the Unique tier
       keeps it out of every pool either way — so both halves name the one
       attribute the designer named, the same call GLACIAL ACCRETION, its
       learnable twin on the Master shelf, makes for the same reason. */
    id: 'deep-sea-accretion',
    name: 'Deep Sea Accretion',
    summary: 'A freezing aura turns spent Willpower into orbiting Ice Spikes. Overcast throws them all at once.',
    kind: 'spell',
    tags: ['Unique Spell', 'Elemental', 'Water'],
    ap: 2,
    wp: null,
    stat: 'mind',
    damage: ['Sharp'],
    body:
      'For the next **5 hours**, you manifest a freezing aura that crystallizes your spent energy into jagged shards of ice.\n\n' +
      'Every 4 Willpower you spend forms an Ice Spike that orbits you, up to half your {mind}.',
    sub_name: 'Overcast',
    sub_body:
      'You may spend 3 Action Points to hurl all active Ice Spikes at **an entity** you can see within **18 meters (60 feet)**. Make a {mind} Ranged Attack {roll}. On a hit, you deal [[1d6 + mind]] {damage} damage for each Ice Spike consumed.',
  },
  {
    /* Handed over in chat on 2026-08-20 as a card render headed "SPECIAL SPELL -
       NIGHTMARE", alongside the cursed cloak it lives on (see trinkets.js) and
       NIGHTMARE'S CURSE (see enchantments.js). "Special" is not a tier this
       codex has; a spell that exists on one item and nowhere else is what
       Unique already means, so Unique it is — same trade as reading the
       banner's own words into the system's.

       Nightmare is the banner's second word and stands alone: the card names no
       school and no family, so the tags mirror it rather than inventing either.

       Two readings beyond the roll-free transcription: "centered around
       yourself" reads "centered on yourself" (VERDANT FIELD's phrasing), and
       "2 meters (10 feet) tall" reads 2 meters (6 feet), the same call WALL OF
       FLAMES documents. */
    id: 'nightmare-wall',
    name: 'Nightmare Wall',
    summary: 'A ring of pure night around you that blinds sight lines and rakes minds crossing it.',
    kind: 'spell',
    tags: ['Unique Spell', 'Nightmare'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    damage: ['Psychic'],
    body:
      'You conjure a wall of pure night at a location centered on yourself.\n\n' +
      'The wall is **3 meters (10 feet)** in radius around the caster and **2 meters (6 feet)** tall. The wall blocks line of sight.\n\n' +
      '**Any entity** passing through the wall or having their Turn Start within it takes [[2d6 + 2*stat]] {damage} damage.',
    sub_name: null,
    sub_body: null,
  },

  /* ------------------------------------------------------- the stand-ins ----
   * **Both are gone, and this is where they were.** Light and Shadow were schools
   * the lineage tab named and no sheet had filled, so a Celestial's INNATE LIGHT
   * and an Infernal's INNATE SHADOW each promised a Novice spell that could not be
   * looked up. UNWRITTEN LIGHT and UNWRITTEN SHADOW held those two slots and said
   * on their own faces that they were standing in.
   *
   * The Ethereal school retired both on 2026-08-25, Light in the morning and
   * Shadow in the afternoon, and neither needed anything but the real spells: the
   * Innate cards read their options off the Novice shelf of the school they name,
   * so each picked up its four the moment they existed. Flag 4 in lineages.js went
   * with them, and every lineage card can be settled now.
   *
   * The machinery they used is still here and is worth knowing about, because the
   * next school the lineage tab names before a sheet arrives will want it: a
   * stand-in carries `placeholder`, which is what keeps it off the enchanting and
   * forging shelves and what `loadoutOptions` refuses by name. That gate fires on
   * nothing today. See the note beside it in loadouts.js.
   */
]);
