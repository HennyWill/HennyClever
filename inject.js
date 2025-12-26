// This script runs in MAIN world and overrides geolocation
// Coordinates are passed via CustomEvent from content script

(function() {
  // Listen for initialization event from content script
  window.addEventListener('HennyCleverInit', function(event) {
    const { lat, lng } = event.detail;

    const fakePosition = {
      coords: {
        latitude: lat,
        longitude: lng,
        accuracy: 100,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    };

    // Override getCurrentPosition
    const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
    navigator.geolocation.getCurrentPosition = function(success, error, options) {
      console.log('[HennyClever] getCurrentPosition called, returning:', fakePosition);
      if (success) {
        setTimeout(() => success(fakePosition), 0);
      }
    };

    // Override watchPosition
    let watchId = 0;
    const originalWatchPosition = navigator.geolocation.watchPosition;
    navigator.geolocation.watchPosition = function(success, error, options) {
      console.log('[HennyClever] watchPosition called, returning:', fakePosition);
      if (success) {
        setTimeout(() => success(fakePosition), 0);
      }
      return ++watchId;
    };

    console.log('[HennyClever] Geolocation override active for:', lat, lng);
  }, { once: true });
})();
