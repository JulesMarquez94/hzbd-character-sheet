import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import AbilityCard from '../components/AbilityCard.jsx';
import FaqList, { DiscordCta } from '../components/FaqList.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
/* From spells.js and not weapons.js on purpose: weapons.js assembles the whole
   card registry, so reaching one spell through it would put talents, lineages
   and backgrounds into the bundle a first-time visitor downloads. */
import { SPELLS } from '../lib/spells.js';
import './Landing.css';

/**
 * The front page. Its one job is to say what Hazebound is in the time it takes
 * to scroll once, and to get a visitor to try it: read the rules, make a
 * character, bring it to a table.
 *
 * It sells the system before the software. The three laws under the hero are
 * the same three the rulebook and the primer open with, in the same words, so a
 * reader who follows the button finds the page they were promised. The three
 * pillars below the card are what the website adds to the game, the invite is
 * three steps and one button, and the FAQ at the bottom answers the two
 * questions this page raises and cannot answer honestly inside a sales pitch:
 * what the money is for, and why almost nothing is illustrated yet.
 *
 * ------------------------------------------------------------------- the hero
 * Three sentences and two buttons, and it is short on purpose. Every extra
 * clause up here is read instead of the button.
 *
 * The one thing that earns its place beside the button is the line under it:
 * making a character asks for nothing, and a visitor who does not know that
 * reads "Create A Character" as "Sign Up". That promise used to be the fourth
 * sentence of the lede and the second of three competing buttons, which is to
 * say it was made twice and arrived too late both times. It is said once now,
 * where the decision is taken.
 *
 * ------------------------------------------------------------------ the card
 * It used to be a hand-written copy of Blood Spear, which went stale the moment
 * the spell sheet was pulled: it still said Nature where the school is now
 * Primal, still cost 2 Willpower where it costs 3, and printed "3d6 + 3 x Mind"
 * as flat text because it had no character to resolve against. It is the real
 * card now, so it can never say anything the codex does not.
 *
 * `SAMPLE` is the character it is printed for. A card with nobody holding it
 * prints no roll bonus and a flat zero where the dice bonus goes, which is the
 * one thing this card must not do — the live numbers are what it is here to
 * show off.
 */
const SHOWCASE = SPELLS.find((spell) => spell.id === 'blood-spear');
const SAMPLE = { physique: 4, instinct: 4, mind: 6, level: 3 };

const LAWS = [
  {
    title: 'One kind of roll',
    body:
      'Two six-sided dice plus one of your three attributes, compared to a difficulty. An attack, a climb, a lie and a spell are all the same roll.',
  },
  {
    title: 'Everything is a card',
    body:
      'Spells, weapon attacks, trained moves and the basic actions are cards. Each one states its cost, its reach and what happens, with your own numbers filled in.',
  },
  {
    title: 'Everything has a price',
    body:
      'Action Points to act, Willpower to cast, Supplies to rest. Deciding what to spend now and what to keep for later is the game.',
  },
];

const PILLARS = [
  {
    title: 'A live character sheet',
    body:
      'Your pools, your cards, your rests and your dice on one sheet that works every number out and saves as you play. Tap a card and it spends the points, rolls and writes the result to the table.',
  },
  {
    title: 'A table for your group',
    body:
      'A campaign seats your players at one table: a shared overview of every sheet, a log every roll lands in, encounters built from the bestiary and a fight the Game Master runs turn by turn.',
    accent: true,
  },
  {
    title: 'Rules you can read first',
    body:
      'The whole rulebook, every card, every item, the bestiary and the glossary are public. Learn the game in one screen and make a character before you make an account.',
  },
];

const INVITE = [
  {
    title: 'Read how to play',
    body: 'One screen covers the roll, making a character, a turn in a fight and a rest. Ten minutes.',
    to: '/rules',
    label: 'How to Play',
  },
  {
    title: 'Make a character',
    body: 'A name is all it asks. The sheet walks you through level 1 and does the arithmetic, and the character is kept on this device until you make an account to keep it.',
    to: '/dashboard',
    label: 'Create a Character',
  },
  {
    title: 'Bring it to your table',
    body: 'Start a campaign, hand your players the join code and run your first fight from the Encounters tab.',
    to: '/campaigns',
    label: 'Campaigns',
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <main className="page landing">
      <section className="hero container">
        <span className="hero-badge">Open playtest · free to play</span>
        <h1 className="heading-hero">Enter The Hazebound Worlds</h1>
        <p className="hero-lede">
          A Victorian high-fantasy tabletop roleplaying game. Every roll is two dice plus an
          attribute. Every ability is a card with your own numbers already on it, and the sheet
          does the arithmetic while you play.
        </p>

        {/* Straight to the characters page, signed in or not: signed out it
            is the characters kept on this device, and making one there asks
            for nothing. See src/lib/localCharacters.js. */}
        <div className="hero-buttons">
          <Link to="/dashboard" className="btn btn-copper">
            {user ? 'My Characters' : 'Create A Character'}
          </Link>
          <Link to="/rules" className="btn btn-purple-outline">
            Read The Rules
          </Link>
        </div>

        {/* The promise, at the button rather than in the lede. Signed in it is
            not news, so it is not said. */}
        {!user && (
          <p className="hero-note">
            No account needed. A character you make now is saved in this browser and opens on the
            full sheet. Already have an account? <Link to="/login">Log in</Link>.
          </p>
        )}
      </section>

      <section className="container laws" aria-label="How the game works">
        {LAWS.map((law) => (
          <article className="law" key={law.title}>
            <h3>{law.title}</h3>
            <p>{law.body}</p>
          </article>
        ))}
      </section>

      <section className="container showcase">
        <div className="showcase-copy">
          <h2 className="heading-section" style={{ fontSize: '2rem' }}>
            Your Abilities, On Cards
          </h2>
          <p>
            Every ability is read at a glance. The banner says what the card <em>is</em>, the orbs
            say what it <em>costs</em> and the body says exactly what happens, with the numbers
            already worked out for the character holding it. Nobody stops the game to look a rule
            up.
          </p>
          <ul className="showcase-list">
            <li>
              <span className="dot dot-ap" /> Gold orb · the cost in Action Points
            </li>
            <li>
              <span className="dot dot-wp" /> Violet orb · the cost in Willpower
            </li>
            <li>
              <span className="dot dot-banner" /> Grey banner · rung, school and family
            </li>
          </ul>
          <p className="muted">
            This one is printed for a level {SAMPLE.level} caster with a Mind of {SAMPLE.mind}. Your
            sheet prints yours, and you can flip through them at the table on any device.
          </p>
        </div>

        <div className="showcase-card">
          {/* `promo`, so the one card on the front page is not the one card
              with an empty plate — see showsArt in tiers.js. */}
          <AbilityCard ability={SHOWCASE} character={SAMPLE} artSource="promo" />
        </div>
      </section>

      <section className="container pillars">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className={`pillar${pillar.accent ? ' pillar-accent' : ''}`}>
            <h3>{pillar.title}</h3>
            <p>{pillar.body}</p>
          </div>
        ))}
      </section>

      <section className="container invite">
        <span className="hero-badge">Test it at your table</span>
        <h2 className="heading-section">Three steps to a first session</h2>
        <p className="invite-lede">
          The game is in open playtest. Play it, break it and tell me what happened. Everything
          you need is on this site.
        </p>

        <ol className="invite-steps">
          {INVITE.map((step, index) => (
            <li className="invite-step" key={step.title}>
              <span className="invite-num">{index + 1}</span>
              <b>{step.title}</b>
              <p>{step.body}</p>
              <Link to={step.to} className="invite-link">
                {user && step.to === '/dashboard' ? 'My Characters' : step.label}
              </Link>
            </li>
          ))}
        </ol>

        <div className="hero-buttons">
          <Link to="/dashboard" className="btn btn-copper">
            {user ? 'My Characters' : 'Create A Character'}
          </Link>
          <Link to="/rules" className="btn btn-purple-outline">
            Read How To Play
          </Link>
          {!user && (
            <Link to="/register" className="btn btn-minimal">
              Create A Free Account
            </Link>
          )}
        </div>
      </section>

      {/* Last, because none of it is a reason to try the game and all of it
          is a reason to trust the person asking. The words are in
          src/lib/faq.js and /faq renders the same list. */}
      <section className="container faq-strip" aria-labelledby="faq-heading">
        <span className="hero-badge">Before you ask</span>
        <h2 className="heading-section" id="faq-heading">
          Common questions
        </h2>
        <p className="invite-lede">
          What it costs, what is still missing and who is behind it. Every answer is also on the{' '}
          <Link to="/faq">FAQ page</Link>.
        </p>

        <FaqList />
        <DiscordCta />
      </section>

      <SiteFooter />
    </main>
  );
}
