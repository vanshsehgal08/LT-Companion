# LeetCode Hints Provider - Deployment Guide

## Prerequisites

1. Google Chrome browser
2. A Google Cloud Platform (GCP) account
3. Basic knowledge of Chrome extensions

## Step 1: Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project:
   - Click on the project dropdown at the top
   - Click "New Project"
   - Name it "LeetCode Hints Provider"
   - Click "Create"

3. Enable the Gemini API:
   - In the left sidebar, go to "APIs & Services" > "Library"
   - Search for "Gemini API"
   - Click "Enable"

4. Create API credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key
   - (Optional) Restrict the API key to only the Gemini API

## Step 2: Prepare Extension Files

1. Create the following directory structure:
```
leetcode-hints-provider/
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── background.js
├── styles.css
└── README.md
```

2. Create extension icons:
   - Create three icon files (16x16, 48x48, and 128x128 pixels)
   - Place them in the `icons` directory
   - You can use any image editor or online icon generator

## Step 3: Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select your extension directory (`leetcode-hints-provider`)

## Step 4: Configure the Extension

1. Click the extension icon in Chrome's toolbar
2. Enter your Gemini API key in the settings
3. Click "Save"

## Step 5: Test the Extension

1. Go to [LeetCode](https://leetcode.com/)
2. Open any problem
3. Click the "Get Hint" button that appears in the bottom right
4. Select your programming language
5. Choose a hint level
6. Verify that hints are generated correctly

## Step 6: Package for Distribution (Optional)

If you want to distribute the extension:

1. Go to `chrome://extensions/`
2. Click "Pack extension"
3. Select your extension directory
4. Click "Pack Extension"
5. This will create two files:
   - `.crx` file (the extension)
   - `.pem` file (private key - keep this secure)

## Troubleshooting

### Common Issues:

1. **Extension not loading:**
   - Check if all files are in the correct location
   - Verify manifest.json syntax
   - Check Chrome's console for errors

2. **API not working:**
   - Verify API key is correct
   - Check if Gemini API is enabled
   - Look for API quota limits

3. **Hints not generating:**
   - Check browser console for errors
   - Verify internet connection
   - Ensure you're on a LeetCode problem page

### Debugging:

1. Open Chrome DevTools (F12)
2. Go to the "Console" tab
3. Look for any error messages
4. Check the "Network" tab for API requests

## Security Considerations

1. Never share your API key
2. Keep the `.pem` file secure if you package the extension
3. Consider adding API key restrictions in Google Cloud Console
4. Regularly update the extension for security patches

## Maintenance

1. Monitor API usage in Google Cloud Console
2. Keep the extension updated with Chrome's latest features
3. Regularly check for and fix any bugs
4. Update the Gemini API integration if needed

## Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review the README.md file
3. Check for updates to the extension
4. Contact the development team if needed 