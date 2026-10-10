import { useMemo, useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import ShareCode from './ShareCode.jsx';
import TagFilter from './TagFilter.jsx';
import { CostOrb } from '../CostOrbs.jsx';
import { Gated } from './parts.jsx';
import { ItemIcon } from './itemParts.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { poolTags, useTagFilter } from './useTagFilter.js';
import { useCardStack } from '../../context/card-stack.js';
import { FORGED_NAME_MAX, forgeRecord, readCode } from '../../lib/forged.js';
import { getItem } from '../../lib/items.js';
import {
  POWER_WORDS,
  SCROLL_BASE,
  SCROLL_SPELLS,
  getPowerWord,
  scrollCoins,
  scrollTier,
  scrollTitle,
} from '../../lib/scrolls.js';

/**
 * Write a Spell Scroll: one spell, however many Power Words, and a name.
 *
 * -------------------------------------------------- why this is not ARCANE SCRIBE
 * ARCANE SCRIBE is a night's labour. It is gated by the Spellquill's rank, priced
 * in Supplies off the spell's rung, capped at two leaves a night and at one or
 * two words apiece, and it happens inside a Long Rest — see ScribeRest.jsx,
 * which is a different window doing a different job.
 *
 * This is how a scroll **arrives**. Found in a barrow, bought off a guild,
 * handed over by the table, taken off a dead cultist. Nobody at the table paid
 * Supplies for the Deep Sea Trident either, and the codex carries it with two
 * workings on it. So this has no rank gate, no price and no cap: it is the spell
 * codex, opened up, and what goes on the leaf is the table's call rather than
 * the sheet's.
 *
 * It is the same argument ForgeWindow makes, in the same words, because it is the
 * same situation one shelf over — and the two sit side by side on the codex
 * browser's head for exactly that reason.
 *
 * ----------------------------------------------------------------- every rung
 * Novice, Adept and Master, and every school. A Legendary or a Unique spell is
 * off the ladder and cannot be scribed by anybody (see `scrollTier`), which is
 * the one limit this window keeps: those two live on the items that carry them
 * and a scroll is not one of those items.
 *
 * The **fading ink is not offered here**. An Ephemeral scroll is a Spellquill's
 * own night measured against their own next Long Rest, and there is nothing for
 * a found one to be measured against. Every scroll made here is permanent.
 *
 * -------------------------------------------------------------------- the code
 * Everything here can arrive as a pasted code instead, and everything made here
 * can leave as one — the same code an enchanted item travels as, since a scroll
 * is a forged record like any other. See forged.js.
 */
export default function ScrollWindow({ character, onForge, onClose }) {
  const stack = useCardStack();

  /** The spell going on the leaf, or null while the shelf is read. */
  const [spell, setSpell] = useState(null);
  /** The words worked into it, as ids. */
  const [words, setWords] = useState([]);
  /** The two labels. Empty means "whatever the spell says". */
  const [name, setName] = useState('');
  /** The paste box, and whatever the last read had to say about it. */
  const [code, setCode] = useState('');
  const [note, setNote] = useState(null);

  const base = getItem(SCROLL_BASE);

  const tags = useMemo(() => shelfTags(), []);
  const filter = useTagFilter(tags, { searchable: true });
  const shelf = SCROLL_SPELLS.filter(
    (card) => filter.matches(card.tags) && filter.text(card.name, card.summary ?? '')
  );

  const record = spell
    ? { base: SCROLL_BASE, ench: [], name: name.trim() || null, scroll: { spell: spell.id, words } }
    : null;

  const ink = words.reduce((total, id) => total + (getPowerWord(id)?.wp ?? 0), 0);

  /** A word in, or a word out. No cap: the table decides what it found. */
  function toggle(id) {
    setNote(null);
    setWords((held) => (held.includes(id) ? held.filter((one) => one !== id) : [...held, id]));
  }

  /** A pasted code fills the window. Nothing is written until "Write it". */
  function paste() {
    const read = readCode(code);
    if (read.error) {
      setNote({ bad: true, text: read.error });
      return;
    }

    if (read.record.base !== SCROLL_BASE || !read.record.scroll) {
      setNote({
        bad: true,
        text: 'That code is not for a spell scroll. Read it in Make an Enchanted Item instead.',
      });
      return;
    }

    const card = SCROLL_SPELLS.find((row) => row.id === read.record.scroll.spell);
    if (!card) {
      setNote({
        bad: true,
        text: `That code names "${read.record.scroll.spell}", which is not a spell in this codex. A newer build may have it.`,
      });
      return;
    }

    setSpell(card);
    setWords(read.record.scroll.words);
    setName(read.record.name ?? '');
    setNote({
      bad: false,
      text: `Read: ${read.record.name ?? scrollTitle(read.record.scroll)}. Change anything you like, then write it.`,
    });
  }

  return (
    <Modal
      title="Write a Spell Scroll"
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className="brew-step-note">
            {spell
              ? `${scrollTier(spell)} · worth ${scrollCoins(spell)} coins${ink > 0 ? ` · ${ink} Willpower to write` : ''}`
              : 'no spell chosen'}
          </span>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Close
          </button>
          <Gated
            className="btn btn-take btn-sm"
            why={
              spell
                ? null
                : 'Nothing on the leaf yet. Choose the spell it holds, in the shelf below.'
            }
            onClick={() => {
              onForge(forgeRecord(record));
              onClose();
            }}
          >
            Write it
          </Gated>
        </>
      }
    >
      {/* ---------- A CODE SOMEBODY SENT YOU ----------
          At the top, because pasting one skips every step below it. */}
      <div className="forge-paste">
        <label className="forge-paste-label" htmlFor="scroll-code">
          Somebody sent you a code
        </label>
        <span className="forge-paste-row">
          <input
            id="scroll-code"
            className="form-input"
            value={code}
            placeholder="HZBD1.…"
            spellCheck="false"
            onChange={(event) => setCode(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && paste()}
          />
          <button type="button" className="btn btn-minimal btn-sm" onClick={paste}>
            Read it
          </button>
        </span>
        {note && <span className={`forge-note${note.bad ? ' is-bad' : ''}`}>{note.text}</span>}
      </div>

      <div className="ench-window forge-window">
        <div className="ench-shelf">
          {/* ---------- WHAT IS WRITTEN ON IT ---------- */}
          <section className="brew-step">
            <div className="brew-step-head">
              <span className="brew-step-label">The spell</span>
              <span className="brew-step-note">
                {spell ? spell.name : 'One, and it is the whole of what the scroll does'}
              </span>
            </div>

            {spell ? (
              <div className="forge-base">
                <ItemIcon item={base} size={52} />
                <div className="forge-base-body">
                  <span className="forge-base-name">{scrollTitle({ spell: spell.id })}</span>
                  <span className="item-card-note">{spell.summary}</span>
                  <span className="brew-reagent-held">
                    {scrollTier(spell)} · {spell.ap ?? 0} Action Points and {spell.wp ?? 0} Willpower
                    to read
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-minimal btn-sm"
                  onClick={() => setSpell(null)}
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
                  placeholder="Search the codex"
                />
                <div className="card-brief-wall">
                  {shelf.length === 0 ? (
                    <p className="browser-empty">No spell in the codex matches that.</p>
                  ) : (
                    shelf.map((card) => (
                      <CardBrief
                        card={card}
                        character={character}
                        key={card.id}
                        onOpen={() => stack?.openCard(card)}
                      >
                        <span className="brew-reagent-held">
                          {scrollTier(card)} · worth {scrollCoins(card)} coins
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm card-brief-btn btn-take"
                          onClick={() => setSpell(card)}
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
              Every word, at every rank, because this window is not a rank. A
              scroll a party found may have anything on it, and how many is the
              table's call rather than ANALITIC SIGHT's. */}
          {spell && (
            <section className="brew-step">
              <div className="brew-step-head">
                <span className="brew-step-label">Power Words</span>
                <span className="brew-step-note">
                  {words.length === 0
                    ? 'None. A plain scroll is the commonest kind'
                    : `${words.length} worked in · ${ink} Willpower`}
                </span>
              </div>

              <div className="rest-runes">
                <div className="rest-runes-list">
                  {POWER_WORDS.map((word) => (
                    <button
                      type="button"
                      key={word.id}
                      className={`rest-rune${words.includes(word.id) ? ' is-on' : ''}`}
                      onClick={() => toggle(word.id)}
                      title={`${word.name}. ${word.body}`}
                    >
                      <span className="rest-rune-name">{word.name}</span>
                      <CostOrb kind="wp" value={word.wp} size={17} />
                    </button>
                  ))}
                </div>
                <span className="rest-runes-budget">
                  What each one does is on its own tooltip. The Willpower is what it cost whoever
                  wrote it, and nothing is charged here.
                </span>
              </div>
            </section>
          )}
        </div>

        {/* ---------- WHAT IT WILL BE ---------- */}
        <aside className="ench-side">
          <span className="fx-label">What you are making</span>

          {spell ? (
            <>
              <div className="forge-base">
                <ItemIcon item={base} size={52} />
                <div className="forge-base-body">
                  <span className="forge-base-name">
                    {name.trim() || scrollTitle({ spell: spell.id })}
                  </span>
                  <span className="brew-reagent-held">
                    {[scrollTier(spell), ...words.map((id) => getPowerWord(id)?.name)]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
              </div>

              <label className="form-label" htmlFor="scroll-name">
                Call it something
              </label>
              <input
                id="scroll-name"
                className="form-input"
                value={name}
                maxLength={FORGED_NAME_MAX}
                placeholder={scrollTitle({ spell: spell.id })}
                onChange={(event) => setName(event.target.value)}
              />
              <span className="ench-target-note">
                Leave it blank and it is called after the spell. The scroll draws the spell’s own
                plate either way.
              </span>

              <ul className="forge-list">
                <li className="forge-list-row">
                  <button
                    type="button"
                    className="item-card-link"
                    onClick={() => stack?.openCard(spell)}
                  >
                    {spell.name}
                  </button>
                  <span className="item-card-note">
                    Cast from the scroll at its own cost, known to the reader or not. The scroll is
                    destroyed in the process.
                  </span>
                </li>

                {words.map((id) => {
                  const word = getPowerWord(id);
                  return (
                    <li key={id} className="forge-list-row">
                      <span className="item-card-link">{word.name}</span>
                      <span className="item-card-note">{word.body}</span>
                      <button type="button" className="btn btn-minimal btn-sm" onClick={() => toggle(id)}>
                        Take it off
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* The same code the scroll itself carries once it exists, so
                  nobody has to write anything down at this step. */}
              <ShareCode record={record} label="Its code, before you have even written it" />
            </>
          ) : (
            <p className="pick-line">
              Nothing chosen. Pick the spell it holds and this says what it will be, what it is
              worth, and the code that hands it to somebody else.
            </p>
          )}
        </aside>
      </div>
    </Modal>
  );
}

/**
 * Every tag any scribable spell carries: the three rungs, the schools, the
 * families.
 *
 * **This was a set of bare tag names and it threw.** The filter row reads
 * `tag.label` the moment anybody types in the box, so searching the codex here
 * took the window down on the first keystroke. Found on 2026-09-10 and fixed the
 * same way in ScribeRest, which had the same private copy of the same mistake:
 * `poolTags` returns the `{ id, label, kind }` the row wants, sorts the rungs up
 * the ladder before the schools, and drops a tag every card carries. The
 * `{ card }` wrapper is the shape it takes, being written for a pool of options.
 */
function shelfTags() {
  return poolTags(SCROLL_SPELLS.map((card) => ({ card })));
}
