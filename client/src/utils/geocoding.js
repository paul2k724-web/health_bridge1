const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100;

const rateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
};

export const searchAddress = async (query, limit = 5) => {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    await rateLimit();
    
    const params = new URLSearchParams({
      format: 'json',
      q: query,
      limit: limit.toString(),
      addressdetails: '1',
      'accept-language': 'en',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to search address');
    }

    const data = await response.json();
    
    return data.map(item => ({
      placeId: item.place_id,
      displayName: item.display_name,
      address: {
        road: item.address?.road || item.address?.pedestrian || '',
        houseNumber: item.address?.house_number || '',
        city: item.address?.city || item.address?.town || item.address?.village || item.address?.municipality || '',
        state: item.address?.state || '',
        postcode: item.address?.postcode || '',
        country: item.address?.country || '',
      },
      coordinates: {
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      },
      type: item.type,
    }));
  } catch (error) {
    console.error('Address search error:', error);
    return [];
  }
};

export const reverseGeocode = async (lat, lon) => {
  try {
    await rateLimit();
    
    const params = new URLSearchParams({
      format: 'json',
      lat: lat.toString(),
      lon: lon.toString(),
      addressdetails: '1',
      'accept-language': 'en',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to reverse geocode');
    }

    const data = await response.json();
    
    if (data.error) {
      return null;
    }

    return {
      displayName: data.display_name,
      address: {
        road: data.address?.road || data.address?.pedestrian || '',
        houseNumber: data.address?.house_number || '',
        city: data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || '',
        state: data.address?.state || '',
        postcode: data.address?.postcode || '',
        country: data.address?.country || '',
      },
      coordinates: {
        lat: parseFloat(data.lat),
        lon: parseFloat(data.lon),
      },
    };
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return null;
  }
};

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

export const formatAddress = (addressData) => {
  if (!addressData) return '';
  
  const parts = [];
  
  if (addressData.houseNumber && addressData.road) {
    parts.push(`${addressData.houseNumber} ${addressData.road}`);
  } else if (addressData.road) {
    parts.push(addressData.road);
  }
  
  if (addressData.city) {
    parts.push(addressData.city);
  }
  
  if (addressData.state) {
    parts.push(addressData.state);
  }
  
  if (addressData.postcode) {
    parts.push(addressData.postcode);
  }
  
  return parts.join(', ') || addressData.displayName || '';
};

export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

export const filterByDistance = (items, userLocation, maxDistanceKm) => {
  if (!userLocation) return items;
  
  return items
    .map(item => ({
      ...item,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lon,
        item.coordinates?.lat || item.location?.coordinates?.[1] || 0,
        item.coordinates?.lon || item.location?.coordinates?.[0] || 0
      ),
    }))
    .filter(item => item.distance <= maxDistanceKm)
    .sort((a, b) => a.distance - b.distance);
};

export const defaultCenter = {
  lat: 28.6139,
  lon: 77.2090,
};

export default {
  searchAddress,
  reverseGeocode,
  getCurrentLocation,
  calculateDistance,
  formatAddress,
  formatDistance,
  filterByDistance,
  defaultCenter,
};
