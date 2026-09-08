import PickBlock from './PickBlock.jsx';
import JournalBlock from './JournalBlock.jsx';
import PortraitField from '../images/PortraitField.jsx';

/**
 * Lore: who this character is when nobody is rolling dice, and what the table
 * did last week.
 *
 * Built the way the Advancement tab is built, and for the same reason. A column
 * of identical bordered boxes reads as one long form, and a form is something
 * you fill in once and never open again. Numbered panels, each with its own
 * heading and its own state chip, read as a sequence you can be part way
 * through, which is what lore actually is.
 *
 * The journal at the end is the only part that grows, so it lives in its own
 * file.
 */
const FIELDS = [
  {
    key: 'appearance',
    label: 'Appearance',
    lead: 'What people notice first, and what they only notice later.',
    placeholder: 'Height, build, the way the haze clings to them, what they are never seen without.',
  },
  {
    key: 'personality',
    label: 'Personality & Ideals',
    lead: 'How they carry themselves, and what they will not do.',
    placeholder: 'What they want, what they fear, the line they will not cross.',
  },
  {
    key: 'backstory',
    label: 'Backstory',
    lead: 'Where they came from. Your background says what they did; this says why they stopped.',
    placeholder: 'Where they came from, and what it cost to leave.',
  },
  {
    key: 'allies',
    label: 'Allies, Rivals & Debts',
    lead: 'Every name that could walk through the door mid-session.',
    placeholder: 'Names, factions, favours owed in both directions.',
  },
];

export default function LoreTab({ character, patch, readOnly = false }) {
  const lore = character.lore || {};

  function setField(key, value) {
    patch({ lore: { ...lore, [key]: value } });
  }

  const written = (key) => Boolean(String(lore[key] ?? '').trim());

  return (
    <div className="tab-narrow">
      <div className="panel">
        <PickBlock
          kind="lore"
          step="1"
          title="Portrait & Concept"
          done={Boolean(character.portrait_url || character.blurb)}
          state={character.portrait_url || character.blurb ? 'Written' : 'Blank'}
        >
          <p className="pick-lead">
            The picture and the one line. Both of them travel: the portrait is your dashboard card,
            your face in the campaign log and the plate at the top of this sheet, and the concept is
            what anyone opening the sheet reads first.
          </p>

          <PortraitField
            label="Portrait"
            view="portrait"
            value={character.portrait_url}
            onChange={(url) => patch({ portrait_url: url })}
            readOnly={readOnly}
            hint="Upload a picture and frame it three ways: the tall card, the sheet's plate and the small face the log uses."
          />

          <label className="form-label" htmlFor="blurb" style={{ marginTop: '1rem' }}>
            One-line Concept
          </label>
          <input
            className="form-input"
            readOnly={readOnly}
            id="blurb"
            value={character.blurb || ''}
            placeholder="A tide-born skirmisher who commands bioluminescent aether-swarms."
            onChange={(e) => patch({ blurb: e.target.value })}
          />
        </PickBlock>

        {FIELDS.map((field, index) => (
          <PickBlock
            key={field.key}
            kind="lore"
            step={String(index + 2)}
            title={field.label}
            done={written(field.key)}
            state={written(field.key) ? 'Written' : 'Blank'}
          >
            <p className="pick-lead">{field.lead}</p>
            <textarea
              className="form-textarea"
              readOnly={readOnly}
              style={{ minHeight: 150 }}
              value={lore[field.key] || ''}
              placeholder={field.placeholder}
              onChange={(e) => setField(field.key, e.target.value)}
            />
          </PickBlock>
        ))}

        <JournalBlock
          character={character}
          patch={patch}
          step={String(FIELDS.length + 2)}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
