// Clear all extension storage for clean screenshots
chrome.storage.local.clear(() => {
  console.log('All storage cleared!');
  console.log('Extension is now in fresh state for screenshots.');
});
