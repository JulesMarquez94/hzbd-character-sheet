import { useState } from 'react';
import Modal from '../Modal.jsx';
import { PICK_ACCENTS } from './pickAccents.js';
import { tagStyle } from '../../lib/tagColors.js';
import { useCardStack } from '../../context/card-stack.js';
import { familyLine, forswearOath, oathOffers, swearOath } from '../../lib/oathbound.js';
import { getCard } from '../../lib/weapons.js';

/**
 * The Oath chooser: ten vows on one wall, and the one press that swears one.
 *
 * The shape PactWindow and FeralWindow both keep, and for their reason: a set
 * that asks a question at the moment it is taken asks it in a window of its own,
 * and the same window is how the table corrects an answer later.
 *
 * ------------------------------------------------------------ what a row says
 * Everything a reader needs to choose between ten of these, and nothing else:
 *
 *   the name and the principle    which vow, and what it comes down to
 *   the two families              what it actually buys you in spells
 *   the three tenets              what it costs you to keep, each with the
 *                                 breach printed under it, because "heal the
 *                                 hurt you pass" and "you walked past somebody"
 *                                 are the two halves of one rule and a player
 *                                 choosing a vow is really choosing the second
 *   the Aura                      the card, one tap away, since it is the one
 *                                 piece of the vow that is a card
 *
 * ---------------------------------------------------------------- and the cost
 * Swearing a second vow is not a rename. It sets the bar back to where a new
 * Oathbound starts, throws the ledger away and lets the consecrated ground go,
 * because none of those things is about the vow you are swearing now. So the
 * second press asks first, and says what goes.
 */
export default function OathWindow({ character, row, patch, onClose, readOnly = false }) {
  const [asking, setAsking] = useState(null);
  const stack = useCardStack();
  const offers = oathOffers(row.spec);
  const locked = readOnly || !patch;

  function take(oath) {
    const body = swearOath(character, row, oath.id);
    if (body) patch(body);
    setAsking(null);
  }

  return (
    <Modal
      title={`${row.talent.name}: swear your ${row.spec.noun ?? 'Oath'}`}
      onClose={onClose}
      size="page"
      accent={PICK_ACCENTS.talent}
      footer={
        <>
          <span className={`pick-count${row.sworn ? '' : ' is-open'}`}>
            {row.sworn ? row.oath.name : 'No Oath sworn'}
          </span>
          <span className="spacer" />
          {row.sworn && !locked && (
            <button
              type="button"
              className="btn btn-minimal btn-sm"
              onClick={() => {
                const body = forswearOath(character, row);
                if (body) patch(body);
              }}
              title="Take the vow back. The bar, the ledger and the ground all go with it"
            >
              Forswear it
            </button>
          )}
          <button type="button" className="btn btn-take btn-sm" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <p className="frame-foot" style={{ marginTop: 0 }}>
        A vow decides two things at once: the three tenets you are held to, and the two sub-schools
        of magic you know in full. Your {row.label} starts at {row.start} and falls {row.decay} every
        Long Rest, so keeping it is something you do between rests.
      </p>

      <div className="oath-wall">
        {offers.map((oath) => {
          const mine = row.oath?.id === oath.id;
          const aura = getCard(oath.aura.id);

          return (
            <div key={oath.id} className={`oath-card${mine ? ' is-on' : ''}`}>
              <div className="oath-card-head">
                <span className="oath-card-name">{oath.name}</span>
                <span className="oath-card-schools">
                  {oath.families.map((pair) => (
                    <span key={pair.family} className="oath-family" style={tagStyle(pair.family)}>
                      {pair.family}
                    </span>
                  ))}
                </span>
              </div>

              <p className="oath-card-principle">{oath.principle}</p>

              <ol className="oath-tenets">
                {oath.tenets.map((tenet) => (
                  <li key={tenet.keep}>
                    <span className="oath-tenet-keep">{tenet.keep}</span>
                    <span className="oath-tenet-break">Broken: {tenet.break.toLowerCase()}</span>
                  </li>
                ))}
              </ol>

              <div className="oath-card-foot">
                <button
                  type="button"
                  className="btn btn-minimal btn-sm"
                  onClick={() => aura && stack?.openCard(aura)}
                  disabled={!aura}
                  title={`${oath.aura.name}: ${oath.aura.summary}`}
                >
                  {oath.aura.name}
                </button>
                <span className="spacer" />

                {mine ? (
                  <span className="pick-count">Sworn</span>
                ) : locked ? null : asking === oath.id ? (
                  <span className="oath-card-ask">
                    <button type="button" className="rest-opt is-gain" onClick={() => take(oath)}>
                      {row.sworn ? 'Swear it anyway' : 'Swear it'}
                    </button>
                    <button type="button" className="rest-opt" onClick={() => setAsking(null)}>
                      Not this one
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sub btn-sm"
                    onClick={() => (row.sworn ? setAsking(oath.id) : take(oath))}
                    title={
                      row.sworn
                        ? `Swearing ${oath.name} sets your ${row.label} back to ${row.start}, empties the ledger and lets your ground go`
                        : `Swear ${oath.name}. It opens ${familyLine({ families: oath.families })}`
                    }
                  >
                    Swear it
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
