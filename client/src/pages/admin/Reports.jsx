import { useState, useEffect } from 'react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Badge } from '../../components/ui'
import api from '../../store/api'
import toast from 'react-hot-toast'
import { 
  FiDownload, 
  FiCalendar, 
  FiFilter, 
  FiFileText, 
  FiGrid, 
  FiUsers,
  FiRefreshCw
} from 'react-icons/fi'

const AdminReports = () => {
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(null)

  useEffect(() => {
    fetchBookings()
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats')
      setStats(response.data.data?.stats || {})
    } catch (error) {
      console.error('Failed to fetch stats')
    }
  }

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (statusFilter) params.status = statusFilter
      const response = await api.get('/admin/bookings/export', { params })
      setBookings(response.data.data?.bookings || [])
    } catch (error) {
      toast.error('Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const params = { format }
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (statusFilter) params.status = statusFilter

      const response = await api.get('/admin/bookings/export', {
        params,
        responseType: 'blob',
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const extension = format === 'excel' ? 'xlsx' : format
      link.setAttribute('download', `bookings-report-${Date.now()}.${extension}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Export successful')
    } catch (error) {
      toast.error('Export failed')
    } finally {
      setExporting(null)
    }
  }

  const handleExportUsers = async () => {
    setExporting('users')
    try {
      const response = await api.get('/admin/users/export', {
        responseType: 'blob',
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `users-${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Users exported successfully')
    } catch (error) {
      toast.error('Failed to export users')
    } finally {
      setExporting(null)
    }
  }

  const handleExportProviders = async () => {
    setExporting('providers')
    try {
      const response = await api.get('/admin/providers/export', {
        responseType: 'blob',
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `providers-${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Providers exported successfully')
    } catch (error) {
      toast.error('Failed to export providers')
    } finally {
      setExporting(null)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green'
      case 'confirmed':
      case 'accepted':
      case 'assigned': return 'blue'
      case 'in_progress':
      case 'provider_arriving': return 'cyan'
      case 'cancelled':
      case 'rejected': return 'red'
      case 'pending': return 'yellow'
      default: return 'gray'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Reports & Analytics
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Export and analyze your data
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => { fetchBookings(); fetchStats(); }}
            icon={FiRefreshCw}
          >
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm text-slate-500 dark:text-slate-400">Total Bookings</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {stats.totalBookings || 0}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-slate-500 dark:text-slate-400">Completed</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.completedBookings || 0}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-slate-500 dark:text-slate-400">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingBookings || 0}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-slate-500 dark:text-slate-400">Revenue</div>
              <div className="text-2xl font-bold text-teal-600">
                ₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <FiFilter className="w-5 h-5" />
              Filters
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="assigned">Assigned</option>
                  <option value="accepted">Accepted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={fetchBookings}
                  icon={FiCalendar}
                >
                  Apply Filter
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Export Buttons */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <FiDownload className="w-5 h-5" />
              Export Data
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button
                variant="outline"
                className="flex flex-col items-center py-4 h-auto"
                onClick={() => handleExport('json')}
                loading={exporting === 'json'}
              >
                <FiFileText className="w-6 h-6 mb-2" />
                <span>JSON</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center py-4 h-auto border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => handleExport('pdf')}
                loading={exporting === 'pdf'}
              >
                <FiFileText className="w-6 h-6 mb-2" />
                <span>PDF</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center py-4 h-auto border-green-200 text-green-600 hover:bg-green-50"
                onClick={() => handleExport('excel')}
                loading={exporting === 'excel'}
              >
                <FiGrid className="w-6 h-6 mb-2" />
                <span>Excel</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center py-4 h-auto border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={handleExportUsers}
                loading={exporting === 'users'}
              >
                <FiUsers className="w-6 h-6 mb-2" />
                <span>Users</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center py-4 h-auto border-purple-200 text-purple-600 hover:bg-purple-50"
                onClick={handleExportProviders}
                loading={exporting === 'providers'}
              >
                <FiUsers className="w-6 h-6 mb-2" />
                <span>Providers</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Bookings Table */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-white">
              Bookings Report
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({bookings.length} bookings)
              </span>
            </h2>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              Loading...
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No bookings found for the selected filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-white">
                        #{booking._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                        {booking.customer?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                        {booking.service?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                        {booking.provider?.name || 'Not Assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                        {new Date(booking.scheduledDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusColor(booking.status)} size="sm">
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-white">
                        ₹{booking.amount?.finalAmount?.toLocaleString('en-IN') || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default AdminReports
