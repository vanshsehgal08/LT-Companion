document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('geminiApiKey');
  const saveButton = document.getElementById('saveButton');
  const statusMessage = document.getElementById('status-message');

  // Load saved API key
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
  });

  // Save API key
  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
        statusMessage.textContent = 'API Key saved successfully!';
        statusMessage.style.color = '#4fff8a'; // Green color for success
        setTimeout(() => { statusMessage.textContent = ''; }, 3000);
      });
    } else {
      statusMessage.textContent = 'Please enter your API key.';
      statusMessage.style.color = '#ff5c5c'; // Red color for error
    }
  });
}); 