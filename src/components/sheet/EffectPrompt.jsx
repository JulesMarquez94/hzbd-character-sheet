import { useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import CostOrbs from '../CostOrbs.jsx';
import { addEffect, trackableCards, TURNS_MAX } from '../../lib/combatTurn.js';

/** As many offers as fit above the fold. The search box is how you get past it. */
const PICK_LIMIT = 8;
import { cardHaystack } from '../../lib/abilitySources.js';
import { cardGist } from '../../lib/cardText.js';

/**
 * Putting something on the tracker.
 *
 * Two ways in, and the same three answers either way: what it is called, how
 * long it lasts, and what it does.
 *
 *   off a card   Pick from what this character actually has. The name, the
 *                provenance and the card all come with it, so the row on the
 *                block opens the real card afterwards, and the turn count is
 *                filled in from whatever the card's own text says ("for 10
 *                turns"). That number is a suggestion and nothing more: the
 *                table decides, and the dial is right there.
 *
 *   by hand      A condition, a blessing, a debt, whatever the Game Master
 *                just invented. It carries its own note instead of a card,
 *                because something the codex has never heard of still has to
 *                say what it does.
 *
 * "Until it ends" is its own answer rather than a very large number. Being
 * grappled does not run out, it is broken, and a tracker that made you write
 * 99 turns for it would be lying about what is happening.
 *
 * There is a third way in for one character, and `onEnchant` is it. An Ephemeral
 * Enchantment is a temporary effect and the only one on this sheet that carries a
 * mechanical rider, so it cannot be typed in by hand: the name would land and the
 * +1 Instinct would not. The offer opens the shelf instead, which is the same
 * window the quick bar opens and the one that takes the payment.
 *
 * ------------------------------------------------------------- whose tracker
 * `character` is always the character: it is what the offers are read from, and
 * what a card's numbers are printed against. `holder` is whose tracker the row
 * lands on, and it defaults to the same person. A creature a talent set put on
 * the board has a tracker of its own on its own row (see minions.js), so its
 * block passes `holder` — the creature's name, its current list, and where to
 * put the new one. Nothing else about the window changes: a Frightened dragon is
 * tracked with the same three answers as a frightened drifter.
 */
export default function EffectPrompt({
  character,
  onAdd,
  onClose,
  onEnchant = null,
  holder = null,
}) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [turns, setTurns] = useState(3);
  const [open, setOpen] = useState(false);
  // Which rest ends it, when a rest is what ends it: '' | 'short' | 'long'.
  const [until, setUntil] = useState('');
  const [picked, setPicked] = useState(null);
  const [search, setSearch] = useState('');

  const [all, setAll] = useState(false);

  const rows = useMemo(() => trackableCards(character, { all }), [character, all]);
  const everything = useMemo(() => trackableCards(character, { all: true }), [character]);

  const matches = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const found = needle
      ? rows.filter((row) => cardHaystack(row.card).toLowerCase().includes(needle))
      : rows;
    return { shown: found.slice(0, PICK_LIMIT), total: found.length };
  }, [rows, search]);

  // How much the "does this last?" filter is holding back. Said out loud,
  // because a filter this build guessed at must never silently be the reason
  // somebody cannot find their own spell.
  const lastingCount = useMemo(() => trackableCards(character).length, [character]);
  const filteredOut = everything.length - lastingCount;

  /**
   * Picking a card answers the duration as well as the name.
   *
   * The `else` is the whole point: a card that lasts but does not last in
   * turns ("until your next Long Rest") has to land on *until it ends*, not on
   * whatever the dial happened to be showing. Without it, Wild Strider was
   * tracked at the dial's default of 3 and ran out three turns later.
   */
  function choose(row) {
    setPicked(row);
    setName(row.card.name);
    setNote('');
    if (row.turns !== null) {
      setTurns(row.turns);
      setOpen(false);
      setUntil('');
    } else {
      setOpen(true);
      setUntil(row.until ?? '');
    }
  }

  function clear() {
    setPicked(null);
    setName('');
  }

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;

    const list = addEffect(holder ? holder.effects : character.effects, {
      name: trimmed,
      card: picked?.card.id ?? null,
      note: note.trim(),
      turns: open ? null : turns,
      // Only an open-ended effect can be ended by a rest; one counted in
      // turns runs out on its own before a rest is ever taken.
      until: open ? until || null : null,
      from: picked?.from ?? '',
    });

    // The holder decides what the patch looks like; the window only builds the
    // list, because a creature's rows live on its own row and not in a column.
    onAdd(holder ? holder.write(list) : { effects: list });
    onClose();
  }

  return (
    <Modal
      title={holder ? `Track an effect on ${holder.name}` : 'Track an effect'}
      onClose={onClose}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-copper btn-sm"
            onClick={add}
            disabled={!name.trim()}
          >
            Track it
          </button>
        </>
      }
    >
      <div className="fx-prompt">
      {/* ---------- OR LAY ONE ----------
          An Enchanter reaching for the tracker is usually reaching for this: an
          Ephemeral Enchantment *is* a temporary effect, and the one on this sheet
          that carries a real rider rather than a note. Typing "Primal Sense" in by
          hand would get the row and none of the +1 Instinct, so the offer is made
          here rather than left to be found on the quick bar. Same window either
          way, and it is the window that takes the payment. */}
      {onEnchant && (
        <div className="fx-offer">
          <span className="fx-offer-body">
            <b>Lay an Ephemeral Enchantment instead</b>
            <span className="fx-offer-line">
              Choose one you know and it lands here on its own, carrying what it
              actually does. Costs Action Points and Willpower.
            </span>
          </span>
          <button type="button" className="btn btn-take btn-sm" onClick={onEnchant}>
            Open the shelf
          </button>
        </div>
      )}

        {/* ---------- OFF A CARD ----------
            Only what actually lasts. A sword swing resolves and is over, and a
            trait that gives +1 Instinct is permanent, so neither is a thing
            that can be "running". Offering every card you own would bury the
            handful that tick. */}
        <label className="fx-field">
          <span className="fx-label">
            {all ? 'Everything you have' : 'What you have that lasts'}
          </span>
          <input
            type="text"
            className="fx-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, or by what it says"
          />
        </label>

        <div className="fx-picks">
          {matches.shown.length === 0 ? (
            <p className="pick-line">
              {rows.length === 0
                ? 'Nothing you hold lasts long enough to track. Write it in below instead.'
                : 'Nothing of yours matches that. Write it in below instead.'}
            </p>
          ) : (
            matches.shown.map((row) => (
              <button
                type="button"
                key={row.card.id}
                className={`fx-pick ac-kind-${row.card.kind ?? 'ability'}${
                  picked?.card.id === row.card.id ? ' is-picked' : ''
                }`}
                onClick={() => choose(row)}
              >
                <span className="fx-pick-head">
                  <span className="fx-pick-name">{row.card.name}</span>
                  {row.label && <span className="fx-pick-turns">{row.label}</span>}
                  <CostOrbs ap={row.card.ap} wp={row.card.wp} size={16} className="fx-pick-costs" />
                </span>
                <span className="fx-pick-line">
                  {row.card.summary ?? cardGist(row.card, { character })}
                </span>
                <span className="fx-pick-from">{row.from}</span>
              </button>
            ))
          )}
        </div>

        {(matches.total > matches.shown.length || filteredOut > 0) && (
          <p className="fx-picks-foot">
            {matches.total > matches.shown.length &&
              `${matches.total - matches.shown.length} more match. Keep typing to narrow it. `}
            {filteredOut > 0 &&
              (all ? (
                <button type="button" className="fx-unpick" onClick={() => setAll(false)}>
                  Show only what lasts
                </button>
              ) : (
                <>
                  {filteredOut} of your cards do not last, so they are set aside.{' '}
                  <button type="button" className="fx-unpick" onClick={() => setAll(true)}>
                    Show them anyway
                  </button>
                </>
              ))}
          </p>
        )}

        {/* ---------- OR BY HAND ---------- */}
        <label className="fx-field">
          <span className="fx-label">What it is called</span>
          <input
            type="text"
            className="fx-input"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              // Typing over a picked card means it is no longer that card, and
              // the row should not open a card that does not match its name.
              if (picked) setPicked(null);
            }}
            placeholder="Grappled, Renew, Blessed by the Warden"
          />
        </label>

        {picked ? (
          <p className="fx-picked-note">
            Reads the <b>{picked.card.name}</b> card on the block.{' '}
            <button type="button" className="fx-unpick" onClick={clear}>
              Write it in by hand instead
            </button>
          </p>
        ) : (
          <label className="fx-field">
            <span className="fx-label">What it does</span>
            <textarea
              className="fx-input fx-textarea"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              placeholder="One line you will thank yourself for in three rounds"
            />
          </label>
        )}

        {/* ---------- HOW LONG ---------- */}
        <div className="fx-field">
          <span className="fx-label">How long it lasts</span>

          <div className="fx-turn-row">
            <button
              type="button"
              className="use-dial-step"
              onClick={() => setTurns((v) => Math.max(1, v - 1))}
              disabled={open || turns <= 1}
              aria-label="One turn fewer"
            >
              &minus;
            </button>

            <span className="use-dial-value">
              <span className="use-dial-n">{open ? '∞' : turns}</span>
              <span className="use-dial-label">{open ? 'Until it ends' : 'Of your turns'}</span>
            </span>

            <button
              type="button"
              className="use-dial-step"
              onClick={() => setTurns((v) => Math.min(TURNS_MAX, v + 1))}
              disabled={open || turns >= TURNS_MAX}
              aria-label="One turn more"
            >
              +
            </button>
          </div>

          <label className="fx-check">
            <input type="checkbox" checked={open} onChange={() => setOpen((v) => !v)} />
            <span>
              Until something ends it. Conditions go here: being grappled does not run out, it is
              broken.
            </span>
          </label>

          {/* What ends it, when nothing counts it down. A rest can clear it
              for you, which is the whole reason a rest asks. */}
          {open && (
            <span className="fx-until">
              {[
                { id: '', label: 'Something in play' },
                { id: 'short', label: 'Any rest' },
                { id: 'long', label: 'A Long Rest' },
              ].map((option) => (
                <button
                  type="button"
                  key={option.id || 'play'}
                  className={`fx-until-opt${until === option.id ? ' is-on' : ''}`}
                  onClick={() => setUntil(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}
