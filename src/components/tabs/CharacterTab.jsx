import { useState } from 'react';
import './CharacterTab.css';
import AttributesCard from '../character-blocks/AttributesCard';

function CharacterTab({ activeCharacter }) {
  
  const [activeSubTab, setActiveSubTab] = useState('attributes');


  const getBlockClass = (tabName) => {
    return `character-card-block ${activeSubTab === tabName ? 'active-sub-tab' : ''}`;
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center', margin: '20px 0' }}>
        {activeCharacter?.name}'s Character Sheet
      </h2>
      
      
      <div className="mobile-sub-blocks-nav">
        <button className={activeSubTab === 'attributes' ? 'active-btn' : ''} onClick={() => setActiveSubTab('attributes')}>Stats</button>
        <button className={activeSubTab === 'core-stats' ? 'active-btn' : ''} onClick={() => setActiveSubTab('core-stats')}>Defense</button>
        <button className={activeSubTab === 'resources' ? 'active-btn' : ''} onClick={() => setActiveSubTab('resources')}>Resource</button>
        <button className={activeSubTab === 'abilities' ? 'active-btn' : ''} onClick={() => setActiveSubTab('abilities')}>Abilities</button>
        <button className={activeSubTab === 'status' ? 'active-btn' : ''} onClick={() => setActiveSubTab('status')}>Status</button>
        <button className={activeSubTab === 'features' ? 'active-btn' : ''} onClick={() => setActiveSubTab('features')}>Features</button>
      </div>
      
      
      <div className="character-grid">
        <section className={getBlockClass('attributes')}>
          <AttributesCard activeCharacter={activeCharacter} />
        </section>
        
        <section className={getBlockClass('core-stats')}>Block 2: Core Stats</section>
        <section className={getBlockClass('resources')}>Block 3: Resources</section>
        <section className={getBlockClass('abilities')}>Block 4: Abilities</section>
        <section className={getBlockClass('status')}>Block 5: Status</section>
        <section className={getBlockClass('features')}>Block 6: Features</section>
      </div>
    </div>
  )
}

export default CharacterTab;