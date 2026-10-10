import { useMemo, useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import TagFilter from './TagFilter.jsx';
import UsePrompt from './UsePrompt.jsx';
import { CostOrb } from '../CostOrbs.jsx';
import { Gated } from './parts.jsx';
import { ItemIcon } from './itemParts.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { poolTags, useTagFilter } from './useTagFilter.js';
import { usePlayCard } from './usePlayCard.js';
import { useCardStack } from '../../context/card-stack.js';
import { getItem } from '../../lib/items.js';
import {
  ephemeralCost,
  ephemeralRecord,
  ephemeralState,
  freeLoops,
  withLeaf,
} from '../../lib/scribing.js';
import { SCROLL_BASE, listAnd, scrollLine, scrollTier, scrollTitle } from '../../lib/scrolls.js';

/**
 * Throwing a leaf down where you stand: one spell, in fading ink, now.
 *
 * EPHEMERAL SPELL SCROLLS, as Jules reworked it on 2026-09-10: "rework
 * spellquill so that ephemeral scroll are created on the fly. Not after a long
 * rest. He has an ability that allow him to create one. Creating an ephemeral
 * scroll require 2 action points. The user can then choose to cast it if he can
 * or keep it in inventory or give it to someone. Ephemeral spell crafting also
 * cost 1 willpower for novice 2 for adept and 3 for master."
 *
 * -------------------------------------------------- why this is not ScribeRest
 * ScribeRest.jsx is a night at the desk: two leaves against one budget, priced
 * in Supplies out of the crate, held as a draft that only "Yes, rest" commits.
 * It is a list you build.
 *
 * This is one leaf, paid for out of the pools the moment you press. So it is not
 * a chooser with a count in its corner: it is the same three questions
 * EnchantWindow asks in the same order (what is on it, what is worked into it,
 * where it goes) and then the action-or-reaction question every use on this
 * sheet asks. The two windows had a common ancestor and no longer share anything
 * but the shelf.
 *
 * -------------------------------------------------------------------- the cost
 * Two Action Points, printed on the card, and Willpower off the spell's rung: 1
 * at Novice, 2 at Adept, 3 at Master, plus whatever a Power Word costs on top.
 * The rung half is not knowable until a spell is chosen, so the card prints `X`
 * for the Willpower and this window is where the whole cost is worked out and
 * paid, in one prompt, the same way the Cauldron pays for a Brew.
 *
 * The pools are not checked here. `UsePrompt` already says which one came up
 * short and by how much, and it carries the table's override with it.
 *
 * --------------------------------------------------------- and then three ways
 * "Cast it if he can or keep it in inventory or give it to someone" are the
 * three a scroll has always had, and none of them needed anything new. What this
 * window does about them is put the leaf somewhere useful and then say where it
 * went: a free belt loop by default, because a loop is the only place a scroll
 * can be read from and a leaf written mid-fight is one you meant to read. See
 * `withLeaf` in scribing.js.
 *
 * Nothing casts the spell. `roll: false`, for the reason brewing and enchanting
 * both give: this pays for a cast that has not happened, and the spell's dice
 * belong to the moment somebody reads the leaf.
 *
 * ------------------------------------------------------- and the card it charges
 * `card` is EPHEMERAL SPELL SCROLLS and deliberately not the spell going on the
 * leaf, which is what EnchantWindow would have done with it. The spell is
 * printed beside the prompt anyway, in this window's own panel, and passing it
 * as the card being played would hand it to `castPlan`: a scroll of a spell that
 * conjures something would announce the summon at the desk, and one with a
 * duration would start its clock. The ability is what is being played, and the
 * ability lays nothing.
 */
export default function EphemeralWindow({ character, card, patch, readOnly = false, onClose }) {
  const state = ephemeralState(character);
  const stack = useCardStack();
  const play = usePlayCard({ character, patch });

  /** The spell going on the leaf, or null while the shelf is being read. */
  const [spell, setSpell] = useState(null);
  /** The Power Words worked into it, as ids. */
  const [words, setWords] = useState([]);
  /* Where it is going: a belt index, `null` for the pack, or `undefined` while
     nobody has said.

     **Three states and not two.** `null` has to *mean* the pack, so "not decided
     yet" needs a value of its own: with both spelled `null`, picking the pack
     read as picking nothing and fell straight back to the first free loop, which
     is what the default is. Caught in a browser pass on 2026-09-10, and the only
     way to catch it was to press the button. */
  const [loop, setLoop] = useState(undefined);
  /** The use waiting on the action-or-reaction question. */
  const [paying, setPaying] = useState(null);
  /* And the leaf once it exists, so the window says what it made and where it
     put it rather than vanishing at the moment the news arrives. */
  const [written, setWritten] = useState(null);

  /* `poolTags` and not a list of bare tag names: the filter row wants
     `{ id, label, kind }` and reads `label` the moment anybody types, so a list
     of strings throws on the first keystroke. It cost this window a browser pass
     to find, and the same mistake was already shipped in ScribeRest and
     ScrollWindow, which both had a private copy of the wrong helper. */
  const filter = useTagFilter(shelfTags(state), { searchable: true });
  const loops = useMemo(() => freeLoops(character), [character]);

  if (!state || !card) return null;

  const base = getItem(SCROLL_BASE);
  const cost = ephemeralCost(state, spell, words);

  /* Which loop it lands in, settled once rather than at each of the three places
     that ask: the first free one until somebody says otherwise, then whatever
     they said. A loop that has filled up or closed since resolves to the pack
     rather than to another loop, which is the same answer `withLeaf` would reach
     on its own and keeps the readout from naming a loop the leaf did not go in. */
  const target =
    loop === undefined ? (loops[0] ?? null) : loops.includes(loop) ? loop : null;

  const shelf = state.shelf.filter(
    (row) => filter.matches(row.tags) && filter.text(row.name, row.summary ?? '')
  );

  /** A word in, or a word out, up to what one leaf takes. */
  function toggle(id) {
    setWords((held) => {
      if (held.includes(id)) return held.filter((one) => one !== id);
      if (held.length >= state.wordsPerScroll) return held;
      return [...held, id];
    });
  }

  /** The one write a confirmed leaf makes: the points, the record and its place. */
  function confirm(mode, amount, options) {
    const record = ephemeralRecord(state, spell, words);
    /* Nothing to write means nothing to pay for. The button above cannot be
       pressed without a spell and `ephemeralRecord` refuses a rung this rank has
       not opened, so this is the belt to that brace: a rank that dropped while
       the prompt stood open must not spend the points on a leaf that never
       existed. */
    if (!record) {
      setPaying(null);
      return;
    }

    play(paying, mode, amount, options, {
      roll: false,
      write: (body) => ({ ...body, ...(withLeaf(character, record, target) ?? {}) }),
    });

    setPaying(null);
    setWritten({ record, spell, loop: target });
    setSpell(null);
    setWords([]);
    /* And back to "wherever is free", because the loop this one just took is not
       free any more and the next leaf should default to one that is. */
    setLoop(undefined);
  }

  return (
    <>
      <Modal
        title="Ephemeral Spell Scrolls"
        onClose={onClose}
        size="page"
        accent={PICK_ACCENTS.talent}
        footer={
          <>
            <span className="brew-step-note">
              {spell ? `${cost.ap} AP · ${cost.wp} WP` : written ? 'written' : 'no spell chosen'}
            </span>
            <span className="spacer" />
            <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
              {written ? 'Done' : 'Close'}
            </button>
            {/* Another leaf is another use of the card, at another 2 Action
                Points, so the way back to the shelf sits where "Write it" was
                rather than inside the readout above it. */}
            {!readOnly && written && (
              <button
                type="button"
                className="btn btn-take btn-sm"
                onClick={() => setWritten(null)}
              >
                Write another
              </button>
            )}
            {!readOnly && !written && (
              <Gated
                className="btn btn-take btn-sm"
                why={spell ? null : 'Nothing on the leaf yet. Choose the spell it holds below.'}
                onClick={() =>
                  setPaying({
                    name: card.name,
                    source: `${scrollTitle({ spell: spell.id, ephemeral: true })} · in fading ink`,
                    ap: cost.ap,
                    wp: cost.wp,
                    card,
                  })
                }
              >
                Write it
              </Gated>
            )}
          </>
        }
      >
        <p className="frame-foot" style={{ marginTop: 0 }}>
          At rank {state.rank} you can write the {listAnd(state.tiers)}{' '}
          {state.tiers.length === 1 ? 'list' : 'lists'}, off a shelf of {state.shelf.length}. One
          leaf costs {state.ephemeral.ap} Action Points and its rung in Willpower: 1 at Novice, 2
          at Adept and 3 at Master. No Supplies and no Quartz go into one, and it{' '}
          <b>expires at the start of your next Long Rest</b>.
          {state.wordsPerScroll > 0
            ? ` Up to ${state.wordsPerScroll} Power ${state.wordsPerScroll === 1 ? 'Word' : 'Words'} on it, each for its own Willpower.`
            : ''}
        </p>

        {/* ---------- the leaf that now exists ----------
            In place of the shelf, because the question has changed: it is no
            longer which spell, it is what you are going to do with the thing in
            your hand. */}
        {written ? (
          <Written written={written} base={base} onRead={stack?.openCard} />
        ) : (
          <div className="ench-window">
            <div className="ench-shelf">
              {/* ---------- WHAT IS WRITTEN ON IT ---------- */}
              <section className="brew-step">
                <div className="brew-step-head">
                  <span className="brew-step-label">The spell</span>
                  <span className="brew-step-note">
                    {spell ? spell.name : 'One, and it is the whole of what the leaf does'}
                  </span>
                </div>

                {spell ? (
                  <div className="forge-base">
                    <ItemIcon item={base} size={52} />
                    <div className="forge-base-body">
                      <span className="forge-base-name">
                        {scrollTitle({ spell: spell.id, ephemeral: true })}
                      </span>
                      <span className="item-card-note">{spell.summary}</span>
                      <span className="brew-reagent-held">
                        {scrollTier(spell)} · {cost.rung} Willpower to write · {spell.ap ?? 0}{' '}
                        Action Points and {spell.wp ?? 0} Willpower to read
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-minimal btn-sm"
                      onClick={() => {
                        setSpell(null);
                        setWords([]);
                      }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <TagFilter
                      filter={filter}
                      count={shelf.length}
                      noun="spell"
                      placeholder="Search what you can write"
                    />
                    <div className="card-brief-wall">
                      {shelf.length === 0 ? (
                        <p className="browser-empty">No spell you can write matches that.</p>
                      ) : (
                        shelf.map((row) => (
                          <CardBrief
                            card={row}
                            character={character}
                            key={row.id}
                            onOpen={() => stack?.openCard(row)}
                          >
                            <span className="brew-reagent-held">
                              {scrollTier(row)} · {ephemeralCost(state, row).wp} Willpower
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm card-brief-btn btn-take"
                              onClick={() => {
                                setSpell(row);
                                setWords([]);
                              }}
                              title={`Write ${row.name} in fading ink`}
                            >
                              Write this one
                            </button>
                          </CardBrief>
                        ))
                      )}
                    </div>
                  </>
                )}
              </section>

              {/* ---------- WHAT IS WORKED INTO IT ----------
                  Only the words this rank knows, and only as many as one leaf
                  takes. A rank that knows none has no section at all: IMPROVED
                  SYNTAX is what opens it, and an empty row of buttons at Rank 1
                  would read as something missing rather than as something not
                  learned yet. */}
              {spell && state.wordsPerScroll > 0 && (
                <section className="brew-step">
                  <div className="brew-step-head">
                    <span className="brew-step-label">Power Words</span>
                    <span className="brew-step-note">
                      {words.length} of {state.wordsPerScroll}
                      {cost.ink > 0 ? ` · ${cost.ink} Willpower` : ''}
                    </span>
                  </div>

                  <div className="rest-runes">
                    <div className="rest-runes-list">
                      {state.words.map((word) => {
                        const on = words.includes(word.id);
                        const room = on || words.length < state.wordsPerScroll;

                        return (
                          <button
                            type="button"
                            key={word.id}
                            className={`rest-rune${on ? ' is-on' : ''}`}
                            onClick={() => toggle(word.id)}
                            disabled={!room}
                            title={
                              room
                                ? `${word.name}. ${word.body}`
                                : `${state.wordsPerScroll} ${state.wordsPerScroll === 1 ? 'word' : 'words'} is all one leaf takes. Tap one off to make room for ${word.name}`
                            }
                          >
                            <span className="rest-rune-name">{word.name}</span>
                            <CostOrb kind="wp" value={word.wp} size={17} />
                          </button>
                        );
                      })}
                    </div>
                    <span className="rest-runes-budget">
                      What each one does is on its own tooltip. The Willpower is paid in the
                      writing, with the rung’s own.
                    </span>
                  </div>
                </section>
              )}
            </div>

            {/* ---------- WHAT IT WILL BE ---------- */}
            <aside className="brew-preview">
              <div className="brew-step-head">
                <span className="brew-step-label">What you are writing</span>
                <span className="brew-step-note">
                  {spell ? `${cost.ap} AP · ${cost.wp} WP` : 'nothing yet'}
                </span>
              </div>

              {spell ? (
                <>
                  <CardBrief card={spell} character={character} onOpen={() => stack?.openCard(spell)} />

                  <div className="ench-working">
                    <span className="ench-working-line">
                      <b>{cost.ap} Action Points</b>, printed on the card.
                    </span>
                    <span className="ench-working-line">
                      <b>{cost.rung} Willpower</b>, which is the {scrollTier(spell)} rung.
                    </span>
                    {cost.ink > 0 && (
                      <span className="ench-working-line">
                        <b>{cost.ink} Willpower</b> more, for{' '}
                        {listAnd(words.map((id) => wordName(state, id)))}.
                      </span>
                    )}
                    <span className="ench-working-line">
                      No Supplies and no Quartz. Nobody will buy a fading leaf.
                    </span>
                  </div>

                  {/* ---------- WHERE IT GOES ----------
                      Asked here rather than left to the Inventory tab, because a
                      scroll is read off a belt loop and this is the window that
                      knows a fight may be standing. */}
                  <Destination loops={loops} target={target} onPick={setLoop} />
                </>
              ) : (
                <p className="pick-line">
                  Nothing chosen. Pick a spell off the shelf and this says what the leaf will
                  hold, what it costs and where it lands.
                </p>
              )}
            </aside>
          </div>
        )}
      </Modal>

      {paying && (
        <UsePrompt
          request={paying}
          character={character}
          onCancel={() => setPaying(null)}
          onConfirm={confirm}
        />
      )}
    </>
  );
}

/* --------------------------------------------------------------- where it goes
 *
 * A free loop by default, the pack as the other answer, and only the loops that
 * are both open and empty. A character with every loop full is not offered a
 * choice at all: there is one place it can go, and a control with one option is
 * a sentence pretending to be a control.
 */
function Destination({ loops, target, onPick }) {
  return (
    <div className="ench-target">
      <span className="fx-label">Where it goes</span>

      {loops.length === 0 ? (
        <span className="ench-target-note">
          Into your pack. Every belt loop you have open is full, so clip it on from the Inventory
          tab when you want to read it.
        </span>
      ) : (
        <>
          <div className="rest-runes-list">
            {loops.map((index) => (
              <button
                type="button"
                key={index}
                className={`rest-rune${target === index ? ' is-on' : ''}`}
                onClick={() => onPick(index)}
                title={`Clip it to belt loop ${index + 1}, ready to read off the Quick Bar`}
              >
                <span className="rest-rune-name">Loop {index + 1}</span>
              </button>
            ))}
            <button
              type="button"
              className={`rest-rune${target === null ? ' is-on' : ''}`}
              onClick={() => onPick(null)}
              title="Into your pack, to be clipped on or handed over later"
            >
              <span className="rest-rune-name">Your pack</span>
            </button>
          </div>
          <span className="ench-target-note">
            A loop is the only place a scroll can be read from, so a leaf you mean to use now
            goes on one. The pack is for one you mean to keep or to hand over.
          </span>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ and it is written
 *
 * The three things Jules's sentence asks for, said once the leaf exists: read
 * it, keep it, hand it over. None of them is a control here, because all three
 * already have one somewhere better (the Quick Bar, the pack and the handover),
 * and a fourth way to do any of them would be a second door onto one room.
 */
function Written({ written, base, onRead }) {
  const { record, spell, loop } = written;
  const scroll = record?.scroll ?? null;

  return (
    <section className="brew-step">
      <div className="brew-step-head">
        <span className="brew-step-label">It is written</span>
        <span className="brew-step-note">
          {loop === null ? 'In your pack' : `On belt loop ${loop + 1}`}
        </span>
      </div>

      <div className="forge-base">
        <ItemIcon item={base} size={52} />
        <div className="forge-base-body">
          <span className="forge-base-name">{scrollTitle(scroll)}</span>
          <span className="brew-reagent-held">{scrollLine(scroll)}</span>
          <span className="item-card-note">
            {loop === null
              ? 'In your pack. Clip it to a belt loop from the Inventory tab and it can be read off the Quick Bar.'
              : 'On your belt. It is on the Quick Bar now, and reading it destroys the leaf.'}
          </span>
        </div>
        {spell && (
          <button type="button" className="btn btn-minimal btn-sm" onClick={() => onRead?.(spell)}>
            Read the card
          </button>
        )}
      </div>

      <ul className="forge-list">
        <li className="forge-list-row">
          <span className="item-card-link">Cast it</span>
          <span className="item-card-note">
            Off a belt loop, at the spell’s own Action Point and Willpower cost, known to the
            reader or not. The leaf is destroyed in the process.
          </span>
        </li>
        <li className="forge-list-row">
          <span className="item-card-link">Keep it</span>
          <span className="item-card-note">
            It weighs almost nothing and it is worth nothing to a merchant. Your next Long Rest
            sweeps it up wherever it is sitting.
          </span>
        </li>
        <li className="forge-list-row">
          <span className="item-card-link">Give it away</span>
          <span className="item-card-note">
            From the Inventory tab, to anybody at your table. A fading leaf can be handed over and
            cannot be turned into a share code.
          </span>
        </li>
      </ul>
    </section>
  );
}

/* One Power Word's name, for the working. */
function wordName(state, id) {
  return state.words.find((word) => word.id === id)?.name ?? id;
}

/**
 * Every tag on the shelf, so the filter row offers rungs, schools and families
 * the way the codex browser does.
 *
 * `poolTags` and not a hand-rolled set, which is what this and two other windows
 * had: it returns the `{ id, label, kind }` the row actually reads, sorts the
 * rungs up the ladder before the schools, and drops a tag every card carries
 * because a chip that selects the whole shelf narrows nothing. The `{ card }`
 * wrapper is the shape it takes, being written for a pool of options.
 */
function shelfTags(state) {
  return poolTags((state?.shelf ?? []).map((card) => ({ card })));
}
