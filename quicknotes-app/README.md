# QuickNotes App

QuickNotes is a lightweight, interactive web application built with HTML5, CSS3, and modern JavaScript to help users capture, organize, and filter personal, work, and study notes seamlessly in real time.

## Features
- **Categorized Notes:** Assign notes to Personal, Work, or Study categories with distinct color-coded indicators.
- **Real-Time Search:** Instantly filter saved notes using dynamic keyword search.
- **Local Persistence:** Retain notes across browser sessions using `localStorage`.
- **Validation & Counting:** Enforce note length boundaries (up to 200 characters) and display accurate note counts.
- **Bulk Action:** Clear all notes with a single confirmation prompt.

## Running Locally
1. Clone the repository: `git clone https://github.com/your-username/web-foundations-days.git`
2. Navigate into the directory: `cd web-foundations-days/quicknotes-app`
3. Open `index.html` in any standard browser or launch via Live Server.

## What I Learned
- Enforced strict user-input sanitization using `createElement` and `textContent` to eliminate dynamic HTML injection risks.
- Applied CSS Flexbox layout structures alongside responsive media queries (`@media (max-width: 600px)`) to guarantee adaptable device viewing.
- Managed browser persistence lifecycle using `JSON.stringify` and `JSON.parse` coupled with array filtering algorithms.