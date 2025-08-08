# Local Development Setup

## Database Configuration

For local development, you have several options:

### Option 1: Use the existing Neon database (Recommended)
Create a `.env` file in the root directory of your local project with:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_2aY4QCTmXiyu@ep-polished-frog-ad6yqbvq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SESSION_SECRET=your-local-session-secret-key
NODE_ENV=development
PORT=5000
```

**Important**: The `NODE_ENV=development` is crucial for local development as it tells the server to bind to `localhost` instead of `0.0.0.0`.

**Important**: Make sure to create this `.env` file in your local WebStorm project folder (`/Users/kalishavalis/WebstormProjects/taskreplit/`), not just on Replit.

### Option 2: Use Local PostgreSQL
If you prefer a local database:

1. Install PostgreSQL locally
2. Create a database named `taskloop`
3. Create a `.env` file with:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskloop
SESSION_SECRET=your-local-session-secret-key
NODE_ENV=development
PORT=5000
```

4. Run database migrations:
```bash
npm run db:push
```

### Option 3: No .env file (Fallback)
If you don't create a `.env` file, the application will automatically connect to the Neon database.

## Starting the Application

```bash
npm install
npm run dev
```

The application will start on `http://localhost:5000`

## Database Migrations

After setting up your database connection, run:
```bash
npm run db:push
```

This will create all the necessary tables in your database.