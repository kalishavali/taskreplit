# Local PostgreSQL Setup Guide

This guide will help you set up and run the Project Management application with a local PostgreSQL database.

## Prerequisites

1. **PostgreSQL** installed on your system
2. **Node.js** (v18 or higher)
3. **npm** or **yarn**

## Step 1: Install PostgreSQL

### macOS (using Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows
Download and install from [PostgreSQL Official Website](https://www.postgresql.org/download/windows/)

## Step 2: Create Database and User

1. Access PostgreSQL as superuser:
```bash
# macOS/Linux
sudo -u postgres psql

# Windows (if you set postgres user password during installation)
psql -U postgres
```

2. Create database and user:
```sql
-- Create database
CREATE DATABASE projectmanager;

-- Create user (optional, you can use default postgres user)
CREATE USER projectadmin WITH PASSWORD 'yourpassword';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE projectmanager TO projectadmin;

-- Exit PostgreSQL
\q
```

## Step 3: Configure Environment

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file with your database credentials:
```env
# For default postgres user
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/projectmanager

# Or for custom user
DATABASE_URL=postgresql://projectadmin:yourpassword@localhost:5432/projectmanager
```

## Step 4: Install Dependencies and Setup Database

```bash
# Install project dependencies
npm install

# Push database schema to your local database
npm run db:push
```

## Step 5: Start the Application

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

## Troubleshooting

### Connection Issues

1. **Database connection refused**:
   - Ensure PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or `brew services list | grep postgresql` (macOS)
   - Check if PostgreSQL is listening on port 5432: `sudo lsof -i :5432`

2. **Authentication failed**:
   - Verify username/password in your `.env` file
   - Check PostgreSQL authentication settings in `pg_hba.conf`

3. **Database does not exist**:
   - Make sure you created the database: `createdb projectmanager`
   - Or use the SQL command: `CREATE DATABASE projectmanager;`

### Schema Issues

1. **Tables not found**:
   ```bash
   npm run db:push
   ```

2. **Migration errors**:
   - Drop and recreate database if needed (development only):
   ```sql
   DROP DATABASE IF EXISTS projectmanager;
   CREATE DATABASE projectmanager;
   ```

## Database Schema

The application automatically creates these tables:
- `projects` - Project information
- `tasks` - Task management
- `comments` - Task comments
- `activities` - Activity logging

## Switching Between Local and Neon

The application automatically detects the database type:
- **Local PostgreSQL**: Any URL not containing 'neon.db' or 'neon.tech'
- **Neon Database**: URLs containing 'neon.db' or 'neon.tech'

To switch to Neon, simply update your `DATABASE_URL` in `.env`:
```env
DATABASE_URL=postgresql://username:password@ep-example.us-east-1.aws.neon.tech/projectmanager
```

## Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```