import { useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import TagFilter from './TagFilter.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useTagFilter } from './useTagFilter.js';
import { useCardStack } from '../../context/card-stack.js';
import { loadoutState, newAtRank, rankPreview, toggleLoadoutPick } from '../../lib/loadouts.js';
import { MOVE_TIERS } from '../../lib/martial.js';
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

  const state = loadoutState(talents, talent);
  if (!state) return null;

  const { spec, picks, known, remaining, over, complete } = state;

  return (
    <div className="pick-part">
      <span className="talent-summary-label">
        {spec.label}
        <span className={`pick-count${complete ? '' : ' is-open'}`}>
          {picks.length} of {known} chosen
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
                {pick.id} is written down but this build&rsquo;s codex has no card by that name.
              </p>
            )
          )}
        </div>
      ) : (
        <p className="pick-line">
          Nothing chosen yet. This set knows {known} {plural(spec.noun, known)} at rank {state.rank}.
        </p>
      )}

      {over > 0 && (
        <p className="pick-notice is-warning">
          {over} more {plural(spec.noun, over)} than this rank knows. Give some back.
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
            patch({ talents: toggleLoadoutPick(talents, talent.id, cardId, known) })
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
 * The pool as a wall of briefs: what each one costs, what it deals and the
 * first thing it does, with the card itself dealt onto the stack when one is
 * tapped. Thirty spells printed at their real size is a wall you scroll past
 * rather than a pool you choose from.
 */
export function LoadoutChooser({ talent, character, state, readOnly, onToggle, onClear, onClose }) {
  const { spec, options, known, rank, remaining, tiers } = state;

  /* Only what this rank can actually take, plus anything already known. A wall
     of cards that says "not yet" thirty times is a wall you scroll past. What
     the later ranks hold is said in one line under the lead instead. */
  const offered = options.filter((option) => option.ok || option.known);
  const filter = useTagFilter(poolTags(offered), { searchable: true });
  const visible = offered.filter(
    (option) => filter.matches(option.card.tags) && filter.text(option.card.name, option.card.body)
  );

  const later = options.length - offered.length;

  return (
    <Modal
      title={`${talent.name}: ${spec.label}`}
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className={`pick-count${remaining ? ' is-open' : ''}`}>
            {known - remaining} of {known} chosen
          </span>
          {!readOnly && known - remaining > 0 && (
            <button type="button" className="btn btn-minimal btn-sm talent-drop" onClick={onClear}>
              Clear them all
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn-take btn-sm" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        At rank {rank} you know <b>{known}</b> {plural(spec.noun, known)}
        {tiers.length > 0 ? `, up to ${listOut(tiers)}` : ''}. {spec.note}
      </p>

      {/* Both lines used to name the school outright, which reads as a hole in a
          sentence for a pool that has none: a Martial Move belongs to no school
          and the tier is all that sorts it. So the school is said when there is
          one and left out when there is not. */}
      {offered.length === 0 ? (
        <p className="pick-notice is-warning">
          This build&rsquo;s codex holds no {spec.school ? `${spec.school} ` : ''}
          {plural(spec.noun, 2)} this rank can take yet. Add them to the codex and they appear here
          on their own.
        </p>
      ) : (
        later > 0 && (
          <p className="pick-line">
            {later} more {plural(spec.noun, later)} {spec.school ? 'in this school' : 'in the codex'}{' '}
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
        action={(option) =>
          !readOnly && (
            <button
              type="button"
              className={`btn btn-sm card-brief-btn ${
                option.known ? 'btn-minimal talent-drop' : 'btn-take'
              }`}
              disabled={!option.ok && !option.known}
              title={option.ok ? undefined : option.reason}
              onClick={() => onToggle(option.card.id)}
            >
              {option.known
                ? 'Known, give it back'
                : option.ok
                  ? `Learn this ${spec.noun}`
                  : option.reason}
            </button>
          )
        }
      />
    </Modal>
  );
}

/* ------------------------------------------- the preview, rank by rank */

/**
 * What a rank of a choosing set opens, shown on the presentation page beside
 * that rank's fixed cards. Reading a set before taking it should say "and two
 * spells of your choosing, from these", not leave it to the card text.
 */
export function LoadoutRankNote({ talent, rank, character = null }) {
  const [open, setOpen] = useState(false);
  const preview = rankPreview(talent, rank);
  if (!preview || preview.known === 0) return null;

  const { spec, known, gained, opened, count } = preview;

  return (
    <>
      <div className="loadout-note">
        <span className="loadout-note-body">
          <b>
            {gained > 0
              ? `+${gained} ${plural(spec.noun, gained)} of your choosing`
              : `${known} ${plural(spec.noun, known)} of your choosing`}
          </b>
          <span className="loadout-note-line">
            {known} known at this rank
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
    return `Rank ${rank} opens ${listOut(opened)} ${nouns}. This build’s codex has none written yet, so there is nothing to show — add them and they appear here on their own.`;
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
    (option) => filter.matches(option.card.tags) && filter.text(option.card.name, option.card.body)
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
function PoolWall({ options, noun, character, group = 'sub', action = null }) {
  const stack = useCardStack();
  const groups = groupPool(options, group);

  const wall = (list) => (
    <div className="card-brief-wall">
      {list.map((option) => (
        <CardBrief
          key={option.card.id}
          card={option.card}
          character={character}
          modifiers={option.modifiers}
          held={option.known}
          onOpen={() => stack?.openCard(option.card, option.modifiers)}
        >
          {action?.(option)}
        </CardBrief>
      ))}
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
 * the end. Order inside a section is the order the pool arrived in: what this rank
 * can take first, then by name.
 *
 * Sections are named alphabetically except when they are tiers, which have an
 * order of their own — Novice, Adept, Master is a ladder, and sorting it by name
 * would put Adept at the top of it.
 */
function groupPool(options, by) {
  const groups = new Map();
  for (const option of options) {
    const key = (by === 'tier' ? option.tier : option.sub) ?? 'Unfiled';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(option);
  }

  const rank = (label) => {
    const at = MOVE_TIERS.indexOf(label);
    return at === -1 ? MOVE_TIERS.length : at;
  };

  return [...groups]
    .sort(([a], [b]) => {
      if (a === 'Unfiled' || b === 'Unfiled') return a === 'Unfiled' ? 1 : -1;
      if (by === 'tier') return rank(a) - rank(b);
      return a.localeCompare(b);
    })
    .map(([label, list]) => ({ label, options: list }));
}

/* ------------------------------------------------------------------ parts */

/**
 * Every tag the pool carries, as the filter row wants them.
 *
 * Minus the ones every card in it carries. A chip that selects the whole pool
 * narrows nothing, and there is always at least one: a Mycomancer's pool is all
 * Primal, and a Duelist's is fourteen cards all tagged Martial Move. The pool has
 * to hold more than one card for the test to mean anything, and a pool whose every
 * tag is universal keeps them all rather than showing a filter row with nothing
 * in it.
 */
function poolTags(options) {
  const tally = new Map();
  for (const option of options) {
    for (const tag of new Set(option.card.tags ?? [])) {
      tally.set(tag, (tally.get(tag) ?? 0) + 1);
    }
  }

  const all = [...tally.keys()].sort();
  const narrowing = options.length > 1 ? all.filter((tag) => tally.get(tag) < options.length) : all;

  return (narrowing.length > 0 ? narrowing : all).map((tag) => ({
    id: tag,
    label: tag,
    kind: 'card',
  }));
}

function plural(noun, count) {
  return count === 1 ? noun : `${noun}s`;
}

/** "Novice and Adept", "Novice, Adept and Master". No Oxford comma. */
function listOut(words) {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

