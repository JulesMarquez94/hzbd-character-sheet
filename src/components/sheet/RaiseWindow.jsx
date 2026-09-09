import { useMemo } from 'react';
import Modal from '../Modal.jsx';
import PortraitField from '../images/PortraitField.jsx';
import TagFilter from './TagFilter.jsx';
import { poolTags, useTagFilter } from './useTagFilter.js';
import { PoolWall } from './LoadoutPick.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { cardHaystack } from '../../lib/abilitySources.js';
import { minionKindRows } from '../../lib/minions.js';
import { CARDS, getCard } from '../../lib/weapons.js';
import { raiseDraft, undeadMovePool, undeadSpellPool } from '../../lib/undead.js';

/**
 * Standing a body up: the Long Rest step behind "Raise an undead".
 *
 * RAISE THE DEAD is a Long Rest action, so this is a step in the rest window
 * exactly as the Enchanter's shelf and the Alchemist's still are, and nothing it
 * collects is written until "Yes, rest" is pressed. Backing out of the rest is a
 * night's work not done, with the corpse still in the cart.
 *
 * ------------------------------------------------------------------ four asks
 * Which body, what it is called, what it was raised over, and for three of the
 * seven kinds what it rose knowing. They are asked in that order because each one
 * narrows the next: the kind decides whether there is a spell list at all, and the
 * rank decides whether the remains on your sheet are an answer to the corpse.
 *
 * A picture is never owed and sits with the name, the way it does in the naming
 * window a draconic ally gets. Everything here is one screen: a raising is a
 * decision taken once about a body that can never be changed afterwards, so
 * putting the spells behind a second door would hide the half of it that matters.
 *
 * -------------------------------------------------------------- the same wall
 * The spells and the moves are chosen off `PoolWall`, which is the very wall the
 * Abilities tab and every loadout chooser use. A second wall built for one set
 * would be the one place on the sheet where picking a spell looked different, and
 * these are ordinary codex cards: the ⓘ deals the real card, and the numbers
 * printed on it are the *body's* own, because the wall is handed the kind as its
 * character. See minionKindRows in minions.js.
 */
export default function RaiseWindow({ character, row, draft, onDraft, onClose }) {
  const { state, offers } = row;

  const chosen = offers.find((offer) => offer.kind.id === draft?.kind) ?? null;
  const plan = chosen ? raiseDraft(state, chosen, draft ?? {}) : null;

  /* Each kind as the body it would stand up as, so the wall of choices can print
     Health and Defense rather than only a price, and so a chosen kind's spells
     print its own Mind. Worked out once for the whole window. */
  const bodies = useMemo(() => minionKindRows(character, state.talent), [character, state.talent]);
  const body = chosen ? bodies.find((one) => one.kind?.id === chosen.kind.id) ?? null : null;

  const spells = chosen ? undeadSpellPool(chosen.kind, CARDS) : null;
  const moves = chosen ? undeadMovePool(chosen.kind, CARDS) : null;

  /** One field of the draft changed, with the kind's own answers cleared if it moved. */
  const set = (body) => onDraft({ ...(draft ?? {}), ...body });

  return (
    <Modal
      title={`${state.spec.label}: ${(state.spec.raising ?? `raise ${state.spec.noun}`).toLowerCase()}`}
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className={`pick-count${plan?.ready ? '' : ' is-open'}`}>
            {plan?.ready
              ? `${draft.name} is ready to stand up`
              : chosen
                ? owing(plan, spells, moves)
                : `${state.left} of ${state.total} Marrow to spend`}
          </span>
          <span className="spacer" />
          {/* **Confirm, and dead until it is answered for.** Jules, 2026-09-09:
              "instead of back to rest, have the text read confirm, have it greyed
              out until all choice are made. Have the mouse over tell you what is
              missing." It read "← Back to the rest" and was always live, which
              made the way out of the window and the way to accept it the same
              button: a half-filled raising looked done.

              It still only closes the step. Nothing here is written until "Yes,
              rest" is pressed, which is the whole point of the rest window — and
              the dialog's own × is still the way to leave a raising unfinished. */}
          <button
            type="button"
            className="btn btn-take btn-sm"
            disabled={!plan?.ready}
            onClick={onClose}
            title={
              plan?.ready
                ? `${draft.name} stands up when you take the rest`
                : chosen
                  ? owing(plan, spells, moves)
                  : 'Choose which body you are raising'
            }
          >
            Confirm
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        One body a night, over a corpse. It takes its Marrow out of your {state.spec.label} and
        keeps it until you lay the body to rest, and your maximum Willpower comes down by{' '}
        {state.perMarrow} for every Marrow it cost. What it is and what it knows are fixed
        tonight: nothing about a raised body can be changed afterwards.
      </p>

      {/* ---------- WHICH BODY ---------- */}
      <span className="talent-summary-label">
        The body
        <span className={`pick-count${chosen ? '' : ' is-open'}`}>
          {chosen ? `${chosen.kind.label} · ${chosen.cost} Marrow` : 'not chosen'}
        </span>
      </span>

      <div className="raise-kinds">
        {offers.map((offer) => {
          const shown = bodies.find((one) => one.kind?.id === offer.kind.id) ?? null;
          const on = chosen?.kind.id === offer.kind.id;

          return (
            <button
              type="button"
              key={offer.kind.id}
              className={`raise-kind${on ? ' is-on' : ''}${offer.ok ? '' : ' is-shut'}`}
              disabled={!offer.ok}
              title={offer.ok ? `Raise ${offer.kind.label.toLowerCase()}` : offer.reason}
              onClick={() =>
                /* A different body is a different set of questions, so its
                   answers go with it rather than being carried over: two Novice
                   spells chosen for a magus are not two spells a ghoul knows. */
                set({ kind: offer.kind.id, spells: [], moves: [] })
              }
            >
              <span className="raise-kind-head">
                <span className="raise-kind-name">{offer.kind.label}</span>
                <span className="raise-kind-cost">{offer.cost}</span>
              </span>

              {shown && (
                <span className="raise-kind-stats">
                  {shown.stats.health_max} Health · Defense {shown.stats.avoid}
                  {shown.stats.defense > 0 ? ` · ${shown.stats.defense} Armor` : ''}
                </span>
              )}

              <span className="raise-kind-note">
                {offer.ok ? whatItDoes(offer.kind, shown) : offer.reason}
              </span>
            </button>
          );
        })}
      </div>

      {state.over > 0 && (
        <p className="pick-notice is-warning">
          Your {state.spec.label} is holding {state.over} more Marrow than it has. Lay something to
          rest before raising anything else.
        </p>
      )}

      {chosen && (
        <>
          {/* ---------- WHO IT IS ---------- */}
          <div className="pick-part">
            <span className="talent-summary-label">
              Who it is
              <span className={`pick-count${plan.named ? '' : ' is-open'}`}>
                {plan.named ? draft.name : 'not named'}
              </span>
            </span>

            <label className="form-label" htmlFor="raise-name">
              Name
            </label>
            <input
              className="form-input"
              id="raise-name"
              value={draft?.name ?? ''}
              placeholder={`What do you call your ${chosen.kind.noun ?? 'undead'}?`}
              maxLength={60}
              onChange={(event) => set({ name: event.target.value })}
            />

            <div style={{ marginTop: '1rem' }}>
              <PortraitField
                label="Picture"
                view="face"
                value={draft?.portrait_url ?? null}
                onChange={(url) => set({ portrait_url: url ?? '' })}
                hint="Its block draws it square, so the face is the frame that matters here."
              />
            </div>
          </div>

          {/* ---------- WHAT IT WAS RAISED OVER ---------- */}
          <div className="pick-part">
            <span className="talent-summary-label">
              The corpse
              <span className={`pick-count${plan.corpse ? '' : ' is-open'}`}>
                {plan.corpse ? CORPSE_WORDS[plan.corpse] : 'not answered'}
              </span>
            </span>

            <p className="pick-line">
              There is no raising without a body to raise. The table decides whether you have one:
              a Necromancer knows Dredge Corpse, which puts one in the ground at your feet.
            </p>

            <div className="raise-corpses">
              <CorpseOption
                id="fresh"
                on={plan.corpse === 'fresh'}
                label="A fresh corpse"
                note="You have one. Nothing to spend."
                onPick={() => set({ corpse: 'fresh', over: null })}
              />

              <CorpseOption
                id="remains"
                on={plan.corpse === 'remains'}
                label="Your own remains"
                note={
                  plan.reusable
                    ? 'What is left of one of yours. Nothing to spend, and the wreck goes.'
                    : state.rank >= (state.spec.remains ?? 99)
                      ? 'Nothing of yours to raise over yet.'
                      : 'Deeper Graves, at a higher rank.'
                }
                shut={!plan.reusable}
                onPick={() => set({ corpse: 'remains' })}
              />

              <CorpseOption
                id="built"
                on={plan.corpse === 'built'}
                label="Build one"
                note={`No body, so you make one. ${state.spec.supplies} Supplies out of the crate.`}
                onPick={() => set({ corpse: 'built', over: null })}
              />
            </div>

            {/* Which of your own it comes out of, once that is the answer. The
                wreck leaves the column in the same patch the new body arrives
                in, so its Marrow comes back on the same press. */}
            {plan.corpse === 'remains' && plan.reusable && (
              <div className="raise-remains">
                {state.wrecks.map((held) => (
                  <button
                    type="button"
                    key={held.id}
                    className={`raise-remain${draft?.over === held.id ? ' is-on' : ''}`}
                    onClick={() => set({ over: held.id })}
                  >
                    <span className="raise-remain-name">{held.row.name || 'Unnamed'}</span>
                    <span className="raise-remain-kind">
                      {held.kind?.label ?? held.kind ?? 'unknown'} · {held.willpower} Willpower back
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---------- WHAT IT ROSE KNOWING ---------- */}
          {spells && spells.count > 0 && (
            <ChoicePart
              title="What it rose knowing"
              noun="spell"
              pool={spells}
              chosen={plan.spells.chosen}
              character={body ?? character}
              lead={`It casts them with its own Mind and your Willpower, and it never learns another. To change what it knows you must destroy it and raise a new one.`}
              onToggle={(id) => set({ spells: toggle(plan.spells.chosen, id, spells.count) })}
            />
          )}

          {moves && moves.count > 0 && (
            <ChoicePart
              title="What it remembers"
              noun="Martial Move"
              pool={moves}
              chosen={plan.moves.chosen}
              character={body ?? character}
              lead="Added to its own swings inside the prompt that pays for them, out of your Willpower. Every rung is open to it."
              onToggle={(id) => set({ moves: toggle(plan.moves.chosen, id, moves.count) })}
            />
          )}
        </>
      )}
    </Modal>
  );
}

const CORPSE_WORDS = {
  fresh: 'a fresh one',
  remains: 'your own remains',
  built: `built, for Supplies`,
};

/** One answer to the corpse question. */
function CorpseOption({ on, label, note, shut = false, onPick }) {
  return (
    <button
      type="button"
      className={`raise-corpse${on ? ' is-on' : ''}${shut ? ' is-shut' : ''}`}
      disabled={shut}
      onClick={onPick}
    >
      <span className="raise-corpse-name">{label}</span>
      <span className="raise-corpse-note">{note}</span>
    </button>
  );
}

/**
 * One pool the body chooses out of, on the sheet's own wall.
 *
 * `character` is the *body*, not its keeper, so a spell on the wall prints the
 * numbers it will roll once the body is standing. That is the whole reason
 * `minionKindRows` exists.
 */
function ChoicePart({ title, noun, pool, chosen, character, lead, onToggle }) {
  const options = useMemo(
    () =>
      pool.options.map((card) => ({
        card,
        known: chosen.includes(card.id),
        ok: true,
        modifiers: null,
      })),
    [pool.options, chosen]
  );

  const filter = useTagFilter(poolTags(options), { searchable: true });
  const visible = options.filter(
    (option) => filter.matches(option.card.tags) && filter.text(cardHaystack(option.card))
  );

  const full = chosen.length >= pool.count;

  return (
    <div className="pick-part">
      <span className="talent-summary-label">
        {title}
        <span className={`pick-count${full ? '' : ' is-open'}`}>
          {chosen.length} of {pool.count} chosen
        </span>
      </span>

      <p className="pick-line">{lead}</p>

      <TagFilter
        filter={filter}
        count={visible.length}
        noun={noun}
        placeholder={`Search ${pool.options.length} ${noun}s`}
      />

      <PoolWall
        options={visible}
        noun={noun}
        character={character}
        group="tier"
        action={(option) => (
          <button
            type="button"
            className={`btn btn-sm card-brief-btn ${
              option.known ? 'btn-minimal talent-drop' : 'btn-take'
            }`}
            title={
              option.known
                ? undefined
                : full
                  ? `It knows ${pool.count} already. Taking this one puts the first out.`
                  : undefined
            }
            onClick={() => onToggle(option.card.id)}
          >
            {option.known ? 'Chosen, take it off' : full ? 'Take it instead' : `Give it this ${noun}`}
          </button>
        )}
      />
    </div>
  );
}

/** Taking or giving back one card, with the oldest giving way at the cap. */
function toggle(held, id, cap) {
  if (held.includes(id)) return held.filter((one) => one !== id);
  if (!(cap > 0)) return held;
  return held.length >= cap ? [...held.slice(1), id] : [...held, id];
}

/** The one line the footer says while something is still open. */
function owing(plan, spells, moves) {
  if (!plan.named) return 'It needs a name';
  if (!plan.corpse) return 'It needs a corpse';
  if (plan.corpse === 'remains' && !plan.reusable) return 'Nothing of yours to raise over';
  if (plan.corpse === 'remains' && !plan.over) return 'Say which of yours it comes out of';
  if (spells && plan.spells.chosen.length < plan.spells.need) {
    const left = plan.spells.need - plan.spells.chosen.length;
    return `${left} more ${left === 1 ? 'spell' : 'spells'} to choose`;
  }
  if (moves && plan.moves.chosen.length < plan.moves.need) {
    const left = plan.moves.need - plan.moves.chosen.length;
    return `${left} more ${left === 1 ? 'move' : 'moves'} to choose`;
  }
  return 'Something is still open';
}

/**
 * One line on what a kind is for, off the cards it actually plays rather than off
 * a sentence written twice.
 *
 * A body's kit is its tagged cards plus whatever it rose knowing, and at this
 * point it has risen knowing nothing, so this is the printed half: the names of
 * what it can do. That is a better answer than an adjective, and it cannot fall
 * out of step with the codex.
 */
function whatItDoes(kind, shown) {
  const names = (shown?.cards ?? []).map((card) => card.name);
  const owed = kind.spells?.count ?? 0;
  const drilled = kind.moves?.count ?? 0;

  const said = [...names];
  /* And the Martial Moves it simply has. A move is never a chip, so a body that
     knows one has nothing on its bar to say so and this line is the only place
     the choice can read it. See `knows` in minions.js. */
  for (const id of kind.knows ?? []) {
    const card = getCard(id);
    if (card) said.push(card.name);
  }
  if (owed > 0) said.push(`${owed} ${owed === 1 ? 'spell' : 'spells'} of your choosing`);
  if (drilled > 0) said.push(`${drilled} Martial ${drilled === 1 ? 'Move' : 'Moves'}`);

  return said.length > 0 ? said.join(' · ') : 'Nothing printed.';
}
