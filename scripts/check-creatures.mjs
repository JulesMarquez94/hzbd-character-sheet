/**
 * The bestiary, proved. Covers the promises src/lib/creatures.js makes:
 * **the Blightgeist reproduces its own printed page from the curve, a primary
 * attribute reaches 12 at level 12, a hit die averages the Health beside it at
 * every level, a Minion cannot be handed a Reaction Point, and every ability a
 * creature holds rides the creature's best attribute with the article to
 * match.**
 *
 *   node scripts/check-creatures.mjs         report and exit 1 on any finding
 *   node scripts/check-creatures.mjs --list  print the bestiary and the census
 *
 * The risk this covers changed shape when the creatures learned to scale. A
 * creature used to be twenty printed numbers, and the risk was one of them being
 * missing. It is now a *shape* plus a handful of coefficients, and the risk is
 * that the shape is subtly wrong somewhere nobody looks: at level 12, or at
 * level 1, or on the one creature that was transcribed rather than invented.
 *
 * So the first section is the one that matters most. The Blightgeist's page is
 * the only ground truth in the whole file, and the curve has to hand it back.
 */

import { readFileSync } from 'node:fs';
import {
  CREATURES,
  CREATURE_CARDS,
  CREATURE_MAX_LEVEL,
  RANKS,
  bestiary,
  clampCreatureLevel,
  clearForged,
  creatureAttributes,
  creatureCards,
  creatureMoves,
  creaturePassives,
  creatureStats,
  creatureWards,
  difficultyLine,
  getCreature,
  getCreatureArmor,
  getRank,
  isForgedId,
  registerForged,
} from '../src/lib/creatures.js';
import {
  addFoes,
  encounterState,
  foeActor,
  foeModifiers,
  foeOwns,
  previewFoe,
  setFoeLevel,
} from '../src/lib/encounters.js';
import { HIGHEST, highestAttribute } from '../src/lib/attributes.js';
import { cardGist, castArticles } from '../src/lib/cardText.js';
import { foeBar } from '../src/lib/combatBar.js';
import { rollPlan } from '../src/lib/rollPlan.js';
import {
  FORGED_LORE_MAX,
  FORGED_NAME_MAX,
  blankBody,
  hydrateCreature,
  normalizeBody,
} from '../src/lib/customCreatures.js';
import { CREATURE_SLOTS, can, canForgeCreature } from '../src/lib/tiers.js';
import { getCard } from '../src/lib/weapons.js';

const LIST = process.argv.includes('--list');
const findings = [];
const note = (what, said) => findings.push(`  ${what}\n    ${said}`);

function check(what, got, want) {
  const same = JSON.stringify(got) === JSON.stringify(want);
  if (LIST) console.log(`  ${same ? 'ok  ' : 'FAIL'} ${what}${same ? '' : `  got ${JSON.stringify(got)}`}`);
  if (!same) note(what, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

function section(title) {
  if (LIST) console.log(`\n===== ${title} =====`);
}

/* ============================================ the one page that is ground truth */

section('the Blightgeist reproduces its own printed page at level 1');
{
  /* Every number on data/Source Temp/Hazebound/Creatures/Creature -
     Blightgeist.jpg, except the RP the Minion rule overrides. Nothing below is
     stored on the creature any more: all of it comes out of the curve, the two
     conversions and the Defense bonus, so this is the check that says the shape
     is right rather than that somebody typed the numbers in. */
  const page = {
    physique: 2,
    instinct: 2,
    mind: 5,
    avoid: 8,
    health_max: 8,
    /* The page also printed "(3d4)" beside that Health. Health is not rolled
       any more (Jules, 2026-09-02), so the die is not part of the page and its
       own section below is what proves it is gone. */
    willpower_max: 8,
    ap_max: 6,
    // The page prints 3. A Minion cannot take reactions, and the rule wins.
    reaction_max: 0,
    speed_m: 3,
    initiative: 3,
  };

  const geist = getCreature('blightgeist');
  const stats = creatureStats(geist, 1);

  for (const [line, want] of Object.entries(page)) {
    const got = line in stats.attributes ? stats.attributes[line] : stats[line];
    check(`the page's ${line}`, got, want);
  }

  check('and the Difficulty line it heads with', difficultyLine(geist, 1), 'Minion - Level 1 - 10 XP');
}

/* ================================================================== the curve */

section('the curve is the character\'s own');
{
  /* A character starts at 4, takes +2 and +1 at level 1, and +1 on two
     attributes at every odd level after. Read against a creature with no bonus
     at all, that is exactly what should come out. */
  const plain = { primary: 'mind', secondary: 'instinct', bonus: {} };

  check('at level 1: base 4, +2 and +1', creatureAttributes(plain, 1), {
    physique: 4,
    instinct: 5,
    mind: 6,
  });
  check('level 2 grants nothing', creatureAttributes(plain, 2), creatureAttributes(plain, 1));
  check('level 3 grants one to each', creatureAttributes(plain, 3), {
    physique: 4,
    instinct: 6,
    mind: 7,
  });
  check('and by 12 the primary is at 11', creatureAttributes(plain, 12).mind, 11);
  check('the third attribute never moves', creatureAttributes(plain, 12).physique, 4);

  /* Which is the whole reason `bonus` exists on the primary: it is the step from
     a character's ceiling to the twelve Jules asked for. */
  const capped = { ...plain, bonus: { mind: 1 } };
  check('a +1 bonus carries the primary to 12 at level 12', creatureAttributes(capped, 12).mind, 12);

  check('nothing falls below 1, however deep the bonus', creatureAttributes(
    { primary: 'mind', secondary: 'instinct', bonus: { physique: -9 } },
    1
  ).physique, 1);

  check('a level below 1 reads as 1', creatureAttributes(plain, 0), creatureAttributes(plain, 1));
  check('and a level above the cap reads as the cap', creatureAttributes(plain, 40), creatureAttributes(plain, 12));
  check('the cap is twelve', [clampCreatureLevel(99), CREATURE_MAX_LEVEL], [12, 12]);
}

section('most of the bestiary reaches 12 at level 12');
{
  const capped = CREATURES.filter(
    (creature) => creatureStats(creature, 12).attributes[creature.primary] >= 12
  );
  /* "most enemy should have a strong stat that reach 12 the max at the same time
     they hit level 12", so more than half of them, and every General and every
     Overlord. A Minion topping out lower is the point of being a Minion. */
  check('more than half of them do', capped.length * 2 > CREATURES.length, true);

  for (const creature of CREATURES) {
    if (creature.rank === 'minion') continue;
    const top = creatureStats(creature, 12).attributes[creature.primary];
    if (top < 12) note(creature.id, `is a ${creature.rank} whose ${creature.primary} tops out at ${top}`);
  }
}

/* ---------------------------------------------------- Health is not rolled */

section('nothing rolls a creature Health');
{
  /* Jules, 2026-09-02: "Health is not rolled." There used to be a whole section
     here proving that a derived hit die averaged the Health beside it at every
     level, for every creature. The ruling deleted the die rather than the
     arithmetic, so what is left to check is that it is really gone: a stat block
     that grew one back would print a roll on every enemy block on the site. */
  const stats = creatureStats(getCreature('blightgeist'), 1);
  check('no stat block carries a die', 'hit_die' in stats, false);
  check('and no creature carries one to derive from', CREATURES.some((c) => 'die' in c), false);
  check('Health is the conversion and nothing else', stats.health_max, 8);
}

/* ------------------------------------------------------------ the armor family */

section('an armor family changes what Defense is made of');
{
  /* The three families are the character's own full-set rules (docs/rulebook.md
     7.2), which is why they are checked against the creature's own Reflex and
     Grit rather than against numbers typed in here. */
  const base = {
    ...blankBody('general'),
    name: 'Test Dummy',
    level: 4,
    primary: 'physique',
    secondary: 'instinct',
    bonus: { physique: 0, instinct: 0, mind: 0 },
    avoid_bonus: 2,
    armor: 6,
  };

  const bare = creatureStats({ ...base, armor_set: 'none' }, 4);
  check('with no family, Defense is Instinct plus the bonus', bare.avoid, bare.attributes.instinct + 2);

  const light = creatureStats({ ...base, armor_set: 'light' }, 4);
  check('Light reads off Reflex', light.avoid, light.reflex + 2);

  const magic = creatureStats({ ...base, armor_set: 'magic' }, 4);
  check('Magic reads off Grit', magic.avoid, magic.grit + 2);

  /* Heavy is the one that stacks rather than replaces: Instinct, the bonus, and
     half of the whole Armor. Six Armor is three points of Defense. */
  const heavy = creatureStats({ ...base, armor_set: 'heavy' }, 4);
  check('Heavy adds half its Armor', heavy.avoid, heavy.attributes.instinct + 2 + 3);
  check('and the Armor itself is untouched', heavy.defense, 6);

  /* The bonus is added whatever the family, which is the rulebook's second
     ruling: a set bonus changes what Defense is built from and does not close
     the door on everything else. */
  check(
    'the bonus lands on every family',
    [bare, light, magic, heavy].map((s) => s.avoid - creatureStats({ ...base, avoid_bonus: 0, armor_set: s.armor.id }, 4).avoid),
    [2, 2, 2, 2]
  );

  check('an unknown family reads as none', getCreatureArmor('plate').id, 'none');
  check('and every printed page wears none', CREATURES.map((c) => getCreatureArmor(c).id), Array(CREATURES.length).fill('none'));
}

/* ------------------------------------------------------ the three rank rules */

section('a Minion cannot be handed a Reaction Point');

for (const creature of CREATURES) {
  const rank = getRank(creature);
  const stats = creatureStats(creature, creature.level);

  if (!rank.reacts && stats.reaction_max !== 0) {
    note(creature.id, `is a ${rank.label} with ${stats.reaction_max} Reaction Points`);
  }
  if (rank.reacts && stats.reaction_max <= 0) {
    note(creature.id, `is a ${rank.label} and can react, but has no Reaction Points`);
  }
}

/* The rule stated as data has to survive a page that argues with it. The
   Blightgeist's own sheet prints RP: 3 and it is a Minion, which is exactly the
   case this forces to zero. */
{
  const forced = creatureStats({ rank: 'minion', reaction_max: 3, primary: 'mind' }, 1);
  check('a printed Reaction Point on a Minion is forced to zero', forced.reaction_max, 0);
}

section('the ranks say what Jules said they say');
{
  const by = Object.fromEntries(RANKS.map((rank) => [rank.id, rank]));
  check('a Minion has no reactions', [by.minion.reaction, by.minion.reacts], [0, false]);
  check('a General runs on a player clock', [by.general.ap, by.general.reaction], [6, 6]);
  check('an Overlord acts on twelve', by.overlord.ap, 12);
  check('and gains three a player turn', by.overlord.perPlayerTurn, 3);
  check('nobody else gains any', [by.minion.perPlayerTurn, by.general.perPlayerTurn], [0, 0]);
}

/* --------------------------------------------------------------- the cards */

section('every card a creature names is a card, and reaches the codex');

for (const creature of CREATURES) {
  for (const id of creature.cards ?? []) {
    if (!getCard(id)) note(creature.id, `names a card "${id}" that getCard cannot find`);
  }

  const held = creatureCards(creature);
  if (held.length !== (creature.cards ?? []).length) {
    note(creature.id, `names ${(creature.cards ?? []).length} cards and resolves ${held.length}`);
  }
  if (creatureMoves(creature).length === 0) {
    note(creature.id, 'has nothing it can play. Every creature gets at least one move.');
  }
}

/* A ward is a passive and never a move: it is switched at the table rather than
   paid for, so one carrying a price would draw a chip nobody should be able to
   tap. */
for (const card of CREATURE_CARDS) {
  if (card.ward && card.kind !== 'passive') {
    note(card.id, 'carries a ward and is not a passive');
  }
  if (card.ward && !card.while) {
    note(card.id, 'carries a ward with no `while` sentence for the row to print');
  }
  if (card.kind === 'passive' && (card.ap || card.wp)) {
    note(card.id, 'is a passive with a price on it');
  }
  if (!(card.tags ?? []).includes('Creature')) {
    note(card.id, 'is a creature card and is not tagged Creature');
  }
}

section('the wards are the environmental passives and nothing else');
{
  const warded = CREATURES.filter((creature) => creatureWards(creature).length > 0);
  check('some creatures carry one', warded.length > 0, true);
  check(
    'and every one of them is a passive on that creature',
    warded.every((creature) =>
      creatureWards(creature).every((card) => creaturePassives(creature).includes(card))
    ),
    true
  );

  /* "All of them can have passive that are environmental based", Jules, and
     "all" is the word this holds the codex to. The lich is the example he gave
     and every Overlord carries one, but a ward is not an Overlord's privilege:
     at least one other rank has to have one, or the next reader will take the
     example for the rule. */
  const ranks = new Set(warded.map((creature) => creature.rank));
  check('and a ward is not an Overlord privilege', ranks.size > 1, true);
}

/* ---------------------------------------------------- a page with no numbers */

section('nothing that scales is stored as a number on a creature');
{
  /* The whole point of the rewrite: a creature carries a shape, not a stat
     block. A stray `health_max` or `mind` left on one would be a number that
     silently stopped tracking the level. */
  const banned = ['physique', 'instinct', 'mind', 'health_max', 'willpower_max', 'avoid', 'grit', 'reflex'];
  for (const creature of CREATURES) {
    for (const field of banned) {
      if (field in creature) note(creature.id, `still carries a hard \`${field}\`, which no longer scales`);
    }
    for (const field of ['primary', 'secondary', 'health', 'willpower']) {
      if (creature[field] === undefined) note(creature.id, `has no \`${field}\``);
    }
    if (!['physique', 'instinct', 'mind'].includes(creature.primary)) {
      note(creature.id, `primary "${creature.primary}" is not an attribute`);
    }
  }
}

/* ------------------------------------------------------- an instance of one */

section('a creature dressed as an enemy reads like a character');

for (const creature of CREATURES) {
  const foe = previewFoe(creature);
  if (!foe) {
    note(creature.id, 'cannot be laid down as an enemy at all');
    continue;
  }

  /* Absent is full. Nothing is written for a preview, so every pool has to come
     back at its ceiling except the two that start empty. */
  check(`${creature.id}: arrives at full Health`, foe.health, foe.stats.health_max);
  check(`${creature.id}: and full Action Points`, foe.ap, foe.stats.ap_max);
  check(`${creature.id}: and full Willpower`, foe.willpower, foe.stats.willpower_max);
  check(`${creature.id}: with no Shield and no Reactions`, [foe.shield, foe.reaction], [0, 0]);

  const actor = foeActor(foe);
  if (!Number.isFinite(actor.willpower_max)) note(creature.id, 'has no Willpower ceiling as an actor');
  if (actor.name !== foe.title) note(creature.id, 'signs its actions with the wrong name');
  for (const key of ['physique', 'instinct', 'mind']) {
    if (actor[key] !== foe.attributes[key]) {
      note(creature.id, `plays its cards off the wrong ${key}`);
    }
  }
}

/* ------------------------------------------ the best attribute, and the article
 *
 * "Bestiary abilities for entities always use their best attribute" (Jules,
 * 2026-09-03). Two things have to be true for that to be a rule and not a
 * rewrite: the card keeps its printed stat, and what is *read* off it is the
 * creature's best one. And then the article has to follow, because the codex
 * bakes "a" or "an" into the body against the stat the card was written with.
 */
section('a creature rolls its best attribute, whatever its card printed');
{
  const foe = previewFoe(getCreature('fenrat-skirmisher'));
  const actor = foeActor(foe);
  const best = highestAttribute(actor);
  const mods = foeModifiers(actor);

  check('the rider is the rule and not a key', mods.stat, HIGHEST);
  check('Instinct is the Skirmisher\u2019s best', best, 'instinct');

  const bite = foe.moves.find((card) => card.id === 'gnashing-bite');
  check('and the card still prints what it was written with', bite.stat, 'physique');

  const rolled = rollPlan(bite, actor, mods).find((link) => link.shape === 'check');
  const printed = rollPlan(bite, actor).find((link) => link.shape === 'check');
  check('the swing rides the best one', rolled.flat, actor[best]);
  check('and would have ridden the printed one', printed.flat, actor.physique);

  /* The article, which is the one thing a stat swap can leave ungrammatical. */
  const said = cardGist(bite, { modifiers: mods });
  check('the article agrees with what is printed', said.startsWith('Make an Instinct'), true);
  check(
    'and it is left alone where nothing moved',
    cardGist(bite, { character: actor }).startsWith('Make a Physique'),
    true
  );
  check(
    'the article opens a sentence in its own case',
    castArticles('A {stat} Roll follows. Make a {stat} check', 'instinct'),
    'An {stat} Roll follows. Make an {stat} check'
  );
  check(
    'and comes back down for the other two',
    castArticles('Make an {stat} Roll', 'mind'),
    'Make a {stat} Roll'
  );

  /* A basic action is nobody's ability: a Shove is a Physique roll for a goblin
     the same as for a knight, so the bar hands it no rider. */
  const bar = foeBar({ ...foe, actor });
  const basics = bar.find((group) => group.id === 'basic');
  check('the basic actions ride at their printed attribute', basics.moves.every((move) => !move.modifiers?.stat), true);
  check('and its own cards all ride the rider', bar[0].moves.every((move) => move.modifiers?.stat === HIGHEST), true);

  /* And a row on its tracker may be somebody else's spell, which the rider must
     not reach. See foeOwns. */
  check('it owns the card it was printed with', foeOwns(foe, 'gnashing-bite'), true);
  check('and owns nothing a caster laid on it', foeOwns(foe, 'fireball'), false);
}

section('an enemy scales where it stands');
{
  const enc = { foes: [{ key: 'a', creature: 'blightgeist', level: 1 }] };
  const one = encounterState(enc)[0];
  check('level 1 is the page', [one.health_max ?? one.stats.health_max, one.attributes.mind], [8, 5]);
  check('and it knows it is unscaled', one.scaled, false);

  const up = { ...enc, ...setFoeLevel(enc, 'a', 9) };
  const nine = encounterState(up)[0];
  check('level 9 is a bigger Blightgeist', nine.stats.health_max > one.stats.health_max, true);
  check('and it says it has been moved', nine.scaled, true);
  check('every pool comes back full at the new level', [nine.health, nine.ap, nine.willpower], [
    nine.stats.health_max,
    nine.stats.ap_max,
    nine.stats.willpower_max,
  ]);
  check('a Minion still has no reactions at level 9', nine.stats.reaction_max, 0);
  check('setting the level it already holds writes nothing', setFoeLevel(up, 'a', 9), null);
  check('and a level past the cap clamps', encounterState({ ...enc, ...setFoeLevel(enc, 'a', 99) })[0].level, 12);
}

section('several of one creature are told apart, and one is not numbered');
{
  const many = encounterState({
    foes: [
      { key: 'a', creature: 'blightgeist' },
      { key: 'b', creature: 'blightgeist' },
      { key: 'c', creature: 'vaultkeeper-lich' },
    ],
  });
  /* The number rides in front, where a scanning eye finds it. Jules,
     2026-09-01: "they get named 1.Fenrat 2.Fenrat". */
  check('the pair are numbered', [many[0].title, many[1].title], ['1.Blightgeist', '2.Blightgeist']);
  check('the lone one is not', many[2].title, 'Vaultkeeper Lich');
}

/* --------------------------------------------------------------- the shelf */

section('the bestiary comes out in rank order');
{
  const order = bestiary().map((creature) => RANKS.findIndex((rank) => rank.id === creature.rank));
  check('rank never goes backwards', order.every((at, n) => n === 0 || at >= order[n - 1]), true);

  const filtered = bestiary('overlord');
  check('and a filtered shelf holds one rank', [...new Set(filtered.map((c) => c.rank))], ['overlord']);
}

/* ------------------------------------------------------------------ census */

section('three of each');
{
  const counts = new Map();
  for (const creature of CREATURES) counts.set(creature.rank, (counts.get(creature.rank) ?? 0) + 1);

  for (const rank of RANKS) {
    const count = counts.get(rank.id) ?? 0;
    if (LIST) console.log(`  ${rank.label.padEnd(9)} ${count}`);
    /* A guard rather than an exact count, so a creature drop does not fail this
       file for existing. What it catches is a rank left behind: a bestiary that
       grows to forty Minions and still has one Overlord is a bestiary nobody
       can build an Overlord fight from. */
    if (count === 0) note(rank.label, 'has no creatures in the bestiary at all');
  }

  if (LIST) {
    console.log(`\n  ${CREATURES.length} creatures, ${CREATURE_CARDS.length} cards between them`);
    for (const creature of bestiary()) {
      for (const level of [creature.level, 12]) {
        const s = creatureStats(creature, level);
        const a = s.attributes;
        console.log(
          `  ${(level === creature.level ? creature.name : '').padEnd(20)}` +
            `L${String(level).padStart(2)} ` +
            `P${String(a.physique).padStart(2)} I${String(a.instinct).padStart(2)} M${String(a.mind).padStart(2)} · ` +
            `DEF ${String(s.avoid).padStart(2)} · AR ${String(s.defense).padStart(2)} · ` +
            `HP ${String(s.health_max).padStart(3)} · ` +
            `WP ${String(s.willpower_max).padStart(2)} · AP ${s.ap_max} RP ${String(s.reaction_max).padStart(2)}`
        );
      }
    }
  }
}

/* ------------------------------------------------------------ forged creatures

   The forge's own promises. A forged creature is a row in the database rather
   than a page in creatures.js, and the whole design rests on nothing downstream
   being able to tell: `getCreature` finds it, `creatureStats` gives it numbers,
   `previewFoe` draws it, the shelf lists it. Each of those is one line here.

   The riskiest of them is the last section. `normalizeBody` is a trust boundary
   sitting in front of jsonb a client wrote, so it is handed rubbish on purpose.
*/

section('a forged creature answers like a printed one');
{
  /* One built the way the forge builds it: a blank body, named, taught two
     cards, and hydrated as if it had come back off a row. */
  const row = {
    id: '11111111-2222-3333-4444-555555555555',
    user_id: 'nobody',
    scope: 'personal',
    body: {
      ...blankBody('general'),
      name: 'Bogwood Revenant',
      type: 'Large Plant',
      level: 4,
      primary: 'physique',
      secondary: 'mind',
      bonus: { physique: 1, instinct: -2, mind: 0 },
      /* One off a creature's page and one a character plays, which is the whole
         of "it should be able to learn any ability the player can use". */
      cards: ['grave-cleave', 'blightbolt'],
    },
  };

  const made = hydrateCreature(row);
  registerForged([made]);

  check('its id is prefixed', made.id, 'custom:11111111-2222-3333-4444-555555555555');
  check('and reads as forged', isForgedId(made.id), true);
  check('getCreature finds it', getCreature(made.id)?.name, 'Bogwood Revenant');
  check('the shelf holds it beside the printed ones', bestiary().length, CREATURES.length + 1);
  check('and its rank filter finds it', bestiary('general').some((c) => c.forged), true);

  /* The cards are resolved on the way in, because creatures.js cannot reach the
     registry that holds them. Both halves have to come back as cards. */
  check('it plays what it was taught', creatureMoves(made).map((card) => card.name), [
    'Grave Cleave',
    'Blightbolt',
  ]);

  /* And the same arithmetic. Physique is the main with +1 of its own, so it is
     4 + 2 + 1 at level 4 (one odd-level climb) and 12 at level 12: the ceiling
     the whole curve is built around. */
  check('its attributes come off the curve', creatureAttributes(made, 4), {
    physique: 8,
    instinct: 2,
    mind: 6,
  });
  check('and its main reaches 12 at level 12', creatureAttributes(made, 12).physique, 12);

  const stats = creatureStats(made, 4);
  check('Health is its own conversion', stats.health_max, 6 * 4 + 6 * 8);

  /* The bestiary draws it with the block an encounter draws, off a creature
     object rather than an id, so a creature that is not registered at all still
     previews. That is what the forge's live readout needs. */
  const draft = { ...made, id: undefined, name: 'Unregistered' };
  check('an unregistered draft still previews', previewFoe(draft, 6)?.title, 'Unregistered');
  check('and a registered one previews at its own level', previewFoe(made)?.level, 4);

  /* An encounter names it by id, and the id survives the round trip that would
     drop a creature this build has never heard of. */
  const enc = addFoes({ foes: [] }, made.id, 2, 5);
  const laid = encounterState(enc);
  check('an encounter can hold two of it', laid.length, 2);
  check('and numbers them', laid.map((foe) => foe.title), ['1.Bogwood Revenant', '2.Bogwood Revenant']);
  check('at the level it was added at', laid[0].level, 5);

  clearForged();
  check('and it is gone when the registry is emptied', getCreature(made.id), null);
  check('leaving the printed shelf alone', bestiary().length, CREATURES.length);

  /* And the finding this pins, which cost a curtain that looked stuck open: with
     the registry empty the *encounter* reads back short. Nothing throws and
     nothing says so, the two Revenants are simply not in the list, so a reader
     that draws an encounter before it has filled the registry draws fewer
     enemies than are on the table. It is why FightProvider fills the registry
     before it reads a shared encounter, and again every time the curtain
     moves. */
  check('an unfilled registry reads the encounter short', encounterState(enc).length, 0);
}

section('a Minion forged with reactions still cannot take one');
{
  const row = {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    user_id: 'nobody',
    scope: 'codex',
    /* Six Reaction Points typed into the form on purpose. The rule is the
       creature's rather than the rank's default, so it has to win over a stored
       number as well as over a rank. */
    body: { ...blankBody('minion'), name: 'Fen Wisp', reaction_max: 6 },
  };
  const made = hydrateCreature(row);
  registerForged([made]);

  check('the body keeps what was typed', made.reaction_max, 6);
  check('and the creature still has none', creatureStats(made, 3).reaction_max, 0);
  check('a published one reads as codex', made.scope, 'codex');
  clearForged();
}

section('the body is cleaned before anything reads it');
{
  /* Everything a client could send that a creature must not become. */
  const dirty = normalizeBody({
    name: '   ' + 'x'.repeat(200),
    type: '',
    rank: 'archfiend',
    level: 99,
    xp: -40,
    primary: 'charisma',
    secondary: 'charisma',
    bonus: { physique: 500, instinct: 'nope', mind: -500 },
    health: { perLevel: 1e6, perPhysique: 1.55 },
    willpower: { perLevel: -3, perMind: null, flat: 1e9 },
    avoid_bonus: -7,
    armor: 'lots',
    armor_set: 'plate',
    speed_m: 999,
    /* A die a stored body might still carry from before the ruling. It must come
       back off rather than through. */
    die: 7,
    ap_max: 900,
    reaction_max: 900,
    cards: ['grave-cleave', 'grave-cleave', 'move', 'no-such-card', 42, null],
    lore: 'y'.repeat(5000),
    portrait_url: 'z'.repeat(900),
  });

  check('the name is cut to length', dirty.name.length, FORGED_NAME_MAX);
  check('an empty type line falls back', dirty.type, 'Beast');
  check('an unknown rank reads as Minion', dirty.rank, 'minion');
  check('the level is held inside twelve', dirty.level, CREATURE_MAX_LEVEL);
  check('a negative XP is floored', dirty.xp, 0);
  check('an unknown attribute falls back', [dirty.primary, dirty.secondary], ['physique', 'instinct']);
  check('a bonus is held either way', dirty.bonus, { physique: 10, instinct: 0, mind: -10 });
  check('a coefficient keeps one decimal', dirty.health.perPhysique, 1.6);
  check('and is capped', dirty.health.perLevel, 40);
  check('an unknown armor family reads as none', dirty.armor_set, 'none');
  check('and no die comes back at all', 'die' in dirty, false);
  check('the pools are capped', [dirty.ap_max, dirty.reaction_max], [30, 30]);
  check('the lore is cut', dirty.lore.length, FORGED_LORE_MAX);

  /* A card list holds real cards, once each, and never a basic action: those are
     on every bar already and a stored one would print twice. */
  check('only real cards survive', dirty.cards, ['grave-cleave']);

  /* And a body that says nothing at all is still a creature that can be drawn,
     which is what keeps a row written by an older build from white-screening a
     shelf. */
  const empty = normalizeBody(null);
  check('an empty body is still drawable', Boolean(creatureStats(empty, 1).health_max >= 1), true);
  check('and it has a name', empty.name, 'Unnamed Creature');

  /* The form starts blank on the name and only on the name, so nobody has to
     delete "Unnamed Creature" before typing. */
  check('a blank body has no name yet', blankBody().name, '');
}

section('the slot ladder says the same thing in both places');
{
  /* tiers.js is what the interface offers and public.creature_slots is what
     enforces it. Two tables that can disagree, so this reads the SQL and
     compares. The same trick would catch a campaign slot drifting, and this is
     the first time it has been worth writing. */
  const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
  const body = /create or replace function public\.creature_slots[\s\S]*?\$\$;/.exec(sql)?.[0] ?? '';

  for (const [tier, slots] of Object.entries(CREATURE_SLOTS)) {
    const said = new RegExp(`when '${tier}'\\s+then (\\d+)`).exec(body);
    /* Free and friend are the `else 0` branch rather than a case of their own,
       which is the honest way to write two zeros. */
    const want = said ? Number(said[1]) : 0;
    check(`${tier} has the same cap in the schema`, want, slots);
  }

  check('and nothing but premium and admin may forge at all', Object.entries(CREATURE_SLOTS)
    .filter(([, slots]) => slots > 0)
    .map(([tier]) => tier), ['premium', 'admin']);
  check('a free account cannot', canForgeCreature('free'), false);
  check('a premium one can', canForgeCreature('premium'), true);
  /* The one place on tiers.js where the ladder does not hold, kept honest here
     so nobody "fixes" it without reading why. See CREATURE_SLOTS. */
  check('and a friend, deliberately, cannot', canForgeCreature('friend'), false);
  check('publishing to the shared shelf is an admin', [can('premium', 'forgeCodex'), can('admin', 'forgeCodex')], [false, true]);
}

/* ------------------------------------------------------------------ report */

if (findings.length === 0) {
  console.log(
    `bestiary: ${CREATURES.length} creatures scale 1 to ${CREATURE_MAX_LEVEL}, and the Blightgeist still prints its own page`
  );
  process.exit(0);
}

console.log(`\nbestiary: ${findings.length} ${findings.length === 1 ? 'finding' : 'findings'}\n`);
for (const finding of findings) console.log(finding);
process.exit(LIST ? 0 : 1);
