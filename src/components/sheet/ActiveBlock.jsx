import { useMemo, useState } from 'react';
import UsePrompt from './UsePrompt.jsx';
import useFoldedGroups from './useFoldedGroups.js';
import { GroupHead } from './parts.jsx';
import CostOrbs from '../CostOrbs.jsx';
import BrewWindow from './BrewWindow.jsx';
import EnchantWindow from './EnchantWindow.jsx';
import AmbushWindow from './AmbushWindow.jsx';
import StealWindow from './StealWindow.jsx';
import { moveCount, quickBar, spendUse } from '../../lib/combatBar.js';
import { brewSetFor } from '../../lib/brews.js';
import { trickSetFor } from '../../lib/tricks.js';

/**
 * The Character tab's fourth block: the quick bar.
 *
 * Everything this character can *play*, on one face, at the size a hotbar is.
 * Your weapon, your belt, your prepared spells, whatever your blood and your
 * sets hand you, and the basic actions everyone in the world has. One tap
 * is one use.
 *
 * ------------------------------------------------------------- one tap, not two
 * Every other row on this tab carries a ⓘ beside it: tap to use, ⓘ to read.
 * A chip has no width for a second button, and it does not need one, because
 * `UsePrompt` already prints the whole card under the two ways. So a chip's tap
 * *opens* the use rather than committing it: the card is there to read, the
 * cost is there to see, and Cancel costs nothing. Reading and using are the
 * same gesture here, which is the only way this many moves fit one block.
 *
 * ------------------------------------------------------------------ the order
 * Groups run in the order you reach: your hands, your belt, then what you
 * know, then the actions everybody has. Basic actions are last on purpose.
 * They never change and are never forgotten. The four spells prepared this
 * morning are the ones that need to be under your thumb.
 *
 * Which of the two is on top is combatBar.js's business. This block only draws
 * what it is handed and asks the one question the tab always asks.
 *
 * ------------------------------------------------------------ folding
 * This is one of the two blocks on the sheet that may scroll, and folding is
 * what keeps that scroll short: a group you know by heart closes to its
 * heading and its count. What is folded is remembered per character, and the
 * whole bar can never be folded out of existence — a shut group still says how
 * much is inside it.
 */
export default function ActiveBlock({ character, patch, readOnly = false }) {
  // The use waiting on the action-or-reaction question, or null.
  const [request, setRequest] = useState(null);
  /* The talent set whose brewing window a paid-for use has opened, or null. */
  const [brewing, setBrewing] = useState(null);
  /* Whether the Ephemeral Enchantment shelf is up. Unlike brewing it opens
     *before* anything is paid: see `pays` in combatBar.js. */
  const [enchanting, setEnchanting] = useState(false);
  /* The two Trickster windows, as `{ talent, card }` or null. AMBUSH opens
     before the payment because the weapon decides the price; STEAL opens after
     it, because the two Action Points bought the attempt and the window is only
     deciding what came out of the pocket. See src/lib/tricks.js. */
  const [ambushing, setAmbushing] = useState(null);
  const [stealing, setStealing] = useState(null);

  const groups = useMemo(() => quickBar(character), [character]);
  const total = moveCount(groups);
  const { isFolded, toggle } = useFoldedGroups('bar', character?.id);

  function ask(move) {
    /* A move whose window does the paying skips the prompt entirely and opens the
       window, which prints the same card the prompt would have and asks the same
       action-or-reaction question once the cost is actually known. */
    if (move.pays === 'window' && move.opens === 'ephemeral') {
      setEnchanting(true);
      return;
    }
    if (move.pays === 'window' && move.opens === 'ambush') {
      const talent = trickSetFor(character?.talents, move.card?.id);
      if (talent) {
        setAmbushing({ talent, card: move.card });
        return;
      }
    }

    setRequest({
      name: move.card?.name ?? move.name,
      source: move.source,
      ap: move.ap,
      wp: move.wp,
      variable: move.variable,
      converts: move.converts,
      opens: move.opens,
      card: move.card,
      modifiers: move.modifiers,
      note: move.note,
      extra: move.extra,
    });
  }

  /** The spend itself lives in combatBar.js, shared with block 3. */
  function confirmUse(mode, amount, options) {
    const body = spendUse(request, character, mode, amount, options);
    if (Object.keys(body).length > 0) patch(body);

    /* A card may say that using it opens something. BREW does: what a Brew
       costs is the sum of what goes into it, so the window is where the cost is
       worked out and where it is paid. The prompt this confirmed was BREW's own
       printed "x", which spends nothing. */
    if (request.opens === 'brew') setBrewing(brewSetFor(character.talents, request.card?.id));

    /* And STEAL does: the attack is paid for, and what it lifted is chosen in the
       window rather than left as four lines of card text for the table to apply
       by hand. Straight out of the Developpement Notes. */
    if (request.opens === 'steal') {
      const talent = trickSetFor(character?.talents, request.card?.id);
      if (talent) setStealing({ talent, card: request.card });
    }

    setRequest(null);
  }

  return (
    <div className="cell-scroll active-block">
      <div className="block-head">
        <span className="stat-category-label">Quick Bar</span>
        <span className="block-count">
          {total} {total === 1 ? 'move' : 'moves'}
        </span>
      </div>

      {groups.map((group) => {
        const folded = isFolded(group.id);

        return (
          <section className="bar-group" key={group.id}>
            <GroupHead
              label={group.label}
              note={group.note}
              count={group.moves.length}
              folded={folded}
              onToggle={() => toggle(group.id)}
            />

            {!folded && (
              <div className="bar-chips">
                {group.moves.map((move) => (
                  <BarChip key={move.key} move={move} readOnly={readOnly} onUse={() => ask(move)} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {request && (
        <UsePrompt
          request={request}
          character={character}
          onCancel={() => setRequest(null)}
          onConfirm={confirmUse}
        />
      )}

      {enchanting && (
        <EnchantWindow
          character={character}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setEnchanting(false)}
        />
      )}

      {ambushing && (
        <AmbushWindow
          talent={ambushing.talent}
          card={ambushing.card}
          character={character}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setAmbushing(null)}
        />
      )}

      {stealing && (
        <StealWindow
          talent={stealing.talent}
          card={stealing.card}
          character={character}
          patch={patch}
          onClose={() => setStealing(null)}
        />
      )}

      {brewing && (
        <BrewWindow
          talent={brewing}
          character={character}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setBrewing(null)}
        />
      )}
    </div>
  );
}

/**
 * One move, in the width half a block has: what it is called and what it
 * costs, in the colour of what it is.
 *
 * The accent is the card's own `ac-kind-*`, the same class the printed card
 * wears, so a spell reads violet here, a talent amber and a belt item green.
 * A column of chips can then be read by colour before it is read by name.
 *
 * A charged item shows what is left of it as a small number rather than as
 * dots. Five dots at this size are five grey pixels; a 2 is a 2. It sits with
 * the name and not with the orbs, written "×2", because a bare number leading
 * a row of costs is read as one of them.
 *
 * Exported, because a creature's block has a quick bar of its own and a chip
 * there has to be the same chip: same accent by kind, same orbs, same one tap
 * that opens the use rather than committing it. See MinionBlock.jsx.
 */
export function BarChip({ move, readOnly, onUse }) {
  const { card, variable, spent, charges, used } = move;
  const remaining = charges > 0 ? charges - used : null;

  return (
    <button
      type="button"
      className={`bar-chip ac-kind-${card?.kind ?? 'ability'}${spent ? ' is-spent' : ''}`}
      onClick={onUse}
      disabled={readOnly || spent}
      /* A chip can be refused for more than one reason now, and they do not read
         the same: a flask is spent, while a Martial Move has nowhere to ride
         because one is already waiting. So the row says which, in its own words,
         and falls back to the flask's wording for everything that has none. */
      title={
        spent
          ? move.spentNote ?? `${move.name} is spent`
          : `${move.name} · ${move.source}`
      }
    >
      <span className="bar-chip-name">{move.name}</span>

      {!spent && remaining !== null && (
        <span className="bar-chip-left" title={`${remaining} left`}>
          &times;{remaining}
        </span>
      )}

      {spent ? (
        <span className="bar-chip-spent">{move.spentLabel ?? 'Spent'}</span>
      ) : (
        <span className="bar-chip-costs">
          {variable ? (
            <span className="bar-chip-x" title="The Game Master sets what this costs">
              X
            </span>
          ) : (
            <CostOrbs ap={move.ap} wp={move.wp} size={16} className="bar-chip-orbs" />
          )}
        </span>
      )}
    </button>
  );
}
