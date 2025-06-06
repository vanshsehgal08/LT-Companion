# LeetCode Hints Provider Chrome Extension

A Chrome extension that provides progressive hints for LeetCode problems without revealing the full solution. The extension uses Google's Gemini API to generate context-aware hints based on the problem description and your current code.

## Features

- Automatically detects LeetCode problems
- Provides three levels of hints:
  - Level 1: Subtle nudge towards the solution
  - Level 2: Mid-level hint with specific techniques
  - Level 3: Detailed breakdown of the approach
- Supports multiple programming languages:
  - Python
  - C++
  - Java
  - JavaScript
- Modern and clean user interface
- Easy-to-use floating button on LeetCode pages

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Setup

1. Get an API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Gemini API
   - Create credentials (API key)
2. Click the extension icon
3. Enter your Gemini API key in the settings
4. Start using the extension on LeetCode problems!

## Usage

1. Navigate to any LeetCode problem
2. Click the "Get Hint" button that appears in the bottom right corner
3. Select your programming language
4. Choose a hint level (1-3)
5. Read the generated hint

## Privacy

- Your code and problem information are only sent to Google's Gemini API for generating hints
- No data is stored permanently
- API key is stored securely in Chrome's storage

## Contributing

Feel free to submit issues and enhancement requests! 