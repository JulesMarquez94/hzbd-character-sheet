import { useState } from 'react';
import CardBrief from './CardBrief.jsx';
import CostOrbs from '../CostOrbs.jsx';
import Modal from '../Modal.jsx';
import TagFilter from './TagFilter.jsx';
import { Gated } from './parts.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { poolTags, useTagFilter } from './useTagFilter.js';
import { useCardStack } from '../../context/card-stack.js';
import { cardHaystack } from '../../lib/abilitySources.js';
import { cardCost } from '../../lib/cardText.js';
import { compareWords } from '../../lib/cardOrder.js';
import { levelForXp } from '../../lib/characterModel.js';
import { oathFamilies } from '../../lib/oathbound.js';
import {
  displacedBy,
  loadoutState,
  newAtRank,
  poolAction,
  poolOwing,
  rankPreview,
  toggleLoadoutPick,
} from '../../lib/loadouts.js';
import { setTalentPicks } from '../../lib/talents.js';

/**
 * The cards a talent set lets you choose for yourself.
 *
 * Most sets teach the same hand to everyone. A Mycomancer does not: Rank 1
 * teaches two Nature spells and which two is yours to decide, Rank 2 knows
 * three and opens Adept, Rank 3 knows four and opens Master. The rule lives on
 * the set in talents.js and is resolved against the codex in loadouts.js. This
 * is only the window onto it.
 *
 * It is opened by itself the first time a set like that is taken, because a
 * hand of spells you were never asked about is a hand you will forget you have.
 * Afterwards it is a button on the set, since the card that grants the spells
 * lets you swap them at every rest.
 *
 * ------------------------------------------------------- more than one pool
 * Spells were the only pool for a while and this window is deliberately not
 * about them. A Guardian's SHIELD EXPERTISE and a Duelist's DEXTEROUS hand over
 * Martial Moves on exactly the same terms — a count that grows with the rank,
 * tiers that open as it does — so they arrive here through the same spec and the
 * same chooser, and everything a pool needs to read differently is on the spec:
 * `noun` and `label` for the words, `group` for how the wall is cut, `school` for
 * whether there is one to name at all.
 */
export default function LoadoutSection({
  talent,
  talents,
  character,
  patch,
  readOnly = false,
  autoOpen = false,
}) {
  const [choosing, setChoosing] = useState(autoOpen);
  const stack = useCardStack();

  /* The level, because half of a library's ceiling is made of it: a spellbook
     worked out without one would under-report itself by up to ten spells. Free
     for every other set, which reads it and ignores it.

     `capped: 'capacity'` because this is the sheet's own panel, and the sheet is
     where a loadout is edited: it may fill a library to its ceiling, the same way it
     can rearrange a Mycomancer's hand on a day that is not a rest. Capped at the
     allowance instead, a rank that widened the book by ten opened no room at all
     here, and every tap in the chooser silently pushed out the oldest spell rather
     than adding one. The rule that a spellbook grows one night at a time still lives
     where it is played, which is the rest window. See loadoutState. */
  const state = loadoutState(talents, talent, {
    level: levelForXp(character?.xp),
    capped: 'capacity',
    /* And the attributes, for the one ceiling that reads one: a Runebearer's
       slate is half their Physique plus 4 a rank. See capacityAt in
       loadouts.js. */
    attributes: character,
    /* And the two sub-schools a vow opens, for the one pool whose families are
       the holder's rather than the spec's. See `familyGate` in loadouts.js. */
    families: oathFamilies(character, talent.id ?? talent),
  });
  if (!state) return null;

  const { spec, picks, known, owed, over, complete, library, capacity, whole } = state;

  return (
    <div className="pick-part">
      <span className="talent-summary-label">
        {spec.label}
        {/* A hand counts against what it may hold; a library counts against what
            it is filling. "5 of 5 chosen" would be a full spellbook, and the book
            in question has room for six more. */}
        <span className={`pick-count${complete ? '' : ' is-open'}`}>
          {whole
            ? `all ${picks.length}`
            : library
              ? `${picks.length} of ${capacity} ${kept(spec)}`
              : `${picks.length} of ${known} chosen`}
        </span>
      </span>

      {picks.length > 0 ? (
        <div className="talent-rung-cards">
          {picks.map((pick) =>
            pick.card ? (
              <div className="card-choice-row" key={pick.id}>
                <CardBrief
                  card={pick.card}
                  character={character}
                  modifiers={pick.modifiers}
                  onOpen={() => stack?.openCard(pick.card, pick.modifiers)}
                />
                {!pick.ok && (
                  <span className="loadout-illegal">
                    Not legal at your rank any more. Change it below.
                  </span>
                )}
              </div>
            ) : (
              <p className="pick-line" key={pick.id}>
                {pick.id} is held but this build&rsquo;s codex has no card by that name.
              </p>
            )
          )}
        </div>
      ) : (
        <p className="pick-line">
          {library
            ? owed > 0
              ? `Nothing ${kept(spec)} yet. ${upper(holder(spec))} begins with ${owed} ${plural(
                  spec.noun,
                  owed
                )} of your choosing, and holds ${capacity} in all.`
              : `Nothing ${kept(spec)} yet. ${upper(holder(spec))} holds ${capacity} ${plural(
                  spec.noun,
                  capacity
                )}.`
            : `Nothing chosen yet. This set knows ${known} ${plural(
                spec.noun,
                known
              )} at rank ${state.rank}.`}
        </p>
      )}

      {over > 0 && (
        <p className="pick-notice is-warning">
          {over} more {plural(spec.noun, over)} than this rank knows. Give some back.
        </p>
      )}

      {/* A whole pool has no button, because there is nothing in it anybody may
          change: GRAVE LORE hands over the entire Death family and a rank is what
          widens it. The count above says how many, the briefs say which, and the
          set's own card says why. See `isWhole` in loadouts.js. */}
      {!readOnly && !whole && (
        <div className="pick-tools pick-tools-tight">
          <button type="button" className="btn btn-sub btn-sm" onClick={() => setChoosing(true)}>
            {poolAction(state)}
          </button>
        </div>
      )}

      {choosing && !whole && (
        <LoadoutChooser
          talent={talent}
          character={character}
          state={state}
          readOnly={readOnly}
          onToggle={(cardId, how) =>
            patch({ talents: toggleLoadoutPick(talents, talent.id, cardId, known, how) })
          }
          onClear={() => patch({ talents: setTalentPicks(talents, talent.id, []) })}
          onClose={() => setChoosing(false)}
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------------- chooser */

/**
 * The pool, in two panes: the wall you choose from, and the column of what you
 * have chosen.
 *
 * ------------------------------------------------------------- the two panes
 * Asked for directly (Jules, 2026-09-09): "I want the screen split in 2 third is
 * the list with filter and on the right there is the selected one in a column.
 * So you select (over even drag and drop them) to that column. Or remove the
 * from there."
 *
 * It replaces a single wall where what you held was said by a word on a button
 * and a number in the footer. Choosing four spells out of a hundred and forty
 * meant scrolling back up the wall to find out what you already had, and giving
 * one back meant finding it again among the hundred and forty. The column is the
 * answer to both: what is on you is always on screen, in the order it is stored,
 * and the × beside a row is the only place you ever have to look to take one off.
 *
 *   the wall    two thirds, and everything it always was: the lead, the filter
 *               and the briefs, cut into sections by whatever the spec groups on.
 *   the column  one third, sticky, listing what is held with a cost, a card and
 *               an ×. It is also a drop target.
 *
 * Under 900px they stack and the column goes **first**, which is the one thing
 * that is not simply the desktop layout narrowed: on a phone the wall is a
 * hundred rows long, and a column underneath it is a column nobody will ever
 * see. That is the same break the Cauldron, the Enchanter and the effect tracker
 * share (see dialog widths in the CSS).
 *
 * -------------------------------------------------------------- drag and drop
 * A brief can be dragged into the column and a row can be dragged out of it,
 * which is the "over even drag and drop them" half of the ask. It is deliberately
 * the *second* way to do both: every tap still works, drag is a shortcut for
 * people who reach for it, and nothing about the dialog needs a pointer that can
 * hold something. Touch devices get the taps, which is the whole reason the
 * buttons were not replaced.
 */
export function LoadoutChooser({ talent, character, state, readOnly, onToggle, onClear, onClose }) {
  const { spec, options, known, rank, remaining, owed, tiers, library, capacity, full } = state;
  /* What is being dragged and where from, so both panes can light up as targets.
     The payload rides in `dataTransfer` as well, because that is what a drop
     outside this dialog would read, but a dragover cannot see it: only the drop
     can. So the state is what the styling and the guards read. */
  const [dragging, setDragging] = useState(null);

  /* Which window this is, read off the state rather than passed in. Only a rest
     caps a library below its ceiling, so a library whose allowance is short of its
     capacity is one being offered a night's research. See loadoutState. */
  const nightly = library && known < capacity;

  /* And whether the pool still owes cards, which is what shuts Done.
     Jules, 2026-09-10: "When player need to make choices, like spells, martial
     move, or other. Make sure they need to make those change before the
     confirm/finish." A rank that knows four spells and holds two is two spells
     short, and closing on that left a hand nobody had finished dealing: the
     block behind said "Choose 2 more spells" and nothing made you.

     A debt, never room, so a spellbook with places left in it still closes. And
     the escape hatch is the dialog's own ×, which is the law every other
     question in this app is asked under. See poolOwing in loadouts.js. */
  const owing = poolOwing(state);

  /* And whose place the next tap takes, when there is no room left for one more.
     "Replace the oldest" is a sensible rule and an invisible one: the wall says
     whose place it is, so a tap is never a card quietly disappearing. */
  const pushed = displacedBy(state);

  /* Only what this rank can actually take, plus anything already known. A wall
     of cards that says "not yet" thirty times is a wall you scroll past. What
     the later ranks hold is said in one line under the lead instead. */
  const offered = options.filter((option) => option.ok || option.known);
  const filter = useTagFilter(poolTags(offered), { searchable: true });
  /* The whole card, not just its name and body. It used to be those two, which
     meant a spell's damage type and the name of its second half were the only
     things about it a search could not find. Both stopped being printed as chips
     on 2026-08-25 (see CardBrief.jsx), so being searchable is now the only way
     either is reachable at all, and `cardHaystack` has carried them the whole
     time. The Abilities tab has always read this. */
  const visible = offered.filter(
    (option) => filter.matches(option.card.tags) && filter.text(cardHaystack(option.card))
  );

  /* Only what a rank still owes you. Everything else the pool refused is
     another school's and no rank opens it, so counting it here would promise a
     Mycomancer every Elemental spell in the codex and never open one. */
  const later = options.filter((option) => option.gate === 'tier' && option.tier).length;

  /* Whether one card may be held twice. Only the Runebearer says yes, and it
     changes three things in here: a tap on something already held is another
     copy, the wall counts copies instead of saying "known", and a line above the
     panes says so before anybody has to work it out from a button. */
  const repeat = Boolean(state.repeat);
  const verb = spec.verb ?? 'Learn';

  /* Both directions of a drag, and both are just the tap they shadow: dropping a
     brief on the column is the button under it, and dropping a row on the wall is
     the × beside it. Guarded by where the drag started, so letting go of a held
     row over the column (or a brief over the wall) does nothing rather than
     something surprising. */
  function take(cardId) {
    if (readOnly) return;
    onToggle(cardId, 'add');
  }

  function give(cardId) {
    if (readOnly) return;
    onToggle(cardId, 'drop');
  }

  function onDropHeld(event) {
    event.preventDefault();
    const id = dragging?.from === 'wall' ? dragging.id : null;
    setDragging(null);
    if (id) take(id);
  }

  function onDropWall(event) {
    event.preventDefault();
    const id = dragging?.from === 'held' ? dragging.id : null;
    setDragging(null);
    if (id) give(id);
  }

  return (
    <Modal
      title={`${talent.name}: ${spec.label}`}
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className={`pick-count${remaining ? ' is-open' : ''}`}>
            {library
              ? `${known - remaining} of ${capacity} ${kept(spec)}`
              : `${known - remaining} of ${known} chosen`}
          </span>
          {!readOnly && known - remaining > 0 && (
            <button type="button" className="btn btn-minimal btn-sm talent-drop" onClick={onClear}>
              {library ? 'Empty it out' : 'Clear them all'}
            </button>
          )}
          <span className="spacer" />
          {/* Shut while the rank still owes you cards, and it says how many on
              the button rather than only in the bubble: a disabled Done with no
              reason on it is the window refusing without saying why. A reader
              cannot owe anything, so theirs closes. */}
          <Gated
            className="btn btn-take btn-sm"
            why={
              readOnly || !owing
                ? null
                : `${owing} Take what is missing off the wall and this closes.`
            }
            onClick={onClose}
          >
            {!readOnly && owing ? poolAction(state) : 'Done'}
          </Gated>
        </>
      }
    >
      {/* What the rank is worth, said the way the pool works. A hand *knows* a
          number and that number is the whole allowance. A library *holds* one,
          and what it may take today is a different and smaller number, so both
          are printed rather than one standing in for the other. */}
      <p className="frame-foot" style={{ marginTop: 0 }}>
        {library ? (
          <>
            At rank {rank} {holder(spec)} holds <b>{capacity}</b>{' '}
            {plural(spec.noun, capacity)}
            {tiers.length > 0 ? `, up to ${listOut(tiers)}` : ''}.{' '}
            {full
              ? `It is full, so a ${spec.noun} ${kept(spec)} now replaces one already there.`
              : owed > 0
                ? `${owed} of them arrive with the set, and this is where you write them in.`
                : nightly
                  ? `Tonight you can ${verbOf(spec)} ${remaining} more.`
                  : `There is room for ${remaining} more.`}{' '}
            {spec.note}
          </>
        ) : (
          <>
            At rank {rank} you know <b>{known}</b> {plural(spec.noun, known)}
            {tiers.length > 0 ? `, up to ${listOut(tiers)}` : ''}. {spec.note}
          </>
        )}
      </p>

      {/* The one thing said above both panes, because it is true of the whole
          dialog rather than of either half: this pool may hold the same card
          twice. The spec may write the sentence itself, since a rune fires and a
          Martial Move would not. */}
      {repeat && (
        <p className="pick-line pool-repeat">
          {spec.repeatNote ??
            `The same ${spec.noun} can be ${kept(spec)} more than once. Each copy is its own single use.`}
        </p>
      )}

      <div className="pool-split">
        {/* ---------- THE WALL ----------
            Two thirds, and everything the dialog used to be. It is also where a
            row dragged out of the column lands, which is the same gesture as
            tapping the × on it. */}
        <div
          className={`pool-shelf${dragging?.from === 'held' ? ' is-target' : ''}`}
          onDragOver={(event) => dragging?.from === 'held' && event.preventDefault()}
          onDrop={onDropWall}
        >
          {/* Both lines used to name the school outright, which reads as a hole in
              a sentence for a pool that has none: a Martial Move belongs to no
              school and the tier is all that sorts it. So the school is said when
              there is one and left out when there is not. */}
          {offered.length === 0 ? (
            <p className="pick-notice is-warning">
              This build&rsquo;s codex holds no {spec.school ? `${spec.school} ` : ''}
              {plural(spec.noun, 2)} this rank can take yet. Add them to the codex and they appear
              here on their own.
            </p>
          ) : (
            later > 0 && (
              <p className="pick-line">
                {later} more {plural(spec.noun, later)}{' '}
                {spec.school ? 'in this school' : 'in the codex'}{' '}
                {later === 1 ? 'is' : 'are'} held back for higher ranks.
              </p>
            )
          )}

          <TagFilter
            filter={filter}
            count={visible.length}
            noun={spec.noun}
            placeholder={`Search ${spec.label.toLowerCase()}`}
          />

          <PoolWall
            options={visible}
            noun={spec.noun}
            character={character}
            group={spec.group}
            /* Dragged by the card rather than by a handle, and only when there is
               somewhere for it to go. A read-only chooser drags nothing. */
            drag={
              readOnly
                ? null
                : (option) => ({
                    id: option.card.id,
                    onStart: () => setDragging({ from: 'wall', id: option.card.id }),
                    onEnd: () => setDragging(null),
                  })
            }
            action={(option) =>
              !readOnly && (
                <button
                  type="button"
                  className={`btn btn-sm card-brief-btn ${
                    option.known && !repeat ? 'btn-minimal talent-drop' : 'btn-take'
                  }`}
                  /* The wall is cut to what the rank can take, so the only refusal
                     that reaches it is a stored pick the rank has since lost. That
                     one still says why on hover, the way the block says it above.

                     And when there is no room left, what taking this one costs,
                     which is the sentence "replace the oldest" never had. */
                  title={
                    !option.ok
                      ? option.reason
                      : (repeat || !option.known) && pushed
                        ? `No room for another. Taking this one puts ${nameOfPick(pushed)} out, which is the oldest thing in your ${spec.label.toLowerCase()}.`
                        : undefined
                  }
                  onClick={() => (option.known && !repeat ? give(option.card.id) : take(option.card.id))}
                >
                  {/* A repeating pool never says "known, give it back", because
                      another copy is the likelier thing to want from the wall and
                      the column beside it is where one is given back. */}
                  {repeat
                    ? option.copies > 0
                      ? `${verb} another · ${option.copies} on you`
                      : `${verb} this ${spec.noun}`
                    : option.known
                      ? 'Known, give it back'
                      : pushed
                        ? `Learn it · ${nameOfPick(pushed)} goes`
                        : `Learn this ${spec.noun}`}
                </button>
              )
            }
          />
        </div>

        {/* ---------- WHAT YOU HOLD ----------
            One third, and the half of this dialog that did not exist before: the
            picks, in the order they are stored, each with the card behind it and
            an × to take it off. Sticky, so it stays beside the wall however far
            down the wall you are. */}
        <aside
          className={`pool-held${dragging?.from === 'wall' ? ' is-target' : ''}`}
          onDragOver={(event) => dragging?.from === 'wall' && event.preventDefault()}
          onDrop={onDropHeld}
        >
          <div className="pool-held-head">
            <span className="stat-category-label">{heldTitle(spec, library)}</span>
            <span className={`pick-count${remaining ? ' is-open' : ''}`}>
              {state.picks.length} of {library ? capacity : known}
            </span>
          </div>

          {state.picks.length === 0 ? (
            <p className="pick-line pool-held-empty">
              Nothing here yet. Tap a {spec.noun} on the left, or drag one over.
            </p>
          ) : (
            <div className="pool-held-list">
              {state.picks.map((pick) => (
                <HeldRow
                  key={pick.key}
                  pick={pick}
                  spec={spec}
                  readOnly={readOnly}
                  onDrop={() => give(pick.id)}
                  onDragStart={() => setDragging({ from: 'held', id: pick.id })}
                  onDragEnd={() => setDragging(null)}
                />
              ))}
            </div>
          )}

          {/* What the next tap costs, where the thing it costs is listed. On the
              wall it was a tooltip on one button; here it is a sentence beside the
              card that is about to go. */}
          {pushed && !readOnly && (
            <p className="pick-line pool-held-note">
              Full. The next one you take puts {nameOfPick(pushed)} out.
            </p>
          )}
        </aside>
      </div>
    </Modal>
  );
}

/**
 * One thing you are holding: the card, what it costs, and the way to give it
 * back.
 *
 * The name is a button that deals the card, which is the gesture every other
 * list of cards on this sheet uses, and the × is separate so neither is ever
 * pressed by accident. Draggable onto the wall, which is the same as pressing
 * the ×.
 */
function HeldRow({ pick, spec, readOnly, onDrop, onDragStart, onDragEnd }) {
  const stack = useCardStack();
  const { card } = pick;

  if (!card) {
    return (
      <p className="pick-line">
        {pick.id} is held and this build&rsquo;s codex has no card by that name.
      </p>
    );
  }

  const cost = cardCost(card, pick.modifiers);

  return (
    <div
      className={`pool-held-row${pick.ok ? '' : ' is-illegal'}`}
      draggable={!readOnly}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', pick.id);
        event.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      <button
        type="button"
        className="pool-held-face"
        onClick={() => stack?.openCard(card, pick.modifiers)}
        title={`Open the ${card.name} card`}
      >
        <span className="pool-held-name">
          {card.name}
          {/* Which of them this is, on the copies and nowhere else. A pool that
              holds one of each never prints it. */}
          {pick.copy > 1 && <span className="pool-held-copy">×{pick.copy}</span>}
        </span>
        <CostOrbs
          ap={cost.ap}
          wp={cost.wp}
          size={17}
          className="pool-held-costs"
          apWas={cost.cut > 0 ? cost.printed : null}
          wpWas={cost.wpCut > 0 ? cost.wpPrinted : null}
          cutFrom={cost.from}
        />
      </button>

      {!pick.ok && <span className="pool-held-illegal">Not legal at your rank</span>}

      {!readOnly && (
        <button
          type="button"
          className="pool-held-drop"
          onClick={onDrop}
          title={`Take ${card.name} back off ${holder(spec)}`}
          aria-label={`Give ${card.name} back`}
        >
          ×
        </button>
      )}
    </div>
  );
}

/** What the column of held cards is called, off the spec where it says. */
function heldTitle(spec, library) {
  if (spec?.section) return spec.section;
  return library ? `What is ${kept(spec)}` : 'What you have chosen';
}

/* ------------------------------------------- the preview, rank by rank */

/**
 * What a rank of a choosing set opens, shown on the presentation page beside
 * that rank's fixed cards. Reading a set before taking it should say "and two
 * spells of your choosing, from these", not leave it to the card text.
 */
export function LoadoutRankNote({ talent, rank, character = null }) {
  const [open, setOpen] = useState(false);
  const preview = rankPreview(
    talent,
    rank,
    levelForXp(character?.xp),
    character,
    oathFamilies(character, talent.id)
  );
  if (!preview || preview.known === 0) return null;

  const { spec, known, gained, opened, count, library, granted } = preview;

  return (
    <>
      <div className="loadout-note">
        <span className="loadout-note-body">
          {/* A rank of a hand hands cards over. A rank of a library mostly hands
              over *room*, and only Rank 1 gives anything to choose, so saying
              "+10 spells of your choosing" at Rank 2 would promise ten spells that
              have to be hunted down one night at a time. */}
          <b>
            {library
              ? granted > 0
                ? `${granted} ${plural(spec.noun, granted)} to start, and room for more`
                : `Room for ${gained} more ${plural(spec.noun, gained)}`
              : gained > 0
                ? `+${gained} ${plural(spec.noun, gained)} of your choosing`
                : `${known} ${plural(spec.noun, known)} of your choosing`}
          </b>
          <span className="loadout-note-line">
            {library ? `holds ${known} at this rank` : `${known} known at this rank`}
            {rank === 1
              ? `, from the ${listOut(preview.tiers)} ${plural(spec.noun, 2)}`
              : opened.length > 0
                ? `, and ${listOut(opened)} ${plural(spec.noun, 2)} open up`
                : ''}
            .
          </span>
        </span>

        <button type="button" className="btn btn-sub btn-sm" onClick={() => setOpen(true)}>
          {/* `count` is what this rank *adds*, not everything it can reach, so
              a rank 2 Mycomancer is offered the eight Adept spells rather than
              all twenty-four. Zero is a real answer — the tier opened and the
              codex has nothing in it yet — and the wall says so. */}
          {count > 0 ? `See the ${count} ${plural(spec.noun, count)} it opens` : 'See what it opens'}
        </button>
      </div>

      {open && (
        <LoadoutBrowser
          talent={talent}
          rank={rank}
          spec={spec}
          opened={preview.opened}
          character={character}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/**
 * The one line above the wall, which has four true things to say depending on
 * what the rank actually did.
 *
 * The empty case is the one worth writing out: Rank 3 opens Master spells and
 * the codex has none written yet, so the wall is bare. Bare with no
 * explanation reads as "this rank gives you nothing", which is the opposite of
 * what happened.
 */
function browserLead({ rank, spec, opened, found }) {
  const nouns = plural(spec.noun, 2);

  if (opened.length === 0) {
    return `Rank ${rank} opens no new ${nouns}. This is the whole pool it can still take from.`;
  }
  if (found === 0) {
    return `Rank ${rank} opens ${listOut(opened)} ${nouns}. This build’s codex has none written yet, so there is nothing to show. Add them and they appear here on their own.`;
  }
  if (rank === 1) {
    return `Every ${spec.noun} Rank ${rank} opens. Higher ranks reach further, and their own note says how much further.`;
  }
  return `What Rank ${rank} adds. Everything the lower ranks already reach is left out, since you have been choosing from it since then.`;
}

/** The same wall, read-only, for a set nobody has taken yet. */
function LoadoutBrowser({ talent, rank, spec, opened = [], character, onClose }) {
  // What this rank *adds*, and only that. Reading Rank 1 should not be a list of
  // Adept spells you cannot have, and reading Rank 2 should not be a list of
  // Novice ones you have been choosing from since Rank 1.
  const options = newAtRank(talent, rank);
  const filter = useTagFilter(poolTags(options), { searchable: true });
  const visible = options.filter(
    (option) => filter.matches(option.card.tags) && filter.text(cardHaystack(option.card))
  );

  return (
    <Modal
      title={`${talent.name}: ${spec.label} at Rank ${rank}`}
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn-take btn-sm" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        {browserLead({ rank, spec, opened, found: options.length })}
      </p>

      <TagFilter
        filter={filter}
        count={visible.length}
        noun={spec.noun}
        placeholder={`Search ${spec.label.toLowerCase()}`}
      />

      <PoolWall options={visible} noun={spec.noun} character={character} group={spec.group} />
    </Modal>
  );
}

/* -------------------------------------------------------- the wall, in sections */

/**
 * The pool as a wall, cut into sections.
 *
 * Two dozen spells in one grid is a list you scan; the same two dozen under
 * Flora, Wild, Life and Blood is four short lists you choose from, and the
 * sub-school is the first thing a caster decides between. A pool holding only
 * one section is left as a plain wall, because a single heading over everything
 * is a heading that says nothing.
 *
 * **What it cuts by is the spec's, not this file's.** A spell has a sub-school and
 * that is what a caster chooses between. A Martial Move has neither a school nor a
 * family — the tier is the only thing that sorts it — so the Duelist's and the
 * Guardian's specs say `group: 'tier'` and the same wall comes out cut Novice,
 * Adept, Master instead of leaving fourteen cards under one heading called
 * Unfiled. Anything else falls back to the sub-school, which is what every
 * existing spec means by saying nothing.
 */
export function PoolWall({ options, noun, character, group = 'sub', action = null, drag = null }) {
  const stack = useCardStack();
  const groups = groupPool(options, group);

  const wall = (list) => (
    <div className="card-brief-wall">
      {list.map((option) => {
        /* Whether this one can be picked up and carried to the column beside the
           wall. Null on every wall that is only read: the rank preview, the
           browser and the encounter's own shelf. See the chooser. */
        const held = drag?.(option) ?? null;

        return (
          <CardBrief
            key={option.card.id}
            card={option.card}
            character={character}
            modifiers={option.modifiers}
            held={option.known}
            onOpen={() => stack?.openCard(option.card, option.modifiers)}
            drag={held}
          >
            {action?.(option)}
          </CardBrief>
        );
      })}
    </div>
  );

  if (groups.length <= 1) return wall(options);

  return groups.map((group) => (
    <section className="talent-page-rank" key={group.label}>
      <div className="talent-page-rank-head">
        <span className="talent-page-rank-label">{group.label}</span>
        <span className="talent-page-rank-note">
          {group.options.length} {plural(noun, group.options.length)}
        </span>
      </div>
      {wall(group.options)}
    </section>
  ));
}

/**
 * The options cut into sections, with anything the codex left unfiled gathered at
 * the end. Order inside a section is the order the pool arrived in, which is now
 * the law in cardOrder.js: what this rank can take first, then up the ladder and
 * across the schools.
 *
 * **The headings stack in the same order the cards inside them do**, and that is
 * `compareWords`'s whole job. Novice, Adept, Master is a ladder and sorting it by
 * name would put Adept at the top of it; Primal, Arcane, Elemental, Ethereal is
 * the order spells.js shelves the schools in and the alphabet knows nothing about
 * it. A word on neither list falls through to alphabetical, which is what a
 * heading with nothing behind it deserves.
 */
function groupPool(options, by) {
  const groups = new Map();
  for (const option of options) {
    /* Three cuts now. `school` is the Arcanist's, and the only spec that wants
       it: every other pool has one school or none, so cutting by it would make
       one section holding everything. A pool spanning every school in the codex
       is the one case where the school is the question. */
    const key =
      (by === 'tier' ? option.tier : by === 'school' ? option.school : option.sub) ?? 'Unfiled';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(option);
  }

  return [...groups]
    .sort(([a], [b]) => {
      if (a === 'Unfiled' || b === 'Unfiled') return a === 'Unfiled' ? 1 : -1;
      return compareWords(a, b);
    })
    .map(([label, list]) => ({ label, options: list }));
}

/* ------------------------------------------------------------------ parts */


/**
 * What holds a pool, as a noun phrase a sentence can lean on.
 *
 * A spellbook holds spells, and a Runebearer's runes are held by the Runebearer.
 * The label cannot say the second on its own: a plural one comes out as "your
 * runes holds 16 runes". So a spec whose label will not take the verb carries the
 * phrase instead, and every pool written before this keeps the sentence it had.
 */
function holder(spec) {
  return spec?.holds ?? `your ${(spec?.label ?? '').toLowerCase()}`;
}

/** The pool's own verb, lowercased for mid-sentence: research, inscribe. */
function verbOf(spec) {
  return (spec?.verb ?? 'Write in').toLowerCase();
}

/** A phrase promoted to the head of a sentence. */
function upper(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * What a library calls the state of holding something, off the spec's own word.
 * An Arcanist's spells are written down and a Runebearer's runes are inscribed
 * on them. Defaulted, so every pool written before this existed keeps its words.
 */
function kept(spec) {
  return spec?.kept ?? 'written down';
}

function plural(noun, count) {
  return count === 1 ? noun : `${noun}s`;
}

/** "Novice and Adept", "Novice, Adept and Master". No Oxford comma. */
function listOut(words) {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** A pick's printed name, or its stored id when this build's codex has no such card. */
function nameOfPick(pick) {
  return pick?.card?.name ?? pick?.id ?? '';
}
