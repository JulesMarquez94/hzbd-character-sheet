import { ATTRIBUTES } from '../../lib/attributes.js';

/**
 * The two questions a Skill Check asks before it is paid for: what you are
 * rolling, and what you are bringing to it.
 *
 * "Add a new basic action which is to do a skill check that let you select an
 * attribute and then add any skill that could be relevant (like arcane marshal
 * ect)." Jules, 2026-09-02.
 *
 * ---------------------------------------------------------------- the attribute
 * Every other card in the codex names its own: Grapple is Physique for
 * everybody, and a spell's is whatever taught it. A skill check is the one roll
 * where the attribute *is* the decision, so all three are offered with what this
 * character is worth on each, and the choice is made by looking rather than by
 * remembering. It rides out as a `stat` modifier, which is the same rider a
 * Mycomancer's loadout imposes, so the card beside this prints the picked
 * attribute's numbers and the dice roll them. See castModifier in cardText.js.
 *
 * -------------------------------------------------------------------- the cards
 * Under it, the cards this character holds that say something about a skill
 * check. Fourteen of them are the codex's domain skills, each 1 Willpower for
 * advantage, and the rest come from anywhere a card can: a Feral Cursed's
 * BESTIAL SENSE lends the five senses for nothing, a Wildkin's SHARP SENSE lends
 * the same for 1 Willpower. Which of them applies is the player's answer and
 * never the sheet's, because no column anywhere says that this attempt is about
 * a map. So each is offered with its own domain printed under it and its source
 * beside that, and ticking one adds its price to the buttons below and its die
 * to the roll.
 *
 * A card that speaks to a check and is not wired is *named* rather than
 * offered: SKILLED swaps the check's own dice, MASTERMIND maximises them and
 * DISTRACT buys a retry once the roll has already failed. None of the three is
 * a die added to this roll. A dead toggle would be worse than a line saying the
 * card is yours to apply. See checks.js, which is where a card is read, and
 * `characterCheckCards` in levelPicks.js, which is where they are gathered.
 *
 * Nothing here spends anything. The prompt below it charges what this adds up
 * to, once, on the button that was actually pressed.
 */
export default function CheckPick({ who, stat, onStat, cards = [], brought = [], onBring }) {
  const offered = cards.filter((card) => card.advantage > 0);
  const named = cards.filter((card) => card.advantage === 0);

  return (
    <div className="use-check">
      <span className="use-check-head">What are you rolling</span>

      <div className="use-check-stats">
        {ATTRIBUTES.map((attribute) => {
          const value = Math.floor(Number(who?.[attribute.key]) || 0);
          const on = stat === attribute.key;

          return (
            <button
              type="button"
              key={attribute.key}
              className={`use-check-stat${on ? ' is-on' : ''}`}
              style={{ '--stat-tone': attribute.color }}
              onClick={() => onStat(attribute.key)}
              aria-pressed={on}
              title={attribute.info}
            >
              <span className="use-check-stat-name">{attribute.label}</span>
              <span className="use-check-stat-value">
                {value < 0 ? value : `+${value}`}
              </span>
            </button>
          );
        })}
      </div>

      {offered.length > 0 && (
        <>
          <span className="use-check-head">
            Bringing a card
            <span className="use-check-count">
              {brought.length} of {offered.length}
            </span>
          </span>

          <div className="use-check-skills">
            {offered.map((card) => {
              const on = brought.includes(card.id);

              return (
                <button
                  type="button"
                  key={card.id}
                  className={`use-check-skill${on ? ' is-on' : ''}`}
                  onClick={() => onBring(card.id)}
                  aria-pressed={on}
                >
                  <span className="use-check-skill-name">{card.name}</span>
                  <span className="use-check-skill-gives">
                    {card.wp > 0 ? `${card.wp} Willpower · advantage` : 'advantage'}
                  </span>
                  {/* Where it came from, in front of what it covers. Two cards
                      can cover the same ground at two different prices, and the
                      source is how a reader tells them apart. */}
                  <span className="use-check-skill-when">
                    {card.from && <b className="use-check-skill-from">{card.from}</b>}
                    {card.from ? ' · ' : ''}
                    {card.summary}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {named.length > 0 && (
        <p className="use-check-note">
          <b>Yours to apply</b> · {listAnd(named.map((card) => card.name))}
          {named.length === 1 ? ' says' : ' say'} something about a skill check that is not a die
          added to the roll, so the table applies it.
        </p>
      )}

      {offered.length === 0 && named.length === 0 && (
        <p className="use-check-note">
          Nothing you hold speaks to a skill check. The roll is the attribute alone.
        </p>
      )}
    </div>
  );
}

/** "a, b and c". No Oxford comma, the way every list on the sheet is written. */
function listAnd(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
