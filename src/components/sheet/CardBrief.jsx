import CostOrbs from '../CostOrbs.jsx';
import useCodexArt from '../useCodexArt.js';
import { cardBanner, cardGist, damageStyle } from '../../lib/cardText.js';

/**
 * A card said in a line rather than printed in full.
 *
 * A rank of a talent set is four or five cards, a lineage is four, and a school
 * of spells is a couple of dozen. At 360x640 apiece that is a wall you scroll
 * past, so every overview prints briefs instead and keeps the cards themselves
 * one tap away, on the stack.
 *
 * What a brief says is the card's **summary**: one short line of what it
 * actually gives you, written the way a lineage's tagline is written. "Sharp
 * weapons deal 1 extra damage per die" is what you choose by. The rules text is
 * what you play by, and that is on the card. A card with no summary written yet
 * falls back to its rules text run flat, so nothing is ever blank.
 *
 * The face is the card's own face, reduced: the 4:3 art plate, then the name
 * and what the card is. Cards carry no art of their own yet, so the plate takes
 * the family's (a lineage's, a talent set's) and otherwise fills its window
 * with haze, which is what the card does too.
 *
 * The cost sits at the top-right, level with the name, rather than on the art.
 * The printed card puts its orbs on the plate because the plate is 360px wide
 * and can carry them; at 92px they covered the art and were still too small to
 * read. On the name line they land in the same corner of every brief in a wall,
 * so a column of costs can be read straight down without reading the names.
 *
 * It carries the card's own accent through `ac-kind-*`, the same classes the
 * printed card wears, so a spell reads violet and a talent amber here too.
 *
 * What a card *is* is said in chips rather than in a banner. Skill, Lineage,
 * Passive, Primal: those are tags, they are what the filter row above a wall
 * filters on, and every other place on the sheet that shows a tag shows it as a
 * chip. Running them together into one uppercase line made the brief the only
 * place they read as a title instead. The first chip is the card's kind and
 * wears the card's accent; the rest are plain. Only a card carrying a
 * hand-written `type_line` instead of tags still prints a banner, since there
 * is nothing there to cut into chips.
 *
 * `children` is hung under the brief for whatever the view wants, which in the
 * spell chooser is the button that learns it. The face is a button, so an
 * action cannot live inside it.
 */
export default function CardBrief({
  card,
  character = null,
  modifiers = null,
  art = null,
  onOpen,
  held = false,
  children = null,
}) {
  const codexArt = useCodexArt();

  // Tags become chips; a hand-written banner has nothing to cut up, so it
  // stays a banner.
  const tags = card.type_line ? [] : card.tags ?? [];
  const banner = tags.length > 0 ? null : cardBanner(card);
  const damage = modifiers?.damage ? [modifiers.damage] : card.damage ?? [];
  // The card's own art first, the family's second. See the note above. Both
  // come out of the codex, so both are behind the tier gate.
  const plate = codexArt(card.art_url ?? art);
  const line = card.summary ?? cardGist(card, { character, modifiers });

  return (
    <div className={`card-brief ac-kind-${card.kind ?? 'ability'}${held ? ' is-held' : ''}`}>
      <button
        type="button"
        className="card-brief-face"
        onClick={onOpen}
        title={`Open the ${card.name} card`}
      >
        <span className="card-brief-head">
          <span
            className={`card-brief-art${plate ? '' : ' card-brief-art-empty'}`}
            style={plate ? { backgroundImage: `url("${plate}")` } : undefined}
          />

          <span className="card-brief-title">
            <span className="card-brief-name-row">
              <span className="card-brief-name">{card.name}</span>
              <CostOrbs ap={card.ap} wp={card.wp} size={20} className="card-brief-costs" />
            </span>
            {banner && <span className="card-brief-banner">{banner}</span>}

            {(tags.length > 0 || damage.length > 0 || card.sub_name || card.choice) && (
              <span className="card-brief-chips">

                {/* The first tag is what the card is — Talent, Novice Spell,
                    Background Skill — so it takes the accent and leads. */}
                {tags.map((tag, index) => (
                  <span
                    className={`card-brief-chip${index === 0 ? ' is-kind' : ''}`}
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}

                {damage.map((type) => (
                  <span
                    className="card-brief-chip card-brief-dmg"
                    key={type}
                    style={damageStyle(type) ? { color: damageStyle(type).color } : undefined}
                  >
                    {type}
                  </span>
                ))}

                {/* Overcast, Multicast, Upkeep, Blood Tithe: what the second
                    half of the card is called is worth knowing up front. */}
                {card.sub_name && <span className="card-brief-chip">{card.sub_name}</span>}

                {/* A card that leaves something to you says so before you take it. */}
                {card.choice && <span className="card-brief-chip is-open">Your choice</span>}
              </span>
            )}
          </span>
        </span>

        {line && (
          <span className="card-brief-summary" title={line}>
            {line}
          </span>
        )}

        <span className="card-brief-open">Read the card</span>
      </button>

      {children}
    </div>
  );
}
