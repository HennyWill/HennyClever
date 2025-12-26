// Content script runs in ISOLATED world, can access chrome.storage
// Pass coordinates to MAIN world via custom event and load external script
(async function() {
  try {
    const result = await chrome.storage.local.get('selectedCapital');
    if (result.selectedCapital) {
      let coords;
      try {
        coords = JSON.parse(result.selectedCapital);
      } catch (e) {
        console.error('[HennyClever] Could not parse selectedCapital:', e);
        return;
      }

      if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
        // Load the external inject.js file first
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('inject.js');
        script.onload = function() {
          // After script loads, dispatch event with coordinates
          window.dispatchEvent(new CustomEvent('HennyCleverInit', {
            detail: { lat: coords.lat, lng: coords.lng }
          }));
          this.remove();
        };
        (document.head || document.documentElement).appendChild(script);

        console.log('[HennyClever] Content script: Injected geolocation override for:', coords);
      } else {
        console.error('[HennyClever] Invalid coordinates:', coords);
      }
    } else {
      console.log('[HennyClever] No location selected yet');
    }
  } catch (e) {
    console.error('[HennyClever] Error:', e);
  }
})(); 