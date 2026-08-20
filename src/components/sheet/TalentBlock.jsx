import { useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import PickBlock from './PickBlock.jsx';
import FeralSection from './FeralPick.jsx';
import LoadoutSection, { LoadoutRankNote } from './LoadoutPick.jsx';
import MinionSection from './MinionPick.jsx';
import WornEnchants from './WornEnchants.jsx';
import { BrewRankNote } from './BrewWindow.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import TagFilter from './TagFilter.jsx';
import useCodexArt from '../useCodexArt.js';
import { useTagFilter } from './useTagFilter.js';
import { useCardStack } from '../../context/card-stack.js';
import { brewPreview } from '../../lib/brews.js';
import { enchantmentsAt } from '../../lib/enchantments.js';
import { knownAt, loadoutOf, rankPreview } from '../../lib/loadouts.js';
import { feralOf } from '../../lib/feral.js';
import { minionOf } from '../../lib/minions.js';
import {
  TALENT_RANKS,
  cardsAtRank,
  chooseAt,
  clearAt,
  enchantPreview,
  enchantingOf,
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
  /* A set that lets you choose its cards asks the moment the choice is bought:
     when the set is taken, and again at every rank that widens the hand. After
     that it is a button on the set, because the card that grants those cards
     lets you swap them at every rest. */
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
            /* Whenever this level just bought you cards to choose, the pool
               opens on top of the take rather than waiting to be found on the
               block: a Rank 1 Mycomancer chooses four spells, and Rank 2 chooses
               the two more it knows. A rank that only opens a tier without
               widening the hand pushes nothing at you — you already have as many
               spells as you can hold, and swapping them is a rest's business.

               A set that brews chooses nothing at any rank: a Brew is composed
               at the moment it is used, so there is nothing to push here. */
            const held = list.find((entry) => entry.id === id);
            const from = held ? held.taken.length : 0;
            const rank = from + 1;

            const spec = loadoutOf(id);
            if (spec && knownAt(spec, rank) > knownAt(spec, from)) setJustTook(id);

            /* And the same for a set that lays rather than picks. WIELDER OF
               WONDER says "choose one **when becoming an enchanter**", which is
               this exact moment, and every rank after this one widens the count by
               another, so every rank asks again. */
            const laying = enchantingOf(id);
            if (laying && (laying.worn?.[rank] ?? 0) > (laying.worn?.[from] ?? 0)) setJustTook(id);

            /* And the same for a set that hands over a *body*. The bond is
               formed once, at Rank 1, so only that rank pushes the window: a
               Rank 2 Draconic Bond is a deeper bond with an ally that already
               has a name. */
            if (rank === 1 && minionOf(id)) setJustTook(id);

            /* And the same for a set that hands over a *shape*. BEAST WITHIN:
               "when you become Feral Cursed, you choose a Carnivore Mammal" —
               which is this exact moment, and only this one. */
            if (rank === 1 && feralOf(id)) setJustTook(id);
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

          {/* And who it put on the board, for a set that grants a creature.
              Shown on the slot that bought Rank 1, because that is the level the
              bond was formed at and the only one that asks. */}
          {rank === 1 && talent.minion && (
            <MinionSection
              talent={talent}
              character={character}
              patch={patch}
              readOnly={readOnly}
              autoOpen={justTook === talent.id}
            />
          )}

          {/* And what it turns them into, for a set that grants a shape. Same
              slot rule and the same reason: the curse is caught once, and the
              ranks above it are the same animal getting better at it. */}
          {rank === 1 && talent.feral && (
            <FeralSection
              talent={talent}
              character={character}
              patch={patch}
              readOnly={readOnly}
              autoOpen={justTook === talent.id}
            />
          )}

          {/* And what it lays on its own person, for the one set that does. Same
              slot rule and the same auto-open: the shelf arrives with the rank
              rather than waiting to be found. */}
          {rank === entry.rank && talent.enchanting && (
            <div className="pick-part">
              <WornEnchants
                character={character}
                talents={character.talents}
                onChange={(next) => patch({ talents: next })}
                readOnly={readOnly}
                autoOpen={justTook === talent.id}
              />
            </div>
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
        className={`talent-tile-art${art ? '' : ' talent-tile-art-empty'}`}
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
        {art ? (
          <img className="talent-page-art" src={art} alt="" />
        ) : (
          <span className="talent-page-art talent-page-art-empty" aria-hidden="true" />
        )}
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
        const brewing = brewPreview(talent, rank);
        const enchanting = enchantPreview(talent, rank);
        if (
          cards.length === 0 &&
          !choice?.known &&
          !brewing?.tiers?.length &&
          !enchanting?.tiers?.length
        )
          return null;

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

            {/* And for a set that mixes rather than chooses: how much wider the
                Cauldron gets, which is not countable off the card text. */}
            <BrewRankNote talent={talent} rank={rank} />

            {/* And for the set whose ranks 2 and 3 hand out no cards at all:
                which enchantments come within reach, and how many of them an
                Enchanter wears themselves. */}
            <EnchantRankNote talent={talent} rank={rank} />
          </section>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

/** How many enchantments a rank wears, said as the sentence reads. */
const WORN_ORDINAL = [null, 'one', 'a second', 'a third'];

/**
 * What a rank of an enchanting set opens.
 *
 * The Enchanter is the one set whose ranks 2 and 3 add no cards: what they buy is
 * written inside ENCHANTING and WIELDER OF WONDER, which the page has already
 * printed at Rank 1 and which a reader deciding on Rank 2 would have to go back
 * and re-read. So this says it where the decision is made. Every word of it is
 * off those two cards.
 *
 * **It counts now.** It did not, for one pull: every enchantment on the Equipment
 * sheet was a Novice one, so a number at Rank 2 or Rank 3 would have been a zero
 * about the codex rather than a fact about the rank. The 2026-08-20 drop brought
 * the Adept and Master shelves in, so the count is what it always wanted to be —
 * the same thing the Brew note says about Ingredients.
 */
function EnchantRankNote({ talent, rank }) {
  const preview = enchantPreview(talent, rank);
  if (!preview || preview.tiers.length === 0) return null;

  const { spec, opened, kept, tiers, worn, grew, perItem, widened } = preview;

  /* How many the rank *adds*, and how many it can reach in all. Read off the
     codex, so a shelf the designer grows grows this line with it. */
  const added = enchantmentsAt(opened).length;
  const reach = enchantmentsAt(tiers).length;

  return (
    <div className="loadout-note">
      <span className="loadout-note-body">
        <b>
          {added > 0
            ? `+${added} ${listAnd(opened)} ${added === 1 ? 'enchantment' : 'enchantments'}`
            : `${reach} within reach, and nothing new here`}
        </b>
        <span className="loadout-note-line">
          {/* The price is on ENCHANTING, which the first rank prints right above
              this. Saying it again at Rank 2 and Rank 3 would be the same sentence
              three times over, so the later ranks say what they add instead. */}
          {kept.length === 0
            ? `Laid on an item over a Long Rest, ${spec.supplyRate} supplies for every point of Magic Burden`
            : `${reach} to lay from in all, over the ${listAnd(kept)} ${kept.length === 1 ? 'shelf' : 'shelves'} you already had`}
          {grew ? `, and ${WORN_ORDINAL[worn] ?? worn} worn on your own person` : ''}
          {/* And what LAYERED ENCHANTMENT buys, which is not countable off any
              of the numbers above: how many workings one item may hold. Said
              only on the rank that moves it. */}
          {widened ? `. One item can now hold ${perItem === 2 ? 'two' : perItem} at once` : ''}.
        </span>
      </span>
    </div>
  );
}

/** "Novice and Adept", "Novice, Adept and Master". No Oxford comma. */
function listAnd(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

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
