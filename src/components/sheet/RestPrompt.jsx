import { useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import { CostOrb } from '../CostOrbs.jsx';
import { LoadoutChooser } from './LoadoutPick.jsx';
import BrewRest from './BrewRest.jsx';
import EnchantAction from './EnchantRest.jsx';
import { PactFormWall } from './PactPick.jsx';
import RaiseWindow from './RaiseWindow.jsx';
import ScribeRest from './ScribeRest.jsx';
import { Gated } from './parts.jsx';
import WornEnchants from './WornEnchants.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { brewSummary } from '../../lib/alchemy.js';
import { formatNumber } from '../../lib/characterModel.js';
import { enchantChanges } from '../../lib/enchanting.js';
import { getItem, heldItem } from '../../lib/items.js';
import { getEnchantment } from '../../lib/enchantments.js';
import { getRest, labourAffordable, restActions, restPlan } from '../../lib/rest.js';
import { pickChanges, poolAction, poolOwing, toggleLoadoutPick } from '../../lib/loadouts.js';
import { rechargeSpend, runeRecharges } from '../../lib/runes.js';
import { scribeSummary } from '../../lib/scribing.js';
import { raiseDraft } from '../../lib/undead.js';
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
  /* And what an Alchemist has put in the still: recipe ids, one per brew. Its own
     piece of state rather than part of the draft above, because a flask is not
     something the `talents` column holds. It becomes pack entries in the rest's
     own patch. See alchemy.js. */
  const [brews, setBrews] = useState([]);
  /* And the form a pact-bound weapon is reshaping into tonight: a weapon id, or
     null while the blade keeps yesterday's shape. Its own piece of state for
     the same reason `brews` is — a weapon's form is nothing the `talents` draft
     holds. It becomes a forged-record write in the rest's own patch. */
  const [reshaped, setReshaped] = useState(null);
  /* And which fired runes a Runebearer is lighting again tonight: card ids, held
     apart from the draft above for the same reason the brews are. It is
     deliberately **not** part of the action slot and `clearAction` does not
     touch it: RECHARGED is something a Short Rest does, not something a night is
     spent on, so it sits beside the plan rather than in the slot. */
  const [revived, setRevived] = useState([]);
  /* And the body a Necromancer is standing up tonight: the whole draft the raise
     window collects, held here rather than in it so that closing the step keeps
     what was answered and the plan behind it can price the corpse. Its own piece
     of state for the same reason the brews are: a body is nothing the `talents`
     column holds. It becomes a row in the `minions` column in the rest's own
     patch. See undead.js. */
  const [raised, setRaised] = useState(null);
  /* And what a Spellquill is writing tonight: the leaves the night's action
     buys, which are permanent and paid for in Supplies.

     One draft, since 2026-09-10. There were two, and the second held the fading
     leaves this window prepared above the action slot for free. EPHEMERAL SPELL
     SCROLLS is a card you play now, off the quick bar, for Action Points and
     Willpower, so a night has nothing to prepare and nothing to ask. See
     EphemeralWindow.jsx. */
  const [scribes, setScribes] = useState([]);

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
    () =>
      restPlan(character, kind, picked, prepared, brews, reshaped, {
        revived,
        raised,
        scribes,
      }),
    [character, kind, picked, prepared, brews, reshaped, revived, raised, scribes]
  );

  /* What a Short Rest could bring back, per set that can bring anything back.
     Empty for everybody else, and empty for a Long Rest, which brings the whole
     slate back on its own. See runes.js. */
  const recharges = useMemo(() => runeRecharges(character, kind), [character, kind]);

  /** Take the slot back, and everything the action had written into the draft. */
  function clearAction() {
    setActionId(null);
    setChosen(null);
    setPrepared(null);
    setBrews([]);
    setReshaped(null);
    setRaised(null);
    setScribes([]);
  }

  /** Fill the slot. Whatever was in it, and whatever it did, goes first. */
  function take(row, amount = null) {
    setChosen(amount ? { card: row.card, amount: amount.amount, gain: amount.gain } : null);
    // A different action means the last one's work is given back, not added to.
    setPrepared(null);
    setBrews([]);
    setReshaped(null);
    setScribes([]);
    setRaised(row.kind === 'raise' ? { set: row.state.id } : null);
    setActionId(row.id);

    setMenu(false);
    // A labour is finished the moment its amount is chosen; the rest need a step.
    if (row.kind !== 'labour') setStepId(row.id);
  }

  if (!rest || !plan) return null;

  const held = action
    ? summarise(action, { chosen, character, talents, brews, reshaped, raised, scribes })
    : null;

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
            <Gated
              className="btn btn-copper btn-sm"
              onClick={() => {
                /* The write, and beside it what this rest was spent on. Only
                   the table log reads the second argument, and a caller that
                   ignores it is a caller that behaves exactly as it did. */
                onRest(plan.patch, { action: action?.label ?? null });
                onClose();
              }}
              why={
                !plan.affordable
                  ? `This rest needs ${plan.short} more Supplies than the crate holds. Restock, or take a labour off above. Nothing about the rest happens until you do.`
                  : /* And a night's action half answered, which used to be taken
                       anyway: a raising with no name was quietly dropped and the
                       night was spent on nothing. Jules, 2026-09-10, on choices
                       generally: they are made before the confirm. The slot has
                       been saying so in red the whole time, and now the confirm
                       waits with it. Both ways out are on the slot itself. */
                    held?.owing
                    ? `${held.owing} Go back into it and finish, or clear the action, and this rest goes ahead.`
                    : null
              }
            >
              Yes, rest
            </Gated>
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

          {/* ---------- WHAT LIGHTS AGAIN ---------- *
              RECHARGED: "you can bring back up to 4 of your fired runes." A
              budget spent against a list, which is the only thing a rest gives
              back that is a *choice*, so it is the only one with a chooser. Above
              the action slot because it is not one: a Short Rest buys no action
              at all, and this happens on every Short Rest a Runebearer takes.

              Held by the rune's `key` rather than by the card's id, since a slate
              may carry the same spell twice and bringing one of the two back has
              to be a thing this list can say. */}
          {recharges.map((row) => (
            <RuneRecharge
              key={row.talent.id}
              row={row}
              chosen={revived}
              onToggle={(runeKey) =>
                setRevived((held) =>
                  held.includes(runeKey) ? held.filter((one) => one !== runeKey) : [...held, runeKey]
                )
              }
            />
          ))}

          {/* ---------- gone: WHAT FADES BY MORNING ---------- *
              A Spellquill's fading leaves had a slot here, above the action,
              because EPHEMERAL SPELL SCROLLS was not one: the night prepared
              half your Mind plus your rank of them for nothing, and a night
              spent raising the dead still laid them out.

              Jules reworked the card on 2026-09-10 and it is a card you play
              now, for 2 Action Points and the spell's own rung in Willpower, so
              there is nothing for a rest to prepare. The window moved to the
              quick bar with it: see EphemeralWindow.jsx. What a night still does
              about them is sweep up yesterday's, and that has never been
              anything the player had to press. */}

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
          onToggle={(cardId, how) =>
            setPrepared(toggleLoadoutPick(talents, step.talent.id, cardId, step.state.known, how))
          }
          onClear={() => setPrepared(setTalentPicks(talents, step.talent.id, []))}
          onClose={() => setStepId(null)}
        />
      )}

      {step?.kind === 'alchemy' && (
        <BrewRest
          character={character}
          kind={kind}
          state={step.state}
          brews={brews}
          onDraft={setBrews}
          onClose={() => setStepId(null)}
        />
      )}

      {step?.kind === 'scribe' && (
        <ScribeRest
          character={character}
          kind={kind}
          state={step.state}
          draft={scribes}
          onDraft={setScribes}
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

      {step?.kind === 'pact' && (
        <Modal
          title="Reshape your pact-bound weapon"
          onClose={() => setStepId(null)}
          size="page"
          footer={
            <>
              <span className="spacer" />
              <button type="button" className="btn btn-take btn-sm" onClick={() => setStepId(null)}>
                ← Back to the rest
              </button>
            </>
          }
        >
          <p className="frame-foot" style={{ marginTop: 0 }}>
            Any form in the codex. The workings laid into it ride along, it keeps its place in your
            first weapon slot, and nothing about the change costs Supplies. It is written when the
            rest is.
          </p>
          <PactFormWall
            character={character}
            current={reshaped ?? step.state.weapon?.base ?? null}
            onPick={(weaponId) =>
              setReshaped(weaponId === step.state.weapon?.base ? null : weaponId)
            }
          />
        </Modal>
      )}

      {/* RAISE THE DEAD, which is the only step that *adds* something to the
          sheet rather than changing what is there. Everything it collects sits
          in this window's own draft until the rest is confirmed, exactly like
          the still and the shelf, so backing out of the night leaves the corpse
          in the cart. See RaiseWindow.jsx. */}
      {step?.kind === 'raise' && (
        <RaiseWindow
          character={character}
          row={step}
          draft={raised}
          onDraft={setRaised}
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
            Changed at a Long Rest and never priced, and it weighs nothing on your Magic Burden.
            Take one off to make room for another.
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
                    row.kind === 'labour' ? `${row.label} · read the card` : `Do this: ${row.label}`
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
                          <Gated
                            key={`${option.amount}-${option.gain}`}
                            className={`rest-opt${option.gain ? ' is-gain' : ''}`}
                            onClick={() => onTake(row, option)}
                            title={`${row.label} for ${option.amount} Supplies`}
                            why={
                              affordable
                                ? null
                                : `${option.amount} Supplies is more than the crate holds once the rest itself is paid for.`
                            }
                          >
                            {option.gain ? '+' : '−'}
                            {option.amount}
                          </Gated>
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
/**
 * One slate's fired runes, offered back against a budget.
 *
 * Every fired rune is shown rather than only the ones there is still room for,
 * and the ones past the count are refused with the reason on them. That is how
 * every other budget on this sheet reads, and hiding them would leave a player
 * wondering where the rest of their runes went.
 *
 * **The budget is a count of runes**, four of them at Master, and it stopped
 * being a Willpower allowance on 2026-09-09. So the orb beside each name is no
 * longer a price being paid here: it is what that rune is worth, which is how a
 * player decides which four to spend the four on. Dearest first, off
 * `runeRecharges`, so tapping straight down the list is the strong play.
 *
 * The same spell inscribed twice is two rows, one per copy, and each is tapped
 * on its own key.
 */
function RuneRecharge({ row, chosen, onToggle }) {
  const spend = rechargeSpend(row, chosen);

  return (
    <>
      <span className="fx-label">
        Runes to bring back
        <span className="rest-labour-rule">{row.from}</span>
      </span>

      <div className="rest-runes">
        <div className="rest-runes-list">
          {row.spent.map((rune) => {
            const on = chosen.includes(rune.key);
            const room = on || spend.left > 0;
            const name = rune.card?.name ?? rune.id;
            const which = rune.copies > 1 ? `${name} (${rune.copy} of ${rune.copies})` : name;

            return (
              <button
                type="button"
                key={rune.key}
                className={`rest-rune${on ? ' is-on' : ''}`}
                onClick={() => onToggle(rune.key)}
                disabled={!room}
                title={
                  room
                    ? on
                      ? `${which} comes back. Tap to leave it spent`
                      : `Bring ${which} back. It is worth ${rune.cost} Willpower on your slate`
                    : `${spend.budget} is all this rest brings back. Tap one off to make room for ${which}`
                }
              >
                <span className="rest-rune-name">{which}</span>
                <CostOrb kind="wp" value={rune.cost} size={17} />
              </button>
            );
          })}
        </div>

        <span className="rest-runes-budget">
          {spend.cost} of {spend.budget} {spend.budget === 1 ? 'rune' : 'runes'} brought back
        </span>
      </div>
    </>
  );
}

function summarise(action, { chosen, character, talents, brews, reshaped, raised, scribes }) {
  if (action.kind === 'scribe') {
    const said = scribeSummary(scribes, action.state);
    return said
      ? { done: true, says: said }
      : {
          done: false,
          says: 'Nothing on the desk yet',
          owing: 'The night is spent at the desk and nothing is written on it yet.',
        };
  }

  if (action.kind === 'labour') {
    return chosen
      ? { done: true, says: `${chosen.gain ? '+' : '−'}${chosen.amount} Supplies` }
      : { done: false, says: 'No amount chosen yet', owing: 'The labour has no amount on it yet.' };
  }

  if (action.kind === 'raise') {
    const offer = action.offers.find((row) => row.kind.id === raised?.kind) ?? null;
    if (!offer) {
      return {
        done: false,
        says: 'No body chosen yet',
        owing: 'The night is spent over a corpse and no body has been chosen.',
      };
    }

    const plan = raiseDraft(action.state, offer, raised);
    return plan.ready
      ? { done: true, says: `${raised.name}, ${offer.kind.label.toLowerCase()} at ${offer.cost} Marrow` }
      : {
          done: false,
          says: `${offer.kind.label}, and something still open`,
          owing: `The ${offer.kind.label.toLowerCase()} you are raising has a question still open.`,
        };
  }

  if (action.kind === 'pact') {
    return reshaped
      ? { done: true, says: `Reshaped into a ${getItem(reshaped)?.name ?? reshaped}` }
      : {
          done: false,
          says: 'No form chosen yet',
          owing: 'The night is spent reshaping the weapon and no form has been chosen.',
        };
  }

  if (action.kind === 'alchemy') {
    const said = brewSummary(brews, action.state);
    return said
      ? { done: true, says: said }
      : {
          done: false,
          says: 'Nothing in the still yet',
          owing: 'The night is spent at the still and nothing is in it yet.',
        };
  }

  if (action.kind === 'prepare') {
    /* A pool the night left short, which is the one thing here that can be half
       done rather than not started: putting two spells down and taking none back
       up is a hand two cards short by morning. The chooser's own Done already
       refuses it, and this is the same refusal at the window that writes. The
       debt is worded in loadouts.js so all three refusals say it the same way. */
    const debt = poolOwing(action.state);
    if (debt) return { done: false, says: poolAction(action.state), owing: debt };

    const change = pickChanges(character.talents, talents).find(
      (row) => row.talent.id === action.talent.id
    );
    /* Changing nothing is a real answer here, and the only place in this list
       where it is: a night offered to re-choose a hand you are happy with is a
       night you may sleep through. So "nothing changed yet" owes nothing, and
       the rest goes ahead. */
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
