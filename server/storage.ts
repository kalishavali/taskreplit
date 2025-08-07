import { eq, like, ilike, and, desc, or, asc, sql, inArray } from "drizzle-orm";
import { db } from "./db.js";
import {
  clients,
  projects,
  tasks,
  applications,
  teams,
  teamMembers,
  activities,
  comments,
  notifications,
  projectApplications,
  timeEntries,
  users,
  sessions,
  userClientPermissions,
  loans,
  loanPayments,
  products,
  electronics,
  vehicles,
  jewellery,
  gadgets,
  type Client,
  type Project,
  type Task,
  type Application,
  type Team,
  type TeamMember,
  type Activity,
  type Comment,
  type Notification,
  type ProjectApplication,
  type TimeEntry,
  type User,
  type Session,
  type UserClientPermission,
  type Loan,
  type LoanPayment,
  type Product,
  type Electronics,
  type Vehicle,
  type Jewellery,
  type Gadget,
  type InsertClient,
  type InsertProject,
  type InsertTask,
  type InsertApplication,
  type InsertTeam,
  type InsertTeamMember,
  type InsertActivity,
  type InsertComment,
  type InsertNotification,
  type InsertProjectApplication,
  type InsertTimeEntry,
  type InsertUser,
  type InsertSession,
  type InsertUserClientPermission,
  type InsertLoan,
  type InsertLoanPayment,
  type InsertProduct,
  type InsertElectronics,
  type InsertVehicle,
  type InsertJewellery,
  type InsertGadget,
  type UpdateClient,
  type UpdateProject,
  type UpdateTask,
  type UpdateTeam,
  type UpdateApplication,
  type UpdateTeamMember,
  type UpdateActivity,
  type UpdateComment,
  type UpdateNotification,
  type UpdateTimeEntry,
  type UpdateUser,
  type UpdateLoan,
  type UpdateLoanPayment,
  type UpdateProduct,
} from "@shared/schema";

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: UpdateClient): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Projects
  getProjects(clientId?: number): Promise<Project[]>;
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
  getApplicationProjects(applicationId: number): Promise<Project[]>;
  addProjectApplication(projectId: number, applicationId: number): Promise<boolean>;
  removeProjectApplication(projectId: number, applicationId: number): Promise<boolean>;

  // Tasks
  getTasks(filters?: {
    projectId?: number;
    applicationId?: number;
    status?: string;
    assignee?: string;
    priority?: string;
    userId?: number;
  }): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  searchTasks(query: string): Promise<Task[]>;

  // Teams
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, updates: UpdateTeam): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;

  // Team Members
  getTeamMembers(teamId?: number): Promise<TeamMember[]>;
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

  // Authentication methods
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User | undefined>;
  verifyPassword(user: User, password: string): Promise<boolean>;

  // Stats
  getStats(userId?: number): Promise<{
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

  // Loans
  getLoans(userId?: number): Promise<Loan[]>;
  getLoan(id: number): Promise<Loan | undefined>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  updateLoan(id: number, updates: UpdateLoan): Promise<Loan | undefined>;
  deleteLoan(id: number): Promise<boolean>;

  // Loan Payments
  getLoanPayments(loanId?: number): Promise<LoanPayment[]>;
  getLoanPayment(id: number): Promise<LoanPayment | undefined>;
  createLoanPayment(payment: InsertLoanPayment): Promise<LoanPayment>;
  updateLoanPayment(id: number, updates: UpdateLoanPayment): Promise<LoanPayment | undefined>;
  deleteLoanPayment(id: number): Promise<boolean>;
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  constructor() {
    console.log('Database storage initialized - using existing data');
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(clients.name);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async updateClient(id: number, updates: UpdateClient): Promise<Client | undefined> {
    const [client] = await db.update(clients).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(clients.id, id)).returning();
    return client;
  }

  async deleteClient(id: number): Promise<boolean> {
    const deleted = await db.delete(clients).where(eq(clients.id, id));
    return (deleted.rowCount ?? 0) > 0;
  }

  async getUserAccessibleClients(userId: number): Promise<Client[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    // Admins can see all clients
    if (user.role === 'admin') {
      return await this.getClients();
    }

    // Regular users can only see clients they have permissions for
    const userPermissions = await this.getUserClientPermissions(userId);
    const clientIds = userPermissions.map(p => p.clientId);
    
    if (clientIds.length === 0) return [];

    return await db.select().from(clients)
      .where(inArray(clients.id, clientIds))
      .orderBy(clients.name);
  }

  async checkUserClientPermission(userId: number, clientId: number, action: 'view' | 'edit' | 'delete' | 'manage'): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    // Admins have all permissions
    if (user.role === 'admin') return true;

    const [permission] = await db.select().from(userClientPermissions)
      .where(and(
        eq(userClientPermissions.userId, userId),
        eq(userClientPermissions.clientId, clientId)
      ));

    if (!permission) return false;

    switch (action) {
      case 'view':
        return permission.canView;
      case 'edit':
        return permission.canEdit;
      case 'delete':
        return permission.canDelete;
      case 'manage':
        return permission.canManage;
      default:
        return false;
    }
  }

  // Projects
  async getProjects(clientId?: number): Promise<Project[]> {
    if (clientId) {
      return await db.select().from(projects).where(eq(projects.clientId, clientId));
    }
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
    // First delete all tasks associated with this project
    await db.delete(tasks).where(eq(tasks.projectId, id));
    
    // Delete all project-application relationships
    await db.delete(projectApplications).where(eq(projectApplications.projectId, id));
    
    // Then delete the project itself
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Applications
  async getApplications(projectId?: number): Promise<Application[]> {
    if (projectId) {
      // Get applications that are linked to the specific project
      return await this.getProjectApplications(projectId);
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
    try {
      console.log(`Attempting to delete application with ID: ${id}`);
      
      // First, remove all project-application relationships
      const projectAppResult = await db.delete(projectApplications).where(eq(projectApplications.applicationId, id));
      console.log(`Deleted ${projectAppResult.rowCount ?? 0} project-application relationships`);
      
      // Also remove any tasks that reference this application
      const tasksResult = await db.update(tasks)
        .set({ applicationId: null })
        .where(eq(tasks.applicationId, id));
      console.log(`Updated ${tasksResult.rowCount ?? 0} tasks to remove application reference`);
      
      // Then delete the application
      const result = await db.delete(applications).where(eq(applications.id, id));
      console.log(`Application deletion result: ${result.rowCount ?? 0} rows affected`);
      
      const success = (result.rowCount ?? 0) > 0;
      console.log(`Application ${id} deletion ${success ? 'successful' : 'failed'}`);
      return success;
    } catch (error) {
      console.error(`Error deleting application ${id}:`, error);
      return false;
    }
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
      })
      .from(projectApplications)
      .innerJoin(applications, eq(projectApplications.applicationId, applications.id))
      .where(eq(projectApplications.projectId, projectId));

    return result as Application[];
  }

  async getApplicationProjects(applicationId: number): Promise<Project[]> {
    const result = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        clientId: projects.clientId,
        color: projects.color,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        assignees: projects.assignees,
        teamMembers: projects.teamMembers,
        tags: projects.tags,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projectApplications)
      .innerJoin(projects, eq(projectApplications.projectId, projects.id))
      .where(eq(projectApplications.applicationId, applicationId));

    return result as Project[];
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
    userId?: number;
  }): Promise<Task[]> {
    let query = db.select().from(tasks);

    if (filters) {
      const conditions = [];
      if (filters.projectId) conditions.push(eq(tasks.projectId, filters.projectId));
      if (filters.applicationId) conditions.push(eq(tasks.applicationId, filters.applicationId));
      if (filters.status) conditions.push(eq(tasks.status, filters.status));
      if (filters.assignee) conditions.push(eq(tasks.assignee, filters.assignee));
      if (filters.priority) conditions.push(eq(tasks.priority, filters.priority));

      // Filter by user's accessible projects
      if (filters.userId) {
        const user = await this.getUser(filters.userId);
        if (user?.role !== 'admin') {
          const accessibleProjects = await this.getUserAccessibleProjects(filters.userId);
          const projectIds = accessibleProjects.map(p => p.id);
          if (projectIds.length > 0) {
            conditions.push(inArray(tasks.projectId, projectIds));
          } else {
            return [];
          }
        }
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }

    return await query.orderBy(desc(tasks.createdAt));
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
    try {
      // Delete in proper order to respect foreign key constraints
      // 1. Delete all activities associated with this task
      await db.delete(activities).where(eq(activities.taskId, id));
      
      // 2. Delete all comments associated with this task
      await db.delete(comments).where(eq(comments.taskId, id));
      
      // 3. Delete all notifications associated with this task
      await db.delete(notifications).where(eq(notifications.taskId, id));
      
      // 4. Delete all time entries associated with this task
      await db.delete(timeEntries).where(eq(timeEntries.taskId, id));
      
      // 5. Finally delete the task itself
      const result = await db.delete(tasks).where(eq(tasks.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`Error in deleteTask for task ${id}:`, error);
      return false;
    }
  }

  async searchTasks(query: string, userId?: number): Promise<Task[]> {
    const searchPattern = `%${query}%`;
    let searchQuery = db
      .select()
      .from(tasks)
      .where(
        or(
          ilike(tasks.title, searchPattern),
          ilike(tasks.description, searchPattern),
          ilike(tasks.assignee, searchPattern)
        )
      );

    // Filter by user's accessible projects if not admin
    if (userId) {
      const user = await this.getUser(userId);
      if (user?.role !== 'admin') {
        const accessibleProjects = await this.getUserAccessibleProjects(userId);
        const projectIds = accessibleProjects.map(p => p.id);
        if (projectIds.length === 0) {
          return [];
        }
        searchQuery = searchQuery.where(inArray(tasks.projectId, projectIds));
      }
    }

    return await searchQuery.orderBy(desc(tasks.createdAt));
  }

  // Teams
  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.isActive, true)).orderBy(teams.name);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(insertTeam).returning();
    return team;
  }

  async updateTeam(id: number, updateTeam: UpdateTeam): Promise<Team | undefined> {
    const [team] = await db
      .update(teams)
      .set({ ...updateTeam, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  async deleteTeam(id: number): Promise<boolean> {
    try {
      // Set team members' teamId to null before deleting the team
      await db.update(teamMembers)
        .set({ teamId: null })
        .where(eq(teamMembers.teamId, id));
      
      // Delete the team
      const result = await db.delete(teams).where(eq(teams.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`Error deleting team ${id}:`, error);
      return false;
    }
  }

  // Team Members
  async getTeamMembers(teamId?: number): Promise<TeamMember[]> {
    let query = db.select().from(teamMembers).where(eq(teamMembers.isActive, true));
    
    if (teamId) {
      query = query.where(eq(teamMembers.teamId, teamId));
    }
    
    return await query.orderBy(teamMembers.name);
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
    userId?: number;
  }): Promise<Activity[]> {
    let query = db.select().from(activities).orderBy(desc(activities.createdAt));

    if (filters) {
      const conditions = [];
      if (filters.projectId) conditions.push(eq(activities.projectId, filters.projectId));
      if (filters.taskId) conditions.push(eq(activities.taskId, filters.taskId));

      // Filter by user's accessible projects
      if (filters.userId) {
        const user = await this.getUser(filters.userId);
        if (user?.role !== 'admin') {
          const accessibleProjects = await this.getUserAccessibleProjects(filters.userId);
          const projectIds = accessibleProjects.map(p => p.id);
          if (projectIds.length > 0) {
            conditions.push(inArray(activities.projectId, projectIds));
          } else {
            return [];
          }
        }
      }

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
      .orderBy(desc(comments.createdAt));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }

  async updateComment(id: number, updateComment: UpdateComment): Promise<Comment | undefined> {
    const [comment] = await db
      .update(comments)
      .set({ ...updateComment })
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
  async getStats(userId?: number): Promise<{
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
    // Get user's accessible project IDs if not admin
    let projectIds: number[] = [];
    if (userId) {
      const user = await this.getUser(userId);
      if (user?.role !== 'admin') {
        const accessibleProjects = await this.getUserAccessibleProjects(userId);
        projectIds = accessibleProjects.map(p => p.id);
        if (projectIds.length === 0) {
          // User has no accessible projects
          return {
            totalTasks: 0,
            totalProjects: 0,
            todoTasks: 0,
            inProgressTasks: 0,
            doneTasks: 0,
            blockedTasks: 0,
            totalTimeLogged: 0,
            activeTeamMembers: 0,
            unreadNotifications: 0,
          };
        }
      }
    }

    // Build queries with project filtering for non-admin users
    const taskFilter = projectIds.length > 0 ? inArray(tasks.projectId, projectIds) : undefined;
    const projectFilter = projectIds.length > 0 ? inArray(projects.id, projectIds) : undefined;

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
      taskFilter 
        ? db.select({ count: sql<number>`count(*)` }).from(tasks).where(taskFilter)
        : db.select({ count: sql<number>`count(*)` }).from(tasks),
      projectFilter
        ? db.select({ count: sql<number>`count(*)` }).from(projects).where(projectFilter)
        : db.select({ count: sql<number>`count(*)` }).from(projects),
      taskFilter
        ? db.select({ count: sql<number>`count(*)` }).from(tasks).where(and(taskFilter, eq(tasks.status, "todo")))
        : db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, "todo")),
      taskFilter
        ? db.select({ count: sql<number>`count(*)` }).from(tasks).where(and(taskFilter, eq(tasks.status, "inprogress")))
        : db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, "inprogress")),
      taskFilter
        ? db.select({ count: sql<number>`count(*)` }).from(tasks).where(and(taskFilter, eq(tasks.status, "done")))
        : db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, "done")),
      taskFilter
        ? db.select({ count: sql<number>`count(*)` }).from(tasks).where(and(taskFilter, eq(tasks.status, "blocked")))
        : db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, "blocked")),
      db.select({ sum: sql<number>`coalesce(sum(hours), 0)` }).from(timeEntries),
      db.select({ count: sql<number>`count(*)` }).from(teamMembers).where(eq(teamMembers.isActive, true)),
      userId 
        ? db.select({ count: sql<number>`count(*)` }).from(notifications).where(and(eq(notifications.userId, userId.toString()), eq(notifications.isRead, false)))
        : db.select({ count: sql<number>`count(*)` }).from(notifications).where(eq(notifications.isRead, false)),
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

  // Authentication methods
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    const [user] = await db.update(users).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(users.id, id)).returning();
    return user;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, user.password);
  }

  // User management methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  async deleteUser(id: number): Promise<boolean> {
    const deleted = await db.delete(users).where(eq(users.id, id));
    return (deleted.rowCount ?? 0) > 0;
  }

  // User client permissions methods
  async getUserClientPermissions(userId: number): Promise<UserClientPermission[]> {
    return await db.select().from(userClientPermissions).where(eq(userClientPermissions.userId, userId));
  }

  async getUserPermissionsForClient(userId: number, clientId: number): Promise<UserClientPermission | undefined> {
    const [permission] = await db.select()
      .from(userClientPermissions)
      .where(
        and(
          eq(userClientPermissions.userId, userId),
          eq(userClientPermissions.clientId, clientId)
        )
      );
    return permission;
  }

  async setUserClientPermissions(userId: number, clientId: number, permissions: InsertUserClientPermission): Promise<UserClientPermission> {
    // Check if permission already exists
    const existing = await this.getUserPermissionsForClient(userId, clientId);

    if (existing) {
      // Update existing permission
      const [updated] = await db.update(userClientPermissions)
        .set({
          ...permissions,
          updatedAt: new Date(),
        })
        .where(eq(userClientPermissions.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new permission
      const [created] = await db.insert(userClientPermissions)
        .values({
          ...permissions,
          userId,
          clientId,
        })
        .returning();
      return created;
    }
  }

  async removeUserClientPermission(userId: number, clientId: number): Promise<boolean> {
    const deleted = await db.delete(userClientPermissions)
      .where(
        and(
          eq(userClientPermissions.userId, userId),
          eq(userClientPermissions.clientId, clientId)
        )
      );
    return (deleted.rowCount ?? 0) > 0;
  }



  async getUserAccessibleProjects(userId: number): Promise<Project[]> {
    // Admin can access all projects
    const user = await this.getUser(userId);
    if (user?.role === 'admin') {
      return await this.getProjects();
    }

    // Regular users can only access projects from clients they have permissions for
    const accessibleClients = await this.getUserAccessibleClients(userId);
    
    if (accessibleClients.length === 0) {
      return [];
    }

    return await db.select()
      .from(projects)
      .where(inArray(projects.clientId, accessibleClients.map(c => c.id)));
  }



  async checkUserProjectPermission(userId: number, projectId: number, permission: 'view' | 'edit' | 'delete' | 'manage'): Promise<boolean> {
    // Admin has all permissions
    const user = await this.getUser(userId);
    if (user?.role === 'admin') {
      return true;
    }

    // Get project's client and check client permissions
    const project = await this.getProject(projectId);
    if (!project) {
      return false;
    }

    return await this.checkUserClientPermission(userId, project.clientId, permission);
  }

  // Loans
  async getLoans(userId?: number): Promise<Loan[]> {
    if (userId) {
      return await db.select().from(loans)
        .where(eq(loans.userId, userId))
        .orderBy(desc(loans.createdAt));
    }
    return await db.select().from(loans).orderBy(desc(loans.createdAt));
  }

  async getLoan(id: number): Promise<Loan | undefined> {
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    return loan;
  }

  async createLoan(insertLoan: InsertLoan): Promise<Loan> {
    // Calculate remaining amount as total amount initially
    const loanData = {
      ...insertLoan,
      remainingAmount: insertLoan.totalAmount,
      amountPaid: "0.00",
    };
    
    const [loan] = await db.insert(loans).values(loanData).returning();
    return loan;
  }

  async updateLoan(id: number, updates: UpdateLoan): Promise<Loan | undefined> {
    const [loan] = await db.update(loans).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(loans.id, id)).returning();
    return loan;
  }

  async deleteLoan(id: number): Promise<boolean> {
    const deleted = await db.delete(loans).where(eq(loans.id, id));
    return (deleted.rowCount ?? 0) > 0;
  }

  // Loan Payments
  async getLoanPayments(loanId?: number): Promise<LoanPayment[]> {
    if (loanId) {
      return await db.select().from(loanPayments)
        .where(eq(loanPayments.loanId, loanId))
        .orderBy(desc(loanPayments.paymentDate));
    }
    return await db.select().from(loanPayments).orderBy(desc(loanPayments.paymentDate));
  }

  async getLoanPayment(id: number): Promise<LoanPayment | undefined> {
    const [payment] = await db.select().from(loanPayments).where(eq(loanPayments.id, id));
    return payment;
  }

  async createLoanPayment(insertPayment: InsertLoanPayment): Promise<LoanPayment> {
    const [payment] = await db.insert(loanPayments).values(insertPayment).returning();
    
    // Update loan amounts based on payment type
    if (insertPayment.paymentType === 'pay') {
      // Add to total amount (you're giving more money)
      await this.updateLoanAmountsForPay(insertPayment.loanId, parseFloat(insertPayment.amount));
    } else {
      // Settle payment (borrower paying back)
      await this.updateLoanAmounts(insertPayment.loanId);
    }
    
    return payment;
  }

  async updateLoanPayment(id: number, updates: UpdateLoanPayment): Promise<LoanPayment | undefined> {
    const [payment] = await db.update(loanPayments).set(updates).where(eq(loanPayments.id, id)).returning();
    
    if (payment) {
      // Update loan amounts after payment update
      await this.updateLoanAmounts(payment.loanId);
    }
    
    return payment;
  }

  async deleteLoanPayment(id: number): Promise<boolean> {
    const payment = await this.getLoanPayment(id);
    const deleted = await db.delete(loanPayments).where(eq(loanPayments.id, id));
    
    if (payment && (deleted.rowCount ?? 0) > 0) {
      // Update loan amounts after payment deletion
      await this.updateLoanAmounts(payment.loanId);
      return true;
    }
    
    return false;
  }

  // Helper method to add payment to total amount
  private async updateLoanAmountsForPay(loanId: number, additionalAmount: number): Promise<void> {
    const loan = await this.getLoan(loanId);
    if (!loan) return;

    const newTotalAmount = parseFloat(loan.totalAmount) + additionalAmount;
    const newRemainingAmount = parseFloat(loan.remainingAmount) + additionalAmount;

    await db.update(loans)
      .set({
        totalAmount: newTotalAmount.toFixed(2),
        remainingAmount: newRemainingAmount.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(loans.id, loanId));
  }

  // Helper method to update loan amounts for settlements
  private async updateLoanAmounts(loanId: number): Promise<void> {
    const loan = await this.getLoan(loanId);
    if (!loan) return;

    const payments = await this.getLoanPayments(loanId);
    // Only count settlement payments for amount paid calculation
    const totalPaid = payments
      .filter(payment => payment.paymentType === 'settle')
      .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    
    const remaining = parseFloat(loan.totalAmount) - totalPaid;
    let status = 'active';
    
    if (totalPaid >= parseFloat(loan.totalAmount)) {
      status = 'fully_paid';
    } else if (totalPaid > 0) {
      status = 'partially_paid';
    }

    await db.update(loans).set({
      amountPaid: totalPaid.toFixed(2),
      remainingAmount: Math.max(0, remaining).toFixed(2),
      status,
      updatedAt: new Date(),
    }).where(eq(loans.id, loanId));
  }

  // Product operations
  async getProducts(userId: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.userId, userId))
      .orderBy(desc(products.createdAt));
  }

  async getProduct(id: number, userId: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.userId, userId)));
    return product;
  }

  async createProduct(data: InsertProduct, userId: number): Promise<Product> {
    // Calculate warranty expiry date if warrantyYears is provided
    let warrantyExpiryDate = null;
    if (data.warrantyYears && data.purchaseDate) {
      const purchaseDate = new Date(data.purchaseDate);
      warrantyExpiryDate = new Date(purchaseDate);
      warrantyExpiryDate.setFullYear(warrantyExpiryDate.getFullYear() + data.warrantyYears);
    }

    const [product] = await db
      .insert(products)
      .values({
        ...data,
        userId,
        warrantyExpiryDate,
      })
      .returning();
    
    return product;
  }

  async updateProduct(id: number, data: UpdateProduct, userId: number): Promise<Product> {
    // Recalculate warranty expiry if warrantyYears or purchaseDate is updated
    if (data.warrantyYears !== undefined || data.purchaseDate !== undefined) {
      const currentProduct = await this.getProduct(id, userId);
      if (currentProduct) {
        const warrantyYears = data.warrantyYears ?? currentProduct.warrantyYears;
        const purchaseDate = data.purchaseDate ?? currentProduct.purchaseDate;
        
        if (warrantyYears && purchaseDate) {
          const expiry = new Date(purchaseDate);
          expiry.setFullYear(expiry.getFullYear() + warrantyYears);
          (data as any).warrantyExpiryDate = expiry;
        }
      }
    }

    const [product] = await db
      .update(products)
      .set(data)
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .returning();
    
    if (!product) {
      throw new Error("Product not found or unauthorized");
    }
    
    return product;
  }

  async deleteProduct(id: number, userId: number): Promise<void> {
    const result = await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Product not found or unauthorized");
    }
  }

  // Electronics operations
  async createElectronics(data: InsertElectronics): Promise<Electronics> {
    const [electronics_item] = await db
      .insert(electronics)
      .values(data)
      .returning();
    
    return electronics_item;
  }

  async getElectronics(productId: number): Promise<Electronics | undefined> {
    const [electronics_item] = await db
      .select()
      .from(electronics)
      .where(eq(electronics.productId, productId));
    return electronics_item;
  }

  async updateElectronics(productId: number, data: any): Promise<Electronics> {
    const [electronics_item] = await db
      .update(electronics)
      .set(data)
      .where(eq(electronics.productId, productId))
      .returning();
    
    if (!electronics_item) {
      throw new Error("Electronics not found");
    }
    
    return electronics_item;
  }

  // Vehicle operations
  async createVehicle(data: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db
      .insert(vehicles)
      .values(data)
      .returning();
    
    return vehicle;
  }

  async getVehicle(productId: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.productId, productId));
    return vehicle;
  }

  async updateVehicle(productId: number, data: any): Promise<Vehicle> {
    const [vehicle] = await db
      .update(vehicles)
      .set(data)
      .where(eq(vehicles.productId, productId))
      .returning();
    
    if (!vehicle) {
      throw new Error("Vehicle not found");
    }
    
    return vehicle;
  }

  // Jewellery operations
  async createJewellery(data: InsertJewellery): Promise<Jewellery> {
    const [jewellery_item] = await db
      .insert(jewellery)
      .values(data)
      .returning();
    
    return jewellery_item;
  }

  async getJewellery(productId: number): Promise<Jewellery | undefined> {
    const [jewellery_item] = await db
      .select()
      .from(jewellery)
      .where(eq(jewellery.productId, productId));
    return jewellery_item;
  }

  async updateJewellery(productId: number, data: any): Promise<Jewellery> {
    const [jewellery_item] = await db
      .update(jewellery)
      .set(data)
      .where(eq(jewellery.productId, productId))
      .returning();
    
    if (!jewellery_item) {
      throw new Error("Jewellery not found");
    }
    
    return jewellery_item;
  }

  // Gadget operations
  async createGadget(data: InsertGadget): Promise<Gadget> {
    const [gadget] = await db
      .insert(gadgets)
      .values(data)
      .returning();
    
    return gadget;
  }

  async getGadget(productId: number): Promise<Gadget | undefined> {
    const [gadget] = await db
      .select()
      .from(gadgets)
      .where(eq(gadgets.productId, productId));
    return gadget;
  }

  async updateGadget(productId: number, data: any): Promise<Gadget> {
    const [gadget] = await db
      .update(gadgets)
      .set(data)
      .where(eq(gadgets.productId, productId))
      .returning();
    
    if (!gadget) {
      throw new Error("Gadget not found");
    }
    
    return gadget;
  }
}

export const storage = new DatabaseStorage();