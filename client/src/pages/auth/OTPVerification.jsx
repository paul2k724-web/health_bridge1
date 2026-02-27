import { useState, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { FiActivity, FiArrowLeft, FiShield } from 'react-icons/fi'
import { verifyOTP } from '../../store/slices/authSlice'
import api from '../../store/api'
import { Button } from '../../components/ui'
import toast from 'react-hot-toast'

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef([])
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const userId = location.state?.userId
  const redirectTo = location.state?.redirectTo

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleResendOTP = async () => {
    if (!userId || countdown > 0) return
    
    setResending(true)
    try {
      await api.post('/auth/resend-otp', { userId })
      toast.success('OTP sent successfully!')
      setCountdown(60)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char
    })
    setOtp(newOtp)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')
    
    if (otpString.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    if (!userId) {
      toast.error('User ID not found. Please register again.')
      navigate('/register')
      return
    }

    setLoading(true)
    try {
      const result = await dispatch(verifyOTP({ userId, otp: otpString })).unwrap()
      toast.success('OTP verified successfully!')
      const user = result.user
      
      if (redirectTo) {
        navigate(redirectTo)
      } else if (user.role === 'customer') {
        navigate('/customer/dashboard')
      } else if (user.role === 'provider') {
        navigate('/provider/onboarding')
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/')
      }
    } catch (error) {
      toast.error(error || 'OTP verification failed')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-600 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-accent-500 flex items-center justify-center">
              <FiActivity className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-semibold text-white">HealthBridge</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-semibold text-white leading-tight mb-6">
            Secure<br />Verification
          </h1>
          
          <p className="text-lg text-primary-300 mb-12 max-w-md">
            Your security is our priority. We've sent a verification code 
            to your registered email and phone number.
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center flex-shrink-0">
              <FiShield className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-1">Why do we need this?</h3>
              <p className="text-primary-300 text-sm">
                This verification ensures that only you can access your account 
                and protects your personal health information.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface-base">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary-900 flex items-center justify-center">
              <FiActivity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-primary-900">HealthBridge</span>
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiShield className="w-8 h-8 text-accent-600" />
            </div>
            <h2 className="text-2xl font-semibold text-primary-900 mb-2">
              Verify Your Account
            </h2>
            <p className="text-primary-500">
              Enter the 6-digit code sent to your email and phone
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div 
                className="flex items-center justify-center gap-3"
                onPaste={handlePaste}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-semibold
                      bg-white border border-primary-200 rounded-lg
                      text-primary-900
                      focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500
                      transition-all duration-150"
                  />
                ))}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                Verify & Continue
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-primary-100">
              <p className="text-center text-sm text-primary-500">
                Didn't receive the code?{' '}
                <button 
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || resending}
                  className={`font-medium ${(countdown > 0 || resending) ? 'text-primary-300 cursor-not-allowed' : 'text-accent-600 hover:text-accent-700'}`}
                >
                  {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OTPVerification
