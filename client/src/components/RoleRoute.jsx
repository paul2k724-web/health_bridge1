import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading, token, isAuthenticated } = useSelector((state) => state.auth)

  if (loading || (token && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    const dashboardRoutes = {
      customer: '/customer/dashboard',
      provider: '/provider/dashboard',
      admin: '/admin/dashboard',
    }
    return <Navigate to={dashboardRoutes[user.role] || '/'} replace />
  }

  return children
}

export default RoleRoute
