import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCardStack } from '../../context/card-stack.js';
import { FEED_PAGE, eventStamp, eventWords, listEvents } from '../../lib/campaignLog.js';
import { chainSummary, groupEvents } from '../../lib/logChain.js';
import { verdictLabel } from '../../lib/dice.js';
import { getCard } from '../../lib/weapons.js';
import { subscribeToTable } from '../../lib/realtime.js';
import { CostOrb } from '../CostOrbs.jsx';
import Die from '../Die.jsx';

/**
 * The table's log, as a block.
 *
 * The same block in two places, which is the whole reason it takes a campaign id
 * and nothing else: it sits on the campaign page beside the party, and it sits
 * on the Character tab of every sheet linked to that campaign.
 *
 * ---------------------------------------------------------------- how it reads
 * Like a chat. Oldest at the top, newest at the bottom, and it follows the
 * bottom unless you have scrolled up to read history. That is the opposite of
 * how this block started and it is the right way round: a fight is a
 * conversation, and a conversation that grew upward would put a reply above the
 * thing it answered.
 *
 * One entry is one thing somebody did, and it is a block rather than a line:
 *
 *   the face and the name    who. A portrait if the sheet has one, initials if
 *                            not, and the name in the site's own teal.
 *   what they did            "cast Fireball", with the cost as orbs on the same
 *                            line, gold for Action Points and orange for
 *                            Reaction, exactly as the sheet prints them.
 *   a block per roll         the dice as their own silhouettes, then the bonus,
 *                            an equals and the total, then the verdict.
 *   the summary              what it all came to. "Dealt 17 Necrotic damage."
 *   the clock                last, because it is the least of it.
 *
 * ------------------------------------------------------------------ folding
 * Only the newest entry is open. A fight is forty entries long and nobody wants
 * to scroll through everybody's arithmetic to find out what just happened, so an
 * entry that is no longer the latest closes to its face, its name, its cost and
 * its result. Tapping the head opens any of them again, and having opened one by
 * hand it stays open: the automatic collapse only ever moves the entry that was
 * newest a moment ago.
 *
 * -------------------------------------------------------------------- the feed
 * One read on mount and one insert subscription after it. Older pages are asked
 * for by the button at the *top* now, and the scroll is pinned across the load
 * so the page does not jump under a reader who was mid-sentence.
 *
 * Nothing here writes. See src/lib/campaignLog.js for what does.
 */
export default function LogBlock({ campaignId, title = 'Table Log', note = null, actorFor = null }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  /* Which entry the reader opened by hand, and which entry was newest when they
     did it. Both, because a manual choice is only good until the next action:
     the rule is that the latest entry is the open one and a new one collapses the
     last, so a choice made three actions ago must not still be holding an old
     entry open. Scoping it to the newest at the time makes it lapse on its own,
     without an effect writing state after a render. */
  const [opened, setOpened] = useState(null);
  const stack = useCardStack();

  const scroller = useRef(null);
  /* Whether the reader is at the bottom. Read before the paint that adds an
     entry and used after it, because "should this follow the newest" is a
     question about where they were, not where the new content put them. */
  const wasAtBottom = useRef(true);
  const pinnedHeight = useRef(null);

  const read = useCallback(() => {
    if (!campaignId) return;
    listEvents(campaignId)
      .then((rows) => {
        setEvents(rows);
        setMore(rows.length >= FEED_PAGE);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    return undefined;
  }, [campaignId]);

  /* Read once per campaign, and every setState the read makes is inside its own
     callback: an effect that writes state as it runs makes React render the
     block twice for one mount, and this one is mounted once per table a
     character sits at. */
  useEffect(read, [read]);

  useEffect(() => {
    if (!campaignId) return undefined;

    return subscribeToTable({
      table: 'campaign_events',
      filter: `campaign_id=eq.${campaignId}`,
      onChange: (payload) => {
        if (payload.eventType !== 'INSERT') return;
        const row = payload.new;
        setEvents((prev) => {
          // A row can arrive twice: once down the channel and once in a refetch
          // that raced it. The id is what says which is which.
          if (prev.some((held) => held.id === row.id)) return prev;
          return [row, ...prev];
        });
      },
      // A reconnect drops whatever was sent while the socket was down, so the
      // feed is read again rather than left with a hole in the middle of it.
      onResync: read,
    });
  }, [campaignId, read]);

  /**
   * Follow the bottom, the way a chat does.
   *
   * Two cases, and they need different handling. A new entry arriving should
   * scroll only if the reader was already at the bottom, or it would yank them
   * out of the history they were reading. A page of *older* entries loading
   * should not scroll at all, and since it is inserted above, holding still
   * means adding the height it grew by. Both are measured before the browser
   * paints, which is what `useLayoutEffect` is for.
   */
  useLayoutEffect(() => {
    const box = scroller.current;
    if (!box) return;

    if (pinnedHeight.current !== null) {
      box.scrollTop += box.scrollHeight - pinnedHeight.current;
      pinnedHeight.current = null;
      return;
    }
    if (wasAtBottom.current) box.scrollTop = box.scrollHeight;
  }, [events]);

  function onScroll() {
    const box = scroller.current;
    if (!box) return;
    // Within a line of the bottom counts as at the bottom: a reader who has not
    // deliberately scrolled up should not lose the follow to a rounding error.
    wasAtBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight < 24;
  }

  function older() {
    const box = scroller.current;
    pinnedHeight.current = box ? box.scrollHeight : null;

    const last = events[events.length - 1];
    listEvents(campaignId, { before: last?.seq })
      .then((rows) => {
        setEvents((prev) => [...prev, ...rows]);
        setMore(rows.length >= FEED_PAGE);
      })
      .catch((err) => {
        /* Released, or the next entry to arrive would be taken for a page of
           history and the feed would stop following the newest. */
        pinnedHeight.current = null;
        setError(err.message);
      });
  }

  /* Oldest first, because that is the order a conversation happens in.
     `groupEvents` works in the feed's own order and puts each block at its
     newest row, so reversing it puts a chain that has just been given its damage
     roll at the bottom, which is where the newest thing belongs. */
  const entries = groupEvents(events).reverse();
  const newest = entries[entries.length - 1]?.key ?? null;

  return (
    <div className="cell-scroll log-block">
      <div className="block-head">
        <span className="stat-category-label">{title}</span>
        <span className="block-count">
          {events.length} {events.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {note && <p className="log-note">{note}</p>}

      {error && <p className="pick-line log-empty">{error}</p>}

      {!error && loading && <p className="pick-line log-empty">Reading the table…</p>}

      {!error && !loading && events.length === 0 && (
        <p className="pick-line log-empty">
          Nothing has happened yet. Every card played, every rest taken and every turn crossed at
          this table lands here as it happens.
        </p>
      )}

      <div className="log-feed" ref={scroller} onScroll={onScroll}>
        {/* At the top, because older is up. */}
        {more && events.length > 0 && (
          <div className="log-older">
            <button type="button" className="btn btn-minimal btn-sm" onClick={older}>
              Older
            </button>
          </div>
        )}

        <ul className="log-list">
          {entries.map((group) => (
            <LogEntry
              key={group.key}
              event={group.head}
              rolls={group.rolls}
              stack={stack}
              actor={actorFor ? actorFor(group.head) : null}
              open={
                opened?.newest === newest ? opened.key === group.key : group.key === newest
              }
              onToggle={() =>
                setOpened((was) => ({
                  newest,
                  // Tapping the open one shuts it, and shuts all of them.
                  key: was?.newest === newest && was.key === group.key ? '' : group.key,
                }))
              }
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * One thing somebody did, and everything that came of it.
 *
 * The head is always drawn: a face, a name, what they did and what it cost. It
 * is a button, because the head is also the way to open and close the rest, and
 * a row this small has no room for a separate handle.
 *
 * `open` is decided by the block above rather than held here, so that "only the
 * newest is open" is one rule in one place and not forty components each with an
 * opinion.
 */
function LogEntry({ event, rolls, stack, actor, open, onToggle }) {
  const card = event.data?.card ? getCard(event.data.card) : null;
  const verb = eventWords(event);
  const { ap = 0, wp = 0, health = 0, mode, portrait } = event.data ?? {};
  /* A roll made from the tray has no use above it: the entry *is* the throw. So
     the head stands in for its own child, which is what lets one component draw
     both shapes without the block above having to know which it is holding. See
     groupEvents, where a roll with no chain comes back as its own group. */
  const throws = rolls.length > 0 ? rolls : event.kind === 'roll' ? [event] : [];
  const alone = rolls.length === 0 && throws.length === 1;
  const summary = chainSummary(throws);

  /* The result, on the head, so a closed entry still says how it went. The last
     verdict in the chain is the one that matters: a chain is a sequence and its
     answer is at the end of it. */
  const last = [...throws].reverse().find((row) => row.data?.verdict);
  const verdict = last?.data?.verdict ?? null;

  return (
    <li className={`log-entry log-${event.kind}${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="log-head"
        onClick={onToggle}
        aria-expanded={open}
        title={open ? 'Close this' : 'Open this'}
      >
        <Face name={event.actor} src={portrait} />

        <span className="log-head-body">
          <span className="log-who">{event.actor || 'Someone'}</span>

          <span className="log-did">
            {verb && <span className="log-verb">{verb} </span>}
            <span className="log-title">{event.title}</span>
            {/* The cost, on the same line, in the same orbs the sheet and every
                card print it in. `mode` is what decides whether the Action Points
                were paid out of the other pool: the card never says. */}
            {ap > 0 && <CostOrb kind={mode === 'reaction' ? 'rp' : 'ap'} value={ap} size={17} />}
            {wp > 0 && <CostOrb kind="wp" value={wp} size={17} />}
            {health > 0 && <CostOrb kind="hp" value={health} size={17} />}
          </span>
        </span>

        {verdict && (
          <span className={`log-band is-${verdict}`}>{verdictLabel(verdict)}</span>
        )}
      </button>

      {open && (
        <div className="log-body">
          {/* A block per throw, in the order they were thrown. A standalone roll
              is drawn without its name repeated: the head above already said it. */}
          {throws.map((roll) => (
            <Throw key={roll.id} roll={roll} named={!alone} />
          ))}

          {summary && <p className="log-summary">{summary}</p>}

          {event.detail && <p className="log-detail">{event.detail}</p>}

          {/* And the card it was, for anybody reading this months later. The id
              rides in the row precisely because "Fireball" is not a lookup. */}
          {card && stack && (
            <button
              type="button"
              className="log-open-card"
              /* Dealt against whoever played it where the page knows them, so a
                 spell read out of the log prints the caster's numbers rather
                 than the reader's. See `modifiers.actor` in AbilityCard.jsx. */
              onClick={() => stack.openCard(card, actor ? { actor } : null)}
            >
              Read {card.name}
            </button>
          )}

          <p className="log-when">{eventStamp(event)}</p>
        </div>
      )}
    </li>
  );
}

/**
 * One throw: the dice as themselves, then the sum, then what it meant.
 *
 * The dice are the same component the roller draws, at a quarter of the size, so
 * a d4 is the same triangle in the log as it was on the table. A row that said
 * "2d6 + 1d4" in text would be asking the reader to picture what they already
 * watched.
 */
function Throw({ roll, named = true }) {
  const { dice = [], flat = 0, total = 0, verdict = null, dc = null, called = false } =
    roll.data ?? {};

  return (
    <div className={`log-throw${verdict ? ` is-${verdict}` : ''}`}>
      {named && <span className="log-throw-name">{roll.title}</span>}

      <span className="log-throw-dice">
        {dice.map((die) => (
          <Die key={die.id} die={die} face={die.value} size={26} caption={false} />
        ))}
      </span>

      <span className="log-throw-sum">
        {flat !== 0 && <span className="log-throw-flat">{flat < 0 ? flat : `+ ${flat}`}</span>}
        <span className="log-throw-eq">=</span>
        <span className="log-throw-total">{total}</span>
      </span>

      {verdict && (
        <span
          className="log-throw-said"
          title={called ? 'The table called this one: no DC was given' : `Against a DC of ${dc}`}
        >
          {verdictLabel(verdict)}
          {called && <span className="log-throw-called">called</span>}
        </span>
      )}
    </div>
  );
}

/**
 * Whose entry this is, as a face.
 *
 * The portrait was copied into the row when it was written, for the same reason
 * the name was: a character can be redrawn or deleted and the log still has to
 * read. With no portrait it falls back to initials, which is also what every row
 * written before the log carried one will show.
 */
function Face({ name, src }) {
  const initials = String(name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  if (src) {
    return <img className="log-face" src={src} alt="" loading="lazy" />;
  }
  return (
    <span className="log-face is-blank" aria-hidden="true">
      {initials}
    </span>
  );
}
