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

/** The cards of a lineage that leave something to the player. Often none. */
function asksOf(lineage) {
  return (lineage?.cards ?? []).filter((card) => card.choice);
}

/** How many of those are still unanswered. */
function openAsks(lineage, choices) {
  return asksOf(lineage).filter((card) => !pickedOn(card, choices)).length;
}

/**
 * The note over a lineage's cards while it is being read. This page hands
 * nothing over: the button below it takes the lineage, and the page after that
 * is the one that asks the questions. So the note says which of the two the
 * reader is looking at, a lineage on offer or the blood already in the
 * character, and how many questions ride along either way.
 */
function cardsNote(questions, yours) {
  const asks =
    questions === 0
      ? 'nothing to answer'
      : questions === 1
        ? 'one question on its cards'
        : `${questions} questions on its cards`;
  return yours ? `Yours, ${asks}` : `A preview, ${asks}`;
}

export default function LineagePick({ value, character, patch, step = null, readOnly = false }) {
  /* One window in one of two states: reading the wall of ancestries, or
     settling what the one you took leaves to you. null is closed. */
  const [mode, setMode] = useState(null);
  const stack = useCardStack();
  const codexArt = useCodexArt();

  const written = String(value ?? '').trim();
  const lineage = getLineage(written);
  const choices = character?.choices ?? {};
  const asks = asksOf(lineage);
  const unanswered = openAsks(lineage, choices);

  // One card's answer at a time; the rest of the bag is left alone.
  const answer = (cardId, optionId) =>
    patch({ choices: { ...choices, [cardId]: optionId } });

  return (
    <PickBlock
      kind="lineage"
      step={step}
      title="Lineage"
      done={Boolean(written) && unanswered === 0}
      state={!written ? 'Waiting on you' : unanswered > 0 ? 'Half done' : 'Chosen'}
    >
      <p className="pick-lead">
        Your <b>lineage</b> is your ancestry: the blood your character comes from, and what it left
        in them. It is not your <b>race</b>, and what you look like is yours to write. You choose it
        once, now, and it never changes.
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
          <button type="button" className="btn btn-pick btn-sm" onClick={() => setMode('choose')}>
            {written ? 'Change lineage' : 'Choose a Lineage'}
          </button>
        )}
        {/* The same window the take walks you into, reopened. The chips above
            still change an answer where it sits; this is for the player who
            scrolled past them. */}
        {!readOnly && asks.length > 0 && (
          <button type="button" className="btn btn-sub btn-sm" onClick={() => setMode('settle')}>
            {unanswered > 0
              ? `Answer ${unanswered} question${unanswered === 1 ? '' : 's'}`
              : 'Change what it asked you'}
          </button>
        )}
        {readOnly && lineage && (
          <button type="button" className="btn btn-minimal btn-sm" onClick={() => setMode('choose')}>
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

      {/* Keyed on the mode, so walking from the wall into the settle step
          remounts the window on the right view. */}
      {mode && (
        <LineageChooser
          key={mode}
          settling={mode === 'settle'}
          current={lineage}
          character={character}
          readOnly={readOnly}
          onTake={(name) => {
            patch(setLineage(character, name));
            /* A lineage whose cards ask something asks it here, in the window
               that just handed it over, rather than sending you back out to
               find a row of chips under a card on the sheet. */
            setMode(asksOf(getLineage(name)).length > 0 ? 'settle' : null);
          }}
          onAnswer={answer}
          onClose={() => setMode(null)}
        />
      )}
    </PickBlock>
  );
}

/* --------------------------------------------------------------- chooser */

/**
 * Three views on one window: a wall of ancestries, the one you open, and — the
 * moment you take it — what it leaves you to decide.
 *
 * Eighteen ancestries are far too many to read through, so the wall filters.
 * The third view is the point of the flow. Half the lineages ask a question on
 * one of their cards: which damage type your scales resist, which attribute you
 * cast the blood's spell with. Being asked it here, while the window that handed
 * you the blood is still open, is the difference between answering it and never
 * noticing it was asked.
 */
function LineageChooser({
  current,
  character,
  readOnly,
  settling = false,
  onTake,
  onAnswer,
  onClose,
}) {
  const [open, setOpen] = useState(settling ? (current?.id ?? null) : null);
  const stack = useCardStack();
  const codexArt = useCodexArt();
  const filter = useTagFilter(usedLineageTags(), { searchable: true });

  const choices = character?.choices ?? {};
  const shown = open ? getLineage(open) : null;
  const asks = settling ? asksOf(shown) : [];
  const answered = asks.filter((card) => pickedOn(card, choices)).length;
  // How many questions the lineage being read leaves open to a player, for the
  // note over its cards. None is the commonest answer.
  const questions = asksOf(shown).length;
  const visible = LINEAGES.filter(
    (lineage) =>
      filter.matches(lineage.tags) && filter.text(lineage.name, lineage.tagline, lineage.blurb)
  );

  return (
    <Modal
      title={shown ? (settling ? `${shown.name}: What It Asks You` : shown.name) : 'Choose a Lineage'}
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.lineage}
      footer={
        settling && shown ? (
          <>
            <span className={`pick-count${answered < asks.length ? ' is-open' : ''}`}>
              {answered} of {asks.length} answered
            </span>
            <span className="spacer" />
            <button type="button" className="btn btn-take btn-sm" onClick={onClose}>
              Done
            </button>
          </>
        ) : shown ? (
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
      {settling && shown ? (
        <div className="talent-page">
          <p className="frame-foot" style={{ marginTop: 0 }}>
            <b>{shown.name}</b> is yours.{' '}
            {asks.length === 1
              ? 'One of its cards leaves something to you'
              : `${asks.length} of its cards leave something to you`}
            , and that is all there is left to say. Tap an answer and the card rewrites itself
            around it. You can change any of them later, from the block or from here.
          </p>

          <section className="talent-page-rank">
            <div className="talent-page-rank-head">
              <span className="talent-page-rank-label">{shown.name} · What it leaves to you</span>
              <span className="talent-page-rank-note">
                {answered} of {asks.length} answered
              </span>
            </div>
            <div className="card-brief-wall">
              {asks.map((card) => {
                const picked = pickedOn(card, choices);
                return (
                  <CardBrief
                    key={card.id}
                    card={card}
                    character={character}
                    modifiers={picked ? { choice: picked } : null}
                    art={shown.art}
                    onOpen={() => stack?.openCard(card, picked ? { choice: picked } : null)}
                  >
                    <ChoicePicker
                      card={card}
                      picked={picked}
                      readOnly={readOnly}
                      onPick={(optionId) => onAnswer(card.id, optionId)}
                    />
                  </CardBrief>
                );
              })}
            </div>
          </section>
        </div>
      ) : shown ? (
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
              {/* The lore above describes a body, and a reader can easily take it
                  for the body they have to play. It is what the blood shows
                  through, on whatever they choose to be. */}
              <p className="talent-page-aside">
                That is what the blood shows through, not what you are. Your race and the rest of
                your look stay yours to write.
              </p>
              <TagRow lineage={shown} />
            </div>
          </header>

          <section className="talent-page-rank">
            <div className="talent-page-rank-head">
              <span className="talent-page-rank-label">{shown.name} · What it gives you</span>
              {/* Which page this is, rather than when the cards arrived. It
                  used to read "Yours as printed, nothing to choose" over a
                  lineage nobody had taken yet, one page before the one that
                  asks the questions, so it claimed both the blood and the
                  absence of a choice a page too early. */}
              <span className="talent-page-rank-note">
                {cardsNote(questions, current?.id === shown.id)}
              </span>
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
            Your ancestry, chosen once and never again. A lineage is the blood you come from, not
            your race: it marks the body that carries it, and the rest of what you look like is
            yours. A Celestial gets a halo. Whether it hangs over an elven woman with golden eyes or
            a white-furred wolf person with golden claws and teeth is your call. Open one to read its
            lore and everything it gives you.
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
