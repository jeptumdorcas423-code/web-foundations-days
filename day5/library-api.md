# Library REST API Design

An API specification for managing a library's `books` resource.

---

## Endpoints

### 1. List All Books
* **Method:** `GET`
* **Path:** `/books`
* **Description:** Retrieves a complete list of all books in the library.
* **Success Status Code:** `200 OK`

---

### 2. Get One Book
* **Method:** `GET`
* **Path:** `/books/:id`
* **Description:** Retrieves details of a specific book by its unique ID.
* **Success Status Code:** `200 OK`

---

### 3. List Books by Author
* **Method:** `GET`
* **Path:** `/books?author=query`
* **Description:** Retrieves books filtered by a specific author using a query parameter.
* **Success Status Code:** `200 OK`

---

### 4. Create a Book
* **Method:** `POST`
* **Path:** `/books`
* **Description:** Creates a new book entry in the library.
* **Success Status Code:** `201 Created`
* **Request Body Example:**
```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1958,
  "genre": "Fiction"
}