/**
 * What a running effect does to the numbers.
 *
 * The tracker has always been able to hold a name, a count and a note. Three
 * kinds of row already carried a *mechanical* consequence on top of that, and
 * each was wired in on its own:
 *
 *   ench   an Ephemeral Enchantment, whose grants reach `deriveStats` through
 *          `ephemeralGrants` in enchanting.js
 *   trick  a Trickster's AMBUSH or stolen Poison, waiting on the next swing
 *   move   a Martial Move, waiting on the same swing
 *
 * Everything else on the block was a note the table read and applied by hand.
 * Which is fine for "Grappled" and wrong for GIANT GROWTH: the card says the
 * Movement Speed doubles, and a row that left the Speed tile showing 5 was the
 * sheet knowing a rule and not applying it.
 *
 * So this is the fourth rider, and the one keyed on the card itself. A card in
 * the table below is a card whose *printed text* names a number this sheet
 * already holds. Tracking it moves that number, and dropping the row moves it
 * back.
 *
 * ----------------------------------------------------------- whoever cast it
 * **A rider is keyed on the card and not on the caster.** That is the whole
 * reason it lives here rather than being applied at the moment of use: when the
 * druid across the table casts GIANT GROWTH on you, nothing has been spent on
 * your sheet and there is no use for anything to hang off. You track their
 * card, and your Speed doubles. See `trackableCards` in combatTurn.js, which is
 * what lets you reach a card you do not own.
 *
 * ------------------------------------------------------------- two channels
 * The riders split by where the number they name lives, and the split mirrors
 * the two that already existed:
 *
 *   the sheet    speed, speedFactor, defense, armor, healthMax, willpowerMax
 *                and the three attributes. Folded into `deriveStats` through
 *                the same `extra` argument an Ephemeral Enchantment uses, and
 *                mirrored term for term in statMath.js so the tooltip on a
 *                doubled Speed says which card doubled it.
 *
 *   the swing    empower, elevate, advantage, disadvantage and damage. Folded
 *                into `attackModifiers` in moves.js, beside what a Martial Move
 *                and a form already put there.
 *
 *   the damage   resist and vulnerable, by type. Read where a rolled number
 *                lands on a body rather than where it is thrown, which is
 *                `typeFactor` in combatApply.js: half for a resistance, double
 *                for a weakness, neither stacking with itself and the two
 *                cancelling, which is the rulebook's own rule (5.9).
 *
 *   against you  what an attack aimed *at* this body gets. A Wound is the
 *                whole of it: "Weapon attacks made against the entity are
 *                Empowered", which is a number on somebody else's swing. Read
 *                by whoever is aiming, off the target's own rows, and folded
 *                in `withTargets` in moves.js.
 *
 * Nothing in between. A card that changes something this sheet does not hold
 * (a skill check's subject, an area of difficult terrain) carries no rider and
 * stays a note, because a rider that lands nowhere is a promise the sheet
 * cannot keep.
 *
 * ------------------------------------------------------ and the ones you claim
 * **A clause whose condition is a fact about the table is a `claim`**, and a
 * claim is offered rather than applied. Jules, 2026-09-19: "whenever an effect
 * is conditional or not on ability, such as pack bond, the player should have an
 * option that allow them to check a box to allow the character to decide if it
 * applies or not."
 *
 * Until then every such card was left out of the table entirely, and the list at
 * its foot is mostly them: PACK BOND's adjacency, VERDANT FIELD's ground,
 * QUARRY's named prey. The sheet cannot see where anybody is standing and it
 * never will, but the player can, and asking them at the moment of use is the
 * one place the question can be answered honestly.
 *
 * So a rider entry may carry `claims`, a list of clauses each with its own
 * `when` in the card's own words. The top-level fields apply the moment the row
 * is on the block; a claim applies only when its box is ticked in the use
 * prompt, and nothing is remembered between uses because the answer changes
 * between uses. One card may carry two, which PACK BOND does: one clause about
 * where the *target* is standing and one about where *you* are.
 *
 * A claim is keyed `<row key>:<claim id>` and the ticked keys ride into
 * `runningRiders` as `claimed`. See `offeredClaims` below, and UsePrompt.jsx.
 *
 * ----------------------------------------------------- and the ones you answer
 * **A clause whose number is on somebody else's sheet carries an `ask`**, and
 * the row remembers the answer. Jules, 2026-09-20: "thing you are not sure how
 * to track add a popup for confirmation of stat when relevant."
 *
 * This is the other half of the wall the table above kept hitting. VIGOR raises
 * a maximum Health "by 3 x your Mind" and a rider is keyed on the card rather
 * than on the caster, so the sheet wearing the row is the one sheet that cannot
 * work the number out. SEVER LIFE's cut is "the damage dealt", which nobody
 * knows until the dice land. AIR CONTROL has two modes and the tracker had
 * nowhere to record which was chosen. Every one of them was left unwired with
 * that reason written beside it.
 *
 * So a rider may declare what it needs asked:
 *
 *     ask: [{ id: 'mind', label: "The caster's Mind", from: 'mind' }]
 *     healthMax: (who, row) => 3 * answerOf(row, 'mind')
 *
 * and the answer lands on the row as `values`. Three kinds of question:
 * a `number`, a `choice` between named options, and `types`, which is the
 * damage-type picker the tracker already draws for Vulnerable and Resistant.
 *
 * `from` is what makes it a *confirmation* rather than an interrogation: it
 * names the caster's own attribute, so a sheet laying the row on somebody knows
 * the number and fills it in. The reader confirms a filled box instead of being
 * asked a question they would have to go and ask somebody else.
 *
 * An unanswered question is worth nothing rather than worth zero: `measure`
 * hands back the rider unresolved and every field reading an answer is 0, which
 * is the same nothing a card with no rider has. The row says so on the block and
 * offers the popup. See `asksOf` and `openAsks` below.
 *
 * ------------------------------------------------------------ transcribed
 * Every entry quotes the clause it was read from. The clause is the design and
 * this table is only its arithmetic: if the two ever disagree, the card is
 * right. A card whose printed rule is *conditional* on something the sheet
 * cannot see is deliberately absent, and the ones that were considered and left
 * out are listed at the foot of the table with the reason.
 *
 * ------------------------------------------------------ the same-source law
 * "Unless they say otherwise, effects do not stack from the same source."
 * One card is one source however many rows of it are on the block: two GIANT
 * GROWTHS are one doubling. Deduplicated by card id on the way in, the same way
 * `grantsFrom` deduplicates a working laid twice.
 *
 * Two *different* cards are two sources and do stack. The flat numbers add and
 * the factors multiply, because "doubling" and "increased by 50%" are both
 * written against whatever the Speed already was.
 *
 * A row that has run out carries nothing. It sits on the block for the rest of
 * the turn wearing "Ended" so you can see what expired, and a thing that has
 * expired is not still bending a number.
 *
 * ------------------------------------------------------- and the one exception
 * **BERSERKER'S RAGE is measured against the holder**, and it is the only entry
 * that is. "Additional Physique equal to your Berserker Rank" scales on the sheet
 * the row is sitting on rather than on whoever cast it, and nobody but a
 * Berserker can put a Rage on you, so the number really is in front of this file.
 * A field may therefore be a function of that holder, resolved by `measure` on
 * the way past, and every other field in the table is a constant for the reason
 * above: VIGOR's "3 x your Mind" is the *caster's* Mind and stays unwired.
 *
 * This file reads one thing off a character, the rank they hold a set at, and
 * nothing else — no equipment, no codex entry, no derived stat. It imports
 * talents.js for that alone, which reaches nothing that reaches back, so
 * characterModel.js and moves.js can both still import it freely.
 */

import { statusOf } from './statuses.js';
import { normalizeTalents } from './talents.js';

/**
 * What rank this character holds a talent set at, or 0 for a set they do not
 * hold. What a measured rider is measured with.
 *
 * Read off the stored column rather than through `getTalent`, because a rank is
 * the one thing about a held set that is on the row itself: this file is read on
 * every render of the tracker and has no business resolving a codex entry to
 * learn a number that is already in front of it.
 */
function rankHeld(who, id) {
  const held = normalizeTalents(who?.talents).find((row) => row.id === id);
  return held ? Math.max(0, Math.floor(Number(held.rank) || 0)) : 0;
}

/**
 * What a row was answered with, as a number, or 0.
 *
 * The one door every measured field reads an answer through, so an unanswered
 * question is a zero in exactly one place rather than a guard on every rider.
 * Zero is the right nothing: a VIGOR nobody put a number on raises a maximum
 * Health by nothing at all, which is what an unwired VIGOR did for a year.
 */
export function answerOf(row, id) {
  const said = Number(row?.values?.[id]);
  return Number.isFinite(said) ? said : 0;
}

/** The same answer as a word, for the questions that are a choice. */
export function chosenOf(row, id) {
  const said = row?.values?.[id];
  return typeof said === 'string' && said ? said : null;
}

/* ------------------------------------------------------------- the shape */

/** A rider with nothing in it, so every caller reads the same fields. */
function noRider() {
  return {
    attributes: { physique: 0, instinct: 0, mind: 0 },
    /* The damage types this body takes half of and double of. Lists rather than
       flags, because a resistance names a type, a family or everything at once
       and two cards can each name a different one. Deduplicated on the way in,
       since the rulebook says neither stacks with itself. See coversType in
       cardText.js, and `typeFactor` in combatApply.js for where the two meet. */
    resist: [],
    vulnerable: [],
    /* And the third setting: nothing at all gets through. Written at the same
       three widths as the other two, so "immune to Fire" and HIBERNATION's
       "immune to all damage" are one field. */
    immune: [],
    /* Whole extra throws hung on this body's next attack, as VENOMOUS hangs
       one on every swing: `[{ dice, flat, damage }]`. A rider carries them
       since 2026-09-20, for SPORADIC INFUSION. */
    added: [],
    /* And what attacks made *against* this body get, which is the one channel
       written from the other side of the swing. A Wound is the whole of it
       today: "Weapon attacks made against the entity are Empowered". Read by
       whoever is aiming at this body rather than by the body itself. */
    against: { empower: 0, elevate: 0, advantage: 0, disadvantage: 0 },
    healthMax: 0,
    willpowerMax: 0,
    /* Flat metres on the Movement Speed, and the factor it is then multiplied
       by. Two fields because the codex writes both: CELERITY moves you "2
       further" and GIANT GROWTH doubles whatever you already had. */
    speed: 0,
    speedFactor: 1,
    /* Defense, meaning the stat the sheet prints as Defense. `avoid` in the
       column names, for reasons that predate this file. */
    defense: 0,
    armor: 0,
    /* What one weapon attack does differently. Same three words the rest of the
       sheet uses: Empowered adds a die, Elevate grows the die, and advantage is
       a d4 on the roll. */
    empower: 0,
    elevate: 0,
    advantage: 0,
    disadvantage: 0,
    /* Damage types that replace the weapon's own, as a list for the same reason
       `itemModifiers` keeps a list: two cards can each name one and neither of
       them is lost. */
    damage: [],
    /* Which cards contributed, so a tile and an arrow can both say why. */
    from: [],
    /* And which of the *claims* were ticked, for the receipt under the pay
       button: a die that appeared because the player said they were standing in
       the field has to say so, the same as every other fold. */
    claimed: [],
    any: false,
  };
}

/**
 * The one question two cards ask, shared because it is the same question.
 *
 * SICKNESS and BLIGHT POLLEN both leave a row on the caster *and* on whoever
 * they infected, and only one of the two is diseased. Without an answer a rider
 * would take a point off all three attributes of the person who cast it.
 */
const SIDE_OF_IT = {
  id: 'side',
  label: 'Which side of it',
  kind: 'choice',
  options: [
    { id: 'target', label: 'I am diseased', hint: 'Minus 1 to all three attributes.' },
    { id: 'caster', label: 'I cast it', hint: 'A reminder. It bends nothing on your sheet.' },
  ],
};

/** -1 where the row says this sheet is the diseased one, and nothing otherwise. */
function sideIsTarget(row) {
  return chosenOf(row, 'side') === 'target' ? -1 : 0;
}

/* ---------------------------------------------------------- the table */

/**
 * The cards whose running effect moves a number on this sheet, by card id.
 *
 * `line` is what the tracker row and the stat tooltip print. It says what the
 * card does to *this* sheet, in the fewest words that stay true, because it is
 * read at a table while something else is happening.
 */
export const EFFECT_RIDERS = {
  /* "tripling its size, doubling its Movement Speed and granting it Empowered
     for 10 turns."

     The size is the table's to picture and Empowered is defined in the glossary
     as one more die of the same kind, so the two the sheet can hold are the
     factor on the Speed and the die on the swing. */
  'giant-growth': {
    speedFactor: 2,
    empower: 1,
    line: 'Movement Speed doubled, and your damage Empowered by 1',
  },

  /* "While in this state, you gain additional Physique equal to your Berserker
     Rank. Your Damage Dice are Elevated by 1."

     **The one rider in this table measured against the character rather than
     printed**, and the only one that can be: a Rage is put on you by you, so the
     rank it scales on is on the sheet holding the row. Everything else here is a
     constant because a rider is keyed on the card and a card cannot know whose
     Mind cast it. See `measure` below.

     The compulsion is not in it and cannot be: "you attack the nearest target,
     even if it is an ally" is a rule about where people are standing, and this
     sheet does not know where anybody is. It stays on the card. */
  'berserkers-rage': {
    attributes: { physique: (who) => rankHeld(who, 'berserker') },
    elevate: 1,
    line: 'Physique raised by your Berserker Rank, and your damage Elevated by 1',
  },

  /* "The target's maximum Health rises by [[3*stat]] for the duration."

     VIGOR, and **the first rider in the table whose number is the caster's**. It
     was left out for a year with the reason written beside it: a rider is keyed
     on the card and not on the caster, so the sheet holding the row is the one
     sheet that cannot work 3 x their Mind out. The answer is to ask, and the
     caster's own sheet fills the box in on the way over. See `ask` in the
     header.

     Rounded down by the multiplication, and 0 while the question is open, which
     is exactly what an unwired VIGOR did. */
  vigor: {
    ask: [
      {
        id: 'mind',
        label: "The caster's Mind",
        hint: 'Their maximum Health rises by three times it.',
        from: 'mind',
      },
    ],
    healthMax: (who, row) => 3 * answerOf(row, 'mind'),
    line: 'Maximum Health raised by three times the caster’s Mind',
  },

  /* "its maximum Health is reduced by the damage dealt until it completes a
     Long Rest."

     SEVER LIFE, and the other half of the same wall: not a number on somebody
     else's sheet but a number *nobody* knows until the dice have landed. So the
     question has no `from` and the box opens empty, filled by whoever read the
     total off the table. */
  'sever-life': {
    ask: [
      {
        id: 'dealt',
        label: 'The damage dealt',
        hint: 'Whatever the spell came to when it landed.',
      },
    ],
    healthMax: (who, row) => -answerOf(row, 'dealt'),
    line: 'Maximum Health cut by the damage that was dealt, until a Long Rest',
  },

  /* "Drinking this elixir increases your Health and your maximum Health by
     5 x your level for 1 hour."

     LIFE DRAUGHT, and the one that needed no question at all: the scale is the
     *drinker's* level and the drinker is the sheet holding the row. It was left
     out because `runningRiders` was handed an effects list and no character, and
     that argument arrived with BERSERKER'S RAGE on 2026-09-11. This is the
     second measured rider and the first one nobody had noticed was unlocked.

     Only the maximum. The Health itself is a pool moved once, on the way down
     the flask, and a rider that moved it would move it again every render. */
  'life-draught': {
    healthMax: (who) => 5 * Math.max(0, Math.floor(Number(who?.level) || 0)),
    line: 'Maximum Health raised by five times your level',
  },

  /* "The target gains [[2d6 + 2*stat]] in Shield and +1 Defense."

     The Shield is a roll the table makes and lands in the pool by hand. The
     Defense is a point, and a point is a thing this sheet can hold. */
  barkskin: {
    defense: 1,
    line: 'Defense raised by 1 while the Shield holds',
  },

  /* "When the imbued weapon lands a hit, its damage is Empowered by 1 and the
     damage type becomes Fire."

     `weapon` is what the first three words of that clause mean. Both halves of
     this rider are about the thing in your hand, so neither reaches a spell, and
     this is the only entry in the table that has to say so: every other rider here
     names an attack, a roll or a sheet, and none of them names a weapon. See
     `weapon` in `runningRiders` below. */
  'kindle-weapon': {
    weapon: true,
    empower: 1,
    damage: ['Fire'],
    line: 'Your weapon deals Fire, Empowered by 1',
  },

  /* "On a success, you deal [[2d6 + 2*stat]] {damage} damage and it has
     disadvantage on Rolls until its next Turn End."

     The damage lands once and the disadvantage runs, so the disadvantage is the
     half of the card a row can hold. The card says Rolls and this bends the
     swing, which is the trade LUCKY CLOVER and UNLUCKY CLOVER already make and
     document below: the Attack Roll is the sheet's, the skill check is the
     table's. The turn it runs for is the card's own, so the row expires without
     anybody dropping it. */
  'exposed-nerves': {
    disadvantage: 1,
    line: 'Disadvantage on your next Attack Roll while the nerves are lit',
  },

  /* "The halo grants advantage to all actions for its duration."
     BOLSTER, and the plainest sentence in this table: no condition, no kind of
     roll named, no target named. Jules asked for it by name on 2026-09-19 ("if a
     character is bolstered he should have advantage to all roll"), and "all
     actions" is exactly the width of the `advantage` channel, which rides every
     check a card asks for. */
  bolster: {
    advantage: 1,
    line: 'Advantage on everything you roll while the halo lasts',
  },

  /* "The Crown of Shadows imposes disadvantage on all actions the entity
     attempts." SCOURGE is BOLSTER inverted, cost for cost, and the rider is the
     inversion too. */
  scourge: {
    disadvantage: 1,
    line: 'Disadvantage on everything you roll while the crown lasts',
  },

  /* "it cannot rest, cannot regain Health and has disadvantage on skill checks."

     The first two are rules about a rest and a heal, which this channel does not
     hold. The third names the kind of roll it bends, so it carries `only`: a
     skill check is a kind `rollPlan` already reads off the card's own sentence,
     and a card that names one is not talking about the swing. */
  'haunting-shadows': {
    disadvantage: 1,
    only: 'skill',
    line: 'Disadvantage on skill checks while the paranoia lasts',
  },

  /* "While the Shield holds, you cannot be moved against your will or knocked
     prone, you have resistance to physical damage and your Movement Speed is
     halved."

     Two of the four land. The resistance is the first entry in this table to use
     the damage channel and it names a *family*, which is the width the rulebook
     writes them in. The halved Speed is a factor, the way GIANT GROWTH's
     doubling is. Being unmoveable is the table's, and so is the prone refusal:
     the sheet has nothing that pushes anybody. */
  stoneflesh: {
    resist: ['Physical'],
    speedFactor: 0.5,
    line: 'Half damage from Physical, and your Movement Speed halved, while the Shield holds',
  },

  /* "While made of shadow you have resistance to all damage."
     The widest resistance in the codex, and the reason `coversType` answers to
     the word All at all. It runs "until your next Turn Start", which the tracker
     counts on its own. */
  'umbral-form': {
    resist: ['All'],
    line: 'Half damage from everything while you are made of shadow',
  },

  /* "Dense: Doubling the Action Point cost of the Move action... Light:
     Increases all entities' Movement Speed by 3."

     AIR CONTROL, and **the first question in the table that is not a number**.
     One card with two modes chosen at the moment it is cast, and the tracker had
     nowhere to record which: that was the whole reason it was left out. A choice
     is a thing a row can remember, so it does.

     Only Light lands. Doubling what a Move *costs* is not a field this sheet
     holds, any more than the Slow Fall beside it is, so the Dense mode is a row
     that says which mode it is and bends nothing. That is still worth having:
     the block says what is in the air. */
  'air-control': {
    ask: [
      {
        id: 'mode',
        label: 'Which air',
        kind: 'choice',
        options: [
          { id: 'light', label: 'Light', hint: 'Movement Speed up by 3.' },
          { id: 'dense', label: 'Dense', hint: 'A Move costs double. The sheet cannot hold that.' },
        ],
      },
    ],
    speed: (who, row) => (chosenOf(row, 'mode') === 'light' ? 3 : 0),
    line: 'Light air is 3 more Movement Speed. Dense air doubles what a Move costs, which is the table’s',
  },

  /* "On a success, the next time the target takes damage it is vulnerable to
     that damage type."

     ENBRITTLE. The type is whatever hits next, which is knowable to the table at
     the moment it matters and to nobody at the moment the row is laid. So the
     question is the same damage-type picker Vulnerable and Resistant already
     have, and the row is answered when the party decides what to throw. */
  enbrittle: {
    ask: [
      {
        id: 'types',
        label: 'Vulnerable to',
        kind: 'types',
        hint: 'Whatever damage lands on it next.',
      },
    ],
    vulnerable: 'values',
    line: 'Double damage from the next type that lands',
  },

  /* "the next time this ally lands an attack they deal an additional
     [[4d6 + 4*stat]] Decay damage."

     SPORADIC INFUSION, and the first rider to hang a whole extra *throw* on
     somebody's swing. That channel is VENOMOUS's `added`, built on 2026-09-17
     for a lineage card, and this is the second thing to use it and the first
     that is not permanent.

     Two things it needs and neither was here before: the dice are the *caster's*
     (4 x their Mind), so the row is asked, and a rider has to be able to carry an
     added throw at all. Both arrived on 2026-09-20.

     The flat half rides as `flat` beside the dice, because `4*stat` is a number
     and `4d6` is a handful, and the two are added at the table. */
  'sporadic-infusion': {
    ask: [
      {
        id: 'mind',
        label: "The caster's Mind",
        hint: 'The extra damage is 4d6 plus four times it.',
        from: 'mind',
      },
    ],
    added: (who, row) => [
      { dice: '4d6', flat: 4 * answerOf(row, 'mind'), damage: 'Decay' },
    ],
    line: 'Your next landed attack deals 4d6 and four times the caster’s Mind in Decay',
  },

  /* "On a hit, the target is diseased." / "If you do, they are also diseased."

     SICKNESS and BLIGHT POLLEN, and **the wall this mechanism was built to get
     over is the one they hit**: their Overcast and their tithe both mean the
     *caster* keeps a row too, and a rider keyed on the card would quietly take a
     point off all three of the caster's attributes for holding a reminder. The
     note at the foot of this table said what would unlock it, word for word:
     "the tracker learning which side of a card a row is on".

     A choice is that. The row says which side it is, and only the diseased side
     carries the glossary's -1. */
  sickness: {
    ask: [SIDE_OF_IT],
    attributes: {
      physique: (who, row) => sideIsTarget(row),
      instinct: (who, row) => sideIsTarget(row),
      mind: (who, row) => sideIsTarget(row),
    },
    line: 'Minus 1 to all three attributes while you are the diseased one',
  },
  'blight-pollen': {
    ask: [SIDE_OF_IT],
    attributes: {
      physique: (who, row) => sideIsTarget(row),
      instinct: (who, row) => sideIsTarget(row),
      mind: (who, row) => sideIsTarget(row),
    },
    line: 'Minus 1 to all three attributes while you are the diseased one, and no Health comes back for 5 turns',
  },

  /* "On a success it sleeps, incapacitated and immune to all damage."

     HIBERNATION, and the one card that needed the damage channel to have a third
     setting. Half is a resistance and double is a weakness; **nothing at all is
     immunity**, and three cards in the codex say it outright. `immune` is a list
     written at the same three widths as the other two, so a body immune to Fire
     and a body immune to everything are the same field. */
  hibernation: {
    immune: ['All'],
    line: 'Takes no damage at all while it sleeps',
  },

  /* "the entity is encased in ice, becoming stunned and immune to all
     non-Psychic damage."

     ICE BLOCK, and an immunity with a hole in it. Written as the five things it
     *does* cover rather than as an exception, because `coversType` answers a
     list and a list of exclusions would be a second shape for one card. Two
     families and three types is the whole of the nine plus Poison, less the one
     the ice cannot stop. */
  'ice-block': {
    immune: ['Physical', 'Elemental', 'Sacred', 'Decay', 'Poison'],
    line: 'Takes no damage but Psychic while the ice holds',
  },

  /* "While ethereal you cannot take any actions, but you cannot be touched or
     interacted with, and you are immune to all effects."

     ETHEREALNESS POTION, left out of this table for a year because "immune to
     all effects" is every rule at once and not a number. The damage half of it
     is a number now. What stays the table's is the rest: two turns of taking no
     actions, and being unreachable by anything that is not damage. */
  'etherealness-potion': {
    immune: ['All'],
    line: 'Takes no damage at all, and can do nothing, for two turns',
  },

  /* "Entities affected by the Brew have their Movement Speed increased by 50%." */
  'wisp-of-mist': {
    speedFactor: 1.5,
    line: 'Movement Speed increased by half',
  },

  /* "Everything you do inside your Sanctuary is rolled with advantage."
     CONSECRATION, and the first entry here whose condition is a *place*. The
     sheet knows the ground exists (see the Sanctuary on the Oathbound's block)
     and has no idea whether you are standing on it.

     **It was applied outright until 2026-09-19** on the reading that you track
     the card while you are on the ground and drop it when you leave. That asked
     a player to keep a tracker row in step with their own feet, and the claim is
     what replaces it: the row says the Sanctuary is consecrated, and the box on
     the use prompt says you are standing in it. Same for the enemy's side of the
     same ground, which was never wired at all. */
  consecration: {
    line: 'Your Sanctuary is consecrated',
    claims: [
      {
        id: 'inside',
        when: 'while you are standing in your Sanctuary',
        advantage: 1,
        line: 'Advantage on everything you do inside your Sanctuary',
      },
    ],
  },

  /* "An enemy inside your Sanctuary rolls everything with disadvantage."
     CALL TO SANCTUARY's other half, and it is the same ground asked from the
     other side. Its row sits on the *enemy's* tracker, which is what a delivered
     effect is for, and the box is ticked by whoever is standing in it. */
  'call-to-sanctuary': {
    line: 'The Sanctuary is called up around you',
    claims: [
      {
        id: 'inside',
        when: 'while you are inside the Sanctuary and its enemy',
        disadvantage: 1,
        line: 'Disadvantage on everything while you are an enemy inside the Sanctuary',
      },
    ],
  },

  /* "Attack Rolls against a member have disadvantage while it is adjacent to
     another member. Members gain advantage on Attack Rolls against an entity
     adjacent to at least 2 members."

     **The card Jules named**, and the reason claims exist. Two clauses, two
     different conditions, and neither of them is a fact this sheet can check:
     one is about where the *target* is standing and one about where *you* are.
     So they are two boxes rather than one, and a member with nobody beside them
     swinging at a lone wolf ticks neither.

     The second clause rides `against`, which is the channel a Wound uses: it is
     a number on somebody else's swing, read off this body's rows by whoever is
     aiming at it. */
  'pack-bond': {
    line: 'The pack is bound: what it is worth depends on who is standing where',
    claims: [
      {
        id: 'flank',
        when: 'while the target is adjacent to at least 2 members',
        advantage: 1,
        only: 'attack',
        line: 'Advantage on Attack Rolls against an entity adjacent to at least 2 members',
      },
      {
        id: 'guard',
        when: 'while you are adjacent to another member',
        against: { disadvantage: 1 },
        line: 'Attack Rolls against you have disadvantage while you stand beside another member',
      },
    ],
  },

  /* "You sense it at any distance and through total cover, and your damage
     against it is Empowered and Elevated."

     QUARRY, whose condition is *who you are swinging at*. The sheet knows the
     spell is running and cannot know that this swing is aimed at the one entity
     it was cast on, since the quarry is named at the table rather than picked
     off a list. One box, and it is the hunter who ticks it. */
  quarry: {
    line: 'Your quarry is marked, wherever it is',
    claims: [
      {
        id: 'prey',
        when: 'while this is aimed at your quarry',
        empower: 1,
        elevate: 1,
        line: 'Damage against your quarry Empowered by 1 and Elevated once',
      },
    ],
  },

  /* "A Short Rest inside grants [[2d6 + 2*stat]] Shield and 1 Karma. Standing in
     the field elevates your Flora spells by 1."

     The Shield and the Karma are a rest's, landed once. The Elevate is standing
     ground again, and it is the first claim narrowed to a *school*: the card
     says Flora spells, which is a tag on the card being played rather than
     anything about the roll, so the box says so and the player is the one who
     reads their own tag. Left as the player's honesty rather than filtered here,
     the same way "your quarry" is. */
  'verdant-field': {
    line: 'The field is grown',
    claims: [
      {
        id: 'standing',
        when: 'while you are standing in the field, on a Flora spell',
        elevate: 1,
        line: 'Flora spells Elevated by 1 while you stand in the field',
      },
    ],
  },

  /* "For the duration of the spell, you gain advantage on all skill checks that
     rely on one of your five senses." SHARPEN SENSES, and the condition is what
     the check is *about*, which nothing on a sheet records. `only` narrows it to
     the skill check as far as the sheet can, and the box does the rest. */
  'sharpen-sense': {
    line: 'Your senses are sharpened',
    claims: [
      {
        id: 'sense',
        when: 'while the check relies on one of your five senses',
        advantage: 1,
        only: 'skill',
        line: 'Advantage on a skill check that uses a sense',
      },
    ],
  },

  /* "It is almost invisible, with 2 advantage on hiding and stealth."
     Two, on a channel that counts them, and the same narrowing SHARPEN SENSES
     takes: what the check is about is the player's to say. */
  'bend-light': {
    line: 'Light bends around you',
    claims: [
      {
        id: 'stealth',
        when: 'while the check is hiding or stealth',
        advantage: 2,
        only: 'skill',
        line: 'Advantage twice on hiding and stealth',
      },
    ],
  },

  /* "Ranged Attacks made into or through the area have disadvantage, and any
     fire in the area is extinguished."

     DOWNPOUR. The area is a place on the table and whether a shot crosses it is
     a line somebody draws with a finger, so the box is the only honest way to
     ask. Narrowed to no kind of roll here: the card says Ranged Attacks and the
     sheet cannot tell a ranged card from a melee one at this depth, so the
     player ticks it for the shots it covers. */
  downpour: {
    line: 'The downpour is standing',
    claims: [
      {
        id: 'through',
        when: 'while the shot is made into or through the rain',
        disadvantage: 1,
        only: 'attack',
        line: 'Disadvantage on a Ranged Attack crossing the downpour',
      },
    ],
  },

  /* "All entities in the violent band have disadvantage on Attack Rolls, and
     take [[2d6 + 2*stat]] damage at each of their Turn Starts."

     The damage is the tracker's own boundary clause and already ticks. The
     disadvantage is standing in the band, which is a claim. */
  'eye-of-the-storm': {
    line: 'The storm is turning around you',
    claims: [
      {
        id: 'band',
        when: 'while you are standing in the violent band',
        disadvantage: 1,
        only: 'attack',
        line: 'Disadvantage on Attack Rolls while you are in the band',
      },
    ],
  },

  /* "Attacks made into, out of or through the smoke are made with
     disadvantage." Both directions in one sentence, which makes it the first
     card to carry a claim on each channel: your own shots out of it, and
     everybody's shots into it. */
  'smoke-vial': {
    line: 'The smoke is up',
    claims: [
      {
        id: 'out',
        when: 'while your attack crosses the smoke',
        disadvantage: 1,
        only: 'attack',
        line: 'Disadvantage on an attack made into, out of or through the smoke',
      },
      {
        id: 'into',
        when: 'while the attack on you crosses the smoke',
        against: { disadvantage: 1 },
        line: 'Attacks made at you through the smoke have disadvantage',
      },
    ],
  },

  /* "If it accepts, it sacrifices Health equal to 3 times its level and gains
     advantage on its next action."

     DARK BARGAIN, and the row sits on whoever took the bargain rather than on
     whoever offered it, which is what every rider in this table is built for.
     The Health is a price paid once and the advantage is the thing that runs, so
     the advantage is the half a row can hold. Same shape as the two clovers
     below: "its next action" is a clock the table watches and the sheet lends
     the die until the row comes off.

     **Its Overcast is not in it.** "also gains Empowered and Elevated on its next
     action" is two more dice bought with 2 more Willpower, and a rider is keyed
     on the card rather than on whether a half was paid for, so a row that
     Empowered every bargain would hand out dice nobody bought. The same wall
     SICKNESS hit, and the same answer: it stays printed. */
  'dark-bargain': {
    advantage: 1,
    line: 'Advantage on your next action, for the Health it cost you',
  },

  /* "On a success, each has disadvantage on Attack Rolls for 2 turns."
     A Bram's wriggle, and the first creature card in this table. It lands on the
     party the way EXPOSED NERVES does and expires on its own clock. */
  'bram-wriggle': {
    disadvantage: 1,
    only: 'attack',
    line: 'Disadvantage on Attack Rolls while the paint holds you',
  },

  /* "Entities affected by a Lucky Brew gain Advantage on their next Skill Check
     or Attack Roll."

     The skill check is the table's. The Attack Roll is the sheet's, so the arrow
     is drawn and the row says what it is for. */
  'lucky-clover': {
    advantage: 1,
    line: 'Advantage on your next Attack Roll or Skill Check',
  },

  /* "Entities affected by an Unlucky Brew gain Disadvantage on their next Skill
     Check or Attack Roll." */
  'unlucky-clover': {
    disadvantage: 1,
    line: 'Disadvantage on your next Attack Roll or Skill Check',
  },

  /* --------------------------------------------------------------- the potions
     The potion shelf was replaced wholesale on 2026-08-27 (see utility.js), and
     four of the twenty four rows name a number this sheet already holds. The
     three attribute potions and the old Growth Elixir that used to sit here are
     gone with the rows they were read from.

     They are keyed here rather than at the moment the flask is drunk for the
     reason at the top of this file: a potion is very often somebody else's,
     handed to you at the fire, and there is nothing on your sheet for a rider to
     hang off. You track their card. */

  /* "Drinking this elixir grants you the effect of the Giant Growth spell for 1
     hour."

     The one rider in the table that is a *copy* of another, and it has to be: the
     drinker is holding the elixir's card and not the spell's, so a row for the
     elixir is the only row there is. Whatever `giant-growth` above carries, this
     carries, and the two are meant to be read together. */
  'growth-elixir': {
    speedFactor: 2,
    empower: 1,
    line: 'Movement Speed doubled, and your damage Empowered by 1',
  },

  /* "Drinking this draught grants you advantage on all Attack Rolls for 1 hour."

     The whole clause, and the cleanest entry the potions brought: the card says
     Attack Rolls and the Attack Roll is exactly what this channel bends. */
  'power-draught': {
    advantage: 1,
    line: 'Advantage on your Attack Rolls',
  },

  /* "Drinking this draught increases your Defense by 1 for 1 hour." */
  'defense-draught': {
    defense: 1,
    line: 'Defense raised by 1',
  },

  /* "Drinking this potion grants you advantage on all skill checks for 1 hour."
     The whole clause, and `only` is what "skill checks" means here: the potion
     says the kind of roll and the sheet reads the same word off the card being
     played. POWER DRAUGHT above is its twin for the Attack Roll. */
  'luck-potion': {
    advantage: 1,
    only: 'skill',
    line: 'Advantage on your skill checks',
  },

  /* "granting you advantage on all Rolls related to persuading or gaining
     favors", and with a hair in it, "double advantage toward it".

     What the check is *about* is the condition, exactly as SHARPEN SENSES', so
     it is a claim. The doubled version is a second box rather than a dial: the
     hair went in the bottle before it was drunk and the drinker knows which
     bottle they hold. Ticking both is the same one advantage twice by the
     same-source law, so the wider one is written to stand alone. */
  'love-potion': {
    line: 'You are irresistible for an hour',
    claims: [
      {
        id: 'favour',
        when: 'while the roll is persuading or winning a favor',
        advantage: 1,
        only: 'skill',
        line: 'Advantage on persuading or winning a favor',
      },
      {
        id: 'beloved',
        when: 'while the roll is toward the entity whose hair was in the bottle',
        advantage: 2,
        only: 'skill',
        line: 'Advantage twice toward the one who fell in love with you',
      },
    ],
  },

  /* "Drinking this draught grants you resistance to all {damage:Lightning},
     {damage:Cold} and {damage:Fire} damage for 1 hour."

     Three types written out rather than the family they happen to be, because
     the card writes three and a family is a different sentence. `coversType`
     answers Frost to the Cold in it, which is the one spelling the codex keeps
     two of. */
  'brightscale-draught': {
    resist: ['Lightning', 'Cold', 'Fire'],
    line: 'Half damage from Lightning, Cold and Fire',
  },

  /* "resistance to all {damage:Sharp}, {damage:Blunt} and {damage:Force}
     damage for 1 hour." The Physical family, written out for the same reason. */
  'skinstone-draught': {
    resist: ['Sharp', 'Blunt', 'Force'],
    line: 'Half damage from Sharp, Blunt and Force',
  },

  /* "You also gain resistance to Elemental and Physical damage."
     Two families, named as families by the card itself, which is why the widths
     in `coversType` are three and not one. */
  'elixir-of-slime': {
    resist: ['Elemental', 'Physical'],
    line: 'Half damage from everything Elemental and Physical while you are slime',
  },

  /* "Drinking this potion makes you vulnerable to {damage:Sharp},
     {damage:Force} and {damage:Blunt} damage for 1 hour."

     The first weakness in the table, and the only card in the codex that lays
     one on the drinker. Its second half coats a weapon so that a hit lands "as
     if the entity were vulnerable", which is a weakness on somebody else for one
     swing and has no row to sit on. Flagged in data/README.md. */
  'vulnerability-potion': {
    vulnerable: ['Sharp', 'Force', 'Blunt'],
    line: 'Double damage from Sharp, Force and Blunt',
  },

  /* "An entity affected by the Brew gains resistance to the chosen damage type
     until they take a Short Rest."

     DRACONIC SCALE, the Cauldron Keeper's Adept Essence, and the first rider in
     this table whose *type* is not on the card. The Keeper chooses it as the
     Brew is mixed, so the row carries it: a rider field written as `'types'`
     reads the row's own list instead of a constant. See `measure` and
     `typesOf` below, and the picker in EffectPrompt.jsx. */
  'draconic-scale': {
    resist: 'types',
    line: 'Half damage from the type the Brew named',
  },

  /* "Entities affected by the Brew have advantage in the named skill."
     The skill is named at the cauldron and the sheet never hears it, so this is
     a claim and the drinker is the one who knows which skill they are rolling. */
  'skillseed-nut': {
    line: 'The Brew named a skill',
    claims: [
      {
        id: 'named',
        when: 'while the check is the skill the Brew named',
        advantage: 1,
        only: 'skill',
        line: 'Advantage on the named skill',
      },
    ],
  },

  /* "Drinking this elixir shrinks you to a quarter of your size for 1 hour. Your
     Defense is reduced by 2, the Damage Dice you take are Empowered by 1, and you
     roll one Damage Die fewer on the damage you deal."

     Only the first of the three numbers lands. The Damage Dice *you take* are
     nobody's field on this sheet: damage arrives from somewhere else and is
     applied by hand. The die off your own damage cannot be written either, and
     that one is the shape refusing rather than the sheet: `empower` is summed
     through `Math.max(0, ...)`, so a negative is not a small penalty, it is a
     zero. Both are the table's, and the quarter size is the table's to picture. */
  'shrink-elixir': {
    defense: -2,
    line: 'Defense lowered by 2 while you are shrunk',
  },

  /* "Drinking this poison afflicts you with Titansbane, which gives you
     disadvantage twice on every action until you take a Long Rest."

     Two, on a channel that counts them: the sum is a number of d4s against the
     roll rather than a flag, so "two disadvantages" is written as the two it is.
     The card's other half coats a weapon and passes Titansbane on, which is a
     thing that happens to somebody else's sheet. */
  'titansbane-poison': {
    disadvantage: 2,
    line: 'Disadvantage twice on your Attack Rolls until a Long Rest',
  },

  /* -------------------------------------------------- considered and left out
   *
   * Cards that plainly last and plainly matter, whose rule this sheet cannot
   * apply without inventing something the card does not say. Each is still
   * trackable, and each still prints its own card on the row.
   *
   * **Ten of them left this list on 2026-09-19** and none of them was solved by
   * arithmetic: PACK BOND, QUARRY, VERDANT FIELD, SHARPEN SENSES, BEND LIGHT,
   * SKILLSEED NUT, LOVE POTION, DOWNPOUR, EYE OF THE STORM and SMOKE VIAL were
   * all held back because their condition is a fact about the table, and a claim
   * is what asks the player for it. Six more left it because the damage channel
   * arrived: the three draughts, the Elixir of Slime, the Vulnerability Potion
   * and DRACONIC SCALE.
   *
   * **And nine more left it on 2026-09-20**, when a rider learned to ask a
   * question: VIGOR, SEVER LIFE, SICKNESS, BLIGHT POLLEN, AIR CONTROL, ENBRITTLE
   * and SPORADIC INFUSION all named the wall in their own entries here, and all
   * seven are answered by the row remembering a number. LIFE DRAUGHT went with
   * them and needed nothing but somebody noticing that the argument it was
   * waiting for had arrived nine days earlier. HIBERNATION, ICE BLOCK and the
   * ETHEREALNESS POTION went because the damage channel grew its third setting.
   * What is below is what is left.
   *
   *   healing-potion   healing is a pool moved once, not a rider that runs. So is
   *                    the Poison's damage, from the other side.
   *   potion-of-flying a flight speed. The sheet holds one Movement Speed and
   *                    nowhere to say what it moves through.
   *   etherealness-potion "immune to all effects" is every rule at once, which is
   *                    not a number. Two turns of it is the table's.
   *   potion-of-disguise, seafarers-elixir, draught-of-cleansing, elixir-of-chaos,
   *   elixir-of-time, life-tree-tea
   *                    none of them names a number this sheet holds. A height, a
   *                    lungful of water, a status effect removed, two potions
   *                    rolled for, a turn replayed and a night's rest.
   *   explosive-concoction, bottled-lightning
   *                    thrown, and the damage lands once. The flames and the
   *                    bouncing bolt are places on the table rather than numbers
   *                    on anybody's sheet.
   *
   *   wild-strider     "your Movement Speed cannot be reduced by any effect"
   *                    is a floor rather than a bonus, and the only thing on
   *                    this sheet that reduces a Speed is being overloaded.
   *                    Whether the spell beats a full pack is the table's call.
   *   feral-form       a form, not a row. Its advantage and its die come off
   *                    `feralRiders` in feral.js, and its clock is the Shield.
   *   thrilled         a permanent ceiling, off `pointCeilings` in tricks.js.
   *   martial moves    the `move` rider already carries these, laid by the
   *                    quick bar and spent by the swing.
   *
   *   blight-pollen    half of it is wired and half of it is not, which is worth
   *                    reading as a pair. The diseased is a question the row
   *                    answers (see the entry above). The 5-turn "cannot restore
   *                    Health" is a different kind of thing altogether: not a
   *                    number to bend but a *heal to refuse*, and nothing in the
   *                    apply arithmetic can say no yet. DEATH WAIL's second
   *                    sentence hit the same wall and is still behind it.
   *
   *   sleeping-spores  "entities that can see you gain advantage on the roll"
   *                    is the *target's* advantage on a roll the caster makes,
   *                    which this sheet could only carry as the caster's
   *                    disadvantage. That is an inversion rather than a
   *                    transcription, and it wants a ruling rather than a guess.
   *   water-vortex     "1 disadvantage against entities 3 meters tall or more,
   *                    and 1 more for every 1.5 meters over it" scales on a
   *                    number nobody records, per target, on a roll made at
   *                    somebody else's Turn Start. Neither a claim nor an answer
   *                    fits: a claim is a yes or no and an answer is one number
   *                    for the whole row.
   *   delay            "every delayed action is Elevated by 1", and nothing
   *                    anywhere models a held action.
   *   rustweave        "the target's Armor is reduced by 2", which would be an
   *                    ordinary sheet rider except that its target is nearly
   *                    always an enemy, and **a rider does not reach an enemy's
   *                    stats at all**: a creature's numbers are printed. The
   *                    damage channel and the `against` channel both cross to an
   *                    enemy and the sheet channel does not. That is the biggest
   *                    thing left in this file.
   */
};

/* ------------------------------------------------------------ reading it */

/**
 * What a row has to be told before its rider is worth anything.
 *
 *   [{ id, label, hint, kind, from, options, answer }]
 *
 * `answer` is what the row already says, so a caller drawing the popup draws a
 * filled box rather than an empty one: the whole point of `from` is that the
 * sheet laying the row usually knows the number and the reader is confirming it.
 *
 * Read off the card's rider or the condition's, the same two doors every other
 * reader here goes through, so a Vulnerable laid by hand and a VIGOR cast across
 * the table are asked the same way.
 */
export function asksOf(row) {
  const found = row ? riderFor(row) : null;
  const asks = found?.rider?.ask ?? [];

  return asks.map((ask) => ({
    kind: 'number',
    ...ask,
    answer: row?.values?.[ask.id] ?? null,
  }));
}

/** The ones still unanswered, which is what makes a row say it needs something. */
export function openAsks(row) {
  return asksOf(row).filter(
    (ask) => ask.answer === null || ask.answer === undefined || ask.answer === ''
  );
}

/**
 * The answers a *caster* can fill in for a row they are laying on somebody.
 *
 * `from` names one of the caster's own numbers, so the sheet doing the laying
 * works it out and the sheet receiving it confirms rather than guesses. Three
 * are named today and all three are read off the caster: an attribute, their
 * level, and the rank they hold a set at is not one because no asking rider
 * needs it yet.
 *
 * Anything without a `from` is left blank, which is the honest answer: nobody
 * but the table knows what SEVER LIFE's damage came to.
 */
export function answersFrom(card, caster) {
  const rider = riderOf(card?.id ?? card);
  const values = {};

  for (const ask of rider?.ask ?? []) {
    if (!ask.from) continue;
    const said =
      ask.from === 'level'
        ? Number(caster?.level)
        : Number(caster?.[ask.from]);
    if (Number.isFinite(said)) values[ask.id] = said;
  }
  return Object.keys(values).length > 0 ? values : null;
}

/** The rider a card lays while it runs, or null for a card that lays none. */
export function riderOf(cardId) {
  const entry = cardId ? EFFECT_RIDERS[String(cardId)] : null;
  return entry ?? null;
}

/** Whether tracking this card will move a number on the sheet. */
export function cardHasRider(cardId) {
  return Boolean(riderOf(cardId));
}

/** What tracking this card does, in words, or null. */
export function riderLine(cardId) {
  return riderOf(cardId)?.line ?? null;
}

/**
 * What one tracker row is doing, in words, or null.
 *
 * A row is one of two things that speak: a card with a rider in the table
 * above, or a condition. Poisoned says "Disadvantage on every roll" whatever
 * card poisoned you, so the condition is asked first and the card second, and
 * every row on every tracker is read through this one door. See statuses.js.
 */
export function effectLine(row) {
  if (!row) return null;
  const status = statusOf(row.status);
  if (status) {
    /* And which type, for the two conditions whose rule has a blank in it. The
       glossary's own sentence ends "from the type the card names", so a row that
       names one finishes the sentence rather than leaving the reader to go and
       look at a card that may not exist. */
    const named = (row.types ?? []).filter(Boolean);
    if (status.types && named.length > 0) {
      return `${status.line.replace(/\s*from the type the card names\.?$/i, '')} from ${listOf(named)}.`;
    }
    return status.line;
  }
  return riderLine(row.card);
}

/** "Fire", "Fire and Cold", "Sharp, Blunt and Force". The house list. */
function listOf(words) {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/**
 * The rider a row lays, and the key it is counted under, or null for a row
 * that bends nothing.
 *
 * A condition's rider is the glossary's and is keyed on the condition, so two
 * Poisoned rows from two snakes are one Disadvantage. A card's rider is the
 * table's and is keyed on the card. A condition row that names a card still
 * reads as the condition: Rooted lays what Rooted lays, not what ENTANGLING
 * ROOTS would lay on its caster.
 */
function riderFor(row) {
  const status = statusOf(row.status);
  if (status) {
    const rider = status.rider ?? (status.claims ? {} : null);
    if (!rider) return null;
    return {
      key: `status:${status.id}`,
      rider: { ...rider, ...(status.claims ? { claims: status.claims } : {}), line: status.line },
    };
  }
  const id = row.card ? String(row.card) : '';
  const rider = riderOf(id);
  return rider ? { key: id, rider } : null;
}

/**
 * A rider's damage-type list, read against the row that is wearing it.
 *
 * Almost every list here is written on the card: SKINSTONE DRAUGHT resists
 * Sharp, Blunt and Force whoever drinks it. DRACONIC SCALE is the exception and
 * the reason this exists: the Keeper names the type at the cauldron, so the card
 * says `'types'` and the answer is on the row instead. A row that names none
 * carries nothing at all, which is the honest reading of a brew nobody wrote
 * down: a resistance to no type halves nothing.
 *
 * The same trick `measure` plays with a function field, and deliberately not the
 * same mechanism: a type is a word the *row* remembers rather than a number this
 * sheet can work out, so there is nothing to call.
 */
function typesOf(named, row) {
  /* `'types'` is the row's own condition field, which Vulnerable and Resistant
     are laid with; `'values'` is an *answered question*, which is how ENBRITTLE
     names a type nobody knew when the row went down. Two fields rather than one
     because they are two different things: a condition is laid naming its type,
     and an answer is given afterwards. */
  if (named === 'types') return (row?.types ?? []).map((type) => String(type)).filter(Boolean);
  if (named === 'values') {
    const said = row?.values?.types;
    return (Array.isArray(said) ? said : [said]).map((type) => String(type ?? '')).filter(Boolean);
  }
  return Array.isArray(named) ? named.map((type) => String(type)).filter(Boolean) : [];
}

/**
 * Whether a rider bends the kind of roll being made.
 *
 * `only` is a card naming the kind of roll it speaks about: LUCK POTION says
 * skill checks and POWER DRAUGHT says Attack Rolls, and neither is talking about
 * the other. The kinds are `rollPlan`'s own, read off the card's own sentence,
 * so the word a rider is filtered by and the word the log heads the throw with
 * are the same word. A rider naming no kind bends every roll, which is what
 * BOLSTER's "all actions" means.
 *
 * `rolls` is what the *card being played* asks for, and a caller that does not
 * know gets everything: a narrowed rider is never silently dropped by a question
 * nobody could answer.
 */
function bendsKind(rider, rolls) {
  if (!rider?.only || !rolls) return true;
  if (rider.only === 'attack') return rolls === 'attack' || rolls === 'weapon';
  return rider.only === rolls;
}

/**
 * A stored effects list, as rows, without trusting it.
 *
 * The same defensive read `runningEnchants` does in enchanting.js, and for the
 * same reason: an effects list is stored jsonb, this file is a leaf and both of
 * its callers are on a render path.
 */
function rows(effects) {
  let list = effects;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = null;
    }
  }
  return Array.isArray(list) ? list.filter((row) => row && typeof row === 'object') : [];
}

/**
 * Every rider running on this character, summed.
 *
 * A row counts when it names a card the table above knows and it has not run
 * out. `turns === 0` is a row that ended at the top of this turn and is being
 * shown for one turn so it is not missed, which is not the same as a row that
 * is still doing something.
 *
 * Deduplicated by card id, so the same card tracked twice is one source. `from`
 * is the names in the order they were met, which is what a tile or an arrow
 * credits.
 */
export function runningRiders(
  effects,
  { weapon = true, who = null, claimed = [], rolls = null } = {}
) {
  const total = noRider();
  const seen = new Set();
  const ticked = new Set(claimed ?? []);

  for (const row of rows(effects)) {
    if (row.turns === 0) continue;

    const found = riderFor(row);
    if (!found || seen.has(found.key)) continue;
    const { key: id, rider: printed } = found;
    const rider = measure(printed, who, row);
    /* A rider whose printed clause names a weapon has nothing to say about a
       spell. `weapon: false` is a caller asking about something that is not a
       weapon attack, and KINDLE WEAPON is the one entry it drops: "when the
       imbued weapon lands a hit" is a sentence about the thing in your hand, and
       folding its Fire onto a Frost Bolt would change what the spell is made of.
       Skipped before `seen` records it, so nothing is quietly deduplicated away
       from a later question that does want it. */
    if (rider.weapon && !weapon) continue;
    seen.add(id);

    total.any = true;
    total.from.push({ id, name: String(row.name ?? id), rider });

    fold(total, rider, row, rolls);

    /* And the clauses the player ticked. A claim is a part of the same card, so
       it is folded under the same key and deduplicated with it: PACK BOND
       tracked twice is one pack however many boxes are ticked on either row.
       Its fields are the same fields, which is what keeps `bendsSwing` and the
       receipts working without knowing claims exist. */
    for (const claim of rider.claims ?? []) {
      if (!ticked.has(`${id}:${claim.id}`)) continue;
      total.claimed.push({ id, claim: claim.id, name: claim.line ?? claim.when ?? '', rider: claim });
      fold(total, measure(claim, who, row), row, rolls);
    }
  }

  return total;
}

/**
 * One rider's numbers into the running total.
 *
 * Its own function because a claim is folded by exactly the same arithmetic as
 * the card carrying it: two code paths adding up the same fields is two places
 * for a channel to be forgotten, which is how `added` nearly went missing.
 */
function fold(total, rider, row, rolls) {
  for (const [key, value] of Object.entries(rider.attributes ?? {})) {
    if (key in total.attributes) total.attributes[key] += Math.floor(Number(value) || 0);
  }
  total.healthMax += Math.floor(Number(rider.healthMax) || 0);
  total.willpowerMax += Math.floor(Number(rider.willpowerMax) || 0);
  total.speed += Number(rider.speed) || 0;
  /* Factors multiply. "Doubling" and "increased by 50%" are each written
     against whatever the Speed already was, so two of them are threefold and
     not two and a half fold. */
  if (rider.speedFactor) total.speedFactor *= Number(rider.speedFactor) || 1;
  total.defense += Math.floor(Number(rider.defense) || 0);
  total.armor += Math.floor(Number(rider.armor) || 0);

  /* The swing's four, and the one place a rider may be narrowed to a kind of
     roll: LUCK POTION's advantage is on skill checks and has nothing to say
     about a swing. Only these four are asked, because `only` is always a
     sentence about a *roll* and never about a Movement Speed. */
  if (bendsKind(rider, rolls)) {
    total.empower += Math.max(0, Math.floor(Number(rider.empower) || 0));
    total.elevate += Math.max(0, Math.floor(Number(rider.elevate) || 0));
    total.advantage += Math.max(0, Math.floor(Number(rider.advantage) || 0));
    total.disadvantage += Math.max(0, Math.floor(Number(rider.disadvantage) || 0));
  }

  for (const type of rider.damage ?? []) {
    if (!total.damage.includes(type)) total.damage.push(type);
  }

  /* Half and double, by type. Deduplicated because the rulebook says so:
     "Neither stacks with itself. Two sources of vulnerability to Fire still
     mean double." Two *different* types are two entries and both stand. */
  for (const type of typesOf(rider.resist, row)) {
    if (!total.resist.includes(type)) total.resist.push(type);
  }
  for (const type of typesOf(rider.vulnerable, row)) {
    if (!total.vulnerable.includes(type)) total.vulnerable.push(type);
  }
  for (const type of typesOf(rider.immune, row)) {
    if (!total.immune.includes(type)) total.immune.push(type);
  }

  /* And the throws hung on this body's next attack, which are a list rather than
     a sum: two sources are two handfuls, by the stacking law, exactly as two
     lineage cards would be. */
  for (const one of rider.added ?? []) {
    if (one?.dice || one?.flat) total.added.push({ ...one });
  }

  /* And what an attack aimed at this body gets. Summed rather than deduplicated
     for the same reason the swing's four are: two different cards are two
     sources and they add. */
  for (const key of ['empower', 'elevate', 'advantage', 'disadvantage']) {
    total.against[key] += Math.max(0, Math.floor(Number(rider.against?.[key]) || 0));
  }
  if (rider.against?.weapon) total.against.weapon = true;
}

/**
 * A rider read against the character actually wearing it.
 *
 * ------------------------------------------------- a rider measured, not printed
 * Every entry in the table above is a literal constant, deliberately: a rider is
 * keyed on the *card* and not on whoever cast it, so a sheet holding a row laid
 * by somebody else cannot look up a number that lives on the caster. VIGOR's
 * "3 x your Mind" and SEVER LIFE's "the damage dealt" are both stuck behind that,
 * and both are still stuck.
 *
 * **BERSERKER'S RAGE is the one that was never stuck**, and until 2026-09-11 it
 * was treated as though it were. "You gain additional Physique equal to your
 * Berserker Rank" is measured against the *holder*, who is by definition the
 * sheet the row is sitting on — nobody else can put a Rage on you. So a field may
 * be a function of that holder, resolved here, once, on the way past.
 *
 * Nothing else changes: a function is only ever called with the sheet wearing the
 * row, a constant stays a constant, and a caller that has no character to offer
 * gets the same nothing it would get from a card it cannot measure.
 */
function measure(rider, who, row = null) {
  let bent = null;

  for (const [field, value] of Object.entries(rider)) {
    if (typeof value !== 'function') continue;
    bent ??= { ...rider };
    /* Handed the row as well as the holder since 2026-09-20, for the fields
       whose number is neither: VIGOR's is the caster's Mind, which the row was
       answered with. A field that wants only the holder ignores the second
       argument, which is every measured field written before that day. */
    bent[field] = who || row ? value(who, row) : 0;
  }
  /* `attributes` is the one nested field, and the only one any measured rider
     uses today. Walked separately rather than generically, because a rider is a
     flat map everywhere else and a general walk would invite a second shape. */
  for (const [key, value] of Object.entries(rider.attributes ?? {})) {
    if (typeof value !== 'function') continue;
    bent ??= { ...rider };
    bent.attributes = { ...bent.attributes, [key]: who || row ? value(who, row) : 0 };
  }

  return bent ?? rider;
}

/**
 * The same sum, or null when nothing is running.
 *
 * Every caller is on a render path and every caller has a cheap answer for
 * "nothing", so the null saves them all the same branch. `runningRiders` above
 * is the one that always hands back a shape.
 */
export function effectRiders(effects, options) {
  const total = runningRiders(effects, options);
  return total.any ? total : null;
}

/**
 * Every clause on this body that the player has to answer for, as boxes.
 *
 *   [{ key, card, name, when, line, rider }]
 *
 * `key` is what a ticked box sends back and what `runningRiders` matches on.
 * `name` is the row's own name, which is the card as the tracker prints it, and
 * `when` is the card's own condition: "while the target is adjacent to at least
 * 2 members". Both are needed, because a box reading only "Pack Bond" asks a
 * question the player cannot answer and one reading only the condition does not
 * say what it buys.
 *
 * Deduplicated by claim, so one card tracked twice offers one box, exactly as
 * its numbers are counted once.
 *
 * A claim that cannot touch the card in hand is not offered: BEND LIGHT's
 * stealth advantage on a Fireball would be a box that did nothing if it were
 * ticked, and the surest way to stop being read is to ask a question that does
 * not matter. That is the same `only` the fold above respects, asked earlier.
 */
export function offeredClaims(effects, { weapon = true, who = null, rolls = null } = {}) {
  const out = [];
  const seen = new Set();

  for (const row of rows(effects)) {
    if (row.turns === 0) continue;

    const found = riderFor(row);
    if (!found) continue;
    const rider = measure(found.rider, who, row);
    if (rider.weapon && !weapon) continue;

    for (const claim of rider.claims ?? []) {
      const key = `${found.key}:${claim.id}`;
      if (seen.has(key) || !bendsKind(claim, rolls)) continue;
      seen.add(key);
      out.push({
        key,
        card: row.card ?? null,
        name: String(row.name ?? found.key),
        when: claim.when ?? '',
        line: claim.line ?? '',
        rider: claim,
      });
    }
  }

  return out;
}

/**
 * Only the claims that were ticked, summed, or null when none were.
 *
 * The other half of `runningRiders`, and it exists because of where the ticking
 * happens: everything a card is worth before anybody decides anything is folded
 * once, when the chip is built, and the boxes are ticked later inside the use
 * prompt. Re-folding the whole thing there would count the tracker twice, so the
 * prompt folds this on top instead, exactly as `withMoves` folds the moves on
 * top. See `withClaims` in moves.js.
 */
export function claimedRiders(effects, { weapon = true, who = null, claimed = [], rolls = null } = {}) {
  const ticked = new Set(claimed ?? []);
  if (ticked.size === 0) return null;

  const total = noRider();
  const seen = new Set();

  for (const row of rows(effects)) {
    if (row.turns === 0) continue;
    const found = riderFor(row);
    if (!found) continue;
    const rider = measure(found.rider, who, row);
    if (rider.weapon && !weapon) continue;

    for (const claim of rider.claims ?? []) {
      const key = `${found.key}:${claim.id}`;
      if (!ticked.has(key) || seen.has(key)) continue;
      seen.add(key);
      total.any = true;
      total.claimed.push({ id: found.key, claim: claim.id, name: String(row.name ?? found.key), rider: claim });
      fold(total, measure(claim, who, row), row, rolls);
    }
  }

  return total.any ? total : null;
}

/**
 * What an attack aimed at this body is worth to whoever is aiming it.
 *
 * The other direction of the whole file. Every other reader here answers "what
 * is this body's own roll worth"; this one is read by the *attacker*, off the
 * target's rows, and the one thing in the glossary that needs it is a Wound:
 * "Weapon attacks made against the entity are Empowered."
 *
 *   { empower, elevate, advantage, disadvantage, weapon, from }
 *
 * `weapon` is a clause that only reaches a weapon attack, which the Wound's own
 * sentence is, and `from` is the rows that gave something so the swing can say
 * why it grew. Null when the body has nothing to give, which is nearly every
 * body: the caller is on a render path and has a cheap answer for nothing.
 *
 * `claimed` reaches here too, because one of PACK BOND's two clauses is about
 * where the *defender* is standing and it is the attacker who has to be asked.
 */
export function takenRiders(effects, { who = null, claimed = [] } = {}) {
  const total = runningRiders(effects, { who, claimed });
  const taken = total.against;
  if (!taken.empower && !taken.elevate && !taken.advantage && !taken.disadvantage) return null;

  return {
    ...taken,
    from: [...total.from, ...total.claimed]
      .filter(({ rider }) => bendsAgainst(rider))
      .map(({ id, name, rider }) => ({ id, name, rider })),
  };
}

/** Whether a rider says anything about attacks made at the body wearing it. */
export function bendsAgainst(rider) {
  const said = rider?.against;
  if (!said) return false;
  return Boolean(said.empower || said.elevate || said.advantage || said.disadvantage);
}

/**
 * The damage types this body takes half of and double of, off its tracker.
 *
 * Only the tracker's half. A character's blood grants resistances too (AMPHIBIAN
 * shrugs off Cold whatever is running), and those are read where every other
 * `grants` is read: see `characterTypes` in characterModel.js, which adds the
 * two together. A creature's are on its passives, in creatures.js.
 */
export function wornTypes(effects, { who = null, claimed = [] } = {}) {
  const total = runningRiders(effects, { who, claimed });
  return { resist: total.resist, vulnerable: total.vulnerable, immune: total.immune };
}

/**
 * What is bending the *sheet*, named, for `liveShift` and the stat tooltips.
 *
 * Only the six sheet-side fields. A card that lends nothing but a die to a swing
 * is not shifting any tile, and crediting it on one would be the sheet pointing
 * at a number that never moved.
 */
export function riderShift(who) {
  const total = runningRiders(who?.effects, { who });
  if (!total.any) return [];

  return total.from
    .filter(({ rider }) => bendsSheet(rider))
    .map(({ name, rider }) => ({ name, rider }));
}

/**
 * Whether a rider moves a stat tile rather than only a swing.
 *
 * Asked of a *measured* rider by `riderShift`, where every field is already a
 * number, and of a *printed* one by scripts/check-riders.mjs, where a measured
 * field is still the function that will produce it. A function counts: what the
 * question means is "does this card belong on a tile", and BERSERKER'S RAGE
 * belongs on the Physique tile whether or not the sheet asking holds the set.
 */
export function bendsSheet(rider) {
  if (!rider) return false;

  const some = (value) => typeof value === 'function' || Boolean(Number(value) || 0);
  return Boolean(
    Object.values(rider.attributes ?? {}).some(some) ||
      some(rider.healthMax) ||
      some(rider.willpowerMax) ||
      some(rider.speed) ||
      (rider.speedFactor && Number(rider.speedFactor) !== 1) ||
      some(rider.defense) ||
      some(rider.armor)
  );
}

/**
 * Whether a rider changes what *lands* on this body rather than what it rolls.
 *
 * The damage channel: a resistance halves a type, a weakness doubles it. The
 * string `'types'` counts, because DRACONIC SCALE's list is on the row rather
 * than on the card and a rider waiting for an answer is still a rider. See
 * `typesOf`.
 */
export function bendsTypes(rider) {
  if (!rider) return false;
  const some = (named) =>
    named === 'types' || named === 'values' || (Array.isArray(named) && named.length > 0);
  return some(rider.resist) || some(rider.vulnerable) || some(rider.immune);
}

/**
 * Whether a rider hangs a whole extra throw on this body's next attack.
 *
 * The channel VENOMOUS opened on a lineage card and SPORADIC INFUSION is the
 * first tracker row to use. A function counts, for the reason `bendsSheet` counts
 * one: the question is "does this card belong on a swing", and an unanswered
 * SPORADIC INFUSION belongs there whether or not anybody has typed the number.
 */
export function bendsAdded(rider) {
  if (!rider) return false;
  return typeof rider.added === 'function' || (rider.added ?? []).length > 0;
}

/** Whether a rider changes one weapon attack rather than a stat tile. */
export function bendsSwing(rider) {
  if (!rider) return false;
  return Boolean(
    rider.empower ||
      rider.elevate ||
      rider.advantage ||
      rider.disadvantage ||
      (rider.damage ?? []).length > 0
  );
}
