import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { getMyBookings } from '../../store/slices/bookingSlice'
import api from '../../store/api'
import { DashboardLayout } from '../../components/layout'
import { Card, Badge, Button, Skeleton } from '../../components/ui'
import { StatsCard, EmptyState, StatusBadge } from '../../components/shared'
import { FiCalendar, FiMapPin, FiClock, FiDollarSign, FiFileText, FiArrowRight, FiDownload, FiPlus } from 'react-icons/fi'

const CustomerDashboard = () => {
  const dispatch = useDispatch()
  const { bookings } = useSelector((state) => state.booking)
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await dispatch(getMyBookings())
      await fetchAddresses()
      setLoading(false)
    }
    fetchData()
  }, [dispatch])

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/customer/addresses')
      setAddresses(response.data.data.addresses)
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
    }
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    totalSpent: bookings.reduce((sum, b) => sum + (b.amount?.finalAmount || 0), 0),
  }

  const upcomingBookings = bookings
    .filter((b) => ['pending', 'accepted', 'provider_arriving', 'in_progress'].includes(b.status))
    .slice(0, 3)

  const recentBookings = bookings
    .filter((b) => b.status === 'completed')
    .slice(0, 5)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton.Card key={i} />
            ))}
          </div>
          <Skeleton variant="card" className="h-64" />
          <Skeleton variant="card" className="h-64" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8 animate-fade-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome back</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Here's an overview of your healthcare bookings</p>
          </div>
          <Link to="/services">
            <Button variant="primary" icon={FiPlus}>
              New Booking
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Bookings"
            value={stats.total}
            icon={FiCalendar}
            description="All time"
          />
          <StatsCard
            title="Pending"
            value={stats.pending}
            icon={FiClock}
            description="Awaiting confirmation"
          />
          <StatsCard
            title="Completed"
            value={stats.completed}
            icon={FiFileText}
            description="Services completed"
          />
          <StatsCard
            title="Total Spent"
            value={`₹${stats.totalSpent.toLocaleString()}`}
            icon={FiDollarSign}
            description="Lifetime spending"
          />
        </div>

        {upcomingBookings.length > 0 && (
          <Card padding="none">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Upcoming Appointments</h2>
              <Link to="/customer/bookings" className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1">
                View all <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {upcomingBookings.map((booking) => (
                <div key={booking._id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/20">
                        <FiCalendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800 dark:text-white">{booking.service?.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-4 h-4" />
                            {new Date(booking.scheduledDate).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiClock className="w-4 h-4" />
                            {booking.scheduledTime}
                          </span>
                        </div>
                        {booking.provider && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Provider: {booking.provider.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={booking.status} />
                      <p className="text-lg font-semibold text-slate-800 dark:text-white mt-2">
                        ₹{booking.amount?.finalAmount}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2" padding="none">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Bookings</h2>
            </div>
            {recentBookings.length === 0 ? (
              <EmptyState
                icon={FiCalendar}
                title="No bookings yet"
                description="Start by booking your first healthcare service"
                actionLabel="Browse Services"
                action={() => window.location.href = '/services'}
              />
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {recentBookings.map((booking) => (
                  <div key={booking._id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <FiFileText className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800 dark:text-white">{booking.service?.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {new Date(booking.scheduledDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={booking.status} />
                        <span className="font-medium text-slate-800 dark:text-white">₹{booking.amount?.finalAmount}</span>
                        {booking.reports && booking.reports.length > 0 && (
                          <Button variant="ghost" size="sm" icon={FiDownload}>
                            Report
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card padding="none">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">My Addresses</h2>
              <Link to="/customer/addresses" className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">
                Manage
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No addresses saved</p>
                  <Button variant="ghost" size="sm" className="mt-2" icon={FiPlus}>
                    Add Address
                  </Button>
                </div>
              ) : (
                addresses.slice(0, 3).map((addr) => (
                  <div
                    key={addr._id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <FiMapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white text-sm">{addr.label}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {addr.addressLine1}, {addr.city}
                          </p>
                        </div>
                      </div>
                      {addr.isDefault && (
                        <Badge variant="primary" size="sm">Default</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CustomerDashboard
