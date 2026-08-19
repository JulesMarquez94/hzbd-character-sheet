import { useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import CostOrbs from '../CostOrbs.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useCardStack } from '../../context/card-stack.js';
import { turnState } from '../../lib/combatTurn.js';
import {
  BREW_BASES,
  BREW_NAME_MAX,
  brewCard,
  brewName,
  brewPreview,
  brewState,
  emptyBrewAt,
  getBase,
  reagentOptions,
  reagentsByTier,
  setBrewAt,
} from '../../lib/brews.js';

/**
 * The Cauldron: where a Keeper's Brews are mixed.
 *
 * Every other choice on this sheet is a choice between things that already
 * exist. A Mycomancer picks four spells out of a school of twenty-four and the
 * cards were printed before they got there. A Cauldron Keeper has no such
 * shelf: they pick a vessel, tip Reagents into it, and the card that comes out
 * did not exist until they mixed it. So this is not a chooser, it is a bench.
 *
 * ---------------------------------------------------------------- what it shows
 * The rack first: every bottle the Cauldron holds, mixed or standing empty,
 * each printed as the brief of the card it makes. Then, one bottle at a time,
 * the bench itself: the three Bases, the Reagent shelf cut into its tiers, and
 * the Brew being mixed rebuilt on every tap so the cost and the rules text are
 * never a guess. Nothing is written until it is bottled, so a Brew half thought
 * through costs nothing and Cancel really does cancel.
 *
 * ------------------------------------------------------------------ the scale
 * How many bottles, how deep each one goes and which tiers are open all come
 * off the set's rank, out of brews.js. Nothing here is hard-coded: a Rank 1
 * Keeper sees three bottles of one Reagent each from the Novice shelf, and the
 * same screen at Rank 3 is five bottles of three from all nine.
 *
 * --------------------------------------------------------- what it never does
 * It never spends anything. Re-mixing is free at a rest, and in the middle of a
 * fight it is a {{Quick Stir}} — a real card, played from the Quick Bar on the
 * Character tab, where every other point on this sheet is spent. A bench that
 * quietly took an Action Point would be the one place on the sheet that spends
 * without asking, so instead it says what a fight costs and leaves the paying
 * where the use law put it. Once the Stir *is* paid for, the block that took
 * the payment opens this bench itself.
 */
export default function BrewSection({
  talent,
  talents,
  character,
  patch,
  readOnly = false,
  autoOpen = false,
}) {
  const [mixing, setMixing] = useState(autoOpen);

  const state = brewState(talents, talent);
  if (!state) return null;

  const { spec, rack, bottles, mixed, capacity, illegal } = state;

  return (
    <div className="pick-part">
      <span className="talent-summary-label">
        {spec.label}
        <span className={`pick-count${mixed > 0 ? '' : ' is-open'}`}>
          {mixed} of {bottles} mixed
        </span>
      </span>

      {mixed > 0 ? (
        <div className="talent-rung-cards">
          {rack
            .filter((row) => row.filled)
            .map((row) => (
              <BottleRow key={row.slot} row={row} talent={talent} character={character} />
            ))}
        </div>
      ) : (
        <p className="pick-line">
          Nothing mixed yet. The Cauldron holds {bottles} {plural('Brew', bottles)} at rank{' '}
          {state.rank}, of {capacity} {plural('Reagent', capacity)} each.
        </p>
      )}

      {illegal > 0 && <IllegalNotice count={illegal} />}

      {!readOnly && (
        <div className="pick-tools pick-tools-tight">
          <button type="button" className="btn btn-sub btn-sm" onClick={() => setMixing(true)}>
            {mixed > 0 ? 'Open the Cauldron' : `Mix your first ${spec.noun}`}
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
            patch({ talents: setBrewAt(talents, talent.id, slot, draft) })
          }
          onEmpty={(slot) => patch({ talents: emptyBrewAt(talents, talent.id, slot) })}
          onClose={() => setMixing(false)}
        />
      )}
    </div>
  );
}

/** One mixed bottle as it reads outside the bench: the brief, and what is wrong with it. */
function BottleRow({ row, talent, character }) {
  const stack = useCardStack();

  return (
    <div className="card-choice-row">
      <CardBrief
        card={row.card}
        character={character}
        art={talent.art}
        onOpen={() => stack?.openCard(row.card)}
      />
      {!row.ok && <span className="loadout-illegal">{bottleFault(row)}</span>}
    </div>
  );
}

/**
 * Why a bottle is no longer legal, in the one line there is room for.
 *
 * Both faults arrive the same way: a rank given back, or a sheet mixed on a
 * build that had reached further. Neither is the player's mistake and neither is
 * poured away for them.
 */
function bottleFault(row) {
  if (row.beyond) {
    return 'Past the end of your rack now. Pour it out, or take the rank back.';
  }
  if (row.closed.length > 0) {
    return `${listAnd(row.closed.map((reagent) => reagent.name))} ${
      row.closed.length === 1 ? 'is' : 'are'
    } above your rank now. Re-mix this bottle.`;
  }
  return `${row.over} ${plural('Reagent', row.over)} more than your rank can hold. Re-mix this bottle.`;
}

function IllegalNotice({ count }) {
  return (
    <p className="pick-notice is-warning">
      {count} of your Brews {count === 1 ? 'is' : 'are'} no longer legal at your
      rank. {count === 1 ? 'It is' : 'They are'} still here, and re-mixing{' '}
      {count === 1 ? 'it' : 'them'} costs nothing at a rest.
    </p>
  );
}

/* ------------------------------------------------------------------ the bench */

/**
 * The bench proper. Two views on one dialog: the rack, and one bottle open on
 * it.
 *
 * `startAt` opens straight onto a bottle, which is what the Character tab wants
 * after a Quick Stir has been paid for — the point of paying was to mix, so
 * making the payer choose a bottle first would waste the tap they already made.
 */
export function BrewBench({
  talent,
  character,
  state,
  readOnly = false,
  paidFor = false,
  startAt = null,
  onBottle,
  onEmpty,
  onClose,
}) {
  const [at, setAt] = useState(startAt);
  const { spec, rack, bottles, rank, capacity, tiers } = state;

  const fight = turnState(character);

  return (
    <Modal
      title={
        at === null
          ? `${talent.name}: ${spec.label}`
          : `${spec.label}: bottle ${at + 1} of ${bottles}`
      }
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.talent}
      footer={
        at === null ? (
          <>
            <span className={`pick-count${state.mixed > 0 ? '' : ' is-open'}`}>
              {state.mixed} of {bottles} mixed
            </span>
            <span className="spacer" />
            <button type="button" className="btn btn-take btn-sm" onClick={onClose}>
              Done
            </button>
          </>
        ) : null
      }
    >
      {at === null ? (
        <>
          <p className="frame-foot" style={{ marginTop: 0 }}>
            At rank {rank} the Cauldron holds <b>{bottles}</b> {plural('Brew', bottles)} at once, of{' '}
            <b>{capacity}</b> {plural('Reagent', capacity)} each
            {tiers.length > 0
              ? `, drawn from the ${listAnd(tiers)} ${tiers.length === 1 ? 'shelf' : 'shelves'}.`
              : '.'}{' '}
            {spec.note}
          </p>

          {paidFor && (
            <p className="pick-notice">
              The Quick Stir is paid for. Re-mix whichever bottle you like.
            </p>
          )}
          {!paidFor && fight.inCombat && !readOnly && <FightNotice />}

          <div className="brew-rack">
            {rack.map((row) => (
              <Bottle
                key={row.slot}
                row={row}
                talent={talent}
                character={character}
                readOnly={readOnly}
                onMix={() => setAt(row.slot)}
                onEmpty={() => onEmpty(row.slot)}
              />
            ))}
          </div>
        </>
      ) : (
        <Mixer
          slot={at}
          talent={talent}
          character={character}
          state={state}
          readOnly={readOnly}
          onBottle={(draft) => {
            onBottle(at, draft);
            setAt(null);
          }}
          onEmpty={() => {
            onEmpty(at);
            setAt(null);
          }}
          onBack={() => setAt(null)}
        />
      )}
    </Modal>
  );
}

/** What a fight costs, said where somebody might otherwise think it was free. */
function FightNotice() {
  return (
    <p className="pick-notice is-warning">
      You are in a fight. Re-mixing now is a <b>Quick Stir</b>: play it from the Quick Bar on the
      Character tab and this bench opens on its own, with the Action Point already paid. Nothing
      here spends anything by itself.
    </p>
  );
}

/** One bottle on the rack: the Brew it holds, or the space where one would go. */
function Bottle({ row, talent, character, readOnly, onMix, onEmpty }) {
  const stack = useCardStack();

  if (!row.filled) {
    return (
      <div className="brew-bottle is-empty">
        <span className="brew-bottle-head">
          <span className="brew-bottle-slot">Bottle {row.slot + 1}</span>
          <span className="brew-bottle-state">Empty</span>
        </span>
        <p className="brew-bottle-hint">Nothing in it. Whatever you mix here is ready at once.</p>
        {!readOnly && (
          <button type="button" className="btn btn-take btn-sm" onClick={onMix}>
            Mix a Brew
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`brew-bottle${row.ok ? '' : ' is-illegal'}`}>
      <span className="brew-bottle-head">
        <span className="brew-bottle-slot">
          Bottle {row.slot + 1}
          {row.beyond ? ' · over' : ''}
        </span>
        <span className="brew-bottle-state">{row.base?.name}</span>
      </span>

      <CardBrief
        card={row.card}
        character={character}
        art={talent.art}
        onOpen={() => stack?.openCard(row.card)}
      />

      {!row.ok && <span className="loadout-illegal">{bottleFault(row)}</span>}

      {!readOnly && (
        <div className="brew-bottle-tools">
          {/* Nothing can be mixed into a bottle the rack no longer has. Pouring
              it out is the only move, and it is the one that fixes it. */}
          {!row.beyond && (
            <button type="button" className="btn btn-sub btn-sm" onClick={onMix}>
              Re-mix
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm talent-drop" onClick={onEmpty}>
            Pour it out
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ the mixer */

/**
 * One bottle, open.
 *
 * The vessel, then what goes in it, then the shelf it comes off. The Brew being
 * mixed is rebuilt on every tap and printed as its own brief, so the cost, the
 * damage types and the rules text are all the finished article before anything
 * is written down. Tapping the brief deals the real card, exactly as it will
 * read in the Quick Bar.
 *
 * The draft is local. Nothing reaches the character until it is bottled, which
 * is what lets the Reagents come back out again and what makes the one write
 * atomic when it comes.
 */
function Mixer({ slot, talent, character, state, readOnly, onBottle, onEmpty, onBack }) {
  const { spec, rank, rack, capacity } = state;
  const held = rack[slot];

  const [draft, setDraft] = useState(
    () => held?.recipe ?? { base: BREW_BASES[0].id, reagents: [] }
  );

  const stack = useCardStack();
  const base = getBase(draft.base);
  const card = brewCard(draft, { slot, rank });
  const options = reagentOptions({ spec, rank, draft });
  const shelf = reagentsByTier(options);

  const doses = draft.reagents ?? [];
  const room = Math.max(0, capacity - doses.length);

  function pickBase(id) {
    setDraft((current) => ({ ...current, base: id }));
  }

  function addDose(id) {
    setDraft((current) => {
      const next = [...(current.reagents ?? [])];
      if (next.length >= capacity) return current;
      next.push(id);
      return { ...current, reagents: next };
    });
  }

  /** By position, not by id: two doses of Rot Cap are two things you can take out. */
  function dropDose(index) {
    setDraft((current) => ({
      ...current,
      reagents: (current.reagents ?? []).filter((_, at) => at !== index),
    }));
  }

  return (
    <div className="brew-mixer">
      <div className="brew-mixer-tools">
        <button type="button" className="btn btn-minimal btn-sm" onClick={onBack}>
          ← The rack
        </button>
        <span className="spacer" />
        {!readOnly && held?.filled && (
          <button type="button" className="btn btn-minimal btn-sm talent-drop" onClick={onEmpty}>
            Pour it out
          </button>
        )}
        {!readOnly && (
          <button
            type="button"
            className="btn btn-take btn-sm"
            disabled={doses.length === 0 || !base}
            title={doses.length === 0 ? 'A Brew needs at least one Reagent' : undefined}
            onClick={() => onBottle(draft)}
          >
            {held?.filled ? 'Bottle it again' : 'Bottle it'}
          </button>
        )}
      </div>

      <div className="brew-mixer-grid">
        <div className="brew-mixer-parts">
          {/* ---- the vessel ---- */}
          <section className="brew-step">
            <div className="brew-step-head">
              <span className="brew-step-label">The vessel</span>
              <span className="brew-step-note">
                {base ? `${base.ap} AP, ${base.wpPer} WP a Reagent` : 'Pick one'}
              </span>
            </div>

            <div className="brew-bases">
              {BREW_BASES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`brew-base${option.id === draft.base ? ' is-on' : ''}`}
                  disabled={readOnly}
                  onClick={() => pickBase(option.id)}
                >
                  <span className="brew-base-head">
                    <span className="brew-base-name">{option.name}</span>
                    <CostOrbs
                      ap={option.ap}
                      wp={option.wpPer * Math.max(1, doses.length)}
                      size={20}
                    />
                  </span>
                  <span className="brew-base-reach">{option.reach}</span>
                  <span className="brew-base-line">{option.summary}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ---- what is in it ---- */}
          <section className="brew-step">
            <div className="brew-step-head">
              <span className="brew-step-label">What goes in</span>
              <span className={`brew-step-note${room > 0 ? ' is-open' : ''}`}>
                {doses.length} of {capacity} {plural('Reagent', capacity)}
              </span>
            </div>

            <div className="brew-doses">
              {Array.from({ length: capacity }, (_, index) => {
                const id = doses[index];
                const reagent = options.find((option) => option.reagent.id === id)?.reagent;

                return reagent ? (
                  <button
                    key={index}
                    type="button"
                    className="brew-dose is-filled"
                    disabled={readOnly}
                    title="Take it back out"
                    onClick={() => dropDose(index)}
                  >
                    <span className="brew-dose-name">{reagent.name}</span>
                    <span className="brew-dose-drop" aria-hidden="true">
                      ×
                    </span>
                  </button>
                ) : (
                  <span className="brew-dose" key={index}>
                    <span className="brew-dose-name">empty</span>
                  </span>
                );
              })}
            </div>
          </section>

          {/* ---- the shelf ---- */}
          <section className="brew-step">
            <div className="brew-step-head">
              <span className="brew-step-label">The shelf</span>
              <span className="brew-step-note">
                {options.filter((option) => option.ok).length} within reach
              </span>
            </div>

            {shelf.map((group) => (
              <div className="brew-shelf" key={group.label}>
                <span className="brew-shelf-tier">{group.label}</span>
                {group.options.map((option) => (
                  <Reagent
                    key={option.reagent.id}
                    option={option}
                    readOnly={readOnly}
                    onAdd={() => addDose(option.reagent.id)}
                  />
                ))}
              </div>
            ))}
          </section>
        </div>

        {/* ---- what it comes out as ---- */}
        <aside className="brew-preview">
          <div className="brew-step-head">
            <span className="brew-step-label">What comes out</span>
            <span className="brew-step-note">{card ? `${card.ap} AP · ${card.wp} WP` : 'nothing yet'}</span>
          </div>

          {card ? (
            <>
              <CardBrief
                card={card}
                character={character}
                art={talent.art}
                onOpen={() => stack?.openCard(card)}
              />
              <p className="brew-preview-hint">
                Tap it to read the card as it will print in your Quick Bar.
              </p>

              {!readOnly && (
                <label className="brew-name">
                  <span className="brew-name-label">Call it something</span>
                  <input
                    type="text"
                    className="brew-input"
                    value={draft.name ?? ''}
                    maxLength={BREW_NAME_MAX}
                    placeholder={brewName(draft)}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </label>
              )}
            </>
          ) : (
            <p className="pick-line">
              An empty vessel. Take something off the shelf and it starts reading like a card.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

/** One Reagent on the shelf: what it does, how much of it is already in, and the way in. */
function Reagent({ option, readOnly, onAdd }) {
  const { reagent, ok, reason, held } = option;

  return (
    <div className={`brew-reagent${held > 0 ? ' is-in' : ''}`}>
      <span className="brew-reagent-body">
        <span className="brew-reagent-name">
          {reagent.name}
          {held > 0 && <span className="brew-reagent-held">{held} in</span>}
        </span>
        <span className="item-tags">
          <span className="item-tag tag-card">{reagent.effect}</span>
        </span>
        <span className="brew-reagent-line">{reagent.summary}</span>
      </span>

      {!readOnly && (
        <button
          type="button"
          className={`btn btn-sm ${ok ? 'btn-take' : 'btn-minimal'}`}
          disabled={!ok}
          title={ok ? undefined : reason}
          onClick={onAdd}
        >
          {ok ? 'Tip it in' : reason}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------- the preview, rank by rank */

/**
 * What a rank of the Cauldron opens, on the presentation page beside that
 * rank's cards. Reading Special Brew should say how much wider the Cauldron
 * gets, not leave it to be counted out of the card text.
 */
export function BrewRankNote({ talent, rank }) {
  const preview = brewPreview(talent, rank);
  if (!preview || preview.bottles === 0) return null;

  const { bottles, gained, capacity, deeper, opened, count } = preview;

  return (
    <div className="loadout-note">
      <span className="loadout-note-body">
        <b>
          {gained > 0
            ? `+${gained} ${plural('bottle', gained)} on the rack`
            : `${bottles} ${plural('bottle', bottles)} on the rack`}
        </b>
        <span className="loadout-note-line">
          {bottles} {plural('Brew', bottles)} ready at this rank, of {capacity}{' '}
          {plural('Reagent', capacity)} each
          {deeper && rank > 1 ? ' (one deeper than the rank below)' : ''}
          {opened.length > 0
            ? `, and the ${listAnd(opened)} shelf opens: ${count} more ${plural(
                'Reagent',
                count
              )}`
            : ''}
          .
        </span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

function plural(noun, count) {
  return count === 1 ? noun : `${noun}s`;
}

/** "Novice and Adept", "Novice, Adept and Master". No Oxford comma. */
function listAnd(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
