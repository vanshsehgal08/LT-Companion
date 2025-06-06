document.addEventListener('DOMContentLoaded', () => {
  const hintContent = document.getElementById('hint-content');
  const statusMessage = document.getElementById('status-message');

  let problemInfo = null;
  let retryCount = 0;
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  // Function to get problem information with retry
  async function getProblemInfoWithRetry() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (!currentTab) {
          reject(new Error('No active tab found'));
          return;
        }

        if (!currentTab.url.includes('leetcode.com/problems/')) {
          reject(new Error('Not on a LeetCode problem page'));
          return;
        }

        function tryGetProblemInfo() {
          console.log('Attempting to get problem info, attempt:', retryCount + 1);
          chrome.tabs.sendMessage(currentTab.id, { action: 'getProblemInfo' }, (response) => {
            if (chrome.runtime.lastError) {
              console.log('Error getting problem info:', chrome.runtime.lastError);
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`Retrying in ${RETRY_DELAY}ms...`);
                setTimeout(tryGetProblemInfo, RETRY_DELAY);
              } else {
                reject(new Error('Could not connect to the page. Please refresh the LeetCode page.'));
              }
              return;
            }

            if (response?.error) {
              console.log('Problem info error:', response.error);
              reject(new Error(response.error));
              return;
            }

            if (!response?.title || !response?.description) {
              console.log('Incomplete problem info:', response);
              reject(new Error('Could not load problem information. Please refresh the page.'));
              return;
            }

            console.log('Successfully got problem info:', response);
            resolve(response);
          });
        }

        tryGetProblemInfo();
      });
    });
  }

  // Initialize popup
  async function initializePopup() {
    try {
      updateStatus('Loading problem information...');
      retryCount = 0; // Reset retry count
      problemInfo = await getProblemInfoWithRetry();
      updateStatus('Problem information loaded');
      generateHint();
    } catch (error) {
      console.error('Error initializing popup:', error);
      updateStatus(error.message);
      hintContent.innerHTML = `
        <div class="error-message">
          <p>${error.message}</p>
          <button id="retryButton" class="retry-button">Retry</button>
        </div>
      `;
      
      document.getElementById('retryButton')?.addEventListener('click', () => {
        retryCount = 0;
        initializePopup();
      });
    }
  }

  // Generate hint
  async function generateHint() {
    if (!problemInfo) {
      updateStatus('Please wait for problem information to load');
      return;
    }

    updateStatus('Generating hint...');
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Please set your Gemini API key in the extension settings');
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful assistant that provides hints for LeetCode problems. Provide a progressive hint without revealing the full solution. Each hint should build upon the previous one, guiding the user step by step.

Problem: ${problemInfo.title}

Description: ${problemInfo.description}

Current Code: ${problemInfo.code}

Provide a hint that:
1. Is specific to the problem
2. Guides the user towards the solution
3. Doesn't reveal the complete solution
4. Is clear and concise`
            }]
          }]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const hint = data.candidates[0].content.parts[0].text;
      displayHint(hint);
      updateStatus('Hint generated successfully');
    } catch (error) {
      console.error('Error generating hint:', error);
      updateStatus(error.message);
      hintContent.innerHTML = `
        <div class="error-message">
          <p>${error.message}</p>
          <button id="retryButton" class="retry-button">Retry</button>
        </div>
      `;
      
      document.getElementById('retryButton')?.addEventListener('click', () => {
        generateHint();
      });
    }
  }

  // Display hint in the UI
  function displayHint(hint) {
    hintContent.innerHTML = `
      <div class="hint-section">
        <div class="hint-content">${formatHintContent(hint)}</div>
        <button id="nextHintButton" class="next-hint-button">Next Hint</button>
      </div>
    `;
    
    document.getElementById('nextHintButton')?.addEventListener('click', () => {
      generateHint();
    });
  }

  // Format hint content with proper styling
  function formatHintContent(content) {
    // Replace code blocks with styled spans
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Split into paragraphs and format
    const paragraphs = content.split('\n\n');
    return paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
  }

  // Update status message
  function updateStatus(message) {
    statusMessage.textContent = message;
  }

  // Get API key from storage
  async function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['geminiApiKey'], (result) => {
        resolve(result.geminiApiKey);
      });
    });
  }

  // Initialize the popup
  initializePopup();
}); 