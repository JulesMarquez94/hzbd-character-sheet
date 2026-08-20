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
 *   tier    Novice Spell · Adept Spell · Master Spell · Unique Spell
 *   school  Primal · Nature · Arcane · Elemental
 *   family  Flora · Wild · Life · Blood · Energy · Water
 *
 * ------------------------------------------------------------------ modular
 * Nothing here names an attribute it does not have to. Every spell is written
 * off `{stat}` and its numbers off `*stat`, and `stat: 'mind'` below is only
 * the default a caster with no other claim rolls with. A Mycomancer's loadout
 * carries `cast: 'instinct'` (see castModifier in loadouts.js), so the same
 * card printed in their hand reads Instinct and prints Instinct's numbers.
 * Write `{mind}` on a spell only if it must be Mind for every caster alive.
 *
 * ---------------------------------------------------------------- the unique
 * **A Unique Spell is not a rank.** It is a spell that exists on one item and
 * nowhere else, so no talent set can ever prepare it and no rank opens it: it
 * arrives through a Unique Imbuement on the thing that carries it (see
 * enchantments.js) and leaves again when the item does.
 *
 * Two gates already keep it out of every pool without a line being added to
 * either. `loadoutOptions` refuses a card whose school is not the set's, and
 * Elemental is nobody's school; `spellsAt` in EnchantWindow.jsx matches the
 * tier word, and Novice, Adept and Master do not match Unique. So the only way
 * to hold one is to hold the item.
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
      'You summon forth a vine from the ground to whip an entity you can see within 9 meters (30 feet).\n\n' +
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[1d6 + 2*stat]] in {damage} damage.',
    sub_name: 'Multicast',
    sub_body:
      'When casting Bramble Whip, you may spend an additional 1 Action Point and 1 Willpower any number of times.\n\n' +
      'For each time you do, target an additional eligible entity with Bramble Whip.',
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
      'You cover the skin of a creature you can touch with bark.\n\n' +
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
      'Roots burst from the ground, covering a 6-meter (20-foot) area centered on a point you can see within 15 meters (50 feet).\n\n' +
      'Make a {stat} Roll {roll} against the Reflex of all entities in the area. On a success, they are rooted for 10 turns (1 minute).\n\n' +
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
      'You manifest a 6-meter (20-foot) cloud of invisible, odorless spores centered on a point you can see within 9 meters (30 feet).\n\n' +
      'Make a {stat} Roll {roll} against the Grit of all entities in the area. Entities that are currently in combat or can see you gain advantage on the roll.\n\n' +
      'On a success, the entity falls asleep for 1 hour. This effect ends early if the target takes damage or an entity uses an action to shake them awake.',
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
      'You launch a burrowing spore pod at an entity you can see within 12 meters (40 feet).\n\n' +
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
      'You create a field of greenery in a 30-meter (100-foot) radius centered on yourself for 1 hour.\n\n' +
      'Entities taking a Short Rest inside gain [[2d6 + 2*stat]] in Shield and 1 Karma.\n\n' +
      'Standing in the field elevates your Flora spells by 1.',
    sub_name: 'Overcast',
    sub_body:
      'When casting Verdant Field, you may spend an additional 3 Action Points and 4 Willpower.\n\n' +
      'If you do, the field lasts for 24 hours, or becomes permanent in natural terrain, and entities taking a Long Rest inside also receive the Short Rest benefits and reduce their Supplies cost by 1.',
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
      'You conjure a dense wall of razor-sharp briars at a location you can see within 15 meters (50 feet) for 10 turns (1 minute).\n\n' +
      'The wall can be up to 12 meters (40 feet) long, 1.5 meters (5 feet) thick and 3 meters (10 feet) tall, blocking line of sight.\n\n' +
      'Any entity attempting to pass through the wall or having their Turn Start in it takes [[3d6 + 3*stat]] in {damage} damage, and you make a {stat} Roll {roll} against that entity’s Grit.\n\n' +
      'On a success, the entity becomes rooted until the end of its turn.',
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
      'The object cannot exceed 200 kg (440 lbs) in weight or a 2-meter (6-foot) cube in size, and cannot be metallic.\n\n' +
      'If the object is being worn or held by an entity, you must make a successful {stat} Melee Attack {roll} against the target to destroy it.',
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
      'You embody the freedom of the wild until your next Long Rest.\n\n' +
      'The Action Point cost of your {{Move}} action can no longer exceed 1 Action Point, and your Movement Speed cannot be reduced by any effect.\n\n' +
      'Additionally, your jump distance and jump height are doubled.',
    sub_name: 'Multicast',
    sub_body:
      'When casting Wild Strider, you may spend an additional 1 Action Point and 1 Willpower any number of times.\n\n' +
      'For each time you do, target an additional entity you can see within 6 meters (20 feet) with Wild Strider.',
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
      'You manifest a snake spirit which hurls itself at an entity you can see within 6 meters (20 feet).\n\n' +
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
      'You channel the spirit of the wild to heighten your perception for 1 hour.\n\n' +
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
      'Make a {stat} Roll {roll} against the Grit of all hostile entities that can hear you within 36 meters (120 feet).\n\n' +
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
      'You manifest the spirit of a large flying creature that swoops down on an entity you can see within 12 meters (40 feet).\n\n' +
      'Make a {stat} Ranged Attack {roll}. On a hit, you deal [[2d6 + 2*stat]] in {damage} damage, and the target is carried 12 meters (40 feet) in any direction of your choice.',
    sub_name: 'Overcast',
    sub_body:
      'When Wild Sweep hits, you may spend an additional 1 Action Point and 1 Willpower any number of times.\n\n' +
      'For each time you do, the target is carried an additional 3 meters (10 feet).',
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
      'You manifest the spirit of a mighty beast to slam the ground in a 6-meter (20-foot) cone in front of you.\n\n' +
      'Make a {stat} Attack Roll {roll} against all entities in the area. On a hit, you deal [[4d6 + 4*stat]] in {damage} damage.',
    sub_name: 'Overcast',
    sub_body:
      'When casting Savage Slam, you may spend an additional 2 Action Points and 2 Willpower.\n\n' +
      'If you do, the spell affects a 6-meter (20-foot) radius centered on you instead of a cone.',
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
      'You form a predatory bond with up to 5 allies you can see for 10 turns (1 minute), binding you together as a Wild Pack. While this spell is active:\n\n' +
      'Attack rolls against a Wild Pack member have disadvantage while that member is adjacent to at least one other Wild Pack member.\n\n' +
      'Wild Pack members gain advantage on attack rolls against an entity if at least 2 Wild Pack members are adjacent to that same entity.\n\n' +
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
      'You manifest a small spectral flying creature and project your consciousness into it for up to 1 hour.\n\n' +
      'For the duration, you gain an aerial view of the surrounding area through the creature’s senses up to 500 meters (1,500 feet) away from your physical body.\n\n' +
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
      'You attempt to ferment the blood of an entity you can see within 15 meters (50 feet).\n\n' +
      'Make a {stat} Roll {roll} against the target’s Grit. On a success, the target becomes poisoned.\n\n' +
      'Outside of combat, the target is unaware of the spell’s source and believes they became suddenly sick.',
    sub_name: 'Multicast',
    sub_body:
      'When casting Force Inebriation, you may spend an additional 1 Action Point and 1 Willpower any number of times.\n\n' +
      'For each time you do, target an additional eligible entity within range.',
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
      'For 10 turns (1 minute), you sense the exact location and health state of all living entities within 18 meters (60 feet), even through total cover or darkness.',
    sub_name: 'Overcast',
    sub_body:
      'While Sense Life is active, you may spend 3 Action Points and 3 Willpower to mark an entity within range.\n\n' +
      'You continue to sense the marked entity’s location and health state until your next Long Rest, even if the target leaves your range.',
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
      'You mend the flesh of an entity you touch, restoring [[1d6 + stat]] in Health immediately and again at the Turn Start of the target’s next 2 turns.',
    sub_name: 'Overcast',
    sub_body:
      'When casting Renew, you may spend an additional 2 Action Points and 2 Willpower.\n\n' +
      'If you do, you instantly restore [[2d6 + 2*stat]] in Health to all entities currently affected by your Renew, regardless of range or line of sight.',
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
      'You infuse an entity you can touch with life energy, tripling its size, doubling its Movement Speed and granting it Empowered for 10 turns.',
    sub_name: 'Multicast',
    sub_body:
      'When casting Giant Growth, you may spend 3 Willpower for each additional entity you can touch.',
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
      'The trail lasts for 12 hours and, if followed, leads you directly to the entity the blood came from.',
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
      'You manifest a spear of blood and hurl it at an entity you can see within 9 meters (30 feet).\n\n' +
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
      'You attempt to drain the life force of an entity you can touch.\n\n' +
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
      'You enclose a target entity you can see within 6 meters (20 feet) inside a sphere of dense arcane energy.\n\n' +
      'While trapped inside the sphere, the entity is stunned.\n\n' +
      'The trapped entity can spend 3 Action Points to attempt to break free by making a {stat} roll against your {stat}. On a success, the sphere shatters and the effect ends.',
    sub_name: 'Overcast',
    sub_body:
      'When a trapped entity attempts to break out of the sphere, you may spend 2 Willpower. If you do, that entity makes their breakout roll with Disadvantage.',
  },

  /* --------------------------------------------------- Elemental · Water ---- */
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
       and throw them with another. Nothing can recast it — Elemental is nobody's
       school — so both halves name the one attribute the designer named. */
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
      'For the next 5 hours, you manifest a freezing aura that crystallizes your spent energy into jagged shards of ice.\n\n' +
      'Every 4 Willpower you spend, you form an Ice Spike that orbits your body, up to a maximum equal to half your {mind}.',
    sub_name: 'Overcast',
    sub_body:
      'You may spend 3 Action Points to hurl all active Ice Spikes at a single target you can see within 18 meters (60 feet).\n\n' +
      'Make a {mind} Ranged Attack {roll} against the target. On a hit, you deal [[1d6 + mind]] in {damage} damage for each Ice Spike consumed.',
  },
]);
