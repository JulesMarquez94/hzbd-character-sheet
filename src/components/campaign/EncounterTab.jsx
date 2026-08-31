import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../Modal.jsx';
import EnemyBlock from './EnemyBlock.jsx';
import { CampaignLogContext } from '../../context/campaign-log.js';
import { postEvent } from '../../lib/campaignLog.js';
import { tickEffects } from '../../lib/combatTurn.js';
import { RANKS, bestiary, difficultyLine } from '../../lib/creatures.js';
import {
  FOES_MAX,
  addFoes,
  createEncounter,
  crossTurn,
  deleteEncounter,
  dropFoe,
  encounterState,
  encounterTally,
  listEncounters,
  normalizeFoes,
  resetEncounter,
  updateEncounter,
} from '../../lib/encounters.js';
import { subscribeToTable } from '../../lib/realtime.js';

/**
 * The encounters a Game Master has prepared for this campaign.
 *
 * Jules, 2026-08-31: "a feature that can be used to create encounter. Encounter
 * are grouping of enemies we will use later for player to setup combat."
 *
 * A grouping, so this tab has no initiative order, no round counter and no turn
 * button of its own. What it has is the pile: pick an encounter, put creatures
 * in it, and every one of them gets the double block. The pools on those blocks
 * are live, because an enemy that could not lose Health is a reference card.
 *
 * ---------------------------------------------------------------- the writing
 * The encounter row is this tab's to save and the campaign row is the page's, so
 * this keeps its own debounced pipeline rather than borrowing the page's: a
 * Health step is one write per press and a typed name is one per pause, and
 * neither should ever be batched into the other row's patch.
 *
 * Writes leave one at a time behind a promise chain, exactly as the sheet's do,
 * so a slow link cannot land two Health steps in the wrong order.
 *
 * -------------------------------------------------------------- and the table
 * An enemy playing a card writes to the campaign log, and it writes as the
 * *table* rather than as a character: `character_id` null, which the schema
 * allows the Game Master alone and which nothing has raised until now. That is
 * the "later the gm" half of the log's own ask, arriving. The provider below is
 * what makes the enemy block's `usePlayCard` find a log at all.
 */

/** The one press per player turn: the Overlord's own rule. */
const TURN_LABEL = 'A player took a turn';

export default function EncounterTab({ campaign, canEdit, unit = 'metric' }) {
  const campaignId = campaign?.id;

  const [encounters, setEncounters] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [gains, setGains] = useState(null);

  /* One pending patch per encounter id, because a Game Master can move between
     two of them faster than the debounce, and a patch that followed the
     selection would land on the wrong pile. */
  const pendingRef = useRef(new Map());
  const timerRef = useRef(null);
  const flightRef = useRef(Promise.resolve());

  /**
   * The rows again, held in a ref that moves on the write rather than on the
   * render.
   *
   * Every writer in encounters.js takes an encounter and hands back a whole new
   * `foes` list built from it, which is only correct if it is handed the newest
   * one. Three taps of +1 in the shelf land in a single React batch: read the
   * encounter off the render and all three build their list from the same
   * starting point, so two of the three adds are silently lost. Found by
   * pressing it.
   *
   * So `setRows` is the only way the list moves, and it moves the ref first.
   * `patchEncounter` reads the ref, which is always the answer to the press
   * before this one.
   */
  const rowsRef = useRef([]);
  const setRows = useCallback((next) => {
    rowsRef.current = typeof next === 'function' ? next(rowsRef.current) : next;
    setEncounters(rowsRef.current);
  }, []);

  const read = useCallback(() => {
    if (!campaignId) return;
    listEncounters(campaignId)
      .then((rows) => {
        /* The server's copy, except where this screen is still holding an edit
           it has not written yet. The Game Master is the only writer *and* the
           only reader here, so their own writes echo back over the
           subscription: a refetch triggered by the echo of the *previous* write
           would land the older `foes` on top of the Health step still sitting in
           the debounce, and the block would visibly jump back before jumping
           forward again. The sheet keeps the same guard by not subscribing an
           editor at all; this one needs the subscription for the second screen,
           so it guards on the pending write instead. */
        setRows((prev) =>
          rows.map((row) => {
            if (!pendingRef.current.has(row.id)) return row;
            const held = prev.find((entry) => entry.id === row.id);
            return held ? { ...row, ...pendingRef.current.get(row.id) } : row;
          })
        );
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [campaignId, setRows]);

  useEffect(read, [read]);

  /* Live, so a Game Master with the fight open on a tablet and the map on a
     laptop is looking at the same Health on both. */
  useEffect(() => {
    if (!campaignId) return undefined;
    return subscribeToTable({
      table: 'encounters',
      filter: `campaign_id=eq.${campaignId}`,
      onChange: read,
      onResync: read,
    });
  }, [campaignId, read]);

  const flush = useCallback(async () => {
    const pending = pendingRef.current;
    pendingRef.current = new Map();
    if (pending.size === 0) return;

    for (const [id, patch] of pending) {
      const write = flightRef.current.then(() => updateEncounter(id, patch));
      flightRef.current = write.catch(() => {});
      try {
        await write;
      } catch (err) {
        // Put the failed fields back so the next flush retries them. Anything
        // edited while the write was in flight wins over the failed value.
        const held = pendingRef.current.get(id) ?? {};
        pendingRef.current.set(id, { ...patch, ...held });
        setError(err.message);
      }
    }
  }, []);

  /**
   * Optimistic local update plus a debounced write, keyed on the encounter.
   *
   * `partial` may be an object or **a function of the current row**, and every
   * writer that builds a new `foes` list has to use the second form: see the
   * note on `rowsRef`. A function that hands back nothing is a write that turned
   * out to have nothing to do, which is what the writers return when a press
   * changes nothing.
   */
  const patchEncounter = useCallback(
    (id, partial) => {
      if (!canEdit || !id) return;

      const current = rowsRef.current.find((row) => row.id === id);
      if (!current) return;

      const body = typeof partial === 'function' ? partial(current) : partial;
      if (!body || Object.keys(body).length === 0) return;

      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...body } : row)));

      const held = pendingRef.current.get(id) ?? {};
      pendingRef.current.set(id, { ...held, ...body });
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, 500);
    },
    [canEdit, flush, setRows]
  );

  // Never lose the last press when leaving the tab.
  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      if (pendingRef.current.size > 0) flush();
    },
    [flush]
  );

  /* Which encounter is open. The stored choice is matched against what actually
     exists, so an encounter deleted on another screen does not leave this one
     drawing nothing. */
  const open = useMemo(
    () => encounters.find((row) => row.id === openId) ?? encounters[0] ?? null,
    [encounters, openId]
  );

  const foes = useMemo(() => (open ? encounterState(open) : []), [open]);
  const patch = useCallback((partial) => patchEncounter(open?.id, partial), [patchEncounter, open]);

  /* The table's own voice. An enemy's use is written with no character on it,
     which is what the schema calls the table speaking. `canEdit` is the guard:
     only the Game Master may write one, and the trigger refuses anybody else
     anyway. */
  const logValue = useMemo(() => {
    const tables = campaignId ? [{ id: campaignId, name: campaign?.name ?? '' }] : [];
    return {
      tables,
      log: (event) => {
        if (!canEdit || !event) return;
        postEvent(tables, { ...event, characterId: null });
      },
    };
  }, [campaignId, campaign?.name, canEdit]);

  const handleCreate = async () => {
    try {
      const row = await createEncounter(campaignId, {
        name: `Encounter ${encounters.length + 1}`,
      });
      setRows((prev) => [...prev, row]);
      setOpenId(row.id);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (row) => {
    try {
      await deleteEncounter(row.id);
      setRows((prev) => prev.filter((entry) => entry.id !== row.id));
      pendingRef.current.delete(row.id);
      setOpenId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTurn = () => {
    /* Worked out against the row the patch is about to be applied to, not
       against the render's, and the lines it reports come back out of the same
       call. See the note on `rowsRef`. */
    let said = null;
    patch((row) => {
      const rolled = crossTurn(row, { tick: tickEffects });
      said = rolled?.gains ?? null;
      return rolled?.patch ?? null;
    });
    setGains(said ?? ['Nothing to give. No Overlord here, or every one of them is full.']);
  };

  if (!canEdit) {
    return (
      <div className="empty-state camp-empty">
        <h2>The Game Master&rsquo;s Table</h2>
        <p>Encounters are prepared and read by whoever runs this campaign.</p>
      </div>
    );
  }

  if (loading) return <div className="loading-veil">Setting the table…</div>;

  const count = open ? normalizeFoes(open.foes).length : 0;
  const tally = open ? encounterTally(open) : [];

  return (
    <CampaignLogContext.Provider value={logValue}>
      {error && <div className="form-error">{error}</div>}

      <div className="camp-toolbar enc-bar">
        <div className="enc-picker">
          {encounters.map((row) => (
            <button
              key={row.id}
              type="button"
              className={`enc-chip${open?.id === row.id ? ' is-on' : ''}`}
              onClick={() => setOpenId(row.id)}
            >
              {row.name || 'Unnamed Encounter'}
              <span className="enc-chip-count">{normalizeFoes(row.foes).length}</span>
            </button>
          ))}

          <button type="button" className="enc-chip enc-chip-new" onClick={handleCreate}>
            + New encounter
          </button>
        </div>
      </div>

      {!open ? (
        <div className="empty-state camp-empty">
          <h2>Nothing Prepared</h2>
          <p>
            An encounter is a group of enemies you put together now and put on the table later.
            Make one, then fill it out of the bestiary.
          </p>
        </div>
      ) : (
        <>
          <div className="enc-head panel">
            <div className="enc-head-fields">
              <div className="form-group">
                <label className="form-label" htmlFor="enc-name">
                  Name
                </label>
                <input
                  className="form-input"
                  id="enc-name"
                  value={open.name ?? ''}
                  maxLength={80}
                  onChange={(event) => patch({ name: event.target.value })}
                  placeholder="The Vault Door"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="enc-notes">
                  Notes
                </label>
                <input
                  className="form-input"
                  id="enc-notes"
                  value={open.notes ?? ''}
                  maxLength={300}
                  placeholder="Where it happens, and what sets it off"
                  onChange={(event) => patch({ notes: event.target.value })}
                />
              </div>
            </div>

            <div className="enc-head-foot">
              <span className="enc-tally">
                {count === 0 ? (
                  'Empty'
                ) : (
                  <>
                    {tally.map(({ rank, count: many }) => (
                      <span key={rank.id} className="enc-tally-chip" style={{ '--rank-tone': rank.color }}>
                        {many} {many === 1 ? rank.label : `${rank.label}s`}
                      </span>
                    ))}
                  </>
                )}
              </span>

              <span className="spacer" />

              <button type="button" className="btn btn-minimal btn-sm" onClick={() => setAdding(true)}>
                Add enemies
              </button>

              {/* The Overlord's rule, as the one press that carries it out. It is
                  a button and not anything automatic because a player's turn
                  happens at the table and the encounter cannot see one. */}
              <button
                type="button"
                className="btn btn-minimal btn-sm"
                onClick={handleTurn}
                title="Every Overlord here gains 3 Reaction Points, and what is running on it ticks"
              >
                {TURN_LABEL}
              </button>

              <button
                type="button"
                className="btn btn-minimal btn-sm"
                onClick={() => {
                  patch((row) => resetEncounter(row));
                }}
                title="Full pools, nothing running, every ward back up"
              >
                Reset
              </button>

              <button
                type="button"
                className="btn btn-minimal btn-sm btn-danger"
                onClick={() => handleDelete(open)}
              >
                Delete
              </button>
            </div>
          </div>

          {foes.length === 0 ? (
            <div className="empty-state camp-empty">
              <h2>No Enemies Yet</h2>
              <p>Add them out of the bestiary. The same creature can go in as many times as you like.</p>
            </div>
          ) : (
            <div className="sheet-grid-6">
              {foes.map((foe) => (
                <section key={foe.key} className="sheet-cell sheet-cell-wide cell-foe">
                  <EnemyBlock
                    foe={foe}
                    patch={patch}
                    unit={unit}
                    onRemove={() => {
                      patch((row) => dropFoe(row, foe.key));
                    }}
                  />
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {adding && open && (
        <AddFoes
          encounter={open}
          onAdd={(creatureId, many) => patch((row) => addFoes(row, creatureId, many))}
          onClose={() => setAdding(false)}
        />
      )}

      {gains && (
        <Modal title={TURN_LABEL} onClose={() => setGains(null)}>
          {gains.length === 0 ? (
            <p className="pick-line">Nothing moved.</p>
          ) : (
            <ul className="enc-gains">
              {gains.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </CampaignLogContext.Provider>
  );
}

/**
 * The shelf: the whole bestiary, with a count beside each one.
 *
 * A shelf rather than a chooser, which is the width rule Modal keeps: this is a
 * menu you browse and not a question you answer, so it takes the three-block
 * measure and flows into columns.
 *
 * The counter is what "their number is the danger" needs. Adding six
 * Blightgeists one tap at a time is not a thing anybody does twice, so the row
 * carries 1, 2 and 5 and the shelf stays open for the next creature.
 */
function AddFoes({ encounter, onAdd, onClose }) {
  const [rank, setRank] = useState(null);
  const held = normalizeFoes(encounter?.foes);
  const room = Math.max(0, FOES_MAX - held.length);

  const counts = useMemo(() => {
    const map = new Map();
    for (const row of held) map.set(row.creature, (map.get(row.creature) ?? 0) + 1);
    return map;
  }, [held]);

  const list = useMemo(() => bestiary(rank), [rank]);

  return (
    <Modal
      title="Add enemies"
      onClose={onClose}
      size="page"
      footer={
        <span className="pick-line">
          {room === 0
            ? `This encounter is full at ${FOES_MAX} enemies.`
            : `Room for ${room} more.`}
        </span>
      }
    >
      <div className="foe-filter foe-filter-shelf">
        <button
          type="button"
          className={`foe-filter-btn${rank === null ? ' is-on' : ''}`}
          onClick={() => setRank(null)}
        >
          Everything
        </button>
        {RANKS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`foe-filter-btn${rank === entry.id ? ' is-on' : ''}`}
            style={{ '--rank-tone': entry.color }}
            onClick={() => setRank(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="foe-shelf">
        {list.map((creature) => {
          const have = counts.get(creature.id) ?? 0;

          return (
            <div key={creature.id} className="foe-shelf-row">
              <span className="foe-shelf-body">
                <span className="foe-shelf-name">
                  {creature.name}
                  {have > 0 && <span className="foe-shelf-have">×{have} in</span>}
                </span>
                <span className="foe-shelf-line">
                  {creature.type} · {difficultyLine(creature)}
                </span>
                <span className="foe-shelf-line foe-shelf-stats">
                  DEF {creature.avoid} · HP {creature.health_max} ({creature.hit_die}) · WP{' '}
                  {creature.willpower_max}
                </span>
              </span>

              <span className="foe-shelf-adds">
                {[1, 2, 5].map((many) => (
                  <button
                    key={many}
                    type="button"
                    className="minion-step is-up"
                    disabled={room < many}
                    onClick={() => onAdd(creature.id, many)}
                    title={`Add ${many} ${creature.name}`}
                  >
                    +{many}
                  </button>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
