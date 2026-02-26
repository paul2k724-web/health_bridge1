import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../store/api'
import { DashboardLayout } from '../../components/layout'
import { Card, Badge, Button, Skeleton } from '../../components/ui'
import { StatsCard, EmptyState, StatusBadge } from '../../components/shared'
import { FiBriefcase, FiDollarSign, FiCheckCircle, FiClock, FiCalendar, FiMapPin, FiArrowRight, FiNavigation, FiToggleLeft, FiToggleRight, FiWifi, FiWifiOff, FiAlertTriangle } from 'react-icons/fi'
import toast from 'react-hot-toast'

const ProviderDashboard = () => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    pendingJobs: 0,
    completedJobs: 0,
    earnings: { total: 0, pending: 0, paid: 0 },
  })
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const [toggling, setToggling] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [profileRes, jobsRes, earningsRes] = await Promise.all([
        api.get('/provider/profile').catch(() => null),
        api.get('/provider/jobs'),
        api.get('/provider/earnings'),
      ])

      if (profileRes?.data?.data) {
        setProfile(profileRes.data.data)
        setIsAvailable(profileRes.data.data.isAvailable || false)
        
        if (profileRes.data.data.status === 'pending') {
          navigate('/provider/onboarding')
          return
        }
      }

      const allJobs = jobsRes.data.data || []
      setJobs(allJobs.slice(0, 5))
      setStats({
        totalJobs: allJobs.length,
        pendingJobs: allJobs.filter((j) => j.status === 'pending' || j.status === 'confirmed').length,
        completedJobs: allJobs.filter((j) => j.status === 'completed').length,
        earnings: earningsRes.data?.data?.earnings || { total: 0, pending: 0, paid: 0 },
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAvailability = async () => {
    setToggling(true)
    try {
      const newState = !isAvailable
      await api.patch('/provider/availability', { isAvailable: newState })
      setIsAvailable(newState)
      toast.success(newState ? 'You are now online!' : 'You are now offline')
    } catch (error) {
      toast.error('Failed to update availability')
    } finally {
      setToggling(false)
    }
  }

  const handleJobAction = async (jobId, action) => {
    try {
      if (action === 'accept' || action === 'reject') {
        await api.patch(`/provider/jobs/${jobId}/accept-reject`, { action })
        toast.success(action === 'accept' ? 'Job accepted!' : 'Job rejected')
      }
      fetchDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update job')
    }
  }

  const handleStatusUpdate = async (jobId, status) => {
    try {
      await api.patch(`/provider/jobs/${jobId}/status`, { status })
      toast.success('Status updated!')
      fetchDashboardData()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getGoogleMapsUrl = (address) => {
    if (address?.coordinates) {
      return `https://www.google.com/maps/dir/?api=1&destination=${address.coordinates.latitude},${address.coordinates.longitude}`
    }
    if (address?.location?.coordinates) {
      return `https://www.google.com/maps/dir/?api=1&destination=${address.location.coordinates[1]},${address.location.coordinates[0]}`
    }
    return '#'
  }

  const pendingJobs = jobs.filter((j) => j.status === 'pending' || j.status === 'confirmed')
  const todayJobs = jobs.filter((j) => {
    const today = new Date().toDateString()
    return new Date(j.scheduledDate).toDateString() === today
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton.Card key={i} />
            ))}
          </div>
          <Skeleton variant="card" className="h-64" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8 animate-fade-up">
        {/* Header with Availability Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Provider Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your appointments and track earnings</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/provider/available">
              <Button variant="secondary" icon={FiBriefcase}>
                Browse Jobs
              </Button>
            </Link>
            
            <button
              onClick={handleToggleAvailability}
              disabled={toggling}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl font-medium transition-all ${
                isAvailable
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {toggling ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isAvailable ? (
                <FiToggleRight className="w-5 h-5" />
              ) : (
                <FiToggleLeft className="w-5 h-5" />
              )}
              <span className="flex items-center gap-2">
                {isAvailable ? (
                  <>
                    <FiWifi className="w-4 h-4" />
                    Online
                  </>
                ) : (
                  <>
                    <FiWifiOff className="w-4 h-4" />
                    Offline
                  </>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Availability Banner */}
        {!isAvailable && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-4">
            <FiAlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-amber-800 dark:text-amber-300">
                You're currently offline
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Go online to receive new job requests from customers in your area.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleToggleAvailability}
              loading={toggling}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Go Online
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Jobs"
            value={stats.totalJobs}
            icon={FiBriefcase}
            description="All time"
          />
          <StatsCard
            title="Pending"
            value={stats.pendingJobs}
            icon={FiClock}
            description="Awaiting action"
          />
          <StatsCard
            title="Completed"
            value={stats.completedJobs}
            icon={FiCheckCircle}
            description="Successfully completed"
          />
          <StatsCard
            title="Total Earnings"
            value={`₹${stats.earnings.total?.toLocaleString() || 0}`}
            icon={FiDollarSign}
            description="Lifetime earnings"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2" padding="none">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Earnings Overview</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Earned</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    ₹{stats.earnings.total?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    ₹{stats.earnings.pending?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Paid</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{stats.earnings.paid?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Payment Progress</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {stats.earnings.total > 0 
                      ? Math.round((stats.earnings.paid / stats.earnings.total) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${stats.earnings.total > 0 
                        ? Math.round((stats.earnings.paid / stats.earnings.total) * 100) 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card padding="none">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Today's Schedule</h2>
            </div>
            <div className="p-4">
              {todayJobs.length === 0 ? (
                <div className="text-center py-8">
                  <FiCalendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">No appointments today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayJobs.map((job) => (
                    <div key={job._id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-800 dark:text-white text-sm">
                          {job.service?.name}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{job.scheduledTime}</span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{job.customer?.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {pendingJobs.length > 0 && (
          <Card padding="none">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Pending Actions</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Jobs waiting for your response</p>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {pendingJobs.map((job) => (
                <div key={job._id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <FiClock className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800 dark:text-white">{job.service?.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customer: {job.customer?.name}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-4 h-4" />
                            {new Date(job.scheduledDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiClock className="w-4 h-4" />
                            {job.scheduledTime}
                          </span>
                        </div>
                        {job.address && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                            <FiMapPin className="w-4 h-4" />
                            {job.address.addressLine1}, {job.address.city}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleJobAction(job._id, 'accept')}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleJobAction(job._id, 'reject')}
                        className="text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Jobs</h2>
            <Link to="/provider/jobs" className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1">
              View all <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {jobs.length === 0 ? (
            <EmptyState
              icon={FiBriefcase}
              title="No jobs yet"
              description="Jobs will appear here when customers book your services"
              action={
                <Button variant="primary" onClick={() => navigate('/provider/available')}>
                  Browse Available Jobs
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {jobs.map((job) => (
                <div key={job._id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <FiBriefcase className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800 dark:text-white">{job.service?.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customer: {job.customer?.name}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-4 h-4" />
                            {new Date(job.scheduledDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiClock className="w-4 h-4" />
                            {job.scheduledTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-3">
                      <StatusBadge status={job.status} />
                      <p className="text-lg font-semibold text-slate-800 dark:text-white">
                        ₹{job.amount?.finalAmount}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 ml-14">
                    {job.status === 'accepted' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStatusUpdate(job._id, 'provider_arriving')}
                      >
                        Mark Arriving
                      </Button>
                    )}
                    {job.status === 'provider_arriving' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStatusUpdate(job._id, 'in_progress')}
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
                    {(job.address?.coordinates || job.address?.location?.coordinates) && (
                      <a
                        href={getGoogleMapsUrl(job.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm" icon={FiNavigation}>
                          Navigate
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default ProviderDashboard
