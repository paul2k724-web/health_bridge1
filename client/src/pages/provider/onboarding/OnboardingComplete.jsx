import { useNavigate } from 'react-router-dom'
import { FiCheck, FiActivity, FiClock, FiMail } from 'react-icons/fi'
import { Button } from '../../../components/ui'

const OnboardingComplete = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <FiCheck className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
            Application Submitted!
          </h1>

          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Thank you for completing your provider profile. Our team will review your application 
            and get back to you within 24-48 hours.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <FiClock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-800 dark:text-white">Review Time</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Usually 24-48 hours</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <FiMail className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-800 dark:text-white">Email Notification</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">You'll be notified once approved</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>While you wait:</strong> Make sure your documents are clear and all information 
              is accurate. You can contact support if you have any questions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/')}
              className="flex-1"
            >
              Go to Home
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/login')}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30"
            >
              Check Status Later
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400 dark:text-slate-500">
          <FiActivity className="w-4 h-4" />
          <span>HealthBridge Provider Network</span>
        </div>
      </div>
    </div>
  )
}

export default OnboardingComplete
