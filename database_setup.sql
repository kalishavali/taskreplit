-- Project Management Application Database Schema and Sample Data
-- Execute this SQL file in your local PostgreSQL database

-- Drop tables if they exist (be careful with this in production!)
DROP TABLE IF EXISTS user_client_permissions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_applications CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create tables
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    client_id INTEGER REFERENCES clients(id),
    color TEXT NOT NULL DEFAULT 'blue',
    status TEXT NOT NULL DEFAULT 'active',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    assignees TEXT[],
    team_members TEXT[],
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    type TEXT NOT NULL DEFAULT 'Web',
    color TEXT DEFAULT '#10b981',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE project_applications (
    project_id INTEGER REFERENCES projects(id) NOT NULL,
    application_id INTEGER REFERENCES applications(id) NOT NULL,
    PRIMARY KEY (project_id, application_id)
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB,
    status TEXT NOT NULL DEFAULT 'Open',
    priority TEXT NOT NULL DEFAULT 'medium',
    project_id INTEGER REFERENCES projects(id),
    application_id INTEGER REFERENCES applications(id),
    assignee TEXT,
    due_date TIMESTAMP,
    progress INTEGER DEFAULT 0,
    tags TEXT[],
    dependencies INTEGER[],
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) NOT NULL,
    content JSONB NOT NULL,
    author TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    task_id INTEGER REFERENCES tasks(id),
    project_id INTEGER REFERENCES projects(id),
    "user" TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    task_id INTEGER REFERENCES tasks(id),
    project_id INTEGER REFERENCES projects(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE time_entries (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) NOT NULL,
    user_id TEXT NOT NULL,
    description TEXT,
    hours INTEGER NOT NULL,
    date TIMESTAMP DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE sessions (
    sid TEXT PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE TABLE user_client_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    can_view BOOLEAN DEFAULT true NOT NULL,
    can_edit BOOLEAN DEFAULT false NOT NULL,
    can_delete BOOLEAN DEFAULT false NOT NULL,
    can_manage BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_application_id ON tasks(application_id);
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_activities_task_id ON activities(task_id);
CREATE INDEX idx_activities_project_id ON activities(project_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_user_client_permissions_user_id ON user_client_permissions(user_id);
CREATE INDEX idx_user_client_permissions_client_id ON user_client_permissions(client_id);
CREATE INDEX idx_sessions_expire ON sessions(expire);

-- Insert sample data
-- Insert clients
INSERT INTO clients (name, description, status) VALUES
('MuchBetter', 'Digital wallet and payment solutions platform', 'active');

-- Insert applications
INSERT INTO applications (name, description, type, color) VALUES
('Mobile', 'Mobile Application', 'Mobile', '#10b981'),
('Web', 'Web Application', 'Web', '#3b82f6'),
('API', 'Backend API Services', 'API', '#8b5cf6'),
('Desktop', 'Desktop Application', 'Desktop', '#f59e0b'),
('Watch', 'Smartwatch Application', 'Watch', '#ef4444');

-- Insert projects
INSERT INTO projects (name, description, client_id, color, status, assignees, team_members) VALUES
('Wallet', 'Core digital wallet functionality and features', 1, 'blue', 'active', ARRAY['Sridevi', 'Kalisha'], ARRAY['Sridevi', 'Kalisha']),
('Corporate Card Wallet', 'Corporate wallet for business transactions and expense management', 1, 'green', 'active', ARRAY['Kalisha', 'Shirish'], ARRAY['Kalisha', 'Shirish']);

-- Insert project-application relationships
INSERT INTO project_applications (project_id, application_id) VALUES
(1, 1), -- Wallet - Mobile
(1, 2), -- Wallet - Web
(2, 1), -- Corporate Card Wallet - Mobile
(2, 2), -- Corporate Card Wallet - Web
(2, 3); -- Corporate Card Wallet - API

-- Insert team members
INSERT INTO team_members (name, email, role, department, is_active) VALUES
('Sridevi', 'sridevi@muchbetter.com', 'developer', 'Engineering', true),
('Kalisha', 'kalisha@muchbetter.com', 'developer', 'Engineering', true),
('Shirish', 'shirish@muchbetter.com', 'developer', 'Engineering', true),
('Alex Johnson', 'alex@muchbetter.com', 'manager', 'Engineering', true),
('Sarah Chen', 'sarah@muchbetter.com', 'designer', 'Design', true);

-- Insert users for authentication
INSERT INTO users (username, email, password, first_name, last_name, role) VALUES
('admin', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin'),
('sridevi', 'sridevi@muchbetter.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sridevi', '', 'member'),
('kalisha', 'kalisha@muchbetter.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kalisha', '', 'member'),
('shirish', 'shirish@muchbetter.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Shirish', '', 'member');

-- Insert user permissions
INSERT INTO user_client_permissions (user_id, client_id, can_view, can_edit, can_delete, can_manage) VALUES
(1, 1, true, true, true, true), -- Admin has full access
(2, 1, true, true, false, false), -- Sridevi can view and edit
(3, 1, true, true, false, false), -- Kalisha can view and edit
(4, 1, true, true, false, false); -- Shirish can view and edit

-- Insert sample tasks
INSERT INTO tasks (title, description, status, priority, project_id, application_id, assignee, due_date, progress) VALUES
('mbwalletcustomeractivities table Issue', 'After every deployment read operation is getting failed', 'In Progress', 'medium', 1, 1, 'Sridevi', '2025-07-23', 30),
('Login to Dashboard taking more than 8 Seconds', 'Optimize the API', 'In Progress', 'medium', 2, 1, 'Kalisha', '2025-07-23', 45),
('Dynamic Browser Integration', 'Performance Optimisation with Dynamic Widget', 'In Progress', 'medium', 2, 2, 'Kalisha', '2025-07-23', 60),
('EHI & APATA', 'Credit Card Transaction Security Integration', 'In Progress', 'medium', 2, 1, 'Kalisha', '2025-07-23', 25),
('Merchant Portal Authenticator App Integration', 'Integration of Uniken IDP for Merchant Portal', 'In Progress', 'medium', 2, 1, 'Kalisha', '2025-07-23', 40),
('Access Control and Authorization', 'Is "DBF_AUTHORIZED flag enablement for the following features"', 'In Progress', 'medium', 2, 1, 'Shirish', '2025-07-24', 70),
('Twilio Integration', 'Twilio Integration for the Corporate Wallet Application', 'In Progress', 'medium', 2, 1, 'Shirish', '2025-07-23', 55),
('Duplicate URL Back Office', '', 'Open', 'medium', 1, 2, 'Sridevi', '2025-07-23', 0),
('App hangs when entering incorrect username/password', 'Login validation enhancement', 'Open', 'medium', 1, 1, 'Sridevi', '2025-07-24', 0),
('Enrolment of merchant user in IDP', 'User enrollment process improvement', 'Open', 'medium', 2, 1, 'Kalisha', '2025-07-25', 0),
('Protected Mode Builds for Corporate Wallet', 'Enhanced security implementation', 'Open', 'high', 2, 1, 'Shirish', '2025-07-26', 0),
('Protection Against Brute Force Attacks', 'Security enhancement for login attempts', 'Closed', 'high', 1, 1, 'Kalisha', '2025-07-20', 100),
('Corporate Wallet KYC Documentation', 'KYC process documentation and implementation', 'Open', 'medium', 2, 1, 'Shirish', '2025-07-28', 0),
('Mobile App Performance Optimization', 'Optimize mobile app loading times', 'In Progress', 'high', 1, 1, 'Sridevi', '2025-07-25', 35),
('API Rate Limiting Implementation', 'Implement rate limiting for all API endpoints', 'Open', 'medium', 2, 3, 'Shirish', '2025-07-30', 0);

-- Insert sample comments
INSERT INTO comments (task_id, content, author) VALUES
(6, '{"ops":[{"insert":"Completed initial analysis. The DBF_AUTHORIZED flag needs to be implemented across multiple modules.\n"}]}', 'Shirish'),
(12, '{"ops":[{"insert":"Completed security testing. All brute force protection mechanisms are working correctly.\n"}]}', 'Kalisha'),
(1, '{"ops":[{"insert":"Issue reproduced in staging environment. Working on database connection optimization.\n"}]}', 'Sridevi'),
(2, '{"ops":[{"insert":"Performance bottleneck identified in user authentication service.\n"}]}', 'Kalisha'),
(7, '{"ops":[{"insert":"Twilio API integration complete. Testing SMS functionality.\n"}]}', 'Shirish');

-- Insert sample activities
INSERT INTO activities (type, description, task_id, project_id, "user") VALUES
('created', 'Task created', 1, 1, 'admin'),
('assigned', 'Task assigned to Sridevi', 1, 1, 'admin'),
('updated', 'Task status updated to In Progress', 1, 1, 'Sridevi'),
('created', 'Task created', 12, 1, 'admin'),
('completed', 'Task completed', 12, 1, 'Kalisha'),
('created', 'Task created', 6, 2, 'admin'),
('commented', 'Comment added to task', 6, 2, 'Shirish'),
('updated', 'Task progress updated to 70%', 6, 2, 'Shirish');

-- Update sequences to correct values
SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));
SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));
SELECT setval('applications_id_seq', (SELECT MAX(id) FROM applications));
SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));
SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments));
SELECT setval('activities_id_seq', (SELECT MAX(id) FROM activities));
SELECT setval('team_members_id_seq', (SELECT MAX(id) FROM team_members));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('user_client_permissions_id_seq', (SELECT MAX(id) FROM user_client_permissions));

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_client_permissions_updated_at BEFORE UPDATE ON user_client_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the data
SELECT 'Clients' as table_name, COUNT(*) as record_count FROM clients
UNION ALL
SELECT 'Projects', COUNT(*) FROM projects
UNION ALL
SELECT 'Applications', COUNT(*) FROM applications
UNION ALL
SELECT 'Project Applications', COUNT(*) FROM project_applications
UNION ALL
SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'Comments', COUNT(*) FROM comments
UNION ALL
SELECT 'Activities', COUNT(*) FROM activities
UNION ALL
SELECT 'Team Members', COUNT(*) FROM team_members
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'User Client Permissions', COUNT(*) FROM user_client_permissions;

-- Display sample data
SELECT 'Sample data verification:' as info;
SELECT c.name as client, p.name as project, COUNT(t.id) as task_count
FROM clients c
LEFT JOIN projects p ON c.id = p.client_id
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY c.id, c.name, p.id, p.name
ORDER BY c.name, p.name;