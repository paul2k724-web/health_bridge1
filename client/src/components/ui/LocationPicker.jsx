import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { FiCrosshair, FiMapPin } from 'react-icons/fi'
import toast from 'react-hot-toast'
import AddressSearch from './AddressSearch'
import { getCurrentLocation, reverseGeocode, defaultCenter } from '../../utils/geocoding'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-teal.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const LocationMarker = ({ position, onPositionChange, draggable = true }) => {
  useMapEvents({
    click(e) {
      onPositionChange({
        lat: e.latlng.lat,
        lon: e.latlng.lng,
      })
    },
  })

  if (!position) return null

  return (
    <Marker
      position={[position.lat, position.lon]}
      icon={customIcon}
      draggable={draggable}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target
          const position = marker.getLatLng()
          onPositionChange({
            lat: position.lat,
            lon: position.lng,
          })
        },
      }}
    />
  )
}

const MapUpdater = ({ center, zoom }) => {
  const map = useMap()
  
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lon], zoom)
    }
  }, [center, zoom, map])
  
  return null
}

const LocationPicker = ({
  onLocationSelect,
  defaultLocation = null,
  label = 'Location',
  height = '300px',
  showAddressSearch = true,
}) => {
  const [position, setPosition] = useState(defaultLocation)
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [mapCenter, setMapCenter] = useState(defaultLocation || defaultCenter)
  const [zoom, setZoom] = useState(12)
  const initialSetRef = useRef(false)

  useEffect(() => {
    if (defaultLocation && !initialSetRef.current) {
      setPosition(defaultLocation)
      setMapCenter(defaultLocation)
      initialSetRef.current = true
    }
  }, [defaultLocation])

  useEffect(() => {
    if (position) {
      fetchAddressFromCoords(position.lat, position.lon)
    }
  }, [])

  const fetchAddressFromCoords = async (lat, lon) => {
    try {
      const result = await reverseGeocode(lat, lon)
      if (result) {
        setAddress(result.displayName)
        notifyParent(result.displayName, { lat, lon })
      }
    } catch (error) {
      console.error('Reverse geocode error:', error)
    }
  }

  const notifyParent = (addressStr, coords) => {
    if (onLocationSelect) {
      onLocationSelect({
        address: addressStr,
        coordinates: coords,
      })
    }
  }

  const handlePositionChange = async (newPosition) => {
    setPosition(newPosition)
    setMapCenter(newPosition)
    await fetchAddressFromCoords(newPosition.lat, newPosition.lon)
  }

  const handleAddressSelect = (result) => {
    setAddress(result.address)
    setPosition(result.coordinates)
    setMapCenter(result.coordinates)
    setZoom(16)
    notifyParent(result.address, result.coordinates)
  }

  const handleGetCurrentLocation = async () => {
    setLoading(true)
    try {
      const location = await getCurrentLocation()
      setPosition(location)
      setMapCenter(location)
      setZoom(16)
      await fetchAddressFromCoords(location.lat, location.lon)
      toast.success('Location detected successfully!')
    } catch (error) {
      toast.error(error.message || 'Failed to get current location')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {showAddressSearch && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            <FiMapPin className="inline w-4 h-4 mr-1" />
            {label}
          </label>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <AddressSearch
                onAddressSelect={handleAddressSelect}
                placeholder="Search for an address..."
                value={address}
                onChange={setAddress}
              />
            </div>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={loading}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title="Use my current location"
            >
              <FiCrosshair className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">
                {loading ? 'Detecting...' : 'My Location'}
              </span>
            </button>
          </div>
        </div>
      )}

      <div 
        className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
        style={{ height }}
      >
        <MapContainer
          center={[mapCenter.lat, mapCenter.lon]}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} zoom={zoom} />
          <LocationMarker 
            position={position} 
            onPositionChange={handlePositionChange}
          />
        </MapContainer>

        <div className="absolute bottom-2 left-2 bg-white dark:bg-slate-800 px-2 py-1 rounded text-xs text-slate-500 dark:text-slate-400 shadow">
          Click on map or drag marker to set location
        </div>
      </div>

      {position && (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium">Coordinates:</span>{' '}
          {position.lat.toFixed(6)}, {position.lon.toFixed(6)}
        </div>
      )}
    </div>
  )
}

export default LocationPicker
