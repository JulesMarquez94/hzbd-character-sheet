import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import AbilityCard from '../components/AbilityCard.jsx';
/* From spells.js and not weapons.js on purpose: weapons.js assembles the whole
   card registry, so reaching one spell through it would put talents, lineages
   and backgrounds into the bundle a first-time visitor downloads. */
import { SPELLS } from '../lib/spells.js';
import './Landing.css';

/**
 * The card in the shop window.
 *
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

const PILLARS = [
  {
    title: 'Industrial Arcana',
    body:
      'Channel localized environmental mana into brass weaponry. Overcharge internal gearworks to manipulate combat velocity round-by-round.',
  },
  {
    title: 'Cards, Not Lookups',
    body:
      'Every spell, talent and weapon action lives on its own card — cost badges, banner and rules text — so the table never stops to search a rulebook.',
    accent: true,
  },
  {
    title: 'Tactical Resource Pools',
    body:
      'Track Action and Reaction Points, Willpower, Karma, Shield and Vitality live during play. Every change saves to your vault instantly.',
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <main className="page landing">
      <section className="hero container">
        <span className="hero-badge">A Victorian High-Fantasy TTRPG</span>
        <h1 className="heading-hero">Enter The Hazebound Worlds</h1>
        <p className="hero-lede">
          Confront eldritch machines, command shifting mechanical aether currents, and forge your survival
          in an empire choking on volatile arcane industrialism.
        </p>

        <div className="hero-buttons">
          <Link to={user ? '/dashboard' : '/register'} className="btn btn-copper">
            {user ? 'Open My Vault' : 'Create A Character'}
          </Link>
          <Link to="/codex" className="btn btn-purple-outline">
            Explore System Rules
          </Link>
          {!user && (
            <Link to="/login" className="btn btn-minimal">
              I Have An Account
            </Link>
          )}
        </div>
      </section>

      <section className="container showcase">
        <div className="showcase-copy">
          <h2 className="heading-section" style={{ fontSize: '2rem' }}>
            Your Abilities, On Cards
          </h2>
          <p>
            Hazebound abilities are built to be read at a glance. The banner tells you what the ability{' '}
            <em>is</em>, the badges tell you what it <em>costs</em>, and the body tells you exactly what
            happens — nothing else.
          </p>
          <ul className="showcase-list">
            <li>
              <span className="dot dot-ap" /> Gold orb — Action Point cost
            </li>
            <li>
              <span className="dot dot-wp" /> Violet orb — Willpower cost
            </li>
            <li>
              <span className="dot dot-banner" /> Grey chevron — school, tier and damage family
            </li>
          </ul>
          <p className="muted">
            Build your own deck of cards per character, then flip through them at the table on any device.
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

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} Hazebound Chronicles. All mechanical layouts and assets reserved.</p>
      </footer>
    </main>
  );
}
