document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('saveButton');
  const statusMessage = document.getElementById('statusMessage');

  // Load saved API key
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
  });

  // Save API key
  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      statusMessage.textContent = 'Please enter an API key';
      return;
    }

    chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
      statusMessage.textContent = 'Settings saved successfully!';
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 3000);
    });
  });
}); 