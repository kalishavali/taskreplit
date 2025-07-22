-- Supabase Database Setup for Project Management Application
-- Run this SQL in your Supabase SQL Editor

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    client_id INTEGER REFERENCES clients(id),
    color TEXT NOT NULL DEFAULT 'blue',
    status TEXT NOT NULL DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    assignees TEXT[],
    team_members TEXT[],
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    type TEXT NOT NULL DEFAULT 'Web',
    color TEXT DEFAULT '#10b981',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
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
    due_date TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0,
    tags TEXT[],
    dependencies INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) NOT NULL,
    content JSONB NOT NULL,
    author TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    task_id INTEGER REFERENCES tasks(id),
    project_id INTEGER REFERENCES projects(id),
    "user" TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE time_entries (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) NOT NULL,
    user_id TEXT NOT NULL,
    description TEXT,
    hours INTEGER NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
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
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE sessions (
    sid TEXT PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE user_client_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    can_view BOOLEAN DEFAULT true NOT NULL,
    can_edit BOOLEAN DEFAULT false NOT NULL,
    can_delete BOOLEAN DEFAULT false NOT NULL,
    can_manage BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_application_id ON tasks(application_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_activities_task_id ON activities(task_id);
CREATE INDEX idx_activities_project_id ON activities(project_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_user_client_permissions_user_id ON user_client_permissions(user_id);
CREATE INDEX idx_user_client_permissions_client_id ON user_client_permissions(client_id);
CREATE INDEX idx_sessions_expire ON sessions(expire);

-- Enable Row Level Security (RLS) - Important for Supabase
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_client_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (Basic policies - you can customize these based on your needs)
CREATE POLICY "Users can view all clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Users can view all projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Users can view all applications" ON applications FOR SELECT USING (true);
CREATE POLICY "Users can view all project_applications" ON project_applications FOR SELECT USING (true);
CREATE POLICY "Users can view all tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Users can view all comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can view all activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Users can view all team_members" ON team_members FOR SELECT USING (true);

-- Allow insert/update/delete for authenticated users (you can make these more restrictive)
CREATE POLICY "Authenticated users can insert clients" ON clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update clients" ON clients FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete clients" ON clients FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert projects" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update projects" ON projects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete projects" ON projects FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert applications" ON applications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update applications" ON applications FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete applications" ON applications FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert project_applications" ON project_applications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete project_applications" ON project_applications FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert tasks" ON tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update tasks" ON tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete tasks" ON tasks FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update comments" ON comments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete comments" ON comments FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert activities" ON activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update activities" ON activities FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete activities" ON activities FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert team_members" ON team_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update team_members" ON team_members FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete team_members" ON team_members FOR DELETE USING (auth.role() = 'authenticated');

-- User-specific policies for notifications and time entries
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE USING (true);

CREATE POLICY "Users can view time entries" ON time_entries FOR SELECT USING (true);
CREATE POLICY "Users can insert time entries" ON time_entries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update time entries" ON time_entries FOR UPDATE USING (true);
CREATE POLICY "Users can delete time entries" ON time_entries FOR DELETE USING (true);

CREATE POLICY "Users can view user_client_permissions" ON user_client_permissions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage user_client_permissions" ON user_client_permissions FOR ALL USING (auth.role() = 'authenticated');

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

-- Insert users for authentication (password is 'password' hashed with bcrypt)
INSERT INTO users (username, email, password, first_name, last_name, role) VALUES
('admin', 'admin@muchbetter.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin'),
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

-- Insert sample comments with rich text content
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
SELECT 'Database setup completed successfully!' as status;
SELECT 'Data verification:' as info;
SELECT 
  'Clients' as table_name, COUNT(*) as record_count FROM clients
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
SELECT 'User Client Permissions', COUNT(*) FROM user_client_permissions
ORDER BY record_count DESC;

-- Display project overview
SELECT 'Project Overview:' as info;
SELECT 
    c.name as client_name, 
    p.name as project_name, 
    COUNT(t.id) as task_count,
    COUNT(CASE WHEN t.status = 'Open' THEN 1 END) as open_tasks,
    COUNT(CASE WHEN t.status = 'In Progress' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN t.status = 'Closed' THEN 1 END) as closed_tasks
FROM clients c
LEFT JOIN projects p ON c.id = p.client_id
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY c.id, c.name, p.id, p.name
ORDER BY c.name, p.name;