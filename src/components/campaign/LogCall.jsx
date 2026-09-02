import { useEffect, useState } from 'react';
import { useCampaignLog } from '../../context/campaign-log.js';
import { noticeOf } from '../../lib/logChain.js';
import { subscribeToTable } from '../../lib/realtime.js';

/** How long a notice stays up before it takes itself away, in milliseconds. */
const NOTICE_MS = 7000;

/** And how many can be on screen at once. The rest of the feed is the feed. */
const NOTICE_DEPTH = 3;

/**
 * The table, knocking: what just happened, over whatever you are looking at.
 *
 * "When a new entry happen, like with the reaction, there should be a pop up
 * showing." Jules, 2026-09-02.
 *
 * The log block is a block. It is on one tab of one page, and a player reading
 * their Inventory while somebody counterspells them finds out about it when
 * they wander back. So every row that lands is also announced in the corner:
 * who, what they did, and the lines that followed under it.
 *
 * ------------------------------------------------------------- one per action
 * A notice is keyed on the **chain**, not the row. One aimed swing writes the
 * use, its throws, the verdict against each body and a delivery, and four
 * pop-ups for one swing would be exactly the noise the block underneath spent
 * this same day learning not to make. So a row addressed to an action already
 * on screen lands *inside* its notice as another line, and puts its timer back
 * to the start: the pop-up grows with the action and clears once it is over.
 * See noticeOf and groupEvents.
 *
 * ------------------------------------------------------------- what it skips
 * Three things, and none of them is hidden — every one of them is in the block
 * underneath either way:
 *
 *   your own rows      you are the one who did it. A banner telling you what
 *                      you just pressed is the screen arguing with you.
 *   throws             somebody else's dice already land on your own table,
 *                      faces and all. See DiceWatch and `worthReplaying`.
 *   the covers         an initiative bell and a turn call take the whole
 *                      screen on the sheet they name. See TurnCall.jsx.
 *
 * It listens on the realtime channel and never on a fetch, which is what keeps
 * a backlog out of the corner: a channel only carries rows written after you
 * joined it, so a laptop shut all evening reconnects, refetches the feed into
 * the block and announces nothing.
 *
 * ------------------------------------------------------------------ two homes
 * The same component in both places the log lives, exactly as `DiceWatch` is:
 * a sheet knocks about the tables it sits at and skips its own character, and
 * the campaign page passes its one table and every character of yours at it.
 * `mine` is a list because a player may have two sheets at one table and a Game
 * Master watching the page has none.
 *
 * A sheet hands in no tables at all and takes the ones its own provider read,
 * so it mounts with no plumbing. See ReactionCall.jsx, which does the same.
 */
export default function LogCall({ tables = null, mine = [], table = false }) {
  /* [{ key, actor, portrait, kind, lines }], newest last. */
  const [notices, setNotices] = useState([]);

  const { tables: seated } = useCampaignLog();

  /* Joined rather than passed as arrays, so a parent that rebuilds either list
     on every render does not tear the channel down with it. */
  const ours = [].concat(mine ?? []).filter(Boolean).sort().join(',');
  const ids = (tables ?? seated ?? []).map((entry) => entry.id).sort().join(',');

  useEffect(() => {
    if (!ids) return undefined;

    const own = ours ? ours.split(',') : [];

    /* The clocks, one per notice, so a notice that grew a line gets its full
       time from the newest thing said in it rather than from when it opened.
       Held inside the effect because that is exactly how long they are wanted:
       the channel going away takes its notices with it. */
    const timers = new Map();

    const clear = (key) => {
      const held = timers.get(key);
      if (held) clearTimeout(held);
      timers.set(
        key,
        setTimeout(() => {
          timers.delete(key);
          setNotices((was) => was.filter((notice) => notice.key !== key));
        }, NOTICE_MS)
      );
    };

    const drop = ids.split(',').map((campaignId) =>
      subscribeToTable({
        table: 'campaign_events',
        filter: `campaign_id=eq.${campaignId}`,
        onChange: (payload) => {
          if (payload.eventType !== 'INSERT') return;
          const row = payload.new;

          /* Yours, and the Game Master's own enemies on the Game Master's own
             page: both are the reader being told what they just did. */
          if (own.includes(row?.character_id)) return;
          if (table && !row?.character_id) return;

          const notice = noticeOf(row);
          if (!notice) return;

          setNotices((was) => {
            const at = was.findIndex((held) => held.key === notice.key);
            if (at >= 0) {
              const grown = [...was];
              /* Named where it is somebody else's row inside this action: the
                 reaction to a Fireball is the one line here that has to say
                 whose it was. Same rule the feed's own lines follow. */
              const said =
                notice.actor && notice.actor !== grown[at].actor
                  ? `${notice.actor}: ${notice.line}`
                  : notice.line;
              grown[at] = { ...grown[at], lines: [...grown[at].lines, said] };
              return grown;
            }
            return [
              ...was.slice(-(NOTICE_DEPTH - 1)),
              { ...notice, lines: [notice.line] },
            ];
          });
          clear(notice.key);
        },
      })
    );

    return () => {
      drop.forEach((off) => off());
      timers.forEach((held) => clearTimeout(held));
      timers.clear();
      setNotices([]);
    };
  }, [ids, ours, table]);

  if (notices.length === 0) return null;

  return (
    <div className="log-call" role="status" aria-live="polite">
      {notices.map((notice) => (
        <button
          type="button"
          className={`log-call-card is-${notice.kind}`}
          key={notice.key}
          onClick={() => setNotices((was) => was.filter((held) => held.key !== notice.key))}
          title="This clears itself. Tap to put it away."
        >
          {notice.portrait ? (
            <img className="log-call-face" src={notice.portrait} alt="" loading="lazy" />
          ) : (
            <span className="log-call-face is-blank" aria-hidden="true">
              {initialsOf(notice.actor)}
            </span>
          )}

          <span className="log-call-body">
            <span className="log-call-who">{notice.actor || 'Someone'}</span>
            {/* The first line is what they did. Everything after it is what came
                of it, which arrived as its own row a moment later. */}
            {notice.lines.map((line, at) => (
              <span className={at === 0 ? 'log-call-did' : 'log-call-then'} key={`${line}-${at}`}>
                {line}
              </span>
            ))}
          </span>
        </button>
      ))}
    </div>
  );
}

/** A face with no portrait behind it, the way the feed draws one. */
function initialsOf(name) {
  return String(name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}
