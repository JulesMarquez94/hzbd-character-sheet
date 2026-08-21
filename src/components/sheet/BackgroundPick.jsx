import { useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import TagFilter from './TagFilter.jsx';
import useCodexArt from '../useCodexArt.js';
import { useTagFilter } from './useTagFilter.js';
import PickBlock from './PickBlock.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useCardStack } from '../../context/card-stack.js';
import {
  BACKGROUNDS,
  backgroundState,
  backgroundTags,
  dropSkill,
  skillPicks,
  takeSkill,
  usedBackgroundTags,
} from '../../lib/backgrounds.js';
import {
  armorSetOptions,
  armorSetPieces,
  beltSlotCount,
  getItem,
  newCustomId,
  normalizeBelt,
  normalizeEquipment,
  normalizePack,
  startingWeapons,
} from '../../lib/items.js';
import { appendLedger, formatNumber, newLedgerId } from '../../lib/characterModel.js';

/**
 * Background — the life your character led before any of this started.
 *
 * It sits inside the level-1 block beside the lineage and the talent set, and
 * it is the only choice on the page that pays out in three directions at once:
 * the skills that life taught you, the kit you walk in carrying, and the coins
 * and supplies in your pockets.
 *
 * Choosing the background is only the first of three steps, so the block is
 * built as three, each one plainly unfinished until it is done: pick the trade,
 * keep your skills, take your kit. Taking a trade walks you straight through
 * the other two rather than dropping you back on the sheet to find them: the
 * skill pool opens the moment the trade is yours, and the outfitter opens when
 * the skills are settled. Both are still buttons on the block afterwards, so
 * changing your mind never means starting again. The chooser writes the plain name into the
 * character row's own `background` text column, the same one that predates this
 * codex — a name it does not recognise is shown as written rather than cleared,
 * because a table is free to invent its own.
 *
 * The kit is the one part of this block that reaches outside itself: taking it
 * wears the armor you picked, puts the weapon in your hand, clips the trade's
 * odds and ends to your belt, drops the rest in your pack, and moves Coins and
 * Supplies through their ledgers. All of it lands in a single patch, and where
 * every piece went is written down so that handing it back undoes exactly that
 * and nothing else.
 */
export default function BackgroundPick({ character, patch, step = null, readOnly = false }) {
  /* Which window is open: the wall of trades, the skill pool, the outfitter, or
     nothing. The walking flag says whether we got here by taking a trade a moment
     ago, which is what decides whether closing one window opens the next. Opening
     the skill pool from the block on its own closes back to the block. */
  const [open, setOpen] = useState(null);
  const [walking, setWalking] = useState(false);
  const codexArt = useCodexArt();

  const state = backgroundState(character);
  const { background, written, taken } = state;
  const stack = useCardStack();

  /* A held kit pins the background: the record names ids that only make sense
     against the trade that issued them, so it goes back before the trade can
     change. */
  const pinned = taken ? 'Hand the starting kit back before changing your background.' : null;

  function chooseBackground(next) {
    // Skills belong to the pool that offered them, so a new trade starts empty.
    patch({ background: next.name, background_skills: [] });
    /* Straight on to what the trade taught you. A kit cannot already be held
       here — a held kit pins the background, see the pin above — so the walk
       is always skills first, then the outfitter. */
    setWalking(true);
    setOpen(skillPicks(next) > 0 ? 'skills' : 'kit');
  }

  /* Closing the skill pool during the walk hands over to the outfitter; closing
     it any other time is just closing it. */
  function closeSkills() {
    if (walking && !taken) {
      setOpen('kit');
      return;
    }
    setWalking(false);
    setOpen(null);
  }

  function done() {
    setWalking(false);
    setOpen(null);
  }

  return (
    <PickBlock
      kind="background"
      step={step}
      title="Background"
      done={state.complete && taken}
      state={
        !written
          ? 'Waiting on you'
          : state.complete && taken
            ? 'Chosen'
            : 'Half done'
      }
    >
      <p className="pick-lead">
        Your <b>background</b> is what you did before the adventure: the trade or the life you
        came out of. It teaches you a few <b>skills</b>, and it decides what you walk in carrying:
        a weapon, a set of armor and whatever coin and supplies that life left you.
      </p>

      {background ? (
        <>
          <div className="pick-face">
            <span
              className={`pick-art${codexArt(background.art) ? '' : ' pick-art-empty'}`}
              style={
                codexArt(background.art)
                  ? { backgroundImage: `url("${codexArt(background.art)}")` }
                  : undefined
              }
              aria-hidden="true"
            />
            <span className="pick-face-body">
              <span className="pick-value">{background.name}</span>
              <span className="pick-line">{background.tagline}</span>
              <TagRow background={background} />
            </span>
          </div>

          <SkillSection
            state={state}
            character={character}
            patch={patch}
            readOnly={readOnly}
            onOpen={() => {
              setWalking(false);
              setOpen('skills');
            }}
            onCard={(skill) => stack?.openCard(skill)}
          />

          <KitSection
            state={state}
            character={character}
            patch={patch}
            readOnly={readOnly}
            onOpen={() => {
              setWalking(false);
              setOpen('kit');
            }}
          />
        </>
      ) : written ? (
        <div className="pick-face">
          <span className="pick-art pick-art-empty" aria-hidden="true" />
          <span className="pick-face-body">
            <span className="pick-value">{written}</span>
            <span className="pick-line">
              Written in by hand. This build&rsquo;s codex has no background by that name, so it
              hands out no skills and no kit.
            </span>
          </span>
        </div>
      ) : (
        <p className="pick-line">Nothing chosen yet.</p>
      )}

      <div className="pick-tools">
        {!readOnly && (
          <button
            type="button"
            className="btn btn-pick btn-sm"
            onClick={() => {
              setWalking(false);
              setOpen('choose');
            }}
            disabled={Boolean(pinned)}
            title={pinned ?? undefined}
          >
            {written ? 'Change background' : 'Choose a Background'}
          </button>
        )}
        {readOnly && background && (
          <button
            type="button"
            className="btn btn-minimal btn-sm"
            onClick={() => setOpen('choose')}
          >
            Read it
          </button>
        )}
        {!readOnly && written && (
          <>
            <span className="spacer" />
            <button
              type="button"
              className="btn btn-minimal btn-sm talent-drop"
              onClick={() => patch({ background: '', background_skills: [] })}
              disabled={Boolean(pinned)}
              title={pinned ?? undefined}
            >
              Clear
            </button>
          </>
        )}
      </div>

      {open === 'choose' && (
        <BackgroundChooser
          current={background}
          character={character}
          readOnly={readOnly}
          onTake={chooseBackground}
          onClose={done}
        />
      )}

      {open === 'skills' && background && (
        <SkillChooser
          state={state}
          character={character}
          readOnly={readOnly}
          walking={walking && !taken}
          onTake={(id) => patch({ background_skills: takeSkill(background, state.skillIds, id) })}
          onDrop={(id) => patch({ background_skills: dropSkill(background, state.skillIds, id) })}
          onClose={closeSkills}
        />
      )}

      {open === 'kit' && background && !taken && (
        <KitOutfitter
          background={background}
          character={character}
          patch={patch}
          onClose={done}
        />
      )}
    </PickBlock>
  );
}

/* ------------------------------------------------------------- the skills */

/**
 * What the trade taught you. The count is the whole point of the section, so
 * it sits in the heading rather than being inferred from how many rows are
 * showing — "1 of 3" reads as unfinished in a way three rows never will.
 */
function SkillSection({ state, character, patch, readOnly, onOpen, onCard }) {
  const { background, skills, skillIds, picks, remaining } = state;

  return (
    <div className="pick-part">
      <span className="talent-summary-label">
        Skills
        <span className={`pick-count${remaining ? ' is-open' : ''}`}>
          {skillIds.length} of {picks} chosen
        </span>
      </span>

      {skills.length > 0 ? (
        <div className="talent-rung-cards">
          {skills.map((skill) => (
            <div className="card-choice-row" key={skill.id}>
              <CardBrief card={skill} character={character} onOpen={() => onCard(skill)} />
              {!readOnly && (
                <button
                  type="button"
                  className="btn btn-minimal btn-sm talent-drop pick-drop"
                  onClick={() =>
                    patch({ background_skills: dropSkill(background, skillIds, skill.id) })
                  }
                >
                  Give {skill.name} back
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="pick-line">
          Nothing kept yet. {background.name} offers {background.skills.length} skills and lets you
          keep {picks}.
        </p>
      )}

      {!readOnly && (
        <div className="pick-tools pick-tools-tight">
          <button type="button" className="btn btn-sub btn-sm" onClick={onOpen}>
            {remaining ? `Choose ${remaining} more` : 'Change your skills'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- the kit */

/**
 * The one part of this block that writes outside itself. Before it is taken it
 * is an invitation; after, it is a receipt — what was handed over, so that
 * handing it back can return exactly that.
 */
function KitSection({ state, character, patch, readOnly, onOpen }) {
  const { background, kit, taken } = state;
  const [notice, setNotice] = useState('');

  // Taking the kit again makes the hand-back story stale; the receipt above
  // it is the truth now.
  if (taken && notice) setNotice('');

  function handBack() {
    const next = buildReturnPatch({ character, kit });
    patch(next.patch);
    setNotice(next.summary);
  }

  return (
    <div className="pick-part">
      <span className="talent-summary-label">
        Starting Kit
        <span className={`pick-count${taken ? '' : ' is-open'}`}>{taken ? 'taken' : 'waiting'}</span>
      </span>

      {taken ? (
        <>
          <ul className="kit-list">
            <KitLine
              label="Worn"
              value={kit.armorSet}
              note={`${ARMOR_ORDER.filter((slot) => kit.equipment?.[slot]).length} of 3 pieces on`}
            />
            <KitLine
              label={kit.weapons.length > 1 ? 'Weapons' : 'Weapon'}
              value={kit.weapons.map((id) => getItem(id)?.name ?? id).join(' · ')}
            />
            {(kit.belt ?? []).length > 0 && (
              <KitLine
                label="On your belt"
                value={kit.belt.map((entry) => getItem(entry.id)?.name ?? entry.id).join(' · ')}
              />
            )}
            {kit.pack.length > 0 && (
              <KitLine
                label="In your pack"
                value={`${kit.pack.length} item${kit.pack.length === 1 ? '' : 's'}`}
              />
            )}
            <KitLine
              label="Purse"
              value={`${formatNumber(kit.coins)} ¢ · ${formatNumber(kit.supplies)} Supplies`}
            />
          </ul>

          <p className="frame-foot">
            You are wearing it. The armor is on, the weapon is in your hand and the rest is on your
            belt or in your pack, all of it yours to rearrange from the Inventory tab. Handing the
            kit back undoes only what is still where the kit put it.
          </p>

          {!readOnly && (
            <div className="pick-tools pick-tools-tight">
              <button
                type="button"
                className="btn btn-minimal btn-sm talent-drop"
                onClick={handBack}
              >
                Hand the kit back
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="pick-line">
            {background.kit.weapons > 1
              ? 'Two weapons of your choosing, a full set of armor, '
              : 'A weapon of your choosing, a full set of armor, '}
            {formatNumber(background.kit.coins)} ¢ and {formatNumber(background.kit.supplies)}{' '}
            Supplies
            {background.kit.belt.length + background.kit.pack.length > 0
              ? `, and ${background.kit.belt.length + background.kit.pack.length} things the trade leaves in your pockets.`
              : '.'}
          </p>

          {!readOnly && (
            <div className="pick-tools pick-tools-tight">
              <button type="button" className="btn btn-sub btn-sm" onClick={onOpen}>
                Take your starting kit
              </button>
            </div>
          )}
        </>
      )}

      {notice && <p className="pick-notice">{notice}</p>}
    </div>
  );
}

function KitLine({ label, value, note = null, onPeek = null }) {
  return (
    <li className="kit-line">
      <span className="kit-line-label">{label}</span>
      <span className="kit-line-body">
        <span className="kit-line-value">{value}</span>
        {note && <span className="kit-line-note">{note}</span>}
      </span>
      {onPeek && (
        <button
          type="button"
          className="kit-chip-peek"
          onClick={onPeek}
          aria-label={`Read the ${value} card`}
          title={`Read the ${value} card`}
        >
          ⓘ
        </button>
      )}
    </li>
  );
}

/* --------------------------------------------------- handing the kit over *
 * The kit stocks your **inventory**; it never dresses you. Armor, weapons and
 * the odds and ends all land in the pack, and you equip what you want from the
 * Inventory tab — which is where equipping belongs, and which means the kit can
 * never argue with gear you are already holding.
 *
 * Both directions are plain functions over the character row: one builds the
 * patch that stocks it, the other the patch that undoes it. Neither touches the
 * component, and each returns a single patch so the pack and both purses move
 * together or not at all.
 */

const ARMOR_ORDER = ['head', 'torso', 'legs'];
const HANDS = ['main_hand', 'off_hand'];

/**
 * The single patch that dresses a character and stocks the rest, and the record
 * of what went where.
 *
 * The kit puts everything where it belongs: the armor set on your body, the
 * weapon in your hand, the odds and ends on your belt, and whatever is left in
 * your pack. You chose these pieces a moment ago, so making you go and equip
 * them one at a time was busywork.
 *
 * Nothing is ever displaced. A slot or a loop that is already holding something
 * is left exactly as it is and the kit's piece goes to the pack instead, which
 * is what makes this safe to run on a character who is already carrying gear.
 */
function buildKitPatch({ character, background, armorSet, weapons }) {
  const kit = background.kit;
  const equipment = normalizeEquipment(character.equipment);
  const belt = normalizeBelt(character.belt);
  const pack = normalizePack(character.pack);
  const loops = beltSlotCount(character);

  const granted = { equipment: {}, belt: [], pack: [] };

  /** Somewhere to put it, or the pack. */
  function wear(slot, id) {
    if (equipment[slot]) {
      pack.push(id);
      granted.pack.push(id);
      return;
    }
    equipment[slot] = id;
    granted.equipment[slot] = id;
  }

  const pieces = armorSetPieces(armorSet);
  for (const slot of ARMOR_ORDER) {
    if (pieces[slot]) wear(slot, pieces[slot]);
  }

  // First weapon to the main hand, a second to the off hand.
  for (const id of weapons) {
    const free = HANDS.find((hand) => !equipment[hand]);
    if (free) wear(free, id);
    else {
      pack.push(id);
      granted.pack.push(id);
    }
  }

  for (const id of kit.belt) {
    const loop = belt.findIndex((entry, index) => index < loops && !entry);
    if (loop === -1) {
      pack.push(id);
      granted.pack.push(id);
      continue;
    }
    belt[loop] = { id, used: 0 };
    granted.belt.push({ index: loop, id });
  }

  /* Written entries are minted with their own ids, so handing them back finds
     exactly the ones this kit added and never a duplicate someone else wrote.
     They are never anything the codex knows, so they can only go in the pack. */
  for (const entry of kit.pack) {
    const id = newCustomId();
    pack.push({ id, name: entry.name, note: entry.note });
    granted.pack.push(id);
  }

  const ts = new Date().toISOString();
  const note = `${background.name} starting kit`;
  const wealth = Math.max(0, Math.floor(Number(character.wealth) || 0)) + kit.coins;
  const supplies = Math.max(0, Math.floor(Number(character.supplies) || 0)) + kit.supplies;

  // A fresh row may have no ledger at all; both movements append onto whatever
  // is there, so it has to start as a list.
  let ledger = Array.isArray(character.ledger) ? character.ledger : [];
  if (kit.coins > 0) {
    ledger = appendLedger(
      { ledger },
      { id: newLedgerId(), ts, kind: 'wealth', delta: kit.coins, note, balance: wealth }
    );
  }
  if (kit.supplies > 0) {
    ledger = appendLedger(
      { ledger },
      { id: newLedgerId(), ts, kind: 'supplies', delta: kit.supplies, note, balance: supplies }
    );
  }

  return {
    equipment,
    belt,
    pack,
    wealth,
    supplies,
    ledger,
    background_kit: {
      background: background.id,
      armorSet,
      weapons: [...weapons],
      equipment: granted.equipment,
      belt: granted.belt,
      pack: granted.pack,
      coins: kit.coins,
      supplies: kit.supplies,
      ts,
    },
  };
}

/**
 * The patch that gives a kit back, and a line saying what actually moved.
 *
 * Only what is still where the kit put it comes back: a slot the kit filled and
 * nobody has changed since, a loop still holding the flask it clipped there, an
 * id still sitting in the pack. Gear swapped out, a potion drunk, a note thrown
 * away: all left alone. The purse is the exception, since coins and supplies
 * are fungible, so the amounts issued are simply subtracted and neither is
 * dragged below zero to make the sum work.
 */
function buildReturnPatch({ character, kit }) {
  const wanted = [...kit.pack];
  const pack = normalizePack(character.pack).filter((entry) => {
    const id = typeof entry === 'string' ? entry : entry.id;
    const at = wanted.indexOf(id);
    if (at === -1) return true;
    wanted.splice(at, 1);
    return false;
  });

  // A slot is only stripped when it still holds the very piece the kit put
  // there. Anything worn since is somebody's decision, not the kit's.
  const equipment = normalizeEquipment(character.equipment);
  let stripped = 0;
  for (const [slot, id] of Object.entries(kit.equipment ?? {})) {
    if (equipment[slot] === id) {
      equipment[slot] = null;
      stripped += 1;
    }
  }

  const belt = normalizeBelt(character.belt);
  let unclipped = 0;
  for (const { index, id } of kit.belt ?? []) {
    if (belt[index]?.id === id) {
      belt[index] = null;
      unclipped += 1;
    }
  }

  const issued = kit.pack.length + Object.keys(kit.equipment ?? {}).length + (kit.belt ?? []).length;
  const returned = kit.pack.length - wanted.length + stripped + unclipped;

  const ts = new Date().toISOString();
  const note = 'Starting kit handed back';
  const wealthBefore = Math.max(0, Math.floor(Number(character.wealth) || 0));
  const suppliesBefore = Math.max(0, Math.floor(Number(character.supplies) || 0));
  const wealth = Math.max(0, wealthBefore - kit.coins);
  const supplies = Math.max(0, suppliesBefore - kit.supplies);

  let ledger = Array.isArray(character.ledger) ? character.ledger : [];
  if (wealth !== wealthBefore) {
    ledger = appendLedger(
      { ledger },
      { id: newLedgerId(), ts, kind: 'wealth', delta: wealth - wealthBefore, note, balance: wealth }
    );
  }
  if (supplies !== suppliesBefore) {
    ledger = appendLedger(
      { ledger },
      {
        id: newLedgerId(),
        ts,
        kind: 'supplies',
        delta: supplies - suppliesBefore,
        note,
        balance: supplies,
      }
    );
  }

  const kept = issued - returned;
  return {
    patch: { equipment, belt, pack, wealth, supplies, ledger, background_kit: null },
    summary:
      `Kit handed back. ${returned} of ${issued} pieces returned, ` +
      `${formatNumber(wealthBefore - wealth)} ¢ and ${formatNumber(
        suppliesBefore - supplies
      )} Supplies taken back.` +
      (kept > 0
        ? ` ${kept} had already moved on and ${kept === 1 ? 'was' : 'were'} left alone.`
        : ''),
  };
}


/* ----------------------------------------------------------- the outfitter */

/**
 * Two questions and a receipt: which armor, and which weapon (or two). What
 * comes with the trade is fixed and shown rather than asked about.
 *
 * Every piece of gear on this page can be read before it is taken — the sheet's
 * own law, the same one the loadout follows: **tapping is the choice, the ⓘ is
 * the read**. Nobody should have to pick a weapon by its name alone.
 */
function KitOutfitter({ background, character, patch, onClose }) {
  const sets = armorSetOptions();
  const guns = startingWeapons();
  const stack = useCardStack();

  // Deliberately unchosen to begin with: pre-selecting the first set would
  // hand out armor nobody decided on, and the "Choose a set of armor" gate
  // below could never fire.
  const [armorSet, setArmorSet] = useState('');
  const [weapons, setWeapons] = useState([]);

  const needed = background.kit.weapons;
  const peek = (id) => stack?.openItem(getItem(id));

  const ready = Boolean(armorSet) && weapons.length === needed;
  const short = needed - weapons.length;
  const reason = !armorSet
    ? 'Choose a set of armor'
    : `Choose ${short} more weapon${short === 1 ? '' : 's'}`;

  function toggleWeapon(id) {
    setWeapons((held) => {
      if (held.includes(id)) return held.filter((w) => w !== id);
      // At the limit the oldest pick gives way, so a wrong choice is one tap to
      // fix rather than two.
      if (held.length >= needed) return [...held.slice(1), id];
      return [...held, id];
    });
  }

  return (
    <Modal
      title={`${background.name}: Your Starting Kit`}
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.background}
      footer={
        <>
          <span className="spacer" />
          <button
            type="button"
            className="btn btn-take btn-sm"
            disabled={!ready}
            title={ready ? undefined : reason}
            onClick={() => {
              patch(buildKitPatch({ character, background, armorSet, weapons }));
              onClose();
            }}
          >
            {ready ? 'Take the kit' : reason}
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        Taken once, at level 1. The set you choose goes <b>on</b>, the weapon goes in your hand and
        the trade&rsquo;s odds and ends go on your <b>belt</b>; anything that has nowhere to go waits
        in your pack, and a slot you have already filled is never disturbed. Coins and Supplies go
        through their ledgers, and you can hand the whole thing back afterwards.
      </p>

      <section className="kit-step">
        <h4 className="kit-step-head">
          Armor <span className="kit-step-note">one full Common set, all three pieces</span>
        </h4>
        <div className="kit-options">
          {sets.map((set) => (
            <div
              key={set.name}
              className={`kit-option${armorSet === set.name ? ' is-picked' : ''}`}
            >
              <button
                type="button"
                className="kit-option-pick"
                onClick={() => setArmorSet(set.name)}
              >
                <span className="kit-option-name">{set.name}</span>
                <span className="kit-option-bonus">{set.active}</span>
              </button>

              <div className="kit-peek-row">
                {ARMOR_ORDER.map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    className="kit-peek"
                    onClick={() => peek(set.pieces[slot])}
                    title={`Read the ${getItem(set.pieces[slot])?.name} card`}
                  >
                    {getItem(set.pieces[slot])?.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="kit-step">
        <h4 className="kit-step-head">
          {needed > 1 ? 'Weapons' : 'Weapon'}{' '}
          <span className="kit-step-note">
            {needed > 1
              ? 'two: tap to choose, ⓘ to read'
              : 'one Common and unenchanted: tap to choose, ⓘ to read'}
          </span>
        </h4>
        <div className="kit-chips">
          {guns.map((weapon) => (
            <span
              className={`kit-chip${weapons.includes(weapon.id) ? ' is-picked' : ''}`}
              key={weapon.id}
            >
              <button
                type="button"
                className="kit-chip-take"
                onClick={() => toggleWeapon(weapon.id)}
              >
                {weapon.name}
              </button>
              <button
                type="button"
                className="kit-chip-peek"
                onClick={() => peek(weapon.id)}
                aria-label={`Read the ${weapon.name} card`}
                title={`Read the ${weapon.name} card`}
              >
                ⓘ
              </button>
            </span>
          ))}
        </div>
      </section>

      <section className="kit-step">
        <h4 className="kit-step-head">
          What the trade leaves you <span className="kit-step-note">fixed</span>
        </h4>
        <ul className="kit-list">
          {background.kit.belt.map((id) => (
            <KitLine
              key={id}
              label="Gear"
              value={getItem(id)?.name ?? id}
              onPeek={() => peek(id)}
            />
          ))}
          {background.kit.pack.map((entry) => (
            <KitLine key={entry.name} label="Carried" value={entry.name} note={entry.note} />
          ))}
          <KitLine label="Coins" value={`${formatNumber(background.kit.coins)} ¢`} />
          <KitLine label="Supplies" value={formatNumber(background.kit.supplies)} />
        </ul>
      </section>
    </Modal>
  );
}


/* -------------------------------------------------------------- choosers */

/**
 * The same two views the lineage and talent choosers use: a wall of trades, and
 * the one you open — read in full, with its whole skill pool printed as cards,
 * before you spend your level-1 choice on it.
 */
function BackgroundChooser({ current, character, readOnly, onTake, onClose }) {
  const stack = useCardStack();
  const codexArt = useCodexArt();
  const [open, setOpen] = useState(null);
  const filter = useTagFilter(usedBackgroundTags(), { searchable: true });

  const shown = open ? BACKGROUNDS.find((b) => b.id === open) : null;
  const visible = BACKGROUNDS.filter(
    (background) =>
      filter.matches(background.tags) &&
      filter.text(background.name, background.tagline, background.blurb)
  );

  return (
    <Modal
      title={shown ? shown.name : 'Choose a Background'}
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.background}
      footer={
        shown ? (
          <>
            <button type="button" className="btn btn-minimal btn-sm" onClick={() => setOpen(null)}>
              ← All backgrounds
            </button>
            <span className="spacer" />
            {!readOnly && (
              <button
                type="button"
                className="btn btn-take btn-sm"
                disabled={current?.id === shown.id}
                onClick={() => onTake(shown)}
              >
                {current?.id === shown.id ? 'This is your background' : `Take ${shown.name}`}
              </button>
            )}
          </>
        ) : null
      }
    >
      {shown ? (
        <div className="talent-page">
          <header className="talent-page-head">
            <span
              className={`talent-page-art${codexArt(shown.art) ? '' : ' talent-page-art-empty'}`}
              style={
                codexArt(shown.art)
                  ? { backgroundImage: `url("${codexArt(shown.art)}")` }
                  : undefined
              }
              aria-hidden="true"
            />
            <div className="talent-page-intro">
              <h3 className="talent-page-name">{shown.name}</h3>
              <p className="talent-page-tagline">{shown.tagline}</p>
              {shown.blurb.split(/\n\s*\n/).map((paragraph, index) => (
                <p className="talent-page-blurb" key={index}>
                  {paragraph}
                </p>
              ))}
              <TagRow background={shown} />
            </div>
          </header>

          <KitPreview background={shown} />

          <section className="talent-page-rank">
            <div className="talent-page-rank-head">
              <span className="talent-page-rank-label">
                {shown.name} · Skills, keep {skillPicks(shown)} of {shown.skills.length}
              </span>
              {/* Which page this is, rather than when the cards arrived. A
                  trade nobody has taken yet is being read, not held: the pool
                  below is what it would teach, and the picking happens on the
                  page the take button opens. */}
              <span className="talent-page-rank-note">
                {current?.id === shown.id
                  ? 'Yours to change any time'
                  : 'A preview, picked as you take it'}
              </span>
            </div>
            <div className="card-brief-wall">
              {shown.skills.map((skill) => (
                <CardBrief
                  key={skill.id}
                  card={skill}
                  character={character}
                  onOpen={() => stack?.openCard(skill)}
                />
              ))}
            </div>
          </section>
        </div>
      ) : (
        <>
          <p className="frame-foot" style={{ marginTop: 0 }}>
            The life you led before this one. Open a trade to read it in full: what it teaches, and
            what it puts in your hands on the first day.
          </p>

          <TagFilter
            filter={filter}
            count={visible.length}
            noun="background"
            placeholder="Search backgrounds"
          />

          <div className="talent-wall">
            {visible.map((background) => (
              <button
                type="button"
                className={`talent-tile${current?.id === background.id ? ' is-current' : ''}`}
                key={background.id}
                onClick={() => setOpen(background.id)}
              >
                <span
                  className={`talent-tile-art${
                    codexArt(background.art) ? '' : ' talent-tile-art-empty'
                  }`}
                  style={
                    codexArt(background.art)
                      ? { backgroundImage: `url("${codexArt(background.art)}")` }
                      : undefined
                  }
                >
                  {current?.id === background.id && <span className="talent-tile-held">Yours</span>}
                </span>

                <span className="talent-tile-body">
                  <span className="talent-tile-name">{background.name}</span>
                  <span className="talent-tile-line">{background.tagline}</span>
                  <TagRow background={background} />
                  <span className="talent-tile-buy">
                    {skillPicks(background)} skills · {formatNumber(background.kit.coins)} ¢ ·{' '}
                    {formatNumber(background.kit.supplies)} Supplies
                    {background.kit.weapons > 1 ? ' · 2 weapons' : ''}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

/** What a trade hands over, said in one strip so trades can be compared. */
function KitPreview({ background }) {
  const kit = background.kit;

  return (
    <section className="kit-strip">
      <span className="kit-strip-cell">
        <b>{skillPicks(background)}</b> skills
      </span>
      <span className="kit-strip-cell">
        <b>{kit.weapons}</b> weapon{kit.weapons === 1 ? '' : 's'}
      </span>
      <span className="kit-strip-cell">
        <b>1</b> armor set
      </span>
      <span className="kit-strip-cell">
        <b>{formatNumber(kit.coins)}</b> ¢
      </span>
      <span className="kit-strip-cell">
        <b>{formatNumber(kit.supplies)}</b> Supplies
      </span>
      {kit.belt.length + kit.pack.length > 0 && (
        <span className="kit-strip-cell">
          <b>{kit.belt.length + kit.pack.length}</b> items
        </span>
      )}
    </section>
  );
}

/**
 * The pool, printed as cards, with the take button under each. A skill is a
 * paragraph of rules text — it has to be readable in full before it is chosen,
 * which is why these are cards at their real footprint and not a list of names.
 */
function SkillChooser({ state, character, readOnly, walking = false, onTake, onDrop, onClose }) {
  const stack = useCardStack();
  const { background, skillIds, picks, remaining } = state;

  return (
    <Modal
      title={`${background.name}: Keep ${picks} Skills`}
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.background}
      footer={
        <>
          <span className={`pick-count${remaining ? ' is-open' : ''}`}>
            {skillIds.length} of {picks} chosen
          </span>
          <span className="spacer" />
          {/* During the walk this button is the way on to the kit, and says so.
              Opened on its own it only closes. */}
          <button type="button" className="btn btn-take btn-sm" onClick={onClose}>
            {walking ? 'Next: your kit' : 'Done'}
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        {remaining
          ? `Keep ${remaining} more. You can give any of them back and pick again, since none of this is spent until you leave level 1 behind.`
          : 'All chosen. Give one back to swap it for another.'}
      </p>

      <div className="card-brief-wall">
        {background.skills.map((skill) => {
          const held = skillIds.includes(skill.id);
          const full = !held && remaining === 0;

          return (
            <CardBrief
              key={skill.id}
              card={skill}
              character={character}
              held={held}
              onOpen={() => stack?.openCard(skill)}
            >
              {!readOnly && (
                <button
                  type="button"
                  className={`btn btn-sm card-brief-btn ${held ? 'btn-minimal talent-drop' : 'btn-take'}`}
                  disabled={full}
                  title={full ? 'No picks left, give one back first' : undefined}
                  onClick={() => (held ? onDrop(skill.id) : onTake(skill.id))}
                >
                  {held ? 'Chosen, give it back' : full ? 'No picks left' : 'Keep this skill'}
                </button>
              )}
            </CardBrief>
          );
        })}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ parts */


function TagRow({ background }) {
  return (
    <span className="item-tags">
      {backgroundTags(background).map((tag) => (
        <span className={`item-tag tag-${tag.kind} tag-is-${tag.id}`} key={tag.id}>
          {tag.label}
        </span>
      ))}
    </span>
  );
}
