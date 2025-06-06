# LeetCode Companion - Deployment Guide

This guide explains how to deploy and set up the LeetCode Companion Chrome extension.

## Prerequisites

1.  Google Chrome browser.
2.  A Google account to obtain a Gemini API key.

## Step 1: Obtain a Gemini API Key

The LeetCode Companion extension uses Google's Gemini API for features like code analysis, test case generation, and approach suggestions. You need an API key to use these features.

You can obtain a Gemini API key from either Google AI Studio or Google Cloud Console.

### Option 1: Google AI Studio (Recommended for personal use)

1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Sign in with your Google account.
3.  Navigate to "Get API key" in the left sidebar.
4.  Create a new API key.
5.  Copy the generated API key.

### Option 2: Google Cloud Console

1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project or select an existing one.
3.  In the left sidebar, navigate to "APIs & Services" > "Library".
4.  Search for "Gemini API" (or a specific Gemini model like "Gemini 2.0 Flash").
5.  Click "Enable" for the relevant API.
6.  Go to "APIs & Services" > "Credentials".
7.  Click "Create Credentials" > "API Key".
8.  Copy the generated API key.
9.  **(Optional but Recommended)** Restrict the API key to only the Gemini API and/or restrict it by your website (although for a Chrome extension, HTTP referrer restrictions are less straightforward).

## Step 2: Prepare Extension Files

Ensure you have the extension files, typically obtained by cloning the project repository. The basic structure should include:

```
leetcode-companion/
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── manifest.json
├── popup.html
├── popup.js
├── content.js
└── README.md
├── REPORT.MD
```
*(Note: There might be other files like background scripts or stylesheets depending on the implementation details, but the core functional files are listed above.)*

## Step 3: Load the Extension in Chrome

1.  Open Google Chrome.
2.  Go to `chrome://extensions/` in the address bar.
3.  Enable "Developer mode" in the top right corner of the Extensions page.
4.  Click the "Load unpacked" button that appears on the left.
5.  Select the directory containing your extension files (`leetcode-companion`).

The extension should now appear in your list of installed extensions.

## Step 4: Configure the Extension with your API Key

1.  Once the extension is loaded, you will see its icon in the Chrome toolbar. Pin the extension icon for easy access if you prefer.
2.  Click the LeetCode Companion extension icon.
3.  A small popup window will appear.
4.  Enter the Gemini API key you obtained in Step 1 into the provided input field.
5.  Click the "Save" button.

Your API key is stored securely in your browser's local storage and is not accessible by websites.

## Step 5: Use the Extension on LeetCode

1.  Navigate to any LeetCode problem page (e.g., `https://leetcode.com/problems/two-sum/`).
2.  You should see a floating button (question mark icon) near the bottom right of the page. Click it to open the feature menu.
3.  You will see buttons for "Generate Hint", "Analyze Code", "Generate Test Cases", and "Suggest Approach". Click any of these to open the floating modal with AI-powered information.
4.  A shield icon button will also be present near the floating menu button. Click it to toggle Discipline Mode (hiding solutions/editorial tabs and redirecting).
5.  On the problem description page, you will find a "Copy" button below the problem title. Click it to copy the problem statement.
6.  Interact with the floating modal window - you can drag it, minimize it, or close it.

## Troubleshooting

### Common Issues:

*   **Extension icon is grayed out:** Ensure you are on a supported URL (a LeetCode problem page).
*   **AI features not working:**
    *   Verify you have entered and saved the correct Gemini API key in the extension popup.
    *   Check your browser's developer console (F12 > Console) for any API errors or network issues.
    *   Ensure you have enabled the Gemini API in your Google Cloud project or AI Studio.
    *   Check your API usage and quotas in Google Cloud Console.
*   **Discipline Mode not hiding tabs:** Ensure you are on a problem page and not the main LeetCode explore or contest page.
*   **Floating elements not appearing:** Check your browser's developer console for JavaScript errors on the LeetCode page.

### Debugging:

1.  Open Chrome DevTools (F12).
2.  For issues within the LeetCode page (floating buttons, modal), go to the "Console" tab and look for errors. You can also inspect elements on the page.
3.  For issues related to the extension's background script or popup, go to `chrome://extensions/`, find your extension, click "Inspect views:" and select the relevant option (e.g., "background page" or "popup"). This opens a separate DevTools window.
4.  Use the "Network" tab in DevTools to see if API calls are being made successfully.

## Security Considerations

1.  Keep your Gemini API key confidential. Do not share it or expose it in your code.
2.  Store your `.pem` file securely if you packaged the extension.
3.  Be cautious of phishing attempts or requests for your API key.
4.  Keep the extension updated to receive security patches.

## Maintenance

1.  Monitor your Gemini API usage in Google Cloud Console or AI Studio.
2.  Regularly test the extension on LeetCode to ensure features are working after LeetCode updates.
3.  Address any reported bugs or issues.
4.  Consider updating the Gemini model or API integration as new versions become available.

## Support

If you need help:

1.  Review this deployment guide and the `README.md`.
2.  Check the troubleshooting section.
3.  If you obtained the code from a repository, check the issue tracker there.
4.  Contact the developer(s) if necessary.