import { useState, useEffect } from 'react'
import api from '../../store/api'
import Layout from '../../components/PublicLayout'
import toast from 'react-hot-toast'

const ServiceManagement = () => {
  const [services, setServices] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    duration: '',
    discount: { percentage: 0 },
    isActive: true,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await api.get('/services')
      setServices(response.data.data.services)
    } catch (error) {
      toast.error('Failed to fetch services')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingService) {
        await api.put(`/admin/services/${editingService._id}`, formData)
        toast.success('Service updated successfully')
      } else {
        await api.post('/admin/services', formData)
        toast.success('Service created successfully')
      }
      setShowForm(false)
      setEditingService(null)
      setFormData({
        name: '',
        description: '',
        basePrice: '',
        duration: '',
        discount: { percentage: 0 },
        isActive: true,
      })
      fetchServices()
    } catch (error) {
      toast.error('Failed to save service')
    }
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      basePrice: service.basePrice,
      duration: service.duration,
      discount: service.discount || { percentage: 0 },
      isActive: service.isActive,
    })
    setShowForm(true)
  }

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return

    try {
      await api.delete(`/admin/services/${serviceId}`)
      toast.success('Service deleted successfully')
      fetchServices()
    } catch (error) {
      toast.error('Failed to delete service')
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Service Management</h1>
            <button
              onClick={() => {
                setShowForm(!showForm)
                setEditingService(null)
                setFormData({
                  name: '',
                  description: '',
                  basePrice: '',
                  duration: '',
                  discount: { percentage: 0 },
                  isActive: true,
                })
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              {showForm ? 'Cancel' : 'Add New Service'}
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    value={formData.discount.percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount: { percentage: parseInt(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Active</label>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {service.description.substring(0, 50)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{service.basePrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.duration} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 py-1 rounded ${
                          service.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(service._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ServiceManagement
