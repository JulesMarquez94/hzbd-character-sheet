import { useMemo, useState } from 'react';
import CardBrief from './CardBrief.jsx';
import Modal from '../Modal.jsx';
import ShareCode from './ShareCode.jsx';
import TagFilter from './TagFilter.jsx';
import { ItemCarry, ItemIcon, ItemStats, ItemTags } from './itemParts.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { useTagFilter } from './useTagFilter.js';
import { useCardStack } from '../../context/card-stack.js';
import { compareTags, sortCards } from '../../lib/cardOrder.js';
import { ENCHANTMENTS, ENCHANT_KINDS, enchantKind, getEnchantment } from '../../lib/enchantments.js';
import { FORGED_NAME_MAX, forgeRecord, readCode } from '../../lib/forged.js';
import {
  ITEMS,
  RARITY_COLORS,
  getItem,
  magicBurdenMax,
  magicBurdenUsed,
} from '../../lib/items.js';
import { SPELLS } from '../../lib/spells.js';
import { getCard } from '../../lib/weapons.js';

/**
 * The forge: one codex piece, however many workings, and a name.
 *
 * ------------------------------------------------------ why this is not ENCHANTING
 * ENCHANTING is a night's labour. It is gated by the Enchanter's rank, priced in
 * Supplies, capped at one working an item until Rank 3, and it happens inside a
 * Long Rest — see EnchantRest.jsx, which is a different window doing a different
 * job.
 *
 * This is how an enchanted item *arrives*: found in a barrow, bought off a guild,
 * handed over by the table. Nobody at the table paid Supplies for the Deep Sea
 * Trident either, and the codex carries it with two workings on it. So the forge
 * has no rank gate, no price and no cap: it is the codex, opened up, and what
 * goes in it is the table's call rather than the sheet's.
 *
 * The Magic Burden it will cost is printed the whole way through, because that is
 * the number a made item actually has to answer for — capacity is Level + Mind +
 * 10 and a three-working ring will eat most of a low level's allowance.
 *
 * -------------------------------------------------------------------- the code
 * Everything here can arrive as a pasted code instead, and everything made here
 * can leave as one. A code is the base, the workings, the name and the picture —
 * no instance id, so pasting one makes a *new* item to the same design. That is
 * the only honest reading: two players cannot be holding the same ring.
 *
 * A pasted code fills the window rather than committing anything, so it can be
 * read, checked, renamed and then made — or abandoned.
 *
 * ------------------------------------------------------------ the same source
 * A working can go into a piece once. Two Primal Senses in one ring is one point
 * of Instinct for two points of Magic Burden, so the second is refused here
 * rather than sold: the shelf marks it "In it already" the way the Enchanter's
 * own shelf does.
 */
export default function ForgeWindow({ character, onForge, onClose }) {
  const stack = useCardStack();

  /** The codex piece it is being made from, or null while the shelf is read. */
  const [base, setBase] = useState(null);
  /** The workings going in, as `{ id, spell }` — the shape an item carries. */
  const [ench, setEnch] = useState([]);
  /** The two labels. Empty means "whatever the base says". */
  const [name, setName] = useState('');
  const [art, setArt] = useState('');
  /** Which Imbuement is being asked its spell, so one picker serves all three. */
  const [asking, setAsking] = useState(null);
  /** The paste box, and whatever the last read had to say about it. */
  const [code, setCode] = useState('');
  const [note, setNote] = useState(null);

  /* Every tag in the whole codex, worked out once — the shelf is 70 pieces and
     the tag list does not change while the window is open. */
  const tags = useMemo(() => baseTags(), []);
  const filter = useTagFilter(tags, { searchable: true });
  const bases = ITEMS.filter(
    (item) => filter.matches(item.tags) && filter.text(item.name, item.tags.join(' '))
  );

  const record = base
    ? { base: base.id, ench, name: name.trim() || null, art: art.trim() || null }
    : null;

  /* What it will weigh, and what wearing it would put the character at. The
     projection is the honest one — nothing comes off to make room, because a
     made item lands in the inventory rather than in a slot. */
  const burden = ench.reduce((sum, entry) => sum + (getEnchantment(entry.id)?.burden ?? 0), 0);
  const baseBurden = Number(base?.burden) || 0;
  const carried = magicBurdenUsed(character);
  const capacity = magicBurdenMax(character ?? {});

  /**
   * A working in, or a working out.
   *
   * The updater is kept pure and the spell picker is opened *beside* it rather
   * than inside it. Raising `setAsking` from within the `setEnch` updater lost
   * updates outright: two workings taken in the same tick came out as one,
   * because a setState scheduled while React is draining another state's queue
   * makes it re-run that queue from the base value.
   */
  function toggle(enchantment) {
    setNote(null);

    if (ench.some((entry) => entry.id === enchantment.id)) {
      setEnch((list) => list.filter((entry) => entry.id !== enchantment.id));
      if (asking === enchantment.id) setAsking(null);
      return;
    }

    setEnch((list) =>
      list.some((entry) => entry.id === enchantment.id) ? list : [...list, { id: enchantment.id }]
    );
    /* An Imbuement carries a spell and the card does not say which, so it is
       asked here — in the window that granted it, the way every other follow-up
       choice on this sheet is. */
    if (enchantment.spell) setAsking(enchantment.id);
  }

  function bindSpell(enchantId, spell) {
    setEnch((list) =>
      list.map((entry) => (entry.id === enchantId ? { ...entry, spell: spell?.id ?? undefined } : entry))
    );
    setAsking(null);
  }

  /** A pasted code fills the window. Nothing is written until "Make it". */
  function paste() {
    const read = readCode(code);
    if (read.error) {
      setNote({ bad: true, text: read.error });
      return;
    }

    const piece = getItem(read.record.base);
    if (!piece) {
      setNote({
        bad: true,
        text: `That code is for "${read.record.base}", which is not in this codex. A newer build may have it.`,
      });
      return;
    }

    setBase(piece);
    setEnch(read.record.ench);
    setName(read.record.name ?? '');
    setArt(read.record.art ?? '');
    setAsking(null);
    setNote({
      bad: false,
      text:
        read.dropped > 0
          ? `Read: ${piece.name}. ${read.dropped} working${read.dropped === 1 ? '' : 's'} in that code is not in this codex and was left out.`
          : `Read: ${read.record.name ?? piece.name}. Change anything you like, then make it.`,
    });
  }

  const shelves = ENCHANT_KINDS.map((kind) => ({
    ...kind,
    rows: ENCHANTMENTS.filter((entry) => enchantKind(entry) === kind.id),
  })).filter((shelf) => shelf.rows.length > 0);

  return (
    <Modal
      title="Make an Enchanted Item"
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className="brew-step-note">
            {base
              ? `${baseBurden + burden} Magic Burden · ${carried} / ${capacity} carried now`
              : 'no piece chosen'}
          </span>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-take btn-sm"
            disabled={!base}
            title={base ? undefined : 'Choose the piece it is made from first.'}
            onClick={() => {
              onForge(forgeRecord(record));
              onClose();
            }}
          >
            Make it
          </button>
        </>
      }
    >
      {/* ---------- A CODE SOMEBODY SENT YOU ----------
          At the top, because pasting one skips every step below it. */}
      <div className="forge-paste">
        <label className="forge-paste-label" htmlFor="forge-code">
          Somebody sent you a code
        </label>
        <span className="forge-paste-row">
          <input
            id="forge-code"
            className="form-input"
            value={code}
            placeholder="HZBD1.…"
            spellCheck="false"
            onChange={(event) => setCode(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && paste()}
          />
          <button type="button" className="btn btn-minimal btn-sm" onClick={paste}>
            Read it
          </button>
        </span>
        {note && (
          <span className={`forge-note${note.bad ? ' is-bad' : ''}`}>{note.text}</span>
        )}
      </div>

      <div className="ench-window forge-window">
        <div className="ench-shelf">
          {/* ---------- WHAT IT IS MADE FROM ---------- */}
          <section className="brew-step">
            <div className="brew-step-head">
              <span className="brew-step-label">The piece</span>
              <span className="brew-step-note">
                {base ? base.name : 'One, and everything it is comes from here'}
              </span>
            </div>

            {base ? (
              <div className="forge-base">
                <ItemIcon item={base} size={52} />
                <div className="forge-base-body">
                  <span className="forge-base-name">{base.name}</span>
                  <ItemTags item={base} />
                  <ItemStats item={base} />
                  <ItemCarry item={base} />
                </div>
                <button
                  type="button"
                  className="btn btn-minimal btn-sm"
                  onClick={() => setBase(null)}
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <TagFilter filter={filter} count={bases.length} noun="piece" placeholder="Search the codex" />
                <div className="forge-base-list">
                  {bases.length === 0 ? (
                    <p className="browser-empty">Nothing in the codex matches that.</p>
                  ) : (
                    bases.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className="forge-base-row"
                        onClick={() => setBase(item)}
                      >
                        <ItemIcon item={item} />
                        <span className="forge-base-body">
                          <span className="forge-base-name">{item.name}</span>
                          <ItemTags item={item} />
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </section>

          {/* ---------- WHAT GOES INTO IT ---------- */}
          {shelves.map((shelf) => (
            <section className="brew-step" key={shelf.id}>
              <div className="brew-step-head">
                <span className="brew-step-label">{shelf.plural}</span>
                <span className="brew-step-note">{shelf.note}</span>
              </div>

              <div className="card-brief-wall">
                {shelf.rows.map((enchantment) => {
                  const held = ench.some((entry) => entry.id === enchantment.id);

                  return (
                    <CardBrief
                      key={enchantment.id}
                      card={enchantment}
                      character={character}
                      held={held}
                      onOpen={() => stack?.openCard(enchantment)}
                    >
                      <span className="brew-reagent-held">{enchantment.burden} Burden</span>
                      <button
                        type="button"
                        className={`btn btn-sm card-brief-btn ${held ? 'btn-minimal' : 'btn-take'}`}
                        onClick={() => toggle(enchantment)}
                      >
                        {held ? 'Take it out' : 'Work it in'}
                      </button>
                    </CardBrief>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* ---------- WHAT IS ABOUT TO EXIST ---------- */}
        <aside className="brew-preview">
          <div className="brew-step-head">
            <span className="brew-step-label">What you are making</span>
            <span className="brew-step-note">
              {ench.length === 0
                ? 'nothing worked in yet'
                : `${ench.length} working${ench.length === 1 ? '' : 's'}`}
            </span>
          </div>

          {base ? (
            <>
              <div className="forge-face">
                <span
                  className="forge-plate"
                  style={{
                    backgroundImage: previewArt(art) ? `url("${previewArt(art)}")` : undefined,
                  }}
                >
                  {!previewArt(art) && <ItemIcon item={base} size={52} />}
                </span>
                <span className="forge-face-body">
                  <span className="forge-base-name">{name.trim() || base.name}</span>
                  <span className="forge-face-burden">
                    {baseBurden + burden} Magic Burden
                    {carried + baseBurden + burden > capacity && (
                      <b className="forge-over"> · over your capacity worn</b>
                    )}
                  </span>
                </span>
              </div>

              {/* The two labels. Blank means the base's own, which is why the
                  placeholders are the base's own rather than invented. */}
              <label className="ench-target">
                <span className="fx-label">What you call it</span>
                <input
                  type="text"
                  value={name}
                  maxLength={FORGED_NAME_MAX}
                  placeholder={base.name}
                  onChange={(event) => setName(event.target.value)}
                />
                <span className="ench-target-note">
                  Leave it blank and it keeps the codex name.
                </span>
              </label>

              <label className="ench-target">
                <span className="fx-label">A picture of it</span>
                <input
                  type="url"
                  value={art}
                  placeholder={base.art_url ?? 'https://…'}
                  spellCheck="false"
                  onChange={(event) => setArt(event.target.value)}
                />
                <span className="ench-target-note">
                  A link to an image. Blank keeps the codex picture, and yours shows at every
                  account tier because it is yours.
                </span>
              </label>

              {ench.length > 0 && (
                <ul className="forge-list">
                  {ench.map((entry) => {
                    const enchantment = getEnchantment(entry.id);
                    if (!enchantment) return null;
                    const carriedSpell = entry.spell ? getCard(entry.spell) : null;

                    return (
                      <li key={entry.id} className="forge-list-row">
                        <button
                          type="button"
                          className="item-card-link"
                          onClick={() => stack?.openCard(enchantment)}
                        >
                          {enchantment.name}
                        </button>
                        <span className="item-card-note">
                          {enchantment.effect}
                          {enchantment.spell &&
                            (carriedSpell ? ` (${carriedSpell.name})` : ' (no spell named)')}
                        </span>
                        {enchantment.spell && (
                          <button
                            type="button"
                            className="btn btn-minimal btn-sm"
                            onClick={() => setAsking(entry.id)}
                          >
                            {carriedSpell ? 'Change the spell' : 'Name the spell'}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* The follow-up an Imbuement leaves open, asked here. */}
              {asking && <SpellPick enchantId={asking} ench={ench} onPick={bindSpell} />}

              {/* The same code the item itself carries once it exists, so
                  nobody has to write anything down at this step. */}
              <ShareCode record={record} label="Its code, before you have even made it" />
            </>
          ) : (
            <p className="pick-line">
              Nothing chosen. Pick the piece it is made from and this says what it will be, what
              it will weigh, and the code that hands it to somebody else.
            </p>
          )}
        </aside>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ the parts */

/**
 * Which spell an Imbuement carries.
 *
 * The same question EnchantWindow asks and the same answer to an empty shelf:
 * Master Imbuement can be worked in today and the codex holds no Master spell, so
 * the picker says so rather than showing an empty row. The working is real, the
 * shelf it binds from is not there yet, and the table names the spell.
 */
function SpellPick({ enchantId, ench, onPick }) {
  const enchantment = getEnchantment(enchantId);
  const tier = enchantment?.spellTier ?? 'Novice';
  /* The stand-ins are out, the same way they are out of the enchanting shelf:
     UNWRITTEN LIGHT holds a lineage's slot open, it is not a spell to bind. */
  const pool = useMemo(
    () =>
      sortCards(
        SPELLS.filter(
          (spell) => !spell.placeholder && (spell.tags ?? []).some((tag) => tag.startsWith(tier))
        )
      ),
    [tier]
  );
  const chosen = ench.find((entry) => entry.id === enchantId)?.spell ?? null;

  return (
    <div className="brew-decision">
      <span className="brew-decision-label">
        The spell {enchantment?.name} carries
        <span className="brew-decision-asks">
          {pool.length > 0
            ? `One ${tier} spell, cast at its own cost`
            : `No ${tier} spells in the codex yet. Make it and name one at the table.`}
        </span>
      </span>

      <span className="brew-decision-options">
        {pool.map((spell) => (
          <button
            type="button"
            key={spell.id}
            className={`brew-chip${chosen === spell.id ? ' is-on' : ''}`}
            onClick={() => onPick(enchantId, spell)}
          >
            {spell.name}
          </button>
        ))}
      </span>
    </div>
  );
}

/** Every tag anything in the codex carries, for the piece filter. */
function baseTags() {
  const seen = new Map();
  for (const item of ITEMS) {
    for (const tag of item.tags ?? []) {
      if (!seen.has(tag)) {
        seen.set(tag, { id: tag, label: tag, kind: tag in RARITY_COLORS ? 'rarity' : 'kind' });
      }
    }
  }
  // Rarity up its own ladder, the way the pack's chip row reads. See cardOrder.js.
  return [...seen.values()].sort((a, b) => compareTags(a.label, b.label));
}

/**
 * The picture the face draws, which is only ever the player's own.
 *
 * The codex's is deliberately not drawn here: codex art is a paid capability
 * (see useCodexArt.js) and this plate has no business deciding that, so with no
 * picture of the player's the face falls back to `ItemIcon`, which applies the
 * gate the same as every other tile on the sheet.
 */
function previewArt(art) {
  const own = art.trim();
  return /^https?:\/\//i.test(own) ? own : null;
}
