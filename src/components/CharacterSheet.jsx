import CharacterTab from './tabs/CharacterTab';

function CharacterSheet({ activeCharacter, activeTab, setActiveTab, setActiveCharacterId }) {
  return (
    <div>
      <h1>{activeCharacter?.name}'s Character Sheet</h1>
      
      <nav>
        <button onClick={() => setActiveTab('character')}>Character</button>
        <button onClick={() => setActiveTab('inventory')}>Inventory</button>
        <button onClick={() => setActiveTab('lore')}>Lore</button>
        <button onClick={() => setActiveTab('advancement')}>Advancement</button>
      </nav>

      {activeTab === 'character' && (
        <CharacterTab activeCharacter={activeCharacter} />
      )}
      
      {activeTab === 'inventory' && <div>🎒 This is the Inventory Backpack.</div>}
      {activeTab === 'lore' && <div>📜 This is the character Lore and Backstory.</div>}
      {activeTab === 'advancement' && <div>⚔️ This is the Level Up and Advancement screen.</div>}

      <br />
      <button onClick={() => setActiveCharacterId(null)}>Back to Dashboard</button>
    </div>
  )
}

export default CharacterSheet;