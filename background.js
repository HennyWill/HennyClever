// Rule IDs for dynamic declarativeNetRequest rules
const RULE_ID_GOOGLE_SERP = 1;
const RULE_ID_ACCEPT_LANG = 2;

// ============================================================
// UULE v2 encoder — regenerated fresh on every rule update
// ============================================================
function generateUule(lat, lng) {
  const latE7 = Math.round(lat * 1e7);
  const lngE7 = Math.round(lng * 1e7);
  const timestamp = Date.now() * 1000;

  const plaintext =
    'role: 1\n' +
    'producer: 12\n' +
    'provenance: 6\n' +
    'timestamp: ' + timestamp + '\n' +
    'latlng {\n' +
    '  latitude_e7: ' + latE7 + '\n' +
    '  longitude_e7: ' + lngE7 + '\n' +
    '}\n' +
    'radius: -1\n';

  return 'a+' + btoa(plaintext);
}

// ============================================================
// Message listener
// ============================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'applySpoof') {
    applySpoofToMatchingTabs();
    updateBadge();
    refreshRulesFromStorage();
  } else if (message.action === 'disableSpoof') {
    chrome.action.setBadgeText({ text: '' });
    removeAllRules();
  } else if (message.action === 'whitelistChanged') {
    refreshRulesFromStorage();
  }
});

// ============================================================
// Tab update listener — inject on Google and whitelisted sites
// ============================================================
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

    if (domain === 'www.google.com' || domain.endsWith('.google.com')) {
      return true;
    }

    if (whitelist.length > 0) {
      return whitelist.some(wl => domain === wl || domain.endsWith('.' + wl));
    }

    return false;
  } catch (e) {
    return false;
  }
}

// Update badge with country code
async function updateBadge() {
  const data = await chrome.storage.local.get('selectedCountry');
  if (data.selectedCountry) {
    const country = data.selectedCountry;
    chrome.action.setBadgeText({ text: country.slice(0, 2).toUpperCase() });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
  } else {
    chrome.action.setBadgeText({ text: '' });
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

// ============================================================
// declarativeNetRequest Rule Manager
// ============================================================

function buildGoogleSerpRule(countryCode, language, uule) {
  const params = [];
  if (countryCode) params.push({ key: 'gl', value: countryCode });
  if (language) params.push({ key: 'hl', value: language });
  if (uule) params.push({ key: 'uule', value: uule });

  if (params.length === 0) return null;

  return {
    id: RULE_ID_GOOGLE_SERP,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        transform: {
          queryTransform: {
            addOrReplaceParams: params
          }
        }
      }
    },
    condition: {
      regexFilter: '^https?://(www\\.)?google\\.[a-z.]+/search',
      resourceTypes: ['main_frame']
    }
  };
}

function buildAcceptLanguageRule(countryCode, language, whitelist) {
  if (!language) return null;

  const langValue = countryCode
    ? `${language}-${countryCode.toUpperCase()},${language};q=0.9`
    : language;

  const domains = ['google.com', ...whitelist];

  return {
    id: RULE_ID_ACCEPT_LANG,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [{
        header: 'Accept-Language',
        operation: 'set',
        value: langValue
      }]
    },
    condition: {
      requestDomains: domains,
      resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest']
    }
  };
}

// Refresh dNR rules from current storage state
async function refreshRulesFromStorage() {
  const data = await chrome.storage.local.get([
    'selectedCapital', 'selectedCountryCode', 'selectedLanguage',
    'whitelist', 'allSitesMode', 'spoofingEnabled'
  ]);

  if (data.spoofingEnabled === false || !data.selectedCapital) {
    await removeAllRules();
    return;
  }

  // Generate fresh UULE from stored lat/lng (not stale saved one)
  let uule = null;
  try {
    const coords = JSON.parse(data.selectedCapital);
    if (typeof coords.lat === 'number' && typeof coords.lng === 'number') {
      uule = generateUule(coords.lat, coords.lng);
    }
  } catch (e) {}

  const country = data.selectedCountryCode || null;
  const language = data.selectedLanguage || null;
  const whitelist = data.whitelist || [];
  const allSitesMode = data.allSitesMode === true;

  const addRules = [];
  const removeRuleIds = [RULE_ID_GOOGLE_SERP, RULE_ID_ACCEPT_LANG];

  const serpRule = buildGoogleSerpRule(country, language, uule);
  if (serpRule) addRules.push(serpRule);

  if (allSitesMode) {
    const langRule = buildAcceptLanguageRule(country, language, whitelist);
    if (langRule) addRules.push(langRule);
  }

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules
    });
  } catch (e) {
    // Rule update failed — likely missing host permission
  }
}

async function removeAllRules() {
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE_ID_GOOGLE_SERP, RULE_ID_ACCEPT_LANG]
    });
  } catch (e) {}
}

// ============================================================
// Startup initialization — triggered by browser/extension events
// ============================================================
async function initState() {
  const data = await chrome.storage.local.get(['spoofingEnabled', 'whitelist', 'selectedCapital']);

  if (data.spoofingEnabled === false) {
    await removeAllRules();
    return;
  }

  if (data.selectedCapital) {
    await refreshRulesFromStorage();
  }

  const whitelist = data.whitelist || [];
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.url && shouldInject(tab.url, whitelist)) {
      injectContentScript(tab.id);
    }
  }
  updateBadge();
}

chrome.runtime.onInstalled.addListener(initState);
chrome.runtime.onStartup.addListener(initState);
