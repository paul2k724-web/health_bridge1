import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { getServices } from '../../store/slices/serviceSlice'
import { useTheme } from '../../context/ThemeContext'
import { getCurrentLocation, formatDistance, calculateDistance } from '../../utils/geocoding'
import toast from 'react-hot-toast'
import { 
  FiActivity, 
  FiSun, 
  FiMoon, 
  FiArrowRight, 
  FiClock, 
  FiStar,
  FiSearch,
  FiHeart,
  FiShield,
  FiCheckCircle,
  FiMap,
  FiList,
  FiCrosshair,
  FiNavigation,
  FiUsers,
  FiTool,
  FiHome,
  FiDroplet,
  FiZap,
  FiWind,
  FiAward,
  FiUser
} from 'react-icons/fi'

const Services = () => {
  const dispatch = useDispatch()
  const { services = [], loading } = useSelector((state) => state.service || {})
  const { user, isAuthenticated } = useSelector((state) => state.auth || {})
  const { darkMode, toggleDarkMode } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('list')
  const [userLocation, setUserLocation] = useState(null)
  const [selectedRadius, setSelectedRadius] = useState(10)
  const [gettingLocation, setGettingLocation] = useState(false)

  useEffect(() => {
    dispatch(getServices())
  }, [dispatch])

  const handleGetLocation = async () => {
    setGettingLocation(true)
    try {
      const location = await getCurrentLocation()
      setUserLocation(location)
      toast.success('Location detected!')
    } catch (error) {
      toast.error(error.message || 'Failed to get location')
    } finally {
      setGettingLocation(false)
    }
  }

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'healthcare', label: 'Healthcare' },
    { id: 'home_service', label: 'Home Services' },
  ]

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'healthcare': return <FiHeart className="w-6 h-6" />
      case 'home_service': return <FiHome className="w-6 h-6" />
      default: return <FiActivity className="w-6 h-6" />
    }
  }

  const getServiceIcon = (service) => {
    const name = service.name?.toLowerCase() || ''
    const tags = service.tags || []
    
    if (name.includes('doctor') || name.includes('consultation')) return <FiUser className="w-6 h-6" />
    if (name.includes('nursing') || name.includes('care')) return <FiHeart className="w-6 h-6" />
    if (name.includes('physio')) return <FiAward className="w-6 h-6" />
    if (name.includes('lab') || name.includes('sample')) return <FiDroplet className="w-6 h-6" />
    if (name.includes('dental')) return <FiActivity className="w-6 h-6" />
    if (name.includes('plumbing')) return <FiDroplet className="w-6 h-6" />
    if (name.includes('electrical')) return <FiZap className="w-6 h-6" />
    if (name.includes('ac') || name.includes('cooling')) return <FiWind className="w-6 h-6" />
    if (name.includes('carpentry') || name.includes('painting')) return <FiTool className="w-6 h-6" />
    if (name.includes('cleaning') || name.includes('pest')) return <FiHome className="w-6 h-6" />
    
    return getCategoryIcon(service.category)
  }

  const filteredServices = services.filter((service) => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    const matchesSearch = !searchQuery || 
      service.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const servicesWithDistance = filteredServices.map((service) => {
    let distance = null
    if (userLocation && service.address?.location?.coordinates) {
      distance = calculateDistance(
        userLocation.lat,
        userLocation.lon,
        service.address.location.coordinates[1],
        service.address.location.coordinates[0]
      )
    }
    return { ...service, distance }
  })

  const nearbyServices = servicesWithDistance
    .filter((service) => {
      if (!userLocation || service.distance === null) return true
      return service.distance <= selectedRadius
    })
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))

  const displayServices = filteredServices.length > 0 ? filteredServices : []

  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <FiActivity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                HealthBridge
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <span className="text-sm font-medium text-teal-500">Services</span>
              <a href="/#features" className="text-sm font-medium hover:text-teal-500 transition-colors text-slate-600 dark:text-slate-300">
                Features
              </a>
              <a href="/#testimonials" className="text-sm font-medium hover:text-teal-500 transition-colors text-slate-600 dark:text-slate-300">
                Testimonials
              </a>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl transition-all hover:scale-105 bg-slate-100 dark:bg-slate-700"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <FiSun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <FiMoon className="w-5 h-5 text-slate-600" />
                )}
              </button>
              {isAuthenticated ? (
                <Link 
                  to={user?.role === 'customer' ? '/customer/dashboard' : user?.role === 'provider' ? '/provider/dashboard' : '/admin/dashboard'} 
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg transition-all"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="px-4 py-2 text-sm font-medium rounded-xl transition-all hover:scale-105 text-slate-700 dark:text-slate-200"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-800 dark:text-white">
              Healthcare & Home Services
            </h1>
            <p className="text-lg max-w-2xl mx-auto text-slate-600 dark:text-slate-300">
              Quality healthcare and home services at transparent prices. All providers are verified professionals.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white transition-all focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-lg"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={handleGetLocation}
              disabled={gettingLocation}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              <FiCrosshair className={`w-4 h-4 ${gettingLocation ? 'animate-spin' : ''}`} />
              {gettingLocation ? 'Detecting...' : userLocation ? 'Location Set ✓' : 'Use My Location'}
            </button>

            {userLocation && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Within:</span>
                {[5, 10, 20].map((km) => (
                  <button
                    key={km}
                    onClick={() => setSelectedRadius(km)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      selectedRadius === km ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {km} km
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-all ${viewMode === 'list' ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                <FiList className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 transition-all ${viewMode === 'map' ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                <FiMap className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700 mb-4"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4 w-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : displayServices.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <FiSearch className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-white">
                No services found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayServices.map((service, index) => (
                <div
                  key={service._id || index}
                  className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Service Header */}
                  <div className="p-6 pb-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg text-white group-hover:scale-110 transition-transform">
                        {getServiceIcon(service)}
                      </div>
                      {service.hasActiveDiscount && service.discount?.percentage > 0 && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white">
                          {service.discount.percentage}% OFF
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-white group-hover:text-teal-500 transition-colors">
                      {service.name}
                    </h3>
                    
                    <p className="text-sm mb-4 text-slate-600 dark:text-slate-400 line-clamp-2">
                      {service.description}
                    </p>
                  </div>

                  {/* Service Meta */}
                  <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          {service.duration || 30} min
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
                          {service.category === 'healthcare' ? 'Healthcare' : 'Home Service'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                          ₹{service.hasActiveDiscount && service.discount?.percentage 
                            ? Math.round(service.basePrice * (1 - service.discount.percentage / 100))
                            : service.basePrice}
                        </span>
                        {service.hasActiveDiscount && service.discount?.percentage > 0 && (
                          <span className="text-sm ml-2 line-through text-slate-400">
                            ₹{service.basePrice}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={isAuthenticated ? `/services/${service._id}/providers` : '/login'}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        >
                          <FiUsers className="w-4 h-4" />
                          <span className="hidden sm:inline">Providers</span>
                        </Link>
                        <Link
                          to={isAuthenticated ? `/booking/${service._id}` : '/login'}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium hover:shadow-lg transition-all hover:scale-105"
                        >
                          Book
                          <FiArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12 text-sm text-slate-500 dark:text-slate-400">
            Showing {displayServices.length} service{displayServices.length !== 1 ? 's' : ''}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <FiShield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">
                Verified Providers
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                All healthcare professionals are licensed and background-checked
              </p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <FiHeart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">
                Quality Care
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Patient satisfaction is our top priority
              </p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <FiCheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">
                Easy Booking
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Book appointments in seconds with instant confirmation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto text-center">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <FiActivity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
              HealthBridge
            </span>
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} HealthBridge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Services
