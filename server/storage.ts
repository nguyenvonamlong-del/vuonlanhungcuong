import { db } from "./db";
import { eq, desc, sql, and, gte, lte, or, ilike, count, sum, inArray } from "drizzle-orm";
import {
  users,
  catalogItems,
  potTypes,
  decorationTypes,
  premadePots,
  customers,
  technicians,
  orders,
  shippingTypes,
  activities,
  settings,
  paymentTypes,
  suppliers,
  purchaseOrders,
  notifications,
  priorityTypes,
  notificationChannels,
  payments,
  inventoryItems,
  inventoryTransactions,
  outboundShipments,
  inboundShipments,
  type User,
  type InsertUser,
  type CatalogItem,
  type InsertCatalogItem,
  type PotType,
  type InsertPotType,
  type DecorationType,
  type InsertDecorationType,
  type PremadePot,
  type InsertPremadePot,
  type Customer,
  type InsertCustomer,
  type Technician,
  type InsertTechnician,
  type Order,
  type InsertOrder,
  type ShippingType,
  type InsertShippingType,
  type Activity,
  type InsertActivity,
  type Settings,
  type DashboardStats,
  type PaymentType,
  type InsertPaymentType,
  type Supplier,
  type InsertSupplier,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type Notification,
  type InsertNotification,
  type PriorityType,
  type InsertPriorityType,
  type NotificationChannel,
  type InsertNotificationChannel,
  type Payment,
  type InsertPayment,
  type InventoryItem,
  type InsertInventoryItem,
  type InventoryTransaction,
  type InsertInventoryTransaction,
  type OutboundShipment,
  type InsertOutboundShipment,
  type InboundShipment,
  type InsertInboundShipment,
  testimonials,
  type Testimonial,
} from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Catalog
  getCatalogItems(): Promise<CatalogItem[]>;
  getCatalogItemById(id: string): Promise<CatalogItem | undefined>;
  createCatalogItem(item: InsertCatalogItem): Promise<CatalogItem>;
  updateCatalogItem(id: string, item: Partial<InsertCatalogItem>): Promise<CatalogItem | undefined>;
  deleteCatalogItem(id: string): Promise<boolean>;
  
  // Pot Types
  getPotTypes(): Promise<PotType[]>;
  
  // Decoration Types
  getDecorationTypes(): Promise<DecorationType[]>;
  
  // Premade Pots
  getPremadePots(): Promise<PremadePot[]>;
  getActivePremadePots(): Promise<PremadePot[]>;
  getPremadePotById(id: string): Promise<PremadePot | undefined>;
  createPremadePot(pot: InsertPremadePot): Promise<PremadePot>;
  updatePremadePot(id: string, pot: Partial<InsertPremadePot>): Promise<PremadePot | undefined>;
  deletePremadePot(id: string): Promise<boolean>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  
  // Technicians
  getTechnicians(): Promise<Technician[]>;
  getAvailableTechnicians(): Promise<Technician[]>;
  getTechnicianById(id: string): Promise<Technician | undefined>;
  createTechnician(tech: InsertTechnician): Promise<Technician>;
  updateTechnician(id: string, tech: Partial<InsertTechnician>): Promise<Technician | undefined>;
  deleteTechnician(id: string): Promise<boolean>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  getOrderByTrackingToken(token: string): Promise<Order | undefined>;
  getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  
  // Shipping Types
  getShippingTypes(): Promise<ShippingType[]>;
  createShippingType(type: InsertShippingType): Promise<ShippingType>;
  
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
  
  // Activities
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Settings
  getSetting(key: string): Promise<Settings | undefined>;
  getAllSettings(): Promise<Settings[]>;
  updateSetting(key: string, value: string): Promise<Settings | undefined>;
  
  // Utility
  generateOrderNumber(): Promise<string>;
  generateTrackingToken(): Promise<string>;
  generatePurchaseOrderNumber(): Promise<string>;
  
  // Pot Types (CRUD)
  createPotType(potType: InsertPotType): Promise<PotType>;
  updatePotType(id: string, potType: Partial<InsertPotType>): Promise<PotType | undefined>;
  deletePotType(id: string): Promise<boolean>;
  
  // Decoration Types (CRUD)
  createDecorationType(decorationType: InsertDecorationType): Promise<DecorationType>;
  updateDecorationType(id: string, decorationType: Partial<InsertDecorationType>): Promise<DecorationType | undefined>;
  deleteDecorationType(id: string): Promise<boolean>;
  
  // Payment Types
  getPaymentTypes(): Promise<PaymentType[]>;
  getPaymentTypeById(id: string): Promise<PaymentType | undefined>;
  createPaymentType(paymentType: InsertPaymentType): Promise<PaymentType>;
  updatePaymentType(id: string, paymentType: Partial<InsertPaymentType>): Promise<PaymentType | undefined>;
  deletePaymentType(id: string): Promise<boolean>;
  
  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplierById(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;
  
  // Purchase Orders
  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrderById(id: string): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: string, order: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder | undefined>;
  
  // Notifications
  getNotifications(recipientType?: string, recipientId?: string): Promise<Notification[]>;
  getNotificationById(id: string): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: string, notification: Partial<InsertNotification>): Promise<Notification | undefined>;
  markNotificationRead(id: string): Promise<Notification | undefined>;
  deleteNotification(id: string): Promise<void>;
  
  // Priority Types
  getPriorityTypes(): Promise<PriorityType[]>;
  getPriorityTypeById(id: string): Promise<PriorityType | undefined>;
  createPriorityType(priority: InsertPriorityType): Promise<PriorityType>;
  updatePriorityType(id: string, priority: Partial<InsertPriorityType>): Promise<PriorityType | undefined>;
  deletePriorityType(id: string): Promise<void>;
  
  // Notification Channels
  getNotificationChannels(): Promise<NotificationChannel[]>;
  getNotificationChannelById(id: string): Promise<NotificationChannel | undefined>;
  createNotificationChannel(channel: InsertNotificationChannel): Promise<NotificationChannel>;
  updateNotificationChannel(id: string, channel: Partial<InsertNotificationChannel>): Promise<NotificationChannel | undefined>;
  deleteNotificationChannel(id: string): Promise<void>;

  // Payments
  getPaymentsByOrderId(orderId: string): Promise<Payment[]>;
  getPaymentById(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined>;

  // Inventory Items
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemByTypeAndId(itemType: string, itemId: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;

  // Inventory Transactions
  getInventoryTransactions(itemType?: string, itemId?: string): Promise<InventoryTransaction[]>;
  createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction>;

  // Outbound Shipments
  getOutboundShipments(): Promise<OutboundShipment[]>;
  getOutboundShipmentsByOrderId(orderId: string): Promise<OutboundShipment[]>;
  getOutboundShipmentById(id: string): Promise<OutboundShipment | undefined>;
  createOutboundShipment(shipment: InsertOutboundShipment): Promise<OutboundShipment>;
  updateOutboundShipment(id: string, shipment: Partial<InsertOutboundShipment>): Promise<OutboundShipment | undefined>;

  // Inbound Shipments
  getInboundShipments(): Promise<InboundShipment[]>;
  getInboundShipmentsByPurchaseOrderId(purchaseOrderId: string): Promise<InboundShipment[]>;
  getInboundShipmentById(id: string): Promise<InboundShipment | undefined>;
  createInboundShipment(shipment: InsertInboundShipment): Promise<InboundShipment>;
  updateInboundShipment(id: string, shipment: Partial<InsertInboundShipment>): Promise<InboundShipment | undefined>;

  // Testimonials
  getShowcasedTestimonials(): Promise<Testimonial[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`LOWER(${users.username}) = LOWER(${username})`);
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values({ ...user, id: uuidv4() }).returning();
    return created;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  }

  // Catalog
  async getCatalogItems(): Promise<CatalogItem[]> {
    return db.select().from(catalogItems).orderBy(desc(catalogItems.createdAt));
  }

  async getCatalogItemById(id: string): Promise<CatalogItem | undefined> {
    const [item] = await db.select().from(catalogItems).where(eq(catalogItems.id, id));
    return item;
  }

  async createCatalogItem(item: InsertCatalogItem): Promise<CatalogItem> {
    const [created] = await db.insert(catalogItems).values({ ...item, id: uuidv4() }).returning();
    return created;
  }

  async updateCatalogItem(id: string, item: Partial<InsertCatalogItem>): Promise<CatalogItem | undefined> {
    const [updated] = await db.update(catalogItems).set(item).where(eq(catalogItems.id, id)).returning();
    return updated;
  }

  async deleteCatalogItem(id: string): Promise<boolean> {
    const result = await db.delete(catalogItems).where(eq(catalogItems.id, id));
    return true;
  }

  // Pot Types
  async getPotTypes(): Promise<PotType[]> {
    return db.select().from(potTypes).where(eq(potTypes.status, "ACTIVE"));
  }

  // Decoration Types
  async getDecorationTypes(): Promise<DecorationType[]> {
    return db.select().from(decorationTypes).where(eq(decorationTypes.status, "ACTIVE"));
  }

  // Premade Pots
  async getPremadePots(): Promise<PremadePot[]> {
    return db.select().from(premadePots).orderBy(desc(premadePots.createdAt));
  }

  async getActivePremadePots(): Promise<PremadePot[]> {
    return db.select().from(premadePots)
      .where(eq(premadePots.status, "ACTIVE"))
      .orderBy(desc(premadePots.featured), desc(premadePots.createdAt));
  }

  async getPremadePotById(id: string): Promise<PremadePot | undefined> {
    const [pot] = await db.select().from(premadePots).where(eq(premadePots.id, id));
    return pot;
  }

  async createPremadePot(pot: InsertPremadePot): Promise<PremadePot> {
    const [created] = await db.insert(premadePots).values({ ...pot, id: uuidv4() }).returning();
    return created;
  }

  async updatePremadePot(id: string, pot: Partial<InsertPremadePot>): Promise<PremadePot | undefined> {
    const [updated] = await db.update(premadePots).set(pot).where(eq(premadePots.id, id)).returning();
    return updated;
  }

  async deletePremadePot(id: string): Promise<boolean> {
    await db.delete(premadePots).where(eq(premadePots.id, id));
    return true;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phoneNumber, phone));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values({ ...customer, id: uuidv4() }).returning();
    return created;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return updated;
  }

  // Technicians
  async getTechnicians(): Promise<Technician[]> {
    return db.select().from(technicians).orderBy(desc(technicians.createdAt));
  }

  async getAvailableTechnicians(): Promise<Technician[]> {
    return db.select().from(technicians)
      .where(and(
        eq(technicians.status, "ACTIVE"),
        sql`${technicians.currentWorkload} < ${technicians.maxWorkload}`
      ));
  }

  async getTechnicianById(id: string): Promise<Technician | undefined> {
    const [tech] = await db.select().from(technicians).where(eq(technicians.id, id));
    return tech;
  }

  async createTechnician(tech: InsertTechnician): Promise<Technician> {
    const [created] = await db.insert(technicians).values({ ...tech, id: uuidv4() }).returning();
    return created;
  }

  async updateTechnician(id: string, tech: Partial<InsertTechnician>): Promise<Technician | undefined> {
    const [updated] = await db.update(technicians).set(tech).where(eq(technicians.id, id)).returning();
    return updated;
  }

  async deleteTechnician(id: string): Promise<boolean> {
    await db.delete(technicians).where(eq(technicians.id, id));
    return true;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByTrackingToken(token: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.trackingToken, token));
    return order;
  }

  async getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async getActiveOrdersByPhoneOrEmail(phoneOrEmail: string): Promise<Order[]> {
    const activeStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SHIPPING"] as const;
    return db.select().from(orders)
      .where(and(
        or(
          eq(orders.customerPhone, phoneOrEmail),
          eq(orders.customerEmail, phoneOrEmail)
        ),
        inArray(orders.status, [...activeStatuses])
      ))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const orderNumber = await this.generateOrderNumber();
    const trackingToken = await this.generateTrackingToken();
    const [created] = await db.insert(orders).values({
      ...order,
      id: uuidv4(),
      orderNumber,
      trackingToken,
    }).returning();
    return created;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set(order).where(eq(orders.id, id)).returning();
    return updated;
  }

  // Shipping Types
  async getShippingTypes(): Promise<ShippingType[]> {
    return db.select().from(shippingTypes).where(eq(shippingTypes.status, "ACTIVE"));
  }

  async createShippingType(type: InsertShippingType): Promise<ShippingType> {
    const [created] = await db.insert(shippingTypes).values({ ...type, id: uuidv4() }).returning();
    return created;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [revenueResult] = await db.select({ total: sum(orders.totalAmount) }).from(orders)
      .where(and(
        eq(orders.remainingPaid, true),
        gte(orders.createdAt, sevenDaysAgo)
      ));

    const [ordersCount] = await db.select({ count: count() }).from(orders);
    
    const [techCount] = await db.select({ count: count() }).from(technicians)
      .where(eq(technicians.status, "ACTIVE"));
    
    const [lowStock] = await db.select({ count: count() }).from(catalogItems)
      .where(sql`${catalogItems.stockQuantity} < 50`);

    const recentOrdersList = await db.select().from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5);

    const orderStatusCounts = await db.select({
      status: orders.status,
      count: count(),
    }).from(orders).groupBy(orders.status);

    const revenueByDay: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const [dayRevenue] = await db.select({ total: sum(orders.totalAmount) }).from(orders)
        .where(and(
          gte(orders.createdAt, dayStart),
          lte(orders.createdAt, dayEnd),
          eq(orders.remainingPaid, true)
        ));
      
      revenueByDay.push({
        date: dateStr,
        revenue: Number(dayRevenue?.total) || 0,
      });
    }

    return {
      totalRevenue: Number(revenueResult?.total) || 0,
      totalOrders: ordersCount?.count || 0,
      activeTechnicians: techCount?.count || 0,
      lowStockItems: lowStock?.count || 0,
      recentOrders: recentOrdersList,
      ordersByStatus: orderStatusCounts.map((s) => ({ status: s.status, count: Number(s.count) })),
      revenueByDay,
    };
  }

  // Activities
  async getActivities(limit = 20): Promise<Activity[]> {
    return db.select().from(activities).orderBy(desc(activities.createdAt)).limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [created] = await db.insert(activities).values({ ...activity, id: uuidv4() }).returning();
    return created;
  }

  // Utility
  async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = `ORD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const [result] = await db.select({ count: count() }).from(orders)
      .where(sql`${orders.orderNumber} LIKE ${prefix + "%"}`);
    const num = (result?.count || 0) + 1;
    return `${prefix}${String(num).padStart(4, "0")}`;
  }

  async generateTrackingToken(): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < 8; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // Settings
  async getSetting(key: string): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async getAllSettings(): Promise<Settings[]> {
    return db.select().from(settings);
  }

  async updateSetting(key: string, value: string): Promise<Settings | undefined> {
    // First try to update
    const [updated] = await db
      .update(settings)
      .set({ value, updatedAt: new Date() })
      .where(eq(settings.key, key))
      .returning();
    
    // If no rows were updated, insert a new setting
    if (!updated) {
      const [created] = await db
        .insert(settings)
        .values({ id: uuidv4(), key, value })
        .returning();
      return created;
    }
    
    return updated;
  }
  
  // Pot Types CRUD
  async createPotType(potType: InsertPotType): Promise<PotType> {
    const [created] = await db.insert(potTypes).values({ ...potType, id: uuidv4() }).returning();
    return created;
  }

  async updatePotType(id: string, potType: Partial<InsertPotType>): Promise<PotType | undefined> {
    const [updated] = await db.update(potTypes).set(potType).where(eq(potTypes.id, id)).returning();
    return updated;
  }

  async deletePotType(id: string): Promise<boolean> {
    await db.delete(potTypes).where(eq(potTypes.id, id));
    return true;
  }

  // Decoration Types CRUD
  async createDecorationType(decorationType: InsertDecorationType): Promise<DecorationType> {
    const [created] = await db.insert(decorationTypes).values({ ...decorationType, id: uuidv4() }).returning();
    return created;
  }

  async updateDecorationType(id: string, decorationType: Partial<InsertDecorationType>): Promise<DecorationType | undefined> {
    const [updated] = await db.update(decorationTypes).set(decorationType).where(eq(decorationTypes.id, id)).returning();
    return updated;
  }

  async deleteDecorationType(id: string): Promise<boolean> {
    await db.delete(decorationTypes).where(eq(decorationTypes.id, id));
    return true;
  }

  // Payment Types
  async getPaymentTypes(): Promise<PaymentType[]> {
    return db.select().from(paymentTypes).orderBy(desc(paymentTypes.createdAt));
  }

  async getPaymentTypeById(id: string): Promise<PaymentType | undefined> {
    const [paymentType] = await db.select().from(paymentTypes).where(eq(paymentTypes.id, id));
    return paymentType;
  }

  async createPaymentType(paymentType: InsertPaymentType): Promise<PaymentType> {
    const [created] = await db.insert(paymentTypes).values({ ...paymentType, id: uuidv4() }).returning();
    return created;
  }

  async updatePaymentType(id: string, paymentType: Partial<InsertPaymentType>): Promise<PaymentType | undefined> {
    const [updated] = await db.update(paymentTypes).set(paymentType).where(eq(paymentTypes.id, id)).returning();
    return updated;
  }

  async deletePaymentType(id: string): Promise<boolean> {
    await db.delete(paymentTypes).where(eq(paymentTypes.id, id));
    return true;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async getSupplierById(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [created] = await db.insert(suppliers).values({ ...supplier, id: uuidv4() }).returning();
    return created;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updated] = await db.update(suppliers).set({ ...supplier, updatedAt: new Date() }).where(eq(suppliers.id, id)).returning();
    return updated;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
    return true;
  }

  // Purchase Orders
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder | undefined> {
    const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return order;
  }

  async createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const [created] = await db.insert(purchaseOrders).values({ ...order, id: uuidv4() }).returning();
    return created;
  }

  async updatePurchaseOrder(id: string, order: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder | undefined> {
    const [updated] = await db.update(purchaseOrders).set({ ...order, updatedAt: new Date() }).where(eq(purchaseOrders.id, id)).returning();
    return updated;
  }

  async generatePurchaseOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = `PO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const [result] = await db.select({ count: count() }).from(purchaseOrders)
      .where(sql`${purchaseOrders.orderNumber} LIKE ${prefix + "%"}`);
    const num = (result?.count || 0) + 1;
    return `${prefix}${String(num).padStart(4, "0")}`;
  }

  // Notifications
  async getNotifications(recipientType?: string, recipientId?: string): Promise<Notification[]> {
    if (recipientType && recipientId) {
      return db.select().from(notifications)
        .where(and(eq(notifications.recipientType, recipientType), eq(notifications.recipientId, recipientId)))
        .orderBy(desc(notifications.createdAt));
    }
    if (recipientType) {
      return db.select().from(notifications)
        .where(eq(notifications.recipientType, recipientType))
        .orderBy(desc(notifications.createdAt));
    }
    return db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async getNotificationById(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values({ ...notification, id: uuidv4() }).returning();
    return created;
  }

  async updateNotification(id: string, notification: Partial<InsertNotification>): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications).set(notification).where(eq(notifications.id, id)).returning();
    return updated;
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications)
      .set({ status: "READ", readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Priority Types
  async getPriorityTypes(): Promise<PriorityType[]> {
    return db.select().from(priorityTypes).orderBy(priorityTypes.level);
  }

  async getPriorityTypeById(id: string): Promise<PriorityType | undefined> {
    const [priority] = await db.select().from(priorityTypes).where(eq(priorityTypes.id, id));
    return priority;
  }

  async createPriorityType(priority: InsertPriorityType): Promise<PriorityType> {
    const [created] = await db.insert(priorityTypes).values({ ...priority, id: uuidv4() }).returning();
    return created;
  }

  async updatePriorityType(id: string, priority: Partial<InsertPriorityType>): Promise<PriorityType | undefined> {
    const [updated] = await db.update(priorityTypes).set(priority).where(eq(priorityTypes.id, id)).returning();
    return updated;
  }

  async deletePriorityType(id: string): Promise<void> {
    await db.delete(priorityTypes).where(eq(priorityTypes.id, id));
  }

  // Notification Channels
  async getNotificationChannels(): Promise<NotificationChannel[]> {
    return db.select().from(notificationChannels).orderBy(notificationChannels.createdAt);
  }

  async getNotificationChannelById(id: string): Promise<NotificationChannel | undefined> {
    const [channel] = await db.select().from(notificationChannels).where(eq(notificationChannels.id, id));
    return channel;
  }

  async createNotificationChannel(channel: InsertNotificationChannel): Promise<NotificationChannel> {
    const [created] = await db.insert(notificationChannels).values({ ...channel, id: uuidv4() }).returning();
    return created;
  }

  async updateNotificationChannel(id: string, channel: Partial<InsertNotificationChannel>): Promise<NotificationChannel | undefined> {
    const [updated] = await db.update(notificationChannels).set(channel).where(eq(notificationChannels.id, id)).returning();
    return updated;
  }

  async deleteNotificationChannel(id: string): Promise<void> {
    await db.delete(notificationChannels).where(eq(notificationChannels.id, id));
  }

  // Payments
  async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.orderId, orderId)).orderBy(desc(payments.createdAt));
  }

  async getPaymentById(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values({ ...payment, id: uuidv4() }).returning();
    return created;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updated] = await db.update(payments).set(payment).where(eq(payments.id, id)).returning();
    return updated;
  }

  // Inventory Items
  async getInventoryItems(): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems).orderBy(desc(inventoryItems.createdAt));
  }

  async getInventoryItemByTypeAndId(itemType: string, itemId: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(and(eq(inventoryItems.itemType, itemType), eq(inventoryItems.itemId, itemId)));
    return item;
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [created] = await db.insert(inventoryItems).values({ ...item, id: uuidv4() }).returning();
    return created;
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [updated] = await db.update(inventoryItems).set({ ...item, updatedAt: new Date() }).where(eq(inventoryItems.id, id)).returning();
    return updated;
  }

  // Inventory Transactions
  async getInventoryTransactions(itemType?: string, itemId?: string): Promise<InventoryTransaction[]> {
    if (itemType && itemId) {
      return db.select().from(inventoryTransactions)
        .where(and(eq(inventoryTransactions.itemType, itemType), eq(inventoryTransactions.itemId, itemId)))
        .orderBy(desc(inventoryTransactions.createdAt));
    }
    return db.select().from(inventoryTransactions).orderBy(desc(inventoryTransactions.createdAt));
  }

  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const [created] = await db.insert(inventoryTransactions).values({ ...transaction, id: uuidv4() }).returning();
    return created;
  }

  // Outbound Shipments
  async getOutboundShipments(): Promise<OutboundShipment[]> {
    return db.select().from(outboundShipments).orderBy(desc(outboundShipments.createdAt));
  }

  async getOutboundShipmentsByOrderId(orderId: string): Promise<OutboundShipment[]> {
    return db.select().from(outboundShipments).where(eq(outboundShipments.orderId, orderId)).orderBy(desc(outboundShipments.createdAt));
  }

  async getOutboundShipmentById(id: string): Promise<OutboundShipment | undefined> {
    const [shipment] = await db.select().from(outboundShipments).where(eq(outboundShipments.id, id));
    return shipment;
  }

  async createOutboundShipment(shipment: InsertOutboundShipment): Promise<OutboundShipment> {
    const [created] = await db.insert(outboundShipments).values({ ...shipment, id: uuidv4() }).returning();
    return created;
  }

  async updateOutboundShipment(id: string, shipment: Partial<InsertOutboundShipment>): Promise<OutboundShipment | undefined> {
    const [updated] = await db.update(outboundShipments).set({ ...shipment, updatedAt: new Date() }).where(eq(outboundShipments.id, id)).returning();
    return updated;
  }

  // Inbound Shipments
  async getInboundShipments(): Promise<InboundShipment[]> {
    return db.select().from(inboundShipments).orderBy(desc(inboundShipments.createdAt));
  }

  async getInboundShipmentsByPurchaseOrderId(purchaseOrderId: string): Promise<InboundShipment[]> {
    return db.select().from(inboundShipments).where(eq(inboundShipments.purchaseOrderId, purchaseOrderId)).orderBy(desc(inboundShipments.createdAt));
  }

  async getInboundShipmentById(id: string): Promise<InboundShipment | undefined> {
    const [shipment] = await db.select().from(inboundShipments).where(eq(inboundShipments.id, id));
    return shipment;
  }

  async createInboundShipment(shipment: InsertInboundShipment): Promise<InboundShipment> {
    const [created] = await db.insert(inboundShipments).values({ ...shipment, id: uuidv4() }).returning();
    return created;
  }

  async updateInboundShipment(id: string, shipment: Partial<InsertInboundShipment>): Promise<InboundShipment | undefined> {
    const [updated] = await db.update(inboundShipments).set({ ...shipment, updatedAt: new Date() }).where(eq(inboundShipments.id, id)).returning();
    return updated;
  }

  async getShowcasedTestimonials(): Promise<Testimonial[]> {
    return db.select().from(testimonials).where(eq(testimonials.isShowcased, true));
  }
}

export const storage = new DatabaseStorage();
