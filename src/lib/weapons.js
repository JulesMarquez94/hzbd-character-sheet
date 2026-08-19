/**
 * Weapons, the cards they teach, and the enchantments that can be laid on
 * them.
 *
 * A weapon is an item like any other piece of gear — it just happens to teach
 * two ability cards while it is held. The cards live here as data (never on
 * the character row): equipping a weapon lends you its cards, unequipping
 * takes them back.
 *
 * ---------------------------------------------------------------- card text
 * Card bodies are authored the way the printed cards read, with five markers:
 *
 *   **bold**              emphasis, exactly as on the printed cards
 *   {stat}                the card's own attribute, by name ("Instinct")
 *   {mind} {physique} …   a named attribute, when the card always uses that one
 *   {damage}              the card's damage type — the enchantment on the
 *                         weapon may have turned it into something else
 *   {roll}                what this character adds to that roll — "(+4)".
 *                         Every card that asks for a roll prints one, so the
 *                         reader never has to go and look the number up
 *   [[2d6 + 2*stat]]      a live value — printed as "2d8 + 8" for a character
 *                         with Instinct 4 holding an Empowering weapon, and
 *                         clickable for the breakdown
 *   {{Cold Infusion}}     a link to another card, opened on top of this one
 *
 * Nothing here hard-codes a number or a damage type a character could change:
 * both are resolved against whoever is holding the weapon and what has been
 * laid on it. One card serves every weapon that teaches it — a plain sword
 * and a Cold-Infused one read the same card, printed differently.
 *
 * ------------------------------------------------------------ what to roll
 * A card that asks for a roll against another entity has exactly two shapes:
 * an **attack** ("Make a {stat} Ranged Attack"), resolved against the target's
 * **Defense**; or a plain **roll**, contested against the target's **Reflex**
 * or **Grit**. A spell that is not swung at someone always names one of those
 * two — there is no third target number.
 */

import { UTILITY_CARDS } from './utility.js';
import { TALENT_CARDS } from './talents.js';
import { LINEAGE_CARDS } from './lineages.js';
import { BACKGROUND_CARDS } from './backgrounds.js';
import { BASIC_ACTIONS } from './actions.js';

/* ------------------------------------------------------------- enchantments */

/**
 * An enchantment is a passive card, a price tag, and — where it changes how
 * the weapon hits — a rider the ability cards read:
 *
 *   burden      Magic Burden it adds to whatever carries it
 *   cost        price in coin
 *   damageType  replaces the weapon's own damage type
 *   empower     steps every damage die up a category (d6 -> d8), capped at d12
 *   spell       true when the item names the spell it carries
 *
 * An item lists what has been laid on it in `enchants: [{ id, spell? }]`.
 */
export const ENCHANTMENTS = [
  {
    id: 'cold-infusion',
    name: 'Cold Infusion',
    kind: 'passive',
    tags: ['Enchantment', 'Infusion'],
    burden: 4,
    cost: 3000,
    damageType: 'Cold',
    empower: 1,
    effect: 'Weapon damage type becomes Cold and its damage is Empowered by 1.',
    body:
      'The weapon this enchantment is laid upon deals {damage:Cold} damage in place of its own damage type.\n\n' +
      'Its damage is **Empowered by 1**: every damage die it rolls steps up a category — a **d6** becomes a **d8** — and no die may pass a **d12**.',
  },
  {
    id: 'decay-infusion',
    name: 'Decay Infusion',
    kind: 'passive',
    tags: ['Enchantment', 'Infusion'],
    burden: 4,
    cost: 3000,
    damageType: 'Decay',
    empower: 1,
    effect: 'Weapon damage type becomes Decay and its damage is Empowered by 1.',
    body:
      'The weapon this enchantment is laid upon deals {damage:Decay} damage in place of its own damage type.\n\n' +
      'Its damage is **Empowered by 1**: every damage die it rolls steps up a category — a **d6** becomes a **d8** — and no die may pass a **d12**.',
  },
  {
    id: 'luminescence',
    name: 'Luminescence',
    kind: 'passive',
    tags: ['Enchantment', 'Utility'],
    burden: 2,
    cost: 1500,
    effect: 'Can be turned on or off to illuminate a 15 meters (50 feet) area.',
    body:
      'The item can be **turned on or off** at will.\n\n' +
      'While lit, it illuminates an area of **15 meters (50 feet)** around it.',
  },
  {
    id: 'novice-imbuement',
    name: 'Novice Imbuement',
    kind: 'passive',
    tags: ['Enchantment', 'Imbuement'],
    burden: 3,
    cost: 2250,
    spell: true,
    effect:
      'Enchant an item with a NOVICE spell, allowing the wielder to cast this spell 1 time until they take a Long Rest.',
    body:
      'A single **Novice Spell** is bound into the item.\n\n' +
      'Whoever wields it may **cast that spell once**, paying its costs as normal, whether or not they can cast spells of their own.\n\n' +
      'The casting returns after a **Long Rest**.',
  },
];

/* -------------------------------------------------------------------- spells */

/**
 * The spell codex, transcribed from the designer's sheet
 * ("Spells — Primal Spells", pulled 2026-08-19) exactly as it reads.
 *
 * A spell's banner is its three tags in order: the tier it is learned at, the
 * school it belongs to, and the family inside that school. Those three are what
 * a talent set draws on, so they are the tags and not prose.
 *
 *   tier    Novice Spell · Adept Spell · Master Spell
 *   school  Primal · Nature · Arcane
 *   family  Flora · Wild · Life · Blood · Energy
 *
 * ------------------------------------------------------------------ modular
 * Nothing here names an attribute it does not have to. Every spell is written
 * off `{stat}` and its numbers off `*stat`, and `stat: 'mind'` below is only
 * the default a caster with no other claim rolls with. A Mycomancer's loadout
 * carries `cast: 'instinct'` (see castModifier in loadouts.js), so the same
 * card printed in their hand reads Instinct and prints Instinct's numbers.
 * Write `{mind}` on a spell only if it must be Mind for every caster alive.
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
export const SPELLS = [
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
      'You summon forth a vine from the ground to whip an **entity you can see** within **9 meters (30 feet)**.\n\n' +
      'Make a **{stat} Ranged Attack** {roll}. On a hit, you deal [[1d6 + 2*stat]] in {damage} damage.',
    sub_name: 'Multicast',
    sub_body:
      'When casting **Bramble Whip**, you may spend an additional **1 Action Point** and **1 Willpower** any number of times.\n\n' +
      'For each time you do, target an additional **eligible entity** with **Bramble Whip**.',
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
      'You cover the skin of a creature you **can touch** with bark.\n\n' +
      'The target gains [[2d6 + 2*stat]] in **Shield** and **+1 Defense**.\n\n' +
      'This effect is lost when all **Shield** is depleted.',
    sub_name: 'Overcast',
    sub_body:
      'When casting **Barkskin**, you may spend an additional **1 Action Point** and **1 Willpower** any number of times.\n\n' +
      'For each time you do, the target entity gains an additional [[1d6 + stat]] in **Shield**.',
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
      'Make a **{stat} Roll** {roll} against the **Reflex** of all entities in the area. On a success, they are **rooted** for **10 turns (1 minute)**.\n\n' +
      'Entities rooted by this spell can spend **6 Action Points** to break out of the vines.',
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
      'Make a **{stat} Roll** {roll} against the **Grit** of all entities in the area. Entities that are currently in combat or can see you gain **advantage** on the roll.\n\n' +
      'On a success, the entity falls **asleep** for **1 hour**. This effect ends early if the target takes damage or an entity uses an action to shake them awake.',
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
      'You launch a burrowing spore pod at an **entity you can see** within **12 meters (40 feet)**.\n\n' +
      'Make a **{stat} Ranged Attack** {roll} against the target. On a hit, the spore embeds itself in the target.\n\n' +
      'At your **Turn End**, the embedded spore deals [[2d6 + 2*stat]] in {damage} damage to the target, and you regain **Health** equal to half the damage dealt.',
    sub_name: 'Upkeep',
    sub_body:
      'At your **Turn Start**, you must pay **2 Willpower** to maintain the spore on the target.\n\n' +
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
      'Entities taking a **Short Rest** inside gain [[2d6 + 2*stat]] in **Shield** and **1 Karma**.\n\n' +
      'Standing in the field **elevates** your **Flora** spells by **1**.',
    sub_name: 'Overcast',
    sub_body:
      'When casting **Verdant Field**, you may spend an additional **3 Action Points** and **4 Willpower**.\n\n' +
      'If you do, the field lasts for **24 hours**, or becomes permanent in natural terrain, and entities taking a **Long Rest** inside also receive the **Short Rest** benefits and reduce their **Supplies** cost by **1**.',
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
      'The wall can be up to **12 meters (40 feet)** long, **1.5 meters (5 feet)** thick and **3 meters (10 feet)** tall, blocking **line of sight**.\n\n' +
      'Any entity attempting to pass through the wall or having their **Turn Start** in it takes [[3d6 + 3*stat]] in {damage} damage, and you make a **{stat} Roll** {roll} against that entity’s **Grit**.\n\n' +
      'On a success, the entity becomes **rooted** until the end of its turn.',
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
      'You touch a **common object**, instantly breaking it down into decaying organic matter and destroying it.\n\n' +
      'The object cannot exceed **200 kg (440 lbs)** in weight or a **2-meter (6-foot)** cube in size, and cannot be metallic.\n\n' +
      'If the object is being worn or held by an entity, you must make a successful **{stat} Melee Attack** {roll} against the target to destroy it.',
    sub_name: 'Overcast',
    sub_body:
      'When casting **Naturalize**, you may spend an additional **3 Action Points** and **6 Willpower**.\n\n' +
      'If you do, you can target **uncommon objects**.',
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
      'You embody the freedom of the wild until your next **Long Rest**.\n\n' +
      'The **Action Point** cost of your {{Move}} action can no longer exceed **1 Action Point**, and your **Movement Speed** cannot be reduced by any effect.\n\n' +
      'Additionally, your jump distance and jump height are **doubled**.',
    sub_name: 'Multicast',
    sub_body:
      'When casting **Wild Strider**, you may spend an additional **1 Action Point** and **1 Willpower** any number of times.\n\n' +
      'For each time you do, target an additional entity you can see within **6 meters (20 feet)** with **Wild Strider**.',
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
      'You manifest a snake spirit which hurls itself at an **entity you can see** within **6 meters (20 feet)**.\n\n' +
      'Make a **{stat} Ranged Attack** {roll}. On a hit, you deal [[2d6 + 2*stat]] in {damage} damage, and the target is **poisoned**.',
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
      'For the duration of the spell, you gain **advantage** on all **skill checks** that rely on one of your five senses.',
    sub_name: 'Overcast',
    sub_body:
      'While **Sharpen Senses** is active, when you fail a **skill check** that relies on one of your five senses, you may spend **2 Willpower** to **reroll** the check.\n\n' +
      'You can only use this effect once per **skill check**.',
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
      'Make a **{stat} Roll** {roll} against the **Grit** of all hostile entities that can hear you within **36 meters (120 feet)**.\n\n' +
      'On a success, the entity must spend **2 Action Points** on its next turn to move away from you. If the target has any **Reaction Points** available, it immediately spends them to start moving away from you first.',
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
      'You manifest the spirit of a large flying creature that swoops down on an **entity you can see** within **12 meters (40 feet)**.\n\n' +
      'Make a **{stat} Ranged Attack** {roll}. On a hit, you deal [[2d6 + 2*stat]] in {damage} damage, and the target is carried **12 meters (40 feet)** in any direction of your choice.',
    sub_name: 'Overcast',
    sub_body:
      'When **Wild Sweep** hits, you may spend an additional **1 Action Point** and **1 Willpower** any number of times.\n\n' +
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
      'Make a **{stat} Attack Roll** {roll} against all entities in the area. On a hit, you deal [[4d6 + 4*stat]] in {damage} damage.',
    sub_name: 'Overcast',
    sub_body:
      'When casting **Savage Slam**, you may spend an additional **2 Action Points** and **2 Willpower**.\n\n' +
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
      'You form a predatory bond with up to **5 allies you can see** for **10 turns (1 minute)**, binding you together as a **Wild Pack**. While this spell is active:\n\n' +
      'Attack rolls against a Wild Pack member have **disadvantage** while that member is adjacent to at least one other Wild Pack member.\n\n' +
      'Wild Pack members gain **advantage** on attack rolls against an entity if at least **2** Wild Pack members are adjacent to that same entity.\n\n' +
      'If a Wild Pack member falls **unconscious** or dies, every remaining member’s next attack is a guaranteed **critical** hit. Friendly fire and self-harm cannot trigger this effect.',
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
      'While controlling the creature, your physical body is **incapacitated** and cannot take actions.\n\n' +
      'You may end **Bird View** early.',
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
      'You attempt to ferment the blood of an **entity you can see** within **15 meters (50 feet)**.\n\n' +
      'Make a **{stat} Roll** {roll} against the target’s **Grit**. On a success, the target becomes **poisoned**.\n\n' +
      'Outside of combat, the target is unaware of the spell’s source and believes they became suddenly sick.',
    sub_name: 'Multicast',
    sub_body:
      'When casting **Force Inebriation**, you may spend an additional **1 Action Point** and **1 Willpower** any number of times.\n\n' +
      'For each time you do, target an additional **eligible entity** within range.',
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
      'For **10 turns (1 minute)**, you sense the exact location and health state of all living entities within **18 meters (60 feet)**, even through total cover or darkness.',
    sub_name: 'Overcast',
    sub_body:
      'While **Sense Life** is active, you may spend **3 Action Points** and **3 Willpower** to **mark** an entity within range.\n\n' +
      'You continue to sense the marked entity’s location and health state until your next **Long Rest**, even if the target leaves your range.',
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
      'You mend the flesh of an **entity you touch**, restoring [[1d6 + stat]] in **Health** immediately and again at the **Turn Start** of the target’s next **2** turns.',
    sub_name: 'Overcast',
    sub_body:
      'When casting **Renew**, you may spend an additional **2 Action Points** and **2 Willpower**.\n\n' +
      'If you do, you instantly restore [[2d6 + 2*stat]] in **Health** to all entities currently affected by your **Renew**, regardless of range or **line of sight**.',
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
      'You infuse an **entity you can touch** with life energy, tripling its size, doubling its **Movement Speed** and granting it **Empowered** for **10 turns**.',
    sub_name: 'Multicast',
    sub_body:
      'When casting **Giant Growth**, you may spend **3 Willpower** for each additional **entity you can touch**.',
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
      'You touch a blood sample to create a trail of red mist that **only you can see**.\n\n' +
      'The trail lasts for **12 hours** and, if followed, leads you directly to the entity the blood came from.',
    sub_name: 'Blood Tithe',
    sub_body:
      'When casting **Bleeding Trail**, you may sacrifice **Health** equal to your **{physique}** [[physique]].\n\n' +
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
      'You manifest a spear of blood and hurl it at an **entity you can see** within **9 meters (30 feet)**.\n\n' +
      'Make a **{stat} Ranged Attack** {roll} against the target. On a hit, you deal [[3d6 + 3*stat]] in {damage} damage.',
    sub_name: 'Blood Tithe',
    sub_body:
      'When casting **Blood Spear**, you may sacrifice **Health** equal to your **{physique}** [[physique]].\n\n' +
      'If you do so, the attack is made with **advantage** and the damage is **Empowered** by **1**.',
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
      'You sacrifice **Health** equal to [[3*physique]] and gain **Shield** equal to [[6*physique]].',
    sub_name: 'Blood Tithe',
    /* "this spell" rather than "Gore Armor", which every other card does say.
       Armor is a defined term, and a keyword is lit wherever it appears — so
       printing this card's own name would colour half of it as the Armor stat
       and offer "flat damage reduction" as the explanation, on a card that
       grants Shield and no Armor at all. It is the only name in the codex a
       keyword collides with. */
    sub_body:
      'When casting this spell, you may sacrifice a further **Health** equal to [[2*physique]].\n\n' +
      'If you do so, you gain additional **Shield** equal to the **Health** sacrificed.',
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
      'You attempt to drain the life force of an **entity you can touch**.\n\n' +
      'Make a **{stat} Melee Attack** {roll} against the target. On a hit, you deal [[3d6 + 3*stat]] in {damage} damage and regain **Health** equal to half the damage dealt.',
    sub_name: 'Blood Tithe',
    sub_body:
      'When casting **Vampiric Touch**, you may sacrifice **Health** equal to your **{physique}** [[physique]].\n\n' +
      'If you do so, the attack is made with **advantage** and the damage is **Empowered** by **1**.',
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
      'You enclose a target entity you can see within **6 meters (20 feet)** inside a sphere of dense arcane energy.\n\n' +
      'While trapped inside the sphere, the entity is **stunned**.\n\n' +
      'The trapped entity can spend **3 Action Points** to attempt to break free by making a **{stat} roll** against your **{stat}**. On a success, the sphere shatters and the effect ends.',
    sub_name: 'Overcast',
    sub_body:
      'When a trapped entity attempts to break out of the sphere, you may spend **2 Willpower**. If you do, that entity makes their breakout roll with **Disadvantage**.',
  },
];

/* ------------------------------------------------------------ basic actions */

/**
 * Things every character can do, whatever they are holding. They are cards for
 * the same reason a weapon's attacks are: the sheet asks what a use costs and
 * then shows the card, so the reader never has to be told what they just spent
 * points on.
 */
export const ACTION_CARDS = [
  {
    id: 'swap-weapons',
    name: 'Swap Weapons',
    kind: 'ability',
    tags: ['Action', 'Loadout'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    body:
      'You stow the weapon in your hands and draw the one you were carrying, so the two change places.\n\n' +
      'Whatever the drawn weapon teaches is yours from this moment; the stowed one takes its cards back with it.',
  },
];

/* ------------------------------------------------------------ weapon cards */

/**
 * Every weapon teaches two cards: the plain attack it makes, and the special
 * move that costs more (and usually Willpower) to pull off.
 */
export const WEAPON_ABILITIES = [
  /* ----- Bo Staff ----- */
  {
    id: 'bo-staff-slam',
    name: 'Bo Staff - Slam',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'instinct',
    damage: ['Blunt'],
    body:
      'Make an **{stat} Melee Attack** {roll} against an entity within **3 Meter (10 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'bo-staff-swipe',
    name: 'Bo Staff - Swipe',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'instinct',
    damage: ['Blunt'],
    body:
      'Make an **{stat} Melee Attack** {roll} against all entities within **3 Meter (10 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },

  /* ----- Daggers ----- */
  {
    id: 'daggers-strike',
    name: 'Daggers - Strike',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an **{stat} Melee Attack** {roll} against an entity within **1.5 Meter (5 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'daggers-triple-strike',
    name: 'Daggers - Triple Strike',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make three **{stat} Melee Attack** {roll} against an entity within **1.5 Meter (5 Feet)** of you.\n\n' +
      'For each **hit**, you deal [[1d6 + stat]] as {damage} damage.',
  },

  /* ----- One-Handed ----- */
  {
    id: 'one-handed-strike',
    name: 'One-Handed - Strike',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make an **{stat} Melee Attack** {roll} against an entity within **1.5 Meter (5 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'one-handed-swift-strike',
    name: 'One-Handed - Swift Strike',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make an **{stat} Melee Attack** {roll} with **Disadvantage** against an entity within **1.5 Meter (5 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[2d6 + stat]] as {damage} damage.',
  },

  /* ----- Two-Handed ----- */
  {
    id: 'two-handed-strike',
    name: 'Two-Handed - Strike',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a **{stat} Melee Attack** {roll} against an entity within **3 Meter (10 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'two-handed-cleave',
    name: 'Two-Handed - Cleave',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a **{stat} Melee Attack** {roll} against all entities within **4.5 meters (15 feet)** in front of you.\n\n' +
      'On a **hit**, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },

  /* ----- Shield & 1-Handed ----- */
  {
    id: 'shield-attack',
    name: 'Shield & 1-Handed - Attack',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'physique',
    damage: ['Sharp', 'Blunt'],
    body:
      'Make a **{stat} Melee Attack** {roll} against an entity within **1.5 Meter (5 Feet)** of you.\n\n' +
      'On a hit, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'shield-block',
    name: 'Shield & 1-Handed - Block',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Move'],
    ap: 1,
    wp: 1,
    stat: 'physique',
    body:
      'You raise your shield, reducing the damage from the next attack that hits you by [[2d6 + stat]].',
  },

  /* ----- Whip ----- */
  {
    id: 'whip-lash',
    name: 'Whip - Lash',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an **{stat} Melee Attack** {roll} against an entity within **4.5 Meter (15 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'whip-pull',
    name: 'Whip - Pull',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 3,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an **{stat} Melee Attack** {roll} against an entity within **4.5 Meter (15 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[2d6 + stat]] as {damage} damage. You then either pull the target **4.5 meters (15 Feet)** toward you or pull yourself **4.5 meters (15 Feet)** toward the target.',
  },

  /* ----- Short Bow ----- */
  {
    id: 'short-bow-shoot',
    name: 'Short Bow - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an **{stat} Ranged Attack** {roll} against an entity within **25 Meter (80 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'short-bow-triple-shot',
    name: 'Short Bow - Triple Shot',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make three **{stat} Ranged Attack** {roll} against an entity within **25 Meter (80 Feet)** of you.\n\n' +
      'For each **hit**, you deal [[1d6 + stat]] as {damage} damage.',
  },

  /* ----- Longbow ----- */
  {
    id: 'longbow-shoot',
    name: 'Longbow - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an **{stat} Ranged Attack** {roll} against an entity within **30 Meter (100 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'longbow-aimed-shot',
    name: 'Longbow - Aimed Shot',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 5,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an **{stat} Ranged Attack** {roll} with **Disadvantage** against an entity within **45 Meter (150 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[3d6 + 3*stat]] as {damage} damage.',
  },

  /* ----- Greatbow ----- */
  {
    id: 'greatbow-shoot',
    name: 'Greatbow - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a **{stat} Ranged Attack** {roll} against an entity within **30 Meter (100 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'greatbow-piercing-shot',
    name: 'Greatbow - Piercing Shot',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 5,
    wp: 1,
    stat: 'physique',
    damage: ['Sharp'],
    body:
      'Make a **{stat} Ranged Attack** {roll} against a first entity and all entities in a line behind it within **30 Meter (100 Feet)**.\n\n' +
      'On a **hit**, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },

  /* ----- Flintlock Pistol ----- */
  {
    id: 'flintlock-pistol-shoot',
    name: 'Flintlock Pistol - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 1,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an **{stat} Ranged Attack** {roll} against an entity within **25 Meter (80 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'flintlock-pistol-reload',
    name: 'Flintlock Pistol - Reload',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    body:
      'Your **Flintlock Pistol** starts loaded with **3 Shots**. Every use of the **Flintlock Pistol - Shoot** ability consumes one shot.\n\n' +
      'After you have used all **3 shots**, you must use this **Reload** ability before you can **Shoot** again.',
  },

  /* ----- Dual Pistols ----- */
  {
    id: 'dual-pistols-shoot',
    name: 'Dual Pistols - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make two **{stat} Ranged Attack** {roll} against up to two entities within **25 Meter (80 Feet)** of you.\n\n' +
      'For each **hit**, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'dual-pistols-reload',
    name: 'Dual Pistols - Reload',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 6,
    wp: null,
    stat: 'instinct',
    body:
      'Your **Dual Pistols** start loaded with **3 Shots**. Every use of the **Dual Pistols - Shoot** ability consumes one shot.\n\n' +
      'After you have used all **3 shots**, you must use this **Reload** ability before you can **Shoot** again.',
  },

  /* ----- Flintlock Rifle ----- */
  {
    id: 'flintlock-rifle-shoot',
    name: 'Flintlock Rifle - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 1,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an **{stat} Ranged Attack** {roll} against an entity within **30 Meter (100 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'flintlock-rifle-reload',
    name: 'Flintlock Rifle - Reload',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'instinct',
    body:
      'Your **Flintlock Rifle** starts loaded with **2 Shots**. Every use of the **Flintlock Rifle - Shoot** ability consumes one shot.\n\n' +
      'After you have used all **2 shots**, you must use this **Reload** ability before you can **Shoot** again.',
  },

  /* ----- Portable Canon ----- */
  {
    id: 'portable-canon-shoot',
    name: 'Portable Canon - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 1,
    wp: null,
    stat: 'instinct',
    damage: ['Blunt'],
    body:
      'Make an **{stat} Ranged Attack** {roll} against an entity within **25 Meter (80 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[2d6 + 2*stat]] as {damage} damage.',
  },
  {
    id: 'portable-canon-reload',
    name: 'Portable Canon - Reload',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Attack'],
    ap: 3,
    wp: null,
    stat: 'instinct',
    body:
      'Your **Portable Canon** starts loaded with **1 Shot**. Every use of the **Portable Canon - Shoot** ability consumes one shot.\n\n' +
      'After you have used your **1 shot**, you must use this **Reload** ability before you can **Shoot** again.',
  },

  /* ----- Wand ----- */
  {
    id: 'wand-shoot',
    name: 'Wand - Shoot',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'mind',
    damage: ['Elemental'],
    body:
      'Make a **{stat} Ranged Attack** {roll} against an entity within **18 Meter (60 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[2d6 + stat]] as {damage} damage.',
  },
  {
    id: 'wand-imbue',
    name: 'Wand - Imbue',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Move'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    body:
      'Before a **Wand** can be used, you must use the **Imbue** ability to activate it for **3 turns**.\n\n' +
      'When you **Imbue** the wand, choose an **elemental** damage type from **Cold**, **Fire**, or **Lightning**. Your wand deals damage of that chosen element.',
  },

  /* ----- Staff ----- */
  {
    id: 'staff-blast',
    name: 'Staff - Blast',
    kind: 'ability',
    tags: ['Ranged', 'Weapon Attack'],
    ap: 4,
    wp: null,
    stat: 'mind',
    damage: ['Elemental'],
    body:
      'Make a **{stat} Ranged Attack** {roll} against an entity within **18 Meter (60 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[3d6 + stat]] as {damage} damage.',
  },
  {
    id: 'staff-imbue',
    name: 'Staff - Imbue',
    kind: 'ability',
    tags: ['Ranged', 'Special Weapon Move'],
    ap: 2,
    wp: 2,
    stat: 'mind',
    body:
      'Before a **Staff** can be used, you must use the **Imbue** ability to activate it for **3 turns**.\n\n' +
      'When you **Imbue** the staff, choose an **elemental** damage type from **Cold**, **Fire**, or **Lightning**. Your staff deals damage of that chosen element.',
  },

  /* ----- Claws & Teeth (natural) ----- */
  {
    id: 'claws-shred',
    name: 'Claws - Shred',
    kind: 'ability',
    tags: ['Melee', 'Weapon Attack'],
    ap: 2,
    wp: null,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an **{stat} Melee Attack** {roll} against an entity within **1.5 Meter (5 Feet)** of you.\n\n' +
      'On a **hit**, you deal [[1d6 + stat]] as {damage} damage.',
  },
  {
    id: 'teeth-bite',
    name: 'Teeth - Bite',
    kind: 'ability',
    tags: ['Melee', 'Special Weapon Attack'],
    ap: 4,
    wp: 1,
    stat: 'instinct',
    damage: ['Sharp'],
    body:
      'Make an **{stat} Melee Attack** {roll} against an entity within **1.5 Meter (5 Feet)** of you.\n\n' +
      'On a hit, you deal [[2d6 + 2*stat]] as {damage} damage and gain **Shield** equal to [[stat]].',
  },
];

/* -------------------------------------------------------------- the weapons */

/**
 * Weapon fields on top of the shared item fields (see items.js):
 *   abilities   — the two card ids the weapon teaches while it is held
 *   blurb       — the one-line description printed under its name
 *   enchants    — [{ id, spell? }] when the weapon carries enchantments
 *   enchantText — the sentence shown for that enchantment, with {{card links}}
 */
export const WEAPONS = [
  {
    id: 'bo-staff',
    name: 'Bo Staff',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Two-Handed'],
    blurb: 'A hardwood stave the length of a man, swung in wide arcs.',
    burden: 0,
    abilities: ['bo-staff-slam', 'bo-staff-swipe'],
  },
  {
    id: 'daggers',
    name: 'Daggers',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Paired'],
    blurb: 'A matched pair of short blades, quick in and quicker out.',
    burden: 0,
    abilities: ['daggers-strike', 'daggers-triple-strike'],
  },
  {
    id: 'one-handed',
    name: 'One-Handed Weapon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'One-Handed'],
    blurb: 'A sword, axe or mace — one hand on the grip, the other free.',
    burden: 0,
    abilities: ['one-handed-strike', 'one-handed-swift-strike'],
  },
  {
    id: 'two-handed',
    name: 'Two-Handed Weapon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Two-Handed'],
    blurb: 'A greatsword or maul that needs your whole body behind it.',
    burden: 0,
    abilities: ['two-handed-strike', 'two-handed-cleave'],
  },
  {
    id: 'shield-and-one-handed',
    name: 'Shield & One-Handed',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Shielded'],
    blurb: 'A blade in one hand, a wall of banded wood in the other.',
    burden: 0,
    abilities: ['shield-attack', 'shield-block'],
  },
  {
    id: 'whip',
    name: 'Whip',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Reach'],
    blurb: 'Braided leather that bites at fifteen feet and drags them closer.',
    burden: 0,
    abilities: ['whip-lash', 'whip-pull'],
  },
  {
    id: 'short-bow',
    name: 'Short Bow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Bow'],
    blurb: 'A hunting bow — light draw, fast nock, close work.',
    burden: 0,
    abilities: ['short-bow-shoot', 'short-bow-triple-shot'],
  },
  {
    id: 'longbow',
    name: 'Longbow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Bow'],
    blurb: 'A tall yew bow that reaches across the whole field.',
    burden: 0,
    abilities: ['longbow-shoot', 'longbow-aimed-shot'],
  },
  {
    id: 'greatbow',
    name: 'Greatbow',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Bow'],
    blurb: 'A siege bow drawn on raw strength, firing bolts like spears.',
    burden: 0,
    abilities: ['greatbow-shoot', 'greatbow-piercing-shot'],
  },
  {
    id: 'flintlock-pistol',
    name: 'Flintlock Pistol',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Firearm'],
    blurb: 'Powder and shot in one hand. Three balls, then reload.',
    burden: 0,
    abilities: ['flintlock-pistol-shoot', 'flintlock-pistol-reload'],
  },
  {
    id: 'dual-pistols',
    name: 'Dual Pistols',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Firearm'],
    blurb: 'A pistol in each hand, two targets at once, six seconds of noise.',
    burden: 0,
    abilities: ['dual-pistols-shoot', 'dual-pistols-reload'],
  },
  {
    id: 'flintlock-rifle',
    name: 'Flintlock Rifle',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Firearm'],
    blurb: 'A long barrel and a slow reload for a shot that carries.',
    burden: 0,
    abilities: ['flintlock-rifle-shoot', 'flintlock-rifle-reload'],
  },
  {
    id: 'portable-canon',
    name: 'Portable Canon',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Firearm'],
    blurb: 'A hand-braced cannon. One shot, and everything after it is ringing.',
    burden: 0,
    abilities: ['portable-canon-shoot', 'portable-canon-reload'],
  },
  {
    id: 'wand',
    name: 'Wand',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Focus'],
    blurb: 'A focus of carved rowan, imbued with an element before it will fire.',
    burden: 0,
    abilities: ['wand-shoot', 'wand-imbue'],
  },
  {
    id: 'staff',
    name: 'Staff',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Ranged Weapon', 'Focus'],
    blurb: 'A caster’s stave — slower than a wand, and far louder.',
    burden: 0,
    abilities: ['staff-blast', 'staff-imbue'],
  },
  {
    id: 'claws-and-teeth',
    name: 'Claws & Teeth',
    slots: ['main_hand', 'off_hand'],
    tags: ['Common', 'Melee Weapon', 'Natural'],
    // Born with, not bought — no shop stocks it and no starting kit issues it.
    natural: true,
    blurb: 'What you were born with, when nothing else is left in your hands.',
    burden: 0,
    abilities: ['claws-shred', 'teeth-bite'],
  },

  /* ----- enchanted weapons ----- */
  {
    id: 'cold-infused-sword',
    name: 'Cold-Infused Sword',
    slots: ['main_hand', 'off_hand'],
    tags: ['Uncommon', 'Melee Weapon', 'One-Handed'],
    blurb: 'A one-handed sword whose edge never stops shedding frost.',
    burden: 0,
    abilities: ['one-handed-strike', 'one-handed-swift-strike'],
    enchants: [{ id: 'cold-infusion' }],
    enchantText: 'This blade is enchanted with {{Cold Infusion}}.',
    lore:
      'Guild-forged in a cold house under the aether works, where the quenching trough is kept at a temperature no smith will name.\n\n' +
      'The blade sweats frost in any weather. Sheathed too long it welds itself shut, and every owner learns to draw it once an hour whether or not there is anything to cut.',
  },
  {
    id: 'imbued-flintlock-pistol',
    name: 'Imbued Flintlock Pistol',
    slots: ['main_hand', 'off_hand'],
    tags: ['Uncommon', 'Ranged Weapon', 'Firearm'],
    blurb: 'A pistol with green vines chased along the barrel.',
    burden: 0,
    abilities: ['flintlock-pistol-shoot', 'flintlock-pistol-reload'],
    enchants: [{ id: 'novice-imbuement', spell: 'bramble-whip' }],
    enchantText: 'This pistol carries a {{Novice Imbuement}}, letting its wielder cast {{Bramble Whip}}.',
    lore:
      'Hedge-work, not guild-work: the vines were grown into the barrel rather than chased onto it, and they are still alive.\n\n' +
      'The spell bound inside answers once, then sulks until its bearer has slept.',
  },
  {
    id: 'grave-lantern-blade',
    name: 'Grave-Lantern Blade',
    slots: ['main_hand', 'off_hand'],
    tags: ['Rare', 'Melee Weapon', 'One-Handed'],
    blurb: 'A pitted sword that burns green along the fuller and rots what it cuts.',
    burden: 0,
    abilities: ['one-handed-strike', 'one-handed-swift-strike'],
    enchants: [{ id: 'decay-infusion' }, { id: 'luminescence' }, { id: 'novice-imbuement', spell: 'pack-bond' }],
    enchantText:
      'Three workings share this blade: {{Decay Infusion}} in the edge, {{Luminescence}} in the fuller, and an imbuement holding {{Pack Bond}}.',
    lore:
      'Carried by the lantern-bearers who walked the plague roads out of Ashfen, where a light that could be shut off mattered more than a light that was bright.\n\n' +
      'Three enchantments on one blade is one more than most smiths will lay, and the seams show it: the steel is pitted where the workings meet, and it drinks Magic Burden like a much larger weapon.',
  },
];

/* ------------------------------------------------------------------ lookups */

/**
 * Every card the codex knows — weapon abilities, spells, enchantments, the one
 * card each belt item teaches, and everything the talent tracks and lineages
 * hand out. This
 * is the registry every `{{link}}` and every `getCard` call resolves against,
 * so anything printable has to be in it.
 */
export const CARDS = [
  ...WEAPON_ABILITIES,
  ...SPELLS,
  ...ENCHANTMENTS,
  ...UTILITY_CARDS,
  ...TALENT_CARDS,
  ...LINEAGE_CARDS,
  ...BACKGROUND_CARDS,
  ...ACTION_CARDS,
  ...BASIC_ACTIONS,
];

const CARD_BY_ID = new Map(CARDS.map((card) => [card.id, card]));
const CARD_BY_NAME = new Map(CARDS.map((card) => [card.name.toLowerCase(), card]));
const ENCHANT_BY_ID = new Map(ENCHANTMENTS.map((entry) => [entry.id, entry]));

/** A card by id or by printed name — `{{Cold Infusion}}` links resolve here. */
export function getCard(key) {
  if (!key) return null;
  return CARD_BY_ID.get(key) ?? CARD_BY_NAME.get(String(key).toLowerCase()) ?? null;
}

export function getEnchantment(id) {
  return id ? ENCHANT_BY_ID.get(id) ?? null : null;
}

/** What has been laid on an item: the enchantment record plus its own entry. */
export function itemEnchantments(item) {
  return (item?.enchants ?? [])
    .map((entry) => ({ ...entry, enchantment: getEnchantment(entry.id) }))
    .filter((entry) => entry.enchantment);
}

/**
 * What the item does to the cards it teaches. A weapon's own damage type is
 * whatever the last infusion turned it into, and every Empowering enchantment
 * stacks another die category on top.
 */
export function itemModifiers(item) {
  let damage = null;
  let empower = 0;

  for (const { enchantment } of itemEnchantments(item)) {
    if (enchantment.damageType) damage = enchantment.damageType;
    empower += Number(enchantment.empower) || 0;
  }

  return { damage, empower };
}

/** The cards an item teaches while it is equipped, plus any spell it carries. */
export function cardsForItem(item) {
  const cards = (item?.abilities ?? []).map(getCard).filter(Boolean);
  const spells = itemEnchantments(item)
    .map((entry) => getCard(entry.spell))
    .filter(Boolean);
  return [...cards, ...spells];
}

