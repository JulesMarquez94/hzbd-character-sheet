import { useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import { LoadoutChooser } from './LoadoutPick.jsx';
import EnchantAction from './EnchantRest.jsx';
import WornEnchants from './WornEnchants.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { formatNumber } from '../../lib/characterModel.js';
import { enchantChanges } from '../../lib/enchanting.js';
import { heldItem } from '../../lib/items.js';
import { getEnchantment } from '../../lib/enchantments.js';
import { getRest, labourAffordable, restActions, restPlan } from '../../lib/rest.js';
import { pickChanges, toggleLoadoutPick } from '../../lib/loadouts.js';
import { setTalentPicks } from '../../lib/talents.js';

/**
 * Taking a rest, said out loud before it happens.
 *
 * A rest moves several pools at once and ends several effects at once, which
 * makes it the one thing on the sheet most worth reading before confirming. So
 * the window is the plan: every line the rest is about to write, in the order it
 * writes them, with the crate's balance underneath. Nothing is guessed at after
 * the fact.
 *
 * ------------------------------------------------------------------ one slot
 * And under the plan, **one action slot**, because a rest buys one action. The
 * Status & Terms tab has always said so — "allows you to perform 1 Long Rest
 * Action" — and this window used not to: it offered the work of the camp, the
 * Enchanter's laying, the Enchanter's own person and every set's prepared hand
 * as four standing sections, each policing its own limit and none of them
 * policing that one. A night could craft a potion, enchant two weapons, change
 * what it wore and re-prepare a whole hand.
 *
 * So the sections are gone. The slot is empty, you open it, you pick one thing
 * out of a list of everything you could do tonight, you do that thing, and you
 * come back here to see it written into the plan with everything else. Jules
 * described the walk exactly (2026-08-20): "take long rest > Choose Long Rest
 * Action > Change Wielder of Wonder Enchant > select new one > back to long rest
 * overview (now you can see what you're doing here) > accept."
 *
 * What may go in the slot is `restActions` in rest.js, and that is the only place
 * that knows. This file draws a list of them, raises the right step for whichever
 * one is picked, and says what the slot now holds.
 *
 * --------------------------------------------------------- nothing is written
 * Every step writes into this window's own `talents` draft and its own `chosen`
 * labour, and nothing else. The plan prices both and prints them as lines among
 * everything else the rest does; only "Yes, rest" commits any of it. Backing out
 * of the rest is an evening's work not done, with the Supplies still in the
 * crate. Clearing the slot rolls the draft back the same way.
 */
export default function RestPrompt({ kind, character, onRest, onClose }) {
  const rest = getRest(kind);
  const stack = useCardStack();

  /* Which action this rest is being spent on, or null for a night's plain
     sleep. One, and only one: picking a second replaces the first, and clearing
     it takes back whatever it had written into the draft.

     Held as an **id** rather than as the row itself. `restActions` is derived
     from the draft, so every choice made inside a step rebuilds the list — and a
     row captured in state before that would be the state of things one edit ago.
     A chooser handed a stale `state` shows the pick you just made as not made. */
  const [actionId, setActionId] = useState(null);
  /* The amount a labour was taken at, when the slot holds one. */
  const [chosen, setChosen] = useState(null);
  /* The talents column as this window has re-prepared it, or null while it is
     untouched. */
  const [prepared, setPrepared] = useState(null);

  /* Whether the list of actions is up, and which one's step is. */
  const [menu, setMenu] = useState(false);
  const [stepId, setStepId] = useState(null);

  const talents = prepared ?? character.talents;

  const actions = useMemo(
    () => restActions(character, kind, talents),
    [character, kind, talents]
  );

  const action = actions.find((row) => row.id === actionId) ?? null;
  const step = actions.find((row) => row.id === stepId) ?? null;

  /* The plan reads the draft, so the lines under "What it does" change as the
     action is carried out. `picked` is at most one row, which is the whole
     rule. */
  const picked = useMemo(() => (chosen ? [chosen] : []), [chosen]);
  const plan = useMemo(
    () => restPlan(character, kind, picked, prepared),
    [character, kind, picked, prepared]
  );

  /** Take the slot back, and everything the action had written into the draft. */
  function clearAction() {
    setActionId(null);
    setChosen(null);
    setPrepared(null);
  }

  /** Fill the slot. Whatever was in it, and whatever it did, goes first. */
  function take(row, amount = null) {
    setChosen(amount ? { card: row.card, amount: amount.amount, gain: amount.gain } : null);
    // A different action means the last one's work is given back, not added to.
    setPrepared(null);
    setActionId(row.id);

    setMenu(false);
    // A labour is finished the moment its amount is chosen; the rest need a step.
    if (row.kind !== 'labour') setStepId(row.id);
  }

  if (!rest || !plan) return null;

  const held = action ? summarise(action, { chosen, character, talents }) : null;

  return (
    <Modal
      title={menu ? `${rest.label}: choose your action` : `Take a ${rest.label}`}
      onClose={menu ? () => setMenu(false) : onClose}
      wide={kind === 'long'}
      footer={
        menu ? (
          <>
            <button type="button" className="btn btn-minimal btn-sm" onClick={() => setMenu(false)}>
              ← Back to the rest
            </button>
            <span className="spacer" />
            {action && (
              <button
                type="button"
                className="btn btn-minimal btn-sm"
                onClick={() => {
                  clearAction();
                  setMenu(false);
                }}
              >
                Do nothing tonight
              </button>
            )}
          </>
        ) : (
          <>
            <span className="spacer" />
            <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-copper btn-sm"
              onClick={() => {
                onRest(plan.patch);
                onClose();
              }}
              disabled={!plan.affordable}
              title={
                plan.affordable
                  ? undefined
                  : `${plan.short} more Supplies than the crate holds. Nothing about this rest happens.`
              }
            >
              Yes, rest
            </button>
          </>
        )
      }
    >
      {menu ? (
        <ActionMenu
          actions={actions}
          action={action}
          character={character}
          kind={kind}
          onTake={take}
          onRead={(card) => stack?.openCard(card)}
        />
      ) : (
        <div className="rest-prompt">
          <p className="rest-blurb">{rest.blurb}</p>

          <span className="fx-label">What it does</span>
          <ul className="rest-lines">
            {plan.lines.map((line) => (
              <li className={`rest-line rest-line-${line.tone}`} key={line.key}>
                <span className="rest-line-label">{line.label}</span>
                <span className="rest-line-detail">{line.detail}</span>
              </li>
            ))}
          </ul>

          <div className={`rest-crate${plan.affordable ? '' : ' is-short'}`}>
            <span className="rest-crate-label">Supplies after</span>
            <span className="rest-crate-value">
              {plan.affordable
                ? `${formatNumber(character.supplies)} to ${formatNumber(plan.supplies)}`
                : `${formatNumber(character.supplies)}, and ${formatNumber(plan.short)} short`}
            </span>
          </div>

          {!plan.affordable && (
            <p className="rest-refused" role="alert">
              <b>You cannot afford this.</b> A rest is paid for out of the crate, and yours does not
              hold enough. Nothing here happens: no Supplies move, nothing is restored and nothing
              ends. Find {formatNumber(plan.short)} more first
              {action ? ', or spend the night on something cheaper' : ''}.
            </p>
          )}

          {/* ---------- THE ACTION SLOT ---------- *
              One, because a rest buys one. Empty until you open it, and after
              that it says what you are doing and offers the two ways out of it:
              go back into it, or give the night back. */}
          {actions.length > 0 && (
            <>
              <span className="fx-label">
                Your {rest.label} action
                <span className="rest-labour-rule">One, and only one</span>
              </span>

              {action ? (
                <div className="rest-slot is-filled">
                  <button
                    type="button"
                    className="rest-slot-body"
                    onClick={() => (action.kind === 'labour' ? setMenu(true) : setStepId(action.id))}
                    title={`Go back into ${action.label}`}
                  >
                    <span className="rest-slot-name">{action.label}</span>
                    <span className="rest-slot-from">{action.from}</span>
                    <span className={`rest-slot-did${held.done ? '' : ' is-open'}`}>{held.says}</span>
                  </button>

                  <span className="rest-slot-tools">
                    <button
                      type="button"
                      className="rest-opt"
                      onClick={() => (action.kind === 'labour' ? setMenu(true) : setStepId(action.id))}
                    >
                      {held.done ? 'Change' : 'Choose'}
                    </button>
                    <button type="button" className="rest-opt" onClick={clearAction}>
                      Clear
                    </button>
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  className="rest-slot rest-slot-empty"
                  onClick={() => setMenu(true)}
                >
                  <span className="rest-slot-plus" aria-hidden="true">
                    +
                  </span>
                  <span className="rest-slot-name">Choose your {rest.label.toLowerCase()} action</span>
                  <span className="rest-slot-from">
                    {actions.length} {actions.length === 1 ? 'thing' : 'things'} you could do tonight
                  </span>
                </button>
              )}
            </>
          )}

          {actions.length > 0 && !action && (
            <p className="pick-line">
              A rest with nothing chosen is still a rest. Everything above happens either way.
            </p>
          )}
        </div>
      )}

      {/* ---------- the steps ----------
          Each one is the very chooser its own part of the sheet already raises,
          writing into this window's draft instead of into the character. Closing
          one lands back on the overview with the slot filled. */}
      {step?.kind === 'prepare' && (
        <LoadoutChooser
          talent={step.talent}
          character={character}
          state={step.state}
          onToggle={(cardId) =>
            setPrepared(toggleLoadoutPick(talents, step.talent.id, cardId, step.state.known))
          }
          onClear={() => setPrepared(setTalentPicks(talents, step.talent.id, []))}
          onClose={() => setStepId(null)}
        />
      )}

      {step?.kind === 'enchant' && (
        <EnchantAction
          character={character}
          talents={talents}
          kind={kind}
          onDraft={setPrepared}
          onClose={() => setStepId(null)}
        />
      )}

      {step?.kind === 'worn' && (
        <Modal
          title="On your own person"
          onClose={() => setStepId(null)}
          wide
          footer={
            <>
              <span className="spacer" />
              <button
                type="button"
                className="btn btn-take btn-sm"
                onClick={() => setStepId(null)}
              >
                ← Back to the rest
              </button>
            </>
          }
        >
          <p className="frame-foot" style={{ marginTop: 0 }}>
            Wielder of Wonder: what an Enchanter carries on themselves rather than on a thing.
            Changed at a Long Rest and never priced, because the card names no price for it. Take
            one off to make room for another.
          </p>
          <WornEnchants character={character} talents={talents} onChange={setPrepared} tone="rest" />
        </Modal>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ the menu */

/**
 * Everything tonight could be spent on, in one list.
 *
 * Grouped by where it came from, because the answer to "what can I do" is
 * shorter to read when the three or four things a set gives you sit together.
 * A labour is picked at an amount, so its amounts are the buttons; everything
 * else opens its own step and is picked by the row.
 */
function ActionMenu({ actions, action, character, kind, onTake, onRead }) {
  const groups = [];
  for (const row of actions) {
    const group = groups.find((entry) => entry.from === row.from);
    if (group) group.rows.push(row);
    else groups.push({ from: row.from, rows: [row] });
  }

  return (
    <div className="rest-prompt">
      <p className="rest-blurb">
        One of these, and only one. Whichever you pick is written into the plan behind this, where
        you can read it before anything is spent.
      </p>

      {groups.map((group) => (
        <section key={group.from}>
          <span className="fx-label">{group.from}</span>

          <div className="rest-labours">
            {group.rows.map((row) => (
              <div
                className={`rest-labour${action?.id === row.id ? ' is-chosen' : ''}`}
                key={row.id}
              >
                <button
                  type="button"
                  className="rest-labour-head"
                  onClick={() =>
                    row.kind === 'labour' && row.card
                      ? onRead(row.card)
                      : onTake(row)
                  }
                  title={
                    row.kind === 'labour' ? `${row.label} — read the card` : `Do this: ${row.label}`
                  }
                >
                  <span className="rest-labour-name">{row.label}</span>
                  {row.note && <span className="rest-labour-line">{row.note}</span>}
                </button>

                <span className="rest-labour-opts">
                  {row.kind === 'labour' ? (
                    row.options.length === 0 ? (
                      <span className="rest-labour-none">
                        No set price. Move the crate by hand.
                      </span>
                    ) : (
                      row.options.map((option) => {
                        /* Priced against the crate *after* the rest itself, so a
                           chip you could never pay for is offered dead rather
                           than failing at the last button. */
                        const affordable = labourAffordable(character, kind, option);

                        return (
                          <button
                            type="button"
                            key={`${option.amount}-${option.gain}`}
                            className={`rest-opt${option.gain ? ' is-gain' : ''}`}
                            disabled={!affordable}
                            onClick={() => onTake(row, option)}
                            title={
                              affordable
                                ? `${row.label} for ${option.amount} Supplies`
                                : `${option.amount} Supplies is more than the crate holds once the rest is paid for`
                            }
                          >
                            {option.gain ? '+' : '−'}
                            {option.amount}
                          </button>
                        );
                      })
                    )
                  ) : (
                    <button type="button" className="rest-opt is-gain" onClick={() => onTake(row)}>
                      Do this
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- the slot */

/**
 * What the slot says it is holding: the action's own name, and one line of what
 * it has actually done so far.
 *
 * `done` is the difference between a slot that has been filled and one that has
 * been *carried out*. Picking "Enchant an item" and closing the shelf without
 * laying anything leaves the slot open, and it says so rather than reading as a
 * night's work finished.
 */
function summarise(action, { chosen, character, talents }) {
  if (action.kind === 'labour') {
    return chosen
      ? { done: true, says: `${chosen.gain ? '+' : '−'}${chosen.amount} Supplies` }
      : { done: false, says: 'No amount chosen yet' };
  }

  if (action.kind === 'prepare') {
    const change = pickChanges(character.talents, talents).find(
      (row) => row.talent.id === action.talent.id
    );
    if (!change) return { done: false, says: 'Nothing changed yet' };

    const said = [];
    if (change.dropped.length > 0) said.push(`${listOut(change.dropped)} put down`);
    if (change.learned.length > 0) said.push(`${listOut(change.learned)} taken up`);
    return { done: true, says: said.join(', ') };
  }

  const changes = enchantChanges(character.talents, talents);

  if (action.kind === 'worn') {
    const said = [];
    if (changes.wornDropped.length > 0) {
      said.push(`${listOut(changes.wornDropped.map(enchantName))} taken off`);
    }
    if (changes.wornAdded.length > 0) {
      said.push(`${listOut(changes.wornAdded.map(enchantName))} put on`);
    }
    return said.length > 0
      ? { done: true, says: said.join(', ') }
      : { done: false, says: 'Nothing changed yet' };
  }

  const said = [];
  for (const row of changes.laidDropped) {
    said.push(`${enchantName(row.id)} stripped off ${itemName(character, row.itemId)}`);
  }
  for (const row of changes.laidAdded) {
    said.push(`${enchantName(row.id)} laid on ${itemName(character, row.itemId)}`);
  }
  return said.length > 0
    ? { done: true, says: said.join(', ') }
    : { done: false, says: 'Nothing laid yet' };
}

function enchantName(id) {
  return getEnchantment(id)?.name ?? String(id);
}

function itemName(character, id) {
  return heldItem(character, id)?.name ?? String(id);
}

/** "one, two and three". No Oxford comma. */
function listOut(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
