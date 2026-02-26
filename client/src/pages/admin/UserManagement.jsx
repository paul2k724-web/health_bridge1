import { useState, useEffect } from 'react'
import api from '../../store/api'
import { DashboardLayout } from '../../components/layout'
import { Card, Button, Badge, Select, Skeleton, Modal } from '../../components/ui'
import { StatusBadge } from '../../components/shared'
import { FiSearch, FiMoreVertical, FiUserX, FiUserCheck, FiMail, FiPhone } from 'react-icons/fi'
import toast from 'react-hot-toast'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchUsers()
  }, [filter])

  const fetchUsers = async () => {
    try {
      const params = filter !== 'all' ? { role: filter } : {}
      const response = await api.get('/admin/users', { params })
      setUsers(response.data.data.users)
    } catch (error) {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleBlockUnblock = async (userId, isBlocked) => {
    try {
      await api.patch(`/admin/users/${userId}/block`, { isBlocked: !isBlocked })
      toast.success(`User ${isBlocked ? 'unblocked' : 'blocked'} successfully`)
      fetchUsers()
      setShowModal(false)
      setSelectedUser(null)
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true
    return (
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery)
    )
  })

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  const roleOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'customer', label: 'Customers' },
    { value: 'provider', label: 'Providers' },
  ]

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'primary'
      case 'provider':
        return 'info'
      case 'customer':
        return 'neutral'
      default:
        return 'neutral'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton variant="card" className="h-16" />
          <Skeleton.Table rows={10} cols={6} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title text-primary-900">User Management</h1>
            <p className="text-primary-500 mt-1">Manage all platform users</p>
          </div>
          <div className="text-sm text-primary-500">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </div>
        </div>

        <Card padding="none">
          <div className="p-4 border-b border-primary-100 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={roleOptions}
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-primary-100">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-primary-600 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-primary-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-primary-100">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-primary-500">
                      {searchQuery ? 'No users match your search' : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-primary-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary-700">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-primary-900">{user.name || 'N/A'}</p>
                            <p className="text-sm text-primary-500">ID: {user._id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-primary-600">
                            <FiMail className="w-4 h-4 text-primary-400" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-primary-600">
                            <FiPhone className="w-4 h-4 text-primary-400" />
                            {user.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={user.isBlocked ? 'blocked' : 'active'} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-500">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant={user.isBlocked ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowModal(true)
                            }}
                            icon={user.isBlocked ? FiUserCheck : FiUserX}
                          >
                            {user.isBlocked ? 'Unblock' : 'Block'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-primary-50 border-t border-primary-100">
              <p className="text-sm text-primary-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-primary-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page
                    if (totalPages <= 5) {
                      page = i + 1
                    } else if (currentPage <= 3) {
                      page = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i
                    } else {
                      page = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 text-sm font-medium rounded-md transition-colors ${
                          currentPage === page
                            ? 'bg-primary-900 text-white'
                            : 'hover:bg-white border border-primary-200'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-primary-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedUser(null)
        }}
        title={selectedUser?.isBlocked ? 'Unblock User' : 'Block User'}
        description={
          selectedUser?.isBlocked
            ? `Are you sure you want to unblock ${selectedUser?.name}? They will be able to access the platform again.`
            : `Are you sure you want to block ${selectedUser?.name}? They will not be able to access the platform.`
        }
        size="sm"
      >
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setShowModal(false)
              setSelectedUser(null)
            }}
          >
            Cancel
          </Button>
          <Button
            variant={selectedUser?.isBlocked ? 'primary' : 'danger'}
            onClick={() => handleBlockUnblock(selectedUser?._id, selectedUser?.isBlocked)}
          >
            {selectedUser?.isBlocked ? 'Unblock User' : 'Block User'}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

export default UserManagement
