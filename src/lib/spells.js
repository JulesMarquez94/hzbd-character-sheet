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
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[1d6 + 2*stat]] in {damage} damage.',
    sub_name: 'Multicast',
    sub_body:
      'When casting Bramble Whip, you may spend an additional 1 Action Point and 1 Willpower any number of times.\n\n' +
      'For each time you do, target **an additional eligible entity** with Bramble Whip.',
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
      'You cover the skin of **a creature** you can touch with bark.\n\n' +
      'The target gains [[2d6 + 2*stat]] in Shield and +1 Defense.\n\n' +
      'This effect is lost when all Shield is depleted.',
    sub_name: 'Overcast',
    sub_body:
      'When casting Barkskin, you may spend an additional 1 Action Point and 1 Willpower any number of times.\n\n' +
      'For each time you do, the target entity gains an additional [[1d6 + stat]] in Shield.',
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
      'You launch a burrowing spore pod at **an entity** you can see within **12 meters (40 feet)**.\n\n' +
      'Make a {stat} Ranged Attack {roll} against the target. On a hit, the spore embeds itself in the target.\n\n' +
      'At your Turn End, the embedded spore deals [[2d6 + 2*stat]] in {damage} damage to the target, and you regain Health equal to half the damage dealt.',
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, you must pay 2 Willpower to maintain the spore on the target.\n\n' +
      'If you do not pay the Upkeep, the spell effect ends.',
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
      'You create a field of greenery in a **30-meter (100-foot)** radius centered on yourself for **1 hour**.\n\n' +
      'Entities taking a Short Rest inside gain [[2d6 + 2*stat]] in Shield and 1 Karma.\n\n' +
      'Standing in the field elevates your Flora spells by 1.',
    sub_name: 'Overcast',
    sub_body:
      'When casting Verdant Field, you may spend an additional 3 Action Points and 4 Willpower.\n\n' +
      'If you do, the field lasts for **24 hours**, or becomes permanent in natural terrain, and entities taking a Long Rest inside also receive the Short Rest benefits and reduce their Supplies cost by 1.',
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
      '**Any entity** attempting to pass through the wall or having their Turn Start in it takes [[3d6 + 3*stat]] in {damage} damage, and you make a {stat} Roll {roll} against that entity’s Grit.\n\n' +
      'On a success, the entity becomes rooted **until the end of its turn**.',
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
      'You touch a common object, instantly breaking it down into decaying organic matter and destroying it.\n\n' +
      'The object cannot exceed 200 kg (440 lbs) in weight or a **2-meter (6-foot)** cube in size, and cannot be metallic.\n\n' +
      'If the object is being worn or held by **an entity**, you must make a successful {stat} Melee Attack {roll} against the target to destroy it.',
    sub_name: 'Overcast',
    sub_body:
      'When casting Naturalize, you may spend an additional 3 Action Points and 6 Willpower.\n\n' +
      'If you do, you can target uncommon objects.',
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
      'You embody the freedom of the wild **until your next Long Rest**.\n\n' +
      'The Action Point cost of your {{Move}} action can no longer exceed 1 Action Point, and your Movement Speed cannot be reduced by any effect.\n\n' +
      'Additionally, your jump distance and jump height are doubled.',
    sub_name: 'Multicast',
    sub_body:
      'When casting Wild Strider, you may spend an additional 1 Action Point and 1 Willpower any number of times.\n\n' +
      'For each time you do, target **an additional entity** you can see within **6 meters (20 feet)** with Wild Strider.',
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
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[2d6 + 2*stat]] in {damage} damage, and the target is poisoned.',
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
      'While Sharpen Senses is active, when you fail a skill check that relies on one of your five senses, you may spend 2 Willpower to reroll the check.\n\n' +
      'You can only use this effect once per skill check.',
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
      'You manifest the spirit of a large flying creature that swoops down on **an entity** you can see within **12 meters (40 feet)**.\n\n' +
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[2d6 + 2*stat]] in {damage} damage, and the target is carried **12 meters (40 feet)** in any direction of your choice.',
    sub_name: 'Overcast',
    sub_body:
      'When Wild Sweep hits, you may spend an additional 1 Action Point and 1 Willpower any number of times.\n\n' +
      'For each time you do, the target is carried an additional **3 meters (10 feet)**.',
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
      'Make a {stat} Attack Roll {roll} against **all entities** in the area. On a hit, you deal [[4d6 + 4*stat]] in {damage} damage.',
    sub_name: 'Overcast',
    sub_body:
      'When casting Savage Slam, you may spend an additional 2 Action Points and 2 Willpower.\n\n' +
      'If you do, the spell affects a **6-meter (20-foot)** radius centered on you instead of a cone.',
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
      'Attack rolls against a Wild Pack member have disadvantage while that member is adjacent to at least one other Wild Pack member.\n\n' +
      'Wild Pack members gain advantage on attack rolls against **an entity** if at least 2 Wild Pack members are adjacent to that same entity.\n\n' +
      'If a Wild Pack member falls unconscious or dies, every remaining member’s next attack is a guaranteed critical hit. Friendly fire and self-harm cannot trigger this effect.',
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
      'Make a {stat} Roll {roll} against the target’s Grit. On a success, the target becomes poisoned.\n\n' +
      'Outside of combat, the target is unaware of the spell’s source and believes they became suddenly sick.',
    sub_name: 'Multicast',
    sub_body:
      'When casting Force Inebriation, you may spend an additional 1 Action Point and 1 Willpower any number of times.\n\n' +
      'For each time you do, target **an additional eligible entity** within range.',
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
      'You open your awareness to the pulse and life force of surrounding living organisms.\n\n' +
      'For **10 turns (1 minute)**, you sense the exact location and health state of **all living entities** within **18 meters (60 feet)**, even through total cover or darkness.',
    sub_name: 'Overcast',
    sub_body:
      'While Sense Life is active, you may spend 3 Action Points and 3 Willpower to mark **an entity** within range.\n\n' +
      'You continue to sense the marked entity’s location and health state **until your next Long Rest**, even if the target leaves your range.',
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
      'You mend the flesh of **an entity** you touch, restoring [[1d6 + stat]] in Health immediately and again at the Turn Start of the target’s next **2 turns**.',
    sub_name: 'Overcast',
    sub_body:
      'When casting Renew, you may spend an additional 2 Action Points and 2 Willpower.\n\n' +
      'If you do, you instantly restore [[2d6 + 2*stat]] in Health to **all entities** currently affected by your Renew, regardless of range or line of sight.',
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
      'When casting Giant Growth, you may spend 3 Willpower for **each additional entity** you can touch.',
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
      'When casting Bleeding Trail, you may sacrifice Health equal to your {physique} [[physique]].\n\n' +
      'If you do so, you receive a clear mental image of the entity the blood originated from.',
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
      'Make a {stat} Ranged Attack {roll} against the target. On a hit, you deal [[3d6 + 3*stat]] in {damage} damage.',
    sub_name: 'Blood Tithe',
    sub_body:
      'When casting Blood Spear, you may sacrifice Health equal to your {physique} [[physique]].\n\n' +
      'If you do so, the attack is made with advantage and the damage is Empowered by 1.',
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
      'When casting this spell, you may sacrifice a further Health equal to [[2*physique]].\n\n' +
      'If you do so, you gain additional Shield equal to the Health sacrificed.',
  },
  {
    id: 'vampiric-touch',
    name: 'Vampiric Touch',
    summary: 'Drain a creature you touch for Necrotic damage and take back half as Health.',
    kind: 'spell',
    tags: ['Novice Spell', 'Primal', 'Blood'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    damage: ['Necrotic'],
    body:
      'You attempt to drain the life force of **an entity** you can touch.\n\n' +
      'Make a {stat} Melee Attack {roll} against the target. On a hit, you deal [[3d6 + 3*stat]] in {damage} damage and regain Health equal to half the damage dealt.',
    sub_name: 'Blood Tithe',
    /* "this spell" rather than "Vampiric Touch", for the same reason Gore
       Armor says it: touch is a defined range and a keyword is lit wherever it
       appears, so printing the name would colour half of it as a range and
       offer "close enough to put a hand on" as the explanation of a word being
       used as a name. */
    sub_body:
      'When casting this spell, you may sacrifice Health equal to your {physique} [[physique]].\n\n' +
      'If you do so, the attack is made with advantage and the damage is Empowered by 1.',
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
      'You can spend 2 Action Points and 4 Willpower to hurl the flame at **a target** you can see within **15 meters (50 feet)**.\n\n' +
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[3d6 + 3*stat]] in {damage} damage.',
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
      'Entities having their Turn Start within **1.5 meters (5 feet)** of you take [[stat]] in {damage} damage.',
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
      'At your Turn Start, you must pay 1 Willpower to keep the weapon kindled.\n\n' +
      'If you do not pay the Upkeep, the spell effect ends.',
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
      'You embed a seed of pure elemental fire in **an entity** you can see within **9 meters (30 feet)**. The target is unaware of the seed being placed if it does not see you cast the spell.\n\n' +
      'This effect lasts **until the target takes a Long Rest**, and for as long as it lasts you know the seed’s relative direction.',
    sub_name: 'Overcast',
    sub_body:
      'If you have any active Fire Seed, you may pay 3 Action Points and 4 Willpower to detonate it.\n\n' +
      'All seeds explode, dealing [[3d6 + 3*stat]] in {damage} damage to the target and **any entities** within **4.5 meters (15 feet)** of it.',
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
      'You ignite your hands, gaining the ability to melt metal and stone with your touch for **5 turns**.\n\n' +
      'For the duration of the spell, you can melt up to **1.5 square meters (5 square feet)** of metal on a surface up to **15 cm (6 inches)** thick.',
    sub_name: 'Overcast',
    sub_body:
      'You can spend 2 Action Points and 3 Willpower to transfer the heat into a metallic object.\n\n' +
      'For the remainder of the spell duration, entities in contact with the object at their Turn Start take [[2d6 + 2*stat]] in {damage} damage.',
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
      '**Any entity** passing through the wall or having their Turn Start within it takes [[4d6 + 4*stat]] in {damage} damage.',
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
      'Doing so increases the damage or healing by [[2*stat]] in {damage} damage when applicable.',
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
      'The target takes [[2d6 + 2*stat]] in {damage} damage and then regains [[5d6 + 5*stat]] in Health. This removes any Bleed or Poison effect on the target.',
    sub_name: 'Multicast',
    sub_body:
      'When casting Cauterize, you may spend an additional 1 Action Point and 3 Willpower any number of times.\n\n' +
      'For each time you do, target **an additional eligible entity** with Cauterize.',
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
      'You call down a devastating rain of fire in a **12-meter (40-foot)** radius centered on a point you can see within **30 meters (100 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against the Reflex of **all entities** in the area. On a success, you deal [[4d6 + 4*stat]] in {damage} damage, or half as much on a failure.\n\n' +
      'Another wave falls down at each of your Turn Starts for as long as you pay the Upkeep.',
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, you must pay 3 Willpower to keep the rain falling.\n\n' +
      'If you do not pay the Upkeep, the spell effect ends.',
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
      'You gain control over water for the next **1 hour**. You can manipulate water within **3 meters (10 feet)** in the following ways:\n\n' +
      'Create Currents: You create currents within **3 meters (10 feet)** that move objects and entities at a speed of your choice, up to **18 meters (60 feet)** per turn.\n\n' +
      'Water Tension: You manipulate the tension of the water, allowing targets of your choice within **3 meters (10 feet)** to walk on water.\n\n' +
      'Part Water: You can part a body of water, creating a sphere around you as large as **3 meters (10 feet)**, allowing you to walk underwater.',
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
      'You condense the moisture in the air to create a small volume of water.\n\n' +
      'You create up to 2 liters (0.5 gallons) of water in an open container or on a surface you can see within **9 meters (30 feet)**.',
    sub_name: 'Overcast',
    sub_body:
      'If there is at least 1 liter (0.25 gallons) of water within **9 meters (30 feet)**, you may spend 3 Action Points and 1 Willpower.\n\n' +
      'You hurl the water as a high-pressure beam at **an entity** within **9 meters (30 feet)**.\n\n' +
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[2d6 + 2*stat]] in {damage} damage.',
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
      'You gain [[2d6 + 2*stat]] in Shield.\n\n' +
      'When an attack causes you to lose Shield, an ice spike immediately fires at the attacker if they are within **9 meters (30 feet)** and you can see them. The target takes [[1d6 + stat]] in {damage} damage.',
    sub_name: null,
    sub_body: null,
  },
  {
    id: 'drain-fluids',
    name: 'Drain Fluids',
    summary: 'Siphon a body’s fluids for Necrotic damage every turn you keep paying.',
    kind: 'spell',
    tags: ['Adept Spell', 'Elemental', 'Water'],
    ap: 4,
    wp: 2,
    stat: 'mind',
    damage: ['Necrotic'],
    /* The card rolled "against the target's Physique". Physique is not a roll
       target — holding your insides where they belong is Grit, the same save
       FORCE INEBRIATION already asks for. */
    body:
      'You reach out with your magical influence to siphon the internal liquids from **a target entity** you can see within **9 meters (30 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against the target’s Grit.\n\n' +
      'On a success, the target takes [[2d6 + 2*stat]] in {damage} damage, and then again at each of your Turn Starts.',
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, you must pay 2 Willpower to keep siphoning. If you do not pay the Upkeep, the spell effect ends.\n\n' +
      'The spell effect also ends if you cannot see the target at your Turn Start.',
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
      'If they encounter an obstacle before they are moved the full distance, they take [[3d6 + 3*stat]] in {damage} damage.',
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
      'Every 2 Willpower you spend, you form an Ice Spike that orbits your body, up to a maximum equal to half your {mind}.',
    sub_name: 'Overcast',
    sub_body:
      'You may spend 3 Action Points to hurl all active Ice Spikes at **a single target** you can see within **18 meters (60 feet)**.\n\n' +
      'Make a {mind} Ranged Attack {roll} against the target. On a hit, you deal [[1d6 + mind]] in {damage} damage for each Ice Spike consumed.',
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
      'You condense water and freeze it around **a target entity** you can see within **18 meters (60 feet)**.\n\n' +
      'Make a {stat} Roll {roll} against the target’s Reflex. On a success, the entity is encased in ice, becoming stunned and immune to all non-{damage:Psychic} damage.',
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, you must pay 4 Willpower to keep the ice frozen.\n\n' +
      'If you do not pay the Upkeep, the spell effect ends.',
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
      'You manifest a swirling vortex of water at a point you can see within **9 meters (30 feet)** that lasts for **10 turns (1 minute)**.\n\n' +
      'The vortex has a **15-meter (50-foot)** radius and the area is considered Difficult Terrain.\n\n' +
      'At **each entity**’s Turn Start within the area, make a {stat} Roll {roll} against its Grit. On a success, the entity is pulled **9 meters (30 feet)** toward the center of the vortex.\n\n' +
      'You make the roll with 1 Disadvantage against entities with a height of **3 meters (10 feet)** or more, and 1 more for every **1.5 meters (5 feet)** of height over it.',
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
      'If you would collide with an obstacle before reaching your destination, you stop and take [[6d6]] in {damage} damage.',
    sub_name: 'Overcast',
    sub_body:
      'When casting Fling, you may spend an additional 1 Action Point and 1 Willpower any number of times.\n\n' +
      'For each time you do, target **an additional entity** within touch to move the same distance in the same direction.',
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
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[2d6 + stat]] in {damage} damage.',
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
      'If the entity collides with **another entity**, both take [[2d6 + 2*stat]] in {damage} damage and the movement stops.',
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
      'If the space is occupied by **an entity**, make a {stat} Roll {roll} against its Reflex. On a success, you deal [[2d6 + 2*stat]] in {damage} damage, or half as much on a failure.\n\n' +
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
      '**All entities** in a line between your start and end point take [[1d6 + stat]] in {damage} damage.',
    sub_name: 'Overcast',
    /* The one second half in the codex whose opening clause does not say when it
       happens and cannot mean "later". Voltaic Jolt is instantaneous — you are
       energy and then you are somewhere else — so entities carried "along with
       you" are carried during that one cast and nowhere else. Every other
       "You can spend..." half sits on a spell that is still standing when it is
       paid for. See sub_when in overcast.js. */
    sub_when: 'cast',
    sub_body:
      'You can spend 1 Action Point and 2 Willpower to teleport any number of entities you can touch along with you.\n\n' +
      'They move the same distance parallel to you.',
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
      'You touch **an entity**, infusing them with volatile electrical energy that reacts to impacts.\n\n' +
      '**A target entity** you can touch becomes Galvanized.\n\n' +
      'Whenever a Galvanized entity is hit, a spark erupts which deals an additional [[stat]] in {damage} damage to them.',
    sub_name: 'Multicast',
    sub_body:
      'When casting Galvanize, you may spend an additional 1 Action Point and 4 Willpower any number of times.\n\n' +
      'For each time you do, target **an additional eligible entity** with Galvanize.',
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
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[1d6 + stat]] in {damage} damage and the target is afflicted with Burn.',
    sub_name: 'Multicast',
    sub_body:
      'When casting Slag Shot, you may spend an additional 1 Action Point and 1 Willpower any number of times.\n\n' +
      'For each time you do, cast Slag Shot an additional time.',
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
      'The entity is bound by 3 Chains. It can spend 2 Action Points to attempt to break a Chain by making a {physique} roll against your {stat}. On a success, it breaks 1 Chain. On a critical success, it breaks 2 Chains.\n\n' +
      'While 3 Chains remain, the target is stunned and can only attempt to break Chains. While 2 or fewer Chains remain, the target is rooted.\n\n' +
      'At its Turn Start, the entity takes [[stat]] in {damage} damage.',
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
      'You call forth molten rock to flood at a point you can see within **18 meters (60 feet)**, creating a **9-meter (30-foot)** radius pool of magma that is considered Difficult Terrain.\n\n' +
      '**Any entity** entering the area or having their Turn Start within it takes [[3d6 + 3*stat]] in {damage} damage.',
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, you must pay 2 Willpower to keep the magma molten. If you do not pay the Upkeep, the spell effect ends.\n\n' +
      'When the spell ends, the magma solidifies into stone, and **all creatures** currently in the area become rooted **until their next Turn End**.', // text-style-ok: joins two clauses
  },

  /* ----------------------------------------------------- Elemental · Earth ----
   * One card so far, loose in the school folder with no family folder of its
   * own. The family exists the moment a second card does.
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
      'The target gains [[3d6 + 3*stat]] in Shield.',
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
      'When casting Bolster, you may spend an additional 1 Action Point and 3 Willpower any number of times.\n\n' +
      'For each time you do, target **an additional eligible entity** with Bolster.',
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
      'While Light is active, you may spend 2 Action Points and 2 Willpower.\n\n' +
      'If you do, the orb explodes. Make a {stat} Roll {roll} against the Grit of **all entities** within **6 meters (20 feet)**. On a success, they are blinded **until their next Turn End**.',
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
      'You conjure an ethereal weapon of pure light in a shape of your choice at a point you can see within **15 meters (50 feet)** that lasts for **3 turns**. It cannot be damaged or destroyed.\n\n' +
      'When summoned and at your Turn Start, it teleports to a point within **15 meters (50 feet)** and you make a {stat} Melee Attack {roll} against **an adjacent entity**. On a hit, it deals [[2d6 + 2*stat]] in {damage} damage.',
    sub_name: 'Overcast',
    sub_body:
      'While Lightforged Weapon is active, you may spend 4 Action Points.\n\n' +
      'If you do, the Lightforged Weapon makes an additional {stat} Melee Attack {roll} against **an eligible target**.',
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
      'While you still have Lightmade Weapons active, you may spend 2 Action Points.\n\n' +
      'If you do, you launch a Lightmade Weapon at **an entity** you can see within **9 meters (30 feet)**. Make a {stat} Ranged Attack {roll}. On a hit, you deal [[2d6 + 2*stat]] in {damage} damage.',
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
      'When casting Wings of Radiance, you may spend an additional 1 Action Point and 3 Willpower any number of times.\n\n' +
      'For each time you do, target **an additional eligible entity** with Wings of Radiance.',
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
      'You manifest a Sigil of Truth, targeting any number of entities you can see.\n\n' +
      'Make a {stat} Roll {roll} against the Grit of **every entity** targeted. On a success, they are bound to the sigil.\n\n' +
      'If a bound entity utters a lie, the sigil shatters and brands them with its mark for **1 hour**.',
    /* Opens "While a branding lasts" rather than the sheet's "When casting", so
       the parse charges it as its own spend. See "the halves" above. */
    sub_name: 'Overcast',
    sub_body:
      'While a branding lasts, you may spend 2 Action Points and 2 Willpower any number of times.\n\n' +
      'For each time you do, consume one branding to compel that entity to truthfully answer a single yes-or-no question.',
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
      'The construct has Health equal to [[10*stat]] and Defense equal to [[2*stat]]. It lasts until it is destroyed, you take a long rest or you fall unconscious.',
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
      'On a success, a bolt of sacred lightning strikes them, dealing [[2d6 + 2*stat]] in {damage} damage.',
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
      'You manifest a Guardian Angel at a point you can see within **6 meters (20 feet)** that lasts for **10 turns**, taking the form of a medium-sized entity of your choice.\n\n' +
      'The Guardian Angel cannot be damaged directly and has Health equal to [[20*stat]].\n\n' +
      'Whenever **an ally** within line of sight of the Guardian Angel takes damage, that damage is negated and the Guardian Angel loses Health equal to the damage prevented.\n\n' +
      'While the Guardian Angel persists, allies within line of sight gain the benefits of {{Bolster}}.',
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
      'You bend light around **an entity** you can see within **6 meters (20 feet)** for **1 hour**.\n\n' +
      'While the spell lasts, the entity is almost completely invisible. It gains 2 advantage when trying to hide or when taking a stealth-related action.\n\n' +
      'Whenever the entity takes an action that is not a movement one, it must make an {instinct} Roll against the Grit of that action’s target. On a failure, the spell ends and they become visible.',
    /* Labelled OVERCAST on the sheet and read as the Multicast its own words
       are. See "the halves" above. */
    sub_name: 'Multicast',
    sub_body:
      'When casting Bend Light, you may spend an additional 1 Action Point and 3 Willpower any number of times.\n\n' +
      'For each time you do, target **an additional eligible entity** with Bend Light.',
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
      'When casting Scourge, you may spend an additional 1 Action Point and 3 Willpower any number of times.\n\n' +
      'For each time you do, target **an additional eligible entity** with Scourge.',
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
      'Make a {stat} Roll {roll} against its Grit. On a success, it does not perceive the presence of you and your allies as odd or unusual, allowing you passage in places you would otherwise not be allowed.\n\n' +
      'When the spell ends, or if the roll fails, the target becomes aware that you altered its mind.',
    sub_name: 'Multicast',
    sub_body:
      'When casting Cloud Mind, you may spend an additional 1 Action Point and 1 Willpower any number of times.\n\n' +
      'For each time you do, target **an additional eligible entity** with Cloud Mind.',
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
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[2d6 + 2*stat]] in {damage} damage.\n\n' +
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
      'When casting Dark Bargain, you may spend an additional 2 Willpower.\n\n' +
      'If you do and the target accepts, it sacrifices an additional Health equal to 3 times its level and also gains Empowered and Elevated on its next action.',
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
      'Whenever a hexed target fails a roll, it takes [[1d6 + stat]] in {damage} damage.',
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
      'You create a small doll linked to **an entity** you can see within **9 meters (30 feet)**, or to **an entity** from whom you possess a physical sample such as hair, blood or skin.\n\n' +
      'The effigy perfectly mirrors the physical condition and Health of the target, letting you track its current well-being and active statuses.\n\n' +
      'The effigy lasts until it is destroyed or the target dies.',
    /* Opens on the doll rather than on the cast, because there is nothing to scry
       through until one exists. See "the halves" above. */
    sub_name: 'Overcast',
    sub_body:
      'While the effigy lasts, you may spend 2 Action Points and 2 Willpower.\n\n' +
      'If you do, you scry through the effigy for a brief, soundless 10-second vision of the target’s location.',
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
      'At your Turn Start, you must pay 2 Willpower to keep the chains bound. If you do not pay the Upkeep, the spell effect ends.\n\n' +
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
      'At its Turn Start, it must fulfill your command. If the target refuses to obey before its **next Turn End**, it takes [[8d6 + 8*stat]] in {damage} damage.\n\n' +
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
      'Make a {stat} Roll {roll} against its Grit. On a success, paranoia grips the target for as long as the spell lasts: it cannot rest, it cannot regain Health and it has disadvantage on skill checks.',
    sub_name: 'Overcast',
    sub_body:
      'While Haunting Shadows is active, you may spend 4 Action Points and 12 Willpower.\n\n' +
      'If you do, you and **up to 5 entities** you can touch are teleported to the haunted target and emerge from its shadow, ending Haunting Shadows.',
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
      'You turn yourself into an umbral form, made of shadow **until your next Turn Start**.\n\n' +
      'While made of shadow you have resistance to all damage.\n\n' +
      'You can also slip through any crack or gap that air can travel through, letting you pass between bars and under doors, as long as the passage does not exceed 6 seconds.',
    /* "may" rather than the house "must", because this form ends on its own. See
       "the halves" above. */
    sub_name: 'Upkeep',
    sub_body:
      'At your Turn Start, you may pay 3 Willpower to hold the umbral form **until your next Turn Start**.\n\n' +
      'If you do not pay the Upkeep, the spell effect ends.',
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
      'When casting Slow, you may spend an additional 1 Action Point and 1 Willpower any number of times.\n\n' +
      'For each time you do, target **an additional eligible entity** with Slow.',
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
      'When you fail an Attribute Roll covered by Foresight, you may spend 6 Willpower.\n\n' +
      'If you do, the action is undone and is as if it never happened. This does not refund the cost of the action it applies to.',
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
      'At its Turn Start, it takes [[1d6 + stat]] in {damage} damage.',
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
      'You restore [[3d6 + 3*stat]] in Health to the entity.',
    sub_name: 'Multicast',
    sub_body:
      'When casting Reverse, you may spend an additional 1 Action Point and 3 Willpower any number of times.\n\n' +
      'For each time you do, target **an additional eligible entity** with Reverse.',
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
      'You delay time for **an entity** you can see within **9 meters (30 feet)** until its **next Turn End**.\n\n' +
      'Until Delay ends, all spells, attacks and abilities aimed at the target are delayed.\n\n' +
      'Everything held this way is executed all at once at the target’s **next Turn End**.',
    /* Opens on the ending rather than on the cast, so the parse charges it as its
       own spend. See "the halves" above. */
    sub_name: 'Overcast',
    sub_body:
      'When Delay ends, you may spend 3 Willpower.\n\n' +
      'If you do, every delayed action is Elevated by 1.',
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
      'Entities that have their Turn Start inside the area gain 2 additional Action Points.\n\n' +
      'Leaving the area costs the entity 3 Action Points, or 3 Reaction Points if it has no Action Points left.',
    /* "within range" is read as the row's own 6 meters. See "the readings" above. */
    sub_name: 'Overcast',
    sub_body:
      'While Chrono Anomaly is active, you may spend 2 Action Points.\n\n' +
      'If you do, reposition the Chrono Anomaly around any point within **6 meters (20 feet)**.',
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
      'You instantly propel yourself 6 seconds forward into the stream of time, immediately ending your turn and disappearing from existence.\n\n' +
      '**Until your next Turn Start**, you are completely untargetable and cannot be interacted with, damaged or affected by any entity, spell or environmental effect.\n\n' +
      'At your next Turn Start, you reappear in the exact space you previously occupied. If that space is taken, you reappear in the nearest unoccupied one.\n\n' +
      'Casting Time Skip more than once before completing a Long Rest gives you 1 level of Exhaustion for each additional cast.',
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
      'While Dimensional Pocket is active, you may spend 1 Action Point and 1 Willpower.\n\n' +
      'If you do, you may retrieve an item or stow away an additional item.',
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
      'When casting Compression Blast, you may spend an additional 1 Action Point and 2 Willpower.\n\n' +
      'If you do, the area of Compression Blast increases to **6 meters (20 feet)** around a point you can see.',
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
      'Until your **next Turn End**, the two points in space are connected, allowing **any entity** to walk through with **1.5 meters (5 feet)** of movement to instantly emerge on the other side.',
    /* Opens on the spell already being up rather than on the cast, so the parse
       charges it as its own spend. See "the halves" above. */
    sub_name: 'Overcast',
    sub_body:
      'While Spatial Fold is active, you may spend 2 Action Points.\n\n' +
      'If you do, you close the Spatial Fold early.',
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
      'Make a {stat} Roll {roll} against the Reflex of **all entities** in the line. On a success, you deal [[4d6 + 4*stat]] in {damage} damage.',
    /* The sheet calls this card Arcane Ray in its Overcast, and bends "the ray".
       Same paste and same call as Spatial Fold's. See "the readings" above. */
    sub_name: 'Overcast',
    sub_body:
      'When casting Energy Beam, you may spend 1 Action Point and 2 Willpower to bend the beam at any point along its line, projecting an additional **9-meter (30-foot)** line in any direction from that point.',
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
      'You enclose **a target entity** you can see within **6 meters (20 feet)** inside a sphere of dense arcane energy.\n\n' +
      'While trapped inside the sphere, the entity is Constrained.\n\n' +
      'The trapped entity can spend 3 Action Points to attempt to break free by making a {stat} roll against your {stat}. On a success, the sphere shatters and the effect ends.',
    sub_name: 'Overcast',
    sub_body:
      'When **a trapped entity** attempts to break out of the sphere, you may spend 3 Willpower. If you do, that entity makes their breakout roll with Disadvantage.',
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
      'While Transposition Beacon is active, you may spend 2 Action Points.\n\n' +
      'If you do, you instantly teleport to the location of your beacon, removing it.',
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
      'You attempt to trap **an entity** you can see within **9 meters (30 feet)** in an extradimensional space for **2 turns**.\n\n' +
      'Make a {stat} Roll {roll} against their Reflex. On a success, you banish the target to an isolated spatial pocket, removing them completely from the battlefield. They can still take their turn.',
    sub_name: 'Multicast',
    sub_body:
      'When casting Banishment Vault, you may spend an additional 1 Action Point and 6 Willpower any number of times.\n\n' +
      'For each time you do, target **an additional eligible entity** with Banishment Vault. They are banished into the same spatial pocket.',
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
      'On a success, you pull them **12 meters (40 feet)** toward the singularity and they take [[2d6 + 2*stat]] in {damage} damage.',
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
      'Every 4 Willpower you spend, you form an Ice Spike that orbits your body, up to a maximum equal to half your {mind}.',
    sub_name: 'Overcast',
    sub_body:
      'You may spend 3 Action Points to hurl all active Ice Spikes at **a single target** you can see within **18 meters (60 feet)**.\n\n' +
      'Make a {mind} Ranged Attack {roll} against the target. On a hit, you deal [[1d6 + mind]] in {damage} damage for each Ice Spike consumed.',
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
      '**Any entity** passing through the wall or having their Turn Start within it takes [[2d6 + 2*stat]] in {damage} damage.',
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
