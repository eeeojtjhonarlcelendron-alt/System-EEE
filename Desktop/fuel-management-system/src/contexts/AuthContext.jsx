import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId, authUser = null) => {
    try {
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      // If user doesn't exist in database, create it
      if (error && error.code === 'PGRST116') {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: userId,
            email: authUser?.email || 'unknown',
            name: authUser?.email?.split('@')[0] || 'New User',
            role: 'team_leader' // default role
          }])
          .select()
          .single()

        if (insertError) throw insertError
        data = newUser
      } else if (error) {
        throw error
      }

      setUser(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      console.log('Attempting login for:', email)
      
      // First, check if user exists in our database
      const { data: dbUsers, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)

      console.log('Database query result:', { dbUsers, dbError })

      if (dbError) {
        console.error('Database error:', dbError)
        return { success: false, error: 'Database error: ' + dbError.message }
      }

      // Check if user exists
      if (!dbUsers || dbUsers.length === 0) {
        console.log('No user found with email:', email)
        return { success: false, error: 'User not found. Please ask admin to create your account first.' }
      }

      const dbUser = dbUsers[0]
      console.log('Found user:', dbUser)

      // Try to sign in with Supabase Auth
      console.log('Trying Supabase auth signin...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      console.log('Sign in result:', { signInData, signInError })

      // If sign in successful
      if (!signInError && signInData?.user) {
        console.log('Sign in successful')
        setUser(dbUser)
        return { success: true }
      }

      // If sign in fails (user not in Supabase Auth yet), sign them up
      if (signInError) {
        console.log('Sign in failed, trying signup...', signInError.message)
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password
        })

        console.log('Sign up result:', { signUpData, signUpError })

        if (signUpError) {
          console.error('Signup error:', signUpError)
          // If signup fails due to rate limit, give a better message
          if (signUpError.message.includes('rate limit') || signUpError.status === 429) {
            return { success: false, error: 'Please wait a moment before trying again (rate limit)' }
          }
          return { success: false, error: signUpError.message }
        }

        // Update the database user with the new Auth ID from Supabase
        if (signUpData?.user) {
          console.log('Updating user ID in database...')
          const { error: updateError } = await supabase
            .from('users')
            .update({ id: signUpData.user.id })
            .eq('email', email)

          if (updateError) {
            console.error('Error updating user ID:', updateError)
          }

          setUser({ ...dbUser, id: signUpData.user.id })
          return { success: true }
        }
      }

      return { success: false, error: 'Login failed - unknown error' }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: error.message || 'Login failed' }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAdmin: user?.role === 'admin',
    isTeamLeader: user?.role === 'team_leader',
    isGasStaff: user?.role === 'gas_staff'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
