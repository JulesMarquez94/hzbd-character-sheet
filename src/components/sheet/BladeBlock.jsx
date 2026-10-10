import { useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import UsePrompt from './UsePrompt.jsx';
import { InfoButton } from './LoadoutBlock.jsx';
import { LoadoutChooser } from './LoadoutPick.jsx';
import { CostOrb } from '../CostOrbs.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { levelForXp } from '../../lib/characterModel.js';
import { WEAPON_SLOTS, heldItem, normalizeEquipment } from '../../lib/items.js';
import { loadoutState, toggleLoadoutPick } from '../../lib/loadouts.js';
import { shortName } from '../../lib/combatBar.js';
import { bindPatch, releasePatch, strikePrice } from '../../lib/spellblade.js';
import { setTalentPicks } from '../../lib/talents.js';
import { usePlayCard } from './usePlayCard.js';

/**
 * The blade block: the one a talent set adds when it binds a weapon.
 *
 * A Spellblade's whole sheet is two questions and this block is where both are
 * answered:
 *
 *   what is bound   which weapon, what it now deals, and whether it is the thing
 *                   in your hand right now. Binding is the one thing this set
 *                   spends points on, so the button that does it is here, and
 *                   the two questions it asks are asked before anything is
 *                   charged rather than after.
 *   what it carries the prepared spells, each with what carrying it in on a
 *                   strike actually costs in these hands. Not pressable, and
 *                   that is the design: a bound spell is cast on a swing and
 *                   there is no swing here. The ⓘ deals the real card, so what
 *                   one does is a tap away without leaving the tab.
 *
 * ------------------------------------------------------------------- one block
 * Everything fits one 360x640 cell, and the spell list is the only part with no
 * natural length, so the *block* holds its shape and the list scrolls inside it.
 * Same arrangement the rune block makes, and for the same reason.
 *
 * ------------------------------------------------------------------- the press
 * There is exactly one, and it is the binding. It goes through the same prompt
 * and the same `usePlayCard` every other use on this sheet goes through: the
 * action or reaction question, the price, the log line. What is different is
 * only that the window asks its two questions first, which is what `pays:
 * 'window'` on the card means and what BOUND EDGE carries it for. Backing out of
 * the questions costs nothing.
 *
 * The card is on the quick bar as well, and tapping it there opens this same
 * window rather than charging first. See ActiveBlock.jsx.
 */
export default function BladeBlock({ character, state, patch, readOnly = false }) {
  const [binding, setBinding] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const stack = useCardStack();

  const { talent, bond, spells, cut, empower } = state;

  /* The chooser reads the sheet's own panel state, capped at what the hand holds
     rather than at what tonight allows, because this is the sheet and not a rest.
     See loadoutState. */
  const hand = loadoutState(character?.talents, talent, {
    level: levelForXp(character?.xp),
    capped: 'capacity',
    attributes: character,
  });

  const carried = (hand?.picks ?? []).filter((pick) => pick.card);

  return (
    <div className="cell-scroll blade-block">
      <div className="block-head">
        <span className="stat-category-label">{state.spec.label}</span>
        <span className="spacer" />
        <span className={`block-count${carried.length < (hand?.known ?? 0) ? ' is-open' : ''}`}>
          {carried.length} of {hand?.known ?? 0}
        </span>
        {!readOnly && patch && (
          <button
            type="button"
            className="minion-edit"
            onClick={() => setChoosing(true)}
            title={`Change which spells your edge carries. ${hand?.known ?? 0} in all`}
          >
            Spells
          </button>
        )}
      </div>

      {/* ---------- WHAT IS BOUND ----------
          The one line the whole set turns on. A bond that is on a weapon you are
          not holding says so, because a stowed weapon makes no attacks and a
          block that read "bound" over a sword in your pack would be the sheet
          promising a swing it is not going to lend anything to. */}
      {bond ? (
        <div className={`blade-bond${bond.drawn ? '' : ' is-stowed'}`}>
          <span className="blade-bond-name">{bond.name}</span>
          <span className="blade-bond-note">
            {bond.drawn
              ? `In hand. It deals ${bond.damage}, swings off your Mind${
                  empower > 0 ? `, and is Empowered by ${empower}` : ''
                }.`
              : `Bound, and not in your hand. It deals ${bond.damage} and swings off your Mind once you draw it.`}
          </span>
          {!readOnly && patch && (
            <button
              type="button"
              className="rest-opt blade-release"
              onClick={() => {
                const body = releasePatch(character, state);
                if (body) patch(body);
              }}
              title={`Give ${bond.name} back. Binding another weapon does this on its own`}
            >
              Release
            </button>
          )}
        </div>
      ) : (
        <p className="pick-line">
          Nothing bound. Put a hand on a weapon and it swings off your Mind until the morning,
          dealing whichever of the three you choose.
        </p>
      )}

      {!readOnly && patch && (
        <button type="button" className="rest-slot rest-slot-empty" onClick={() => setBinding(true)}>
          <span className="rest-slot-plus" aria-hidden="true">
            +
          </span>
          <span className="rest-slot-name">{bond ? 'Bind another weapon' : 'Bind a weapon'}</span>
          <span className="rest-slot-from">
            {state.spec.ap} Action {state.spec.ap === 1 ? 'Point' : 'Points'} and {state.spec.wp}{' '}
            Willpower
          </span>
        </button>
      )}

      {/* ---------- WHAT IT CARRIES ----------
          The prepared spells, each priced for a strike rather than for a cast: a
          spell's own Action Points are converted into Willpower on the way in and
          a Master takes a point back off, so the number here is almost never the
          one the card prints. Both are shown, the printed one struck through, for
          the same reason every other revised cost on this sheet shows both. */}
      <div className="blade-list">
        {carried.length === 0 ? (
          <p className="pick-line">
            Your edge carries nothing yet. It holds {hand?.known ?? 0}{' '}
            {(hand?.known ?? 0) === 1 ? 'spell' : 'spells'}, and each one arrives where your attack
            lands.
          </p>
        ) : (
          carried.map((pick) => (
            <SpellLine
              key={pick.id}
              pick={pick}
              state={state}
              stack={stack}
            />
          ))
        )}
      </div>

      {/* ---------- WHAT A STRIKE IS WORTH ----------
          The one sentence that makes the list mean anything: how many of them one
          swing carries, and where the bond ends. */}
      <p className="blade-foot">
        {carried.length === 0
          ? 'Nothing to carry in yet.'
          : `A strike carries ${
              spells === 1 ? 'one of them' : `${spells} of them at once`
            }, chosen in the attack’s own prompt.`}
        {cut > 0 ? ' Each one costs 1 Willpower less than it would.' : ''}
        {bond ? ' The binding ends with your next Long Rest.' : ''}
      </p>

      {choosing && hand && (
        <LoadoutChooser
          talent={talent}
          character={character}
          state={hand}
          readOnly={readOnly || !patch}
          onToggle={(cardId, how) =>
            patch({
              talents: toggleLoadoutPick(character?.talents, talent.id, cardId, hand.known, how),
            })
          }
          onClear={() => patch({ talents: setTalentPicks(character?.talents, talent.id, []) })}
          onClose={() => setChoosing(false)}
        />
      )}

      {binding && (
        <BladeBind
          character={character}
          state={state}
          patch={patch}
          onClose={() => setBinding(false)}
        />
      )}
    </div>
  );
}

/**
 * One prepared spell on one line: what it is, and what carrying it in costs.
 *
 * Not a button. Every other list on this tab is pressable and this one is not,
 * because a bound spell has nowhere to go from here: it is cast on a swing, and
 * the swing is on the quick bar or in your hand. A row that looked pressable and
 * did nothing would be worse than a row that plainly is not.
 */
function SpellLine({ pick, state, stack }) {
  const price = strikePrice(state, pick.card);

  return (
    <div className={`blade-line${pick.ok ? '' : ' is-out'}`}>
      <span className="blade-line-name">{shortName(pick.card)}</span>

      {pick.ok ? (
        price.wp > 0 ? (
          <CostOrb
            kind="wp"
            value={price.wp}
            size={19}
            was={price.wp !== price.printed ? price.printed : null}
            from={[
              ...(price.surcharge > 0 ? ['its Action Points'] : []),
              ...(price.cut > 0 ? ['Twinned Strike'] : []),
            ]}
          />
        ) : (
          <span className="use-move-cut">Free</span>
        )
      ) : (
        <span className="use-row-spent-note">Out of reach</span>
      )}

      <InfoButton
        onClick={() => stack?.openCard(pick.card, pick.modifiers)}
        label={`${pick.card.name} card`}
      />
    </div>
  );
}

/**
 * The window that binds: which weapon, which of the three, and then the price.
 *
 * Two questions asked **before** anything is charged, which is the whole reason
 * BOUND EDGE carries `pays: 'window'`. Backing out costs nothing, and there is no
 * moment at which the sheet holds a paid-for binding with nowhere to put it.
 *
 * The weapons offered are the two weapon slots and nothing else. "A weapon you
 * can touch" is the card, and what this sheet knows about touching is what is in
 * your hands: a blade in the pack is one equip away and the block says so rather
 * than the window quietly binding something you are not carrying.
 *
 * Exported because the quick bar raises this same window. One window, because
 * two would be two places asking the same two questions and one of them would
 * eventually ask them differently. See ActiveBlock.jsx.
 */
export function BladeBind({ character, state, patch, onClose }) {
  const card = useMemo(
    () => state.talent.cards.find((one) => one.opens === 'blade') ?? null,
    [state.talent]
  );

  /* What is in the two weapon slots, in slot order, as `{ key, label, item }`.
     A slot holding nothing is left out entirely: an empty row that refuses to be
     tapped is a longer list with no more choices in it. */
  const options = useMemo(() => {
    const worn = normalizeEquipment(character?.equipment);
    return WEAPON_SLOTS.map((slot) => ({
      slot,
      item: heldItem(character, worn[slot.key]),
    })).filter((row) => row.item);
  }, [character]);

  const [item, setItem] = useState(() => options[0]?.item?.id ?? null);
  const [damage, setDamage] = useState(() => state.types[0] ?? null);
  const [request, setRequest] = useState(null);

  const play = usePlayCard({ character, patch });
  const chosen = options.find((row) => row.item.id === item) ?? null;

  function bind() {
    const body = bindPatch(character, state, {
      item,
      damage,
      name: chosen?.item?.name ?? null,
    });
    if (!body || !card) return;

    setRequest({
      name: card.name,
      source: `${card.name} · ${state.talent.name}`,
      ap: card.ap,
      wp: card.wp,
      card,
      note: `${chosen?.item?.name ?? 'The weapon'} deals ${damage} and swings off your Mind until your next Long Rest.`,
      /* The bond written in the same patch as the points. Backing out of the
         prompt writes neither, which is the same contract a rune's firing keeps
         with its own use. */
      extra: body,
    });
  }

  function confirmUse(mode, amount, chosenOptions) {
    play(request, mode, amount, chosenOptions);
    setRequest(null);
    onClose();
  }

  const ready = Boolean(item && damage && card);

  return (
    <>
      <Modal
        title={card?.name ?? 'Bind a weapon'}
        onClose={onClose}
        footer={
          <>
            <span className="pick-line">
              {options.length === 0
                ? 'Nothing in either hand to put a hand on.'
                : `${state.spec.ap} Action ${
                    state.spec.ap === 1 ? 'Point' : 'Points'
                  } and ${state.spec.wp} Willpower, asked for after this.`}
            </span>
            <span className="spacer" />
            <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-copper btn-sm"
              onClick={bind}
              disabled={!ready}
              title={
                ready
                  ? `Bind ${chosen?.item?.name} and have it deal ${damage}`
                  : 'Name a weapon and a damage type first'
              }
            >
              {ready ? `Bind it as ${damage}` : 'Choose both'}
            </button>
          </>
        }
      >
        <p className="pick-line" style={{ marginTop: 0 }}>
          Put a hand on it. Until your next Long Rest it swings off your Mind and deals whichever of
          the three you name{state.empower > 0 ? ', and it is Empowered while it does' : ''}.
          {state.bond ? ` ${state.bond.name} goes back to being a weapon.` : ''}
        </p>

        <span className="fx-label">Which weapon</span>
        {options.length === 0 ? (
          <p className="pick-notice is-warning">
            Nothing in either hand. Equip a weapon on the Inventory tab first, then come back.
          </p>
        ) : (
          <div className="blade-opts">
            {options.map(({ slot, item: held }) => (
              <button
                key={slot.key}
                type="button"
                className={`blade-opt${item === held.id ? ' is-picked' : ''}`}
                onClick={() => setItem(held.id)}
              >
                <span className="blade-opt-name">{held.name}</span>
                <span className="blade-opt-note">{slot.label}</span>
              </button>
            ))}
          </div>
        )}

        <span className="fx-label">What it deals</span>
        <div className="blade-opts blade-opts-row">
          {state.types.map((type) => (
            <button
              key={type}
              type="button"
              className={`blade-opt${damage === type ? ' is-picked' : ''}`}
              onClick={() => setDamage(type)}
            >
              <span className="blade-opt-name">{type}</span>
            </button>
          ))}
        </div>
      </Modal>

      {request && (
        <UsePrompt
          request={request}
          character={character}
          onCancel={() => setRequest(null)}
          onConfirm={confirmUse}
        />
      )}
    </>
  );
}
