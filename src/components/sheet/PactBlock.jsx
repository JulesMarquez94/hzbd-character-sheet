import { useState } from 'react';
import Modal from '../Modal.jsx';
import { ClaimBoonWindow, PactWindow } from './PactPick.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useCardStack } from '../../context/card-stack.js';
import { appendLedger, formatNumber, newLedgerId } from '../../lib/characterModel.js';
import { getItem, heldItem, normalizePack, pruneForged } from '../../lib/items.js';
import {
  PACT_NOTE_MAX,
  PACT_TITLE_MAX,
  abandonMission,
  addPactProgress,
  completeMission,
  createMission,
  pactState,
  tallySouls,
} from '../../lib/pact.js';

/**
 * The pact's own Character-tab block, there for as long as the set is held.
 *
 * Laid out the way the designer described it: the rank and the chosen pact at
 * the top, the XP-style bar under them, the claim button the moment the bar
 * fills, a line announcing the next boon, then the mission tracker — the one
 * built-in action (tally souls, or offer tribute) and up to two standing
 * missions with a button to write another.
 *
 * The bar itself opens the pact's ledger, the way the XP meter opens the XP
 * one: every feeding, boon and mission is a row with a note, newest first.
 *
 * The same hard 360x640 as every block, and it does not scroll: the block's
 * contents are bounded (two missions at most, everything else one row each).
 */
export default function PactBlock({ character, pact, patch, readOnly = false }) {
  const [showing, setShowing] = useState(null); // 'seal' | 'claim' | 'feed' | 'mission' | 'log'
  const stack = useCardStack();

  /* Re-read rather than trusted: the block's windows write while it is open. */
  const state = pactState(character).find((row) => row.id === pact.id) ?? pact;
  const { spec, kind, bars, boons, rank } = state;

  const weapon = state.weapon ? heldItem(character, state.weapon.id) : null;
  const ladder = (spec.boons ?? []).length;

  const percent = bars.need > 0 ? Math.min(100, (bars.into / bars.need) * 100) : 0;
  const missionsMax = Math.max(1, Math.floor(Number(spec.missions?.max) || 2));

  return (
    <div className="cell-scroll pact-block">
      <div className="block-head">
        <span className="stat-category-label">{state.talent.name}</span>
        <span className="spacer" />
        <span className="block-count">Rank {rank}</span>
      </div>

      {/* ---- the bargain and the blade ---- */}
      <div className="pact-id">
        <span className="pact-id-kind">{kind ? kind.label : 'No bargain struck yet'}</span>
        {weapon ? (
          <span className="pact-id-weapon">
            {getItem(state.weapon.base)?.name ?? weapon.name}
            <button
              type="button"
              className="icon-btn pact-form-info"
              onClick={() => stack?.openItem(weapon)}
              title={`Read ${weapon.name}`}
            >
              ⓘ
            </button>
          </span>
        ) : (
          <span className="pact-id-weapon pact-id-open">No weapon bound yet</span>
        )}
      </div>

      {!state.sealed && (
        <>
          <p className="pact-line">
            The pact is not sealed. Choose your bargain, the weapon&rsquo;s form and your first two
            boons.
          </p>
          {!readOnly && (
            <div className="pick-tools pick-tools-tight">
              <button type="button" className="btn btn-copper btn-sm" onClick={() => setShowing('seal')}>
                Seal your pact
              </button>
            </div>
          )}
        </>
      )}

      {/* ---- the bar ---- */}
      {kind && (
        <button
          type="button"
          className="meter meter-pact"
          onClick={() => setShowing('log')}
          title="Every feeding, boon and mission, newest first"
        >
          <span className="meter-head">
            <span className="meter-label">Progress</span>
            <span className="meter-value" style={{ color: 'var(--level-amber)' }}>
              {formatNumber(bars.into)} / {formatNumber(bars.need)} {kind.unit}
            </span>
          </span>
          <span className="bar-track bar-track-tall">
            <span className="bar-fill bar-fill-pact" style={{ width: `${percent}%` }} />
          </span>
          <span className="meter-foot">
            {bars.filled} {bars.filled === 1 ? 'bar' : 'bars'} filled
            {state.loopOpen || bars.filled > ladder
              ? ' · the bargain is endless'
              : ` · ${ladder - bars.filled} to fill`}
          </span>
        </button>
      )}

      {/* ---- the claim, the moment there is one ---- */}
      {state.claimable && !readOnly && (
        <button type="button" className="btn btn-copper pact-claim" onClick={() => setShowing('claim')}>
          Claim a boon{state.pending > 1 ? ` · ${state.pending} waiting` : ''}
        </button>
      )}

      {kind && (
        <p className="pact-line pact-next">
          {state.pending > 0 && !state.claimable
            ? `A bar is full. The next boon needs Rank ${(boons.find((one) => one.state === 'locked') ?? {}).boon?.rank ?? rank + 1}.`
            : state.nextBoon
              ? `Next boon: ${state.nextBoon.label.charAt(0).toLowerCase()}${state.nextBoon.label.slice(1)}`
              : state.loopOpen
                ? 'Endless bargain: any spell or any Martial Move.'
                : 'Every boon this rank offers is claimed.'}
        </p>
      )}

      {/* ---- the missions ---- */}
      {kind && (
        <>
          <div className="block-head">
            <span className="stat-category-label">Missions</span>
            <span className="spacer" />
            <span className="block-count">
              {state.missions.length} / {missionsMax}
            </span>
          </div>

          {!readOnly && (
            <div className="pick-tools pick-tools-tight">
              <button type="button" className="btn btn-sub btn-sm" onClick={() => setShowing('feed')}>
                {kind.verb}
              </button>
              <button
                type="button"
                className="btn btn-minimal btn-sm"
                onClick={() => setShowing('mission')}
                disabled={state.missions.length >= missionsMax}
                title={
                  state.missions.length >= missionsMax
                    ? `At most ${missionsMax} missions stand at once. Finish or abandon one first.`
                    : 'Write down an errand the pact giver offered, and what it is worth'
                }
              >
                Create a mission
              </button>
            </div>
          )}

          {state.missions.map((mission) => (
            <div className="pact-mission" key={mission.id}>
              <span className="pact-mission-head">
                <span className="pact-mission-title">{mission.title}</span>
                <span className="pact-mission-worth">
                  +{formatNumber(mission.value)} {kind.unit}
                </span>
              </span>
              {mission.body && <span className="pact-mission-body">{mission.body}</span>}
              {!readOnly && (
                <span className="pact-mission-tools">
                  <button
                    type="button"
                    className="btn btn-take btn-sm"
                    onClick={() => patch(completeMission(character, state, mission.id))}
                    title={`Done. ${formatNumber(mission.value)} ${kind.unit} feed the pact.`}
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    className="btn btn-minimal btn-sm talent-drop"
                    onClick={() => patch(abandonMission(character, state, mission.id))}
                    title="Given up. Nothing feeds the pact."
                  >
                    Abandon
                  </button>
                </span>
              )}
            </div>
          ))}

          {state.missions.length === 0 && (
            <p className="pact-line pact-line-quiet">
              No missions stand. The pact giver may offer one, worth a set amount of progress.
            </p>
          )}
        </>
      )}

      {/* ---- the windows ---- */}
      {showing === 'seal' && (
        <PactWindow
          character={character}
          state={state}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setShowing(null)}
        />
      )}

      {showing === 'claim' && (
        <ClaimBoonWindow
          character={character}
          state={state}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setShowing(null)}
        />
      )}

      {showing === 'feed' && kind?.id === 'souls' && (
        <SoulTally character={character} state={state} patch={patch} onClose={() => setShowing(null)} />
      )}

      {showing === 'feed' && kind?.id === 'collector' && (
        <Tribute character={character} state={state} patch={patch} onClose={() => setShowing(null)} />
      )}

      {showing === 'mission' && (
        <MissionForm character={character} state={state} patch={patch} onClose={() => setShowing(null)} />
      )}

      {showing === 'log' && <PactLedger state={state} onClose={() => setShowing(null)} />}
    </div>
  );
}

/* -------------------------------------------------------------- the feeding */

/**
 * The Soulreaping Pact's tally: how many died carrying your damage, and what
 * level they were. A soul is worth its level, so two level 4 kills are worth 8.
 * Mixed levels are two tallies.
 */
function SoulTally({ character, state, patch, onClose }) {
  const [count, setCount] = useState('1');
  const [level, setLevel] = useState('1');
  const [note, setNote] = useState('');

  const heads = Math.max(0, Math.floor(Number(count) || 0));
  const worth = Math.max(1, Math.floor(Number(level) || 1));
  const fed = heads * worth;

  return (
    <Modal
      title="Tally souls"
      onClose={onClose}
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className="pick-count">{fed > 0 ? `Feeds the pact ${fed} souls` : 'Nothing yet'}</span>
          <span className="spacer" />
          <button
            type="button"
            className="btn btn-take btn-sm"
            disabled={fed <= 0}
            onClick={() => {
              patch(tallySouls(character, state, heads, worth, note.trim()));
              onClose();
            }}
          >
            Tally them
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        Entities that died carrying your damage, at the level they died. A soul is worth its level.
        Mixed levels are two tallies.
      </p>
      <div className="pact-feed-form">
        <label className="form-label">
          How many
          <input
            className="form-input"
            type="number"
            min="1"
            value={count}
            onChange={(event) => setCount(event.target.value)}
          />
        </label>
        <label className="form-label">
          Their level
          <input
            className="form-input"
            type="number"
            min="1"
            value={level}
            onChange={(event) => setLevel(event.target.value)}
          />
        </label>
        <label className="form-label">
          A note, if it is worth remembering
          <input
            className="form-input"
            maxLength={PACT_NOTE_MAX}
            placeholder="the toll bridge ambush"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      </div>
    </Modal>
  );
}

/**
 * The Collector's Pact's tribute: coin out of the purse, or a thing of value
 * out of the pack, given up forever. An item feeds the pact its price, and the
 * item itself is gone — sacrificed, not stored.
 */
function Tribute({ character, state, patch, onClose }) {
  const [mode, setMode] = useState('coins');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [giving, setGiving] = useState(null); // index into the pack

  const wealth = Math.max(0, Math.floor(Number(character.wealth) || 0));
  const coins = Math.max(0, Math.floor(Number(amount) || 0));
  const short = coins > wealth;

  const pack = normalizePack(character.pack);
  /* What the pack holds that is worth anything: codex and forged pieces with a
     price. A custom item has no price the sheet knows, so it cannot feed the
     pact from here — the GM prices those as a mission instead. */
  const valuables = pack
    .map((entry, index) => ({ item: heldItem(character, typeof entry === 'string' ? entry : null), index }))
    .filter(({ item }) => item && Math.floor(Number(item.cost) || 0) > 0);

  const chosen = giving !== null ? valuables.find(({ index }) => index === giving) : null;

  function giveCoins() {
    const body = addPactProgress(character, state, coins, {
      kind: 'coins',
      note: note.trim() || 'Tribute to the pact',
    });
    if (!body) return;
    body.wealth = wealth - coins;
    body.ledger = appendLedger(character, {
      id: newLedgerId(),
      ts: new Date().toISOString(),
      kind: 'wealth',
      delta: -coins,
      note: 'Tribute to the pact',
      balance: wealth - coins,
    });
    patch(body);
    onClose();
  }

  function giveItem() {
    if (!chosen) return;
    const worth = Math.floor(Number(chosen.item.cost) || 0);
    const body = addPactProgress(character, state, worth, {
      kind: 'item',
      note: `${chosen.item.name} given up`,
    });
    if (!body) return;

    const next = [...pack];
    next.splice(chosen.index, 1);
    body.pack = next;

    /* A forged piece dies with its last holder, exactly as a discard does. */
    const forged = pruneForged(character, body);
    if (forged) body.forged = forged;

    patch(body);
    onClose();
  }

  return (
    <Modal
      title="Offer tribute"
      onClose={onClose}
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className={`pick-count${mode === 'coins' && short ? ' is-open' : ''}`}>
            {mode === 'coins'
              ? short
                ? `The purse holds ${formatNumber(wealth)}`
                : coins > 0
                  ? `Feeds the pact ${formatNumber(coins)} coins`
                  : 'Nothing yet'
              : chosen
                ? `Feeds the pact ${formatNumber(chosen.item.cost)} coins`
                : 'Nothing chosen yet'}
          </span>
          <span className="spacer" />
          <button
            type="button"
            className="btn btn-take btn-sm"
            disabled={mode === 'coins' ? coins <= 0 || short : !chosen}
            onClick={mode === 'coins' ? giveCoins : giveItem}
          >
            Give it up
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        Given up forever, not spent. Coin leaves the purse through the ledger, and an item leaves the
        sheet for good, feeding the pact its price.
      </p>

      <div className="filter-group pact-modes">
        <button
          type="button"
          className={`filter-chip${mode === 'coins' ? ' active' : ''}`}
          onClick={() => setMode('coins')}
        >
          Coins
        </button>
        <button
          type="button"
          className={`filter-chip${mode === 'item' ? ' active' : ''}`}
          onClick={() => setMode('item')}
        >
          An item of value
        </button>
      </div>

      {mode === 'coins' ? (
        <div className="pact-feed-form">
          <label className="form-label">
            How much
            <input
              className="form-input"
              type="number"
              min="1"
              max={wealth}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <label className="form-label">
            A note, if it is worth remembering
            <input
              className="form-input"
              maxLength={PACT_NOTE_MAX}
              placeholder="the ransom, burned"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
        </div>
      ) : valuables.length > 0 ? (
        <div className="pact-valuables">
          {valuables.map(({ item, index }) => (
            <button
              key={`${item.id}-${index}`}
              type="button"
              className={`pact-valuable${giving === index ? ' is-on' : ''}`}
              onClick={() => setGiving(index)}
            >
              <span className="pact-valuable-name">{item.name}</span>
              <span className="pact-valuable-worth">{formatNumber(item.cost)} coins</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="pick-line">
          Nothing in your inventory has a price the sheet knows. A thing the codex has not priced is
          the Game Master&rsquo;s to value. Offer it as a mission instead.
        </p>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------- the mission */

/** The pact giver's errand, written down: a title, what it asks and what it pays. */
function MissionForm({ character, state, patch, onClose }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [value, setValue] = useState('');

  const worth = Math.max(0, Math.floor(Number(value) || 0));
  const ready = title.trim().length > 0 && worth > 0;

  return (
    <Modal
      title="Create a mission"
      onClose={onClose}
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className={`pick-count${ready ? '' : ' is-open'}`}>
            {ready
              ? `Worth ${formatNumber(worth)} ${state.kind?.unit ?? ''}`
              : 'Needs a title and a reward'}
          </span>
          <span className="spacer" />
          <button
            type="button"
            className="btn btn-take btn-sm"
            disabled={!ready}
            onClick={() => {
              patch(createMission(character, state, { title, body, value: worth }));
              onClose();
            }}
          >
            Write it down
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        An errand the pact giver offered, in its own voice at the table. Completing it feeds the pact
        the reward; abandoning it feeds nothing.
      </p>
      <div className="pact-feed-form">
        <label className="form-label">
          Title
          <input
            className="form-input"
            maxLength={PACT_TITLE_MAX}
            placeholder="Bring it the bandit chief"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="form-label">
          What it asks
          <textarea
            className="form-input pact-mission-input"
            maxLength={400}
            rows={3}
            placeholder="In the pact giver's own words."
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <label className="form-label">
          Reward, in {state.kind?.unit ?? 'progress'}
          <input
            className="form-input"
            type="number"
            min="1"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
      </div>
    </Modal>
  );
}

/* --------------------------------------------------------------- the ledger */

/** Every feeding, boon and mission, newest first. The pact's own changelog. */
function PactLedger({ state, onClose }) {
  return (
    <Modal title={`${state.talent.name}: the ledger`} onClose={onClose} accent={PICK_ACCENTS.talent}>
      <p className="frame-foot" style={{ marginTop: 0 }}>
        Lifetime progress: {formatNumber(state.bars.total)} {state.kind?.unit ?? ''}. Every movement,
        newest first.
      </p>
      {state.log.length === 0 ? (
        <p className="pick-line">Nothing yet. The pact is waiting to be fed.</p>
      ) : (
        <ul className="pact-log">
          {state.log.map((entry) => (
            <li className="pact-log-row" key={entry.id}>
              <span className={`pact-log-delta${entry.delta > 0 ? ' is-gain' : ''}`}>
                {entry.delta > 0 ? `+${formatNumber(entry.delta)}` : '·'}
              </span>
              <span className="pact-log-note">{entry.note}</span>
              <span className="pact-log-when">{entry.ts ? entry.ts.slice(0, 10) : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
