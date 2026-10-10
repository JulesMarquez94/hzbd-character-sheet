import { useState } from 'react';
import { ATTRIBUTES, damageStyle } from '../../lib/cardText.js';
import { KEYWORDS } from '../../lib/keywords.js';

/**
 * Every word in the game that means something exact, and the colour it is
 * written in wherever it appears.
 *
 * The words come out of `src/lib/keywords.js`, which is the same list the cards
 * themselves are marked up against: a term is defined here because a card can
 * light it up, so the glossary and the tooltips can never disagree. Chapter
 * Eleven of the rulebook is that file read out, and this is the searchable one.
 *
 * The colour key above it is what the old codex page was for. A reader who has
 * seen violet on a card and orange on a stat should be able to find out what
 * they mean without opening a card, and the three families of damage are a rule
 * (5.8) as much as a palette.
 */

/* The nine, in the three families Chapter 5.8 groups them in. The colours are
   read off `damageStyle`, so this names the rule and never a hex. */
const DAMAGE = [
  ['Physical', ['Sharp', 'Blunt', 'Force']],
  ['Elemental', ['Fire', 'Cold', 'Lightning']],
  ['Metaphysical', ['Sacred', 'Decay', 'Psychic']],
];

/** The pools a character spends and the numbers they are measured by. */
const POOLS = [
  ['Health', 'var(--stat-health)'],
  ['Shield', 'var(--stat-shield)'],
  ['Action Points', 'var(--stat-ap)'],
  ['Reaction Points', 'var(--stat-rp)'],
  ['Willpower', 'var(--stat-wp)'],
  ['Karma', 'var(--stat-karma)'],
  ['Armor', 'var(--stat-armor)'],
  ['Defense', 'var(--focus-cyan)'],
  ['Speed', 'var(--stat-speed)'],
  ['Initiative', 'var(--stat-init)'],
  ['Coins', 'var(--stat-coin)'],
  ['Supplies', 'var(--stat-supply)'],
  ['Magic Burden', 'var(--haze-lilac)'],
];

function Swatch({ name, color }) {
  return (
    <span className="swatch" style={{ color }}>
      <span className="swatch-dot" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}

export default function Glossary() {
  const [query, setQuery] = useState('');

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  /* Alphabetical by the form the game prints, which is the order somebody
     looking a word up expects. The file's own order is the order the rules
     introduce them in, and that is Chapter Eleven's job rather than this one's. */
  const entries = [...KEYWORDS]
    .map((entry) => ({ ...entry, term: entry.terms[0] }))
    .sort((a, b) => a.term.localeCompare(b.term))
    .filter((entry) => {
      if (words.length === 0) return true;
      const hay = `${entry.terms.join(' ')} ${entry.detail}`.toLowerCase();
      return words.every((word) => hay.includes(word));
    });

  return (
    <>
      <section className="key-panel">
        <h3 className="rule-heading">The colour key</h3>
        <p className="rule-text">
          A value is written in its own colour on every card, every block and every row of
          this site. These are the colours, and the three families of damage are the ones
          Chapter Five groups them in.
        </p>

        <div className="key-grid">
          {DAMAGE.map(([family, types]) => (
            <div className="key-group" key={family}>
              <span className="key-group-label">{family} damage</span>
              <div className="key-row">
                {types.map((type) => (
                  <Swatch key={type} name={type} color={damageStyle(type)?.color} />
                ))}
              </div>
            </div>
          ))}

          <div className="key-group">
            <span className="key-group-label">The three attributes</span>
            <div className="key-row">
              {['physique', 'instinct', 'mind'].map((key) => (
                <Swatch key={key} name={ATTRIBUTES[key].label} color={ATTRIBUTES[key].color} />
              ))}
            </div>
          </div>

          <div className="key-group key-group-wide">
            <span className="key-group-label">What you spend and what you have</span>
            <div className="key-row">
              {POOLS.map(([name, color]) => (
                <Swatch key={name} name={name} color={color} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="shelf-find shelf-find-one">
        <input
          className="form-input"
          type="search"
          placeholder="Look a word up"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search the glossary"
        />
      </div>

      <p className="shelf-count">
        {entries.length} {entries.length === 1 ? 'term' : 'terms'}
      </p>

      {entries.length === 0 ? (
        <p className="shelf-empty">No word in the game means that.</p>
      ) : (
        <dl className="glossary">
          {entries.map((entry) => (
            <div className="glossary-row" key={entry.id}>
              <dt style={{ color: entry.color ?? 'var(--text-bright)' }}>
                {entry.term}
                {entry.terms.length > 1 && (
                  <span className="glossary-also">also {entry.terms.slice(1).join(', ')}</span>
                )}
              </dt>
              <dd>{entry.detail}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );
}
