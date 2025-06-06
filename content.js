// Global state
let isInitialized = false;
let isDisciplineModeEnabled = false;

// Store shown hints and current index globally
let shownHints = [];
let currentHintIndex = 0;
let lastProblemTitle = '';

// Function to get problem information
function getProblemInfo() {
  try {
    const titleElement = document.querySelector('.text-title-large.font-semibold.text-text-primary a');
    const contentElement = document.querySelector('.elfjS[data-track-load="description_content"]');
    
    if (!titleElement || !contentElement) {
      throw new Error('Problem elements not found. Please refresh the page.');
    }

    const problemTitle = titleElement.textContent.trim();
    const problemDescription = contentElement.innerHTML.trim();
    
    const codeElement = document.querySelector('.monaco-editor');
    let currentCode = '';
    
    if (codeElement) {
      const editor = codeElement.__monaco;
      if (editor) {
        currentCode = editor.getValue();
      }
    }

    if (!problemTitle || !problemDescription) {
      throw new Error('Problem information incomplete');
    }

    return {
      title: problemTitle,
      description: problemDescription,
      code: currentCode
    };
  } catch (error) {
    console.error('Error getting problem info:', error);
    return { error: error.message };
  }
}

// Function to get Gemini API key
function getGeminiApiKey() {
  return new Promise((resolve, reject) => {
    if (!chrome.storage || !chrome.storage.sync) {
      reject('chrome.storage.sync not available');
      return;
    }
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
        if (chrome.runtime.lastError) {
        reject('Error accessing storage: ' + chrome.runtime.lastError.message);
      } else if (!result.geminiApiKey) {
        reject('Gemini API key not set. Please set it in extension options.');
      } else {
        resolve(result.geminiApiKey);
      }
      });
  });
}

// Generic function to call Gemini API
async function callGeminiApi(prompt, apiKey) {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };
  try {
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) {
      return 'Gemini API error: ' + (data.error?.message || JSON.stringify(data));
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
  } catch (e) {
    return 'Error calling Gemini API: ' + e.message;
  }
}

// Function to analyze code with Gemini (refactored to use callGeminiApi)
async function analyzeCodeWithGemini(code, apiKey) {
  const prompt = `You are a code reviewer. Analyze the following code. Do NOT include the code in your response. Only provide a brief, accurate review (max 40 lines). If the code is correct, say so and do NOT invent errors. If there are real errors, list them with line numbers. Always include a short time/space complexity analysis. Use clear sections for Errors, Review, and Complexity.\n\nCode:\n${code}`;
  return callGeminiApi(prompt, apiKey);
}

// Function to generate test cases with Gemini
async function generateTestCases() {
  const problemInfo = getProblemInfo();
  if (problemInfo.error) {
    showHintModal('Could not fetch problem info: ' + problemInfo.error);
    return;
  }

  showHintModal('Fetching Gemini API key and generating test cases, please wait...');

  try {
    const apiKey = await getGeminiApiKey();
    showHintModal('Generating test cases with Gemini, please wait...');
    const prompt = `Generate 3-5 diverse test cases for the following LeetCode problem. Include edge cases and constraints mentioned in the description. For each test case, provide the input and the expected output.

Format the output strictly as a list of test cases, like this:

Test Cases and Expected Outputs:

Test Case 1:

Input: [input value]
Expected Output: [expected output value]

Test Case 2:

Input: [input value]
Expected Output: [expected output value]

...

DO NOT include any code, function definitions, or test execution logic. Only provide the formatted list of test cases.

Problem Title: ${problemInfo.title}\nProblem Description: ${problemInfo.description}`;
    const testCases = await callGeminiApi(prompt, apiKey);

    let modalContent = `
      <div style='font-size:1.1em;margin-bottom:10px;'><b>Test Cases for: ${problemInfo.title}</b></div>
      <div>${renderMarkdown(testCases)}</div>
    `;
    showHintModal(modalContent);

  } catch (e) {
    showHintModal('Error generating test cases: ' + e);
  }
}

// Function to suggest algorithm/data structure with Gemini
async function suggestApproach() {
  const problemInfo = getProblemInfo();
  if (problemInfo.error) {
    showHintModal('Could not fetch problem info: ' + problemInfo.error);
    return;
  }

  showHintModal('Fetching Gemini API key and suggesting approach, please wait...');

  try {
    const apiKey = await getGeminiApiKey();
    showHintModal('Suggesting approach with Gemini, please wait...');
    const prompt = `Based on the following LeetCode problem title and description, suggest relevant algorithms, data structures, or common patterns that could be used to solve it. Provide a brief explanation for each suggestion and why it's applicable. List 2-4 relevant approaches.

Problem Title: ${problemInfo.title}\nProblem Description: ${problemInfo.description}`;
    const suggestions = await callGeminiApi(prompt, apiKey);

    let modalContent = `
      <div style='font-size:1.1em;margin-bottom:10px;'><b>Suggested Approaches for: ${problemInfo.title}</b></div>
      <div>${renderMarkdown(suggestions)}</div>
    `;
    showHintModal(modalContent);

  } catch (e) {
    showHintModal('Error suggesting approach: ' + e);
  }
}

// Function to analyze code from DOM
async function analyzeCodeFromDOM() {
  const codeLines = Array.from(document.querySelectorAll('.view-line'));
  let code = codeLines.map(line => line.textContent.replace(/\u00a0|&nbsp;/g, ' ')).join('\n');
  if (!code.trim()) {
    showHintModal('Could not read code from the editor.');
    return;
  }
  showHintModal('Fetching Gemini API key and analyzing code, please wait...');
  try {
    const apiKey = await getGeminiApiKey();
    showHintModal('Analyzing code with Gemini, please wait...');
    const analysis = await analyzeCodeWithGemini(code, apiKey);
    showHintModal(renderMarkdown(analysis));
  } catch (e) {
    showHintModal('Error: ' + e);
  }
}

// Function to get dynamic hint
function getDynamicHint(problemInfo, hintIndex) {
  const exampleHints = [
    `Think about how you can represent the equivalence relationships between characters. A data structure that can group equivalent items together would be useful. Consider using the "Union Find" or "Disjoint Set Union" data structure.`,
    `Remember that when two characters are equivalent, all their equivalence relations should be transitive. How can you ensure that the smallest lexicographical character is always chosen as the representative?`,
    `Try to build a mapping from each character to its smallest equivalent character. When constructing the answer string, always use this mapping for each character in baseStr.`,
    `Optimize your solution by using path compression in your Union Find implementation to make the find operation efficient.`
  ];
  if (hintIndex < exampleHints.length) return exampleHints[hintIndex];
  return `No more hints available. Try implementing your solution!`;
}

// Function to show next hint
function showNextHint() {
  const problemInfo = getProblemInfo();
  if (problemInfo.error) {
    showHintModal('Could not fetch problem info: ' + problemInfo.error);
    return;
  }
  if (problemInfo.title !== lastProblemTitle) {
    shownHints = [];
    currentHintIndex = 0;
    lastProblemTitle = problemInfo.title;
  }
  const nextHint = getDynamicHint(problemInfo, currentHintIndex);
  if (shownHints.length <= currentHintIndex) {
    shownHints.push(nextHint);
  }
  currentHintIndex++;
  let allHintsHtml = `<div style='font-size:1.1em;margin-bottom:10px;'><b>${problemInfo.title}</b></div>`;
  shownHints.forEach((hint, idx) => {
    allHintsHtml += `<div style='margin-bottom:12px; color:#e0e0e0;'><b>Hint ${idx+1}:</b><br>${hint}</div>`;
  });
  showHintModal(allHintsHtml);
}

// Function to show hint modal
function showHintModal(hintHtml) {
  const existingModal = document.getElementById('leetcode-hint-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'leetcode-hint-modal';
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 20px; /* Position on the left side */
    transform: translateY(-50%); /* Keep vertically centered */
    width: 450px; /* Fixed portrait width */
    height: 550px; /* Fixed portrait height */
    background: rgba(26, 27, 30, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: 2000;
    font-family: 'Inter', 'Segoe UI', 'Arial', sans-serif;
    border: 1px solid rgba(45, 46, 50, 0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: box-shadow 0.2s ease; /* Only transition shadow on hover */
    resize: none; /* Disable resizing */
  `;

  // Make modal draggable
  let isDragging = false;
  let initialMouseX, initialMouseY;
  let initialModalLeft, initialModalTop; // Store initial pixel position of modal

  const header = document.createElement('div');
  header.style.cssText = `
    background: rgba(26, 27, 30, 0.95);
    padding: 16px 20px;
    color: #e0e0e0;
    font-size: 1.1em;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: grab; /* Use grab cursor */
    user-select: none;
    border-bottom: 1px solid rgba(45, 46, 50, 0.5);
    flex-shrink: 0;
  `;

  const titleContainer = document.createElement('div');
  titleContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  titleContainer.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
    LeetCode Companion
  `;

  const controlsContainer = document.createElement('div');
  controlsContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  const minimizeBtn = document.createElement('button');
  minimizeBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `;
  minimizeBtn.style.cssText = `
    background: none;
    border: none;
    color: #e0e0e0;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  `;
  minimizeBtn.onmouseover = () => { minimizeBtn.style.background = 'rgba(45, 46, 50, 0.5)'; };
  minimizeBtn.onmouseout = () => { minimizeBtn.style.background = 'none'; };

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: #e0e0e0;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  `;
  closeBtn.onmouseover = () => { closeBtn.style.background = 'rgba(45, 46, 50, 0.5)'; };
  closeBtn.onmouseout = () => { closeBtn.style.background = 'none'; };

  const content = document.createElement('div');
  content.style.cssText = `
    padding: 20px;
    color: #e0e0e0;
    font-size: 1em;
    line-height: 1.6;
    overflow-y: auto;
    flex: 1;
    background: none;
  `;
  content.innerHTML = hintHtml;

  // Drag functionality
  header.addEventListener('mousedown', dragStart);

  function dragStart(e) {
    if (e.target.closest('button')) return; 
    isDragging = true;
    initialMouseX = e.clientX;
    initialMouseY = e.clientY;

    // Get the modal's current position
    const modalRect = modal.getBoundingClientRect();
    initialModalLeft = modalRect.left;
    initialModalTop = modalRect.top;

    // Remove any existing transform to use left/top for positioning
    modal.style.transform = 'none';
    // Set the initial left/top based on the current position
    modal.style.left = `${initialModalLeft}px`;
    modal.style.top = `${initialModalTop}px`;


    header.style.cursor = 'grabbing';
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
  }

  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();

    const dx = e.clientX - initialMouseX;
    const dy = e.clientY - initialMouseY;

    // Calculate and apply the new position
    let newLeft = initialModalLeft + dx;
    let newTop = initialModalTop + dy;

    modal.style.left = `${newLeft}px`;
    modal.style.top = `${newTop}px`;

  }

  function dragEnd() {
    isDragging = false;
    header.style.cursor = 'grab';
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', dragEnd);

    // Update initial position for the next drag
    const modalRectCurrent = modal.getBoundingClientRect();
    initialModalLeft = modalRectCurrent.left;
    initialModalTop = modalRectCurrent.top;
  }


  // Minimize functionality
  let isMinimized = false;
  minimizeBtn.onclick = () => {
    isMinimized = !isMinimized;
    if (isMinimized) {
      content.style.display = 'none';
      modal.style.height = 'auto';
      minimizeBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="5 9 12 16 19 9"></polyline>
        </svg>
      `;
    } else {
      content.style.display = 'block';
      modal.style.height = '550px'; // Restore fixed height
      minimizeBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      `;
    }
  };

  closeBtn.onclick = () => {
    modal.remove();
  };

  controlsContainer.appendChild(minimizeBtn);
  controlsContainer.appendChild(closeBtn);
  header.appendChild(titleContainer);
  header.appendChild(controlsContainer);
  modal.appendChild(header);
  modal.appendChild(content);
  document.body.appendChild(modal);

  // Remove resize handle if it exists from previous versions
  const existingResizeHandle = modal.querySelector('div[style*="se-resize"]');
  if (existingResizeHandle) {
    existingResizeHandle.remove();
  }
}

// Function to render markdown
function renderMarkdown(md) {
  if (!md) return '';
  md = md.replace(/\*\*Errors:\*\*([\s\S]*?)(?=(\*\*Review:\*\*|\*\*Complexity:\*\*|$))/g, (match, content) => {
    return `<div style="background:#3a2327;border-radius:8px;padding:14px 16px 10px 16px;margin:16px 0 18px 0;color:#ffb3b3;"><b style='color:#ff5c5c;'>Errors:</b>${content}</div>`;
  });
  md = md.replace(/\*\*Review:\*\*([\s\S]*?)(?=(\*\*Errors:\*\*|\*\*Complexity:\*\*|$))/g, (match, content) => {
    return `<div style="background:#232f3a;border-radius:8px;padding:14px 16px 10px 16px;margin:16px 0 18px 0;color:#b3d1ff;"><b style='color:#4fa3ff;'>Review:</b>${content}</div>`;
  });
  md = md.replace(/\*\*Complexity:\*\*([\s\S]*?)(?=(\*\*Errors:\*\*|\*\*Review:\*\*|$))/g, (match, content) => {
    return `<div style="background:#233a2f;border-radius:8px;padding:14px 16px 10px 16px;margin:16px 0 18px 0;color:#b3ffd1;"><b style='color:#4fff8a;'>Complexity:</b>${content}</div>`;
  });
  md = md.replace(/```([a-zA-Z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="md-code-block" style="background:#181a1b;border-radius:8px;padding:12px 14px;margin:12px 0 18px 0;overflow-x:auto;font-size:1em;line-height:1.5;color:#e6e6e6;"><code>${escapeHtml(code)}</code></pre>`;
  });
  md = md.replace(/`([^`]+)`/g, '<code style="background:#23272f;padding:2px 6px;border-radius:5px;color:#e6e6e6;">$1</code>');
  md = md.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  md = md.replace(/\*([^*]+)\*/g, '<i>$1</i>');
  md = md.replace(/^\s*\*\s+/gm, '<span style="color:#7ecfff;">•</span> ');
  md = md.replace(/\n/g, '<br>');
  return md;
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[tag]));
}

// Function to add floating menu
function addFloatingMenu() {
  const existingMenu = document.getElementById('leetcode-hint-menu');
  if (existingMenu) existingMenu.remove();

  const menu = document.createElement('div');
  menu.id = 'leetcode-hint-menu';
  menu.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 1001;
    pointer-events: auto;
  `;

  const hintBtn = document.createElement('button');
  hintBtn.textContent = 'Generate Hint';
  hintBtn.style.cssText = `
    background: #1a1b1e;
    color: #e0e0e0;
    border: 1px solid #2d2e32;
    border-radius: 8px;
    padding: 10px 18px;
    font-size: 1em;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: all 0.2s ease;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  hintBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
    Generate Hint
  `;
  hintBtn.onmouseover = () => { 
    hintBtn.style.background = '#2d2e32';
    hintBtn.style.borderColor = '#3d3e42';
  };
  hintBtn.onmouseout = () => {
    hintBtn.style.background = '#1a1b1e';
    hintBtn.style.borderColor = '#2d2e32';
  };
  hintBtn.onclick = (e) => {
    e.stopPropagation();
    document.getElementById('leetcode-hint-menu')?.remove();
    showNextHint();
  };

  const analyzeBtn = document.createElement('button');
  analyzeBtn.textContent = 'Analyze Code';
  analyzeBtn.style.cssText = `
    background: #1a1b1e;
    color: #e0e0e0;
    border: 1px solid #2d2e32;
    border-radius: 8px;
    padding: 10px 18px;
    font-size: 1em;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: all 0.2s ease;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  analyzeBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
    Analyze Code
  `;
  analyzeBtn.onmouseover = () => { 
    analyzeBtn.style.background = '#2d2e32';
    analyzeBtn.style.borderColor = '#3d3e42';
  };
  analyzeBtn.onmouseout = () => { 
    analyzeBtn.style.background = '#1a1b1e';
    analyzeBtn.style.borderColor = '#2d2e32';
  };
  analyzeBtn.onclick = (e) => {
    e.stopPropagation();
    document.getElementById('leetcode-hint-menu')?.remove();
    analyzeCodeFromDOM();
  };

  const testCaseBtn = document.createElement('button');
  testCaseBtn.textContent = 'Generate Test Cases';
  testCaseBtn.style.cssText = `
    background: #1a1b1e;
    color: #e0e0e0;
    border: 1px solid #2d2e32;
    border-radius: 8px;
    padding: 10px 18px;
    font-size: 1em;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: all 0.2s ease;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
    testCaseBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
    Generate Test Cases
  `;
  testCaseBtn.onmouseover = () => { 
    testCaseBtn.style.background = '#2d2e32';
    testCaseBtn.style.borderColor = '#3d3e42';
  };
  testCaseBtn.onmouseout = () => {
    testCaseBtn.style.background = '#1a1b1e';
    testCaseBtn.style.borderColor = '#2d2e32';
  };
  testCaseBtn.onclick = (e) => {
    e.stopPropagation();
    document.getElementById('leetcode-hint-menu')?.remove();
    generateTestCases();
  };

  // Add Suggest Approach button
  const suggestBtn = document.createElement('button');
  suggestBtn.textContent = 'Suggest Approach';
  suggestBtn.style.cssText = `
    background: #1a1b1e;
    color: #e0e0e0;
    border: 1px solid #2d2e32;
    border-radius: 8px;
    padding: 10px 18px;
    font-size: 1em;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: all 0.2s ease;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  suggestBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.11-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.79 0z"></path>
      <polyline points="12 6 12 12 15 15"></polyline>
    </svg>
    Suggest Approach
  `;
  suggestBtn.onmouseover = () => {
    suggestBtn.style.background = '#2d2e32';
    suggestBtn.style.borderColor = '#3d3e42';
  };
  suggestBtn.onmouseout = () => {
    suggestBtn.style.background = '#1a1b1e';
    suggestBtn.style.borderColor = '#2d2e32';
  };
  suggestBtn.onclick = (e) => {
    e.stopPropagation();
    document.getElementById('leetcode-hint-menu')?.remove();
    suggestApproach();
  };


  menu.appendChild(hintBtn);
  menu.appendChild(analyzeBtn);
  menu.appendChild(testCaseBtn);
  menu.appendChild(suggestBtn); // Add the new button
  document.body.appendChild(menu);

  setTimeout(() => {
    document.addEventListener('click', hideMenuOnClick, { once: true });
  }, 0);
  function hideMenuOnClick(e) {
    if (!menu.contains(e.target)) menu.remove();
  }
}

// Function to add hint button
function addHintButton() {
  const existingButton = document.querySelector('#leetcode-hint-button');
  if (existingButton) {
    existingButton.remove();
  }

  const button = document.createElement('button');
  button.id = 'leetcode-hint-button';
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  `;
  
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    background-color: #1a1b1e;
    color: #e0e0e0;
    border: 1px solid #2d2e32;
    border-radius: 50%;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    user-select: none;
  `;
  
  button.addEventListener('mouseover', () => {
    button.style.transform = 'scale(1.1)';
    button.style.background = '#2d2e32';
    button.style.borderColor = '#3d3e42';
  });
  
  button.addEventListener('mouseout', () => {
    button.style.transform = 'scale(1)';
    button.style.background = '#1a1b1e';
    button.style.borderColor = '#2d2e32';
  });

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    addFloatingMenu();
  });

  document.body.appendChild(button);
}

// Function to add discipline button
function addDisciplineButton() {
  const existingButton = document.querySelector('#leetcode-discipline-button');
  if (existingButton) {
    existingButton.remove();
  }

  const button = document.createElement('button');
  button.id = 'leetcode-discipline-button';
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  `;
  
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 80px;
    width: 50px;
    height: 50px;
    background-color: ${isDisciplineModeEnabled ? '#dc3545' : '#1a1b1e'};
    color: #e0e0e0;
    border: 1px solid ${isDisciplineModeEnabled ? '#dc3545' : '#2d2e32'};
    border-radius: 50%;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    user-select: none;
  `;
  
  button.addEventListener('mouseover', () => {
    button.style.transform = 'scale(1.1)';
    button.style.background = isDisciplineModeEnabled ? '#c82333' : '#2d2e32';
    button.style.borderColor = isDisciplineModeEnabled ? '#c82333' : '#3d3e42';
  });
  
  button.addEventListener('mouseout', () => {
    button.style.transform = 'scale(1)';
    button.style.background = isDisciplineModeEnabled ? '#dc3545' : '#1a1b1e';
    button.style.borderColor = isDisciplineModeEnabled ? '#dc3545' : '#2d2e32';
  });

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDisciplineMode();
  });

  document.body.appendChild(button);
}

// Function to toggle discipline mode
function toggleDisciplineMode() {
  isDisciplineModeEnabled = !isDisciplineModeEnabled;
  
  if (isDisciplineModeEnabled) {
    applyDisciplineModeRestrictions();
  } else {
    removeDisciplineModeRestrictions();
  }
  
  chrome.storage.sync.set({ disciplineModeEnabled: isDisciplineModeEnabled });
}

// Function to apply discipline mode restrictions
function applyDisciplineModeRestrictions() {
  // Always redirect to description if on solutions/editorial
  forceRedirectToDescription();

  const editorialTab = document.querySelector('#editorial_tab')?.closest('.flexlayout__tab_button');
  const solutionsTab = document.querySelector('#solutions_tab')?.closest('.flexlayout__tab_button');
  
  if (editorialTab) editorialTab.style.display = 'none';
  if (solutionsTab) solutionsTab.style.display = 'none';
  
  const disciplineBtn = document.getElementById('leetcode-discipline-button');
  if (disciplineBtn) {
    disciplineBtn.style.backgroundColor = '#dc3545';
    disciplineBtn.title = 'Discipline Mode: ON';
  }
}

// Redirect to /description/ if on /solutions/ or /editorial/
function forceRedirectToDescription() {
  const currentUrl = window.location.href;
  if (currentUrl.includes('/solutions/') || currentUrl.includes('/editorial/')) {
    const descriptionUrl = currentUrl.replace(/\/solutions\/|\/editorial\//, '/description/');
    window.location.href = descriptionUrl;
    }
}

// Function to remove discipline mode restrictions
function removeDisciplineModeRestrictions() {
  const editorialTab = document.querySelector('#editorial_tab')?.closest('.flexlayout__tab_button');
  const solutionsTab = document.querySelector('#solutions_tab')?.closest('.flexlayout__tab_button');
  
  if (editorialTab) editorialTab.style.display = '';
  if (solutionsTab) solutionsTab.style.display = '';
  
  const disciplineBtn = document.getElementById('leetcode-discipline-button');
  if (disciplineBtn) {
    disciplineBtn.style.backgroundColor = '#007bff';
    disciplineBtn.title = 'Discipline Mode: OFF';
  }
}

// Function to check discipline mode state
function checkDisciplineModeState() {
  chrome.storage.sync.get(['disciplineModeEnabled'], (result) => {
    isDisciplineModeEnabled = result.disciplineModeEnabled || false;
  if (isDisciplineModeEnabled) {
    applyDisciplineModeRestrictions();
    }
  });
  }
  
// Add a copy button below the problem title
function addCopyProblemButton() {
  const titleContainer = document.querySelector('.text-title-large.font-semibold.text-text-primary');
  if (!titleContainer) return;

  if (document.getElementById('leetcode-copy-problem-btn')) return;

  const copyBtn = document.createElement('button');
  copyBtn.id = 'leetcode-copy-problem-btn';
  copyBtn.textContent = 'Copy';
  copyBtn.style.cssText = `
    margin-top: 10px;
    margin-bottom: 10px;
    padding: 7px 18px;
    background: #1a1b1e;
    color: #e0e0e0;
    border: 1px solid #2d2e32;
    border-radius: 6px;
    font-size: 0.9em;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  `;
  copyBtn.onmouseover = () => { 
    copyBtn.style.background = '#2d2e32';
    copyBtn.style.borderColor = '#3d3e42';
  };
  copyBtn.onmouseout = () => { 
    copyBtn.style.background = '#1a1b1e';
    copyBtn.style.borderColor = '#2d2e32';
  };

  // Add copy icon
  copyBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
    Copy
  `;

  copyBtn.onclick = async () => {
    const info = getProblemInfo();
    if (info && !info.error) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = info.description;
      const descriptionText = tempDiv.innerText.trim();
      const text = `${info.title}\n\n${descriptionText}`;
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Copied!
        `;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          `;
        }, 1200);
      } catch (e) {
        copyBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Failed!
        `;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          `;
        }, 1200);
      }
    }
  };

  titleContainer.parentNode.insertBefore(copyBtn, titleContainer.nextSibling);
}

// Initialize the extension
function initialize() {
  if (isInitialized) return;

  try {
    if (window.location.href.includes('leetcode.com/problems/')) {
      if (!chrome.runtime?.id) {
        throw new Error('Extension context invalid');
      }

      if (document.readyState === 'complete') {
        addHintButton();
        addDisciplineButton();
        checkDisciplineModeState();
        addCopyProblemButton();
        isInitialized = true;
      } else {
        window.addEventListener('load', () => {
          addHintButton();
          addDisciplineButton();
          checkDisciplineModeState();
          addCopyProblemButton();
          isInitialized = true;
        });
      }
    }
  } catch (error) {
    console.log('Error initializing:', error);
  }
}

// Handle page navigation
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    initialize();
    setTimeout(addCopyProblemButton, 500); // Ensure button is added after navigation
  }
});

observer.observe(document, { subtree: true, childList: true });

// Initial setup
initialize(); 
setTimeout(addCopyProblemButton, 500); 