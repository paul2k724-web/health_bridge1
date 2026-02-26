import { useState, useEffect } from 'react'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Badge, Skeleton, LocationPicker } from '../../components/ui'
import api from '../../store/api'
import toast from 'react-hot-toast'
import { 
  FiMapPin, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiCheck,
  FiHome,
  FiBriefcase,
  FiStar
} from 'react-icons/fi'

const Addresses = () => {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    label: 'Home',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    location: null,
  })

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/customer/addresses')
      setAddresses(response.data.data.addresses || [])
    } catch (error) {
      toast.error('Failed to load addresses')
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (locationData) => {
    setFormData(prev => ({
      ...prev,
      addressLine1: locationData.address || prev.addressLine1,
      location: {
        type: 'Point',
        coordinates: [locationData.coordinates.lon, locationData.coordinates.lat]
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.addressLine1 || !formData.city || !formData.pincode) {
      toast.error('Please fill all required fields')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await api.put(`/customer/addresses/${editingId}`, formData)
        toast.success('Address updated successfully')
      } else {
        await api.post('/customer/addresses', formData)
        toast.success('Address added successfully')
      }
      setShowForm(false)
      setEditingId(null)
      setFormData({
        label: 'Home',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        location: null,
      })
      fetchAddresses()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (address) => {
    setEditingId(address._id)
    setFormData({
      label: address.label || 'Home',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      location: address.location || null,
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return
    
    try {
      await api.delete(`/customer/addresses/${id}`)
      toast.success('Address deleted')
      fetchAddresses()
    } catch (error) {
      toast.error('Failed to delete address')
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/customer/addresses/${id}/default`)
      toast.success('Default address updated')
      fetchAddresses()
    } catch (error) {
      toast.error('Failed to set default address')
    }
  }

  const getLabelIcon = (label) => {
    switch (label?.toLowerCase()) {
      case 'home': return FiHome
      case 'work': case 'office': return FiBriefcase
      default: return FiMapPin
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {[1, 2, 3].map(i => <Skeleton.Card key={i} />)}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="My Addresses">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Addresses</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage your saved addresses for quick booking
            </p>
          </div>
          <Button
            variant="primary"
            icon={FiPlus}
            onClick={() => {
              setEditingId(null)
              setFormData({
                label: 'Home',
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                pincode: '',
                location: null,
              })
              setShowForm(true)
            }}
          >
            Add Address
          </Button>
        </div>

        {/* Address Form */}
        {showForm && (
          <Card>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Label Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Label
                </label>
                <div className="flex gap-3">
                  {['Home', 'Work', 'Other'].map(label => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, label }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.label === label
                          ? 'bg-teal-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                  placeholder="House/Flat No., Building, Street"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                  placeholder="Landmark, Area"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* City, State, Pincode */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                    placeholder="Pincode"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Location Picker */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Location (Optional)
                </label>
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  height="250px"
                  showAddressSearch={true}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                >
                  {editingId ? 'Update Address' : 'Save Address'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Address List */}
        {addresses.length === 0 && !showForm ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <FiMapPin className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              No addresses saved
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Add your first address for quick booking
            </p>
            <Button variant="primary" icon={FiPlus} onClick={() => setShowForm(true)}>
              Add Address
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => {
              const LabelIcon = getLabelIcon(address.label)
              return (
                <Card key={address._id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                        <LabelIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800 dark:text-white">
                            {address.label}
                          </h3>
                          {address.isDefault && (
                            <Badge variant="primary" size="sm">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {address.addressLine1}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                          {address.city}, {address.state} {address.pincode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefault(address._id)}
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-teal-500 transition-colors"
                          title="Set as default"
                        >
                          <FiStar className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(address)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-teal-500 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(address._id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Addresses
