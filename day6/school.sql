-- Enable foreign key checks for SQLite
PRAGMA foreign_keys = ON;

-- ==========================================
-- 1. CREATE TABLE STATEMENTS
-- ==========================================

CREATE TABLE students (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE
);

-- Join table handling Many-to-Many relationship between students and courses
CREATE TABLE enrolments (
  student_id  INTEGER NOT NULL,
  course_id   INTEGER NOT NULL,
  grade       TEXT,
  enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, course_id), -- Prevents same student enrolling in same course twice
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE
);

-- ==========================================
-- 2. INSERT STATEMENTS
-- ==========================================

-- Insert 3 Students
INSERT INTO students (name, email) VALUES
  ('Amina Otieno', 'amina@example.com'),
  ('Brian Kamau', 'brian@example.com'),
  ('Claire Wanjiku', 'claire@example.com');

-- Insert 3 Courses
INSERT INTO courses (title, code) VALUES
  ('Web Development', 'CS101'),
  ('Database Systems', 'CS102'),
  ('Data Structures', 'CS103');

-- Insert 5 Enrolments
INSERT INTO enrolments (student_id, course_id, grade) VALUES
  (1, 1, 'A'),  -- Amina -> Web Development
  (1, 2, 'B+'), -- Amina -> Database Systems
  (2, 1, 'B'),  -- Brian -> Web Development
  (2, 3, 'A-'), -- Brian -> Data Structures
  (1, 3, 'A');  -- Amina -> Data Structures
  -- Note: Claire (student_id 3) has no enrolments

-- ==========================================
-- 3. FIVE REQUIRED QUERIES
-- ==========================================

-- Query 1: All courses for one student (by student name)
SELECT courses.code, courses.title, enrolments.grade
FROM courses
JOIN enrolments ON enrolments.course_id = courses.id
JOIN students   ON students.id = enrolments.student_id
WHERE students.name = 'Amina Otieno';

-- Query 2: All students on one course (by course code)
SELECT students.name, students.email, enrolments.grade
FROM students
JOIN enrolments ON enrolments.student_id = students.id
JOIN courses    ON courses.id = enrolments.course_id
WHERE courses.code = 'CS101';

-- Query 3: The number of students per course
SELECT courses.title, COUNT(enrolments.student_id) AS student_count
FROM courses
LEFT JOIN enrolments ON enrolments.course_id = courses.id
GROUP BY courses.id;

-- Query 4: Students who have no enrolments
SELECT students.name, students.email
FROM students
LEFT JOIN enrolments ON enrolments.student_id = students.id
WHERE enrolments.student_id IS NULL;

-- Query 5: Update of one enrolment's grade
UPDATE enrolments
SET grade = 'A+'
WHERE student_id = 2 AND course_id = 1;