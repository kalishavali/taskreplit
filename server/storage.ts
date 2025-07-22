import { eq, like, and, desc, or, asc, sql } from "drizzle-orm";
import { db } from "./db.js";
import {
  projects,
  tasks,
  applications,
  teamMembers,
  activities,
  comments,
  notifications,
  projectApplications,
  timeEntries,
  type Project,
  type Task,
  type Application,
  type TeamMember,
  type Activity,
  type Comment,
  type Notification,
  type ProjectApplication,
  type TimeEntry,
  type InsertProject,
  type InsertTask,
  type InsertApplication,
  type InsertTeamMember,
  type InsertActivity,
  type InsertComment,
  type InsertNotification,
  type InsertProjectApplication,
  type InsertTimeEntry,
  type UpdateProject,
  type UpdateTask,
  type UpdateApplication,
  type UpdateTeamMember,
  type UpdateActivity,
  type UpdateComment,
  type UpdateNotification,
  type UpdateTimeEntry,
} from "@shared/schema";

export interface IStorage {
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: UpdateProject): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Applications
  getApplications(projectId?: number): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, updates: UpdateApplication): Promise<Application | undefined>;
  deleteApplication(id: number): Promise<boolean>;

  // Project-Application relationships
  getProjectApplications(projectId: number): Promise<Application[]>;
  addProjectApplication(projectId: number, applicationId: number): Promise<boolean>;
  removeProjectApplication(projectId: number, applicationId: number): Promise<boolean>;

  // Tasks
  getTasks(filters?: {
    projectId?: number;
    applicationId?: number;
    status?: string;
    assignee?: string;
    priority?: string;
  }): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  searchTasks(query: string): Promise<Task[]>;

  // Team Members
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: number): Promise<TeamMember | undefined>;
  createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: number, updates: UpdateTeamMember): Promise<TeamMember | undefined>;
  deleteTeamMember(id: number): Promise<boolean>;

  // Activities
  getActivities(filters?: {
    projectId?: number;
    taskId?: number;
    limit?: number;
  }): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Comments
  getComments(taskId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, updates: UpdateComment): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<boolean>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<boolean>;

  // Time Entries
  getTimeEntries(filters?: {
    taskId?: number;
    userId?: string;
    projectId?: number;
  }): Promise<TimeEntry[]>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: number, updates: UpdateTimeEntry): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: number): Promise<boolean>;

  // Stats
  getStats(): Promise<{
    totalTasks: number;
    totalProjects: number;
    todoTasks: number;
    inProgressTasks: number;
    doneTasks: number;
    blockedTasks: number;
    totalTimeLogged: number;
    activeTeamMembers: number;
    unreadNotifications: number;
  }>;

  // Reports
  getReports(type: string, params?: any): Promise<any>;
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  constructor() {
    console.log('Database storage initialized - using existing data');
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async updateProject(id: number, updateProject: UpdateProject): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({ ...updateProject, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Applications
  async getApplications(projectId?: number): Promise<Application[]> {
    if (projectId) {
      return await db.select().from(applications).where(eq(applications.projectId, projectId));
    }
    return await db.select().from(applications);
  }

  async getApplication(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application;
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db.insert(applications).values(insertApplication).returning();
    return application;
  }

  async updateApplication(id: number, updateApplication: UpdateApplication): Promise<Application | undefined> {
    const [application] = await db
      .update(applications)
      .set({ ...updateApplication, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return application;
  }

  async deleteApplication(id: number): Promise<boolean> {
    // First, remove all project-application relationships
    await db.delete(projectApplications).where(eq(projectApplications.applicationId, id));
    // Then delete the application
    const result = await db.delete(applications).where(eq(applications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Project-Application relationships
  async getProjectApplications(projectId: number): Promise<Application[]> {
    const result = await db
      .select({
        id: applications.id,
        name: applications.name,
        description: applications.description,
        icon: applications.icon,
        type: applications.type,
        color: applications.color,
        status: applications.status,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt,
        projectId: applications.projectId,
      })
      .from(projectApplications)
      .innerJoin(applications, eq(projectApplications.applicationId, applications.id))
      .where(eq(projectApplications.projectId, projectId));

    return result;
  }

  async addProjectApplication(projectId: number, applicationId: number): Promise<boolean> {
    try {
      await db.insert(projectApplications).values({ projectId, applicationId });
      return true;
    } catch (error) {
      return false;
    }
  }

  async removeProjectApplication(projectId: number, applicationId: number): Promise<boolean> {
    const result = await db
      .delete(projectApplications)
      .where(
        and(
          eq(projectApplications.projectId, projectId),
          eq(projectApplications.applicationId, applicationId)
        )
      );
    return (result.rowCount ?? 0) > 0;
  }

  // Tasks
  async getTasks(filters?: {
    projectId?: number;
    applicationId?: number;
    status?: string;
    assignee?: string;
    priority?: string;
  }): Promise<Task[]> {
    let query = db.select().from(tasks);

    if (filters) {
      const conditions = [];
      if (filters.projectId) conditions.push(eq(tasks.projectId, filters.projectId));
      if (filters.applicationId) conditions.push(eq(tasks.applicationId, filters.applicationId));
      if (filters.status) conditions.push(eq(tasks.status, filters.status));
      if (filters.assignee) conditions.push(eq(tasks.assignee, filters.assignee));
      if (filters.priority) conditions.push(eq(tasks.priority, filters.priority));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }

    return await query;
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: number, updateTask: UpdateTask): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...updateTask, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async searchTasks(query: string): Promise<Task[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(tasks)
      .where(
        or(
          like(tasks.title, searchPattern),
          like(tasks.description, searchPattern),
          like(tasks.assignee, searchPattern)
        )
      );
  }

  // Team Members
  async getTeamMembers(): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.isActive, true));
  }

  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return member;
  }

  async createTeamMember(insertTeamMember: InsertTeamMember): Promise<TeamMember> {
    const [member] = await db.insert(teamMembers).values(insertTeamMember).returning();
    return member;
  }

  async updateTeamMember(id: number, updateTeamMember: UpdateTeamMember): Promise<TeamMember | undefined> {
    const [member] = await db
      .update(teamMembers)
      .set(updateTeamMember)
      .where(eq(teamMembers.id, id))
      .returning();
    return member;
  }

  async deleteTeamMember(id: number): Promise<boolean> {
    const result = await db.delete(teamMembers).where(eq(teamMembers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Activities
  async getActivities(filters?: {
    projectId?: number;
    taskId?: number;
    limit?: number;
  }): Promise<Activity[]> {
    let query = db.select().from(activities).orderBy(desc(activities.createdAt));

    if (filters) {
      const conditions = [];
      if (filters.projectId) conditions.push(eq(activities.projectId, filters.projectId));
      if (filters.taskId) conditions.push(eq(activities.taskId, filters.taskId));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }
    }

    return await query;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(insertActivity).returning();
    return activity;
  }

  // Comments
  async getComments(taskId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.taskId, taskId))
      .orderBy(asc(comments.createdAt));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }

  async updateComment(id: number, updateComment: UpdateComment): Promise<Comment | undefined> {
    const [comment] = await db
      .update(comments)
      .set({ ...updateComment, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return comment;
  }

  async deleteComment(id: number): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
    return (result.rowCount ?? 0) > 0;
  }

  // Time Entries
  async getTimeEntries(filters?: {
    taskId?: number;
    userId?: string;
    projectId?: number;
  }): Promise<TimeEntry[]> {
    let query = db.select().from(timeEntries).orderBy(desc(timeEntries.createdAt));

    if (filters) {
      const conditions = [];
      if (filters.taskId) conditions.push(eq(timeEntries.taskId, filters.taskId));
      if (filters.userId) conditions.push(eq(timeEntries.userId, filters.userId));
      if (filters.projectId) conditions.push(eq(timeEntries.projectId, filters.projectId));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }

    return await query;
  }

  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const [timeEntry] = await db.insert(timeEntries).values(insertTimeEntry).returning();
    return timeEntry;
  }

  async updateTimeEntry(id: number, updateTimeEntry: UpdateTimeEntry): Promise<TimeEntry | undefined> {
    const [timeEntry] = await db
      .update(timeEntries)
      .set(updateTimeEntry)
      .where(eq(timeEntries.id, id))
      .returning();
    return timeEntry;
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    const result = await db.delete(timeEntries).where(eq(timeEntries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Stats
  async getStats(): Promise<{
    totalTasks: number;
    totalProjects: number;
    todoTasks: number;
    inProgressTasks: number;
    doneTasks: number;
    blockedTasks: number;
    totalTimeLogged: number;
    activeTeamMembers: number;
    unreadNotifications: number;
  }> {
    const [
      totalTasks,
      totalProjects,
      todoTasks,
      inProgressTasks,
      doneTasks,
      blockedTasks,
      totalTimeLogged,
      activeTeamMembers,
      unreadNotifications,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(tasks),
      db.select({ count: sql<number>`count(*)` }).from(projects),
      db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, "Open")),
      db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, "InProgress")),
      db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, "Closed")),
      db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, "Blocked")),
      db.select({ sum: sql<number>`coalesce(sum(hours), 0)` }).from(timeEntries),
      db.select({ count: sql<number>`count(*)` }).from(teamMembers).where(eq(teamMembers.isActive, true)),
      db.select({ count: sql<number>`count(*)` }).from(notifications).where(eq(notifications.isRead, false)),
    ]);

    return {
      totalTasks: totalTasks[0]?.count || 0,
      totalProjects: totalProjects[0]?.count || 0,
      todoTasks: todoTasks[0]?.count || 0,
      inProgressTasks: inProgressTasks[0]?.count || 0,
      doneTasks: doneTasks[0]?.count || 0,
      blockedTasks: blockedTasks[0]?.count || 0,
      totalTimeLogged: totalTimeLogged[0]?.sum || 0,
      activeTeamMembers: activeTeamMembers[0]?.count || 0,
      unreadNotifications: unreadNotifications[0]?.count || 0,
    };
  }

  // Reports
  async getReports(type: string, params?: any): Promise<any> {
    switch (type) {
      case "task-progress":
        return await this.getTaskProgressReport(params);
      case "team-performance":
        return await this.getTeamPerformanceReport(params);
      case "project-overview":
        return await this.getProjectOverviewReport(params);
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }

  private async getTaskProgressReport(params?: any) {
    const results = await db
      .select({
        status: tasks.status,
        count: sql<number>`count(*)`,
      })
      .from(tasks)
      .groupBy(tasks.status);

    return results;
  }

  private async getTeamPerformanceReport(params?: any) {
    const results = await db
      .select({
        assignee: tasks.assignee,
        totalTasks: sql<number>`count(*)`,
        completedTasks: sql<number>`count(*) filter (where status = 'Closed')`,
        avgProgress: sql<number>`avg(progress)`,
      })
      .from(tasks)
      .where(sql`assignee is not null`)
      .groupBy(tasks.assignee);

    return results;
  }

  private async getProjectOverviewReport(params?: any) {
    const results = await db
      .select({
        projectId: tasks.projectId,
        projectName: projects.name,
        totalTasks: sql<number>`count(*)`,
        completedTasks: sql<number>`count(*) filter (where ${tasks.status} = 'Closed')`,
        inProgressTasks: sql<number>`count(*) filter (where ${tasks.status} = 'InProgress')`,
        blockedTasks: sql<number>`count(*) filter (where ${tasks.status} = 'Blocked')`,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .groupBy(tasks.projectId, projects.name);

    return results;
  }
}

export const storage = new DatabaseStorage();