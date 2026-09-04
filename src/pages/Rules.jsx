import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CardStackProvider } from '../components/CardStack.jsx';
import BestiaryTab from '../components/campaign/BestiaryTab.jsx';
import Book from '../components/rules/Book.jsx';
import CardShelf from '../components/rules/CardShelf.jsx';
import Glossary from '../components/rules/Glossary.jsx';
import ItemShelf from '../components/rules/ItemShelf.jsx';
import Primer from '../components/rules/Primer.jsx';
import { UnitContext } from '../context/units.js';
import '../components/sheet/sheet.css';
import './Campaigns.css';
import './Rules.css';

/**
 * The rules of Hazebound, and everything they are made of.
 *
 * One page with six shelves on it, because they are six answers to one
 * question. Somebody arrives here either to learn the game, to settle an
 * argument about a rule, or to find out what a card actually says, and sending
 * those three people to three different parts of the site would mean each of
 * them had to know which one they were.
 *
 *   play      how to play, in a screen, with the Game Master's one page under it
 *   rulebook  the whole book, from docs/rulebook.md and never retyped
 *   cards     every card in the game, with the card itself a tap behind
 *   items     everything a character can own
 *   bestiary  what the other side of the table plays
 *   glossary  every word that means something exact, searchable
 *
 * The shelf is in the URL (`/rules/cards`), so a link into one is a link into
 * the thing being argued about rather than into the top of a page.
 *
 * ------------------------------------------------------------------ the cards
 * Everything drawn here is read off the same registries the character sheet
 * reads: `CARDS`, `ITEMS`, `KEYWORDS`, the bestiary and the rulebook markdown.
 * Nothing on this page is a copy of anything, which is the only way a rules
 * page and a game stay the same game.
 *
 * The card stack is mounted around the lot, so a card opened out of any shelf
 * is dealt in front of the page exactly as it is on a sheet. It is dealt for
 * `READER` rather than for nobody: a card held by nobody prints a flat zero
 * where its attribute goes, and the live numbers are most of what a card is.
 */

/* Level 3, and the spread a level 3 character actually has: the +2 and the +1
   from creation, plus the one attribute point level 3 grants. See 3.2 and 4.1.
   It is stated on the page rather than hidden, because every number a card
   prints here is this character's and not the reader's. */
const READER = { physique: 4, instinct: 5, mind: 7, level: 3, name: 'the reader' };

const SHELVES = [
  { id: 'play', label: 'How to Play' },
  { id: 'rulebook', label: 'Rulebook' },
  { id: 'cards', label: 'Cards' },
  { id: 'items', label: 'Items' },
  { id: 'bestiary', label: 'Bestiary' },
  { id: 'glossary', label: 'Glossary' },
];

/** The sheet's own key, so choosing feet here means feet on your character
    too. localStorage can throw where site data is blocked, and a preference is
    not worth a white screen. */
function readStoredUnit() {
  try {
    return localStorage.getItem('hzbd-unit') || 'metric';
  } catch {
    return 'metric';
  }
}

const LEDES = {
  play: 'Two dice, a handful of cards and a set of pools you are always deciding which to empty.',
  rulebook: 'The whole book. Every rule, in the order it is written, with its contents down the side.',
  cards: 'Every card in the game. Pick one to read the card itself, with its numbers already worked out.',
  items: 'Everything a character can own: what it does, what it weighs and what it costs.',
  bestiary: 'What the other side of the table plays. A line each, and the whole block behind it.',
  glossary: 'Every word in the game that means something exact, and the colour it is written in.',
};

export default function Rules() {
  const { section } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState(readStoredUnit);

  const here = SHELVES.some((shelf) => shelf.id === section) ? section : 'play';

  useEffect(() => {
    try {
      localStorage.setItem('hzbd-unit', unit);
    } catch {
      // Blocked storage just means the preference does not survive a reload.
    }
  }, [unit]);

  /* A URL naming a shelf that does not exist is corrected rather than shown as
     the primer under somebody else's address. */
  useEffect(() => {
    if (section && section !== here) navigate('/rules', { replace: true });
  }, [section, here, navigate]);

  function go(id) {
    navigate(id === 'play' ? '/rules' : `/rules/${id}`);
    window.scrollTo({ top: 0 });
  }

  return (
    <UnitContext.Provider value={unit}>
      <CardStackProvider character={READER}>
        <main className="page rules">
          <header className="rules-head container">
            <span className="rules-badge">Hazebound · How to Play</span>
            <h1 className="heading-section rules-title">The Rules</h1>
            <p className="rules-lede">{LEDES[here]}</p>
          </header>

          <nav className="rules-tabs container" aria-label="The rules">
            {SHELVES.map((shelf) => (
              <button
                key={shelf.id}
                type="button"
                className={`rules-tab${shelf.id === here ? ' is-on' : ''}`}
                aria-current={shelf.id === here ? 'page' : undefined}
                onClick={() => go(shelf.id)}
              >
                {shelf.label}
              </button>
            ))}

            <span className="rules-tabs-spacer" />

            {/* Distances and weights are metric in the data and printed in feet
                beside them on every card. This is the one place a reader can say
                which of the two they want everywhere else. */}
            <button
              type="button"
              className="rules-unit"
              onClick={() => setUnit(unit === 'metric' ? 'imperial' : 'metric')}
              title="Switch between metres and feet"
            >
              {unit === 'metric' ? 'Metric' : 'Imperial'}
            </button>
          </nav>

          <div className="rules-body container">
            {here === 'play' && <Primer character={READER} onGo={go} />}
            {here === 'rulebook' && <Book />}
            {here === 'cards' && <CardShelf character={READER} />}
            {here === 'items' && <ItemShelf />}
            {here === 'bestiary' && <BestiaryTab unit={unit} />}
            {here === 'glossary' && <Glossary />}
          </div>

          {here !== 'play' && (
            <p className="rules-foot container">
              Printed for a level 3 character with Physique 4, Instinct 5 and Mind 7, so every
              number on a card reads true. Your own sheet prints its own.
            </p>
          )}
        </main>
      </CardStackProvider>
    </UnitContext.Provider>
  );
}
