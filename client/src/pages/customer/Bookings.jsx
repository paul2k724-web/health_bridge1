import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { getMyBookings } from '../../store/slices/bookingSlice'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Badge, Skeleton } from '../../components/ui'
import { StatusBadge, EmptyState } from '../../components/shared'
import { FiCalendar, FiClock, FiMapPin, FiDollarSign, FiPlus, FiEye } from 'react-icons/fi'

const CustomerBookings = () => {
  const dispatch = useDispatch()
  const { bookings } = useSelector((state) => state.booking)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await dispatch(getMyBookings())
      setLoading(false)
    }
    fetchData()
  }, [dispatch])

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter((b) => b.status === filter)

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton.Card />
          <Skeleton.Card />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="My Bookings">
      <div className="space-y-6 animate-fade-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Bookings</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your healthcare appointments</p>
          </div>
          <Link to="/services">
            <Button variant="primary" icon={FiPlus}>
              New Booking
            </Button>
          </Link>
        </div>

        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === option.value
                  ? 'bg-teal-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {filteredBookings.length === 0 ? (
          <Card>
            <EmptyState
              icon={FiCalendar}
              title="No bookings found"
              description={filter === 'all' ? "You haven't made any bookings yet" : `No ${filter} bookings`}
              actionLabel="Browse Services"
              actionLink="/services"
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking._id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/20">
                      <FiCalendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">
                        {booking.service?.name || 'Service'}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-4 h-4" />
                          {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          {booking.scheduledTime || 'N/A'}
                        </span>
                      </div>
                      {booking.address && (
                        <p className="flex items-center gap-1 mt-1 text-sm text-slate-500 dark:text-slate-400">
                          <FiMapPin className="w-4 h-4" />
                          {booking.address.addressLine1}, {booking.address.city}
                        </p>
                      )}
                      {booking.provider && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Provider: {booking.provider.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={booking.status} />
                    <p className="text-lg font-semibold text-slate-800 dark:text-white mt-2">
                      ₹{booking.amount?.finalAmount || 0}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default CustomerBookings
