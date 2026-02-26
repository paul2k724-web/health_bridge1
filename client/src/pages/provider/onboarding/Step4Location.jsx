import { useState, useEffect, useRef } from 'react'
import { FiMapPin, FiCheck, FiArrowLeft, FiNavigation } from 'react-icons/fi'
import { Button, Input } from '../../../components/ui'
import api from '../../../store/api'
import toast from 'react-hot-toast'
import LocationPicker from '../../../components/ui/LocationPicker'

const radiusOptions = [
  { value: 5, label: '5 km', description: 'Close to your location' },
  { value: 10, label: '10 km', description: 'Standard coverage' },
  { value: 15, label: '15 km', description: 'Extended coverage' },
  { value: 25, label: '25 km', description: 'Wide coverage' },
  { value: 50, label: '50 km', description: 'Maximum coverage' },
]

const Step4Location = ({ data, updateData, onSubmit, onBack }) => {
  const [loading, setLoading] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [location, setLocation] = useState(data.baseLocation?.coordinates || null)
  const [address, setAddress] = useState(data.baseLocation?.address || '')
  const [radius, setRadius] = useState(data.availabilityRadius || 10)
  const [agreementAccepted, setAgreementAccepted] = useState(data.agreementAccepted || false)

  const handleLocationSelect = (lat, lng, addr) => {
    setLocation([lng, lat])
    setAddress(addr)
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocation([longitude, latitude])
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await response.json()
          setAddress(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        } catch (error) {
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        }
        
        setDetecting(false)
        toast.success('Location detected!')
      },
      (error) => {
        setDetecting(false)
        toast.error('Failed to detect location. Please select manually.')
      },
      { enableHighAccuracy: true }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!location) {
      toast.error('Please select your service location')
      return
    }

    if (!agreementAccepted) {
      toast.error('Please accept the terms and conditions')
      return
    }

    setLoading(true)
    try {
      await api.post('/provider/onboarding/step4', {
        longitude: location[0],
        latitude: location[1],
        address,
        radius,
      })

      await api.post('/provider/onboarding/accept-agreement')
      
      updateData({
        baseLocation: { coordinates: location, address },
        availabilityRadius: radius,
        agreementAccepted: true,
      })

      toast.success('Location saved!')
      onSubmit()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save location')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 animate-fade-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/30">
          <FiMapPin className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Set your service area
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Customers within this area will be able to book your services
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Your Base Location
          </label>
          
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detecting}
            className="w-full mb-3 px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <FiNavigation className={`w-5 h-5 ${detecting ? 'animate-spin' : ''}`} />
            {detecting ? 'Detecting location...' : 'Use my current location'}
          </button>

          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialLocation={location ? { lat: location[1], lng: location[0] } : null}
            />
          </div>

          {address && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-teal-500" />
              <span className="truncate">{address}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Service Radius
          </label>
          <div className="grid grid-cols-5 gap-2">
            {radiusOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRadius(opt.value)}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  radius === opt.value
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <p className={`font-bold ${
                  radius === opt.value
                    ? 'text-teal-700 dark:text-teal-400'
                    : 'text-slate-800 dark:text-white'
                }`}>
                  {opt.label}
                </p>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            You'll receive job requests from customers within {radius} km of your location
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreementAccepted}
              onChange={(e) => setAgreementAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 text-teal-500 rounded border-slate-300 dark:border-slate-600 focus:ring-teal-500"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              I agree to the{' '}
              <a href="#" className="text-teal-600 dark:text-teal-400 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-teal-600 dark:text-teal-400 hover:underline">
                Provider Agreement
              </a>
              . I understand that providing false information may result in account suspension.
            </span>
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onBack}
            icon={FiArrowLeft}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!location || !agreementAccepted}
            className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30"
            icon={FiCheck}
            iconPosition="right"
          >
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  )
}

export default Step4Location
