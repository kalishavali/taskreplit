import { pgTable, text, serial, integer, boolean, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("blue"),
  status: text("status").notNull().default("active"), // active, paused, completed, archived
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  assignees: text("assignees").array(), // Project assignees/team members
  teamMembers: text("team_members").array(), // Team member IDs/names
  tags: text("tags").array(), // Project tags
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"), // Icon URL or path
  type: text("type").notNull().default("Web"), // Mobile, Web, Watch
  color: text("color").default("#10b981"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Many-to-many relationship between projects and applications
export const projectApplications = pgTable("project_applications", {
  projectId: integer("project_id").references(() => projects.id).notNull(),
  applicationId: integer("application_id").references(() => applications.id).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.projectId, table.applicationId] })
}));

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: jsonb("content"), // Rich text content
  status: text("status").notNull().default("Open"), // Open, InProgress, Blocked, Closed
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  projectId: integer("project_id").references(() => projects.id),
  applicationId: integer("application_id").references(() => applications.id),
  assignee: text("assignee"),
  dueDate: timestamp("due_date"),
  progress: integer("progress").default(0), // 0-100
  tags: text("tags").array(), // Task tags
  dependencies: integer("dependencies").array(), // Task dependencies
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  content: jsonb("content").notNull(), // Rich text content
  author: text("author").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // created, updated, completed, commented, assigned, deadline_changed
  description: text("description").notNull(),
  taskId: integer("task_id").references(() => tasks.id),
  projectId: integer("project_id").references(() => projects.id),
  user: text("user").notNull(),
  metadata: jsonb("metadata"), // Additional activity data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // task_assigned, deadline_approaching, task_completed, comment_added
  isRead: boolean("is_read").default(false),
  taskId: integer("task_id").references(() => tasks.id),
  projectId: integer("project_id").references(() => projects.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  userId: text("user_id").notNull(),
  description: text("description"),
  hours: integer("hours").notNull(), // Time in minutes
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatar: text("avatar"),
  role: text("role").notNull().default("member"), // admin, manager, member
  department: text("department"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed password
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("member"), // admin, member
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions table for session management
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// User project permissions table
export const userProjectPermissions = pgTable("user_project_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  canView: boolean("can_view").default(true).notNull(),
  canEdit: boolean("can_edit").default(false).notNull(),
  canDelete: boolean("can_delete").default(false).notNull(),
  canManage: boolean("can_manage").default(false).notNull(), // Can assign tasks, manage team members
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectApplicationSchema = createInsertSchema(projectApplications);

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val) => {
    if (!val) return null;
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertSessionSchema = createInsertSchema(sessions);

export const insertUserProjectPermissionSchema = createInsertSchema(userProjectPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Update schemas with proper date handling
export const updateTaskSchema = insertTaskSchema.partial();
export const updateProjectSchema = insertProjectSchema.partial().extend({
  startDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val) => {
    if (!val) return null;
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  endDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val) => {
    if (!val) return null;
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
});
export const updateApplicationSchema = insertApplicationSchema.partial();
export const updateTeamMemberSchema = insertTeamMemberSchema.partial();
export const updateActivitySchema = insertActivitySchema.partial();
export const updateCommentSchema = insertCommentSchema.partial();
export const updateNotificationSchema = insertNotificationSchema.partial();
export const updateTimeEntrySchema = insertTimeEntrySchema.partial();
export const updateUserSchema = insertUserSchema.partial();
export const updateUserProjectPermissionSchema = insertUserProjectPermissionSchema.partial();

// Types
export type Project = typeof projects.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type ProjectApplication = typeof projectApplications.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type UserProjectPermission = typeof userProjectPermissions.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertProjectApplication = z.infer<typeof insertProjectApplicationSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertUserProjectPermission = z.infer<typeof insertUserProjectPermissionSchema>;

export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type UpdateApplication = z.infer<typeof updateApplicationSchema>;
export type UpdateTeamMember = z.infer<typeof updateTeamMemberSchema>;
export type UpdateActivity = z.infer<typeof updateActivitySchema>;
export type UpdateComment = z.infer<typeof updateCommentSchema>;
export type UpdateNotification = z.infer<typeof updateNotificationSchema>;
export type UpdateTimeEntry = z.infer<typeof updateTimeEntrySchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpdateUserProjectPermission = z.infer<typeof updateUserProjectPermissionSchema>;
