import { useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import TagFilter from './TagFilter.jsx';
import { ItemIcon } from './itemParts.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useTagFilter } from './useTagFilter.js';
import { useCardStack } from '../../context/card-stack.js';
import { cardHaystack } from '../../lib/abilitySources.js';
import { getBackground, normalizeBackgroundSkills, skillLevel, SKILLS } from '../../lib/backgrounds.js';
import { compareTags, sortCards } from '../../lib/cardOrder.js';
import { levelForXp } from '../../lib/characterModel.js';
import { enchantmentsAt } from '../../lib/enchantments.js';
import { normalizeForged } from '../../lib/forged.js';
import { getItem, normalizeEquipment, normalizePack, startingWeapons } from '../../lib/items.js';
import { normalizeLevelPicks } from '../../lib/levelPicks.js';
import { MOVE_TIERS, movesAt } from '../../lib/martial.js';
import {
  claimBoon,
  claimLoopBoon,
  mintPactWeapon,
  pactSkillIds,
  pactState,
  pactWeaponEnch,
  repickLoopBoon,
  reshapePactWeapon,
  sealPactKind,
  writePactForm,
} from '../../lib/pact.js';
import { SPELLS } from '../../lib/spells.js';
import { getCard } from '../../lib/weapons.js';

/**
 * The Pact of Ordenance's choices: which bargain, what form the weapon takes,
 * and every boon claimed off the ladder.
 *
 * One window (`PactWindow`) asks the take-time questions, the way FeralWindow
 * and MinionWindow do, and one chooser (`PactChooser`) serves every pick the
 * pact ever makes: the two sealed grants, the twelve ladder boons, the endless
 * bargain and every later adjustment. The choices are permanent at the table
 * and adjustable from the Abilities tab (`PactTools`), which is the pair every
 * permanent choice on this sheet keeps.
 */

/* -------------------------------------------------------------- the options */

/** Spells at the given tiers, e.g. every card whose first tag is "Novice Spell". */
function spellOptions(tiers) {
  return sortCards(SPELLS.filter((card) => tiers.some((tier) => card.tags?.[0] === `${tier} Spell`)));
}

/**
 * Enchantments at the given tiers that can be laid on a weapon. `Body` rows are
 * worn on a person and `Curse` rows are nobody's boon, so both stay off the
 * wall. An Imbuement is offered — it binds a spell when it is picked.
 */
function enchantOptions(tiers) {
  return sortCards(
    enchantmentsAt(tiers).filter(
      (card) => !card.tags?.includes('Body') && !card.tags?.includes('Curse')
    )
  );
}

/**
 * Skills this character could learn: the whole wall, minus what the background
 * taught, what a level bought and what this or another pact already granted.
 * Gated by level the way the odd-level chooser gates, because "a skill that he
 * could learn" is the designer's own clause.
 */
function skillOptions(character, keep = null) {
  const level = levelForXp(character?.xp);
  const held = new Set([
    ...normalizeBackgroundSkills(getBackground(character?.background), character?.background_skills),
    ...Object.values(normalizeLevelPicks(character?.level_picks))
      .map((entry) => entry.skill)
      .filter(Boolean),
    ...pactSkillIds(character),
  ]);
  if (keep) held.delete(keep);

  return sortCards(SKILLS.filter((card) => !held.has(card.id) && skillLevel(card) <= level));
}

/** The options one boon slot draws from. */
function optionsFor(kind, tiers, character, keep) {
  if (kind === 'spell') return spellOptions(tiers ?? []);
  if (kind === 'martial-move') return movesAt(tiers ?? MOVE_TIERS);
  if (kind === 'skill') return skillOptions(character, keep);
  if (kind === 'enchant') return enchantOptions(tiers ?? []);
  return [];
}

/** What the pact has already granted, so one boon is never learned twice. */
function grantedIds(state, exceptSlot = null, exceptIndex = null) {
  const out = new Set();
  const add = (pick) => {
    const id = typeof pick === 'string' ? pick : pick?.id;
    if (id) out.add(id);
  };
  for (const { grant, pick } of state.grants) {
    if (pick && grant.id !== exceptSlot) add(pick);
  }
  for (const one of state.boons) {
    if (one.pick && one.boon.id !== exceptSlot) add(one.pick);
  }
  state.extra.forEach((held, index) => {
    if (index !== exceptIndex) add(held.pick);
  });
  return out;
}

/* -------------------------------------------------------------- the chooser */

/**
 * One wall for everything a pact picks: spells, Martial Moves, skills and
 * weapon enchantments, at whatever tiers the slot names. The same brief wall
 * every other pool on the sheet browses, with the card itself one tap away.
 *
 * An Imbuement carries a spell, so picking one walks a second step for the
 * spell it binds; everything else picks in one.
 */
export function PactChooser({ title, kind, tiers, character, state, current, onPick, onClose }) {
  /* The enchantment waiting on its spell, when the pick came in two halves. */
  const [binding, setBinding] = useState(null);

  const currentId = typeof current === 'string' ? current : current?.id;
  const taken = grantedIds(state, null, null);

  const spellStep = Boolean(binding);
  const options = spellStep
    ? spellOptions([binding.spellTier ?? 'Novice'])
    : optionsFor(kind, tiers, character, kind === 'skill' ? currentId : null);

  const offered = options.filter(
    (card) => card.id === currentId || kind === 'enchant' || spellStep || !taken.has(card.id)
  );

  const filter = useTagFilter(wallTags(offered), { searchable: true });
  const visible = offered.filter(
    (card) => filter.matches(card.tags) && filter.text(cardHaystack(card))
  );
  const stack = useCardStack();

  return (
    <Modal
      title={spellStep ? `${binding.name}: the spell it binds` : title}
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          {spellStep && (
            <button type="button" className="btn btn-minimal btn-sm" onClick={() => setBinding(null)}>
              ← Back to the enchantments
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn-take btn-sm" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        {spellStep
          ? 'An Imbuement binds one spell into the weapon the moment it is laid. Choose it, and the boon is claimed with both halves at once.'
          : leadFor(kind, tiers)}
      </p>

      <TagFilter
        filter={filter}
        count={visible.length}
        noun={nounFor(kind)}
        placeholder={`Search ${nounFor(kind)}s`}
      />

      <div className="card-brief-wall">
        {visible.map((card) => (
          <CardBrief
            key={card.id}
            card={card}
            character={character}
            held={card.id === currentId && !spellStep}
            onOpen={() => stack?.openCard(card)}
          >
            <button
              type="button"
              className={`btn btn-sm card-brief-btn ${
                card.id === currentId && !spellStep ? 'btn-minimal talent-drop' : 'btn-take'
              }`}
              onClick={() => {
                if (spellStep) {
                  onPick({ id: binding.id, spell: card.id });
                  onClose();
                  return;
                }
                if (kind === 'enchant' && card.spell) {
                  setBinding(card);
                  return;
                }
                onPick(card.id);
                onClose();
              }}
            >
              {card.id === currentId && !spellStep
                ? 'Your current pick'
                : spellStep
                  ? 'Bind this spell'
                  : kind === 'enchant' && card.spell
                    ? 'Take it · choose its spell'
                    : `Take this ${nounFor(kind)}`}
            </button>
          </CardBrief>
        ))}
        {visible.length === 0 && (
          <p className="pick-notice is-warning">
            This build&rsquo;s codex holds nothing this slot can take yet. Add cards to the codex and
            they appear here on their own.
          </p>
        )}
      </div>
    </Modal>
  );
}

function wallTags(cards) {
  const tally = new Map();
  for (const card of cards) {
    for (const tag of new Set(card.tags ?? [])) {
      tally.set(tag, (tally.get(tag) ?? 0) + 1);
    }
  }

  // The printed tag order, and only chips that narrow. Same cut as poolTags in
  // LoadoutPick.jsx: a chip every card carries selects the whole wall.
  const all = [...tally.keys()].sort(compareTags);
  const narrowing = cards.length > 1 ? all.filter((tag) => tally.get(tag) < cards.length) : all;

  return (narrowing.length > 0 ? narrowing : all).map((tag) => ({ id: tag, label: tag, kind: 'card' }));
}

function nounFor(kind) {
  if (kind === 'spell') return 'spell';
  if (kind === 'martial-move') return 'martial move';
  if (kind === 'skill') return 'skill';
  return 'enchantment';
}

function leadFor(kind, tiers) {
  const reach = tiers && tiers.length > 0 ? `${listOut(tiers)} ` : '';
  if (kind === 'spell') return `Every ${reach}spell in the codex, any school. The pact does not care where its gifts come from.`;
  if (kind === 'martial-move') return `Every ${reach}Martial Move in the codex.`;
  if (kind === 'skill') return 'Any skill you could learn and do not already hold, however it would have been come by.';
  return `Every ${reach}enchantment that can be worked into a weapon. It is laid into your pact-bound weapon at once, costs nothing and weighs nothing on your Magic Burden.`;
}

/* --------------------------------------------------------------- the writes */

/** One claimed pick written down, with the weapon's record rebuilt when it must be. */
function writeClaim(character, state, slotId, pick, patch, { again = false } = {}) {
  const body = claimBoon(character, state, slotId, pick, { again });
  if (!body) return;

  /* An enchant boon lands in two places at once: the pact's own picks and the
     weapon's forged record, so the blade is wearing the working the moment the
     boon is claimed. One patch, so backing nothing out halfway. */
  const slot = state.boons.find((one) => one.boon.id === slotId)?.boon;
  if (slot?.kind === 'enchant' && state.weapon) {
    const ench = pactWeaponEnch(state, { ...state.row.picks, [slotId]: pick });
    body.forged = {
      ...normalizeForged(character.forged),
      [state.weapon.id]: { ...state.weapon, ench },
    };
  }

  patch(body);
}

/* ---------------------------------------------------------------- the forms */

/**
 * Every form the pact-bound weapon can take: the plain weapon wall. The named
 * enchanted blades are particular things with their own histories, not forms,
 * so the list is the same one a starting kit draws from.
 */
export function PactFormWall({ current, onPick }) {
  const weapons = startingWeapons();
  const filter = useTagFilter(wallTags(weapons), { searchable: true });
  const visible = weapons.filter(
    (item) => filter.matches(item.tags) && filter.text(item.name, item.blurb)
  );
  const stack = useCardStack();

  return (
    <>
      <TagFilter filter={filter} count={visible.length} noun="form" placeholder="Search weapons" />
      <div className="pact-form-wall">
        {visible.map((item) => (
          <div key={item.id} className={`pact-form${item.id === current ? ' is-on' : ''}`}>
            <button
              type="button"
              className="pact-form-take"
              onClick={() => onPick(item.id)}
              title={item.id === current ? 'Its current form' : `Reshape into a ${item.name}`}
            >
              <ItemIcon item={item} />
              <span className="pact-form-body">
                <span className="pact-form-name">{item.name}</span>
                <span className="item-tags">
                  {item.tags
                    .filter((tag) => tag !== 'Common' && tag !== 'Weapon')
                    .map((tag) => (
                      <span className="item-tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                </span>
              </span>
            </button>
            <button
              type="button"
              className="icon-btn pact-form-info"
              onClick={() => stack?.openItem(item)}
              title={`Read about the ${item.name}`}
            >
              ⓘ
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

/* --------------------------------------------------------------- the window */

/**
 * Sealing the pact: the bargain, the weapon's form and FIRST BOON's two picks,
 * asked in the window that granted them and each one adjustable after. Done
 * only calls itself done when every question is answered — until then it is
 * disabled and says what is missing, and the escape hatch is the modal's ×.
 */
export function PactWindow({ character, state, patch, readOnly = false, onClose }) {
  const [choosing, setChoosing] = useState(null); // a grant id, or 'form'
  const spec = state.spec;

  /* The window is often open across its own writes, so it re-reads the row
     rather than trusting the prop it mounted with. */
  const live = pactState(character).find((row) => row.id === state.id) ?? state;

  const missing = [];
  if (!live.kind) missing.push('choose your bargain');
  if (!live.weapon) missing.push('choose the weapon’s form');
  for (const { grant, pick } of live.grants) {
    if (!pick) missing.push(grant.label.toLowerCase());
  }
  const shut = missing.length > 0 ? `Still open: ${listOut(missing)}` : null;

  function pickForm(weaponId) {
    const weapon = getItem(weaponId);
    if (!weapon) return;

    if (!live.weapon) {
      /* The first binding: mint the instance, pin it to the first slot and send
         whatever held that slot to the inventory, all in one patch. The
         designer's own walk: "if both are taken the slot 1 weapon is put into
         the inventory, the pact bound always takes slot 1." */
      const record = mintPactWeapon(live, weapon);
      if (!record) return;

      const equipment = normalizeEquipment(character.equipment);
      const pack = normalizePack(character.pack);
      patch({
        forged: { ...normalizeForged(character.forged), [record.id]: record },
        equipment: { ...equipment, main_hand: record.id },
        ...(equipment.main_hand ? { pack: [...pack, equipment.main_hand] } : {}),
        ...writePactForm(character, live, weapon, record.id),
      });
    } else {
      /* A correction rather than a rest: the record reshapes in place and the
         workings ride along. The in-fiction way is the Long Rest action; this
         is the adjusting surface every permanent choice keeps. */
      const record = reshapePactWeapon(live, weapon);
      if (!record) return;
      patch({
        forged: { ...normalizeForged(character.forged), [record.id]: record },
        ...writePactForm(character, live, weapon),
      });
    }
    setChoosing(null);
  }

  const grantChoosing = live.grants.find(({ grant }) => grant.id === choosing) ?? null;

  return (
    <Modal
      title={`${live.talent.name}: seal the pact`}
      onClose={onClose}
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className={`pick-count${shut ? ' is-open' : ''}`}>
            {shut ?? 'The bargain is sealed'}
          </span>
          <span className="spacer" />
          <button
            type="button"
            className="btn btn-take btn-sm"
            onClick={onClose}
            disabled={Boolean(shut)}
            title={shut ?? undefined}
          >
            Done
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        Strike your bargain with the entity in the weapon. What you choose here is permanent at the
        table, and can be corrected from the Abilities tab if the table ever needs it changed.
      </p>

      {/* ---- the bargain ---- */}
      <div className="pick-part">
        <span className="talent-summary-label">
          Your bargain
          <span className={`pick-count${live.kind ? '' : ' is-open'}`}>
            {live.kind ? live.kind.label : 'not chosen yet'}
          </span>
        </span>
        <div className="pact-kinds">
          {spec.kinds.map((kind) => (
            <button
              key={kind.id}
              type="button"
              className={`pact-kind${live.kind?.id === kind.id ? ' is-on' : ''}`}
              disabled={readOnly}
              /* Null when the tap names the bargain already held, so a mis-tap
                 writes nothing and logs nothing. A change carries the standing
                 over between the two ladders — see sealPactKind. */
              onClick={() => {
                const body = sealPactKind(character, live, kind.id);
                if (body) patch(body);
              }}
            >
              <span className="pact-kind-name">{kind.label}</span>
              <span className="pact-kind-line">{kind.line}</span>
              <span className="pact-kind-price">
                First boon at {formatAmount(kind.start)} {kind.unit}, and {formatAmount(kind.step)}{' '}
                more each time
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ---- the weapon ---- */}
      <div className="pick-part">
        <span className="talent-summary-label">
          {spec.weaponLabel}
          <span className={`pick-count${live.weapon ? '' : ' is-open'}`}>
            {live.weapon ? (getItem(live.weapon.base)?.name ?? live.weapon.base) : 'no form yet'}
          </span>
        </span>
        <p className="pick-line">
          It takes the form of any weapon in the codex, holds your first weapon slot and cannot be
          lost or disarmed. Reshaping it later is a Long Rest action.
        </p>
        {!readOnly && (
          <div className="pick-tools pick-tools-tight">
            <button type="button" className="btn btn-sub btn-sm" onClick={() => setChoosing('form')}>
              {live.weapon ? 'Change its form' : 'Choose its form'}
            </button>
          </div>
        )}
      </div>

      {/* ---- FIRST BOON's two picks ---- */}
      {live.grants.map(({ grant, pick }) => (
        <div className="pick-part" key={grant.id}>
          <span className="talent-summary-label">
            {grant.label}
            <span className={`pick-count${pick ? '' : ' is-open'}`}>
              {pick ? (getCard(typeof pick === 'string' ? pick : pick.id)?.name ?? pick) : 'not chosen yet'}
            </span>
          </span>
          {!readOnly && (
            <div className="pick-tools pick-tools-tight">
              <button
                type="button"
                className="btn btn-sub btn-sm"
                onClick={() => setChoosing(grant.id)}
              >
                {pick ? 'Change it' : `Choose your ${nounFor(grant.kind)}`}
              </button>
            </div>
          )}
        </div>
      ))}

      {choosing === 'form' && (
        <Modal
          title={live.weapon ? 'Reshape the pact-bound weapon' : 'The weapon’s form'}
          onClose={() => setChoosing(null)}
          size="page"
          accent={PICK_ACCENTS.talent}
        >
          <p className="frame-foot" style={{ marginTop: 0 }}>
            {live.weapon
              ? 'Any form in the codex. The workings laid into it ride along.'
              : 'Any form in the codex. It takes your first weapon slot the moment you choose; whatever held that slot goes to your inventory.'}
          </p>
          <PactFormWall character={character} current={live.weapon?.base ?? null} onPick={pickForm} />
        </Modal>
      )}

      {grantChoosing && (
        <PactChooser
          title={grantChoosing.grant.label}
          kind={grantChoosing.grant.kind}
          tiers={grantChoosing.grant.tiers}
          character={character}
          state={live}
          current={grantChoosing.pick}
          onPick={(pick) =>
            writeClaim(character, live, grantChoosing.grant.id, pick, patch, {
              again: Boolean(grantChoosing.pick),
            })
          }
          onClose={() => setChoosing(null)}
        />
      )}
    </Modal>
  );
}

/* --------------------------------------------------------------- the claim */

/**
 * A filled bar spent: which boon, then which card. The menu offers only what
 * is open at the held rank, with the claimed rungs shown struck and the locked
 * ones wearing the rank that opens them — a ladder read whole is a ladder
 * nobody has to ask about.
 */
export function ClaimBoonWindow({ character, state, patch, readOnly = false, onClose }) {
  const [claiming, setClaiming] = useState(null); // a boon, or { loop: kind }

  const live = pactState(character).find((row) => row.id === state.id) ?? state;

  return (
    <Modal
      title={`Claim a boon${live.pending > 1 ? ` · ${live.pending} waiting` : ''}`}
      onClose={onClose}
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        The bar is full and the pact giver is holding something out. Boons are claimed one bar at a
        time, each at most once{live.loopOpen ? ', and the endless bargain never runs out' : ''}.
      </p>

      <div className="pact-ladder">
        {live.boons.map(({ boon, state: rung, pick }) => (
          <button
            key={boon.id}
            type="button"
            className={`pact-rung is-${rung}`}
            disabled={readOnly || rung !== 'open' || live.pending === 0}
            onClick={() => setClaiming(boon)}
            title={
              rung === 'claimed'
                ? `Claimed: ${pickName(boon.kind, pick)}`
                : rung === 'lapsed'
                  ? `${pickName(boon.kind, pick)} waits on Rank ${boon.rank} coming back. The bar it cost stays spent.`
                  : rung === 'locked'
                    ? `Opens at Rank ${boon.rank}`
                    : undefined
            }
          >
            <span className="pact-rung-label">{boon.label}</span>
            <span className="pact-rung-state">
              {rung === 'claimed'
                ? pickName(boon.kind, pick)
                : rung === 'lapsed'
                  ? `Rank ${boon.rank} · ${pickName(boon.kind, pick)} waits`
                  : rung === 'locked'
                    ? `Rank ${boon.rank}`
                    : 'Open'}
            </span>
          </button>
        ))}

        {live.loopOpen && (
          <>
            <p className="pick-line">
              Every boon is claimed, so the bargain has no end: each further bar grants any spell or
              any Martial Move.
            </p>
            <div className="pick-tools pick-tools-tight">
              <button
                type="button"
                className="btn btn-take btn-sm"
                disabled={readOnly || live.pending === 0}
                onClick={() => setClaiming({ loop: 'spell' })}
              >
                Any spell
              </button>
              <button
                type="button"
                className="btn btn-take btn-sm"
                disabled={readOnly || live.pending === 0}
                onClick={() => setClaiming({ loop: 'martial-move' })}
              >
                Any Martial Move
              </button>
            </div>
          </>
        )}
      </div>

      {/* Backing out of the wall lands back on the ladder: only a pick made
          closes the whole claim, because a changed mind is not a claim spent. */}
      {claiming && !claiming.loop && (
        <PactChooser
          title={claiming.label}
          kind={claiming.kind}
          tiers={claiming.tiers}
          character={character}
          state={live}
          current={null}
          onPick={(pick) => {
            writeClaim(character, live, claiming.id, pick, patch);
            onClose();
          }}
          onClose={() => setClaiming(null)}
        />
      )}

      {claiming?.loop && (
        <PactChooser
          title={claiming.loop === 'spell' ? 'Any spell' : 'Any Martial Move'}
          kind={claiming.loop}
          tiers={live.spec.loop?.tiers}
          character={character}
          state={live}
          current={null}
          onPick={(pick) => {
            patch(claimLoopBoon(character, live, claiming.loop, pick));
            onClose();
          }}
          onClose={() => setClaiming(null)}
        />
      )}
    </Modal>
  );
}

function pickName(kind, pick) {
  if (!pick) return '';
  if (kind === 'enchant') {
    const id = typeof pick === 'string' ? pick : pick.id;
    return getCard(id)?.name ?? id;
  }
  return getCard(typeof pick === 'string' ? pick : pick.id)?.name ?? String(pick);
}

/* ------------------------------------------------------------- the section */

/**
 * The pick-part on the Advancement tab's talent slot: what the pact stands at,
 * and the button into the sealing window. Opens by itself the moment Rank 1 is
 * bought, like every set that asks a question on take.
 */
export default function PactSection({ talent, character, patch, readOnly = false, autoOpen = false }) {
  const [editing, setEditing] = useState(autoOpen);
  const state = pactState(character).find((row) => row.id === talent.id);
  if (!state) return null;

  const said = state.sealed
    ? `${state.kind.label} · ${getItem(state.weapon?.base)?.name ?? 'a weapon'}`
    : 'not sealed yet';

  return (
    <div className="pick-part">
      <span className="talent-summary-label">
        {state.spec.label}
        <span className={`pick-count${state.sealed ? '' : ' is-open'}`}>{said}</span>
      </span>
      <p className="pick-line">
        Choose your bargain, the form of your pact-bound weapon, a Novice spell and a Novice Martial
        Move. The pact is tracked on its own Character-tab block.
      </p>
      {!readOnly && (
        <div className="pick-tools pick-tools-tight">
          <button type="button" className="btn btn-sub btn-sm" onClick={() => setEditing(true)}>
            {state.sealed ? 'Change the bargain' : 'Seal your pact'}
          </button>
        </div>
      )}
      {editing && (
        <PactWindow
          character={character}
          state={state}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------------- the tools */

/**
 * The Abilities tab's adjusting surface: the sealing window for the bargain and
 * the form, and a change button beside every claimed boon. Permanent at the
 * table, correctable here — the designer asked for exactly this pair.
 */
export function PactTools({ pact, character, patch, readOnly = false }) {
  const [editing, setEditing] = useState(false);
  const [changing, setChanging] = useState(null); // { slot } or { index }
  const { state } = pact;

  const live = pactState(character).find((row) => row.id === state.id) ?? state;

  const claimed = [
    ...live.grants.filter((row) => row.pick).map(({ grant, pick }) => ({ slot: grant, pick })),
    ...live.boons
      .filter((row) => row.state === 'claimed')
      .map(({ boon, pick }) => ({ slot: boon, pick })),
  ];

  return (
    <>
      {!readOnly && (
        <div className="pick-tools pick-tools-tight pact-tools">
          <button type="button" className="btn btn-sub btn-sm" onClick={() => setEditing(true)}>
            {live.sealed ? 'Adjust the pact' : 'Seal your pact'}
          </button>
          {claimed.map(({ slot, pick }) => (
            <button
              key={slot.id}
              type="button"
              className="btn btn-minimal btn-sm"
              onClick={() => setChanging({ slot, pick })}
              title={`${slot.label} · currently ${pickName(slot.kind, pick)}`}
            >
              Change: {pickName(slot.kind, pick)}
            </button>
          ))}
          {live.extra.map((held, index) => (
            <button
              key={`loop-${index}`}
              type="button"
              className="btn btn-minimal btn-sm"
              onClick={() => setChanging({ index, held })}
              title={`Endless bargain · currently ${pickName(held.kind, held.pick)}`}
            >
              Change: {pickName(held.kind, held.pick)}
            </button>
          ))}
        </div>
      )}

      {editing && (
        <PactWindow
          character={character}
          state={live}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setEditing(false)}
        />
      )}

      {changing?.slot && (
        <PactChooser
          title={changing.slot.label}
          kind={changing.slot.kind}
          tiers={changing.slot.tiers}
          character={character}
          state={live}
          current={changing.pick}
          onPick={(pick) =>
            writeClaim(character, live, changing.slot.id, pick, patch, { again: true })
          }
          onClose={() => setChanging(null)}
        />
      )}

      {changing && changing.index !== undefined && (
        <PactChooser
          title="Endless bargain"
          kind={changing.held.kind}
          tiers={live.spec.loop?.tiers}
          character={character}
          state={live}
          current={changing.held.pick}
          onPick={(pick) => patch(repickLoopBoon(character, live, changing.index, pick))}
          onClose={() => setChanging(null)}
        />
      )}
    </>
  );
}

/* ---------------------------------------------------------------- the note */

/**
 * What a rank of the pact opens, on the presentation page beside its cards.
 * A reader deciding on the set should not have to reconstruct the ladder out
 * of three card bodies.
 */
export function PactRankNote({ talent, rank }) {
  const spec = talent?.pact;
  if (!spec) return null;

  const rungs = (spec.boons ?? []).filter((boon) => boon.rank === rank);
  if (rungs.length === 0) return null;

  const souls = spec.kinds.find((kind) => kind.id === 'souls');
  const coins = spec.kinds.find((kind) => kind.id === 'collector');

  return (
    <div className="loadout-note">
      <span className="loadout-note-body">
        <b>
          {rungs.length} {rank === 1 ? 'boons on the ladder' : `more boons at Rank ${rank}`}
        </b>
        <span className="loadout-note-line">
          {rank === 1
            ? `An enchantment for the weapon, a spell, a Martial Move and a skill, each bought by filling the bar. The first bar is ${formatAmount(souls?.start)} souls or ${formatAmount(coins?.start)} coins, and every bar after costs more.`
            : rank === 3
              ? 'The Master rung of each, and once everything is claimed the bargain loops without end, half again dearer each time, for any spell or any Martial Move.'
              : 'The Adept rung of each: enchantment, spell, Martial Move and skill.'}
        </span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ shared */

function formatAmount(value) {
  return new Intl.NumberFormat('en-US').format(Math.max(0, Math.floor(Number(value) || 0)));
}

/** "one, two and three". No Oxford comma. */
function listOut(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
