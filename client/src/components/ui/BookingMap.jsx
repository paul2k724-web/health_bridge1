import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { FiMapPin, FiUser, FiCalendar } from 'react-icons/fi'
import { defaultCenter } from '../../utils/geocoding'
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

const cancelledIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
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

const BookingMap = ({
  bookings = [],
  onBookingSelect,
  height = '400px',
}) => {
  const [mapCenter, setMapCenter] = useState(defaultCenter)

  useEffect(() => {
    if (bookings.length > 0) {
      const firstBooking = bookings.find(b => getBookingCoordinates(b))
      if (firstBooking) {
        const coords = getBookingCoordinates(firstBooking)
        setMapCenter(coords)
      }
    }
  }, [bookings])

  const getMarkerIcon = (status) => {
    switch (status) {
      case 'completed':
        return completedIcon
      case 'cancelled':
        return cancelledIcon
      case 'in_progress':
      case 'provider_arriving':
      case 'accepted':
        return inProgressIcon
      default:
        return pendingIcon
    }
  }

  const getBookingCoordinates = (booking) => {
    if (booking.coordinates) return booking.coordinates
    if (booking.address?.location?.coordinates) {
      return {
        lat: booking.address.location.coordinates[1],
        lon: booking.address.location.coordinates[0],
      }
    }
    return null
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'cancelled': return 'text-red-600'
      case 'in_progress':
      case 'provider_arriving':
      case 'accepted': return 'text-blue-600'
      default: return 'text-yellow-600'
    }
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

        {bookings.map((booking, index) => {
          const coords = getBookingCoordinates(booking)
          if (!coords) return null

          return (
            <Marker
              key={booking._id || index}
              position={[coords.lat, coords.lon]}
              icon={getMarkerIcon(booking.status)}
              eventHandlers={{
                click: () => {
                  if (onBookingSelect) {
                    onBookingSelect(booking)
                  }
                },
              }}
            >
              <Popup>
                <div className="text-sm max-w-xs">
                  <p className="font-medium text-slate-800 mb-1">
                    {booking.service?.name || 'Service'}
                  </p>
                  <div className="text-xs text-slate-500 space-y-1 mb-2">
                    <p className="flex items-center gap-1">
                      <FiUser className="w-3 h-3" />
                      {booking.customer?.name || 'Customer'}
                    </p>
                    <p className="flex items-center gap-1">
                      <FiMapPin className="w-3 h-3" />
                      {booking.address?.city || 'Location'}
                    </p>
                    <p className="flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" />
                      {new Date(booking.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-teal-600">
                      ₹{booking.amount?.finalAmount || 0}
                    </span>
                    <span className={`text-xs font-medium capitalize ${getStatusColor(booking.status)}`}>
                      {booking.status?.replace('_', ' ')}
                    </span>
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
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-600 dark:text-slate-300">Cancelled</span>
          </div>
        </div>
      </div>

      {bookings.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 z-[1000]">
          <p className="text-slate-500 dark:text-slate-400">No bookings to display</p>
        </div>
      )}
    </div>
  )
}

export default BookingMap
