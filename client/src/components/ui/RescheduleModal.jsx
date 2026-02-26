import { useState, useEffect } from 'react'
import { FiCalendar, FiClock, FiX, FiAlertCircle } from 'react-icons/fi'
import { Button, Input } from './index'
import toast from 'react-hot-toast'

const RescheduleModal = ({ isOpen, onClose, booking, onReschedule }) => {
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    reason: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (booking && isOpen) {
      const date = new Date(booking.scheduledDate)
      setFormData({
        scheduledDate: date.toISOString().split('T')[0],
        scheduledTime: booking.scheduledTime || '09:00',
        reason: '',
      })
    }
  }, [booking, isOpen])

  if (!isOpen || !booking) return null

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.scheduledDate || !formData.scheduledTime) {
      toast.error('Please select date and time')
      return
    }

    const selectedDate = new Date(formData.scheduledDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate <= today) {
      toast.error('Please select a future date')
      return
    }

    setLoading(true)
    try {
      await onReschedule(booking._id, formData)
      toast.success('Booking rescheduled successfully')
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reschedule')
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            Reschedule Booking
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <FiX className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Current Booking Info */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Current Schedule</p>
          <p className="font-medium text-slate-800 dark:text-white">
            {new Date(booking.scheduledDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })} at {booking.scheduledTime}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {booking.service?.name} • ₹{booking.amount?.finalAmount}
          </p>
        </div>

        {/* Warning */}
        <div className="px-6 py-3 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800">
          <FiAlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Rescheduling is limited to 3 times per booking. You have used {booking.rescheduleCount || 0} of 3.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <FiCalendar className="inline w-4 h-4 mr-1" />
              New Date *
            </label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              min={minDateStr}
              max={maxDateStr}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <FiClock className="inline w-4 h-4 mr-1" />
              New Time *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setFormData({ ...formData, scheduledTime: time })}
                  className={`py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                    formData.scheduledTime === time
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-500'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Reason (optional)
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Why are you rescheduling?"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              Confirm Reschedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RescheduleModal
