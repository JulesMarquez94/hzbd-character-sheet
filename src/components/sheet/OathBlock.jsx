import { useState } from 'react';
import OathWindow from './OathPick.jsx';
import { InfoButton } from './LoadoutBlock.jsx';
import { attributeLabel } from '../../lib/attributes.js';
import { tagStyle } from '../../lib/tagColors.js';
import { useCardStack } from '../../context/card-stack.js';
import { adjustFaith, faithGauge, familyLine, razeSanctuary } from '../../lib/oathbound.js';
import { getCard } from '../../lib/weapons.js';

/**
 * The Oath block: the one a talent set adds when it binds its holder to a vow.
 *
 * Asked for in as many words: "in your character sheet, a new block that appears
 * that tracks your Faith meter and tracks the tenets, and where you can interact
 * with adding and removing from your Faith meter, like any other resource you
 * would manage."
 *
 * So it is four things, in that order:
 *
 *   the bar      where Faith stands, drawn with a **middle** rather than an
 *                empty end, because it runs -100 to 100 and the zero is the
 *                thing you are trying to stay above. Under it, the one sentence
 *                the bar is for: which Attribute it is bending and to what.
 *   the tenets   all three, each with the breach printed under it and a press
 *                on either side. Pressing one moves the bar **and writes down
 *                which tenet it was**, which is the whole reason they are here
 *                rather than being three lines of flavour on a card: a Faith
 *                that fell 40 should be able to say what it fell for.
 *   the ground   what has been consecrated, if anything, and the press that
 *                lets it go. Consecrating is a Long Rest action and happens in
 *                the rest window, which is the only place it could.
 *   the ledger   every movement, newest first, and the only part of the block
 *                with no natural length, so the only part that scrolls.
 *
 * ------------------------------------------------------------------ one block
 * A creature gets two because it has a stat block and a turn to spend. A vow has
 * neither: it is a number, three sentences and a handful of presses, which fits
 * one 360x640 cell with the ledger taking the scroll. Same arrangement the
 * Ossuary and the slate both make.
 *
 * ------------------------------------------------------------- nothing is cast
 * The Aura is not pressed here and neither is Smite. Both are ordinary cards on
 * the quick bar and the Abilities tab, played through the same prompt everything
 * else on this sheet is played through. What this block holds is the thing that
 * has nowhere else to live.
 */
export default function OathBlock({ character, row, patch, readOnly = false }) {
  const [choosing, setChoosing] = useState(false);
  const stack = useCardStack();
  const locked = readOnly || !patch;

  const gauge = faithGauge(row);
  const aura = row.sworn ? getCard(row.oath.aura.id) : null;
  const ground = row.spec.sanctuary?.label ?? 'Sanctuary';

  /* A deed, logged with the tenet it was about. The note is the tenet's own
     sentence rather than something typed, so the ledger reads back as the vow
     rather than as a column of numbers, and it costs the player one press. */
  function move(delta, note, tenet = null) {
    const body = adjustFaith(character, row, delta, { note, tenet });
    if (body) patch(body);
  }

  return (
    <div className="cell-scroll oath-block">
      <div className="block-head">
        <span className="stat-category-label">{row.label}</span>
        <span className="spacer" />
        <span className={`block-count${row.bonus > 0 ? ' is-open' : row.bonus < 0 ? ' is-warning' : ''}`}>
          {row.bonus > 0 ? `+${row.bonus}` : row.bonus < 0 ? row.bonus : 'neutral'}
        </span>
        {!locked && (
          <button
            type="button"
            className="minion-edit"
            onClick={() => setChoosing(true)}
            title={row.sworn ? `Read or change ${row.oath.name}` : 'Swear an Oath'}
          >
            {row.sworn ? 'Oath' : 'Swear one'}
          </button>
        )}
      </div>

      {/* ---------- WHAT WAS SWORN ---------- */}
      <div className="oath-id">
        <span className="oath-id-name">{row.title}</span>
        {row.sworn ? (
          <span className="minion-tags">
            {row.families.map((pair) => (
              <span key={pair.family} className="minion-chip is-toned" style={tagStyle(pair.family)}>
                {pair.family}
              </span>
            ))}
            <span className="minion-chip">{row.talent.name}</span>
          </span>
        ) : (
          <span className="minion-tags">
            <span className="minion-chip is-open">Nothing is open until you swear</span>
          </span>
        )}
      </div>

      {row.sworn && <p className="oath-principle">{row.oath.principle}</p>}

      {/* ---------- THE BAR ----------
          Its own drawing rather than the sheet's ResourceBar, and this is the
          one place on the site that earns it: every other bar runs 0 to a
          maximum and fills from the left, and this one has a middle you are
          trying to stay the right side of. The tick is where the zero is. */}
      <div className="oath-meter">
        <span className="oath-track">
          <span
            className={`oath-fill${row.faith < 0 ? ' is-fallen' : ''}`}
            style={
              row.faith >= 0
                ? { left: `${gauge.middle}%`, width: `${gauge.percent - gauge.middle}%` }
                : { left: `${gauge.percent}%`, width: `${gauge.middle - gauge.percent}%` }
            }
          />
          <span className="oath-zero" style={{ left: `${gauge.middle}%` }} />
          <span className="oath-meter-text">
            {row.faith > 0 ? `+${row.faith}` : row.faith}
          </span>
        </span>
        <span className="oath-meter-ends">
          <span>{row.floor}</span>
          <span className="spacer" />
          <span>{row.ceiling}</span>
        </span>
      </div>

      <p className="oath-bend">
        {!row.sworn ? (
          <>
            Where the bar starts. Nothing is riding on it until an Oath is sworn.
          </>
        ) : row.bonus === 0 ? (
          <>
            Neutral. Your {attributeLabel(row.best)} counts as the {row.held} it is.
          </>
        ) : (
          <>
            Your {attributeLabel(row.best)} counts as <b>{row.value}</b> rather than {row.held} on
            everything this Oath gave you.
          </>
        )}{' '}
        A Long Rest costs {row.decay}.
      </p>

      {/* ---------- EVERYTHING ELSE ----------
          The head, the bar and the bend keep their place and the rest of the
          block scrolls under them, which is `.ossuary-block`'s arrangement. Three
          tenets, a Sanctuary, an Aura and a ledger is more than one 360x640 cell
          holds, and the four things a reader came for are above this line. */}
      <div className="oath-body">
      {/* ---------- THE TENETS ----------
          The set, on the sheet, with a press on either side. Nothing here is
          judged: the table decides whether a tenet was kept and the press writes
          it down. */}
      {row.sworn ? (
        <>
          <div className="stat-category-label">The tenets</div>
          <ol className="oath-tenet-list">
            {row.tenets.map((tenet, index) => (
              <li key={tenet.keep} className="oath-tenet">
                <span className="oath-tenet-body">
                  <span className="oath-tenet-keep">{tenet.keep}</span>
                  <span className="oath-tenet-break">Broken: {tenet.break.toLowerCase()}</span>
                </span>

                {!locked && (
                  <span className="oath-tenet-tools">
                    <button
                      type="button"
                      className="rest-opt is-gain"
                      onClick={() => move(row.step, tenet.keep, index)}
                      title={`Kept it. +${row.step} ${row.label}`}
                    >
                      +{row.step}
                    </button>
                    <button
                      type="button"
                      className="rest-opt"
                      onClick={() => move(-row.step, tenet.break, index)}
                      title={`Broke it. -${row.step} ${row.label}`}
                    >
                      -{row.step}
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="pick-line">
          No Oath sworn. Until there is one you have no tenets, no Aura and not a single spell:
          everything this set gives you comes out of the vow.
        </p>
      )}

      {/* ---------- THE GROUND ---------- */}
      {row.consecrates && (
        <>
          <div className="stat-category-label">{ground}</div>
          {row.consecrated ? (
            <div className="oath-ground">
              <span className="oath-ground-body">
                <span className="oath-ground-name">{row.sanctuary.name ?? 'Consecrated ground'}</span>
                <span className="oath-ground-note">
                  {row.sanctuary.note ??
                    (row.greater
                      ? `A space of its own: ${row.oath?.sanctum ?? 'shaped by your Oath'}.`
                      : 'Everything you do inside it is rolled with advantage.')}
                </span>
              </span>
              {!locked && (
                <button
                  type="button"
                  className="rest-opt"
                  onClick={() => {
                    const body = razeSanctuary(character, row);
                    if (body) patch(body);
                  }}
                  title={
                    row.greater
                      ? `Let it go. The ${row.spec.sanctuary?.willpower ?? 0} maximum Willpower comes back`
                      : 'Let it go'
                  }
                >
                  Let it go
                </button>
              )}
            </div>
          ) : (
            <p className="pick-line">
              No ground held. Consecrating one is a Long Rest action, and the rest window is where
              it is spent.
            </p>
          )}
        </>
      )}

      {/* ---------- THE AURA ----------
          One line, and it is a pointer rather than a control: the card is played
          off the quick bar like everything else. It is here because the Aura is
          the one piece of a vow that is not on this block, and a reader looking
          at their Oath should be one tap from it. */}
      {aura && (
        <div className="oath-aura">
          <span className="oath-aura-body">
            <span className="oath-aura-name">{aura.name}</span>
            <span className="oath-aura-note">{aura.summary}</span>
          </span>
          <InfoButton onClick={() => stack?.openCard(aura)} label={`${aura.name} card`} />
        </div>
      )}

      {/* ---------- THE LEDGER ----------
          The only part with no natural length, so the only part that scrolls. */}
      <div className="stat-category-label">What moved it</div>
      <div className="oath-log">
        {row.log.length === 0 ? (
          <p className="pick-line">Nothing yet. The tenets above are what move it.</p>
        ) : (
          row.log.map((entry) => (
            <div key={entry.id} className={`oath-log-row${entry.delta > 0 ? ' is-gain' : ''}`}>
              <span className="oath-log-delta">
                {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
              </span>
              <span className="oath-log-note" title={entry.note ?? 'No reason given'}>
                {entry.note ?? 'No reason given'}
              </span>
              <span className="oath-log-at">{entry.faith > 0 ? `+${entry.faith}` : entry.faith}</span>
            </div>
          ))
        )}
      </div>

      </div>

      {!locked && row.sworn && (
        <p className="oath-foot">
          {familyLine(row)} are yours in full, as the rungs open. Everything on this block is the
          table&rsquo;s call, not the sheet&rsquo;s.
        </p>
      )}

      {choosing && (
        <OathWindow
          character={character}
          row={row}
          patch={patch}
          readOnly={readOnly}
          onClose={() => setChoosing(false)}
        />
      )}
    </div>
  );
}
