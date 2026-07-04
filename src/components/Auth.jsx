import { useState } from 'react'
import { supabase } from '../supabaseClient'

function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
      })
      if (error) alert(`❌ Sign up failed: ${error.message}`)
      else alert('🔮 Check your email for a confirmation link!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })
      if (error) alert(`❌ Login failed: ${error.message}`)
    }

    setLoading(false)
  }

  return (
    <div>
      <h2>{isSignUp ? 'Create Your Account' : 'Sign In to Your Vault'}</h2>
      
      <form onSubmit={handleAuth}>
        <div>
          <label>Email Address</label>
          <input 
            type="email" 
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Password</label>
          <input 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
        </button>
      </form>

      <p>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Log In here' : 'Sign Up here'}
        </button>
      </p>
    </div>
  )
}

export default Auth