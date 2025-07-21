import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
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
  projectId: integer("project_id").references(() => projects.id),
  color: text("color").default("#10b981"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Update schemas
export const updateTaskSchema = insertTaskSchema.partial();
export const updateProjectSchema = insertProjectSchema.partial();
export const updateApplicationSchema = insertApplicationSchema.partial();

// Types
export type Project = typeof projects.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type UpdateApplication = z.infer<typeof updateApplicationSchema>;
