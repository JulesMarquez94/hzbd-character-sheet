import { Link } from 'react-router-dom';
import CardBrief from '../CardBrief.jsx';
import { BLOCK_NAMES } from '../blockNames.js';
import { useCardStack } from '../../../context/card-stack.js';
import { useDiceTray } from '../../../context/dice-tray.js';
import { BASIC_ACTIONS } from '../../../lib/actions.js';
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
  formatNumber,
  formatSpeed,
  karmaCap,
  liveCharacter,
  shieldCapFor,
} from '../../../lib/characterModel.js';
import { CHECK_DICE, CRIT_BAND } from '../../../lib/dice.js';
import { REST_HEALTH } from '../../../lib/grants.js';
import { levelGrants } from '../../../lib/levels.js';
import { LINEAGES } from '../../../lib/lineages.js';
import { RESTS } from '../../../lib/rest.js';
import { mathLine, statMath } from '../../../lib/statMath.js';
import { TALENTS, TALENT_RANKS } from '../../../lib/talents.js';
import { ruleHref, stepsWaiting } from '../../../lib/walkthrough.js';

/**
 * What each step of the Walkthrough teaches, beside the panel that asks it.
 *
 * Seven lessons, one a step, each in three parts: what the rule is, how the
 * panel standing beside it works, and where the rulebook writes the rule out in
 * full. The prose is written for somebody on their first character and in the
 * rulebook's own voice: say what the rule is and how to use it, in plain words.
 *
 * **No number in here is typed.** The base an attribute starts at, the ceiling,
 * the rank titles and the levels they open at, the coins a background is worth,
 * what a rest costs and how wide the critical band is are all read off the code
 * that enforces them, so a lesson can never teach a number the sheet no longer
 * uses. Where a lesson shows the character's own numbers it shows them through
 * `statMath`, which is the arithmetic every tile on the Character tab prints on
 * hover, so the first thing a new player reads about Health is the same line
 * they will read there.
 *
 * Every lesson closes on the rulebook. The links open the book in a new tab on
 * purpose: leaving this screen mid-walk is allowed and remembered, and it is
 * still worse than reading a rule and coming straight back to the panel.
 *
 * `character` is the row as stored, `state` is `levelOneState`'s reading of it,
 * and `go(key)` moves the walk to another step, for the lesson that has reason
 * to send somebody back.
 *
 * Seven named exports and nothing else, so this file stays a file of
 * components; Walkthrough.jsx keys them by step. A map exported from here would
 * be a constant beside components, which is what breaks fast refresh.
 */

/* The DC a practice roll is thrown against: the bottom rung of the ladder in
   1.10, an easy task. Nothing depends on it; it is there so the first roll
   somebody ever makes has a number to reach. */
const PRACTICE_DC = 10;

/* The three basic actions the first lesson prints, chosen to show the three
   things a card can be about: a distance, a roll and a pool. */
const SAMPLE_ACTIONS = ['move', 'skill-check', 'anticipate'];

/* The stats the attributes buy, in the order the Character tab prints them.
   `speed` prints in the reader's unit; everything else is a whole number. */
const NUMBER_ROWS = [
  { key: 'health_max', label: 'Health' },
  { key: 'willpower_max', label: 'Willpower' },
  { key: 'avoid', label: 'Defense' },
  { key: 'initiative', label: 'Initiative' },
  { key: 'speed_m', label: 'Speed', kind: 'speed' },
  { key: 'reflex', label: 'Reflex' },
  { key: 'grit', label: 'Grit' },
];

/* The pools, for the last step. Shield and Karma have no column of their own
   for a ceiling, so they are read the way the Character tab reads them. */
const POOL_ROWS = [
  { key: 'health_max', label: 'Health' },
  { key: 'shield_cap', label: 'Shield, at most', read: (who) => shieldCapFor(who) },
  { key: 'willpower_max', label: 'Willpower' },
  { key: 'ap_max', label: 'Action Points' },
  { key: 'reaction_max', label: 'Reaction Points' },
  { key: 'karma', label: 'Karma, at most', read: (who) => karmaCap(who) },
];

/* The five tabs of the sheet, said in a line each. UI names rather than rules,
   so they live here beside the lesson that names them. */
const TABS = [
  ['Character', 'Your numbers, your pools and the cards you can play, in six blocks.'],
  ['Abilities', 'Every card you hold, grouped by where it came from.'],
  ['Inventory', 'What you wear, what you hold, what is on your belt and what is in your pack.'],
  ['Lore', 'The story, the portrait and the journal.'],
  ['Advancement', 'The choices you made here, level by level, and every choice a new level brings.'],
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
 * A roll to try, one button an attribute. It goes on the dice tray the way
 * every roll on the site does, and nothing is written: a practice roll has no
 * table to tell and no card behind it.
 */
function PracticeRoll({ character }) {
  const tray = useDiceTray();
  if (!tray) return null;

  const dice = `${CHECK_DICE.count}d${CHECK_DICE.faces}`;

  return (
    <div className="wt-roll">
      <p>
        Try one. Every attribute is {ATTRIBUTE_BASE} right now, so the roll is {dice} + {ATTRIBUTE_BASE}{' '}
        against a DC of {PRACTICE_DC}, an easy task.
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
              Roll with {attribute.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Three of the cards everybody holds, one tap from the card itself. */
function SampleCards({ character }) {
  const stack = useCardStack();
  const cards = SAMPLE_ACTIONS.map((id) => BASIC_ACTIONS.find((card) => card.id === id)).filter(
    Boolean
  );

  return (
    <div className="talent-rung-cards wt-cards">
      {cards.map((card) => (
        <CardBrief
          key={card.id}
          card={card}
          character={character}
          onOpen={() => stack?.openCard(card)}
        />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- lessons */

export function BeginLesson({ character, step }) {
  const dice = `${CHECK_DICE.count}d${CHECK_DICE.faces}`;

  return (
    <>
      <Lesson title="One roll">
        <p>
          Whenever what your character tries could fail, you roll {dice}, two six-sided dice, and
          add one of your three attributes: <b>Physique</b>, <b>Instinct</b> or <b>Mind</b>. The
          total is compared to a difficulty number, the <b>DC</b>, which the Game Master sets or a
          card prints. Reach it and you succeed.
        </p>
        <p>
          Land {CRIT_BAND} or more over the DC and the success is critical. Land {CRIT_BAND} or
          more under it and the failure is critical.
        </p>
        <p>
          The roll has three names for three uses. A <b>Skill Check</b> is anything that is not an
          attack: picking a lock, climbing a wall, talking a guard round. An <b>Attack Roll</b> is a
          weapon or a spell swung at somebody, against their Defense. An <b>Attribute Roll</b> is a
          card that names its attribute, against a target&rsquo;s Reflex or Grit. The dice are the
          same for all three.
        </p>
        <PracticeRoll character={character} />
      </Lesson>

      <Lesson title="Everything is a card">
        <p>
          Your spells, your weapon&rsquo;s attacks, the moves your training teaches and the basic
          actions every character can take are all cards. A card says what it costs, how far it
          reaches, who it affects and what happens, with your own numbers filled in. If you hold
          the card, you know the rule.
        </p>
        <p>Three of the basic actions everybody has. Tap one to read it.</p>
        <SampleCards character={character} />
      </Lesson>

      <Lesson title="Everything has a price">
        <ul className="wt-list">
          <li>
            <b>Action Points</b> are what you spend on your own turn. You have six and they come
            back at the start of every turn.
          </li>
          <li>
            <b>Reaction Points</b> are spent on other people&rsquo;s turns. You start a fight with
            none and earn them, most often with Anticipate, which moves unspent Action Points
            across one for one.
          </li>
          <li>
            <b>Willpower</b> pays for spells and other feats of will. It comes back in full on a
            Long Rest and not before.
          </li>
          <li>
            <b>Health</b> is what damage takes away. <b>Shield</b> is a second pool in front of it
            that some cards and gear grant.
          </li>
          <li>
            <b>Supplies</b> pay for rests and for making things. <b>Coins</b> buy everything else.
          </li>
        </ul>
      </Lesson>

      <Lesson title="What you will choose here">
        <ol className="wt-list wt-list-numbered">
          <li>Your attribute spread: a +2 and a +1.</li>
          <li>A talent set: what your character can do.</li>
          <li>A lineage: the blood they come from.</li>
          <li>A background: the life they led, with its skills, its kit and its purse.</li>
          <li>Their story, which has no rules attached.</li>
          <li>Your sheet, read through once before it opens.</li>
        </ol>
        <p>
          Every choice is written to your character the moment you make it. Leave whenever you
          like: the card on your dashboard remembers the step you were on and offers to bring you
          back to it.
        </p>
      </Lesson>

      <Lesson title="How this screen works" kind="how">
        <p>
          The rules stand on one side and the panel you are filling in stands on the other. On a
          phone the panel follows the rules. The steps along the top go anywhere in any order, and
          the buttons at the foot walk them one at a time. Name your character in the panel beside
          this, then press Next.
        </p>
      </Lesson>

      <More step={step} />
    </>
  );
}

export function AttributesLesson({ character, step, unit }) {
  return (
    <>
      <Lesson title="The three attributes">
        <p>
          A character has three attributes, and every one of them starts at <b>{ATTRIBUTE_BASE}</b>.
          Advancement raises them and the ceiling is <b>{MAX_ATTRIBUTE}</b>. They do nothing on
          their own. What they do is make other numbers bigger, and which numbers is what tells
          them apart.
        </p>
        <ul className="wt-list">
          {ATTRIBUTES.map((attribute) => (
            <li key={attribute.key}>
              <b style={{ color: attribute.color }}>{attribute.label}</b> · {attribute.buys}
            </li>
          ))}
        </ul>
      </Lesson>

      <Lesson title="What they buy on your sheet">
        <p>
          Every number below is worked out from your attributes and your level. Nothing on the
          sheet is typed in, and hovering a number on the Character tab shows the same arithmetic.
          Watch this table as you place your boosts.
        </p>
        <Numbers character={character} rows={NUMBER_ROWS} unit={unit} />
      </Lesson>

      <Lesson title="The two boosts of level 1">
        <p>
          Level 1 hands you two boosts, a <b>+2</b> and a <b>+1</b>, and they go on two different
          attributes, so a finished spread reads {ATTRIBUTE_BASE + 2}, {ATTRIBUTE_BASE + 1} and{' '}
          {ATTRIBUTE_BASE} in some order. Every odd level after this raises two different
          attributes by one point each, and a lineage or a piece of gear can add more on top.
        </p>
      </Lesson>

      <Lesson title="How this panel works" kind="how">
        <p>
          Press <b>Choose your Attribute Boosts</b>. The window shows two rows of the three
          attributes: the first row places the +2 and the second the +1. Tapping the attribute the
          other row already holds trades the two rather than refusing. Under the rows,{' '}
          <b>What it buys</b> prints every number the spread would move, before you take it.
        </p>
        <p>
          <b>Take this spread</b> writes it to your character. Afterwards the panel offers Change
          your boosts and Clear, and the same panel sits in the level 1 block of your Advancement
          tab.
        </p>
      </Lesson>

      <More step={step} />
    </>
  );
}

export function TalentLesson({ state, step, go }) {
  const written = TALENTS.filter((talent) => !talent.stub).length;
  const major = state.picks.boosts?.major ?? null;
  const evenLevel = TALENT_RANKS.find((rank) => rank.rank === 2)?.minLevel ?? 4;

  return (
    <>
      <Lesson title="What a talent set is">
        <p>
          A talent set is what your character can <i>do</i>: the abilities that decide how they
          fight and how they handle everything outside a fight. A set has three ranks, and each
          rank unlocks more of its cards.
        </p>
        <table className="wt-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Title</th>
              <th>Earliest level</th>
            </tr>
          </thead>
          <tbody>
            {TALENT_RANKS.map((rank) => (
              <tr key={rank.rank}>
                <td>{rank.rank}</td>
                <td>{rank.title}</td>
                <td>{rank.minLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          You take your first set now, at Rank 1. Every even level after this gives you another
          talent choice: the next rank of a set you hold, or a new set at Rank 1. Rank 2 waits for
          level {evenLevel}. {written} of the {TALENTS.length} sets on the wall are written and
          can be taken; the rest stand there so you can see what is coming.
        </p>
      </Lesson>

      <Lesson title="Choosing by attribute">
        <p>
          Every set leans on one attribute, and the wall is shelved by it.{' '}
          {major ? (
            <>
              Your +2 is on <b>{attributeLabel(major)}</b>, so the {attributeLabel(major)} shelf is
              the one to read first.
            </>
          ) : (
            <>
              You have not placed your boosts yet. Once you have, the shelf that matches your +2 is
              the one to read first.
            </>
          )}{' '}
          If the set you want leans another way, go back and move the +2. Nothing here is fixed
          until you open the sheet.
        </p>
        <div className="pick-tools pick-tools-tight">
          <button type="button" className="btn btn-sub btn-sm" onClick={() => go('attributes')}>
            Back to Attributes
          </button>
        </div>
      </Lesson>

      <Lesson title="Some sets ask for more">
        <p>
          A set can hand you something that is not a card: spells to choose, a creature to name, a
          beast to become, a pact to seal or a vow to swear. When it does, the question opens in a
          window the moment you take the set, and the panel reads <b>Half done</b> until you have
          answered. The sheet will not open with one of those questions still open.
        </p>
      </Lesson>

      <Lesson title="How this panel works" kind="how">
        <p>
          Press <b>Choose a Talent Set</b>. The wall filters by attribute, by role and by search.
          Open a set to read every rank in full, then press <b>Take at Rank 1 · Novice</b>. The
          panel prints the set&rsquo;s Novice cards; tap one to read it.
        </p>
        <p>
          <b>Undo this choice</b> hands the set back, and <b>View full set</b> reopens the reading.
        </p>
      </Lesson>

      <More step={step} />
    </>
  );
}

export function LineageLesson({ step }) {
  return (
    <>
      <Lesson title="What a lineage is">
        <p>
          Your lineage is your ancestry: the blood your character comes from and what it left in
          them. It is not your race and it is not your look. A Celestial has a halo, and who wears
          it is yours to write. You choose it once and it never changes. There are{' '}
          {LINEAGES.length} to choose from.
        </p>
      </Lesson>

      <Lesson title="What it gives you">
        <p>
          Cards. Some are traits that are always true of you and some are abilities you can use,
          and they print on your Abilities tab under the lineage&rsquo;s name. A few lineages add a
          point to an attribute, and that lands on top of the spread you placed. A lineage costs
          nothing and forbids nothing: how the world treats you is for the story.
        </p>
      </Lesson>

      <Lesson title="A question it may leave you">
        <p>
          Some lineage cards ask you to decide something: which damage type your scales turn, which
          spell your blood knows. One lineage asks you to take two traits from a pool instead. The
          window asks the moment you take the lineage, and the panel reads <b>Half done</b> until
          you have answered.
        </p>
      </Lesson>

      <Lesson title="How this panel works" kind="how">
        <p>
          Press <b>Choose a Lineage</b>. Open one to read its lore and every card it gives, then
          press <b>Take</b>. Anything it asks is asked in the same window; answer it and press
          Done. <b>Change lineage</b> reopens the wall and <b>Clear</b> hands the blood back.
        </p>
      </Lesson>

      <More step={step} />
    </>
  );
}

export function BackgroundLesson({ step }) {
  return (
    <>
      <Lesson title="What a background is">
        <p>
          Your background is the life you led before the game begins: the trade or the road you
          came out of. There are {BACKGROUNDS.length}. Choosing one pays out three things at once:
          the <b>skills</b> that life taught you, the <b>kit</b> you walk in carrying and the{' '}
          <b>purse</b> in your pocket. The three trade against each other, so a life that taught
          you more left you less to spend.
        </p>
      </Lesson>

      <Lesson title="Skills">
        <p>
          Each background offers its own pool and lets you learn between {MIN_SKILL_PICKS} and{' '}
          {MAX_SKILL_PICKS} of them. A skill is a card, and skills are never rolled. When you
          attempt something you make a Skill Check, the ordinary roll with whichever attribute the
          task calls for, and a skill you hold changes that roll, most often by granting advantage
          when the task falls in its area. The sheet offers every skill that could apply when you
          make the check.
        </p>
      </Lesson>

      <Lesson title="The kit and the purse">
        <p>
          After the skills the outfitter opens. You choose one full Common armor set, all three
          pieces, and one Common weapon, or two for a background that arms you twice. The trade
          adds a few things of its own. Take the kit and the armor is worn, the weapon is in your
          hand and the rest goes to your belt and pack.
        </p>
        <p>
          Every background starts with <b>{formatNumber(STARTING_SUPPLIES)} Supplies</b>. Coins
          depend on how many skills it teaches: {formatNumber(startingCoins(3))} for three skills,{' '}
          {formatNumber(startingCoins(2))} for two and {formatNumber(startingCoins(1))} for one.
          Supplies pay for rests and coins buy things in the game.
        </p>
      </Lesson>

      <Lesson title="How this panel works" kind="how">
        <p>
          Press <b>Choose a Background</b>. Open a trade to read what it teaches and what it puts
          in your hands, then press <b>Take</b>. The skill pool opens: learn your skills, then
          press <b>Next: your kit</b>. Choose an armor set and a weapon, tap ⓘ on any piece to
          read it, then press <b>Take the kit</b>.
        </p>
        <p>Changing your background hands the kit back first.</p>
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
          Nothing on this page has a rule attached. A portrait and a one-line concept travel with
          the character: they are the card on your dashboard, your face in a campaign log and the
          plate at the top of the sheet. Appearance, personality, backstory and allies are for you
          and your table.
        </p>
        <p>
          Write as much or as little as you want, now or later, from the Lore tab. This step is
          optional.
        </p>
      </Lesson>

      <Lesson title="How this page works" kind="how">
        <p>
          Each panel is a text box and it saves as you type. Your background says what they did;
          the backstory says why they stopped. The journal at the end is for notes between
          sessions.
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
        <p>
          The pools you will spend and the numbers you will be rolled against, as your choices
          left them. Every one of them is on the Character tab, with this arithmetic behind it.
        </p>
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

      <Lesson title="The six blocks of the Character tab">
        <ul className="wt-list">
          {Object.entries(BLOCK_NAMES).map(([id, block]) => (
            <li key={id}>
              <b>{block.name}</b> · {block.note}.
            </li>
          ))}
        </ul>
        <p>You can arrange the blocks, and pin the ones you reach for to the side of the screen.</p>
      </Lesson>

      <Lesson title="Resting">
        <p>
          There are two rests, both taken from the Character tab. A <b>{RESTS.short.label}</b>{' '}
          takes {RESTS.short.hours} hour and {RESTS.short.supplies} Supplies, and gives back{' '}
          {REST_HEALTH.short === 'half' ? 'half your Health' : 'your Health'}. A{' '}
          <b>{RESTS.long.label}</b> takes {RESTS.long.hours} hours and {RESTS.long.supplies}{' '}
          Supplies, gives back {REST_HEALTH.long === 'full' ? 'all your Health' : 'half your Health'}{' '}
          and all your Willpower, removes any Shield and buys you one Long Rest action.
        </p>
      </Lesson>

      <Lesson title="After this">
        <p>
          Level 2 arrives at {formatNumber(XP_TABLE[2])} experience and brings{' '}
          {next.talent ? 'your next talent choice' : 'your next choice'}. Every level after that
          hands out something, and the Advancement tab badges whatever is waiting for you.
        </p>
      </Lesson>

      <Lesson title={waiting.length > 0 ? 'Still to answer' : 'Ready'} kind="how">
        {waiting.length > 0 ? (
          <>
            <p>
              {waiting.length === 1
                ? 'One step is still waiting on you.'
                : `${waiting.length} steps are still waiting on you.`}{' '}
              The sheet opens once they are answered.
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
            Everything level 1 asks is answered. Read the summary beside this once more, then
            press <b>Open the sheet</b>.
          </p>
        )}
      </Lesson>

      <More step={step} />
    </>
  );
}
