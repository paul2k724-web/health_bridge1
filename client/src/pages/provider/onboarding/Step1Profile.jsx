import { useState } from 'react'
import { FiUser, FiBriefcase, FiEdit3, FiArrowRight } from 'react-icons/fi'
import { Button, Input } from '../../../components/ui'
import api from '../../../store/api'
import toast from 'react-hot-toast'

const providerTypes = [
  { value: 'healthcare', label: 'Healthcare Professional', icon: '🩺', description: 'Doctors, nurses, therapists' },
  { value: 'home_service', label: 'Home Service Provider', icon: '🔧', description: 'Plumbers, electricians, cleaners' },
  { value: 'both', label: 'Both', icon: '⭐', description: 'Offer both types of services' },
]

const Step1Profile = ({ data, updateData, onNext }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    providerType: data.providerType || 'both',
    specialization: data.specialization || '',
    experience: data.experience || 0,
    bio: data.bio || '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.specialization.trim()) {
      toast.error('Please enter your specialization')
      return
    }

    setLoading(true)
    try {
      await api.post('/provider/onboarding/step1', formData)
      updateData(formData)
      toast.success('Profile details saved!')
      onNext()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 animate-fade-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/30">
          <FiUser className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Tell us about yourself
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Let customers know who you are and what you specialize in
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            What type of services do you offer?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {providerTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, providerType: type.value }))}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  formData.providerType === type.value
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <span className="text-2xl mb-2 block">{type.icon}</span>
                <p className={`font-medium ${
                  formData.providerType === type.value
                    ? 'text-teal-700 dark:text-teal-400'
                    : 'text-slate-800 dark:text-white'
                }`}>
                  {type.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Specialization"
          name="specialization"
          icon={FiBriefcase}
          placeholder="e.g., General Physician, Electrician, Plumber"
          value={formData.specialization}
          onChange={handleChange}
          required
        />

        <Input
          label="Years of Experience"
          name="experience"
          type="number"
          min="0"
          max="50"
          placeholder="e.g., 5"
          value={formData.experience}
          onChange={handleChange}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Professional Bio
          </label>
          <div className="relative">
            <FiEdit3 className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <textarea
              name="bio"
              rows={4}
              placeholder="Tell customers about your professional background, expertise, and what makes you unique..."
              value={formData.bio}
              onChange={handleChange}
              maxLength={500}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 text-right">
            {formData.bio.length}/500 characters
          </p>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30"
            icon={FiArrowRight}
            iconPosition="right"
          >
            Continue to Services
          </Button>
        </div>
      </form>
    </div>
  )
}

export default Step1Profile
