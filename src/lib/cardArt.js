/**
 * Card art, keyed by card id.
 *
 * The pictures are the designer's, hosted on postimg, and the links come out of
 * the Image column of the same sheets the cards themselves come from. The sheet
 * writes postimg *page* links, which serve HTML rather than an image, so the
 * direct link is resolved once on the way in and the resolved one is what lives
 * here.
 *
 * It is a separate file rather than an `art_url` line on every card for two
 * reasons: a codex entry should read as rules and not as a wall of URLs, and
 * re-pulling art is then one file to rewrite instead of a hunt through three.
 *
 * ------------------------------------------------------------------ the gate
 * Nothing here decides who *sees* a picture. Card art is a paid capability
 * (see `showsArt` in tiers.js), and the tier is checked at the moment of
 * drawing, in useCodexArt.js. This file only says what the picture is.
 */

const CARD_ART = {
  /* ---------------------------------------------------------- Primal spells */
  'bramble-whip': 'https://i.postimg.cc/BbPBjfR1/BRAMBLE-WHIP.png',
  'barkskin': 'https://i.postimg.cc/NF2kKvZm/BARKSKIN.png',
  'entangling-roots': 'https://i.postimg.cc/4yHQYRj7/ENTANGLING-ROOTS.png',
  'sleeping-spores': 'https://i.postimg.cc/SsvGQx1R/SLEEPING-SPORES.png',
  'parasitic-spore': 'https://i.postimg.cc/SKhnbbyY/PARASITIC-SPORE.jpg',
  'verdant-field': 'https://i.postimg.cc/T15JKvBK/v-ERDANT-FIELD.png',
  'thorn-rampart': 'https://i.postimg.cc/7hJn5rjC/THORN-RAMPART.jpg',
  'naturalize': 'https://i.postimg.cc/G25j3mg4/NATURALIZE.jpg',
  'wild-strider': 'https://i.postimg.cc/rsRND27W/WILD-STRIDER.jpg',
  'snake': 'https://i.postimg.cc/fLrvWRq3/SNAKE.jpg',
  'sharpen-sense': 'https://i.postimg.cc/vBNv8Z2g/SHARPEN-SENSE.jpg',
  'primal-roar': 'https://i.postimg.cc/Kj3D1hCz/PRIMAL-ROAR.jpg',
  'wild-sweep': 'https://i.postimg.cc/ZRMLY5s5/WILD-SWEEP.jpg',
  'savage-slam': 'https://i.postimg.cc/ZnvxWzXK/SAVAGE-SLAM.jpg',
  'pack-bond': 'https://i.postimg.cc/hvQ1XRNV/PACK-BOND.jpg',
  'bird-view': 'https://i.postimg.cc/zvHFyY4f/BIRD-VIEW.jpg',
  'force-inebriation': 'https://i.postimg.cc/7Ynrhv4N/FORCE-INEBRIATION.png',
  'sense-life': 'https://i.postimg.cc/tTMzR4vg/SENSE-LIFE.jpg',
  'renew': 'https://i.postimg.cc/pXp1NgTc/RENEW.jpg',
  'giant-growth': 'https://i.postimg.cc/FHGZ7p79/GIANT-GROWTH.jpg',
  'bleeding-trail': 'https://i.postimg.cc/3wP5cm2W/BLEEDING-TRAIL.jpg',
  'blood-spear': 'https://i.postimg.cc/5yWHbHWb/BLOOD-SPEAR.jpg',
  'gore-armor': 'https://i.postimg.cc/bNsXpmgV/GORE-ARMOR.jpg',
  'vampiric-touch': 'https://i.postimg.cc/26bHgtrt/VAMPIRIC-TOUCH.jpg',

  /* ---------------------------------------------------------- basic actions */
  'move': 'https://i.postimg.cc/MZNkZhTP/Move.jpg',
  'jump': 'https://i.postimg.cc/tJCFLS05/Jump.jpg',
  'investigate': 'https://i.postimg.cc/T3D5HyNP/Investigate.jpg',
  'interact': 'https://i.postimg.cc/J0zPb3Qg/Interact.jpg',
  'hide': 'https://i.postimg.cc/qvmNDs4N/Hide.jpg',
  'grapple': 'https://i.postimg.cc/4xR7hfPq/Grapple.jpg',
  'shove': 'https://i.postimg.cc/bNyNXZ6t/Shove.jpg',
  'anticipate': 'https://i.postimg.cc/P56CVWT8/Anticipate.jpg',
  'stabilize': 'https://i.postimg.cc/vTSKS2qX/Stabilize.jpg',
  'inventory': 'https://i.postimg.cc/pXrQWLrn/Inventory.jpg',
};

/** The art for one card, or null for a card that has none yet. */
export function artFor(id) {
  return CARD_ART[id] ?? null;
}

/**
 * The same list of cards with their art attached, for the codex modules to
 * wrap their own arrays in. A card that has no picture keeps `art_url: null`
 * rather than losing the field, so a reader never has to guess whether the
 * absence is missing art or a missing lookup.
 */
export function withArt(cards) {
  return cards.map((card) => ({ ...card, art_url: artFor(card.id) }));
}
