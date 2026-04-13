// Content script runs in ISOLATED world, can access chrome.storage
// Injects override script FIRST (synchronously), then sends coordinates async

(function() {
  // Guard against repeated injection
  if (window.__hennyCleverInjected) return;
  window.__hennyCleverInjected = true;

  // Step 1: Inject the override script IMMEDIATELY (before any async)
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  (document.head || document.documentElement).appendChild(script);

  // Step 2: Read coordinates from storage (async) and send to inject.js
  script.onload = async function() {
    this.remove();

    try {
      const result = await chrome.storage.local.get(['selectedCapital', 'selectedLanguage', 'spoofingEnabled']);

      if (result.spoofingEnabled === false) return;

      if (result.selectedCapital) {
        let coords;
        try {
          coords = JSON.parse(result.selectedCapital);
        } catch (e) {
          return;
        }

        if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
          window.dispatchEvent(new CustomEvent('HennyCleverInit', {
            detail: {
              lat: coords.lat,
              lng: coords.lng,
              lang: result.selectedLanguage || null
            }
          }));
        }
      }
    } catch (e) {
      // Storage read failed — inject.js still blocks real geolocation
    }
  };
})();
