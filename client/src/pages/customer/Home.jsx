import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { 
  FiActivity, 
  FiSun, 
  FiMoon, 
  FiShield, 
  FiClock, 
  FiCheckCircle,
  FiArrowRight,
  FiStar,
  FiUsers,
  FiHeart,
  FiAward,
  FiSmartphone,
  FiLock,
  FiZap,
  FiPlay
} from 'react-icons/fi'

const Home = () => {
  const { darkMode, toggleDarkMode } = useTheme()

  const heroImage = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop&q=80'
  
  const serviceImages = {
    'General Consultation': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=300&fit=crop&q=80',
    'Dental Checkup': 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=300&fit=crop&q=80',
    'Eye Examination': 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&h=300&fit=crop&q=80',
    'Lab Tests': 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&h=300&fit=crop&q=80',
  }

  const testimonialAvatars = {
    'Dr. Sarah Johnson': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&q=80',
    'Michael Chen': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80',
    'Dr. Priya Sharma': 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=100&h=100&fit=crop&q=80',
  }

  const features = [
    {
      icon: FiShield,
      title: 'Verified Healthcare Providers',
      description: 'Every provider is thoroughly vetted, licensed, and background-checked for your safety.',
      color: 'from-teal-500 to-cyan-500'
    },
    {
      icon: FiClock,
      title: '24/7 Booking Availability',
      description: 'Book appointments anytime, anywhere. Flexible scheduling that works around your life.',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      icon: FiSmartphone,
      title: 'Digital Health Records',
      description: 'Access your medical reports, prescriptions, and health history securely online.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: FiLock,
      title: 'HIPAA Compliant Security',
      description: 'Your health data is protected with enterprise-grade encryption and security.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: FiZap,
      title: 'Instant Confirmations',
      description: 'Get immediate booking confirmations and real-time status updates via SMS and email.',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: FiHeart,
      title: 'Quality Care Guarantee',
      description: 'We partner only with top-rated healthcare facilities and experienced professionals.',
      color: 'from-rose-500 to-pink-500'
    },
  ]

  const stats = [
    { value: '500+', label: 'Healthcare Providers', icon: FiUsers },
    { value: '50,000+', label: 'Happy Patients', icon: FiHeart },
    { value: '100,000+', label: 'Appointments', icon: FiActivity },
    { value: '4.9', label: 'Average Rating', icon: FiStar },
  ]

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Chief Medical Officer, Metro Hospital',
      content: 'HealthBridge has transformed how we manage our practice. The platform is intuitive, reliable, and our patients love the seamless booking experience.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Patient',
      content: 'Finally, a healthcare platform that just works. I booked my appointment in under a minute, got instant confirmation, and the doctor was fantastic.',
      rating: 5
    },
    {
      name: 'Dr. Priya Sharma',
      role: 'Cardiologist',
      content: 'As a provider, this platform has streamlined my practice management significantly. The dashboard is clean and all the tools I need are at my fingertips.',
      rating: 5
    },
  ]

  const services = [
    { name: 'General Consultation', price: '₹500', duration: '30 min' },
    { name: 'Dental Checkup', price: '₹800', duration: '45 min' },
    { name: 'Eye Examination', price: '₹600', duration: '30 min' },
    { name: 'Lab Tests', price: '₹300', duration: '15 min' },
  ]

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <FiActivity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">HealthBridge</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-sm font-medium hover:text-teal-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Services
              </a>
              <a href="#features" className="text-sm font-medium hover:text-teal-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Features
              </a>
              <a href="#testimonials" className="text-sm font-medium hover:text-teal-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Testimonials
              </a>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl transition-all hover:scale-105"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <FiSun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <FiMoon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                )}
              </button>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium rounded-xl transition-all hover:scale-105"
                style={{ color: 'var(--text-primary)' }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                <FiAward className="w-4 h-4 text-teal-500" />
                <span>Trusted by 500+ Healthcare Providers</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: 'var(--text-primary)' }}>
                Healthcare Made
                <span className="block gradient-text">Simple & Accessible</span>
              </h1>
              
              <p className="text-lg mb-8 max-w-lg" style={{ color: 'var(--text-secondary)' }}>
                Book appointments with verified healthcare professionals in seconds. 
                Quality care, transparent pricing, and a seamless experience — all in one platform.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link to="/services" className="btn-primary inline-flex items-center gap-2 text-base">
                  Browse Services
                  <FiArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/register" className="btn-secondary inline-flex items-center gap-2 text-base">
                  Create Free Account
                </Link>
              </div>

              <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                <div className="flex items-center gap-1">
                  <FiCheckCircle className="w-4 h-4 text-teal-500" />
                  <span>No registration fees</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiCheckCircle className="w-4 h-4 text-teal-500" />
                  <span>Free cancellation</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiCheckCircle className="w-4 h-4 text-teal-500" />
                  <span>Secure payments</span>
                </div>
              </div>
            </div>

            <div className="relative animate-slide-up delay-200">
              {/* Hero Image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={heroImage}
                  alt="Healthcare professionals"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <FiPlay className="w-6 h-6 text-teal-500 ml-1" />
                  </button>
                </div>
              </div>
              
              {/* Floating Stats Card */}
              <div className="absolute -bottom-6 -left-6 p-4 rounded-xl shadow-xl animate-float" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                    <FiUsers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>50K+</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Happy Patients</p>
                  </div>
                </div>
              </div>

              {/* Floating Rating Card */}
              <div className="absolute -top-4 -right-4 p-3 rounded-xl shadow-xl animate-float delay-500" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>4.9</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-teal-500" />
                <p className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {stat.value}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Popular Healthcare Services
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Quality healthcare services at transparent prices. Book instantly with verified providers.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="group rounded-2xl overflow-hidden card-hover animate-slide-up"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--border-color)',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {/* Service Image */}
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src={serviceImages[service.name]}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/90 text-slate-800">
                      {service.duration}
                    </span>
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {service.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold gradient-text">{service.price}</span>
                    <Link 
                      to="/services" 
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-500/10 text-teal-500 hover:bg-teal-500 hover:text-white transition-all"
                    >
                      <FiArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/services" className="btn-primary inline-flex items-center gap-2">
              View All Services
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Why Choose HealthBridge?
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              We're building the future of healthcare access — secure, simple, and patient-first.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl card-hover group animate-slide-up"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--border-color)',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Trusted by Healthcare Professionals
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              See what doctors and patients say about their experience with HealthBridge.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl card-hover animate-slide-up"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--border-color)',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-lg mb-6 italic" style={{ color: 'var(--text-secondary)' }}>
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonialAvatars[testimonial.name]}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {testimonial.name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl gradient-bg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Join thousands of patients and healthcare providers who trust HealthBridge 
                for their healthcare needs.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  to="/register" 
                  className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all hover:scale-105"
                >
                  Create Free Account
                </Link>
                <Link 
                  to="/services" 
                  className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all hover:scale-105"
                >
                  Browse Services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                  <FiActivity className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">HealthBridge</span>
              </Link>
              <p className="max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                Enterprise healthcare platform trusted by hospitals, clinics, and healthcare 
                professionals worldwide.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#services" className="hover:text-teal-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>Services</a></li>
                <li><a href="#features" className="hover:text-teal-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>Features</a></li>
                <li><a href="#testimonials" className="hover:text-teal-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>Testimonials</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-teal-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>Help Center</a></li>
                <li><a href="#" className="hover:text-teal-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</a></li>
                <li><a href="#" className="hover:text-teal-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t text-center" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} HealthBridge. All rights reserved. Built with ❤️ for better healthcare.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
