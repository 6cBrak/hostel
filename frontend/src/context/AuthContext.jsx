import { createContext, useContext, useState, useEffect } from 'react'
import { getMe, login as apiLogin, logout as apiLogout } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (token) {
      getMe()
        .then((r) => setUser(r.data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const signIn = (userData, access, refresh) => {
    localStorage.setItem('access', access)
    localStorage.setItem('refresh', refresh)
    setUser(userData)
  }

  const loginWithCredentials = async (email, password) => {
    const { data } = await apiLogin(email, password)
    signIn(data.user, data.access, data.refresh)
    return data.user
  }

  const signOut = () => {
    const refresh = localStorage.getItem('refresh')
    if (refresh) apiLogout(refresh).catch(() => {})
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        setUser,
        loginWithCredentials,
        isAuthenticated: !!user,
        isStudent: user?.role === 'student',
        isStaff: !!user && user.role !== 'student',
        isAdmin: user?.role === 'admin',
        canManageFinance: ['admin', 'manager', 'accountant'].includes(user?.role),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
