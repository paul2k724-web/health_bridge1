import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api'
import { DashboardLayout } from '../../components/layout'
import { Card, Badge, Button, Skeleton, BookingMap } from '../../components/ui'
import { StatsCard, EmptyState, StatusBadge } from '../../components/shared'
import { FiUsers, FiBriefcase, FiDollarSign, FiCheckCircle, FiAlertCircle, FiArrowRight, FiTrendingUp, FiActivity, FiUserCheck, FiMap } from 'react-icons/fi'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [pendingProviders, setPendingProviders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, providersRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/provider/admin?status=pending'),
      ])
      setStats(dashboardRes.data.data.stats)
      setRecentBookings(dashboardRes.data.data.recentBookings || [])
      setPendingProviders(providersRes.data.data?.providers?.slice(0, 5) || [])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton.Card key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton variant="card" className="h-64" />
            <Skeleton variant="card" className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor and manage your healthcare platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={FiUsers}
            description="Registered users"
          />
          <StatsCard
            title="Active Providers"
            value={stats.totalProviders}
            icon={FiBriefcase}
            description="Verified providers"
          />
          <StatsCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={FiActivity}
            description="All time bookings"
          />
          <StatsCard
            title="Monthly Revenue"
            value={`₹${stats.totalRevenue?.toLocaleString() || 0}`}
            icon={FiDollarSign}
            description="This month"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-0" padding="default">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-300 text-sm font-medium">Pending Bookings</p>
                <p className="text-4xl font-bold text-white mt-2">{stats.pendingBookings}</p>
                <p className="text-slate-400 text-sm mt-2">Awaiting provider assignment</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <FiAlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-cyan-600 border-0" padding="default">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium">Completed This Month</p>
                <p className="text-4xl font-bold text-white mt-2">{stats.completedBookings}</p>
                <p className="text-teal-200 text-sm mt-2">Successfully completed</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <FiCheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card 
            className={`${stats.pendingApprovals > 0 ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
            padding="default"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pending Approvals</p>
                <p className="text-4xl font-bold text-slate-800 dark:text-white mt-2">{stats.pendingApprovals}</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Provider applications</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <FiUserCheck className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              </div>
            </div>
            {stats.pendingApprovals > 0 && (
              <Link 
                to="/admin/providers"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
              >
                Review now <FiArrowRight className="w-4 h-4" />
              </Link>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding="none">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Provider Approval Queue</h2>
              <Link to="/admin/providers" className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1">
                View all <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {pendingProviders.length === 0 ? (
              <div className="p-6 text-center">
                <FiUserCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No pending approvals</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {pendingProviders.map((provider) => (
                  <div key={provider._id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {provider.name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{provider.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{provider.providerProfile?.specialization}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="warning">Pending</Badge>
                        <Link to="/admin/providers">
                          <Button variant="ghost" size="sm">Review</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card padding="none">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Bookings</h2>
            </div>
            {recentBookings.length === 0 ? (
              <EmptyState
                icon={FiActivity}
                title="No recent bookings"
                description="New bookings will appear here"
              />
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {recentBookings.map((booking) => (
                  <div key={booking._id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{booking.service?.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Customer: {booking.customer?.name}
                        </p>
                        <p className="text-sm text-slate-400 dark:text-slate-500">
                          Provider: {booking.provider?.name || 'Not assigned'}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={booking.status} />
                        <p className="text-lg font-semibold text-slate-800 dark:text-white mt-2">
                          ₹{booking.amount?.finalAmount}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <FiMap className="w-5 h-5" />
              Booking Locations Map
            </h2>
            <Link to="/admin/reports" className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">
              View Reports
            </Link>
          </div>
          <div className="p-4">
            <BookingMap
              bookings={recentBookings}
              height="350px"
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/admin/users" className="block">
            <Card hover className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <FiUsers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-white">User Management</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Manage customers & providers</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/providers" className="block">
            <Card hover className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <FiUserCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-white">Provider Approval</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Review applications</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/services" className="block">
            <Card hover className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <FiActivity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-white">Service Management</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Configure services</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/reports" className="block">
            <Card hover className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <FiTrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-white">Reports & Analytics</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">View insights</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
