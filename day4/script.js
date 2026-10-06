// Element references
const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

// Updates character & word count display along with warning classes
function updateCounts() {
  const text = noteText.value;
  const len = text.length;

  // Character Count Display & Classes
  charCount.textContent = `${len} / 200 characters`;
  charCount.classList.remove("warning", "over");

  if (len > 200) {
    charCount.classList.add("over");
  } else if (len > 180) {
    charCount.classList.add("warning");
  }

  // Word Count Calculation
  const trimmed = text.trim();
  const words = trimmed === "" ? 0 : trimmed.split(/\s+/).length;
  wordCount.textContent = `${words} words`;
}

// Clears text area, clears draft, and updates UI state
function clearDraft() {
  noteText.value = "";
  localStorage.removeItem("day4_draft");
  updateCounts();
}

// --- Event Listeners ---

// Input Event: update counts and save draft continuously
noteText.addEventListener("input", () => {
  updateCounts();
  localStorage.setItem("day4_draft", noteText.value);
});

// Escape key inside textarea clears draft
noteText.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    clearDraft();
  }
});

// Clear Button
clearBtn.addEventListener("click", clearDraft);

// Theme Toggle
themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  localStorage.setItem("day4_theme", isDark ? "dark" : "light");
});

// --- Page Initialization ---

function init() {
  // Restore draft
  const savedDraft = localStorage.getItem("day4_draft");
  if (savedDraft !== null) {
    noteText.value = savedDraft;
  }

  // Restore theme preference
  const savedTheme = localStorage.getItem("day4_theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light mode";
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "Dark mode";
  }

  // Initial calculation check
  updateCounts();
}

init();