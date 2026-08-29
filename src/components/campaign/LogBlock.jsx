import { useCallback, useEffect, useState } from 'react';
import { useCardStack } from '../../context/card-stack.js';
import { FEED_PAGE, eventStamp, eventWords, listEvents } from '../../lib/campaignLog.js';
import { getCard } from '../../lib/weapons.js';
import { subscribeToTable } from '../../lib/realtime.js';

/**
 * The table's log, as a block.
 *
 * The same block in two places, which is the whole reason it takes a campaign id
 * and nothing else: it sits on the campaign page beside the party, and it sits
 * on the Character tab of every sheet linked to that campaign. A player watching
 * their own numbers sees the fight happening around them in the same 360 pixels
 * everything else on that tab is drawn in.
 *
 * ---------------------------------------------------------------- how it reads
 * Newest at the top, because a log read during a fight is read from the top and
 * nobody scrolls to find out what just happened. Every row is one line of who
 * and what, and one line of the price under it:
 *
 *   Kaelen cast Fireball
 *   Spent 2 Action Points and 4 Willpower · lasts 3 turns
 *
 * A row whose event names a card opens that card, dealt onto the same stack the
 * rest of the sheet deals onto. That is why the card id rides in the event's
 * data rather than the card's name being enough: a log is read months later and
 * "Fireball" is not a lookup.
 *
 * -------------------------------------------------------------------- the feed
 * One read on mount and one insert subscription after it, so a use on somebody
 * else's sheet lands here a second after they press the button. Older pages are
 * asked for by the button at the foot rather than by scrolling, the same way the
 * journal opens one log at a time: this block is 640 pixels tall and an infinite
 * scroller inside it would fight the canvas it sits on.
 *
 * Nothing here writes. The block is a reader of a table that is insert only for
 * everybody, and what puts rows in it is every place on the sheet that already
 * spends something. See src/lib/campaignLog.js.
 */
export default function LogBlock({ campaignId, title = 'Table Log', note = null, actorFor = null }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  const stack = useCardStack();

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

  function older() {
    const last = events[events.length - 1];
    listEvents(campaignId, { before: last?.seq })
      .then((rows) => {
        setEvents((prev) => [...prev, ...rows]);
        setMore(rows.length >= FEED_PAGE);
      })
      .catch((err) => setError(err.message));
  }

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

      <ul className="log-list">
        {events.map((event) => (
          <LogRow
            key={event.id}
            event={event}
            stack={stack}
            actor={actorFor ? actorFor(event) : null}
          />
        ))}
      </ul>

      {more && events.length > 0 && (
        <div className="pick-tools log-tools">
          <button type="button" className="btn btn-minimal btn-sm" onClick={older}>
            Older
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * One thing that happened.
 *
 * The verb sits between the two names rather than in front of them, so the line
 * reads as a sentence at a glance: a reader scanning a fight is looking for the
 * name and the card, and both are where a sentence puts them.
 */
function LogRow({ event, stack, actor = null }) {
  const card = event.data?.card ? getCard(event.data.card) : null;
  const verb = eventWords(event);
  const opens = Boolean(card && stack);

  const line = (
    <>
      <span className="log-actor">{event.actor || 'Someone'}</span>
      {verb && <span className="log-verb"> {verb} </span>}
      <span className="log-title">{event.title}</span>
    </>
  );

  return (
    <li className={`log-row log-${event.kind}`}>
      <div className="log-line">
        {opens ? (
          <button
            type="button"
            className="log-open"
            /* Dealt against whoever played it where the page knows them, so a
               spell read out of the log prints the caster's numbers rather than
               the reader's. See `modifiers.actor` in AbilityCard.jsx. */
            onClick={() => stack.openCard(card, actor ? { actor } : null)}
            title={`Read ${card.name}`}
          >
            {line}
          </button>
        ) : (
          <span className="log-open is-still">{line}</span>
        )}
        <span className="log-when">{eventStamp(event)}</span>
      </div>

      {event.detail && <div className="log-detail">{event.detail}</div>}
    </li>
  );
}
