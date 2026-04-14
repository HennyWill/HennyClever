// Content script runs in ISOLATED world, can access chrome.storage
// Injects override script once, then dispatches coords (may run multiple times)

(async function() {
  // Inject override script only once per page
  if (!window.__hennyCleverInjected) {
    window.__hennyCleverInjected = true;

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    (document.head || document.documentElement).appendChild(script);

    // Wait for inject.js to load before dispatching
    await new Promise(resolve => {
      script.onload = () => { script.remove(); resolve(); };
      script.onerror = () => resolve();
    });
  }

  // Always dispatch latest coords — may re-run on location change
  try {
    const result = await chrome.storage.local.get(['selectedCapital', 'selectedLanguage', 'spoofingEnabled']);

    if (result.spoofingEnabled === false) return;
    if (!result.selectedCapital) return;

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
  } catch (e) {
    // Storage read failed — inject.js still blocks real geolocation
  }
})();
