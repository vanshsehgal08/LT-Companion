// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openHintPopup') {
    chrome.action.openPopup();
  }
});

// Initialize storage with default values
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (!result.geminiApiKey) {
      chrome.storage.sync.set({
        geminiApiKey: ''
      });
    }
  });
}); 