import { useState } from 'react';
import CardBrief from './CardBrief.jsx';
import useCodexArt from '../useCodexArt.js';
import { ChoicePicker } from './LineagePick.jsx';
import { LoadoutChooser } from './LoadoutPick.jsx';
import { BrewBench } from './BrewBench.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { answerOn, sourceCount } from '../../lib/abilitySources.js';
import { emptyBrewAt, setBrewAt } from '../../lib/brews.js';
import { toggleLoadoutPick } from '../../lib/loadouts.js';
import { setTalentPicks } from '../../lib/talents.js';

/**
 * One source, printed as one block.
 *
 * The block is the same 360x640 rectangle every block on this sheet is, and it
 * is titled with the provenance rather than with what is inside it: Mycomancer,
 * not "Spells". Inside, the cards sit under the stratum that handed them over,
 * so a set's ranks read in the order they were bought and a level's skill is
 * filed under the level.
 *
 * The one way this differs from a Character-tab block: it scrolls. A block
 * there never does, because six of them hold a fixed readout that was designed
 * to fit. A talent set at Rank 3 is however many cards the designer wrote, and
 * summarising a card that is already a summary would leave nothing.
 *
 * Cards are read the way they are read everywhere else on the sheet: a brief
 * you tap to deal the real card onto the stack. Nothing here is spent and
 * nothing here is played. Using an ability happens on the Character tab, where
 * the points it costs are.
 */
export default function AbilityBlock({ source, character, patch, readOnly = false }) {
  const stack = useCardStack();
  const count = sourceCount(source);
  // The block's own plate. The briefs below gate their own, inside CardBrief.
  const art = useCodexArt()(source.art);

  return (
    <div className={`cell-scroll ability-block src-${source.kind}`}>
      <header className="ability-source-head">
        <span
          className={`ability-source-art${art ? '' : ' ability-source-art-empty'}`}
          style={art ? { backgroundImage: `url("${art}")` } : undefined}
          aria-hidden="true"
        />
        <span className="ability-source-title">
          <span className="ability-source-name">{source.title}</span>
          <span className="ability-source-note">{source.note}</span>
        </span>
        {count > 0 && (
          <span className="ability-source-count" title={`${count} in this block`}>
            {count}
          </span>
        )}
      </header>

      {source.unknown ? (
        <p className="pick-line">
          Written in by hand. This build&rsquo;s codex has nothing by that name, so there are no
          cards to show.
        </p>
      ) : (
        source.sections.map((part) => (
          <Section
            key={part.id}
            part={part}
            source={source}
            character={character}
            patch={patch}
            readOnly={readOnly}
            onOpen={(card, modifiers) => stack?.openCard(card, modifiers)}
          />
        ))
      )}
    </div>
  );
}

/**
 * One stratum of a source: a rank, a level, an item, or the standing choice a
 * set leaves open. Its heading is what makes the block readable at a glance,
 * so it stays put while the cards under it scroll past.
 */
function Section({ part, source, character, patch, readOnly, onOpen }) {
  const choices = character?.choices ?? {};

  // One card's answer at a time. The rest of the bag is left exactly as it was.
  const answer = (cardId, optionId) =>
    patch?.({ choices: { ...choices, [cardId]: optionId } });

  return (
    <section className="ability-section">
      <div className="ability-section-head">
        <span className="ability-section-label">{part.label}</span>
        {part.note && (
          <span
            className={`ability-section-note${
              part.loadout && !part.loadout.state.complete ? ' is-open' : ''
            }`}
          >
            {part.note}
          </span>
        )}
      </div>

      <div className="card-brief-list">
        {part.cards.map(({ card, modifiers }) => {
          const picked = answerOn(card, choices);
          return (
            <div className="ability-row" key={card.id}>
              <CardBrief
                card={card}
                character={character}
                modifiers={modifiers}
                art={source.art}
                onOpen={() => onOpen(card, modifiers)}
              />
              {/* A card that leaves something open is answered here too. It is
                  the same answer the Advancement tab writes, into the same bag,
                  and this is where you are when you notice it is still open. */}
              {card.choice && (
                <ChoicePicker
                  card={card}
                  picked={picked}
                  readOnly={readOnly || !patch}
                  onPick={(optionId) => answer(card.id, optionId)}
                />
              )}
            </div>
          );
        })}
      </div>

      {part.loadout && (
        <LoadoutTools
          loadout={part.loadout}
          character={character}
          patch={patch}
          readOnly={readOnly || !patch}
        />
      )}

      {part.brewing && (
        <BrewTools
          brewing={part.brewing}
          character={character}
          patch={patch}
          readOnly={readOnly || !patch}
        />
      )}
    </section>
  );
}

/**
 * The standing choice a set leaves open, and the one button that changes it.
 *
 * The chooser is the Advancement tab's own, raised from here unchanged: the
 * whole school as a wall of briefs, with what this rank may take marked. Which
 * spells a Mycomancer knows is not a level's decision, it is a decision they
 * revisit at every rest, so it belongs on the tab they read their spells on as
 * much as on the one where the rank was bought.
 */
function LoadoutTools({ loadout, character, patch, readOnly }) {
  const [choosing, setChoosing] = useState(false);
  const { talent, state } = loadout;
  const { spec, known, remaining, over, picks } = state;

  const illegal = picks.filter((pick) => pick.card && !pick.ok).length;

  return (
    <>
      {over > 0 && (
        <p className="pick-notice is-warning">
          {over} more {plural(spec.noun, over)} than this rank knows. Give some back.
        </p>
      )}
      {illegal > 0 && (
        <p className="pick-notice is-warning">
          {illegal} of these {plural(spec.noun, illegal)} {illegal === 1 ? 'is' : 'are'} no longer
          legal at your rank. Change {illegal === 1 ? 'it' : 'them'} below.
        </p>
      )}

      {!readOnly && (
        <div className="pick-tools pick-tools-tight">
          <button type="button" className="btn btn-sub btn-sm" onClick={() => setChoosing(true)}>
            {remaining
              ? `Choose ${remaining} more ${plural(spec.noun, remaining)}`
              : `Change your ${plural(spec.noun, 2)}`}
          </button>
        </div>
      )}

      {choosing && (
        <LoadoutChooser
          talent={talent}
          character={character}
          state={state}
          readOnly={readOnly}
          onToggle={(cardId) =>
            patch({ talents: toggleLoadoutPick(character.talents, talent.id, cardId, known) })
          }
          onClear={() => patch({ talents: setTalentPicks(character.talents, talent.id, []) })}
          onClose={() => setChoosing(false)}
        />
      )}
    </>
  );
}

/**
 * The Cauldron, raised from the block its Brews are listed in.
 *
 * The same argument the loadout makes: which Brews a Keeper has ready is not a
 * level's decision, it is one they revisit at every rest and in the middle of
 * every fight, so the bench belongs on the tab where the Brews are read as much
 * as on the one where the rank was bought.
 *
 * The bench itself spends nothing, here or anywhere. This tab is a read of what
 * a character holds, and mixing is only the writing down of a recipe. What a
 * fight charges for a stir is an Action Point on the Character tab, and the
 * bench says so when a fight is live.
 */
function BrewTools({ brewing, character, patch, readOnly }) {
  const [mixing, setMixing] = useState(false);
  const { talent, state } = brewing;

  return (
    <>
      {state.illegal > 0 && (
        <p className="pick-notice is-warning">
          {state.illegal} of these Brews {state.illegal === 1 ? 'is' : 'are'} no longer legal at
          your rank. Re-mix{' '}
          {state.illegal === 1 ? 'it' : 'them'} below.
        </p>
      )}

      {!readOnly && (
        <div className="pick-tools pick-tools-tight">
          <button type="button" className="btn btn-sub btn-sm" onClick={() => setMixing(true)}>
            {state.mixed === 0
              ? `Mix your first ${state.spec.noun}`
              : state.empty > 0
                ? `Open the Cauldron · ${state.empty} ${plural('bottle', state.empty)} empty`
                : 'Open the Cauldron'}
          </button>
        </div>
      )}

      {mixing && (
        <BrewBench
          talent={talent}
          character={character}
          state={state}
          readOnly={readOnly}
          onBottle={(slot, draft) =>
            patch({ talents: setBrewAt(character.talents, talent.id, slot, draft) })
          }
          onEmpty={(slot) => patch({ talents: emptyBrewAt(character.talents, talent.id, slot) })}
          onClose={() => setMixing(false)}
        />
      )}
    </>
  );
}

function plural(noun, count) {
  return count === 1 ? noun : `${noun}s`;
}
