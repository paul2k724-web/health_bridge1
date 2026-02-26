const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => degrees * (Math.PI / 180);

const toDegrees = (radians) => radians * (180 / Math.PI);

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c;
};

const isWithinRadius = (lat1, lon1, lat2, lon2, radiusKm) => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusKm;
};

const generateGoogleMapsNavigationUrl = (latitude, longitude) => {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
};

const generateWhatsAppUrl = (phoneNumber, message = '') => {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

const formatBookingWhatsAppMessage = (booking) => {
  return `Hello! I'm contacting you about booking #${booking._id}
Service: ${booking.service?.name || 'N/A'}
Date: ${new Date(booking.scheduledDate).toLocaleDateString()}
Time: ${booking.scheduledTime}
Address: ${booking.address?.addressLine1 || 'N/A'}, ${booking.address?.city || ''}`;
};

const toGeoJSONPoint = (latitude, longitude) => {
  return {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
};

const fromGeoJSONPoint = (geoJSON) => {
  if (!geoJSON || !geoJSON.coordinates) {
    return { latitude: null, longitude: null };
  }
  return {
    longitude: geoJSON.coordinates[0],
    latitude: geoJSON.coordinates[1],
  };
};

const getBoundingBox = (latitude, longitude, radiusKm) => {
  const latDelta = radiusKm / EARTH_RADIUS_KM;
  const lonDelta = radiusKm / (EARTH_RADIUS_KM * Math.cos(toRadians(latitude)));
  
  return {
    minLat: latitude - toDegrees(latDelta),
    maxLat: latitude + toDegrees(latDelta),
    minLon: longitude - toDegrees(lonDelta),
    maxLon: longitude + toDegrees(lonDelta),
  };
};

export {
  calculateDistance,
  isWithinRadius,
  generateGoogleMapsNavigationUrl,
  generateWhatsAppUrl,
  formatBookingWhatsAppMessage,
  toGeoJSONPoint,
  fromGeoJSONPoint,
  getBoundingBox,
  toRadians,
  toDegrees,
};

export default {
  calculateDistance,
  isWithinRadius,
  generateGoogleMapsNavigationUrl,
  generateWhatsAppUrl,
  formatBookingWhatsAppMessage,
  toGeoJSONPoint,
  fromGeoJSONPoint,
  getBoundingBox,
  toRadians,
  toDegrees,
};
