import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiActivity, FiArrowLeft, FiSun, FiMoon, FiArrowRight } from 'react-icons/fi'
import api from '../../store/api'
import { Button, Input } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import toast from 'react-hot-toast'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/forgot-password', { email })
      
      if (response.data.data?.userId) {
        toast.success('OTP sent to your email')
        navigate('/reset-password', { 
          state: { 
            userId: response.data.data.userId,
            email: email 
          } 
        })
      } else {
        setSubmitted(true)
        toast.success('If the email exists, an OTP will be sent')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-surface-base dark:bg-slate-900 transition-colors duration-300">
      {/* Left Side - Branding */}
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
            Reset Your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Password</span>
          </h1>
          
          <p className="text-lg text-slate-300 mb-12 max-w-md">
            Don't worry, it happens to the best of us. Enter your email and we'll send you a verification code to reset your password.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute top-6 right-6 lg:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {isDark ? <FiSun className="w-5 h-5 text-slate-200" /> : <FiMoon className="w-5 h-5 text-slate-600" />}
          </button>
        </div>
        
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <FiActivity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white">HealthBridge</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Forgot Password?
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Enter your email to receive a verification code
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-none border border-slate-200 dark:border-slate-700 p-8">
            {submitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <FiMail className="w-8 h-8 text-teal-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  Check Your Email
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  If an account with that email exists, we've sent a verification code.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email Address"
                  type="email"
                  icon={FiMail}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30"
                  icon={FiArrowRight}
                  iconPosition="right"
                >
                  Send Verification Code
                </Button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
