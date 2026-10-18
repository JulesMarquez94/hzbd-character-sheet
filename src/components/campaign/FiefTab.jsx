import { useCallback, useEffect, useMemo, useState } from 'react';
import { BuildPanel, BuildingPanel, GmPanel, HexPanel, HousePanel, PersonPanel, ProjectPanel, TownPanel } from './FiefPanels.jsx';
import { CAT, RES, foundFief, keepName, num, plural, wallRun } from '../../lib/fief.js';
import { DEFAULT_ISLAND, ISLANDS, hk, unk } from '../../lib/fiefIsland.js';
import FiefMap from './FiefMap.jsx';
import { keyAt } from '../../lib/fiefLooks.js';
import { addDays, dateWords } from '../../lib/calendar.js';
import { listShopWords, postEvent, shopBuyEvent } from '../../lib/campaignLog.js';
import { subscribeToTable } from '../../lib/realtime.js';
import './fief.css';

/**
 * The Fief tab: the town the whole table holds.
 *
 * Settled in the Fief plan (2026-10-15 to 2026-10-18): one town per campaign,
 * founded by a Game Master with a premium account, shared by everybody seated
 * at any tier. The board is on the left and the card for whatever is picked on
 * it on the right, with the timeline and the town's log under the board.
 *
 * Nothing here holds the town. CampaignPage folds it from the founding on the
 * campaign row and the order book (see foldFief in src/lib/fief.js), and this
 * tab hands every move back as one row for the book. So two players ordering
 * at once both see both orders land, and if they spent the same wood the
 * second is refused on every screen at the same moment, with the reason in the
 * log.
 *
 * A purchase is the one move that is not an order: the coins are on a sheet,
 * and only the sheet writes the sheet. The shop writes the choice to the table
 * log and the buyer's own sheet pays it. See ShopCall.jsx.
 */

const VIEWS = [
  ['town', 'The town'],
  ['close', 'Close up'],
  ['island', 'Whole island'],
];

/** What a selection key names: a building, a person, a house, a project or a hex. */
function whatIs(town, key) {
  if (!key) return null;
  const b = town.bById(key);
  if (b) return { kind: 'building', b };
  const person = town.personById(key);
  if (person) return { kind: 'person', person };
  const house = town.state.houses.find((q) => q.id === key);
  if (house) return { kind: 'house', house };
  const project = town.pById(key);
  if (project) return project.upgradeOf ? { kind: 'building', b: town.bById(project.upgradeOf) } : { kind: 'project', project };
  if (key.startsWith('hex:')) return { kind: 'hex', at: unk(key.slice(4)) };
  return null;
}

/** The purchases at this table, folded into one line each: who, what and how it went. */
function purchases(rows) {
  const by = new Map();
  for (const row of [...rows].sort((a, b) => a.seq - b.seq)) {
    const d = row.data ?? {};
    if (!d.chain) continue;
    if (d.move === 'buy') by.set(d.chain, { chain: d.chain, who: row.actor, characterId: row.character_id, name: d.name, price: d.price, building: d.building, state: 'waiting' });
    else if (by.has(d.chain)) by.set(d.chain, { ...by.get(d.chain), state: d.move === 'paid' ? 'paid' : 'refused', why: row.detail });
  }
  return [...by.values()].reverse();
}

function Founding({ canEdit, mayFound, calendarOn, onFound, goCalendar }) {
  const [name, setName] = useState('Ashford');
  const [island, setIsland] = useState(DEFAULT_ISLAND);
  return (
    <section className="camp-panel fief-found">
      <h3 className="camp-panel-title">The Fief</h3>
      <p>
        A town the whole table holds, on a hex island of its own. Food feeds its people and quality of life keeps
        them; its workers fill the stores, and the stores pay for the next building or the next tier. Its shops take
        the party&apos;s coins, its docks trade and its key people talk. A night under its roof can be worth more than a
        night on the road. It never changes a character&apos;s numbers.
      </p>
      {!canEdit && <p className="fief-muted">There is no town at this table yet. The Game Master founds one.</p>}
      {canEdit && !mayFound && <p className="fief-muted">Founding a town takes a Premium account. Once it stands, everybody at the table plays in it at any tier.</p>}
      {canEdit && mayFound && !calendarOn && (
        <>
          <p className="fief-muted">The town runs on the campaign calendar, a day at a time. Turn the calendar on first.</p>
          <button type="button" className="btn btn-sm" onClick={goCalendar}>
            Go to the Calendar
          </button>
        </>
      )}
      {canEdit && mayFound && calendarOn && (
        <div className="fief-edit">
          <span className="form-label" id="fief-island-label">
            Where it stands
          </span>
          <div className="fief-islands" role="radiogroup" aria-labelledby="fief-island-label">
            {ISLANDS.map((isl) => (
              <button
                key={isl.id}
                type="button"
                role="radio"
                aria-checked={island === isl.id}
                className={`fief-island${island === isl.id ? ' is-on' : ''}`}
                onClick={() => setIsland(isl.id)}
              >
                <FiefMap island={isl.id} width={200} label={`${isl.name}: ${isl.about}`} />
                <b>{isl.name}</b>
                <span>{isl.about}</span>
              </button>
            ))}
          </div>
          <p className="form-hint">The island cannot be changed once the town stands on it.</p>
          <label className="form-label" htmlFor="fief-name">
            The town&apos;s name
          </label>
          <div className="fief-row">
            <input id="fief-name" className="form-input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
            <button type="button" className="btn btn-copper btn-sm" disabled={!name.trim()} onClick={() => onFound(name.trim(), island)}>
              Found the town
            </button>
          </div>
          <p className="form-hint">
            It starts as a Town Hall with its Advisor and Foreman, a first ring of streets, a farm and 10 people,
            founded on today&apos;s date.
          </p>
        </div>
      )}
    </section>
  );
}

/**
 * `submit(order)` puts one order in the book and hands back the row the book
 * stored, with its place in it. CampaignPage's writes to fief_orders; anything
 * else that hands back a row with a `seq` will do, which is how the tab is
 * tried without a database.
 */
export default function FiefTab({ campaign, members, canEdit, userId, mayFound, town, calendar, changeFief, submit, goCalendar }) {
  const today = calendar.day;
  const dateOf = useCallback((day) => (calendar.start ? dateWords(addDays(calendar.start, day - 1)) : `Day ${day}`), [calendar.start]);

  /* The board is fetched only once a town stands, and only by a reader on this tab. */
  const [Stage, setStage] = useState(null);
  const [stageFailed, setStageFailed] = useState(false);
  useEffect(() => {
    if (!town) return undefined;
    let live = true;
    import('./FiefStage.jsx')
      .then((m) => live && setStage(() => m.default))
      .catch((error) => {
        console.warn('The Fief board did not load.', error);
        if (live) setStageFailed(true);
      });
    return () => {
      live = false;
    };
  }, [Boolean(town)]); // eslint-disable-line react-hooks/exhaustive-deps

  const mine = useMemo(() => members.filter((m) => m.user_id === userId && m.characters).map((m) => m.characters), [members, userId]);
  const [actingId, setActingId] = useState(null);
  /* Who an order is signed by: the Game Master's own hand, or one of the
     reader's own characters at this table. A Game Master starts as themselves
     and a player as their first character; a reader with neither only watches. */
  const acting = (() => {
    if (actingId === 'gm' && canEdit) return 'gm';
    const own = mine.find((c) => c.id === actingId);
    if (own) return own;
    return canEdit ? 'gm' : mine[0] ?? null;
  })();
  const actingGm = acting === 'gm';
  const actingChar = actingGm ? null : acting;
  const actingName = actingGm ? 'The Game Master' : actingChar?.name ?? '';

  const [view, setView] = useState('town');
  const [placing, setPlacing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [side, setSide] = useState('build');
  const [addTo, setAddTo] = useState(null);
  const [said, setSaid] = useState(null);
  const [lastTap, setLastTap] = useState(null);
  const [shown, setShown] = useState(40);

  const say = (text, tone = '') => setSaid({ text, tone });

  /* Purchases at this table, for the shop's own list of who bought what. */
  const [shopRows, setShopRows] = useState([]);
  useEffect(() => {
    if (!town) return undefined;
    const read = () =>
      listShopWords(campaign.id)
        .then(setShopRows)
        .catch(() => {});
    read();
    return subscribeToTable({
      table: 'campaign_events',
      filter: `campaign_id=eq.${campaign.id}`,
      onChange: (payload) => {
        if (payload.eventType === 'INSERT' && payload.new?.kind === 'shop') read();
      },
      onResync: read,
    });
  }, [campaign.id, Boolean(town)]); // eslint-disable-line react-hooks/exhaustive-deps
  const bought = useMemo(() => purchases(shopRows), [shopRows]);

  /* Escape puts the building being placed back. */
  useEffect(() => {
    if (!placing) return undefined;
    const key = (e) => {
      if (e.key === 'Escape') setPlacing(null);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [placing]);

  const mayOrder = Boolean(acting);

  async function order(kind, data) {
    if (!acting) return null;
    try {
      const row = await submit({ kind, day: today, data, actor: actingName, characterId: actingGm ? null : actingChar.id });
      setSaid({ seq: row.seq });
      return row;
    } catch (error) {
      say(error.message || 'The town did not take the order.', 'bad');
      return null;
    }
  }

  async function onBuy(b, row) {
    if (!actingChar) return;
    const ok = await postEvent([{ id: campaign.id }], {
      ...shopBuyEvent(actingChar, { chain: crypto.randomUUID(), campaign: campaign.id, building: b.id, shop: town.titleOf(b), gift: row.gift, name: row.name, price: row.price }),
      characterId: actingChar.id,
    });
    say(
      ok
        ? `Sent to ${actingChar.name}'s sheet. It pays the moment the sheet is open, and ${row.name} goes in the pack.`
        : 'The purchase did not reach the table log. Try again.',
      ok ? 'ok' : 'bad'
    );
  }

  async function pick(h, pointer) {
    if (!placing) {
      setSelected(keyAt(town, h));
      return;
    }
    if (!h) return;
    const type = placing.type;
    if (type === 'custom') {
      const why = town.customWhy(h);
      if (why) return say(why, 'bad');
      const row = await order('custom', { ...placing.draft, at: h });
      if (row) {
        setPlacing(null);
        setSelected(`o${row.seq}`);
      }
      return;
    }
    if (CAT[type].line) {
      if (!placing.wallStart) {
        const why = town.wallWhy([h]);
        if (why) return say(why, 'bad');
        setPlacing({ ...placing, wallStart: h });
        say('Now click where the run ends. A run follows one of the six hex lines. Escape to stop.', 'info');
        return;
      }
      const why = town.wallWhy(wallRun(placing.wallStart, h));
      if (why) return say(why, 'bad');
      const row = await order('wall', { from: placing.wallStart, to: h });
      if (row) {
        setPlacing(null);
        setSelected(`o${row.seq}`);
      }
      return;
    }
    const why = town.placeWhy(type, h);
    if (why) return say(why, 'bad');
    if (pointer === 'touch' && lastTap !== hk(h)) {
      setLastTap(hk(h));
      return say('Tap the same hex again to place it.', 'info');
    }
    setLastTap(null);
    const row = await order('build', { type, at: h });
    if (row) {
      setPlacing(null);
      setSelected(`o${row.seq}`);
    }
  }

  function place(type) {
    setSelected(null);
    if (placing?.type === type) return setPlacing(null);
    setPlacing({ type });
    const c = CAT[type];
    say(
      c.line
        ? 'Laying wall. Click where the run starts, then where it ends. It must touch the town. Escape to stop.'
        : `Placing a ${c.name}. The green hexes are where it can go, and a street lays itself to it. Escape to stop.`,
      'info'
    );
  }

  if (!town) {
    return (
      <Founding
        canEdit={canEdit}
        mayFound={mayFound}
        calendarOn={calendar.enabled}
        goCalendar={goCalendar}
        onFound={(name, island) => changeFief(() => foundFief(name, today, island))}
      />
    );
  }

  const st = town.state;
  const S = town.staffing();
  const cap = town.storeCap();
  const y = town.production(S);
  const keep = town.keep();
  const schedule = town.schedule();
  const open = whatIs(town, selected);
  const purse = Math.max(0, Math.floor(Number(actingChar?.wealth) || 0));
  const seen = (e) => canEdit || !e.hidden || e.day <= today || (town.lookout() && e.day - today <= 3);
  const coming = st.events.filter((e) => e.day > today && seen(e)).sort((a, b) => a.day - b.day);
  const log = [...st.log].reverse();

  /* What became of the order just placed, read off the town rather than kept:
     the fold wrote it into the log with the order's place in the book, so a
     refusal says why on every screen at once and this one simply reads it. */
  let status = said;
  if (said?.seq !== undefined) {
    const lines = st.log.filter((l) => l.seq === said.seq);
    const refused = lines.find((l) => l.kind === 'refused');
    status = lines.length ? { text: (refused ?? lines.at(-1)).text, tone: refused ? 'bad' : 'ok' } : { text: 'Sending the order...', tone: 'info' };
  }

  let panel = null;
  if (open?.kind === 'building' && open.b) {
    panel = (
      <BuildingPanel
        key={open.b.id}
        town={town}
        b={open.b}
        gm={canEdit}
        mayOrder={mayOrder}
        acting={actingChar}
        purse={purse}
        order={order}
        edit={changeFief}
        onOpen={setSelected}
        onClose={() => setSelected(null)}
        onAddPerson={(bid) => {
          setAddTo(bid);
          setSide('gm');
          setSelected(null);
        }}
        onBuy={onBuy}
        bought={bought}
        schedule={schedule}
        dateOf={dateOf}
      />
    );
  } else if (open?.kind === 'person') {
    panel = <PersonPanel key={open.person.id} town={town} person={open.person} gm={canEdit} edit={changeFief} onOpen={setSelected} onClose={() => setSelected(null)} />;
  } else if (open?.kind === 'house') {
    panel = <HousePanel town={town} house={open.house} onClose={() => setSelected(null)} />;
  } else if (open?.kind === 'project') {
    panel = <ProjectPanel town={town} project={open.project} mayOrder={mayOrder} order={order} schedule={schedule} dateOf={dateOf} onClose={() => setSelected(null)} />;
  } else if (open?.kind === 'hex') {
    panel = <HexPanel town={town} at={open.at} onClose={() => setSelected(null)} />;
  }

  return (
    <div className="fief">
      <header className="fief-top camp-panel">
        <div className="fief-name">
          <span className="fief-eyebrow">
            {keepName(keep.level)} · {town.island.name} · {dateOf(today)}
          </span>
          <h2>{town.fief.name}</h2>
        </div>
        <dl className="fief-stats">
          <div>
            <dt>People</dt>
            <dd>
              {num(st.pop)} <small>of {num(town.holds(S))}</small>
            </dd>
          </div>
          <div>
            <dt>Food</dt>
            <dd>{num(town.foodCap(S))}</dd>
          </div>
          <div>
            <dt>Quality of life</dt>
            <dd>{town.qolScore(S)}</dd>
          </div>
          {RES.map((res) => (
            <div key={res} className={`res-${res}`}>
              <dt>{res}</dt>
              <dd>
                {num(st.stock[res])} <small>/ {num(cap[res])}</small>
                {y[res] ? <span className="fief-gain">+{y[res]} a day</span> : null}
              </dd>
            </div>
          ))}
        </dl>
        <div className="fief-acting">
          {(canEdit || mine.length > 1) && (
            <>
              <label className="form-label" htmlFor="fief-acting">
                Acting as
              </label>
              <select
                id="fief-acting"
                className="form-input"
                value={actingGm ? 'gm' : actingChar?.id ?? ''}
                onChange={(e) => setActingId(e.target.value)}
              >
                {canEdit && <option value="gm">The Game Master</option>}
                {mine.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </header>

      <div className="fief-layout">
        <div className="fief-main">
          <div className="fief-viewbar" role="group" aria-label="View">
            {VIEWS.map(([id, label]) => (
              <button key={id} type="button" className={`fief-seg${view === id ? ' is-on' : ''}`} aria-pressed={view === id} onClick={() => setView(id)}>
                {label}
              </button>
            ))}
          </div>
          {Stage && !stageFailed ? (
            <Stage
              town={town}
              view={view}
              placing={placing}
              selected={selected}
              onPick={pick}
              onFail={() => setStageFailed(true)}
              label={`${town.fief.name} on a hex island: ${plural(st.buildings.length, 'building')}, ${plural(st.houses.length, 'hex', 'hexes')} of houses and ${num(st.pop)} people.`}
            />
          ) : (
            <div className="fief-stage fief-stage-empty">
              {stageFailed ? 'This browser cannot draw the board. The panels beside it hold every order.' : 'Laying out the island...'}
            </div>
          )}
          {status && <p className={`fief-said is-${status.tone || 'plain'}`}>{status.text}</p>}

        </div>

        <aside className="fief-side camp-panel">
          {panel ?? (
            <>
              {canEdit && (
                <div className="fief-sidetabs" role="tablist">
                  <button type="button" role="tab" aria-selected={side === 'build'} className={`fief-seg${side === 'build' ? ' is-on' : ''}`} onClick={() => setSide('build')}>
                    Build
                  </button>
                  <button type="button" role="tab" aria-selected={side === 'gm'} className={`fief-seg${side === 'gm' ? ' is-on' : ''}`} onClick={() => setSide('gm')}>
                    Game Master
                  </button>
                </div>
              )}
              {canEdit && side === 'gm' ? (
                <GmPanel
                  town={town}
                  today={today}
                  dateOf={dateOf}
                  order={order}
                  edit={changeFief}
                  addTo={addTo}
                  setAddTo={setAddTo}
                  onOpen={setSelected}
                  onCustom={(draft) => {
                    setSelected(null);
                    setPlacing({ type: 'custom', model: draft.model, draft });
                    say(`Raising ${draft.title || 'a custom building'}. Click any free hex of dry land. Escape to stop.`, 'info');
                  }}
                />
              ) : (
                <>
                  <BuildPanel town={town} placing={placing} onPlace={place} onStop={() => setPlacing(null)} acting={actingName} mayOrder={mayOrder} />
                  <TownPanel town={town} onOpen={setSelected} />
                </>
              )}
            </>
          )}
          {placing && panel && (
            <div className="fief-row">
              <button type="button" className="btn btn-sm" onClick={() => setPlacing(null)}>
                Stop placing
              </button>
            </div>
          )}
          <p className="fief-small fief-muted fief-credit">Models by Kay Lousberg, kaylousberg.com, CC0.</p>
        </aside>
        <section className="fief-timeline camp-panel">
          <h3 className="camp-panel-title">Under way</h3>
          {st.projects.length === 0 && <p className="fief-small fief-muted">Nothing is being built.</p>}
          <ul className="fief-projects">
            {st.projects.map((p) => (
              <li key={p.id}>
                <button type="button" className="fief-link" onClick={() => setSelected(p.upgradeOf ?? p.id)}>
                  {town.projName(p)}
                </button>
                <span className="fief-small fief-muted">
                  {p.started ? (p.stalled ? 'stalled' : `${Math.round((p.done / p.days) * 100)}% built${schedule[p.id]?.slow ? ', short of builders' : ''}`) : 'waiting in line'} · ready {dateOf(schedule[p.id]?.end ?? today)} · {p.by || 'the town'}
                </span>
              </li>
            ))}
          </ul>
          {coming.length > 0 && (
            <>
              <h3 className="camp-panel-title">Coming</h3>
              <ul className="fief-projects">
                {coming.map((e) => (
                  <li key={e.id}>
                    <b>{e.title}</b>
                    <span className="fief-small fief-muted">
                      {dateOf(e.day)}
                      {e.hidden ? (canEdit ? ' · hidden from the players' : ' · spotted by the lookouts') : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h3 className="camp-panel-title">The town&apos;s log</h3>
          <ol className="fief-log">
            {log.slice(0, shown).map((l, i) => (
              <li key={`${l.day}-${i}`} className={`is-${l.kind}`}>
                <span className="fief-log-day">{dateOf(l.day)}</span>
                {l.text}
              </li>
            ))}
          </ol>
          {log.length > shown && (
            <button type="button" className="btn btn-minimal btn-sm" onClick={() => setShown((n) => n + 80)}>
              Older
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
