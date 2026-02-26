import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { FiChevronDown, FiUser, FiSettings, FiLogOut, FiHelpCircle, FiSun, FiMoon } from 'react-icons/fi'
import { useTheme } from '../../context/ThemeContext'
import { NotificationBell } from '../shared'

const Header = ({ title, breadcrumbs = [], onMenuToggle }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { user } = useSelector((state) => state.auth)
  const { isDark, toggleTheme } = useTheme()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'customer':
        return 'Customer'
      case 'provider':
        return 'Provider'
      case 'admin':
        return 'Administrator'
      default:
        return ''
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center gap-4 pl-12 lg:pl-0">
          {breadcrumbs.length > 0 ? (
            <nav className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href || index} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className="text-slate-300 dark:text-slate-600">/</span>
                  )}
                  {crumb.href ? (
                    <Link
                      to={crumb.href}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-800 dark:text-white font-medium">{crumb.label}</span>
                  )}
                </div>
              ))}
            </nav>
          ) : (
            <h1 className="text-xl font-semibold text-slate-800 dark:text-white">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          </button>

          <NotificationBell />

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-800 dark:text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{getRoleLabel()}</p>
              </div>
              <FiChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 animate-scale-in">
                <div className="py-2">
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FiUser className="w-4 h-4" />
                    Profile Settings
                  </Link>
                  <Link
                    to="/help"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FiHelpCircle className="w-4 h-4" />
                    Help & Support
                  </Link>
                  <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    onClick={() => {
                      dispatch(logout())
                      setDropdownOpen(false)
                      navigate('/login')
                    }}
                  >
                    <FiLogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
