import { pgTable, text, serial, integer, boolean, timestamp, jsonb, primaryKey, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// New Clients table - top level entity
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  logo: text("logo"), // Logo URL or path
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  status: text("status").notNull().default("active"), // active, inactive, archived
  tags: text("tags").array(), // Client tags
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  clientId: integer("client_id").references(() => clients.id), // Can be null for unassigned projects
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

// Teams table for team management
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").default("#3B82F6"), // Team color for visual identification
  icon: text("icon").default("Users"), // Lucide icon name
  leaderId: integer("leader_id"), // Team leader (references team_members)
  department: text("department"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatar: text("avatar"),
  role: text("role").notNull().default("member"), // admin, manager, member
  department: text("department"),
  teamId: integer("team_id").references(() => teams.id), // Reference to teams table
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

// User client permissions table - now permissions are at client level
export const userClientPermissions = pgTable("user_client_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  canView: boolean("can_view").default(true).notNull(),
  canEdit: boolean("can_edit").default(false).notNull(),
  canDelete: boolean("can_delete").default(false).notNull(),
  canManage: boolean("can_manage").default(false).notNull(), // Can assign tasks, manage team members
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Money Tracking Tables
export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  personName: varchar("person_name", { length: 255 }).notNull(),
  personEmail: varchar("person_email", { length: 255 }),
  personPhone: varchar("person_phone", { length: 20 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0.00").notNull(),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(), // USD, INR, EUR, GBP, etc.
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, partially_paid, fully_paid
  notes: text("notes"),
  icon: varchar("icon", { length: 30 }).default("user").notNull(), // user, male, female, business, family, etc.
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

export const loanPayments = pgTable("loan_payments", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").references(() => loans.id, { onDelete: "cascade" }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  paymentType: varchar("payment_type", { length: 20 }).notNull().default("settle"), // 'pay' or 'settle'
  notes: text("notes"),
  paymentMethod: varchar("payment_method", { length: 50 }), // cash, bank_transfer, check, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

// Product Registration Tables
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'electronics', 'vehicles', 'jewellery', 'gadgets'
  purchaseDate: timestamp("purchase_date").notNull(),
  registrationDate: timestamp("registration_date"),
  warrantyYears: integer("warranty_years"),
  warrantyExpiryDate: timestamp("warranty_expiry_date"),
  totalCost: decimal("total_cost", { precision: 15, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: integer("user_id").notNull().references(() => users.id),
});

// Electronics specific fields
export const electronics = pgTable("electronics", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 100 }).notNull(), // AC, TV, Refrigerator, Washing Machine, etc.
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 255 }),
  serialNumber: varchar("serial_number", { length: 255 }),
});

// Vehicles (Cars/Bikes) specific fields
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  vehicleType: varchar("vehicle_type", { length: 50 }).notNull(), // car, bike, scooter
  model: varchar("model", { length: 255 }).notNull(),
  registrationNumber: varchar("registration_number", { length: 50 }),
  color: varchar("color", { length: 50 }),
  bodyType: varchar("body_type", { length: 50 }), // SUV, Sedan, Hatchback for cars; Sport, Cruiser for bikes
  manufacturer: varchar("manufacturer", { length: 100 }),
});

// Jewellery specific fields
export const jewellery = pgTable("jewellery", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 50 }).notNull(), // Gold, Silver, Platinum, Diamond
  model: varchar("model", { length: 255 }),
  ratePerUnit: decimal("rate_per_unit", { precision: 15, scale: 2 }), // rate on purchase day
  cgst: decimal("cgst", { precision: 15, scale: 2 }),
  igst: decimal("igst", { precision: 15, scale: 2 }),
  vat: decimal("vat", { precision: 15, scale: 2 }),
  totalWeight: decimal("total_weight", { precision: 10, scale: 3 }), // in grams
  stoneWeight: decimal("stone_weight", { precision: 10, scale: 3 }),
  stoneCost: decimal("stone_cost", { precision: 15, scale: 2 }),
  diamondWeight: decimal("diamond_weight", { precision: 10, scale: 3 }),
  diamondCost: decimal("diamond_cost", { precision: 15, scale: 2 }),
});

// Gadgets (Mobile, Laptop, Watches) specific fields  
export const gadgets = pgTable("gadgets", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  gadgetType: varchar("gadget_type", { length: 50 }).notNull(), // mobile, laptop, watch
  manufacturer: varchar("manufacturer", { length: 100 }),
  modelName: varchar("model_name", { length: 255 }),
  serialNumber: varchar("serial_number", { length: 255 }),
  imei: varchar("imei", { length: 50 }), // for mobile phones
  specifications: text("specifications"), // JSON string for flexible specs
});

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertUserClientPermissionSchema = createInsertSchema(userClientPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoanSchema = createInsertSchema(loans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  remainingAmount: true,
  amountPaid: true,
}).extend({
  dueDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val) => {
    if (!val) return null;
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
});

export const insertLoanPaymentSchema = createInsertSchema(loanPayments).omit({
  id: true,
  createdAt: true,
}).extend({
  paymentDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return new Date();
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
});

// Product schemas
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  warrantyExpiryDate: true,
}).extend({
  purchaseDate: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  registrationDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val) => {
    if (!val) return null;
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
});

export const insertElectronicsSchema = createInsertSchema(electronics).omit({
  id: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
});

export const insertJewellerySchema = createInsertSchema(jewellery).omit({
  id: true,
});

export const insertGadgetSchema = createInsertSchema(gadgets).omit({
  id: true,
});

// Update schemas with proper date handling
export const updateTaskSchema = insertTaskSchema.partial();
export const updateProjectSchema = insertProjectSchema.partial().extend({
  clientId: z.number().nullable().optional(), // Allow null for unassigning projects
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

export const updateClientSchema = insertClientSchema.partial();
export const updateApplicationSchema = insertApplicationSchema.partial();
export const updateTeamSchema = insertTeamSchema.partial();
export const updateTeamMemberSchema = insertTeamMemberSchema.partial();
export const updateActivitySchema = insertActivitySchema.partial();
export const updateCommentSchema = insertCommentSchema.partial();
export const updateNotificationSchema = insertNotificationSchema.partial();
export const updateTimeEntrySchema = insertTimeEntrySchema.partial();
export const updateUserSchema = insertUserSchema.partial();
export const updateUserClientPermissionSchema = insertUserClientPermissionSchema.partial();
export const updateLoanSchema = insertLoanSchema.partial();
export const updateLoanPaymentSchema = insertLoanPaymentSchema.partial();
export const updateProductSchema = insertProductSchema.partial();
export const updateElectronicsSchema = insertElectronicsSchema.partial();
export const updateVehicleSchema = insertVehicleSchema.partial();
export const updateJewellerySchema = insertJewellerySchema.partial();
export const updateGadgetSchema = insertGadgetSchema.partial();

// Types
export type Client = typeof clients.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type ProjectApplication = typeof projectApplications.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type UserClientPermission = typeof userClientPermissions.$inferSelect;
export type Loan = typeof loans.$inferSelect;
export type LoanPayment = typeof loanPayments.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Electronics = typeof electronics.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Jewellery = typeof jewellery.$inferSelect;
export type Gadget = typeof gadgets.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertProjectApplication = z.infer<typeof insertProjectApplicationSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertUserClientPermission = z.infer<typeof insertUserClientPermissionSchema>;
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type InsertLoanPayment = z.infer<typeof insertLoanPaymentSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertElectronics = z.infer<typeof insertElectronicsSchema>;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type InsertJewellery = z.infer<typeof insertJewellerySchema>;
export type InsertGadget = z.infer<typeof insertGadgetSchema>;

export type UpdateClient = z.infer<typeof updateClientSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type UpdateApplication = z.infer<typeof updateApplicationSchema>;
export type UpdateTeam = z.infer<typeof updateTeamSchema>;
export type UpdateTeamMember = z.infer<typeof updateTeamMemberSchema>;
export type UpdateActivity = z.infer<typeof updateActivitySchema>;
export type UpdateComment = z.infer<typeof updateCommentSchema>;
export type UpdateNotification = z.infer<typeof updateNotificationSchema>;
export type UpdateTimeEntry = z.infer<typeof updateTimeEntrySchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpdateUserClientPermission = z.infer<typeof updateUserClientPermissionSchema>;
export type UpdateLoan = z.infer<typeof updateLoanSchema>;
export type UpdateLoanPayment = z.infer<typeof updateLoanPaymentSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type UpdateElectronics = z.infer<typeof updateElectronicsSchema>;
export type UpdateVehicle = z.infer<typeof updateVehicleSchema>;
export type UpdateJewellery = z.infer<typeof updateJewellerySchema>;
export type UpdateGadget = z.infer<typeof updateGadgetSchema>;
