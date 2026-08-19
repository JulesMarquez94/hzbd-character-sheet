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
  cauldronIsOut,
  draftParts,
  dropIngredient,
  ingredientOptions,
  setBrewChoice,
  shelfByPart,
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
 * So there are three areas, in that order, each holding what has gone into it and
 * each enforcing its own half of the rule. Under them is the shelf of Ingredients
 * this rank knows, and beside them the Brew as it currently stands, priced live.
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

  const stack = useCardStack();

  if (!limits) return null;

  const out = cauldronIsOut(character?.talents, talent.id);
  const cost = brewCost(draft, limits);
  const card = brewCard(draft, limits);
  /* Mana Crystal changes every die the Brew rolls, so it rides as a modifier the
     renderer applies rather than as a line of text. The brief and the dealt card
     must be given the same one or the card would change on opening. */
  const modifiers = brewModifiers(draft);
  const problems = brewProblems(draft, limits);
  const ready = brewReady(draft, limits) && out;
  const options = ingredientOptions(draft, limits);

  /** The one write a confirmed Brew makes: the points, and nothing else. */
  function confirm(mode, amount) {
    const body = spendUse(paying, character, mode, amount);
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
                title={ready ? undefined : problems.join(' ')}
                onClick={() =>
                  setPaying({
                    name: card.name,
                    source: `${card.name} — mixed in your Cauldron`,
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
        {!out ? (
          <p className="pick-notice is-warning">
            Your Cauldron is Dismissed, and a Brew needs it Summoned. Use <b>Bound Cauldron</b> from
            the Quick Bar first: it costs 2 Action Points and brings the Cauldron to your side.
          </p>
        ) : (
          <p className="frame-foot" style={{ marginTop: 0 }}>
            At rank {limits.rank} you brew with the {listAnd(limits.tiers)}{' '}
            {limits.tiers.length === 1 ? 'shelf' : 'shelves'}.{' '}
            {limits.essences > 1
              ? 'Improved Recipes lets you carry two Essences, so long as they are not the same one.'
              : 'One Essence, until Improved Recipes at Rank 3.'}
          </p>
        )}

        <div className="brew-window">
          <div className="brew-build">
            {/* ---- the configuration, in the order BREW names it ---- */}
            {shelfByPart(options).map((group) => (
              <Slot
                key={group.id}
                group={group}
                draft={draft}
                limits={limits}
                readOnly={readOnly || !out}
                onDrop={(index) => setDraft((current) => dropIngredient(current, group.id, index))}
              />
            ))}

            {/* ---- what still has to be decided ---- */}
            <Decisions
              draft={draft}
              readOnly={readOnly || !out}
              onChoose={(id, value) => setDraft((current) => setBrewChoice(current, id, value))}
            />

            {/* ---- the shelf ---- */}
            <section className="brew-step">
              <div className="brew-step-head">
                <span className="brew-step-label">The shelf</span>
                <span className="brew-step-note">
                  {options.filter((option) => option.ok).length} within reach
                </span>
              </div>

              {shelfByPart(options).map((group) => (
                <div className="brew-shelf" key={group.id}>
                  <span className="brew-shelf-tier">
                    {group.plural} · {group.rule}
                  </span>
                  {group.options.map((option) => (
                    <IngredientRow
                      key={option.ingredient.id}
                      option={option}
                      readOnly={readOnly || !out}
                      onAdd={() =>
                        setDraft((current) => addIngredient(current, option.ingredient.id, limits))
                      }
                      onOpen={() => stack?.openCard(option.ingredient)}
                    />
                  ))}
                </div>
              ))}
            </section>
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
                  art={talent.art}
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

            {problems.length > 0 && out && (
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
 * One of the three areas of the configuration, holding what has gone in.
 *
 * The heading carries the designer's own rule for that area ("Exactly one", "At
 * least one", "Any number") rather than a count, because the rule is the thing a
 * player has to know and the count is visible in the row underneath.
 */
function Slot({ group, draft, limits, readOnly, onDrop }) {
  const parts = draftParts(draft);
  const held =
    group.id === 'catalyst'
      ? [parts.catalyst].filter(Boolean)
      : group.id === 'essence'
        ? parts.essences
        : parts.infusions;

  const room = group.id === 'essence' ? `${held.length} of ${limits.essences}` : null;

  return (
    <section className="brew-step">
      <div className="brew-step-head">
        <span className="brew-step-label">{group.plural}</span>
        <span className={`brew-step-note${held.length === 0 && group.id !== 'infusion' ? ' is-open' : ''}`}>
          {room ?? group.rule}
        </span>
      </div>

      <div className="brew-doses">
        {held.length === 0 ? (
          <span className="brew-dose">
            <span className="brew-dose-name">{group.id === 'infusion' ? 'none' : 'empty'}</span>
          </span>
        ) : (
          held.map((ing, index) => (
            <button
              key={`${ing.id}-${index}`}
              type="button"
              className="brew-dose is-filled"
              disabled={readOnly}
              title="Take it back out"
              onClick={() => onDrop(index)}
            >
              <span className="brew-dose-name">{ing.name}</span>
              <span className="brew-dose-drop" aria-hidden="true">
                ×
              </span>
            </button>
          ))
        )}
      </div>
    </section>
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

/* ----------------------------------------------------------------- the shelf */

/** One Ingredient on the shelf: what it costs, what it does, and the way in. */
function IngredientRow({ option, readOnly, onAdd, onOpen }) {
  const { ingredient, ok, reason, held } = option;

  return (
    <div className={`brew-reagent${held > 0 ? ' is-in' : ''}`}>
      <button type="button" className="brew-reagent-body" onClick={onOpen} title="Read the card">
        <span className="brew-reagent-name">
          {ingredient.name}
          {held > 0 && <span className="brew-reagent-held">{held} in</span>}
        </span>
        <span className="item-tags">
          <span className="item-tag tag-card">{ingredient.tier}</span>
          <span className="brew-reagent-cost">
            {ingredient.ap} AP · {ingredient.wp} WP
          </span>
        </span>
        <span className="brew-reagent-line">{ingredient.summary}</span>
      </button>

      {!readOnly && (
        <button
          type="button"
          className={`btn btn-sm ${ok ? 'btn-take' : 'btn-minimal'}`}
          disabled={!ok}
          title={ok ? undefined : reason}
          onClick={onAdd}
        >
          {ok ? 'Add' : reason}
        </button>
      )}
    </div>
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
 * What the Ingredients block on the Abilities tab carries: whether the Cauldron is
 * out, and the way into the window.
 *
 * The Cauldron is Summoned with Bound Cauldron, which costs 2 Action Points, so
 * this tab only ever *reports* it. Nothing on the Abilities tab spends anything,
 * and that law is older than this set.
 */
export function BrewTools({ talent, character, patch, readOnly = false }) {
  const [mixing, setMixing] = useState(false);
  const out = cauldronIsOut(character?.talents, talent.id);
  const limits = brewLimits(character?.talents, talent);
  if (!limits) return null;

  return (
    <>
      <p className="pick-line">
        <b>{out ? 'Cauldron Summoned' : 'Cauldron Dismissed'}</b>
        {out
          ? '. A Brew can be mixed while it is out.'
          : '. Summon it with Bound Cauldron, from the Quick Bar on the Character tab.'}
      </p>

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
