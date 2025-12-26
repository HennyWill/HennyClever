// Country flag mapping
const countryFlags = {
  'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
  'Germany': '🇩🇪', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Japan': '🇯🇵',
  'China': '🇨🇳', 'India': '🇮🇳', 'Brazil': '🇧🇷', 'Mexico': '🇲🇽', 'russia': '💩',
  'South Korea': '🇰🇷', 'Netherlands': '🇳🇱', 'Poland': '🇵🇱', 'Ukraine': '🇺🇦',
  'Turkey': '🇹🇷', 'Argentina': '🇦🇷', 'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Finland': '🇫🇮'
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'applySpoof') {
    applySpoofToGoogleTabs();
    updateBadge();
  } else if (message.action === 'disableSpoof') {
    chrome.action.setBadgeText({ text: '' });
  }
});

// Listen for tab updates with whitelist check
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!tab.url || changeInfo.status !== 'complete') return;

  const data = await chrome.storage.local.get(['whitelist', 'spoofingEnabled']);
  const whitelist = data.whitelist || [];
  const enabled = data.spoofingEnabled !== false;

  if (!enabled) return;

  // Check whitelist
  if (whitelist.length > 0) {
    const url = new URL(tab.url);
    const domain = url.hostname;
    const shouldSpoof = whitelist.some(wl => domain.includes(wl));
    if (!shouldSpoof) return;
  }

  // Default: spoof on google.com
  if (tab.url.startsWith('https://www.google.com/')) {
    injectContentScript(tabId);
  } else if (whitelist.length > 0) {
    // Also inject on whitelisted sites
    injectContentScript(tabId);
  }
});

// Update badge with country flag
async function updateBadge() {
  const data = await chrome.storage.local.get('selectedCapital');
  if (data.selectedCapital) {
    try {
      const coords = JSON.parse(data.selectedCapital);
      // You can store country name separately for badge
      const countryData = await chrome.storage.local.get('selectedCountry');
      if (countryData.selectedCountry) {
        const flag = countryFlags[countryData.selectedCountry] || '🌍';
        chrome.action.setBadgeText({ text: flag });
        chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
      }
    } catch (e) {
      console.error('Error updating badge:', e);
    }
  }
}

// Helper function to apply spoof to all Google tabs
async function applySpoofToGoogleTabs() {
  const tabs = await chrome.tabs.query({ url: 'https://www.google.com/*' });
  for (const tab of tabs) {
    await injectContentScript(tab.id);
  }
}

// Helper function to inject content script
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-script.js']
    });
    console.log('Content script injected into tab:', tabId);
  } catch (error) {
    console.error('Failed to inject content script:', error);
  }
}

// Initial injection and badge update
chrome.tabs.query({ url: 'https://www.google.com/*' }, (tabs) => {
  tabs.forEach(tab => injectContentScript(tab.id));
});
updateBadge(); 