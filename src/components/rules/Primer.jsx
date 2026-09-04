import AbilityCard from '../AbilityCard.jsx';
import Prose, { Line } from './Prose.jsx';
import { cardBanner } from '../../lib/cardText.js';
import { SPELLS } from '../../lib/spells.js';
import { chapter } from '../../lib/rulebook.js';

/**
 * How to play, in one screen.
 *
 * Everything here is in the rulebook and most of it is Chapter One and Chapter
 * Five. This is the short version somebody reads before their first session,
 * and every block says which chapter owns it, so nothing on this page is the
 * last word on anything.
 *
 * Under it, Appendix A verbatim: the page a Game Master keeps open. That one is
 * not summarised, it is the book's own blocks drawn from the parsed markdown,
 * because a quick reference that had been retyped is a quick reference that is
 * quietly wrong about one number.
 */

/* The rulebook's own worked example (1.4), so the card being explained is the
   card the book walks through. `promo` for the same reason the landing page
   uses it: this is the section that explains what an art plate is, and drawing
   it empty to everybody who has not paid would explain nothing. */
const SHOWCASE = SPELLS.find((spell) => spell.id === 'bramble-whip');

const LAWS = [
  {
    title: 'You roll two dice',
    body:
      'Everything you roll is **2d6 and an attribute**, thrown against a number. An attack, a leap, a lie and a working of magic are the same throw judged against a different number. There is no second system underneath.',
  },
  {
    title: 'You play cards',
    body:
      'Everything you can do is on a card: your spells, your weapon’s two swings, the manoeuvre you trained for and the eleven things anyone can do. Each one says what it costs, what it hits and what happens. **Nobody stops the table to look something up.**',
  },
  {
    title: 'Everything costs',
    body:
      'A turn is **six Action Points**. Magic is **Willpower**. The road is **Supplies**. A character is a set of pools, and the interesting question is always which one you are willing to empty.',
  },
];

const STEPS = [
  ['Spread your attributes', 'A +2 and a +1, on two different attributes. Everything starts at 4, so you finish on 6 / 5 / 4.'],
  ['Choose a lineage', 'What you are, and the cards your blood gives you. It costs nothing and forbids nothing.'],
  ['Choose a background', 'What you did before this. It gives you skills, a kit that really lands in your pack and your purse.'],
  ['Choose a talent set', 'What you trained at, and where every level after this one goes.'],
  ['Spend the purse', '6,000 coins and 70 Supplies, against the gear tables.'],
];

const ANATOMY = [
  {
    color: 'var(--stat-ap)',
    title: 'The gold orb',
    body: 'What it costs in Action Points. Absent when the card is free or is simply true of you.',
  },
  {
    color: 'var(--haze-glow)',
    title: 'The violet orb',
    body: 'What it costs in Willpower. Only spells and empowered techniques carry one.',
  },
  {
    color: '#8b8e93',
    title: 'The banner',
    body: 'What the card is, in the order its own family reads it.',
    /* Read off the card rather than typed here. The banner used to be quoted as
       "Novice Spell - Nature - Blood" and the school had since been renamed
       Primal, which is exactly what a quoted example does. */
    quote: SHOWCASE ? cardBanner(SHOWCASE) : null,
  },
  {
    color: 'var(--def-healing)',
    title: 'The arrow',
    body:
      'How many d4 of Advantage you have on this roll. Red and pointing down for Disadvantage, and gone when the two cancel out.',
  },
  {
    color: 'var(--text-bright)',
    title: 'The second heading',
    body:
      'An optional half: Overcast, Multicast, Blood Tithe or Upkeep. Spend more than the card asks and it does more.',
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
          The throw
          <span className="primer-ref">Chapter One</span>
        </h2>

        <p className="rule-text">
          Roll <code className="rule-code">2d6 + an attribute</code> and compare it to the
          difficulty. What matters is how far you land from that number, not what the faces say.
        </p>

        <div className="rule-table-wrap">
          <table className="rule-table">
            <thead>
              <tr>
                <th>Distance from the DC</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="rule-cell-lead">6 or more under</td>
                <td>Critical Failure</td>
              </tr>
              <tr>
                <td className="rule-cell-lead">under</td>
                <td>Failure</td>
              </tr>
              <tr>
                <td className="rule-cell-lead">equal or over</td>
                <td>Success</td>
              </tr>
              <tr>
                <td className="rule-cell-lead">6 or more over</td>
                <td>Critical Success. It hits, and the damage is maximized</td>
              </tr>
            </tbody>
          </table>
        </div>

        <ul className="rule-list">
          <li>
            <Line text="**Advantage** adds 1d4 and **Disadvantage** subtracts one. Both stack, and they cancel each other one for one." />
          </li>
          <li>
            <Line text="**Karma** is spent after you have seen the result: 1 Karma adds 1d4, and it is only offered when it could still change the band." />
          </li>
          <li>
            <Line text="Damage dice **explode**. A die that rolls its own maximum throws the next die up and adds it. A Roll never explodes: boxcars are just twelve." />
          </li>
        </ul>
      </section>

      <section className="primer-block">
        <h2 className="primer-head">
          Make somebody
          <span className="primer-ref">Chapter Four</span>
        </h2>

        <p className="rule-text">
          Five steps, and there is no points buy, no hit die and nothing to roll.
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
          A turn, and a fight
          <span className="primer-ref">Chapter Five</span>
        </h2>

        <ul className="rule-list">
          <li>
            <Line text="Everyone rolls Initiative: **2d6 + Initiative**, the same throw as everything else." />
          </li>
          <li>
            <Line text="Your **six Action Points** come back at the start of every one of your turns. Move costs 1, most things cost 2 and getting into your pack costs 4." />
          </li>
          <li>
            <Line text="An attack is rolled against the target's **Defense**. A spell that is not swung names **Reflex** or **Grit** instead. There is no third number." />
          </li>
          <li>
            <Line text="**Reaction Points** are earned during the round and spent on somebody else's turn. One reaction per action, and it resolves before the action does." />
          </li>
          <li>
            <Line text="Damage lands in one order: **Armor** comes off each hit, then **Shield** soaks what it can, then **Health** takes the rest." />
          </li>
          <li>
            <Line text="At 0 Health you are bleeding out and still on the table. A second full bar of damage past that is death." />
          </li>
        </ul>
      </section>

      <section className="primer-block">
        <h2 className="primer-head">
          Stopping for the night
          <span className="primer-ref">Chapter Eight</span>
        </h2>

        <p className="rule-text">
          Nothing heals on its own. Health comes back from a rest, a card or a flask, and both
          rests are paid for in Supplies.
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
                <td>half your maximum</td>
                <td>all of it</td>
              </tr>
              <tr>
                <td className="rule-cell-lead">Willpower</td>
                <td>nothing</td>
                <td>all of it</td>
              </tr>
              <tr>
                <td className="rule-cell-lead">Shield</td>
                <td>left standing</td>
                <td>all of it gone</td>
              </tr>
              <tr>
                <td className="rule-cell-lead">Actions</td>
                <td>none</td>
                <td>one</td>
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
            A card says what it costs, what it reaches and what happens, and the numbers on it
            are already worked out. This one is printed for a level {character.level} character
            with a Mind of {character.mind}.
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

      {onePage && (
        <section className="primer-block one-page">
          <h2 className="primer-head">
            {onePage.title}
            <span className="primer-ref">Appendix A</span>
          </h2>
          <p className="rule-text">
            The reference a Game Master keeps beside them, and the one part of this page that is
            the book itself rather than a summary of it.
          </p>
          <Prose blocks={onePage.blocks} />
        </section>
      )}

      <section className="primer-next">
        <p>That is enough to sit down and play. The rest is reference.</p>
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
