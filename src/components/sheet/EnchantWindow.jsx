import { useMemo, useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import UsePrompt from './UsePrompt.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useCardStack } from '../../context/card-stack.js';
import { spendUse } from '../../lib/combatBar.js';
import { addEffect } from '../../lib/combatTurn.js';
import { ENCHANT_KINDS, enchantKind } from '../../lib/enchantments.js';
import { enchantOptions, enchanterState, ephemeralCost, ephemeralEffect } from '../../lib/enchanting.js';
import { SPELLS } from '../../lib/spells.js';

/**
 * The Ephemeral Enchantment window: every enchantment the Enchanter knows, and a
 * way to put one on somebody for an hour.
 *
 * The card is the whole rule and this window is that rule made pressable:
 *
 *   "You temporarily enchant an item you can touch for the next 1 hour. When
 *    doing so, you choose an enchantment you know, applying its effect to the
 *    wielder of the item. Ephemeral Enchantment costs an amount of Willpower
 *    equal to the enchantment's Magic Burden. This does not count toward the
 *    wielder's Magic Burden and makes the item Attuned to the person wielding it
 *    at the moment of enchantment."
 *
 * ------------------------------------------------------------------- the shelf
 * "You choose an enchantment you know", so the shelf is what the rank knows and
 * nothing else, grouped by what an enchantment is *for* — a body, a weapon, a
 * carried spell — because that is the question being asked. Thirteen briefs in a
 * flat wall is thirteen things to read; four groups of a few is a glance.
 *
 * Each one is the same card brief every other pool on the sheet prints, so an
 * enchantment reads like the card it is and its own words are one tap away.
 *
 * -------------------------------------------------------------------- the cost
 * Three Action Points, printed on the card, and Willpower equal to the
 * enchantment's Magic Burden, which is not knowable until one is chosen. So the
 * card prints `x` for the Willpower and this window is where the whole cost is
 * worked out and paid, in one prompt, the same way the Cauldron pays for a Brew.
 *
 * ------------------------------------------------------------ what it writes
 * One effect on the tracker, carrying the id of what was laid. That id is the
 * whole mechanism: `enchanting.js` reads it back out to raise the attribute, and
 * everything the attribute buys moves with it on the Character tab. Nothing is
 * written into an attribute column, ever — see liveCharacter.
 *
 * The three Imbuements are the ones that ask a second question, because they
 * carry a spell rather than a number and the card does not say which. It is asked
 * here, in the window that granted it, and the chosen spell rides on the effect so
 * the quick bar can offer the casting. A tier the codex has no spells for asks
 * nothing and says why.
 */
export default function EnchantWindow({ character, patch, readOnly = false, onClose }) {
  const state = enchanterState(character);
  const stack = useCardStack();

  /** The enchantment being laid, or null while the shelf is being read. */
  const [chosen, setChosen] = useState(null);
  /** Which spell a Novice Imbuement is carrying, when one is being laid. */
  const [spell, setSpell] = useState(null);
  /** Who or what it is going on, in the player's own words. Optional. */
  const [target, setTarget] = useState('');
  /** The use waiting on the action-or-reaction question. */
  const [paying, setPaying] = useState(null);

  const options = useMemo(() => enchantOptions(character), [character]);

  /* The spells the chosen Imbuement could bind, or none for everything that binds
     no spell. Above the early return, because a hook below one runs in a different
     order on the render where this character is not an Enchanter. */
  const pool = useMemo(
    () => (chosen?.spell ? spellsAt(chosen.spellTier ?? 'Novice') : []),
    [chosen]
  );

  if (!state) return null;

  const cost = chosen ? ephemeralCost(chosen) : { ap: 0, wp: 0 };

  /* An Imbuement carries a spell and has to be told which one. Everything else is
     ready the moment it is chosen.

     **Unless the codex has no spells of that tier.** Master Imbuement can be laid
     today and there is not one Master spell to bind, so the question cannot be
     answered and must not be asked as a condition: the enchantment is real, the
     shelf it binds from is empty, and the table names the spell. Asking anyway
     would leave the only button in the window disabled forever. */
  const asksSpell = Boolean(chosen?.spell) && pool.length > 0;
  const ready = Boolean(chosen) && (!asksSpell || Boolean(spell));

  /** The one write a confirmed enchantment makes: the points, and the effect. */
  function confirm(mode, amount) {
    const body = spendUse(paying, character, mode, amount);

    body.effects = addEffect(
      character?.effects,
      ephemeralEffect(chosen, {
        spell: spell?.name ?? null,
        target: target.trim() || null,
      })
    );

    patch(body);
    setPaying(null);
    onClose();
  }

  return (
    <>
      <Modal
        title="Ephemeral Enchantment"
        onClose={onClose}
        size="page"
        accent={PICK_ACCENTS.talent}
        footer={
          <>
            <span className="brew-step-note">
              {chosen ? `${cost.ap} AP · ${cost.wp} WP` : 'nothing chosen'}
            </span>
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
                  ready
                    ? undefined
                    : chosen
                      ? 'Name the spell it carries first.'
                      : 'Choose an enchantment first.'
                }
                onClick={() =>
                  setPaying({
                    name: 'Ephemeral Enchantment',
                    source: `${chosen.name} · laid for an hour`,
                    ap: cost.ap,
                    wp: cost.wp,
                    card: chosen,
                  })
                }
              >
                Lay it for an hour
              </button>
            )}
          </>
        }
      >
        <p className="frame-foot" style={{ marginTop: 0 }}>
          At rank {state.rank} you know the {listAnd(state.tiers)}{' '}
          {state.tiers.length === 1 ? 'enchantment' : 'enchantments'}. An ephemeral one lasts an
          hour, costs Willpower equal to its Magic Burden and weighs nothing on whoever carries it.
        </p>

        <div className="ench-window">
          <div className="ench-shelf">
            {ENCHANT_KINDS.map((kind) => {
              const rows = options.filter((option) => enchantKind(option.enchantment) === kind.id);
              if (rows.length === 0) return null;

              return (
                <section className="brew-step" key={kind.id}>
                  <div className="brew-step-head">
                    <span className="brew-step-label">{kind.plural}</span>
                    <span className="brew-step-note">{kind.note}</span>
                  </div>

                  <div className="card-brief-wall">
                    {rows.map((option) => (
                      <EnchantRow
                        key={option.enchantment.id}
                        option={option}
                        character={character}
                        chosen={chosen?.id === option.enchantment.id}
                        readOnly={readOnly}
                        onChoose={() => {
                          setChosen(option.enchantment);
                          setSpell(null);
                        }}
                        onOpen={() => stack?.openCard(option.enchantment)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* ---- what is about to be laid ---- */}
          <aside className="brew-preview">
            <div className="brew-step-head">
              <span className="brew-step-label">What it does</span>
              <span className="brew-step-note">
                {chosen ? `${cost.ap} AP · ${cost.wp} WP` : 'nothing yet'}
              </span>
            </div>

            {chosen ? (
              <>
                <CardBrief
                  card={chosen}
                  character={character}
                  onOpen={() => stack?.openCard(chosen)}
                />

                {/* The follow-up the card leaves open, asked in the window that
                    granted it rather than on a control somewhere else. */}
                {chosen.spell && (
                  <SpellPick
                    chosen={spell}
                    onPick={setSpell}
                    pool={pool}
                    tier={chosen.spellTier ?? 'Novice'}
                  />
                )}

                <label className="ench-target">
                  <span className="fx-label">What you touched</span>
                  <input
                    type="text"
                    value={target}
                    maxLength={40}
                    placeholder="Your ring, Sera's blade, anything"
                    onChange={(event) => setTarget(event.target.value)}
                  />
                  <span className="ench-target-note">
                    Optional, and only ever a note: it rides on the tracker row so the table
                    remembers what was touched.
                  </span>
                </label>

                <div className="ench-working">
                  <span className="ench-working-line">
                    <b>{cost.ap} Action Points</b>, printed on the card.
                  </span>
                  <span className="ench-working-line">
                    <b>{cost.wp} Willpower</b>, which is {chosen.name}&rsquo;s own Magic Burden.
                  </span>
                  <span className="ench-working-line">
                    No Magic Burden on the wielder. The card says so in as many words.
                  </span>
                </div>
              </>
            ) : (
              <p className="pick-line">
                Nothing chosen. Pick one off the shelf and this says what it will do, what it
                costs, and what it leaves on the tracker.
              </p>
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

/* ------------------------------------------------------------------ the rows */

/**
 * One enchantment on the shelf, as the brief every other pool prints: the plate,
 * the name, its one line, its chips. What it weighs hangs underneath, because
 * burden is what an ephemeral one costs in Willpower and is the number being
 * chosen between.
 */
function EnchantRow({ option, character, chosen, readOnly, onChoose, onOpen }) {
  const { enchantment, ok, reason } = option;

  return (
    <CardBrief card={enchantment} character={character} held={chosen} onOpen={onOpen}>
      <span className="brew-reagent-held">
        {enchantment.burden} Burden · {enchantment.burden} WP
      </span>

      <button
        type="button"
        className={`btn btn-sm card-brief-btn ${ok && !chosen ? 'btn-take' : 'btn-minimal'}`}
        disabled={!ok || readOnly}
        title={ok ? undefined : reason}
        onClick={onChoose}
      >
        {chosen ? 'Chosen' : ok ? 'Lay this one' : reason}
      </button>
    </CardBrief>
  );
}

/** Every spell of a tier the codex actually holds. Empty is a real answer. */
function spellsAt(tier) {
  return SPELLS.filter((spell) => (spell.tags ?? []).some((tag) => tag.startsWith(tier)));
}

/**
 * Which spell an Imbuement carries.
 *
 * "Enchant an item with a NOVICE spell" names the tier and leaves the spell open,
 * so the tier is what filters this and the choice is the player's. Chips rather
 * than a wall of briefs: the spell's own card is a tap away on the Abilities tab,
 * and what is being answered here is which name goes on the tracker row.
 *
 * An empty pool says so rather than showing nothing. **Master Imbuement is that
 * case today**: the enchantment exists and no Master spell does, so the row is
 * laid without a name and the table supplies one. Saying "no Master spells yet"
 * is the difference between a window that is waiting on the codex and a window
 * that looks broken.
 */
function SpellPick({ chosen, onPick, pool, tier }) {
  return (
    <div className="brew-decision">
      <span className="brew-decision-label">
        The spell it carries
        <span className="brew-decision-asks">
          {pool.length > 0
            ? `One ${tier} spell, and it is cast at its own cost`
            : `No ${tier} spells in the codex yet. Lay it and name one at the table.`}
        </span>
      </span>

      <span className="brew-decision-options">
        {pool.map((spell) => (
          <button
            type="button"
            key={spell.id}
            className={`brew-chip${chosen?.id === spell.id ? ' is-on' : ''}`}
            onClick={() => onPick(spell)}
          >
            {spell.name}
          </button>
        ))}
      </span>
    </div>
  );
}

/** "Novice and Adept", "Novice, Adept and Master". No Oxford comma. */
function listAnd(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
