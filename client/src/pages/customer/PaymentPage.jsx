import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../store/api'
import toast from 'react-hot-toast'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Skeleton } from '../../components/ui'
import { FiCreditCard, FiCheck, FiShield, FiClock, FiMapPin, FiUser, FiArrowLeft } from 'react-icons/fi'

const PaymentPage = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)
  const [booking, setBooking] = useState(null)
  const [fetching, setFetching] = useState(true)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  useEffect(() => {
    fetchBooking()
    createOrder()
  }, [bookingId])

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}`)
      setBooking(response.data.data.booking)
    } catch (error) {
      toast.error('Failed to fetch booking details')
    } finally {
      setFetching(false)
    }
  }

  const createOrder = async () => {
    try {
      const response = await api.post('/payment/create-order', { bookingId })
      setOrder(response.data.data?.order || null)
    } catch (error) {
      // Payment not available yet - skip silently
    }
  }

  const handlePayment = async () => {
    if (!order) return

    setLoading(true)
    const options = {
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: 'HealthBridge',
      description: 'Healthcare Service Booking',
      order_id: order.id,
      handler: async function (response) {
        try {
          const verifyResponse = await api.post('/payment/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            paymentId: response.paymentId,
          })

          if (verifyResponse.data.success) {
            setPaymentSuccess(true)
            toast.success('Payment successful!')
            setTimeout(() => {
              navigate('/customer/dashboard')
            }, 2000)
          }
        } catch (error) {
          toast.error('Payment verification failed')
        } finally {
          setLoading(false)
        }
      },
      prefill: {
        name: booking?.customer?.name || 'Customer',
        email: booking?.customer?.email || 'customer@example.com',
        contact: booking?.customer?.phone || '9999999999',
      },
      theme: {
        color: '#0F172A',
      },
    }

    const razorpay = new window.Razorpay(options)
    razorpay.open()
    razorpay.on('payment.failed', function () {
      toast.error('Payment failed')
      setLoading(false)
    })
  }

  if (fetching || !booking || !order) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton variant="card" className="h-24" />
          <Skeleton variant="card" className="h-64" />
          <Skeleton variant="card" className="h-32" />
        </div>
      </DashboardLayout>
    )
  }

  if (paymentSuccess) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto animate-fade-up">
          <Card className="text-center py-12">
            <div className="w-20 h-20 bg-success-light rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheck className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-semibold text-primary-900 mb-2">Payment Successful!</h2>
            <p className="text-primary-500 mb-6">
              Your booking has been confirmed. You will be redirected to your dashboard.
            </p>
            <div className="bg-primary-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-primary-600">
                Booking ID: <span className="font-mono font-medium">{booking._id}</span>
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate('/customer/dashboard')}>
              Go to Dashboard
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary-500 hover:text-primary-700 mb-4"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-page-title text-primary-900">Complete Payment</h1>
          <p className="text-primary-500 mt-1">Secure checkout for your booking</p>
        </div>

        <Card padding="none">
          <div className="px-6 py-4 border-b border-primary-100">
            <h2 className="text-lg font-semibold text-primary-900">Order Summary</h2>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                <FiUser className="w-7 h-7 text-accent-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-primary-900">{booking.service?.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-primary-500">
                  <span className="flex items-center gap-1">
                    <FiClock className="w-4 h-4" />
                    {booking.scheduledTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiMapPin className="w-4 h-4" />
                    {booking.address?.city}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm border-t border-primary-100 pt-4">
              <div className="flex justify-between">
                <span className="text-primary-500">Service Fee</span>
                <span className="text-primary-900">₹{booking.amount?.baseAmount || booking.amount?.finalAmount}</span>
              </div>
              {booking.amount?.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount Applied</span>
                  <span>-₹{booking.amount?.discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-primary-500">Platform Fee</span>
                <span className="text-primary-900">₹0</span>
              </div>
              <div className="border-t border-primary-100 pt-3 flex justify-between">
                <span className="font-semibold text-primary-900">Total Amount</span>
                <span className="font-bold text-primary-900 text-xl">₹{booking.amount?.finalAmount}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card padding="none">
          <div className="px-6 py-4 border-b border-primary-100">
            <h2 className="text-lg font-semibold text-primary-900">Payment Method</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 p-4 border-2 border-primary-200 rounded-lg mb-6">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <FiCreditCard className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary-900">Razorpay Secure Checkout</p>
                <p className="text-sm text-primary-500">Pay via UPI, Cards, Net Banking, or Wallets</p>
              </div>
              <FiCheck className="w-5 h-5 text-success" />
            </div>

            <div className="bg-primary-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-primary-700 mb-2">
                <FiShield className="w-5 h-5" />
                <span className="font-medium">Secure Payment</span>
              </div>
              <p className="text-sm text-primary-500">
                Your payment information is encrypted with 256-bit SSL security.
                We never store your card details.
              </p>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded">
                <span className="text-xs font-medium text-primary-600">UPI</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded">
                <span className="text-xs font-medium text-primary-600">VISA</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded">
                <span className="text-xs font-medium text-primary-600">Mastercard</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded">
                <span className="text-xs font-medium text-primary-600">Net Banking</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              onClick={handlePayment}
              icon={FiCreditCard}
              iconPosition="right"
            >
              Pay ₹{booking.amount?.finalAmount} Securely
            </Button>

            <p className="text-center text-xs text-primary-400 mt-4">
              By proceeding, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-6 text-sm text-primary-400">
          <span className="flex items-center gap-1">
            <FiShield className="w-4 h-4" />
            SSL Secured
          </span>
          <span className="flex items-center gap-1">
            <FiCheck className="w-4 h-4" />
            PCI Compliant
          </span>
          <span className="flex items-center gap-1">
            <FiShield className="w-4 h-4" />
            100% Safe
          </span>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PaymentPage
