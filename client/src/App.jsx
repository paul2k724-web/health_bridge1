import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'

import Home from './pages/customer/Home'
import Services from './pages/customer/Services'
import BookingPage from './pages/customer/BookingPage'
import PaymentPage from './pages/customer/PaymentPage'
import CustomerDashboard from './pages/customer/Dashboard'
import CustomerBookings from './pages/customer/Bookings'
import CustomerReports from './pages/customer/Reports'
import CustomerAddresses from './pages/customer/Addresses'
import BookingDetails from './pages/customer/BookingDetails'
import ProvidersList from './pages/customer/ProvidersList'
import CustomerNotifications from './pages/customer/Notifications'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import OTPVerification from './pages/auth/OTPVerification'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

import ProviderDashboard from './pages/provider/Dashboard'
import ProviderJobs from './pages/provider/Jobs'
import ProviderEarnings from './pages/provider/Earnings'
import UploadReport from './pages/provider/UploadReport'
import AvailableJobs from './pages/provider/AvailableJobs'
import { ProviderOnboarding } from './pages/provider/onboarding'

import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import ProviderApproval from './pages/admin/ProviderApproval'
import ServiceManagement from './pages/admin/ServiceManagement'
import AdminReports from './pages/admin/Reports'
import NotFound from './pages/NotFound'

function App() {
  const { token, user } = useSelector(state => state.auth)

  // Login already returns user data, no need to call getMe()
  // Token is stored in localStorage by login action

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<OTPVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/" element={<Home />} />
      <Route path="/services" element={<Services />} />
      <Route
        path="/services/:serviceId/providers"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['customer']}>
              <ProvidersList />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking/:serviceId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['customer']}>
              <BookingPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/:bookingId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['customer']}>
              <PaymentPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/bookings"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['customer']}>
              <CustomerBookings />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/reports"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['customer']}>
              <CustomerReports />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/addresses"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['customer']}>
              <CustomerAddresses />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/bookings/:bookingId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['customer']}>
              <BookingDetails />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <CustomerNotifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/onboarding"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['provider']}>
              <ProviderOnboarding />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['provider']}>
              <ProviderDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/available"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['provider']}>
              <AvailableJobs />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/jobs"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['provider']}>
              <ProviderJobs />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/earnings"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['provider']}>
              <ProviderEarnings />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/upload-report/:bookingId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['provider']}>
              <UploadReport />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <UserManagement />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/providers"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <ProviderApproval />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/services"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <ServiceManagement />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminReports />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
