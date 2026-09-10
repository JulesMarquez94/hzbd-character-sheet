import { useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import TagFilter from './TagFilter.jsx';
import useCodexArt from '../useCodexArt.js';
import { Gated } from './parts.jsx';
import { useTagFilter } from './useTagFilter.js';
import PickBlock from './PickBlock.jsx';
import { LearnSection } from './LineagePick.jsx';
import { castModifier } from '../../lib/cardText.js';
import { PICK_ACCENTS } from './pickAccents.js';
import { useCardStack } from '../../context/card-stack.js';
import {
  BACKGROUNDS,
  backgroundState,
  backgroundTags,
  dropSkill,
  skillAnswer,
  skillPicks,
  takeSkill,
  usedBackgroundTags,
} from '../../lib/backgrounds.js';
import { armorSetOptions, getItem, startingWeapons, weaponShelves } from '../../lib/items.js';
import { getAttribute } from '../../lib/attributes.js';
import { formatNumber } from '../../lib/characterModel.js';
import { ARMOR_ORDER, buildKitPatch, buildReturnPatch } from '../../lib/kit.js';

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
 * learn your skills, take your kit. Taking a trade walks you straight through
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
 *
 * ----------------------------------------------------------- the skill's ask
 * A skill can leave a question behind it. Innate Spell Novice promises a spell
 * from any school and names none, so the pool that taught it is where that gets
 * answered: learn the skill and its own shelf opens underneath, in the same
 * window, and the spell you name joins your hand behind it. Same shape the
 * lineage chooser uses, and the same picker.
 */
export default function BackgroundPick({ character, patch, step = null, readOnly = false }) {
  /* Which window is open: the wall of trades, the skill pool, the outfitter, or
     nothing. The walking flag says whether we got here by taking a trade a moment
     ago, which is what decides whether closing one window opens the next. Opening
     the skill pool from the block on its own closes back to the block. */
  const [open, setOpen] = useState(null);
  const [walking, setWalking] = useState(false);
  /* Which skill's own question the pool opens on, if it opens on one. A skill
     that promises a spell and has not named one is reached in one tap from the
     block rather than by scrolling a wall of skills you have already read. */
  const [askOn, setAskOn] = useState(null);
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
    setAskOn(null);
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
      foldable
      summary={
        background
          ? `${background.name} · ${state.skills.map((skill) => skill.name).join(', ') || 'no skills'}`
          : 'No background chosen yet.'
      }
    >
      <p className="pick-lead">
        Your <b>background</b> is what you did before the adventure: the trade or the life you
        came out of. It teaches you one, two or three <b>skills</b>, and it decides what you walk
        in carrying. The two trade against each other, so a life that taught you more left you
        less to spend.
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
            onOpen={(skillId = null) => {
              setWalking(false);
              setAskOn(skillId ?? null);
              setOpen('skills');
            }}
            onCard={(card, modifiers = null) => stack?.openCard(card, modifiers)}
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
          /* Keyed on where it opens, so the block's "answer what they left open"
             lands on the question rather than on the view the window was last
             left in. */
          key={askOn ?? 'wall'}
          startOn={askOn}
          state={state}
          character={character}
          readOnly={readOnly}
          walking={walking && !taken}
          onTake={(id) => patch({ background_skills: takeSkill(background, state.skillIds, id) })}
          onDrop={(id) => patch({ background_skills: dropSkill(background, state.skillIds, id) })}
          /* A skill's own follow-up, written where every other card's choice is
             written: one bag, keyed by the card that asked. */
          onAnswer={(cardId, optionId) =>
            patch({ choices: { ...(character?.choices ?? {}), [cardId]: optionId } })
          }
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
 *
 * A skill that taught a spell shows the spell under it, because that is what is
 * actually on the sheet, and one that has not been asked yet says so in the
 * place the spell would be. Neither is a card you can give back on its own: the
 * spell leaves when the skill does.
 */
function SkillSection({ state, character, patch, readOnly, onOpen, onCard }) {
  const { background, skills, skillIds, picks, remaining, asks, unanswered } = state;
  const choices = character?.choices ?? {};
  // The first skill still owing an answer, which is where the button below goes.
  const owing = asks.find((skill) => !skillAnswer(skill, choices)) ?? null;

  return (
    <div className="pick-part">
      <span className="talent-summary-label">
        Skills
        <span className={`pick-count${remaining || unanswered ? ' is-open' : ''}`}>
          {skillIds.length} of {picks} chosen
        </span>
      </span>

      {skills.length > 0 ? (
        <div className="talent-rung-cards">
          {skills.map((skill) => {
            const picked = skillAnswer(skill, choices);
            const modifiers = picked ? { choice: picked } : null;
            // What the spell behind it is cast with. See SkillPick, same skill.
            const taught = castModifier(skill.choice);

            return (
              <div className="card-choice-row" key={skill.id}>
                <CardBrief
                  card={skill}
                  character={character}
                  modifiers={modifiers}
                  onOpen={() => onCard(skill, modifiers)}
                />

                {picked?.card && (
                  <CardBrief
                    card={picked.card}
                    character={character}
                    modifiers={taught}
                    onOpen={() => onCard(picked.card, taught)}
                  />
                )}
                {skill.choice && !picked && (
                  <p className="pick-line">
                    {skill.name} has not named {skill.choice.placeholder} yet.
                  </p>
                )}

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
            );
          })}
        </div>
      ) : (
        <p className="pick-line">
          Nothing learned yet. {background.name} offers {background.skills.length} skills and lets
          you learn {picks === 1 ? 'one of them' : picks}.
        </p>
      )}

      {!readOnly && (
        <div className="pick-tools pick-tools-tight">
          <button type="button" className="btn btn-sub btn-sm" onClick={() => onOpen(owing?.id)}>
            {remaining
              ? `Choose ${remaining} more`
              : unanswered
                ? 'Answer what they left open'
                : 'Change your skills'}
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
 * Both directions live in src/lib/kit.js since 2026-09-08, because the
 * Crossroads hands a kit over too and one receipt has to hand back either.
 */

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
  /* The rack, cut on the attribute each weapon is swung on. Every Common weapon
     in the codex answers with one of the three, so this is three shelves today;
     a rack that ever came out as one draws as one unheaded wall of chips, the
     way it always did. See `weaponShelves` in items.js. */
  const racks = weaponShelves(guns) ?? [{ shelf: { id: 'all', label: '' }, items: guns }];
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
          <Gated
            className="btn btn-take btn-sm"
            why={ready ? null : reason}
            onClick={() => {
              patch(buildKitPatch({ character, background, armorSet, weapons }));
              onClose();
            }}
          >
            {ready ? 'Take the kit' : reason}
          </Gated>
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
              ? 'two, shelved by the attribute they are swung on: tap to choose, ⓘ to read'
              : 'one Common and unenchanted, shelved by the attribute it is swung on: tap to choose, ⓘ to read'}
          </span>
        </h4>

        {/* Cut in three, on the attribute each one is swung on. This is the
            first weapon anybody in the game ever picks, and it was a wall of
            twenty names: the one thing that decides whether a weapon is any use
            to this character was behind the ⓘ on every one of them. The chip
            wall itself is unchanged, it is drawn three times. */}
        {racks.map(({ shelf, items }) => (
          <div className="kit-shelf" key={shelf.id}>
            {shelf.label && (
              <span className="kit-shelf-label" style={{ color: getAttribute(shelf.id)?.color }}>
                {shelf.label}
              </span>
            )}
            <div className="kit-chips">
              {items.map((weapon) => (
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
          </div>
        ))}
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
                {shown.name} · Skills, learn {skillPicks(shown)} of {shown.skills.length}
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
                    {skillPicks(background)} {skillPicks(background) === 1 ? 'skill' : 'skills'} ·{' '}
                    {formatNumber(background.kit.coins)} ¢ ·{' '}
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
        <b>{skillPicks(background)}</b> {skillPicks(background) === 1 ? 'skill' : 'skills'}
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
 *
 * Two views. Taking a skill that leaves a question open hands the *window* to
 * that question: Innate Spell Novice promises a spell and names none, so naming
 * one is the rest of the same decision and the pool steps aside for it. It used
 * to wait in a section under the wall, where a player who had stopped reading at
 * the skill they wanted never saw it, and Done stays shut until it is answered.
 */
export function SkillChooser({
  state,
  character,
  readOnly,
  walking = false,
  startOn = null,
  onTake,
  onDrop,
  onAnswer,
  onClose,
}) {
  const stack = useCardStack();
  const { background, skillIds, picks, remaining, asks, unanswered } = state;
  const choices = character?.choices ?? {};

  /* Which question has the window, or null for the pool. Read back out of `asks`
     rather than trusted: a skill given back takes its question with it, and the
     view falls to the pool rather than to a card nobody holds. */
  const [asking, setAsking] = useState(startOn);
  const open = asks.find((skill) => skill.id === asking) ?? null;
  const picked = open ? skillAnswer(open, choices) : null;

  /* A skill you hold that has not named its spell is not a finished pick, so the
     window will not call itself done. Named on the button, since a disabled Done
     with no reason on it is the window refusing without saying why.

     **And a trade short of its skills is the same kind of unfinished** (Jules,
     2026-09-10). One of two chosen closed clean and walked you on to the kit,
     which left a background holding half of what it teaches and nothing on the
     screen making you go back for the other half. The count in the footer had
     been saying so in red the whole time. A reader is gated by neither. */
  const owing = asks.find((skill) => !skillAnswer(skill, choices)) ?? null;
  const shut = readOnly
    ? null
    : owing
      ? `${owing.name} has not named ${owing.choice.placeholder} yet`
      : remaining > 0
        ? `${remaining} more ${remaining === 1 ? 'skill' : 'skills'} to choose from ${
            background.name
          }. Take ${remaining === 1 ? 'it' : 'them'} off the wall and this closes.`
        : null;

  /* Taking one is two things when the skill asks something: the skill is yours,
     and the window becomes the question it left. */
  const take = (id) => {
    onTake(id);
    if (background.skills.find((skill) => skill.id === id)?.choice) setAsking(id);
  };

  return (
    <Modal
      title={
        open
          ? `${open.name}: What It Asks You`
          : `${background.name}: Learn ${picks === 1 ? 'a Skill' : `${picks} Skills`}`
      }
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.background}
      footer={
        <>
          <span className={`pick-count${remaining || unanswered ? ' is-open' : ''}`}>
            {skillIds.length} of {picks} chosen
          </span>
          <span className="spacer" />
          {open && (
            <button
              type="button"
              className="btn btn-minimal btn-sm"
              onClick={() => setAsking(null)}
            >
              ← All {background.name} skills
            </button>
          )}
          {/* During the walk this button is the way on to the kit, and says so.
              Opened on its own it only closes. Either way it waits on a skill
              still to choose and on a spell still to name, and it says which of
              the two it is waiting on rather than only greying out. */}
          <Gated className="btn btn-take btn-sm" why={shut} onClick={onClose}>
            {!shut
              ? walking
                ? 'Next: your kit'
                : 'Done'
              : owing
                ? 'One spell to name'
                : `${remaining} still to choose`}
          </Gated>
        </>
      }
    >
      {open ? (
        <>
          <p className="frame-foot" style={{ marginTop: 0 }}>
            <b>{open.name}</b> is yours, and it is not finished. {open.choice.prompt} Tap one and
            the skill rewrites itself around it. You can change it later, from the block or from
            here.
          </p>

          <LearnSection
            card={open}
            picked={picked}
            character={character}
            art={open.art_url ?? null}
            readOnly={readOnly}
            onPick={(optionId) => onAnswer(open.id, optionId)}
          />
        </>
      ) : (
        <>
          <p className="frame-foot" style={{ marginTop: 0 }}>
            {remaining
              ? `Learn ${remaining} more. You can give any of them back and pick again, since none of this is spent until you leave level 1 behind.`
              : unanswered
                ? 'All chosen. One of them is still waiting on an answer.'
                : 'All chosen. Give one back to swap it for another.'}
          </p>

          <div className="card-brief-wall">
            {background.skills.map((skill) => {
              const held = skillIds.includes(skill.id);
              const full = !held && remaining === 0;
              const picked = held ? skillAnswer(skill, choices) : null;
              const modifiers = picked ? { choice: picked } : null;

              return (
                <CardBrief
                  key={skill.id}
                  card={skill}
                  character={character}
                  held={held}
                  modifiers={modifiers}
                  onOpen={() => stack?.openCard(skill, modifiers)}
                >
                  {!readOnly && (
                    <button
                      type="button"
                      className={`btn btn-sm card-brief-btn ${held ? 'btn-minimal talent-drop' : 'btn-take'}`}
                      disabled={full}
                      title={full ? 'No picks left, give one back first' : undefined}
                      onClick={() => (held ? onDrop(skill.id) : take(skill.id))}
                    >
                      {held ? 'Learned, give it back' : full ? 'No picks left' : 'Learn this skill'}
                    </button>
                  )}
                </CardBrief>
              );
            })}
          </div>

          {/* And the way back into a question from the pool. The shelf itself is the
              view above, which is where taking the skill landed you. */}
          {owing && (
            <div className="pick-tools pick-tools-tight">
              <button
                type="button"
                className="btn btn-sub btn-sm"
                onClick={() => setAsking(owing.id)}
              >
                {owing.name} has not named {owing.choice.placeholder} yet. Answer it
              </button>
            </div>
          )}
        </>
      )}
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
