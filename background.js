// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'applySpoof') {
    applySpoofToMatchingTabs();
    updateBadge();
  } else if (message.action === 'disableSpoof') {
    chrome.action.setBadgeText({ text: '' });
  } else if (message.action === 'getCountryFlag') {
    chrome.storage.local.get('selectedCountry', (data) => {
      sendResponse({ country: data.selectedCountry || null });
    });
    return true;
  }
});

// Listen for tab updates — inject on Google and whitelisted sites
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!tab.url || changeInfo.status !== 'complete') return;

  const data = await chrome.storage.local.get(['whitelist', 'spoofingEnabled']);
  const whitelist = data.whitelist || [];
  const enabled = data.spoofingEnabled !== false;

  if (!enabled) return;

  if (shouldInject(tab.url, whitelist)) {
    injectContentScript(tabId);
  }
});

// Determine if we should inject into this URL
function shouldInject(url, whitelist) {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;

    // Always inject on Google
    if (domain === 'www.google.com' || domain.endsWith('.google.com')) {
      return true;
    }

    // Inject on whitelisted domains
    if (whitelist.length > 0) {
      return whitelist.some(wl => domain === wl || domain.endsWith('.' + wl));
    }

    return false;
  } catch (e) {
    return false;
  }
}

// Update badge with country flag
async function updateBadge() {
  const data = await chrome.storage.local.get('selectedCountry');
  if (data.selectedCountry) {
    // Use first letter pair as badge (flag emoji too wide for badge)
    const country = data.selectedCountry;
    chrome.action.setBadgeText({ text: country.slice(0, 2).toUpperCase() });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
  }
}

// Apply spoof to all matching open tabs
async function applySpoofToMatchingTabs() {
  const data = await chrome.storage.local.get('whitelist');
  const whitelist = data.whitelist || [];

  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.url && shouldInject(tab.url, whitelist)) {
      injectContentScript(tab.id);
    }
  }
}

// Inject content script into a tab
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-script.js']
    });
  } catch (e) {
    // Tab may not be injectable (chrome://, etc.)
  }
}

// Initial injection and badge update on extension load
(async () => {
  const data = await chrome.storage.local.get(['spoofingEnabled', 'whitelist']);
  if (data.spoofingEnabled === false) return;

  const whitelist = data.whitelist || [];
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.url && shouldInject(tab.url, whitelist)) {
      injectContentScript(tab.id);
    }
  }
  updateBadge();
})();
