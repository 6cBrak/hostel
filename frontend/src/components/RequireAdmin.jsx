import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/connexion" replace />
  if (!isAdmin) return <Navigate to="/admin/dashboard" replace />

  return children
}
