# School Database Design

Documentation for the Day 6 School Database Schema and Architecture.

---

## 1. Table Descriptions & Relationships

* **`students`**: Stores core information about registered students (`id`, `name`, `email`, `created_at`).
* **`courses`**: Stores available course catalog information (`id`, `title`, `code`).
* **`enrolments`**: Serves as a join table linking students to courses, while recording contextual metadata specific to the enrollment instance (`grade`, `enrolled_at`).

### Relationships
* **One-to-Many ($1:N$):** A single student can have many enrollment records, but each enrollment record points to one student. Similarly, one course has many enrollment records.
* **Many-to-Many ($M:N$):** Students and courses share a Many-to-Many relationship because one student can take multiple courses, and one course can contain multiple students.
* **Why a Join Table is Needed:** Relational databases cannot store lists/arrays directly within a column without breaking First Normal Form (1NF). The `enrolments` join table decomposes the $M:N$ relationship into two $1:N$ relationships using a composite primary key `(student_id, course_id)`, preventing duplicate registrations while allowing additional attributes like `grade` to be stored cleanly.

---

## 2. Performance Indexing

```sql
CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);