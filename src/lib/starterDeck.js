/**
 * Sample cards transcribed from the printed Hazebound deck.
 * Offered as one-click seed data on an empty Abilities tab so a new character
 * has something to read — and so the card format is self-documenting.
 */
export const STARTER_DECK = [
  {
    name: 'Dual Pistols - Shoot',
    type_line: 'RANGED - WEAPON ATTACK',
    kind: 'ability',
    ap_cost: 2,
    wp_cost: null,
    body:
      'Make two **Instinct Ranged Attack** against up to two entities within **25 Meter (80 Feet)** of you.\n\n' +
      'For each **hit**, you deal **1d6 + your Instinct** as **Sharp** damage.',
    sub_name: null,
    sub_body: null,
  },
  {
    name: 'Dual Pistols - Reload',
    type_line: 'RANGED - SPECIAL WEAPON ATTACK',
    kind: 'ability',
    ap_cost: 6,
    wp_cost: null,
    body:
      'Your **Dual Pistols** start loaded with **3 Shots**. Every use of **Dual Pistols - Shoot** ability consumes one shot.\n\n' +
      'After you have used all **3 shots**, you must use this **Reload** ability before you can **Shoot** again.',
    sub_name: null,
    sub_body: null,
  },
  {
    name: 'Blood Spear',
    type_line: 'NOVICE SPELL - NATURE - BLOOD',
    kind: 'spell',
    ap_cost: 3,
    wp_cost: 2,
    body:
      'You manifest a spear of blood and hurl it at an entity **you can see** within **9 meters (30 feet)**.\n\n' +
      'Make a **Mind Ranged Attack** against the target. On a hit, you deal **3d6 + 3 x Mind** in **Sharp** damage.',
    sub_name: 'Blood Tithe',
    sub_body:
      'When casting this spell, you may **sacrifice Health** equal to your **Physique**.\n\n' +
      'If you do so, the attack is made with **Advantage** and the damage is **Empowered** by **1**.',
  },
  {
    name: 'Bleeding Trail',
    type_line: 'NOVICE SPELL - NATURE - BLOOD',
    kind: 'spell',
    ap_cost: 6,
    wp_cost: 4,
    body:
      'You **touch** a blood sample to create a trail of red mist that only you can see.\n\n' +
      'The trail lasts for **12 hours** and if followed leads you directly to the entity the blood came from.',
    sub_name: 'Blood Tithe',
    sub_body:
      'When casting this spell, you may **sacrifice Health** equal to your **Physique**.\n\n' +
      'If you do so, you receive a clear mental image of the entity the blood originated from.',
  },
  {
    name: 'Pack Bond',
    type_line: 'ADEPT SPELL - PRIMAL - WILD',
    kind: 'spell',
    ap_cost: 3,
    wp_cost: 4,
    body:
      'You form a predatory bond with up to **5 allies you can see** for **10 turns (1 minute)**, binding you together as a **Wild Pack**. While this spell is active:\n\n' +
      '**Attack rolls** against a **Wild Pack** member have **Disadvantage** while that member is **adjacent** to at least one other **Wild Pack** member.\n\n' +
      '**Wild Pack** members gain **Advantage** on **attack rolls** against an **entity** if at least **2 Wild Pack** members are **adjacent** to that same **entity**.\n\n' +
      'If a **Wild Pack** member falls **Unconscious** or **dies**, all remaining members’ next **attack** is a guaranteed **Critical Hit**. (Friendly fire and self-harm cannot trigger this effect).',
    sub_name: null,
    sub_body: null,
  },
  {
    name: 'Wall of Flames',
    type_line: 'ADEPT SPELL - ELEMENTAL - FIRE',
    kind: 'spell',
    ap_cost: 4,
    wp_cost: 5,
    body:
      'You conjure a wall of fire at a location **you can see** within **15 meters (50 feet)**.\n\n' +
      'The wall can be up to **15 meters (50 feet) long** and **2 meters (10 feet) thick**, and it does not have to be a straight line.\n\n' +
      'The wall blocks line of sight.\n\n' +
      'Any entity passing through the wall or having their **Turn Start** within it takes **4d6 + 4 x Mind** in **Fire** damage.',
    sub_name: null,
    sub_body: null,
  },
  {
    name: 'Fungal Invocation',
    type_line: 'TALENT - MYCOMANCER - PASSIVE',
    kind: 'talent',
    ap_cost: null,
    wp_cost: null,
    body:
      'Your deep connection with the mycelial network lets you cast **Nature Spells**. You learn a number of **Nature School spells** equal to **2 + 2 x your Rank in Mycomancer**.\n\n' +
      'After a successful **short** or **long rest**, you can swap out any number of **spells** you know to any other eligible **spell**.\n\n' +
      'At **Rank 2**, you can learn **Adept Nature Spells**, and at **Rank 3**, you gain access to **Master Nature Spells**.\n\n' +
      'You also have a unique ability to draw power from the dead. By touching a fresh cadaver as you **cast a spell**, you can reduce its cost by 1 **Willpower**. You can use this **once per spell cast**.',
    sub_name: null,
    sub_body: null,
  },
  {
    name: 'Venomous Stalker',
    type_line: 'SKILL - RIDING',
    kind: 'skill',
    ap_cost: null,
    wp_cost: null,
    body:
      'You align your movements with your predatory mount, stalking prey from the unseen shadows.\n\n' +
      'While mounted, this mount does not cause you to suffer double **Disadvantage** on **Stealth** checks.\n\n' +
      'Your **weapon attacks** deal an additional **1d4 Decay** damage for every **2 Action Points** the attack costs.',
    sub_name: null,
    sub_body: null,
  },
];
