import { useState } from 'react'

function App() {

let initialCharacters = [
  {
  id: "char-2",              
  name: "Merlin",
  level: 1,
  avatar: "wizard_premade",  
  note: "Scratched his name into the Prancing Pony table."
  } ,
   {
  id: "char-1",              
  name: "Gandalf",
  level: 1,
  avatar: "warlock_premade",  
  note: "Sliped down a massive hole."
  } 
]

 const [characters, setCharacters] = useState(initialCharacters);

 const [activeCharacterId, setActiveCharacterId] = useState(null);

 const activeCharacter = characters.find(char => char.id === activeCharacterId);

 const [activeTab, setActiveTab] = useState('character');

function addHero() {
  const newHero = {
    id: "char-3", 
    name: "Elendil",
    level: 2,
    avatar: "fighter_premade",
    note: "Holding a broken sword."
  };
  setCharacters([...characters, newHero]);
} 

return (
  <>
    {activeCharacterId === null ? (
      <div>
        <h1>Hello, Vite!</h1>
        <button onClick={addHero}>Add Hero</button>
        
        {characters.map((character) => {
    return (
    <div key={character.id}>
      <h2>{character.name}</h2>
      <p>Level: {character.level}</p>
      <p>Notes: {character.note}</p>
      <button onClick={() => setActiveCharacterId(character.id)}>View Sheet</button>
    </div>
  )
})}
      </div>
    ) : (
      <div>
        <h1>{activeCharacter?.name}'s Character Sheet</h1>
        <nav>
      <button onClick={() => setActiveTab('character')}>Character</button>
      <button onClick={() => setActiveTab('inventory')}>Inventory</button>
     <button onClick={() => setActiveTab('lore')}>Lore</button>
  <button onClick={() => setActiveTab('advancement')}>Advancement</button>
</nav>
      {activeTab === 'character' && <div> This is the main Character Stats section.</div>}
{activeTab === 'inventory' && <div>🎒 This is the Inventory Backpack.</div>}
{activeTab === 'lore' && <div>📜 This is the character Lore and Backstory.</div>}
{activeTab === 'advancement' && <div>⚔️ This is the Level Up and Advancement screen.</div>}

        <button onClick={() => setActiveCharacterId(null)}>Back to Dashboard</button>      </div>
    )}
  </>
)
}

export default App


