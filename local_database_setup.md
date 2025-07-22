# Local PostgreSQL Database Setup

## Prerequisites

1. **Install PostgreSQL** on your local machine:
   - **macOS**: `brew install postgresql`
   - **Ubuntu/Debian**: `sudo apt-get install postgresql postgresql-contrib`
   - **Windows**: Download from https://www.postgresql.org/download/windows/

2. **Start PostgreSQL service**:
   - **macOS**: `brew services start postgresql`
   - **Linux**: `sudo systemctl start postgresql`
   - **Windows**: PostgreSQL service should start automatically

## Database Setup

### 1. Create Database and User

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Or on macOS/Windows:
psql -U postgres
```

```sql
-- Create database
CREATE DATABASE project_management;

-- Create user (optional, you can use existing user)
CREATE USER pm_user WITH PASSWORD 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE project_management TO pm_user;

-- Connect to the new database
\c project_management;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO pm_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pm_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pm_user;

-- Exit psql
\q
```

### 2. Execute Schema and Data

```bash
# Execute the SQL file
psql -U pm_user -d project_management -f database_setup.sql

# Or if using default postgres user:
psql -U postgres -d project_management -f database_setup.sql
```

### 3. Verify Installation

```bash
# Connect to database
psql -U pm_user -d project_management

# Or:
psql -U postgres -d project_management
```

```sql
-- Check tables
\dt

-- Check data
SELECT * FROM clients;
SELECT * FROM projects;
SELECT COUNT(*) FROM tasks;

-- Exit
\q
```

## Environment Configuration

### 1. Create `.env` file in your project root:

```env
# Database configuration
DATABASE_URL=postgresql://pm_user:your_password@localhost:5432/project_management

# Or for default postgres user:
# DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/project_management

# PostgreSQL connection details (used individually by some tools)
PGHOST=localhost
PGPORT=5432
PGUSER=pm_user
PGPASSWORD=your_password
PGDATABASE=project_management

# Session secret (generate a secure random string)
SESSION_SECRET=your_very_secure_session_secret_here
```

### 2. Update your application to use local database:

The application will automatically detect the local PostgreSQL connection and use the native `pg` driver instead of the Neon serverless driver.

## Default Login Credentials

After running the setup, you can login with:

- **Username**: `admin`
- **Password**: `password` (default bcrypt hash provided)
- **Email**: `admin@example.com`

## Sample Data Included

The setup includes:

- **1 Client**: MuchBetter
- **2 Projects**: Wallet, Corporate Card Wallet
- **5 Applications**: Mobile, Web, API, Desktop, Watch
- **15 Tasks**: Various tasks with different statuses and priorities
- **5 Team Members**: Sridevi, Kalisha, Shirish, Alex Johnson, Sarah Chen
- **4 Users**: admin, sridevi, kalisha, shirish
- **Sample Comments and Activities**

## Database Schema Overview

### Main Tables:
- `clients` - Top-level client organizations
- `projects` - Client projects
- `applications` - Software applications (Mobile, Web, etc.)
- `project_applications` - Many-to-many relationship
- `tasks` - Individual tasks within projects
- `comments` - Task comments with rich text
- `activities` - Activity logging
- `team_members` - Team member profiles
- `users` - Authentication users
- `user_client_permissions` - Role-based access control

### Key Features:
- **Foreign key relationships** for data integrity
- **Indexes** for performance optimization
- **Triggers** for automatic timestamp updates
- **JSONB columns** for rich content storage
- **Array columns** for tags and assignees

## Troubleshooting

### Connection Issues:
1. Ensure PostgreSQL is running: `sudo systemctl status postgresql`
2. Check connection settings in `.env` file
3. Verify user permissions and database existence

### Permission Issues:
```sql
-- If you get permission errors, run these as superuser:
GRANT ALL ON SCHEMA public TO pm_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pm_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pm_user;
```

### Reset Database:
```bash
# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS project_management;"
sudo -u postgres psql -c "CREATE DATABASE project_management;"
psql -U pm_user -d project_management -f database_setup.sql
```

## Next Steps

1. Run the application: `npm run dev`
2. Navigate to `http://localhost:5000` in your browser
3. Login with admin credentials:
   - Username: `admin`
   - Password: `password`
4. Start using the project management system!

The application will automatically:
- Detect your local PostgreSQL connection
- Use the native `pg` driver instead of Neon serverless
- Bind to `localhost:5000` for local development

## Local Development Notes

- The server automatically detects local PostgreSQL and adjusts configuration
- Uses `localhost` instead of `0.0.0.0` for local compatibility
- Disables `reusePort` option for local development
- All data will be stored in your local PostgreSQL database