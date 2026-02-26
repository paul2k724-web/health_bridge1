import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiLock, FiActivity, FiArrowLeft, FiSun, FiMoon, FiArrowRight, FiCheck } from 'react-icons/fi'
import api from '../../store/api'
import { Button, Input } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import toast from 'react-hot-toast'

const ResetPassword = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [resetSuccess, setResetSuccess] = useState(false)
  
  const inputRefs = useRef([])

  const userId = location.state?.userId
  const email = location.state?.email

  useEffect(() => {
    if (!userId) {
      toast.error('Invalid reset request')
      navigate('/forgot-password')
    }
  }, [userId, navigate])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleOtpChange = (index, value) => {
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
    if (pastedData.length >= 6) {
      inputRefs.current[5]?.focus()
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    
    setResendLoading(true)
    try {
      await api.post('/auth/resend-otp', { userId })
      toast.success('OTP sent successfully')
      setCountdown(60)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setResendLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit code')
      return
    }

    if (!newPassword) {
      toast.error('Please enter a new password')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        userId,
        otp: otpString,
        newPassword
      })
      
      setResetSuccess(true)
      toast.success('Password reset successfully!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
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
            Create New<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Password</span>
          </h1>
          
          <p className="text-lg text-slate-300 mb-12 max-w-md">
            Enter the verification code sent to your email and create a new secure password for your account.
          </p>
          
          {email && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-md">
              <p className="text-sm text-slate-300">
                Verification code sent to:
              </p>
              <p className="text-white font-medium">{email}</p>
            </div>
          )}
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
              {resetSuccess ? 'Password Reset!' : 'Reset Password'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {resetSuccess 
                ? 'Your password has been successfully reset'
                : 'Enter the verification code and your new password'
              }
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-none border border-slate-200 dark:border-slate-700 p-8">
            {resetSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <FiCheck className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  All Done!
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Your password has been reset. You can now sign in with your new password.
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30"
                >
                  Sign In Now
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* OTP Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Verification Code
                  </label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="w-12 h-12 text-center text-xl font-semibold rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      />
                    ))}
                  </div>
                  <div className="mt-3 text-center">
                    {countdown > 0 ? (
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Resend code in {countdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendLoading}
                        className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 disabled:opacity-50"
                      >
                        {resendLoading ? 'Sending...' : 'Resend code'}
                      </button>
                    )}
                  </div>
                </div>

                {/* New Password */}
                <Input
                  label="New Password"
                  type="password"
                  icon={FiLock}
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                {/* Confirm Password */}
                <Input
                  label="Confirm Password"
                  type="password"
                  icon={FiLock}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Reset Password
                </Button>
              </form>
            )}

            {!resetSuccess && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
