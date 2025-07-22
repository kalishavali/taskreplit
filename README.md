# Project Management Application

A comprehensive project management application with modern UI, featuring client-project-application-task hierarchy, advanced task management with rich text comments, Kanban boards, team collaboration, and interactive reporting.

## Features

### 🏢 **Client & Project Management**
- **Client Management**: MuchBetter and other clients with contact information
- **Project Hierarchy**: Clients → Projects → Applications → Tasks structure
- **Project Teams**: Assign team members to specific projects
- **Status Tracking**: Active project monitoring with color coding

### 📋 **Advanced Task Management**
- **Rich Text Editing**: Full-featured editor with code block support
- **Task Statuses**: Open, In Progress, Blocked, Closed with visual indicators
- **Priority Levels**: Low, Medium, High, Critical with color coding
- **Due Date Management**: Overdue detection and notifications
- **Assignee System**: Task assignment to team members
- **Progress Tracking**: Visual progress indicators

### 🔄 **Kanban Board**
- **Drag & Drop**: Intuitive task movement between columns
- **Real-time Updates**: Instant status changes across the application
- **Column Organization**: Open → In Progress → Blocked → Closed
- **Visual Design**: Modern glassmorphism effects and animations

### 👥 **Team Collaboration**
- **Team Management**: Add, edit, and manage team members
- **Role-based Access**: Admin and Member user roles
- **Department Organization**: Engineering, Design, QA, DevOps, Product
- **Activity Logging**: Track all task and project changes
- **Comment System**: Rich text comments on tasks with latest-first ordering

### 📊 **Reporting & Analytics**
- **Dashboard Statistics**: Task completion metrics and progress charts
- **Interactive Charts**: Bar charts, pie charts, and trend analysis
- **Team Performance**: Member activity and task distribution
- **Project Insights**: Progress tracking and deadline monitoring

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for client-side routing
- **Shadcn/ui** component library built on Radix UI
- **Tailwind CSS** with glassmorphism theme
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **React Beautiful DND** for drag-and-drop functionality

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Drizzle ORM** with PostgreSQL
- **Session Management** with PostgreSQL storage
- **RESTful API** architecture

### Database
- **PostgreSQL** (local or Neon serverless)
- **Automatic Detection**: Switches between local and cloud databases
- **Schema Management**: Drizzle migrations
- **Data Integrity**: Foreign key relationships and constraints

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project-management-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup PostgreSQL database**
   ```bash
   # Create database
   createdb projectmanager
   
   # Or use PostgreSQL shell
   psql -U postgres
   CREATE DATABASE projectmanager;
   \q
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/projectmanager
   SESSION_SECRET=your-secret-key-here
   NODE_ENV=development
   PORT=5000
   ```

5. **Setup database schema**
   ```bash
   npm run db:push
   ```

6. **Start the application**
   ```bash
   npm run dev
   ```

Visit `http://localhost:5000` to access the application.

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Express backend
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── index.ts           # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema definitions
└── docs/                  # Documentation
```

## API Endpoints

### Core Resources
- `GET /api/clients` - List all clients
- `GET /api/projects` - List projects
- `GET /api/applications` - List applications
- `GET /api/tasks` - List tasks with filtering
- `GET /api/team-members` - List team members

### Task Management
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `GET /api/tasks/search` - Search tasks
- `GET /api/comments` - Get task comments

### Analytics
- `GET /api/stats` - Dashboard statistics
- `GET /api/activities` - Activity feed

## Database Schema

### Main Tables
- **clients**: Client information and contact details
- **projects**: Project data with client relationships
- **applications**: Application components within projects
- **tasks**: Task management with rich content support
- **team_members**: Team member profiles and roles
- **comments**: Task comments with rich text
- **activities**: Activity logging for audit trails

## Features in Detail

### Rich Text Editor
- **Formatting**: Bold, italic, code blocks, lists, quotes
- **Code Support**: Syntax highlighting for code blocks
- **Link Support**: Clickable links in content
- **Live Preview**: Real-time content rendering

### Kanban Board
- **Smooth Animations**: CSS transitions for drag operations
- **Status Synchronization**: Real-time updates across components
- **Visual Feedback**: Drop zones and hover states
- **Responsive Design**: Works on desktop and mobile

### Team Management
- **Role System**: Admin and Member permissions
- **Department Tracking**: Organize by functional areas
- **Active Status**: Enable/disable team members
- **Avatar Support**: Profile images for team members

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run check` - TypeScript type checking

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Database Migration
The application automatically detects database type:
- **Local PostgreSQL**: Standard connection strings
- **Neon Database**: URLs containing 'neon.db' or 'neon.tech'

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the [Local Setup Guide](LOCAL_SETUP.md) for installation issues
- Review the database schema in `shared/schema.ts`
- Check the API documentation in `server/routes.ts`

---

Built with ❤️ using React, TypeScript, and PostgreSQL