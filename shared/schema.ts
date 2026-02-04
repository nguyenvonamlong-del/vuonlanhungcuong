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
  supplierId: varchar("supplier_id"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, INACTIVE, DISCONTINUED
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCatalogItemSchema = createInsertSchema(catalogItems).omit({
  id: true,
  createdAt: true,
});
export type InsertCatalogItem = z.infer<typeof insertCatalogItemSchema>;
export type CatalogItem = typeof catalogItems.$inferSelect;

// ==================== POT TYPES ====================
export const potTypes = pgTable("pot_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameVi: text("name_vi").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionVi: text("description_vi"),
  descriptionEn: text("description_en"),
  price: decimal("price", { precision: 12, scale: 0 }).notNull().default("0"),
  imageUrl: text("image_url"),
  supplierId: varchar("supplier_id"),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPotTypeSchema = createInsertSchema(potTypes).omit({
  id: true,
  createdAt: true,
});
export type InsertPotType = z.infer<typeof insertPotTypeSchema>;
export type PotType = typeof potTypes.$inferSelect;

// ==================== DECORATION TYPES ====================
export const decorationTypes = pgTable("decoration_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameVi: text("name_vi").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionVi: text("description_vi"),
  descriptionEn: text("description_en"),
  price: decimal("price", { precision: 12, scale: 0 }).notNull().default("0"),
  imageUrl: text("image_url"),
  supplierId: varchar("supplier_id"),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDecorationTypeSchema = createInsertSchema(decorationTypes).omit({
  id: true,
  createdAt: true,
});
export type InsertDecorationType = z.infer<typeof insertDecorationTypeSchema>;
export type DecorationType = typeof decorationTypes.$inferSelect;

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
  isBlocked: boolean("is_blocked").notNull().default(false),
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
  userId: varchar("user_id").references(() => users.id),
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
  priorityId: varchar("priority_id"),
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
  potTypeId?: string;
  potTypeName?: string;
  potTypePrice?: number;
  decorationTypeId?: string;
  decorationTypeName?: string;
  decorationTypePrice?: number;
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
// Orchid composition for premade pots
export interface PremadeOrchidItem {
  catalogItemId?: string;
  speciesNameVi: string;
  speciesNameEn: string;
  color: string;
  quantity: number;
}

// Decoration item for premade pots
export interface PremadeDecorationItem {
  decorationTypeId?: string;
  nameVi: string;
  nameEn: string;
}

export const premadePots = pgTable("premade_pots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameVi: text("name_vi").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionVi: text("description_vi"),
  descriptionEn: text("description_en"),
  price: decimal("price", { precision: 12, scale: 0 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  images: text("images").array(),
  // Enhanced orchid composition (JSON with type, quantity per type)
  orchidComposition: jsonb("orchid_composition").$type<PremadeOrchidItem[]>(),
  orchidTypes: text("orchid_types").array(), // Legacy - kept for backward compatibility
  // Pot type reference
  potTypeId: varchar("pot_type_id").references(() => potTypes.id),
  potTypeName: text("pot_type_name"),
  // Decoration items
  decorations: jsonb("decorations").$type<PremadeDecorationItem[]>(),
  // Dimensions (optional)
  lengthCm: integer("length_cm"),
  widthCm: integer("width_cm"),
  heightCm: integer("height_cm"),
  weightKg: decimal("weight_kg", { precision: 5, scale: 2 }),
  potSize: text("pot_size").notNull().default("MEDIUM"), // SMALL, MEDIUM, LARGE, XLARGE
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

// ==================== CHAT CONVERSATIONS ====================
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull().default("New Chat"),
  userType: text("user_type").notNull().default("CUSTOMER"), // CUSTOMER, ADMIN
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// ==================== CHAT MESSAGES ====================
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// ==================== PAYMENT TYPES ====================
export const paymentTypes = pgTable("payment_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameVi: text("name_vi").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionVi: text("description_vi"),
  descriptionEn: text("description_en"),
  type: text("type").notNull().default("BANK_TRANSFER"), // BANK_TRANSFER, CASH, MOMO, ZALO_PAY
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountName: text("account_name"),
  qrCodeUrl: text("qr_code_url"),
  instructions: text("instructions"),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentTypeSchema = createInsertSchema(paymentTypes).omit({
  id: true,
  createdAt: true,
});
export type InsertPaymentType = z.infer<typeof insertPaymentTypeSchema>;
export type PaymentType = typeof paymentTypes.$inferSelect;

// ==================== PRIORITY TYPES ====================
export const priorityTypes = pgTable("priority_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameVi: text("name_vi").notNull(),
  nameEn: text("name_en").notNull(),
  level: integer("level").notNull().default(1), // 1=Low, 2=Medium, 3=High, etc.
  color: text("color").notNull().default("#6B7280"), // Hex color for display
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPriorityTypeSchema = createInsertSchema(priorityTypes).omit({
  id: true,
  createdAt: true,
});
export type InsertPriorityType = z.infer<typeof insertPriorityTypeSchema>;
export type PriorityType = typeof priorityTypes.$inferSelect;

// ==================== NOTIFICATION CHANNELS ====================
export const notificationChannels = pgTable("notification_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameVi: text("name_vi").notNull(),
  nameEn: text("name_en").notNull(),
  type: text("type").notNull(), // EMAIL, SMS, VOICEMAIL, ZALO
  configJson: jsonb("config_json").$type<Record<string, string>>(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationChannelSchema = createInsertSchema(notificationChannels).omit({
  id: true,
  createdAt: true,
});
export type InsertNotificationChannel = z.infer<typeof insertNotificationChannelSchema>;
export type NotificationChannel = typeof notificationChannels.$inferSelect;

// ==================== SUPPLIERS ====================
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  address: text("address"),
  supplierType: text("supplier_type").notNull().default("ORCHID"), // ORCHID, POT, DECORATION, GENERAL
  rating: decimal("rating", { precision: 2, scale: 1 }),
  notes: text("notes"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, INACTIVE
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: decimal("total_spent", { precision: 15, scale: 0 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalOrders: true,
  totalSpent: true,
});
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// ==================== PURCHASE ORDERS ====================
export interface PurchaseOrderItem {
  itemType: "ORCHID" | "POT" | "DECORATION" | "OTHER";
  itemId?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  status: text("status").notNull().default("PENDING"), // PENDING, CONFIRMED, SHIPPED, RECEIVED, CANCELLED
  items: jsonb("items").notNull().$type<PurchaseOrderItem[]>(),
  subtotal: decimal("subtotal", { precision: 15, scale: 0 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 12, scale: 0 }).notNull().default("0"),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 0 }).notNull().default("0"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 0 }).notNull(),
  paymentStatus: text("payment_status").notNull().default("UNPAID"), // UNPAID, PARTIAL, PAID
  paidAmount: decimal("paid_amount", { precision: 15, scale: 0 }).notNull().default("0"),
  notes: text("notes"),
  expectedDelivery: timestamp("expected_delivery"),
  receivedAt: timestamp("received_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  receivedAt: true,
});
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

// ==================== NOTIFICATIONS ====================
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // ORDER_CREATED, ORDER_UPDATED, PAYMENT_RECEIVED, LOW_STOCK, SUPPLIER_DELIVERY, SYSTEM
  recipientType: text("recipient_type").notNull(), // ADMIN, CUSTOMER, SUPPLIER
  recipientId: varchar("recipient_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  channel: text("channel").notNull().default("SYSTEM"), // SYSTEM, EMAIL, SMS, ZALO
  status: text("status").notNull().default("PENDING"), // PENDING, SENT, FAILED, READ
  relatedEntity: text("related_entity"),
  relatedEntityId: varchar("related_entity_id"),
  metadata: jsonb("metadata"),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  readAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

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
