import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Modal from '../Modal.jsx';
import { useCardStack } from '../../context/card-stack.js';
import {
  FEED_PAGE,
  clearLog,
  eventStamp,
  eventWords,
  listEvents,
  logClearedEvent,
  postEvent,
} from '../../lib/campaignLog.js';
import {
  bundleCount,
  bundleTurns,
  chainSummary,
  drawnEvents,
  groupEvents,
} from '../../lib/logChain.js';
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
 * ------------------------------------------------------------------- the clear
 * One thing here writes, and only for two readers. `canClear` is the Game Master
 * on their own campaign page, and an admin anywhere the block is drawn — the
 * campaign page and every log block a sheet carries for a table it sits at
 * ("As an Admin I should be able to clean the log of any character or campaign
 * i view", Jules, 2026-09-03). A table six sessions deep carries six sessions of
 * arithmetic, and beginning a new chapter should not mean scrolling past the
 * last one forever. It asks first, because it cannot be undone and it is
 * everybody's history rather than the presser's own.
 *
 * This prop only decides whether a button is drawn. `clear_campaign_log` in the
 * schema is what settles it, and it names the same two: the campaign's own Game
 * Master, or `is_admin()`. See `clearLog`.
 *
 * Everything else here reads. See src/lib/campaignLog.js for what writes.
 */
export default function LogBlock({
  campaignId,
  title = 'Table Log',
  note = null,
  actorFor = null,
  canClear = false,
}) {
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
  /* Whether the clear is being asked about, and whether it is away being done.
     Two states rather than one: the question is answered in a moment and the
     delete takes a round trip, and the button must not look pressable while
     that trip is in the air. */
  const [asking, setAsking] = useState(false);
  const [clearing, setClearing] = useState(false);
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

        /* The word that the log was emptied. A delete sends nothing down the
           channel, so this row is how every other copy of the block finds out:
           it reads itself again, and what comes back is this line and nothing
           older. See clearLog and logClearedEvent. */
        if (row?.kind === 'turn' && row?.data?.move === 'log-cleared') {
          read();
          return;
        }

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

  /**
   * Empty the table's log.
   *
   * The delete first, then the line saying it happened. In that order because
   * the line has to survive: written first, it would be the one row the delete
   * took with it.
   *
   * This block clears its own feed rather than waiting to be told, so the
   * presser sees the answer to the button they pressed. Everybody else finds
   * out the way they find out about anything, off the insert that follows.
   */
  async function clearIt() {
    setClearing(true);
    try {
      const gone = await clearLog(campaignId);
      setEvents([]);
      setMore(false);
      setError('');
      setAsking(false);
      await postEvent([{ id: campaignId }], logClearedEvent('The table', gone));
    } catch (err) {
      setError(err.message);
    } finally {
      setClearing(false);
    }
  }

  /* Two gatherings over what the feed actually draws, and then the whole thing
     turned round. `drawnEvents` drops the rows a seam already says — a turn
     ending; `groupEvents` puts a use and its throws together; `bundleTurns` puts
     a turn and everything done during it together, and folds a turn that was
     opened twice into one seam. All three work in the feed's own order, newest
     first, so both lists are reversed here: a conversation happens oldest first,
     and a chain that has just been given its damage roll belongs at the
     bottom. */
  const bundles = bundleTurns(groupEvents(drawnEvents(events)))
    .reverse()
    .map((bundle) => ({ ...bundle, groups: [...bundle.groups].reverse() }));

  /* Which entry is open, still counted across the whole feed rather than per
     bundle: "only the newest is open" is one rule and the bundles did not
     change it. */
  const entries = bundles.flatMap((bundle) => bundle.groups);
  const newest = entries[entries.length - 1]?.key ?? null;

  return (
    <div className="cell-scroll log-block">
      <div className="block-head">
        <span className="stat-category-label">{title}</span>
        <span className="log-head-end">
          <span className="block-count">
            {events.length} {events.length === 1 ? 'entry' : 'entries'}
          </span>
          {canClear && (
            <button
              type="button"
              className="log-clear"
              onClick={() => setAsking(true)}
              disabled={clearing || events.length === 0}
              title={
                events.length === 0
                  ? 'There is nothing here to clear'
                  : 'Empty this table log. It asks first.'
              }
            >
              {clearing ? 'Clearing' : 'Clear'}
            </button>
          )}
        </span>
      </div>

      {asking && (
        <Modal
          title="Clear the table log?"
          onClose={() => (clearing ? null : setAsking(false))}
          footer={
            <>
              <button
                type="button"
                className="btn btn-minimal btn-sm"
                onClick={() => setAsking(false)}
                disabled={clearing}
              >
                Keep it
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={clearIt}
                disabled={clearing}
              >
                {clearing ? 'Clearing' : 'Clear the log'}
              </button>
            </>
          }
        >
          <p className="pick-line">
            Every entry at this table goes: {events.length}
            {more ? ' or more' : ''} of them, and whatever is older than this page. Nobody at the
            table gets them back, and the sheets themselves are untouched.
          </p>
          <p className="pick-line">
            What happens after this is logged as it always was. A line saying the log was cleared
            stays at the top, so the table knows why the history begins where it does.
          </p>
        </Modal>
      )}

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

        {/* One list per turn, headed by the turn. A bundle with no head is
            everything that happened outside a fight, and it is drawn bare. */}
        {bundles.map((bundle) => (
          <div className="log-turn" key={bundle.key}>
            {bundle.turn && <TurnHead event={bundle.turn} count={bundleCount(bundle)} />}

            <ul className="log-list">
              {bundle.groups.map((group) => (
                <LogEntry
                  key={group.key}
                  event={group.head}
                  rolls={group.rolls}
                  trail={group.trail}
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
        ))}
      </div>
    </div>
  );
}

/**
 * The rule a turn draws across the feed, with whose turn it was on it.
 *
 * "all actions under 1 turn are bundled under it in a X name turn 1 block",
 * Jules, 2026-08-31. A fight read flat is forty rows nobody can find anything
 * in. A fight read like this is Turn 4, Kaelen, and the three things Kaelen did.
 *
 * A seam rather than a panel, because it appears every three or four rows and
 * anything with a border on it would double the height of the block. The name
 * wears the side it is on: the party in the site's own cyan, an enemy in
 * copper, so a Game Master scanning the feed can see the shape of the round
 * without reading a word of it.
 */
function TurnHead({ event, count }) {
  const side = event?.data?.side ?? 'member';

  return (
    <div className={`log-turn-head log-turn-${side}`}>
      <span className="log-turn-round">{event.title}</span>
      <span className="log-turn-who">{event.actor}</span>
      <span className="log-turn-rule" aria-hidden="true" />
      <span className="log-turn-count">
        {count === 0 ? 'nothing' : `${count} ${count === 1 ? 'entry' : 'entries'}`}
      </span>
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
 *
 * ------------------------------------------------------------------ the trail
 * `trail` is every row the action set off, in the order the table saw it, and
 * it holds two sorts of thing: throws, which are drawn as their dice, and rows
 * *about* the action, which are drawn as one line each. They are interleaved on
 * purpose. "missed 3.Fenrat" belongs between the attack roll and the damage,
 * and a reaction belongs above the roll it held, so the block reads down the
 * way the moment happened. See groupEvents.
 */
function LogEntry({ event, rolls, trail = [], stack, actor, open, onToggle }) {
  const card = event.data?.card ? getCard(event.data.card) : null;
  const verb = eventWords(event);
  const { ap = 0, wp = 0, health = 0, mode, portrait } = event.data ?? {};
  /* A roll made from the tray has no use above it: the entry *is* the throw. So
     the head stands in for its own child, which is what lets one component draw
     both shapes without the block above having to know which it is holding. See
     groupEvents, where a roll with no chain comes back as its own group. */
  const throws = rolls.length > 0 ? rolls : event.kind === 'roll' ? [event] : [];
  const under = trail.length > 0 ? trail : event.kind === 'roll' ? [event] : [];
  const alone = rolls.length === 0 && throws.length === 1;
  const summary = chainSummary(throws, event);

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
          </span>
        </span>

        {/* The corner: what it cost, and how it went. Out of the sentence and up
            here because a cost is not part of what somebody did, it is the price
            beside it, and a row of entries reads better with its numbers in a
            column than scattered through the prose.

            `mode` is what decides whether the Action Points came out of the
            Reaction pool. The card never says: only the moment of spending does. */}
        <span className="log-corner">
          <span className="log-cost">
            {ap > 0 && <CostOrb kind={mode === 'reaction' ? 'rp' : 'ap'} value={ap} size={17} />}
            {wp > 0 && <CostOrb kind="wp" value={wp} size={17} />}
            {health > 0 && <CostOrb kind="hp" value={health} size={17} />}
          </span>
          {verdict && (
            <span className={`log-band is-${verdict}`}>{verdictLabel(verdict)}</span>
          )}
        </span>
      </button>

      {open && (
        <div className="log-body">
          {/* The trail, in the order it happened: a block per throw, a line per
              row about the action. A standalone roll is drawn without its name
              repeated, since the head above already said it. */}
          {under.map((row) =>
            row.kind === 'roll' ? (
              <Throw key={row.id} roll={row} named={!alone} />
            ) : (
              <Aside key={row.id} row={row} who={event.actor} />
            )
          )}

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
 * One row about the action, as a line inside its block.
 *
 * The verdicts, the deliveries, the effect it laid and everything the reaction
 * stack said. Each of these was its own entry in the feed until 2026-09-02, and
 * each of them is a sentence the row already carries: "Critically hit
 * 2.Fenrat", "14 Fire damage", "Reaction taken". So nothing is reworded here.
 * It is drawn small, in the kind's own colour, under the dice that caused it.
 *
 * The name is printed only when it is somebody other than whoever heads the
 * block. On an attack's own verdict that is nobody, and a line repeating the
 * actor four times would be four names nobody reads. On a reaction it is the
 * whole point: the row in the middle of Lark's Fireball saying *Kaelen* is the
 * one thing a reader needs off it.
 */
function Aside({ row, who }) {
  const said = row.actor && row.actor !== who ? row.actor : null;

  return (
    <p className={`log-aside is-${row.kind}`}>
      {said && <span className="log-aside-who">{said}</span>}
      <span className="log-aside-what">{row.title}</span>
      {row.detail && <span className="log-aside-why">{row.detail}</span>}
    </p>
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
 *
 * The picture is wrapped rather than being the frame itself, because the frame
 * has to crop harder than `object-fit` can on its own: see `.log-face` for
 * what the two boxes do.
 */
function Face({ name, src }) {
  const initials = String(name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <span className="log-face">
        <img src={src} alt="" loading="lazy" />
      </span>
    );
  }
  return (
    <span className="log-face is-blank" aria-hidden="true">
      {initials}
    </span>
  );
}
