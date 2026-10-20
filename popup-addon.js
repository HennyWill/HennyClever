// ========== NEW FEATURES ADDON ==========
// This file extends popup.js with new features

// Country flag emojis mapping
const countryFlags = {
  'Afghanistan': '🇦🇫', 'Albania': '🇦🇱', 'Algeria': '🇩🇿', 'Andorra': '🇦🇩', 'Angola': '🇦🇴',
  'Argentina': '🇦🇷', 'Armenia': '🇦🇲', 'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Azerbaijan': '🇦🇿',
  'Bahamas': '🇧🇸', 'Bahrain': '🇧🇭', 'Bangladesh': '🇧🇩', 'Belarus': '🇧🇾', 'Belgium': '🇧🇪',
  'Brazil': '🇧🇷', 'Bulgaria': '🇧🇬', 'Cambodia': '🇰🇭', 'Cameroon': '🇨🇲', 'Canada': '🇨🇦',
  'Chile': '🇨🇱', 'China': '🇨🇳', 'Colombia': '🇨🇴', 'Croatia': '🇭🇷', 'Cuba': '🇨🇺',
  'Cyprus': '🇨🇾', 'Czech Republic': '🇨🇿', 'Denmark': '🇩🇰', 'Egypt': '🇪🇬', 'Estonia': '🇪🇪',
  'Ethiopia': '🇪🇹', 'Finland': '🇫🇮', 'France': '🇫🇷', 'Georgia': '🇬🇪', 'Germany': '🇩🇪',
  'Greece': '🇬🇷', 'Hungary': '🇭🇺', 'Iceland': '🇮🇸', 'India': '🇮🇳', 'Indonesia': '🇮🇩',
  'Iran': '🇮🇷', 'Iraq': '🇮🇶', 'Ireland': '🇮🇪', 'Israel': '🇮🇱', 'Italy': '🇮🇹',
  'Jamaica': '🇯🇲', 'Japan': '🇯🇵', 'Jordan': '🇯🇴', 'Kazakhstan': '🇰🇿', 'Kenya': '🇰🇪',
  'Kuwait': '🇰🇼', 'Latvia': '🇱🇻', 'Lebanon': '🇱🇧', 'Lithuania': '🇱🇹', 'Malaysia': '🇲🇾',
  'Mexico': '🇲🇽', 'Morocco': '🇲🇦', 'Netherlands': '🇳🇱', 'New Zealand': '🇳🇿', 'Nigeria': '🇳🇬',
  'Norway': '🇳🇴', 'Pakistan': '🇵🇰', 'Peru': '🇵🇪', 'Philippines': '🇵🇭', 'Poland': '🇵🇱',
  'Portugal': '🇵🇹', 'Qatar': '🇶🇦', 'Romania': '🇷🇴', 'russia': '💩', 'Saudi Arabia': '🇸🇦',
  'Serbia': '🇷🇸', 'Singapore': '🇸🇬', 'Slovakia': '🇸🇰', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷',
  'Spain': '🇪🇸', 'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Taiwan': '🇹🇼', 'Thailand': '🇹🇭',
  'Turkey': '🇹🇷', 'Ukraine': '🇺🇦', 'United Arab Emirates': '🇦🇪', 'United Kingdom': '🇬🇧',
  'United States': '🇺🇸', 'Uruguay': '🇺🇾', 'Venezuela': '🇻🇪', 'Vietnam': '🇻🇳'
};

// State
let favorites = [];
let locationHistory = [];
let whitelist = [];
let dropdownSelectedIndex = -1;

// DOM elements
const enableToggle = document.getElementById('enableToggle');
const statusIndicator = document.getElementById('statusIndicator');
const historySection = document.getElementById('historySection');
const historyItems = document.getElementById('historyItems');
const whitelistInput = document.getElementById('whitelistInput');
const addWhitelistBtn = document.getElementById('addWhitelistBtn');
const whitelistList = document.getElementById('whitelistList');
const resetLocationBtn = document.getElementById('resetLocationBtn');
const allSitesToggle = document.getElementById('allSitesToggle');

// Domain validation
function isValidDomain(str) {
  return /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(str);
}

// Initialize
async function initNewFeatures() {
  const data = await chrome.storage.local.get(['favorites', 'locationHistory', 'whitelist', 'spoofingEnabled', 'allSitesMode']);

  favorites = data.favorites || [];
  locationHistory = data.locationHistory || [];
  whitelist = data.whitelist || [];

  if (data.spoofingEnabled !== undefined) {
    enableToggle.checked = data.spoofingEnabled;
    updateStatusIndicator(data.spoofingEnabled);
  }

  if (allSitesToggle) {
    allSitesToggle.checked = data.allSitesMode === true;
  }

  updateStatusIndicator(enableToggle.checked);
  renderHistory();
  renderWhitelist();
  setupEventListeners();
}

function setupEventListeners() {
  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === tabName + '-tab') content.classList.add('active');
      });
    });
  });

  // Toggle
  enableToggle.addEventListener('change', async () => {
    const enabled = enableToggle.checked;
    await chrome.storage.local.set({ spoofingEnabled: enabled });
    updateStatusIndicator(enabled);
    if (enabled) {
      await chrome.runtime.sendMessage({ action: 'applySpoof' });
    } else {
      await chrome.runtime.sendMessage({ action: 'disableSpoof' });
      showToast('Reload open tabs to restore real location');
    }
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', handleKeyboard);

  // Whitelist
  addWhitelistBtn.addEventListener('click', addWhitelistDomain);
  whitelistInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addWhitelistBtn.click();
  });

  // Reset location
  if (resetLocationBtn) {
    resetLocationBtn.addEventListener('click', resetLocation);
  }

  // All Sites mode toggle
  if (allSitesToggle) {
    allSitesToggle.addEventListener('change', async () => {
      await chrome.storage.local.set({ allSitesMode: allSitesToggle.checked });
      await chrome.runtime.sendMessage({ action: 'whitelistChanged' });
      showToast(allSitesToggle.checked
        ? 'Accept-Language header enabled for all whitelisted sites'
        : 'Accept-Language header disabled');
    });
  }
}

function updateStatusIndicator(enabled) {
  const active = enabled && !!selectedCapital;
  statusIndicator.style.background = active ? '#39815b' : '#a3aaa5';
  statusIndicator.title = active ? 'Location override enabled' : 'Location override inactive';
}

// Toast notification
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Reset to real location
async function resetLocation() {
  await saveQueue;
  await chrome.storage.local.remove([
    'selectedCapital', 'selectedLanguage', 'selectedCountry',
    'selectedCountryCode'
  ]);
  await chrome.runtime.sendMessage({ action: 'disableSpoof' });

  selectedCapital = null;
  searchInput.value = '';
  languageSelect.innerHTML = '<option value="">Auto (browser default)</option>';
  currentSelection.classList.remove('show');
  currentLocationText.textContent = 'None';
  saveBtn.disabled = true;
  document.getElementById('saveStatus').textContent = 'Using browser location after page reload.';
  statusIndicator.style.background = '#a3aaa5';

  showToast('Location reset. Reload tabs to use real location.');
}

function handleKeyboard(e) {
  if (e.key === 'Escape') { dropdown.classList.remove('show'); searchInput.setAttribute('aria-expanded', 'false'); return; }
  const items = dropdown.querySelectorAll('.dropdown-item');
  if (!dropdown.classList.contains('show') || items.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    dropdownSelectedIndex = Math.min(dropdownSelectedIndex + 1, items.length - 1);
    updateDropdownSelection(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    dropdownSelectedIndex = Math.max(dropdownSelectedIndex - 1, 0);
    updateDropdownSelection(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (dropdownSelectedIndex >= 0 || items.length === 1) {
      const countryName = items[Math.max(0, dropdownSelectedIndex)].getAttribute('data-country');
      selectCountry(countryName);
    }
  }
}

function updateDropdownSelection(items) {
  items.forEach((item, index) => {
    if (index === dropdownSelectedIndex) {
      item.classList.add('selected');
      searchInput.setAttribute('aria-activedescendant', item.id);
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

async function addToHistory(capital) {
  const historyItem = {
    country: capital.country,
    name: capital.name,
    lat: capital.lat,
    lng: capital.lng,
    timestamp: Date.now()
  };

  locationHistory = locationHistory.filter(item => item.country !== capital.country);
  locationHistory.unshift(historyItem);
  locationHistory = locationHistory.slice(0, 5);

  await chrome.storage.local.set({ locationHistory });
  renderHistory();
}

async function toggleFavorite(country) {
  const index = favorites.indexOf(country);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(country);
  }
  await chrome.storage.local.set({ favorites });
  renderHistory();
  // Re-render dropdown if open to update star states
  if (dropdown.classList.contains('show')) {
    handleSearch();
  }
}

function renderHistory() {
  const favoriteItems = locationHistory.filter(item => favorites.includes(item.country));
  const recentItems = locationHistory.filter(item => !favorites.includes(item.country));
  const savedFavorites = capitals.filter(c => favorites.includes(c.country) && !locationHistory.some(h => h.country === c.country));
  const allItems = [...savedFavorites, ...favoriteItems, ...recentItems];

  if (allItems.length === 0) {
    historySection.style.display = 'none';
    return;
  }

  historySection.style.display = 'block';
  historyItems.innerHTML = '';

  allItems.forEach(item => {
    const flag = countryFlags[item.country] || '🌍';
    const isFav = favorites.includes(item.country);

    const row = document.createElement('div');
    row.className = 'history-item';
    row.dataset.country = item.country;

    const content = document.createElement('div');
    content.className = 'history-item-content';

    const flagSpan = document.createElement('span');
    flagSpan.className = 'history-flag';
    flagSpan.textContent = flag;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'history-name';
    nameSpan.textContent = item.country;

    content.appendChild(flagSpan);
    content.appendChild(nameSpan);

    const favBtn = document.createElement('button');
    favBtn.className = 'favorite-btn' + (isFav ? ' active' : '');
    favBtn.textContent = isFav ? '★' : '☆';
    favBtn.setAttribute('aria-label', 'Favorite ' + item.country);
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(item.country);
    });

    row.appendChild(content);
    row.appendChild(favBtn);

    row.addEventListener('click', (e) => {
      if (!e.target.classList.contains('favorite-btn')) {
        selectCountry(item.country);
      }
    });

    historyItems.appendChild(row);
  });
}

async function addWhitelistDomain() {
  const domain = whitelistInput.value.trim().toLowerCase();

  if (!domain) return;

  if (!isValidDomain(domain)) {
    showToast('Invalid domain format. Example: example.com');
    return;
  }

  if (whitelist.includes(domain)) {
    showToast('Domain already in whitelist');
    return;
  }

  // Request host permission for this domain
  const granted = await chrome.permissions.request({
    origins: ['https://' + domain + '/*', 'http://' + domain + '/*']
  });

  if (!granted) {
    showToast('Permission denied for ' + domain);
    return;
  }

  whitelist.push(domain);
  await chrome.storage.local.set({ whitelist });
  whitelistInput.value = '';
  renderWhitelist();

  // applySpoof injects content scripts + refreshes dNR rules (Accept-Language for new domain)
  await chrome.runtime.sendMessage({ action: 'applySpoof' });
  showToast('Spoofing enabled for ' + domain);
}

function renderWhitelist() {
  whitelistList.innerHTML = '';

  if (whitelist.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-whitelist';
    empty.textContent = 'No domains added';
    whitelistList.appendChild(empty);
    return;
  }

  whitelist.forEach(domain => {
    const item = document.createElement('div');
    item.className = 'whitelist-item';

    const span = document.createElement('span');
    span.textContent = domain;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', async () => {
      whitelist = whitelist.filter(d => d !== domain);
      await chrome.storage.local.set({ whitelist });
      chrome.permissions.remove({
        origins: ['https://' + domain + '/*', 'http://' + domain + '/*']
      });
      await chrome.runtime.sendMessage({ action: 'whitelistChanged' });
      renderWhitelist();
    });

    item.appendChild(span);
    item.appendChild(removeBtn);
    whitelistList.appendChild(item);
  });
}

const originalSave = handleSave;
let saveQueue = Promise.resolve();
handleSave = function() {
  saveQueue = saveQueue.then(async () => {
    if (!selectedCapital) return;
    await originalSave();
    await addToHistory(selectedCapital);
  }).catch(() => showToast('Unable to save location. Please retry.'));
  return saveQueue;
};

// Init on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNewFeatures);
} else {
  initNewFeatures();
}
