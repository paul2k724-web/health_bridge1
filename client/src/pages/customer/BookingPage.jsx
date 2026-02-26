import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { createBooking } from '../../store/slices/bookingSlice'
import { getServices } from '../../store/slices/serviceSlice'
import api from '../../store/api'
import toast from 'react-hot-toast'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Select, Skeleton, LocationPicker } from '../../components/ui'
import { FiCheck, FiCalendar, FiClock, FiMapPin, FiArrowLeft, FiArrowRight, FiCreditCard, FiUser } from 'react-icons/fi'

const BookingPage = () => {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { services } = useSelector((state) => state.service)
  const { user } = useSelector((state) => state.auth)
  const [addresses, setAddresses] = useState([])
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newLocation, setNewLocation] = useState(null)
  const [formData, setFormData] = useState({
    addressId: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
  })

  const service = services.find((s) => s._id === serviceId)

  useEffect(() => {
    if (serviceId) {
      dispatch(getServices())
    }
    fetchAddresses()
  }, [serviceId, dispatch])

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/customer/addresses')
      setAddresses(response.data.data.addresses)
      if (response.data.data.addresses.length > 0) {
        const defaultAddr = response.data.data.addresses.find((a) => a.isDefault) || response.data.data.addresses[0]
        setFormData((prev) => ({ ...prev, addressId: defaultAddr._id }))
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = async (locationData) => {
    setNewLocation(locationData)
    
    try {
      const addressData = {
        label: 'New Address',
        addressLine1: locationData.address || 'Selected Location',
        city: locationData.addressData?.city || '',
        state: locationData.addressData?.state || '',
        pincode: locationData.addressData?.postcode || '',
        location: {
          type: 'Point',
          coordinates: [locationData.coordinates.lon, locationData.coordinates.lat],
        },
      }

      const response = await api.post('/customer/addresses', addressData)
      setAddresses([...addresses, response.data.data.address])
      setFormData({ ...formData, addressId: response.data.data.address._id })
      toast.success('Address added successfully')
    } catch (error) {
      toast.error('Failed to add address')
    }
  }

  const handleSubmit = async () => {
    if (!formData.addressId || !formData.scheduledDate || !formData.scheduledTime) {
      toast.error('Please fill all fields')
      return
    }

    setSubmitting(true)
    try {
      const result = await dispatch(
        createBooking({
          serviceId,
          addressId: formData.addressId,
          scheduledDate: formData.scheduledDate,
          scheduledTime: formData.scheduledTime,
        })
      ).unwrap()
      toast.success('Booking created successfully!')
      navigate(`/customer/bookings/${result.booking._id}`)
    } catch (error) {
      toast.error(error || 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  const getFinalAmount = () => {
    if (!service) return 0
    return service.basePrice - (service.basePrice * (service.discount?.percentage || 0)) / 100
  }

  const getAddressById = (id) => addresses.find((a) => a._id === id)

  const steps = [
    { number: 1, title: 'Service Details' },
    { number: 2, title: 'Schedule' },
    { number: 3, title: 'Confirm' },
  ]

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ]

  if (loading || !service) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton variant="card" className="h-24" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton variant="card" className="lg:col-span-2 h-96" />
            <Skeleton variant="card" className="h-96" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary-500 hover:text-primary-700 mb-4"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to services
          </button>
          <h1 className="text-page-title text-primary-900">Book Service</h1>
        </div>

        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${step >= s.number
                      ? 'bg-primary-900 text-white'
                      : 'bg-primary-100 text-primary-400'
                    }
                  `}
                >
                  {step > s.number ? <FiCheck className="w-5 h-5" /> : s.number}
                </div>
                <span className={`ml-3 text-sm font-medium hidden sm:block ${step >= s.number ? 'text-primary-900' : 'text-primary-400'}`}>
                  {s.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${step > s.number ? 'bg-primary-900' : 'bg-primary-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {step === 1 && (
              <Card padding="none" className="animate-fade-up">
                <div className="px-6 py-4 border-b border-primary-100">
                  <h2 className="text-lg font-semibold text-primary-900">Service Details</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                      <FiUser className="w-8 h-8 text-accent-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-primary-900">{service.name}</h3>
                      <p className="text-primary-500 mt-1">{service.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-2xl font-bold text-primary-900">₹{getFinalAmount()}</span>
                        {service.discount?.percentage > 0 && (
                          <>
                            <span className="text-lg text-primary-400 line-through">₹{service.basePrice}</span>
                            <span className="px-2 py-1 rounded-full bg-success-light text-success-dark text-sm font-medium">
                              {service.discount.percentage}% OFF
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-primary-400 mt-2">Duration: {service.duration} minutes</p>
                    </div>
                  </div>

                  <div className="bg-primary-50 rounded-lg p-4">
                    <h4 className="font-medium text-primary-900 mb-2">What's included</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm text-primary-600">
                        <FiCheck className="w-4 h-4 text-success" />
                        Professional service at your location
                      </li>
                      <li className="flex items-center gap-2 text-sm text-primary-600">
                        <FiCheck className="w-4 h-4 text-success" />
                        Digital report after completion
                      </li>
                      <li className="flex items-center gap-2 text-sm text-primary-600">
                        <FiCheck className="w-4 h-4 text-success" />
                        Secure payment processing
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="px-6 py-4 bg-primary-50 border-t border-primary-100 flex justify-end">
                  <Button variant="primary" onClick={() => setStep(2)} icon={FiArrowRight} iconPosition="right">
                    Continue to Schedule
                  </Button>
                </div>
              </Card>
            )}

            {step === 2 && (
              <Card padding="none" className="animate-fade-up">
                <div className="px-6 py-4 border-b border-primary-100">
                  <h2 className="text-lg font-semibold text-primary-900">Schedule Appointment</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      <FiMapPin className="inline w-4 h-4 mr-1" />
                      Select Address
                    </label>
                    <div className="space-y-2 mb-4">
                      {addresses.map((addr) => (
                        <label
                          key={addr._id}
                          className={`
                            flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                            ${formData.addressId === addr._id
                              ? 'border-accent-500 bg-accent-50'
                              : 'border-primary-200 hover:border-primary-300'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="address"
                            value={addr._id}
                            checked={formData.addressId === addr._id}
                            onChange={(e) => setFormData({ ...formData, addressId: e.target.value })}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium text-primary-900">{addr.label}</p>
                            <p className="text-sm text-primary-500">{addr.addressLine1}, {addr.city}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-primary-700 mb-2">Or add new address</p>
                      <LocationPicker
                        onLocationSelect={handleLocationSelect}
                        height="250px"
                        showAddressSearch={true}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      <FiCalendar className="inline w-4 h-4 mr-1" />
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      <FiClock className="inline w-4 h-4 mr-1" />
                      Select Time
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setFormData({ ...formData, scheduledTime: time })}
                          className={`
                            py-2 px-3 rounded-lg text-sm font-medium transition-all
                            ${formData.scheduledTime === time
                              ? 'bg-primary-900 text-white'
                              : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                            }
                          `}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-primary-50 border-t border-primary-100 flex justify-between">
                  <Button variant="secondary" onClick={() => setStep(1)} icon={FiArrowLeft}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setStep(3)}
                    disabled={!formData.addressId || !formData.scheduledDate || !formData.scheduledTime}
                    icon={FiArrowRight}
                    iconPosition="right"
                  >
                    Review Booking
                  </Button>
                </div>
              </Card>
            )}

            {step === 3 && (
              <Card padding="none" className="animate-fade-up">
                <div className="px-6 py-4 border-b border-primary-100">
                  <h2 className="text-lg font-semibold text-primary-900">Confirm Booking</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="bg-primary-50 rounded-lg p-4">
                    <h4 className="font-medium text-primary-900 mb-4">Booking Summary</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <FiUser className="w-5 h-5 text-primary-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-primary-500">Service</p>
                          <p className="font-medium text-primary-900">{service.name}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <FiCalendar className="w-5 h-5 text-primary-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-primary-500">Date & Time</p>
                          <p className="font-medium text-primary-900">
                            {new Date(formData.scheduledDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })} at {formData.scheduledTime}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <FiMapPin className="w-5 h-5 text-primary-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-primary-500">Address</p>
                          <p className="font-medium text-primary-900">
                            {getAddressById(formData.addressId)?.addressLine1}, {getAddressById(formData.addressId)?.city}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-success-light rounded-lg p-4">
                    <div className="flex items-center gap-2 text-success-dark">
                      <FiCheck className="w-5 h-5" />
                      <span className="font-medium">Ready to proceed</span>
                    </div>
                    <p className="text-sm text-success-dark/80 mt-1">
                      Click confirm to create your booking and proceed to payment.
                    </p>
                  </div>
                </div>
                <div className="px-6 py-4 bg-primary-50 border-t border-primary-100 flex justify-between">
                  <Button variant="secondary" onClick={() => setStep(2)} icon={FiArrowLeft}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={submitting}
                    icon={FiCreditCard}
                    iconPosition="right"
                  >
                    Confirm & Pay
                  </Button>
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card padding="none" className="sticky top-24">
              <div className="px-6 py-4 border-b border-primary-100">
                <h3 className="font-semibold text-primary-900">Booking Summary</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-accent-100 flex items-center justify-center">
                    <FiUser className="w-6 h-6 text-accent-600" />
                  </div>
                  <div>
                    <p className="font-medium text-primary-900">{service.name}</p>
                    <p className="text-sm text-primary-500">{service.duration} mins</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primary-500">Base Price</span>
                    <span className="text-primary-900">₹{service.basePrice}</span>
                  </div>
                  {service.discount?.percentage > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount ({service.discount.percentage}%)</span>
                      <span>-₹{(service.basePrice * service.discount.percentage / 100).toFixed(0)}</span>
                    </div>
                  )}
                  <div className="border-t border-primary-100 pt-3 flex justify-between">
                    <span className="font-medium text-primary-900">Total</span>
                    <span className="font-bold text-primary-900 text-lg">₹{getFinalAmount()}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                  <div className="flex items-center gap-2 text-primary-600 text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Secure checkout with Razorpay</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default BookingPage
