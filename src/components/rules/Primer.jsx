import AbilityCard from '../AbilityCard.jsx';
import Prose, { Block, Line } from './Prose.jsx';
import { cardBanner } from '../../lib/cardText.js';
import { CRIT_BAND, VERDICTS } from '../../lib/dice.js';
import { SPELLS } from '../../lib/spells.js';
import { chapter, rule } from '../../lib/rulebook.js';

/**
 * How to play, in one screen.
 *
 * Everything here is in the rulebook, and most of it is Chapter One, Four and
 * Five. This is the short version somebody reads before their first session,
 * written to be understood on the first pass: what you roll, how a character is
 * made, what you do on your turn and what a rest gives back. Every block says
 * which chapter owns it, so nothing on this page is the last word on anything.
 *
 * Two things on it are read off the game rather than typed. The table of results
 * is built from the dice engine's own four verdicts and the width of the
 * critical band, so it can never disagree with the roller about a name or a
 * number, and it is coloured the way the roller colours a verdict. Under it all,
 * Appendix A is the book's own blocks drawn from the parsed markdown, because a
 * quick reference that had been retyped is a quick reference that is quietly
 * wrong about one number.
 */

/* The rulebook's own worked example (1.7), so the card being explained is the
   card the book walks through. `promo` for the same reason the landing page
   uses it: this is the section that explains what an art plate is, and drawing
   it empty to everybody who has not paid would explain nothing. */
const SHOWCASE = SPELLS.find((spell) => spell.id === 'bramble-whip');

/* Two tables drawn from Chapter One rather than typed here: the three kinds of
   roll and the difficulty ladder. The ladder used to be a line of prose on this
   page, which was one more place to change when a rung moved. Null when the book
   renames the rule, and the block is then left out rather than drawn wrong. */
const KINDS = rule('chapter-one', '1-2-the-three-kinds-of-roll').find((block) => block.type === 'table') ?? null;
const LADDER = rule('chapter-one', '1-10-setting-a-difficulty').find((block) => block.type === 'table') ?? null;

const LAWS = [
  {
    title: 'The roll',
    body:
      'When the outcome of something is in doubt, you roll **2d6 and add one of your three attributes**, then compare the total to a difficulty number. Every roll in the game is this one. It goes by three names that say what it is for: a **Skill Check**, an **Attack Roll** or an **Attribute Roll**.',
  },
  {
    title: 'Everything is a card',
    body:
      'Your spells, the two attacks your weapon gives you, the moves your training taught you and the basic actions everyone can take are all cards. **A card states what it costs, how far it reaches and what happens**, with your own numbers already filled in.',
  },
  {
    title: 'Everything has a price',
    body:
      'Acting on your turn spends **Action Points**, and you get six back every turn. Casting spends **Willpower**, which only comes back when you rest. Resting spends **Supplies**. Deciding what to spend now and what to keep for later is most of the game.',
  },
];

/* The four results, off the engine. The label is the roller's own word for the
   band, in the book's capitalisation, and the tone is the colour the tray and
   the log already give it. See VERDICTS in lib/dice.js. */
const RESULTS = [
  ['critical-failure', `${CRIT_BAND} or more under`, 'You fail badly. The Game Master may add a complication'],
  ['failure', 'Under', 'You do not do it. An attack misses'],
  ['success', 'Equal or over', 'You do it. An attack hits'],
  ['critical-success', `${CRIT_BAND} or more over`, 'You do it exceptionally well. An attack hits and every damage die is maximized'],
].map(([id, distance, means]) => {
  const verdict = VERDICTS.find((entry) => entry.id === id);
  return {
    id,
    distance,
    means,
    tone: verdict.tone,
    label: verdict.label.replace(/\b[a-z]/g, (letter) => letter.toUpperCase()),
  };
});

/* Making a character, in the order the website asks. See Chapter Four. */
const STEPS = [
  ['Create the character', 'On your dashboard, press Create Character and give it a name and a campaign. The creation page opens, and every choice on it saves as you make it.'],
  ['Choose a talent set', 'What your character has trained at. It gives you cards now, and every even level from here will raise a set or add a new one.'],
  ['Choose a lineage', 'What your character is. A few cards, sometimes an attribute bonus. It costs nothing and forbids nothing.'],
  ['Choose a background', 'What your character did before. Pick its skills, then choose a Common armor set and a weapon from the outfitter. You start with 70 Supplies and 2,000 to 6,000 coins: the fewer skills a background teaches, the more coin it gives.'],
  ['Place your attributes', 'All three start at 4. Put +2 on one and +1 on another, so you finish on 6, 5 and 4.'],
  ['Write their story', 'A portrait, a description and a journal. Nothing here has rules attached, and you can fill it in later.'],
];

/* A turn, in the order it happens. See 5.3. */
const TURN = [
  'When a fight starts, everyone rolls Initiative: **2d6 + Initiative**, the same roll as everything else. You begin with six Action Points and no Reaction Points.',
  '**Start your turn.** Your six Action Points come back. Every effect running on you loses a turn, and anything you are keeping up with an Upkeep is paid now or ends.',
  '**Spend your Action Points**, in any order. Move costs 1. Your weapon’s attacks cost 2 to 6. Spells and items cost what their card prints. Basic actions like Hide, Grapple and Shove cost 2. Tap a card and choose action. The sheet spends the points and rolls for you.',
  '**Hold some back** with Anticipate. Action Points you do not spend become Reaction Points, which you spend on other people’s turns. One reaction per action, and it resolves before the action does.',
  '**End your turn.** Nothing is spent by ending it, and your Reaction Points stay with you.',
];

const ANATOMY = [
  {
    color: 'var(--stat-ap)',
    title: 'The gold orb',
    body: 'The cost in Action Points. A card without one is free, or is simply something that is true of you.',
  },
  {
    color: 'var(--haze-glow)',
    title: 'The violet orb',
    body: 'The cost in Willpower. Only spells and abilities that draw on your will carry one.',
  },
  {
    color: '#8b8e93',
    title: 'The banner',
    body: 'What kind of card this is: its rung, its school and its family.',
    /* Read off the card rather than typed here. The banner used to be quoted as
       "Novice Spell - Nature - Blood" and the school had since been renamed
       Primal, which is exactly what a quoted example does. */
    quote: SHOWCASE ? cardBanner(SHOWCASE) : null,
  },
  {
    color: 'var(--def-healing)',
    title: 'The arrow',
    body: 'How many d4 of Advantage you have on this roll. Red and pointing down for Disadvantage, and gone when the two cancel out.',
  },
  {
    color: 'var(--text-bright)',
    title: 'The second heading',
    body: 'An optional second half: Overcast, Multicast, Blood Tithe or Upkeep. Spend more than the card asks and it does more.',
  },
];

/**
 * `character` is the page's own reader, handed down rather than made here.
 * A card printed for nobody prints a flat zero where its attribute goes, and
 * two sample characters on one page would have the card disagreeing with the
 * line under it about whose numbers those are.
 */
export default function Primer({ character, onGo }) {
  const onePage = chapter('appendix-a');

  return (
    <div className="primer">
      <section className="primer-laws">
        {LAWS.map((law) => (
          <article className="primer-law" key={law.title}>
            <h3>{law.title}</h3>
            <p>
              <Line text={law.body} />
            </p>
          </article>
        ))}
      </section>

      <section className="primer-block">
        <h2 className="primer-head">
          The roll
          <span className="primer-ref">Chapter One</span>
        </h2>

        <p className="rule-text">
          Roll <code className="rule-code">2d6 + an attribute</code> and compare the total to the
          difficulty, which the rules call the DC. Reach it and you succeed. Every roll in the
          game is this one, and it goes by three names that say what it is for.
        </p>

        {KINDS && <Block block={KINDS} />}

        <p className="rule-text">
          What matters is how far your total lands from the DC, not what the dice show.
        </p>

        <div className="rule-table-wrap">
          <table className="rule-table">
            <thead>
              <tr>
                <th>Your total, compared to the DC</th>
                <th>Result</th>
                <th>What it means</th>
              </tr>
            </thead>
            <tbody>
              {RESULTS.map((result) => (
                <tr key={result.id}>
                  <td className="rule-cell-lead">{result.distance}</td>
                  <td>
                    <strong className="rule-verdict" style={{ color: result.tone }}>
                      {result.label}
                    </strong>
                  </td>
                  <td>{result.means}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="rule-list">
          <li>
            <Line text="**Advantage** adds a d4 to your total and **Disadvantage** subtracts one. Several of either add several dice, and one of each cancels out." />
          </li>
          <li>
            <Line text="**Karma** is spent after you have seen the result. One Karma adds a d4, and the sheet only offers it when the extra die could still change the result." />
          </li>
          <li>
            <Line text="**Damage dice explode.** A die that shows its highest face adds one die of the next size up, and keeps going if that one does too. The two dice of a roll never explode." />
          </li>
          <li>
            <Line text="**Some rolls are made against you.** The Game Master rolls a trap against your Reflex, a poison against your Grit and an attack against your Defense. You do not roll to dodge or to resist." />
          </li>
        </ul>

        <p className="rule-text">
          <Line text="**The Game Master sets the DC of a Skill Check from the ladder.** The same task can sit on any rung, and each of the last three columns follows one task up it." />
        </p>

        {LADDER && <Block block={LADDER} />}
      </section>

      <section className="primer-block">
        <h2 className="primer-head">
          Making a character
          <span className="primer-ref">Chapter Four</span>
        </h2>

        <p className="rule-text">
          Six steps on the website. There are no points to buy, no dice to roll and no arithmetic
          to do: the sheet works every number out for you.
        </p>

        <ol className="primer-steps">
          {STEPS.map(([title, body], index) => (
            <li key={title}>
              <span className="primer-step-num">{index + 1}</span>
              <span className="primer-step-body">
                <b>{title}.</b> {body}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="primer-block">
        <h2 className="primer-head">
          Your turn in a fight
          <span className="primer-ref">Chapter Five</span>
        </h2>

        <ol className="rule-list rule-list-numbered">
          {TURN.map((step) => (
            <li key={step}>
              <Line text={step} />
            </li>
          ))}
        </ol>

        <ul className="rule-list">
          <li>
            <Line text="An attack is rolled against the target's **Defense**. A spell that is not an attack is rolled against its **Reflex** or **Grit**. There is no third number." />
          </li>
          <li>
            <Line text="Damage lands in one order: **Armor** comes off each hit, then **Shield** absorbs what it can, then **Health** takes the rest." />
          </li>
          <li>
            <Line text="At 0 Health you are bleeding out: unconscious, but alive and still on the table. Another full bar of damage past zero is death. Stabilize stops the bleeding." />
          </li>
        </ul>
      </section>

      <section className="primer-block">
        <h2 className="primer-head">
          Resting
          <span className="primer-ref">Chapter Eight</span>
        </h2>

        <p className="rule-text">
          Nothing heals on its own. Health comes back from a rest, a healing card or a potion, and
          both rests are paid for in Supplies.
        </p>

        <div className="rule-table-wrap">
          <table className="rule-table">
            <thead>
              <tr>
                <th />
                <th>Short Rest</th>
                <th>Long Rest</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="rule-cell-lead">Time</td>
                <td>1 hour</td>
                <td>8 hours</td>
              </tr>
              <tr>
                <td className="rule-cell-lead">Supplies</td>
                <td>5</td>
                <td>10</td>
              </tr>
              <tr>
                <td className="rule-cell-lead">Health</td>
                <td>Half your maximum back</td>
                <td>All of it</td>
              </tr>
              <tr>
                <td className="rule-cell-lead">Willpower</td>
                <td>Nothing</td>
                <td>All of it</td>
              </tr>
              <tr>
                <td className="rule-cell-lead">Shield</td>
                <td>Left in place</td>
                <td>All of it removed</td>
              </tr>
              <tr>
                <td className="rule-cell-lead">Actions</td>
                <td>None</td>
                <td>One</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="primer-block primer-card-block">
        <div className="primer-card-copy">
          <h2 className="primer-head">
            Reading a card
            <span className="primer-ref">Every chapter</span>
          </h2>

          <p className="rule-text">
            A card says what it costs, what it reaches and what happens, and the numbers on it are
            already worked out for the character holding it. This one is printed for a level{' '}
            {character.level} character with a Mind of {character.mind}.
          </p>

          <ul className="anatomy">
            {ANATOMY.map((part) => (
              <li key={part.title}>
                <span className="anatomy-key" style={{ background: part.color }} />
                <span>
                  <b>{part.title}</b>
                  <span className="anatomy-body">
                    {part.body}
                    {part.quote && <span className="anatomy-quote">{part.quote}</span>}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="primer-card">
          {SHOWCASE && <AbilityCard ability={SHOWCASE} character={character} artSource="promo" />}
        </div>
      </section>

      <section className="primer-block">
        <h2 className="primer-head">
          Running the game
          <span className="primer-ref">Chapter Eleven</span>
        </h2>

        <p className="rule-text">
          The Game Master describes the world, sets difficulties from the ladder, plays the
          creatures and hands out experience. On the website, a campaign seats the players at one
          table: their sheets stream to a shared overview, every roll and every card played is
          written to the table log, and the Encounters tab builds fights from the bestiary, rolls
          initiative, runs the turn order and lands the damage. Chapter Eleven walks through all of
          it.
        </p>
        <div className="primer-next-buttons" style={{ justifyContent: 'flex-start' }}>
          <button type="button" className="btn btn-purple-outline" onClick={() => onGo('rulebook', 'chapter-eleven')}>
            Read Chapter Eleven
          </button>
        </div>
      </section>

      {onePage && (
        <section className="primer-block one-page">
          <h2 className="primer-head">
            {onePage.title}
            <span className="primer-ref">Appendix A</span>
          </h2>
          <p className="rule-text">
            The quick reference a Game Master keeps beside them. This is the book itself, not a
            summary of it.
          </p>
          <Prose blocks={onePage.blocks} />
        </section>
      )}

      <section className="primer-next">
        <p>That is enough to play a first session. The rulebook has everything else.</p>
        <div className="primer-next-buttons">
          <button type="button" className="btn btn-copper" onClick={() => onGo('rulebook')}>
            Read the rulebook
          </button>
          <button type="button" className="btn btn-purple-outline" onClick={() => onGo('cards')}>
            Browse the cards
          </button>
          <button type="button" className="btn btn-minimal" onClick={() => onGo('glossary')}>
            Look a word up
          </button>
        </div>
      </section>
    </div>
  );
}
