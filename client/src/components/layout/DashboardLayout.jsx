import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { FiMenu, FiX } from 'react-icons/fi'

const DashboardLayout = ({ children, title, breadcrumbs }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  const getPageTitle = () => {
    if (title) return title
    const path = location.pathname
    const segments = path.split('/').filter(Boolean)
    if (segments.length >= 2) {
      return segments[1].charAt(0).toUpperCase() + segments[1].slice(1).replace(/-/g, ' ')
    }
    return 'Dashboard'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        {mobileMenuOpen ? (
          <FiX className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        ) : (
          <FiMenu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        lg:block
        ${mobileMenuOpen ? 'block' : 'hidden'}
        fixed inset-y-0 left-0 z-40
      `}>
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div
        className={`
          transition-all duration-200 ease-smooth
          ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
          ml-0
        `}
      >
        <Header 
          title={getPageTitle()} 
          breadcrumbs={breadcrumbs}
          notificationCount={0}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
