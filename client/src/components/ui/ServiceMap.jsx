import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { FiMapPin, FiNavigation } from 'react-icons/fi'
import { calculateDistance, formatDistance, defaultCenter } from '../../utils/geocoding'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const serviceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-teal.png',
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

const ServiceMap = ({
  services = [],
  userLocation = null,
  onServiceSelect,
  radius = 10,
  height = '400px',
}) => {
  const [filteredServices, setFilteredServices] = useState([])
  const [selectedRadius, setSelectedRadius] = useState(radius)
  const [mapCenter, setMapCenter] = useState(userLocation || defaultCenter)

  useEffect(() => {
    if (userLocation) {
      setMapCenter(userLocation)
    }
  }, [userLocation])

  useEffect(() => {
    if (!userLocation || !services.length) {
      setFilteredServices(services)
      return
    }

    const filtered = services
      .map(service => {
        let serviceCoords = null
        
        if (service.coordinates) {
          serviceCoords = service.coordinates
        } else if (service.location?.coordinates) {
          serviceCoords = {
            lat: service.location.coordinates[1],
            lon: service.location.coordinates[0],
          }
        } else if (service.address?.location?.coordinates) {
          serviceCoords = {
            lat: service.address.location.coordinates[1],
            lon: service.address.location.coordinates[0],
          }
        }

        if (!serviceCoords) return null

        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lon,
          serviceCoords.lat,
          serviceCoords.lon
        )

        return {
          ...service,
          coordinates: serviceCoords,
          distance,
        }
      })
      .filter(Boolean)
      .filter(service => service.distance <= selectedRadius)
      .sort((a, b) => a.distance - b.distance)

    setFilteredServices(filtered)
  }, [services, userLocation, selectedRadius])

  const radiusOptions = [5, 10, 20]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Show services within:
          </span>
          <div className="flex gap-1">
            {radiusOptions.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRadius(r)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedRadius === r
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        <div className="text-sm text-slate-500 dark:text-slate-400">
          {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
        </div>
      </div>

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
              icon={userIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-medium text-slate-800">Your Location</p>
                </div>
              </Popup>
            </Marker>
          )}

          {filteredServices.map((service, index) => (
            service.coordinates && (
              <Marker
                key={service._id || index}
                position={[service.coordinates.lat, service.coordinates.lon]}
                icon={serviceIcon}
                eventHandlers={{
                  click: () => {
                    if (onServiceSelect) {
                      onServiceSelect(service)
                    }
                  },
                }}
              >
                <Popup>
                  <div className="text-sm max-w-xs">
                    <p className="font-medium text-slate-800 mb-1">{service.name}</p>
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-teal-600">
                        ₹{service.basePrice}
                      </span>
                      {service.distance && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <FiNavigation className="w-3 h-3" />
                          {formatDistance(service.distance)}
                        </span>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>

      {!userLocation && (
        <div className="text-center text-sm text-amber-600 dark:text-amber-400 py-2">
          <FiMapPin className="inline w-4 h-4 mr-1" />
          Enable location access to see nearby services
        </div>
      )}
    </div>
  )
}

export default ServiceMap
