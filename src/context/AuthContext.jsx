import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token_hash = params.get('token_hash')
    const type = params.get('type')

    if (token_hash && type === 'recovery') {
      window.history.replaceState({}, '', window.location.pathname)
      setRecoveryMode(true)
      supabase.auth.verifyOtp({ token_hash, type: 'recovery' })
        .then(({ data }) => { if (data.session) setSession(data.session) })
    }

    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
        setSession(session)
      } else {
        setRecoveryMode(false)
        setSession(session)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const user = session?.user
  const userRole = user?.user_metadata?.funcao === 'Funcionário' ? 'Funcionário' : 'Administrador'
  const primeiroAcesso = user?.user_metadata?.needsPassword === true
  const permissoes = userRole === 'Funcionário' ? (user?.user_metadata?.permissoes || null) : null
  // clinicaId: admin uses own id; funcionário uses the id stored in their metadata
  const clinicaId = user?.user_metadata?.clinica_id || user?.id || null

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signInWithMagicLink = (email) => supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
  const inviteUser = (email, funcao = 'Funcionário', perms = null) => supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: window.location.origin, data: { funcao, needsPassword: true, clinica_id: user?.id, ...(perms ? { permissoes: perms } : {}) } } })
  const signOut = () => supabase.auth.signOut()
  const updatePassword = (password) => supabase.auth.updateUser({ password })

  return (
    <AuthContext.Provider value={{ session, user, userRole, primeiroAcesso, permissoes, clinicaId, signIn, signInWithMagicLink, inviteUser, signOut, recoveryMode, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
