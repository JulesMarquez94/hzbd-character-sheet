import { useLayoutEffect, useRef } from 'react';
import CardText from './CardText.jsx';
import CostOrbs from './CostOrbs.jsx';
import RollArrow from './RollArrow.jsx';
import { cardBanner, cardTitle } from '../lib/cardText.js';
import useCodexArt from './useCodexArt.js';
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
 * @param modifiers what the holder does to the card:
 *                  `{ damage, empower, elevate, bonus, choice, stat, actor,
 *                  advantage, disadvantage }`.
 *                  `bonus` is flat damage something else is lending this swing
 *                  — a Trickster's stolen Poison, and nothing else yet.
 *                  `choice` is the option this character picked where the card
 *                  asks for one — a scale colour, a casting attribute.
 *                  `actor` is somebody else on the sheet playing it: a
 *                  draconic ally's card prints the ally's numbers, not its
 *                  bonded's. See minionModifiers in minions.js.
 *                  `advantage` and `disadvantage` are counts of d4 on the
 *                  roll this card asks for — a Duelist's one-handed weapon, a
 *                  Martial Move riding the swing — drawn as one arrow in the
 *                  corner. See RollArrow.jsx and attackModifiers in moves.js.
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
  artSource = 'codex',
}) {
  const { name, body, sub_name: subName, sub_body: subBody, kind = 'ability' } = ability;

  // The picture is the codex's, so it is a paid one — see useCodexArt.js. A
  // tier that has not bought it gets the empty plate this card already draws
  // for a spell nobody has painted yet.
  const artUrl = useCodexArt()(ability.art_url, artSource);

  const typeLine = cardBanner(ability);
  /* What the card is headed with. A weapon card is headed with the move alone
     and names its weapon in the banner instead; every other card heads with its
     whole name, which is what this hands back. See cardText.js. */
  const title = cardTitle(ability);
  const apCost = ability.ap_cost ?? ability.ap;
  const wpCost = ability.wp_cost ?? ability.wp;

  /* The plates that carry the little four-point spark: a spell, a skill, and a
     Martial Move, which wears one on all six of the printed Novice cards. */
  const hasSpark = kind === 'spell' || kind === 'skill' || kind === 'martial-move';

  // What the card rolls with. Printed on the card, unless whoever handed it
  // over casts off a different attribute — a Mycomancer's prepared spells are
  // printed for Mind and cast with Instinct.
  const stat = modifiers?.stat ?? ability.stat ?? 'instinct';

  // And *whose* numbers it prints. A creature on your sheet plays its own
  // cards off its own attributes, so the card is resolved against it rather
  // than against the character holding the block.
  const who = modifiers?.actor ?? character;

  // An infusion replaces the card's printed damage type outright; every
  // Empowering working stacks onto the dice, and every Elevating one grows
  // them a size.
  const damage = modifiers?.damage?.length ? modifiers.damage : ability.damage ?? [];
  const empower = Number(modifiers?.empower) || 0;
  const elevate = Number(modifiers?.elevate) || 0;
  const bonus = Number(modifiers?.bonus) || 0;

  /* And what is happening to the roll this card asks for, drawn as one arrow
     under the cost orbs. Nothing on a codex card carries these: they are the
     holder's, which is exactly why they are printed here rather than written into
     a body — the same card in another pair of hands has no arrow at all. */
  const advantage = Number(modifiers?.advantage) || 0;
  const disadvantage = Number(modifiers?.disadvantage) || 0;
  const advantageFrom = modifiers?.advantageFrom ?? [];

  // A card that asks the holder to decide something prints their answer; with
  // nothing picked yet it prints what it is still waiting for.
  const choice = modifiers?.choice ?? null;
  const choicePrompt = ability.choice?.placeholder ?? null;

  const textProps = {
    character: who,
    stat,
    damage,
    empower,
    elevate,
    bonus,
    choice,
    choicePrompt,
    onValue,
    onLink,
  };
  const bannerRef = useFitLine(typeLine);
  const bodyRef = useFitText(
    fit,
    `${name}|${body}|${subBody}|${damage.join()}|${empower}|${elevate}|${bonus}|${choice?.id ?? ''}`
  );

  const content = (
    <>
      <div
        className={`ac-art${artUrl ? '' : ' ac-art-empty'}`}
        style={artUrl ? { backgroundImage: `url("${artUrl}")` } : undefined}
      >
        <div className="ac-badges">
          <CostOrbs ap={apCost} wp={wpCost} size={38} className="ac-costs" />
          <RollArrow
            advantage={advantage}
            disadvantage={disadvantage}
            from={advantageFrom}
            size={34}
          />
        </div>

        {hasSpark && <SparkIcon />}

        {typeLine && (
          <div className="ac-banner" ref={bannerRef}>
            <span>{typeLine}</span>
          </div>
        )}
      </div>

      {/* --ac-fit is written straight onto this node by useFitText. */}
      <div className="ac-body" ref={bodyRef}>
        <h3 className="ac-title">{title}</h3>
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
