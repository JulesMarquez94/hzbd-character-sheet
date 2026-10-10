import Modal from '../Modal.jsx';
import CardBrief from './CardBrief.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useCardStack } from '../../context/card-stack.js';
import {
  addBrew,
  alchemyPreview,
  brewPrice,
  brewRows,
  brewingCost,
  dropBrew,
  elementLine,
} from '../../lib/alchemy.js';
import { brewingAffordable } from '../../lib/rest.js';
import { getCard } from '../../lib/weapons.js';

/**
 * ALCHEMY, as one long rest action.
 *
 *   "You have learned to brew all Novice Potions. Brewing a potion takes 1 hour,
 *    and whenever you take a long rest you can use your long rest action to brew
 *    two of them and still benefit from the rest.
 *
 *    To brew a potion you need its components. Every recipe prints what those
 *    cost in Supplies, and they come out of the crate on the night you brew it."
 *
 * Two halves, and the top one is the point: **the still**, holding what is going
 * in it tonight, with the count and the running price. A shelf of recipes on its
 * own would be a wall you tap and hope, and the one number a player is actually
 * deciding against is how much of the crate is left.
 *
 * A recipe is an item, so what the wall prints is the card that item teaches: the
 * flask's own text, which is what you are choosing between. The price and the
 * improvised-brewing dice go underneath it, the way the enchantment shelf prints
 * a Magic Burden and a Supplies cost under each working.
 *
 * Nothing here writes. Every choice goes into the rest window's `brews` draft, is
 * priced into its plan, and only "Yes, rest" commits any of it.
 */
export default function BrewRest({ character, kind, state, brews, onDraft, onClose }) {
  const stack = useCardStack();
  if (!state) return null;

  const rows = brewRows(brews, state);
  const spent = brewingCost(brews, state);
  const full = brews.length >= state.perRest;
  const flasks = rows.reduce((total, row) => total + row.made, 0);

  return (
    <Modal
      title="What is in the still?"
      onClose={onClose}
      wide
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className="brew-step-note">
            {brews.length} of {state.perRest} · {spent} Supplies
          </span>
          <span className="spacer" />
          <button type="button" className="btn btn-take btn-sm" onClick={onClose}>
            ← Back to the rest
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        {state.perRest} {state.perRest === 1 ? 'brew' : 'brews'} a night, and each one costs its
        components out of the crate.
        {state.batch > 1
          ? ` Your still fills ${state.batch} flasks off every working, and you keep them all.`
          : ' The flasks go into your pack, ready to be clipped to your belt.'}
        {state.discount > 0
          ? ` Refined Reagents takes ${state.discount} Supplies off every one, never below ${state.floor}.`
          : ''}
      </p>

      {/* ---------- what is going in tonight ---------- */}
      <section className="brew-step">
        <div className="brew-step-head">
          <span className="brew-step-label">In the still</span>
          <span className={`brew-step-note${brews.length === 0 ? ' is-open' : ''}`}>
            {brews.length === 0
              ? 'Empty'
              : `${flasks} ${flasks === 1 ? 'flask' : 'flasks'} · ${spent} Supplies`}
          </span>
        </div>

        {brews.length === 0 ? (
          <p className="pick-line">
            Nothing in it yet. Pick a recipe below, and it lands in the plan behind this window
            where you can read what it costs before anything is spent.
          </p>
        ) : (
          <div className="rest-labours">
            {brews.map((id, index) => {
              const item = state.shelf.find((row) => row.id === id);
              const made = Math.max(1, state.batch);

              return (
                <div className="rest-labour" key={`${id}-${index}`}>
                  <span className="rest-labour-head" style={{ cursor: 'default' }}>
                    <span className="rest-labour-name">{item?.name ?? id}</span>
                    <span className="rest-labour-line">
                      {brewPrice(item, state)} Supplies
                      {made > 1 ? ` · ${made} flasks` : ''}
                    </span>
                  </span>

                  <span className="rest-labour-opts">
                    <button
                      type="button"
                      className="rest-opt"
                      onClick={() => onDraft(dropBrew(brews, state, index))}
                      title={`Take ${item?.name ?? id} back out of the still`}
                    >
                      Take out
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------- the recipes this rank has opened ---------- */}
      <span className="fx-label">
        Recipes
        <span className="rest-labour-rule">{state.tiers.join(', ')}</span>
      </span>

      <div className="card-brief-wall">
        {state.shelf.map((item) => {
          const card = getCard(item.abilities?.[0]);
          if (!card) return null;

          const price = brewPrice(item, state);
          /* Priced against the crate *after* the rest itself and after everything
             already in the still, so a recipe you could never pay for is offered
             dead rather than left to fail at the last button. */
          const canPay = brewingAffordable(character, kind, brews, state, item);
          const allowed = !full && canPay;
          const already = brews.filter((id) => id === item.id).length;

          return (
            <CardBrief
              card={card}
              character={character}
              held={already > 0}
              key={item.id}
              onOpen={() => stack?.openCard(card)}
            >
              <span className="brew-reagent-held">
                {price} Supplies
                {elementLine(item) ? ` · improvised: ${elementLine(item)}` : ''}
                {already > 0 ? ` · ${already} in the still` : ''}
              </span>

              <button
                type="button"
                className={`btn btn-sm card-brief-btn ${allowed ? 'btn-take' : 'btn-minimal'}`}
                disabled={!allowed}
                title={
                  full
                    ? `The still holds ${state.perRest} tonight. Take one out first.`
                    : canPay
                      ? `Brew ${item.name} for ${price} Supplies`
                      : 'Beyond the crate, once the rest is paid for.'
                }
                onClick={() => onDraft(addBrew(brews, state, item.id))}
              >
                {full ? 'Still is full' : canPay ? 'Brew this one' : 'Beyond the crate'}
              </button>
            </CardBrief>
          );
        })}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ the note */

/**
 * What a rank of an alchemical set opens, on the presentation page.
 *
 * Every rank of this set prints a card, so this is not carrying a rank on its
 * own the way the Enchanter's note is. It is here for the one thing the cards
 * cannot say: **REFINED REAGENTS and TWIN DISTILLATION both promise a tier the
 * codex has nothing on yet.** "Adept Potions are within your reach" is true, and
 * a reader who goes looking for one finds an empty shelf, so the note says how
 * many recipes the rank actually reaches and admits when the answer is none.
 *
 * Every number is off the spec, so the day an Adept potion is written this line
 * changes with it and no card has to.
 */
export function AlchemyRankNote({ talent, rank }) {
  const preview = alchemyPreview(talent, rank);
  if (!preview || preview.tiers.length === 0) return null;

  const { opened, count, reach, more, perRest, batch, discount } = preview;

  /* What this rank changes about a night, beyond the shelf. Gathered rather than
     written out, because a rank moves one of them at a time and a sentence built
     for all three would read as a list of nothing twice. */
  const changed = [];
  if (more > 0) changed.push(`${perRest} brews a night`);
  if (batch > 1) changed.push(`${batch} flasks off every one`);
  if (discount > 0) changed.push(`${discount} Supplies off each`);

  return (
    <div className="loadout-note">
      <span className="loadout-note-body">
        <b>
          {count > 0
            ? `+${count} ${listAnd(opened)} ${count === 1 ? 'recipe' : 'recipes'}`
            : `${reach} ${reach === 1 ? 'recipe' : 'recipes'} within reach`}
        </b>
        <span className="loadout-note-line">
          {count > 0
            ? `${reach} on the shelf in all`
            : opened.length > 0
              ? `No ${listAnd(opened)} potion is written yet, so this rank opens a shelf the codex has not filled`
              : 'Nothing new on the shelf at this rank'}
          {changed.length > 0 ? `. ${cap(listAnd(changed))}` : ''}.
        </span>
      </span>
    </div>
  );
}

/** "Novice and Adept", "Novice, Adept and Master". No Oxford comma. */
function listAnd(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function cap(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
