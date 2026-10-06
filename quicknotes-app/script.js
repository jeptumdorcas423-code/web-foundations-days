* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  background-color: #f4f6f8;
  color: #333;
  padding-bottom: 2rem;
}

header {
  background-color: #1e293b;
  color: #ffffff;
  text-align: center;
  padding: 2rem 1rem;
}

header h1 {
  font-size: 2rem;
}

main {
  max-width: 700px;
  margin: 2rem auto;
  padding: 0 1rem;
}

section {
  background: #ffffff;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

section h2 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

#note-form {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

#note-form label {
  font-weight: bold;
}

#note-input {
  flex: 1;
  min-width: 200px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

#note-category, 
#search-input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

#search-input {
  width: 100%;
  margin-bottom: 1rem;
}

button {
  padding: 0.5rem 1rem;
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

button:hover {
  background-color: #1d4ed8;
}

#clear-all-btn {
  background-color: #dc2626;
  margin-top: 1rem;
}

#clear-all-btn:hover {
  background-color: #b91c1c;
}

#error-message {
  color: #dc2626;
  font-weight: bold;
  margin-top: 0.5rem;
  min-height: 1.2rem;
}

#note-count {
  font-weight: bold;
  margin-bottom: 1rem;
}

#notes-list {
  list-style: none;
}

.note-card {
  padding: 1rem;
  margin-bottom: 0.75rem;
  border-radius: 6px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-personal { border-left: 6px solid #0d9488; }
.category-work     { border-left: 6px solid #991b1b; }
.category-study    { border-left: 6px solid #2563eb; }

.note-content p {
  margin-bottom: 0.25rem;
}

.note-meta {
  font-size: 0.8rem;
  color: #64748b;
}

.delete-btn {
  background-color: #ef4444;
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
}

.delete-btn:hover {
  background-color: #b91c1c;
}

footer {
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 2rem;
}

@media (max-width: 600px) {
  #note-form {
    flex-direction: column;
    align-items: stretch;
  }
}