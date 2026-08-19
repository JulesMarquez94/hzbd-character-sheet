import { useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import PickBlock from './PickBlock.jsx';
import LoadoutSection, { LoadoutRankNote } from './LoadoutPick.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import TagFilter from './TagFilter.jsx';
import useCodexArt from '../useCodexArt.js';
import { useTagFilter } from './useTagFilter.js';
import { useCardStack } from '../../context/card-stack.js';
import { loadoutOf, rankPreview } from '../../lib/loadouts.js';
import {
  TALENT_RANKS,
  cardsAtRank,
  chooseAt,
  clearAt,
  optionsAt,
  rankInfo,
  talentTags,
  usedTalentTags,
} from '../../lib/talents.js';

/**
 * One level's talent choice: a new set at Rank 1, or the next rank of one
 * already held.
 *
 * The panel is handed the slot it belongs to rather than working it out, so the
 * ledger above it stays the only place that knows which levels grant what — see
 * LevelLedger.jsx. What a slot may buy is decided by the level printed on it,
 * which is what makes "Rank 2 needs level 4" honest: the level-2 panel can only
 * ever offer a new set, however far the character has since travelled.
 *
 * Talent slots are also the one choice on this page that fills in order and
 * undoes from the end, because a Rank 2 has to know which level bought Rank 1.
 * Everything else a level hands out stands on its own.
 */
export default function TalentPick({
  slot,
  list,
  character,
  patch,
  isOpen,
  canUndo,
  openAt,
  step = null,
  readOnly = false,
}) {
  const [choosing, setChoosing] = useState(false);
  const [viewing, setViewing] = useState(null);
  /* A set that lets you choose its cards asks the moment it is taken, and only
     then. After that the choice is a button on the set, because the card that
     grants those cards lets you swap them at every rest. */
  const [justTook, setJustTook] = useState(null);

  return (
    <PickBlock
      kind="talent"
      step={step}
      title="Talent Set"
      done={slot.filled}
      state={slot.filled ? 'Chosen' : isOpen ? 'Waiting on you' : `After level ${openAt}`}
    >
      {slot.level === 1 && (
        <p className="pick-lead">
          A <b>Talent Set</b> is what your character can <i>do</i>: the abilities that decide how
          they fight, and how they handle everything outside a fight. You choose your first one now.
          At every even level after this you get another choice: begin a new set, or rank up one you
          already know.
        </p>
      )}

      {slot.filled ? (
        <TalentSummary
          slot={slot}
          character={character}
          patch={patch}
          readOnly={readOnly}
          justTook={justTook}
          onView={() => setViewing(slot.talent)}
          onUndo={canUndo ? () => patch({ talents: clearAt(character.talents, slot.level) }) : null}
        />
      ) : (
        <div className="level-block-empty">
          {isOpen ? (
            <>
              <p className="level-block-hint">
                {slot.level === 1
                  ? 'Nothing chosen yet. Your first set arrives at Rank 1 · Novice.'
                  : 'Deepen a set you already hold, or begin another at Rank 1.'}
              </p>
              {!readOnly && (
                <div className="pick-tools">
                  <button
                    type="button"
                    className="btn btn-pick btn-sm"
                    onClick={() => setChoosing(true)}
                  >
                    Choose a Talent Set
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="level-block-hint">
              Talent choices are made in order, so fill level {openAt} first.
            </p>
          )}
        </div>
      )}

      {choosing && (
        <TalentChooser
          level={slot.level}
          list={list}
          character={character}
          onTake={(id) => {
            patch({ talents: chooseAt(character.talents, slot.level, id) });
            setChoosing(false);
            // Only on the way in. A set already held is ranking up, and its
            // cards are chosen from the panel rather than pushed at you again.
            const held = list.some((entry) => entry.id === id);
            if (!held && loadoutOf(id)) setJustTook(id);
          }}
          onClose={() => setChoosing(false)}
        />
      )}

      {viewing && (
        <TalentChooser
          level={slot.level}
          list={list}
          character={character}
          startAt={viewing}
          readOnly
          onClose={() => setViewing(null)}
        />
      )}
    </PickBlock>
  );
}

/** What a filled block shows: the set, the rank this level bought, its cards. */
function TalentSummary({ slot, character, patch, readOnly, justTook, onView, onUndo }) {
  const { talent, entry, rank } = slot;
  const info = rankInfo(rank);
  const cards = talent ? cardsAtRank(talent, rank) : [];
  const stack = useCardStack();
  const art = useCodexArt()(talent?.art);

  return (
    <article className="talent-summary">
      <header className="talent-summary-head">
        {art ? (
          <img className="talent-summary-art" src={art} alt="" />
        ) : (
          <span className="talent-summary-art talent-summary-art-empty" aria-hidden="true" />
        )}

        <span className="talent-summary-title">
          <span className="talent-summary-name">{entry.name}</span>
          <span className="talent-summary-rank">
            Rank {rank}
            {info ? ` · ${info.title}` : ''}
          </span>
          {talent?.tagline && <span className="talent-summary-tagline">{talent.tagline}</span>}
        </span>

        <RankPips rank={rank} />
      </header>

      {talent ? (
        <>
          <span className="talent-summary-label">
            {rank === 1 ? 'What this set opens with' : `What Rank ${rank} adds`}
          </span>
          <div className="talent-rung-cards">
            {cards.map((card) => (
              <CardBrief
                key={card.id}
                card={card}
                character={character}
                art={talent?.art}
                onOpen={() => stack?.openCard(card)}
              />
            ))}
          </div>

          {/* The cards this set leaves to you. Shown on the slot holding its
              highest rank, since that is the one whose count is current. */}
          {rank === entry.rank && (
            <LoadoutSection
              talent={talent}
              talents={character.talents}
              character={character}
              patch={patch}
              readOnly={readOnly}
              autoOpen={justTook === talent.id}
            />
          )}
        </>
      ) : (
        <p className="level-block-hint">
          Written in by hand. This build&rsquo;s codex has no cards for it.
        </p>
      )}

      <div className="talent-summary-tools">
        {talent && (
          <button type="button" className="btn btn-minimal btn-sm" onClick={onView}>
            View full set
          </button>
        )}
        <span className="spacer" />
        {onUndo && (
          <button type="button" className="btn btn-minimal btn-sm talent-drop" onClick={onUndo}>
            Undo this choice
          </button>
        )}
      </div>
    </article>
  );
}

/* --------------------------------------------------------------- chooser */

/**
 * Two views on one modal. The overview is a wall of sets — art, name, a line of
 * description and what this level's choice would buy. Picking one opens its
 * presentation page: the set as it reads on paper, every rank's cards laid out
 * in full, with the take button at the end.
 */
function TalentChooser({ level, list, character, onTake, onClose, startAt = null, readOnly = false }) {
  const [open, setOpen] = useState(startAt);

  const filter = useTagFilter(usedTalentTags(), { searchable: true });

  // Reading a set is not taking one: the reader sees the whole codex, the
  // chooser only what this level can actually buy.
  const options = optionsAt(list, level, { all: readOnly });
  const visible = options.filter(
    (option) =>
      filter.matches(option.talent.tags) &&
      filter.text(option.talent.name, option.talent.tagline, option.talent.blurb)
  );
  const shown = open ? options.find((option) => option.talent.id === open.id) : null;

  return (
    <Modal
      title={shown ? shown.talent.name : `Level ${level}: Choose a Talent Set`}
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.talent}
      footer={
        shown ? (
          <>
            <button type="button" className="btn btn-minimal btn-sm" onClick={() => setOpen(null)}>
              ← All sets
            </button>
            <span className="spacer" />
            {!readOnly && (
              <button
                type="button"
                className="btn btn-take btn-sm"
                disabled={!shown.ok}
                onClick={() => onTake(shown.talent.id)}
                title={shown.ok ? undefined : shown.reason}
              >
                {shown.ok ? takeLabel(shown) : shown.reason}
              </button>
            )}
          </>
        ) : null
      }
    >
      {shown ? (
        <TalentPresentation option={shown} character={character} />
      ) : (
        <>
          <p className="frame-foot" style={{ marginTop: 0 }}>
            {readOnly
              ? 'Every set in the codex. Open one to read its ranks in full.'
              : 'Open a set to read it in full before you spend this level on it.'}
          </p>

          <TagFilter filter={filter} count={visible.length} noun="set" placeholder="Search sets" />

          <div className="talent-wall">
            {visible.map((option) => (
              <TalentTile key={option.talent.id} option={option} onOpen={() => setOpen(option.talent)} />
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

function takeLabel(option) {
  return option.held === 0 ? 'Take at Rank 1 · Novice' : `Rank up to ${option.rank} · ${rankInfo(option.rank).title}`;
}

/** One rectangle on the overview wall: art, name, a line, and what it buys. */
function TalentTile({ option, onOpen }) {
  const { talent, held, ok, reason } = option;
  const art = useCodexArt()(talent.art);

  return (
    <button type="button" className="talent-tile" onClick={onOpen}>
      <span
        className="talent-tile-art"
        style={art ? { backgroundImage: `url("${art}")` } : undefined}
      >
        {held > 0 && <span className="talent-tile-held">Rank {held}</span>}
      </span>

      <span className="talent-tile-body">
        <span className="talent-tile-name">{talent.name}</span>
        <span className="talent-tile-line">{talent.tagline}</span>
        <span className="item-tags">
          {talentTags(talent).map((tag) => (
            <span className={`item-tag tag-${tag.kind} tag-is-${tag.id}`} key={tag.id}>
              {tag.label}
            </span>
          ))}
        </span>
        <span className={`talent-tile-buy${ok ? '' : ' is-locked'}`}>
          {ok ? takeLabel(option) : reason}
        </span>
      </span>
    </button>
  );
}

/**
 * The set as a printed page: the overview, then every rank read as briefs.
 *
 * A set is up to three ranks of four or five cards each. Printed in full that
 * is a page nobody reaches the end of, so each rank is a wall of briefs and the
 * card itself is dealt onto the stack when one is tapped.
 */
function TalentPresentation({ option, character }) {
  const { talent, held } = option;
  const stack = useCardStack();
  const art = useCodexArt()(talent.art);

  return (
    <div className="talent-page">
      <header className="talent-page-head">
        {art && <img className="talent-page-art" src={art} alt="" />}
        <div className="talent-page-intro">
          <h3 className="talent-page-name">{talent.name}</h3>
          <p className="talent-page-tagline">{talent.tagline}</p>
          {talent.blurb.split(/\n\s*\n/).map((paragraph, index) => (
            <p className="talent-page-blurb" key={index}>
              {paragraph}
            </p>
          ))}
        </div>
      </header>

      {TALENT_RANKS.map(({ rank, title, minLevel }) => {
        const cards = cardsAtRank(talent, rank);
        const choice = rankPreview(talent, rank);
        if (cards.length === 0 && !choice?.known) return null;

        return (
          <section className="talent-page-rank" key={rank}>
            <div className="talent-page-rank-head">
              <span className="talent-page-rank-label">
                {talent.name} · Rank {rank} ({title})
              </span>
              <span className="talent-page-rank-note">
                {held >= rank ? 'Held' : `From level ${minLevel}`}
              </span>
            </div>

            {/* Enough of each card to choose by, with the card itself one tap
                away. A rank you already hold reads the same as one you don't. */}
            <div className="card-brief-wall">
              {cards.map((card) => (
                <CardBrief
                  key={card.id}
                  card={card}
                  character={character}
                  art={talent.art}
                  onOpen={() => stack?.openCard(card)}
                />
              ))}
            </div>

            {/* What this rank leaves to you, with the pool one tap away. A set
                that says "you learn two spells" should be readable as which
                two you would be choosing from. */}
            <LoadoutRankNote talent={talent} rank={rank} character={character} />
          </section>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

/** Three dots: filled to the rank held, hollow for the ranks still to come. */
function RankPips({ rank }) {
  return (
    <span className="talent-pips" aria-label={`Rank ${rank} of ${TALENT_RANKS.length}`}>
      {TALENT_RANKS.map(({ rank: n }) => (
        <span key={n} className={`talent-pip${n <= rank ? ' filled' : ''}`} />
      ))}
    </span>
  );
}
