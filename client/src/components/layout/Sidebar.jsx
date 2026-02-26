import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import {
  FiHome,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiBriefcase,
  FiUsers,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiActivity,
  FiClipboard,
  FiUserCheck,
  FiGrid,
} from 'react-icons/fi'

const customerNavItems = [
  { name: 'Dashboard', href: '/customer/dashboard', icon: FiHome },
  { name: 'Bookings', href: '/customer/bookings', icon: FiCalendar },
  { name: 'Reports', href: '/customer/reports', icon: FiFileText },
]

const providerNavItems = [
  { name: 'Dashboard', href: '/provider/dashboard', icon: FiHome },
  { name: 'Available Jobs', href: '/provider/available', icon: FiBriefcase },
  { name: 'My Jobs', href: '/provider/jobs', icon: FiClipboard },
  { name: 'Earnings', href: '/provider/earnings', icon: FiDollarSign },
]

const adminNavItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: FiGrid },
  { name: 'User Management', href: '/admin/users', icon: FiUsers },
  { name: 'Provider Approval', href: '/admin/providers', icon: FiUserCheck },
  { name: 'Services', href: '/admin/services', icon: FiActivity },
  { name: 'Reports', href: '/admin/reports', icon: FiClipboard },
]

const Sidebar = ({ collapsed = false, onToggle, mobileOpen = false, onMobileClose }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)

  const getNavItems = () => {
    switch (user?.role) {
      case 'customer':
        return customerNavItems
      case 'provider':
        return providerNavItems
      case 'admin':
        return adminNavItems
      default:
        return []
    }
  }

  const navItems = getNavItems()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'customer':
        return 'Customer Portal'
      case 'provider':
        return 'Provider Portal'
      case 'admin':
        return 'Admin Console'
      default:
        return 'Dashboard'
    }
  }

  const handleNavClick = () => {
    if (mobileOpen && onMobileClose) {
      onMobileClose()
    }
  }

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen
        bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
        text-white
        flex flex-col
        transition-all duration-200 ease-smooth
        z-40
        w-64
        ${collapsed ? 'lg:w-20' : 'lg:w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      <div className={`flex items-center h-16 px-4 border-b border-white/10 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <FiActivity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">HealthBridge</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <FiActivity className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className="hidden lg:flex p-1.5 rounded-md hover:bg-white/10 transition-colors"
        >
          {collapsed ? (
            <FiChevronRight className="w-4 h-4" />
          ) : (
            <FiChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-teal-400 uppercase tracking-wider">
            {getRoleLabel()}
          </p>
        </div>
      )}

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon

          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-150
                ${isActive
                  ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-white border-l-2 border-teal-400 -ml-[2px] pl-[calc(0.75rem+2px)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
                ${collapsed ? 'justify-center px-2' : ''}
              `}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={handleLogout}
          className={`
            flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
            text-slate-400 hover:text-white hover:bg-white/5
            transition-all duration-150
            ${collapsed ? 'justify-center px-2' : ''}
          `}
          title={collapsed ? 'Logout' : undefined}
        >
          <FiLogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      {!collapsed && user && (
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <span className="text-sm font-medium text-white">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user.email || ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
