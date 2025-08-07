import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { configureSession, setupAuthRoutes, requireAuth } from "./auth";
import {
  insertClientSchema,
  insertProjectSchema,
  insertApplicationSchema,
  insertTaskSchema,
  insertCommentSchema,
  insertNotificationSchema,
  insertTimeEntrySchema,
  insertTeamSchema,
  insertTeamMemberSchema,
  updateTaskSchema,
  updateProjectSchema,
  updateClientSchema,
  updateApplicationSchema,
  updateTeamSchema,
  updateTeamMemberSchema,
  insertUserClientPermissionSchema,
  insertLoanSchema,
  insertLoanPaymentSchema,
  updateLoanSchema,
  updateLoanPaymentSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(configureSession());

  // Setup authentication routes
  setupAuthRoutes(app);

  // Client routes (protected with user permissions)
  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      console.log("Fetching clients for user:", userId);
      const clients = await storage.getUserAccessibleClients(userId);
      console.log("Found clients:", clients);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if user has permission to view this client
      const hasPermission = await storage.checkUserClientPermission(userId, id, 'view');
      if (!hasPermission) {
        return res.status(403).json({ message: "You don't have permission to view this client" });
      }
      
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      // Only admins can create clients
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can create clients" });
      }
      
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if user has permission to edit this client
      const hasPermission = await storage.checkUserClientPermission(userId, id, 'edit');
      if (!hasPermission) {
        return res.status(403).json({ message: "You don't have permission to edit this client" });
      }
      
      const clientData = updateClientSchema.parse(req.body);
      const client = await storage.updateClient(id, clientData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if user has permission to delete this client
      const hasPermission = await storage.checkUserClientPermission(userId, id, 'delete');
      if (!hasPermission) {
        return res.status(403).json({ message: "You don't have permission to delete this client" });
      }
      
      const deleted = await storage.deleteClient(id);
      if (!deleted) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Projects routes (protected with user permissions)
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      if (clientId) {
        // Check if user has permission to view this client
        const hasPermission = await storage.checkUserClientPermission(userId, clientId, 'view');
        if (!hasPermission) {
          return res.status(403).json({ message: "You don't have permission to view this client's projects" });
        }
        const projects = await storage.getProjects(clientId);
        res.json(projects);
      } else {
        const projects = await storage.getUserAccessibleProjects(userId);
        res.json(projects);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if user has permission to view this project
      const hasPermission = await storage.checkUserProjectPermission(userId, id, 'view');
      if (!hasPermission) {
        return res.status(403).json({ message: "You don't have permission to view this project" });
      }
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const projectData = insertProjectSchema.parse(req.body);
      
      // Check if user has permission to manage projects for this client (if client is assigned)
      if (projectData.clientId) {
        const hasPermission = await storage.checkUserClientPermission(userId, projectData.clientId, 'manage');
        if (!hasPermission) {
          return res.status(403).json({ message: "You don't have permission to create projects for this client" });
        }
      }
      
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if user has permission to edit this project
      const hasPermission = await storage.checkUserProjectPermission(userId, id, 'edit');
      if (!hasPermission) {
        return res.status(403).json({ message: "You don't have permission to edit this project" });
      }
      
      const updateData = updateProjectSchema.parse(req.body);
      const project = await storage.updateProject(id, updateData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Get project to find its client
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has permission to delete projects for this client (if client is assigned)
      if (project.clientId) {
        const hasPermission = await storage.checkUserClientPermission(userId, project.clientId, 'delete');
        if (!hasPermission) {
          return res.status(403).json({ message: "You don't have permission to delete projects for this client" });
        }
      }
      
      const deleted = await storage.deleteProject(id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Applications routes (protected with project permissions)
  app.get("/api/applications", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      
      if (projectId) {
        // Check if user has permission to view this project
        const hasPermission = await storage.checkUserProjectPermission(userId, projectId, 'view');
        if (!hasPermission) {
          return res.status(403).json({ message: "You don't have permission to view this project's applications" });
        }
      }
      
      const applications = await storage.getApplications(projectId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/applications/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.post("/api/applications", requireAuth, async (req, res) => {
    try {
      const applicationData = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.put("/api/applications/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const applicationData = insertApplicationSchema.parse(req.body);
      const application = await storage.updateApplication(id, applicationData);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  app.delete("/api/applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`DELETE request for application ID: ${id}`);
      
      const deleted = await storage.deleteApplication(id);
      if (!deleted) {
        console.log(`Application ${id} not found or already deleted`);
        return res.status(404).json({ message: "Application not found" });
      }
      
      console.log(`Application ${id} successfully deleted`);
      res.status(204).send();
    } catch (error) {
      console.error(`Error in DELETE /api/applications/${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  app.patch("/api/applications/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = updateApplicationSchema.parse(req.body);
      const application = await storage.updateApplication(id, updateData);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Get projects associated with an application
  app.get("/api/applications/:id/projects", requireAuth, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const projects = await storage.getApplicationProjects(applicationId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching application projects:", error);
      res.status(500).json({ message: "Failed to fetch application projects" });
    }
  });

  // Project-Application relationship routes (protected)
  app.get("/api/projects/:projectId/applications", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const applications = await storage.getProjectApplications(projectId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project applications" });
    }
  });

  app.post("/api/projects/:projectId/applications", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { applicationIds } = z.object({ applicationIds: z.array(z.number()) }).parse(req.body);
      
      // Link each application to the project
      for (const applicationId of applicationIds) {
        await storage.addProjectApplication(projectId, applicationId);
      }
      
      res.status(201).json({ message: "Applications linked successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application IDs", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to link applications" });
    }
  });

  app.put("/api/projects/:projectId/applications", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { applicationIds } = z.object({ applicationIds: z.array(z.number()) }).parse(req.body);
      console.log(`Updating project ${projectId} applications:`, applicationIds);
      
      // Get current project applications
      const currentApps = await storage.getProjectApplications(projectId);
      const currentAppIds = currentApps.map(app => app.id);
      
      // Remove applications that are no longer selected
      for (const currentAppId of currentAppIds) {
        if (!applicationIds.includes(currentAppId)) {
          await storage.removeProjectApplication(projectId, currentAppId);
        }
      }
      
      // Add new applications
      for (const applicationId of applicationIds) {
        if (!currentAppIds.includes(applicationId)) {
          await storage.addProjectApplication(projectId, applicationId);
        }
      }
      
      res.json({ message: "Project applications updated successfully" });
    } catch (error) {
      console.error("Project applications update error:", error);
      console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application IDs", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project applications", error: (error as Error).message });
    }
  });

  app.delete("/api/projects/:projectId/applications/:applicationId", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const applicationId = parseInt(req.params.applicationId);
      await storage.removeProjectApplication(projectId, applicationId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to unlink application" });
    }
  });

  // Tasks routes (protected with user permissions)
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const filters: any = { userId };
      if (req.query.projectId) filters.projectId = parseInt(req.query.projectId as string);
      if (req.query.applicationId) filters.applicationId = parseInt(req.query.applicationId as string);
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.assignee) filters.assignee = req.query.assignee as string;
      if (req.query.priority) filters.priority = req.query.priority as string;
      
      const tasks = await storage.getTasks(filters);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/search", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const tasks = await storage.searchTasks(query, userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to search tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = updateTaskSchema.parse(req.body);
      const task = await storage.updateTask(id, updateData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.patch("/api/tasks/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = z.object({ status: z.string() }).parse(req.body);
      const task = await storage.updateTask(id, { status });
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid status data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task status" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Attempting to delete task with ID: ${id}`);
      const deleted = await storage.deleteTask(id);
      console.log(`Delete task result: ${deleted}`);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Comments routes
  app.get("/api/tasks/:taskId/comments", async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const comments = await storage.getComments(taskId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/tasks/:taskId/comments", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Create author name from user info
      const authorName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username;
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        taskId,
        author: authorName
      });
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Generic comments routes
  app.get("/api/comments", async (req, res) => {
    try {
      const taskId = req.query.taskId ? parseInt(req.query.taskId as string) : undefined;
      if (taskId) {
        const comments = await storage.getComments(taskId);
        res.json(comments);
      } else {
        res.status(400).json({ message: "taskId parameter is required" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Create author name from user info
      const authorName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username;
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        author: authorName
      });
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Activities routes (filtered by user permissions)
  app.get("/api/activities", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const taskId = req.query.taskId ? parseInt(req.query.taskId as string) : undefined;
      
      const filters: any = { limit, userId };
      if (projectId) filters.projectId = projectId;
      if (taskId) filters.taskId = taskId;
      
      const activities = await storage.getActivities(filters);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Enhanced Stats routes (filtered by user permissions)
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const stats = await storage.getStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Report routes (filtered by user permissions)
  app.post("/api/reports/generate", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { type, startDate, endDate, projectIds, format } = req.body;
      
      // Get tasks filtered by user permissions
      let tasks = await storage.getTasks({ userId });
      
      // Filter by date range
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        tasks = tasks.filter(task => 
          task.createdAt >= start && task.createdAt <= end
        );
      }
      
      // Further filter by specific projects if provided
      if (projectIds && projectIds.length > 0) {
        tasks = tasks.filter(task => 
          projectIds.includes(task.projectId)
        );
      }
      
      const reportData = {
        type,
        generatedAt: new Date(),
        dateRange: { startDate, endDate },
        tasks: tasks.length,
        completed: tasks.filter(t => t.status === "done").length,
        inProgress: tasks.filter(t => t.status === "inprogress").length,
        todo: tasks.filter(t => t.status === "todo").length,
        tasksByProject: {},
        format,
      };
      
      // Group tasks by project (only accessible projects)
      const projects = await storage.getUserAccessibleProjects(userId);
      for (const project of projects) {
        const projectTasks = tasks.filter(t => t.projectId === project.id);
        (reportData.tasksByProject as any)[project.name] = {
          total: projectTasks.length,
          completed: projectTasks.filter(t => t.status === "done").length,
          inProgress: projectTasks.filter(t => t.status === "inprogress").length,
          todo: projectTasks.filter(t => t.status === "todo").length,
        };
      }
      
      res.json(reportData);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // Notification routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/:userId/unread", async (req, res) => {
    try {
      const { userId } = req.params;
      const allNotifications = await storage.getNotifications(userId);
      const notifications = allNotifications.filter(n => !n.isRead);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/:userId/read-all", async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.markAllNotificationsAsRead(userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Time tracking routes
  app.get("/api/time-entries", async (req, res) => {
    try {
      const { taskId, userId } = req.query;
      const filters: any = {};
      if (taskId) filters.taskId = parseInt(taskId as string);
      if (userId) filters.userId = userId as string;
      
      const timeEntries = await storage.getTimeEntries(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(timeEntries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.post("/api/time-entries", async (req, res) => {
    try {
      const timeEntryData = insertTimeEntrySchema.parse(req.body);
      const timeEntry = await storage.createTimeEntry(timeEntryData);
      res.status(201).json(timeEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid time entry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create time entry" });
    }
  });

  app.delete("/api/time-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTimeEntry(id);
      if (!deleted) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete time entry" });
    }
  });

  // Teams routes
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.post("/api/teams", requireAuth, async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid team data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.patch("/api/teams/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = updateTeamSchema.parse(req.body);
      const team = await storage.updateTeam(id, updates);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Error updating team:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid team data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  app.delete("/api/teams/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTeam(id);
      if (!success) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json({ message: "Team deleted successfully" });
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Team member routes
  app.get("/api/team-members", async (req, res) => {
    try {
      const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
      const teamMembers = await storage.getTeamMembers(teamId);
      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get("/api/team-members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const teamMember = await storage.getTeamMember(id);
      if (!teamMember) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.json(teamMember);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team member" });
    }
  });

  app.post("/api/team-members", async (req, res) => {
    try {
      const teamMemberData = insertTeamMemberSchema.parse(req.body);
      const teamMember = await storage.createTeamMember(teamMemberData);
      res.status(201).json(teamMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid team member data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create team member" });
    }
  });

  app.patch("/api/team-members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body; // Partial data
      const teamMember = await storage.updateTeamMember(id, updateData);
      if (!teamMember) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.json(teamMember);
    } catch (error) {
      res.status(500).json({ message: "Failed to update team member" });
    }
  });

  app.delete("/api/team-members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTeamMember(id);
      if (!deleted) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });

  // Enhanced task routes
  app.get("/api/tasks/assignee/:assignee", async (req, res) => {
    try {
      const { assignee } = req.params;
      const tasks = await storage.getTasks({ assignee });
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks by assignee" });
    }
  });

  app.get("/api/activities/project/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const activities = await storage.getActivities({ projectId });
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project activities" });
    }
  });

  // User management routes (admin only)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can view users" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // User client permissions routes (admin only)
  app.get("/api/users/:userId/client-permissions", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const targetUserId = parseInt(req.params.userId);
      const user = await storage.getUser(currentUserId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can view user permissions" });
      }
      
      const permissions = await storage.getUserClientPermissions(targetUserId);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });

  app.post("/api/users/:userId/client-permissions", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const targetUserId = parseInt(req.params.userId);
      const user = await storage.getUser(currentUserId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can manage user permissions" });
      }
      
      const permissionData = insertUserClientPermissionSchema.parse(req.body);
      const permission = await storage.setUserClientPermissions(
        targetUserId,
        permissionData.clientId,
        permissionData
      );
      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid permission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to set user permissions" });
    }
  });

  app.delete("/api/users/:userId/client-permissions/:clientId", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const targetUserId = parseInt(req.params.userId);
      const clientId = parseInt(req.params.clientId);
      const user = await storage.getUser(currentUserId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can manage user permissions" });
      }
      
      const deleted = await storage.removeUserClientPermission(targetUserId, clientId);
      if (!deleted) {
        return res.status(404).json({ message: "Permission not found" });
      }
      res.json({ message: "Permission removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove user permission" });
    }
  });

  // Loan routes
  app.get("/api/loans", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const loans = await storage.getLoans(userId);
      res.json(loans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  app.get("/api/loans/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const loan = await storage.getLoan(id);
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      res.json(loan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loan" });
    }
  });

  app.post("/api/loans", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const loanData = insertLoanSchema.parse({
        ...req.body,
        userId
      });
      const loan = await storage.createLoan(loanData);
      res.status(201).json(loan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid loan data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create loan" });
    }
  });

  app.put("/api/loans/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = updateLoanSchema.parse(req.body);
      const loan = await storage.updateLoan(id, updates);
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      res.json(loan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid loan data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update loan" });
    }
  });

  app.delete("/api/loans/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteLoan(id);
      if (!deleted) {
        return res.status(404).json({ message: "Loan not found" });
      }
      res.json({ message: "Loan deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete loan" });
    }
  });

  // Loan payments routes
  app.get("/api/loan-payments", requireAuth, async (req, res) => {
    try {
      const loanId = req.query.loanId ? parseInt(req.query.loanId as string) : undefined;
      const payments = await storage.getLoanPayments(loanId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loan payments" });
    }
  });

  app.post("/api/loan-payments", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const paymentData = insertLoanPaymentSchema.parse({
        ...req.body,
        userId
      });
      const payment = await storage.createLoanPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.put("/api/loan-payments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = updateLoanPaymentSchema.parse(req.body);
      const payment = await storage.updateLoanPayment(id, updates);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  app.delete("/api/loan-payments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteLoanPayment(id);
      if (!deleted) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json({ message: "Payment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
