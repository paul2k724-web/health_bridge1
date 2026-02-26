import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FiBell, FiCheck, FiX, FiCalendar, FiStar, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi'
import notificationService from '../../services/notificationService'

const getNotificationIcon = (type) => {
  switch (type) {
    case 'BOOKING_CREATED':
      return <FiCalendar className="w-4 h-4" />
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_ACCEPTED':
      return <FiCheckCircle className="w-4 h-4" />
    case 'BOOKING_CANCELLED':
      return <FiX className="w-4 h-4" />
    case 'BOOKING_RESCHEDULED':
      return <FiClock className="w-4 h-4" />
    case 'BOOKING_COMPLETED':
      return <FiCheck className="w-4 h-4" />
    case 'REVIEW_RECEIVED':
      return <FiStar className="w-4 h-4" />
    default:
      return <FiAlertCircle className="w-4 h-4" />
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

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount()
      setUnreadCount(response.data.unreadCount)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await notificationService.getNotifications({ limit: 5 })
      setNotifications(response.data.notifications)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      fetchNotifications()
    }
  }

  const handleMarkAsRead = async (notificationId, e) => {
    e.preventDefault()
    e.stopPropagation()
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

  const formatTime = (date) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffMs = now - notificationDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return notificationDate.toLocaleDateString()
  }

  const getNotificationLink = (notification) => {
    if (notification.data?.bookingId) {
      return `/customer/bookings/${notification.data.bookingId._id || notification.data.bookingId}`
    }
    return '/notifications'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 animate-scale-in origin-top-right">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <FiBell className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {notifications.map((notification) => (
                  <Link
                    key={notification._id}
                    to={getNotificationLink(notification)}
                    onClick={() => setIsOpen(false)}
                    className={`flex gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      !notification.isRead ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-slate-800 dark:text-white truncate`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(notification._id, e)}
                            className="flex-shrink-0 p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-700">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
