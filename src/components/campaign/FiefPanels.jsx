import { useState } from 'react';
import PortraitField from '../images/PortraitField.jsx';
import { viewUrl } from '../../lib/imageViews.js';
import {
  CAT,
  GROUPS,
  KEEP_UP,
  RANKS,
  REACH,
  RES,
  RULE_LIMITS,
  STORE,
  keepName,
  listJoin,
  num,
  plural,
  siteWords,
  townRestWords,
  upCost,
} from '../../lib/fief.js';
import { ALL, hk } from '../../lib/fiefIsland.js';
import { CUSTOM_MODELS, TEMPLATES, personName } from '../../lib/fiefPeople.js';
import { ranksOn, shelfOf } from '../../lib/fiefShop.js';

/**
 * The Fief tab's side panels: what is shown beside the board for whatever is
 * selected on it. Every one of them reads the folded town and nothing else, and
 * every move is handed up as `order(kind, data)` for the tab to put in the book,
 * or `edit(change)` for the Game Master's own record on the campaign row.
 *
 * A player sees the cards. The Game Master sees the same cards with a pen.
 */

const AVATAR = ['#C88A4B', '#7EE2A8', '#C9A4FF', '#86AECB', '#E6C36A', '#E58AA6', '#FF8A85', '#AEB8BE'];

/* ------------------------------------------------------------------ pieces */

export function Cost({ cost, stock }) {
  const entries = Object.entries(cost ?? {});
  if (!entries.length) return <span className="fief-cost">free</span>;
  return (
    <span className="fief-costs">
      {entries.map(([res, n]) => (
        <span key={res} className={`fief-cost res-${res}${stock && stock[res] < n ? ' is-short' : ''}`}>
          {num(n)} {res}
        </span>
      ))}
    </span>
  );
}

function Head({ eyebrow, title, level = 0, word = 'Tier', onClose }) {
  return (
    <div className="fief-head">
      <div>
        <span className="fief-eyebrow">{eyebrow}</span>
        <h3 className="fief-title">
          {title}
          {level > 0 && (
            <span className="fief-lvl">
              {word} {level}
            </span>
          )}
        </h3>
      </div>
      {onClose && (
        <button type="button" className="fief-x" onClick={onClose} aria-label="Close">
          ×
        </button>
      )}
    </div>
  );
}

function initials(name) {
  return String(name ?? '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);
}

function Face({ person, big = false }) {
  const shown = person.img ? viewUrl(person.img, big ? 'portrait' : 'plate') : null;
  if (shown) return <img className={big ? 'fief-portrait' : 'fief-av'} src={shown} alt="" />;
  if (big) {
    return (
      <div className="fief-portrait is-empty">
        <span>{initials(person.name)}</span>
        <em>No picture yet</em>
      </div>
    );
  }
  let h = 0;
  for (const ch of person.name ?? '') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span className="fief-av" style={{ background: AVATAR[h % AVATAR.length] }}>
      {initials(person.name)}
    </span>
  );
}

export function PersonChip({ person, where, onOpen }) {
  return (
    <button type="button" className="fief-person" onClick={() => onOpen(person.id)}>
      <Face person={person} />
      <span>
        <b>{person.name}</b>
        <span className="fief-job">
          {person.role}
          {where ? ` · ${where}` : ''}
        </span>
      </span>
    </button>
  );
}

const groupOf = (type) => GROUPS.find((g) => g.types.includes(type))?.name ?? '';

/* ------------------------------------------------------------------ build */

/** Why a type cannot be ordered right now, or ''. */
function lockOf(town, type) {
  const c = CAT[type];
  if (c.needs && !town.standing(c.needs)) return `Needs a ${CAT[c.needs].name}`;
  return town.shortOf(town.cut(c.cost)) || '';
}

export function BuildPanel({ town, placing, onPlace, onStop, acting, mayOrder }) {
  const cut = town.undeadCut();
  return (
    <div className="fief-panel-body">
      <Head eyebrow={acting ? `Ordering as ${acting}` : 'Watching'} title="Build" />
      {placing && (
        <div className="fief-row">
          <button type="button" className="btn btn-sm" onClick={onStop}>
            Stop placing
          </button>
        </div>
      )}
      <p className="fief-small fief-muted">
        Pick a building, then a green hex. A street lays itself to it, up to {REACH} hexes from the town. Every
        building starts at tier 1, and the Keep&apos;s level caps how high any of them can go.
        {cut ? ` The cemetery takes ${cut}% off every price.` : ''}
      </p>
      {!mayOrder && <p className="fief-small fief-warn">Only a character seated at this table can order here.</p>}
      {GROUPS.map((group) => (
        <div key={group.name}>
          <div className="fief-ghead">{group.name}</div>
          <div className="fief-blist">
            {group.types.map((type) => {
              const c = CAT[type];
              const lock = lockOf(town, type);
              const meta = c.line
                ? `a run · a day for every ${c.perDay} hexes`
                : [plural(c.days, 'day'), siteWords(type), c.nolevel ? '' : 'tiers 1 to 3'].filter(Boolean).join(' · ');
              return (
                <button
                  key={type}
                  type="button"
                  className={`fief-bitem${placing?.type === type ? ' is-on' : ''}`}
                  disabled={!mayOrder || !!lock}
                  title={c.about}
                  onClick={() => onPlace(type)}
                >
                  <span className="fief-bname">{c.name}</span>
                  <span className="fief-bcost">
                    <Cost cost={town.cut(c.cost)} stock={town.state.stock} />
                    {c.line && <span className="fief-cost">a hex</span>}
                    {cut ? <span className="fief-cost is-cut">-{cut}%</span> : null}
                  </span>
                  <span className="fief-bmeta">{meta}</span>
                  {lock && <span className="fief-block">{lock}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ the town at a glance */

export function TownPanel({ town, onOpen }) {
  const S = town.staffing();
  const parts = town.qolParts(S);
  const score = town.qolScore(S);
  const food = town.foodCap(S);
  const room = town.comfortCap(S);
  const per = town.perimeter();
  const st = town.state;
  const w = Math.max(1, town.workers());
  const pc = (n) => `${((n / w) * 100).toFixed(1)}%`;
  const people = town.people();
  return (
    <div className="fief-panel-body">
      <div className="fief-sub">
        <h4>Quality of life · {score}</h4>
        <p className="fief-small">
          Every point keeps {st.rules.perQol} people, so this town keeps {num(room)}. Food feeds {num(food)}. The town
          holds the smaller of the two: <b>{num(Math.min(food, room))}</b>.
        </p>
        <dl className="fief-kv">
          {parts.map((p) => (
            <div key={p.id} className="fief-kv-row">
              <dt>
                <button type="button" className="fief-link" onClick={() => onOpen(p.id)}>
                  {p.name}
                </button>
              </dt>
              <dd>+{p.v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="fief-sub">
        <h4>
          Hands · {town.workers()} of {st.pop} people
        </h4>
        <div className="fief-bar">
          <i className="is-build" style={{ width: pc(S.building) }} />
          <i className="is-work" style={{ width: pc(S.working) }} />
          <i className="is-idle" style={{ width: pc(S.idle) }} />
        </div>
        <p className="fief-small">
          {S.building} building, {Math.round(S.working)} at work and {Math.round(S.idle)} idle.{' '}
          {S.share < 1
            ? `Short of hands: the food comes first and the builders next, and every other building works at ${Math.round(S.share * 100)}%.`
            : 'Nobody is assigned: the food comes first, the builders next and the rest spread by themselves.'}
        </p>
        <dl className="fief-kv">
          <div className="fief-kv-row">
            <dt>Houses</dt>
            <dd>
              {plural(st.houses.length, 'hex', 'hexes')}, {st.rules.perHouse} people each
            </dd>
          </div>
          <div className="fief-kv-row">
            <dt>Perimeter</dt>
            <dd>{per.closed ? `closed, ${per.inside} hexes inside` : per.walls ? 'not closed yet' : 'no walls'}</dd>
          </div>
          <div className="fief-kv-row">
            <dt>Projects</dt>
            <dd>
              {town.running().length} of {town.projectSlots()} at once
            </dd>
          </div>
        </dl>
      </div>
      <div className="fief-sub">
        <h4>Key people · {people.length}</h4>
        <div className="fief-people">
          {people.map((p) => {
            const b = p.bid ? town.bById(p.bid) : null;
            return <PersonChip key={p.id} person={p} where={b ? town.titleOf(b) : 'at large'} onOpen={onOpen} />;
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ a building */

function workLine(town, b, S) {
  const c = CAT[b.type];
  const n = S.crew[b.id] || 0;
  if (c.food) return `Feeds ${Math.floor(n * c.food + 1e-6)}`;
  if (c.yield) {
    const [res, per] = Object.entries(c.yield)[0];
    return `+${Math.floor(n * per + 1e-6)} ${res} a day`;
  }
  if (c.qol) return n ? `+${c.qol[b.level - 1]} quality of life` : 'No quality of life until someone works here';
  if (c.undead) return n ? `Every project costs ${c.undead[b.level - 1]}% less` : 'Untended: no discount';
  if (c.shop) return n ? `Open: ${listJoin(ranksOn(b))} on sale` : `Closed until a ${c.job} is at work`;
  if (c.rest) return n ? `Open: ${townRestWords(b.level)}` : `Closed until an ${c.job} is at work`;
  return n ? 'Staffed' : 'Empty';
}

function gainOf(town, b) {
  const c = CAT[b.type];
  const to = b.level + 1;
  if (b.type === 'keep') return `${keepName(to)}: ${to} projects at once, stores of ${num(STORE[b.level])} and tier ${to} for every other building.`;
  if (c.shop) return `Tier ${to} puts the ${RANKS[b.level].toLowerCase()} rank on sale.`;
  if (c.rest) return `Tier ${to}: ${townRestWords(to)}`;
  if (c.qol) return `Tier ${to}: +${c.qol[b.level]} quality of life.`;
  if (c.undead) return `Tier ${to}: every project ${c.undead[b.level]}% cheaper.`;
  if (c.crew) return `Tier ${to}: a crew of ${c.crew[b.level]}.`;
  return '';
}

function CardEdit({ town, b, edit, onDone }) {
  const card = town.fief.cards[b.id] ?? {};
  const [title, setTitle] = useState(town.titleOf(b));
  const [lore, setLore] = useState(town.loreOf(b));
  const [model, setModel] = useState(town.modelOf(b));
  const [shop, setShop] = useState(town.isShop(b));
  const custom = b.type === 'custom';
  function save() {
    edit((f) => ({
      ...f,
      cards: {
        ...f.cards,
        [b.id]: { ...card, title: title.trim(), lore: lore.trim(), ...(custom ? { model, shop } : {}) },
      },
    }));
    onDone();
  }
  return (
    <div className="fief-sub fief-edit">
      <h4>Edit the building</h4>
      <label className="form-label" htmlFor={`fb-t-${b.id}`}>
        Name
      </label>
      <input id={`fb-t-${b.id}`} className="form-input" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
      <label className="form-label" htmlFor={`fb-l-${b.id}`}>
        Description
      </label>
      <textarea id={`fb-l-${b.id}`} className="form-input" rows={4} value={lore} maxLength={800} onChange={(e) => setLore(e.target.value)} />
      {custom && (
        <>
          <label className="form-label" htmlFor={`fb-m-${b.id}`}>
            Model
          </label>
          <select id={`fb-m-${b.id}`} className="form-input" value={model} onChange={(e) => setModel(e.target.value)}>
            {CUSTOM_MODELS.map(([id, words]) => (
              <option key={id} value={id}>
                {words}
              </option>
            ))}
          </select>
          <label className="fief-check">
            <input type="checkbox" checked={shop} onChange={(e) => setShop(e.target.checked)} /> It is a shop the party can buy from
          </label>
        </>
      )}
      <div className="fief-row">
        <button type="button" className="btn btn-copper btn-sm" onClick={save}>
          Save
        </button>
        <button type="button" className="btn btn-minimal btn-sm" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function Shelf({ town, b, gm, acting, purse, onBuy, edit, bought }) {
  const c = CAT[b.type];
  const open = town.shopOpen(b);
  const rows = shelfOf(town, b);
  const kinds = [...new Set(rows.map((r) => r.kind))];
  const [name, setName] = useState('');
  const [price, setPrice] = useState('25');
  const [note, setNote] = useState('');
  function stock() {
    if (!name.trim()) return;
    const item = { id: crypto.randomUUID().slice(0, 8), name: name.trim(), price: Math.max(0, Math.floor(Number(price) || 0)), note: note.trim() };
    edit((f) => ({ ...f, stock: { ...f.stock, [b.id]: [...(f.stock[b.id] ?? []), item] } }));
    setName('');
    setNote('');
  }
  function unstock(id) {
    edit((f) => ({ ...f, stock: { ...f.stock, [b.id]: (f.stock[b.id] ?? []).filter((x) => `s:${x.id}` !== id) } }));
  }
  const mine = bought.filter((x) => x.building === b.id);
  return (
    <div className="fief-sub">
      <h4>
        On the shelves
        {c.shop ? ` · ${listJoin(ranksOn(b))}` : ''}
      </h4>
      {!open && <p className="fief-small fief-warn">Closed until a {c.job} is at work.</p>}
      {!gm && acting && (
        <p className="fief-small">
          {acting.name}&apos;s purse: <b>{num(purse)} coins</b>. What you buy is paid by your own sheet and goes into
          your pack.
        </p>
      )}
      {!rows.length && <p className="fief-small fief-muted">Nothing on the shelves yet.</p>}
      {kinds.map((kind) => {
        const list = rows.filter((r) => r.kind === kind);
        return (
          <details key={kind} className="fief-shelfbox" open={list.length <= 20}>
            <summary>
              <b>{kind}</b> · {list.length}
            </summary>
            <ul className="fief-shelf">
              {list.map((row) => {
                const can = open && acting && purse >= row.price;
                return (
                  <li key={row.id}>
                    <span className="fief-it">
                      <span className="fief-rk">{row.rank === null ? 'Special' : RANKS[row.rank]}</span>
                      {row.name}
                      {row.note ? <em>{row.note}</em> : null}
                    </span>
                    <span className="fief-pr">{num(row.price)} c</span>
                    {gm ? (
                      row.gm ? (
                        <button type="button" className="btn btn-minimal btn-sm" onClick={() => unstock(row.id)}>
                          Remove
                        </button>
                      ) : (
                        <span />
                      )
                    ) : (
                      <button type="button" className={`btn btn-sm${can ? ' btn-copper' : ''}`} disabled={!can} onClick={() => onBuy(b, row)}>
                        Buy
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
      {c.shop && b.level < 3 && <p className="fief-small fief-muted">Tier {b.level + 1} adds the {RANKS[b.level].toLowerCase()} shelf.</p>}
      {c.later && (
        <p className="fief-small">
          <span className="fief-tag">Later</span> {c.later}
        </p>
      )}
      {mine.length > 0 && (
        <div className="fief-bought">
          <h5>Bought here</h5>
          <ul>
            {mine.slice(0, 8).map((x) => (
              <li key={x.chain} className={`is-${x.state}`}>
                <b>{x.who}</b> · {x.name} · {x.state === 'waiting' ? 'waiting for their sheet to pay' : x.state === 'paid' ? `${num(x.price)} coins, paid` : x.why || 'not bought'}
              </li>
            ))}
          </ul>
        </div>
      )}
      {gm && (
        <div className="fief-edit">
          <h4>Stock an item</h4>
          <label className="form-label" htmlFor={`fs-n-${b.id}`}>
            Name
          </label>
          <input id={`fs-n-${b.id}`} className="form-input" value={name} maxLength={60} placeholder="A map of the drowned coast" onChange={(e) => setName(e.target.value)} />
          <div className="fief-grid2">
            <div>
              <label className="form-label" htmlFor={`fs-p-${b.id}`}>
                Price in coins
              </label>
              <input id={`fs-p-${b.id}`} className="form-input" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor={`fs-o-${b.id}`}>
                A line about it
              </label>
              <input id={`fs-o-${b.id}`} className="form-input" value={note} maxLength={200} placeholder="Half of it is wrong." onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <div className="fief-row">
            <button type="button" className="btn btn-copper btn-sm" disabled={!name.trim()} onClick={stock}>
              Put it on the shelf
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function BuildingPanel({ town, b, gm, mayOrder, acting, purse, order, edit, onOpen, onClose, onAddPerson, onBuy, bought, schedule, dateOf }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const c = CAT[b.type];
  const S = town.staffing();
  const st = town.state;

  if (b.ruined) {
    const rc = town.rebuildCost(b);
    const cost = town.cut(rc.cost);
    const short = town.shortOf(cost);
    const up = town.upgradeOf(b.id);
    return (
      <div className="fief-panel-body">
        <Head eyebrow="Rubble" title={c.name} onClose={onClose} />
        <p>Destroyed by the Game Master. Rebuilding restores it at half the price in half the days.</p>
        {up ? (
          <p>The rebuild is under way.</p>
        ) : (
          <>
            <div className="fief-row">
              <Cost cost={cost} stock={st.stock} />
              <span className="fief-small fief-muted">{plural(rc.days, 'day')}</span>
            </div>
            <div className="fief-row">
              <button type="button" className="btn btn-copper btn-sm" disabled={!mayOrder || !!short} onClick={() => order('rebuild', { building: b.id })}>
                Rebuild
              </button>
            </div>
            {short && <p className="fief-small fief-warn">{short}.</p>}
          </>
        )}
      </div>
    );
  }

  const isKeep = b.type === 'keep';
  const pic = town.pictureOf(b);
  const shown = pic ? viewUrl(pic, 'plate') : null;
  const people = town.peopleOf(b.id);
  const up = town.upgradeOf(b.id);
  const word = isKeep ? 'Level' : 'Tier';
  const eyebrow = isKeep ? `${keepName(b.level)} · the heart of the town` : c.custom ? 'Raised by the Game Master' : `${c.name} · ${groupOf(b.type)}`;

  return (
    <div className="fief-panel-body">
      <Head eyebrow={eyebrow} title={town.titleOf(b)} level={c.nolevel ? 0 : b.level} word={word} onClose={onClose} />
      {editing ? (
        <CardEdit town={town} b={b} edit={edit} onDone={() => setEditing(false)} />
      ) : (
        <>
          {shown && <img className="fief-bpic" src={shown} alt="" />}
          <p className="fief-lore">{town.loreOf(b)}</p>
          {!c.custom && <p className="fief-small fief-muted">{c.about}</p>}
          {gm && (
            <div className="fief-row">
              <button type="button" className="btn btn-sm" onClick={() => setEditing(true)}>
                Edit the name or text
              </button>
            </div>
          )}
          {gm && (
            <PortraitField
              label="Picture"
              view="plate"
              value={pic}
              onChange={(url) => edit((f) => ({ ...f, cards: { ...f.cards, [b.id]: { ...(f.cards[b.id] ?? {}), img: url } } }))}
              hint="Shown on this building's card. No art is generated."
            />
          )}
        </>
      )}

      {c.site && !town.hasSite(b) && (
        <p className="fief-small fief-warn">It no longer touches its {town.island.names[c.site].name.toLowerCase().replace('the ', '')}, so it stands idle.</p>
      )}

      {isKeep && (
        <dl className="fief-kv">
          <div className="fief-kv-row">
            <dt>Projects at once</dt>
            <dd>{town.projectSlots()}</dd>
          </div>
          <div className="fief-kv-row">
            <dt>Stores hold</dt>
            <dd>
              {num(town.storeCap().wood)} each, {town.storeCap().empyrium} empyrium
            </dd>
          </div>
          <div className="fief-kv-row">
            <dt>Other buildings</dt>
            <dd>up to tier {b.level}</dd>
          </div>
          <div className="fief-kv-row">
            <dt>Quality of life</dt>
            <dd>+{CAT.keep.qol[b.level - 1]}</dd>
          </div>
        </dl>
      )}

      {town.isWall(b) && (
        <p className="fief-small">
          {town.perimeter().closed
            ? `The ring is closed: ${town.perimeter().inside} hexes lie inside the walls.`
            : `The ring is not closed yet. ${plural(town.perimeter().walls, 'hex', 'hexes')} of wall stand.`}
          {st.roads[hk([b.q, b.r])] ? ' A street runs through here, so this is a gate.' : ''}
        </p>
      )}

      {c.crew && (
        <div className="fief-sub">
          <h4>
            Hands · {Math.round(S.crew[b.id] || 0)} of {town.crewCap(b)} {c.job}s
          </h4>
          <p className="fief-strong">{workLine(town, b, S)}</p>
          <div className="fief-bar">
            <i className="is-work" style={{ width: `${town.crewCap(b) ? ((S.crew[b.id] || 0) / town.crewCap(b)) * 100 : 0}%` }} />
          </div>
        </div>
      )}
      {!c.crew && c.qol && !isKeep && <p className="fief-strong">+{c.qol[b.level - 1]} quality of life</p>}

      {town.isShop(b) && <Shelf town={town} b={b} gm={gm} acting={acting} purse={purse} onBuy={onBuy} edit={edit} bought={bought} />}

      {c.rest && (
        <div className="fief-sub">
          <h4>Resting in the town</h4>
          <p className="fief-small">{townRestWords(town.tavernTier())}</p>
          <p className="fief-small fief-muted">
            The Game Master calls the rest from the Calendar tab and ticks that the party rests in the town. Tier 1 is a
            meal and a bed and tier 2 a Karma point each. Tier 3 adds a Shield of five times the level to start the day.
          </p>
        </div>
      )}

      {c.trade && (
        <div className="fief-sub">
          <h4>Trade goods · {num(st.stock.goods)} in store</h4>
          {['wood', 'stone', 'metal', 'empyrium'].map((res) => {
            const rate = st.rules.goods[res];
            return (
              <div key={res} className="fief-conv">
                <span>
                  {rate} goods for 1 {res}
                </span>
                <button type="button" className="btn btn-sm" disabled={!mayOrder || st.stock.goods < rate} onClick={() => order('trade', { res, n: 1 })}>
                  Trade
                </button>
                <button type="button" className="btn btn-sm" disabled={!mayOrder || st.stock.goods < rate * 10} onClick={() => order('trade', { res, n: 10 })}>
                  ×10
                </button>
              </div>
            );
          })}
        </div>
      )}

      {b.type !== 'wall' && (
        <div className="fief-sub">
          <h4>{people.length === 1 ? 'Key person' : 'Key people'}</h4>
          {people.length ? (
            <div className="fief-people">
              {people.map((p) => (
                <PersonChip key={p.id} person={p} onOpen={onOpen} />
              ))}
            </div>
          ) : (
            <p className="fief-small fief-muted">Nobody here yet.</p>
          )}
          {gm && (
            <div className="fief-row">
              <button type="button" className="btn btn-sm" onClick={() => onAddPerson(b.id)}>
                Add a person here
              </button>
            </div>
          )}
        </div>
      )}

      {!c.nolevel && (
        <div className="fief-sub">
          <h4>Upgrade</h4>
          {up ? (
            <p>
              {word} {up.to} is {up.started ? 'under way' : 'waiting in line'}, ready on {dateOf(schedule[up.id]?.end ?? st.day)}.
            </p>
          ) : town.tierWhy(b) ? (
            <p className="fief-muted">{town.tierWhy(b)}</p>
          ) : (
            (() => {
              const u = upCost(b.type, b.level + 1);
              const cost = town.cut(u.cost);
              const short = town.shortOf(cost);
              return (
                <>
                  <p>
                    {gainOf(town, b)} {plural(u.days, 'day')}.
                  </p>
                  <div className="fief-row">
                    <Cost cost={cost} stock={st.stock} />
                  </div>
                  <div className="fief-row">
                    <button type="button" className="btn btn-copper btn-sm" disabled={!mayOrder || !!short} onClick={() => order('upgrade', { building: b.id })}>
                      Upgrade to {word.toLowerCase()} {b.level + 1}
                    </button>
                  </div>
                  {short && <p className="fief-small fief-warn">{short}.</p>}
                </>
              );
            })()
          )}
        </div>
      )}

      {gm && !isKeep && (
        <div className="fief-sub">
          <h4>Game Master</h4>
          {confirming ? (
            <div className="fief-confirm">
              <span>
                {c.custom
                  ? `Take ${town.titleOf(b)} down? It leaves nothing behind.`
                  : `Destroy ${town.titleOf(b)}? Its crew returns to the pool and rubble is left.`}
              </span>
              <div className="fief-row">
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    order('destroy', { building: b.id });
                    setConfirming(false);
                  }}
                >
                  {c.custom ? 'Take it down' : 'Destroy'}
                </button>
                <button type="button" className="btn btn-minimal btn-sm" onClick={() => setConfirming(false)}>
                  Keep it
                </button>
              </div>
            </div>
          ) : (
            <div className="fief-row">
              <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirming(true)}>
                {c.custom ? 'Take this building down' : 'Destroy this building'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ a person */

export function PersonPanel({ town, person, gm, edit, onOpen, onClose }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(person.name);
  const [role, setRole] = useState(person.role);
  const [note, setNote] = useState(person.note);
  const [bid, setBid] = useState(person.bid ?? '');
  const b = person.bid ? town.bById(person.bid) : null;
  const where = b ? town.titleOf(b) : 'At large in the town';
  const spots = town.state.buildings.filter((x) => x.type !== 'wall' && !x.ruined);

  const write = (fields) =>
    edit((f) =>
      person.custom
        ? { ...f, extras: f.extras.map((x) => (x.id === person.id ? { ...x, ...fields } : x)) }
        : { ...f, people: { ...f.people, [person.id]: { ...(f.people[person.id] ?? {}), ...fields } } }
    );

  function save() {
    write({ name: name.trim() || person.name, role: role.trim() || person.role, note: note.trim(), bid: bid || null });
    setEditing(false);
  }
  function drop() {
    if (person.custom) edit((f) => ({ ...f, extras: f.extras.filter((x) => x.id !== person.id) }));
    else write({ gone: true });
    onClose();
  }

  return (
    <div className="fief-panel-body">
      <Head eyebrow={`Key person · ${where}`} title={person.name} onClose={onClose} />
      {editing ? (
        <div className="fief-sub fief-edit">
          <label className="form-label" htmlFor={`fp-n-${person.id}`}>
            Name
          </label>
          <input id={`fp-n-${person.id}`} className="form-input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          <label className="form-label" htmlFor={`fp-r-${person.id}`}>
            Role
          </label>
          <input id={`fp-r-${person.id}`} className="form-input" value={role} maxLength={60} onChange={(e) => setRole(e.target.value)} />
          <label className="form-label" htmlFor={`fp-o-${person.id}`}>
            About
          </label>
          <textarea id={`fp-o-${person.id}`} className="form-input" rows={5} value={note} maxLength={800} onChange={(e) => setNote(e.target.value)} />
          <label className="form-label" htmlFor={`fp-w-${person.id}`}>
            Where
          </label>
          <select id={`fp-w-${person.id}`} className="form-input" value={bid} onChange={(e) => setBid(e.target.value)}>
            <option value="">At large in the town</option>
            {spots.map((x) => (
              <option key={x.id} value={x.id}>
                {town.titleOf(x)}
              </option>
            ))}
          </select>
          <div className="fief-row">
            <button type="button" className="btn btn-copper btn-sm" onClick={save}>
              Save
            </button>
            <button type="button" className="btn btn-minimal btn-sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={drop}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="fief-pcard">
          <Face person={person} big />
          <div>
            <span className="fief-eyebrow">{person.role}</span>
            <p>{person.note}</p>
            {b && <p className="fief-small fief-muted">Found at {where}.</p>}
          </div>
        </div>
      )}
      {gm && !editing && (
        <>
          <div className="fief-row">
            <button type="button" className="btn btn-sm" onClick={() => setEditing(true)}>
              Edit or move
            </button>
          </div>
          <PortraitField label="Picture" view="portrait" value={person.img ?? null} onChange={(url) => write({ img: url })} hint="Shown on this person's card. No art is generated." />
        </>
      )}
      {b && (
        <div className="fief-row">
          <button type="button" className="btn btn-minimal btn-sm" onClick={() => onOpen(b.id)}>
            Go to {town.titleOf(b)}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ the rest of the board */

export function HousePanel({ town, house, onClose }) {
  const n = town.housePop(house);
  const w = Math.floor((n * town.state.rules.work) / 100);
  return (
    <div className="fief-panel-body">
      <Head eyebrow="Houses" title={house.name} onClose={onClose} />
      <p>
        Houses are not built and do not upgrade. A hex of them grows by itself beside the street nearest the Keep
        whenever the town needs room. The people here are a number; the town&apos;s key people live and work in its key
        buildings.
      </p>
      <dl className="fief-kv">
        <div className="fief-kv-row">
          <dt>People here</dt>
          <dd>{n}</dd>
        </div>
        <div className="fief-kv-row">
          <dt>Of working age</dt>
          <dd>{w}</dd>
        </div>
        <div className="fief-kv-row">
          <dt>Children, elders and carers</dt>
          <dd>{n - w}</dd>
        </div>
      </dl>
    </div>
  );
}

export function HexPanel({ town, at, onClose }) {
  const k = hk(at);
  const t = town.island.terr(at);
  if (town.state.roads[k]) {
    const bridge = town.state.bridges[k] !== undefined;
    return (
      <div className="fief-panel-body">
        <Head eyebrow="A street" title={bridge ? 'Bridge' : 'Street'} onClose={onClose} />
        <p>
          Streets lay themselves: when a building goes up beyond the streets, the shortest way to it is paved for free.
          A building must be within {REACH} hexes of one.{' '}
          {bridge ? 'This one crosses the river on a bridge, where the river runs straight.' : 'Lamps light every other hex.'}
        </p>
      </div>
    );
  }
  const x = town.island.names[t];
  if (!x) return null;
  const count = ALL.filter((h) => town.island.terr(h) === t).length;
  return (
    <div className="fief-panel-body">
      <Head eyebrow="The island" title={x.name} onClose={onClose} />
      <p>
        {count} hexes. {x.about}
      </p>
    </div>
  );
}

export function ProjectPanel({ town, project, mayOrder, order, schedule, dateOf, onClose }) {
  const when = schedule[project.id];
  return (
    <div className="fief-panel-body">
      <Head eyebrow={project.started ? 'Under way' : 'Waiting in line'} title={town.projName(project)} onClose={onClose} />
      <p>
        Ordered by {project.by || 'the town'} on {dateOf(project.ordered)}.{' '}
        {project.started
          ? `${Math.round((project.done / project.days) * 100)}% built of ${plural(project.days, 'day')}' work${project.stalled ? ', stalled for want of builders' : when?.slow ? ', going slower with fewer than its six builders' : ''}.`
          : 'It starts when a project slot is free.'}{' '}
        Ready on {dateOf(when?.end ?? town.state.day)}.
      </p>
      <p className="fief-small fief-muted">Cancelled before work starts, it is all refunded. After that, half.</p>
      <div className="fief-row">
        <button type="button" className="btn btn-sm" disabled={!mayOrder} onClick={() => order('cancel', { project: project.id })}>
          Cancel the project
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ the Game Master's hand */

const PRESETS = [
  { id: 'raid', label: 'A raid', title: 'Bandit raid', res: 'goods', amt: -40, raid: true, hidden: true },
  { id: 'gift', label: 'Tribute', title: 'Tribute from the valley', res: 'stone', amt: 60 },
  { id: 'caravan', label: 'A caravan', title: 'Merchant caravan', res: 'goods', amt: 40 },
  { id: 'refugees', label: 'Refugees', title: 'Refugees at the edge', people: 20 },
];

export function GmPanel({ town, today, dateOf, order, edit, addTo, setAddTo, onCustom, onOpen }) {
  const fief = town.fief;
  const st = town.state;
  const spots = st.buildings.filter((x) => x.type !== 'wall' && !x.ruined);
  const [tpl, setTpl] = useState('');
  const [pname, setPname] = useState('');
  const [prole, setProle] = useState('');
  const [cname, setCname] = useState('');
  const [clore, setClore] = useState('');
  const [cmodel, setCmodel] = useState(CUSTOM_MODELS[0][0]);
  const [cshop, setCshop] = useState(false);
  const [preset, setPreset] = useState('raid');
  const [inDays, setInDays] = useState('3');
  const [hidden, setHidden] = useState(true);
  const [gift, setGift] = useState({ wood: '', stone: '', metal: '', empyrium: '', goods: '', note: '' });
  const [rules, setRules] = useState(() => Object.fromEntries(Object.keys(RULE_LIMITS).map((k) => [k, String(st.rules[k])])));
  const [name, setName] = useState(fief.name);

  function addPerson() {
    const t = tpl === '' ? null : TEMPLATES[Number(tpl)];
    const id = `x${crypto.randomUUID().slice(0, 8)}`;
    const person = {
      id,
      bid: addTo || null,
      role: t ? t[0] : prole.trim() || 'Townsfolk',
      note: t ? t[1] : "A person of the Game Master's own.",
      name: pname.trim() || personName(Date.now() % 100000),
      img: null,
    };
    edit((f) => ({ ...f, extras: [...f.extras, person] }));
    setPname('');
    setProle('');
    onOpen(id);
  }

  function pin() {
    const p = PRESETS.find((x) => x.id === preset);
    const day = today + Math.max(1, Math.floor(Number(inDays) || 1));
    const ev = { id: `e${crypto.randomUUID().slice(0, 8)}`, day, title: p.title, res: p.res ?? 'goods', amt: p.amt ?? 0, people: p.people ?? 0, raid: !!p.raid, hidden };
    edit((f) => ({ ...f, events: [...f.events, ev] }));
  }

  function give() {
    const data = { note: gift.note.trim() };
    for (const res of RES) {
      const n = Math.floor(Number(gift[res]) || 0);
      if (n) data[res] = n;
    }
    order('award', data);
    setGift({ wood: '', stone: '', metal: '', empyrium: '', goods: '', note: '' });
  }

  const ahead = fief.events.filter((e) => e.day > today).sort((a, b) => a.day - b.day);

  return (
    <div className="fief-panel-body">
      <Head eyebrow="Game Master" title={`The town of ${fief.name}`} />
      <p className="fief-small fief-muted">
        Add a person, raise a building of your own, pin what is coming or change a rule. Click any building or person to
        rewrite their card and give them a picture.
      </p>

      <div className="fief-sub fief-edit">
        <h4>The town&apos;s name</h4>
        <div className="fief-row">
          <input className="form-input" aria-label="The town's name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          <button type="button" className="btn btn-sm" disabled={!name.trim() || name.trim() === fief.name} onClick={() => edit((f) => ({ ...f, name: name.trim() }))}>
            Rename
          </button>
        </div>
      </div>

      <div className="fief-sub fief-edit">
        <h4>Add a person</h4>
        <label className="form-label" htmlFor="fg-tpl">
          From a template
        </label>
        <select id="fg-tpl" className="form-input" value={tpl} onChange={(e) => setTpl(e.target.value)}>
          <option value="">Someone of my own</option>
          {TEMPLATES.map(([role], i) => (
            <option key={role} value={i}>
              {role}
            </option>
          ))}
        </select>
        <label className="form-label" htmlFor="fg-name">
          Name, or leave it for a generated one
        </label>
        <input id="fg-name" className="form-input" value={pname} maxLength={60} placeholder="A generated name" onChange={(e) => setPname(e.target.value)} />
        {tpl === '' && (
          <>
            <label className="form-label" htmlFor="fg-role">
              Role
            </label>
            <input id="fg-role" className="form-input" value={prole} maxLength={60} placeholder="Smuggler" onChange={(e) => setProle(e.target.value)} />
          </>
        )}
        <label className="form-label" htmlFor="fg-where">
          Where
        </label>
        <select id="fg-where" className="form-input" value={addTo ?? ''} onChange={(e) => setAddTo(e.target.value || null)}>
          <option value="">At large in the town</option>
          {spots.map((x) => (
            <option key={x.id} value={x.id}>
              {town.titleOf(x)}
            </option>
          ))}
        </select>
        <div className="fief-row">
          <button type="button" className="btn btn-copper btn-sm" onClick={addPerson}>
            Add the person
          </button>
        </div>
      </div>

      <div className="fief-sub fief-edit">
        <h4>Raise a building of your own</h4>
        <label className="form-label" htmlFor="fg-cname">
          Name
        </label>
        <input id="fg-cname" className="form-input" value={cname} maxLength={60} placeholder="The Drowned Lantern" onChange={(e) => setCname(e.target.value)} />
        <label className="form-label" htmlFor="fg-clore">
          Description
        </label>
        <textarea id="fg-clore" className="form-input" rows={3} value={clore} maxLength={800} placeholder="What it is and why it matters to the story." onChange={(e) => setClore(e.target.value)} />
        <label className="form-label" htmlFor="fg-cmodel">
          Model
        </label>
        <select id="fg-cmodel" className="form-input" value={cmodel} onChange={(e) => setCmodel(e.target.value)}>
          {CUSTOM_MODELS.map(([id, words]) => (
            <option key={id} value={id}>
              {words}
            </option>
          ))}
        </select>
        <label className="fief-check">
          <input type="checkbox" checked={cshop} onChange={(e) => setCshop(e.target.checked)} /> It is a shop the party can buy from
        </label>
        <div className="fief-row">
          <button type="button" className="btn btn-copper btn-sm" onClick={() => onCustom({ title: cname.trim(), lore: clore.trim(), model: cmodel, shop: cshop })}>
            Place it on the board
          </button>
        </div>
        <p className="fief-small fief-muted">It costs nothing, takes no builders and goes on any free hex of dry land. Stock its shelf from its card.</p>
      </div>

      <div className="fief-sub fief-edit">
        <h4>Pin an event</h4>
        <div className="fief-grid2">
          <div>
            <label className="form-label" htmlFor="fg-ev">
              What
            </label>
            <select id="fg-ev" className="form-input" value={preset} onChange={(e) => setPreset(e.target.value)}>
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="fg-in">
              In how many days
            </label>
            <input id="fg-in" className="form-input" type="number" min={1} max={365} value={inDays} onChange={(e) => setInDays(e.target.value)} />
          </div>
        </div>
        <label className="fief-check">
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} /> Hidden from the players until it lands
        </label>
        <div className="fief-row">
          <button type="button" className="btn btn-copper btn-sm" onClick={pin}>
            Pin it
          </button>
        </div>
        {ahead.length > 0 && (
          <ul className="fief-events">
            {ahead.map((e) => (
              <li key={e.id}>
                <span>
                  <b>{dateOf(e.day)}</b> · {e.title}
                  {e.hidden ? ' · hidden' : ''}
                </span>
                <button type="button" className="btn btn-minimal btn-sm" onClick={() => edit((f) => ({ ...f, events: f.events.filter((x) => x.id !== e.id) }))}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fief-sub fief-edit">
        <h4>Give the town something</h4>
        <div className="fief-grid3">
          {RES.map((res) => (
            <div key={res}>
              <label className="form-label" htmlFor={`fg-g-${res}`}>
                {res}
              </label>
              <input id={`fg-g-${res}`} className="form-input" type="number" value={gift[res]} onChange={(e) => setGift((g) => ({ ...g, [res]: e.target.value }))} />
            </div>
          ))}
        </div>
        <label className="form-label" htmlFor="fg-g-note">
          What it was
        </label>
        <input id="fg-g-note" className="form-input" value={gift.note} maxLength={60} placeholder="Loot from the barrow" onChange={(e) => setGift((g) => ({ ...g, note: e.target.value }))} />
        <div className="fief-row">
          <button type="button" className="btn btn-copper btn-sm" onClick={give}>
            Give it
          </button>
        </div>
        <p className="fief-small fief-muted">A minus takes it away. The stores take no more than they hold.</p>
      </div>

      <div className="fief-sub fief-edit">
        <h4>Rules</h4>
        <div className="fief-grid2">
          {[
            ['arrive', 'Arrivals, % of the free room'],
            ['work', 'Share who work, %'],
            ['builders', 'Builders a project'],
            ['perHouse', 'People a house hex'],
            ['perQol', 'People a point of quality of life'],
          ].map(([k, label]) => (
            <div key={k}>
              <label className="form-label" htmlFor={`fg-r-${k}`}>
                {label}
              </label>
              <input
                id={`fg-r-${k}`}
                className="form-input"
                type="number"
                min={RULE_LIMITS[k][0]}
                max={RULE_LIMITS[k][1]}
                value={rules[k]}
                onChange={(e) => setRules((r) => ({ ...r, [k]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="fief-row">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => order('rules', { rules: Object.fromEntries(Object.entries(rules).map(([k, v]) => [k, Math.floor(Number(v) || 0)])) })}
          >
            Change the rules from today
          </button>
        </div>
        <p className="fief-small fief-muted">A rule changes from the day it is changed on, never before it.</p>
      </div>

      <div className="fief-sub">
        <h4>Resting in the town</h4>
        <p className="fief-small">{townRestWords(town.tavernTier())}</p>
        <p className="fief-small fief-muted">Call the rest from the Calendar tab and tick that the party rests in the town.</p>
      </div>

      <div className="fief-sub">
        <h4>The Keep&apos;s levels</h4>
        <p className="fief-small">
          The Keep at level 2 costs {listJoin(Object.entries(KEEP_UP[2].cost).map(([r, n]) => `${num(n)} ${r}`))} and{' '}
          {KEEP_UP[2].days} days. The Castle costs {listJoin(Object.entries(KEEP_UP[3].cost).map(([r, n]) => `${num(n)} ${r}`))}{' '}
          and {KEEP_UP[3].days} days.
        </p>
      </div>
    </div>
  );
}
