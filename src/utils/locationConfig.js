// ============================================================
// src/utils/locationConfig.js
// Service Area Configuration - 20km Circle around Coimbatore
// ============================================================

export const LAUNCH_CONFIG = {
  // Coimbatore city center coordinates
  centerLat: 11.0168,
  centerLng: 76.9558,

  // Service radius in kilometers
  radiusKm: 20,

  cityName: 'Coimbatore',
  cityNameTa: 'கோயம்புத்தூர்',
  stateName: 'Tamil Nadu',

  // Future expansion cities (add when ready)
  futureCities: ['Salem', 'Tiruppur', 'Erode', 'Pollachi'],
};

// ════════════════════════════════════════
// User location service area-ல் இருக்கிறார்களா check பண்று function
// ════════════════════════════════════════
export const isWithinServiceArea = (userLat, userLng) => {
  const R = 6371; // Earth's radius in km

  // Degrees to radians convert
  const dLat = (userLat - LAUNCH_CONFIG.centerLat) * (Math.PI / 180);
  const dLng = (userLng - LAUNCH_CONFIG.centerLng) * (Math.PI / 180);

  // Haversine formula (accurate distance calculation)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(LAUNCH_CONFIG.centerLat * (Math.PI / 180)) *
      Math.cos(userLat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km

  return {
    isWithin: distance <= LAUNCH_CONFIG.radiusKm,
    distance: Math.round(distance * 10) / 10, // 1 decimal place
  };
};

// ════════════════════════════════════════
// Pincode-based check (simpler approach)
// Coimbatore pincodes: 641001 to 641114
// ════════════════════════════════════════
export const isCoimbatorePincode = pincode => {
  const pin = parseInt(pincode, 10);
  return pin >= 641001 && pin <= 641114;
};
