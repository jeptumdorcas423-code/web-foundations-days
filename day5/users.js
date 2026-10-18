// Element references
const loadBtn = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusText = document.querySelector("#status");
const list = document.querySelector("#users-list");

const USERS_API_URL = "https://jsonplaceholder.typicode.com/users";

// Global array to store fetched users for client-side filtering
let allUsers = [];

// Renders any given array of users to the DOM
function renderUsers(users) {
  list.innerHTML = "";

  if (users.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.textContent = "No users match your filter.";
    list.appendChild(emptyLi);
    return;
  }

  users.forEach((user) => {
    const li = document.createElement("li");
    li.classList.add("user-card");

    const nameHeader = document.createElement("h3");
    nameHeader.textContent = user.name;

    const emailPara = document.createElement("p");
    emailPara.textContent = `Email: ${user.email}`;

    const cityPara = document.createElement("p");
    // Nested object properties from API: user.address.city
    cityPara.textContent = `City: ${user.address ? user.address.city : "N/A"}`;

    const companyPara = document.createElement("p");
    // Nested object properties from API: user.company.name
    companyPara.textContent = `Company: ${user.company ? user.company.name : "N/A"}`;

    li.appendChild(nameHeader);
    li.appendChild(emailPara);
    li.appendChild(cityPara);
    li.appendChild(companyPara);

    list.appendChild(li);
  });
}

// Fetches users from the API
async function loadUsers() {
  statusText.textContent = "Loading users...";
  loadBtn.disabled = true;
  list.innerHTML = "";

  try {
    const response = await fetch(USERS_API_URL);

    // Manual status check for HTTP errors (e.g., 404/500)
    if (!response.ok) {
      throw new Error(`Failed to load users (Status: ${response.status})`);
    }

    allUsers = await response.json();
    renderUsers(allUsers);
    statusText.textContent = `Successfully loaded ${allUsers.length} users.`;
  } catch (error) {
    statusText.textContent = "Could not load users. Please try again.";
    console.error("loadUsers error:", error.message);
  } finally {
    // Runs regardless of success or error to re-enable button
    loadBtn.disabled = false;
  }
}

// Event Listeners
loadBtn.addEventListener("click", loadUsers);

// Filter functionality (case-insensitive, no re-fetching)
filterInput.addEventListener("input", () => {
  const query = filterInput.value.trim().toLowerCase();
  const filteredUsers = allUsers.filter((user) =>
    user.name.toLowerCase().includes(query)
  );
  renderUsers(filteredUsers);
});
// Send the book update request to the API
async function updateBookOnServer(id, updatedFields) {
  try {
    const response = await fetch(
      `https://api.example.com/books/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedFields)
      }
    );

    if (!response.ok) {
      throw new Error(`Update failed: ${response.status}`);
    }

    const updatedBook = await response.json();

    console.log("Updated book:", updatedBook);

    return updatedBook;

  } catch (error) {
    console.error("Error updating book:", error.message);
  }
}