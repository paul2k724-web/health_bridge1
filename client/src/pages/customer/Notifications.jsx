import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FiBell, FiCheck, FiTrash2, FiCalendar, FiStar, FiAlertCircle, FiCheckCircle, FiClock, FiX, FiFilter } from 'react-icons/fi'
import notificationService from '../../services/notificationService'
import { DashboardLayout } from '../../components/layout'
import { Button, Skeleton } from '../../components/ui'
import { EmptyState } from '../../components/shared'

const getNotificationIcon = (type) => {
  switch (type) {
    case 'BOOKING_CREATED':
      return <FiCalendar className="w-5 h-5" />
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_ACCEPTED':
      return <FiCheckCircle className="w-5 h-5" />
    case 'BOOKING_CANCELLED':
      return <FiX className="w-5 h-5" />
    case 'BOOKING_RESCHEDULED':
      return <FiClock className="w-5 h-5" />
    case 'BOOKING_COMPLETED':
      return <FiCheck className="w-5 h-5" />
    case 'REVIEW_RECEIVED':
      return <FiStar className="w-5 h-5" />
    default:
      return <FiAlertCircle className="w-5 h-5" />
  }
}

const getNotificationColor = (type) => {
  switch (type) {
    case 'BOOKING_CREATED':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_ACCEPTED':
    case 'BOOKING_COMPLETED':
      return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
    case 'BOOKING_CANCELLED':
      return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
    case 'BOOKING_RESCHEDULED':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
    case 'REVIEW_RECEIVED':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
    default:
      return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
  }
}

const getNotificationLink = (notification, userRole) => {
  if (notification.data?.bookingId) {
    const bookingId = notification.data.bookingId._id || notification.data.bookingId
    if (userRole === 'customer') {
      return `/customer/bookings/${bookingId}`
    } else if (userRole === 'provider') {
      return `/provider/jobs`
    }
  }
  if (notification.data?.reviewId && userRole === 'provider') {
    return '/provider/earnings'
  }
  return '#'
}

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useSelector((state) => state.auth)
  const userRole = user?.role || 'customer'

  useEffect(() => {
    fetchNotifications()
  }, [filter, page])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 10 }
      if (filter === 'unread') params.unreadOnly = 'true'
      
      const response = await notificationService.getNotifications(params)
      setNotifications(response.data.notifications)
      setPagination(response.data.pagination)
      setUnreadCount(response.data.pagination.unreadCount || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId)
      setNotifications(prev => prev.filter(n => n._id !== notificationId))
      setPagination(prev => ({ ...prev, total: prev.total - 1 }))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return
    try {
      await notificationService.clearAll()
      setNotifications([])
      setPagination({ total: 0, totalPages: 0 })
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }

  const formatTime = (date) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffMs = now - notificationDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return notificationDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: notificationDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Notifications</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead} icon={FiCheck}>
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearAll} icon={FiTrash2} className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20">
                Clear all
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FiFilter className="w-4 h-4 text-slate-400" />
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => { setFilter('all'); setPage(1) }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => { setFilter('unread'); setPage(1) }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'unread'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="animate-pulse flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12">
            <EmptyState
              icon={FiBell}
              title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              description={filter === 'unread' ? "You've read all your notifications" : "You're all caught up! New notifications will appear here."}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white dark:bg-slate-800 rounded-xl border ${
                  !notification.isRead
                    ? 'border-teal-200 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-900/10'
                    : 'border-slate-200 dark:border-slate-700'
                } p-4 hover:shadow-md transition-all`}
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={getNotificationLink(notification, userRole)}
                        className={`text-base ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-slate-800 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors`}
                      >
                        {notification.title}
                      </Link>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification._id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Notifications
