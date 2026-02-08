# Database Setup Guide

## Prerequisites

1. **Neon PostgreSQL Database**: Create a database at https://console.neon.tech
2. **Users Table**: The `users` table must already exist (created by Spec 1 frontend)
3. **Environment Variables**: Configure `.env` file with valid DATABASE_URL

## Step 1: Get Database Credentials

1. Log in to [Neon Console](https://console.neon.tech)
2. Select your project
3. Navigate to "Connection Details"
4. Copy the **pooled connection string** (with `-pooler` suffix)
5. Format: `postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`

## Step 2: Update Environment Variables

Edit `backend/.env` and update the DATABASE_URL:

```bash
# Replace with your actual Neon connection string
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require

# Ensure BETTER_AUTH_SECRET matches frontend (already configured)
BETTER_AUTH_SECRET=YMUQqkzlCJ0cCGRWx5lWKB081cETI/yqIwuixAMY9qbRGR+vXlXsgTy4Sx5oj7H41BynG1pI6NzzgjdFWhqpDQ==

# Environment and CORS
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
```

## Step 3: Verify Users Table Exists

Before running migrations, verify the users table exists:

```bash
# Activate virtual environment
cd backend
source venv/bin/activate

# Test database connection and check for users table
python -c "
from sqlmodel import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

try:
    engine = create_engine(DATABASE_URL, echo=False)
    with engine.connect() as conn:
        result = conn.execute(text(\"SELECT tablename FROM pg_tables WHERE schemaname = 'public'\"))
        tables = [row[0] for row in result]
        print('✅ Database connection successful!')
        print(f'📋 Tables found: {tables}')
        if 'users' in tables:
            print('✅ Users table exists (required for tasks foreign key)')
        else:
            print('❌ Users table NOT found - please create it first (Spec 1)')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    print('Please check your DATABASE_URL in .env file')
"
```

**Expected Output**:
```
✅ Database connection successful!
📋 Tables found: ['users', ...]
✅ Users table exists (required for tasks foreign key)
```

If users table doesn't exist, you need to run Spec 1 (frontend authentication) first.

## Step 4: Run Database Migration

Once the users table exists, run the Alembic migration to create the tasks table:

```bash
# Still in backend/ with venv activated
alembic upgrade head
```

**Expected Output**:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 001, Create tasks table
```

## Step 5: Verify Migration Success

Check that the tasks table was created with all constraints:

```bash
python -c "
from sqlmodel import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Check tables
    result = conn.execute(text(\"SELECT tablename FROM pg_tables WHERE schemaname = 'public'\"))
    tables = [row[0] for row in result]
    print('📋 Tables:', tables)

    if 'tasks' in tables:
        print('✅ Tasks table created successfully!')

        # Check columns
        result = conn.execute(text(\"\"\"
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'tasks'
            ORDER BY ordinal_position
        \"\"\"))
        print('\\n📊 Columns:')
        for row in result:
            print(f'  - {row[0]}: {row[1]} (nullable={row[2]}, default={row[3]})')

        # Check indexes
        result = conn.execute(text(\"\"\"
            SELECT indexname FROM pg_indexes
            WHERE tablename = 'tasks'
        \"\"\"))
        indexes = [row[0] for row in result]
        print(f'\\n🔍 Indexes: {indexes}')

        # Check foreign keys
        result = conn.execute(text(\"\"\"
            SELECT conname, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = 'tasks'::regclass
            AND contype = 'f'
        \"\"\"))
        print('\\n🔗 Foreign Keys:')
        for row in result:
            print(f'  - {row[0]}: {row[1]}')

        # Check triggers
        result = conn.execute(text(\"\"\"
            SELECT trigger_name FROM information_schema.triggers
            WHERE event_object_table = 'tasks'
        \"\"\"))
        triggers = [row[0] for row in result]
        print(f'\\n⚡ Triggers: {triggers}')
    else:
        print('❌ Tasks table not found!')
"
```

**Expected Output**:
```
📋 Tables: ['users', 'tasks', ...]
✅ Tasks table created successfully!

📊 Columns:
  - id: integer (nullable=NO, default=nextval('tasks_id_seq'::regclass))
  - user_id: character varying (nullable=NO, default=None)
  - title: character varying (nullable=NO, default=None)
  - completed: boolean (nullable=NO, default=false)
  - created_at: timestamp without time zone (nullable=NO, default=CURRENT_TIMESTAMP)
  - updated_at: timestamp without time zone (nullable=NO, default=CURRENT_TIMESTAMP)

🔍 Indexes: ['tasks_pkey', 'idx_tasks_user_id', 'idx_tasks_user_created']

🔗 Foreign Keys:
  - tasks_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

⚡ Triggers: ['update_tasks_updated_at']
```

## Troubleshooting

### Error: "password authentication failed"

**Solution**: Your DATABASE_URL has incorrect credentials. Get a fresh connection string from Neon Console.

### Error: "relation 'users' does not exist"

**Solution**: The users table must exist before creating tasks table. Run Spec 1 (frontend authentication) first.

### Error: "could not connect to server"

**Solution**:
- Check that `sslmode=require` is in your DATABASE_URL
- Verify your Neon database is active (serverless databases auto-suspend)
- Check network connectivity

### Want to rollback migration?

```bash
alembic downgrade -1
```

This will drop the tasks table, indexes, and triggers.

### Check current migration version:

```bash
alembic current
```

### View migration history:

```bash
alembic history
```

## Next Steps

After successful migration:
1. Start the FastAPI server: `uvicorn src.main:app --reload --port 8000`
2. Test the health check: `curl http://localhost:8000/`
3. Proceed to implement User Story 1 (List Tasks endpoint)
4. View API docs at: http://localhost:8000/docs
