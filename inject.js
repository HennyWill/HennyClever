// This script runs in MAIN world and overrides geolocation
// It overrides immediately (before coordinates arrive) and queues requests
// Coordinates are passed later via CustomEvent from content script

(function() {
  if (window.__hennyCleverActive) return;
  window.__hennyCleverActive = true;

  const originalGet = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
  const originalWatch = navigator.geolocation.watchPosition.bind(navigator.geolocation);
  const originalClear = navigator.geolocation.clearWatch.bind(navigator.geolocation);
  const languageDescriptor = Object.getOwnPropertyDescriptor(navigator, 'language');
  const languagesDescriptor = Object.getOwnPropertyDescriptor(navigator, 'languages');
  let enabled = true;
  let currentCoords = null;
  let fakeLanguage = null;
  const pendingCallbacks = [];
  const watchers = {};
  let watchId = 0;

  function buildPosition() {
    if (!currentCoords) return null;
    return {
      coords: {
        latitude: currentCoords.lat,
        longitude: currentCoords.lng,
        accuracy: 100,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    };
  }

  // Override getCurrentPosition — queue if coords not ready
  navigator.geolocation.getCurrentPosition = function(success, error, options) {
    if (!enabled) return originalGet(success, error, options);
    if (currentCoords) {
      setTimeout(() => success(buildPosition()), 0);
    } else {
      pendingCallbacks.push({ success, error });
    }
  };

  // Override watchPosition — watchers are notified via HennyCleverInit listener
  navigator.geolocation.watchPosition = function(success, error, options) {
    if (!enabled) { const id = ++watchId; watchers[id] = {success, error, options, nativeId: originalWatch(success, error, options)}; return id; }
    const id = ++watchId;
    watchers[id] = { success, error, options };
    if (currentCoords) {
      setTimeout(() => success(buildPosition()), 0);
    }
    return id;
  };

  // Override clearWatch
  navigator.geolocation.clearWatch = function(id) {
    if (watchers[id]?.nativeId !== undefined) originalClear(watchers[id].nativeId);
    delete watchers[id];
  };

  // Override language if provided (safe against non-configurable properties)
  function applyLanguageOverride(lang) {
    if (!lang) {
      if (languageDescriptor) Object.defineProperty(navigator, 'language', languageDescriptor); else delete navigator.language;
      if (languagesDescriptor) Object.defineProperty(navigator, 'languages', languagesDescriptor); else delete navigator.languages;
      return;
    }
    try {
      Object.defineProperty(navigator, 'language', {
        get: function() { return lang; },
        configurable: true
      });
    } catch (e) {}
    try {
      Object.defineProperty(navigator, 'languages', {
        get: function() { return [lang]; },
        configurable: true
      });
    } catch (e) {}
  }

  // Coordinates arrive via CustomEvent — may fire multiple times on location change
  window.addEventListener('HennyCleverInit', function(event) {
    const { lat, lng, lang } = event.detail;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
    enabled = true;
    currentCoords = { lat, lng };

    // Resolve any pending callbacks from the initial wait
    pendingCallbacks.forEach(cb => {
      if (cb.success) cb.success(buildPosition());
    });
    pendingCallbacks.length = 0;

    Object.values(watchers).forEach(w => { if (w.nativeId !== undefined) { originalClear(w.nativeId); delete w.nativeId; } });
    // Notify active watchers of new position
    Object.values(watchers).forEach(w => {
      if (w.success) {
        try { w.success(buildPosition()); } catch (e) {}
      }
    });

    // Apply language override
    if (lang !== fakeLanguage) {
      fakeLanguage = lang;
      try { applyLanguageOverride(lang); } catch (e) {}
    }
  });
  window.addEventListener('HennyCleverDisable', () => {
    enabled = false; currentCoords = null; fakeLanguage = null; applyLanguageOverride(null);
    pendingCallbacks.splice(0).forEach(cb => originalGet(cb.success, cb.error));
    Object.values(watchers).forEach(w => { if (w.nativeId === undefined) w.nativeId = originalWatch(w.success, w.error, w.options); });
  });
})();
