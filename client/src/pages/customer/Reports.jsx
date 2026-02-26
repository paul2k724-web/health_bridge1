import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../store/api'
import Layout from '../../components/PublicLayout'
import toast from 'react-hot-toast'

const Reports = () => {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
    } else {
      fetchAllBookings()
    }
  }, [bookingId])

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}`)
      setBooking(response.data.data.booking)
    } catch (error) {
      toast.error('Failed to fetch booking')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllBookings = async () => {
    try {
      const response = await api.get('/customer/bookings')
      setBooking({ bookings: response.data.data })
    } catch (error) {
      toast.error('Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = (reportUrl) => {
    window.open(reportUrl, '_blank')
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  const reports = bookingId
    ? booking?.reports || []
    : booking?.bookings?.flatMap((b) => b.reports || []) || []

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Reports</h1>

          {reports.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600">No reports available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold mb-2">Report #{index + 1}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Uploaded: {new Date(report.uploadedAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => downloadReport(report.url)}
                    className="w-full bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Download Report
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Reports
