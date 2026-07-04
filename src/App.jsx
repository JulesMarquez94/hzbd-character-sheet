import { useState, useEffect } from 'react'
import CharacterSheet from './components/CharacterSheet'
import Auth from './components/Auth'
import { supabase } from './supabaseClient'

function App() {
  const [session, setSession] = useState(null)
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCharacterId, setActiveCharacterId] = useState(null)
  const [activeTab, setActiveTab] = useState('character')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function fetchCharactersFromCloud() {
      if (!session) return;

      setLoading(true)
      const { data, error } = await supabase.from('characters').select('*')
      
      if (error) {
        console.error("❌ Database connection error:", error.message)
      } else if (data) {
        setCharacters(data)
      }
      setLoading(false)
    }

    fetchCharactersFromCloud()
  }, [session])

  const activeCharacter = characters.find(char => char.id === activeCharacterId)

  async function handleSignOut() {
    await supabase.auth.signOut()
    setActiveCharacterId(null)
  }

  if (session && loading) {
    return <div>🔮 Loading heroes from the cloud...</div>
  }

  return (
    <>
      {!session ? (
        <Auth />
      ) : (
        <>
          <div>
            <span>Logged in as: <strong>{session.user.email}</strong></span>
            <button onClick={handleSignOut}>
              Log Out
            </button>
          </div>

          {activeCharacterId === null ? (
            <div>
              <h1>Hello, Vite!</h1>
              
              {characters.length === 0 ? (
                <p>No heroes found. Your custom database table is empty!</p>
              ) : (
                characters.map((character) => (
                  <div key={character.id}>
                    <h2>{character.name}</h2>
                    <p>Level: {character.level}</p>
                    <p>Notes: {character.note}</p>
                    <button onClick={() => setActiveCharacterId(character.id)}>
                      View Sheet
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <CharacterSheet 
              activeCharacter={activeCharacter}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setActiveCharacterId={setActiveCharacterId}
            />
          )}
        </>
      )}
    </>
  )
}

export default App