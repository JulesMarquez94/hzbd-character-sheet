import { useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { tagStyle } from '../../lib/tagColors.js';
import { useCardStack } from '../../context/card-stack.js';
import { MAX_TALENT_RANK } from '../../lib/talents.js';
import { tiersAt, wholePool } from '../../lib/loadouts.js';
import { oathFamilyLine } from '../../lib/oaths.js';
import { oathOffers, oathState, swearOath } from '../../lib/oathbound.js';
import { getCard } from '../../lib/weapons.js';

/**
 * The Oath chooser: ten vows down one side, and the chosen one's **page** on the
 * other.
 *
 * Asked for in as many words: "there should be a page where you can see the
 * Oath, the tenets you're gonna take, a little bit of lore about what that
 * means, and then the specific" cards it hands over. And: "don't preview all the
 * Smites, just the ones related to the one you're observing."
 *
 * So this is not a wall of ten summaries any more. It is a **list and a page**,
 * the pool chooser's two panes with the proportions turned round: a vow is one
 * of ten things you pick between, and everything that matters about it is too
 * long to fit in a tile. An Oath is a sub-talent set, and this reads like a
 * talent set's own presentation page.
 *
 * -------------------------------------------------------------- what a page has
 *   the creed       the one line the whole vow comes down to
 *   the two chips   the sub-schools it opens, in their own family colours
 *   the lore        what it means and who swears it, which is the only place on
 *                   the site that has room for it
 *   the tenets      all three, each a name, the principle, what breaks it and one
 *                   concrete instance so that "wide" does not become "vague"
 *   the cards       the Aura this vow raises and the Smite it deals, both dealt
 *                   onto the stack **wearing this Oath's own damage type**, so
 *                   what you are reading is the card you would actually hold
 *   the spells      both families, every rung, with the rank each one opens at
 *
 * ------------------------------------------------------------------- sworn once
 * "You need to select the Oath before you finish the selection ... that's
 * permanent, so you cannot change it later."
 *
 * There is one press and it appears only while nothing is sworn. After that this
 * window is a **reader**: the page is still here, the spells are still listed and
 * the vow is still yours to go back and read, and there is nothing to press. The
 * one way out is giving the rank back on the Advancement tab, which is undoing a
 * level rather than changing your mind.
 */
export default function OathWindow({ character, row, patch, onClose, readOnly = false }) {
  const offers = oathOffers(row.spec);
  /* Open on what is sworn, or on the first of the ten. A reader coming back to
     their own vow should land on it rather than on somebody else's. */
  const [showing, setShowing] = useState(row.oath?.id ?? offers[0]?.id ?? null);
  const locked = readOnly || !patch || row.sworn;

  const oath = offers.find((one) => one.id === showing) ?? offers[0] ?? null;
  if (!oath) return null;

  return (
    <Modal
      title={row.sworn ? row.oath.name : `${row.talent.name}: swear your ${row.spec.noun ?? 'Oath'}`}
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className={`pick-count${row.sworn ? '' : ' is-open'}`}>
            {row.sworn ? `${row.oath.name} · sworn` : 'Nothing sworn yet'}
          </span>
          <span className="spacer" />
          <button type="button" className="btn btn-take btn-sm" onClick={onClose}>
            {row.sworn ? 'Close' : 'Not yet'}
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        {row.sworn ? (
          <>
            Your vow, and what it holds you to. It was sworn when you took the set and it does not
            change. Your {row.label} starts at {row.start} and falls {row.decay} every Long Rest, so
            keeping it is something you do between rests.
          </>
        ) : (
          <>
            A vow decides three things at once: the tenets you are held to, the two sub-schools of
            magic you know in full, and what your Smite deals. Read them, then swear one.{' '}
            <b>You cannot change it afterwards.</b>
          </>
        )}
      </p>

      <div className="oath-pick">
        {/* ---- the ten ---- */}
        <div className="oath-list">
          {offers.map((one) => (
            <button
              key={one.id}
              type="button"
              className={`oath-row${one.id === oath.id ? ' is-on' : ''}${
                row.oath?.id === one.id ? ' is-sworn' : ''
              }`}
              onClick={() => setShowing(one.id)}
            >
              {/* The name without its "Oath of", because ten rows all starting the
                  same way is ten rows you have to read past. The article an Oath
                  keeps ("the Wild") takes a capital here, since this is a label
                  rather than a sentence. */}
              <span className="oath-row-name">{shortOath(one.name)}</span>
              <span className="oath-row-creed">{one.creed}</span>
              <span className="oath-row-schools">
                {one.families.map((pair) => (
                  <span key={pair.family} className="oath-family" style={tagStyle(pair.family)}>
                    {pair.family}
                  </span>
                ))}
              </span>
            </button>
          ))}
        </div>

        {/* ---- and the page of the one you are reading ---- */}
        <OathPage
          oath={oath}
          row={row}
          sworn={row.oath?.id === oath.id}
          onSwear={
            locked
              ? null
              : () => {
                  const body = swearOath(character, row, oath.id);
                  if (body) patch(body);
                }
          }
        />
      </div>
    </Modal>
  );
}

/** An Oath’s name as the list prints it: "Vindication", "The Wild". */
function shortOath(name) {
  const cut = String(name).replace(/^Oath of /, '');
  return cut.charAt(0).toUpperCase() + cut.slice(1);
}

/**
 * One Oath, in full.
 *
 * Everything here is read off the row in oaths.js and nothing is worked out: a
 * page that had to compute something would be a second place the vow was
 * described.
 */
function OathPage({ oath, row, sworn, onSwear }) {
  const [asking, setAsking] = useState(false);
  const stack = useCardStack();

  const aura = getCard(oath.aura.id);
  const smite = row.spec.smite ? getCard(row.spec.smite) : null;
  /* The Smite as **this** Oath would print it. A vow's damage type is a rider on
     one card in the codex, so a page previewing an unsworn Oath has to lay it on
     by hand exactly as `oathRiders` lays it on a sworn one. */
  const smiteRider = { damage: [oath.damage] };

  /* The Doctrine spec off the set itself. The pool belongs to the set and the
     families belong to the vow, which is the whole of what `families: 'oath'`
     means: one spec, and as many pools as there are vows. */
  const pool = row.talent.loadout;

  /* Both families, rung by rung, with the rank each opens at. Worked out off the
     set's own pool spec with this Oath's families handed in, so the list is the
     list the Doctrine would really give. */
  const shelves = useMemo(() => {
    const families = oath.families.map((pair) => pair.family);
    const rows = [];
    for (let rank = 1; rank <= MAX_TALENT_RANK; rank += 1) {
      const opened = tiersAt(pool, rank).filter(
        (tier) => !tiersAt(pool, rank - 1).includes(tier)
      );
      if (opened.length === 0) continue;
      const cards = wholePool(pool, rank, families).filter((card) =>
        opened.some((tier) => (card.tags ?? [])[0]?.startsWith(tier))
      );
      rows.push({ rank, tier: opened.join(' and '), cards });
    }
    return rows;
  }, [oath, pool]);

  return (
    <div className="oath-page">
      <div className="oath-page-head">
        <span className="oath-page-name">{oath.name}</span>
        <span className="oath-page-schools">
          {oath.families.map((pair) => (
            <span key={pair.family} className="oath-family" style={tagStyle(pair.family)}>
              {pair.family}
            </span>
          ))}
        </span>
      </div>

      <p className="oath-page-creed">{oath.creed}</p>

      {/* ---- what it means ---- */}
      {oath.lore.split('\n\n').map((line) => (
        <p key={line.slice(0, 24)} className="oath-page-lore">
          {line}
        </p>
      ))}

      {/* ---- the three ---- */}
      <div className="stat-category-label">The tenets</div>
      <ol className="oath-page-tenets">
        {oath.tenets.map((tenet) => (
          <li key={tenet.name}>
            <span className="oath-page-tenet-name">{tenet.name}</span>
            <span className="oath-page-tenet-keep">{tenet.keep}</span>
            <span className="oath-page-tenet-break">
              <b>Broken:</b> {tenet.break.charAt(0).toLowerCase() + tenet.break.slice(1)}
            </span>
            <span className="oath-page-tenet-example">{tenet.example}</span>
          </li>
        ))}
      </ol>

      {/* ---- what it hands over ---- */}
      <div className="stat-category-label">What it gives you</div>
      <div className="oath-page-cards">
        {aura && (
          <button
            type="button"
            className="oath-page-card"
            onClick={() => stack?.openCard(aura)}
            title={`Read ${aura.name}`}
          >
            <span className="oath-page-card-name">{aura.name}</span>
            <span className="oath-page-card-note">{aura.summary}</span>
          </button>
        )}
        {smite && (
          <button
            type="button"
            className="oath-page-card"
            onClick={() => stack?.openCard(smite, smiteRider)}
            title={`Read ${smite.name} as this Oath deals it`}
          >
            <span className="oath-page-card-name">
              {smite.name} · <span style={{ color: `var(--dmg-${oath.damage.toLowerCase()})` }}>{oath.damage}</span>
            </span>
            <span className="oath-page-card-note">{smite.summary}</span>
          </button>
        )}
      </div>

      <p className="oath-page-sanctum">
        At Master your Sanctuary takes this Oath&rsquo;s own shape: {oath.sanctum}.
      </p>

      {/* ---- and the magic ---- */}
      <div className="stat-category-label">
        What it opens
        <span className="pick-count">{oathFamilyLine(oath)}</span>
      </div>
      {shelves.map((shelf) => (
        <div key={shelf.rank} className="oath-page-shelf">
          <span className="oath-page-shelf-head">
            Rank {shelf.rank} · {shelf.tier} · {shelf.cards.length}
          </span>
          <span className="oath-page-shelf-list">
            {shelf.cards.length === 0 ? (
              <span className="oath-page-spell is-empty">nothing written for these two yet</span>
            ) : (
              shelf.cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className="oath-page-spell"
                  onClick={() => stack?.openCard(card)}
                  title={card.summary}
                >
                  {card.name}
                </button>
              ))
            )}
          </span>
        </div>
      ))}

      {/* ---- the one press ---- */}
      {onSwear && (
        <div className="oath-page-take">
          {asking ? (
            <>
              <span className="pick-line">
                {oath.name}, and no other, for as long as you hold this set.
              </span>
              <span className="spacer" />
              <button type="button" className="rest-opt is-gain" onClick={onSwear}>
                Swear it
              </button>
              <button type="button" className="rest-opt" onClick={() => setAsking(false)}>
                Go back
              </button>
            </>
          ) : (
            <>
              <span className="pick-line">This is permanent. Read the other nine first.</span>
              <span className="spacer" />
              <button type="button" className="btn btn-take btn-sm" onClick={() => setAsking(true)}>
                Swear {oath.name}
              </button>
            </>
          )}
        </div>
      )}

      {sworn && !onSwear && <p className="oath-page-take is-sworn">This is the vow you swore.</p>}
    </div>
  );
}

/**
 * The vow as the Advancement tab's talent block shows it: what was sworn, and
 * the way into the page.
 *
 * Shown on the slot that bought Rank 1, the way a creature's and a pact's are,
 * and for the sharper version of their reason: the vow is sworn once, at the
 * moment the set is taken, and the ranks above it are the same vow being kept
 * for longer.
 *
 * `autoOpen` is what makes "select the Oath before you finish the selection"
 * true. Taking Rank 1 opens this page on top of the take, so a player chooses a
 * vow in the same motion they chose the set. The badge on the tab is the second
 * half of it: see the `oath` row in `levelAsks`.
 */
export function OathSection({ talent, character, patch, readOnly = false, autoOpen = false }) {
  const [reading, setReading] = useState(autoOpen);

  const row = oathState(character).find((one) => one.id === talent.id);
  if (!row) return null;

  return (
    <div className="pick-part">
      <span className="talent-summary-label">
        {row.spec.noun ?? 'Oath'}
        <span className={`pick-count${row.sworn ? '' : ' is-open'}`}>
          {row.sworn ? row.oath.name : 'not sworn yet'}
        </span>
      </span>

      <p className="pick-line">
        {row.sworn
          ? `${row.oath.creed} It opens ${oathFamilyLine(row.oath)}, your Smite deals ${row.oath.damage}, and it cannot be changed while you hold this set.`
          : `Nothing sworn. Until there is a vow you have no tenets, no Aura and not one spell: everything this set gives you comes out of the Oath.`}
      </p>

      {!readOnly && (
        <div className="pick-tools pick-tools-tight">
          <button type="button" className="btn btn-sub btn-sm" onClick={() => setReading(true)}>
            {row.sworn ? 'Read your Oath' : 'Choose your Oath'}
          </button>
        </div>
      )}

      {reading && (
        <OathWindow
          character={character}
          row={row}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setReading(false)}
        />
      )}
    </div>
  );
}
