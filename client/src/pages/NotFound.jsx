import { Link } from 'react-router-dom'
import { FiHome, FiArrowLeft, FiSearch } from 'react-icons/fi'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full text-center">
        <div className="relative mb-8">
          <div className="text-[150px] font-bold text-slate-100 dark:text-slate-800 leading-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
              <FiSearch className="w-12 h-12 text-teal-500" />
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Page Not Found
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Sorry, we couldn't find the page you're looking for. 
          It might have been moved or doesn't exist.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            <FiHome className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Need help?{' '}
            <a 
              href="https://t.me/abrahampaulsanhith" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-teal-500 hover:text-teal-600"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFound
