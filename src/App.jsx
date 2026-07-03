import { useState } from 'react'
import CharacterSheet from './components/CharacterSheet'

const initialCharacters = [
  {
    id: "char-2",              
    name: "Merlin",
    level: 1,
    xp: 120,
    coins: 45,
    avatar: "wizard_premade",  
    note: "Scratched his name into the Prancing Pony table.",
    attributes: {
      physique: 4,
      instinct: 5,
      mind: 7
    }
  },
  {
    id: "char-1",              
    name: "Gandalf",
    level: 1,
    xp: 250,
    coins: 120,
    avatar: "warlock_premade",  
    note: "Sliped down a massive hole.",
    attributes: {
      physique: 5,
      instinct: 6,
      mind: 6
    }
  }
]

function App() {
  const [characters, setCharacters] = useState(initialCharacters);
  const [activeCharacterId, setActiveCharacterId] = useState(null);
  const [activeTab, setActiveTab] = useState('character');

  const activeCharacter = characters.find(char => char.id === activeCharacterId);

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
                <button onClick={() => setActiveCharacterId(character.id)}>
                  View Sheet
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        /* The component replaces the old messy code block */
        <CharacterSheet 
          activeCharacter={activeCharacter}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setActiveCharacterId={setActiveCharacterId}
        />
      )}
    </>
  )
}

export default App