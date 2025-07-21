import { 
  projects, 
  tasks, 
  comments, 
  activities,
  type Project, 
  type Task, 
  type Comment, 
  type Activity,
  type InsertProject, 
  type InsertTask, 
  type InsertComment, 
  type InsertActivity,
  type UpdateTask,
  type UpdateProject
} from "@shared/schema";

export interface IStorage {
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: UpdateProject): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Tasks
  getTasks(projectId?: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  updateTaskStatus(id: number, status: string): Promise<Task | undefined>;

  // Comments
  getTaskComments(taskId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;

  // Activities
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Search
  searchTasks(query: string): Promise<Task[]>;
}

export class MemStorage implements IStorage {
  private projects: Map<number, Project>;
  private tasks: Map<number, Task>;
  private comments: Map<number, Comment>;
  private activities: Map<number, Activity>;
  private currentProjectId: number;
  private currentTaskId: number;
  private currentCommentId: number;
  private currentActivityId: number;

  constructor() {
    this.projects = new Map();
    this.tasks = new Map();
    this.comments = new Map();
    this.activities = new Map();
    this.currentProjectId = 1;
    this.currentTaskId = 1;
    this.currentCommentId = 1;
    this.currentActivityId = 1;

    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create sample projects
    const project1: Project = {
      id: this.currentProjectId++,
      name: "Website Redesign",
      description: "Redesign the company website with modern UI/UX",
      color: "blue",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const project2: Project = {
      id: this.currentProjectId++,
      name: "Mobile App",
      description: "Develop a mobile application for iOS and Android",
      color: "green",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const project3: Project = {
      id: this.currentProjectId++,
      name: "Marketing Campaign",
      description: "Launch a comprehensive digital marketing campaign",
      color: "purple",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.projects.set(project1.id, project1);
    this.projects.set(project2.id, project2);
    this.projects.set(project3.id, project3);

    // Create sample tasks
    const tasks = [
      {
        id: this.currentTaskId++,
        title: "Update homepage design",
        description: "Redesign the homepage layout to improve user engagement and conversion rates.",
        content: null,
        status: "todo",
        priority: "high",
        projectId: project1.id,
        assignee: "Sarah Miller",
        dueDate: new Date("2024-12-15"),
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentTaskId++,
        title: "Design user authentication flow",
        description: "Create wireframes and prototypes for the login and registration process.",
        content: null,
        status: "todo",
        priority: "medium",
        projectId: project2.id,
        assignee: "John Doe",
        dueDate: new Date("2024-12-20"),
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentTaskId++,
        title: "Create social media content",
        description: "Develop engaging posts for Instagram, Twitter, and LinkedIn campaigns.",
        content: null,
        status: "inprogress",
        priority: "low",
        projectId: project3.id,
        assignee: "Alex Johnson",
        dueDate: new Date("2024-12-18"),
        progress: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentTaskId++,
        title: "Research competitor websites",
        description: "Analyze top 10 competitor websites for design inspiration and best practices.",
        content: null,
        status: "done",
        priority: "medium",
        projectId: project1.id,
        assignee: "Sarah Miller",
        dueDate: new Date("2024-12-10"),
        progress: 100,
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
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: this.currentActivityId++,
        type: "commented",
        description: "Alex Johnson commented on \"Create social media content\"",
        taskId: 3,
        projectId: project3.id,
        user: "Alex Johnson",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        id: this.currentActivityId++,
        type: "created",
        description: "John Doe created new task \"Design user authentication flow\"",
        taskId: 2,
        projectId: project2.id,
        user: "John Doe",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
    ];

    activities.forEach(activity => this.activities.set(activity.id, activity));
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

  // Search
  async searchTasks(query: string): Promise<Task[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.tasks.values()).filter(task =>
      task.title.toLowerCase().includes(lowercaseQuery) ||
      (task.description && task.description.toLowerCase().includes(lowercaseQuery)) ||
      (task.assignee && task.assignee.toLowerCase().includes(lowercaseQuery))
    );
  }
}

export const storage = new MemStorage();
