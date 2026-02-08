---
name: database-skill
description: Design and manage databases including schema design, table creation, and migrations for scalable applications.
---

# Database Skill – Schema Design, Tables & Migrations

## Instructions

1. **Schema Design**
   - Identify entities and relationships
   - Normalize data (avoid duplication)
   - Define primary keys and foreign keys
   - Choose correct data types
   - Plan indexes for performance

2. **Table Creation**
   - Create tables with clear naming conventions
   - Add constraints (NOT NULL, UNIQUE, DEFAULT)
   - Define relationships using foreign keys
   - Use timestamps for auditing (created_at, updated_at)

3. **Migrations**
   - Version control database changes
   - Write up and down migrations
   - Keep migrations small and focused
   - Test migrations before production
   - Never edit old migrations in production

4. **Relationships**
   - One-to-One
   - One-to-Many
   - Many-to-Many (junction tables)

5. **Data Integrity**
   - Enforce referential integrity
   - Use transactions for critical operations
   - Apply cascading rules carefully

---

## Best Practices

- Use snake_case for table and column names
- Always use migrations instead of manual DB edits
- Add indexes on frequently queried columns
- Keep schemas simple and extensible
- Document schema changes
- Backup database before migrations
- Avoid over-normalization
- Use soft deletes when necessary
- Validate schema with application models

---

## Example Structure (SQL)

```sql
-- users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
