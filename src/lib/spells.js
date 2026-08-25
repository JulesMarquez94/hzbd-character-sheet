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
 *   family  Flora · Wild · Life · Blood · Energy · Water · Light
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

  /* ---------------------------------------------------- Arcane · Energy ---- */
  {
    id: 'containment-sphere',
    name: 'Containment Sphere',
    summary: 'Seal one target in arcane energy, stunned until it breaks out.',
    kind: 'spell',
    tags: ['Adept Spell', 'Arcane', 'Energy'],
    ap: 4,
    wp: 4,
    stat: 'mind',
    body:
      'You enclose **a target entity** you can see within **6 meters (20 feet)** inside a sphere of dense arcane energy.\n\n' +
      'While trapped inside the sphere, the entity is stunned.\n\n' +
      'The trapped entity can spend 3 Action Points to attempt to break free by making a {stat} roll against your {stat}. On a success, the sphere shatters and the effect ends.',
    sub_name: 'Overcast',
    sub_body:
      'When **a trapped entity** attempts to break out of the sphere, you may spend 2 Willpower. If you do, that entity makes their breakout roll with Disadvantage.',
  },

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

  /* ----------------------------------------------------- the last stand-in ----
   * Shadow is a school the lineage tab names and no sheet has yet filled. An
   * Infernal's INNATE SHADOW promises a Novice spell of it, and until the school
   * is written there is nothing for the promise to point at: this is the last
   * lineage card whose question the codex cannot answer. See flag 4 in
   * lineages.js.
   *
   * So the school gets one card that stands in and says on its face that it is
   * standing in. It carries `placeholder`, which is what keeps it out of the
   * enchanting and forging shelves: a stand-in exists to fill the one slot that
   * would otherwise be empty, not to be laid on somebody's sword.
   *
   * **There were two.** UNWRITTEN LIGHT sat here until 2026-08-25, when the
   * Ethereal school arrived with four Novice Light spells and made it a card
   * standing in for something written. It was deleted rather than kept, which is
   * what the note over it always said to do: the Innate cards read their options
   * off the Novice shelf of the school they name, so INNATE LIGHT picked up the
   * real four with nothing else to change. Shadow's day works the same way.
   */
  {
    id: 'unwritten-shadow',
    name: 'Unwritten Shadow',
    summary: 'A stand-in. No Shadow spell has been written yet.',
    kind: 'spell',
    tags: ['Novice Spell', 'Shadow'],
    ap: null,
    wp: null,
    stat: 'mind',
    placeholder: true,
    body:
      'Your blood knows a Novice Shadow Spell, and the Shadow school is not in this codex yet.\n\n' +
      'This card holds the slot until it is. Agree with your table on what the spell does, or leave it empty and take it up when the school arrives.',
    sub_name: null,
    sub_body: null,
  },
]);
