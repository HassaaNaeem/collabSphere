import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RequireAuth({ role, children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to={`/login/${role}`} state={{ from: location }} replace />
  }
  if (user.role !== role) {
    // logged in but wrong area — send them to their own dashboard
    return <Navigate to={`/app/${user.role}`} replace />
  }
  return children
}
