import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, tokenStore } from './api'

type AuthState = {
  admin: boolean
  login: (password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState(false)

  useEffect(() => {
    if (!tokenStore.get()) return
    api
      .me()
      .then((res) => {
        setAdmin(res.admin)
        if (!res.admin) tokenStore.clear()
      })
      .catch(() => {})
  }, [])

  const login = async (password: string) => {
    const { token } = await api.login(password)
    tokenStore.set(token)
    setAdmin(true)
  }

  const logout = () => {
    tokenStore.clear()
    setAdmin(false)
  }

  return <AuthContext.Provider value={{ admin, login, logout }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
