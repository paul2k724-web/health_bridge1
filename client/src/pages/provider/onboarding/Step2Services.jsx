import { useState, useEffect } from 'react'
import { FiBriefcase, FiCheck, FiArrowRight, FiArrowLeft } from 'react-icons/fi'
import { Button } from '../../../components/ui'
import api from '../../../store/api'
import toast from 'react-hot-toast'

const Step2Services = ({ data, updateData, onNext, onBack }) => {
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState([])
  const [selectedServices, setSelectedServices] = useState(data.serviceCategories || [])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await api.get('/services')
      setServices(response.data.services || [])
    } catch (error) {
      toast.error('Failed to load services')
    }
  }

  const toggleService = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId)
      }
      return [...prev, serviceId]
    })
  }

  const filteredServices = services.filter(service => {
    if (filter === 'all') return true
    return service.category === filter
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service')
      return
    }

    setLoading(true)
    try {
      await api.post('/provider/onboarding/step2', { serviceIds: selectedServices })
      updateData({ serviceCategories: selectedServices })
      toast.success('Services saved!')
      onNext()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save services')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 animate-fade-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/30">
          <FiBriefcase className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Select your services
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Choose the services you want to offer to customers
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'healthcare', 'home_service'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === cat
                ? 'bg-teal-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {cat === 'all' ? 'All' : cat === 'healthcare' ? 'Healthcare' : 'Home Services'}
          </button>
        ))}
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
          <p className="text-slate-500 dark:text-slate-400 mt-4">Loading services...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto mb-6 pr-2">
          {filteredServices.map((service) => {
            const isSelected = selectedServices.includes(service._id)
            return (
              <button
                key={service._id}
                type="button"
                onClick={() => toggleService(service._id)}
                className={`p-4 rounded-xl border-2 transition-all text-left relative ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                    <FiCheck className="w-4 h-4 text-white" />
                  </div>
                )}
                <p className={`font-medium ${
                  isSelected
                    ? 'text-teal-700 dark:text-teal-400'
                    : 'text-slate-800 dark:text-white'
                }`}>
                  {service.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {service.description}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                    ₹{service.basePrice}
                  </span>
                  <span className="text-xs text-slate-400">
                    {service.duration} min
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-semibold">{selectedServices.length}</span> service{selectedServices.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-4">
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
          disabled={selectedServices.length === 0}
          className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30"
          icon={FiArrowRight}
          iconPosition="right"
        >
          Continue
        </Button>
      </form>
    </div>
  )
}

export default Step2Services
