// Starting Data
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. searchNotes(word): Search using filter, toLowerCase, and includes
function searchNotes(word) {
  const searchTerm = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(searchTerm));
}

// 2. longestNote(): Handles empty array first, then compares lengths
function longestNote() {
  if (notes.length === 0) return null;
  return notes.reduce((longest, current) => {
    return current.text.length > longest.text.length ? current : longest;
  }, notes[0]);
}

// 3. countByCategory(): Loops over notes and increments counters in an object
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    const cat = note.category.toLowerCase();
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

// 4. getSummary(): Uses countByCategory, singular/plural grammar, and template literals
function getSummary() {
  const total = notes.length;
  const word = total === 1 ? "note" : "notes";
  
  if (total === 0) return `0 ${word}.`;

  const counts = countByCategory();
  const categoryDetails = Object.entries(counts)
    .map(([category, count]) => `${count} ${category}`)
    .join(", ");

  return `${total} ${word}: ${categoryDetails}.`;
}

// 5. isDuplicate(text): Uses some and compares trimmed lower-case text
function isDuplicate(text) {
  const cleanedText = text.trim().toLowerCase();
  return notes.some((note) => note.text.trim().toLowerCase() === cleanedText);
}

// 6. addNote(text, category): Validates length, duplicate, and category before adding
function addNote(text, category) {
  const cleanedText = text.trim();
  const validCategories = ["personal", "work", "study"];
  const catLower = category ? category.toLowerCase() : "";

  // Check length (1-200 characters)
  if (cleanedText.length < 1 || cleanedText.length > 200) {
    console.log("❌ Rejected: Note text must be between 1 and 200 characters.");
    return false;
  }

  // Check duplicate
  if (isDuplicate(cleanedText)) {
    console.log("❌ Rejected: A note with this text already exists.");
    return false;
  }

  // Check valid category
  if (!validCategories.includes(catLower)) {
    console.log("❌ Rejected: Category must be 'personal', 'work', or 'study'.");
    return false;
  }

  // Add valid note (including done and createdAt from Days 1-2 structure)
  const newNote = {
    id: Date.now(),
    text: cleanedText,
    category: catLower,
    done: false,
    createdAt: new Date().toLocaleString(),
  };

  notes.push(newNote);
  console.log(`✅ Added: "${newNote.text}" (${newNote.category})`);
  return true;
}

// ==========================================
// --- Function Tests & Expected Outputs ---
// ==========================================

console.log("--- Testing searchNotes() ---");
// Normal case: Matches 'report' (case-insensitive)
console.log(searchNotes("REPORT")); 
// Expected output: [{ id: 3, text: "Email the project report to Grace", category: "work" }]

// Edge case: Search term with no matches
console.log(searchNotes("python")); 
// Expected output: []


console.log("\n--- Testing longestNote() ---");
// Normal case: Returns the note with the longest text
console.log(longestNote()); 
// Expected output: { id: 3, text: "Email the project report to Grace", category: "work" }

// Edge case: Empty array returns null
const tempNotes = notes;
notes = [];
console.log(longestNote()); 
// Expected output: null
notes = tempNotes; // Restore notes


console.log("\n--- Testing countByCategory() ---");
// Normal case: Returns category counts object
console.log(countByCategory()); 
// Expected output: { personal: 2, study: 2, work: 1 }

// Edge case: Empty array returns empty object
notes = [];
console.log(countByCategory()); 
// Expected output: {}
notes = tempNotes; // Restore notes


console.log("\n--- Testing getSummary() ---");
// Normal case: Summary string for multiple notes
console.log(getSummary()); 
// Expected output: "5 notes: 2 personal, 2 study, 1 work."

// Edge case: Correct singular "note" grammar for exactly 1 note
notes = [{ id: 1, text: "Call mum", category: "personal" }];
console.log(getSummary()); 
// Expected output: "1 note: 1 personal."
notes = tempNotes; // Restore notes


console.log("\n--- Testing isDuplicate() ---");
// Normal case: Duplicate text exists (ignoring case & padding)
console.log(isDuplicate("  call MUM  ")); 
// Expected output: true

// Edge case: Text does not exist
console.log(isDuplicate("Buy groceries")); 
// Expected output: false


console.log("\n--- Testing addNote() ---");
// Normal case: Successfully adding a valid note
console.log(addNote("Practice JavaScript functions", "study")); 
// Expected output: ✅ Added: "Practice JavaScript functions" (study) | true

// Edge case: Rejecting duplicate note
console.log(addNote("Call mum", "personal")); 
// Expected output: ❌ Rejected: A note with this text already exists. | false