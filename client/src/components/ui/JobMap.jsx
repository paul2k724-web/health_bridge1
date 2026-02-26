import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { FiNavigation, FiPhone, FiMapPin, FiExternalLink } from 'react-icons/fi'
import { formatDistance, defaultCenter } from '../../utils/geocoding'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const pendingIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const inProgressIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const completedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const MapUpdater = ({ center, zoom }) => {
  const map = useMap()
  
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lon], zoom)
    }
  }, [center, zoom, map])
  
  return null
}

const JobMap = ({
  jobs = [],
  userLocation = null,
  onJobSelect,
  height = '400px',
}) => {
  const [mapCenter, setMapCenter] = useState(userLocation || defaultCenter)

  useEffect(() => {
    if (userLocation) {
      setMapCenter(userLocation)
    } else if (jobs.length > 0 && jobs[0].address?.location?.coordinates) {
      setMapCenter({
        lat: jobs[0].address.location.coordinates[1],
        lon: jobs[0].address.location.coordinates[0],
      })
    }
  }, [userLocation, jobs])

  const getMarkerIcon = (status) => {
    switch (status) {
      case 'completed':
        return completedIcon
      case 'in_progress':
      case 'provider_arriving':
        return inProgressIcon
      default:
        return pendingIcon
    }
  }

  const getJobCoordinates = (job) => {
    if (job.coordinates) return job.coordinates
    if (job.address?.location?.coordinates) {
      return {
        lat: job.address.location.coordinates[1],
        lon: job.address.location.coordinates[0],
      }
    }
    return null
  }

  const openNavigation = (job) => {
    const coords = getJobCoordinates(job)
    if (coords) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lon}`,
        '_blank'
      )
    }
  }

  const openWhatsApp = (phone, message) => {
    const cleanPhone = phone?.replace(/\D/g, '') || ''
    const encodedMessage = encodeURIComponent(message || '')
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank')
  }

  return (
    <div 
      className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
      style={{ height }}
    >
      <MapContainer
        center={[mapCenter.lat, mapCenter.lon]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={mapCenter} zoom={12} />

        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lon]}
            icon={inProgressIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-medium text-slate-800">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {jobs.map((job, index) => {
          const coords = getJobCoordinates(job)
          if (!coords) return null

          return (
            <Marker
              key={job._id || index}
              position={[coords.lat, coords.lon]}
              icon={getMarkerIcon(job.status)}
              eventHandlers={{
                click: () => {
                  if (onJobSelect) {
                    onJobSelect(job)
                  }
                },
              }}
            >
              <Popup>
                <div className="text-sm max-w-xs">
                  <p className="font-medium text-slate-800 mb-1">
                    {job.service?.name || 'Service'}
                  </p>
                  <p className="text-xs text-slate-500 mb-2">
                    {job.address?.addressLine1 || job.address?.city || 'Address'}
                  </p>
                  <p className="text-xs text-slate-400 mb-2">
                    {new Date(job.scheduledDate).toLocaleDateString()} at {job.scheduledTime}
                  </p>
                  
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openNavigation(job)
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-teal-500 text-white rounded hover:bg-teal-600"
                    >
                      <FiNavigation className="w-3 h-3" />
                      Navigate
                    </button>
                    
                    {job.customer?.phone && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openWhatsApp(job.customer.phone, `Hi, I'm contacting about your booking #${job._id}`)
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        <FiPhone className="w-3 h-3" />
                        Contact
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      <div className="absolute top-2 right-2 bg-white dark:bg-slate-800 rounded-lg p-2 shadow z-[1000]">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span className="text-slate-600 dark:text-slate-300">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-600 dark:text-slate-300">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-slate-600 dark:text-slate-300">Completed</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobMap
