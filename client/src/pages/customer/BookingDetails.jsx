import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Badge, Skeleton, RescheduleModal } from '../../components/ui'
import { ReviewForm } from '../../components/shared'
import api from '../../store/api'
import toast from 'react-hot-toast'
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiUser, 
  FiPhone,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiFileText,
  FiNavigation,
  FiMessageCircle,
  FiRefreshCw,
  FiEdit,
  FiStar,
  FiSend,
  FiDownload,
  FiMessageSquare
} from 'react-icons/fi'

const statusConfig = {
  pending: { color: 'yellow', icon: FiAlertCircle, label: 'Pending Confirmation' },
  confirmed: { color: 'blue', icon: FiCheckCircle, label: 'Confirmed' },
  assigned: { color: 'indigo', icon: FiUser, label: 'Provider Assigned' },
  accepted: { color: 'blue', icon: FiCheckCircle, label: 'Provider Assigned' },
  provider_arriving: { color: 'cyan', icon: FiNavigation, label: 'Provider Arriving' },
  in_progress: { color: 'indigo', icon: FiClock, label: 'Service in Progress' },
  completed: { color: 'green', icon: FiCheckCircle, label: 'Completed' },
  cancelled: { color: 'red', icon: FiXCircle, label: 'Cancelled' },
  no_show: { color: 'orange', icon: FiAlertCircle, label: 'No Show' },
  rejected: { color: 'red', icon: FiXCircle, label: 'Rejected' },
  refunded: { color: 'purple', icon: FiDollarSign, label: 'Refunded' },
}

const BookingDetails = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [existingReview, setExistingReview] = useState(null)
  const [canReview, setCanReview] = useState(false)
  const [contactInfo, setContactInfo] = useState(null)
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)

  useEffect(() => {
    fetchBooking()
    fetchContactInfo()
  }, [bookingId])

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}`)
      setBooking(response.data.data.booking)
      
      // Check if can review
      if (response.data.data.booking.status === 'completed') {
        try {
          const reviewCheck = await api.get(`/reviews/bookings/${bookingId}/can-review`)
          setCanReview(reviewCheck.data.data.canReview)
          if (reviewCheck.data.data.review) {
            setExistingReview(reviewCheck.data.data.review)
          }
        } catch (err) {
          // Ignore review check errors
        }
      }
    } catch (error) {
      toast.error('Failed to load booking')
      navigate('/customer/bookings')
    } finally {
      setLoading(false)
    }
  }

  const fetchContactInfo = async () => {
    try {
      const response = await api.get('/bookings/contact-info')
      setContactInfo(response.data.data.contactInfo)
    } catch (err) {
      // Use default contact info
      setContactInfo({
        telegramUrl: 'https://t.me/abrahampaulsanhith',
        supportEmail: 'support@healthbridge.com'
      })
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    
    setCancelling(true)
    try {
      await api.patch(`/bookings/${bookingId}/cancel`)
      toast.success('Booking cancelled successfully')
      fetchBooking()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const getGoogleMapsUrl = (address) => {
    if (address?.location?.coordinates) {
      return `https://www.google.com/maps/dir/?api=1&destination=${address.location.coordinates[1]},${address.location.coordinates[0]}`
    }
    return '#'
  }

  const canCancel = booking && ['pending', 'confirmed', 'assigned', 'accepted'].includes(booking.status)
  const canReschedule = booking && ['pending', 'confirmed', 'assigned', 'accepted'].includes(booking.status) && (booking.rescheduleCount || 0) < 3
  const status = statusConfig[booking?.status] || statusConfig.pending
  const StatusIcon = status.icon

  const handleReschedule = async (bookingId, data) => {
    try {
      await api.patch(`/bookings/${bookingId}/reschedule`, {
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        reason: data.reason,
      })
      fetchBooking()
    } catch (error) {
      throw error
    }
  }

  const handleReviewSubmit = async (reviewData) => {
    await api.post(`/reviews/bookings/${bookingId}`, reviewData)
    fetchBooking()
  }

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true)
    try {
      const response = await api.get(`/bookings/${bookingId}/invoice`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice-${bookingId.slice(-8)}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Invoice downloaded')
    } catch (error) {
      toast.error('Failed to download invoice')
    } finally {
      setDownloadingInvoice(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton variant="card" className="h-24" />
          <Skeleton variant="card" className="h-96" />
        </div>
      </DashboardLayout>
    )
  }

  if (!booking) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Booking not found</h2>
          <Button variant="primary" className="mt-4" onClick={() => navigate('/customer/bookings')}>
            Back to Bookings
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Bookings
        </button>

        {/* Status Header */}
        <Card className={`${
          status.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
          status.color === 'red' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
          status.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
          'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                status.color === 'green' ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400' :
                status.color === 'red' ? 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-400' :
                status.color === 'blue' ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400' :
                'bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-400'
              }`}>
                <StatusIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800 dark:text-white">
                  {status.label}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Booking ID: {booking._id?.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                ₹{booking.amount?.finalAmount}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {booking.paymentStatus === 'paid' ? 'Paid' : 'Payment on completion'}
              </p>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Service Details */}
            <Card padding="none">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-slate-800 dark:text-white">Service Details</h2>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white">
                    <FiFileText className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                      {booking.service?.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {booking.service?.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <FiClock className="w-4 h-4" />
                        {booking.service?.duration || 30} mins
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Schedule */}
            <Card padding="none">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-slate-800 dark:text-white">Schedule</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <FiCalendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Date</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {new Date(booking.scheduledDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <FiClock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Time</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {booking.scheduledTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Address */}
            <Card padding="none">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 dark:text-white">Service Location</h2>
                {booking.address?.location?.coordinates && (
                  <a
                    href={getGoogleMapsUrl(booking.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-teal-500 hover:text-teal-600 flex items-center gap-1"
                  >
                    <FiNavigation className="w-4 h-4" />
                    Get Directions
                  </a>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <FiMapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">
                      {booking.address?.label || 'Address'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {booking.address?.addressLine1}
                      {booking.address?.addressLine2 && `, ${booking.address.addressLine2}`}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {booking.address?.city}, {booking.address?.state} {booking.address?.pincode}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Provider */}
            {booking.provider && (
              <Card padding="none">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="font-semibold text-slate-800 dark:text-white">Service Provider</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                        {booking.provider.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">
                          {booking.provider.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Healthcare Professional
                        </p>
                      </div>
                    </div>
                    <a
                      href={`tel:${booking.provider.phone}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                    >
                      <FiPhone className="w-4 h-4" />
                      Call
                    </a>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card padding="none">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-slate-800 dark:text-white">Payment Summary</h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Base Price</span>
                  <span className="text-slate-800 dark:text-white">₹{booking.amount?.basePrice}</span>
                </div>
                {booking.amount?.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>-₹{booking.amount.discount}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between">
                  <span className="font-medium text-slate-800 dark:text-white">Total</span>
                  <span className="font-bold text-slate-800 dark:text-white">₹{booking.amount?.finalAmount}</span>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card padding="none">
              <div className="p-4 space-y-3">
                {/* Completed Booking Actions */}
                {booking?.status === 'completed' && (
                  <>
                    {/* Invoice Download */}
                    <Button
                      variant="outline"
                      className="w-full text-teal-600 border-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                      onClick={handleDownloadInvoice}
                      loading={downloadingInvoice}
                      icon={FiDownload}
                    >
                      Download Invoice
                    </Button>
                    
                    {/* Contact for Payment */}
                    {contactInfo && (
                      <a
                        href={contactInfo.telegramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Button
                          variant="primary"
                          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                          icon={FiMessageSquare}
                        >
                          Contact for Payment
                        </Button>
                      </a>
                    )}
                    
                    {/* Review Section */}
                    {canReview ? (
                      <Button
                        variant="outline"
                        className="w-full text-yellow-600 border-yellow-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        onClick={() => setShowReviewModal(true)}
                        icon={FiStar}
                      >
                        Leave a Review
                      </Button>
                    ) : existingReview ? (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <FiCheckCircle className="w-5 h-5" />
                          <span className="font-medium">You rated this service</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar
                              key={star}
                              className={`w-4 h-4 ${
                                star <= existingReview.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
                
                {canReschedule && (
                  <Button
                    variant="outline"
                    className="w-full text-teal-600 border-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                    onClick={() => setShowRescheduleModal(true)}
                    icon={FiRefreshCw}
                  >
                    Reschedule Booking
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="outline"
                    className="w-full text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={handleCancel}
                    loading={cancelling}
                    icon={FiXCircle}
                  >
                    Cancel Booking
                  </Button>
                )}
                <Link to="/services">
                  <Button variant="secondary" className="w-full">
                    Book Another Service
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Notes */}
            {booking.notes && (
              <Card padding="none">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="font-semibold text-slate-800 dark:text-white">Notes</h2>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400">{booking.notes}</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        booking={booking}
        onReschedule={handleReschedule}
      />

      {/* Review Modal */}
      <ReviewForm
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        booking={booking}
        onSubmit={handleReviewSubmit}
        existingReview={existingReview}
      />
    </DashboardLayout>
  )
}

export default BookingDetails
