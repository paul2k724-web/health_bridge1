import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUser, FiBriefcase, FiFileText, FiMapPin, FiCheck, FiActivity } from 'react-icons/fi'
import api from '../../../store/api'
import toast from 'react-hot-toast'

import Step1Profile from './Step1Profile'
import Step2Services from './Step2Services'
import Step3Documents from './Step3Documents'
import Step4Location from './Step4Location'
import OnboardingComplete from './OnboardingComplete'

const steps = [
  { id: 1, name: 'Profile', icon: FiUser, description: 'Your professional details' },
  { id: 2, name: 'Services', icon: FiBriefcase, description: 'What you offer' },
  { id: 3, name: 'Documents', icon: FiFileText, description: 'Verification documents' },
  { id: 4, name: 'Location', icon: FiMapPin, description: 'Your service area' },
]

const ProviderOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [onboardingData, setOnboardingData] = useState({
    providerType: 'both',
    specialization: '',
    experience: 0,
    bio: '',
    serviceCategories: [],
    documents: {},
    baseLocation: null,
    availabilityRadius: 10,
  })
  const [isComplete, setIsComplete] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchOnboardingStatus()
  }, [])

  const fetchOnboardingStatus = async () => {
    try {
      const response = await api.get('/provider/onboarding/status')
      if (response.data.status === 'submitted') {
        setIsSubmitted(true)
        setIsComplete(true)
      } else {
        setCurrentStep(response.data.currentStep || 1)
        if (response.data.profile) {
          setOnboardingData(prev => ({
            ...prev,
            ...response.data.profile,
            serviceCategories: response.data.profile.serviceCategories?.map(s => s._id || s) || [],
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching onboarding status:', error)
      toast.error('Failed to load onboarding status')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const updateData = (data) => {
    setOnboardingData(prev => ({ ...prev, ...data }))
  }

  const handleSubmit = async () => {
    try {
      await api.post('/provider/onboarding/submit')
      setIsSubmitted(true)
      setIsComplete(true)
      toast.success('Application submitted successfully!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit application')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  if (isComplete && isSubmitted) {
    return <OnboardingComplete />
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Profile
            data={onboardingData}
            updateData={updateData}
            onNext={handleNext}
          />
        )
      case 2:
        return (
          <Step2Services
            data={onboardingData}
            updateData={updateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 3:
        return (
          <Step3Documents
            data={onboardingData}
            updateData={updateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 4:
        return (
          <Step4Location
            data={onboardingData}
            updateData={updateData}
            onSubmit={handleSubmit}
            onBack={handleBack}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <FiActivity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Provider Onboarding</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Complete your profile to start receiving bookings</p>
              </div>
            </div>
          </div>

          <nav aria-label="Progress" className="mb-2">
            <ol className="flex items-center justify-between">
              {steps.map((step, index) => (
                <li key={step.id} className="relative flex-1">
                  <div className="flex items-center">
                    <button
                      onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                      disabled={step.id > currentStep}
                      className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                        step.id < currentStep
                          ? 'bg-gradient-to-br from-teal-400 to-cyan-500 text-white cursor-pointer'
                          : step.id === currentStep
                          ? 'bg-gradient-to-br from-teal-400 to-cyan-500 text-white shadow-lg shadow-teal-500/30'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {step.id < currentStep ? (
                        <FiCheck className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </button>
                    
                    <div className="hidden sm:block ml-4 flex-1">
                      <p className={`text-sm font-medium ${
                        step.id <= currentStep
                          ? 'text-slate-800 dark:text-white'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {step.name}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {step.description}
                      </p>
                    </div>

                    {index < steps.length - 1 && (
                      <div
                        className={`hidden md:block absolute right-0 top-5 h-0.5 w-full -translate-y-1/2 ${
                          step.id < currentStep
                            ? 'bg-gradient-to-r from-teal-400 to-cyan-500'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                        style={{ left: '60%', width: 'calc(100% - 60px)' }}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </nav>

          <div className="sm:hidden text-center mb-4">
            <p className="text-sm font-medium text-slate-800 dark:text-white">
              Step {currentStep}: {steps[currentStep - 1].name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStep()}
      </main>
    </div>
  )
}

export default ProviderOnboarding
