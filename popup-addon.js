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

// Initialize
async function initNewFeatures() {
  const data = await chrome.storage.local.get(['favorites', 'locationHistory', 'whitelist', 'spoofingEnabled']);

  favorites = data.favorites || [];
  locationHistory = data.locationHistory || [];
  whitelist = data.whitelist || [];

  if (data.spoofingEnabled !== undefined) {
    enableToggle.checked = data.spoofingEnabled;
    updateStatusIndicator(data.spoofingEnabled);
  }

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
    }
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', handleKeyboard);

  // Whitelist
  addWhitelistBtn.addEventListener('click', addWhitelistDomain);
  whitelistInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addWhitelistBtn.click();
  });
}

function updateStatusIndicator(enabled) {
  statusIndicator.style.background = enabled ? '#48bb78' : '#cbd5e0';
}

function handleKeyboard(e) {
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
    if (dropdownSelectedIndex >= 0) {
      const countryName = items[dropdownSelectedIndex].getAttribute('data-country');
      selectCountry(countryName);
    }
  }
}

function updateDropdownSelection(items) {
  items.forEach((item, index) => {
    if (index === dropdownSelectedIndex) {
      item.classList.add('selected');
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
}

function renderHistory() {
  const favoriteItems = locationHistory.filter(item => favorites.includes(item.country));
  const recentItems = locationHistory.filter(item => !favorites.includes(item.country));
  const allItems = [...favoriteItems, ...recentItems];

  if (allItems.length === 0) {
    historySection.style.display = 'none';
    return;
  }

  historySection.style.display = 'block';
  historyItems.innerHTML = allItems.map(item => {
    const flag = countryFlags[item.country] || '🌍';
    const isFav = favorites.includes(item.country);
    return '<div class="history-item" data-country="' + item.country + '">' +
      '<div class="history-item-content">' +
      '<span class="history-flag">' + flag + '</span>' +
      '<span class="history-name">' + item.country + '</span>' +
      '</div>' +
      '<button class="favorite-btn ' + (isFav ? 'active' : '') + '" data-country="' + item.country + '">' +
      (isFav ? '⭐' : '☆') +
      '</button></div>';
  }).join('');

  historyItems.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('favorite-btn')) {
        selectCountry(item.dataset.country);
      }
    });
  });

  historyItems.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(btn.dataset.country);
    });
  });
}

async function addWhitelistDomain() {
  const domain = whitelistInput.value.trim();
  if (domain && !whitelist.includes(domain)) {
    whitelist.push(domain);
    await chrome.storage.local.set({ whitelist });
    whitelistInput.value = '';
    renderWhitelist();
  }
}

function renderWhitelist() {
  if (whitelist.length === 0) {
    whitelistList.innerHTML = '<div style="color: #a0aec0; padding: 8px;">No domains added</div>';
    return;
  }

  whitelistList.innerHTML = whitelist.map(domain =>
    '<div class="whitelist-item"><span>' + domain + '</span>' +
    '<button class="remove-btn" data-domain="' + domain + '">Remove</button></div>'
  ).join('');

  whitelistList.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      whitelist = whitelist.filter(d => d !== btn.dataset.domain);
      await chrome.storage.local.set({ whitelist });
      renderWhitelist();
    });
  });
}

// Enhance save with animation
const originalSave = handleSave;
handleSave = async function() {
  if (!selectedCapital) return;

  saveBtn.textContent = '✓ Saved!';
  saveBtn.classList.add('save-success');

  await addToHistory(selectedCapital);
  await originalSave();

  setTimeout(() => {
    saveBtn.textContent = 'Save Location';
    saveBtn.classList.remove('save-success');
  }, 500);
};

// Init on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNewFeatures);
} else {
  initNewFeatures();
}
