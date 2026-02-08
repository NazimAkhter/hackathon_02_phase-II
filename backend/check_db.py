"""
Script to check database tables and data.
"""
import sys
sys.path.insert(0, '/mnt/e/GIAIC/Quarter-04/hackathon_02/phase-II/backend/src')

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.pool import NullPool

DATABASE_URL = "postgresql://neondb_owner:npg_3ELxRU9gdine@ep-fragrant-poetry-ahunsmfz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Create engine
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,
    connect_args={"sslmode": "require", "connect_timeout": 10},
)

print("=" * 80)
print("DATABASE INSPECTION")
print("=" * 80)

# Get inspector
inspector = inspect(engine)

# List all tables
print("\n1. ALL TABLES:")
print("-" * 80)
tables = inspector.get_table_names()
for table in tables:
    print(f"  - {table}")

if not tables:
    print("  No tables found!")

# Check users table
print("\n2. USERS TABLE SCHEMA:")
print("-" * 80)
if "users" in tables:
    columns = inspector.get_columns("users")
    for col in columns:
        print(f"  - {col['name']:20s} {str(col['type']):20s} nullable={col['nullable']}")

    # Check users data
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, email, created_at FROM users LIMIT 5"))
        rows = result.fetchall()
        print(f"\n  Users count: {len(rows)}")
        if rows:
            print("  Sample users:")
            for row in rows:
                print(f"    - ID: {row[0][:8]}... Email: {row[1]} Created: {row[2]}")
else:
    print("  users table NOT FOUND!")

# Check tasks table
print("\n3. TASKS TABLE SCHEMA:")
print("-" * 80)
if "tasks" in tables:
    columns = inspector.get_columns("tasks")
    for col in columns:
        print(f"  - {col['name']:20s} {str(col['type']):20s} nullable={col['nullable']}")

    # Check tasks data
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM tasks"))
        count = result.fetchone()[0]
        print(f"\n  Tasks count: {count}")

        if count > 0:
            result = conn.execute(text("SELECT id, user_id, title, completed FROM tasks LIMIT 5"))
            rows = result.fetchall()
            print("  Sample tasks:")
            for row in rows:
                print(f"    - ID: {row[0]} User: {row[1][:8]}... Title: {row[2]} Completed: {row[3]}")
else:
    print("  tasks table NOT FOUND!")

print("\n" + "=" * 80)
