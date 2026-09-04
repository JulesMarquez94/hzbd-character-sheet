import { useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import CostOrbs from '../CostOrbs.jsx';
import { addEffect, trackableCards, TURNS_MAX } from '../../lib/combatTurn.js';

/** As many offers as fit above the fold. The search box is how you get past it. */
const PICK_LIMIT = 8;
import { cardHaystack } from '../../lib/abilitySources.js';
import { cardGist } from '../../lib/cardText.js';
import { riderLine } from '../../lib/riders.js';
import { trackableStatuses } from '../../lib/statuses.js';

/** Every condition the glossary defines, once, for the row of chips. */
const CONDITIONS = trackableStatuses();

/** The rows whose card answers the search, or all of them when nothing is typed. */
function hunt(list, needle) {
  if (!needle) return list;
  return list.filter((row) => cardHaystack(row.card).toLowerCase().includes(needle));
}

/** What shelf is being searched, in the fewest words that stay true. */
function shelfLabel(scope, all) {
  if (scope === 'codex') return all ? 'Every card in the game' : 'Everything in the codex that lasts';
  return all ? 'Everything you have' : 'What you have that lasts';
}

/**
 * Putting something on the tracker.
 *
 * Two ways in, and the same three answers either way: what it is called, how
 * long it lasts, and what it does.
 *
 *   off a card   Pick from what this character actually has, or from the whole
 *                codex. The name, the provenance and the card all come with it,
 *                so the row on the block opens the real card afterwards, and the
 *                turn count is filled in from whatever the card's own text says
 *                ("for 10 turns"). That number is a suggestion and nothing more:
 *                the table decides, and the dial is right there.
 *
 *   by hand      A condition, a blessing, a debt, whatever the Game Master
 *                just invented. It carries its own note instead of a card,
 *                because something the codex has never heard of still has to
 *                say what it does.
 *
 * ------------------------------------------------------------ somebody else's
 * **The two shelves are the point.** What is running on you is very often not
 * yours: the druid across the table casts GIANT GROWTH, nothing is spent on your
 * sheet, and your Movement Speed has doubled for ten turns. So the search sits
 * over a switch, and "The whole codex" is every card in the game.
 *
 * A card picked from either shelf lands the same way and carries the same rider,
 * because a rider is keyed on the card and never on who paid for it. Which is
 * also why the offer says what it will do to your numbers before you take it: a
 * row that moves a tile is a different decision from a row that is a reminder.
 * See riders.js.
 *
 * "Until it ends" is its own answer rather than a very large number. Being
 * grappled does not run out, it is broken, and a tracker that made you write
 * 99 turns for it would be lying about what is happening.
 *
 * There is a third way in for one character, and `onEnchant` is it. An Ephemeral
 * Enchantment is a temporary effect whose rider is *chosen* rather than printed,
 * so it can be neither typed in by hand nor picked off a shelf: either way the
 * name would land and the +1 Instinct would not. The offer opens the enchantment
 * shelf instead, which is the same window the quick bar opens and the one that
 * takes the payment.
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
  /* A condition picked off the glossary's own row rather than off a card:
     Poisoned, Prone, a stack of Bleed. It lands carrying the glossary's clock
     and whatever the condition does to the numbers, exactly as it would have
     had a Snake put it there. See statuses.js. */
  const [condition, setCondition] = useState(null);
  const [search, setSearch] = useState('');

  const [all, setAll] = useState(false);
  /* Whose cards are on offer: 'mine' is what this character actually holds, and
     'codex' is every card in the game. The second one exists because what is
     running on you is very often not yours. See trackableCards. */
  const [scope, setScope] = useState('mine');

  /* Both shelves, whole, once per character. The `lasts` halves are filters of
     them rather than two more walks: a row that does not last has no label, which
     is the same test `trackableCards` filtered on. */
  const mine = useMemo(() => trackableCards(character, { all: true }), [character]);
  const codex = useMemo(
    () => trackableCards(character, { all: true, codex: true }),
    [character]
  );

  const shelf = scope === 'codex' ? codex : mine;
  const rows = useMemo(() => (all ? shelf : shelf.filter((row) => row.label)), [shelf, all]);

  const needle = search.trim().toLowerCase();

  const matches = useMemo(() => {
    const found = hunt(rows, needle);
    return { shown: found.slice(0, PICK_LIMIT), total: found.length };
  }, [rows, needle]);

  /* What the *other* shelf is holding, so a search that comes up empty on your
     own cards can say where the thing actually is rather than sending you to the
     by-hand field. This is the whole point of the codex being reachable: you go
     looking for the spell somebody else just cast on you. */
  const elsewhere = useMemo(() => {
    if (scope === 'codex') return 0;
    const held = new Set(rows.map((row) => row.card.id));
    return hunt(codex.filter((row) => row.label && !held.has(row.card.id)), needle).length;
  }, [codex, rows, needle, scope]);

  // How much the "does this last?" filter is holding back. Said out loud,
  // because a filter this build guessed at must never silently be the reason
  // somebody cannot find their own spell.
  const filteredOut = shelf.length - shelf.filter((row) => row.label).length;

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
    setCondition(null);
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

  /** A condition picked: the glossary's name, open-ended, ended by the rest it names. */
  function chooseCondition(entry) {
    setCondition(entry);
    setPicked(null);
    setName(entry.name);
    setNote('');
    setOpen(true);
    setUntil(entry.until ?? '');
  }

  function clear() {
    setPicked(null);
    setCondition(null);
    setName('');
  }

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;

    const list = addEffect(holder ? holder.effects : character.effects, {
      name: trimmed,
      card: picked?.card.id ?? null,
      status: condition?.status ?? null,
      note: note.trim(),
      turns: open ? null : turns,
      // Only an open-ended effect can be ended by a rest; one counted in
      // turns runs out on its own before a rest is ever taken.
      until: open ? until || null : null,
      from: picked?.from ?? (condition ? 'By hand' : ''),
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
      /* The three-block measure, because the whole codex is on the shelf below
         and a hundred and forty cards read three abreast. The shelf and the
         written-in half sit side by side in it, and stack back up as the window
         comes in, so a phone is the window it always was. */
      size="page"
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
        {/* ---------- THE SHELF ----------
            Everything that finds the card: the offer, the box, which shelf is
            being searched and what is on it. It is the half with a list in it,
            so on a desktop it is the half that gets the room. */}
        <div className="fx-shelf">
          {/* ---------- OR LAY ONE ----------
              An Enchanter reaching for the tracker is usually reaching for this: an
              Ephemeral Enchantment *is* a temporary effect, and the one whose rider is
              chosen at the moment it is laid rather than printed on a card. Typing
              "Primal Sense" in by hand would get the row and none of the +1 Instinct,
              so the offer is made here rather than left to be found on the quick bar.
              Same window either way, and it is the window that takes the payment. */}
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

          {/* ---------- A CONDITION ----------
              The glossary's own row: Poisoned, Prone, Grappled and the rest,
              each landing with its own clock and its own effect on the numbers.
              Above the cards because a condition is what a Game Master is
              reaching for nine times in ten, and it used to have to be typed. */}
          <div className="fx-field">
            <span className="fx-label">A condition</span>
            <div className="fx-conditions">
              {CONDITIONS.map((entry) => (
                <button
                  type="button"
                  key={entry.status}
                  className={`fx-until-opt${condition?.status === entry.status ? ' is-on' : ''}`}
                  onClick={() => chooseCondition(entry)}
                  title={`${entry.line} ${entry.label}.`}
                >
                  {entry.name}
                </button>
              ))}
            </div>
          </div>

          {/* ---------- OFF A CARD ----------
              Only what actually lasts. A sword swing resolves and is over, and a
              trait that gives +1 Instinct is permanent, so neither is a thing
              that can be "running". Offering every card you own would bury the
              handful that tick.

              And two shelves to look on, because what is running on you is very
              often not yours: somebody else's Giant Growth doubles your Movement
              Speed for ten turns, and no source of yours has ever heard of it. */}
          <label className="fx-field">
            <span className="fx-label">{shelfLabel(scope, all)}</span>
            <input
              type="text"
              className="fx-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, or by what it says"
            />
          </label>

          <span className="fx-until fx-scope">
            {[
              { id: 'mine', label: 'Yours', count: mine.filter((row) => row.label).length },
              {
                id: 'codex',
                label: 'The whole codex',
                count: codex.filter((row) => row.label).length,
              },
            ].map((option) => (
              <button
                type="button"
                key={option.id}
                className={`fx-until-opt${scope === option.id ? ' is-on' : ''}`}
                onClick={() => setScope(option.id)}
                title={
                  option.id === 'mine'
                    ? 'What your own sources, your hands and your belt hand you'
                    : 'Every card in the game. For something somebody else laid on you.'
                }
              >
                {option.label} <b>{option.count}</b>
              </button>
            ))}
          </span>

          <div className="fx-picks">
            {matches.shown.length === 0 ? (
              <p className="pick-line">
                {rows.length === 0
                  ? 'Nothing on this shelf lasts long enough to track. Write it in below instead.'
                  : 'Nothing here matches that. Write it in below instead.'}
              </p>
            ) : (
              matches.shown.map((row) => {
                /* What tracking it will actually do to this sheet, when it does
                   anything. Said on the offer and not only after the fact, because
                   a row that moves a number is a different decision from a row that
                   is a reminder. See riders.js.

                   Only on the character's own tracker. A rider is read off the
                   effects column, and a creature's rows live on its own row, so a
                   promise made here about a Movement Speed would be a promise
                   nothing keeps. */
                const does = holder ? null : riderLine(row.card.id);

                return (
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
                      <CostOrbs
                        ap={row.card.ap}
                        wp={row.card.wp}
                        size={16}
                        className="fx-pick-costs"
                      />
                    </span>
                    <span className="fx-pick-line">
                      {row.card.summary ?? cardGist(row.card, { character })}
                    </span>
                    {does && <span className="fx-pick-rider">Moves your sheet: {does}</span>}
                    <span className="fx-pick-from">
                      {row.from}
                      {!row.mine && <span className="fx-pick-away"> not yours</span>}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {(matches.total > matches.shown.length || elsewhere > 0 || filteredOut > 0) && (
            <p className="fx-picks-foot">
              {matches.total > matches.shown.length &&
                `${matches.total - matches.shown.length} more match. Keep typing to narrow it. `}
              {/* The one that matters when somebody is hunting for a spell that was
                  cast *at* them. It reads before the "does this last" hatch, because
                  looking on the wrong shelf is the likelier mistake. */}
              {elsewhere > 0 && (
                <>
                  {matches.total > 0
                    ? `${elsewhere} more in the codex.`
                    : `${elsewhere} in the codex, none of them yours.`}{' '}
                  <button type="button" className="fx-unpick" onClick={() => setScope('codex')}>
                    Look there too
                  </button>{' '}
                </>
              )}
              {filteredOut > 0 &&
                (all ? (
                  <button type="button" className="fx-unpick" onClick={() => setAll(false)}>
                    Show only what lasts
                  </button>
                ) : (
                  <>
                    {filteredOut} {scope === 'codex' ? 'cards' : 'of your cards'} do not last, so they
                    are set aside.{' '}
                    <button type="button" className="fx-unpick" onClick={() => setAll(true)}>
                      Show them anyway
                    </button>
                  </>
                ))}
            </p>
          )}
        </div>

        {/* ---------- OR BY HAND ----------
            The name, what it does and how long for. Boxes and a dial, none of
            which reads better a metre wide, so they keep a column of their own
            beside the shelf and fall under it as the window comes in. */}
        <div className="fx-hand">
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
                if (condition) setCondition(null);
              }}
              placeholder="Grappled, Renew, Blessed by the Warden"
            />
          </label>

          {condition ? (
            <p className="fx-picked-note">
              The glossary&rsquo;s <b>{condition.name}</b>: {condition.line}{' '}
              <button type="button" className="fx-unpick" onClick={clear}>
                Write it in by hand instead
              </button>
            </p>
          ) : picked ? (
            <p className="fx-picked-note">
              Reads the <b>{picked.card.name}</b> card on the block.
              {/* And what it will do to the numbers, promised before it is tracked.
                  A row that raises a Defense or doubles a Speed has to say so here:
                  the tiles will move, and a player who did not expect that has no
                  way to find out which row did it. */}
              {!holder && riderLine(picked.card.id) && (
                <>
                  {' '}
                  Your sheet moves with it: {riderLine(picked.card.id)}, until the row comes off.
                </>
              )}{' '}
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
      </div>
    </Modal>
  );
}
