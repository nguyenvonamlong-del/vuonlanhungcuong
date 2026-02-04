import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== USERS ====================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  role: text("role").notNull().default("EMPLOYEE"), // ADMIN, MANAGER, EMPLOYEE
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ==================== CATALOG ITEMS ====================
export const catalogItems = pgTable("catalog_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  speciesNameVi: text("species_name_vi").notNull(),
  speciesNameEn: text("species_name_en").notNull(),
  color: text("color").notNull(),
  heightCm: integer("height_cm").notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 12, scale: 0 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  minOrderQuantity: integer("min_order_quantity").notNull().default(5),
  descriptionVi: text("description_vi"),
  descriptionEn: text("description_en"),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, INACTIVE, DISCONTINUED
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCatalogItemSchema = createInsertSchema(catalogItems).omit({
  id: true,
  createdAt: true,
});
export type InsertCatalogItem = z.infer<typeof insertCatalogItemSchema>;
export type CatalogItem = typeof catalogItems.$inferSelect;

// ==================== CUSTOMERS ====================
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  email: text("email"),
  customerType: text("customer_type").notNull().default("GUEST"), // GUEST, REGISTERED, VIP
  province: text("province"),
  district: text("district"),
  ward: text("ward"),
  streetAddress: text("street_address"),
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: decimal("total_spent", { precision: 15, scale: 0 }).notNull().default("0"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  totalOrders: true,
  totalSpent: true,
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// ==================== TECHNICIANS ====================
export const technicians = pgTable("technicians", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  specialization: text("specialization").array(),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, INACTIVE, ON_LEAVE
  currentWorkload: integer("current_workload").notNull().default(0),
  maxWorkload: integer("max_workload").notNull().default(5),
  performanceRating: decimal("performance_rating", { precision: 2, scale: 1 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTechnicianSchema = createInsertSchema(technicians).omit({
  id: true,
  createdAt: true,
  currentWorkload: true,
});
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type Technician = typeof technicians.$inferSelect;

// ==================== ORDERS ====================
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id),
  technicianId: varchar("technician_id").references(() => technicians.id),
  orderType: text("order_type").notNull().default("WEBSITE"), // WEBSITE, CHATBOT
  status: text("status").notNull().default("PENDING"), // PENDING, CONFIRMED, PREPARING, READY, SHIPPING, DELIVERED, CANCELLED
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  province: text("province").notNull(),
  district: text("district"),
  ward: text("ward").notNull(),
  streetAddress: text("street_address").notNull(),
  pots: jsonb("pots").notNull().$type<OrderPot[]>(),
  subtotal: decimal("subtotal", { precision: 15, scale: 0 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 12, scale: 0 }).notNull().default("0"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 0 }).notNull(),
  depositAmount: decimal("deposit_amount", { precision: 15, scale: 0 }).notNull(),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  remainingAmount: decimal("remaining_amount", { precision: 15, scale: 0 }).notNull(),
  remainingPaid: boolean("remaining_paid").notNull().default(false),
  trackingToken: varchar("tracking_token").notNull().unique(),
  notes: text("notes"),
  cancelReason: text("cancel_reason"),
  paymentProofUrl: text("payment_proof_url"),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 0 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order pot types
export interface OrderOrchid {
  catalogId: string;
  speciesName: string;
  color: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
}

export interface OrderPot {
  potId: string;
  potName: string;
  orchids: OrderOrchid[];
  potSubtotal: number;
}

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// ==================== PRE-MADE POTS ====================
export const premadePots = pgTable("premade_pots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameVi: text("name_vi").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionVi: text("description_vi"),
  descriptionEn: text("description_en"),
  price: decimal("price", { precision: 12, scale: 0 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  images: text("images").array(),
  orchidTypes: text("orchid_types").array(),
  potSize: text("pot_size").notNull().default("MEDIUM"), // SMALL, MEDIUM, LARGE, XLARGE
  heightCm: integer("height_cm"),
  difficultyLevel: text("difficulty_level").notNull().default("MEDIUM"), // EASY, MEDIUM, HARD
  careInstructionsVi: text("care_instructions_vi"),
  careInstructionsEn: text("care_instructions_en"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, INACTIVE, OUT_OF_STOCK
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPremadePotSchema = createInsertSchema(premadePots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPremadePot = z.infer<typeof insertPremadePotSchema>;
export type PremadePot = typeof premadePots.$inferSelect;

// ==================== SHIPPING TYPES ====================
export const shippingTypes = pgTable("shipping_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameVi: text("name_vi").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionVi: text("description_vi"),
  descriptionEn: text("description_en"),
  baseCost: decimal("base_cost", { precision: 12, scale: 0 }).notNull(),
  estimatedDays: integer("estimated_days").notNull(),
  status: text("status").notNull().default("ACTIVE"),
});

export const insertShippingTypeSchema = createInsertSchema(shippingTypes).omit({
  id: true,
});
export type InsertShippingType = z.infer<typeof insertShippingTypeSchema>;
export type ShippingType = typeof shippingTypes.$inferSelect;

// ==================== SETTINGS ====================
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// ==================== ACTIVITIES ====================
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // ORDER, CATALOG, CUSTOMER, TECHNICIAN
  entityId: varchar("entity_id"),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// ==================== VALIDATION SCHEMAS ====================
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
export type LoginData = z.infer<typeof loginSchema>;

export const checkoutCustomerSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().regex(/^0\d{9,10}$/, "Invalid Vietnamese phone number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  province: z.string().min(1, "Province is required"),
  district: z.string().optional().or(z.literal("")),
  ward: z.string().min(1, "Ward is required"),
  streetAddress: z.string().min(1, "Street address is required"),
});
export type CheckoutCustomerData = z.infer<typeof checkoutCustomerSchema>;

// Cart item for frontend
export interface CartItem {
  pot: PremadePot;
  quantity: number;
}

// Dashboard stats
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeTechnicians: number;
  lowStockItems: number;
  revenueByDay: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  recentOrders: Order[];
}
