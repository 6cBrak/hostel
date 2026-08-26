import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireStaff({ children }) {
  const { user, loading, isStaff } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/connexion" replace />
  if (!isStaff) return <Navigate to="/" replace />

  return children
}
