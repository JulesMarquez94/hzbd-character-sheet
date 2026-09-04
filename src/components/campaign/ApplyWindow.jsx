import { useState } from 'react';
import Modal from '../Modal.jsx';
import TargetChip from '../TargetChip.jsx';
import { deltaWords, landHit } from '../../lib/combatApply.js';
import { isFailure } from '../../lib/dice.js';

/**
 * The rolled numbers, landing.
 *
 * Jules, 2026-09-01: "Health, shield and other changes by spells and abilities
 * need to be auto applied based on the result." The dice have already settled
 * and are already in the log; this window is the moment between the number and
 * the bodies. It opens preselected with whoever the use was aimed at, the Game
 * Master can still repoint it — the retarget half of "manage multicast or
 * overcast target change" — and Land it does the arithmetic nobody should be
 * doing in their head at eleven at night:
 *
 *   an enemy    Armor off each landing, the Shield soaks, Health takes the
 *               rest, all written onto the encounter row in one patch.
 *   a player    delivered. The Game Master cannot write a player's sheet, so
 *               the landing goes on the table log and the player's own client
 *               applies it through its own patch, Armor and Shield read off
 *               their own live pools at the moment it lands. See TurnCall.jsx.
 *
 * The lines under each picked chip are the working, said before it happens:
 * "Armor 2 · Shield soaks 3 · 9 to Health". For a player they are worked out
 * from the live sheet this page is already streaming, and worded as the
 * preview they are — the player's own client has the final word, because pools
 * can move in the second between this window opening and the press.
 *
 * Nothing here rolls and nothing here is edited. A table that rules half
 * damage lands the ruling by hand on the block, exactly as before: this window
 * applies what was rolled, or nothing.
 */
export default function ApplyWindow({ apply, roster, onApply, onClose }) {
  const bodies = roster ?? [];
  const [chosen, setChosen] = useState(() =>
    (apply?.preselect ?? []).filter((id) => bodies.some((body) => body.id === id))
  );

  const deltas = apply?.deltas ?? [];
  const outcomes = apply?.outcomes ?? null;
  /* Nothing rolled past the check: everybody dodged, and the window is the
     verdict alone. Worth a window rather than a silence, because "the whole
     volley missed" is the thing the Game Master says next. */
  const nothing = deltas.length === 0;

  function toggle(id) {
    setChosen((was) => (was.includes(id) ? was.filter((held) => held !== id) : [...was, id]));
  }

  return (
    <Modal
      title={`Land it: ${apply?.title ?? 'the roll'}`}
      onClose={onClose}
      footer={
        <>
          <span className="pick-line">
            {nothing
              ? 'Nothing to land.'
              : chosen.length === 0
                ? 'Pick who it lands on, or close this and land it by hand.'
                : `Lands on ${chosen.length} ${chosen.length === 1 ? 'body' : 'bodies'}.`}
          </span>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onClose}>
            {nothing ? 'Close' : 'Not now'}
          </button>
          {!nothing && (
            <button
              type="button"
              className="btn btn-copper btn-sm"
              onClick={() => onApply(chosen)}
              disabled={chosen.length === 0}
              autoFocus
            >
              Land it
            </button>
          )}
        </>
      }
    >
      <div className="apply-window">
        <p className="apply-lead">
          {nothing
            ? `Every target dodged ${apply?.caster?.name ?? 'the roll'}.`
            : `${apply?.caster?.name ? `${apply.caster.name} rolled` : 'Rolled'} ${deltas
                .map((delta) => deltaWords(delta))
                .join(' and ')}. Armor and Shield are taken off on landing.`}
        </p>

        {/* The one roll, judged per body: who it critically caught, who it
            caught and who dodged. The hits arrive already picked below; a miss
            can still be picked back up, because the table outranks the sheet. */}
        {outcomes && <VerdictStrip outcomes={outcomes} />}

        {!nothing && (
          <>
            {/* What was rolled, one row per kind, in the order it was thrown. */}
            <div className="apply-deltas">
              {deltas.map((delta) => (
                <span key={delta.kind} className={`apply-delta is-${delta.kind}`}>
                  <b>{delta.total}</b>
                  <span className="apply-delta-what">
                    {delta.kind === 'damage'
                      ? [delta.types?.join(' or '), 'damage'].filter(Boolean).join(' ')
                      : delta.kind === 'healing'
                        ? 'Health'
                        : 'Shield'}
                  </span>
                  {delta.landings.length > 1 && (
                    <span className="apply-delta-landings">
                      {delta.landings.length} landings · {delta.landings.join(', ')}
                    </span>
                  )}
                </span>
              ))}
            </div>

            <div className="tgt-row apply-targets">
              {bodies.map((body) => (
                <TargetChip
                  key={body.id}
                  body={body}
                  on={chosen.includes(body.id)}
                  onToggle={() => toggle(body.id)}
                />
              ))}
            </div>

            {/* The working, per picked body. Said before it happens, because a
                sheet that quietly moves numbers is a sheet you stop trusting. */}
            {chosen.length > 0 && (
              <div className="apply-lines">
                {chosen
                  .map((id) => bodies.find((body) => body.id === id))
                  .filter(Boolean)
                  .map((body) => (
                    <div key={body.id} className="apply-line">
                      <span
                        className="apply-line-name"
                        style={{ '--tgt-tone': body.kind === 'member' ? 'var(--focus-cyan)' : body.tone }}
                      >
                        {body.name}
                      </span>
                      <span className="apply-line-math">
                        {deltas.map((delta) => landingLine(body, delta)).join(' · ')}
                        {body.kind === 'member' ? ' · their sheet has the final word' : ''}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

/**
 * The one roll against everybody it was aimed at: critically hit, hit, missed,
 * each with its names. The words the table says out loud, in the window that
 * lands the consequences.
 */
function VerdictStrip({ outcomes }) {
  const bands = [
    { label: 'Critically hit', tone: 'var(--level-amber)', names: outcomes.filter((entry) => entry.verdict === 'critical-success') },
    { label: 'Hit', tone: 'var(--def-healing)', names: outcomes.filter((entry) => entry.verdict === 'success') },
    { label: 'Missed', tone: 'var(--stat-health)', names: outcomes.filter((entry) => isFailure(entry.verdict)) },
  ].filter((band) => band.names.length > 0);

  return (
    <div className="apply-verdicts">
      {bands.map((band) => (
        <span key={band.label} className="apply-verdict" style={{ '--verdict-tone': band.tone }}>
          <b>{band.label}</b>
          {band.names.map((entry) => entry.name).join(', ')}
        </span>
      ))}
    </div>
  );
}

/**
 * One body's arithmetic for one delta, in words: "Armor 2, Shield soaks 3, 9
 * to Health". Worked out over the pools as this page holds them, which for a
 * player is a preview and for an enemy is the write itself.
 */
function landingLine(body, delta) {
  if (delta.kind === 'healing') return `+${delta.total} Health`;
  if (delta.kind === 'shield') return `+${delta.total} Shield`;

  let shield = Math.max(0, Math.floor(Number(body.shieldNow) || 0));
  let soaked = 0;
  let dealt = 0;
  for (const landing of delta.landings) {
    const hit = landHit({ shield, armor: body.armor }, landing);
    shield -= hit.soaked;
    soaked += hit.soaked;
    dealt += hit.dealt;
  }

  const parts = [];
  if ((Number(body.armor) || 0) > 0) parts.push(`Armor ${body.armor}`);
  if (soaked > 0) parts.push(`Shield soaks ${soaked}`);
  parts.push(dealt > 0 ? `${dealt} to Health` : 'nothing gets through');
  return parts.join(', ');
}
