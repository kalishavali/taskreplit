import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import {
  insertProjectSchema,
  insertApplicationSchema,
  insertTaskSchema,
  insertCommentSchema,
  insertNotificationSchema,
  insertTimeEntrySchema,
  insertTeamMemberSchema,
  updateTaskSchema,
  updateProjectSchema,
  updateApplicationSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProject(id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Applications routes
  app.get("/api/applications", async (req, res) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const applications = await storage.getApplications(projectId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/applications/:id", async (req, res) => {
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

  app.post("/api/applications", async (req, res) => {
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

  app.put("/api/applications/:id", async (req, res) => {
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
      const deleted = await storage.deleteApplication(id);
      if (!deleted) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  app.patch("/api/applications/:id", async (req, res) => {
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

  app.delete("/api/applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteApplication(id);
      if (!deleted) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  // Project-Application relationship routes
  app.get("/api/projects/:projectId/applications", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const applications = await storage.getProjectApplications(projectId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project applications" });
    }
  });

  app.post("/api/projects/:projectId/applications", async (req, res) => {
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

  app.put("/api/projects/:projectId/applications", async (req, res) => {
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
      res.status(500).json({ message: "Failed to update project applications", error: error.message });
    }
  });

  app.delete("/api/projects/:projectId/applications/:applicationId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const applicationId = parseInt(req.params.applicationId);
      await storage.removeProjectApplication(projectId, applicationId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to unlink application" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.projectId) filters.projectId = parseInt(req.query.projectId as string);
      if (req.query.applicationId) filters.applicationId = parseInt(req.query.applicationId as string);
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.assignee) filters.assignee = req.query.assignee as string;
      if (req.query.priority) filters.priority = req.query.priority as string;
      
      const tasks = await storage.getTasks(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const tasks = await storage.searchTasks(query);
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

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTask(id);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
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

  app.post("/api/tasks/:taskId/comments", async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const commentData = insertCommentSchema.parse({
        ...req.body,
        taskId,
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

  app.post("/api/comments", async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const taskId = req.query.taskId ? parseInt(req.query.taskId as string) : undefined;
      
      const filters: any = { limit };
      if (projectId) filters.projectId = projectId;
      if (taskId) filters.taskId = taskId;
      
      const activities = await storage.getActivities(filters);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Enhanced Stats routes
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Report routes
  app.post("/api/reports/generate", async (req, res) => {
    try {
      const { type, startDate, endDate, projectIds, format } = req.body;
      
      // This is a simplified report generation
      // In a real app, you'd generate actual reports with charts, etc.
      let tasks = await storage.getTasks();
      
      // Filter by date range
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        tasks = tasks.filter(task => 
          task.createdAt >= start && task.createdAt <= end
        );
      }
      
      // Filter by projects
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
      
      // Group tasks by project
      const projects = await storage.getProjects();
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

  // Team member routes
  app.get("/api/team-members", async (req, res) => {
    try {
      const teamMembers = await storage.getTeamMembers();
      res.json(teamMembers);
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}
