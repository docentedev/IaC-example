import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

// ──────────────────────────────────────────────────────────────────────
//  AuthProvider: gestiona el estado de sesión con JWT propio.
//  El token se persiste en localStorage para sobrevivir recargas.
// ──────────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem('auth_token'))
  const [user, setUser]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('auth_user')) } catch { return null }
  })
  const [error, setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  // login: POST /auth/login → guarda token y user en estado + localStorage
  const login = useCallback(async (username, password) => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user',  JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // register: POST /auth/register → igual que login, devuelve token directo
  const register = useCallback(async (fields) => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al registrarse')
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user',  JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // logout: elimina token y user del estado y localStorage
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
    setError(null)
  }, [])

  const value = useMemo(
    () => ({ token, user, error, loading, isLoggedIn: !!token, login, register, logout }),
    [token, user, error, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
