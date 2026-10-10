/**
 * Starting above level 1, held to what it promises.
 *
 * The Free Hand makes a character at a level of the player's choosing and hands
 * over what the levels would have bought on the way: coins, potions, a tier of
 * armor and a ring. Each of those is a number read off the level in
 * src/lib/startingLevel.js, and every one of them can go quietly wrong: a tier
 * with no pieces behind it, a ring whose enchantment moves nothing, a start
 * that lands on the wrong side of a threshold. This makes a character at every
 * level the enlist box offers and reads the sheet back.
 *
 *   node scripts/check-start.mjs        report and exit 1 on any finding
 *   node scripts/check-start.mjs --list print every case, then exit 0
 */

import {
  ARMOR_TIERS,
  BASE_ARMOR_RARITY,
  COINS_PER_LEVEL,
  POTION_ID,
  RING_BASE,
  RING_CHOICES,
  RING_LEVEL,
  STARTING_LEVEL_MAX,
  STARTING_LEVEL_MIN,
  clampStartingLevel,
  grantsRing,
  madeAtLevel,
  ringChoice,
  startingArmorRarity,
  startingCoins,
  startingGrants,
  startingLevels,
  startingPatch,
  startingPotions,
  startingRing,
} from '../src/lib/startingLevel.js';
import { CREATION_PATHS, DEFAULT_PATH, creationPath } from '../src/lib/creationPaths.js';
import { BLANK_CHARACTER, liveCharacter } from '../src/lib/characterModel.js';
import { MAX_LEVEL, XP_TABLE, levelForXp } from '../src/lib/levels.js';
import { BACKGROUNDS, normalizeKit } from '../src/lib/backgrounds.js';
import { getEnchantment } from '../src/lib/enchantments.js';
import {
  armorSetOptions,
  getItem,
  heldItem,
  itemRarity,
  normalizeEquipment,
  startingWeapons,
} from '../src/lib/items.js';
import { ARMOR_ORDER, buildKitPatch, buildReturnPatch } from '../src/lib/kit.js';
import { openChoices } from '../src/lib/levelPicks.js';

const LIST = process.argv.includes('--list');
const findings = [];

function check(what, got, want) {
  const same = JSON.stringify(got) === JSON.stringify(want);
  if (LIST) console.log(`  ${same ? 'ok  ' : 'FAIL'} ${what}${same ? '' : `  got ${JSON.stringify(got)}`}`);
  if (!same) findings.push({ what, got, want });
}

function section(title) {
  if (LIST) console.log(`\n===== ${title} =====`);
}

/* ------------------------------------------------------------- the chooser */

section('the ways in');
{
  const first = CREATION_PATHS[0];
  check('the Walkthrough is the first card', first.key, 'guided');
  check('and it is built', first.ready, true);
  check('and it is the one recommended', first.recommended, true);
  check('and the way in the URL falls back to', DEFAULT_PATH, 'guided');
  check('an unknown key falls back to it', creationPath('no-such-path').key, 'guided');

  const free = CREATION_PATHS.find((path) => path.key === 'freeform');
  check('the Free Hand is offered', Boolean(free), true);
  check('and built', free?.ready, true);
  check('and is the one that asks for a level', free?.asksLevel, true);
  check(
    'no other path asks for one',
    CREATION_PATHS.filter((path) => path.asksLevel).map((path) => path.key),
    ['freeform']
  );
}

/* -------------------------------------------------------------- the ladder */

section('the ladder');
{
  check('the Free Hand starts above level 1', STARTING_LEVEL_MIN, 2);
  check('and stops at the cap', STARTING_LEVEL_MAX, MAX_LEVEL);
  check('the levels offered', startingLevels(), [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  check('a typed level is clamped low', clampStartingLevel(0), STARTING_LEVEL_MIN);
  check('and high', clampStartingLevel(99), STARTING_LEVEL_MAX);
  check('and garbage is the floor', clampStartingLevel('x'), STARTING_LEVEL_MIN);

  check('1,000 coins a level', COINS_PER_LEVEL, 1000);
  check('level 1 is handed nothing', startingCoins(1), 0);
  check('level 2 is handed 2,000', startingCoins(2), 2000);
  check('level 6 is handed 6,000', startingCoins(6), 6000);
  check('level 12 is handed 12,000', startingCoins(12), 12000);

  check(
    'a potion for every two levels above the first',
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(startingPotions),
    [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]
  );

  check(
    'Common below 6, Rare from 6, Epic from 10',
    [1, 2, 5, 6, 7, 9, 10, 11, 12].map(startingArmorRarity),
    ['Common', 'Common', 'Common', 'Rare', 'Rare', 'Rare', 'Epic', 'Epic', 'Epic']
  );
  check('the base tier is Common', BASE_ARMOR_RARITY, 'Common');
  check(
    'the tiers are listed highest first',
    ARMOR_TIERS.map((tier) => tier.level),
    [...ARMOR_TIERS.map((tier) => tier.level)].sort((a, b) => b - a)
  );

  check('the ring arrives at level 8', RING_LEVEL, 8);
  check('and not before', [7, 8, 12].map(grantsRing), [false, true, true]);
}

/* ---------------------------------------------------------------- the ring */

section('the ring');
{
  const base = getItem(RING_BASE);
  check('the base is a codex trinket', base?.slots, ['trinket']);
  check('and a ring', base?.tags?.includes('Ring'), true);

  check(
    'one ring an attribute',
    RING_CHOICES.map((choice) => choice.key).sort(),
    ['instinct', 'mind', 'physique']
  );
  for (const choice of RING_CHOICES) {
    const ench = getEnchantment(choice.ench);
    check(`${choice.name}: its enchantment exists`, Boolean(ench), true);
    check(`${choice.name}: and raises the attribute by one`, ench?.attributes, { [choice.key]: 1 });
    check(`${choice.name}: and is found by key`, ringChoice(choice.key)?.ench, choice.ench);
  }
  check('an unknown key is no ring', ringChoice('luck'), null);
}

/* -------------------------------------------------------- every armor tier */

section('every set has three pieces at every tier');
{
  for (const rarity of ['Common', 'Rare', 'Epic']) {
    const sets = armorSetOptions(rarity);
    check(`${rarity}: three sets`, sets.length, 3);
    for (const set of sets) {
      check(
        `${rarity}: ${set.name} is ${rarity} in every slot`,
        ARMOR_ORDER.map((slot) => itemRarity(getItem(set.pieces[slot]))),
        [rarity, rarity, rarity]
      );
    }
  }
  check('the default is still Common', armorSetOptions()[0].pieces, armorSetOptions('Common')[0].pieces);
}

/* -------------------------------------------------------------- the kit tier */

section('the kit dresses you at the tier');
{
  const background = BACKGROUNDS[0];
  const weapons = startingWeapons()
    .slice(0, background.kit.weapons)
    .map((weapon) => weapon.id);

  for (const rarity of ['Common', 'Rare', 'Epic']) {
    const armorSet = armorSetOptions(rarity)[0].name;
    const dressed = {
      ...BLANK_CHARACTER,
      ...buildKitPatch({ character: BLANK_CHARACTER, background, armorSet, weapons, rarity }),
    };
    const worn = normalizeEquipment(dressed.equipment);
    check(
      `${rarity}: the three worn pieces are ${rarity}`,
      ARMOR_ORDER.map((slot) => itemRarity(getItem(worn[slot]))),
      [rarity, rarity, rarity]
    );
    const receipt = normalizeKit(dressed.background_kit);
    check(`${rarity}: the receipt says so`, receipt.rarity, rarity);

    const returned = { ...dressed, ...buildReturnPatch({ character: dressed, kit: receipt }).patch };
    check(
      `${rarity}: and hands back all three`,
      ARMOR_ORDER.map((slot) => normalizeEquipment(returned.equipment)[slot]),
      [null, null, null]
    );
  }

  const old = normalizeKit({ background: 'x', armorSet: 'Light Armor', weapons: [] });
  check('a receipt written before tiers reads as Common', old.rarity, 'Common');
}

/* ------------------------------------------------------ a start at every level */

section('a character made at every level the box offers');
{
  for (const level of startingLevels()) {
    const ring = grantsRing(level) ? 'mind' : null;
    const made = { ...BLANK_CHARACTER, name: 'Fixture', ...startingPatch(BLANK_CHARACTER, level, { ring }) };

    check(`level ${level}: stands on the threshold`, made.xp, XP_TABLE[level]);
    check(`level ${level}: and reads as that level`, levelForXp(made.xp), level);
    check(`level ${level}: the column agrees`, made.level, level);
    check(`level ${level}: the coins`, made.wealth, level * COINS_PER_LEVEL);
    check(
      `level ${level}: the potions are in the pack`,
      made.pack.filter((id) => id === POTION_ID).length,
      startingPotions(level)
    );
    check(`level ${level}: and nothing else is`, made.pack.length, startingPotions(level));

    const notes = made.ledger.map((row) => [row.kind, row.note, row.delta]);
    check(`level ${level}: two ledger lines under one note`, notes, [
      ['wealth', `Made at level ${level}`, level * COINS_PER_LEVEL],
      ['xp', `Made at level ${level}`, XP_TABLE[level]],
    ]);
    check(`level ${level}: the note reads back`, madeAtLevel(made), level);

    const worn = startingRing(made);
    check(`level ${level}: a ring iff level ${RING_LEVEL} or more`, Boolean(worn), grantsRing(level));
    if (worn) {
      check(`level ${level}: it is the ring chosen`, worn.key, ring);
      check(`level ${level}: and it is on`, made.trinkets, [worn.id]);
      const item = heldItem(made, worn.id);
      check(`level ${level}: it resolves to a worked Silver Ring`, [item?.forged, item?.name], [RING_BASE, 'Ring of Mind']);
      check(`level ${level}: wearing Mental Focus`, item?.enchants, [{ id: 'mental-focus' }]);
      check(`level ${level}: and the sheet shows the point`, liveCharacter(made).mind, made.mind + 1);
    } else {
      check(`level ${level}: nothing is worn`, made.trinkets ?? [], []);
    }

    /* Every level up to this one asks: the four of level 1, a talent on each
       even level and two things on each odd one. */
    let asks = 4;
    for (let n = 2; n <= level; n += 1) asks += n % 2 === 0 ? 1 : 2;
    check(`level ${level}: the ledger asks for everything up to it`, openChoices(made, level), asks);

    const rows = startingGrants(level, ring).map((row) => row.id);
    check(
      `level ${level}: the rows say what was handed over`,
      rows,
      [
        'coins',
        ...(startingPotions(level) > 0 ? ['potions'] : []),
        'armor',
        ...(grantsRing(level) ? ['ring'] : []),
      ]
    );
  }

  /* A level 8 start with no ring named mints nothing, and says the choice is open. */
  const bare = startingPatch(BLANK_CHARACTER, 8);
  check('level 8 without a ring mints none', bare.forged, undefined);
  check('and the row says the choice is open', startingGrants(8).find((row) => row.id === 'ring')?.label, 'An enchanted ring');

  /* A character who climbed the ordinary way was made at no level. */
  check('a blank was made at no level', madeAtLevel(BLANK_CHARACTER), null);
  check('and wears no starting ring', startingRing(BLANK_CHARACTER), null);
}

/* --------------------------------------------------------------- verdict */

if (findings.length > 0) {
  console.error(`\n${findings.length} finding${findings.length === 1 ? '' : 's'}:`);
  for (const finding of findings) {
    console.error(`  ${finding.what}\n    got  ${JSON.stringify(finding.got)}\n    want ${JSON.stringify(finding.want)}`);
  }
  process.exit(1);
}

console.log(LIST ? '\nall clear' : 'start: all clear');
