import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireFinanceStaff({ children }) {
  const { user, loading, canManageFinance } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/connexion" replace />
  if (!canManageFinance) return <Navigate to="/admin/dashboard" replace />

  return children
}
