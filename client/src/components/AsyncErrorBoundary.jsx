import { Component } from 'react'
import { FiWifi, FiServer, FiAlertCircle, FiRefreshCw, FiHome } from 'react-icons/fi'

class AsyncErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Async error caught:', error, errorInfo)
  }

  getErrorType() {
    const message = this.state.error?.message?.toLowerCase() || ''
    
    if (message.includes('network') || message.includes('fetch') || message.includes('internet')) {
      return 'network'
    }
    if (message.includes('500') || message.includes('server')) {
      return 'server'
    }
    return 'general'
  }

  getErrorContent() {
    const type = this.getErrorType()
    
    switch (type) {
      case 'network':
        return {
          icon: <FiWifi className="w-8 h-8" />,
          title: 'Connection Error',
          message: 'Please check your internet connection and try again.',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          iconColor: 'text-yellow-500',
        }
      case 'server':
        return {
          icon: <FiServer className="w-8 h-8" />,
          title: 'Server Error',
          message: 'Our servers are having issues. Please try again later.',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-500',
        }
      default:
        return {
          icon: <FiAlertCircle className="w-8 h-8" />,
          title: 'Something went wrong',
          message: this.state.error?.message || 'An unexpected error occurred.',
          bgColor: 'bg-slate-100 dark:bg-slate-700',
          iconColor: 'text-slate-500',
        }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  render() {
    if (this.state.hasError) {
      const content = this.getErrorContent()

      return (
        <div className="flex items-center justify-center p-8 min-h-[400px]">
          <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center">
            <div className={`w-14 h-14 ${content.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <span className={content.iconColor}>{content.icon}</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              {content.title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {content.message}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
              >
                <FiHome className="w-3.5 h-3.5" />
                Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AsyncErrorBoundary
