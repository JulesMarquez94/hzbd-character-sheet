import { useLayoutEffect, useRef } from 'react';
import CardText from './CardText.jsx';
import CostOrbs from './CostOrbs.jsx';
import { cardBanner } from '../lib/cardText.js';
import './AbilityCard.css';

/**
 * A card dealt at a fixed size has to hold whatever is printed on it. This
 * measures the rules text once it is laid out and, when it runs past the
 * bottom edge, steps the type down until it fits — the way a card is set
 * rather than the way a web page scrolls.
 */
function useFitText(enabled, signature) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return undefined;

    /**
     * Set full size, read what that costs, set the scale that fits — all in
     * one synchronous pass, so the measurement can never read a size that a
     * pending render is about to change.
     */
    function fitNow() {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty('--ac-fit', '1');
      const natural = el.scrollHeight;
      const box = el.clientHeight;
      // The card's proportions are fixed — the art plate keeps its 4:3 window
      // whatever the text needs — so the type is the only thing that gives.
      // The floor is where it stops being readable at arm's length; a card
      // dense enough to hit it scrolls its last lines rather than shrinking on.
      const scale = natural > box + 1 ? Math.max(0.62, (box / natural) * 0.98) : 1;
      el.style.setProperty('--ac-fit', String(scale));
    }

    fitNow();
    // The fallback face sets to a different depth than the real one.
    document.fonts?.ready.then(fitNow);

    // A narrower card wraps more lines, so the fit is re-taken on resize.
    let lastWidth = 0;
    const observer = new ResizeObserver((entries) => {
      const width = Math.round(entries[0].contentRect.width);
      if (width === lastWidth) return;
      lastWidth = width;
      fitNow();
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, [enabled, signature]);

  return ref;
}

/**
 * The type banner is one line, always. A long banner — "NOVICE SPELL - PRIMAL -
 * FLORA" — used to wrap and push the plaque out of shape; now the lettering
 * steps down until it fits across, which is how a printed plaque is set.
 *
 * The scale is measured on the plaque (a fixed share of the card's width) and
 * applied to the lettering inside it, so changing the type can never change the
 * box being measured.
 */
function useFitLine(signature) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return undefined;

    function fitNow() {
      const plaque = ref.current;
      const line = plaque?.firstElementChild;
      if (!line) return;

      plaque.style.setProperty('--ac-line-fit', '1');
      const style = getComputedStyle(plaque);
      const room =
        plaque.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const needed = line.scrollWidth;
      const scale = needed > room + 1 ? Math.max(0.55, (room / needed) * 0.99) : 1;
      plaque.style.setProperty('--ac-line-fit', String(scale));
    }

    fitNow();
    document.fonts?.ready.then(fitNow);

    const observer = new ResizeObserver(fitNow);
    observer.observe(box);
    return () => observer.disconnect();
  }, [signature]);

  return ref;
}

function SparkIcon() {
  return (
    <svg className="ac-spark" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8Z"
      />
    </svg>
  );
}

/**
 * A single Hazebound ability card.
 *
 * Takes either shape: a row typed into the Abilities tab
 * ({ type_line, ap_cost, wp_cost }) or a codex card, which states its banner
 * as tags and its costs as `ap` / `wp`.
 *
 * @param ability   the card
 * @param onClick   optional — makes the whole card a button (the grid opens the editor with it)
 * @param character when given, live values in the body resolve against this character
 * @param onValue   called with a value's working when the reader taps it
 * @param onLink    called with a card name when the reader taps a {{link}}
 * @param footer    small line under the rules text (an enchantment's burden and price)
 * @param fit       shrink the type until the rules text fits the card's fixed
 *                  height. On by default — every card is a fixed 360x640, so
 *                  every card has a box to fit. Only turn it off for a card
 *                  whose text is still being typed, where re-measuring on each
 *                  keystroke would fight the writer.
 * @param modifiers what the holder does to the card: `{ damage, empower, choice, stat }`.
 *                  `choice` is the option this character picked where the card
 *                  asks for one — a scale colour, a casting attribute.
 */
export default function AbilityCard({
  ability,
  onClick,
  actions = null,
  character = null,
  onValue = null,
  onLink = null,
  footer = null,
  fit = true,
  modifiers = null,
}) {
  const {
    name,
    body,
    sub_name: subName,
    sub_body: subBody,
    art_url: artUrl,
    kind = 'ability',
  } = ability;

  const typeLine = cardBanner(ability);
  const apCost = ability.ap_cost ?? ability.ap;
  const wpCost = ability.wp_cost ?? ability.wp;

  const hasSpark = kind === 'spell' || kind === 'skill';

  // What the card rolls with. Printed on the card, unless whoever handed it
  // over casts off a different attribute — a Mycomancer's prepared spells are
  // printed for Mind and cast with Instinct.
  const stat = modifiers?.stat ?? ability.stat ?? 'instinct';

  // An infusion replaces the card's printed damage type outright; every
  // Empowering working stacks onto the dice.
  const damage = modifiers?.damage ? [modifiers.damage] : ability.damage ?? [];
  const empower = Number(modifiers?.empower) || 0;

  // A card that asks the holder to decide something prints their answer; with
  // nothing picked yet it prints what it is still waiting for.
  const choice = modifiers?.choice ?? null;
  const choicePrompt = ability.choice?.placeholder ?? null;

  const textProps = { character, stat, damage, empower, choice, choicePrompt, onValue, onLink };
  const bannerRef = useFitLine(typeLine);
  const bodyRef = useFitText(fit, `${name}|${body}|${subBody}|${damage.join()}|${empower}|${choice?.id ?? ''}`);

  const content = (
    <>
      <div
        className={`ac-art${artUrl ? '' : ' ac-art-empty'}`}
        style={artUrl ? { backgroundImage: `url("${artUrl}")` } : undefined}
      >
        <CostOrbs ap={apCost} wp={wpCost} size={38} className="ac-costs" />

        {hasSpark && <SparkIcon />}

        {typeLine && (
          <div className="ac-banner" ref={bannerRef}>
            <span>{typeLine}</span>
          </div>
        )}
      </div>

      {/* --ac-fit is written straight onto this node by useFitText. */}
      <div className="ac-body" ref={bodyRef}>
        <h3 className="ac-title">{name}</h3>
        <div className="ac-text">
          <CardText text={body} {...textProps} />
        </div>

        {subName && (
          <>
            <h4 className="ac-title ac-title-sub">{subName}</h4>
            <div className="ac-text">
              <CardText text={subBody} {...textProps} />
            </div>
          </>
        )}

        {footer && <div className="ac-foot">{footer}</div>}
      </div>

      {actions && <div className="ac-actions">{actions}</div>}
    </>
  );

  // The kind picks the card's accent colour — see AbilityCard.css.
  const className = `ability-card ac-kind-${kind}`;

  if (onClick) {
    return (
      <div className={className}>
        <button type="button" className="ac-hitbox" onClick={onClick} aria-label={`Edit ${name}`} />
        {content}
      </div>
    );
  }

  return <article className={className}>{content}</article>;
}
