# Project Management Application

## Overview

This is a full-stack project management application built with a modern tech stack. The application provides a comprehensive task and project management solution with features like Kanban boards, task tracking, reporting, and rich text editing capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.
Font preference: "Quicksand", sans-serif for all application text.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Drag & Drop**: React Beautiful DND for Kanban board functionality

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Storage**: PostgreSQL-based sessions with connect-pg-simple
- **API Design**: RESTful API architecture

### Build System
- **Frontend Build**: Vite with React plugin
- **Backend Build**: ESBuild for server bundling
- **Development**: Hot module replacement with Vite dev server
- **TypeScript**: Shared type definitions between client and server

## Key Components

### Database Schema
The application uses four main database tables:
- **Projects**: Store project information with name, description, color coding, and timestamps
- **Tasks**: Core task management with title, description, rich content (JSONB), status, priority, assignee, due dates, and progress tracking
- **Comments**: Task-specific comments with rich text content
- **Activities**: Activity logging for audit trail and notifications

### API Structure
RESTful endpoints organized by resource:
- `/api/projects` - Project CRUD operations
- `/api/tasks` - Task management including status updates
- `/api/tasks/search` - Task search functionality
- `/api/comments` - Comment management
- `/api/activities` - Activity feed
- `/api/stats` - Dashboard statistics
- `/api/reports` - Report generation

### Frontend Pages
- **Dashboard**: Main view with statistics, Kanban board, and recent activities
- **Projects**: Project listing and management
- **Tasks**: Detailed task list view with filtering
- **Reports**: Analytics and report generation

### Rich Text Support
- Full-featured rich text editor with toolbar for task descriptions and comments
- Support for markdown-like formatting: bold, italic, code blocks, lists, quotes, links
- Live preview functionality for rendered content
- JSONB storage for rich content in the database
- Enhanced code block support with syntax highlighting styling

## Data Flow

### Task Management Flow
1. Tasks are created through modals with form validation
2. Tasks can be updated via drag-and-drop on Kanban board or direct editing
3. Status changes trigger activity logging
4. Real-time updates through React Query cache invalidation

### Search and Filtering
1. Global search functionality across tasks
2. Multiple filter options (project, status, priority, assignee)
3. Debounced search queries to optimize performance

### State Management
1. Server state managed by TanStack Query with caching
2. Form state handled by React Hook Form
3. UI state (modals, filters) managed by local React state
4. Optimistic updates for better user experience

## External Dependencies

### UI and Styling
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling
- Lucide React for consistent iconography
- Class Variance Authority for component variants

### Backend Services
- Neon Database for serverless PostgreSQL
- Express.js middleware ecosystem
- Drizzle Kit for database migrations

### Development Tools
- Vite for fast development and building
- TypeScript for type safety
- ESLint and Prettier for code quality
- Replit-specific plugins for development environment

## Deployment Strategy

### Production Build
- Frontend: Vite builds optimized React bundle to `dist/public`
- Backend: ESBuild creates single bundled server file in `dist`
- Static assets served by Express in production

### Environment Configuration
- Database URL configuration through environment variables
- Separate development and production configurations
- Session management with secure cookies in production

### Development Workflow
- Hot module replacement for frontend development
- TypeScript compilation checking
- Database schema changes via Drizzle migrations
- Replit-specific development tooling integration

The architecture prioritizes developer experience with hot reloading, type safety, and modern tooling while maintaining production performance through optimized builds and efficient database queries.

## Recent Updates

### Schema Changes (July 2025)
- Removed finance/budget tracking fields from projects table
- Removed estimated hours and time tracking from tasks table  
- Added assignees field to projects table for team member tracking
- Updated task creation and edit forms to exclude estimated hours

### UI Enhancements (July 2025)
- Applied beautiful theme with glassmorphism effects across entire application
- Added gradient backgrounds, animations, and hover effects site-wide
- Implemented floating animations and visual decorative elements
- Fixed scrolling issues with proper CSS overflow handling
- Enhanced dashboard with animated statistics cards and modern styling
- Updated projects page with consistent beautiful theme application

### Feature Removals (July 2025)
- Removed time logging and budget tracking functionality per user request
- Removed estimated hours fields from all task forms and displays
- Simplified project statistics to focus on task completion metrics