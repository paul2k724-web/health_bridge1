import { useState, useEffect } from 'react'
import api from '../../store/api'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Badge, Modal, Skeleton, Select } from '../../components/ui'
import { StatusBadge, EmptyState } from '../../components/shared'
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiAward, 
  FiClock, 
  FiFileText, 
  FiCheck, 
  FiX,
  FiExternalLink,
  FiUserCheck
} from 'react-icons/fi'
import toast from 'react-hot-toast'

const ProviderApproval = () => {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchProviders()
  }, [filter])

  const fetchProviders = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const response = await api.get('/provider/admin', { params })
      setProviders(response.data.data?.providers || [])
    } catch (error) {
      toast.error('Failed to fetch providers')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveReject = async (providerId, action, reason = '') => {
    setActionLoading(true)
    try {
      await api.patch(`/provider/admin/${providerId}/approve-reject`, {
        action,
        rejectionReason: reason,
      })
      toast.success(`Provider ${action}d successfully`)
      fetchProviders()
      setShowModal(false)
      setSelectedProvider(null)
      setRejectionReason('')
    } catch (error) {
      toast.error(`Failed to ${action} provider`)
    } finally {
      setActionLoading(false)
    }
  }

  const filterOptions = [
    { value: 'pending', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All Providers' },
  ]

  const statusCounts = {
    pending: providers.filter(p => p.approvalStatus === 'pending').length,
    approved: providers.filter(p => p.approvalStatus === 'approved').length,
    rejected: providers.filter(p => p.approvalStatus === 'rejected').length,
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
            <h1 className="text-page-title text-primary-900">Provider Approval</h1>
            <p className="text-primary-500 mt-1">Review and manage provider applications</p>
          </div>
          <div className="w-48">
            <Select
              options={filterOptions}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => setFilter('pending')}
            className={`p-4 rounded-lg border transition-all text-left ${
              filter === 'pending'
                ? 'bg-warning-light border-warning text-warning-dark'
                : 'bg-white border-primary-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{statusCounts.pending}</p>
                <p className="text-sm opacity-80">Pending</p>
              </div>
              <FiUserCheck className="w-8 h-8 opacity-50" />
            </div>
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`p-4 rounded-lg border transition-all text-left ${
              filter === 'approved'
                ? 'bg-success-light border-success text-success-dark'
                : 'bg-white border-primary-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{statusCounts.approved}</p>
                <p className="text-sm opacity-80">Approved</p>
              </div>
              <FiCheck className="w-8 h-8 opacity-50" />
            </div>
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`p-4 rounded-lg border transition-all text-left ${
              filter === 'rejected'
                ? 'bg-error-light border-error text-error-dark'
                : 'bg-white border-primary-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{statusCounts.rejected}</p>
                <p className="text-sm opacity-80">Rejected</p>
              </div>
              <FiX className="w-8 h-8 opacity-50" />
            </div>
          </button>
          <div className="p-4 rounded-lg bg-primary-50 border border-primary-200 text-left">
            <p className="text-2xl font-bold text-primary-900">{providers.length}</p>
            <p className="text-sm text-primary-500">Total</p>
          </div>
        </div>

        {providers.length === 0 ? (
          <Card>
            <EmptyState
              icon={FiUserCheck}
              title="No providers found"
              description={
                filter === 'pending'
                  ? "There are no pending provider applications to review"
                  : `No ${filter} providers`
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => (
              <Card key={provider._id} padding="none">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-semibold text-primary-700">
                          {provider.user?.name?.charAt(0).toUpperCase() || 'P'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-primary-900">{provider.user?.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-primary-500">
                          <span className="flex items-center gap-1">
                            <FiMail className="w-4 h-4" />
                            {provider.user?.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiPhone className="w-4 h-4" />
                            {provider.user?.phone || 'N/A'}
                          </span>
                        </div>
                        <StatusBadge status={provider.approvalStatus} className="mt-2" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-primary-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-primary-500 text-sm mb-1">
                        <FiAward className="w-4 h-4" />
                        Specialization
                      </div>
                      <p className="font-medium text-primary-900">{provider.specialization || 'N/A'}</p>
                    </div>
                    <div className="bg-primary-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-primary-500 text-sm mb-1">
                        <FiClock className="w-4 h-4" />
                        Experience
                      </div>
                      <p className="font-medium text-primary-900">{provider.experience || 0} years</p>
                    </div>
                    <div className="bg-primary-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-primary-500 text-sm mb-1">
                        <FiFileText className="w-4 h-4" />
                        License Number
                      </div>
                      <p className="font-medium text-primary-900">{provider.licenseNumber || 'N/A'}</p>
                    </div>
                    <div className="bg-primary-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-primary-500 text-sm mb-1">
                        <FiUser className="w-4 h-4" />
                        Applied On
                      </div>
                      <p className="font-medium text-primary-900">
                        {new Date(provider.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {provider.bio && (
                    <div className="mb-6">
                      <p className="text-sm font-medium text-primary-600 mb-2">Professional Bio</p>
                      <p className="text-primary-700 bg-primary-50 rounded-lg p-4">{provider.bio}</p>
                    </div>
                  )}

                  {provider.licenseDocument && (
                    <div className="mb-6">
                      <p className="text-sm font-medium text-primary-600 mb-2">License Document</p>
                      <a
                        href={provider.licenseDocument.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                      >
                        <FiExternalLink className="w-4 h-4" />
                        View Document
                      </a>
                    </div>
                  )}

                  {provider.rejectionReason && (
                    <div className="mb-6 p-4 bg-error-light rounded-lg">
                      <p className="text-sm font-medium text-error-dark mb-1">Rejection Reason</p>
                      <p className="text-error-dark">{provider.rejectionReason}</p>
                    </div>
                  )}

                  {provider.approvalStatus === 'pending' && (
                    <div className="flex items-center gap-3 pt-4 border-t border-primary-100">
                      <Button
                        variant="success"
                        onClick={() => handleApproveReject(provider._id, 'approve')}
                        icon={FiCheck}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          setSelectedProvider(provider)
                          setShowModal(true)
                        }}
                        icon={FiX}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedProvider(null)
          setRejectionReason('')
        }}
        title="Reject Provider Application"
        description={`Please provide a reason for rejecting ${selectedProvider?.user?.name}'s application.`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Rejection Reason
            </label>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
              className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setSelectedProvider(null)
                setRejectionReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={actionLoading}
              disabled={!rejectionReason.trim()}
              onClick={() => handleApproveReject(selectedProvider?._id, 'reject', rejectionReason)}
            >
              Reject Application
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

export default ProviderApproval
