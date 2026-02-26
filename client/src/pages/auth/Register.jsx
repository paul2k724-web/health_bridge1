import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { FiUser, FiMail, FiPhone, FiLock, FiActivity, FiArrowRight, FiBriefcase, FiAward, FiClock, FiSun, FiMoon, FiCheck } from 'react-icons/fi'
import { register } from '../../store/slices/authSlice'
import { Button, Input, Select } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import toast from 'react-hot-toast'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    specialization: '',
    experience: '',
    licenseNumber: '',
    bio: '',
  })
  const [step, setStep] = useState(1)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((state) => state.auth)
  const { isDark, toggleTheme } = useTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.role === 'provider') {
      if (!formData.specialization || !formData.experience || !formData.licenseNumber || !formData.bio) {
        toast.error('Please fill all provider details')
        return
      }
      if (isNaN(formData.experience) || formData.experience < 0) {
        toast.error('Experience must be a valid positive number')
        return
      }
    }
    
    try {
      const result = await dispatch(register(formData)).unwrap()
      toast.success('Registration successful! Please verify OTP.')
      
      if (formData.role === 'provider') {
        navigate('/verify-otp', { 
          state: { 
            userId: result.userId,
            email: formData.email,
            redirectTo: '/provider/onboarding'
          } 
        })
      } else {
        navigate('/verify-otp', { 
          state: { 
            userId: result.userId,
            email: formData.email
          } 
        })
      }
    } catch (error) {
      toast.error(error || 'Registration failed')
    }
  }

  const roleOptions = [
    { value: 'customer', label: 'Customer - Book healthcare services' },
    { value: 'provider', label: 'Provider - Offer medical/technical services' },
  ]

  return (
    <div className="min-h-screen flex bg-surface-base dark:bg-slate-900 transition-colors duration-300">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-3xl" />
        </div>
        
        <div className="absolute top-6 right-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            {isDark ? <FiSun className="w-5 h-5 text-white" /> : <FiMoon className="w-5 h-5 text-white" />}
          </button>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <FiActivity className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">HealthBridge</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Join Our Healthcare<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Network</span>
          </h1>
          
          <p className="text-lg text-slate-300 mb-12 max-w-md">
            Whether you're seeking quality healthcare services or looking to 
            offer your professional expertise, we've got you covered.
          </p>

          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <FiUser className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">For Customers</h3>
                  <p className="text-slate-400 text-sm">
                    Access verified healthcare professionals, book appointments, 
                    and manage your health records in one place.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                  <FiBriefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">For Providers</h3>
                  <p className="text-slate-400 text-sm">
                    Grow your practice, manage appointments efficiently, 
                    and connect with patients who need your expertise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto relative">
        <div className="absolute top-6 right-6 lg:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {isDark ? <FiSun className="w-5 h-5 text-slate-200" /> : <FiMoon className="w-5 h-5 text-slate-600" />}
          </button>
        </div>
        
        <div className="w-full max-w-lg animate-fade-up">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <FiActivity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white">HealthBridge</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Create your account
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Get started with HealthBridge today
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-none border border-slate-200 dark:border-slate-700 p-8">
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= s 
                      ? 'bg-gradient-to-br from-teal-400 to-cyan-500 text-white shadow-lg shadow-teal-500/30' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  }`}>
                    {step > s ? <FiCheck className="w-5 h-5" /> : s}
                  </div>
                  {s < 2 && (
                    <div className={`h-0.5 w-12 transition-colors ${
                      step >= s + 1 ? 'bg-gradient-to-r from-teal-400 to-cyan-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 1 && (
                <>
                  <Input
                    label="Full Name"
                    icon={FiUser}
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    icon={FiMail}
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    icon={FiPhone}
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />

                  <Input
                    label="Password"
                    type="password"
                    icon={FiLock}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />

                  <Select
                    label="I want to register as"
                    options={roleOptions}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />

                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30"
                    onClick={() => {
                      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
                        toast.error('Please fill all fields')
                        return
                      }
                      setStep(2)
                    }}
                    icon={FiArrowRight}
                    iconPosition="right"
                  >
                    Continue
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  {formData.role === 'customer' ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/30">
                        <FiCheck className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Ready to create your account?</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Review your details and click register to proceed.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4 mb-4">
                        <p className="text-sm text-cyan-700 dark:text-cyan-300">
                          <strong>Note:</strong> Provider accounts require admin verification after registration.
                        </p>
                      </div>

                      <Input
                        label="Specialization"
                        icon={FiBriefcase}
                        placeholder="e.g., Cardiology, Dentistry"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        required={formData.role === 'provider'}
                      />

                      <Input
                        label="Years of Experience"
                        type="number"
                        icon={FiClock}
                        placeholder="e.g., 5"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        required={formData.role === 'provider'}
                      />

                      <Input
                        label="License Number"
                        icon={FiAward}
                        placeholder="e.g., MED-2024-001"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        required={formData.role === 'provider'}
                      />

                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Professional Bio
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Tell us about your professional background"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                          required={formData.role === 'provider'}
                        />
                        <p className="text-xs text-slate-400 dark:text-slate-500">Max 500 characters</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      className="flex-1"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={loading}
                      className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30"
                    >
                      Create Account
                    </Button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-400 dark:text-slate-500">
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
