import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { Button, Badge, Card } from '../../components/ui'
import api from '../../store/api'
import toast from 'react-hot-toast'
import { FiBriefcase, FiMapPin, FiClock, FiUser, FiCheck, FiX, FiDollarSign, FiCalendar, FiRefreshCw } from 'react-icons/fi'
import { format } from 'date-fns'

const AvailableJobs = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)
  const [view, setView] = useState('list')
  const navigate = useNavigate()

  useEffect(() => {
    fetchAvailableJobs()
    const interval = setInterval(fetchAvailableJobs, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAvailableJobs = async () => {
    try {
      const response = await api.get('/provider/jobs/available')
      setJobs(response.data.jobs || [])
    } catch (error) {
      console.error('Error fetching available jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptJob = async (jobId) => {
    setAccepting(jobId)
    try {
      await api.patch(`/provider/jobs/${jobId}/accept-reject`, { action: 'accept' })
      toast.success('Job accepted successfully!')
      setJobs(jobs.filter(j => j._id !== jobId))
      navigate('/provider/jobs')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept job')
    } finally {
      setAccepting(null)
    }
  }

  const handleRejectJob = async (jobId) => {
    try {
      await api.patch(`/provider/jobs/${jobId}/accept-reject`, { action: 'reject' })
      toast.success('Job rejected')
      setJobs(jobs.filter(j => j._id !== jobId))
    } catch (error) {
      toast.error('Failed to reject job')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    }
    return colors[status] || 'bg-slate-100 text-slate-700'
  }

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'dd MMM yyyy')
    } catch {
      return date
    }
  }

  const formatTime = (time) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <DashboardLayout title="Available Jobs">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Available Jobs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Available Jobs
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''} available in your service area
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              icon={FiRefreshCw}
              onClick={fetchAvailableJobs}
            >
              Refresh
            </Button>
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  view === 'list'
                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setView('cards')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  view === 'cards'
                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <FiBriefcase className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              No jobs available
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
              There are no jobs matching your services and location right now. 
              New jobs appear here in real-time.
            </p>
            <Button variant="primary" onClick={fetchAvailableJobs}>
              Check Again
            </Button>
          </div>
        ) : view === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <Badge className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                  <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                    ₹{job.amount?.finalAmount || job.service?.basePrice}
                  </span>
                </div>

                <h3 className="font-semibold text-slate-800 dark:text-white mb-3">
                  {job.service?.name}
                </h3>

                <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
                  <div className="flex items-center gap-2">
                    <FiUser className="w-4 h-4" />
                    <span>{job.customer?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCalendar className="w-4 h-4" />
                    <span>{formatDate(job.scheduledDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4" />
                    <span>{formatTime(job.scheduledTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMapPin className="w-4 h-4" />
                    <span className="truncate">{job.address?.addressLine1}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    loading={accepting === job._id}
                    onClick={() => handleAcceptJob(job._id)}
                    icon={FiCheck}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRejectJob(job._id)}
                    icon={FiX}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {jobs.map((job) => (
                    <tr key={job._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            {job.service?.name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {job.service?.duration} min
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {job.customer?.name?.charAt(0)}
                            </span>
                          </div>
                          <span className="text-slate-800 dark:text-white">
                            {job.customer?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-slate-800 dark:text-white">
                            {formatDate(job.scheduledDate)}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {formatTime(job.scheduledTime)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <FiMapPin className="w-4 h-4" />
                          <span className="truncate max-w-xs">
                            {job.address?.addressLine1}, {job.address?.city}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-teal-600 dark:text-teal-400">
                          ₹{job.amount?.finalAmount || job.service?.basePrice}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            loading={accepting === job._id}
                            onClick={() => handleAcceptJob(job._id)}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRejectJob(job._id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AvailableJobs
