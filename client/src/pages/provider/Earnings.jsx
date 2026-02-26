import { useState, useEffect } from 'react'
import api from '../../store/api'
import Layout from '../../components/PublicLayout'
import { FiDollarSign, FiTrendingUp } from 'react-icons/fi'

const ProviderEarnings = () => {
  const [earnings, setEarnings] = useState({
    total: 0,
    pending: 0,
    paid: 0,
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEarnings()
  }, [])

  const fetchEarnings = async () => {
    try {
      const response = await api.get('/provider/earnings')
      setEarnings(response.data.data.earnings)
      setRecentBookings(response.data.data.recentBookings || [])
    } catch (error) {
      console.error('Failed to fetch earnings:', error)
    } finally {
      setLoading(false)
    }
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">My Earnings</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-primary-600">₹{earnings.total}</p>
                </div>
                <FiDollarSign className="text-4xl text-primary-300" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">₹{earnings.pending}</p>
                </div>
                <FiTrendingUp className="text-4xl text-yellow-300" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mb-1">Paid</p>
                  <p className="text-3xl font-bold text-green-600">₹{earnings.paid}</p>
                </div>
                <FiDollarSign className="text-4xl text-green-300" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Completed Jobs</h2>
            <div className="space-y-4">
              {recentBookings.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No completed jobs yet</p>
              ) : (
                recentBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="border rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-semibold">{booking.service?.name}</h3>
                      <p className="text-sm text-gray-600">
                        Customer: {booking.customer?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary-600">
                        ₹{booking.amount?.finalAmount}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ProviderEarnings
