import { useState } from 'react';
import Modal from '../Modal.jsx';
import CardBrief from './CardBrief.jsx';
import TagFilter from './TagFilter.jsx';
import { CostOrb } from '../CostOrbs.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { Gated } from './parts.jsx';
import { useTagFilter } from './useTagFilter.js';
import { useCardStack } from '../../context/card-stack.js';
import { scribingAffordable } from '../../lib/rest.js';
import {
  addScribe,
  dropScribe,
  scribePreview,
  scribeRows,
  scribingCost,
  scribingWillpower,
  toggleScribeWord,
} from '../../lib/scribing.js';
import { listAnd, scrollSupplies } from '../../lib/scrolls.js';

/**
 * The desk: what is being written tonight.
 *
 *   "You can write a spell onto a blank Spell Scroll, known to you or not.
 *    Writing one takes 1 hour, and whenever you take a Long Rest you can use
 *    your Long Rest action to write two."
 *
 * Two halves, the same shape BrewRest.jsx has and for the same reason: **the
 * desk on top**, holding what is going on it, with the count and the running
 * price, and the shelf under it. A wall of a hundred and forty six spells with
 * no running total is a wall you tap and hope, and the crate is the one number a
 * player is actually deciding against.
 *
 * ------------------------------------------------------------ and a third half
 * What this window has that the still does not is **the words**. A leaf on the
 * desk is not just a spell, it is a spell with up to two Power Words worked into
 * it, and each of those is Willpower off tomorrow morning. So a leaf on the desk
 * opens: tap it and the words this rank knows are offered under it, with what
 * each one costs and what it does.
 *
 * That is why the desk is rows rather than the still's gathered lines. Two
 * flasks of the same recipe are interchangeable and two scrolls of Fireball are
 * not, so every leaf is its own row and keeps its own words.
 *
 * ---------------------------------------------------------------- the two inks
 * The same window serves both drafts, because they are the same act at two
 * prices. `ephemeral` says which: the paid one is capped at two and costs
 * Supplies, the fading one is capped at half your Mind plus your rank and costs
 * nothing at all. Everything else about them is identical, down to the words.
 *
 * Nothing here writes. Every choice goes into the rest window's own draft, is
 * priced into its plan, and only "Yes, rest" commits any of it.
 */
export default function ScribeRest({
  character,
  kind,
  state,
  draft,
  other,
  ephemeral = false,
  onDraft,
  onClose,
}) {
  const stack = useCardStack();
  /* Which leaf's words are open. One at a time: the list is seven words with a
     line of prose each, and two open at once is a window that scrolls past its
     own shelf. */
  const [open, setOpen] = useState(null);

  const filter = useTagFilter(shelfTags(state), { searchable: true });
  if (!state) return null;

  const room = ephemeral ? state.ephemeral : state.perRest;
  const rows = scribeRows(draft, state, { ephemeral });
  const spent = ephemeral ? 0 : scribingCost(draft, state);
  const ink = scribingWillpower(
    ephemeral ? other : draft,
    ephemeral ? draft : other,
    state
  );
  const full = rows.length >= room;

  const shelf = state.shelf.filter(
    (card) => filter.matches(card.tags) && filter.text(card.name, card.summary ?? '')
  );

  return (
    <Modal
      title={ephemeral ? 'What fades by morning?' : 'What is on the desk?'}
      onClose={onClose}
      wide
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className="brew-step-note">
            {rows.length} of {room}
            {ephemeral ? '' : ` · ${spent} Supplies`}
            {ink > 0 ? ` · ${ink} Willpower` : ''}
          </span>
          <span className="spacer" />
          <button type="button" className="btn btn-take btn-sm" onClick={onClose}>
            ← Back to the rest
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        {ephemeral ? (
          <>
            {room} {room === 1 ? 'leaf' : 'leaves'} in fading ink, which is your Mind halved plus
            your rank. They cost no Supplies and no Quartz, and every one of them{' '}
            <b>expires at the start of your next Long Rest</b>.
          </>
        ) : (
          <>
            {room} {room === 1 ? 'leaf' : 'leaves'} a night, and each one costs its Quartz out of
            the crate: 50 Supplies at Novice, 150 at Adept and 200 at Master. They go into your
            pack, ready to be clipped to your belt.
          </>
        )}
        {state.wordsPerScroll > 0
          ? ` Up to ${state.wordsPerScroll} Power ${state.wordsPerScroll === 1 ? 'Word' : 'Words'} a leaf, paid for in Willpower off tomorrow morning.`
          : ''}
      </p>

      {/* ---------- what is being written ---------- */}
      <section className="brew-step">
        <div className="brew-step-head">
          <span className="brew-step-label">{ephemeral ? 'In fading ink' : 'On the desk'}</span>
          <span className={`brew-step-note${rows.length === 0 ? ' is-open' : ''}`}>
            {rows.length === 0
              ? 'Empty'
              : `${rows.length} of ${room}${ephemeral ? '' : ` · ${spent} Supplies`}`}
          </span>
        </div>

        {rows.length === 0 ? (
          <p className="pick-line">
            Nothing written yet. Pick a spell below, and it lands in the plan behind this window
            where you can read what it costs before anything is spent.
          </p>
        ) : (
          <div className="rest-labours">
            {rows.map((row) => (
              <Leaf
                key={`${row.index}-${row.spell.id}`}
                row={row}
                state={state}
                open={open === row.index}
                ephemeral={ephemeral}
                onOpen={() => setOpen(open === row.index ? null : row.index)}
                onWord={(wordId) =>
                  onDraft(toggleScribeWord(draft, state, row.index, wordId, { ephemeral }))
                }
                onDrop={() => {
                  onDraft(dropScribe(draft, state, row.index, { ephemeral }));
                  setOpen(null);
                }}
                onRead={() => stack?.openCard(row.spell)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---------- the shelf this rank has opened ----------
          The whole codex at the rungs the rank reaches, filtered rather than
          shelved: it is a hundred and forty six cards at Master and "where is
          Fireball" is the only question anybody asks of it. */}
      <span className="fx-label">
        Spells you can write
        <span className="rest-labour-rule">{state.tiers.join(', ')}</span>
      </span>

      <TagFilter filter={filter} count={shelf.length} noun="spell" />

      <div className="card-brief-wall">
        {shelf.map((card) => {
          const price = scrollSupplies(card);
          /* Priced against the crate *after* the rest itself and after everything
             already on the desk, so a spell you could never pay for is offered
             dead rather than left to fail at the last button. A fading leaf costs
             nothing, so nothing is ever out of reach on that side. */
          const canPay = ephemeral || scribingAffordable(character, kind, draft, state, card);
          const allowed = !full && canPay;
          const already = rows.filter((row) => row.spell.id === card.id).length;

          return (
            <CardBrief
              card={card}
              character={character}
              held={already > 0}
              key={card.id}
              onOpen={() => stack?.openCard(card)}
            >
              <span className="brew-reagent-held">
                {ephemeral ? 'No Supplies' : `${price} Supplies`}
                {already > 0 ? ` · ${already} on the desk` : ''}
              </span>

              <Gated
                className={`btn btn-sm card-brief-btn ${allowed ? 'btn-take' : 'btn-minimal'}`}
                onClick={() => onDraft(addScribe(draft, state, card.id, { ephemeral }))}
                why={
                  full
                    ? `The desk holds ${room} tonight. Take one off first.`
                    : canPay
                      ? null
                      : 'Beyond the crate, once the rest is paid for.'
                }
                title={
                  allowed
                    ? ephemeral
                      ? `Write ${card.name} in fading ink`
                      : `Write ${card.name} for ${price} Supplies`
                    : undefined
                }
              >
                {full ? 'Desk is full' : canPay ? 'Write this one' : 'Beyond the crate'}
              </Gated>
            </CardBrief>
          );
        })}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ one leaf */

/**
 * One scroll on the desk: what is on it, and the words that could be.
 *
 * The head is a button that opens the words rather than the card, because the
 * card is one tap further in on the ⓘ and the words are the thing a player came
 * back to this row for. A rank with no words at all never opens: there is
 * nothing behind it, so the row is a row.
 */
function Leaf({ row, state, open, ephemeral, onOpen, onWord, onDrop, onRead }) {
  const words = state.words;
  const canOpen = words.length > 0 && state.wordsPerScroll > 0;

  return (
    <div className={`rest-labour${open ? ' is-chosen' : ''}`}>
      <button
        type="button"
        className="rest-labour-head"
        onClick={canOpen ? onOpen : onRead}
        title={
          canOpen
            ? open
              ? 'Close the Power Words'
              : `Work a Power Word into ${row.spell.name}`
            : `${row.spell.name} · read the card`
        }
      >
        <span className="rest-labour-name">{row.spell.name}</span>
        <span className="rest-labour-line">
          {row.tier}
          {ephemeral ? ' · fading' : ` · ${row.supplies} Supplies`}
          {row.words.length > 0
            ? ` · ${row.words.map((word) => word.name).join(', ')}`
            : canOpen
              ? ' · no Power Word'
              : ''}
          {row.willpower > 0 ? ` · ${row.willpower} Willpower` : ''}
        </span>
      </button>

      <span className="rest-labour-opts">
        {canOpen && (
          <button type="button" className="rest-opt" onClick={onOpen}>
            {open ? 'Done' : 'Words'}
          </button>
        )}
        <button type="button" className="rest-opt" onClick={onDrop} title="Take this leaf off the desk">
          Take off
        </button>
      </span>

      {open && (
        <div className="rest-runes" style={{ gridColumn: '1 / -1' }}>
          <div className="rest-runes-list">
            {words.map((word) => {
              const on = row.words.some((held) => held.id === word.id);
              const room = on || row.words.length < state.wordsPerScroll;

              return (
                <button
                  type="button"
                  key={word.id}
                  className={`rest-rune${on ? ' is-on' : ''}`}
                  onClick={() => onWord(word.id)}
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
            {row.words.length} of {state.wordsPerScroll} worked in
            {row.willpower > 0 ? ` · ${row.willpower} Willpower off the morning` : ''}
          </span>
        </div>
      )}
    </div>
  );
}

/* Every tag on the shelf, so the filter row offers rungs, schools and families
   the way the codex browser does. */
function shelfTags(state) {
  const seen = new Set();
  for (const card of state?.shelf ?? []) {
    for (const tag of card.tags ?? []) seen.add(tag);
  }
  return [...seen];
}

/* ------------------------------------------------------------------ the note */

/**
 * What a rank of a scribing set opens, on the presentation page of somebody who
 * has not taken it yet.
 *
 * Every rank of this set prints cards, so this is not carrying a rank on its own
 * the way the Enchanter's note is. It is here for the two things the cards cannot
 * say: **how wide the shelf actually gets**, which is a count of the codex and
 * not of the card text, and how many Power Words are in hand by this rung. "You
 * can now inscribe spells from the Adept list" is true and does not tell a
 * reader they have just gone from 52 spells to 98.
 *
 * Every number is off the spec and the codex, so the day a spell is written this
 * line changes with it and no card has to.
 */
export function ScribeRankNote({ talent, rank }) {
  const preview = scribePreview(talent, rank);
  if (!preview || preview.tiers.length === 0) return null;

  const { opened, count, reach, words, held, all, wordsPerScroll } = preview;

  /* What this rank changes beyond the shelf. Gathered rather than written out,
     because a rank moves one of these at a time and a sentence built for both
     would read as a list of nothing twice. */
  const changed = [];
  if (words > 0) {
    changed.push(`${words} more Power ${words === 1 ? 'Word' : 'Words'}, ${held} of ${all} in hand`);
  }
  if (wordsPerScroll > (scribePreview(talent, rank - 1)?.wordsPerScroll ?? 0)) {
    changed.push(`${wordsPerScroll} to a leaf`);
  }

  return (
    <div className="loadout-note">
      <span className="loadout-note-body">
        <b>
          {count > 0
            ? `+${count} ${listAnd(opened)} ${count === 1 ? 'spell' : 'spells'} you can write`
            : `${reach} ${reach === 1 ? 'spell' : 'spells'} you can write`}
        </b>
        <span className="loadout-note-line">
          {count > 0 ? `${reach} on the shelf in all` : 'Nothing new on the shelf at this rank'}
          {changed.length > 0 ? `. ${cap(listAnd(changed))}` : ''}.
        </span>
      </span>
    </div>
  );
}

function cap(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
