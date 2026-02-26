import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../store/api'
import toast from 'react-hot-toast'
import { FiStar, FiMapPin, FiCheck, FiBriefcase, FiArrowLeft, FiUser, FiClock, FiNavigation } from 'react-icons/fi'

const ProvidersList = () => {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const [providers, setProviders] = useState([])
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState(null)

  useEffect(() => {
    detectLocation()
    fetchServiceDetails()
  }, [serviceId])

  useEffect(() => {
    if (userLocation) {
      fetchProviders()
    }
  }, [userLocation, serviceId])

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        () => {
          setUserLocation({ latitude: 28.6139, longitude: 77.2090 })
        }
      )
    } else {
      setUserLocation({ latitude: 28.6139, longitude: 77.2090 })
    }
  }

  const fetchServiceDetails = async () => {
    try {
      const response = await api.get(`/services/${serviceId}`)
      setService(response.data.service)
    } catch (error) {
      toast.error('Failed to load service details')
    }
  }

  const fetchProviders = async () => {
    try {
      const response = await api.get(
        `/services/${serviceId}/providers?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}`
      )
      setProviders(response.data.providers || [])
    } catch (error) {
      console.error('Failed to fetch providers:', error)
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProvider = (provider) => {
    setSelectedProvider(provider)
  }

  const handleBookNow = (providerId) => {
    navigate(`/booking/${serviceId}?providerId=${providerId}`)
  }

  const handleBookAnyProvider = () => {
    navigate(`/booking/${serviceId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back
          </button>

          {service && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {service.name}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  {service.description}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-lg font-semibold text-teal-600 dark:text-teal-400">
                    ₹{service.basePrice}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <FiClock className="w-4 h-4" />
                    {service.duration} min
                  </span>
                </div>
              </div>
              <button
                onClick={handleBookAnyProvider}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium rounded-xl hover:from-teal-600 hover:to-cyan-600 shadow-lg shadow-teal-500/30 transition-all"
              >
                Book with Any Available Provider
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Providers List */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            Available Providers ({providers.length})
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Select a specific provider or book with any available
          </p>
        </div>

        {providers.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <FiUser className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              No providers available
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
              There are no providers available for this service in your area right now.
              Try again later or book with any available provider.
            </p>
            <button
              onClick={handleBookAnyProvider}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium rounded-xl hover:from-teal-600 hover:to-cyan-600"
            >
              Book Anyway
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`bg-white dark:bg-slate-800 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedProvider?.id === provider.id
                    ? 'border-teal-500 shadow-lg shadow-teal-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                onClick={() => handleSelectProvider(provider)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      {provider.avatar ? (
                        <img
                          src={provider.avatar}
                          alt={provider.name}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-white">
                          {provider.name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                        {provider.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {provider.specialization}
                      </p>
                    </div>
                    {provider.isAvailable && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                        Online
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium text-slate-800 dark:text-white">
                          {provider.rating?.toFixed(1) || 'New'}
                        </span>
                        {provider.totalReviews > 0 && (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            ({provider.totalReviews} reviews)
                          </span>
                        )}
                      </div>
                      {provider.completionRate > 0 && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {provider.completionRate}% completion
                        </span>
                      )}
                    </div>

                    {provider.distance !== null && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <FiMapPin className="w-4 h-4" />
                        <span>{provider.distance?.toFixed(1)} km away</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <FiBriefcase className="w-4 h-4" />
                      <span>{provider.services?.length || 0} services</span>
                    </div>

                    {/* Verified Badges */}
                    <div className="flex flex-wrap gap-2">
                      {provider.verified?.license && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                          <FiCheck className="w-3 h-3" />
                          License Verified
                        </span>
                      )}
                      {provider.verified?.idProof && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                          <FiCheck className="w-3 h-3" />
                          ID Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBookNow(provider.id)
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {providers.length > 0 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl text-center">
            <h3 className="text-xl font-bold text-white mb-2">
              Not sure who to pick?
            </h3>
            <p className="text-teal-100 mb-4">
              Let us assign the best available provider for your booking.
            </p>
            <button
              onClick={handleBookAnyProvider}
              className="px-8 py-3 bg-white text-teal-600 font-semibold rounded-xl hover:bg-teal-50 transition-colors"
            >
              Book with Auto-Assignment
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProvidersList
