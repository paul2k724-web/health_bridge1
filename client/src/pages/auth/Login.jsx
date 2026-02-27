import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { FiMail, FiLock, FiActivity, FiArrowRight, FiSun, FiMoon } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { login, getMe } from '../../store/slices/authSlice'
import api from '../../store/api'
import { Button, Input } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import toast from 'react-hot-toast'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [googleLoading, setGoogleLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((state) => state.auth)
  const { isDark, toggleTheme } = useTheme()

  const handleGoogleLogin = async () => {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      toast.error('Google login is not configured')
      return
    }
    
    setGoogleLoading(true)
    try {
      const google = window.google
      if (!google) {
        toast.error('Google login not available. Please refresh the page.')
        setGoogleLoading(false)
        return
      }

      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          console.log('Google response:', response)
          console.log('Credential:', response?.credential ? 'present' : 'missing')
          try {
            const res = await api.post('/auth/google', { 
              idToken: response.credential,
              role: 'customer'
            })
            
            console.log('API response status:', res.status)
            console.log('API response data:', res.data)
            
            if (res.data.success && res.data.data.token) {
              localStorage.setItem('token', res.data.data.token)
              const user = res.data.data.user
              toast.success('Google login successful!')
              
              if (user.role === 'customer') {
                navigate('/customer/dashboard')
              } else if (user.role === 'provider') {
                navigate('/provider/dashboard')
              } else if (user.role === 'admin') {
                navigate('/admin/dashboard')
              } else {
                navigate('/')
              }
            } else {
              toast.error(res.data.message || 'Google login failed')
            }
          } catch (error) {
            console.error('Google login error:', error)
            toast.error(error?.response?.data?.message || error?.message || 'Google login failed')
          }
          setGoogleLoading(false)
        },
      })
      
      google.accounts.id.prompt()
    } catch (error) {
      toast.error('Google login failed')
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const result = await dispatch(login(formData)).unwrap()
      
      if (result.requiresOTP) {
        toast.success('Please verify your OTP to continue')
        navigate('/verify-otp', { 
          state: { 
            userId: result.userId,
            email: formData.email
          } 
        })
        return
      }
      
      const user = await dispatch(getMe()).unwrap()
      toast.success('Login successful!')
      if (user.role === 'customer') {
        navigate('/customer/dashboard')
      } else if (user.role === 'provider') {
        navigate('/provider/dashboard')
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/')
      }
    } catch (error) {
      toast.error(error || 'Login failed')
    }
  }

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
            Enterprise Healthcare<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Management Platform</span>
          </h1>
          
          <p className="text-lg text-slate-300 mb-12 max-w-md">
            Streamline your healthcare operations with our comprehensive, 
            secure, and reliable booking and management system.
          </p>
          
          <div className="space-y-4">
            {[
              'HIPAA Compliant & Secure',
              'Trusted by 500+ Healthcare Providers',
              '24/7 Enterprise Support'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-16 flex items-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-sm text-slate-400">Providers</div>
            </div>
            <div className="w-px h-12 bg-slate-600" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-sm text-slate-400">Patients</div>
            </div>
            <div className="w-px h-12 bg-slate-600" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-sm text-slate-400">Uptime</div>
            </div>
          </div>
        </div>
      </div>

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
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <FiActivity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white">HealthBridge</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Welcome back
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Sign in to access your dashboard
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-none border border-slate-200 dark:border-slate-700 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
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
                label="Password"
                type="password"
                icon={FiLock}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-teal-500 focus:ring-teal-500 dark:bg-slate-700"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30"
                icon={FiArrowRight}
                iconPosition="right"
              >
                Sign In
              </Button>
            </form>

            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  <FcGoogle className="w-5 h-5" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {googleLoading ? 'Signing in...' : 'Continue with Google'}
                  </span>
                </button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-400 dark:text-slate-500">
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">Contact Support</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
