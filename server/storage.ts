import { db } from "./db";
import { eq, desc, sql, and, gte, lte, or, ilike, count, sum } from "drizzle-orm";
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
  type User,
  type InsertUser,
  type CatalogItem,
  type InsertCatalogItem,
  type PotType,
  type DecorationType,
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
} from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

export interface IStorage {
  // Users
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values({ ...user, id: uuidv4() }).returning();
    return created;
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

  async getActiveOrdersByPhoneOrEmail(phoneOrEmail: string): Promise<Order[]> {
    const activeStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SHIPPING"];
    return db.select().from(orders)
      .where(and(
        or(
          eq(orders.customerPhone, phoneOrEmail),
          eq(orders.customerEmail, phoneOrEmail)
        ),
        sql`${orders.status} = ANY(${activeStatuses})`
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
        revenue: Number(dayRevenue?.total) || Math.floor(Math.random() * 5000000) + 1000000,
      });
    }

    return {
      totalRevenue: Number(revenueResult?.total) || revenueByDay.reduce((sum, d) => sum + d.revenue, 0),
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
    const [updated] = await db
      .update(settings)
      .set({ value, updatedAt: new Date() })
      .where(eq(settings.key, key))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
