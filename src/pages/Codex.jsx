import './Codex.css';

const DAMAGE_TYPES = [
  ['Blunt', 'var(--dmg-blunt)'],
  ['Sharp', 'var(--dmg-sharp)'],
  ['Force', 'var(--dmg-force)'],
  ['Fire', 'var(--dmg-fire)'],
  ['Frost', 'var(--dmg-frost)'],
  ['Lightning', 'var(--dmg-lightning)'],
  ['Psychic', 'var(--dmg-psychic)'],
  ['Decay', 'var(--dmg-decay)'],
  ['Sacred', 'var(--dmg-sacred)'],
];

const DEFENCES = [
  ['Healing Effect', 'var(--def-healing)'],
  ['Shield', 'var(--def-shield)'],
];

const ATTRIBUTES = [
  ['Physique', 'var(--attr-physique)', 'Raw force, endurance and carrying capacity. Drives Health and melee damage.'],
  ['Instinct', 'var(--attr-instinct)', 'Reflex, perception and aim. Drives Avoid, Initiative and ranged attacks.'],
  ['Mind', 'var(--attr-mind)', 'Focus, lore and arcane command. Drives Willpower and spell attacks.'],
];

const RESOURCES = [
  ['Health', 'var(--stat-health)', 'Your body. At zero you fall Unconscious.'],
  ['Shield', 'var(--stat-shield)', 'Temporary buffer, consumed before Health.'],
  ['Action Points', 'var(--stat-ap)', 'Spent on your turn. Every ability lists an AP cost.'],
  ['Reaction Points', 'var(--stat-rp)', 'Spent outside your turn, on triggers and interrupts.'],
  ['Willpower', 'var(--stat-wp)', 'Fuel for spells. Some talents refund it.'],
  ['Karma', 'var(--stat-karma)', 'Meta-currency. Reroll, empower, or bend fate.'],
  ['Armor', 'var(--stat-armor)', 'Flat reduction applied after a hit lands.'],
  ['Speed', 'var(--stat-speed)', 'Distance moved per Action Point spent.'],
  ['Initiative', 'var(--stat-init)', 'Turn order at the start of a conflict.'],
];

function TokenIcon({ color }) {
  return (
    <svg className="token-icon" style={{ color }} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2L2 12l10 10 10-10L12 2zm0 16.5L5.5 12 12 5.5 18.5 12 12 18.5z"
      />
    </svg>
  );
}

function TokenRow({ name, color }) {
  return (
    <div className="token-row">
      <TokenIcon color={color} />
      <span className="token-name" style={{ color }}>
        {name}
      </span>
    </div>
  );
}

function InlineToken({ label, color }) {
  return (
    <span className="inline-token" style={{ color }}>
      <TokenIcon color={color} />
      {label}
    </span>
  );
}

export default function Codex() {
  return (
    <main className="container page">
      <header className="codex-header">
        <h1 className="heading-section">System Token Registry</h1>
        <p className="muted">Audited colour profiles and vector synchronisation for every Hazebound value.</p>
      </header>

      <div className="codex-grid">
        <section className="panel codex-panel">
          <h2 className="codex-title">Damage Registry</h2>
          {DAMAGE_TYPES.map(([name, color]) => (
            <TokenRow key={name} name={name} color={color} />
          ))}
        </section>

        <section className="panel codex-panel">
          <h2 className="codex-title">Defences &amp; Attributes</h2>
          {DEFENCES.map(([name, color]) => (
            <TokenRow key={name} name={name} color={color} />
          ))}

          <div className="codex-spacer" />

          {ATTRIBUTES.map(([name, color, blurb]) => (
            <div className="token-row token-row-tall" key={name}>
              <TokenIcon color={color} />
              <div>
                <span className="token-name" style={{ color }}>
                  {name}
                </span>
                <p className="token-blurb">{blurb}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="panel codex-panel">
          <h2 className="codex-title">Resource Pools &amp; Stats</h2>
          {RESOURCES.map(([name, color, blurb]) => (
            <div className="token-row token-row-tall" key={name}>
              <TokenIcon color={color} />
              <div>
                <span className="token-name" style={{ color }}>
                  {name}
                </span>
                <p className="token-blurb">{blurb}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="demo-box">
        <h2 className="codex-title">Inline Rules Preview</h2>
        <p>
          When an alchemical mine detonates within a character&rsquo;s zone, they run a reactive check using
          their <InlineToken label="Instinct" color="var(--attr-instinct)" /> parameter. Escaping the blast
          area costs <InlineToken label="3 Action Points" color="var(--stat-ap)" />. Failure triggers a cloud
          of toxic fumes dealing <InlineToken label="10 Decay" color="var(--dmg-decay)" /> damage to their{' '}
          <InlineToken label="Health" color="var(--stat-health)" /> tracker, calculated before{' '}
          <InlineToken label="Armor" color="var(--stat-armor)" /> is taken into account.
        </p>
      </section>

      <section className="panel codex-panel codex-wide">
        <h2 className="codex-title">Reading an Ability Card</h2>
        <div className="anatomy-grid">
          <div className="anatomy-item">
            <span className="anatomy-key" style={{ background: 'var(--stat-ap)' }} />
            <div>
              <strong>Gold fist badge</strong>
              <p className="token-blurb">Action Point cost. Absent when the ability is free or passive.</p>
            </div>
          </div>
          <div className="anatomy-item">
            <span className="anatomy-key" style={{ background: 'var(--haze-glow)' }} />
            <div>
              <strong>Violet flame badge</strong>
              <p className="token-blurb">Willpower cost. Only spells and empowered techniques carry one.</p>
            </div>
          </div>
          <div className="anatomy-item">
            <span className="anatomy-key" style={{ background: '#8b8e93' }} />
            <div>
              <strong>Grey chevron banner</strong>
              <p className="token-blurb">
                What the card is, in the order its own family reads it — &ldquo;Novice Spell -
                Nature - Blood&rdquo; for a spell, &ldquo;Martial Move - Novice&rdquo; for a move.
              </p>
            </div>
          </div>
          <div className="anatomy-item">
            <span className="anatomy-key" style={{ background: 'var(--def-healing)' }} />
            <div>
              <strong>Green arrow</strong>
              <p className="token-blurb">
                How many d4 of advantage the holder has on this roll. Red and pointing down for
                disadvantage, and absent when the two cancel out.
              </p>
            </div>
          </div>
          <div className="anatomy-item">
            <span className="anatomy-key" style={{ background: '#ffffff' }} />
            <div>
              <strong>Secondary heading</strong>
              <p className="token-blurb">An optional rider such as Blood Tithe — a choice made while casting.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
