# LeetCode Companion Features Report

This report details the features implemented in the LeetCode Companion Chrome extension.

## 1. Hint Generation

**Description:** Provides progressive hints to help users solve a problem without immediately revealing the solution. The hints are designed to guide the user's thinking process towards a solution.

**How it works:**
- When the user clicks the "Generate Hint" button in the floating menu, the extension fetches the current problem title and description.
- It then provides pre-defined example hints stored within the extension. It keeps track of the shown hints for the current problem and displays the next available hint upon successive clicks.
- The hints are displayed in a draggable, floating modal window.

## 2. Code Analysis

**Description:** Allows users to submit their current code from the LeetCode editor to the Gemini AI for analysis.

**How it works:**
- Clicking the "Analyze Code" button in the floating menu captures the code from the LeetCode editor.
- It fetches the user's Gemini API key from Chrome storage.
- A prompt is constructed to instruct the Gemini AI to act as a code reviewer, analyze the provided code for errors, provide a brief review, and estimate time/space complexity.
- The AI's response is fetched and displayed within the floating modal window, formatted for readability.

## 3. Discipline Mode

**Description:** Helps users focus on solving problems independently by restricting access to the Solutions and Editorial tabs.

**How it works:**
- Toggling the "Discipline Mode" button (shield icon) enables or disables the mode.
- When enabled, the extension hides the "Solutions" and "Editorial" tabs on LeetCode problem pages.
- **Redirection:** If a user navigates directly to the `/solutions/` or `/editorial/` URL while discipline mode is active, they are automatically redirected back to the `/description/` tab.
- **Time Tracking (Planned):** Includes planned functionality to track the time spent while discipline mode is active using a timer stored in Chrome storage.

## 4. Copy Problem Button

**Description:** Provides a convenient button to quickly copy the problem's title and description to the clipboard.

**How it works:**
- A "Copy" button is added just below the problem title on the description tab.
- Clicking the button extracts the problem title and converts the HTML description to plain text.
- It then copies the combined text to the user's clipboard.
- The button provides visual feedback (changes text to "Copied!" or "Failed!") after the copy attempt.
- The button is automatically added when the problem page loads and on navigation.

## 5. AI-Powered Test Case Generation

**Description:** Uses the Gemini AI to generate diverse test cases (input and expected output) for a given problem.

**How it works:**
- The "Generate Test Cases" button is added to the floating menu.
- Upon clicking, it gets the problem title and description and fetches the Gemini API key.
- A specific prompt is sent to the Gemini AI requesting 3-5 diverse test cases, including edge cases.
- The AI is instructed to format the output strictly as a list of test cases without any accompanying code.
- The generated test cases are displayed in the floating modal.

## 6. Algorithm/Data Structure Recommender

**Description:** Utilizes the Gemini AI to suggest relevant algorithms, data structures, or common patterns applicable to the problem.

**How it works:**
- A "Suggest Approach" button is added to the floating menu.
- When clicked, it retrieves the problem title and description and gets the Gemini API key.
- A prompt is sent to the Gemini AI asking for 2-4 relevant approaches with brief explanations.
- The AI's suggestions are then presented to the user in the floating modal.

## 7. Floating Modal UI

**Description:** A custom, non-blocking floating window used to display output from the AI features (hints, analysis, test cases, suggestions).

**How it works:**
- The modal is a fixed-position `div` element styled with a sleek, dark, semi-transparent background and backdrop filter.
- It has fixed portrait dimensions (450px width, 550px height) and is not resizable.
- The header area is draggable, allowing the user to position the modal anywhere on the screen.
- Includes minimize and close buttons for window management.
- The content area is scrollable if the information exceeds the modal's height.
- The modal does not block interaction with the rest of the LeetCode page. 