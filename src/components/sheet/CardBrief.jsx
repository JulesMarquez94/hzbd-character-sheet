import CostOrbs from '../CostOrbs.jsx';
import useCodexArt from '../useCodexArt.js';
import { cardBanner, cardCost, cardGist, cardTitle } from '../../lib/cardText.js';
import { tagStyle } from '../../lib/tagColors.js';

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
 * wears the card's accent; a school or a family wears its own colour (see
 * tagColors.js); anything else is plain. Only a card carrying a hand-written
 * `type_line` instead of tags still prints a banner, since there is nothing
 * there to cut into chips.
 *
 * ------------------------------------------------------------ what is not here
 * **The damage type and the second half used to be chips too, and are not any
 * more.** Jules asked for the row to be cut back on 2026-08-25: a brief already
 * carries the tier, the school, the family and often the weapon, and adding
 * FORCE and OVERCAST to that made a five and six chip row under a name that then
 * had nowhere to sit. Both are still on the card itself, where the damage type
 * is written into the sentence that deals it and the second half has its own
 * heading.
 *
 * **Both are still searchable**, which is the other half of what was asked: the
 * box above a wall reads `cardHaystack` (see abilitySources.js), and that has
 * always carried the damage types and the half's name whether or not anything
 * printed them. Typing "force" or "overcast" narrows a wall to the cards that
 * have them. Only the chips went.
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

  /* Tags become chips; a hand-written banner has nothing to cut up, so it
     stays a banner. A weapon card carries the weapon it belongs to as one more
     chip, in the place the printed banner puts it: a brief is often read in a
     wall where the section header names the weapon, and just as often is not. */
  const tags = card.type_line ? [] : [...(card.tags ?? []), ...(card.weapon ? [card.weapon] : [])];
  const banner = tags.length > 0 ? null : cardBanner(card);
  /* The card's own art first, the family's second. See the note above. Both
     come out of the codex, so both are behind the tier gate.

     The thumbnail ahead of the full picture: this plate is 92px wide and 58px
     in a list, and a wall of two dozen briefs asking for 47 KB apiece to draw
     92 pixels is the slowest thing on the sheet. The cut is ~6 KB. A family's
     art has no thumbnail, so it falls through to itself. */
  const plate = codexArt(card.art_thumb ?? card.art_url ?? art);
  const line = card.summary ?? cardGist(card, { character, modifiers });
  /* What it costs in the hands holding it, which is not always what it printed:
     an Arcanist at Rank 3 casts everything in their spellbook for one Action Point
     less. The brief shows the cut the same way the card does, since the brief is
     what a wall of two dozen spells is actually read off. */
  const cost = cardCost(card, modifiers);

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
              <span className="card-brief-name">{cardTitle(card)}</span>
              <CostOrbs
                ap={cost.ap}
                wp={cost.wp}
                size={20}
                className="card-brief-costs"
                apWas={cost.cut > 0 ? cost.printed : null}
                cutFrom={cost.from}
              />
            </span>
            {banner && <span className="card-brief-banner">{banner}</span>}

            {(tags.length > 0 || card.choice) && (
              <span className="card-brief-chips">

                {/* The first tag is what the card is: Talent, Novice Spell,
                    Skill. So it takes the accent and leads. The ones after it
                    take their own colour when they name a school or a family,
                    and stay grey when they name anything else. */}
                {tags.map((tag, index) => {
                  const tone = index === 0 ? undefined : tagStyle(tag);
                  return (
                    <span
                      className={`card-brief-chip${index === 0 ? ' is-kind' : ''}${tone ? ' is-toned' : ''}`}
                      key={tag}
                      style={tone}
                    >
                      {tag}
                    </span>
                  );
                })}

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
