import { useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import UsePrompt from './UsePrompt.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useCardStack } from '../../context/card-stack.js';
import { spendUse } from '../../lib/combatBar.js';
import {
  addIngredient,
  blankBrew,
  brewCard,
  brewCost,
  brewLimits,
  brewModifiers,
  brewPreview,
  brewProblems,
  brewReady,
  brewShortfall,
  draftParts,
  dropIngredient,
  ingredientOptions,
  setBrewChoice,
  shelfByPart,
  shortfallLine,
} from '../../lib/brews.js';

/**
 * The Cauldron: where a Brew is mixed.
 *
 * The designer's development note asks for exactly this and nothing less: "The
 * cauldron keeper brew ability should open a new unique window menu. There is a
 * process here to craft the brew."
 *
 * ------------------------------------------------------------------- the process
 * BREW's own text is the process, and this window is that sentence made literal:
 *
 *   "At least 1 Essence, exactly 1 Catalyst, and any number of Infusions."
 *
 * So the Cauldron is **three rows of slots**, in that order, and a slot is the
 * whole interaction: an empty one is a `+` you press, which opens the shelf for
 * that kind alone, and a filled one is the Ingredient with an × to take it back
 * out. Essences hold as many slots as the rank allows, the Catalyst holds exactly
 * one, and Infusions grow a fresh `+` after every one added, because "any number"
 * is a row that never runs out of room.
 *
 * That is the same grammar the armor block uses — tap the slot, the codex opens —
 * and it replaced a wall of eighteen Ingredient rows standing open under three
 * areas that could not themselves be pressed. The shelf still exists and still
 * reads the same; it is behind the `+` now, filtered to the one kind the slot
 * wants, which is also the only place the tier and the reach of a rank matter.
 *
 * ------------------------------------------------------------------- the price
 * "You must pay the combined Action Point and Willpower cost of all chosen
 * Ingredients." The window shows that sum with its working, because a Brew of four
 * Ingredients is four Action Point costs and four Willpower costs added up, and a
 * bare total gives the player nothing to check. Quicksilver and Efficient Brewing
 * take Action Points back off it and are listed as the reductions they are.
 *
 * ------------------------------------------------------------- nothing is kept
 * "The resulting Brew takes effect immediately." There is no shelf of finished
 * Brews to store, so the draft lives in this component and dies with it. What is
 * paid is paid through `UsePrompt`, the same action-or-reaction question every
 * other use on this sheet asks, so a Brew spends exactly the way a spell does.
 */
export default function BrewWindow({ talent, character, patch, readOnly = false, onClose }) {
  const limits = brewLimits(character?.talents, talent);
  const [draft, setDraft] = useState(blankBrew);
  const [paying, setPaying] = useState(null);
  /** Which kind of Ingredient the shelf is open for, or null while it is shut. */
  const [picking, setPicking] = useState(null);

  const stack = useCardStack();

  if (!limits) return null;

  const cost = brewCost(draft, limits);
  const card = brewCard(draft, limits);
  /* Mana Crystal changes every die the Brew rolls, so it rides as a modifier the
     renderer applies rather than as a line of text. The brief and the dealt card
     must be given the same one or the card would change on opening. */
  const modifiers = brewModifiers(draft);
  const problems = brewProblems(draft, limits);
  /* What the pools cannot cover. A Brew is priced by what went in it rather than
     printed on a card, so this is the only screen that can say so before the
     points are asked for. See brewShortfall. */
  const short = brewShortfall(cost, character);
  const ready = brewReady(draft, limits) && !short;
  const shelves = shelfByPart(ingredientOptions(draft, limits));
  const open = picking ? shelves.find((group) => group.id === picking) : null;

  /** The one write a confirmed Brew makes: the points, and nothing else. */
  function confirm(mode, amount, options) {
    const body = spendUse(paying, character, mode, amount, options);
    if (Object.keys(body).length > 0) patch(body);
    setPaying(null);
    setDraft(blankBrew());
    onClose();
  }

  return (
    <>
      <Modal
        title={`${talent.name}: Brew`}
        onClose={onClose}
        size="page"
        accent={PICK_ACCENTS.talent}
        footer={
          <>
            <CostReadout cost={cost} />
            <span className="spacer" />
            <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
              Close
            </button>
            {!readOnly && (
              <button
                type="button"
                className="btn btn-take btn-sm"
                disabled={!ready}
                title={
                  ready ? undefined : short ? short.map(shortfallLine).join(' ') : problems.join(' ')
                }
                onClick={() =>
                  setPaying({
                    name: card.name,
                    source: `${card.name} · mixed in your Cauldron`,
                    ap: cost.ap,
                    wp: cost.wp,
                    card,
                    modifiers,
                  })
                }
              >
                Brew it
              </button>
            )}
          </>
        }
      >
        <p className="frame-foot" style={{ marginTop: 0 }}>
          At rank {limits.rank} you brew with the {listAnd(limits.tiers)}{' '}
          {limits.tiers.length === 1 ? 'shelf' : 'shelves'}.{' '}
          {limits.essences > 1
            ? 'Improved Recipes lets you carry two Essences, so long as they are not the same one.'
            : 'One Essence, until Improved Recipes at Rank 3.'}
        </p>

        <div className="brew-window">
          <div className="brew-build">
            {/* ---- the configuration, in the order BREW names it ---- */}
            {shelves.map((group) => (
              <SlotRow
                key={group.id}
                group={group}
                draft={draft}
                limits={limits}
                readOnly={readOnly}
                onAdd={() => setPicking(group.id)}
                onDrop={(index) => setDraft((current) => dropIngredient(current, group.id, index))}
                onRead={(ing) => stack?.openCard(ing)}
              />
            ))}

            {/* ---- what still has to be decided ---- */}
            <Decisions
              draft={draft}
              readOnly={readOnly}
              onChoose={(id, value) => setDraft((current) => setBrewChoice(current, id, value))}
            />
          </div>

          {/* ---- what comes out ---- */}
          <aside className="brew-preview">
            <div className="brew-step-head">
              <span className="brew-step-label">What comes out</span>
              <span className="brew-step-note">{card ? `${cost.ap} AP · ${cost.wp} WP` : 'nothing yet'}</span>
            </div>

            {card ? (
              <>
                <CardBrief
                  card={card}
                  character={character}
                  modifiers={modifiers}
                  onOpen={() => stack?.openCard(card, modifiers)}
                />
                <p className="brew-preview-hint">
                  Tap it to read the whole Brew, printed with your own numbers.
                </p>
                <CostWorking cost={cost} />
              </>
            ) : (
              <p className="pick-line">
                An empty Cauldron. It starts reading like a card once it has an Essence and a
                Catalyst in it.
              </p>
            )}

            {short && (
              <div className="brew-missing is-short">
                <span className="brew-missing-head">You cannot pay for this</span>
                {short.map((row) => (
                  <span className="brew-missing-line" key={row.resource}>
                    {shortfallLine(row)}
                  </span>
                ))}
                <span className="brew-missing-line brew-missing-foot">
                  Take something back out of the Cauldron, or rest before you brew it.
                </span>
              </div>
            )}

            {problems.length > 0 && (
              <div className="brew-missing">
                <span className="brew-missing-head">Still needed</span>
                {problems.map((line) => (
                  <span className="brew-missing-line" key={line}>
                    {line}
                  </span>
                ))}
              </div>
            )}
          </aside>
        </div>
      </Modal>

      {open && (
        <Shelf
          group={open}
          character={character}
          onClose={() => setPicking(null)}
          onAdd={(id) => {
            setDraft((current) => addIngredient(current, id, limits));
            setPicking(null);
          }}
          onRead={(ing) => stack?.openCard(ing)}
        />
      )}

      {paying && (
        <UsePrompt
          request={paying}
          character={character}
          onCancel={() => setPaying(null)}
          onConfirm={confirm}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ the slots */

/**
 * One row of the configuration: every slot of one kind, filled or waiting.
 *
 * How many slots there are *is* the rule, drawn rather than described. A Catalyst
 * is one slot because there is exactly one. Essences are as many slots as the rank
 * allows. Infusions are what is in already plus one more, always, because "any
 * number" has no last slot.
 *
 * So the heading carries the designer's own words for that kind ("Exactly one",
 * "Any number") rather than a count the row already shows. Essences are the
 * exception and count themselves out, because theirs is the ceiling that moves
 * with rank and Improved Recipes.
 */
function SlotRow({ group, draft, limits, readOnly, onAdd, onDrop, onRead }) {
  const parts = draftParts(draft);
  const held =
    group.id === 'catalyst'
      ? [parts.catalyst].filter(Boolean)
      : group.id === 'essence'
        ? parts.essences
        : parts.infusions;

  /* Infusions never fill up, so the row always ends in one open slot. The other
     two have a ceiling and show every slot it allows, filled or not. */
  const total = group.id === 'infusion' ? held.length + 1 : group.id === 'essence' ? limits.essences : 1;
  const openSlots = Math.max(0, total - held.length);
  /* The Essence ceiling is the one that moves with rank, so it is the one worth
     counting out. The other two say the rule instead, in the designer's words. */
  const room = group.id === 'essence' ? `${held.length} of ${total}` : group.rule;

  return (
    <section className="brew-step">
      <div className="brew-step-head">
        <span className="brew-step-label">{group.plural}</span>
        <span className={`brew-step-note${held.length === 0 && group.id !== 'infusion' ? ' is-open' : ''}`}>
          {room}
        </span>
      </div>

      <div className="brew-slots">
        {held.map((ing, index) => (
          <div className="brew-slot is-filled" key={`${ing.id}-${index}`}>
            <button
              type="button"
              className="brew-slot-body"
              onClick={() => onRead(ing)}
              title={`Read the ${ing.name} card`}
            >
              <span className="brew-slot-name">{ing.name}</span>
              <span className="brew-slot-meta">
                {ing.tier} · {ing.ap} AP · {ing.wp} WP
              </span>
            </button>

            {!readOnly && (
              <button
                type="button"
                className="brew-slot-drop"
                onClick={() => onDrop(index)}
                title="Take it back out"
                aria-label={`Take the ${ing.name} back out`}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {Array.from({ length: openSlots }, (_, index) => (
          <button
            key={`open-${index}`}
            type="button"
            className="brew-slot brew-slot-add"
            disabled={readOnly}
            onClick={onAdd}
            title={readOnly ? undefined : `Add ${anA(group.label)}`}
          >
            <span className="brew-slot-plus" aria-hidden="true">
              +
            </span>
            <span className="brew-slot-add-label">{group.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- the shelf */

/**
 * The shelf, opened by a slot and filtered to what that slot takes.
 *
 * It used to stand open under the configuration, all eighteen Ingredients of it,
 * which is the longest thing in the window and the part a player reads least
 * often. Behind the `+` it answers the question actually being asked — what goes
 * in *this* slot — and the Ingredients that cannot go in it say why on their own
 * button rather than being listed at all.
 */
function Shelf({ group, character, onClose, onAdd, onRead }) {
  const within = group.options.filter((option) => option.ok).length;

  return (
    <Modal
      title={`Add ${anA(group.label)}`}
      onClose={onClose}
      wide
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className="brew-step-note">{within} within reach</span>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        {group.rule}.
      </p>

      <div className="card-brief-wall">
        {group.options.map((option) => (
          <IngredientRow
            key={option.ingredient.id}
            option={option}
            character={character}
            onAdd={() => onAdd(option.ingredient.id)}
            onOpen={() => onRead(option.ingredient)}
          />
        ))}
      </div>
    </Modal>
  );
}

/**
 * One Ingredient on the shelf, printed as the brief every other pool prints.
 *
 * It used to be a row of this window's own making, which drew no art and read
 * nothing like the spell pool it sits two taps away from. An Ingredient is a card,
 * so it is shown the way a card is shown: the art plate, the name with its cost
 * orbs, its chips, and its one line. The way in hangs underneath, exactly where a
 * spell pool hangs "Learn this spell", and a refusal states itself on that button
 * rather than being hidden.
 *
 * How many doses are in already is said under the brief, because Quicksilver and
 * the Infusions can go in more than once and the count is the only thing the brief
 * itself cannot show.
 */
function IngredientRow({ option, character, onAdd, onOpen }) {
  const { ingredient, ok, reason, held } = option;

  return (
    <CardBrief card={ingredient} character={character} held={held > 0} onOpen={onOpen}>
      {held > 0 && (
        <span className="brew-reagent-held">
          {held} in the Cauldron
        </span>
      )}

      <button
        type="button"
        className={`btn btn-sm card-brief-btn ${ok ? 'btn-take' : 'btn-minimal'}`}
        disabled={!ok}
        title={ok ? undefined : reason}
        onClick={onAdd}
      >
        {ok ? 'Add' : reason}
      </button>
    </CardBrief>
  );
}

/* --------------------------------------------------------------- the choices */

/**
 * What the brewer has to decide, asked only for the Ingredients actually in the
 * Cauldron. Four of them ask something, and their own text is what says so: "the
 * brewer chooses", "the brewer names".
 */
function Decisions({ draft, readOnly, onChoose }) {
  const asking = draftParts(draft).all.filter((ing) => ing.choice);
  if (asking.length === 0) return null;

  return (
    <section className="brew-step">
      <div className="brew-step-head">
        <span className="brew-step-label">Your call</span>
        <span className="brew-step-note">{asking.length} to decide</span>
      </div>

      {asking.map((ing) => (
        <div className="brew-decision" key={ing.id}>
          <span className="brew-decision-label">
            {ing.name}
            <span className="brew-decision-asks">{ing.choice.label}</span>
          </span>

          {ing.choice.free ? (
            <input
              type="text"
              className="brew-input"
              value={draft.choices?.[ing.id] ?? ''}
              placeholder={ing.choice.placeholder}
              disabled={readOnly}
              onChange={(event) => onChoose(ing.id, event.target.value)}
            />
          ) : (
            <span className="brew-decision-options">
              {ing.choice.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`brew-chip${draft.choices?.[ing.id] === option.id ? ' is-on' : ''}`}
                  disabled={readOnly}
                  onClick={() => onChoose(ing.id, option.id)}
                >
                  {option.label}
                </button>
              ))}
            </span>
          )}
        </div>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ the price */

/** The total, for the footer. */
function CostReadout({ cost }) {
  return (
    <span className="brew-total">
      <span className="brew-total-part">{cost.ap} AP</span>
      <span className="brew-total-part">{cost.wp} WP</span>
    </span>
  );
}

/**
 * Where the price came from. A Brew of four Ingredients is four costs added up,
 * and a player checking the sheet against the cards on the table needs the sum
 * rather than the answer.
 */
function CostWorking({ cost }) {
  if (cost.apParts.length === 0) return null;

  return (
    <div className="brew-working">
      <span className="brew-working-head">The combined cost</span>
      {cost.apParts.map((part, index) => (
        <span className="brew-working-row" key={part.label}>
          <span>{part.label}</span>
          <span className="brew-working-nums">
            {part.ap} AP · {cost.wpParts[index].wp} WP
          </span>
        </span>
      ))}

      {cost.cuts.map((cut) => (
        <span className="brew-working-row is-cut" key={cut.label}>
          <span>{cut.label}</span>
          <span className="brew-working-nums">−{cut.ap} AP</span>
        </span>
      ))}

      <span className="brew-working-row is-total">
        <span>Brew</span>
        <span className="brew-working-nums">
          {cost.ap} AP · {cost.wp} WP
        </span>
      </span>

      {cost.floored && (
        <span className="brew-working-note">
          The reductions came to more than the Brew costs, so it is free rather than paying you
          back.
        </span>
      )}
    </div>
  );
}

/* ----------------------------------------------- the Abilities tab's tools */

/**
 * What the Ingredients block on the Abilities tab carries: the way into the
 * window.
 *
 * It used to report whether the Cauldron was Summoned, and refuse the way in
 * while it was not. The Cauldron is assumed present now (see brews.js), so the
 * block is the door and nothing else. Nothing on the Abilities tab spends
 * anything, and that law is older than this set.
 */
export function BrewTools({ talent, character, patch, readOnly = false }) {
  const [mixing, setMixing] = useState(false);
  const limits = brewLimits(character?.talents, talent);
  if (!limits) return null;

  return (
    <>
      {!readOnly && (
        <div className="pick-tools pick-tools-tight">
          <button type="button" className="btn btn-sub btn-sm" onClick={() => setMixing(true)}>
            Open the Cauldron
          </button>
        </div>
      )}

      {mixing && (
        <BrewWindow
          talent={talent}
          character={character}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setMixing(false)}
        />
      )}
    </>
  );
}

/* ------------------------------------------- the preview, rank by rank */

/**
 * What a rank of brewing opens, on the presentation page beside that rank's cards.
 * Reading BREW should say how much wider the shelf gets, which is not countable
 * off the card text.
 */
export function BrewRankNote({ talent, rank }) {
  const preview = brewPreview(talent, rank);
  if (!preview || preview.tiers.length === 0) return null;

  const { opened, count, reach, essences, deeper, byPart } = preview;

  return (
    <div className="loadout-note">
      <span className="loadout-note-body">
        <b>
          {opened.length > 0
            ? `+${count} ${listAnd(opened)} ${count === 1 ? 'Ingredient' : 'Ingredients'}`
            : `${reach} Ingredients within reach`}
        </b>
        <span className="loadout-note-line">
          {opened.length > 0
            ? `${byPart
                .filter((part) => part.count > 0)
                .map((part) => `${part.count} ${part.count === 1 ? part.label : part.plural}`)
                .join(', ')}, for ${reach} in all`
            : `Nothing new on the shelf at this rank`}
          {deeper && essences > 1 ? `, and a second Essence in every Brew` : ''}.
        </span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

/** "Novice and Adept", "Novice, Adept and Master". No Oxford comma. */
function listAnd(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** "an Essence", "a Catalyst" — the three kinds are the only words this sees. */
function anA(word) {
  return `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`;
}
