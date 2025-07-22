import { 
  projects, 
  applications,
  projectApplications,
  tasks, 
  comments, 
  activities,
  notifications,
  timeEntries,
  teamMembers,
  type Project,
  type Application,
  type ProjectApplication,
  type Task, 
  type Comment, 
  type Activity,
  type Notification,
  type TimeEntry,
  type TeamMember,
  type InsertProject,
  type InsertApplication,
  type InsertProjectApplication,
  type InsertTask, 
  type InsertComment, 
  type InsertActivity,
  type InsertNotification,
  type InsertTimeEntry,
  type InsertTeamMember,
  type UpdateTask,
  type UpdateProject,
  type UpdateApplication
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, or, ilike } from "drizzle-orm";

export interface IStorage {
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: UpdateProject): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Applications
  getApplications(projectId?: number): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, application: UpdateApplication): Promise<Application | undefined>;
  deleteApplication(id: number): Promise<boolean>;
  
  // Project-Application relationships
  getProjectApplications(projectId: number): Promise<{applicationId: number}[]>;
  linkApplicationsToProject(projectId: number, applicationIds: number[]): Promise<void>;
  unlinkApplicationFromProject(projectId: number, applicationId: number): Promise<void>;
  updateProjectApplications(projectId: number, applicationIds: number[]): Promise<void>;

  // Tasks
  getTasks(projectId?: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  updateTaskStatus(id: number, status: string): Promise<Task | undefined>;
  getTasksByAssignee(assignee: string): Promise<Task[]>;

  // Comments
  getTaskComments(taskId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;

  // Activities
  getActivities(limit?: number): Promise<Activity[]>;
  getActivitiesByProject(projectId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<boolean>;

  // Time tracking
  getTimeEntries(taskId?: number, userId?: string): Promise<TimeEntry[]>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  deleteTimeEntry(id: number): Promise<boolean>;

  // Team members
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: number): Promise<TeamMember | undefined>;
  createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: number, teamMember: Partial<InsertTeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: number): Promise<boolean>;

  // Search
  searchTasks(query: string): Promise<Task[]>;

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
}

export class MemStorage implements IStorage {
  private projects: Map<number, Project>;
  private applications: Map<number, Application>;
  private tasks: Map<number, Task>;
  private comments: Map<number, Comment>;
  private activities: Map<number, Activity>;
  private notifications: Map<number, Notification>;
  private timeEntries: Map<number, TimeEntry>;
  private teamMembers: Map<number, TeamMember>;
  private currentProjectId: number;
  private currentApplicationId: number;
  private currentTaskId: number;
  private currentCommentId: number;
  private currentActivityId: number;
  private currentNotificationId: number;
  private currentTimeEntryId: number;
  private currentTeamMemberId: number;

  constructor() {
    this.projects = new Map();
    this.applications = new Map();
    this.tasks = new Map();
    this.comments = new Map();
    this.activities = new Map();
    this.notifications = new Map();
    this.timeEntries = new Map();
    this.teamMembers = new Map();
    this.currentProjectId = 1;
    this.currentApplicationId = 1;
    this.currentTaskId = 1;
    this.currentCommentId = 1;
    this.currentActivityId = 1;
    this.currentNotificationId = 1;
    this.currentTimeEntryId = 1;
    this.currentTeamMemberId = 1;

    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create sample team members first
    const teamMembers = [
      {
        id: this.currentTeamMemberId++,
        name: "Sarah Miller",
        email: "sarah@company.com",
        avatar: null,
        role: "manager",
        department: "Design",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: this.currentTeamMemberId++,
        name: "John Doe",
        email: "john@company.com", 
        avatar: null,
        role: "member",
        department: "Engineering",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: this.currentTeamMemberId++,
        name: "Alex Johnson",
        email: "alex@company.com",
        avatar: null,
        role: "member", 
        department: "Marketing",
        isActive: true,
        createdAt: new Date(),
      }
    ];

    teamMembers.forEach(member => this.teamMembers.set(member.id, member));

    // Create sample projects with enhanced data
    const project1: Project = {
      id: this.currentProjectId++,
      name: "Website Redesign",
      description: "Redesign the company website with modern UI/UX",
      color: "blue",
      status: "active",
      startDate: new Date("2024-11-01"),
      endDate: new Date("2025-01-31"),
      teamMembers: ["Sarah Miller", "John Doe"],
      tags: ["design", "frontend", "ux"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const project2: Project = {
      id: this.currentProjectId++,
      name: "Mobile App",
      description: "Develop a mobile application for iOS and Android",
      color: "green",
      status: "active",
      startDate: new Date("2024-12-01"),
      endDate: new Date("2025-06-30"),
      teamMembers: ["John Doe"],
      tags: ["mobile", "react-native", "ios", "android"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const project3: Project = {
      id: this.currentProjectId++,
      name: "Marketing Campaign",
      description: "Launch a comprehensive digital marketing campaign",
      color: "purple",
      status: "active",
      startDate: new Date("2024-11-15"),
      endDate: new Date("2025-02-15"),
      teamMembers: ["Alex Johnson"],
      tags: ["marketing", "social-media", "content"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.projects.set(project1.id, project1);
    this.projects.set(project2.id, project2);
    this.projects.set(project3.id, project3);

    // Create sample applications
    const applications = [
      {
        id: this.currentApplicationId++,
        name: "Website Frontend",
        description: "Main website frontend application",
        projectId: project1.id,
        color: "#3b82f6",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentApplicationId++,
        name: "Admin Dashboard",
        description: "Administrative dashboard for content management",
        projectId: project1.id,
        color: "#10b981",
        status: "active", 
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentApplicationId++,
        name: "iOS App",
        description: "Native iOS mobile application",
        projectId: project2.id,
        color: "#f59e0b",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentApplicationId++,
        name: "Android App",
        description: "Native Android mobile application",
        projectId: project2.id,
        color: "#ef4444",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    applications.forEach(app => this.applications.set(app.id, app));

    // Create sample tasks with enhanced data
    const tasks = [
      {
        id: this.currentTaskId++,
        title: "Update homepage design",
        description: "Redesign the homepage layout to improve user engagement and conversion rates.",
        content: null,
        status: "Open",
        priority: "high",
        projectId: project1.id,
        assignee: "Sarah Miller",
        dueDate: new Date("2024-12-15"),
        progress: 0,

        applicationId: null,
        tags: ["design", "ui", "homepage"],
        dependencies: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentTaskId++,
        title: "Design user authentication flow",
        description: "Create wireframes and prototypes for the login and registration process.",
        content: null,
        status: "Open",
        priority: "medium",
        projectId: project2.id,
        assignee: "John Doe",
        dueDate: new Date("2024-12-20"),
        progress: 0,

        applicationId: null,
        tags: ["design", "authentication", "ux"],
        dependencies: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentTaskId++,
        title: "Create social media content",
        description: "Develop engaging posts for Instagram, Twitter, and LinkedIn campaigns.",
        content: null,
        status: "InProgress",
        priority: "low",
        projectId: project3.id,
        assignee: "Alex Johnson",
        dueDate: new Date("2024-12-18"),
        progress: 60,

        applicationId: null,
        tags: ["content", "social-media", "marketing"],
        dependencies: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentTaskId++,
        title: "Research competitor websites",
        description: "Analyze top 10 competitor websites for design inspiration and best practices.",
        content: null,
        status: "Closed",
        priority: "medium",
        projectId: project1.id,
        assignee: "Sarah Miller",
        dueDate: new Date("2024-12-10"),
        progress: 100,

        applicationId: null,
        tags: ["research", "analysis", "competitors"],
        dependencies: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    tasks.forEach(task => this.tasks.set(task.id, task));

    // Create sample activities
    const activities = [
      {
        id: this.currentActivityId++,
        type: "completed",
        description: "Sarah Miller completed task \"Research competitor websites\"",
        taskId: 4,
        projectId: project1.id,
        user: "Sarah Miller",
        metadata: null,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: this.currentActivityId++,
        type: "commented",
        description: "Alex Johnson commented on \"Create social media content\"",
        taskId: 3,
        projectId: project3.id,
        user: "Alex Johnson",
        metadata: null,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        id: this.currentActivityId++,
        type: "created",
        description: "John Doe created new task \"Design user authentication flow\"",
        taskId: 2,
        projectId: project2.id,
        user: "John Doe",
        metadata: null,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
    ];

    activities.forEach(activity => this.activities.set(activity.id, activity));

    // Create sample notifications
    const notifications = [
      {
        id: this.currentNotificationId++,
        userId: "sarah@company.com",
        title: "Task Assigned",
        message: "You have been assigned to \"Update homepage design\"",
        type: "task_assigned",
        isRead: false,
        taskId: 1,
        projectId: project1.id,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        id: this.currentNotificationId++,
        userId: "john@company.com", 
        title: "Deadline Approaching",
        message: "Task \"Design user authentication flow\" is due in 3 days",
        type: "deadline_approaching",
        isRead: false,
        taskId: 2,
        projectId: project2.id,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
      {
        id: this.currentNotificationId++,
        userId: "alex@company.com",
        title: "Task Completed",
        message: "Sarah Miller completed \"Research competitor websites\"",
        type: "task_completed",
        isRead: true,
        taskId: 4,
        projectId: project1.id,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      }
    ];

    notifications.forEach(notification => this.notifications.set(notification.id, notification));

    // Create sample time entries  
    const timeEntries = [
      {
        id: this.currentTimeEntryId++,
        taskId: 3,
        userId: "alex@company.com",
        description: "Created Instagram posts and graphics",
        hours: 180, // 3 hours in minutes
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.currentTimeEntryId++,
        taskId: 4,
        userId: "sarah@company.com", 
        description: "Research and analysis of 10 competitor websites",
        hours: 420, // 7 hours in minutes
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.currentTimeEntryId++,
        taskId: 3,
        userId: "alex@company.com",
        description: "Content planning and strategy session",
        hours: 120, // 2 hours in minutes
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      }
    ];

    timeEntries.forEach(entry => this.timeEntries.set(entry.id, entry));
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const project: Project = {
      ...insertProject,
      id: this.currentProjectId++,
      color: insertProject.color || "blue",
      description: insertProject.description || null,
      status: insertProject.status || "active",
      assignees: insertProject.assignees || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(project.id, project);
    return project;
  }

  async updateProject(id: number, updateProject: UpdateProject): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updated: Project = {
      ...project,
      ...updateProject,
      updatedAt: new Date(),
    };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Applications
  async getApplications(projectId?: number): Promise<Application[]> {
    return Array.from(this.applications.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const application: Application = {
      ...insertApplication,
      id: this.currentApplicationId++,
      description: insertApplication.description || null,
      color: insertApplication.color || "#10b981",
      status: insertApplication.status || "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.applications.set(application.id, application);
    return application;
  }

  async updateApplication(id: number, updateApplication: UpdateApplication): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updated: Application = {
      ...application,
      ...updateApplication,
      updatedAt: new Date(),
    };
    this.applications.set(id, updated);
    return updated;
  }

  async deleteApplication(id: number): Promise<boolean> {
    return this.applications.delete(id);
  }

  // Project-Application relationships (for MemStorage, we'll use a simple mapping)
  private projectApplicationMap: Map<number, Set<number>> = new Map();

  async getProjectApplications(projectId: number): Promise<{applicationId: number}[]> {
    const applicationIds = this.projectApplicationMap.get(projectId) || new Set();
    return Array.from(applicationIds).map(id => ({ applicationId: id }));
  }

  async linkApplicationsToProject(projectId: number, applicationIds: number[]): Promise<void> {
    const currentApplications = this.projectApplicationMap.get(projectId) || new Set();
    applicationIds.forEach(id => currentApplications.add(id));
    this.projectApplicationMap.set(projectId, currentApplications);
  }

  async unlinkApplicationFromProject(projectId: number, applicationId: number): Promise<void> {
    const applications = this.projectApplicationMap.get(projectId);
    if (applications) {
      applications.delete(applicationId);
    }
  }

  async updateProjectApplications(projectId: number, applicationIds: number[]): Promise<void> {
    this.projectApplicationMap.set(projectId, new Set(applicationIds));
  }

  // Tasks
  async getTasks(projectId?: number): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values());
    if (projectId) {
      tasks = tasks.filter(task => task.projectId === projectId);
    }
    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const task: Task = {
      ...insertTask,
      id: this.currentTaskId++,
      description: insertTask.description || null,
      content: insertTask.content || null,
      status: insertTask.status || "todo",
      priority: insertTask.priority || "medium",
      projectId: insertTask.projectId || null,
      assignee: insertTask.assignee || null,
      dueDate: insertTask.dueDate || null,
      progress: insertTask.progress || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(task.id, task);

    // Create activity
    await this.createActivity({
      type: "created",
      description: `${task.assignee || "Someone"} created new task "${task.title}"`,
      taskId: task.id,
      projectId: task.projectId || undefined,
      user: task.assignee || "Unknown",
    });

    return task;
  }

  async updateTask(id: number, updateTask: UpdateTask): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updated: Task = {
      ...task,
      ...updateTask,
      updatedAt: new Date(),
    };
    this.tasks.set(id, updated);

    // Create activity for status change
    if (updateTask.status && updateTask.status !== task.status) {
      await this.createActivity({
        type: updateTask.status === "done" ? "completed" : "updated",
        description: `${updated.assignee || "Someone"} ${updateTask.status === "done" ? "completed" : "updated"} task "${updated.title}"`,
        taskId: updated.id,
        projectId: updated.projectId || undefined,
        user: updated.assignee || "Unknown",
      });
    }

    return updated;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async updateTaskStatus(id: number, status: string): Promise<Task | undefined> {
    return this.updateTask(id, { 
      status, 
      progress: status === "done" ? 100 : status === "inprogress" ? 50 : 0 
    });
  }

  // Comments
  async getTaskComments(taskId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.taskId === taskId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const comment: Comment = {
      ...insertComment,
      id: this.currentCommentId++,
      createdAt: new Date(),
    };
    this.comments.set(comment.id, comment);

    // Create activity
    const task = await this.getTask(comment.taskId);
    if (task) {
      await this.createActivity({
        type: "commented",
        description: `${comment.author} commented on "${task.title}"`,
        taskId: task.id,
        projectId: task.projectId || undefined,
        user: comment.author,
      });
    }

    return comment;
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }

  // Activities
  async getActivities(limit: number = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const activity: Activity = {
      ...insertActivity,
      id: this.currentActivityId++,
      taskId: insertActivity.taskId || null,
      projectId: insertActivity.projectId || null,
      createdAt: new Date(),
    };
    this.activities.set(activity.id, activity);
    return activity;
  }

  // Enhanced Task Methods
  async getTasksByAssignee(assignee: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.assignee === assignee)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Enhanced Activity Methods  
  async getActivitiesByProject(projectId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Notification Methods
  async getNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const notification: Notification = {
      ...insertNotification,
      id: this.currentNotificationId++,
      isRead: insertNotification.isRead || false,
      taskId: insertNotification.taskId || null,
      projectId: insertNotification.projectId || null,
      createdAt: new Date(),
    };
    this.notifications.set(notification.id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.isRead = true;
      return true;
    }
    return false;
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead);
    
    userNotifications.forEach(notification => {
      notification.isRead = true;
    });

    return true;
  }

  // Time Entry Methods
  async getTimeEntries(taskId?: number, userId?: string): Promise<TimeEntry[]> {
    let entries = Array.from(this.timeEntries.values());
    
    if (taskId) {
      entries = entries.filter(entry => entry.taskId === taskId);
    }
    if (userId) {
      entries = entries.filter(entry => entry.userId === userId);
    }
    
    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const timeEntry: TimeEntry = {
      ...insertTimeEntry,
      id: this.currentTimeEntryId++,
      description: insertTimeEntry.description || null,
      date: insertTimeEntry.date || new Date(),
      createdAt: new Date(),
    };
    this.timeEntries.set(timeEntry.id, timeEntry);
    return timeEntry;
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    return this.timeEntries.delete(id);
  }

  // Team Member Methods
  async getTeamMembers(): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values())
      .filter(member => member.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    return this.teamMembers.get(id);
  }

  async createTeamMember(insertTeamMember: InsertTeamMember): Promise<TeamMember> {
    const teamMember: TeamMember = {
      ...insertTeamMember,
      id: this.currentTeamMemberId++,
      avatar: insertTeamMember.avatar || null,
      department: insertTeamMember.department || null,
      isActive: insertTeamMember.isActive ?? true,
      createdAt: new Date(),
    };
    this.teamMembers.set(teamMember.id, teamMember);
    return teamMember;
  }

  async updateTeamMember(id: number, updateTeamMember: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    const existing = this.teamMembers.get(id);
    if (!existing) return undefined;

    const updated: TeamMember = {
      ...existing,
      ...updateTeamMember,
    };

    this.teamMembers.set(id, updated);
    return updated;
  }

  async deleteTeamMember(id: number): Promise<boolean> {
    return this.teamMembers.delete(id);
  }

  // Enhanced Stats
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
    const tasks = Array.from(this.tasks.values());
    const timeEntries = Array.from(this.timeEntries.values());
    const teamMembers = Array.from(this.teamMembers.values()).filter(m => m.isActive);
    const notifications = Array.from(this.notifications.values()).filter(n => !n.isRead);

    return {
      totalTasks: tasks.length,
      totalProjects: this.projects.size,
      todoTasks: tasks.filter(t => t.status === "Open").length,
      inProgressTasks: tasks.filter(t => t.status === "InProgress").length,
      doneTasks: tasks.filter(t => t.status === "Closed").length,
      blockedTasks: tasks.filter(t => t.status === "Blocked").length,
      totalTimeLogged: timeEntries.reduce((sum, entry) => sum + entry.hours, 0),
      activeTeamMembers: teamMembers.length,
      unreadNotifications: notifications.length,
    };
  }

  // Search
  async searchTasks(query: string): Promise<Task[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.tasks.values()).filter(task =>
      task.title.toLowerCase().includes(lowercaseQuery) ||
      (task.description && task.description.toLowerCase().includes(lowercaseQuery)) ||
      (task.assignee && task.assignee.toLowerCase().includes(lowercaseQuery)) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
    );
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  constructor() {
    setTimeout(() => this.initializeData(), 100);
  }

  private async initializeData() {
    try {
      // Check if data already exists
      const existingProjects = await db.select().from(projects);
      if (existingProjects.length > 0) {
        return; // Data already exists
      }

      // Initialize with sample data
      const sampleProjects = [
        {
          name: "Website Redesign",
          description: "Redesign the company website with modern UI/UX",
          color: "blue",
          status: "active",
          startDate: new Date("2024-11-01"),
          endDate: new Date("2025-01-31"),
          assignees: ["Sarah Miller", "John Doe"],
          teamMembers: ["Sarah Miller", "John Doe"],
          tags: ["design", "frontend", "ux"],
        },
        {
          name: "Mobile App",
          description: "Develop a mobile application for iOS and Android",
          color: "green",
          status: "active",
          startDate: new Date("2024-12-01"),
          endDate: new Date("2025-06-30"),
          assignees: ["John Doe"],
          teamMembers: ["John Doe"],
          tags: ["mobile", "react-native", "ios", "android"],
        },
        {
          name: "Marketing Campaign",
          description: "Launch a comprehensive digital marketing campaign",
          color: "purple",
          status: "active",
          startDate: new Date("2024-11-15"),
          endDate: new Date("2025-02-15"),
          assignees: ["Alex Johnson"],
          teamMembers: ["Alex Johnson"],
          tags: ["marketing", "social-media", "content"],
        }
      ];

      const insertedProjects = await db.insert(projects).values(sampleProjects).returning();
      
      // Create sample tasks
      const sampleTasks = [
        {
          title: "Update homepage design",
          description: "Redesign the homepage layout to improve user engagement",
          status: "Open",
          priority: "high",
          projectId: insertedProjects[0].id,
          assignee: "Sarah Miller",
          dueDate: new Date("2024-12-15"),
          progress: 0,
          tags: ["design", "ui", "homepage"],
          content: null,
          actualHours: null,
          applicationId: null,
          dependencies: null
        },
        {
          title: "Design user authentication flow",
          description: "Create wireframes and prototypes for login process",
          status: "Open",
          priority: "medium",
          projectId: insertedProjects[1].id,
          assignee: "John Doe",
          dueDate: new Date("2024-12-20"),
          progress: 0,
          tags: ["design", "authentication", "ux"],
          content: null,
          actualHours: null,
          applicationId: null,
          dependencies: null
        },
        {
          title: "Create social media content",
          description: "Develop engaging posts for social media campaigns",
          status: "InProgress",
          priority: "low",
          projectId: insertedProjects[2].id,
          assignee: "Alex Johnson",
          dueDate: new Date("2024-12-18"),
          progress: 60,
          tags: ["content", "social-media", "marketing"],
          content: null,
          actualHours: null,
          applicationId: null,
          dependencies: null
        }
      ];

      await db.insert(tasks).values(sampleTasks);

      // Create team members
      const sampleTeamMembers = [
        {
          name: "Sarah Miller",
          email: "sarah@company.com",
          role: "manager",
          department: "Design",
          isActive: true,
        },
        {
          name: "John Doe",
          email: "john@company.com",
          role: "member",
          department: "Engineering",
          isActive: true,
        },
        {
          name: "Alex Johnson",
          email: "alex@company.com",
          role: "member",
          department: "Marketing",
          isActive: true,
        }
      ];

      await db.insert(teamMembers).values(sampleTeamMembers);
    } catch (error) {
      console.log('Database initialization skipped or failed:', error);
    }
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
      })
      .from(projectApplications)
      .innerJoin(applications, eq(projectApplications.applicationId, applications.id))
      .where(eq(projectApplications.projectId, projectId));
    
    return result;
  }

  async linkApplicationsToProject(projectId: number, applicationIds: number[]): Promise<void> {
    // Remove existing relationships for this project
    await db.delete(projectApplications).where(eq(projectApplications.projectId, projectId));
    
    // Add new relationships
    if (applicationIds.length > 0) {
      const relationships = applicationIds.map(applicationId => ({
        projectId,
        applicationId
      }));
      await db.insert(projectApplications).values(relationships);
    }
  }

  async unlinkApplicationFromProject(projectId: number, applicationId: number): Promise<void> {
    await db.delete(projectApplications)
      .where(and(
        eq(projectApplications.projectId, projectId),
        eq(projectApplications.applicationId, applicationId)
      ));
  }

  async updateProjectApplications(projectId: number, applicationIds: number[]): Promise<void> {
    // This is the same as linkApplicationsToProject - remove and re-add all relationships
    await this.linkApplicationsToProject(projectId, applicationIds);
  }

  // Tasks
  async getTasks(projectId?: number): Promise<Task[]> {
    if (projectId) {
      return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
    }
    return await db.select().from(tasks);
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

  async updateTaskStatus(id: number, status: string): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ status, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async getTasksByAssignee(assignee: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.assignee, assignee));
  }

  // Comments
  async getTaskComments(taskId: number): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.taskId, taskId));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }

  async deleteComment(id: number): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Activities
  async getActivities(limit = 50): Promise<Activity[]> {
    return await db.select().from(activities).limit(limit);
  }

  async getActivitiesByProject(projectId: number): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.projectId, projectId));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(insertActivity).returning();
    return activity;
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
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

  // Time tracking
  async getTimeEntries(taskId?: number, userId?: string): Promise<TimeEntry[]> {
    let query = db.select().from(timeEntries);
    
    if (taskId && userId) {
      return await query.where(and(eq(timeEntries.taskId, taskId), eq(timeEntries.userId, userId)));
    } else if (taskId) {
      return await query.where(eq(timeEntries.taskId, taskId));
    } else if (userId) {
      return await query.where(eq(timeEntries.userId, userId));
    }
    
    return await query;
  }

  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const [timeEntry] = await db.insert(timeEntries).values(insertTimeEntry).returning();
    return timeEntry;
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    const result = await db.delete(timeEntries).where(eq(timeEntries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Team members
  async getTeamMembers(): Promise<TeamMember[]> {
    return await db.select().from(teamMembers);
  }

  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    const [teamMember] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return teamMember;
  }

  async createTeamMember(insertTeamMember: InsertTeamMember): Promise<TeamMember> {
    const [teamMember] = await db.insert(teamMembers).values(insertTeamMember).returning();
    return teamMember;
  }

  async updateTeamMember(id: number, updateTeamMember: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    const [teamMember] = await db
      .update(teamMembers)
      .set(updateTeamMember)
      .where(eq(teamMembers.id, id))
      .returning();
    return teamMember;
  }

  async deleteTeamMember(id: number): Promise<boolean> {
    const result = await db.delete(teamMembers).where(eq(teamMembers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Search
  async searchTasks(query: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        or(
          ilike(tasks.title, `%${query}%`),
          ilike(tasks.description, `%${query}%`)
        )
      );
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
    const [totalTasksResult] = await db.select({ count: sql<number>`count(*)` }).from(tasks);
    const [totalProjectsResult] = await db.select({ count: sql<number>`count(*)` }).from(projects);
    const [todoTasksResult] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, 'Open'));
    const [inProgressTasksResult] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, 'InProgress'));
    const [doneTasksResult] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, 'Closed'));
    const [blockedTasksResult] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, 'Blocked'));
    const [totalTimeResult] = await db.select({ sum: sql<number>`coalesce(sum(hours), 0)` }).from(timeEntries);
    const [activeTeamMembersResult] = await db.select({ count: sql<number>`count(*)` }).from(teamMembers).where(eq(teamMembers.isActive, true));
    const [unreadNotificationsResult] = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(eq(notifications.isRead, false));

    return {
      totalTasks: totalTasksResult.count,
      totalProjects: totalProjectsResult.count,
      todoTasks: todoTasksResult.count,
      inProgressTasks: inProgressTasksResult.count,
      doneTasks: doneTasksResult.count,
      blockedTasks: blockedTasksResult.count,
      totalTimeLogged: totalTimeResult.sum,
      activeTeamMembers: activeTeamMembersResult.count,
      unreadNotifications: unreadNotificationsResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
