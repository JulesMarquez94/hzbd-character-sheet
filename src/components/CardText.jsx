import { Fragment, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { attributeOf, castArticles, castStat, damageStyle, resolveValue } from '../lib/cardText.js';
import { getKeyword, keywordPattern } from '../lib/keywords.js';

/**
 * Card and item rules text, rendered the way the printed cards read.
 *
 *   **bold**            a parameter: how far, at whom, for how long. Only those
 *                       three, and the rule is in keywords.js
 *   {stat} {mind} …     an attribute by name, in that attribute's colour
 *   {damage}            the card's damage type as a coloured chip — already
 *                       swapped for whatever an enchantment turned it into
 *   {choice}            the option this character picked where the card asks
 *                       for one — the scale colour, the casting attribute
 *   {roll} {roll:mind}  what this character adds to that roll — "(+4)" — so a
 *                       card that asks for one says what to add to the die
 *   [[2d6 + 2*stat]]    a live value — "2d8 + 8" for this character holding
 *                       this weapon, and a button that shows the working
 *   {{Cold Infusion}}   a link to another card
 *
 * `context` is what the holder brings: `{ damage, empower, elevate, bonus }`. Text
 * with none of these markers renders as plain paragraphs, so cards typed into
 * the Abilities tab keep working untouched.
 */

/* The bold run reads to the next `**` rather than to the next `*`, because a
   live value is allowed inside one: "**[[2*stat]] meters**" is a distance, and
   `[^*]+` would have stopped at the multiplication sign and printed the marker. */
const TOKEN = /(\*\*(?:[^*]|\*(?!\*))+\*\*|\[\[[^\]]+\]\]|\{\{[^}]+\}\}|\{[a-zA-Z]+(?::[A-Za-z]+)?\})/g;

/** A damage type written in its own colour, lit like the stat names are. */
function DamageChip({ type }) {
  const style = damageStyle(type);
  if (!style) return <strong>{type}</strong>;
  return (
    <span className="dmg-word" style={{ color: style.color }}>
      {type}
    </span>
  );
}

function DamageTypes({ types }) {
  return types.map((type, index) => (
    <span key={type}>
      {index > 0 && (index === types.length - 1 ? ' or ' : ', ')}
      <DamageChip type={type} />
    </span>
  ));
}

/* The bubble's own box, mirrored from .kw-tip in AbilityCard.css — placement
   has to know how big the thing it is placing is. */
const TIP_WIDTH = 260;
const TIP_HEIGHT = 120;

/* Retires whichever explanation is currently open. Hover closes itself on the
   way out, but a tap has no way out — so opening one closes the last. */
let dismissOpenTip = null;

/**
 * A defined term, wearing its own colour and carrying its own explanation.
 *
 * The tooltip is portalled to the body rather than positioned inside the card:
 * a dealt card sits in a stacked, transformed window with `overflow: hidden`,
 * and anything drawn inside it would be clipped by the card's own edge.
 *
 * Hover reads it, and so does a tap — the sheet is used on phones, where there
 * is no hover to have.
 */
function KeywordChip({ keyword, text }) {
  const [tip, setTip] = useState(null);
  const ref = useRef(null);

  function hide() {
    setTip(null);
  }

  function place() {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    // Not enough headroom to sit above the word — drop under it instead.
    const flip = rect.top < TIP_HEIGHT;
    // A keyword at the edge of the screen would otherwise hang its bubble off
    // it: the bubble is centred on the word, so its centre is held far enough
    // in for a full-width one to stay on screen.
    const edge = TIP_WIDTH / 2 + 8;

    if (dismissOpenTip) dismissOpenTip();
    dismissOpenTip = hide;

    setTip({
      top: flip ? rect.bottom + 8 : rect.top - 8,
      left: Math.min(Math.max(rect.left + rect.width / 2, edge), window.innerWidth - edge),
      flip,
    });
  }

  return (
    <button
      type="button"
      ref={ref}
      className="ac-kw"
      style={{ '--kw-color': keyword.color }}
      onMouseEnter={place}
      onMouseLeave={hide}
      onFocus={place}
      onBlur={hide}
      onClick={(event) => {
        // Never let reading a word count as using the thing it is printed on.
        event.stopPropagation();
        event.preventDefault();
        if (tip) hide();
        else place();
      }}
      aria-label={`${text}: ${keyword.detail}`}
    >
      {text}
      {tip &&
        createPortal(
          <span
            className={`kw-tip${tip.flip ? ' flip' : ''}`}
            style={{ top: tip.top, left: tip.left, '--kw-color': keyword.color }}
            role="tooltip"
          >
            <span className="kw-tip-term">{keyword.terms[0]}</span>
            <span className="kw-tip-detail">{keyword.detail}</span>
          </span>,
          document.body
        )}
    </button>
  );
}

/**
 * Plain prose, with every defined term lit. A keyword is matched wherever it
 * appears — inside bold or out — so a term is never coloured on one card and
 * plain on the next.
 */
function renderPlain(text, keyPrefix) {
  // One capture group in the pattern, so split hands back the matches too.
  return text.split(keywordPattern()).map((part, index) => {
    if (!part) return null;
    const key = `${keyPrefix}-k${index}`;
    const keyword = getKeyword(part);
    if (!keyword) return <span key={key}>{part}</span>;
    return <KeywordChip key={key} keyword={keyword} text={part} />;
  });
}


function renderInline(text, ctx, keyPrefix) {
  const { character, stat, damage, empower, elevate, bonus, choice, onValue, onLink } = ctx;

  return text.split(TOKEN).map((chunk, index) => {
    const key = `${keyPrefix}-${index}`;
    if (!chunk) return null;

    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return <strong key={key}>{renderInline(chunk.slice(2, -2), ctx, key)}</strong>;
    }

    /* ---- live value: [[2d6 + 2*stat]] ---- */
    if (chunk.startsWith('[[') && chunk.endsWith(']]')) {
      const expression = chunk.slice(2, -2).trim();
      const resolved = resolveValue(expression, character, stat, { empower, elevate, bonus });

      if (!onValue) {
        return (
          <span key={key} className="ac-value ac-value-flat">
            {resolved.text}
          </span>
        );
      }
      return (
        <button
          key={key}
          type="button"
          className="ac-value"
          onClick={() => onValue({ expression, resolved })}
          title="What makes this number?"
        >
          {resolved.text}
        </button>
      );
    }

    /* ---- card link: {{Cold Infusion}} ---- */
    if (chunk.startsWith('{{') && chunk.endsWith('}}')) {
      const name = chunk.slice(2, -2).trim();
      if (!onLink) return <span key={key} className="ac-link ac-link-flat">{name}</span>;
      return (
        <button key={key} type="button" className="ac-link" onClick={() => onLink(name)}>
          {name}
        </button>
      );
    }

    /* ---- damage type, roll bonus, or an attribute by name ---- */
    if (chunk.startsWith('{') && chunk.endsWith('}')) {
      const word = chunk.slice(1, -1);

      /* ---- the option this character picked: {choice} ---- */
      if (word.toLowerCase() === 'choice') {
        // Unpicked, the card still has to read as a sentence — so it names what
        // it is waiting for rather than leaving a hole in the middle of one.
        if (!choice) {
          return (
            <span key={key} className="ac-choice ac-choice-open">
              {ctx.choicePrompt ?? 'not chosen'}
            </span>
          );
        }
        const tone = damageStyle(choice.damage ?? choice.label);
        return (
          <span key={key} className="ac-choice" style={tone ? { color: tone.color } : undefined}>
            {choice.label}
          </span>
        );
      }

      /* ---- roll bonus: {roll} or {roll:mind} ---- */
      if (word.toLowerCase().startsWith('roll')) {
        // With nobody to roll it, there is no number — the codex prints the
        // card as written rather than claiming a bonus of zero.
        if (!character) return null;

        const named = word.includes(':') ? word.split(':')[1] : null;
        const attribute = attributeOf(named ?? 'stat', stat);
        if (!attribute) return null;

        const resolved = resolveValue(attribute.key, character, stat);
        const text = `(+${resolved.flat})`;

        if (!onValue) {
          return (
            <span key={key} className="ac-value ac-value-flat ac-roll">
              {text}
            </span>
          );
        }
        return (
          <button
            key={key}
            type="button"
            className="ac-value ac-roll"
            onClick={() => onValue({ expression: attribute.key, resolved })}
            title={`What you add to this roll: your ${attribute.label}`}
          >
            {text}
          </button>
        );
      }

      // {damage} takes the holder's type; {damage:Cold} always prints Cold.
      if (word.toLowerCase().startsWith('damage')) {
        const named = word.includes(':') ? [word.split(':')[1]] : null;
        const types = named ?? (damage?.length ? damage : []);
        if (types.length === 0) return null;
        return <DamageTypes key={key} types={types} />;
      }

      const attribute = attributeOf(word, stat);
      if (!attribute) return chunk;
      return (
        <span key={key} className="ac-stat" style={{ color: attribute.color }}>
          {attribute.label}
        </span>
      );
    }

    return <Fragment key={key}>{renderPlain(chunk, key)}</Fragment>;
  });
}

export default function CardText({
  text,
  character,
  stat = 'instinct',
  damage = [],
  empower = 0,
  elevate = 0,
  bonus = 0,
  choice = null,
  choicePrompt = null,
  onValue,
  onLink,
}) {
  if (!text) return null;

  /* "Your highest Attribute" is a rule and not an attribute, so it is settled
     against the character before a single token is rendered: the name printed by
     {stat} and the number printed by [[…]] are then the same attribute by
     construction. See castStat in cardText.js. */
  const cast = castStat(stat, character);
  const ctx = { character, stat: cast, damage, empower, elevate, bonus, choice, choicePrompt, onValue, onLink };

  /* And the article before every {stat} made to agree with it, at the same
     moment and for the same reason. See castArticles in cardText.js. */
  return castArticles(text, cast).split(/\n\s*\n/).map((paragraph, index) => (
    <p key={index}>{renderInline(paragraph, ctx, `p${index}`)}</p>
  ));
}

/** The same renderer without the paragraph wrapper — for one-line item text. */
export function CardLine({ text, character, stat = 'instinct', damage = [], empower = 0, elevate = 0, bonus = 0, choice = null, onValue, onLink }) {
  if (!text) return null;
  const cast = castStat(stat, character);
  return (
    <>
      {renderInline(
        castArticles(text, cast),
        { character, stat: cast, damage, empower, elevate, bonus, choice, onValue, onLink },
        'line'
      )}
    </>
  );
}
