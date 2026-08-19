import { useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import TagFilter from './TagFilter.jsx';
import useCodexArt from '../useCodexArt.js';
import { useTagFilter } from './useTagFilter.js';
import { useCardStack } from '../../context/card-stack.js';
import PickBlock from './PickBlock.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { LINEAGES, getLineage, lineageTags, usedLineageTags } from '../../lib/lineages.js';
import { setLineage } from '../../lib/levelPicks.js';

/**
 * Lineage — your ancestry, and the only choice on this page you make once.
 *
 * It sits inside the level-1 block beside the talent set, and is written the
 * way a lineage is written: the lore as prose, and everything it actually does
 * as cards. A card can be dealt onto the pile mid-fight; a paragraph cannot.
 *
 * The stored value is the plain name, in the character row's own `lineage` text
 * column, which predates this codex. A name it doesn't recognise is shown as
 * written rather than cleared — a table is free to invent its own.
 */
/** The option this character picked on a card, or null while it is still open. */
function pickedOn(card, choices) {
  if (!card.choice) return null;
  return card.choice.options.find((option) => option.id === choices?.[card.id]) ?? null;
}

export default function LineagePick({ value, character, patch, step = null, readOnly = false }) {
  const [choosing, setChoosing] = useState(false);
  const stack = useCardStack();
  const codexArt = useCodexArt();

  const written = String(value ?? '').trim();
  const lineage = getLineage(written);
  const choices = character?.choices ?? {};

  // One card's answer at a time; the rest of the bag is left alone.
  const answer = (cardId, optionId) =>
    patch({ choices: { ...choices, [cardId]: optionId } });

  return (
    <PickBlock kind="lineage" step={step} title="Lineage" done={Boolean(written)}>
      <p className="pick-lead">
        Your <b>lineage</b> is your ancestry: the blood your character comes from, and what it left
        in them. You choose it once, now, and it never changes.
      </p>

      {lineage ? (
        <>
          <div className="pick-face">
            <span
              className={`pick-art${codexArt(lineage.art) ? '' : ' pick-art-empty'}`}
              style={
                codexArt(lineage.art)
                  ? { backgroundImage: `url("${codexArt(lineage.art)}")` }
                  : undefined
              }
              aria-hidden="true"
            />
            <span className="pick-face-body">
              <span className="pick-value">{lineage.name}</span>
              <span className="pick-line">{lineage.tagline}</span>
              <TagRow lineage={lineage} />
            </span>
          </div>

          <span className="talent-summary-label">What your blood carries</span>
          <div className="talent-rung-cards">
            {lineage.cards.map((card) => {
              const picked = pickedOn(card, choices);
              return (
                <div className="card-choice-row" key={card.id}>
                  <CardBrief
                    card={card}
                    character={character}
                    modifiers={picked ? { choice: picked } : null}
                    art={lineage.art}
                    onOpen={() => stack?.openCard(card, picked ? { choice: picked } : null)}
                  />
                  {card.choice && (
                    <ChoicePicker
                      card={card}
                      picked={picked}
                      readOnly={readOnly}
                      onPick={(optionId) => answer(card.id, optionId)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : written ? (
        <div className="pick-face">
          <span className="pick-art pick-art-empty" aria-hidden="true" />
          <span className="pick-face-body">
            <span className="pick-value">{written}</span>
            <span className="pick-line">
              Written in by hand. This build&rsquo;s codex has no ancestry by that name.
            </span>
          </span>
        </div>
      ) : (
        <p className="pick-line">Nothing chosen yet.</p>
      )}

      <div className="pick-tools">
        {!readOnly && (
          <button type="button" className="btn btn-pick btn-sm" onClick={() => setChoosing(true)}>
            {written ? 'Change lineage' : 'Choose a Lineage'}
          </button>
        )}
        {readOnly && lineage && (
          <button type="button" className="btn btn-minimal btn-sm" onClick={() => setChoosing(true)}>
            Read it
          </button>
        )}
        {!readOnly && written && (
          <>
            <span className="spacer" />
            <button
              type="button"
              className="btn btn-minimal btn-sm talent-drop"
              onClick={() => patch(setLineage(character, ''))}
            >
              Clear
            </button>
          </>
        )}
      </div>

      {choosing && (
        <LineageChooser
          current={lineage}
          character={character}
          readOnly={readOnly}
          onTake={(name) => {
            patch(setLineage(character, name));
            setChoosing(false);
          }}
          onClose={() => setChoosing(false)}
        />
      )}
    </PickBlock>
  );
}

/* --------------------------------------------------------------- chooser */

/**
 * The same two views the talent chooser uses: a wall of ancestries, and the one
 * you open. Eighteen is far too many to read through, so the wall filters.
 */
function LineageChooser({ current, character, readOnly, onTake, onClose }) {
  const [open, setOpen] = useState(null);
  const stack = useCardStack();
  const codexArt = useCodexArt();
  const filter = useTagFilter(usedLineageTags(), { searchable: true });

  const shown = open ? getLineage(open) : null;
  const visible = LINEAGES.filter(
    (lineage) =>
      filter.matches(lineage.tags) && filter.text(lineage.name, lineage.tagline, lineage.blurb)
  );

  return (
    <Modal
      title={shown ? shown.name : 'Choose a Lineage'}
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.lineage}
      footer={
        shown ? (
          <>
            <button type="button" className="btn btn-minimal btn-sm" onClick={() => setOpen(null)}>
              ← All lineages
            </button>
            <span className="spacer" />
            {!readOnly && (
              <button
                type="button"
                className="btn btn-take btn-sm"
                disabled={current?.id === shown.id}
                onClick={() => onTake(shown.name)}
              >
                {current?.id === shown.id ? 'This is your ancestry' : `Take ${shown.name}`}
              </button>
            )}
          </>
        ) : null
      }
    >
      {shown ? (
        <div className="talent-page">
          <header className="talent-page-head">
            <span
              className={`talent-page-art${codexArt(shown.art) ? '' : ' talent-page-art-empty'}`}
              style={
                codexArt(shown.art)
                  ? { backgroundImage: `url("${codexArt(shown.art)}")` }
                  : undefined
              }
              aria-hidden="true"
            />
            <div className="talent-page-intro">
              <h3 className="talent-page-name">{shown.name}</h3>
              <p className="talent-page-tagline">{shown.tagline}</p>
              <p className="talent-page-blurb">{shown.blurb}</p>
              <TagRow lineage={shown} />
            </div>
          </header>

          <section className="talent-page-rank">
            <div className="talent-page-rank-head">
              <span className="talent-page-rank-label">{shown.name} · What it gives you</span>
              <span className="talent-page-rank-note">Chosen once, at level 1</span>
            </div>
            <div className="card-brief-wall">
              {shown.cards.map((card) => (
                <CardBrief
                  key={card.id}
                  card={card}
                  character={character}
                  modifiers={{ choice: pickedOn(card, character?.choices ?? {}) }}
                  art={shown.art}
                  onOpen={() => stack?.openCard(card)}
                />
              ))}
            </div>
          </section>
        </div>
      ) : (
        <>
          <p className="frame-foot" style={{ marginTop: 0 }}>
            Your ancestry, chosen once and never again. Open one to read its lore and everything it
            gives you.
          </p>

          <TagFilter
            filter={filter}
            count={visible.length}
            noun="lineage"
            placeholder="Search lineages"
          />

          <div className="talent-wall">
            {visible.map((lineage) => (
              <button
                type="button"
                className={`talent-tile${current?.id === lineage.id ? ' is-current' : ''}`}
                key={lineage.id}
                onClick={() => setOpen(lineage.id)}
              >
                <span
                  className={`talent-tile-art${
                    codexArt(lineage.art) ? '' : ' talent-tile-art-empty'
                  }`}
                  style={
                    codexArt(lineage.art)
                      ? { backgroundImage: `url("${codexArt(lineage.art)}")` }
                      : undefined
                  }
                >
                  {current?.id === lineage.id && (
                    <span className="talent-tile-held">Yours</span>
                  )}
                </span>

                <span className="talent-tile-body">
                  <span className="talent-tile-name">{lineage.name}</span>
                  <span className="talent-tile-line">{lineage.tagline}</span>
                  <TagRow lineage={lineage} />
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

/**
 * The question a card leaves to the player, asked where the card is held rather
 * than buried in its text. Answering rewrites the card: Chromatic Resistance
 * stops listing six colours and starts naming one damage type.
 */
export function ChoicePicker({ card, picked, readOnly, onPick }) {
  const { prompt, options } = card.choice;

  return (
    <div className={`card-choice${picked ? " is-answered" : ""}`}>
      <span className="card-choice-prompt">{prompt}</span>
      <div className="filter-group">
        {options.map((option) => (
          <button
            type="button"
            key={option.id}
            className={`filter-chip${picked?.id === option.id ? " active" : ""}`}
            onClick={() => !readOnly && onPick(option.id)}
            disabled={readOnly}
            title={option.detail ?? option.label}
          >
            {option.detail ?? option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

function TagRow({ lineage }) {
  return (
    <span className="item-tags">
      {lineageTags(lineage).map((tag) => (
        <span className={`item-tag tag-${tag.kind} tag-is-${tag.id}`} key={tag.id}>
          {tag.label}
        </span>
      ))}
    </span>
  );
}
