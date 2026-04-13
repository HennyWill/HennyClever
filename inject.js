// This script runs in MAIN world and overrides geolocation
// It overrides immediately (before coordinates arrive) and queues requests
// Coordinates are passed later via CustomEvent from content script

(function() {
  if (window.__hennyCleverActive) return;
  window.__hennyCleverActive = true;

  let fakePosition = null;
  let fakeLanguage = null;
  const pendingCallbacks = [];
  const watchers = {};
  let watchId = 0;

  const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
  const originalWatchPosition = navigator.geolocation.watchPosition.bind(navigator.geolocation);
  const originalClearWatch = navigator.geolocation.clearWatch.bind(navigator.geolocation);

  function buildPosition(lat, lng) {
    return {
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
  }

  // Override getCurrentPosition immediately — queue if coords not ready
  navigator.geolocation.getCurrentPosition = function(success, error, options) {
    if (fakePosition) {
      setTimeout(() => success(fakePosition), 0);
    } else {
      pendingCallbacks.push({ success, error });
    }
  };

  // Override watchPosition — queue if coords not ready
  navigator.geolocation.watchPosition = function(success, error, options) {
    const id = ++watchId;
    if (fakePosition) {
      setTimeout(() => success(fakePosition), 0);
    } else {
      pendingCallbacks.push({ success, error, watchId: id });
    }
    watchers[id] = { success, error };
    return id;
  };

  // Override clearWatch
  navigator.geolocation.clearWatch = function(id) {
    delete watchers[id];
  };

  // Override language if provided
  function applyLanguageOverride(lang) {
    if (!lang) return;

    Object.defineProperty(navigator, 'language', {
      get: function() { return lang; },
      configurable: true
    });

    Object.defineProperty(navigator, 'languages', {
      get: function() { return [lang]; },
      configurable: true
    });
  }

  // Coordinates arrive via CustomEvent from content script
  window.addEventListener('HennyCleverInit', function(event) {
    const { lat, lng, lang } = event.detail;
    fakePosition = buildPosition(lat, lng);

    // Resolve all pending callbacks
    pendingCallbacks.forEach(cb => {
      if (cb.success) cb.success(fakePosition);
    });
    pendingCallbacks.length = 0;

    // Apply language override
    if (lang) {
      fakeLanguage = lang;
      applyLanguageOverride(lang);
    }
  }, { once: true });
})();
