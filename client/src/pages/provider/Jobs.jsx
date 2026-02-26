import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Select, Skeleton, JobMap } from '../../components/ui'
import { StatusBadge, EmptyState } from '../../components/shared'
import { FiCalendar, FiClock, FiMapPin, FiNavigation, FiUser, FiPhone, FiCheck, FiPlay, FiMap, FiList } from 'react-icons/fi'
import toast from 'react-hot-toast'

const ProviderJobs = () => {
  const [jobs, setJobs] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list')

  useEffect(() => {
    fetchJobs()
  }, [filter])

  const fetchJobs = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const response = await api.get('/provider/jobs', { params })
      setJobs(response.data.data)
    } catch (error) {
      toast.error('Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (jobId, status) => {
    try {
      await api.patch(`/provider/jobs/${jobId}/status`, { status })
      toast.success('Status updated successfully')
      fetchJobs()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const acceptReject = async (jobId, action) => {
    try {
      await api.patch(`/provider/jobs/${jobId}/accept-reject`, { action })
      toast.success(`Job ${action}ed successfully`)
      fetchJobs()
    } catch (error) {
      toast.error(`Failed to ${action} job`)
    }
  }

  const getGoogleMapsUrl = (address) => {
    if (address?.coordinates) {
      return `https://www.google.com/maps/dir/?api=1&destination=${address.coordinates.latitude},${address.coordinates.longitude}`
    }
    return '#'
  }

  const filterOptions = [
    { value: 'all', label: 'All Jobs' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'provider_arriving', label: 'Arriving' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ]

  const statusCounts = {
    all: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    accepted: jobs.filter(j => j.status === 'accepted').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton variant="card" className="h-16" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton.Card key={i} />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title text-primary-900">My Jobs</h1>
            <p className="text-primary-500 mt-1">Manage your assigned tasks</p>
          </div>
          <div className="w-48">
            <Select
              options={filterOptions}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'accepted', label: 'Accepted' },
            { key: 'in_progress', label: 'Active' },
            { key: 'completed', label: 'Done' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`p-4 rounded-lg border transition-all ${
                filter === tab.key
                  ? 'bg-primary-900 text-white border-primary-900'
                  : 'bg-white text-primary-700 border-primary-200 hover:border-primary-300'
              }`}
            >
              <p className="text-2xl font-bold">{statusCounts[tab.key] || 0}</p>
              <p className="text-sm opacity-80">{tab.label}</p>
            </button>
          ))}
        </div>

        {jobs.length === 0 ? (
          <Card>
            <EmptyState
              icon={FiCalendar}
              title="No jobs found"
              description={
                filter === 'all'
                  ? "You don't have any jobs assigned yet"
                  : `No ${filter.replace('_', ' ')} jobs`
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <div className="flex items-center rounded-lg overflow-hidden border border-primary-200">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-900 text-white' : 'bg-white text-primary-600'}`}
                >
                  <FiList className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 ${viewMode === 'map' ? 'bg-primary-900 text-white' : 'bg-white text-primary-600'}`}
                >
                  <FiMap className="w-5 h-5" />
                </button>
              </div>
            </div>

            {viewMode === 'map' && (
              <JobMap
                jobs={jobs}
                height="400px"
              />
            )}

            {viewMode === 'list' && jobs.map((job) => (
              <Card key={job._id} padding="none">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                        <FiUser className="w-6 h-6 text-accent-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-primary-900">{job.service?.name}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-primary-500">
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-4 h-4" />
                            {new Date(job.scheduledDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiClock className="w-4 h-4" />
                            {job.scheduledTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={job.status} />
                      <p className="text-2xl font-bold text-primary-900 mt-2">
                        ₹{job.amount?.finalAmount}
                      </p>
                    </div>
                  </div>

                  <div className="bg-primary-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FiUser className="w-4 h-4 text-primary-400" />
                          <span className="font-medium text-primary-900">{job.customer?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-primary-600">
                          <FiPhone className="w-4 h-4 text-primary-400" />
                          <span>{job.customer?.phone || 'N/A'}</span>
                        </div>
                      </div>
                      {job.address && (
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <FiMapPin className="w-4 h-4 text-primary-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-primary-700">
                                {job.address.addressLine1}
                              </p>
                              <p className="text-sm text-primary-500">
                                {job.address.city}, {job.address.state} - {job.address.pincode}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-primary-100">
                    <div className="flex items-center gap-2">
                      {job.address?.coordinates && (
                        <a
                          href={getGoogleMapsUrl(job.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm" icon={FiNavigation}>
                            Navigate
                          </Button>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {job.status === 'pending' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => acceptReject(job._id, 'accept')}
                            icon={FiCheck}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acceptReject(job._id, 'reject')}
                            className="text-error border-error hover:bg-error-light"
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {job.status === 'accepted' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => updateStatus(job._id, 'provider_arriving')}
                          icon={FiNavigation}
                        >
                          Mark as Arriving
                        </Button>
                      )}
                      {job.status === 'provider_arriving' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => updateStatus(job._id, 'in_progress')}
                          icon={FiPlay}
                        >
                          Start Service
                        </Button>
                      )}
                      {job.status === 'in_progress' && (
                        <Link to={`/provider/upload-report/${job._id}`}>
                          <Button variant="success" size="sm">
                            Complete & Upload Report
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
</Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ProviderJobs
