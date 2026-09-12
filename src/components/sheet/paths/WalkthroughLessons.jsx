import { Link } from 'react-router-dom';
import { BLOCK_NAMES } from '../blockNames.js';
import { useDiceTray } from '../../../context/dice-tray.js';
import { ATTRIBUTES, ATTRIBUTE_BASE, attributeLabel } from '../../../lib/attributes.js';
import {
  BACKGROUNDS,
  MAX_SKILL_PICKS,
  MIN_SKILL_PICKS,
  STARTING_SUPPLIES,
  startingCoins,
} from '../../../lib/backgrounds.js';
import {
  MAX_ATTRIBUTE,
  XP_TABLE,
  deriveStats,
  formatNumber,
  formatSpeed,
  formatWeight,
  karmaCap,
  levelForXp,
  liveCharacter,
  shieldCapFor,
} from '../../../lib/characterModel.js';
import { CHECK_DICE, CRIT_BAND } from '../../../lib/dice.js';
import { REST_HEALTH } from '../../../lib/grants.js';
import {
  armorSetOptions,
  carryState,
  combatStartEffects,
  getItem,
  itemWeight,
  normalizeEquipment,
  startingWeapons,
  weaponShelves,
} from '../../../lib/items.js';
import { levelGrants } from '../../../lib/levels.js';
import { lineageBonuses } from '../../../lib/levelPicks.js';
import { LINEAGES } from '../../../lib/lineages.js';
import { RESTS } from '../../../lib/rest.js';
import { mathLine, statMath } from '../../../lib/statMath.js';
import { TALENTS, TALENT_RANKS, talentCategory } from '../../../lib/talents.js';
import { ruleHref, stepsWaiting } from '../../../lib/walkthrough.js';

/**
 * What each step of the Walkthrough teaches, beside the panel that asks it.
 *
 * Six lessons, one a step, kept short on purpose. Jules, 2026-09-12, on the
 * first draft: "be more to the point and more direct, less text." Each lesson
 * is the rule in a few lines, one recommendation, and how the panel works in a
 * sentence or two, then the rulebook for anybody who wants the whole of it.
 *
 * **The recommendation is the spine of the walk.** "Focus on one attribute at
 * the start and take the talent set and weapon that work with it" (Jules, same
 * day). So the attributes step says to build around the +2, and every step after
 * it reads the +2 off the row and names what pulls the same way: the talent
 * shelf built on that attribute, the lineages that add a point to it, the weapon
 * shelf that rolls it, and the armor set that builds on it. Every one of those is
 * computed from the codex, never typed, so a set added tomorrow is recommended
 * tomorrow.
 *
 * **Armor is compared, not crowned.** The first draft named the set with the
 * most Defense and Jules sent it back the same day: "does not take into account
 * all the details of armor, the damage reduction and Defense and the Shield."
 * So the three Common sets are each worn on the character in turn and read back
 * through the sheet's own arithmetic, as a table: Defense, Armor, the Shield
 * they start a fight with, and what they weigh. See `armorAdvice`.
 *
 * **No number in here is typed.** The base, the ceiling, the rank levels, the
 * coins a background is worth, what a rest costs and the width of the critical
 * band come off the code that enforces them, and the character's own numbers
 * come through `statMath`, which is the arithmetic every tile on the Character
 * tab prints on hover.
 *
 * Six named exports and nothing else, so this file stays a file of components;
 * Walkthrough.jsx keys them by step.
 */

/* The DC a practice roll is thrown against: the bottom rung of the ladder in
   1.10, an easy task. */
const PRACTICE_DC = 10;

/* The stats the attributes buy, in the order the Character tab prints them. */
const NUMBER_ROWS = [
  { key: 'health_max', label: 'Health' },
  { key: 'willpower_max', label: 'Willpower' },
  { key: 'avoid', label: 'Defense' },
  { key: 'initiative', label: 'Initiative' },
  { key: 'speed_m', label: 'Speed', kind: 'speed' },
  { key: 'reflex', label: 'Reflex' },
  { key: 'grit', label: 'Grit' },
];

/* The pools, for the last step. Shield and Karma have no column for a ceiling,
   so they are read the way the Character tab reads them. */
const POOL_ROWS = [
  { key: 'health_max', label: 'Health' },
  { key: 'shield_cap', label: 'Shield, at most', read: (who) => shieldCapFor(who) },
  { key: 'willpower_max', label: 'Willpower' },
  { key: 'ap_max', label: 'Action Points' },
  { key: 'reaction_max', label: 'Reaction Points' },
  { key: 'karma', label: 'Karma, at most', read: (who) => karmaCap(who) },
];

/* The five tabs of the sheet, a line each. */
const TABS = [
  ['Character', 'Numbers, pools and the cards you can play, in six blocks.'],
  ['Abilities', 'Every card you hold, by where it came from.'],
  ['Inventory', 'Worn, held, on the belt and in the pack.'],
  ['Lore', 'The story, the portrait and the journal.'],
  ['Advancement', 'The choices you made here, and every choice a new level brings.'],
];

/* ------------------------------------------------------------------ parts */

/** One titled part of a lesson. `how` is the part about the panel itself. */
function Lesson({ title, kind = 'rule', children }) {
  return (
    <section className={`wt-section wt-section-${kind}`}>
      <h4 className="wt-section-title">{title}</h4>
      {children}
    </section>
  );
}

/** The one recommendation a choosing step makes. */
function Tip({ children }) {
  return (
    <section className="wt-section wt-section-tip">
      <h4 className="wt-section-title">Recommended</h4>
      {children}
    </section>
  );
}

/** Where the rulebook writes the step's rules out in full. */
function More({ step }) {
  return (
    <section className="wt-section wt-section-more">
      <h4 className="wt-section-title">In the rulebook</h4>
      <div className="wt-more-links">
        {step.rules.map((ref) => (
          <Link
            key={ref.label}
            className="wt-more-link"
            to={ruleHref(ref)}
            target="_blank"
            rel="noreferrer"
            title="Opens the rulebook in a new tab"
          >
            {ref.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

/** The character's own numbers, each with the arithmetic that made it. */
function Numbers({ character, rows, unit }) {
  const shown = liveCharacter(character);
  const math = statMath(shown);

  return (
    <ul className="wt-numbers">
      {rows.map((row) => {
        const value = row.read ? row.read(shown) : shown[row.key];
        const line = mathLine(math[row.key]);
        return (
          <li className="wt-number" key={row.key}>
            <span className="wt-number-label">{row.label}</span>
            <span className="wt-number-value">
              {row.kind === 'speed'
                ? formatSpeed(Math.round((Number(value) || 0) * 10) / 10, unit)
                : Math.floor(Number(value) || 0)}
            </span>
            {line && <span className="wt-number-math">{line}</span>}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A roll to try, one button an attribute, on the dice tray like every roll on
 * the site. Nothing is written: a practice roll has no table to tell.
 */
function PracticeRoll({ character }) {
  const tray = useDiceTray();
  if (!tray) return null;

  return (
    <div className="wt-roll">
      <p>
        Try it: {CHECK_DICE.count}d{CHECK_DICE.faces} plus the attribute, against a DC of{' '}
        {PRACTICE_DC}.
      </p>
      <div className="wt-roll-buttons">
        {ATTRIBUTES.map((attribute) => {
          const value = Math.floor(Number(character?.[attribute.key]) || 0);
          return (
            <button
              key={attribute.key}
              type="button"
              className="btn btn-minimal btn-sm wt-roll-button"
              style={{ '--attr-color': attribute.color }}
              onClick={() =>
                void tray.present({
                  shape: 'check',
                  kind: 'skill',
                  name: 'Practice roll',
                  note: `${attribute.label} ${value}`,
                  flat: value,
                  dc: PRACTICE_DC,
                  askDc: false,
                  askVerdict: false,
                  log: false,
                })
              }
            >
              {attribute.label} {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** "Guardian", "Guardian and Berserker", "Guardian, Berserker and Colossus". */
function listAnd(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/* ---------------------------------------------------------------- lessons */

export function AttributesLesson({ character, step, unit }) {
  return (
    <>
      <Lesson title="How the game works">
        <ul className="wt-list">
          <li>
            <b>One roll.</b> {CHECK_DICE.count}d{CHECK_DICE.faces} plus one attribute, against a
            difficulty number. Reach it and you succeed. {CRIT_BAND} over or under is a critical.
          </li>
          <li>
            <b>Everything is a card.</b> Cost, reach and effect, with your numbers filled in.
          </li>
          <li>
            <b>Everything has a price.</b> Action Points come back every turn. Willpower comes
            back on a Long Rest. A rest costs Supplies.
          </li>
        </ul>
        <PracticeRoll character={character} />
      </Lesson>

      <Lesson title="Your three attributes">
        <p>
          Each starts at {ATTRIBUTE_BASE} and stops at {MAX_ATTRIBUTE}. They only make other
          numbers bigger:
        </p>
        <ul className="wt-list">
          {ATTRIBUTES.map((attribute) => (
            <li key={attribute.key}>
              <b style={{ color: attribute.color }}>{attribute.label}</b> · {attribute.buys}
            </li>
          ))}
        </ul>
        <Numbers character={character} rows={NUMBER_ROWS} unit={unit} />
      </Lesson>

      <Tip>
        <p>
          Pick one attribute to build around and put the <b>+2</b> there. The next steps point
          at a talent set, a lineage and a weapon that use it, so every choice pulls the same
          way.
        </p>
      </Tip>

      <Lesson title="How this panel works" kind="how">
        <p>
          Press <b>Choose your Attribute Boosts</b>. One row places the +2, the other the +1, on
          two different attributes. <b>What it buys</b> shows the change before you take it.
        </p>
      </Lesson>

      <More step={step} />
    </>
  );
}

export function TalentLesson({ state, step, go }) {
  const written = TALENTS.filter((talent) => !talent.stub);
  const major = state.picks.boosts?.major ?? null;
  const shelf = major
    ? written.filter((talent) => talentCategory(talent).id === major).map((talent) => talent.name)
    : [];
  const [novice, adept, master] = TALENT_RANKS;

  return (
    <>
      <Lesson title="What a talent set is">
        <p>
          What your character can do. Three ranks: <b>{novice.title}</b> now, <b>{adept.title}</b>{' '}
          from level {adept.minLevel}, <b>{master.title}</b> from level {master.minLevel}. Every
          even level buys the next rank of a set you hold, or a new set at {novice.title}.{' '}
          {written.length} of the {TALENTS.length} sets on the wall can be taken; the rest are not
          written yet.
        </p>
      </Lesson>

      <Tip>
        <p>
          {major ? (
            <>
              Your +2 is on <b>{attributeLabel(major)}</b>. Read the {attributeLabel(major)}{' '}
              shelf first and take a set from it: {listAnd(shelf)}. Their cards roll the
              attribute you raised.
            </>
          ) : (
            <>
              Place your boosts first. The shelf that matches your +2 is the one to read,
              because its cards roll the attribute you raised.
            </>
          )}
        </p>
      </Tip>
      {!major && (
        <div className="pick-tools pick-tools-tight">
          <button type="button" className="btn btn-sub btn-sm" onClick={() => go('attributes')}>
            Back to Attributes
          </button>
        </div>
      )}

      <Lesson title="Some sets ask for more">
        <p>
          Spells to choose, a creature to name, a vow to swear. The question opens when you take
          the set, and the panel reads <b>Half done</b> until you answer. The sheet will not open
          on an open question.
        </p>
      </Lesson>

      <Lesson title="How this panel works" kind="how">
        <p>
          Press <b>Choose a Talent Set</b>, open a set to read its ranks, then <b>Take at Rank 1</b>
          . The panel prints its Novice cards; tap one to read it. <b>Undo this choice</b> hands
          the set back.
        </p>
      </Lesson>

      <More step={step} />
    </>
  );
}

export function LineageLesson({ state, step }) {
  const major = state.picks.boosts?.major ?? null;
  const raisers = major
    ? LINEAGES.filter((lineage) => (lineageBonuses(lineage.name)[major] ?? 0) > 0).map(
        (lineage) => lineage.name
      )
    : [];

  return (
    <>
      <Lesson title="What a lineage is">
        <p>
          The blood your character comes from, not their race or their look. Chosen once and never
          changed. {LINEAGES.length} to choose from.
        </p>
      </Lesson>

      <Lesson title="What it gives you">
        <p>
          Cards: traits that are always true of you, and abilities you can use. A few add a point
          to an attribute. Some cards ask a question; the window asks it when you take the
          lineage, and the panel reads <b>Half done</b> until you answer.
        </p>
      </Lesson>

      <Tip>
        <p>
          {raisers.length > 0 ? (
            <>
              {listAnd(raisers)} {raisers.length === 1 ? 'adds' : 'add'} a point of{' '}
              <b>{attributeLabel(major)}</b> on top of your spread. Any lineage works with any
              spread; that one pulls the same way as your +2.
            </>
          ) : (
            <>
              Any lineage works with any spread. One that adds a point to your +2 attribute pulls
              the same way.
            </>
          )}
        </p>
      </Tip>

      <Lesson title="How this panel works" kind="how">
        <p>
          Press <b>Choose a Lineage</b>, open one to read its cards, then <b>Take</b>. Answer what
          it asks in the same window and press Done.
        </p>
      </Lesson>

      <More step={step} />
    </>
  );
}

/**
 * The three Common armor sets as they would stand on this character.
 *
 * Each set is worn in turn and read back through the sheet's own arithmetic,
 * so the table says what the sheet will say: `deriveStats` for the Defense and
 * the Armor, `combatStartEffects` for the Shield a set puts in front of Health
 * when a fight starts (held to the Shield cap, as the bell holds it), the pieces'
 * own weight, and whether that weight is over what the character can carry.
 *
 * `favored` is whether the set builds on the +2. Worked out rather than looked
 * up: the +2 attribute is raised by one and the set is favored if its Defense or
 * its Shield moves. Light Armor's Defense is Reflex, so it moves with Physique;
 * Magic Armor's Defense is Grit and its Shield is Mind, so both move with Mind;
 * every set builds on Instinct, so an Instinct spread favors all three.
 */
function armorAdvice(character, major) {
  const level = levelForXp(character?.xp);
  const worn = normalizeEquipment(character?.equipment);

  const wearing = (who, set) => ({
    ...who,
    level,
    equipment: { ...worn, head: set.pieces.head, torso: set.pieces.torso, legs: set.pieces.legs },
  });
  const shieldAt = (who, stats) =>
    Math.min(
      stats.shield_cap,
      combatStartEffects(who).reduce((sum, row) => sum + row.shield, 0)
    );

  const raised = major
    ? { ...character, [major]: (Math.floor(Number(character?.[major])) || 0) + 1 }
    : null;

  return armorSetOptions().map((set) => {
    const dressed = wearing(character, set);
    const stats = deriveStats(dressed);
    const shield = shieldAt(dressed, stats);

    let favored = false;
    if (raised) {
      const up = wearing(raised, set);
      const upStats = deriveStats(up);
      favored = upStats.avoid > stats.avoid || shieldAt(up, upStats) > shield;
    }

    return {
      name: set.name,
      avoid: stats.avoid,
      armor: stats.defense,
      shield,
      weight: Object.values(set.pieces).reduce((sum, id) => sum + itemWeight(getItem(id)), 0),
      over: carryState(dressed).state !== 'clear',
      favored,
    };
  });
}

export function BackgroundLesson({ character, state, step, unit }) {
  const major = state.picks.boosts?.major ?? null;
  const rack = weaponShelves(startingWeapons())?.find((row) => row.shelf.id === major) ?? null;
  const sets = armorAdvice(character, major);
  const favored = sets.filter((set) => set.favored);

  return (
    <>
      <Lesson title="What a background is">
        <p>
          The life before this one. {BACKGROUNDS.length} trades, each paying out <b>skills</b>, a{' '}
          <b>kit</b> and a <b>purse</b> that trade against each other: more skills, fewer coins.
        </p>
        <ul className="wt-list">
          <li>
            <b>Skills</b> are cards and are never rolled. A Skill Check is the ordinary roll, and
            a skill you hold usually grants advantage when it applies. Learn {MIN_SKILL_PICKS} to{' '}
            {MAX_SKILL_PICKS}, depending on the trade.
          </li>
          <li>
            <b>Kit</b>: one full Common armor set and one Common weapon, two for a trade that arms
            you twice, plus the trade&rsquo;s own gear. The armor goes on and the weapon into your
            hand.
          </li>
          <li>
            <b>Purse</b>: {formatNumber(STARTING_SUPPLIES)} Supplies for everybody, and{' '}
            {formatNumber(startingCoins(3))} coins for three skills, {formatNumber(startingCoins(2))}{' '}
            for two or {formatNumber(startingCoins(1))} for one. Supplies pay for rests; coins buy
            things in the game.
          </li>
        </ul>
      </Lesson>

      <Tip>
        <p>
          {rack ? (
            <>
              In the outfitter, take a weapon from the <b>{attributeLabel(major)}</b> shelf: all{' '}
              {rack.items.length} of them roll the attribute you raised.
            </>
          ) : (
            <>Take a weapon from the shelf of your +2 attribute; the outfitter shelves them by it.</>
          )}
        </p>

        {/* The three sets as they would stand on you, not a winner. Defense is what
            an attack has to roll against, Armor comes off every hit that lands,
            and Shield is what stands in front of Health when a fight starts. */}
        <table className="wt-table wt-armor">
          <thead>
            <tr>
              <th>Armor set</th>
              <th>Defense</th>
              <th>Armor</th>
              <th>Shield</th>
              <th>Weight</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set) => (
              <tr key={set.name} className={set.favored ? 'is-favored' : undefined}>
                <td>{set.name}</td>
                <td>{set.avoid}</td>
                <td>{set.armor}</td>
                <td>{set.shield}</td>
                <td>
                  {formatWeight(set.weight, unit)}
                  {set.over && (
                    <span className="wt-armor-over" title="Over what you can carry: your Speed is halved">
                      {' '}
                      · over
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p>
          Defense is what an attack has to roll against. Armor comes off every hit that lands.
          Shield is what stands in front of your Health when a fight starts.{' '}
          {!major
            ? 'Place your boosts first; the table moves with them.'
            : favored.length === sets.length
              ? `All three build on ${attributeLabel(major)}: take the column you want.`
              : favored.length > 0
                ? `${listAnd(favored.map((set) => set.name))} ${
                    favored.length === 1 ? 'builds' : 'build'
                  } on ${attributeLabel(major)}, so your +2 counts there.`
                : ''}
        </p>
      </Tip>

      <Lesson title="How this panel works" kind="how">
        <p>
          Press <b>Choose a Background</b>, open a trade and <b>Take</b> it. Learn your skills,
          press <b>Next: your kit</b>, choose the armor set and the weapon, then{' '}
          <b>Take the kit</b>. Changing the trade hands the kit back first.
        </p>
      </Lesson>

      <More step={step} />
    </>
  );
}

export function StoryLesson({ step }) {
  return (
    <>
      <Lesson title="Who they are">
        <p>
          No rules here. The portrait and the one-line concept travel with the character; the
          rest is for you and your table. Each box saves as you type. Fill it in now or later,
          from the Lore tab.
        </p>
      </Lesson>

      <More step={step} />
    </>
  );
}

export function SheetLesson({ character, state, step, go, unit }) {
  const waiting = stepsWaiting(character, state);
  const next = levelGrants(2);

  return (
    <>
      <Lesson title="Your numbers">
        <Numbers character={character} rows={POOL_ROWS} unit={unit} />
        <Numbers
          character={character}
          rows={NUMBER_ROWS.filter((row) => !POOL_ROWS.some((pool) => pool.key === row.key))}
          unit={unit}
        />
      </Lesson>

      <Lesson title="The five tabs">
        <ul className="wt-list">
          {TABS.map(([name, says]) => (
            <li key={name}>
              <b>{name}</b> · {says}
            </li>
          ))}
        </ul>
      </Lesson>

      <Lesson title="The Character tab's six blocks">
        <ul className="wt-list">
          {Object.entries(BLOCK_NAMES).map(([id, block]) => (
            <li key={id}>
              <b>{block.name}</b> · {block.note}.
            </li>
          ))}
        </ul>
      </Lesson>

      <Lesson title="Resting">
        <p>
          <b>{RESTS.short.label}</b>: {RESTS.short.hours} hour, {RESTS.short.supplies} Supplies,{' '}
          {REST_HEALTH.short === 'half' ? 'half your Health' : 'your Health'} back.{' '}
          <b>{RESTS.long.label}</b>: {RESTS.long.hours} hours, {RESTS.long.supplies} Supplies,{' '}
          {REST_HEALTH.long === 'full' ? 'all your Health' : 'half your Health'} and all your
          Willpower back, Shield removed, one Long Rest action.
        </p>
      </Lesson>

      <Lesson title="After this">
        <p>
          Level 2 at {formatNumber(XP_TABLE[2])} experience brings{' '}
          {next.talent ? 'your next talent choice' : 'your next choice'}. The Advancement tab
          badges whatever is waiting.
        </p>
      </Lesson>

      <Lesson title={waiting.length > 0 ? 'Still to answer' : 'Ready'} kind="how">
        {waiting.length > 0 ? (
          <>
            <p>
              {waiting.length === 1 ? 'One step is' : `${waiting.length} steps are`} still waiting
              on you. The sheet opens once they are answered.
            </p>
            <div className="wt-waiting">
              {waiting.map((entry) => (
                <button
                  key={entry.step.key}
                  type="button"
                  className="btn btn-sub btn-sm"
                  onClick={() => go(entry.step.key)}
                >
                  {entry.step.title}
                  {entry.open > 1 ? ` · ${entry.open} open` : ''}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p>
            Everything level 1 asks is answered. Check the summary beside this, then press{' '}
            <b>Open the sheet</b>.
          </p>
        )}
      </Lesson>

      <More step={step} />
    </>
  );
}
