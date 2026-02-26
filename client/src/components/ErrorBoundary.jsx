import { Component } from 'react'
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              {this.props.title || 'Something went wrong'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="text-left mb-6 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-auto max-h-40">
                <summary className="cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400">
                  Stack trace
                </summary>
                <pre className="mt-2 text-xs text-red-500 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <FiRefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
              >
                <FiHome className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
